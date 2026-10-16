# Maya Wallet - BelizeChain Integration Guide

> ### ⚠️ CORRECTED 2026-10-15 — this guide referenced modules that no longer exist
>
> An import-graph scan removed 21 unreachable files from `maya-wallet`, including several
> this guide describes as integration points:
>
> `services/events.ts`, `services/currency.ts`, `services/messaging.ts`,
> `services/notes.ts`, `services/qrcode.ts`, `services/recurring.ts`, `services/theme.tsx`,
> `services/pallets/mesh-gateway-onboarding.ts`, `components/HomeScreen.tsx`,
> `components/TransactionConfirmation.tsx`, `components/dashboard/DashboardHome.tsx`,
> `components/trade/TradingChartCanvas.tsx`, `components/QRScanner.tsx`.
>
> **None of these could be imported by anything** — they were dead code, not deferred
> work. Code samples below that `import` from them will not compile.
> See `docs/audits/AUDIT-UI-00-BASELINE.md` §2.

## 🎯 Overview

Maya Wallet now has **comprehensive integration with all 15 BelizeChain pallets**, providing full access to:

- ✅ **Identity & KYC** - BelizeID, SSN/Passport verification, compliance
- ✅ **Economy** - DALLA/bBZD dual-currency support
- ✅ **Governance** - Treasury proposals, voting, district councils
- ✅ **Staking & PoUW** - Validator operations, federated learning rewards
- ✅ **BelizeX DEX** - Token swapping, liquidity pools, asset registry
- ✅ **BNS** - .bz domain registration, marketplace, IPFS hosting
- ✅ **LandLedger** - Property titles, document proofs, transfers
- ✅ **Oracle/Tourism** - Merchant verification, 5-8% cashback rewards
- ✅ **Real-time Events** - WebSocket subscriptions for all pallet events

## 📁 New Service Architecture

```
ui/maya-wallet/src/services/
├── blockchain.ts          # Core Polkadot.js API connection (existing)
├── events.ts             # Real-time event subscriptions (NEW)
└── pallets/              # Pallet integration services (NEW)
    ├── index.ts          # Centralized exports
    ├── identity.ts       # BelizeID, SSN, Passport, KYC
    ├── staking.ts        # PoUW, validators, rewards
    ├── governance.ts     # Proposals, voting, councils
    ├── belizex.ts        # DEX, swaps, liquidity pools
    ├── bns.ts            # .bz domains, marketplace
    ├── landledger.ts     # Property titles, documents
    └── oracle.ts         # Tourism rewards, merchants
```

## 🚀 Quick Start Examples

### 1. Identity & KYC

```typescript
import { getBelizeID, getKYCStatus, registerBelizeID } from '@/services/pallets';

// Get user's BelizeID
const belizeID = await getBelizeID(address);
console.log(`Name: ${belizeID.firstName} ${belizeID.lastName}`);
console.log(`SSN Verified: ${belizeID.ssnVerified}`);

// Check KYC status
const kycStatus = await getKYCStatus(address);
console.log(`KYC Level: ${kycStatus.level}`);
console.log(`Daily Limit: ${kycStatus.limits.dailyTransfer} DALLA`);

// Register new BelizeID
const result = await registerBelizeID(address, {
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1990-01-01',
  nationality: 'Belizean',
  residenceAddress: '123 Main St',
  district: 'Belize',
});
```

### 2. Staking & PoUW Rewards

```typescript
import { getStakingInfo, stakeDalla, getPoUWContributions, getActiveValidators } from '@/services/pallets';

// Get staking information
const stakingInfo = await getStakingInfo(address);
console.log(`Staked: ${stakingInfo.activeStake} DALLA`);
console.log(`Rewards: ${stakingInfo.rewardsEarned} DALLA`);

// Stake DALLA with a validator
await stakeDalla(address, '1000.00', validatorAddress);

// Get federated learning contributions
const contributions = await getPoUWContributions(address);
contributions.forEach(c => {
  console.log(`PoUW Reward: ${c.reward} DALLA (Score: ${c.totalScore})`);
});

// Get all validators
const validators = await getActiveValidators();
```

### 3. Governance

```typescript
import { getActiveProposals, voteOnProposal, submitProposal } from '@/services/pallets';

// Get active proposals
const proposals = await getActiveProposals();
proposals.forEach(p => {
  console.log(`${p.title}: ${p.value} DALLA`);
  console.log(`Votes: ${p.voteCount.ayes} Aye, ${p.voteCount.nays} Nay`);
});

// Vote on a proposal
await voteOnProposal(address, proposalIndex, 'Aye', 'Locked4x');

// Submit new treasury proposal
await submitProposal(address, {
  value: '50000.00',
  beneficiary: recipientAddress,
  title: 'Community Park Renovation',
  description: 'Renovate Central Park in Belize City',
  category: 'Infrastructure',
});
```

### 4. BelizeX DEX

```typescript
import { getSwapQuote, executeSwap, addLiquidity, getLiquidityPools } from '@/services/pallets';

// Get swap quote
const quote = await getSwapQuote('DALLA', 'bBZD', '100.00', 0.5);
console.log(`Output: ${quote.outputAmount} bBZD`);
console.log(`Price Impact: ${quote.priceImpact}%`);

// Execute swap
const result = await executeSwap(
  address,
  'DALLA',
  'bBZD',
  '100.00',
  quote.minimumReceived
);

// Add liquidity
await addLiquidity(address, 'DALLA', 'bBZD', '500.00', '500.00');

// Get all pools
const pools = await getLiquidityPools();
```

### 5. Tourism Rewards

```typescript
import { getTourismRewards, getTourismStats, redeemTourismCashback, getVerifiedMerchants } from '@/services/pallets';

// Get tourism statistics
const stats = await getTourismStats(address);
console.log(`Total Cashback: ${stats.totalCashback} DALLA`);
console.log(`Pending: ${stats.pendingCashback} DALLA`);

// Get reward history
const rewards = await getTourismRewards(address);
rewards.forEach(r => {
  console.log(`${r.merchantName}: ${r.cashbackRate}% = ${r.cashbackAmount} DALLA`);
});

// Redeem cashback for bBZD
await redeemTourismCashback(address, rewardIds);

// Get verified merchants
const merchants = await getVerifiedMerchants('Hotel', 'Stann Creek');
```

### 6. BNS (.bz Domains)

```typescript
import { isDomainAvailable, registerDomain, resolveDomain, getUserDomains } from '@/services/pallets';

// Check availability
const available = await isDomainAvailable('myname.bz');

// Register domain
if (available) {
  await registerDomain(address, 'myname.bz', 1); // 1 year
}

// Resolve domain to address
const ownerAddress = await resolveDomain('myname.bz');

// Get user's domains
const domains = await getUserDomains(address);
domains.forEach(d => {
  console.log(`${d.name} - Expires: ${new Date(d.expiryDate)}`);
});
```

### 7. Land Registry

```typescript
import { getUserLandTitles, getPropertyDocuments, getDocumentDownloadUrl } from '@/services/pallets';

// Get user's land titles
const titles = await getUserLandTitles(address);
titles.forEach(t => {
  console.log(`Title: ${t.titleId}`);
  console.log(`Location: ${t.location.district}, ${t.area} ${t.areaUnit}`);
  console.log(`Encumbrances: ${t.encumbrances.length}`);
});

// Get property documents
const documents = await getPropertyDocuments(titleId);
documents.forEach(d => {
  const downloadUrl = getDocumentDownloadUrl(d.documentHash, 'ipfs');
  console.log(`${d.name}: ${downloadUrl}`);
});
```

### 8. Real-Time Events

```typescript
import { subscribeToAllEvents } from '@/services/events';

// Subscribe to all events
const subscription = await subscribeToAllEvents(address, {
  onBalance: (balance) => {
    console.log(`New balance: ${balance.dalla} DALLA, ${balance.bBZD} bBZD`);
    // Update UI
  },
  
  onStakingReward: (reward) => {
    console.log(`${reward.type} reward: ${reward.amount} DALLA`);
    showNotification(`You earned ${reward.amount} DALLA!`);
  },
  
  onTourismCashback: (cashback) => {
    console.log(`Cashback: ${cashback.cashbackAmount} DALLA (${cashback.cashbackRate}%)`);
    showNotification(`🎉 Tourism reward earned!`);
  },
  
  onComplianceAlert: (alert) => {
    console.log(`Compliance: ${alert.type} - ${alert.message}`);
    if (alert.type === 'KYCRejected') {
      showWarning(alert.message);
    }
  },
});

// Unsubscribe when component unmounts
useEffect(() => {
  return () => subscription.unsubscribe();
}, []);
```

## 🎨 UI Component Integration

### Enhanced Home Screen

```typescript
// pages/home.tsx
import { getBelizeID, getTourismStats, getStakingInfo } from '@/services/pallets';
import { subscribeToBalanceChanges, subscribeToTourismCashback } from '@/services/events';

export default function HomePage() {
  const [identity, setIdentity] = useState<BelizeID | null>(null);
  const [tourismStats, setTourismStats] = useState<TourismStats | null>(null);
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);

  useEffect(() => {
    // Load user data
    getBelizeID(address).then(setIdentity);
    getTourismStats(address).then(setTourismStats);
    getStakingInfo(address).then(setStakingInfo);
    
    // Subscribe to real-time updates
    const sub = subscribeToBalanceChanges(address, (balance) => {
      // Update balance display
    });
    
    return () => sub.then(s => s.unsubscribe());
  }, [address]);

  return (
    <div>
      {identity && (
        <WelcomeCard name={`${identity.firstName} ${identity.lastName}`} />
      )}
      
      {tourismStats && (
        <TourismRewardsCard
          totalCashback={tourismStats.totalCashback}
          pendingCashback={tourismStats.pendingCashback}
        />
      )}
      
      {stakingInfo && (
        <StakingCard
          staked={stakingInfo.activeStake}
          rewards={stakingInfo.rewardsEarned}
        />
      )}
    </div>
  );
}
```

## 🔐 Security Considerations

1. **Transaction Signing**: All transactions use Polkadot.js extension for secure key management
2. **KYC Validation**: Check compliance status before high-value transactions
3. **Daily Limits**: Enforce account type limits (Citizen: 25K, Business: 100K)
4. **Tourism Verification**: Merchant verification required for cashback eligibility
5. **Domain Ownership**: Verify ownership before domain transfers

## 📊 Data Flow Patterns

```
User Action → Service Function → Polkadot.js API → BelizeChain Runtime
                                        ↓
                                   Event Emission
                                        ↓
                            Event Subscription Callback
                                        ↓
                                    UI Update
```

## 🔄 Next Steps (UI Implementation)

1. **Create React Hooks** for each pallet (e.g., `useStaking()`, `useTourism()`)
2. **Build UI Components** for each feature
3. **Add Form Validation** using existing `zod` schemas
4. **Integrate with Zustand** store for state management
5. **Add Error Handling** with user-friendly messages
6. **Implement Loading States** with skeletons
7. **Add Success Animations** (confetti for rewards!)

## 🎯 Key Features Now Available

| Feature | Status | Service | Priority |
|---------|--------|---------|----------|
| BelizeID Display | ✅ Ready | `identity.ts` | High |
| KYC Status Check | ✅ Ready | `identity.ts` | High |
| DALLA/bBZD Balance | ✅ Ready | `blockchain.ts` | High |
| Tourism Rewards | ✅ Ready | `oracle.ts` | High |
| Staking & PoUW | ✅ Ready | `staking.ts` | High |
| Governance Voting | ✅ Ready | `governance.ts` | Medium |
| DEX Swapping | ✅ Ready | `belizex.ts` | Medium |
| Domain Registry | ✅ Ready | `bns.ts` | Medium |
| Land Titles | ✅ Ready | `landledger.ts` | Low |
| Real-time Events | ✅ Ready | `events.ts` | High |

## 📚 Additional Resources

- **BelizeChain Docs**: `docs/technical-reference/pallets/`
- **Polkadot.js API**: https://polkadot.js.org/docs/api
- **Substrate Events**: https://docs.substrate.io/learn/transaction-lifecycle/

---

**Built with ❤️ for Belize** 🇧🇿
