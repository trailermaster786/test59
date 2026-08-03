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

    const bottles = await prisma.bottle.findMany({
      where: { status: 'FLAGGED_FOR_DESTRUCTION' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bottles });
  } catch (error) {
    console.error('Get destruction queue error:', error);
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
    const { bottleIds } = body;

    if (!Array.isArray(bottleIds) || bottleIds.length === 0) {
      return NextResponse.json({ error: 'bottleIds must be a non-empty array' }, { status: 400 });
    }

    const result = await prisma.bottle.updateMany({
      where: { id: { in: bottleIds } },
      data: { status: 'DESTROYED' },
    });

    // Create events for destroyed bottles
    for (const bottleId of bottleIds) {
      await prisma.bottleEvent.create({
        data: {
          bottleId,
          type: 'DESTROYED',
          userId: user.userId,
          notes: 'Destroyed by admin',
        },
      });
    }

    return NextResponse.json({ destroyed: result.count });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Destroy bottles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
