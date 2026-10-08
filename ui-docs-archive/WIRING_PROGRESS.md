# Maya Wallet - UI Wiring Progress Tracker

**Last Updated**: January 25, 2026  
**Status**: 🟡 **Wiring In Progress (15% Complete)**

---

## Legend
- ✅ **Complete** - Fully wired to blockchain, tested
- 🔄 **In Progress** - Currently being wired
- 📝 **Not Started** - Using mock data
- ⚠️ **Blocked** - Waiting on dependency

---

## Core Features (Critical Path)

### Wallet & Account Management
- ✅ **Home Dashboard** (`app/page.tsx`)
  - Status: Connected to WalletContext
  - Services: `blockchain.ts` (balance queries)
  - Notes: Real-time balance updates via subscription
  
- ✅ **Wallet Context** (`contexts/WalletContext.tsx`)
  - Status: Fully functional
  - Features: Extension integration, balance tracking, notifications
  - Notes: SSR-safe implementation

- ✅ **Send/Transfer** (`app/send/page.tsx`)
  - Status: Transaction flow complete
  - Services: `blockchain.ts` (submitTransfer)
  - Notes: DALLA/bBZD support

- ✅ **Receive** (`app/receive/page.tsx`)
  - Status: QR code display working
  - Notes: No blockchain integration needed

---

## High Priority Pages (Week 1)

### 1. Staking & Validators
- 📝 **Staking Page** (`app/staking/page.tsx`)
  - Current: Using mock data for validators, positions
  - Service: `services/staking.ts`
  - Functions Needed:
    - `getStakingOverview(address)` → Total staked, rewards, APR
    - `getValidators()` → Validator list with metadata
    - `getActivePositions(address)` → User's staking positions
    - `stake(validator, amount)` → Stake DALLA
    - `unstake(validator)` → Unstake DALLA
  - Estimated Time: 2-3 hours
  - Blocker: None

### 2. Governance & Voting
- 📝 **Governance Page** (`app/governance/page.tsx`)
  - Current: Mock proposals array
  - Service: `services/governance.ts`
  - Functions Needed:
    - `getProposals()` → Active/passed proposals
    - `getProposalDetails(id)` → Full proposal data
    - `vote(proposalId, approve)` → Submit vote
    - `getVotingHistory(address)` → User's votes
  - Estimated Time: 2 hours
  - Blocker: None

### 3. Decentralized Exchange
- 📝 **BelizeX/Trade Page** (`app/trade/page.tsx` or `app/belizex/page.tsx`)
  - Current: Mock trading pairs, liquidity pools
  - Service: `services/belizex.ts`
  - Functions Needed:
    - `getTradingPairs()` → Available pairs
    - `getLiquidityPools()` → Pool APRs, TVL
    - `getSwapQuote(fromToken, toToken, amount)` → Price estimate
    - `swap(fromToken, toToken, amount, slippage)` → Execute swap
  - Estimated Time: 3-4 hours
  - Blocker: None

### 4. Digital Identity
- 📝 **BelizeID Page** (`app/belizeid/page.tsx`)
  - Current: May be partially wired (needs verification)
  - Service: `services/identity.ts`
  - Functions Needed:
    - `getIdentity(address)` → BelizeID data
    - `getKycStatus(address)` → KYC/AML level
    - `getContacts(address)` → Saved contacts
    - `registerIdentity(data)` → Create BelizeID
  - Estimated Time: 2 hours
  - Blocker: None

---

## Medium Priority Pages (Week 2)

### 5. Federated Learning
- 📝 **Nawal Page** (`app/nawal/page.tsx`)
  - Current: Mock training history, genome stats
  - Client: `@belizechain/shared/api/nawal-client`
  - Functions Needed:
    - `getTrainingHistory(address)` → FL contributions
    - `getGenomeStats()` → Current genome generation
    - `contributeToTraining(modelId)` → Start FL round
    - `getRewards(address)` → PoUW rewards earned
  - Estimated Time: 2-3 hours
  - Blocker: Nawal service must be running (http://localhost:8001)

### 6. Quantum Computing
- 📝 **Kinich Page** (`app/kinich/page.tsx`)
  - Current: Mock quantum job data
  - Client: `@belizechain/shared/api/kinich-client`
  - Functions Needed:
    - `getJobs(address)` → User's quantum jobs
    - `submitJob(circuit, backend)` → Submit new job
    - `getJobResult(jobId)` → Retrieve results
    - `getPqwStatus(address)` → Proof of Quantum Work status
  - Estimated Time: 2-3 hours
  - Blocker: Kinich service must be running (http://localhost:8002)

### 7. Decentralized Storage
- 📝 **Pakit Page** (`app/pakit/page.tsx`)
  - Current: Mock documents list
  - Client: `@belizechain/shared/api/pakit-client`
  - Functions Needed:
    - `getDocuments(address)` → User's stored documents
    - `uploadDocument(file, metadata)` → Upload to IPFS/Arweave
    - `downloadDocument(cid)` → Retrieve document
    - `getStorageProof(cid)` → On-chain proof verification
  - Estimated Time: 2-3 hours
  - Blocker: Pakit service must be running (http://localhost:8003)

### 8. Domain Name Service
- 📝 **BNS/Domains Page** (`app/domains/page.tsx`)
  - Current: Mock domains list, marketplace
  - Service: `services/bns.ts`
  - Functions Needed:
    - `getDomains(address)` → User's .bz domains
    - `registerDomain(name, years)` → Register new domain
    - `getMarketplace()` → Domains for sale
    - `setPrimaryDomain(domain)` → Set primary name
  - Estimated Time: 2 hours
  - Blocker: None

### 9. Property Registry
- 📝 **Land Ledger Page** (`app/landledger/page.tsx` or similar)
  - Current: Mock properties list
  - Service: `services/landledger.ts`
  - Functions Needed:
    - `getProperties(address)` → User's properties
    - `getPropertyDetails(propertyId)` → Full property data
    - `transferProperty(propertyId, newOwner)` → Transfer title
    - `registerDocument(propertyId, documentCid)` → Add document
  - Estimated Time: 2-3 hours
  - Blocker: None

### 10. Salary Management
- 📝 **Payroll Page** (`app/payroll/page.tsx`)
  - Current: Mock salary slips
  - Service: `services/payroll.ts`
  - Functions Needed:
    - `getSalarySlips(address)` → Monthly salary history
    - `getTaxSummary(address)` → Tax deductions
    - `requestAdvance(amount)` → Salary advance request
  - Estimated Time: 2 hours
  - Blocker: None

### 11. Cross-Chain Bridges
- 📝 **Bridges Page** (`app/bridges/page.tsx`)
  - Current: Mock bridge status, transfers
  - Service: `services/interoperability.ts`
  - Functions Needed:
    - `getBridges()` → Available bridges (ETH, DOT, KSM)
    - `getBridgeStatus(chain)` → Bridge health status
    - `initiateBridgeTransfer(chain, amount, destination)` → Start transfer
    - `getBridgeHistory(address)` → Past transfers
  - Estimated Time: 3 hours
  - Blocker: None

### 12. Smart Contracts
- 📝 **GEM Page** (`app/gem/page.tsx`)
  - Current: Mock contracts list
  - Service: `services/contracts.ts`
  - Functions Needed:
    - `getContracts(address)` → Deployed contracts
    - `deployContract(wasmCode, metadata)` → Deploy new contract
    - `callContract(address, method, args)` → Interact with contract
    - `getContractStorage(address, key)` → Read contract state
  - Estimated Time: 3-4 hours
  - Blocker: None

### 13. Community Governance
- 📝 **Community Page** (`app/community/page.tsx`)
  - Current: Mock community proposals
  - Service: `services/community.ts`
  - Functions Needed:
    - `getProposals()` → Community proposals
    - `createProposal(title, description)` → New proposal
    - `vote(proposalId, approve)` → Vote on proposal
    - `getProposalDetails(id)` → Full proposal data
  - Estimated Time: 2 hours
  - Blocker: None

---

## Low Priority Pages (Week 3)

### 14. Tourism Rewards
- 📝 **Oracle/Tourism Page** (`app/oracle/page.tsx` or similar)
  - Current: Mock merchants, cashback
  - Service: `services/oracle.ts`
  - Functions Needed:
    - `getMerchants()` → Verified merchants list
    - `getCashbackBalance(address)` → Pending rewards
    - `redeemCashback()` → Convert DALLA → bBZD
    - `getMerchantCategories()` → Categories with cashback %
  - Estimated Time: 2 hours
  - Blocker: None

---

## Utility/Info Pages (No Wiring Needed)

- ✅ **About** (`app/about/page.tsx`) - Static content
- ✅ **Help** (`app/help/page.tsx`) - Static content
- ✅ **Settings** (`app/settings/*`) - Local storage
- ✅ **Language** (`app/language/page.tsx`) - Local storage
- ✅ **Scanner** (`app/scanner/page.tsx`) - QR code scanning

---

## Progress Summary

### Completion Status
- **Complete**: 4 pages (15%)
- **In Progress**: 0 pages (0%)
- **Not Started**: 14 pages (85%)

### Time Estimates
- High Priority (4 pages): 9-11 hours
- Medium Priority (9 pages): 21-26 hours
- Low Priority (1 page): 2 hours
- **Total Remaining**: ~32-39 hours (1-2 weeks full-time)

### Current Sprint (This Week)
Focus on high-priority pages:
1. ✅ Monday: Staking Page (2-3h)
2. ✅ Tuesday: Governance Page (2h)
3. ✅ Wednesday: BelizeX Page (3-4h)
4. ✅ Thursday: BelizeID Page (2h)
5. ✅ Friday: Testing & bug fixes (4h)

---

## Blockers & Dependencies

### Technical Blockers
- None currently - all services implemented

### Service Dependencies
- **Nawal** (localhost:8001) - Required for Nawal page
- **Kinich** (localhost:8002) - Required for Kinich page
- **Pakit** (localhost:8003) - Required for Pakit page
- **Blockchain Node** (ws://127.0.0.1:9944) - Required for ALL pages

### Setup Requirements
- ✅ Polkadot.js extension installed
- ✅ Node running in dev mode
- 🔄 Python services started (optional but recommended)
- 🔄 Environment variables configured

---

## Testing Checklist

For each completed page, verify:
- [ ] Loads without errors
- [ ] Shows loading state initially
- [ ] Displays blockchain data (not mock)
- [ ] Error handling works (disconnect node to test)
- [ ] Transactions complete successfully
- [ ] Success/error messages appear
- [ ] Responsive on mobile
- [ ] No console warnings

---

## Notes

### Lessons Learned
- WalletContext pattern works well for global state
- Loading/error components are reusable
- Services are well-structured and easy to use
- SSR safety is critical (always check `typeof window`)

### Improvements Needed
- Add transaction confirmation dialogs
- Better error messages (user-friendly)
- Real-time subscriptions for more events
- Offline queue for pending transactions

---

**Next Review**: End of Week 1 (High Priority pages complete)  
**Goal**: 100% wiring by end of Week 2
