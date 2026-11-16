import { NextResponse } from 'next/server';
import { ensureSupabaseHydrated } from '@/lib/db';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = await ensureSupabaseHydrated();
  return NextResponse.json({
    ok: true,
    brand: 'Velvet Cafe & Grill',
    tablesCount: db.tables.length,
    ordersCount: db.orders.length,
    supabaseEnabled: isSupabaseConfigured(),
    paymentMode:
      process.env.EASYPAISA_STORE_ID || process.env.JAZZCASH_MERCHANT_ID
        ? 'PRODUCTION'
        : 'SANDBOX_DEMO',
    timestamp: new Date().toISOString(),
  });
}
