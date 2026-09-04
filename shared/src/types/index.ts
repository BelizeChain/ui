// BelizeChain Shared Types

// Account Types
export interface BelizeAccount {
  address: string;
  name?: string;
  type: AccountType;
  balance: Balance;
  isVerified: boolean;
}

export enum AccountType {
  CITIZEN = 'citizen',
  BUSINESS = 'business',
  TOURISM = 'tourism',
  GOVERNMENT = 'government',
  VALIDATOR = 'validator',
}

export interface Balance {
  dalla: string; // Native token
  bBZD: string;  // Stablecoin
  free: string;
  reserved: string;
  total: string;
}

// Transaction Types
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  currency: 'DALLA' | 'bBZD';
  timestamp: number;
  status: TransactionStatus;
  fee: string;
  blockNumber: number;
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

// Governance Types
export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  district?: string;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  deadline: number;
  createdAt: number;
}

export enum ProposalStatus {
  ACTIVE = 'active',
  PASSED = 'passed',
  REJECTED = 'rejected',
  EXECUTED = 'executed',
}

// Validator Types
export interface Validator {
  address: string;
  name?: string;
  stake: string;
  commission: number;
  isActive: boolean;
  reputation: number;
  flScore: FederatedLearningScore;
}

export interface FederatedLearningScore {
  quality: number;      // 0-100
  timeliness: number;   // 0-100
  honesty: number;      // 0-100
  overall: number;      // 0-100
}

// Storage Types (Pakit)
export interface StorageMetadata {
  contentId: string;
  size: number;
  compressionAlgorithm: string;
  compressionRatio: number;
  tier: 'hot' | 'warm' | 'cold';
  timestamp: number;
  owner: string;
}

export interface StorageStats {
  totalStored: number;
  uniqueContent: number;
  duplicateSaves: number;
  bytesSaved: number;
  efficiency: number;
}

// Quantum Types (Kinich)
export interface QuantumJob {
  id: string;
  type: 'compression' | 'encoding' | 'computation';
  status: 'pending' | 'running' | 'completed' | 'failed';
  submittedBy: string;
  submittedAt: number;
  completedAt?: number;
  result?: any;
}

// UI State Types
export interface UIState {
  theme: 'light' | 'dark';
  language: 'en' | 'es' | 'kriol';
  isOffline: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  read: boolean;
}

// Tourism Incentive Types
export interface TourismReward {
  merchantAddress: string;
  merchantName: string;
  merchantCategory: 'hotel' | 'restaurant' | 'tour' | 'retail';
  rewardPercentage: number; // 5-8%
  transactionAmount: string;
  rewardAmount: string;
  timestamp: number;
}

// KYC/Compliance Types
export interface KYCStatus {
  address: string;
  level: 'none' | 'basic' | 'full';
  isVerified: boolean;
  verifiedAt?: number;
  expiresAt?: number;
  documents: KYCDocument[];
}

export interface KYCDocument {
  id: string;
  type: 'id' | 'passport' | 'birth_certificate' | 'utility_bill' | 'business_registration';
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: number;
  ipfsHash?: string;
}

// ============================================================================
// Ethical Safeguards & Civic Justice Types (Pallets 35, 36, 37)
// ============================================================================

// Pallet 35: BelizeJustice
export type DisputeSeverity = 'Minor' | 'Moderate' | 'Severe';
export type DisputeStatus = 'Pending' | 'UnderReview' | 'Ruled' | 'Appealed' | 'Closed';
export type RehabStatus = 'Clean' | 'InCoolingOff' | 'InRehabilitation' | 'Reinstated';
export type DisputeResolution =
  | { type: 'Dismissed' }
  | { type: 'Upheld' }
  | { type: 'Mediated'; slashBps: number };

export interface DisputeRecord {
  id: number;
  disputant: string;
  target: string;
  evidenceHash: string;
  severity: DisputeSeverity;
  openedAt: number;
  status: DisputeStatus;
  resolution?: DisputeResolution | null;
  bond: string;
  appealEvidence?: string | null;
}

// Pallet 36: BelizeWhistleblower
export type ReportCategory = 'Fraud' | 'SystematicAbuse' | 'ChainExploit';
export type ReportStatus = 'Pending' | 'UnderReview' | 'Verified' | 'Dismissed' | 'Claimed';

export interface WhistleblowerReport {
  id: number;
  commitment: string;
  target: string;
  evidenceHash: string;
  category: ReportCategory;
  submittedAt: number;
  status: ReportStatus;
  bond: string;
  bondDepositor: string;
  reasoningHash?: string | null;
  escrowedReward?: string | null;
}

export interface WhistleblowerTicket {
  reportId?: number;
  commitment: string;
  secret: string; // 32-byte hex
  target: string;
  category: ReportCategory;
  evidenceHash: string;
  timestamp: number;
  accountAddress: string;
}

// Pallet 37: BelizeModeration
export type FlagReason = 'HateSpeech' | 'Misinformation' | 'Spam' | 'IllegalContent' | 'AddictivePattern';
export type ModerationRuling = 'Cleared' | 'Removed' | 'Escalated';

export interface ModerationItem {
  contentHash: string;
  flagCount: number;
  isQueued: boolean;
  nawalScore?: number | null;
  ruling?: ModerationRuling | null;
  reasons: FlagReason[];
}

