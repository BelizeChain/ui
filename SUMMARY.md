# 🔌 UI Wiring Summary - Quick Reference

**Date**: January 25, 2026  
**Current Status**: Infrastructure 100% Ready → **Start Wiring Pages**

---

## 📊 Quick Status

| Component | Status | Action Needed |
|-----------|--------|---------------|
| **Backend Services** | ✅ 100% | None - ready to use |
| **Environment Files** | ✅ Created | Copy to `.env.local` |
| **UI Components** | ✅ Created | Use in pages |
| **Test Script** | ✅ Working | Run before starting |
| **Frontend Pages** | 🟡 15% | **Wire to blockchain** |

---

## 🎯 What You Need to Know

### The Situation
- **Backend is DONE** ✅ - All 15 pallet services implemented and tested
- **Frontend is SCAFFOLDED** ✅ - All pages exist with beautiful UI
- **Problem**: Pages use **mock/placeholder data** instead of blockchain
- **Solution**: Wire each page to its corresponding service

### The Work
**~14 pages** need wiring (2-3 hours each) = **1-2 weeks total**

### The Pattern
```typescript
// BEFORE: Mock data
const data = { balance: '1000 DALLA' };

// AFTER: Blockchain data
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchData() {
    const result = await service.getBalance(address);
    setData(result);
    setLoading(false);
  }
  fetchData();
}, [address]);
```

---

## 📚 Key Documents Created

1. **[README_WIRING_STATUS.md](README_WIRING_STATUS.md)** ← Read this first (complete overview)
2. **[WIRING_GUIDE.md](WIRING_GUIDE.md)** ← Step-by-step instructions
3. **[maya-wallet/WIRING_PROGRESS.md](maya-wallet/WIRING_PROGRESS.md)** ← Track your work
4. **[UI_WIRING_STATUS.md](UI_WIRING_STATUS.md)** ← Technical details
5. **[test-wiring.sh](test-wiring.sh)** ← Run this before starting

---

## 🚀 Get Started in 3 Steps

### Step 1: Setup (2 minutes)
```bash
# Create environment files
cp ui/maya-wallet/.env.example ui/maya-wallet/.env.local
cp ui/blue-hole-portal/.env.example ui/blue-hole-portal/.env.local

# Test connectivity
./ui/test-wiring.sh
```

### Step 2: Start Services (3 terminals)
```bash
# Terminal 1: Blockchain (REQUIRED)
./target/release/belizechain-node --dev --tmp

# Terminal 2: Python services (OPTIONAL)
source .venv/bin/activate
cd nawal && python -m nawal.orchestrator server &
cd kinich && python -m kinich.core.quantum_node &
cd pakit && python -m pakit.api_server &

# Terminal 3: UI
cd ui && npm run dev:all
```

### Step 3: Start Wiring
```bash
# Open browser: http://localhost:3001
# Read guide: ui/WIRING_GUIDE.md
# Start with: Staking Page (highest priority)
```

---

## 📋 Priority List

### Week 1 (High Priority)
1. ⬜ Staking Page → `services/staking.ts`
2. ⬜ Governance Page → `services/governance.ts`
3. ⬜ BelizeX Page → `services/belizex.ts`
4. ⬜ BelizeID Page → `services/identity.ts`

### Week 2 (Medium Priority)
5. ⬜ Nawal Page → `api/nawal-client.ts`
6. ⬜ Kinich Page → `api/kinich-client.ts`
7. ⬜ Pakit Page → `api/pakit-client.ts`
8. ⬜ BNS Page → `services/bns.ts`
9. ⬜ Land Ledger → `services/landledger.ts`
10. ⬜ Payroll → `services/payroll.ts`
11. ⬜ Bridges → `services/interoperability.ts`
12. ⬜ GEM → `services/contracts.ts`
13. ⬜ Community → `services/community.ts`
14. ⬜ Oracle → `services/oracle.ts`

---

## 🔧 Useful Components Created

```typescript
// Show loading state
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
<LoadingSpinner message="Loading staking data..." />

// Show errors
import { ErrorMessage } from '@/components/ui/ErrorMessage';
<ErrorMessage message="Failed to load" onRetry={fetchData} />

// Require wallet connection
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
if (!isConnected) return <ConnectWalletPrompt />;
```

---

## 🐛 Quick Debugging

### Test Blockchain Connection
```bash
./ui/test-wiring.sh
# Should show: ✅ Blockchain node running
```

### Check Services
```bash
# Blockchain
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9944
# Should timeout (WebSocket) but means port is open

# Nawal
curl http://localhost:8001/health
# Should return: {"status":"ok"}
```

### Browser Console
```javascript
// In browser console (with UI open)
console.log('Connected:', await api?.isConnected);
```

---

## 📞 Common Issues

| Issue | Solution |
|-------|----------|
| Cannot connect | Run `./target/release/belizechain-node --dev --tmp` |
| Extension error | Install Polkadot.js extension + enable for localhost |
| Type errors | Check `ui/shared/src/types/substrate.ts` |
| SSR errors | Add `'use client'` at top of file |
| Module not found | Verify pallet exists in `runtime/src/lib.rs` |

---

## ✅ Definition of Done (per page)

- [ ] Imports service/client
- [ ] Removes mock data
- [ ] Adds loading state
- [ ] Adds error handling
- [ ] Displays blockchain data
- [ ] Transactions work (if applicable)
- [ ] Mobile responsive
- [ ] No console warnings
- [ ] Updated WIRING_PROGRESS.md

---

## 📈 Track Your Progress

Edit `ui/maya-wallet/WIRING_PROGRESS.md`:
```markdown
## High Priority Pages (Week 1)

### 1. Staking & Validators
- 🔄 **Staking Page** (`app/staking/page.tsx`) ← IN PROGRESS
  - Started: 2026-01-25
  - Developer: Your Name
  - Status: 60% complete
  - Blocker: None
```

---

## 🎓 Learning Path

1. **Read**: `README_WIRING_STATUS.md` (overview)
2. **Study**: One service file (e.g., `services/staking.ts`)
3. **Wire**: One simple page first (e.g., BelizeID)
4. **Test**: Run through complete flow
5. **Repeat**: Move to next page

---

## 💡 Pro Tips

- Start blockchain node FIRST (other services won't work without it)
- Test with real transactions (need Polkadot.js extension)
- Use browser DevTools Network tab to debug API calls
- Check browser console for helpful error messages
- Copy-paste the loading/error pattern from completed pages

---

## 📞 Need Help?

1. Check `ui/WIRING_GUIDE.md` for detailed examples
2. Review `ui/maya-wallet/STATUS_REPORT.md` for service API docs
3. Look at `contexts/WalletContext.tsx` for working example
4. Read service file comments for usage instructions

---

## 🎯 Success Metrics

**End of Week 1**:
- [ ] All 4 high-priority pages wired
- [ ] Transactions working end-to-end
- [ ] No mock data in those pages

**End of Week 2**:
- [ ] All 14 feature pages wired
- [ ] Complete integration testing
- [ ] Production-ready UI

---

## 🚦 Ready to Start?

```bash
# Verify you have everything
./ui/test-wiring.sh

# Expected: ✅ Blockchain node running
# Then open: http://localhost:3001
# And start wiring! 🚀
```

**Good luck! The backend is solid - just connect the dots! 🔌**

---

**Quick Links**:
- 📖 [Full Status Report](README_WIRING_STATUS.md)
- 📝 [Wiring Guide](WIRING_GUIDE.md)
- ✅ [Progress Tracker](maya-wallet/WIRING_PROGRESS.md)
- 🧪 [Test Script](test-wiring.sh)
