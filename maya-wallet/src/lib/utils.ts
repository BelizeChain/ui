import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency: 'DALLA' | 'bBZD' = 'DALLA'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${formatDisplayNumber(num)} ${currency}`;
}

/** Locale-formatted number with 2 decimals — the standard display style for DALLA/bBZD amounts. */
export function formatDisplayNumber(num: number): string {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** DALLA amount with symbol, e.g. `1,234.00 Ɗ`. */
export function formatDalla(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${formatDisplayNumber(num)} Ɗ`;
}

/** bBZD amount with statutory-peg prefix, e.g. `BZ$ 1,234.00`. */
export function formatBbzd(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `BZ$ ${formatDisplayNumber(num)}`;
}

export function formatAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
