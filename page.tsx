'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  ChefHat,
  CreditCard,
  Flame,
  LayoutDashboard,
  Package,
  QrCode,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [health, setHealth] = useState<{
    supabaseEnabled: boolean;
    paymentMode: string;
    ordersCount: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#2A0914] dark:bg-[#12060A] dark:text-[#FAF6F0] transition-colors">
      {/* Luxury Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[#C9A227]/25 bg-[#FFFDF9]/90 backdrop-blur dark:bg-[#16080D]/90 dark:border-[#C9A227]/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6B132E] text-[#E8D28A] shadow-md border border-[#C9A227]/50">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-[#4A0B1E] dark:text-[#FFFDF9]">
                Velvet Cafe &amp; Grill
              </span>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#9A7418] dark:text-[#C9A227]">
                Artisan Charcoal &amp; Espresso
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/menu?table=${selectedTable}`}
              className="rounded-xl bg-[#6B132E] px-4 py-2 text-xs font-bold text-[#FFFDF9] shadow hover:bg-[#4A0B1E] transition sm:text-sm"
            >
              Order Now
            </Link>
            <Link
              href="/staff/login"
              className="rounded-xl border border-[#C9A227]/60 bg-[#FAF6F0] px-4 py-2 text-xs font-bold text-[#4A0B1E] hover:bg-[#EFE5D5] dark:bg-[#240D15] dark:text-[#E8D28A] dark:hover:bg-[#35131F] transition sm:text-sm"
            >
              Staff Portal
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#C9A227]/20 bg-gradient-to-br from-[#4A0B1E] via-[#6B132E] to-[#2B0611] text-[#FFFDF9]">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top_right,#E8D28A,transparent_55%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:items-center lg:py-20">
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E8D28A]/40 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#E8D28A]">
              <Flame className="h-3.5 w-3.5" />
              Welcome to Velvet Cafe &amp; Grill
            </span>
            <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Velvet Elegance, <span className="text-[#E8D28A]">Charcoal Perfection.</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[#F2E5DF] sm:text-base">
              Scan your table&apos;s QR code to browse our signature charcoal steaks, smashed brioche burgers,
              artisan pasta, and Kashmiri saffron chai. Pay effortlessly with{' '}
              <strong className="text-[#E8D28A]">Easypaisa, JazzCash, Raast Bank Transfer, or Cash</strong>{' '}
              with real-time kitchen &amp; cashier sync.
            </p>

            {/* Quick Table Picker */}
            <div className="rounded-2xl border border-[#E8D28A]/30 bg-black/25 p-4 backdrop-blur-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-[#E8D28A] mb-3">
                Select Your Dining Table (1 – 15) to Open QR Menu:
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 15 }, (_, idx) => idx + 1).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTable(t)}
                    className={`h-9 w-11 rounded-lg text-xs font-bold transition ${
                      selectedTable === t
                        ? 'bg-[#C9A227] text-[#2A0914] shadow-lg'
                        : 'bg-white/10 text-[#FAF6F0] hover:bg-white/20'
                    }`}
                  >
                    T{t}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/menu?table=${selectedTable}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#C9A227] px-5 py-3 text-sm font-bold text-[#2A0914] shadow-lg hover:bg-[#E8D28A] transition"
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  Open Table {selectedTable} Menu
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/staff/qr-codes"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E8D28A]/50 bg-white/10 px-5 py-3 text-sm font-semibold text-[#FFFDF9] hover:bg-white/20 transition"
                >
                  <QrCode className="h-4 w-4 text-[#E8D28A]" />
                  View All 15 QR Codes
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Live Website Launcher Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-[#C9A227]/40 bg-[#16080D]/95 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C9A227]">
                    Live System Launcher
                  </p>
                  <h2 className="font-serif text-xl font-bold text-white mt-0.5">
                    Velvet Control Center
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>

              <div className="grid gap-2.5">
                <Link
                  href="/staff/cashier"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:border-[#C9A227]/50 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-[#E8D28A]" />
                    <div>
                      <p className="text-sm font-bold text-white">Cashier POS (15 Tables)</p>
                      <p className="text-[11px] text-[#CBB7BE]">Green payment ticks &amp; 80mm thermal receipts</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#C9A227]" />
                </Link>

                <Link
                  href="/staff/kitchen"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:border-[#C9A227]/50 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-3">
                    <ChefHat className="h-5 w-5 text-[#E8D28A]" />
                    <div>
                      <p className="text-sm font-bold text-white">Kitchen Display (KDS)</p>
                      <p className="text-[11px] text-[#CBB7BE]">Live incoming grill &amp; cafe tickets</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#C9A227]" />
                </Link>

                <Link
                  href="/staff/inventory"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:border-[#C9A227]/50 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-[#E8D28A]" />
                    <div>
                      <p className="text-sm font-bold text-white">Inventory &amp; Expenses</p>
                      <p className="text-[11px] text-[#CBB7BE]">Burger boxes, cups, straws, tissues (25-pc alerts)</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#C9A227]" />
                </Link>

                <Link
                  href="/staff/qr-codes"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:border-[#C9A227]/50 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-3">
                    <QrCode className="h-5 w-5 text-[#E8D28A]" />
                    <div>
                      <p className="text-sm font-bold text-white">15 Table QR Code Studio</p>
                      <p className="text-[11px] text-[#CBB7BE]">Scan from phone &amp; print table tents</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#C9A227]" />
                </Link>

                <Link
                  href="/staff/owner"
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:border-[#C9A227]/50 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="h-5 w-5 text-[#E8D28A]" />
                    <div>
                      <p className="text-sm font-bold text-white">Owner Mobile Dashboard</p>
                      <p className="text-[11px] text-[#CBB7BE]">Revenue, net profit &amp; live KPIs</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#C9A227]" />
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] text-[#D8C7CE]">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  JWT RBAC Active
                </span>
                <span>
                  DB: {health?.supabaseEnabled ? 'Supabase Live' : 'Local Engine Ready'}
                </span>
                <span>Gateways: {health?.paymentMode || 'SANDBOX_DEMO'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#9A7418] dark:text-[#C9A227]">
            End-to-End Hospitality Suite
          </p>
          <h2 className="mt-1 font-serif text-3xl font-bold text-[#4A0B1E] dark:text-[#FFFDF9]">
            Built for Seamless Table-to-Cashier Flow
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: '1. Scan Table QR',
              desc: 'Each of the 15 tables has a unique scannable QR code opening /menu?table=X on any smartphone.',
            },
            {
              title: '2. Live Kitchen Sync',
              desc: 'Orders appear instantly on Kitchen Display & Cashier POS via Socket.IO + Supabase sync.',
            },
            {
              title: '3. Pakistani Payments',
              desc: 'Pay via Easypaisa, JazzCash, Bank Transfer / Raast IBAN, or Cash on Counter.',
            },
            {
              title: '4. Cashier Green Tick ✓',
              desc: 'Completed payments flash green on the Cashier table map with 80mm thermal receipts.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[#E3D7C5] bg-[#FFFDF9] p-5 shadow-sm dark:border-[#C9A227]/25 dark:bg-[#1B0A10]"
            >
              <CheckCircle2 className="h-6 w-6 text-[#6B132E] dark:text-[#E8D28A] mb-3" />
              <h3 className="font-serif text-lg font-bold text-[#4A0B1E] dark:text-[#FFFDF9]">{card.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#6E4F59] dark:text-[#D9C7CD]">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
