'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChefHat,
  Clock,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  X,
  ArrowRight,
} from 'lucide-react';
import type { MenuItem, OrderType } from '@/lib/types';
import { formatPKR } from '@/lib/format';

interface CartEntry {
  item: MenuItem;
  quantity: number;
  notes: string;
}

function MenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTable = Math.min(15, Math.max(1, parseInt(searchParams.get('table') || '1', 10) || 1));
  const [tableNumber, setTableNumber] = useState<number>(initialTable);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = parseInt(searchParams.get('table') || '', 10);
    if (!Number.isNaN(t) && t >= 1 && t <= 15) {
      setTableNumber(t);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/menu')
      .then((r) => r.json())
      .then((data) => {
        setMenu((data.items || []).filter((i: MenuItem) => i.isAvailable));
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menu.map((m) => m.category)));
    return ['All', ...cats];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    return menu.filter((item) => {
      const catMatch = activeCategory === 'All' || item.category === activeCategory;
      const q = search.trim().toLowerCase();
      const textMatch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [menu, activeCategory, search]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.item.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { item, quantity: 1, notes: '' }];
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.item.id === itemId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const getQty = (itemId: string) => cart.find((c) => c.item.id === itemId)?.quantity || 0;

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.item.price * c.quantity, 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          customerName: customerName.trim() || `Table ${tableNumber} Guest`,
          customerPhone: customerPhone.trim() || undefined,
          orderType,
          notes: orderNotes.trim() || undefined,
          items: cart.map((c) => ({
            menuItemId: c.item.id,
            name: c.item.name,
            price: c.item.price,
            quantity: c.quantity,
            notes: c.notes || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not place order');
        setSubmitting(false);
        return;
      }
      setCart([]);
      setCartOpen(false);
      router.push(`/order/${data.order.id}`);
    } catch {
      setError('Network error while placing order');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] pb-28 text-[#2A0914]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#C9A227]/30 bg-[#FFFDF9]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6B132E] text-[#E8D28A] shadow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-[#4A0B1E] sm:text-xl">
                Velvet Cafe &amp; Grill
              </h1>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9A7418]">
                QR Table Ordering
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <label className="hidden text-xs font-semibold text-[#6B4A54] sm:inline">
              Table:
            </label>
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(Number(e.target.value))}
              className="rounded-xl border border-[#C9A227]/60 bg-[#FAF6F0] px-3 py-2 text-xs font-bold text-[#4A0B1E] focus:outline-none"
            >
              {Array.from({ length: 15 }, (_, idx) => idx + 1).map((t) => (
                <option key={t} value={t}>
                  Table {t}
                </option>
              ))}
            </select>

            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 rounded-xl bg-[#6B132E] px-3.5 py-2 text-xs font-bold text-[#FFFDF9] shadow hover:bg-[#4A0B1E] transition"
            >
              <ShoppingBag className="h-4 w-4 text-[#E8D28A]" />
              <span>{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Elegant Table Banner */}
      <div className="bg-gradient-to-r from-[#4A0B1E] via-[#6B132E] to-[#4A0B1E] px-4 py-6 text-[#FFFDF9]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C9A227] px-3 py-0.5 text-[11px] font-bold text-[#2A0914]">
              <UtensilsCrossed className="h-3 w-3" />
              DINE-IN • TABLE {tableNumber}
            </span>
            <h2 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">
              Curated Charcoal Grill &amp; Cafe Menu
            </h2>
            <p className="mt-1 text-xs text-[#EEDFD9] sm:text-sm">
              Order straight from your table — track kitchen progress live &amp; pay with Easypaisa, JazzCash, Bank or Cash.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A227]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search steaks, burgers, chai..."
              className="w-full rounded-xl border border-[#E8D28A]/40 bg-white/10 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-[#D9C1C8] focus:bg-white/15 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="sticky top-[65px] z-20 border-b border-[#E7DCCB] bg-[#FAF6F0]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                activeCategory === cat
                  ? 'bg-[#6B132E] text-[#FFFDF9] shadow'
                  : 'border border-[#D8CCBA] bg-white text-[#4A0B1E] hover:border-[#6B132E]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-48 animate-pulse rounded-2xl bg-[#EFE5D5]" />
            ))}
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="rounded-2xl border border-[#E3D7C5] bg-white p-10 text-center">
            <p className="font-serif text-xl font-bold text-[#4A0B1E]">No dishes match your search</p>
            <p className="mt-1 text-xs text-[#73545E]">Try clearing your search or selecting All categories.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMenu.map((item) => {
              const qty = getQty(item.id);
              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#E3D7C5] bg-[#FFFDF9] p-5 shadow-sm hover:border-[#C9A227] hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full bg-[#FAF6F0] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9A7418] border border-[#E6DAC8]">
                        {item.category}
                      </span>
                      {item.tag && (
                        <span className="rounded-full bg-[#6B132E]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#6B132E]">
                          {item.tag}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 font-serif text-xl font-bold text-[#4A0B1E] leading-snug">
                      {item.name}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#6E4F59]">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#F0E7D8] pt-3.5">
                    <div>
                      <p className="font-serif text-lg font-bold text-[#6B132E]">
                        {formatPKR(item.price)}
                      </p>
                      <p className="flex items-center gap-1 text-[10px] text-[#8B6A75]">
                        <Clock className="h-3 w-3" /> {item.prepMinutes} mins
                      </p>
                    </div>

                    {qty === 0 ? (
                      <button
                        onClick={() => addToCart(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#6B132E] px-4 py-2 text-xs font-bold text-[#FFFDF9] shadow hover:bg-[#4A0B1E] transition"
                      >
                        <Plus className="h-3.5 w-3.5 text-[#E8D28A]" />
                        Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-[#6B132E] bg-[#FAF6F0] p-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#4A0B1E] shadow-sm hover:bg-[#6B132E] hover:text-white transition"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[20px] text-center text-xs font-bold text-[#4A0B1E]">
                          {qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6B132E] text-white shadow-sm hover:bg-[#4A0B1E] transition"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-4 left-0 right-0 z-30 px-4">
          <div className="mx-auto flex max-w-xl items-center justify-between rounded-2xl border border-[#C9A227]/60 bg-[#4A0B1E] px-5 py-3.5 text-[#FFFDF9] shadow-2xl">
            <div>
              <p className="text-xs text-[#E8D28A] font-semibold">
                Table {tableNumber} • {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </p>
              <p className="font-serif text-lg font-bold">{formatPKR(cartTotal)}</p>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#C9A227] px-5 py-2.5 text-sm font-bold text-[#2A0914] shadow hover:bg-[#E8D28A] transition"
            >
              View Cart &amp; Order
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-over Cart & Checkout Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-md flex-col bg-[#FFFDF9] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5DAC8] bg-[#4A0B1E] px-5 py-4 text-[#FFFDF9]">
              <div>
                <h3 className="font-serif text-xl font-bold">Your Velvet Order</h3>
                <p className="text-xs text-[#E8D28A]">Table {tableNumber} • Velvet Cafe &amp; Grill</p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-lg p-1.5 text-[#E8D28A] hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <p className="py-12 text-center text-sm text-[#73545E]">
                    Your cart is empty. Add signature dishes from the menu!
                  </p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {cart.map((entry) => (
                        <div
                          key={entry.item.id}
                          className="flex items-center justify-between rounded-xl border border-[#E6DAC8] bg-[#FAF6F0] p-3"
                        >
                          <div className="pr-3">
                            <p className="text-sm font-bold text-[#4A0B1E]">{entry.item.name}</p>
                            <p className="text-xs text-[#73545E]">
                              {formatPKR(entry.item.price)} each
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQty(entry.item.id, -1)}
                              className="h-7 w-7 rounded-lg border border-[#D8CCBA] bg-white text-xs font-bold text-[#4A0B1E]"
                            >
                              -
                            </button>
                            <span className="w-5 text-center text-xs font-bold">{entry.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(entry.item.id, 1)}
                              className="h-7 w-7 rounded-lg bg-[#6B132E] text-xs font-bold text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 border-t border-[#E6DAC8] pt-4">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setOrderType('DINE_IN')}
                          className={`rounded-xl border py-2 text-xs font-bold transition ${
                            orderType === 'DINE_IN'
                              ? 'border-[#6B132E] bg-[#6B132E] text-white'
                              : 'border-[#D8CCBA] bg-white text-[#4A0B1E]'
                          }`}
                        >
                          Dine-In (Table {tableNumber})
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderType('TAKEAWAY')}
                          className={`rounded-xl border py-2 text-xs font-bold transition ${
                            orderType === 'TAKEAWAY'
                              ? 'border-[#6B132E] bg-[#6B132E] text-white'
                              : 'border-[#D8CCBA] bg-white text-[#4A0B1E]'
                          }`}
                        >
                          Takeaway Bag
                        </button>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#5C3A45]">
                          Your Name (optional)
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder={`Table ${tableNumber} Guest`}
                          className="w-full rounded-xl border border-[#D8CCBA] bg-white px-3 py-2 text-sm focus:border-[#6B132E] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#5C3A45]">
                          Phone (optional)
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="0300-1234567"
                          className="w-full rounded-xl border border-[#D8CCBA] bg-white px-3 py-2 text-sm focus:border-[#6B132E] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#5C3A45]">
                          Kitchen Special Instructions
                        </label>
                        <textarea
                          rows={2}
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          placeholder="e.g., Medium-well steak, extra garlic sauce..."
                          className="w-full rounded-xl border border-[#D8CCBA] bg-white px-3 py-2 text-sm focus:border-[#6B132E] focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                    {error}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-[#E5DAC8] bg-[#FAF6F0] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#6B4A54]">Order Total</span>
                    <span className="font-serif text-2xl font-bold text-[#6B132E]">
                      {formatPKR(cartTotal)}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6B132E] py-3.5 text-sm font-bold text-[#FFFDF9] shadow-lg hover:bg-[#4A0B1E] disabled:opacity-60 transition"
                  >
                    <ChefHat className="h-4 w-4 text-[#E8D28A]" />
                    {submitting ? 'Sending to Kitchen...' : 'Place Order & Proceed to Payment'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0] text-[#4A0B1E]">
          Loading Velvet Cafe &amp; Grill Menu...
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
