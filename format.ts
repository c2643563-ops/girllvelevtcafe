import type { PaymentMethod } from './types';

export function formatPKR(amount: number): string {
  return `Rs. ${Number(amount || 0).toLocaleString('en-PK')}`;
}

export function formatPaymentMethod(method: PaymentMethod | null | undefined): string {
  switch (method) {
    case 'EASYPAISA':
      return 'Easypaisa';
    case 'JAZZCASH':
      return 'JazzCash';
    case 'BANK_TRANSFER':
      return 'Bank / Raast';
    case 'CASH':
      return 'Cash on Counter';
    default:
      return 'Pending';
  }
}

export function formatTimeAgo(iso: string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}
