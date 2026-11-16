import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { requireStaffRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = readDB();
  return NextResponse.json({ items: db.menuItems });
}

export async function POST(request: Request) {
  const session = await requireStaffRole(['OWNER', 'CASHIER']);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const db = readDB();
  const newItem = {
    id: `menu-${Date.now()}`,
    name: String(body.name || 'New Dish'),
    category: String(body.category || 'Signature Grill'),
    description: String(body.description || ''),
    price: Number(body.price || 0),
    tag: body.tag ? String(body.tag) : undefined,
    prepMinutes: Number(body.prepMinutes || 15),
    isAvailable: true,
    packagingType: body.packagingType || 'none',
  };
  db.menuItems.push(newItem);
  writeDB(db);
  return NextResponse.json({ item: newItem }, { status: 201 });
}
