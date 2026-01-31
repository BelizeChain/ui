// BelizeChain Shared Library
// Main entry point for all shared components, hooks, and utilities

// Components (Modern UI from Maya Wallet)
export * from './components';
export * from './components/ui';

// Utility functions
export { cn } from './lib/utils';

// Hooks (explicit re-exports for visibility)
export { useWallet, useBalance, useNewBlocks, type UseWalletReturn, type WalletState } from './hooks/useWallet';

// i18n (explicit re-exports)
export { useI18n, getTranslations, localeInfo, type Locale, type Translations } from './i18n';

// API Clients (export only client classes/functions to avoid type conflicts)
export { KinichClient, getKinichClient } from './api/kinich-client';
export { NawalClient, getNawalClient } from './api/nawal-client';
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
