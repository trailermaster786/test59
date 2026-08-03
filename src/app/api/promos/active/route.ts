import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handlePrismaError } from '@/lib/prisma-error';

export async function GET() {
  try {
    const now = new Date();
    const promos = await prisma.promoOffer.findMany({
      where: {
        isActive: true,
      },
    });

    // Filter by date range in code since Prisma null handling is tricky
    const activePromos = promos.filter((promo) => {
      if (promo.startsAt && promo.startsAt > now) return false;
      if (promo.endsAt && promo.endsAt < now) return false;
      if (promo.usedCount >= promo.maxUses) return false;
      return true;
    });

    return NextResponse.json({ promos: activePromos });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Get active promos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
