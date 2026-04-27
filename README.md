# 🇧🇿 BelizeChain UI Suite

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/BelizeChain/belizechain)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2014-000000?logo=next.js)](https://nextjs.org/)

Production-ready user interface suite for the BelizeChain sovereign blockchain infrastructure.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run both applications in development
npm run dev:all

# Or run individually
npm run dev:maya        # Maya Wallet (localhost:3001)
npm run dev:bluehole    # Blue Hole Portal (localhost:3002)

# Build for production
npm run build:all
```

## Runtime Configuration

The shell now resolves chain and service endpoints through the shared runtime config helper.
In Ceiba and other self-hosted deployments, prefer the public reverse-proxy routes on the UI origin:

```bash
NEXT_PUBLIC_BLOCKCHAIN_WS=wss://${DOMAIN}/ws
NEXT_PUBLIC_BLOCKCHAIN_RPC=https://${DOMAIN}/rpc
NEXT_PUBLIC_NAWAL_API=https://${DOMAIN}/api/nawal
NEXT_PUBLIC_KINICH_API=https://${DOMAIN}/api/kinich
NEXT_PUBLIC_PAKIT_API=https://${DOMAIN}/api/pakit
NEXT_PUBLIC_IPFS_GATEWAY=https://${DOMAIN}/ipfs
```

For local development, keep the same variable names and point them at local services.

## 📦 Applications

### [Maya Wallet](./maya-wallet/) - **Port 3001**
Citizen and business wallet for managing DALLA/bBZD, staking, governance, and more.

### [Blue Hole Portal](./blue-hole-portal/) - **Port 3002**
Government and validator dashboard for treasury management, compliance, and network analytics.

### [Shared Library](./shared/)
Reusable component library with 15+ components and custom hooks.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[README_PRODUCTION.md](./README_PRODUCTION.md)** | 📖 Complete production deployment guide |
| **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** | 🏗️ Detailed file structure and organization |
| **[shared/README.md](./shared/README.md)** | 🎨 Component library documentation |
| **[docs/archive/](./docs/archive/)** | 📦 Historical development documentation |

## 🛠️ Technology Stack

- **Framework:** Next.js 14.2.33 (App Router)
- **Language:** TypeScript 5.4.5
- **Styling:** Tailwind CSS 3.4.1
- **Blockchain:** Polkadot.js API 10.11.2
- **State:** Zustand 4.5.0 + React Query 5+
- **Icons:** Phosphor React 2.0.0
- **Charts:** Recharts 2.10.3

## 📊 Performance

| Application | Bundle Size | Routes | Lighthouse |
|-------------|-------------|--------|------------|
| Maya Wallet | 124 kB | 12 | 95+ |
| Blue Hole Portal | 87.7 kB | 18 | 95+ |

## 🎯 Features

### Maya Wallet
✅ Multi-currency (DALLA/bBZD)  
✅ BelizeID integration  
✅ PoUW staking rewards  
✅ Governance voting  
✅ Federated learning (Nawal)  
✅ Quantum computing (Kinich)  
✅ Decentralized storage (Pakit)  
✅ Smart contracts (GEM)  
✅ Tourism cashback (5-8%)

### Blue Hole Portal
✅ Multi-signature treasury (4-of-7)  
✅ Validator management & analytics  
✅ KYC/AML compliance oversight  
✅ Proposal creation & voting  
✅ Network analytics & monitoring  
✅ Real-time blockchain sync  
✅ Advanced reporting  
✅ API documentation

## 🏗️ Project Structure

```
ui/
├── shared/              # Component library
├── maya-wallet/         # Citizen wallet (3001)
├── blue-hole-portal/    # Government portal (3002)
├── docs/               # Documentation
└── node_modules/       # Dependencies
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed breakdown.

## 🔧 Development

```bash
# Install dependencies
npm install

# Development mode
npm run dev              # All apps with Turbo
npm run dev:maya         # Maya Wallet only
npm run dev:bluehole     # Blue Hole Portal only

# Production build
npm run build:all

# Linting
npm run lint

# Clean installation
npm run clean
npm install
```

## 📦 Deployment

See [README_PRODUCTION.md](./README_PRODUCTION.md) for complete deployment guide including:
- Environment variables
- Docker configuration
- Production checklist
- Performance optimization
- Security best practices

## 🧹 Recent Cleanup (v2.0.0)

**Removed:**
- ❌ Duplicate uppercase components (Button.tsx, Card.tsx, etc.)
- ❌ Unused nft-marketplace/ directory
- ❌ Non-existent workspace references

**Archived:**
- 📦 Historical development documentation → docs/archive/

**Added:**
- ✨ Comprehensive production documentation
- ✨ Component library reference
- ✨ Project structure guide

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Version:** 2.0.0 (Production Ready)  
**Last Updated:** January 25, 2026  
**Maintainers:** BelizeChain Development Team  
**Built with ❤️ for the Nation of Belize**
