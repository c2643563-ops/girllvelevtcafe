'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  ChefHat,
  Clock,
  Printer,
  Sparkles,
  UtensilsCrossed,
  ArrowLeft,
} from 'lucide-react';
import type { Order } from '@/lib/types';
import { getSocket } from '@/lib/socket-client';
import { formatPKR } from '@/lib/format';
import { PaymentGatewayPanel } from '@/components/PaymentGatewayPanel';
import { ThermalReceiptModal } from '@/components/ThermalReceiptModal';

const STEPS = [
  { key: 'PENDING', label: 'Order Placed', desc: 'Received at Kitchen & Cashier' },
  { key: 'PREPARING', label: 'In Kitchen', desc: 'Chefs are preparing your meal' },
  { key: 'READY', label: 'Ready / Served', desc: 'Served to your table' },
  { key: 'COMPLETED', label: 'Completed', desc: 'Order completed — settle bill' },
];

export default function OrderTrackerPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.order) setOrder(d.order);
      })
      .finally(() => setLoading(false));

    const socket = getSocket();
    socket.emit('join:order', orderId);

    const handleUpdate = (updated: Order) => {
      if (updated.id === orderId) {
        setOrder(updated);
      }
    };

    socket.on('order:updated', handleUpdate);
    return () => {
      socket.off('order:updated', handleUpdate);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0] text-[#4A0B1E]">
        <div className="text-center space-y-2">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#6B132E] border-t-transparent" />
          <p className="font-serif text-lg">Loading your live order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0] p-6">
        <div className="max-w-md rounded-3xl border border-[#E3D7C5] bg-white p-8 text-center shadow-lg">
          <h1 className="font-serif text-2xl font-bold text-[#4A0B1E]">Order Not Found</h1>
          <p className="mt-2 text-sm text-[#73545E]">
            This order reference could not be located.
          </p>
          <Link
            href="/menu?table=1"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6B132E] px-5 py-2.5 text-sm font-bold text-white"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  const activeStepIdx = Math.max(
    0,
    STEPS.findIndex((s) => s.key === order.status)
  );

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-16 text-[#2A0914]">
      <header className="border-b border-[#C9A227]/30 bg-[#FFFDF9]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5">
          <Link
            href={`/menu?table=${order.tableNumber}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B132E] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Table {order.tableNumber} Menu
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#C9A227]" />
            <span className="font-serif text-base font-bold text-[#4A0B1E]">
              Velvet Cafe &amp; Grill
            </span>
          </div>
          <button
            onClick={() => setShowReceipt(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D8CCBA] bg-[#FAF6F0] px-3 py-1.5 text-xs font-bold text-[#4A0B1E]"
          >
            <Printer className="h-3.5 w-3.5" />
            Receipt
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {/* Order Header Card */}
        <div className="rounded-3xl border border-[#C9A227]/40 bg-gradient-to-br from-[#4A0B1E] to-[#6B132E] p-6 text-[#FFFDF9] shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C9A227] px-3 py-0.5 text-[11px] font-bold text-[#2A0914]">
                <UtensilsCrossed className="h-3 w-3" />
                TABLE {order.tableNumber} • {order.orderNumber}
              </span>
              <h1 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">
                {order.status === 'COMPLETED' || order.status === 'READY'
                  ? 'Your Velvet Order is Ready!'
                  : order.status === 'PREPARING'
                  ? 'Kitchen is Preparing Your Meal'
                  : 'Order Sent to Kitchen & Cashier'}
              </h1>
              <p className="mt-1 text-xs text-[#F2DFD8]">
                Guest: {order.customerName} • Real-time live status updates automatically
              </p>
            </div>

            <div className="rounded-2xl bg-black/25 px-4 py-3 text-right">
              <p className="text-[11px] uppercase tracking-wider text-[#E8D28A]">Total Bill</p>
              <p className="font-serif text-2xl font-bold">{formatPKR(order.total)}</p>
              <span
                className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  order.paymentStatus === 'PAID'
                    ? 'bg-emerald-500 text-white'
                    : order.paymentStatus === 'PENDING_VERIFICATION'
                    ? 'bg-amber-400 text-[#2A0914]'
                    : 'bg-white/20 text-white'
                }`}
              >
                {order.paymentStatus === 'PAID' ? '✓ PAID' : order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Live Stepper */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STEPS.map((step, idx) => {
              const done = idx <= activeStepIdx;
              return (
                <div
                  key={step.key}
                  className={`rounded-2xl border p-3 transition ${
                    done
                      ? 'border-[#E8D28A] bg-white/15 text-white'
                      : 'border-white/10 bg-black/20 text-white/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-[#E8D28A]" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                    <span className="text-xs font-bold">{step.label}</span>
                  </div>
                  <p className="mt-1 text-[10px] opacity-80">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pakistani Payment Gateway Page Section */}
        <PaymentGatewayPanel
          order={order}
          onPaymentComplete={(updated) => setOrder(updated)}
        />

        {/* Order Summary */}
        <div className="rounded-3xl border border-[#E3D7C5] bg-[#FFFDF9] p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-[#EFE5D5] pb-3">
            <h3 className="flex items-center gap-2 font-serif text-xl font-bold text-[#4A0B1E]">
              <ChefHat className="h-5 w-5 text-[#6B132E]" />
              Order Items ({order.items.length})
            </h3>
            <span className="text-xs text-[#73545E]">
              {new Date(order.createdAt).toLocaleTimeString('en-PK')}
            </span>
          </div>

          <div className="divide-y divide-[#F2E9DB]">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <span className="font-bold text-[#6B132E]">{item.quantity}x </span>
                  <span className="font-semibold text-[#2A0914]">{item.name}</span>
                </div>
                <span className="font-bold text-[#4A0B1E]">
                  {formatPKR(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="mt-3 rounded-xl bg-[#FAF6F0] p-3 text-xs text-[#6B4A54]">
              <strong>Notes:</strong> {order.notes}
            </div>
          )}
        </div>
      </main>

      <ThermalReceiptModal
        order={showReceipt ? order : null}
        onClose={() => setShowReceipt(false)}
      />
    </div>
  );
}
