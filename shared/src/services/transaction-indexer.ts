/**
 * BelizeChain Transaction Indexer
 *
 * Queries blockchain events and indexes transaction history for accounts.
 * Provides caching and efficient lookup for activity feeds.
 */

import { ApiPromise } from '@polkadot/api';
import type { EventRecord } from '@polkadot/types/interfaces';

const APPROX_BLOCK_MS = 6000;

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

/** Format a planck-scale integer string into a 4dp decimal string. */
function formatUnits(value: string, decimals: number): string {
  let planck: bigint;
  try {
    planck = BigInt(value);
  } catch {
    return '0';
  }
  const base = 10n ** BigInt(decimals);
  const whole = planck / base;
  const fraction = (planck % base).toString().padStart(decimals, '0').slice(0, 4);
  return `${whole.toString()}.${fraction}`;
}

function categorizeExtrinsic(section: string, method: string): Transaction['type'] {
  if ((section === 'balances' || section === 'assets') && method.startsWith('transfer')) {
    return 'transfer';
  }
  if (section === 'staking') return 'staking';
  if (
    section === 'democracy' ||
    section === 'council' ||
    section === 'elections' ||
    section === 'governance'
  ) {
    return 'governance';
  }
  return 'unknown';
}

export class TransactionIndexer {
  private api: ApiPromise;
  private cacheEnabled: boolean;
  private scanBlocks: number;

  constructor(api: ApiPromise, options?: { cacheEnabled?: boolean; scanBlocks?: number }) {
    this.api = api;
    this.cacheEnabled = options?.cacheEnabled ?? true;
    this.scanBlocks = options?.scanBlocks ?? 100;
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
    // Read account history straight from chain state — the same direct-RPC
    // approach the portal explorer uses. See `scanRecentBlocks` for why there is
    // no longer an HTTP index attempt ahead of it.
    const transactions = await this.scanRecentBlocks(accountAddress, filter);

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
   * Direct-RPC scan: walk back `scanBlocks` blocks from the head and decode the
   * signed extrinsics that belong to the account. Block timestamps are
   * approximated at ~6s per block — the chain carries wall clock via the
   * timestamp.set inherent, not in the header.
   *
   * This is the only path. An earlier version tried a Subsquid/Hasura GraphQL
   * indexer first (`transactions(where: { signer_eq: ... })` on
   * `localhost:4350`), but no such service exists in this architecture, so every
   * call paid a connection timeout before reaching the scan below. That mapping
   * also discarded the amount and counterparty, so even a successful response
   * would have shown every row as a zero-value transfer.
   *
   * `api-gateway` now serves `GET /v1/accounts/:address/transactions`, but it
   * reports only `blockNumber`/`section`/`method`/`args` — no timestamp, status,
   * or fee. Inventing those for citizen wallet activity would be worse than the
   * bounded scan, so re-adding it waits until the gateway carries the fields the
   * activity feed renders.
   */
  private async scanRecentBlocks(
    accountAddress: string,
    filter: TransactionFilter
  ): Promise<Transaction[]> {
    const limit = filter.limit ?? 100;
    const decimals = this.api.registry.chainDecimals[0] ?? 12;

    let accountHex: string;
    try {
      // Compare raw account bytes: SS58 prefix rendering differs (this chain
      // uses prefix 1981, wallets commonly show 42) but the bytes are the key.
      accountHex = this.api.createType('AccountId', accountAddress).toHex();
    } catch {
      return [];
    }

    const head = (await this.api.rpc.chain.getHeader()).number.toNumber();
    const oldest = Math.max(0, head - (this.scanBlocks - 1));
    const transactions: Transaction[] = [];

    for (let number = head; number >= oldest && transactions.length < limit; number--) {
      const hash = await this.api.rpc.chain.getBlockHash(number);
      const [signedBlock, rawEvents] = await Promise.all([
        this.api.rpc.chain.getBlock(hash),
        this.api.query.system.events.at(hash),
      ]);
      // The chain ships no type bundle, so events arrive typed as Codec; the
      // runtime shape is Vec<EventRecord>.
      const events = rawEvents as unknown as EventRecord[];
      const timestamp = Date.now() - (head - number) * APPROX_BLOCK_MS;

      for (const [index, extrinsic] of signedBlock.block.extrinsics.entries()) {
        if (!extrinsic.isSigned) continue;

        let signerHex: string;
        try {
          signerHex = this.api.createType('AccountId', extrinsic.signer).toHex();
        } catch {
          continue;
        }
        if (signerHex !== accountHex) continue;

        const { section, method } = extrinsic.method;
        let to = '';
        let amount = '0';
        let asset: Transaction['asset'] = 'DALLA';

        if (section === 'balances' && method.startsWith('transfer')) {
          const [destination, value] = extrinsic.method.args as unknown[];
          to = destination?.toString() ?? '';
          amount = formatUnits(value?.toString() ?? '0', decimals);
        } else if (section === 'assets' && method.startsWith('transfer')) {
          const [assetId, destination, value] = extrinsic.method.args as unknown[];
          asset = Number(assetId?.toString()) === 1 ? 'bBZD' : 'DALLA';
          to = destination?.toString() ?? '';
          amount = formatUnits(value?.toString() ?? '0', decimals);
        }

        transactions.push({
          hash: `${hash.toHex()}-${index}`,
          blockNumber: number,
          timestamp,
          type: categorizeExtrinsic(section, method),
          from: accountAddress,
          to: to || '—',
          amount,
          asset,
          status: this.extrinsicOutcome(events, index) ? 'success' : 'failed',
          fee: this.extrinsicFee(events, index, decimals),
          metadata: { palletName: section, method },
        });

        if (transactions.length >= limit) break;
      }
    }

    return transactions;
  }

  /** system.ExtrinsicSuccess / ExtrinsicFailed for one extrinsic index. */
  private extrinsicOutcome(events: EventRecord[], index: number): boolean {
    for (const record of events) {
      const phase = record.phase;
      if (!phase.isApplyExtrinsic || phase.asApplyExtrinsic.toNumber() !== index) continue;
      const { section, method } = record.event;
      if (section === 'system' && method === 'ExtrinsicSuccess') return true;
      if (section === 'system' && method === 'ExtrinsicFailed') return false;
    }
    // In-block without a failure event means it succeeded.
    return true;
  }

  /** transactionPayment.TransactionFeePaid actual fee for an extrinsic, if any. */
  private extrinsicFee(events: EventRecord[], index: number, decimals: number): string {
    for (const record of events) {
      const phase = record.phase;
      if (!phase.isApplyExtrinsic || phase.asApplyExtrinsic.toNumber() !== index) continue;
      const { section, method } = record.event;
      if (section !== 'transactionPayment' || method !== 'TransactionFeePaid') continue;
      return formatUnits(record.event.data[1]?.toString() ?? '0', decimals);
    }
    return '0';
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
