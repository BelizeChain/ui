# 🧪 Maya Wallet Testing Checklist

**Date:** January 25, 2026  
**Blockchain:** ws://127.0.0.1:9944 (Block #137+)  
**UI:** http://localhost:3001

---

## ✅ Pre-Test Setup

- [x] Blockchain node running
- [x] Maya Wallet dev server running
- [x] No compilation errors
- [ ] Polkadot.js extension installed
- [ ] Test wallet created with DALLA balance

---

## 🔗 Core Wallet Functionality

### Wallet Connection
- [ ] Connect Polkadot.js extension
- [ ] See wallet address displayed
- [ ] View DALLA balance
- [ ] Switch between accounts
- [ ] Disconnect wallet

### Home Dashboard
- [ ] Balance cards display correctly
- [ ] Recent activity shows
- [ ] Quick action buttons work
- [ ] Navigation menu accessible

---

## 💰 Transaction Pages

### Send/Receive
- [ ] **Send** - Transfer DALLA to another address
- [ ] **Receive** - Display QR code and address
- [ ] **History** - View transaction history

---

## 🔗 Blockchain-Wired Pages (9 Total)

### 1. Staking (`/staking`)
- [ ] Validators list loads from blockchain
- [ ] PoUW contributions display
- [ ] Commission rates show correctly
- [ ] Stake transaction works
- [ ] Pending rewards visible
- [ ] Auto-refresh every 30s

### 2. Governance (`/governance`)
- [ ] Active proposals load
- [ ] Vote counts (Ayes/Nays) display
- [ ] Treasury amounts show
- [ ] Vote on proposal works
- [ ] Proposal status updates
- [ ] Time remaining calculated

### 3. BelizeX/Trade (`/trade`)
- [ ] Liquidity pools load
- [ ] Swap quote calculation works
- [ ] Price impact warning shows
- [ ] Execute swap transaction
- [ ] Trade history displays
- [ ] Exchange rates update

### 4. BelizeID (`/belizeid`)
- [ ] Identity data loads
- [ ] SSN/Passport status shows
- [ ] KYC level displays
- [ ] Transaction limits visible
- [ ] DID (did:belize:...) shows
- [ ] Credentials tab works

### 5. Bridges (`/bridges`)
- [ ] Available bridges list
- [ ] Bridge status (Active/Paused)
- [ ] User transfer history
- [ ] Transfer status tracking
- [ ] Initiate cross-chain transfer
- [ ] Fees and times display

### 6. BNS (`/bns`)
- [ ] User domains load
- [ ] Domain expiry dates show
- [ ] Marketplace listings display
- [ ] Domain metadata visible
- [ ] Register new domain
- [ ] Purchase domain from marketplace

### 7. LandLedger (`/landledger`)
- [ ] Land titles load
- [ ] Property details display
- [ ] Encumbrances show
- [ ] Document hashes visible
- [ ] Transfer history loads
- [ ] Property documents accessible

### 8. Payroll (`/payroll`)
- [ ] Payroll record loads
- [ ] Salary payments history
- [ ] Deductions breakdown
- [ ] YTD stats display
- [ ] Payment verification
- [ ] Employer view (if applicable)

### 9. Analytics (`/analytics`)
- [ ] Total balance displays
- [ ] Monthly change percentage
- [ ] Transaction count shows
- [ ] Average transaction value
- [ ] Voting history insights
- [ ] Trading patterns visible

---

## 🌐 Additional Pages

### Pakit Storage (`/pakit`)
- [ ] Page loads without errors
- [ ] Storage stats display
- [ ] IPFS/Arweave integration status
- [ ] Upload document (if backend running)
- [ ] View stored documents
- [ ] Compression stats

### Nawal AI (`/nawal`)
- [ ] Page loads without errors
- [ ] Federated learning status
- [ ] Model training history
- [ ] PoUW rewards from FL
- [ ] Contribution stats
- [ ] Privacy metrics

### Kinich Quantum (`/kinich`)
- [ ] Page loads without errors
- [ ] Quantum backends status
- [ ] Job submission form
- [ ] Job history displays
- [ ] Results visualization
- [ ] Backend selection (Azure/IBM)

### GEM Platform (`/gem`)
- [ ] Smart contracts list
- [ ] PSP22/PSP34 tokens
- [ ] Faucet functionality
- [ ] DAO templates display
- [ ] Contract interaction
- [ ] SDK documentation

### Community (`/community`)
- [ ] Community proposals load
- [ ] Voting interface works
- [ ] Community stats display
- [ ] Fee exemption status
- [ ] Education rewards
- [ ] Referral program

---

## 💬 Messaging (XMTP Fixed)

### Messages (`/messages`)
- [ ] Page loads without WASM errors
- [ ] XMTP client initializes (client-side)
- [ ] Conversation list displays
- [ ] Send message works
- [ ] Receive message notifications
- [ ] Bluetooth mesh fallback status
- [ ] Emergency broadcast system

---

## 🔒 Client-Side Tools

### Security (`/security`)
- [ ] Recovery contacts management
- [ ] Multi-sig wallet setup
- [ ] Security audit logs
- [ ] Account recovery flow
- [ ] 2FA settings

### Developer (`/developer`)
- [ ] API keys generation
- [ ] Webhooks configuration
- [ ] SDK documentation links
- [ ] RPC endpoint info
- [ ] Code examples

---

## 🐛 Error Handling Tests

### Loading States
- [ ] LoadingSpinner shows during data fetch
- [ ] Skeleton loaders display correctly
- [ ] Progress indicators work

### Error States
- [ ] ErrorMessage shows on API failure
- [ ] Blockchain connection errors handled
- [ ] Transaction errors displayed
- [ ] Retry functionality works

### Empty States
- [ ] ConnectWalletPrompt shows when disconnected
- [ ] Empty data states display properly
- [ ] "No items" messages show

---

## ⚡ Performance Tests

### Auto-Refresh
- [ ] 30-second polling works
- [ ] Data updates without page reload
- [ ] No memory leaks over time

### Navigation
- [ ] Page transitions smooth
- [ ] Back button works
- [ ] Deep linking works (share URL)
- [ ] Tab navigation functional

---

## 📱 Responsive Design

- [ ] Mobile view (< 768px)
- [ ] Tablet view (768px - 1024px)
- [ ] Desktop view (> 1024px)
- [ ] Bottom navigation on mobile
- [ ] Drawer menu on desktop

---

## 🔄 Transaction Flow Tests

### Complete Transaction Workflows

1. **Stake DALLA**
   - [ ] Navigate to /staking
   - [ ] Select validator
   - [ ] Enter stake amount
   - [ ] Sign transaction in Polkadot.js
   - [ ] Verify transaction success
   - [ ] See updated staked balance

2. **Vote on Proposal**
   - [ ] Navigate to /governance
   - [ ] Select proposal
   - [ ] Vote Aye or Nay
   - [ ] Sign transaction
   - [ ] Verify vote recorded

3. **Swap Tokens**
   - [ ] Navigate to /trade
   - [ ] Select token pair (DALLA ↔ bBZD)
   - [ ] Enter amount
   - [ ] Check swap quote
   - [ ] Execute swap
   - [ ] Verify balance change

4. **Register Domain**
   - [ ] Navigate to /bns
   - [ ] Enter .bz domain name
   - [ ] Check availability
   - [ ] Pay registration fee
   - [ ] Verify ownership

5. **Bridge Transfer**
   - [ ] Navigate to /bridges
   - [ ] Select destination (Ethereum/Polkadot)
   - [ ] Enter amount
   - [ ] Confirm transfer
   - [ ] Track transfer status

---

## ✅ Sign-Off Criteria

### Must Pass (Critical)
- [ ] All 9 blockchain-wired pages load data
- [ ] Wallet connection works
- [ ] At least 1 transaction completes successfully
- [ ] No console errors on critical paths
- [ ] XMTP messaging loads without SSR errors

### Should Pass (Important)
- [ ] All pages compile without errors
- [ ] Auto-refresh works on all pages
- [ ] Error states display properly
- [ ] Mobile responsive design works

### Nice to Have (Enhancement)
- [ ] Pakit/Nawal/Kinich external services running
- [ ] Multi-sig transactions work
- [ ] Emergency broadcast system tested
- [ ] Performance metrics under 3s load time

---

## 🚨 Known Issues

1. **Pakit/Nawal/Kinich** - Require external services (IPFS, FL server, Quantum backends)
2. **XMTP Messaging** - Loads dynamically (client-side only, may take 1-2s to initialize)
3. **Mock Data** - Some services may return mock data if blockchain genesis not fully seeded

---

## 📝 Testing Notes

**Test Date:** _________________  
**Tester:** _________________  
**Browser:** _________________  
**Blockchain Block #:** _________________  

### Critical Bugs Found:
1. _________________
2. _________________
3. _________________

### Enhancements Suggested:
1. _________________
2. _________________
3. _________________

---

## 🎯 Next Steps After Testing

1. **If all tests pass:**
   - Deploy to staging environment
   - Run integration tests with full blockchain
   - Load testing with 100+ concurrent users

2. **If critical bugs found:**
   - Fix bugs in priority order
   - Re-run affected test cases
   - Update documentation

3. **Future Enhancements:**
   - Deploy Pakit IPFS nodes
   - Deploy Nawal FL server
   - Deploy Kinich quantum backends
   - Production XMTP configuration
