import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = readDB();

  const validOrders = db.orders.filter((o) => o.status !== 'CANCELLED');
  const paidOrders = validOrders.filter((o) => o.paymentStatus === 'PAID');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingAmount = validOrders
    .filter((o) => o.paymentStatus !== 'PAID')
    .reduce((sum, o) => sum + o.total, 0);

  const totalExpenses = db.expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const paymentBreakdown = {
    CASH: 0,
    EASYPAISA: 0,
    JAZZCASH: 0,
    BANK_TRANSFER: 0,
  };

  for (const ord of paidOrders) {
    if (ord.paymentMethod && ord.paymentMethod in paymentBreakdown) {
      paymentBreakdown[ord.paymentMethod] += ord.total;
    }
  }

  const itemSalesMap = new Map<string, { name: string; count: number; revenue: number }>();
  for (const ord of validOrders) {
    for (const item of ord.items) {
      const existing = itemSalesMap.get(item.name) || { name: item.name, count: 0, revenue: 0 };
      existing.count += item.quantity;
      existing.revenue += item.price * item.quantity;
      itemSalesMap.set(item.name, existing);
    }
  }

  const topDishes = Array.from(itemSalesMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const lowStockItems = db.inventory.filter((i) => i.quantity <= i.minThreshold);
  const occupiedTables = db.tables.filter((t) => t.status !== 'AVAILABLE').length;

  return NextResponse.json({
    totalRevenue,
    pendingAmount,
    totalOrders: validOrders.length,
    paidOrdersCount: paidOrders.length,
    occupiedTables,
    totalTables: db.tables.length,
    totalExpenses,
    netProfit,
    paymentBreakdown,
    topDishes,
    lowStockItems,
    supabaseEnabled: isSupabaseConfigured(),
    recentPayments: db.payments.slice(0, 8),
  });
}
