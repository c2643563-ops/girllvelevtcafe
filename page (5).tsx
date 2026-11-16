'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Database,
  Flame,
  TrendingUp,
  Users,
} from 'lucide-react';
import { StaffShell } from '@/components/StaffShell';
import { getSocket } from '@/lib/socket-client';
import { formatPKR, formatPaymentMethod } from '@/lib/format';
import type { InventoryItem, PaymentRecord } from '@/lib/types';

interface AnalyticsData {
  totalRevenue: number;
  pendingAmount: number;
  totalOrders: number;
  paidOrdersCount: number;
  occupiedTables: number;
  totalTables: number;
  totalExpenses: number;
  netProfit: number;
  paymentBreakdown: {
    CASH: number;
    EASYPAISA: number;
    JAZZCASH: number;
    BANK_TRANSFER: number;
  };
  topDishes: { name: string; count: number; revenue: number }[];
  lowStockItems: InventoryItem[];
  supabaseEnabled: boolean;
  recentPayments: PaymentRecord[];
}

export default function OwnerDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  const loadAnalytics = useCallback(async () => {
    const res = await fetch('/api/analytics');
    if (res.ok) {
      setData(await res.json());
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
    const socket = getSocket();
    socket.emit('join:role', 'owner');
    const refresh = () => void loadAnalytics();
    socket.on('order:created', refresh);
    socket.on('order:updated', refresh);
    socket.on('payment:completed', refresh);
    socket.on('inventory:updated', refresh);
    return () => {
      socket.off('order:created', refresh);
      socket.off('order:updated', refresh);
      socket.off('payment:completed', refresh);
      socket.off('inventory:updated', refresh);
    };
  }, [loadAnalytics]);

  return (
    <StaffShell
      title="Owner Executive Mobile Dashboard"
      subtitle="Live revenue, Pakistani gateway breakdown, net profit & inventory health"
      allowedRoles={['OWNER']}
    >
      {!data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 animate-pulse rounded-2xl bg-[#EFE5D5]" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#C9A227]/40 bg-gradient-to-br from-[#4A0B1E] to-[#6B132E] p-5 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#E8D28A]">Collected Revenue</span>
                <TrendingUp className="h-5 w-5 text-[#E8D28A]" />
              </div>
              <p className="mt-2 font-serif text-3xl font-bold">{formatPKR(data.totalRevenue)}</p>
              <p className="mt-1 text-[11px] text-[#F2DFD8]">
                {data.paidOrdersCount} paid orders • Pending: {formatPKR(data.pendingAmount)}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E3D7C5] bg-[#FFFDF9] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#73545E]">Net Profit</span>
                <Banknote className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-2 font-serif text-3xl font-bold text-[#4A0B1E]">
                {formatPKR(data.netProfit)}
              </p>
              <p className="mt-1 text-[11px] text-[#73545E]">
                Expenses recorded: {formatPKR(data.totalExpenses)}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E3D7C5] bg-[#FFFDF9] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#73545E]">Live Floor Occupancy</span>
                <Users className="h-5 w-5 text-[#6B132E]" />
              </div>
              <p className="mt-2 font-serif text-3xl font-bold text-[#4A0B1E]">
                {data.occupiedTables} / {data.totalTables}
              </p>
              <p className="mt-1 text-[11px] text-[#73545E]">
                Total orders today: {data.totalOrders}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E3D7C5] bg-[#FFFDF9] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#73545E]">Database &amp; Alerts</span>
                <Database className="h-5 w-5 text-[#C9A227]" />
              </div>
              <p className="mt-2 font-serif text-xl font-bold text-[#4A0B1E]">
                {data.supabaseEnabled ? 'Supabase Live Sync' : 'Local Engine Active'}
              </p>
              <p className="mt-1 text-[11px] text-[#73545E]">
                Low stock warnings: {data.lowStockItems.length}
              </p>
            </div>
          </div>

          {/* Payment Methods & Top Dishes */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-[#E3D7C5] bg-[#FFFDF9] p-5 shadow-sm">
              <h2 className="mb-4 font-serif text-xl font-bold text-[#4A0B1E]">
                Payment Gateway Breakdown
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Easypaisa', val: data.paymentBreakdown.EASYPAISA, color: 'border-emerald-300 bg-emerald-50 text-emerald-900' },
                  { label: 'JazzCash', val: data.paymentBreakdown.JAZZCASH, color: 'border-rose-300 bg-rose-50 text-rose-900' },
                  { label: 'Bank / Raast', val: data.paymentBreakdown.BANK_TRANSFER, color: 'border-[#6B132E]/30 bg-[#FAF6F0] text-[#4A0B1E]' },
                  { label: 'Cash on Counter', val: data.paymentBreakdown.CASH, color: 'border-[#C9A227]/50 bg-amber-50 text-amber-950' },
                ].map((box) => (
                  <div key={box.label} className={`rounded-2xl border p-4 ${box.color}`}>
                    <p className="text-xs font-semibold">{box.label}</p>
                    <p className="mt-1 font-serif text-xl font-bold">{formatPKR(box.val)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#E3D7C5] bg-[#FFFDF9] p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-bold text-[#4A0B1E]">
                <Flame className="h-5 w-5 text-[#6B132E]" />
                Top Selling Dishes
              </h2>
              {data.topDishes.length === 0 ? (
                <p className="py-8 text-center text-xs text-[#73545E]">
                  Place your first order to see top dishes here.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {data.topDishes.map((dish, idx) => (
                    <div
                      key={dish.name}
                      className="flex items-center justify-between rounded-xl border border-[#E6DAC8] bg-white px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6B132E] text-[11px] font-bold text-[#E8D28A]">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[#4A0B1E]">{dish.name}</p>
                          <p className="text-[10px] text-[#73545E]">{dish.count} ordered</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#6B132E]">
                        {formatPKR(dish.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Low Stock + Recent Payments */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-[#E3D7C5] bg-[#FFFDF9] p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 font-serif text-lg font-bold text-[#4A0B1E]">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Low Stock Watch (Threshold ≤ 25 pieces)
              </h2>
              {data.lowStockItems.length === 0 ? (
                <p className="rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
                  ✓ All packaging items (Burger boxes, Fries cups, Cold drink cups, Lids, Straws, Takeaway bags, Tissues) are well stocked!
                </p>
              ) : (
                <div className="space-y-2">
                  {data.lowStockItems.map((i) => (
                    <div
                      key={i.id}
                      className="flex justify-between rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-900"
                    >
                      <span>{i.name}</span>
                      <span>
                        {i.quantity} {i.unit} remaining
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-[#E3D7C5] bg-[#FFFDF9] p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 font-serif text-lg font-bold text-[#4A0B1E]">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Recent Verified Payments
              </h2>
              {data.recentPayments.length === 0 ? (
                <p className="py-6 text-center text-xs text-[#73545E]">
                  No completed payments recorded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.recentPayments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-[#E6DAC8] bg-white px-3.5 py-2 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#4A0B1E]">
                          Table {p.tableNumber} • {p.orderNumber}
                        </p>
                        <p className="text-[10px] text-[#73545E]">
                          {formatPaymentMethod(p.method)} • {p.referenceId}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-700">{formatPKR(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </StaffShell>
  );
}
