import { NextResponse } from 'next/server';
import { ensureSupabaseHydrated, syncExpenseToSupabase, writeDB } from '@/lib/db';
import { requireStaffRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await ensureSupabaseHydrated();
  return NextResponse.json({ expenses: db.expenses });
}

export async function POST(request: Request) {
  const session = await requireStaffRole(['OWNER', 'CASHIER']);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const title = String(body.title || '').trim();
  const amount = Number(body.amount || 0);
  if (!title || amount <= 0) {
    return NextResponse.json({ error: 'Valid expense title and amount required' }, { status: 400 });
  }

  const db = await ensureSupabaseHydrated();
  const expense = {
    id: `exp-${Date.now()}`,
    title,
    category: String(body.category || 'Operations'),
    amount,
    notes: body.notes ? String(body.notes).trim() : undefined,
    recordedBy: session.name,
    createdAt: new Date().toISOString(),
  };

  db.expenses.unshift(expense);
  writeDB(db);
  await syncExpenseToSupabase(expense);
  return NextResponse.json({ expense }, { status: 201 });
}
