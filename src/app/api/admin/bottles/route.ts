import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { handlePrismaError } from '@/lib/prisma-error';
import { BOTTLE_STATUSES } from '@/lib/constants';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (status) {
      const validStatuses = Object.values(BOTTLE_STATUSES) as string[];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `Invalid status filter. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
      }
      where.status = status;
    }
    if (search) where.qrCode = { contains: search, mode: 'insensitive' };

    const bottles = await prisma.bottle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bottles });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Get bottles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
