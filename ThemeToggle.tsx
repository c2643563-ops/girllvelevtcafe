'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('velvet-theme');
    const isDark = saved === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('velvet-theme', next ? 'dark' : 'light');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="inline-flex items-center gap-1.5 rounded-xl border border-[#C9A227]/50 bg-[#FAF6F0] px-2.5 py-2 text-xs font-bold text-[#4A0B1E] shadow-sm hover:border-[#6B132E] hover:bg-[#EFE5D5] dark:border-[#C9A227]/40 dark:bg-[#240D15] dark:text-[#E8D28A] dark:hover:bg-[#35131F] transition"
    >
      {mounted && dark ? (
        <>
          <Sun className="h-3.5 w-3.5 text-[#E8D28A]" />
          {!compact && <span className="hidden sm:inline">Light</span>}
        </>
      ) : (
        <>
          <Moon className="h-3.5 w-3.5 text-[#6B132E] dark:text-[#E8D28A]" />
          {!compact && <span className="hidden sm:inline">Dark</span>}
        </>
      )}
    </button>
  );
}
