# BelizeChain UI - Sovereign Digital Interface Suite

**Modern Dark Theme Glass Morphism Design System**

## 🎯 Project Status (January 2026)

### ✅ Complete - Maya Wallet (Reference Implementation)
**Status**: Production-ready with modern dark theme  
**For**: Everyday Belizeans (citizens & businesses)  
**Design**: Glass morphism with dark gradients, emerald accents  
**Components**: 15+ pages, full feature set (wallet, staking, governance, community, analytics, etc.)

### ✅ Complete - Shared Component Library
**Status**: Modernized with all components from Maya Wallet  
**Includes**: GlassCard, AssetCard, StatCard, PostCard, ProposalCard, Radix UI primitives  
**Usage**: `@belizechain/shared` package for all UIs

### 🔄 Next Priority - Blue Hole Portal
**Status**: Needs modernization (currently old light theme)  
**For**: Government officials (treasury, compliance, validator oversight)  
**Action Required**: Full migration to dark theme (see `BLUE_HOLE_MIGRATION.md`)  
**Estimated Time**: 4-5 hours

### 📋 Future Apps
- **NFT Marketplace**: NFT trading platform (low priority)
- Additional government/validator interfaces as needed

---

## 🎨 Modern Design System

### Core Principles (2026 Update)

1. **Dark-First Design**
   - All interfaces use dark backgrounds (gray-900 → gray-800 gradients)
   - Better for extended use, professional appearance

2. **Glass Morphism**
   - Primary component: `GlassCard` with backdrop-blur
   - Creates depth and visual hierarchy
   - Multiple variants for different use cases

3. **Emerald Accent**
   - Primary color: `emerald-500` / `emerald-400`
   - Replaces old caribbean blue theme
   - Used for CTAs, active states, positive indicators

4. **Modern Typography**
   - Headings: `text-white` with `font-bold`
   - Descriptions: `text-gray-300` or `text-gray-400`
   - Icons: `phosphor-react` with `weight="duotone"`

### Color Palette

#### Backgrounds
```
Page:       bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900
Headers:    bg-gray-900/80 backdrop-blur-xl
Cards:      bg-gray-800/70 (via GlassCard)
Stats:      bg-gray-800/30 backdrop-blur-sm
```

#### Text
```
Primary:    text-white
Secondary:  text-gray-300
Muted:      text-gray-400
Disabled:   text-gray-500
```

#### Accents
```
Emerald:    #10B981 (primary, positive, success)
Orange:     #F97316 (warnings, land ledger)
Purple:     #A855F7 (quantum, premium features)
Blue:       #3B82F6 (links, bridges, info)
Red:        #EF4444 (errors, security alerts)
```

#### Borders
```
Standard:   border-gray-700/30
Medium:     border-gray-700/40
Strong:     border-gray-700/50
Active:     border-emerald-500
```

---

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Development

```bash
# All apps
npm run dev:all

# Individual apps
cd maya-wallet && npm run dev        # ✅ Modern dark theme
cd blue-hole-portal && npm run dev   # 🔄 Needs migration
cd nft-marketplace && npm run dev    # 📋 Future

# Shared library (for development)
cd shared && npm run dev
```

### Build Shared Library
```bash
cd shared
npm run build  # Compiles to dist/
```

### Build for Production
```bash
npm run build  # Builds all apps
```

---

## 📦 Project Structure

```
ui/
├── maya-wallet/              # ✅ Modern citizen/business wallet
│   ├── src/
│   │   ├── app/             # Next.js 14 pages (15+ routes)
│   │   ├── components/      # UI components
│   │   │   └── ui/          # Modern dark theme components
│   │   ├── contexts/        # React contexts
│   │   └── lib/             # Utilities
│   └── package.json
│
├── blue-hole-portal/         # 🔄 Government dashboard (needs update)
│   ├── src/
│   │   ├── pages/           # Treasury, compliance, validators
│   │   └── components/      # OLD components (light theme)
│   └── package.json
│
├── nft-marketplace/          # 📋 NFT trading (future)
│
├── shared/                   # ✅ Modern component library
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/          # GlassCard, AssetCard, StatCard, etc.
│   │   ├── hooks/           # useWallet, useBalance, useI18n
│   │   ├── api/             # Kinich, Nawal, Pakit clients
│   │   ├── lib/             # Utilities (cn, etc.)
│   │   └── i18n/            # Internationalization
│   ├── dist/                # Build output
│   └── package.json
│
├── .github-instructions.md   # UI development guide
├── BLUE_HOLE_MIGRATION.md   # Migration guide for Blue Hole
├── README.md                # This file
├── package.json             # Workspace config
└── turbo.json              # Turborepo config
```

---

## 🧩 Shared Component Library

### Installation
```bash
npm install @belizechain/shared
```

### Usage
```tsx
import { 
  GlassCard,          // Primary container component
  Button,             // Modern button with variants
  AssetCard,          // Token/asset display
  StatCard,           // Statistics display
  PostCard,           // Community posts
  ProposalCard,       // Governance proposals
  Tabs,               // Radix UI tabs
  Progress,           // Progress bars
  Dialog,             // Modal dialogs
  useWallet,          // Wallet connection hook
  useBalance,         // Balance fetching hook
  useI18n             // Internationalization hook
} from '@belizechain/shared';
```

### GlassCard Variants
```tsx
// Standard dark glass (most common)
<GlassCard variant="dark-medium" blur="lg" className="p-6">
  <h2 className="text-white">Content</h2>
</GlassCard>

// Accent backgrounds
<GlassCard variant="gradient" blur="lg">  {/* Emerald gradient */}
<GlassCard variant="forest" blur="lg">    {/* Dark emerald */}
<GlassCard variant="purple" blur="lg">    {/* Dark purple */}
<GlassCard variant="blue" blur="lg">      {/* Dark blue */}
```

### Complete Documentation
See `/ui/shared/README.md` for full component API and examples.

---

## 🎯 Development Guidelines

### 1. Use Shared Components
✅ **Always import from shared library**
```tsx
import { GlassCard, Button } from '@belizechain/shared';
```

❌ **Never create duplicate components**
```tsx
// Don't do this - use shared library instead
function MyCustomCard() { ... }
```

### 2. Follow Dark Theme Pattern
✅ **Standard page structure**
```tsx
<div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
  <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50">
    {/* Header */}
  </div>
  <div className="p-4 space-y-6">
    <GlassCard variant="dark-medium" blur="lg">
      {/* Content */}
    </GlassCard>
  </div>
</div>
```

### 3. Icon Guidelines
- **Library**: `phosphor-react`
- **Weight**: `duotone` (modern standard)
- **Size**: 24-32px for headers, 16-20px for inline

```tsx
import { Wallet, ChartLine } from 'phosphor-react';

<Wallet size={32} className="text-emerald-400" weight="duotone" />
```

### 4. Responsive Design
- **Mobile-first** approach
- Use Tailwind breakpoints: `md:`, `lg:`, `xl:`
- Test on all screen sizes

### 5. TypeScript
- All new code must use TypeScript
- No `any` types (use proper typing)
- Export types from shared library

---

## 📚 Key Resources

### Documentation
- **UI Guidelines**: `/.github-instructions.md` - Complete design system guide
- **Shared Library**: `/shared/README.md` - Component API reference
- **Migration Guide**: `/BLUE_HOLE_MIGRATION.md` - Blue Hole Portal update guide
- **Maya Wallet**: Reference implementation for all new UIs

### Examples
- **Modern Header**: `/maya-wallet/src/app/belizeid/page.tsx`
- **GlassCard Usage**: `/maya-wallet/src/app/community/page.tsx`
- **Tabs Pattern**: `/maya-wallet/src/app/landledger/page.tsx`
- **Asset Display**: `/maya-wallet/src/app/page.tsx` (HomeScreen)

### External Resources
- **Phosphor Icons**: https://phosphoricons.com
- **Radix UI**: https://www.radix-ui.com/docs/primitives
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Next.js 14**: https://nextjs.org/docs

---

## 🔧 Troubleshooting

### Build Errors

**"Cannot find module '@belizechain/shared'"**
```bash
cd ui/shared && npm run build
```

**TypeScript errors in shared library**
```bash
cd ui/shared && npm run type-check
```

**Stale node_modules**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Development Issues

**Hot reload not working**
```bash
# Restart dev server
npm run dev
```

**Port already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Component Issues

**GlassCard not styling correctly**
- Ensure shared library is built: `cd shared && npm run build`
- Check Tailwind config includes shared library paths
- Verify `className` prop is being applied

**Icons not showing**
- Install phosphor-react: `npm install phosphor-react`
- Check import: `import { IconName } from 'phosphor-react'`
- Verify size and weight props are set

---

## 📈 Performance

### Build Optimization
- **Turbo**: Monorepo task caching
- **Tree-shaking**: Shared library exports are tree-shakeable
- **Code splitting**: Next.js automatic code splitting
- **Image optimization**: Next.js Image component

### Bundle Size
- Maya Wallet: ~200KB gzipped (production)
- Shared Library: ~80KB gzipped
- Target: < 250KB total per page

---

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Build Validation
```bash
npm run build
```

---

## 🚀 Deployment

### Environment Variables
Create `.env.local` in each app:

```bash
# Blockchain RPC
NEXT_PUBLIC_WS_PROVIDER=ws://localhost:9944

# API Endpoints
NEXT_PUBLIC_KINICH_API=http://localhost:8001
NEXT_PUBLIC_NAWAL_API=http://localhost:8000
NEXT_PUBLIC_PAKIT_API=http://localhost:8002
```

### Production Build
```bash
# Build all apps
npm run build

# Build individual app
cd maya-wallet && npm run build
```

### Deployment Platforms
- **Vercel**: Recommended for Next.js apps
- **Azure Static Web Apps**: Alternative option
- **Self-hosted**: Docker containers available

---

## 📝 Changelog

### Version 1.0 (January 2026)
- ✅ **Maya Wallet**: Complete with modern dark theme
- ✅ **Shared Library**: Modernized with all Maya Wallet components
- ✅ **Design System**: Glass morphism with dark gradients
- ✅ **Documentation**: Complete guides and migration docs
- 🔄 **Blue Hole Portal**: Migration pending

### Version 0.9 (Previous)
- Old light theme with Belize cultural colors
- Separate component libraries per app
- Limited shared infrastructure

---

## 🤝 Contributing

### Code Style
- Follow existing patterns from Maya Wallet
- Use shared components from library
- Write TypeScript (no JavaScript)
- Include proper types and JSDoc comments

### Pull Requests
1. Create feature branch from `main`
2. Make changes following design system
3. Test locally
4. Submit PR with description
5. Pass CI checks

### Questions?
See `.github-instructions.md` for detailed guidelines.

---

## 📄 License

Part of the BelizeChain sovereign infrastructure project.

---

**Last Updated**: January 25, 2026  
**Design Version**: 1.0 (Modern Dark Theme)  
**Status**: Maya Wallet ✅ | Shared Library ✅ | Blue Hole Portal 🔄
- **Monospace**: JetBrains Mono (Code/addresses)

### Principles
1. **Progressive Disclosure** - Show only what's needed
2. **Mobile-First** - 80% of users on phones
3. **Offline-Capable** - Works without internet
4. **Multi-Language** - English, Spanish, Kriol
5. **Accessible** - WCAG 2.1 AA compliance

---

## 🛠️ Technology Stack

### Core
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Forms**: React Hook Form + Zod

### Blockchain
- **API**: Polkadot.js
- **Wallet**: SubWallet, Talisman compatibility

### UI Components
- **Icons**: Phosphor Icons
- **Charts**: Recharts
- **Tables**: TanStack Table
- **Animations**: Framer Motion

### Integration
- **Blockchain**: BelizeChain Substrate node
- **Storage**: Pakit API
- **AI**: Nawal federated learning
- **Quantum**: Kinich computing

---

## 📱 Cultural Significance

This UI suite represents **ALL major Belizean cultures**:

- 🏛️ **Maya Heritage** (3 apps) - Ancient civilization and wisdom
- 🥁 **Garifuna Heritage** (1 app) - Afro-Indigenous culture
- 🌾 **Mennonite Heritage** (1 app) - Agricultural community
- 🇧🇿 **Natural Belize** (1 app) - Iconic Blue Hole

**One Nation, Many Cultures, One Blockchain** 🇧🇿

---

## 🎯 Development Roadmap

### Phase 1: Foundation (Week 1-2) ✅
- Set up monorepo structure
- Create shared component library
- Design system implementation
- Polkadot.js integration

### Phase 2: Maya Wallet (Week 3-4) - **PRIORITY**
- Home screen with balance
- Send/receive flows
- Document viewer
- Government services
- Tourism rewards
- PWA setup

### Phase 3: Blue Hole Portal (Week 5-6)
- Dashboard overview
- Treasury management
- Governance UI
- Pakit storage dashboard
- Kinich quantum interface
- Nawal AI monitoring

### Phase 4: Kijka Explorer (Week 7)
- Block/transaction viewer
- Account lookup
- Search functionality
- Real-time updates

### Phase 5: Winik, Pek, Gúbida (Week 8-10)
- District governance portal
- Business payment processing
- Validator dashboard

### Phase 6: Polish & Launch (Week 11-12)
- Performance optimization
- Security audit
- User testing
- Documentation
- Production deployment

---

## 🔐 Security

- Biometric authentication (Maya Wallet)
- Multi-signature support (Blue Hole Portal)
- Hardware wallet integration
- Rate limiting
- HTTPS everywhere
- CSP headers

---

## 🌍 Accessibility

- WCAG 2.1 Level AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode
- Multi-language support (English, Spanish, Kriol)

---

## 📞 Support

- **Email**: support@belizechain.org
- **Phone**: 1-800-BELIZE
- **Discord**: discord.gg/belizechain
- **Documentation**: docs.belizechain.org

---

## 📄 License

Copyright © 2025 Government of Belize. All rights reserved.

---

**Built with ❤️ in Belize** 🇧🇿
