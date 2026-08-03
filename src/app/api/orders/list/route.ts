import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { handlePrismaError } from '@/lib/prisma-error';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let orders;

    if (user.role === 'customer') {
      orders = await prisma.order.findMany({
        where: { userId: user.userId },
        include: {
          items: { include: { product: true } },
          address: true,
          driver: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (user.role === 'driver') {
      orders = await prisma.order.findMany({
        where: { driverId: user.userId },
        include: {
          items: { include: { product: true } },
          address: true,
          user: { select: { id: true, name: true, phone: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      orders = await prisma.order.findMany({
        include: {
          items: { include: { product: true } },
          address: true,
          user: { select: { id: true, name: true, email: true } },
          driver: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
