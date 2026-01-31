# 🇧🇿 BelizeChain UI Suite - Production Environment

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/BelizeChain/belizechain)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2014-000000?logo=next.js)](https://nextjs.org/)

Production-ready user interface suite for the BelizeChain sovereign blockchain infrastructure.

## 📦 Monorepo Structure

```
ui/
├── shared/                    # Shared UI component library
│   ├── src/
│   │   ├── components/ui/    # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and helpers
│   │   └── styles/           # Global styles and themes
│   └── package.json
│
├── maya-wallet/              # Citizen/Business Wallet (Port 3001)
│   ├── src/
│   │   ├── app/             # Next.js 14 app directory
│   │   ├── components/      # Wallet-specific components
│   │   ├── lib/             # Blockchain integration
│   │   └── types/           # TypeScript definitions
│   └── package.json
│
├── blue-hole-portal/         # Government/Validator Dashboard (Port 3002)
│   ├── src/
│   │   ├── app/             # Next.js 14 app directory
│   │   ├── components/      # Portal-specific components
│   │   ├── lib/             # Blockchain hooks
│   │   └── types/           # TypeScript definitions
│   └── package.json
│
└── package.json              # Root workspace configuration
```

## 🎯 Applications

### 1. **Maya Wallet** - Citizen & Business Interface
**Port:** 3001  
**Target Users:** Citizens, Businesses, Tourists

**Features:**
- Multi-currency support (DALLA/bBZD)
- BelizeID integration with SSN/Passport
- Staking & PoUW rewards
- Governance participation
- Nawal AI federated learning
- Kinich quantum computing
- Pakit decentralized storage
- GEM smart contracts
- Tourism cashback (5-8%)

**Routes:**
- `/` - Dashboard with balance overview
- `/identity` - BelizeID management
- `/staking` - PoUW staking interface
- `/governance` - Proposal voting
- `/nawal` - Federated learning participation
- `/kinich` - Quantum computing access
- `/pakit` - Decentralized file storage
- `/gem` - Smart contract interaction
- `/analytics` - Personal analytics
- `/activity` - Transaction history
- `/about` - Wallet information
- `/help` - User documentation

### 2. **Blue Hole Portal** - Government & Validator Interface
**Port:** 3002  
**Target Users:** Government Officials, Validators, District Councils

**Features:**
- Multi-signature treasury (4-of-7)
- Validator management & analytics
- Compliance & KYC oversight
- Proposal creation & voting
- Network analytics & monitoring
- Treasury spend proposals
- Advanced reporting
- Real-time blockchain sync

**Routes:**
- `/` - Dashboard overview
- `/governance/proposals` - Proposal management
- `/governance/proposals/[id]` - Proposal details
- `/governance/proposals/new` - Create proposal
- `/treasury` - Multi-sig treasury
- `/treasury/spend/new` - Spend proposal
- `/validators` - Validator list
- `/validators/[address]` - Validator details
- `/validators/nominate` - Validator nomination
- `/compliance` - KYC/AML oversight
- `/compliance/apply` - Compliance application
- `/analytics` - Network analytics
- `/reports` - Governance reports
- `/profile` - Admin profile
- `/settings` - System settings
- `/developer` - API documentation
- `/explorer` - Blockchain explorer

## 🚀 Quick Start

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
```

### Installation
```bash
# Install all dependencies
npm install

# Development mode - all applications
npm run dev:all

# Development mode - individual apps
npm run dev:maya        # Maya Wallet (localhost:3001)
npm run dev:bluehole    # Blue Hole Portal (localhost:3002)
```

### Production Build
```bash
# Build all applications
npm run build:all

# Build individual apps
npm run build --workspace=maya-wallet
npm run build --workspace=blue-hole-portal
```

### Clean Install
```bash
# Remove all dependencies and reinstall
npm run clean
npm install
```

## 🎨 Shared Component Library

The `@belizechain/shared` package provides reusable components for both applications:

### UI Components
- `GlassCard` - Glassmorphic card with 11 variants
- `Button` - Styled button with multiple variants
- `Card` - Standard card component
- `Avatar` - User avatar with fallback
- `Badge` - Status and category badges
- `Dialog` - Modal dialogs
- `Progress` - Progress indicators
- `Tabs` - Tab navigation
- `Input`, `Select`, `Switch` - Form controls
- `AssetCard`, `ProposalCard`, `StatCard` - Specialized cards

### Hooks
```typescript
import { useBlockchain } from '@belizechain/shared';

const { blockNumber, isConnected, api } = useBlockchain();
```

### Usage in Applications
```typescript
import { GlassCard, Button } from '@belizechain/shared';

<GlassCard variant="dark-medium" blur="lg">
  <Button variant="primary">Connect Wallet</Button>
</GlassCard>
```

## 🔧 Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.33 | React framework with App Router |
| React | 18.3.1 | UI library |
| TypeScript | 5.4.5 | Type safety |
| Tailwind CSS | 3.4.1 | Utility-first styling |
| Polkadot.js | 10.11.2 | Blockchain integration |
| Zustand | 4.5.0 | State management |
| React Query | 5+ | Server state caching |
| Recharts | 2.10.3 | Data visualization |
| Phosphor Icons | 2.0.0 | Icon library |
| Radix UI | Latest | Accessible primitives |

## 📐 Design System

### Color Palette
```css
/* Primary Colors */
--caribbean: #00B4D8    /* Ocean blue */
--bluehole: #0077B6     /* Deep blue */
--jungle: #38A169       /* Forest green */
--sand: #F5E6D3         /* Beach sand */
--sunset: #FF6B6B       /* Coral red */
--maya: #9333EA         /* Maya purple */

/* Dark Theme */
--gray-900: #111827
--gray-800: #1F2937
--gray-700: #374151
--blue-500: #3B82F6
--emerald-500: #10B981
```

### Typography
- **Font Family:** Inter (system fallback)
- **Headings:** 700 weight, tracking tight
- **Body:** 400 weight, leading relaxed
- **Code:** Fira Code monospace

### Spacing Scale
- `xs`: 0.25rem (4px)
- `sm`: 0.5rem (8px)
- `md`: 1rem (16px)
- `lg`: 1.5rem (24px)
- `xl`: 2rem (32px)
- `2xl`: 3rem (48px)

## 🔗 Blockchain Integration

### Polkadot.js Connection
```typescript
import { ApiPromise, WsProvider } from '@polkadot/api';

const provider = new WsProvider('ws://localhost:9944');
const api = await ApiPromise.create({ provider });
```

### Custom Hooks
- `useEconomy()` - DALLA/bBZD balances & treasury
- `useStaking()` - PoUW staking & validators
- `useGovernance()` - Proposals & voting
- `useCompliance()` - KYC/AML status
- `useSystem()` - Chain metadata
- `useOptimisticVoting()` - Optimistic UI for votes
- `useOptimisticApprovals()` - Optimistic treasury approvals

## 📊 Performance Metrics

### Maya Wallet
- **First Load JS:** 124 kB (gzipped: 41.2 kB)
- **Total Routes:** 15
- **Lighthouse Score:** 95+

### Blue Hole Portal
- **First Load JS:** 87.7 kB (gzipped: 29.3 kB)
- **Total Routes:** 18
- **Lighthouse Score:** 95+

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests for specific app
npm run test --workspace=maya-wallet
npm run test --workspace=blue-hole-portal

# Coverage report
npm run test:coverage
```

## 🚢 Deployment

### Environment Variables

**Maya Wallet (.env.local):**
```bash
NEXT_PUBLIC_CHAIN_WS=ws://localhost:9944
NEXT_PUBLIC_CHAIN_HTTP=http://localhost:9933
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
NEXT_PUBLIC_ARWEAVE_GATEWAY=https://arweave.net/
```

**Blue Hole Portal (.env.local):**
```bash
NEXT_PUBLIC_CHAIN_WS=ws://localhost:9944
NEXT_PUBLIC_CHAIN_HTTP=http://localhost:9933
NEXT_PUBLIC_ADMIN_API=http://localhost:8080
```

### Docker Deployment
```bash
# Build images
docker build -t belizechain/maya-wallet:latest ./maya-wallet
docker build -t belizechain/blue-hole-portal:latest ./blue-hole-portal

# Run containers
docker-compose up -d
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure HTTPS/SSL certificates
- [ ] Enable rate limiting
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure CDN for static assets
- [ ] Enable gzip/brotli compression
- [ ] Set up backup strategies
- [ ] Configure Web3 providers
- [ ] Test all blockchain integrations
- [ ] Review security headers

## 📝 Development Guidelines

### Code Style
- **ESLint:** Enforce code quality
- **Prettier:** Auto-format on save
- **TypeScript:** Strict mode enabled
- **Git Hooks:** Husky pre-commit checks

### Component Patterns
```typescript
// Preferred: Functional components with TypeScript
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant, onClick, children }) => {
  return <button onClick={onClick}>{children}</button>;
};
```

### File Naming
- Components: `PascalCase.tsx` (e.g., `GlassCard.tsx`)
- Hooks: `camelCase.ts` (e.g., `useBlockchain.ts`)
- Utils: `kebab-case.ts` (e.g., `format-currency.ts`)
- Pages: Next.js App Router convention

## 🔐 Security

### Authentication
- BelizeID integration
- SSN/Passport verification
- Multi-signature wallet support
- 2FA for sensitive operations

### Best Practices
- No private keys in client
- Sign transactions server-side when possible
- Validate all user inputs
- Sanitize blockchain data
- Use CSP headers
- Enable CORS restrictions

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 3001
kill -9 $(lsof -t -i:3001)
```

**Module not found:**
```bash
# Clean and reinstall
npm run clean
npm install
```

**Build fails:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## 📚 Documentation

- [BelizeChain Architecture](../docs/architecture/)
- [Developer Guide](../docs/developer-guides/DEVELOPMENT_GUIDE.md)
- [API Reference](../docs/technical-reference/)
- [Deployment Guide](../docs/deployment/)

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

## 🙏 Acknowledgments

- **Maya Civilization:** Inspiration for cultural theming
- **Belize Government:** Sovereign blockchain initiative
- **Polkadot/Substrate:** Blockchain framework
- **Next.js Team:** React framework excellence

---

**Built with ❤️ for the Nation of Belize**
