# UI Wiring Status — Verified Audit

**Last verified:** May 31, 2026 (source-of-truth: live `src/` scan, not historical notes)
**Scope:** `maya-wallet` + `blue-hole-portal` + `shared`
**CI:** Blue Hole Portal, Maya Wallet, and Security Audits workflows all green on `main`.

> ⚠️ The older "4 of 14 pages" framing below (and the `WIRING_COMPLETE_REPORT`
> note) is contradictory and out of date. The audit in this top section reflects an
> actual code scan and is the current source of truth. The historical detail further
> down is retained for reference only.

---

## Method

Direct scan of `**/src/**/*.{ts,tsx}` for `mock`, `TODO`, `FIXME`, `coming soon`,
`placeholder`, and `hardcoded`. The ~110 `placeholder="..."` HTML input attributes
were filtered out as false positives. What remains below are the genuine gaps.

## 🟢 Recently wired (latest pass)

| Location | What changed |
|----------|--------------|
| `blue-hole-portal/src/lib/blockchain/hooks.ts` (`useBalance`) | bBZD now read from `economy.bBzdBalances` (was hardcoded `'0'`). Mirrors the verified `maya-wallet/src/services/blockchain.ts` query. |
| `blue-hole-portal/src/hooks/useStaking.ts` | Validator `name` now resolved from `identity.identityOf` (was `Validator <addr8>`); `slashes` now derived from `belizeStaking/staking.slashingSpans` (was hardcoded `0`). |
| `maya-wallet/src/services/pallets/identity.ts` (`getDisplayName`) | New helper resolving a human name from BelizeID / standard `identityOf`. |
| `maya-wallet/src/contexts/MessagingContext.tsx` | `peerName` now resolved via `getDisplayName` (was `undefined`); Polkadot `api` now connects via `initializeApi()` (was `null`, which dead-locked emergency broadcasts + proof service). |
| `maya-wallet/src/app/activity/page.tsx` | Real CSV export with download (was an "coming soon" alert). |
| `maya-wallet/src/app/community/page.tsx` | Real share via Web Share API + clipboard fallback (was a `console.log` stub). |

## 🔴 Still on mock data (real, actionable)

| Location | Note |
|----------|------|
| `blue-hole-portal/src/app/explorer/page.tsx:13` | "Mock data - replace with real blockchain queries" |
| `maya-wallet/src/components/dashboard/DashboardHome.tsx:31` | "Mock data - will be replaced with real blockchain queries" |
| `blue-hole-portal/src/store/admin.ts:63` | Placeholder admin profile pending governance-pallet role verification |

## 🟡 Real pallet-wiring TODOs (working pages, missing on-chain reads)

| Location | Note |
|----------|------|
| `blue-hole-portal/src/services/fsc-exporter.ts:237` | High-value transaction detection logic |
| `blue-hole-portal/src/services/fsc-exporter.ts:371` | Risk scoring logic |
| `maya-wallet/src/services/pakit-bridge.service.ts:207` | Submit to interoperability/messaging pallet |
| `maya-wallet/src/services/qrcode.ts:254` | SVG placeholder — needs real QR library |

## ⚪ Intentional stubs (documented or unsupported on-chain — not bugs)

| Location | Reason |
|----------|--------|
| `blue-hole-portal/src/app/validators/nominate/page.tsx:29` | Nominator-style delegation not implemented on-chain (self-stake only) |
| `blue-hole-portal/src/app/validators/[address]/page.tsx:28` | Chain does not expose per-day historical series |
| `blue-hole-portal/src/app/analytics/page.tsx:199` | Awaiting indexer-backed dashboards |
| `maya-wallet/src/services/oracle.ts:71` | Hardcoded FX rates used only as fallback when Oracle unavailable |
| Various "Coming Soon" UI | exchange, settings (notifications/security/appearance system-mode), community/education, BNS CDN |

## Deferred (need external services, not UI work)

- **Pakit** — IPFS/Arweave storage integration
- **Nawal** — federated-learning server UI
- **Kinich** — quantum job submission

## Next candidates

1. `explorer/page.tsx` + `DashboardHome.tsx` — replace mock data with real queries (highest user-facing impact).
2. `MessagingContext.tsx` — wire to Polkadot API + Identity pallet.
3. `fsc-exporter.ts` detection/scoring — compliance reporting completeness.

---

# Historical (January 2026 snapshot — reference only)

## 🎯 Completed Wiring (4 Pages)

### 1. ✅ Staking Page (`ui/maya-wallet/src/app/staking/page.tsx`)
**Service:** `@/services/pallets/staking`  
**Blockchain Integration:**
- `getStakingInfo()` - User's stake balance, rewards, unbonding period
- `getActiveValidators()` - Live validator list with commission, total stake, reward points
- `getPoUWContributions()` - Proof of Useful Work federated learning contributions

**Features Implemented:**
- Real-time validator data display with commission rates (0.5% - 12%)
- Stake balances and rewards from blockchain
- Loading/error states with automatic 30s polling
- Connect wallet prompt for unauthenticated users

**Blockchain Data Displayed:**
- Validator addresses, commission, own stake, total stake, reward points
- User's staked DALLA, pending rewards, unbonding period
- PoUW training quality scores, timeliness, honesty metrics

---

### 2. ✅ Governance Page (`ui/maya-wallet/src/app/governance/page.tsx`)
**Service:** `@/services/pallets/governance`  
**Blockchain Integration:**
- `getActiveProposals()` - Live governance proposals with voting data
- `getReferenda()` - Referendum status and vote counts
- `voteOnProposal()` - Submit on-chain votes (Aye/Nay)

**Features Implemented:**
- Real proposal data: title, description, category, treasury amount
- Live vote counts (Ayes vs Nays) with percentage bars
- Time remaining calculation from block timestamps
- Vote buttons wired to blockchain (ready for testing)

**Blockchain Data Displayed:**
- Proposal index, hash, proposer address, beneficiary
- Vote counts, status (Proposed/Voting/Approved/Rejected)
- Treasury request amounts in DALLA
- Category tags (Infrastructure, Development, Community, etc.)

---

### 3. ✅ BelizeX/Trade Page (`ui/maya-wallet/src/app/trade/page.tsx`)
**Service:** `@/services/pallets/belizex`  
**Blockchain Integration:**
- `getLiquidityPools()` - All trading pairs with reserves and fees
- `getAssets()` - Registered token assets (DALLA, bBZD, etc.)
- `getSwapQuote()` - Real-time swap calculations with price impact
- `executeSwap()` - On-chain token swaps with slippage protection

**Features Implemented:**
- Real liquidity pool stats (reserves, 24h volume, fee rates)
- Live asset registry with total supply and decimals
- Swap quote engine with price impact warnings (>5% = red)
- Dynamic exchange rate calculation from blockchain
- Disabled swap button when quote unavailable or wallet disconnected

**Blockchain Data Displayed:**
- Pool reserves (DALLA/bBZD, DALLA/DOT, etc.)
- Asset total supply, decimals, frozen status
- Swap quotes with minimum received amounts
- Network fees in DALLA

---

### 4. ✅ BelizeID Page (`ui/maya-wallet/src/app/belizeid/page.tsx`)
**Service:** `@/services/pallets/identity`  
**Blockchain Integration:**
- `getBelizeID()` - User's sovereign identity record
- `getSSNRecord()` - SSN verification status
- `getPassportRecord()` - Passport verification status
- `getKYCStatus()` - KYC level and transaction limits

**Features Implemented:**
- Full identity card display with real blockchain data
- SSN/Passport/KYC verification badges (green = verified, amber = pending)
- Transaction limits from KYC pallet (daily/monthly DALLA caps)
- Registration prompt when no BelizeID exists
- Credentials tab showing all verified documents

**Blockchain Data Displayed:**
- Full name, date of birth, nationality, district
- DID (did:belize:{address})
- SSN verification date and verifier address
- Passport number, issuing country, issue/expiry dates
- KYC level (None/Basic/Enhanced/Full) with status
- Daily/monthly transfer limits based on KYC tier

---

## 📊 Wiring Statistics

| Metric | Count |
|--------|-------|
| **Pages Wired** | 4 / 14 |
| **Services Integrated** | 4 / 15 |
| **Blockchain Queries** | 13 |
| **Transaction Functions** | 3 (stake, vote, swap) |
| **Lines of Code Changed** | ~800 |
| **Mock Data Removed** | ~150 lines |
| **Loading States Added** | 4 |
| **Error Handlers Added** | 4 |

---

## 🔄 Next Steps

### Phase 1: Testing (Immediate)
1. **Start Blockchain Node**
   ```bash
   ./target/release/belizechain-node --dev --tmp
   ```

2. **Install Polkadot.js Extension**
   - Load extension in browser
   - Create test accounts with funded DALLA

3. **Test Each Page**
   - ✅ Staking: Verify validator list loads, stake/unstake works
   - ✅ Governance: Verify proposals load, voting works
   - ✅ Trade: Verify pools load, swap quotes accurate, transactions succeed
   - ✅ BelizeID: Verify identity loads, credentials display correctly

### Phase 2: Wire Remaining Pages (10 Pages)

#### High Priority (Next Week)
- **Analytics** - Economic metrics, transaction volume
- **Bridges** - Cross-chain transfers (Ethereum/Polkadot)
- **BNS** - Domain registry, marketplace
- **LandLedger** - Property records, land titles

#### Medium Priority (Following Week)
- **Security** - Encryption settings, recovery keys
- **Developer** - API docs, contract deployment
- **Payroll** - Salary management, pay schedules

#### Lower Priority (Final Week)
- **Pakit** - Storage integration (IPFS/Arweave)
- **Nawal** - Federated learning UI
- **Kinich** - Quantum job submission

---

## 🛠️ Patterns Established

All wired pages follow this consistent architecture:

```typescript
// 1. Imports
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import * as palletService from '@/services/pallets/pallet-name';

// 2. State Management
const [data, setData] = useState<Type[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// 3. Data Fetching
useEffect(() => {
  async function fetchData() {
    try {
      const result = await palletService.getData();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
  const interval = setInterval(fetchData, 30000); // 30s polling
  return () => clearInterval(interval);
}, [dependencies]);

// 4. UI States
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage />;
if (!isConnected) return <ConnectWalletPrompt />;
```

---

## 📝 Code Quality Improvements

### Before Wiring
```typescript
// ❌ Hardcoded mock data
const proposals = [
  { id: 1, title: 'Infrastructure Fund', votes: { yes: 1250, no: 345 } },
  // ...
];
```

### After Wiring
```typescript
// ✅ Real blockchain data
const [proposals, setProposals] = useState<Proposal[]>([]);
useEffect(() => {
  const data = await governanceService.getActiveProposals();
  setProposals(data);
}, []);
```

---

## 🎉 Success Metrics

- **Zero TypeScript Errors** - All pages compile cleanly
- **Type Safety** - Full interface definitions from pallet services
- **Error Handling** - User-friendly messages for all failure cases
- **Loading States** - Smooth UX during blockchain queries
- **Auto-Refresh** - 30-second polling keeps data fresh
- **Wallet Integration** - Proper connect/disconnect handling

---

## 📚 Documentation

All wiring documentation available in:
- `ui/WIRING_GUIDE.md` - Step-by-step instructions
- `ui/WIRING_STATUS.md` - Technical details per page
- `ui/maya-wallet/WIRING_PROGRESS.md` - Page-by-page tracker
- `ui/SUMMARY.md` - Quick reference

---

**Status Updated:** Ready for testing phase ✅
