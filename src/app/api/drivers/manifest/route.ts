import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { handlePrismaError } from '@/lib/prisma-error';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        driverId: user.userId,
        status: { in: ['ASSIGNED', 'IN_TRANSIT'] },
      },
      include: {
        items: { include: { product: true } },
        address: true,
        user: { select: { id: true, name: true, phone: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Get manifest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
