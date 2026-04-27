# UI Testing Guide - BelizeChain Maya Wallet

## Quick Test Checklist

This guide uses local UI URLs for development. Production and Ceiba deployments should still use the public proxy routes configured through `NEXT_PUBLIC_BLOCKCHAIN_WS`, `NEXT_PUBLIC_BLOCKCHAIN_RPC`, and `NEXT_PUBLIC_*_API`.

### Prerequisites
- [x] Blockchain compiled: `cargo build --release`
- [ ] Polkadot.js extension installed
- [ ] Test accounts created with DALLA
- [ ] Node running on port 9944

---

## Step 1: Start the Blockchain Node

```bash
# Terminal 1 - Start blockchain in development mode
cd /home/wicked/belizechain-belizechain
./target/release/belizechain-node --dev --tmp

# Expected output:
# ✅ Listening on ws://127.0.0.1:9944
# ✅ Block production started
```

---

## Step 2: Setup Test Accounts

### Install Polkadot.js Extension
1. Open Chrome/Firefox extensions
2. Search "Polkadot.js extension"
3. Install and create accounts

### Fund Test Accounts
```bash
# In Terminal 2 - Use the built-in test accounts
# Alice (sudo): 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
# Bob: 5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty
# Charlie: 5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y
```

---

## Step 3: Start the UI

```bash
# Terminal 3 - Start Maya Wallet
cd ui/maya-wallet
npm run dev

# Expected output:
# ✅ http://localhost:3001
```

---

## Step 4: Test Wired Pages

### ✅ Test 1: Staking Page
**URL:** `http://localhost:3001/staking`

**Test Cases:**
1. **Load Validators**
   - Navigate to Staking page
   - ✅ Should see "Loading staking data from blockchain..."
   - ✅ After 2-3 seconds, validator list appears
   - ✅ Verify commission rates (0.5% - 12%)
   - ✅ Check total stake amounts (in DALLA)

2. **Stake DALLA**
   - Click "Stake" button on any validator
   - ✅ Polkadot.js popup appears
   - ✅ Sign transaction with password
   - ✅ Success message shows updated stake

3. **View PoUW Contributions**
   - Scroll to PoUW section
   - ✅ See federated learning contributions
   - ✅ Quality/Timeliness/Honesty scores displayed

**Expected Blockchain Data:**
```typescript
{
  validators: [
    {
      address: "5GrwvaEF...",
      commission: 500000, // 0.5%
      totalStake: "1000000000000000",
      ownStake: "500000000000000",
      rewardPoints: 1250
    }
  ]
}
```

---

### ✅ Test 2: Governance Page
**URL:** `http://localhost:3001/governance`

**Test Cases:**
1. **Load Proposals**
   - Navigate to Governance page
   - ✅ Should see active proposals
   - ✅ Vote counts displayed (Ayes vs Nays)
   - ✅ Time remaining calculated correctly

2. **Vote on Proposal**
   - Click "Vote Aye" on any proposal
   - ✅ Polkadot.js popup appears
   - ✅ Transaction succeeds
   - ✅ Vote count increments

3. **Create Proposal** (if implemented)
   - Click "Create Proposal" button
   - ✅ Form appears
   - ✅ Submit treasury proposal
   - ✅ Appears in proposals list

**Expected Blockchain Data:**
```typescript
{
  proposals: [
    {
      index: 0,
      title: "Infrastructure Development Fund",
      category: "Infrastructure",
      value: "500000000000000", // 500k DALLA
      voteCount: { ayes: 15, nays: 3 },
      status: "Voting",
      voteEnd: 1738204800 // Unix timestamp
    }
  ]
}
```

---

### ✅ Test 3: BelizeX/Trade Page
**URL:** `http://localhost:3001/trade`

**Test Cases:**
1. **Load Liquidity Pools**
   - Navigate to Trade page
   - ✅ Pool stats show real data (volume, liquidity, pairs)
   - ✅ Assets tab shows registered tokens

2. **Get Swap Quote**
   - Enter amount (e.g., 100 DALLA)
   - ✅ Quote appears after 0.5s debounce
   - ✅ Exchange rate displayed (e.g., 1 DALLA = 0.5 bBZD)
   - ✅ Price impact shown (red if >5%)
   - ✅ Network fee calculated

3. **Execute Swap**
   - Click "Swap Tokens" button
   - ✅ Polkadot.js popup appears
   - ✅ Transaction succeeds
   - ✅ Alert shows received amount
   - ✅ Balance updates

**Expected Blockchain Data:**
```typescript
{
  pools: [
    {
      id: "0",
      token0: "DALLA",
      token1: "bBZD",
      reserve0: "5000000000000000",
      reserve1: "2500000000000000",
      totalLiquidity: "3535533905932738",
      fee: 0.3 // 0.3%
    }
  ],
  swapQuote: {
    inputAmount: "100",
    outputAmount: "49.85",
    priceImpact: 0.3,
    minimumReceived: "49.60",
    fee: "0.30",
    route: ["DALLA", "bBZD"]
  }
}
```

---

### ✅ Test 4: BelizeID Page
**URL:** `http://localhost:3001/belizeid`

**Test Cases:**
1. **No Identity Registered**
   - Fresh account with no BelizeID
   - ✅ Shows "No BelizeID Found" prompt
   - ✅ "Register BelizeID" button visible

2. **Load Existing Identity**
   - Account with registered BelizeID
   - ✅ Full name displayed
   - ✅ SSN/Passport/KYC badges correct
   - ✅ DID shown (did:belize:{address})
   - ✅ Registration/expiry dates formatted

3. **View Credentials Tab**
   - Click "Credentials" tab
   - ✅ SSN credential shows verification status
   - ✅ Passport details (number, country, dates)
   - ✅ KYC level and documents listed

4. **Check Transaction Limits**
   - View identity card
   - ✅ Daily limit shown (e.g., 25,000 DALLA)
   - ✅ Monthly limit shown (e.g., 750,000 DALLA)
   - ✅ Limits match KYC tier

**Expected Blockchain Data:**
```typescript
{
  belizeId: {
    id: "5GrwvaEF...",
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1990-05-15",
    nationality: "Belizean",
    district: "Belize",
    ssnVerified: true,
    passportVerified: true,
    kycStatus: "Verified",
    registrationDate: 1704067200,
    expiryDate: 1799654400
  },
  kycStatus: {
    level: "Enhanced",
    status: "Verified",
    limits: {
      dailyTransfer: "100000.00",
      monthlyTransfer: "3000000.00"
    }
  }
}
```

---

## Step 5: Monitor Blockchain Logs

### Terminal 1 (Blockchain Node)
```
# Watch for transactions:
✅ Imported #12 (0x1234...abcd)
✅ Staking::Bonded { stash: 5Grw..., amount: 1000000000000 }
✅ Governance::Voted { voter: 5FHn..., proposal: 0, vote: Aye }
✅ BelizeX::Swapped { trader: 5FLS..., input: 100, output: 49.85 }
```

### Terminal 3 (UI Dev Server)
```
# Watch for API calls:
✅ [API] Connected to configured NEXT_PUBLIC_BLOCKCHAIN_WS endpoint
✅ [Staking] Fetched 4 validators
✅ [Governance] Fetched 3 proposals
✅ [BelizeX] Quote calculated: 100 DALLA → 49.85 bBZD
```

---

## Common Issues & Fixes

### Issue 1: "Unable to connect to blockchain"
**Cause:** Node not running or wrong port  
**Fix:**
```bash
# Check node is running
lsof -i :9944

# Restart node
./target/release/belizechain-node --dev --tmp
```

Also verify `NEXT_PUBLIC_BLOCKCHAIN_WS` points to the intended node. The local fallback is `ws://127.0.0.1:9944`.

### Issue 2: "Transaction failed: InsufficientBalance"
**Cause:** Account has no DALLA  
**Fix:**
```bash
# Use Alice (sudo) account which has initial supply
# Or transfer from Alice to test account
```

### Issue 3: "Polkadot.js extension not detected"
**Cause:** Extension not installed or disabled  
**Fix:**
1. Install extension from browser store
2. Enable extension for localhost:3001
3. Create/import accounts

### Issue 4: "Swap quote not calculating"
**Cause:** Liquidity pool doesn't exist  
**Fix:**
- Check pools exist in BelizeX pallet
- May need to create initial pools with `addLiquidity()` extrinsic
- Use Polkadot.js Apps to verify pool state

### Issue 5: "SSR hydration mismatch"
**Cause:** Server/client rendering mismatch  
**Fix:**
- Already handled with `'use client'` directive
- If persists, clear `.next` cache:
```bash
cd ui/maya-wallet
rm -rf .next
npm run dev
```

---

## Success Criteria

### All Tests Pass ✅
- [ ] Staking page loads validators from blockchain
- [ ] Governance page shows real proposals
- [ ] Trade page calculates accurate swap quotes
- [ ] BelizeID page displays identity data
- [ ] All transactions succeed with Polkadot.js
- [ ] No console errors in browser DevTools
- [ ] Data refreshes every 30 seconds
- [ ] Loading states show during queries
- [ ] Error messages display when node offline

---

## Performance Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| Initial Page Load | <3s | ___ |
| Blockchain Query | <2s | ___ |
| Swap Quote Calc | <1s | ___ |
| Transaction Time | <6s | ___ |
| Auto-Refresh Interval | 30s | ✅ |

---

## Next Steps After Testing

1. **Fix Bugs** - Address any issues found during testing
2. **Wire Remaining Pages** - Analytics, Bridges, BNS, LandLedger, etc.
3. **Integration Tests** - Automated test suite with Playwright
4. **Production Build** - `npm run build` and verify
5. **Deployment** - Deploy to production environment

---

**Testing Started:** _______________  
**Testing Completed:** _______________  
**Bugs Found:** _______________  
**Status:** 🔄 Ready to Test
