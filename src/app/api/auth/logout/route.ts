import { NextResponse } from 'next/server';
import { removeTokenCookie } from '@/lib/auth';
import { handlePrismaError } from '@/lib/prisma-error';

export async function POST() {
  try {
    await removeTokenCookie();
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
