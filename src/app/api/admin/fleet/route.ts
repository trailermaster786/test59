import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { handlePrismaError } from '@/lib/prisma-error';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trucks = await prisma.truck.findMany({
      include: {
        driver: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ trucks });
  } catch (error) {
    console.error('Get fleet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plate, model, capacity, driverId } = body;

    if (!plate || !model) {
      return NextResponse.json({ error: 'Plate and model are required' }, { status: 400 });
    }
    const parsedCapacity = Number(capacity);
    if (capacity === undefined || capacity === '' || isNaN(parsedCapacity) || !Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
      return NextResponse.json({ error: 'Capacity must be a positive integer' }, { status: 400 });
    }

    const existingTruck = await prisma.truck.findUnique({ where: { plate } });
    if (existingTruck) {
      return NextResponse.json({ error: 'Plate already exists' }, { status: 400 });
    }

    const truck = await prisma.truck.create({
      data: { plate, model, capacity: parsedCapacity, driverId: driverId || null },
    });

    return NextResponse.json({ truck }, { status: 201 });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Create truck error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, plate, model, capacity, driverId, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Truck ID is required' }, { status: 400 });
    }

    if (capacity !== undefined && capacity !== '') {
      const parsedCapacity = Number(capacity);
      if (isNaN(parsedCapacity) || !Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
        return NextResponse.json({ error: 'Capacity must be a positive integer' }, { status: 400 });
      }
    }

    const truck = await prisma.truck.update({
      where: { id },
      data: {
        ...(plate !== undefined && { plate }),
        ...(model !== undefined && { model }),
        ...(capacity !== undefined && { capacity: parseInt(capacity, 10) }),
        ...(driverId !== undefined && { driverId: driverId || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ truck });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Update truck error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
