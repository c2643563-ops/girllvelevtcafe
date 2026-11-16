'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChefHat,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  QrCode,
  Sparkles,
  Store,
  Wifi,
  X,
} from 'lucide-react';
import { getSocket } from '@/lib/socket-client';
import type { StaffRole } from '@/lib/types';
import { ThemeToggle } from './ThemeToggle';

interface StaffUserInfo {
  userId: string;
  name: string;
  email: string;
  role: StaffRole;
}

interface StaffShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  allowedRoles?: StaffRole[];
}

export function StaffShell({ children, title, subtitle, allowedRoles }: StaffShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<StaffUserInfo | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [connected, setConnected] = useState(false);
  const [supabaseOn, setSupabaseOn] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) {
          router.replace(`/staff/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        const data = await res.json();
        if (!data.user) {
          router.replace(`/staff/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        if (allowedRoles && !allowedRoles.includes(data.user.role)) {
          // Redirect to their default workspace
          if (data.user.role === 'KITCHEN') router.replace('/staff/kitchen');
          else if (data.user.role === 'CASHIER') router.replace('/staff/cashier');
          else router.replace('/staff/owner');
          return;
        }
        setUser(data.user);
        setAuthChecked(true);
      })
      .catch(() => {
        router.replace('/staff/login');
      });

    fetch('/api/health')
      .then((r) => r.json())
      .then((h) => setSupabaseOn(Boolean(h.supabaseEnabled)))
      .catch(() => {});

    const socket = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    setConnected(socket.connected);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [pathname, router, allowedRoles]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/staff/login');
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16080D] text-[#FAF6F0]">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#C9A227] border-t-transparent" />
          <p className="font-serif text-lg tracking-wide text-[#E8D28A]">
            Velvet Cafe &amp; Grill Staff Portal...
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      href: '/staff/cashier',
      label: 'Cashier POS',
      icon: CreditCard,
      roles: ['OWNER', 'CASHIER'] as StaffRole[],
    },
    {
      href: '/staff/kitchen',
      label: 'Kitchen Display (KDS)',
      icon: ChefHat,
      roles: ['OWNER', 'CASHIER', 'KITCHEN'] as StaffRole[],
    },
    {
      href: '/staff/inventory',
      label: 'Inventory & Expenses',
      icon: Package,
      roles: ['OWNER', 'CASHIER', 'KITCHEN'] as StaffRole[],
    },
    {
      href: '/staff/qr-codes',
      label: '15 Table QR Codes',
      icon: QrCode,
      roles: ['OWNER', 'CASHIER'] as StaffRole[],
    },
    {
      href: '/staff/owner',
      label: 'Owner Dashboard',
      icon: LayoutDashboard,
      roles: ['OWNER'] as StaffRole[],
    },
  ].filter((item) => !user || item.roles.includes(user.role));

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#16080D] text-[#FAF6F0] p-5 border-r border-[#C9A227]/20">
      <div>
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 pb-6 border-b border-[#C9A227]/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6B132E] to-[#4A0B1E] border border-[#C9A227]/50 shadow-lg">
            <Sparkles className="h-5 w-5 text-[#E8D28A]" />
          </div>
          <div>
            <p className="font-serif text-base font-bold leading-tight text-[#FFFDF9]">
              Velvet Cafe &amp; Grill
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#C9A227]">
              Staff Command
            </p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="mt-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-gradient-to-r from-[#6B132E] to-[#8C1D3F] text-[#FFFDF9] shadow-md border border-[#C9A227]/40'
                    : 'text-[#D6C5CA] hover:bg-white/5 hover:text-[#FFFDF9]'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-[#E8D28A]' : 'text-[#C9A227]/80'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 pt-5 border-t border-[#C9A227]/15">
          <Link
            href="/menu?table=1"
            className="flex items-center gap-2.5 rounded-xl border border-[#C9A227]/30 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-[#E8D28A] hover:bg-white/10 transition"
          >
            <Store className="h-4 w-4" />
            <span>Open Customer Menu (Table 1)</span>
          </Link>
        </div>
      </div>

      {/* Footer status & user */}
      <div className="space-y-3 pt-5 border-t border-[#C9A227]/20">
        <div className="flex items-center justify-between rounded-xl bg-black/30 px-3 py-2 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Wifi className={`h-3.5 w-3.5 ${connected ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{connected ? 'Socket.IO Live' : 'Reconnecting...'}</span>
          </span>
          <span className="rounded bg-[#6B132E] px-1.5 py-0.5 text-[10px] text-[#E8D28A]">
            {supabaseOn ? 'Supabase' : 'Local DB'}
          </span>
        </div>

        {user && (
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-xs font-bold text-[#FFFDF9] truncate">{user.name}</p>
            <p className="text-[11px] text-[#C9A227] font-semibold uppercase tracking-wider mt-0.5">
              Role: {user.role}
            </p>
            <button
              onClick={handleLogout}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 py-1.5 text-xs font-medium text-[#EBDCE0] hover:bg-red-900/40 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#FAF6F0] dark:bg-[#12060A] transition-colors">
      {/* Desktop Dark Sidebar */}
      <aside className="no-print hidden w-64 shrink-0 lg:block">{sidebarContent}</aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div className="w-72">{sidebarContent}</div>
          <div
            className="flex-1 bg-black/60"
            onClick={() => setMobileNavOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-[#E5DAC8] bg-[#FFFDF9]/95 px-4 py-3.5 backdrop-blur dark:border-[#C9A227]/20 dark:bg-[#16080D]/95 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="rounded-xl border border-[#D8CCBA] p-2 text-[#4A0B1E] dark:border-[#C9A227]/30 dark:text-[#E8D28A] lg:hidden"
              aria-label="Toggle Menu"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <h1 className="font-serif text-xl font-bold text-[#4A0B1E] dark:text-[#FFFDF9] sm:text-2xl">{title}</h1>
              {subtitle && <p className="text-xs text-[#73545E] dark:text-[#D6C5CA]">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#D8CCBA] bg-[#FAF6F0] px-3 py-1.5 text-xs font-semibold text-[#4A0B1E] hover:border-[#6B132E] dark:border-[#C9A227]/30 dark:bg-[#240D15] dark:text-[#E8D28A] transition"
            >
              Launcher Home
            </Link>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                connected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/50'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {connected ? 'Live Sync' : 'Syncing'}
            </span>
            <ThemeToggle compact />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
