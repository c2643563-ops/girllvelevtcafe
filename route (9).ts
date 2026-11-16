import { NextResponse } from 'next/server';
import { ensureSupabaseHydrated, syncInventoryToSupabase, writeDB } from '@/lib/db';
import { requireStaffRole } from '@/lib/auth';
import { emitRealtimeEvent } from '@/lib/socket-server';

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  const session = await requireStaffRole(['OWNER', 'CASHIER', 'KITCHEN']);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const db = await ensureSupabaseHydrated();
  const item = db.inventory.find((i) => i.id === context.params.id);
  if (!item) {
    return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
  }

  if (typeof body.delta === 'number') {
    item.quantity = Math.max(0, item.quantity + body.delta);
  } else if (typeof body.quantity === 'number') {
    item.quantity = Math.max(0, body.quantity);
  }
  if (typeof body.minThreshold === 'number') {
    item.minThreshold = Math.max(0, body.minThreshold);
  }
  item.updatedAt = new Date().toISOString();

  writeDB(db);
  await syncInventoryToSupabase([item]);
  emitRealtimeEvent('inventory:updated', db.inventory);

  return NextResponse.json({ item });
}
