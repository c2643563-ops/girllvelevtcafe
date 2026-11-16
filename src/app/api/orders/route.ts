import { NextResponse } from 'next/server';
import {
  deductPackagingInventory,
  generateOrderNumber,
  readDB,
  syncInventoryToSupabase,
  syncOrderToSupabase,
  writeDB,
} from '@/lib/db';
import { emitRealtimeEvent } from '@/lib/socket-server';
import type { Order, OrderItem, OrderType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tableParam = searchParams.get('table');
  const statusParam = searchParams.get('status');

  const db = readDB();
  let orders = [...db.orders];

  if (tableParam) {
    const tNum = parseInt(tableParam, 10);
    orders = orders.filter((o) => o.tableNumber === tNum);
  }
  if (statusParam) {
    orders = orders.filter((o) => o.status === statusParam);
  }

  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tableNumber = parseInt(String(body.tableNumber || '1'), 10);

    if (Number.isNaN(tableNumber) || tableNumber < 1 || tableNumber > 15) {
      return NextResponse.json({ error: 'Table number must be between 1 and 15' }, { status: 400 });
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 });
    }

    const db = readDB();
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const raw of rawItems) {
      const menuItem = db.menuItems.find((m) => m.id === raw.menuItemId);
      const qty = Math.max(1, parseInt(String(raw.quantity || 1), 10));
      const unitPrice = menuItem ? menuItem.price : Number(raw.price || 0);
      const itemName = menuItem ? menuItem.name : String(raw.name || 'Menu Item');

      subtotal += unitPrice * qty;
      orderItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        menuItemId: menuItem?.id || String(raw.menuItemId || 'custom'),
        name: itemName,
        price: unitPrice,
        quantity: qty,
        notes: raw.notes ? String(raw.notes) : undefined,
        packagingType: menuItem?.packagingType || 'none',
      });
    }

    const tax = 0; // Prices inclusive or 0% service tax for clean PKR totals
    const total = subtotal + tax;
    const now = new Date().toISOString();
    const orderType: OrderType = body.orderType === 'TAKEAWAY' ? 'TAKEAWAY' : 'DINE_IN';

    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderNumber: generateOrderNumber(db),
      tableNumber,
      customerName: String(body.customerName || `Table ${tableNumber} Guest`).trim(),
      customerPhone: body.customerPhone ? String(body.customerPhone).trim() : undefined,
      orderType,
      status: 'PENDING',
      items: orderItems,
      subtotal,
      tax,
      total,
      paymentStatus: 'UNPAID',
      paymentMethod: null,
      paymentReference: null,
      notes: body.notes ? String(body.notes).trim() : undefined,
      paidAt: null,
      createdAt: now,
      updatedAt: now,
    };

    db.orders.unshift(newOrder);

    const table = db.tables.find((t) => t.tableNumber === tableNumber);
    if (table) {
      table.status = 'OCCUPIED';
      table.activeOrderId = newOrder.id;
      table.updatedAt = now;
    }

    // Deduct packaging inventory (Burger boxes, Fries cups, Cold drink cups, Lids, Straws, Takeaway bags, Tissues)
    const touchedInventory = deductPackagingInventory(db, newOrder);

    writeDB(db);

    if (table) {
      void syncOrderToSupabase(newOrder, table);
    }
    if (touchedInventory.length > 0) {
      void syncInventoryToSupabase(touchedInventory);
      emitRealtimeEvent('inventory:updated', db.inventory);
    }

    emitRealtimeEvent('order:created', newOrder);
    if (table) {
      emitRealtimeEvent('table:updated', table);
    }

    return NextResponse.json({ order: newOrder, table }, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}
