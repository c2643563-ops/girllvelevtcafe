'use client';

import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import type { Order } from '@/lib/types';
import { formatPKR, formatPaymentMethod } from '@/lib/format';

interface ThermalReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export function ThermalReceiptModal({ order, onClose }: ThermalReceiptModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-[#FFFDF9] p-6 shadow-2xl border border-[#C9A227]/40">
        <div className="no-print mb-4 flex items-center justify-between border-b border-[#E8DFD1] pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#4A0B1E]">
              80mm Thermal POS Receipt
            </h3>
            <p className="text-xs text-[#6B4A54]">Ready for thermal printer or PDF save</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6B4A54] hover:bg-[#FAF6F0]"
            aria-label="Close receipt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Actual 80mm Receipt Area */}
        <div className="thermal-receipt-print mx-auto max-w-[300px] rounded-lg border border-dashed border-[#C9A227] bg-white p-4 font-mono text-xs text-neutral-900 shadow-inner">
          <div className="text-center border-b border-dashed border-neutral-400 pb-3 mb-3">
            <p className="text-base font-bold tracking-wide uppercase">VELVET CAFE &amp; GRILL</p>
            <p className="text-[11px] text-neutral-600">Artisan Charcoal Grill &amp; Specialty Coffee</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">Tel: +92 300 1234567</p>
          </div>

          <div className="space-y-1 border-b border-dashed border-neutral-400 pb-2 mb-2 text-[11px]">
            <div className="flex justify-between">
              <span>Order #:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Table:</span>
              <span className="font-bold">Table {order.tableNumber} ({order.orderType})</span>
            </div>
            <div className="flex justify-between">
              <span>Guest:</span>
              <span>{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(order.createdAt).toLocaleString('en-PK')}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-neutral-400 pb-2 mb-2">
            <div className="flex justify-between font-bold text-[11px] mb-1">
              <span>ITEM</span>
              <span>TOTAL</span>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between py-0.5 text-[11px]">
                <span className="pr-2">
                  {item.quantity}x {item.name}
                </span>
                <span className="shrink-0">{formatPKR(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 border-b border-dashed border-neutral-400 pb-2 mb-2 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPKR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST / Tax</span>
              <span>{formatPKR(order.tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1">
              <span>GRAND TOTAL</span>
              <span>{formatPKR(order.total)}</span>
            </div>
          </div>

          <div className="text-center space-y-1 text-[11px]">
            <div className="inline-flex items-center gap-1 rounded px-2 py-0.5 font-bold uppercase border border-neutral-700">
              {order.paymentStatus === 'PAID' ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                  <span>PAID — {formatPaymentMethod(order.paymentMethod)}</span>
                </>
              ) : (
                <span>PAYMENT: {order.paymentStatus}</span>
              )}
            </div>
            {order.paymentReference && (
              <p className="text-[10px] text-neutral-600">Ref: {order.paymentReference}</p>
            )}
            <p className="pt-2 text-[11px] font-semibold">Thank you for dining at Velvet Cafe &amp; Grill!</p>
            <p className="text-[10px] text-neutral-500">Powered by Velvet POS</p>
          </div>
        </div>

        <div className="no-print mt-5 flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6B132E] px-4 py-2.5 text-sm font-semibold text-[#FFFDF9] shadow hover:bg-[#4A0B1E] transition"
          >
            <Printer className="h-4 w-4" />
            Print 80mm Receipt
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-[#D8CCBA] px-4 py-2.5 text-sm font-semibold text-[#4A0B1E] hover:bg-[#FAF6F0] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
