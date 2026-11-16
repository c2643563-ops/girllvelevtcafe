import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = readDB();
  const tablesWithOrders = db.tables.map((table) => {
    const activeOrder = table.activeOrderId
      ? db.orders.find((o) => o.id === table.activeOrderId) || null
      : null;
    return {
      ...table,
      activeOrder,
    };
  });
  return NextResponse.json({ tables: tablesWithOrders });
}
