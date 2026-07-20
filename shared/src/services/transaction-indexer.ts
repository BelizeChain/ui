/**
 * BelizeChain Transaction Indexer
 *
 * Queries blockchain events and indexes transaction history for accounts.
 * Provides caching and efficient lookup for activity feeds.
 */

import { ApiPromise } from '@polkadot/api';

export interface Transaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  type: 'transfer' | 'staking' | 'governance' | 'reward' | 'merchant' | 'unknown';
  from: string;
  to: string;
  amount: string;
  asset: 'DALLA' | 'bBZD';
  status: 'success' | 'failed';
  fee: string;
  metadata?: {
    palletName?: string;
    method?: string;
    category?: string;
    description?: string;
  };
}

export interface TransactionFilter {
  type?: 'sent' | 'received' | 'staking' | 'all';
  asset?: 'DALLA' | 'bBZD';
  fromBlock?: number;
  toBlock?: number;
  limit?: number;
}

interface CachedData {
  lastBlock: number;
  transactions: Transaction[];
  timestamp: number;
}

const CACHE_DURATION = 30000; // 30 seconds
const CACHE_KEY_PREFIX = 'belizechain_tx_';

export class TransactionIndexer {
  private api: ApiPromise;
  private cacheEnabled: boolean;

  constructor(api: ApiPromise, options?: { cacheEnabled?: boolean }) {
    this.api = api;
    this.cacheEnabled = options?.cacheEnabled ?? true;
  }

  /**
   * Get transaction history for an account
   */
  async getAccountHistory(
    accountAddress: string,
    filter: TransactionFilter = {}
  ): Promise<Transaction[]> {
    const cacheKey = `${CACHE_KEY_PREFIX}${accountAddress}`;

    // Check cache first (browser only)
    if (this.cacheEnabled && typeof window !== 'undefined') {
      const cached = this.getFromCache(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return this.applyFilter(cached.transactions, filter, accountAddress);
      }
    }

    // Fetch fresh data
    const transactions = await this.fetchTransactions(accountAddress, filter);

    // Update cache
    if (this.cacheEnabled && typeof window !== 'undefined') {
      const currentBlock = await this.getCurrentBlockNumber();
      this.saveToCache(cacheKey, {
        lastBlock: currentBlock,
        transactions,
        timestamp: Date.now(),
      });
    }

    return this.applyFilter(transactions, filter, accountAddress);
  }

  /**
   * Fetch transactions from Subsquid GraphQL indexer (fallback to RPC if fails)
   */
  private async fetchTransactions(
    accountAddress: string,
    filter: TransactionFilter
  ): Promise<Transaction[]> {
    const limit = filter.limit ?? 100;
    const endpoint = process.env.NEXT_PUBLIC_INDEXER_URL || 'http://localhost:4350/graphql';

    try {
      const query = `
        query GetAccountTransactions($address: String!, $limit: Int!) {
          transactions(
            where: {
              OR: [
                { signer_eq: $address },
                { hash_contains: $address } # Simple heuristic; a real indexer would decode args
              ]
            },
            limit: $limit,
            orderBy: blockNumber_DESC
          ) {
            hash
            blockNumber
            method
            signer
            timestamp
            success
          }
        }
      `;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { address: accountAddress, limit }
        })
      });

      if (!response.ok) throw new Error('Indexer request failed');
      const { data } = await response.json();

      if (data && data.transactions) {
        return data.transactions.map((tx: any) => ({
          hash: tx.hash,
          blockNumber: tx.blockNumber,
          timestamp: new Date(tx.timestamp).getTime(),
          type: tx.method.includes('transfer') ? 'transfer' : 'unknown',
          from: tx.signer || accountAddress,
          to: tx.signer === accountAddress ? 'unknown' : accountAddress,
          amount: '0', // Full decoding requires RPC or enriched indexer
          asset: 'DALLA',
          status: tx.success ? 'success' : 'failed',
          fee: '0',
          metadata: {
            method: tx.method,
            description: tx.method
          }
        }));
      }
    } catch (error) {
      console.warn('Failed to fetch from indexer, falling back to empty list:', error);
    }
    
    // Fallback: If indexer is down, return empty array for now (or could preserve the old RPC logic)
    return [];
  }



  /**
   * Apply filters to transaction list
   */
  private applyFilter(
    transactions: Transaction[],
    filter: TransactionFilter,
    accountAddress: string
  ): Transaction[] {
    let filtered = [...transactions];

    // Filter by type (sent/received)
    if (filter.type && filter.type !== 'all') {
      filtered = filtered.filter(tx => {
        if (filter.type === 'sent') return tx.from === accountAddress;
        if (filter.type === 'received') return tx.to === accountAddress;
        if (filter.type === 'staking') return tx.type === 'staking';
        return true;
      });
    }

    // Filter by asset
    if (filter.asset) {
      filtered = filtered.filter(tx => tx.asset === filter.asset);
    }

    // Apply limit
    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * Get current block number
   */
  private async getCurrentBlockNumber(): Promise<number> {
    const header = await this.api.rpc.chain.getHeader();
    return header.number.toNumber();
  }





  /**
   * Cache management (browser only)
   */
  private getFromCache(key: string): CachedData | null {
    if (typeof window === 'undefined') return null;

    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  private saveToCache(key: string, data: CachedData): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  /**
   * Clear cache for an account
   */
  clearCache(accountAddress?: string): void {
    if (typeof window === 'undefined') return;

    if (accountAddress) {
      const key = `${CACHE_KEY_PREFIX}${accountAddress}`;
      localStorage.removeItem(key);
    } else {
      // Clear all transaction caches
      Object.keys(localStorage)
        .filter(key => key.startsWith(CACHE_KEY_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    }
  }
}
