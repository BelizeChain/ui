# 🏗️ BelizeChain UI - Project Structure

## 📂 Directory Tree

```
ui/
├── 📁 shared/                              # Shared component library
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/                        # UI components (lowercase files only)
│   │   │       ├── glass-card.tsx         # ✨ Primary card component
│   │   │       ├── button.tsx             # Button component
│   │   │       ├── card.tsx               # Standard card
│   │   │       ├── input.tsx              # Text input
│   │   │       ├── select.tsx             # Dropdown select  
│   │   │       ├── switch.tsx             # Toggle switch
│   │   │       ├── avatar.tsx             # User avatar
│   │   │       ├── badge-display.tsx      # Badge with icon
│   │   │       ├── dialog.tsx             # Modal dialog
│   │   │       ├── progress.tsx           # Progress bar
│   │   │       ├── tabs.tsx               # Tab navigation
│   │   │       ├── asset-card.tsx         # Asset display card
│   │   │       ├── proposal-card.tsx      # Governance proposal card
│   │   │       ├── stat-card.tsx          # Statistics card
│   │   │       ├── post-card.tsx          # Social post card
│   │   │       └── index.ts               # Barrel exports
│   │   ├── hooks/                         # Custom React hooks
│   │   │   ├── useBlockchain.ts           # Blockchain connection
│   │   │   └── useWallet.ts               # Wallet management
│   │   ├── lib/                           # Utilities
│   │   │   ├── utils.ts                   # General utilities
│   │   │   └── format.ts                  # Formatting functions
│   │   └── styles/                        # Global styles
│   │       ├── globals.css                # Global CSS
│   │       └── tailwind.css               # Tailwind base
│   ├── package.json                       # Package configuration
│   ├── tsconfig.json                      # TypeScript config
│   └── README.md                          # Component library docs
│
├── 📁 maya-wallet/                         # Port 3001 - Citizen wallet
│   ├── public/                            # Static assets
│   │   ├── favicon.ico
│   │   └── maya-logo.png
│   ├── src/
│   │   ├── app/                           # Next.js 14 App Router
│   │   │   ├── page.tsx                   # Dashboard (/)
│   │   │   ├── identity/                  # BelizeID (/identity)
│   │   │   ├── staking/                   # PoUW staking (/staking)
│   │   │   ├── governance/                # Proposal voting (/governance)
│   │   │   ├── nawal/                     # Federated learning (/nawal)
│   │   │   ├── kinich/                    # Quantum computing (/kinich)
│   │   │   ├── pakit/                     # Decentralized storage (/pakit)
│   │   │   ├── gem/                       # Smart contracts (/gem)
│   │   │   ├── analytics/                 # Personal analytics (/analytics)
│   │   │   ├── activity/                  # Transaction history (/activity)
│   │   │   ├── about/                     # Wallet info (/about)
│   │   │   ├── help/                      # Documentation (/help)
│   │   │   ├── globals.css                # Global styles
│   │   │   ├── layout.tsx                 # Root layout
│   │   │   └── providers.tsx              # Context providers
│   │   ├── components/                    # Wallet-specific components
│   │   │   ├── Header.tsx                 # Top navigation
│   │   │   ├── Sidebar.tsx                # Side navigation
│   │   │   ├── BottomNav.tsx              # Mobile bottom nav
│   │   │   └── WalletCard.tsx             # Balance card
│   │   ├── lib/                           # Utilities and hooks
│   │   │   ├── blockchain/                # Blockchain integration
│   │   │   │   ├── hooks.ts               # Custom blockchain hooks
│   │   │   │   └── polkadot.ts            # Polkadot.js setup
│   │   │   └── store/                     # State management
│   │   │       └── wallet-store.ts        # Zustand wallet store
│   │   └── types/                         # TypeScript definitions
│   │       └── index.ts                   # Type exports
│   ├── .env.local                         # Environment variables
│   ├── next.config.js                     # Next.js configuration
│   ├── package.json                       # Dependencies
│   ├── tailwind.config.js                 # Tailwind config
│   ├── tsconfig.json                      # TypeScript config
│   └── README.md                          # Wallet documentation
│
├── 📁 blue-hole-portal/                    # Port 3002 - Government dashboard
│   ├── public/                            # Static assets
│   │   ├── favicon.ico
│   │   └── bluehole-logo.png
│   ├── src/
│   │   ├── app/                           # Next.js 14 App Router
│   │   │   ├── page.tsx                   # Dashboard (/)
│   │   │   ├── governance/
│   │   │   │   ├── proposals/             # Proposals list/detail/new
│   │   │   │   │   ├── page.tsx           # List view
│   │   │   │   │   ├── new/               # Create proposal
│   │   │   │   │   └── [id]/              # Proposal detail
│   │   │   ├── treasury/                  # Multi-sig treasury
│   │   │   │   ├── page.tsx               # Treasury overview
│   │   │   │   └── spend/                 # Spend proposals
│   │   │   ├── validators/                # Validator management
│   │   │   │   ├── page.tsx               # Validator list
│   │   │   │   ├── [address]/             # Validator details
│   │   │   │   └── nominate/              # Nominate validator
│   │   │   ├── compliance/                # KYC/AML oversight
│   │   │   ├── analytics/                 # Network analytics
│   │   │   ├── reports/                   # Governance reports
│   │   │   ├── profile/                   # Admin profile
│   │   │   ├── settings/                  # System settings
│   │   │   ├── developer/                 # API documentation
│   │   │   ├── explorer/                  # Blockchain explorer
│   │   │   ├── globals.css                # Global styles
│   │   │   ├── layout.tsx                 # Root layout
│   │   │   └── providers.tsx              # Context providers
│   │   ├── components/                    # Portal-specific components
│   │   │   ├── Header.tsx                 # Top navigation
│   │   │   ├── Sidebar.tsx                # Side navigation
│   │   │   ├── ErrorBoundary.tsx          # Error handler (220 lines)
│   │   │   ├── LoadingStates.tsx          # Loading skeletons (350 lines)
│   │   │   ├── SearchFilter.tsx           # Advanced search (350 lines)
│   │   │   ├── Pagination.tsx             # Pagination + virtual scroll (400 lines)
│   │   │   ├── TransactionToasts.tsx      # Transaction notifications (200 lines)
│   │   │   └── ui/
│   │   │       └── glass-card.tsx         # Portal glass card variant
│   │   ├── lib/                           # Utilities and hooks
│   │   │   ├── blockchain/                # Blockchain integration
│   │   │   │   ├── hooks.ts               # 5 custom hooks (Economy, Staking, Governance, Compliance, System)
│   │   │   │   ├── optimistic-hooks.ts    # 2 optimistic UI hooks (Voting, Approvals)
│   │   │   │   └── polkadot.ts            # Polkadot.js setup
│   │   │   ├── react-query-provider.tsx   # React Query config (staleTime: 30s, gcTime: 5min)
│   │   │   └── utils.ts                   # Utilities
│   │   └── types/                         # TypeScript definitions
│   │       └── index.ts                   # Type exports
│   ├── .env.local                         # Environment variables
│   ├── next.config.js                     # Next.js configuration
│   ├── package.json                       # Dependencies
│   ├── tailwind.config.js                 # Tailwind config (shimmer + slide-in-right animations)
│   ├── tsconfig.json                      # TypeScript config
│   └── README.md                          # Portal documentation
│
├── 📁 docs/                                # Documentation
│   └── archive/                           # Old documentation
│       ├── BLUE_HOLE_REQUIREMENTS.md
│       ├── BLUE_HOLE_COMPETITIVE_ANALYSIS.md
│       ├── BLUE_HOLE_ROADMAP.md
│       ├── BLUE_HOLE_MIGRATION.md
│       ├── BLUE_HOLE_PHASE1_PROGRESS.md
│       └── MODERNIZATION_SUMMARY.md
│
├── 📁 node_modules/                        # Shared dependencies
├── .github-instructions.md                 # GitHub Copilot instructions
├── .gitignore                             # Git ignore rules
├── package.json                           # Root workspace config
├── package-lock.json                      # Dependency lock file
├── turbo.json                             # Turbo build config
├── README.md                              # Original README
└── README_PRODUCTION.md                   # 🆕 Production documentation

```

## 📊 File Count Summary

| Category | Count | Description |
|----------|-------|-------------|
| **Shared Components** | 15 | Reusable UI components |
| **Maya Wallet Pages** | 12 | Next.js 14 routes |
| **Blue Hole Pages** | 18 | Next.js 14 routes |
| **Custom Hooks** | 7 | Blockchain integration hooks |
| **Utility Functions** | 10+ | Formatting, validation, etc. |
| **Total TypeScript Files** | 100+ | Across all workspaces |

## 🎯 Key Files

### Critical Configuration Files
```
├── ui/package.json              # Monorepo workspaces
├── ui/turbo.json                # Build orchestration
├── shared/package.json          # Component library deps
├── maya-wallet/package.json     # Wallet deps
├── blue-hole-portal/package.json # Portal deps
├── */tsconfig.json              # TypeScript configs
└── */tailwind.config.js         # Tailwind configs
```

### Important Documentation
```
├── README_PRODUCTION.md         # Production guide (NEW!)
├── shared/README.md             # Component library docs (NEW!)
├── maya-wallet/README.md        # Wallet user guide
├── blue-hole-portal/README.md   # Portal admin guide
└── docs/archive/                # Historical documentation
```

## 🔧 Naming Conventions

### Files
- ✅ **Components:** `PascalCase.tsx` (e.g., `GlassCard.tsx`)
- ✅ **Shared UI:** `kebab-case.tsx` (e.g., `glass-card.tsx`)
- ✅ **Hooks:** `camelCase.ts` (e.g., `useBlockchain.ts`)
- ✅ **Utils:** `kebab-case.ts` (e.g., `format-currency.ts`)
- ✅ **Pages:** Next.js convention (`page.tsx`, `layout.tsx`)

### Imports
```typescript
// ✅ Correct - Named exports from shared
import { GlassCard, Button } from '@belizechain/shared';

// ❌ Incorrect - Default imports
import GlassCard from '@belizechain/shared';
```

## 🗂️ Component Organization

### Shared Library Hierarchy
```
shared/src/components/ui/
├── Layout Components
│   ├── glass-card.tsx        # Primary card (11 variants)
│   └── card.tsx              # Standard card
│
├── Form Components
│   ├── button.tsx            # Action buttons
│   ├── input.tsx             # Text inputs
│   ├── select.tsx            # Dropdowns
│   └── switch.tsx            # Toggles
│
├── Display Components
│   ├── avatar.tsx            # User avatars
│   ├── badge-display.tsx     # Status badges
│   ├── dialog.tsx            # Modals
│   ├── progress.tsx          # Progress indicators
│   └── tabs.tsx              # Tab navigation
│
└── Specialized Components
    ├── asset-card.tsx        # Cryptocurrency display
    ├── proposal-card.tsx     # Governance proposals
    ├── stat-card.tsx         # Statistics
    └── post-card.tsx         # Social posts
```

## 📦 Package Dependencies

### Shared Dependencies (All Apps)
```json
{
  "@polkadot/api": "^10.11.2",
  "next": "14.2.33",
  "react": "^18.3.1",
  "tailwindcss": "^3.4.1",
  "typescript": "^5.4.5"
}
```

### Maya Wallet Specific
```json
{
  "zustand": "^4.5.0",
  "phosphor-react": "^2.0.0",
  "recharts": "^2.10.3"
}
```

### Blue Hole Portal Specific
```json
{
  "@tanstack/react-query": "^5+",
  "recharts": "^2.10.3",
  "phosphor-react": "^2.0.0"
}
```

## 🎨 Theming Strategy

### Maya Wallet Theme
- **Primary:** Caribbean blue (#00B4D8)
- **Accent:** Jungle green (#38A169)
- **Background:** White/Sand gradients
- **Style:** Light, vibrant, accessible

### Blue Hole Portal Theme
- **Primary:** Deep blue (#0077B6)
- **Accent:** Blue (#3B82F6)
- **Background:** Dark gray gradients (gray-900 to gray-800)
- **Style:** Dark, professional, data-focused

### Shared Components
- Adapt to parent theme via variant props
- Support both light and dark modes
- Consistent spacing and typography

## 🚀 Build Outputs

### Production Bundles
```
maya-wallet/.next/
├── static/chunks/           # 124 kB total
└── server/                  # Server components

blue-hole-portal/.next/
├── static/chunks/           # 87.7 kB total (optimized!)
└── server/                  # Server components
```

## 📝 Environment Variables

### Maya Wallet (.env.local)
```bash
NEXT_PUBLIC_CHAIN_WS=ws://localhost:9944
NEXT_PUBLIC_CHAIN_HTTP=http://localhost:9933
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
NEXT_PUBLIC_ARWEAVE_GATEWAY=https://arweave.net/
```

### Blue Hole Portal (.env.local)
```bash
NEXT_PUBLIC_CHAIN_WS=ws://localhost:9944
NEXT_PUBLIC_CHAIN_HTTP=http://localhost:9933
NEXT_PUBLIC_ADMIN_API=http://localhost:8080
```

## 🧹 Cleanup Summary

### Removed Files
- ❌ Uppercase duplicate components (Badge.tsx, Button.tsx, etc.)
- ❌ nft-marketplace/ directory (unused)
- ❌ Non-existent workspace references (winik, pek, gubida, kijka)

### Archived Files
- 📦 BLUE_HOLE_*.md → docs/archive/
- 📦 MODERNIZATION_SUMMARY.md → docs/archive/

### New Files
- ✨ README_PRODUCTION.md - Production deployment guide
- ✨ shared/README.md - Component library documentation
- ✨ PROJECT_STRUCTURE.md - This file!

---

**Updated:** January 25, 2026  
**Status:** Production-Ready ✅  
**Maintainer:** BelizeChain Development Team
