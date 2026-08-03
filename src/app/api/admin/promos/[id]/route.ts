import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { handlePrismaError } from '@/lib/prisma-error';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { code, description, type, value, minOrder, maxUses, isActive, startsAt, endsAt } = body;

    const updateData: Record<string, unknown> = {};
    if (code !== undefined) {
      if (typeof code !== 'string' || code.trim().length === 0) {
        return NextResponse.json({ error: 'Promo code cannot be empty' }, { status: 400 });
      }
      updateData.code = code.trim().toUpperCase();
    }
    if (description !== undefined) updateData.description = description || null;
    if (type !== undefined) {
      if (!['percentage', 'fixed'].includes(type)) {
        return NextResponse.json({ error: 'Type must be "percentage" or "fixed"' }, { status: 400 });
      }
      updateData.type = type;
    }
    if (value !== undefined) {
      const parsedValue = parseFloat(value);
      if (isNaN(parsedValue) || parsedValue <= 0) {
        return NextResponse.json({ error: 'Value must be a positive number' }, { status: 400 });
      }
      updateData.value = parsedValue;
    }
    if (minOrder !== undefined) updateData.minOrder = parseFloat(minOrder) || 0;
    if (maxUses !== undefined) updateData.maxUses = parseInt(maxUses, 10) || 100;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (startsAt !== undefined) updateData.startsAt = startsAt ? new Date(startsAt) : null;
    if (endsAt !== undefined) updateData.endsAt = endsAt ? new Date(endsAt) : null;

    const promo = await prisma.promoOffer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ promo });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Update promo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
