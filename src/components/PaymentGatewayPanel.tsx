'use client';

import React, { useEffect, useState } from 'react';
import {
  Banknote,
  Building2,
  CheckCircle2,
  Copy,
  Lock,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import type { Order, PaymentMethod } from '@/lib/types';
import { formatPKR } from '@/lib/format';

interface PaymentGatewayPanelProps {
  order: Order;
  onPaymentComplete: (updatedOrder: Order) => void;
}

interface GatewayConfig {
  easypaisa: { mode: string; storeName: string };
  jazzcash: { mode: string; merchantName: string };
  raast: {
    bankName: string;
    accountTitle: string;
    iban: string;
    raastId: string;
  };
}

export function PaymentGatewayPanel({ order, onPaymentComplete }: PaymentGatewayPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>('EASYPAISA');
  const [phone, setPhone] = useState('03001234567');
  const [mpin, setMpin] = useState('1234');
  const [bankTid, setBankTid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<GatewayConfig | null>(null);

  useEffect(() => {
    fetch('/api/payments/gateway-config')
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .catch(() => {});
  }, []);

  const handleCopyIban = () => {
    const iban = config?.raast.iban || 'PK36MEZN0002140104829104';
    navigator.clipboard?.writeText(iban);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        orderId: order.id,
        method,
        source: 'CUSTOMER',
      };

      if (method === 'EASYPAISA' || method === 'JAZZCASH') {
        if (!/^03\d{9}$/.test(phone.replace(/[-\s]/g, ''))) {
          setError('Please enter a valid 11-digit Pakistani mobile number (e.g. 03001234567)');
          setLoading(false);
          return;
        }
        payload.accountOrPhone = phone.replace(/[-\s]/g, '');
      }

      if (method === 'BANK_TRANSFER') {
        if (!bankTid.trim()) {
          setError('Please enter your Bank / Raast Transaction Reference (TID) after transferring.');
          setLoading(false);
          return;
        }
        payload.referenceId = bankTid.trim();
        payload.accountOrPhone = config?.raast.bankName || 'Raast Bank Transfer';
      }

      const res = await fetch('/api/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Payment failed');
        setLoading(false);
        return;
      }

      onPaymentComplete(data.order);
    } catch {
      setError('Network error while connecting to payment gateway.');
    } finally {
      setLoading(false);
    }
  };

  if (order.paymentStatus === 'PAID') {
    return (
      <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50 p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-emerald-900">
          Payment Completed!
        </h3>
        <p className="mt-1 text-sm text-emerald-800">
          Table {order.tableNumber} • {formatPKR(order.total)} verified &amp; sent to Cashier POS with a green tick.
        </p>
        {order.paymentReference && (
          <p className="mt-2 inline-block rounded-lg bg-white px-3 py-1 font-mono text-xs font-semibold text-emerald-900 border border-emerald-200">
            Transaction Ref: {order.paymentReference}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#C9A227]/40 bg-[#FFFDF9] p-6 shadow-xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#E9DFD0] pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6B132E]/10 px-3 py-1 text-xs font-semibold text-[#6B132E]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Velvet Pay • Pakistani Payment Gateway
          </span>
          <h2 className="mt-2 font-serif text-2xl font-bold text-[#4A0B1E]">
            Complete Payment for Table {order.tableNumber}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-[#7B5A64]">Payable Amount</p>
          <p className="font-serif text-2xl font-bold text-[#6B132E]">{formatPKR(order.total)}</p>
        </div>
      </div>

      {/* 4 Payment Method Selector Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setMethod('EASYPAISA')}
          className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition ${
            method === 'EASYPAISA'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-md'
              : 'border-[#E6DAC8] bg-white text-[#4A0B1E] hover:border-emerald-300'
          }`}
        >
          <Smartphone className="h-6 w-6 text-emerald-600" />
          <span className="text-xs font-bold">Easypaisa</span>
          <span className="text-[10px] text-emerald-700">Instant Wallet</span>
        </button>

        <button
          type="button"
          onClick={() => setMethod('JAZZCASH')}
          className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition ${
            method === 'JAZZCASH'
              ? 'border-rose-700 bg-rose-50 text-rose-950 shadow-md'
              : 'border-[#E6DAC8] bg-white text-[#4A0B1E] hover:border-rose-300'
          }`}
        >
          <Smartphone className="h-6 w-6 text-rose-700" />
          <span className="text-xs font-bold">JazzCash</span>
          <span className="text-[10px] text-rose-800">Mobile Account</span>
        </button>

        <button
          type="button"
          onClick={() => setMethod('BANK_TRANSFER')}
          className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition ${
            method === 'BANK_TRANSFER'
              ? 'border-[#6B132E] bg-[#6B132E]/10 text-[#4A0B1E] shadow-md'
              : 'border-[#E6DAC8] bg-white text-[#4A0B1E] hover:border-[#C9A227]'
          }`}
        >
          <Building2 className="h-6 w-6 text-[#6B132E]" />
          <span className="text-xs font-bold">Bank / Raast</span>
          <span className="text-[10px] text-[#7B5A64]">IBAN Instant</span>
        </button>

        <button
          type="button"
          onClick={() => setMethod('CASH')}
          className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition ${
            method === 'CASH'
              ? 'border-[#C9A227] bg-[#FAF6F0] text-[#4A0B1E] shadow-md'
              : 'border-[#E6DAC8] bg-white text-[#4A0B1E] hover:border-[#C9A227]'
          }`}
        >
          <Banknote className="h-6 w-6 text-[#A37B12]" />
          <span className="text-xs font-bold">Cash on Counter</span>
          <span className="text-[10px] text-[#7B5A64]">Pay Cashier</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {(method === 'EASYPAISA' || method === 'JAZZCASH') && (
          <div className="rounded-2xl border border-[#E6DAC8] bg-[#FAF6F0] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#4A0B1E]">
                {method === 'EASYPAISA' ? 'Easypaisa Mobile Account Checkout' : 'JazzCash Mobile Account Checkout'}
              </p>
              <span className="rounded-full bg-[#C9A227]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#785907]">
                {method === 'EASYPAISA'
                  ? config?.easypaisa.mode || 'SANDBOX'
                  : config?.jazzcash.mode || 'SANDBOX'}{' '}
                READY
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5C3A45]">
                  Mobile Number (03XXXXXXXXX)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full rounded-xl border border-[#D8CCBA] bg-white px-3 py-2.5 text-sm font-medium text-[#2A0914] focus:border-[#6B132E] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5C3A45]">
                  MPIN / Sandbox OTP
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value)}
                  placeholder="1234"
                  className="w-full rounded-xl border border-[#D8CCBA] bg-white px-3 py-2.5 text-sm font-medium text-[#2A0914] focus:border-[#6B132E] focus:outline-none"
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-[#7B5A64]">
              When completed, Cashier POS immediately receives a green payment tick for Table {order.tableNumber}.
            </p>
          </div>
        )}

        {method === 'BANK_TRANSFER' && (
          <div className="rounded-2xl border border-[#E6DAC8] bg-[#FAF6F0] p-4 space-y-3">
            <p className="text-sm font-bold text-[#4A0B1E]">
              Raast / Bank Transfer Details
            </p>
            <div className="rounded-xl bg-white p-3 border border-[#E2D6C3] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#7B5A64]">Bank Name:</span>
                <span className="font-bold text-[#4A0B1E]">{config?.raast.bankName || 'Meezan Bank'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7B5A64]">Account Title:</span>
                <span className="font-bold text-[#4A0B1E]">{config?.raast.accountTitle || 'Velvet Cafe & Grill'}</span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-[#E2D6C3]">
                <div>
                  <span className="text-[#7B5A64] block">IBAN / Raast:</span>
                  <span className="font-mono font-bold text-[#6B132E]">
                    {config?.raast.iban || 'PK36MEZN0002140104829104'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyIban}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#6B132E] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-[#4A0B1E]"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? 'Copied!' : 'Copy IBAN'}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#5C3A45]">
                Enter Transaction Reference / TID
              </label>
              <input
                type="text"
                value={bankTid}
                onChange={(e) => setBankTid(e.target.value)}
                placeholder="e.g. RAAST-883412 or IBFT-9042"
                className="w-full rounded-xl border border-[#D8CCBA] bg-white px-3 py-2.5 text-sm font-medium text-[#2A0914] focus:border-[#6B132E] focus:outline-none"
                required
              />
            </div>
          </div>
        )}

        {method === 'CASH' && (
          <div className="rounded-2xl border border-[#C9A227]/40 bg-[#FAF6F0] p-4 space-y-2">
            <p className="text-sm font-bold text-[#4A0B1E]">
              Cash on Counter (Table {order.tableNumber})
            </p>
            <p className="text-xs text-[#6B4A54]">
              Click below to alert the Cashier that you are paying{' '}
              <strong>{formatPKR(order.total)}</strong> in cash at the counter. As soon as the
              cashier receives your cash, your table turns green on the live POS!
            </p>
            {order.paymentStatus === 'PENDING_VERIFICATION' && (
              <div className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900">
                Cash request sent to Cashier Counter! Please pay {formatPKR(order.total)} at the desk.
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6B132E] px-5 py-3.5 text-sm font-bold text-[#FFFDF9] shadow-lg hover:bg-[#4A0B1E] disabled:opacity-60 transition"
        >
          {loading ? (
            <span>Processing Payment...</span>
          ) : method === 'CASH' ? (
            <>
              <Banknote className="h-4 w-4 text-[#E8D28A]" />
              <span>Notify Cashier — Pay Cash on Counter ({formatPKR(order.total)})</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 text-[#E8D28A]" />
              <span>
                Pay {formatPKR(order.total)} via{' '}
                {method === 'EASYPAISA'
                  ? 'Easypaisa'
                  : method === 'JAZZCASH'
                  ? 'JazzCash'
                  : 'Bank / Raast'}
              </span>
              <Sparkles className="h-4 w-4 text-[#E8D28A]" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
