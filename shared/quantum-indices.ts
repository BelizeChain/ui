/**
 * Quantum Pallet Index Mappings for BelizeChain
 * 
 * TypeScript/JavaScript constants for quantum pallet enums that use the u8 index
 * pattern required by Substrate v42. All blockchain interactions must use these
 * numeric indices instead of enum variants.
 * 
 * @module quantum-indices
 * @see docs/QUANTUM_PALLET_DECODING_RESOLUTION.md
 * @see kinich/blockchain/quantum_indices.py (Python equivalent)
 */

/**
 * Quantum computing backend indices
 * Maps to QuantumBackend enum in pallet-belize-quantum
 * Total variants: 8 (indices 0-7)
 */
export enum QuantumBackendIndex {
  AzureIonQ = 0,
  AzureQuantinuum = 1,
  AzureRigetti = 2,
  IBMQuantum = 3,
  Qiskit = 4,
  SpinQGemini = 5,
  SpinQTriangulum = 6,
  Other = 7,
}

/**
 * Quantum job status indices
 * Maps to JobStatus enum in pallet-belize-quantum
 * Total variants: 5 (indices 0-4)
 */
export enum JobStatusIndex {
  Pending = 0,
  Running = 1,
  Completed = 2,
  Failed = 3,
  Cancelled = 4,
}

/**
 * Result verification status indices
 * Maps to VerificationStatus enum in pallet-belize-quantum
 * Total variants: 4 (indices 0-3)
 */
export enum VerificationStatusIndex {
  Unverified = 0,
  Verifying = 1,
  Verified = 2,
  Failed = 3,
}

/**
 * Quantum achievement type indices for NFT minting
 * Maps to AchievementType enum in pallet-belize-quantum
 * Total variants: 12 (indices 0-11)
 */
export enum AchievementTypeIndex {
  FirstQuantumJob = 0,
  GroverAlgorithm = 1,
  ShorAlgorithm = 2,
  QuantumFourierTransform = 3,
  VQEAlgorithm = 4,
  QAOAAlgorithm = 5,
  Accuracy95 = 6,
  Accuracy99 = 7,
  VolumeContributor100 = 8,
  VolumeContributor1000 = 9,
  ErrorMitigationChampion = 10,
  Custom = 11,
}

/**
 * Verification vote indices
 * Maps to VerificationVote enum in pallet-belize-quantum
 * Total variants: 3 (indices 0-2)
 */
export enum VerificationVoteIndex {
  Approve = 0,
  Reject = 1,
  Abstain = 2,
}

/**
 * Cross-chain bridge destination indices
 * Maps to ChainDestination enum in pallet-belize-quantum
 * Total variants: 5 (indices 0-4)
 * 
 * Note: Parachain variant contains parachain_id which must be handled separately
 */
export enum ChainDestinationIndex {
  Ethereum = 0,
  Polkadot = 1,
  Kusama = 2,
  Parachain = 3,  // Requires parachain_id parameter
  BelizeChain = 4,
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate quantum backend index is in valid range
 * @param index - Backend index to validate
 * @returns true if index is between 0-7
 */
export function validateBackendIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index <= 7;
}

/**
 * Validate job status index is in valid range
 * @param index - Status index to validate
 * @returns true if index is between 0-4
 */
export function validateJobStatusIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index <= 4;
}

/**
 * Validate verification status index is in valid range
 * @param index - Verification status index to validate
 * @returns true if index is between 0-3
 */
export function validateVerificationStatusIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index <= 3;
}

/**
 * Validate achievement type index is in valid range
 * @param index - Achievement type index to validate
 * @returns true if index is between 0-11
 */
export function validateAchievementTypeIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index <= 11;
}

/**
 * Validate verification vote index is in valid range
 * @param index - Vote index to validate
 * @returns true if index is between 0-2
 */
export function validateVerificationVoteIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index <= 2;
}

/**
 * Validate chain destination index is in valid range
 * @param index - Destination index to validate
 * @returns true if index is between 0-4
 */
export function validateChainDestinationIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index <= 4;
}

// ============================================================================
// String Conversion Functions
// ============================================================================

/**
 * Backend name lookup table
 */
const BACKEND_NAMES: Record<number, string> = {
  0: 'Azure IonQ',
  1: 'Azure Quantinuum',
  2: 'Azure Rigetti',
  3: 'IBM Quantum',
  4: 'Qiskit',
  5: 'SpinQ Gemini',
  6: 'SpinQ Triangulum',
  7: 'Other',
};

/**
 * Job status name lookup table
 */
const JOB_STATUS_NAMES: Record<number, string> = {
  0: 'Pending',
  1: 'Running',
  2: 'Completed',
  3: 'Failed',
  4: 'Cancelled',
};

/**
 * Verification status name lookup table
 */
const VERIFICATION_STATUS_NAMES: Record<number, string> = {
  0: 'Unverified',
  1: 'Verifying',
  2: 'Verified',
  3: 'Failed',
};

/**
 * Achievement type name lookup table
 */
const ACHIEVEMENT_TYPE_NAMES: Record<number, string> = {
  0: 'First Quantum Job',
  1: 'Grover Algorithm',
  2: 'Shor Algorithm',
  3: 'Quantum Fourier Transform',
  4: 'VQE Algorithm',
  5: 'QAOA Algorithm',
  6: '95% Accuracy',
  7: '99% Accuracy',
  8: '100 Jobs Contributor',
  9: '1000 Jobs Contributor',
  10: 'Error Mitigation Champion',
  11: 'Custom Achievement',
};

/**
 * Verification vote name lookup table
 */
const VERIFICATION_VOTE_NAMES: Record<number, string> = {
  0: 'Approve',
  1: 'Reject',
  2: 'Abstain',
};

/**
 * Chain destination name lookup table
 */
const CHAIN_DESTINATION_NAMES: Record<number, string> = {
  0: 'Ethereum',
  1: 'Polkadot',
  2: 'Kusama',
  3: 'Parachain',
  4: 'BelizeChain',
};

/**
 * Convert backend index to human-readable name
 * @param index - Backend index (0-7)
 * @returns Backend name or 'Unknown'
 */
export function getBackendName(index: number): string {
  return BACKEND_NAMES[index] || 'Unknown';
}

/**
 * Convert job status index to human-readable name
 * @param index - Status index (0-4)
 * @returns Status name or 'Unknown'
 */
export function getJobStatusName(index: number): string {
  return JOB_STATUS_NAMES[index] || 'Unknown';
}

/**
 * Convert verification status index to human-readable name
 * @param index - Verification status index (0-3)
 * @returns Verification status name or 'Unknown'
 */
export function getVerificationStatusName(index: number): string {
  return VERIFICATION_STATUS_NAMES[index] || 'Unknown';
}

/**
 * Convert achievement type index to human-readable name
 * @param index - Achievement type index (0-11)
 * @returns Achievement type name or 'Unknown'
 */
export function getAchievementTypeName(index: number): string {
  return ACHIEVEMENT_TYPE_NAMES[index] || 'Unknown';
}

/**
 * Convert verification vote index to human-readable name
 * @param index - Vote index (0-2)
 * @returns Vote name or 'Unknown'
 */
export function getVerificationVoteName(index: number): string {
  return VERIFICATION_VOTE_NAMES[index] || 'Unknown';
}

/**
 * Convert chain destination index to human-readable name
 * @param index - Destination index (0-4)
 * @returns Destination name or 'Unknown'
 */
export function getChainDestinationName(index: number): string {
  return CHAIN_DESTINATION_NAMES[index] || 'Unknown';
}

/**
 * Convert backend string to index
 * @param backend - Backend name (case-insensitive)
 * @returns Backend index or 7 (Other)
 */
export function backendStringToIndex(backend: string): number {
  const lowerBackend = backend.toLowerCase().replace(/\s+/g, '_');
  
  const mapping: Record<string, number> = {
    'azure_ionq': QuantumBackendIndex.AzureIonQ,
    'azure_quantinuum': QuantumBackendIndex.AzureQuantinuum,
    'azure_rigetti': QuantumBackendIndex.AzureRigetti,
    'ibm_quantum': QuantumBackendIndex.IBMQuantum,
    'qiskit': QuantumBackendIndex.Qiskit,
    'spinq_gemini': QuantumBackendIndex.SpinQGemini,
    'spinq_triangulum': QuantumBackendIndex.SpinQTriangulum,
  };
  
  return mapping[lowerBackend] ?? QuantumBackendIndex.Other;
}

// ============================================================================
// Type Definitions for Blockchain Data
// ============================================================================

/**
 * Quantum job data structure
 */
export interface QuantumJob {
  jobId: string;
  submitter: string;
  backendIndex: number;
  circuitHash: Uint8Array;
  numQubits: number;
  circuitDepth: number;
  numShots: number;
  statusIndex: number;
  submissionTime: number;
  completionTime?: number;
  resultHash?: Uint8Array;
  verificationStatusIndex: number;
  dallaCost: bigint;
  executor?: string;
}

/**
 * Quantum result data structure
 */
export interface QuantumResult {
  jobId: string;
  resultDataHash: Uint8Array;
  verificationProof: Uint8Array;
  accuracyScore: number;
  validator: string;
  recordedAt: number;
}

/**
 * Quantum achievement NFT data structure
 */
export interface QuantumAchievementNFT {
  nftId: number;
  jobId: string;
  achievementTypeIndex: number;
  owner: string;
  metadataUri: string;
  mintedAt: number;
  transferable: boolean;
}

/**
 * Account statistics
 */
export interface AccountStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalSpent: bigint;
  totalQubits: bigint;
  totalShots: bigint;
  nftsEarned: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all backend options for dropdown menus
 * @returns Array of backend options with index and name
 */
export function getBackendOptions(): Array<{ value: number; label: string }> {
  return Object.entries(BACKEND_NAMES).map(([index, name]) => ({
    value: parseInt(index),
    label: name,
  }));
}

/**
 * Get all job status options for dropdown menus
 * @returns Array of status options with index and name
 */
export function getJobStatusOptions(): Array<{ value: number; label: string }> {
  return Object.entries(JOB_STATUS_NAMES).map(([index, name]) => ({
    value: parseInt(index),
    label: name,
  }));
}

/**
 * Get all achievement type options for dropdown menus
 * @returns Array of achievement options with index and name
 */
export function getAchievementTypeOptions(): Array<{ value: number; label: string }> {
  return Object.entries(ACHIEVEMENT_TYPE_NAMES).map(([index, name]) => ({
    value: parseInt(index),
    label: name,
  }));
}

/**
 * Get status color for UI display
 * @param statusIndex - Job status index
 * @returns Color string (green, blue, yellow, red, gray)
 */
export function getJobStatusColor(statusIndex: number): string {
  switch (statusIndex) {
    case JobStatusIndex.Completed:
      return 'green';
    case JobStatusIndex.Running:
      return 'blue';
    case JobStatusIndex.Pending:
      return 'yellow';
    case JobStatusIndex.Failed:
      return 'red';
    case JobStatusIndex.Cancelled:
      return 'gray';
    default:
      return 'gray';
  }
}

/**
 * Get verification status color for UI display
 * @param statusIndex - Verification status index
 * @returns Color string (green, blue, yellow, red)
 */
export function getVerificationStatusColor(statusIndex: number): string {
  switch (statusIndex) {
    case VerificationStatusIndex.Verified:
      return 'green';
    case VerificationStatusIndex.Verifying:
      return 'blue';
    case VerificationStatusIndex.Unverified:
      return 'yellow';
    case VerificationStatusIndex.Failed:
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Calculate estimated cost for quantum job
 * @param numQubits - Number of qubits
 * @param numShots - Number of shots
 * @param dallaPerQubit - Cost per qubit (default: 0.000001 DALLA)
 * @param dallaPerShot - Cost per shot (default: 0.0000001 DALLA)
 * @returns Estimated cost in DALLA
 */
export function calculateQuantumJobCost(
  numQubits: number,
  numShots: number,
  dallaPerQubit: number = 0.000001,
  dallaPerShot: number = 0.0000001
): number {
  return (numQubits * dallaPerQubit) + (numShots * dallaPerShot);
}

// ============================================================================
// Export Summary
// ============================================================================

export default {
  // Enums
  QuantumBackendIndex,
  JobStatusIndex,
  VerificationStatusIndex,
  AchievementTypeIndex,
  VerificationVoteIndex,
  ChainDestinationIndex,
  
  // Validation
  validateBackendIndex,
  validateJobStatusIndex,
  validateVerificationStatusIndex,
  validateAchievementTypeIndex,
  validateVerificationVoteIndex,
  validateChainDestinationIndex,
  
  // Conversion
  getBackendName,
  getJobStatusName,
  getVerificationStatusName,
  getAchievementTypeName,
  getVerificationVoteName,
  getChainDestinationName,
  backendStringToIndex,
  
  // Helpers
  getBackendOptions,
  getJobStatusOptions,
  getAchievementTypeOptions,
  getJobStatusColor,
  getVerificationStatusColor,
  calculateQuantumJobCost,
};
