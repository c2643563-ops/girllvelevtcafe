'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, ExternalLink, Printer, RefreshCw, Sparkles } from 'lucide-react';
import { StaffShell } from '@/components/StaffShell';

interface QrTableCard {
  tableNumber: number;
  label: string;
  url: string;
  dataUrl: string;
  pngPath: string;
}

export default function QrCodesStudioPage() {
  const [baseUrl, setBaseUrl] = useState('');
  const [tables, setTables] = useState<QrTableCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchQrs = useCallback(async (targetBase: string, saveFiles = false) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (targetBase) params.set('baseUrl', targetBase);
    if (saveFiles) params.set('save', '1');
    const res = await fetch(`/api/qr?${params.toString()}`);
    const data = await res.json();
    setTables(data.tables || []);
    if (!targetBase && data.baseUrl) {
      setBaseUrl(data.baseUrl);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    setBaseUrl(origin);
    void fetchQrs(origin, true);
  }, [fetchQrs]);

  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetchQrs(baseUrl, true);
    setSaving(false);
  };

  return (
    <StaffShell
      title="15-Table QR Code Studio"
      subtitle="Scan any QR code with your phone to open that table's live ordering menu"
      allowedRoles={['OWNER', 'CASHIER']}
    >
      {/* Controls */}
      <div className="no-print mb-6 rounded-3xl border border-[#C9A227]/40 bg-[#FFFDF9] p-5 shadow-sm dark:border-[#C9A227]/30 dark:bg-[#1B0A10]">
        <form onSubmit={handleRegenerate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-bold text-[#4A0B1E] dark:text-[#E8D28A]">
              Live Website / Server Base URL (Auto-detected for Smartphone Scanning)
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://your-live-domain.com"
              className="w-full rounded-xl border border-[#D8CCBA] bg-white px-3.5 py-2.5 text-sm font-medium text-[#2A0914] focus:border-[#6B132E] focus:outline-none dark:border-[#C9A227]/30 dark:bg-[#12060A] dark:text-[#FAF6F0]"
            />
            <p className="mt-1 text-[11px] text-[#73545E] dark:text-[#D9C7CD]">
              Tip: When opened in Arena Live Preview, this auto-uses your live HTTPS preview URL so scanning with a phone opens the live menu immediately!
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6B132E] px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-[#4A0B1E]"
          >
            <RefreshCw className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
            Regenerate &amp; Save All 15 PNGs
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-4 py-2.5 text-xs font-bold text-[#2A0914] shadow hover:bg-[#E8D28A]"
          >
            <Printer className="h-4 w-4" />
            Print All 15 Cards
          </button>
        </form>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
            <div key={n} className="h-64 animate-pulse rounded-2xl bg-[#EFE5D5]" />
          ))}
        </div>
      ) : (
        <div className="qr-print-grid grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {tables.map((card) => (
            <div
              key={card.tableNumber}
              className="qr-print-card flex flex-col items-center rounded-3xl border-2 border-[#C9A227]/60 bg-[#FFFDF9] p-4 text-center shadow-sm dark:bg-[#1B0A10]"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A7418] dark:text-[#C9A227]">
                <Sparkles className="h-3 w-3 text-[#6B132E] dark:text-[#E8D28A]" />
                Velvet Cafe &amp; Grill
              </div>
              <h3 className="mt-1 font-serif text-xl font-bold text-[#4A0B1E] dark:text-[#FFFDF9]">
                Table {card.tableNumber}
              </h3>

              <div className="my-3 rounded-2xl border border-[#E6DAC8] bg-white p-2 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.dataUrl}
                  alt={`QR Code for Table ${card.tableNumber}`}
                  className="h-40 w-40 object-contain"
                />
              </div>

              <p className="text-[11px] font-semibold text-[#6B132E] dark:text-[#E8D28A]">Scan to Order &amp; Pay</p>
              <p className="mt-1 w-full truncate text-[9px] font-mono text-[#73545E] dark:text-[#D9C7CD]" title={card.url}>
                {card.url}
              </p>

              <div className="no-print mt-3 flex w-full gap-2">
                <a
                  href={card.dataUrl}
                  download={`velvet-table-${card.tableNumber}-qr.png`}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-[#D8CCBA] bg-[#FAF6F0] py-1.5 text-[11px] font-bold text-[#4A0B1E] hover:border-[#6B132E]"
                >
                  <Download className="h-3 w-3" />
                  PNG
                </a>
                <Link
                  href={`/menu?table=${card.tableNumber}`}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#6B132E] py-1.5 text-[11px] font-bold text-white hover:bg-[#4A0B1E]"
                >
                  <ExternalLink className="h-3 w-3" />
                  Test
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </StaffShell>
  );
}
