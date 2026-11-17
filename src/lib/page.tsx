'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  Printer,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { StaffShell } from '@/components/StaffShell';
import { ThermalReceiptModal } from '@/components/ThermalReceiptModal';
import { getSocket } from '@/lib/socket-client';
import { formatPKR, formatPaymentMethod, formatTimeAgo } from '@/lib/format';
import type { CafeTable, MenuItem, Order, PaymentMethod } from '@/lib/types';

interface TableWithOrder extends CafeTable {
  activeOrder: Order | null;
}

function playDing() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // ignore audio errors
  }
}

export default function CashierPOSPage() {
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [recentPaidTables, setRecentPaidTables] = useState<Record<number, Order>>({});
  const knownPaidIdsRef = useRef<Set<string> | null>(null);
  const flashTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Walk-in POS Modal
  const [posOpen, setPosOpen] = useState(false);
  const [posTable, setPosTable] = useState(1);
  const [posCart, setPosCart] = useState<Record<string, number>>({});
  const [posSubmitting, setPosSubmitting] = useState(false);

  const flashTablePaid = useCallback((ord: Order) => {
    const tNum = ord.tableNumber;
    if (flashTimersRef.current[tNum]) {
      clearTimeout(flashTimersRef.current[tNum]);
    }
    setRecentPaidTables((prev) => ({ ...prev, [tNum]: ord }));
    flashTimersRef.current[tNum] = setTimeout(() => {
      setRecentPaidTables((prev) => {
        const next = { ...prev };
        delete next[tNum];
        return next;
      });
      delete flashTimersRef.current[tNum];
    }, 6000);
  }, []);

  const loadData = useCallback(async () => {
    const [tRes, oRes, mRes] = await Promise.all([
      fetch('/api/tables'),
      fetch('/api/orders'),
      fetch('/api/menu'),
    ]);
    const tData = await tRes.json();
    const oData = await oRes.json();
    const mData = await mRes.json();
    const fetchedOrders: Order[] = oData.orders || [];

    // Detect newly paid orders even during polling fallback
    const paidIds = new Set(
      fetchedOrders.filter((o) => o.paymentStatus === 'PAID').map((o) => o.id)
    );
    if (knownPaidIdsRef.current === null) {
      knownPaidIdsRef.current = paidIds;
    } else {
      for (const ord of fetchedOrders) {
        if (ord.paymentStatus === 'PAID' && !knownPaidIdsRef.current.has(ord.id)) {
          knownPaidIdsRef.current.add(ord.id);
          playDing();
          setToast(
            `✓ Table ${ord.tableNumber} Payment Completed via ${formatPaymentMethod(ord.paymentMethod)}!`
          );
          flashTablePaid(ord);
        }
      }
    }

    setTables(tData.tables || []);
    setOrders(fetchedOrders);
    setMenu(mData.items || []);
  }, [flashTablePaid]);

  useEffect(() => {
    void loadData();
    const socket = getSocket();
    socket.emit('join:role', 'cashier');

    const onOrderCreated = (newOrder: Order) => {
      playDing();
      setToast(`New Order ${newOrder.orderNumber} received from Table ${newOrder.tableNumber}!`);
      void loadData();
    };

    const onOrderUpdated = () => {
      void loadData();
    };

    const onPaymentCompleted = (payload: { message?: string; order?: Order }) => {
      playDing();
      if (payload.order) {
        knownPaidIdsRef.current?.add(payload.order.id);
        flashTablePaid(payload.order);
      }
      setToast(
        payload.message ||
          `✓ Table ${payload.order?.tableNumber} Payment Completed!`
      );
      void loadData();
    };

    const onTableUpdated = () => {
      void loadData();
    };

    socket.on('order:created', onOrderCreated);
    socket.on('order:updated', onOrderUpdated);
    socket.on('payment:completed', onPaymentCompleted);
    socket.on('table:updated', onTableUpdated);

    // Fallback polling for serverless hosts (e.g. Vercel) where WebSockets aren't running
    const poll = setInterval(() => {
      if (!socket.connected) {
        void loadData();
      }
    }, 3000);

    return () => {
      clearInterval(poll);
      Object.values(flashTimersRef.current).forEach((t) => clearTimeout(t));
      socket.off('order:created', onOrderCreated);
      socket.off('order:updated', onOrderUpdated);
      socket.off('payment:completed', onPaymentCompleted);
      socket.off('table:updated', onTableUpdated);
    };
  }, [loadData, flashTablePaid]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const markPaid = async (orderId: string, method: PaymentMethod) => {
    const res = await fetch('/api/payments/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        method,
        source: 'CASHIER',
        accountOrPhone: method === 'CASH' ? 'Counter Cash' : 'POS Verified',
      }),
    });
    if (res.ok) {
      playDing();
      await loadData();
    }
  };

  const updateStatus = async (orderId: string, status: Order['status']) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadData();
  };

  const resetTable = async (tableNumber: number) => {
    await fetch(`/api/tables/${tableNumber}/reset`, { method: 'POST' });
    await loadData();
  };

  const submitWalkInOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = Object.entries(posCart)
      .filter(([, qty]) => qty > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
    if (items.length === 0) return;

    setPosSubmitting(true);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableNumber: posTable,
        customerName: `Table ${posTable} (Counter POS)`,
        orderType: 'DINE_IN',
        items,
      }),
    });
    setPosSubmitting(false);
    if (res.ok) {
      setPosCart({});
      setPosOpen(false);
      await loadData();
    }
  };

  const paidOrdersCount = orders.filter((o) => o.paymentStatus === 'PAID').length;
  const activeCount = tables.filter(
    (t) => t.status !== 'AVAILABLE' && t.status !== 'PAID'
  ).length;

  return (
    <StaffShell
      title="Cashier POS & 15-Table Live Floor"
      subtitle="Paid tables auto-clear back to Available while all orders remain saved below"
      allowedRoles={['OWNER', 'CASHIER']}
    >
      {/* Live Celebration Toast */}
      {toast && (
        <div className="mb-5 flex items-center justify-between rounded-2xl border-2 border-emerald-500 bg-emerald-50 px-4 py-3 text-emerald-950 shadow-lg dark:bg-emerald-950/90 dark:text-emerald-100">
          <div className="flex items-center gap-2.5">
            <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
            <span className="text-sm font-bold">{toast}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-[#E3D7C5] bg-white px-4 py-2 text-xs dark:border-[#C9A227]/30 dark:bg-[#240D15]">
            <span className="text-[#73545E] dark:text-[#D9C7CD]">Active Tables: </span>
            <strong className="text-[#4A0B1E] dark:text-[#FAF6F0]">{activeCount} / 15</strong>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs dark:border-emerald-500/40 dark:bg-emerald-950/60">
            <span className="text-emerald-800 dark:text-emerald-200">Paid Orders (Green Tick): </span>
            <strong className="text-emerald-700 dark:text-emerald-400">{paidOrdersCount}</strong>
          </div>
        </div>

        <button
          onClick={() => setPosOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6B132E] px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-[#4A0B1E] transition"
        >
          <Plus className="h-4 w-4 text-[#E8D28A]" />
          New Counter / Walk-In Order
        </button>
      </div>

      {/* 15-Table Live Grid */}
      <section className="mb-8">
        <h2 className="mb-3 font-serif text-lg font-bold text-[#4A0B1E] dark:text-[#E8D28A]">
          15-Table Live Floor Status
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {tables.map((table) => {
            const flashedOrd = recentPaidTables[table.tableNumber];
            const ord = table.activeOrder || flashedOrd || null;
            const isFlashingPaid = Boolean(flashedOrd && !table.activeOrder);
            const isPaid = isFlashingPaid || ord?.paymentStatus === 'PAID';
            const isCashPending = ord?.paymentStatus === 'PENDING_VERIFICATION';
            const isOccupied = Boolean(
              !isPaid && (table.activeOrder || (table.status !== 'AVAILABLE' && table.status !== 'PAID'))
            );

            return (
              <div
                key={table.tableNumber}
                className={`relative flex flex-col justify-between rounded-2xl border-2 p-3.5 transition shadow-sm ${
                  isPaid
                    ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/70'
                    : isCashPending
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60'
                    : isOccupied
                    ? 'border-[#6B132E]/60 bg-[#FFFDF9] dark:border-[#E8D28A]/60 dark:bg-[#2A0E19]'
                    : 'border-[#E6DAC8] bg-white/80 dark:border-[#C9A227]/20 dark:bg-[#240D15]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-serif text-base font-bold text-[#4A0B1E] dark:text-[#FAF6F0]">
                      Table {table.tableNumber}
                    </p>
                    <p className="text-[10px] text-[#73545E] dark:text-[#CBB4BC]">{table.capacity} Seats</p>
                  </div>

                  {isPaid ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow animate-pulse">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      PAID ✓
                    </span>
                  ) : isCashPending ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      CASH DUE
                    </span>
                  ) : isOccupied ? (
                    <span className="rounded-full bg-[#6B132E] px-2 py-0.5 text-[10px] font-bold text-[#E8D28A]">
                      {ord?.status || 'ACTIVE'}
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#FAF6F0] px-2 py-0.5 text-[10px] font-semibold text-[#8C757D] dark:bg-[#17060C] dark:text-[#D9C7CD]">
                      Available
                    </span>
                  )}
                </div>

                {ord ? (
                  <div className="mt-3 space-y-2 border-t border-black/10 pt-2 dark:border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#4A0B1E] dark:text-[#FAF6F0]">{ord.orderNumber}</span>
                      <span className="font-bold text-[#6B132E] dark:text-[#E8D28A]">{formatPKR(ord.total)}</span>
                    </div>

                    {isPaid ? (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          ✓ Paid ({formatPaymentMethod(ord.paymentMethod)}) — Resetting...
                        </p>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setReceiptOrder(ord)}
                            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white border border-emerald-300 py-1 text-[10px] font-bold text-emerald-900 hover:bg-emerald-100"
                          >
                            <Printer className="h-3 w-3" />
                            Receipt
                          </button>
                          <button
                            onClick={() => {
                              setRecentPaidTables((prev) => {
                                const next = { ...prev };
                                delete next[table.tableNumber];
                                return next;
                              });
                              void resetTable(table.tableNumber);
                            }}
                            className="flex items-center justify-center gap-1 rounded-lg bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-800"
                            title="Clear Table Now"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Clear
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => markPaid(ord.id, 'CASH')}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {isCashPending ? 'Confirm Cash ✓' : 'Mark Paid ✓'}
                        </button>
                        <button
                          onClick={() => resetTable(table.tableNumber)}
                          className="rounded-lg border border-[#D8CCBA] bg-white px-2 py-1.5 text-[10px] font-bold text-[#4A0B1E] hover:bg-neutral-100 dark:border-white/20 dark:bg-[#17060C] dark:text-[#FAF6F0]"
                          title="Reset Table to Available"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-[11px] text-[#9A858C] dark:text-[#B59AA3]">Ready for QR scan</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Orders Ledger */}
      <section className="rounded-3xl border border-[#E3D7C5] bg-[#FFFDF9] p-5 shadow-sm dark:border-[#C9A227]/25 dark:bg-[#1B0A10]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-[#4A0B1E] dark:text-[#FFFDF9]">
            Live Orders &amp; Payment Verification
          </h2>
          <span className="text-xs text-[#73545E] dark:text-[#D9C7CD]">{orders.length} total orders</span>
        </div>

        {orders.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#73545E] dark:text-[#D9C7CD]">
            No orders yet. Scan a Table QR code or create a Counter POS order!
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className={`flex flex-col justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center ${
                  ord.paymentStatus === 'PAID'
                    ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-950/35'
                    : ord.paymentStatus === 'PENDING_VERIFICATION'
                    ? 'border-amber-300 bg-amber-50/70 dark:border-amber-500/40 dark:bg-amber-950/35'
                    : 'border-[#E6DAC8] bg-white dark:border-[#C9A227]/25 dark:bg-[#240D15]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-[#6B132E] px-2.5 py-0.5 text-xs font-bold text-[#E8D28A]">
                      Table {ord.tableNumber}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#4A0B1E] dark:text-[#FAF6F0]">
                      {ord.orderNumber}
                    </span>
                    <span className="text-xs text-[#73545E] dark:text-[#D9C7CD]">• {ord.customerName}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#8B6A75] dark:text-[#CBB4BC]">
                      <Clock className="h-3 w-3" /> {formatTimeAgo(ord.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-[#543741] dark:text-[#EDE2E5]">
                    {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-sm font-bold text-[#6B132E] dark:text-[#E8D28A]">{formatPKR(ord.total)}</span>
                    {ord.paymentStatus === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Payment Complete ({formatPaymentMethod(ord.paymentMethod)})
                      </span>
                    ) : ord.paymentStatus === 'PENDING_VERIFICATION' ? (
                      <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                        Customer Paying Cash at Counter — Verify!
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-700 dark:bg-[#3A1723] dark:text-[#FAF6F0]">
                        Unpaid • {ord.status}
                      </span>
                    )}
                    {ord.paymentReference && (
                      <span className="font-mono text-[10px] text-[#73545E] dark:text-[#CBB4BC]">
                        Ref: {ord.paymentReference}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {ord.status !== 'COMPLETED' && ord.status !== 'CANCELLED' && (
                    <button
                      onClick={() => updateStatus(ord.id, 'COMPLETED')}
                      className="rounded-xl border border-[#D8CCBA] bg-[#FAF6F0] px-3 py-1.5 text-xs font-bold text-[#4A0B1E] hover:border-[#6B132E]"
                    >
                      Mark Completed
                    </button>
                  )}

                  {ord.paymentStatus !== 'PAID' && (
                    <>
                      <button
                        onClick={() => markPaid(ord.id, 'CASH')}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Cash Paid ✓
                      </button>
                      <button
                        onClick={() => markPaid(ord.id, 'EASYPAISA')}
                        className="rounded-xl border border-emerald-500 bg-white px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50"
                      >
                        Easypaisa ✓
                      </button>
                      <button
                        onClick={() => markPaid(ord.id, 'JAZZCASH')}
                        className="rounded-xl border border-rose-500 bg-white px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-50"
                      >
                        JazzCash ✓
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setReceiptOrder(ord)}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#4A0B1E] px-3 py-1.5 text-xs font-bold text-[#E8D28A] hover:bg-[#6B132E]"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    80mm Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Walk-In POS Modal */}
      {posOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-[#C9A227]/40 bg-[#FFFDF9] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-[#E5DAC8] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#6B132E]" />
                <h3 className="font-serif text-xl font-bold text-[#4A0B1E]">
                  Walk-In / Counter Order
                </h3>
              </div>
              <button onClick={() => setPosOpen(false)} className="p-1 text-[#73545E]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitWalkInOrder} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#4A0B1E]">Assign Table (1–15)</label>
                <select
                  value={posTable}
                  onChange={(e) => setPosTable(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#D8CCBA] bg-white px-3 py-2 text-sm font-semibold"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((t) => (
                    <option key={t} value={t}>
                      Table {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {menu.map((item) => {
                  const qty = posCart[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-[#E6DAC8] bg-[#FAF6F0] px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-bold text-[#4A0B1E]">{item.name}</p>
                        <p className="text-[11px] text-[#73545E]">{formatPKR(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPosCart((p) => ({ ...p, [item.id]: Math.max(0, (p[item.id] || 0) - 1) }))
                          }
                          className="h-7 w-7 rounded-lg border bg-white text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-bold">{qty}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setPosCart((p) => ({ ...p, [item.id]: (p[item.id] || 0) + 1 }))
                          }
                          className="h-7 w-7 rounded-lg bg-[#6B132E] text-xs font-bold text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={posSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6B132E] py-3 text-sm font-bold text-white hover:bg-[#4A0B1E]"
              >
                <Sparkles className="h-4 w-4 text-[#E8D28A]" />
                {posSubmitting ? 'Creating...' : 'Send Order to Kitchen & Cashier'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ThermalReceiptModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />
    </StaffShell>
  );
}
