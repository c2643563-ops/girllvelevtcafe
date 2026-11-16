'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';

function StaffLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');

  const [email, setEmail] = useState('cashier@velvetcafe.pk');
  const [password, setPassword] = useState('Cashier@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickFill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      if (nextPath && nextPath.startsWith('/staff')) {
        router.replace(nextPath);
      } else if (data.user.role === 'KITCHEN') {
        router.replace('/staff/kitchen');
      } else if (data.user.role === 'CASHIER') {
        router.replace('/staff/cashier');
      } else {
        router.replace('/staff/owner');
      }
    } catch {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#16080D] via-[#3A0918] to-[#16080D] p-4 text-[#FAF6F0]">
      <div className="w-full max-w-md rounded-3xl border border-[#C9A227]/40 bg-[#1C0A10]/95 p-7 shadow-2xl backdrop-blur">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E8D28A] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Launcher Home
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#6B132E] px-2.5 py-0.5 text-[10px] font-bold text-[#E8D28A]">
            <ShieldCheck className="h-3 w-3" />
            JWT RBAC
          </span>
        </div>

        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6B132E] border border-[#C9A227]/60 shadow-lg">
            <Sparkles className="h-6 w-6 text-[#E8D28A]" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">Velvet Cafe &amp; Grill</h1>
          <p className="mt-1 text-xs text-[#D6C5CA]">Role-Based Staff Portal Sign In</p>
        </div>

        {/* Quick Demo Role Selectors */}
        <div className="mb-5 rounded-2xl border border-[#C9A227]/25 bg-black/30 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#C9A227]">
            Quick Demo Credentials (Click to Fill):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => quickFill('owner@velvetcafe.pk', 'Velvet@2026')}
              className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-[11px] font-semibold hover:border-[#C9A227] hover:bg-white/10"
            >
              Owner
            </button>
            <button
              type="button"
              onClick={() => quickFill('cashier@velvetcafe.pk', 'Cashier@2026')}
              className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-[11px] font-semibold hover:border-[#C9A227] hover:bg-white/10"
            >
              Cashier
            </button>
            <button
              type="button"
              onClick={() => quickFill('kitchen@velvetcafe.pk', 'Kitchen@2026')}
              className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-[11px] font-semibold hover:border-[#C9A227] hover:bg-white/10"
            >
              Kitchen
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#E8D28A]">Staff Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-[#C9A227] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#E8D28A]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white focus:border-[#C9A227] focus:outline-none"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-900/50 border border-red-400/40 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#E8D28A] py-3 text-sm font-bold text-[#2A0914] shadow-lg hover:opacity-95 disabled:opacity-60 transition"
          >
            <Lock className="h-4 w-4" />
            {loading ? 'Authenticating...' : 'Sign In to Staff Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#16080D]" />}>
      <StaffLoginContent />
    </Suspense>
  );
}
