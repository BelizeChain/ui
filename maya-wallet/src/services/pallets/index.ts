/**
 * BelizeChain Pallet Services Index
 * Centralized exports for all 15 pallet integrations
 */

// Identity & Compliance
export * from './identity';

// Economy & Finance — aligned with belizeX pallet (AssetId enum: DALLA|BBZD|TourismDALLA|WUSDC)
export {
  getTradingPairs,
  findPair,
  getSwapQuote,
  executeSwap,
  addLiquidity,
  removeLiquidity,
  getLpBalance,
  getTradeHistory,
  toPlanck,
  fromPlanck,
  ASSET_SYMBOLS,
} from './belizex';
export type { AssetSymbol, TradingPair, SwapQuote, SwapResult, TradeHistory } from './belizex';

// Governance & Democracy
export { getActiveProposals, submitProposal, voteOnProposal, getActiveReferenda, getDistrictCouncil, getVotingHistory, secondProposal } from './governance';

// Staking & Rewards
export { getStakingInfo, stakeDalla, unstakeDalla, claimStakingRewards, getPoUWContributions, getActiveValidators, reportTrainingContribution, calculatePoUWReward } from './staking';

// Land Registry & Documents
export { getLandTitle, getUserLandTitles, getPropertyDocuments, registerDocument, initiatePropertyTransfer, getPropertyTransferHistory, searchLandByLocation, getDocumentDownloadUrl } from './landledger';

// Tourism & Merchants
export { getVerifiedMerchant, getVerifiedMerchants, isMerchantVerified, getTourismRewards, getTourismStats, redeemTourismCashback, reportMerchantTransaction, getMerchantMapMarkers } from './oracle';

// Domain Name Service
export { isDomainAvailable, getDomain, registerDomain, resolveDomain, resolveAddress, setDomainResolution, setPrimaryDomain, listDomainForSale, getMarketplaceListings, purchaseDomain, hostWebsite, getHostedWebsite, getUserDomains } from './bns';

// Payroll Management
export { getPayrollRecord, getSalaryPayments, getSalarySlip, getPayrollStats, getTaxSummary, downloadSalarySlip, verifySalaryPayment, requestSalaryAdvance } from './payroll';

// Cross-Chain Interoperability
export { getBridges, initiateBridgeTransfer, getBridgeTransfer, getUserBridgeTransfers, estimateBridgeFee, cancelBridgeTransfer, claimBridgeRefund, validateCrossChainAddress } from './interoperability';

// Quantum Computing
export { getQuantumBackends, submitQuantumJob, getQuantumJob, getUserQuantumJobs, cancelQuantumJob, getQuantumWorkProofs, claimQuantumReward, estimateQuantumCost, getQuantumStats, validateQASM, generateCircuitTemplate } from './quantum';

// Community Governance
export { getCommunityGroups, createCommunityGroup, joinCommunityGroup, getCommunityProposals, submitCommunityProposal, voteOnCommunityProposal, contributeToCommunityFund, getCommunityEvents, rsvpToEvent, getUserCommunityGroups } from './community';

// Smart Contracts (GEM Platform) — see src/services/gem.ts for the
// ContractPromise-based implementation. The legacy ./contracts module
// targeted a non-existent api.query.contracts.call() API and has been removed.

// Type exports
export type { BelizeID, SSNRecord, PassportRecord, KYCStatus } from './identity';
// belizeX types are exported above alongside the runtime helpers.
export type { Proposal, Referendum, DistrictCouncil, Motion, Vote } from './governance';
export type { StakingInfo, PoUWContribution, Validator } from './staking';
export type { LandTitle, Encumbrance, PropertyDocument, PropertyTransfer } from './landledger';
export type { VerifiedMerchant, TourismReward, TourismStats } from './oracle';
export type { Domain, DomainListing, HostedWebsite } from './bns';
export type { PayrollRecord, SalaryPayment, SalarySlip } from './payroll';
export type { Bridge, BridgeTransfer } from './interoperability';
export type { QuantumJob, QuantumResult, QuantumWorkProof, QuantumBackend } from './quantum';
export type { CommunityGroup, CommunityProposal, CommunityFund, CommunityEvent, Milestone } from './community';

