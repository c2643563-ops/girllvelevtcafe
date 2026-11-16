import { NextResponse } from 'next/server';
import { ensureSupabaseHydrated, syncInventoryToSupabase, writeDB } from '@/lib/db';
import { requireStaffRole } from '@/lib/auth';
import { emitRealtimeEvent } from '@/lib/socket-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await ensureSupabaseHydrated();
  const lowStock = db.inventory.filter((i) => i.quantity <= i.minThreshold);
  return NextResponse.json({
    items: db.inventory,
    lowStockCount: lowStock.length,
  });
}

export async function POST(request: Request) {
  const session = await requireStaffRole(['OWNER', 'CASHIER']);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name || '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
  }

  const db = await ensureSupabaseHydrated();
  const newItem = {
    id: `inv-${Date.now()}`,
    name,
    category: String(body.category || 'Packaging'),
    quantity: Math.max(0, Number(body.quantity ?? 100)),
    unit: String(body.unit || 'pieces'),
    minThreshold: Math.max(1, Number(body.minThreshold ?? 25)),
    updatedAt: new Date().toISOString(),
  };

  db.inventory.push(newItem);
  writeDB(db);
  await syncInventoryToSupabase([newItem]);
  emitRealtimeEvent('inventory:updated', db.inventory);

  return NextResponse.json({ item: newItem }, { status: 201 });
}
