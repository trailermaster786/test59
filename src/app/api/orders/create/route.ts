import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { handlePrismaError } from '@/lib/prisma-error';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'customer' && user.role !== 'driver')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, addressId, paymentMethod, promoCode, notes, customerId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }

    // Drivers can place an order on behalf of a customer (customerId must belong to a customer)
    let orderUserId = user.userId;
    if (customerId && customerId !== user.userId) {
      if (user.role !== 'driver') {
        return NextResponse.json({ error: 'Only drivers can place orders for another user' }, { status: 403 });
      }
      const customer = await prisma.user.findUnique({
        where: { id: customerId },
        select: { id: true, role: true, isActive: true },
      });
      if (!customer || customer.role !== 'customer' || !customer.isActive) {
        return NextResponse.json({ error: 'Invalid customer for on-behalf order' }, { status: 400 });
      }
      orderUserId = customer.id;
    }

    // Validate address belongs to the order owner (customer or on-behalf customer) if provided
    if (addressId) {
      const address = await prisma.address.findUnique({ where: { id: addressId } });
      if (!address || address.userId !== orderUserId) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
      }
    }

    // Calculate totals and validate stock
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!item.productId || !Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json({ error: 'Invalid item: productId and positive integer quantity required' }, { status: 400 });
      }
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });
      }
      if (!product.isActive) {
        return NextResponse.json({ error: `Product "${product.name}" is not available` }, { status: 400 });
      }
      if (product.stock < quantity) {
        return NextResponse.json({ error: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${quantity}` }, { status: 400 });
      }
      const itemTotal = product.price * quantity;
      totalAmount += itemTotal;
      orderItems.push({
        productId: item.productId,
        quantity,
        unitPrice: product.price,
      });
    }

    // Apply promo
    let discount = 0;
    let appliedPromoId = null;
    if (promoCode) {
      const promo = await prisma.promoOffer.findUnique({ where: { code: promoCode.toUpperCase() } });
      if (promo && promo.isActive && promo.usedCount < promo.maxUses) {
        if (new Date() >= (promo.startsAt || new Date()) && new Date() <= (promo.endsAt || new Date('2099-12-31'))) {
          if (totalAmount >= promo.minOrder) {
            if (promo.type === 'percentage') {
              discount = totalAmount * (promo.value / 100);
            } else {
              discount = Math.min(promo.value, totalAmount);
            }
            appliedPromoId = promo.id;
          }
        }
      }
    }

    const finalAmount = totalAmount - discount;

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: orderUserId,
        addressId: addressId || null,
        totalAmount,
        discount,
        finalAmount,
        paymentMethod: paymentMethod || 'cash',
        notes,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    });

    // Decrement stock for each product
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }


    if (appliedPromoId) {
      await prisma.promoOffer.update({
        where: { id: appliedPromoId },
        data: { usedCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    const prismaError = handlePrismaError(error);
    if (prismaError) return prismaError;
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
