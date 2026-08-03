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

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
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
    const { name, description, price, liter, stock } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const parsedPrice = Number(price);
    if (price === undefined || price === '' || isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: 'Price must be a valid number' }, { status: 400 });
    }
    const parsedLiter = Number(liter);
    if (liter !== undefined && liter !== '' && (isNaN(parsedLiter) || parsedLiter <= 0)) {
      return NextResponse.json({ error: 'Liter must be a positive number' }, { status: 400 });
    }
    const parsedStock = Number(stock);
    if (stock !== undefined && stock !== '' && (isNaN(parsedStock) || !Number.isInteger(parsedStock) || parsedStock < 0)) {
      return NextResponse.json({ error: 'Stock must be a valid non-negative integer' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description || '',
        price: parsedPrice,
        liter: isNaN(parsedLiter) ? 1 : parsedLiter,
        stock: isNaN(parsedStock) ? 100 : parsedStock,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Create product error:', error);
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
    const { id, name, description, price, liter, stock, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
      return NextResponse.json({ error: 'Price must be a valid number' }, { status: 400 });
    }
    if (liter !== undefined && (isNaN(Number(liter)) || Number(liter) <= 0)) {
      return NextResponse.json({ error: 'Liter must be a positive number' }, { status: 400 });
    }
    if (stock !== undefined && (isNaN(Number(stock)) || !Number.isInteger(Number(stock)) || Number(stock) < 0)) {
      return NextResponse.json({ error: 'Stock must be a valid non-negative integer' }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(liter !== undefined && { liter: parseFloat(liter) }),
        ...(stock !== undefined && { stock: parseInt(stock, 10) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
