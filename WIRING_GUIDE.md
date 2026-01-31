# UI Wiring Quick Start Guide

This guide will help you wire the UI pages to the blockchain services.

## Current Status

✅ **Backend Services Ready**: All 15 pallet services are implemented  
🟡 **Frontend Pages**: Using mock data, need blockchain connection  
📝 **Task**: Replace mock data with blockchain service calls

## Step-by-Step Wiring Process

### 1. Install Dependencies & Setup Environment

```bash
# Navigate to UI directory
cd ui

# Install all dependencies
npm install

# Create environment files
cp maya-wallet/.env.example maya-wallet/.env.local
cp blue-hole-portal/.env.example blue-hole-portal/.env.local

# Edit .env.local files and verify endpoints
# Default: ws://127.0.0.1:9944 for blockchain
```

### 2. Start Development Environment

```bash
# Terminal 1: Start BelizeChain node
cd /home/wicked/belizechain-belizechain
./target/release/belizechain-node --dev --tmp

# Terminal 2: Start Python services (optional but recommended)
source .venv/bin/activate
cd nawal && python -m nawal.orchestrator server &
cd ../kinich && python -m kinich.core.quantum_node &
cd ../pakit && python -m pakit.api_server &

# Terminal 3: Start UI development server
cd ui
npm run dev:all
# OR individually:
# npm run dev:maya     # Port 3001
# npm run dev:bluehole # Port 3002
```

### 3. Wire Pages to Blockchain Services

For each page that needs wiring, follow this pattern:

#### Example: Staking Page

**Before (Mock Data)**:
```typescript
// ui/maya-wallet/src/app/staking/page.tsx
const stakingOverview = {
  totalStaked: '5000',
  totalRewards: '856.23',
  // ... mock data
};
```

**After (Blockchain Connected)**:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import * as stakingService from '@/services/staking';

export default function StakingPage() {
  const { selectedAccount, isConnected } = useWallet();
  const [stakingData, setStakingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStakingData() {
      if (!selectedAccount?.address) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [overview, validators] = await Promise.all([
          stakingService.getStakingOverview(selectedAccount.address),
          stakingService.getValidators()
        ]);
        
        setStakingData({ overview, validators });
      } catch (err) {
        console.error('Failed to fetch staking data:', err);
        setError('Unable to load staking information. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchStakingData();
    
    // Optional: Set up polling for real-time updates
    const interval = setInterval(fetchStakingData, 30000); // Every 30s
    return () => clearInterval(interval);
  }, [selectedAccount?.address]);

  if (!isConnected) {
    return <ConnectWalletPrompt />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  // Render with stakingData from blockchain
  return (
    <div className="min-h-screen">
      <h1>Total Staked: {stakingData.overview.totalStaked} DALLA</h1>
      {/* ... rest of UI */}
    </div>
  );
}
```

### 4. Page-by-Page Wiring Checklist

#### High Priority (Core Features)

- [ ] **Staking Page** (`app/staking/page.tsx`)
  - Replace: `stakingOverview`, `providers`, `activePositions`
  - Service: `/services/staking.ts`
  - Functions: `getStakingOverview()`, `getValidators()`, `stake()`, `unstake()`

- [ ] **Governance Page** (`app/governance/page.tsx`)
  - Replace: `proposals` mock array
  - Service: `/services/governance.ts`
  - Functions: `getProposals()`, `getProposalDetails()`, `vote()`

- [ ] **BelizeX Page** (`app/trade/page.tsx`)
  - Replace: Trading pairs, liquidity pools
  - Service: `/services/belizex.ts`
  - Functions: `getTradingPairs()`, `getLiquidityPools()`, `swap()`

- [ ] **BelizeID Page** (`app/belizeid/page.tsx`)
  - Replace: Identity data
  - Service: `/services/identity.ts`
  - Functions: `getIdentity()`, `getKycStatus()`, `getContacts()`

#### Medium Priority (Feature Pages)

- [ ] **Nawal Page** (`app/nawal/page.tsx`)
  - Replace: Training history, genome stats
  - Client: `@belizechain/shared/api/nawal-client`
  - Functions: `getTrainingHistory()`, `getGenomeStats()`

- [ ] **Kinich Page** (`app/kinich/page.tsx`)
  - Replace: Quantum jobs, PQW status
  - Client: `@belizechain/shared/api/kinich-client`
  - Functions: `getJobs()`, `submitJob()`, `getJobResult()`

- [ ] **Pakit Page** (`app/pakit/page.tsx`)
  - Replace: Documents list
  - Client: `@belizechain/shared/api/pakit-client`
  - Functions: `getDocuments()`, `uploadDocument()`

- [ ] **BNS Page** (`app/domains/page.tsx`)
  - Replace: Domains list, marketplace
  - Service: `/services/bns.ts`
  - Functions: `getDomains()`, `registerDomain()`, `getMarketplace()`

- [ ] **Land Ledger Page** (`app/landledger/page.tsx`)
  - Replace: Properties list
  - Service: `/services/landledger.ts`
  - Functions: `getProperties()`, `getPropertyDetails()`

- [ ] **Payroll Page** (`app/payroll/page.tsx`)
  - Replace: Salary slips
  - Service: `/services/payroll.ts`
  - Functions: `getSalarySlips()`, `getTaxSummary()`

- [ ] **Bridges Page** (`app/bridges/page.tsx`)
  - Replace: Bridge status, transfers
  - Service: `/services/interoperability.ts`
  - Functions: `getBridges()`, `initiateBridgeTransfer()`

- [ ] **GEM Page** (`app/gem/page.tsx`)
  - Replace: Contracts list
  - Service: `/services/contracts.ts`
  - Functions: `getContracts()`, `deployContract()`

- [ ] **Community Page** (`app/community/page.tsx`)
  - Replace: Community proposals
  - Service: `/services/community.ts`
  - Functions: `getProposals()`, `createProposal()`

#### Low Priority (Information Pages)

- [ ] **Tourism/Oracle Page** (`app/oracle/page.tsx` or similar)
  - Replace: Merchants, cashback
  - Service: `/services/oracle.ts`
  - Functions: `getMerchants()`, `getCashbackBalance()`

### 5. Common Patterns & Utilities

#### Loading States Component
```typescript
// components/ui/LoadingSpinner.tsx
export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      <p className="mt-4 text-gray-400">{message}</p>
    </div>
  );
}
```

#### Error Handling Component
```typescript
// components/ui/ErrorMessage.tsx
export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="text-red-500 mb-4">
        <Warning size={48} weight="fill" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
      <p className="text-gray-400 mb-4 text-center">{message}</p>
      <button 
        onClick={onRetry}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Try Again
      </button>
    </div>
  );
}
```

#### Connection Prompt
```typescript
// components/ui/ConnectWalletPrompt.tsx
export function ConnectWalletPrompt() {
  const { connect } = useWallet();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="text-blue-500 mb-4">
        <Wallet size={48} weight="fill" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
      <p className="text-gray-400 mb-4 text-center">
        Connect your wallet to access this feature
      </p>
      <button 
        onClick={connect}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Connect Wallet
      </button>
    </div>
  );
}
```

### 6. Testing Wired Pages

For each wired page:

1. **Start blockchain node** (Terminal 1)
2. **Start UI** (Terminal 3)
3. **Open browser** to http://localhost:3001 (Maya) or :3002 (Blue Hole)
4. **Connect wallet** (Polkadot.js extension required)
5. **Navigate to page**
6. **Verify**:
   - Loading spinner appears initially
   - Data loads from blockchain
   - Error handling works (disconnect node to test)
   - Transactions can be submitted
   - Success/error messages display

### 7. Debugging Tips

#### Check Blockchain Connection
```typescript
// In browser console
console.log('API connected:', await api.isConnected);
console.log('Chain:', await api.rpc.system.chain());
```

#### View Service Logs
```typescript
// services/blockchain.ts has console.log statements
// Check browser console for connection status
```

#### Common Issues

1. **"Cannot connect to blockchain"**
   - Solution: Ensure node is running on ws://127.0.0.1:9944
   - Check: `ps aux | grep belizechain-node`

2. **"Extension not found"**
   - Solution: Install Polkadot.js extension
   - Enable for localhost in extension settings

3. **"Module not found" errors**
   - Solution: Pallet may not be in runtime
   - Check: `belizechain/runtime/src/lib.rs` has pallet

4. **Type errors**
   - Solution: Use proper Substrate types
   - Check: `ui/shared/src/types/substrate.ts`

### 8. Automated Testing Script

Create test script to verify all pages:

```bash
#!/bin/bash
# ui/test-wiring.sh

echo "Testing UI Wiring..."

# Check if node is running
if ! curl -s http://127.0.0.1:9944 > /dev/null 2>&1; then
  echo "❌ Blockchain node not running on ws://127.0.0.1:9944"
  exit 1
fi

echo "✅ Blockchain node connected"

# Check if Python services are running
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
  echo "✅ Nawal service running"
else
  echo "⚠️  Nawal service not running (optional)"
fi

if curl -s http://localhost:8002/health > /dev/null 2>&1; then
  echo "✅ Kinich service running"
else
  echo "⚠️  Kinich service not running (optional)"
fi

if curl -s http://localhost:8003/health > /dev/null 2>&1; then
  echo "✅ Pakit service running"
else
  echo "⚠️  Pakit service not running (optional)"
fi

echo ""
echo "Next steps:"
echo "1. Start UI: npm run dev:all"
echo "2. Open browser: http://localhost:3001"
echo "3. Connect wallet"
echo "4. Test each page"
```

Make executable:
```bash
chmod +x ui/test-wiring.sh
```

### 9. Progress Tracking

Create a progress file to track completed pages:

```bash
# ui/WIRING_PROGRESS.md

# Maya Wallet Wiring Progress

## Completed ✅
- [ ] Home Dashboard
- [ ] Wallet Connection

## In Progress 🔄
- [ ] Staking Page
- [ ] Governance Page

## Not Started 📝
- [ ] BelizeX Page
- [ ] BNS Page
- [ ] Nawal Page
- [ ] Kinich Page
- [ ] Pakit Page
- [ ] Land Ledger Page
- [ ] Payroll Page
- [ ] Bridges Page
- [ ] GEM Page
- [ ] Community Page
- [ ] Oracle Page
```

## Summary

**Total Pages to Wire**: ~14 major feature pages  
**Estimated Time**: 
- High Priority (4 pages): 6-8 hours
- Medium Priority (9 pages): 12-15 hours
- Testing & Polish: 4-6 hours
- **Total**: 22-29 hours

**Approach**:
1. Start with high-priority pages (Staking, Governance, BelizeX, BelizeID)
2. Test thoroughly before moving to next page
3. Create reusable components (LoadingSpinner, ErrorMessage, etc.)
4. Document any issues or blockers
5. Update progress tracking file

**Success Criteria**:
- All pages load data from blockchain
- Error states handled gracefully
- Loading states provide feedback
- Transactions complete successfully
- No mock data remains in production code
