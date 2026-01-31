/**
 * BelizeChain Substrate Type Definitions
 * 
 * These types provide proper TypeScript interfaces for @polkadot/api responses
 */

import type { u32, u128 } from '@polkadot/types-codec';
import type { AccountId as PolkadotAccountId } from '@polkadot/types/interfaces';

// Re-export for use in other modules
export type { PolkadotAccountId as AccountId };

/**
 * Account information returned from system.account query
 */
export interface AccountInfo {
  nonce: u32;
  consumers: u32;
  providers: u32;
  sufficients: u32;
  data: AccountData;
}

/**
 * Account balance data
 */
export interface AccountData {
  free: u128;
  reserved: u128;
  miscFrozen: u128;
  feeFrozen: u128;
}

/**
 * Parsed account balance (converted to numbers/strings)
 */
export interface ParsedAccountBalance {
  free: string;
  reserved: string;
  frozen: string;
  total: string;
}

/**
 * Business account details
 */
export interface BusinessAccount {
  address: string;
  name: string;
  category: 'retail' | 'hospitality' | 'tourism' | 'services' | 'other';
  balance: ParsedAccountBalance;
  dailyLimit: string;
  monthlyVolume: string;
  lastTransaction?: {
    timestamp: Date;
    amount: string;
    type: 'received' | 'sent';
  };
}

/**
 * Transaction details
 */
export interface Transaction {
  hash: string;
  blockNumber: number;
  blockHash: string;
  extrinsicIndex: number;
  from: string;
  to: string;
  amount: string;
  currency: 'DALLA' | 'bBZD';
  status: 'success' | 'failed' | 'pending';
  timestamp: Date;
  fee: string;
  metadata?: Record<string, unknown>;
}

/**
 * Block information
 */
export interface BlockInfo {
  number: number;
  hash: string;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  timestamp: Date;
  extrinsicsCount: number;
  eventsCount: number;
  validator?: string;
}

/**
 * Network statistics
 */
export interface NetworkStats {
  blockHeight: number;
  blockTime: number; // Average in seconds
  peerCount: number;
  validators: number;
  totalIssuance: string;
  transactionsPerSecond: number;
  syncing: boolean;
}

/**
 * KYC verification status
 */
export interface KYCVerification {
  accountId: string;
  level: 0 | 1 | 2 | 3;
  verificationDate: Date;
  expiryDate: Date;
  verifierId: string;
  documentHash: string;
  status: 'active' | 'expired' | 'revoked';
}

/**
 * Governance proposal
 */
export interface GovernanceProposal {
  id: number;
  proposer: string;
  title: string;
  description: string;
  status: 'pending' | 'voting' | 'approved' | 'rejected' | 'executed';
  votesFor: string;
  votesAgainst: string;
  threshold: string;
  createdAt: Date;
  votingEndsAt: Date;
}

/**
 * Staking information
 */
export interface StakingInfo {
  validator: string;
  totalStake: string;
  ownStake: string;
  nominators: number;
  commission: number; // Percentage
  active: boolean;
  flContributions: number;
  qualityScore: number;
  timelinesScore: number;
  honestyScore: number;
}

/**
 * Quantum job status
 */
export interface QuantumJob {
  id: string;
  submitter: string;
  backend: string;
  circuitHash: string;
  numQubits: number;
  circuitDepth: number;
  numShots: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  resultHash?: string;
  accuracy?: number;
  submittedAt: Date;
  completedAt?: Date;
}

/**
 * Federated learning round
 */
export interface FLRound {
  roundNumber: number;
  modelHash: string;
  participants: number;
  status: 'collecting' | 'aggregating' | 'completed';
  averageQuality: number;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Search result type
 */
export interface SearchResult {
  type: 'block' | 'transaction' | 'account';
  data: BlockInfo | Transaction | AccountInfo;
  relevance: number;
}

/**
 * API error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Type guard for account info
 */
export function isAccountInfo(data: unknown): data is AccountInfo {
  return (
    typeof data === 'object' &&
    data !== null &&
    'nonce' in data &&
    'data' in data
  );
}

/**
 * Type guard for transaction
 */
export function isTransaction(data: unknown): data is Transaction {
  return (
    typeof data === 'object' &&
    data !== null &&
    'hash' in data &&
    'from' in data &&
    'to' in data
  );
}

/**
 * Type guard for block info
 */
export function isBlockInfo(data: unknown): data is BlockInfo {
  return (
    typeof data === 'object' &&
    data !== null &&
    'number' in data &&
    'hash' in data &&
    'extrinsicsCount' in data
  );
}
