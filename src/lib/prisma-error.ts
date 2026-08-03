import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

/**
 * Maps known Prisma request errors to clean HTTP responses.
 * Returns null when the error is not a known Prisma error (caller falls back to 500).
 */
export function handlePrismaError(error: unknown): NextResponse | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json({ error: 'A record with this value already exists' }, { status: 400 });
      case 'P2025':
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      case 'P2003':
      case 'P2014':
        return NextResponse.json({ error: 'This record is in use and cannot be modified or deleted' }, { status: 400 });
    }
  }
  return null;
}
