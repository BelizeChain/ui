# Blue Hole Portal - Modernization Migration Guide

## 🎯 Objective

Update Blue Hole Portal (Government Dashboard) to match the modern dark theme design system from Maya Wallet.

## 📊 Current Status

- **Theme**: Old light theme with Belize cultural colors (caribbean, maya, bluehole)
- **Components**: Using deprecated Card component from shared library
- **Last Updated**: Several months ago (pre-modern design system)
- **Priority**: HIGH - Government officials need consistent, professional interface

## 🔄 Migration Steps

### Phase 1: Update Dependencies (15 minutes)

1. **Update package.json**
   ```bash
   cd ui/blue-hole-portal
   npm install @belizechain/shared@latest
   npm install @radix-ui/react-dialog@^1.0.5
   npm install @radix-ui/react-tabs@^1.0.4
   npm install @radix-ui/react-progress@^1.0.3
   ```

2. **Rebuild shared library** (if not done)
   ```bash
   cd ui/shared && npm run build
   ```

### Phase 2: Component Migration (2-3 hours)

#### Update All Pages to Dark Theme

**BEFORE (Old Pattern):**
```tsx
<div className="min-h-screen bg-sand-50">
  <div className="bg-gradient-to-br from-caribbean-500 to-caribbean-700 px-4 pt-6 pb-24">
    <h1 className="text-white">Dashboard</h1>
  </div>
  
  <Card className="bg-white shadow-md p-6">
    <h2 className="text-bluehole-900">Stats</h2>
  </Card>
</div>
```

**AFTER (New Pattern):**
```tsx
import { GlassCard } from '@belizechain/shared';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChartBar } from 'phosphor-react';

<div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
  {/* Sticky Header */}
  <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
    <div className="flex items-center gap-3">
      <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
        <ArrowLeft size={24} className="text-gray-300" weight="bold" />
      </button>
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-xs text-gray-400">Government Overview</p>
      </div>
    </div>
  </div>
  
  {/* Content */}
  <div className="p-4 space-y-6">
    <GlassCard variant="dark-medium" blur="lg" className="p-6">
      <h2 className="text-white text-lg font-semibold mb-4">Stats</h2>
      {/* Content */}
    </GlassCard>
  </div>
</div>
```

#### Replace All Card Components

Use find & replace across the project:

```bash
# Find all Card imports
grep -r "import.*Card.*from '@belizechain/shared'" blue-hole-portal/src

# Update to GlassCard
# OLD: import { Card } from '@belizechain/shared';
# NEW: import { GlassCard } from '@belizechain/shared';
```

#### Update Color Classes

**Color Mapping:**
| Old Color | New Color | Usage |
|-----------|-----------|-------|
| `caribbean-500/600/700` | `emerald-500/600/700` | Primary actions |
| `bluehole-900` | `white` | Text on dark bg |
| `bluehole-600` | `gray-300` | Secondary text |
| `sand-50/100` | `gray-900/800` | Backgrounds |
| `maya-500/600` | `purple-500/600` | Accent (if needed) |

**Find & Replace:**
```bash
# Background colors
text-bluehole-900 → text-white
text-bluehole-600 → text-gray-300
text-bluehole-500 → text-gray-400
bg-sand-50 → bg-gray-900
bg-caribbean-500 → bg-emerald-500
bg-maya-600 → bg-purple-600

# Borders
border-sand-200 → border-gray-700/30
border-caribbean-300 → border-emerald-500/50
```

### Phase 3: Icon Updates (30 minutes)

Update all icon weights to modern standard:

```tsx
// OLD
<ChartBar size={24} weight="fill" />

// NEW
<ChartBar size={24} weight="duotone" />
```

### Phase 4: Component Checklist

For each page in Blue Hole Portal, ensure:

- [ ] **Dashboard** - Treasury overview with spending analytics
  - [ ] Dark gradient background
  - [ ] Sticky header with back button
  - [ ] GlassCard for stats
  - [ ] Updated icon weights to duotone

- [ ] **Treasury** - Government fund management
  - [ ] Multi-sig transaction cards
  - [ ] Spending charts with dark theme
  - [ ] Approval workflow UI

- [ ] **Analytics** - National metrics dashboard
  - [ ] Dark themed charts
  - [ ] GlassCard containers
  - [ ] Real-time data displays

- [ ] **Compliance** - FSC oversight dashboard
  - [ ] KYC verification interface
  - [ ] Audit trail displays
  - [ ] Alert banners with red-900/20 backgrounds

- [ ] **Validators** - Node operator management
  - [ ] Validator list with stat cards
  - [ ] Performance metrics
  - [ ] Slash/reward displays

- [ ] **Reports** - Government reporting
  - [ ] Export functionality
  - [ ] Data visualizations
  - [ ] Print-friendly layouts

## 🎨 Blue Hole Portal Specific Components

### GovernmentStatCard
```tsx
import { GlassCard } from '@belizechain/shared';
import { Vault } from 'phosphor-react';

<GlassCard variant="dark-medium" blur="lg" className="p-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-gray-400 text-sm">Treasury Balance</p>
      <p className="text-white text-2xl font-bold">1,250,000 DALLA</p>
      <p className="text-emerald-400 text-sm">+12.5% this month</p>
    </div>
    <Vault size={48} className="text-emerald-400" weight="duotone" />
  </div>
</GlassCard>
```

### SpendingChart
```tsx
// Use dark-themed chart library (recharts with dark config)
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<GlassCard variant="dark-medium" blur="lg" className="p-6">
  <h3 className="text-white text-lg font-semibold mb-4">Monthly Spending</h3>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="month" stroke="#9CA3AF" />
      <YAxis stroke="#9CA3AF" />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: '#1F2937', 
          border: '1px solid #374151',
          borderRadius: '0.5rem',
          color: '#fff'
        }} 
      />
      <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} />
    </LineChart>
  </ResponsiveContainer>
</GlassCard>
```

### MultiSigApprovalCard
```tsx
import { GlassCard } from '@belizechain/shared';
import { Users, Check, X } from 'phosphor-react';

<GlassCard variant="dark-medium" blur="lg" className="p-4">
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center">
      <Users size={20} className="text-emerald-400" weight="duotone" />
    </div>
    <div className="flex-1">
      <h4 className="text-white font-semibold">Treasury Transfer</h4>
      <p className="text-gray-400 text-sm">50,000 DALLA to Infrastructure Fund</p>
      <div className="flex gap-2 mt-3">
        <div className="flex items-center gap-1 text-emerald-400 text-sm">
          <Check size={16} weight="bold" />
          <span>4 approved</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <span>3 pending</span>
        </div>
      </div>
    </div>
    <div className="flex gap-2">
      <button className="p-2 bg-emerald-900/30 hover:bg-emerald-900/50 rounded-lg transition-colors">
        <Check size={20} className="text-emerald-400" weight="bold" />
      </button>
      <button className="p-2 bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-colors">
        <X size={20} className="text-red-400" weight="bold" />
      </button>
    </div>
  </div>
</GlassCard>
```

## 📋 Testing Checklist

After migration, verify:

- [ ] All pages load without errors
- [ ] Dark theme applied consistently
- [ ] Icons use duotone weight
- [ ] Charts/graphs use dark color scheme
- [ ] Multi-sig workflows function correctly
- [ ] Reports export properly
- [ ] Mobile responsive on all screens
- [ ] No console errors
- [ ] TypeScript compilation successful
- [ ] Accessibility (keyboard navigation, screen readers)

## 🚀 Deployment Steps

1. **Test locally**
   ```bash
   cd blue-hole-portal
   npm run dev
   ```

2. **Build production**
   ```bash
   npm run build
   ```

3. **Type check**
   ```bash
   npm run type-check
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

## 📝 Estimated Timeline

- **Phase 1 (Dependencies)**: 15 minutes
- **Phase 2 (Components)**: 2-3 hours
- **Phase 3 (Icons)**: 30 minutes
- **Testing**: 1 hour
- **TOTAL**: ~4-5 hours

## 🔗 References

- **Design System**: `/ui/.github-instructions.md`
- **Shared Library**: `/ui/shared/README.md`
- **Maya Wallet (Reference)**: `/ui/maya-wallet/src/app/`
- **GlassCard Component**: `/ui/shared/src/components/ui/glass-card.tsx`

---

**Migration Priority**: HIGH  
**Status**: PENDING  
**Next Action**: Begin Phase 1 dependency updates
