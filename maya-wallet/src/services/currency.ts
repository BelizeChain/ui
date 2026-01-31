// Currency Calculator Service
import { walletLogger } from '@belizechain/shared';
import * as OracleService from './oracle';

export interface ExchangeRate {
  pair: string;
  rate: number;
  lastUpdated: number;
}

export interface ConversionResult {
  fromAmount: string; // Formatted string with decimals
  fromCurrency: string;
  toAmount: string; // Formatted string with decimals
  toCurrency: string;
  rate: number;
  timestamp: number; // Unix timestamp from Date.now()
}

const EXCHANGE_RATES_KEY = 'maya-exchange-rates';
const CONVERSION_HISTORY_KEY = 'maya-conversion-history';

// Default exchange rates (fallback values)
const DEFAULT_RATES: Record<string, number> = {
  'DALLA/bBZD': 0.5, // 1 DALLA = 0.5 bBZD (example - pegged to BZD)
  'bBZD/DALLA': 2.0, // 1 bBZD = 2 DALLA
  'DALLA/USD': 0.25, // 1 DALLA ≈ 0.25 USD
  'USD/DALLA': 4.0, // 1 USD ≈ 4 DALLA
  'bBZD/USD': 0.50, // 1 bBZD ≈ 0.50 USD (BZD is 2:1 USD)
  'USD/bBZD': 2.0, // Inverse
  'bBZD/BZD': 1.0, // 1 bBZD = 1 BZD (pegged)
  'BZD/bBZD': 1.0, // 1 BZD = 1 bBZD
};

// Get current exchange rates from Oracle pallet
export async function getExchangeRates(): Promise<ExchangeRate[]> {
  try {
    // Get real rates from Oracle service
    const pairs = OracleService.getSupportedPairs();
    const rates: ExchangeRate[] = [];

    for (const pair of pairs) {
      const [from, to] = pair.split('/');
      try {
        const oracleRate = await OracleService.getExchangeRate(from, to);
        rates.push({
          pair: oracleRate.pair,
          rate: oracleRate.rate,
          lastUpdated: oracleRate.timestamp,
        });
      } catch (error) {
        walletLogger.warn(`Failed to get rate for ${pair}`, { error: error instanceof Error ? error.message : String(error) });
      }
    }

    walletLogger.info('Exchange rates fetched', { count: rates.length });
    return rates;
  } catch (error) {
    walletLogger.error('Failed to fetch exchange rates', { error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

// Update exchange rate (typically called from Oracle pallet)
export function updateExchangeRate(from: string, to: string, rate: number, source: 'oracle' | 'manual' = 'oracle'): void {
  const pair = `${from}/${to}`;
  const rates = getStoredRates();
  
  const newRate: ExchangeRate = {
    pair,
    rate,
    lastUpdated: Date.now(),
  };
  
  // Remove old rate for this pair
  const filtered = rates.filter(r => r.pair !== pair);
  filtered.push(newRate);
  
  saveExchangeRates(filtered);
  walletLogger.info('Exchange rate updated', { pair, rate });
}

// Convert amount from one currency to another
export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<ConversionResult> {
  if (from === to) {
    return {
      fromAmount: amount.toString(),
      fromCurrency: from,
      toAmount: amount.toFixed(2),
      toCurrency: to,
      rate: 1.0,
      timestamp: Date.now(),
    };
  }
  
  // Use Oracle service for real-time rates
  try {
    const oracleRate = await OracleService.getExchangeRate(from, to);
    const convertedAmount = amount * oracleRate.rate;
    
    const result: ConversionResult = {
      fromAmount: amount.toString(),
      fromCurrency: from,
      toAmount: convertedAmount.toFixed(2),
      toCurrency: to,
      rate: oracleRate.rate,
      timestamp: oracleRate.timestamp,
    };
    
    walletLogger.info('Currency converted', { from, to, amount, result: result.toAmount, source: oracleRate.source });
    return result;
  } catch (error) {
    walletLogger.error('Currency conversion failed', error);
    throw error;
  }
}

// Get all supported currencies
export function getSupportedCurrencies(): string[] {
  return ['DALLA', 'bBZD', 'USD', 'BZD'];
}

// Get all available exchange rates
export function getAllExchangeRates(): ExchangeRate[] {
  const rates = getStoredRates();
  
  // Merge with default rates
  const pairs = new Set<string>();
  const merged: ExchangeRate[] = [];
  
  // Add stored rates first
  for (const rate of rates) {
    pairs.add(rate.pair);
    merged.push(rate);
  }
  
  // Add default rates that aren't stored
  for (const [pair, rate] of Object.entries(DEFAULT_RATES)) {
    if (!pairs.has(pair)) {
      merged.push({
        pair,
        rate,
        lastUpdated: Date.now(),
      });
    }
  }
  
  return merged;
}

// Calculate cross-rate (e.g., DALLA → USD via bBZD)
// Returns the calculated rate or falls back to Oracle
export async function calculateCrossRate(from: string, to: string, via: string): Promise<number> {
  try {
    // Try Oracle service first
    const directRate = await OracleService.getExchangeRate(from, to);
    return directRate.rate;
  } catch {
    // Fallback to cross-rate calculation
    const rate1 = await OracleService.getExchangeRate(from, via);
    const rate2 = await OracleService.getExchangeRate(via, to);
    return rate1.rate * rate2.rate;
  }
}

// Get conversion history
export function getConversionHistory(limit: number = 50): ConversionResult[] {
  try {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(CONVERSION_HISTORY_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    // Timestamp is already a number (Date.now())
    return history.slice(0, limit);
  } catch (error) {
    walletLogger.error('Failed to load conversion history', error);
    return [];
  }
}

// Clear conversion history
export function clearConversionHistory(): void {
  try {
    localStorage.setItem(CONVERSION_HISTORY_KEY, JSON.stringify([]));
    walletLogger.info('Conversion history cleared');
  } catch (error) {
    walletLogger.error('Failed to clear conversion history', error);
  }
}

// Save conversion to history
function saveConversionToHistory(conversion: ConversionResult): void {
  try {
    const history = getConversionHistory();
    history.unshift(conversion); // Add to beginning
    
    // Keep only last 100 conversions
    const trimmed = history.slice(0, 100);
    
    localStorage.setItem(CONVERSION_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    walletLogger.error('Failed to save conversion history', error);
  }
}

// Get stored exchange rates
function getStoredRates(): ExchangeRate[] {
  try {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(EXCHANGE_RATES_KEY);
    if (!stored) return [];
    
    // Timestamps are already numbers (Date.now())
    const rates = JSON.parse(stored);
    return rates;
  } catch (error) {
    walletLogger.error('Failed to load exchange rates', error);
    return [];
  }
}

// Save exchange rates to localStorage
function saveExchangeRates(rates: ExchangeRate[]): void {
  try {
    localStorage.setItem(EXCHANGE_RATES_KEY, JSON.stringify(rates));
  } catch (error) {
    walletLogger.error('Failed to save exchange rates', error);
    throw new Error('Failed to save exchange rates');
  }
}

// Utility: Format currency amount
export function formatCurrency(amount: number, currency: string): string {
  const decimals = currency === 'DALLA' ? 12 : 2; // DALLA has 12 decimals
  return `${amount.toFixed(decimals)} ${currency}`;
}

// Utility: Get currency symbol
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'DALLA': 'Ɗ',
    'bBZD': 'BZ$',
    'USD': '$',
    'BZD': 'BZ$',
  };
  return symbols[currency] || currency;
}
