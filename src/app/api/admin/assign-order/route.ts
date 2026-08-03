import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { handlePrismaError } from '@/lib/prisma-error';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, driverId } = body;

    if (!orderId || !driverId) {
      return NextResponse.json({ error: 'Order ID and driver ID are required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const driver = await prisma.user.findUnique({ where: { id: driverId } });
    if (!driver || driver.role !== 'driver') {
      return NextResponse.json({ error: 'Invalid driver' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        driverId,
        status: 'ASSIGNED',
      },
    });

    try {
      const shortId = orderId.slice(-8).toUpperCase();
      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: 'order_assigned',
          title: 'Driver Assigned',
          message: `A driver has been assigned to your order #${shortId}`,
          orderId: orderId,
        },
      });
      await prisma.notification.create({
        data: {
          userId: driverId,
          type: 'order_assigned',
          title: 'New Delivery Assignment',
          message: `You have been assigned to order #${shortId}`,
          orderId: orderId,
        },
      });
    } catch {}

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Assign order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
