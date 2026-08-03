import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handlePrismaError } from '@/lib/prisma-error';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const qr = searchParams.get('qr');

    if (!qr) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 });
    }

    const bottle = await prisma.bottle.findUnique({
      where: { qrCode: qr },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!bottle) {
      return NextResponse.json({ error: 'Bottle not found' }, { status: 404 });
    }

    return NextResponse.json({ bottle });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Lookup bottle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
