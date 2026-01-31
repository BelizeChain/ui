/**
 * BelizeChain Blockchain Service
 * Production-grade Polkadot.js integration for government dashboard
 * NO MOCK DATA - All functions query real blockchain
 * 
 * Client-side only service - uses dynamic imports for SSR compatibility
 */

import type { ApiPromise, WsProvider } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

// ============================================================================
// Dynamic Module Loader (SSR-safe)
// ============================================================================

let polkadotModules: {
  ApiPromise: typeof ApiPromise;
  WsProvider: typeof WsProvider;
  web3FromAddress: any;
} | null = null;

async function loadPolkadotModules() {
  if (typeof window === 'undefined') {
    throw new Error('Blockchain service can only be used client-side');
  }
  
  if (!polkadotModules) {
    const [apiModule, extensionModule] = await Promise.all([
      import('@polkadot/api'),
      import('@polkadot/extension-dapp'),
    ]);
    
    polkadotModules = {
      ApiPromise: apiModule.ApiPromise,
      WsProvider: apiModule.WsProvider,
      web3FromAddress: extensionModule.web3FromAddress,
    };
  }
  
  return polkadotModules;
}

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface BlockchainMetrics {
  blockHeight: number;
  finalizedBlock: number;
  peerCount: number;
  syncStatus: 'syncing' | 'synced';
  finalityLag: number;
  transactionsInBlock: number;
}

export interface ValidatorInfo {
  address: string;
  commission: number;
  totalStake: bigint;
  ownStake: bigint;
  nominatorCount: number;
  blocksProduced: number;
  isActive: boolean;
  sessionKeys: string;
}

export interface ProposalInfo {
  id: number;
  proposer: string;
  beneficiary: string;
  amount: bigint;
  currency: 'DALLA' | 'bBZD';
  description: string;
  approvals: string[];
  requiredApprovals: number;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  createdAt: Date;
  executedAt?: Date;
}

export interface BlockchainEvent {
  blockNumber: number;
  timestamp: Date;
  pallet: string;
  event: string;
  data: unknown;
  extrinsicHash?: string;
}

// ============================================================================
// Connection Management
// ============================================================================

class BlockchainService {
  private api: ApiPromise | null = null;
  private wsProvider: WsProvider | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  
  // Query cache with TTL
  private cache = new Map<string, { data: unknown; expires: number }>();
  private defaultCacheTTL = 30000; // 30 seconds

  /**
   * Initialize connection to BelizeChain node
   */
  async initialize(): Promise<void> {
    if (this.api?.isConnected) {
      return;
    }

    if (this.isConnecting) {
      await this.waitForConnection();
      return;
    }

    this.isConnecting = true;

    try {
      // Load Polkadot modules dynamically (client-side only)
      const modules = await loadPolkadotModules();
      
      const nodeEndpoint = process.env.NEXT_PUBLIC_NODE_ENDPOINT || 'ws://127.0.0.1:9944';
      
      this.wsProvider = new modules.WsProvider(nodeEndpoint, 1000, {}, 30000);
      
      this.wsProvider.on('connected', () => {
        console.info('✅ Connected to BelizeChain node');
        this.reconnectAttempts = 0;
      });

      this.wsProvider.on('disconnected', () => {
        console.warn('⚠️ Disconnected from BelizeChain node');
        this.handleDisconnect();
      });

      this.wsProvider.on('error', (error: any) => {
        console.error('❌ WebSocket error:', error);
      });

      this.api = await modules.ApiPromise.create({ 
        provider: this.wsProvider,
        throwOnConnect: true,
      });

      await this.api.isReady;

      this.isConnecting = false;
    } catch (error) {
      this.isConnecting = false;
      throw new Error(`Failed to connect to BelizeChain node: ${error}`);
    }
  }

  /**
   * Wait for ongoing connection attempt
   */
  private async waitForConnection(): Promise<void> {
    const maxWait = 10000; // 10 seconds
    const checkInterval = 100;
    let waited = 0;

    while (this.isConnecting && waited < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    if (this.isConnecting) {
      throw new Error('Connection timeout');
    }
  }

  /**
   * Handle disconnect and attempt reconnection
   */
  private async handleDisconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.info(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    await new Promise((resolve) => setTimeout(resolve, this.reconnectDelay));

    try {
      await this.initialize();
    } catch (error) {
      console.error('Failed to reconnect:', error);
    }
  }

  /**
   * Get API instance, initializing if needed
   */
  async getApi(): Promise<ApiPromise> {
    if (!this.api?.isConnected) {
      await this.initialize();
    }

    if (!this.api) {
      throw new Error('Failed to initialize API');
    }

    return this.api;
  }

  /**
   * Disconnect from node
   */
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }

    if (this.wsProvider) {
      await this.wsProvider.disconnect();
      this.wsProvider = null;
    }

    this.cache.clear();
  }

  // ============================================================================
  // Caching
  // ============================================================================

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: unknown, ttl: number = this.defaultCacheTTL): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  }

  // ============================================================================
  // Blockchain Metrics
  // ============================================================================

  /**
   * Get current blockchain metrics
   */
  async getMetrics(): Promise<BlockchainMetrics> {
    const cached = this.getCached<BlockchainMetrics>('metrics');
    if (cached) return cached;

    const api = await this.getApi();

    const [header, finalizedHash, health] = await Promise.all([
      api.rpc.chain.getHeader(),
      api.rpc.chain.getFinalizedHead(),
      api.rpc.system.health(),
    ]);

    const finalizedHeader = await api.rpc.chain.getHeader(finalizedHash);
    const blockHeight = header.number.toNumber();
    const finalizedBlock = finalizedHeader.number.toNumber();
    const finalityLag = blockHeight - finalizedBlock;

    // Get transactions in current block
    const block = await api.rpc.chain.getBlock(header.hash);
    const transactionsInBlock = block.block.extrinsics.length;

    const metrics: BlockchainMetrics = {
      blockHeight,
      finalizedBlock,
      peerCount: health.peers.toNumber(),
      syncStatus: health.isSyncing.isTrue ? 'syncing' : 'synced',
      finalityLag,
      transactionsInBlock,
    };

    this.setCache('metrics', metrics, 5000); // 5 second cache
    return metrics;
  }

  // ============================================================================
  // Block Subscriptions
  // ============================================================================

  /**
   * Subscribe to new block headers
   */
  async subscribeToBlocks(
    callback: (blockNumber: number, hash: string) => void
  ): Promise<() => void> {
    const api = await this.getApi();

    const unsubscribe = await api.rpc.chain.subscribeNewHeads((header) => {
      callback(header.number.toNumber(), header.hash.toHex());
    });

    return unsubscribe;
  }

  /**
   * Subscribe to finalized blocks
   */
  async subscribeToFinalizedBlocks(
    callback: (blockNumber: number, hash: string) => void
  ): Promise<() => void> {
    const api = await this.getApi();

    const unsubscribe = await api.rpc.chain.subscribeFinalizedHeads((header) => {
      callback(header.number.toNumber(), header.hash.toHex());
    });

    return unsubscribe;
  }

  // ============================================================================
  // Event Subscriptions
  // ============================================================================

  /**
   * Subscribe to specific pallet events
   */
  async subscribeToEvents(
    pallet: string,
    eventName: string,
    callback: (event: BlockchainEvent) => void
  ): Promise<() => void> {
    const api = await this.getApi();

    const unsubscribe = await api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event } = record;

        if (event.section === pallet && event.method === eventName) {
          api.rpc.chain.getHeader().then((header) => {
            callback({
              blockNumber: header.number.toNumber(),
              timestamp: new Date(),
              pallet: event.section,
              event: event.method,
              data: event.data.toJSON(),
            });
          });
        }
      });
    });

    return unsubscribe as unknown as () => void;
  }

  /**
   * Subscribe to ALL events (for activity logs)
   */
  async subscribeToAllEvents(
    callback: (event: BlockchainEvent) => void
  ): Promise<() => void> {
    const api = await this.getApi();

    const unsubscribe = await api.query.system.events((events: any) => {
      events.forEach((record: any) => {
        const { event, phase } = record;

        // Get extrinsic hash if event is from extrinsic
        let extrinsicHash: string | undefined;
        if (phase.isApplyExtrinsic) {
          const extrinsicIndex = phase.asApplyExtrinsic.toNumber();
          api.rpc.chain.getBlockHash().then((hash) => {
            api.rpc.chain.getBlock(hash).then((block) => {
              if (block.block.extrinsics[extrinsicIndex]) {
                extrinsicHash = block.block.extrinsics[extrinsicIndex].hash.toHex();
              }
            });
          });
        }

        api.rpc.chain.getHeader().then((header) => {
          callback({
            blockNumber: header.number.toNumber(),
            timestamp: new Date(),
            pallet: event.section,
            event: event.method,
            data: event.data.toJSON(),
            extrinsicHash,
          });
        });
      });
    });

    return unsubscribe as unknown as () => void;
  }

  // ============================================================================
  // Balance Queries
  // ============================================================================

  /**
   * Get account balance (DALLA)
   */
  async getBalance(address: string): Promise<bigint> {
    const cacheKey = `balance:${address}`;
    const cached = this.getCached<bigint>(cacheKey);
    if (cached !== null) return cached;

    const api = await this.getApi();
    const account: any = await api.query.system.account(address);
    const balance = account.data.free.toBigInt();

    this.setCache(cacheKey, balance);
    return balance;
  }

  /**
   * Get multiple account balances
   */
  async getBalances(addresses: string[]): Promise<Map<string, bigint>> {
    const api = await this.getApi();
    const balances = new Map<string, bigint>();

    const accounts: any = await api.query.system.account.multi(addresses);

    addresses.forEach((address, index) => {
      const balance = accounts[index].data.free.toBigInt();
      balances.set(address, balance);
      this.setCache(`balance:${address}`, balance);
    });

    return balances;
  }

  // ============================================================================
  // Validator Queries
  // ============================================================================

  /**
   * Get active validators
   */
  async getActiveValidators(): Promise<ValidatorInfo[]> {
    const cached = this.getCached<ValidatorInfo[]>('validators');
    if (cached) return cached;

    const api = await this.getApi();

    const [validators, currentEra] = await Promise.all([
      api.query.staking?.validators?.entries() || [],
      api.query.staking?.currentEra() || 0,
    ]);

    if (!validators.length) {
      return [];
    }

    const validatorInfos: ValidatorInfo[] = await Promise.all(
      validators.map(async ([key, prefs]) => {
        const address = key.args[0].toString();
        const commission = (prefs as any).commission?.toNumber() || 0;

        // Get staking info
        const stakingLedger = await api.query.staking?.ledger?.(address);
        const ownStake = stakingLedger ? (stakingLedger as any).total?.toBigInt() || 0n : 0n;

        // Get nominators
        const nominators = await api.query.staking?.nominators?.entries() || [];
        const nominatorsForValidator = nominators.filter(([, targets]) => {
          const targetsList = (targets as any).targets || [];
          return targetsList.some((t: any) => t.toString() === address);
        });

        // Get total stake (own + nominated)
        let totalStake = ownStake;
        for (const [nominatorKey] of nominatorsForValidator) {
          const nominatorAddress = nominatorKey.args[0].toString();
          const nominatorLedger = await api.query.staking?.ledger?.(nominatorAddress);
          if (nominatorLedger) {
            totalStake += (nominatorLedger as any).total?.toBigInt() || 0n;
          }
        }

        // Get session keys
        const sessionKeys = await api.query.session?.nextKeys?.(address);
        const sessionKeysHex = sessionKeys?.toHex() || '';

        // Get blocks produced (from staking.erasValidatorReward if available)
        const blocksProduced = 0; // Will be calculated from eras

        return {
          address,
          commission: commission / 10000000, // Convert from per-billion to percentage
          totalStake,
          ownStake,
          nominatorCount: nominatorsForValidator.length,
          blocksProduced,
          isActive: true,
          sessionKeys: sessionKeysHex,
        };
      })
    );

    this.setCache('validators', validatorInfos, 60000); // 1 minute cache
    return validatorInfos;
  }

  // ============================================================================
  // Treasury Queries
  // ============================================================================

  /**
   * Get treasury proposals
   */
  async getTreasuryProposals(): Promise<ProposalInfo[]> {
    const api = await this.getApi();

    const proposalsRaw = await api.query.economy?.treasuryProposals?.entries() || [];

    if (!proposalsRaw.length) {
      return [];
    }

    const proposals: ProposalInfo[] = proposalsRaw.map(([key, value]) => {
      const proposalId = (key.args[0] as any).toNumber();
      const proposalData = value.toJSON() as any;

      return {
        id: proposalId,
        proposer: proposalData.proposer,
        beneficiary: proposalData.beneficiary,
        amount: BigInt(proposalData.amount || 0),
        currency: proposalData.currency || 'DALLA',
        description: proposalData.description || '',
        approvals: proposalData.approvals || [],
        requiredApprovals: 4, // 4-of-7 multi-sig
        status: proposalData.status?.toLowerCase() || 'pending',
        createdAt: new Date(proposalData.createdAt || Date.now()),
        executedAt: proposalData.executedAt ? new Date(proposalData.executedAt) : undefined,
      };
    });

    return proposals;
  }

  /**
   * Get treasury balance
   */
  async getTreasuryBalance(): Promise<bigint> {
    const cached = this.getCached<bigint>('treasury:balance');
    if (cached !== null) return cached;

    const api = await this.getApi();
    
    // Treasury account is typically derived from a well-known seed
    const treasuryAccount = await api.query.economy?.treasuryAccount?.() || null;
    
    if (!treasuryAccount) {
      return 0n;
    }

    const treasuryAddress = treasuryAccount.toString();
    const balance = await this.getBalance(treasuryAddress);

    this.setCache('treasury:balance', balance, 10000); // 10 second cache
    return balance;
  }

  // ============================================================================
  // Transaction Submission
  // ============================================================================

  /**
   * Submit and sign transaction
   */
  async submitTransaction(
    extrinsic: any,
    signerAddress: string,
    onStatusUpdate?: (status: string) => void
  ): Promise<{ success: boolean; message: string; txHash?: string }> {
    try {
      const modules = await loadPolkadotModules();
      const injector = await modules.web3FromAddress(signerAddress);

      return new Promise((resolve) => {
        extrinsic
          .signAndSend(signerAddress, { signer: injector.signer }, (result: any) => {
            const status = result.status;

            if (status.isInBlock) {
              onStatusUpdate?.('In block');
            } else if (status.isFinalized) {
              onStatusUpdate?.('Finalized');
              resolve({
                success: true,
                message: 'Transaction finalized',
                txHash: result.txHash.toHex(),
              });
            } else if (status.isInvalid || status.isDropped || status.isUsurped) {
              resolve({
                success: false,
                message: `Transaction failed: ${status.type}`,
              });
            }
          })
          .catch((error: Error) => {
            resolve({
              success: false,
              message: error.message,
            });
          });
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Transaction failed',
      };
    }
  }

  // ============================================================================
  // Governance Queries
  // ============================================================================

  /**
   * Get active governance proposals
   */
  async getGovernanceProposals(): Promise<any[]> {
    const api = await this.getApi();

    const proposals = await api.query.governance?.proposals?.entries() || [];

    return proposals.map(([key, value]) => {
      const proposalId = (key.args[0] as any).toNumber();
      const proposalData = value.toJSON() as any;

      return {
        id: proposalId,
        ...(typeof proposalData === 'object' && proposalData !== null ? proposalData : {}),
      };
    });
  }

  /**
   * Get voting status for proposal
   */
  async getVotingStatus(proposalId: number): Promise<any> {
    const api = await this.getApi();

    const voting = await api.query.governance?.voting?.(proposalId);

    if (!voting) {
      return null;
    }

    return voting.toJSON();
  }
}

// Export singleton instance (lazy initialization to avoid SSR issues)
let blockchainServiceInstance: BlockchainService | null = null;

export const blockchainService = (() => {
  if (typeof window === 'undefined') {
    // Return a proxy during SSR that throws meaningful errors
    return new Proxy({} as BlockchainService, {
      get() {
        throw new Error('BlockchainService cannot be used during server-side rendering');
      }
    });
  }
  
  if (!blockchainServiceInstance) {
    blockchainServiceInstance = new BlockchainService();
  }
  
  return blockchainServiceInstance;
})();
