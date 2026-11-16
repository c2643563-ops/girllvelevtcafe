import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { completeOrderPaymentInDB, ensureSupabaseHydrated, syncPaymentToSupabase } from '@/lib/db';
import { emitRealtimeEvent } from '@/lib/socket-server';
import type { PaymentMethod, PaymentStatus } from '@/lib/types';

function createGatewayReference(method: PaymentMethod, customRef?: string): string {
  if (customRef && customRef.trim().length >= 4) {
    return customRef.trim().toUpperCase();
  }
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  switch (method) {
    case 'EASYPAISA':
      return `EP-${Date.now().toString().slice(-6)}-${suffix}`;
    case 'JAZZCASH':
      return `JC-${Date.now().toString().slice(-6)}-${suffix}`;
    case 'BANK_TRANSFER':
      return `RAAST-${Date.now().toString().slice(-6)}-${suffix}`;
    case 'CASH':
    default:
      return `CASH-${Date.now().toString().slice(-6)}-${suffix}`;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId = String(body.orderId || '');
    const method = body.method as PaymentMethod;
    const accountOrPhone = body.accountOrPhone ? String(body.accountOrPhone).trim() : undefined;
    const customRef = body.referenceId ? String(body.referenceId).trim() : undefined;
    const source = body.source === 'CASHIER' ? 'CASHIER' : 'CUSTOMER';
    const confirmCashNow = Boolean(body.confirmCashNow);

    const allowedMethods: PaymentMethod[] = ['CASH', 'EASYPAISA', 'JAZZCASH', 'BANK_TRANSFER'];
    if (!orderId || !allowedMethods.includes(method)) {
      return NextResponse.json({ error: 'Valid orderId and payment method are required' }, { status: 400 });
    }

    const db = await ensureSupabaseHydrated();
    const existing = db.orders.find((o) => o.id === orderId);
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate mobile number for Easypaisa / JazzCash
    if ((method === 'EASYPAISA' || method === 'JAZZCASH') && (!accountOrPhone || accountOrPhone.length < 10)) {
      return NextResponse.json(
        { error: `Please enter a valid 11-digit Pakistani ${method === 'EASYPAISA' ? 'Easypaisa' : 'JazzCash'} mobile number (03XXXXXXXXX).` },
        { status: 400 }
      );
    }

    // If Cashier approves Cash or Digital gateway completes (Easypaisa, JazzCash, Bank Transfer) -> PAID immediately with Green Tick!
    // If Customer chooses Cash on Counter without cashier confirmation yet -> can either confirm via Cashier 1-click OR instant if confirmCashNow
    let paymentStatus: PaymentStatus = 'PAID';
    if (method === 'CASH' && source === 'CUSTOMER' && !confirmCashNow) {
      paymentStatus = 'PENDING_VERIFICATION';
    }

    const referenceId = createGatewayReference(method, customRef);

    // Production HMAC-SHA256 signature preview for JazzCash / Easypaisa readiness
    const salt = process.env.JAZZCASH_INTEGRITY_SALT || process.env.EASYPAISA_HASH_KEY || 'sandbox-salt';
    const signature = crypto
      .createHmac('sha256', salt)
      .update(`${existing.orderNumber}|${existing.total}|${method}|${referenceId}`)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase();

    const result = completeOrderPaymentInDB({
      orderId,
      method,
      referenceId,
      accountOrPhone,
      paymentStatus,
    });

    if (!result) {
      return NextResponse.json({ error: 'Could not process payment' }, { status: 500 });
    }

    if (result.table) {
      await syncPaymentToSupabase(result.payment, result.order, result.table);
      emitRealtimeEvent('table:updated', result.table);
    }

    emitRealtimeEvent('order:updated', result.order);
    emitRealtimeEvent('payment:completed', {
      payment: result.payment,
      order: result.order,
      table: result.table,
      signature,
      message:
        paymentStatus === 'PAID'
          ? `Table ${result.order.tableNumber} payment completed via ${method.replace('_', ' ')}!`
          : `Table ${result.order.tableNumber} is paying Cash at Counter (Order ${result.order.orderNumber})`,
    });

    return NextResponse.json({
      success: true,
      payment: result.payment,
      order: result.order,
      table: result.table,
      signature,
    });
  } catch (error) {
    console.error('Payment process error:', error);
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
  }
}
