// BelizeChain Shared Library
// Main entry point for all shared components, hooks, and utilities

// Components (Modern UI from Maya Wallet)
export * from './components';
export * from './components/ui';

// Utility functions
export { cn } from './lib/utils';
export {
  getBlockchainWsEndpoints,
  getRuntimeConfig,
  isLocalRuntimeConfig,
  type RuntimeConfig,
} from './lib/runtime-config';

// GEM contract metadata (ink! ABIs) and address keys
export {
  gemAbis,
  dallaAbi,
  beliNftAbi,
  daoAbi,
  faucetAbi,
  psp37Abi,
  dexFactoryAbi,
  dexPairAbi,
  dexRouterAbi,
  type GemContractKey,
} from './lib/gem-abis';

// Hooks (explicit re-exports for visibility)
export { useWallet, useBalance, useNewBlocks, type UseWalletReturn, type WalletState } from './hooks/useWallet';
export {
  useServiceProbes,
  type ServiceProbeId,
  type ServiceProbeState,
  type ServiceProbeStatus,
  type ServiceProbeSummary,
} from './hooks/useServiceProbes';

// i18n (explicit re-exports)
export { useI18n, getTranslations, localeInfo, type Locale, type Translations } from './i18n';

// API Clients (export only client classes/functions to avoid type conflicts)
export { KinichClient, getKinichClient, type QuantumJob } from './api/kinich-client';
// A `NawalClient` lived here and targeted ten `/api/v1/{tasks,contributions,
// scores,genomes,models}` routes. None of them exist on the coordinator — its
// real surface is `/api/v1/fl/*` — so every method could only fail. It had no
// importers, so it is gone rather than rewritten. The routes that do exist are
// used through `maya-wallet/src/services/pallets/nawal.ts`.
export {
  PakitClient,
  getPakitClient,
  type PakitConfig,
  type UploadOptions,
  type UploadResult,
  type DocumentMetadata,
} from './api/pakit-client';

// Services
export {
  TransactionIndexer,
  type Transaction,
  type TransactionFilter,
} from './services/transaction-indexer';

// Styles
export * from './styles';

// Types
export * from './types';

// Utils
export {
  logger,
  explorerLogger,
  walletLogger,
  businessLogger,
  portalLogger,
  validatorLogger,
  governanceLogger,
} from './utils/logger';

export {
  getUserFriendlyError,
  getUserFriendlyErrorMessage,
  type FriendlyError,
} from './utils/blockchain-errors';

export {
  estimateFee,
  estimateBatchFee,
  getEstimatedFeeString,
  type FeeEstimate,
  type FeeEstimateResult,
} from './utils/fee-estimator';
