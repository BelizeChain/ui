# @belizechain/shared - Component Library

Shared UI component library for BelizeChain applications (Maya Wallet & Blue Hole Portal).

## 📦 Installation

This package is part of the BelizeChain UI monorepo and is automatically linked via npm workspaces.

```json
{
  "dependencies": {
    "@belizechain/shared": "*"
  }
}
```

## 🎨 Available Components

### Core UI Components
- `GlassCard` - Glassmorphic cards (11 variants, 4 blur levels)
- `Button` - Action buttons with variants
- `Card` - Standard card layouts
- `Input` - Text input fields
- `Select` - Dropdown selects
- `Switch` - Toggle switches
- `Avatar` - User avatars
- `Badge` - Status badges
- `Dialog` - Modal dialogs
- `Progress` - Progress indicators
- `Tabs` - Tab navigation

### Specialized Components
- `AssetCard` - Cryptocurrency display
- `ProposalCard` - Governance proposals
- `StatCard` - Statistics display
- `PostCard` - Social media posts
- `BadgeDisplay` - Badge with icon

## 🎣 Custom Hooks
- `useBlockchain()` - Blockchain connection
- `useWallet()` - Wallet management

## 🛠️ Utilities
- `formatDALLA()` - Format DALLA amounts
- `formatBBZD()` - Format bBZD amounts
- `truncateAddress()` - Shorten addresses
- `formatRelativeTime()` - Relative timestamps
- `cn()` - Conditional class names

## 📚 Full Documentation

See [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) for complete API reference and usage examples.

## 🚀 Quick Start

```typescript
import { GlassCard, Button } from '@belizechain/shared';

function MyComponent() {
  return (
    <GlassCard variant="dark-medium" blur="lg" className="p-6">
      <h2>Welcome</h2>
      <Button variant="primary">Get Started</Button>
    </GlassCard>
  );
}
```

---

**Version:** 2.0.0  
**License:** MIT
