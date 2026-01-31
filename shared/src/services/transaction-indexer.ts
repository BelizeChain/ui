/**
 * BelizeChain Transaction Indexer
 * 
 * Queries blockchain events and indexes transaction history for accounts.
 * Provides caching and efficient lookup for activity feeds.
 */

import { ApiPromise } from '@polkadot/api';
import { BlockHash } from '@polkadot/types/interfaces';

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
   * Fetch transactions from blockchain events
   */
  private async fetchTransactions(
    accountAddress: string,
    filter: TransactionFilter
  ): Promise<Transaction[]> {
    const transactions: Transaction[] = [];
    const currentBlock = await this.getCurrentBlockNumber();
    
    const fromBlock = filter.fromBlock ?? Math.max(0, currentBlock - 10000); // Last ~10k blocks
    const toBlock = filter.toBlock ?? currentBlock;

    console.log(`Indexing blocks ${fromBlock} to ${toBlock} for ${accountAddress}`);

    // Query system.ExtrinsicSuccess events to find transactions
    for (let blockNum = toBlock; blockNum >= fromBlock && transactions.length < (filter.limit ?? 100); blockNum--) {
      try {
        const blockHash = await this.api.rpc.chain.getBlockHash(blockNum);
        const signedBlock = await this.api.rpc.chain.getBlock(blockHash);
        const apiAt = await this.api.at(blockHash);
        const events = await apiAt.query.system.events();
        const timestamp = await this.getBlockTimestamp(blockHash);

        // Process each extrinsic in the block
        signedBlock.block.extrinsics.forEach((extrinsic, index) => {
          // Filter events for this extrinsic - use 'as unknown as' for safe type assertion
          const extrinsicEvents = (events as unknown as any[]).filter(
            ({ phase }: any) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
          );

          // Check if extrinsic succeeded
          const success = extrinsicEvents.some(({ event }: any) => 
            this.api.events.system.ExtrinsicSuccess.is(event)
          );

          // Parse transaction based on pallet/method
          const tx = this.parseTransaction(
            extrinsic,
            extrinsicEvents,
            accountAddress,
            blockNum,
            timestamp,
            success
          );

          if (tx) {
            transactions.push(tx);
          }
        });
      } catch (error) {
        console.warn(`Error indexing block ${blockNum}:`, error);
        // Continue to next block
      }
    }

    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Parse extrinsic into a Transaction object
   */
  private parseTransaction(
    extrinsic: any,
    events: any[],
    accountAddress: string,
    blockNumber: number,
    timestamp: number,
    success: boolean
  ): Transaction | null {
    const { method, signer, hash } = extrinsic;
    const palletName = method.section;
    const methodName = method.method;
    const args = method.args;

    let type: Transaction['type'] = 'unknown';
    let from = '';
    let to = '';
    let amount = '0';
    let asset: 'DALLA' | 'bBZD' = 'DALLA';
    let fee = '0';
    let metadata: Transaction['metadata'] = {
      palletName,
      method: methodName,
    };

    // Extract transaction fee
    const feeEvent = events.find(({ event }) => 
      this.api.events.balances?.Withdraw?.is(event) || 
      this.api.events.transactionPayment?.TransactionFeePaid?.is(event)
    );
    if (feeEvent) {
      fee = this.formatBalance(feeEvent.event.data[1]?.toString() || '0');
    }

    // Parse based on pallet
    switch (palletName) {
      case 'balances':
        if (methodName === 'transfer' || methodName === 'transferKeepAlive') {
          type = 'transfer';
          from = signer.toString();
          to = args[0].toString();
          amount = this.formatBalance(args[1].toString());
          metadata.description = `Transfer to ${this.shortenAddress(to)}`;
        }
        break;

      case 'economy':
        if (methodName === 'transfer') {
          type = 'transfer';
          from = signer.toString();
          to = args[0].toString();
          amount = this.formatBalance(args[1].toString());
          // Check if bBZD transfer
          const currencyArg = args[2]?.toString();
          if (currencyArg === 'bBZD' || currencyArg?.includes('bBZD')) {
            asset = 'bBZD';
          }
          metadata.description = `${asset} transfer to ${this.shortenAddress(to)}`;
        }
        break;

      case 'staking':
        type = 'staking';
        from = signer.toString();
        if (methodName === 'bond') {
          amount = this.formatBalance(args[1]?.toString() || '0');
          metadata.description = 'Staked DALLA';
        } else if (methodName === 'bondExtra') {
          amount = this.formatBalance(args[0]?.toString() || '0');
          metadata.description = 'Added stake';
        } else if (methodName === 'unbond') {
          amount = this.formatBalance(args[0]?.toString() || '0');
          metadata.description = 'Unbonded DALLA';
        } else if (methodName === 'payoutStakers') {
          metadata.description = 'Claimed rewards';
          // Extract reward amount from events
          const rewardEvent = events.find(e => e.event.method === 'Reward');
          if (rewardEvent) {
            amount = this.formatBalance(rewardEvent.event.data[1]?.toString() || '0');
          }
        }
        to = 'Staking';
        break;

      case 'governance':
        type = 'governance';
        from = signer.toString();
        if (methodName === 'propose') {
          amount = this.formatBalance(args[1]?.toString() || '0');
          to = 'Governance';
          metadata.description = 'Created proposal';
        } else if (methodName === 'vote') {
          to = 'Governance';
          metadata.description = 'Voted on proposal';
        }
        break;

      case 'belizex':
        type = 'merchant';
        from = signer.toString();
        if (methodName === 'swap') {
          to = 'BelizeX DEX';
          metadata.description = 'Token swap';
        }
        break;

      default:
        // Check for reward events
        const rewardEvent = events.find(({ event }) => 
          event.method === 'Reward' || event.method === 'Rewarded'
        );
        if (rewardEvent) {
          type = 'reward';
          to = accountAddress;
          amount = this.formatBalance(rewardEvent.event.data[1]?.toString() || '0');
          metadata.description = 'PoUW Reward';
        }
        break;
    }

    // Only return transactions involving the account
    if (from !== accountAddress && to !== accountAddress) {
      return null;
    }

    return {
      hash: hash.toString(),
      blockNumber,
      timestamp,
      type,
      from,
      to,
      amount,
      asset,
      status: success ? 'success' : 'failed',
      fee,
      metadata,
    };
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
   * Get block timestamp
   */
  private async getBlockTimestamp(blockHash: BlockHash): Promise<number> {
    try {
      const apiAt = await this.api.at(blockHash);
      const timestamp = await apiAt.query.timestamp.now();
      return (timestamp as any).toNumber();
    } catch (error) {
      // Fallback to current time if timestamp not available
      return Date.now();
    }
  }

  /**
   * Format balance from Planck to DALLA (12 decimals)
   */
  private formatBalance(value: string): string {
    const num = BigInt(value);
    const divisor = BigInt(10 ** 12); // DALLA has 12 decimals
    const whole = num / divisor;
    const fraction = num % divisor;
    const fractionStr = fraction.toString().padStart(12, '0').slice(0, 2);
    return `${whole}.${fractionStr}`;
  }

  /**
   * Shorten address for display
   */
  private shortenAddress(address: string): string {
    if (address.length < 16) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
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
