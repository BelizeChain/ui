import { describe, expect, it } from 'vitest';
import { cn, formatAddress, formatCurrency } from './utils';

describe('portal formatters', () => {
  it('formats DALLA and bBZD amounts with two decimals and a suffix', () => {
    expect(formatCurrency(1234.567)).toBe('1,234.57 DALLA');
    expect(formatCurrency('42')).toBe('42.00 DALLA');
    expect(formatCurrency(7, 'bBZD')).toBe('7.00 bBZD');
  });

  it('shortens addresses from both ends', () => {
    expect(formatAddress('r1RxrSmqLK3kZZZZzzzz')).toBe('r1RxrS...zzzz');
    expect(formatAddress('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 6)).toBe(
      '5FHneW46...M694ty'
    );
  });

  it('merges conflicting Tailwind classes with the last one winning', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('text-red-500', false && 'hidden', undefined)).toBe('text-red-500');
  });
});
