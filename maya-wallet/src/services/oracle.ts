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
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<ExchangeRate> {
  try {
    await initializeOracle();
    
    if (!apiInstance) {
      throw new Error('Oracle API not initialized');
    }

    // Query Oracle pallet for exchange rate
    const pair = `${fromCurrency}/${toCurrency}`;
    
    // Try to get from Oracle pallet
    const oracleData = await apiInstance.query.oracle?.getExchangeRate?.(fromCurrency, toCurrency);
    
    if (oracleData && !oracleData.isEmpty) {
      const rate = parseOracleRate(oracleData);
      
      return {
        pair,
        rate,
        timestamp: Date.now(),
        source: 'BelizeChain Oracle',
      };
    }

    // Fallback to hardcoded rates if Oracle not available
    const fallbackRate = getFallbackRate(fromCurrency, toCurrency);
    
    walletLogger.warn('Using fallback exchange rate', { pair, rate: fallbackRate });
    
    return {
      pair,
      rate: fallbackRate,
      timestamp: Date.now(),
      source: 'Fallback',
    };
  } catch (error) {
    walletLogger.error('Failed to get exchange rate', error);
    
    // Return fallback rate on error
    const fallbackRate = getFallbackRate(fromCurrency, toCurrency);
    return {
      pair: `${fromCurrency}/${toCurrency}`,
      rate: fallbackRate,
      timestamp: Date.now(),
      source: 'Fallback (Error)',
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
    
    if (!apiInstance?.query?.oracle?.getExchangeRate) {
      // Fallback: poll every 30 seconds
      const interval = setInterval(async () => {
        const rate = await getExchangeRate(fromCurrency, toCurrency);
        callback(rate);
      }, 30000);
      
      // Initial call
      const initialRate = await getExchangeRate(fromCurrency, toCurrency);
      callback(initialRate);
      
      const unsubscribe = () => clearInterval(interval);
      rateSubscriptions.set(pair, unsubscribe);
      return unsubscribe;
    }

    // Real subscription to Oracle pallet
    const unsub = await apiInstance.query.oracle.getExchangeRate(
      fromCurrency,
      toCurrency,
      (oracleData: any) => {
        const rate = parseOracleRate(oracleData);
        callback({
          pair,
          rate,
          timestamp: Date.now(),
          source: 'BelizeChain Oracle',
        });
      }
    );

    rateSubscriptions.set(pair, unsub);
    return unsub;
  } catch (error) {
    walletLogger.error('Failed to subscribe to exchange rate', error);
    
    // Fallback subscription
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
    
    if (!apiInstance?.query?.oracle?.getMerchantInfo) {
      return {
        verified: false,
        category: 'unknown',
        tourismEligible: false,
      };
    }

    const merchantInfo = await apiInstance.query.oracle.getMerchantInfo(merchantId);
    
    if (merchantInfo.isEmpty) {
      return {
        verified: false,
        category: 'unknown',
        tourismEligible: false,
      };
    }

    return {
      verified: merchantInfo.verified.isTrue,
      category: merchantInfo.category.toString(),
      tourismEligible: merchantInfo.tourismEligible?.isTrue || false,
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

function getFallbackRate(fromCurrency: string, toCurrency: string): number {
  // Fallback rates (updated manually, should match Oracle)
  const rates: Record<string, number> = {
    'bBZD/GBP': 0.40,     // 1 bBZD = 0.40 GBP (pegged)
    'DALLA/USD': 0.50,    // 1 DALLA = 0.50 USD
    'DALLA/bBZD': 1.25,   // 1 DALLA = 1.25 bBZD
    'bBZD/USD': 0.50,     // 1 bBZD = 0.50 USD (via GBP)
    'GBP/USD': 1.25,      // 1 GBP = 1.25 USD (reference)
    'USD/GBP': 0.80,      // Inverse
    'bBZD/DALLA': 0.80,   // Inverse
    'USD/DALLA': 2.0,     // Inverse
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

  walletLogger.warn('No fallback rate available', { pair });
  return 1.0;
}
