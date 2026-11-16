import { NextResponse } from 'next/server';
import { ensureSupabaseHydrated, resetTableInDB, syncOrderToSupabase, syncTableToSupabase } from '@/lib/db';
import { requireStaffRole } from '@/lib/auth';
import { emitRealtimeEvent } from '@/lib/socket-server';

export async function POST(
  _request: Request,
  context: { params: { tableNumber: string } }
) {
  const session = await requireStaffRole(['OWNER', 'CASHIER']);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const num = parseInt(context.params.tableNumber, 10);
  if (Number.isNaN(num) || num < 1 || num > 15) {
    return NextResponse.json({ error: 'Invalid table number (1-15)' }, { status: 400 });
  }

  const db = await ensureSupabaseHydrated();
  const table = resetTableInDB(num);
  if (!table) {
    return NextResponse.json({ error: 'Table not found' }, { status: 404 });
  }

  const lastOrder = db.orders.find((o) => o.tableNumber === num);
  if (lastOrder) {
    await syncOrderToSupabase(lastOrder, table);
  } else {
    await syncTableToSupabase(table);
  }

  emitRealtimeEvent('table:updated', table);
  return NextResponse.json({ table });
}
