import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    easypaisa: {
      configured: Boolean(process.env.EASYPAISA_STORE_ID && process.env.EASYPAISA_HASH_KEY),
      mode: process.env.EASYPAISA_STORE_ID ? 'PRODUCTION' : 'SANDBOX',
      storeName: 'Velvet Cafe & Grill',
    },
    jazzcash: {
      configured: Boolean(process.env.JAZZCASH_MERCHANT_ID && process.env.JAZZCASH_INTEGRITY_SALT),
      mode: process.env.JAZZCASH_MERCHANT_ID ? 'PRODUCTION' : 'SANDBOX',
      merchantName: 'Velvet Cafe & Grill',
    },
    raast: {
      bankName: process.env.RAAST_BANK_NAME || 'Meezan Bank',
      accountTitle: process.env.RAAST_ACCOUNT_TITLE || 'Velvet Cafe & Grill',
      iban: process.env.RAAST_IBAN || 'PK36MEZN0002140104829104',
      raastId: process.env.RAAST_ID || '03001234567',
    },
  });
}
