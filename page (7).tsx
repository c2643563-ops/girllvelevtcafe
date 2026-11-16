'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ChefHat, Clock, Flame, Utensils } from 'lucide-react';
import { StaffShell } from '@/components/StaffShell';
import { getSocket } from '@/lib/socket-client';
import { formatTimeAgo } from '@/lib/format';
import type { Order, OrderStatus } from '@/lib/types';

export default function KitchenDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'ACTIVE' | 'ALL'>('ACTIVE');

  const loadOrders = useCallback(async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data.orders || []);
  }, []);

  useEffect(() => {
    void loadOrders();
    const socket = getSocket();
    socket.emit('join:role', 'kitchen');

    const refresh = () => void loadOrders();
    socket.on('order:created', refresh);
    socket.on('order:updated', refresh);

    const poll = setInterval(() => {
      if (!socket.connected) void loadOrders();
    }, 3000);

    return () => {
      clearInterval(poll);
      socket.off('order:created', refresh);
      socket.off('order:updated', refresh);
    };
  }, [loadOrders]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadOrders();
  };

  const displayed = orders.filter((o) => {
    if (filter === 'ACTIVE') {
      return o.status === 'PENDING' || o.status === 'PREPARING' || o.status === 'READY';
    }
    return true;
  });

  return (
    <StaffShell
      title="Kitchen Display System (KDS)"
      subtitle="Live order tickets synced directly from QR tables & Cashier POS"
      allowedRoles={['OWNER', 'CASHIER', 'KITCHEN']}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              filter === 'ACTIVE'
                ? 'bg-[#6B132E] text-white shadow'
                : 'border border-[#D8CCBA] bg-white text-[#4A0B1E]'
            }`}
          >
            Active Tickets ({orders.filter((o) => ['PENDING', 'PREPARING', 'READY'].includes(o.status)).length})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              filter === 'ALL'
                ? 'bg-[#6B132E] text-white shadow'
                : 'border border-[#D8CCBA] bg-white text-[#4A0B1E]'
            }`}
          >
            All Today ({orders.length})
          </button>
        </div>
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-3xl border border-[#E3D7C5] bg-[#FFFDF9] p-12 text-center">
          <ChefHat className="mx-auto h-12 w-12 text-[#C9A227]" />
          <h2 className="mt-3 font-serif text-2xl font-bold text-[#4A0B1E]">
            Kitchen Queue is Clear
          </h2>
          <p className="mt-1 text-xs text-[#73545E]">
            New QR table orders will appear here instantly in real time.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((ord) => {
            const borderColor =
              ord.status === 'PENDING'
                ? 'border-amber-500 bg-amber-50/40'
                : ord.status === 'PREPARING'
                ? 'border-[#6B132E] bg-[#FFFDF9]'
                : ord.status === 'READY'
                ? 'border-emerald-500 bg-emerald-50/40'
                : 'border-[#D8CCBA] bg-white/70';

            return (
              <div
                key={ord.id}
                className={`flex flex-col justify-between rounded-2xl border-2 p-5 shadow-sm ${borderColor}`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-black/10 pb-3">
                    <div>
                      <span className="rounded-lg bg-[#6B132E] px-2.5 py-1 text-xs font-bold text-[#E8D28A]">
                        Table {ord.tableNumber} • {ord.orderType}
                      </span>
                      <p className="mt-1.5 font-mono text-xs font-bold text-[#4A0B1E]">
                        {ord.orderNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/10 px-2.5 py-0.5 text-[11px] font-bold text-[#4A0B1E]">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(ord.createdAt)}
                      </span>
                      <p className="mt-1 text-[11px] font-bold uppercase text-[#6B132E]">
                        {ord.status}
                      </p>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {ord.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between rounded-xl bg-white/80 px-3 py-2 text-sm border border-[#E9DFD0]"
                      >
                        <span className="font-semibold text-[#2A0914]">
                          <strong className="mr-1.5 text-[#6B132E]">{item.quantity}x</strong>
                          {item.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {ord.notes && (
                    <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs font-medium text-amber-950">
                      <strong>Kitchen Note:</strong> {ord.notes}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-black/10 pt-3">
                  {ord.status === 'PENDING' && (
                    <button
                      onClick={() => updateStatus(ord.id, 'PREPARING')}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#6B132E] py-2.5 text-xs font-bold text-white hover:bg-[#4A0B1E]"
                    >
                      <Flame className="h-4 w-4 text-[#E8D28A]" />
                      Start Preparing
                    </button>
                  )}

                  {ord.status === 'PREPARING' && (
                    <button
                      onClick={() => updateStatus(ord.id, 'READY')}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <Utensils className="h-4 w-4" />
                      Mark Ready to Serve
                    </button>
                  )}

                  {(ord.status === 'READY' || ord.status === 'PREPARING') && (
                    <button
                      onClick={() => updateStatus(ord.id, 'COMPLETED')}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#6B132E] bg-white py-2.5 text-xs font-bold text-[#6B132E] hover:bg-[#FAF6F0]"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Complete Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StaffShell>
  );
}
