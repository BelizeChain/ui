# 🔗 BelizeChain UI Suite - Integration Architecture

**Version**: 2.0.0  
**Date**: January 31, 2026  
**Repository**: `github.com/BelizeChain/ui`

---

## 📋 Overview

The BelizeChain UI Suite is a **standalone, multi-workspace repository** that integrates with the entire BelizeChain ecosystem via standard web APIs and blockchain protocols. This document describes how the UI communicates with external components while remaining fully decoupled and deployable independently.

---

## 🏗️ Multi-Repository Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BelizeChain Ecosystem                       │
│                    (Microservices Architecture)                 │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│  UI Suite (TS)    │  │ Blockchain (Rust) │  │ GEM Contracts     │
│  Standalone Repo  │  │ Standalone Repo   │  │ (ink! 4.0)        │
├───────────────────┤  ├───────────────────┤  ├───────────────────┤
│ • Maya Wallet     │  │ • 15 Pallets      │  │ • DALLA Token     │
│ • Blue Hole       │  │ • Substrate       │  │ • BeLi NFT        │
│ • Shared Library  │  │ • Runtime         │  │ • Simple DAO      │
└───────────────────┘  └───────────────────┘  └───────────────────┘
        │                      ▲                        ▲
        │                      │                        │
        └──────────────────────┴────────────────────────┘
                    WebSocket (ws://9944)
                    Contract Calls (Polkadot.js)

┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│ Nawal AI (Python) │  │ Kinich Quantum    │  │ Pakit Storage     │
│ Standalone Repo   │  │ (Python)          │  │ (Python)          │
├───────────────────┤  ├───────────────────┤  ├───────────────────┤
│ • FL Server       │  │ • Azure Quantum   │  │ • DAG Storage     │
│ • Genome Engine   │  │ • Error Mitig.    │  │ • Compression     │
└───────────────────┘  └───────────────────┘  └───────────────────┘
        ▲                      ▲                        ▲
        │                      │                        │
        └──────────────────────┴────────────────────────┘
              HTTP REST APIs (ports 8001, 8002, 8003)
```

---

## 🔌 Integration Points

### 1. BelizeChain Blockchain (Substrate/Polkadot.js)

**Protocol**: WebSocket  
**Runtime Config**: `NEXT_PUBLIC_BLOCKCHAIN_WS`, `NEXT_PUBLIC_BLOCKCHAIN_RPC`  
**Default Behavior**: Ceiba public `/ws` and `/rpc` routes, with local fallback to `ws://127.0.0.1:9944` and `http://127.0.0.1:9944`

**Purpose**:
- Primary blockchain connection
- All pallet interactions (Economy, Identity, Governance, etc.)
- Account management (wallets, balances, transactions)
- Event subscriptions (block updates, finality)

**Integration Method**:
```typescript
// shared/src/lib/runtime-config.ts
import { ApiPromise, WsProvider } from '@polkadot/api';
import { getRuntimeConfig } from '@belizechain/shared';

const provider = new WsProvider(getRuntimeConfig().blockchainWsUrl);
const api = await ApiPromise.create({ provider });
```

**Used By**:
- ✅ Maya Wallet: All wallet operations, staking, governance
- ✅ Blue Hole Portal: Treasury, compliance, validator management

**Configuration**:
```bash
# .env.local (local development)
NEXT_PUBLIC_BLOCKCHAIN_WS=ws://127.0.0.1:9944
NEXT_PUBLIC_BLOCKCHAIN_RPC=http://127.0.0.1:9944

# Ceiba public runtime
NEXT_PUBLIC_BLOCKCHAIN_WS=wss://${DOMAIN}/ws
NEXT_PUBLIC_BLOCKCHAIN_RPC=https://${DOMAIN}/rpc
```

---

### 2. Nawal AI (Federated Learning)

**Protocol**: HTTP REST  
**Runtime Config**: `NEXT_PUBLIC_NAWAL_API`  
**Default Behavior**: Ceiba public `/api/nawal` route, with local fallback to `http://localhost:8080`

**Purpose**:
- Federated learning participation
- PoUW (Proof of Useful Work) rewards monitoring
- Model training status
- Privacy-preserving ML contributions

**API Endpoints**:
```
GET  /health                         # Service health check
GET  /api/v1/training/status         # Training round status
POST /api/v1/training/participate    # Join training round
GET  /api/v1/rewards/{accountId}     # Check PoUW rewards
GET  /api/v1/metrics/global          # Global model metrics
```

**Integration Method**:
```typescript
// shared/src/api/nawal-client.ts
import { getRuntimeConfig } from '../lib/runtime-config';

export class NawalClient {
  private baseUrl = getRuntimeConfig().nawalApiUrl;
  
  async getTrainingStatus() {
    const response = await fetch(`${this.baseUrl}/api/v1/training/status`);
    return response.json();
  }
}
```

**Used By**:
- ✅ Maya Wallet: Federated learning participation, rewards display
- ✅ Blue Hole Portal: Network-wide FL metrics, participant monitoring

**Configuration**:
```bash
# .env.local
NEXT_PUBLIC_NAWAL_API=http://localhost:8080

# Ceiba public runtime
NEXT_PUBLIC_NAWAL_API=https://${DOMAIN}/api/nawal
```

---

### 3. Kinich Quantum (Quantum Computing)

**Protocol**: HTTP REST  
**Runtime Config**: `NEXT_PUBLIC_KINICH_API`  
**Default Behavior**: Ceiba public `/api/kinich` route, with local fallback to `http://localhost:8888`

**Purpose**:
- Quantum workload submission
- PQW (Proof of Quantum Work) verification
- Quantum key distribution (QKD)
- Multi-backend quantum computing (Azure, IBM)

**API Endpoints**:
```
GET  /readyz                         # Service health check
POST /api/v1/quantum/submit          # Submit quantum job
GET  /api/v1/quantum/results/{jobId} # Get job results
GET  /api/v1/qkd/generate            # Generate quantum keys
GET  /api/v1/backends/status         # Backend availability
```

**Integration Method**:
```typescript
// shared/src/api/kinich-client.ts
import { getRuntimeConfig } from '../lib/runtime-config';

export class KinichClient {
  private baseUrl = getRuntimeConfig().kinichApiUrl;
  
  async submitQuantumJob(circuit: string) {
    const response = await fetch(`${this.baseUrl}/api/v1/quantum/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ circuit })
    });
    return response.json();
  }
}
```

**Used By**:
- ✅ Maya Wallet: Quantum job submission, QKD key generation
- ✅ Blue Hole Portal: PQW monitoring, backend status

**Configuration**:
```bash
# .env.local
NEXT_PUBLIC_KINICH_API=http://localhost:8888

# Ceiba public runtime
NEXT_PUBLIC_KINICH_API=https://${DOMAIN}/api/kinich
```

---

### 4. Pakit Storage (Decentralized Storage)

**Protocol**: HTTP REST  
**Runtime Config**: `NEXT_PUBLIC_PAKIT_API`  
**Default Behavior**: Ceiba public `/api/pakit` route, with local fallback to `http://localhost:8001`

**Purpose**:
- Sovereign DAG storage
- Document uploads (land titles, identity documents)
- Quantum compression
- Storage proof verification

**API Endpoints**:
```
GET  /health                         # Service health check
POST /api/v1/storage/upload          # Upload document
GET  /api/v1/storage/retrieve/{cid}  # Retrieve by CID
GET  /api/v1/proof/{cid}             # Get storage proof
GET  /api/v1/stats                   # Storage statistics
```

**Integration Method**:
```typescript
// shared/src/api/pakit-client.ts
import { getRuntimeConfig } from '../lib/runtime-config';

export class PakitClient {
  private baseUrl = getRuntimeConfig().pakitApiUrl;
  
  async uploadDocument(file: File, metadata: object) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    
    const response = await fetch(`${this.baseUrl}/api/v1/storage/upload`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  }
}
```

**Used By**:
- ✅ Maya Wallet: Document storage (identity documents)
- ✅ Blue Hole Portal: Land ledger documents, compliance records

**Configuration**:
```bash
# .env.local
NEXT_PUBLIC_PAKIT_API=http://localhost:8001

# Ceiba public runtime
NEXT_PUBLIC_PAKIT_API=https://${DOMAIN}/api/pakit
```

---

### 5. GEM Smart Contracts (ink! 4.0)

**Protocol**: Polkadot.js Contract Calls  
**Via**: BelizeChain node connection (ws://9944)  
**Environment Variables**: `NEXT_PUBLIC_DALLA_CONTRACT`, `NEXT_PUBLIC_BELI_NFT_CONTRACT`, etc.

**Purpose**:
- PSP22 token interactions (DALLA/custom tokens)
- PSP34 NFT minting/transfers
- DAO governance participation
- Testnet faucet claims

**Integration Method**:
```typescript
// shared/src/blockchain/contracts.ts
import { ContractPromise } from '@polkadot/api-contract';

const dallaAddress = process.env.NEXT_PUBLIC_DALLA_CONTRACT;
const dallaAbi = await import('@/contracts/dalla_token.json');

const contract = new ContractPromise(api, dallaAbi, dallaAddress);

// Call contract method
const result = await contract.query.balanceOf(
  callerAddress,
  { gasLimit: -1 },
  accountAddress
);
```

**Used By**:
- ✅ Maya Wallet: Token transfers, NFT management, DAO voting, faucet claims

**Configuration**:
```bash
# .env.local
NEXT_PUBLIC_DALLA_CONTRACT=5...xyz    # DALLA token contract address
NEXT_PUBLIC_BELI_NFT_CONTRACT=5...abc  # BeLi NFT contract address
NEXT_PUBLIC_DAO_CONTRACT=5...def       # DAO contract address
NEXT_PUBLIC_FAUCET_CONTRACT=5...ghi    # Faucet contract (testnet)
```

---

## 🔧 Environment Variable Management

### Hierarchy

The UI Suite uses a **three-tier environment variable system**:

1. **Root `.env.example`** - Template for all variables (this repository)
2. **App-specific `.env.example`** - Maya Wallet / Blue Hole Portal specific vars
3. **Runtime `.env.local`** - User's local configuration (gitignored)

### Example Configuration

```bash
# Root: ui/.env.local (shared by both apps)
NEXT_PUBLIC_BLOCKCHAIN_WS=ws://127.0.0.1:9944
NEXT_PUBLIC_BLOCKCHAIN_RPC=http://127.0.0.1:9944
NEXT_PUBLIC_NAWAL_API=http://localhost:8080
NEXT_PUBLIC_KINICH_API=http://localhost:8888
NEXT_PUBLIC_PAKIT_API=http://localhost:8001

# Maya-specific: maya-wallet/.env.local
MAYA_PORT=3001
NEXT_PUBLIC_DEV_MODE=true

# Blue Hole-specific: blue-hole-portal/.env.local
BLUEHOLE_PORT=3002
NEXT_PUBLIC_DEV_MODE=false
```

### Fallback Strategy

All integrations use **smart fallbacks** via the shared runtime config helper:

```typescript
import { getRuntimeConfig } from '@belizechain/shared';

const endpoint = getRuntimeConfig().blockchainWsUrl;
```

This allows:
- ✅ **Ceiba public proxy routes** when the UI is running behind nginx
- ✅ **Explicit environment overrides** for staging or custom testnets
- ✅ **Graceful degradation** when services are unavailable
- ✅ **Development mode** without full stack running
- ✅ **Mock data** for frontend development

---

## 🚀 Deployment Scenarios

### Scenario 1: Full Local Stack

**All services running locally**:

```bash
# Terminal 1: BelizeChain node
cd ../blockchain
./target/release/belizechain-node --dev --tmp

# Terminal 2: Python services
cd ../nawal && python -m nawal.orchestrator server &
cd ../kinich && python -m kinich.core.quantum_node &
cd ../pakit && python -m pakit.api &

# Terminal 3: UI Suite
cd ui
npm install
npm run dev:all  # Maya (3001) + Blue Hole (3002)
```

### Scenario 2: UI Only (Mock Mode)

**UI development without backend**:

```bash
# ui/.env.local
NEXT_PUBLIC_MOCK_DATA=true
NEXT_PUBLIC_DEV_MODE=true

# Start UI only
npm run dev:all
```

UI will use:
- Mock blockchain data
- Mock API responses
- Static fallback values

### Scenario 3: Production Deployment

**Deployed to Vercel/Netlify**:

```bash
# Environment variables in hosting platform
NEXT_PUBLIC_BLOCKCHAIN_WS=wss://${DOMAIN}/ws
NEXT_PUBLIC_BLOCKCHAIN_RPC=https://${DOMAIN}/rpc
NEXT_PUBLIC_NAWAL_API=https://${DOMAIN}/api/nawal
NEXT_PUBLIC_KINICH_API=https://${DOMAIN}/api/kinich
NEXT_PUBLIC_PAKIT_API=https://${DOMAIN}/api/pakit
NEXT_PUBLIC_IPFS_GATEWAY=https://${DOMAIN}/ipfs
NODE_ENV=production
```

### Scenario 4: Docker Compose (Recommended)

**All services orchestrated**:

```yaml
# docker-compose.yml
services:
  blockchain:
    image: ghcr.io/belizechain/blockchain:latest
    ports: ["9944:9944"]
  
  nawal:
    image: ghcr.io/belizechain/nawal:latest
    ports: ["8001:8001"]
  
  kinich:
    image: ghcr.io/belizechain/kinich:latest
    ports: ["8002:8002"]
  
  pakit:
    image: ghcr.io/belizechain/pakit:latest
    ports: ["8003:8003"]
  
  maya-wallet:
    build: ./maya-wallet
    ports: ["3001:3001"]
    environment:
      - NEXT_PUBLIC_BLOCKCHAIN_WS=wss://${DOMAIN}/ws
      - NEXT_PUBLIC_BLOCKCHAIN_RPC=https://${DOMAIN}/rpc
      - NEXT_PUBLIC_NAWAL_API=https://${DOMAIN}/api/nawal
      - NEXT_PUBLIC_KINICH_API=https://${DOMAIN}/api/kinich
      - NEXT_PUBLIC_PAKIT_API=https://${DOMAIN}/api/pakit
  
  blue-hole-portal:
    build: ./blue-hole-portal
    ports: ["3002:3002"]
    environment:
      - NEXT_PUBLIC_BLOCKCHAIN_WS=wss://${DOMAIN}/ws
      - NEXT_PUBLIC_BLOCKCHAIN_RPC=https://${DOMAIN}/rpc
      - NEXT_PUBLIC_NAWAL_API=https://${DOMAIN}/api/nawal
      - NEXT_PUBLIC_KINICH_API=https://${DOMAIN}/api/kinich
      - NEXT_PUBLIC_PAKIT_API=https://${DOMAIN}/api/pakit
```

```bash
docker-compose up
```

---

## 🧪 Testing Integration

### Unit Tests

**Test individual components**:

```bash
# Maya Wallet (Playwright)
npm run test --workspace=maya-wallet

# Blue Hole Portal (Jest)
npm run test --workspace=blue-hole-portal

# Shared Library
npm run test --workspace=shared
```

### Integration Tests

**Test against live services**:

```typescript
// maya-wallet/tests/integration-fixtures.ts
import { test } from '@playwright/test';
import { WsProvider } from '@polkadot/api';

test.beforeAll(async () => {
  // Verify blockchain node is running
  const provider = new WsProvider(process.env.NEXT_PUBLIC_BLOCKCHAIN_WS ?? 'ws://127.0.0.1:9944');
  await provider.connect();
  
  // Verify Python services
  const nawalBaseUrl = process.env.NEXT_PUBLIC_NAWAL_API ?? 'http://localhost:8080';
  const nawalHealth = await fetch(`${nawalBaseUrl}/health`);
  expect(nawalHealth.status).toBe(200);
});
```

### E2E Tests

**Full user workflows**:

```typescript
test('complete staking workflow', async ({ page }) => {
  // 1. Connect wallet
  await page.goto('http://localhost:3001');
  await page.click('[data-testid="connect-wallet"]');
  
  // 2. Navigate to staking
  await page.click('[data-testid="nav-staking"]');
  
  // 3. Stake DALLA
  await page.fill('[data-testid="stake-amount"]', '1000');
  await page.click('[data-testid="stake-confirm"]');
  
  // 4. Verify on-chain transaction
  await page.waitForSelector('[data-testid="stake-success"]');
});
```

---

## 📊 Monitoring & Observability

### Health Checks

All integration points have health checks:

```typescript
// shared/src/utils/health.ts
export async function checkServicesHealth() {
  const results = {
    blockchain: await checkBlockchain(),
    nawal: await checkService('nawal'),
    kinich: await checkService('kinich'),
    pakit: await checkService('pakit'),
  };
  
  return results;
}

async function checkBlockchain() {
  try {
    const provider = new WsProvider(process.env.NEXT_PUBLIC_BLOCKCHAIN_WS ?? 'ws://127.0.0.1:9944');
    await provider.connect();
    return { status: 'online', latency: provider.stats.bytesRecv };
  } catch (error) {
    return { status: 'offline', error: error.message };
  }
}
```

### Error Handling

**Graceful degradation**:

```typescript
// If Nawal is offline, continue without FL features
try {
  const status = await nawalClient.getTrainingStatus();
  setFLStatus(status);
} catch (error) {
  console.warn('Nawal service unavailable:', error);
  setFLStatus({ available: false, message: 'Federated learning offline' });
  // UI still works without FL features
}
```

---

## 🔐 Security Considerations

### CORS Configuration

**Backend services** must allow UI origins:

```python
# Nawal/Kinich/Pakit - FastAPI CORS
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",  # Maya Wallet (dev)
        "http://localhost:3002",  # Blue Hole Portal (dev)
        "https://wallet.belizechain.org",  # Maya (production)
        "https://portal.belizechain.org",  # Blue Hole (production)
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### API Authentication

**Future enhancement** - Add JWT tokens:

```typescript
// Authenticated API call
const token = await getAuthToken();
const response = await fetch(`${endpoint}/api/v1/protected`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

### Content Security Policy

**Next.js security headers**:

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};
```

---

## 📚 Related Documentation

- **[README.md](./README.md)** - Quick start guide
- **[README_PRODUCTION.md](./README_PRODUCTION.md)** - Production deployment
- **[WIRING_GUIDE.md](./WIRING_GUIDE.md)** - Component wiring patterns
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing strategies

---

**Status**: 🟢 **PRODUCTION-READY INTEGRATION**  
**Last Updated**: January 31, 2026  
**Maintainer**: BelizeChain Development Team
