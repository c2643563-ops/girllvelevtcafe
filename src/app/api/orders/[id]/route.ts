import { NextResponse } from 'next/server';
import { readDB, syncOrderToSupabase, updateOrderStatusInDB } from '@/lib/db';
import { emitRealtimeEvent } from '@/lib/socket-server';
import type { OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  const db = readDB();
  const order = db.orders.find((o) => o.id === context.params.id);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const status = body.status as OrderStatus;
    const allowed: OrderStatus[] = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    const result = updateOrderStatusInDB(context.params.id, status);
    if (!result) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (result.table) {
      void syncOrderToSupabase(result.order, result.table);
      emitRealtimeEvent('table:updated', result.table);
    }
    emitRealtimeEvent('order:updated', result.order);

    return NextResponse.json({ order: result.order, table: result.table });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
