/**
 * Polkadot.js Connection Manager for Blue Hole Portal
 * 
 * Manages blockchain connection with:
 * - WebSocket provider with fallback URLs
 * - Automatic reconnection
 * - Connection status tracking
 * - Metadata caching
 * - Custom type registry for BelizeChain pallets
 */

import { ApiPromise, WsProvider } from '@polkadot/api';
import { TypeRegistry } from '@polkadot/types';
import type { ApiOptions } from '@polkadot/api/types';

// BelizeChain custom types for all 15 pallets
const belizeChainTypes = {
  // Economy Pallet Types
  AccountType: {
    _enum: ['Citizen', 'Business', 'Tourism', 'Government']
  },
  TransactionLimit: {
    daily_limit: 'u128',
    remaining: 'u128',
    last_reset: 'u32'
  },
  
  // Identity Pallet Types
  BelizeID: {
    ssn: '[u8; 11]',
    passport: 'Option<[u8; 9]>',
    kyc_level: 'KYCLevel',
    verified_at: 'u32'
  },
  KYCLevel: {
    _enum: ['Observer', 'Contributor', 'Validator']
  },
  
  // Governance Pallet Types
  District: {
    _enum: ['Belize', 'Cayo', 'Corozal', 'OrangeWalk', 'StannCreek', 'Toledo']
  },
  Department: {
    _enum: ['Finance', 'Education', 'Health', 'Works', 'Justice', 'Tourism', 'Agriculture', 'Defense']
  },
  ProposalStatus: {
    _enum: ['Draft', 'Active', 'Voting', 'Approved', 'Rejected', 'Executed']
  },
  VoteType: {
    _enum: ['Aye', 'Nay', 'Abstain']
  },
  
  // Staking Pallet Types (PoUW)
  TrainingContribution: {
    quality_score: 'u8',
    timeliness_score: 'u8',
    honesty_score: 'u8',
    total_score: 'u32'
  },
  
  // Quantum Pallet Types (PQW)
  QuantumWorkProof: {
    circuit_hash: 'H256',
    difficulty: 'u32',
    verification_data: 'Vec<u8>'
  },
  
  // LandLedger Pallet Types
  PropertyType: {
    _enum: ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Reserve']
  },
  LandTitle: {
    parcel_id: 'Vec<u8>',
    owner: 'AccountId',
    property_type: 'PropertyType',
    area_sqm: 'u32',
    district: 'District'
  }
};

/**
 * Connection Manager Class
 * Singleton pattern for managing single blockchain connection
 */
class BlockchainConnectionManager {
  private static instance: BlockchainConnectionManager;
  private api: ApiPromise | null = null;
  private provider: WsProvider | null = null;
  private isConnecting: boolean = false;
  private connectionListeners: Array<(status: ConnectionStatus) => void> = [];
  
  // Connection endpoints (primary + fallbacks)
  private endpoints = [
    'ws://127.0.0.1:9944',           // Local development node
    'ws://localhost:9944',            // Fallback localhost
    'wss://rpc.belizechain.org',     // Production (when deployed)
  ];
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  static getInstance(): BlockchainConnectionManager {
    if (!BlockchainConnectionManager.instance) {
      BlockchainConnectionManager.instance = new BlockchainConnectionManager();
    }
    return BlockchainConnectionManager.instance;
  }
  
  /**
   * Connect to BelizeChain with custom types and metadata
   */
  async connect(): Promise<ApiPromise> {
    if (this.api?.isConnected) {
      return this.api;
    }
    
    if (this.isConnecting) {
      // Wait for existing connection attempt
      return new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (this.api?.isConnected) {
            clearInterval(checkConnection);
            resolve(this.api);
          }
        }, 100);
      });
    }
    
    this.isConnecting = true;
    this.notifyListeners({ status: 'connecting', message: 'Connecting to BelizeChain...' });
    
    try {
      // Create WsProvider with fallback endpoints
      this.provider = new WsProvider(this.endpoints);
      
      // API options with custom types
      const options: ApiOptions = {
        provider: this.provider,
        types: belizeChainTypes,
        throwOnConnect: false,
      };
      
      // Create API instance
      this.api = await ApiPromise.create(options);
      
      // Wait for API to be ready
      await this.api.isReady;
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isConnecting = false;
      this.notifyListeners({ status: 'connected', message: 'Connected to BelizeChain' });
      
      console.log('✅ Connected to BelizeChain');
      console.log(`🔗 Chain: ${(await this.api.rpc.system.chain()).toString()}`);
      console.log(`📦 Node: ${(await this.api.rpc.system.name()).toString()}`);
      console.log(`🔢 Version: ${(await this.api.rpc.system.version()).toString()}`);
      
      return this.api;
    } catch (error) {
      this.isConnecting = false;
      this.notifyListeners({ 
        status: 'error', 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      throw error;
    }
  }
  
  /**
   * Set up API event listeners for connection status
   */
  private setupEventListeners(): void {
    if (!this.api) return;
    
    this.api.on('connected', () => {
      console.log('🟢 API connected');
      this.notifyListeners({ status: 'connected', message: 'Connected' });
    });
    
    this.api.on('disconnected', () => {
      console.log('🔴 API disconnected');
      this.notifyListeners({ status: 'disconnected', message: 'Disconnected from node' });
    });
    
    this.api.on('error', (error) => {
      console.error('❌ API error:', error);
      this.notifyListeners({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    });
    
    this.api.on('ready', () => {
      console.log('✅ API ready');
      this.notifyListeners({ status: 'ready', message: 'API ready' });
    });
  }
  
  /**
   * Get current API instance
   */
  getApi(): ApiPromise | null {
    return this.api;
  }
  
  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.api?.isConnected || false;
  }
  
  /**
   * Disconnect from blockchain
   */
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
      this.provider = null;
      this.notifyListeners({ status: 'disconnected', message: 'Disconnected' });
    }
  }
  
  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify all listeners of status change
   */
  private notifyListeners(status: ConnectionStatus): void {
    this.connectionListeners.forEach(listener => listener(status));
  }
  
  /**
   * Get chain metadata
   */
  async getChainInfo(): Promise<ChainInfo | null> {
    if (!this.api?.isConnected) return null;
    
    try {
      const [chain, nodeName, nodeVersion, lastHeader] = await Promise.all([
        this.api.rpc.system.chain(),
        this.api.rpc.system.name(),
        this.api.rpc.system.version(),
        this.api.rpc.chain.getHeader(),
      ]);
      
      return {
        chain: chain.toString(),
        nodeName: nodeName.toString(),
        nodeVersion: nodeVersion.toString(),
        blockNumber: lastHeader.number.toNumber(),
        blockHash: lastHeader.hash.toString(),
      };
    } catch (error) {
      console.error('Failed to get chain info:', error);
      return null;
    }
  }
}

// Export singleton instance
export const connectionManager = BlockchainConnectionManager.getInstance();

// Types
export interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'ready' | 'disconnected' | 'error';
  message: string;
}

export interface ChainInfo {
  chain: string;
  nodeName: string;
  nodeVersion: string;
  blockNumber: number;
  blockHash: string;
}

// Convenience exports
export const connectToChain = () => connectionManager.connect();
export const getApi = () => connectionManager.getApi();
export const isConnected = () => connectionManager.isConnected();
export const disconnectFromChain = () => connectionManager.disconnect();
export const onConnectionChange = (callback: (status: ConnectionStatus) => void) => 
  connectionManager.onConnectionChange(callback);
export const getChainInfo = () => connectionManager.getChainInfo();
