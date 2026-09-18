// Oracle Service - Real-time exchange rates from BelizeChain Oracle Pallet
import { walletLogger } from '@belizechain/shared';

export interface ExchangeRate {
  pair: string; // e.g., "bBZD/BZD", "DALLA/USD"
  rate: number;
  timestamp: number;
  source: string;
}

export interface OraclePrice {
  asset: string;
  price: string; // In smallest unit
  decimals: number;
  lastUpdated: number;
}

let apiInstance: any = null;
let rateSubscriptions: Map<string, (() => void)> = new Map();

// Initialize with blockchain API instance (lazy loaded)
export async function initializeOracle(): Promise<void> {
  if (apiInstance) return;

  try {
    // Dynamic import to avoid SSR issues
    const blockchainService = await import('./blockchain');
    const api = await blockchainService.initializeApi();
    apiInstance = api;

    walletLogger.info('Oracle service initialized');
  } catch (error) {
    walletLogger.error('Failed to initialize oracle service', error);
    throw error;
  }
}

/**
 * Get current exchange rate from Oracle pallet
 * @param fromCurrency - Source currency (DALLA, bBZD, USD, BZD)
 * @param toCurrency - Target currency
 */
function toOracleCurrency(currency: string): 'BZD' | 'USD' | 'EUR' | 'CAD' | 'MXN' | null {
  const norm = currency.toUpperCase();
  if (norm === 'BBZD' || norm === 'BZD') return 'BZD';
  if (norm === 'USD') return 'USD';
  if (norm === 'EUR') return 'EUR';
  if (norm === 'CAD') return 'CAD';
  if (norm === 'MXN') return 'MXN';
  return null;
}

/**
 * Get current exchange rate from Oracle pallet
 * @param fromCurrency - Source currency (DALLA, bBZD, USD, BZD)
 * @param toCurrency - Target currency
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<ExchangeRate> {
  try {
    await initializeOracle();

    if (!apiInstance) {
      throw new Error('Oracle API not initialized');
    }

    const pair = `${fromCurrency}/${toCurrency}`;
    const baseCur = toOracleCurrency(fromCurrency);
    const quoteCur = toOracleCurrency(toCurrency);

    if (baseCur && quoteCur) {
      const pairStruct = { base: baseCur, quote: quoteCur };

      // 1. Check authoritative manual exchange rates (Central Bank / Admin override)
      if (apiInstance.query.oracle?.manualExchangeRates) {
        const manualData = await apiInstance.query.oracle.manualExchangeRates(pairStruct);
        if (manualData && manualData.isSome) {
          const [priceRaw] = manualData.unwrap();
          const rate = Number(priceRaw.toBigInt()) / 1e6;
          return {
            pair,
            rate,
            timestamp: Date.now(),
            source: 'BelizeChain Oracle (Manual Authority)',
          };
        }
      }

      // 2. Check aggregated price feeds
      if (apiInstance.query.oracle?.priceFeeds) {
        const feedData = await apiInstance.query.oracle.priceFeeds(pairStruct);
        if (feedData && feedData.isSome) {
          const feed = feedData.unwrap();
          const rate = Number(feed.price.toBigInt()) / 1e6;
          return {
            pair,
            rate,
            timestamp: Date.now(),
            source: 'BelizeChain Oracle (Aggregated Feed)',
          };
        }
      }

      // 3. Check inverse pair if quote/base
      if (apiInstance.query.oracle?.manualExchangeRates) {
        const invStruct = { base: quoteCur, quote: baseCur };
        const invManual = await apiInstance.query.oracle.manualExchangeRates(invStruct);
        if (invManual && invManual.isSome) {
          const [priceRaw] = invManual.unwrap();
          const rate = 1 / (Number(priceRaw.toBigInt()) / 1e6);
          return {
            pair,
            rate,
            timestamp: Date.now(),
            source: 'BelizeChain Oracle (Inverse Authority)',
          };
        }
      }
    }

    // Statutory pegs are protocol-defined (bBZD 1:1 BZD, BZD $0.50 peg) —
    // these ARE legitimate fallback values, not fabrications.
    const fallbackRate = getFallbackRate(fromCurrency, toCurrency);
    if (fallbackRate !== null) {
      walletLogger.info('Using statutory exchange rate', { pair, rate: fallbackRate });
      return {
        pair,
        rate: fallbackRate,
        timestamp: Date.now(),
        source: 'Statutory Reserve Peg (1 bBZD = $0.50 USD)',
      };
    }

    // CONFIG-002: floating assets (e.g. DALLA) with no oracle feed get rate:0
    // + explicit Unavailable source so UI can show 'Rate unavailable' rather
    // than an invented price.
    return { pair, rate: 0, timestamp: Date.now(), source: 'Oracle Rate Unavailable' };
  } catch (error) {
    walletLogger.error('Failed to get exchange rate', error);

    const fallbackRate = getFallbackRate(fromCurrency, toCurrency);
    if (fallbackRate !== null) {
      return {
        pair: `${fromCurrency}/${toCurrency}`,
        rate: fallbackRate,
        timestamp: Date.now(),
        source: 'Statutory Fallback',
      };
    }
    return {
      pair: `${fromCurrency}/${toCurrency}`,
      rate: 0,
      timestamp: Date.now(),
      source: 'Oracle Rate Unavailable',
    };
  }
}

/**
 * Subscribe to exchange rate updates
 */
export async function subscribeToExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  callback: (rate: ExchangeRate) => void
): Promise<() => void> {
  try {
    await initializeOracle();

    const pair = `${fromCurrency}/${toCurrency}`;
    const baseCur = toOracleCurrency(fromCurrency);
    const quoteCur = toOracleCurrency(toCurrency);

    if (baseCur && quoteCur && apiInstance?.query?.oracle?.manualExchangeRates && apiInstance?.query?.oracle?.priceFeeds) {
      const pairStruct = { base: baseCur, quote: quoteCur };

      const unsub = await apiInstance.queryMulti([
        [apiInstance.query.oracle.manualExchangeRates, pairStruct],
        [apiInstance.query.oracle.priceFeeds, pairStruct],
      ], ([manualData, feedData]: [any, any]) => {
        if (manualData && manualData.isSome) {
          const [priceRaw] = manualData.unwrap();
          const rate = Number(priceRaw.toBigInt()) / 1e6;
          callback({
            pair,
            rate,
            timestamp: Date.now(),
            source: 'BelizeChain Oracle (Manual Authority)',
          });
          return;
        }

        if (feedData && feedData.isSome) {
          const feed = feedData.unwrap();
          const rate = Number(feed.price.toBigInt()) / 1e6;
          callback({
            pair,
            rate,
            timestamp: Date.now(),
            source: 'BelizeChain Oracle (Aggregated Feed)',
          });
          return;
        }

        const fallbackRate = getFallbackRate(fromCurrency, toCurrency);
        callback({
          pair,
          rate: fallbackRate ?? 0,
          timestamp: Date.now(),
          source: fallbackRate !== null ? 'Statutory Peg' : 'Oracle Rate Unavailable',
        });
      });

      rateSubscriptions.set(pair, unsub);
      return unsub;
    }

    // Polling fallback if unmapped currency pair
    const interval = setInterval(async () => {
      const rate = await getExchangeRate(fromCurrency, toCurrency);
      callback(rate);
    }, 30000);

    const initialRate = await getExchangeRate(fromCurrency, toCurrency);
    callback(initialRate);

    const unsubscribe = () => clearInterval(interval);
    rateSubscriptions.set(pair, unsubscribe);
    return unsubscribe;
  } catch (error) {
    walletLogger.error('Failed to subscribe to exchange rate', error);

    const interval = setInterval(async () => {
      const rate = await getExchangeRate(fromCurrency, toCurrency);
      callback(rate);
    }, 30000);

    return () => clearInterval(interval);
  }
}

/**
 * Get all supported currency pairs
 */
export function getSupportedPairs(): string[] {
  return [
    'bBZD/GBP',  // Primary peg
    'DALLA/USD', // DALLA to USD
    'DALLA/bBZD', // Internal conversion
    'bBZD/USD',  // bBZD to USD
    'GBP/USD',   // Reference rate
  ];
}

/**
 * Get merchant verification status from Oracle
 */
export async function getMerchantVerification(merchantId: string): Promise<{
  verified: boolean;
  category: string;
  tourismEligible: boolean;
}> {
  try {
    await initializeOracle();

    if (!apiInstance?.query?.oracle?.merchantCategories) {
      return {
        verified: false,
        category: 'unknown',
        tourismEligible: false,
      };
    }

    const merchantInfo = await apiInstance.query.oracle.merchantCategories(merchantId);

    if (!merchantInfo || merchantInfo.isNone) {
      return {
        verified: false,
        category: 'unknown',
        tourismEligible: false,
      };
    }

    const info = merchantInfo.unwrap();
    const catStr = info.category?.toString() || 'General';
    return {
      verified: true,
      category: catStr,
      tourismEligible: catStr === 'Tourism' || catStr.toLowerCase().includes('tourism'),
    };
  } catch (error) {
    walletLogger.error('Failed to get merchant verification', error);
    return {
      verified: false,
      category: 'unknown',
      tourismEligible: false,
    };
  }
}

/**
 * Cleanup all subscriptions
 */
export function disconnectOracle(): void {
  rateSubscriptions.forEach(unsub => unsub());
  rateSubscriptions.clear();
  apiInstance = null;
  walletLogger.info('Oracle service disconnected');
}

// Helper Functions

function parseOracleRate(oracleData: any): number {
  try {
    // Oracle stores rates as fixed-point with 18 decimals
    const rawRate = oracleData.unwrap?.() || oracleData;
    const rateString = rawRate.toString();
    const rate = parseInt(rateString, 10) / 1e18;
    return rate;
  } catch (error) {
    walletLogger.error('Failed to parse oracle rate', error);
    return 1.0;
  }
}

function getFallbackRate(fromCurrency: string, toCurrency: string): number | null {
  // Fallback rates (bBZD is strictly pegged: 1 bBZD = 1 BZD = $0.50 USD; DALLA is unpegged floating crypto)
  const rates: Record<string, number> = {
    'bBZD/USD': 0.50,     // 1 bBZD = 0.50 USD (pegged stablecoin)
    'USD/bBZD': 2.00,     // 1 USD = 2.00 bBZD
    'bBZD/BZD': 1.00,     // 1 bBZD = 1.00 BZD (1:1 parity)
    'BZD/bBZD': 1.00,     // 1 BZD = 1.00 bBZD
    'BZD/USD': 0.50,      // 1 BZD = 0.50 USD (statutory peg)
    'USD/BZD': 2.00,      // 1 USD = 2.00 BZD
    'bBZD/GBP': 0.40,     // 1 bBZD = 0.40 GBP
    'GBP/USD': 1.25,      // 1 GBP = 1.25 USD
    'USD/GBP': 0.80,      // Inverse
    // CONFIG-002: DALLA is UNPEGGED / floating — no hardcoded price here.
    // If the oracle has no feed, callers receive rate:null (see
    // getFallbackRate returning null for unknown pairs) and the UI must
    // surface 'Rate unavailable' instead of inventing a number.
  };

  const pair = `${fromCurrency}/${toCurrency}`;

  if (rates[pair]) {
    return rates[pair];
  }

  // Try inverse
  const inversePair = `${toCurrency}/${fromCurrency}`;
  if (rates[inversePair]) {
    return 1 / rates[inversePair];
  }

  // Same currency
  if (fromCurrency === toCurrency) {
    return 1.0;
  }

  // CONFIG-002: unknown pair = no rate. Never fabricate 1.0.
  walletLogger.warn('No statutory rate for pair; oracle rate required', { pair });
  return null;
}
