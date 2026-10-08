import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency: 'DALLA' | 'bBZD' = 'DALLA'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
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

/**
 * Decode a `BoundedVec<u8, _>` (Substrate `Bytes`) into a UTF-8 string. Falls
 * back to a `0x...` hex representation if the bytes contain unprintable control
 * characters.
 */
export function bytesToString(raw: unknown): string {
  if (raw == null) return '';
  const codec = raw as { toU8a?: () => Uint8Array; toString?: () => string };
  let bytes: Uint8Array | null = null;
  try {
    if (typeof codec.toU8a === 'function') {
      bytes = codec.toU8a();
    }
  } catch {
    bytes = null;
  }
  if (!bytes || bytes.length === 0) {
    return typeof codec.toString === 'function' ? codec.toString() : '';
  }
  const hex = `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
  try {
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/.test(decoded)) {
      return hex;
    }
    return decoded;
  } catch {
    return hex;
  }
}
