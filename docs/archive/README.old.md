# @belizechain/shared

Modern shared component library for all BelizeChain UIs, featuring glass morphism design system from Maya Wallet.

## 🎨 Design System

The shared library now uses the modern dark theme glass morphism design from Maya Wallet:

### GlassCard Component

The primary UI component with multiple variants:

```tsx
import { GlassCard } from '@belizechain/shared';

<GlassCard variant="dark-medium" blur="lg" className="p-6">
  <h2>Your Content</h2>
</GlassCard>
```

**Variants:**
- `dark-light` - Subtle dark glass (bg-gray-800/40)
- `dark-medium` - Standard dark glass (bg-gray-800/70) **[DEFAULT for pages]**
- `dark` - Strong dark glass (bg-gray-800/60)
- `light` - Light glass (bg-white/60)
- `medium` - Medium light glass (bg-white/80)
- `heavy` - Heavy light glass (bg-white/95)
- `gradient` - Emerald-to-teal gradient
- `forest` - Emerald dark theme
- `amber` - Amber dark theme
- `blue` - Blue dark theme
- `purple` - Purple dark theme

**Blur Levels:** `sm` | `md` | `lg` | `xl` (default: `xl`)

### Modern UI Components

All components follow the dark theme aesthetic:

#### AssetCard
```tsx
import { AssetCard } from '@belizechain/shared';

<AssetCard
  name="DALLA"
  symbol="DALLA"
  balance="1,250.00"
  value="$1,250.00"
  change="+5.2%"
  icon={<Coins size={32} />}
  variant="emerald"
/>
```

#### StatCard
```tsx
import { StatCard } from '@belizechain/shared';

<StatCard
  title="Total Balance"
  value="1,250.00 DALLA"
  change="+12.5%"
  icon={<Wallet size={24} />}
/>
```

#### PostCard (Community Features)
```tsx
import { PostCard } from '@belizechain/shared';

<PostCard
  author="John Doe"
  authorAddress="5FHne..."
  content="Great project!"
  timestamp="2 hours ago"
  likes={42}
  comments={7}
/>
```

#### ProposalCard (Governance)
```tsx
import { ProposalCard } from '@belizechain/shared';

<ProposalCard
  id={1}
  title="Treasury Allocation Proposal"
  status="active"
  votesFor={1250}
  votesAgainst={320}
  endsIn="2 days"
/>
```

## 📦 Installation

```bash
npm install @belizechain/shared
# or
yarn add @belizechain/shared
```

## 🚀 Usage

### Import Components

```tsx
import { 
  GlassCard, 
  Button, 
  AssetCard,
  StatCard,
  useWallet,
  useBalance 
} from '@belizechain/shared';
```

### Radix UI Components

Modern accessible components from Radix UI:

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@belizechain/shared';
import { Progress } from '@belizechain/shared';
import { Dialog, DialogContent, DialogHeader } from '@belizechain/shared';
```

## 🎨 Color Palette

The library uses a dark-first color palette:

- **Primary:** Emerald (`emerald-500`, `emerald-400`)
- **Backgrounds:** Gray-900 → Gray-800 gradients
- **Glass:** Gray-800 with opacity (30%, 50%, 70%)
- **Borders:** Gray-700 with 30-50% opacity
- **Text:** White, Gray-300, Gray-400
- **Accents:** Orange, Purple, Blue, Red, Slate

## 🔧 API Clients

Pre-configured clients for BelizeChain services:

```tsx
import { 
  getKinichClient,
  getNawalClient,
  getPakitClient 
} from '@belizechain/shared';

// Quantum computing
const kinich = getKinichClient();
const result = await kinich.submitJob({ circuit, shots: 1024 });

// Federated learning
const nawal = getNawalClient();
await nawal.submitTrainingData(data);

// Decentralized storage
const pakit = getPakitClient();
const { cid } = await pakit.upload(file);
```

## 🪝 React Hooks

```tsx
import { useWallet, useBalance } from '@belizechain/shared';

function MyComponent() {
  const { selectedAccount, connect, disconnect } = useWallet();
  const { balance, isLoading } = useBalance(selectedAccount?.address);
  
  return <div>Balance: {balance?.free}</div>;
}
```

## 🌐 Internationalization

```tsx
import { useI18n } from '@belizechain/shared';

function MyComponent() {
  const { t, currentLocale, setLocale } = useI18n();
  
  return <h1>{t.wallet.welcome}</h1>;
}
```

## 📝 Migration from Old Components

### Old Card → New GlassCard

```tsx
// ❌ OLD (Light theme Card)
<Card className="bg-white shadow-md">
  <h2 className="text-bluehole-900">Title</h2>
</Card>

// ✅ NEW (Dark theme GlassCard)
<GlassCard variant="dark-medium" blur="lg" className="p-6">
  <h2 className="text-white">Title</h2>
</GlassCard>
```

### Old Colors → New Dark Palette

```tsx
// ❌ OLD (Belize cultural colors)
className="bg-caribbean-500 text-white"
className="text-bluehole-900"
className="bg-maya-600"

// ✅ NEW (Modern dark theme)
className="bg-emerald-500 text-white"
className="text-white"
className="bg-gray-800/70"
```

## 🏗️ Project Structure

```
shared/
├── src/
│   ├── components/
│   │   ├── ui/              # Modern UI components
│   │   │   ├── glass-card.tsx
│   │   │   ├── button.tsx
│   │   │   ├── asset-card.tsx
│   │   │   ├── stat-card.tsx
│   │   │   ├── post-card.tsx
│   │   │   ├── proposal-card.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── avatar.tsx
│   │   │   └── index.ts
│   │   ├── WalletConnect.tsx
│   │   └── LanguageSwitcher.tsx
│   ├── hooks/              # React hooks
│   ├── api/                # API clients
│   ├── lib/                # Utilities (cn, etc.)
│   ├── i18n/               # Translations
│   ├── styles/             # Global styles
│   └── types/              # TypeScript types
└── package.json
```

## 🔄 Version

Current version: **1.0.0** (Modern Dark Theme - January 2026)

## 📄 License

Part of the BelizeChain sovereign infrastructure project.


This package contains all shared components, styles, hooks, utilities, and blockchain integrations used across the BelizeChain UI suite.

## 📦 What's Inside

### Components
- **UI Components**: Button, Card, Input, Badge, Modal, Toast
- **Blockchain Components**: AccountSelector, BalanceDisplay, TransactionButton
- **Layout Components**: Header, Footer, Sidebar

### Styles
- **Belizean Design System**: Complete color palette, typography, spacing
- **Tailwind Configuration**: Pre-configured with Belizean theme
- **Component Styles**: Reusable style utilities

### Hooks
- **useBlockchain**: Connect to BelizeChain
- **useAccount**: Manage user accounts
- **useBalance**: Track balances
- **useTransaction**: Submit transactions

### Utils
- **Formatting**: Currency, dates, addresses
- **Validation**: Form validation
- **Blockchain**: Address validation, transaction helpers

### Types
- Complete TypeScript definitions for all BelizeChain entities

## 🎨 Belizean Color Palette

```typescript
{
  caribbean: '#0066CC',  // Primary (Caribbean blue)
  jungle: '#00A86B',     // Secondary (Jungle green)
  maya: '#FFD700',       // Accent (Maya gold)
  bluehole: '#003366',   // Dark (Blue Hole deep)
  sand: '#F5F5F5',       // Light (White sand)
}
```

## 🚀 Usage

### In Your App

```bash
npm install @belizechain/shared
```

```typescript
import { Button, Card, useAccount } from '@belizechain/shared';

function MyComponent() {
  const { account, connect } = useAccount();

  return (
    <Card>
      <Button onClick={connect}>
        Connect Wallet
      </Button>
    </Card>
  );
}
```

## 🛠️ Development

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run dev
```

### Type Check
```bash
npm run type-check
```

## 📝 License

Copyright © 2025 Government of Belize
