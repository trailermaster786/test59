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
    const { count } = body;

    if (count === undefined || count === null || typeof count !== 'number' || !Number.isInteger(count) || count <= 0 || count > 1000) {
      return NextResponse.json({ error: 'Count must be an integer between 1 and 1000' }, { status: 400 });
    }

    const bottles = [];
    const lastBottle = await prisma.bottle.findFirst({
      orderBy: { qrCode: 'desc' },
    });

    let startNum = 1;
    if (lastBottle) {
      const lastNum = parseInt(lastBottle.qrCode.replace('AQUA-', ''));
      startNum = isNaN(lastNum) ? 1 : lastNum + 1;
    }

    for (let i = 0; i < count; i++) {
      const qrCode = `AQUA-${String(startNum + i).padStart(4, '0')}`;
      const bottle = await prisma.bottle.create({
        data: {
          qrCode,
          status: 'IN_FACTORY',
          refillCount: 0,
          maxRefills: 30,
        },
      });

      await prisma.bottleEvent.create({
        data: {
          bottleId: bottle.id,
          type: 'GENERATED',
          userId: user.userId,
          notes: `Generated ${count} bottles`,
        },
      });

      bottles.push(bottle);
    }

    return NextResponse.json({ bottles, count: bottles.length }, { status: 201 });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Generate bottles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
