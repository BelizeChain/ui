# Maya Wallet Enhancement Services

This directory contains 9 new service modules that enhance the Maya Wallet with advanced UX features.

## 📁 Service Files

### 1. **contacts.ts** (186 lines)
**Purpose**: Contact book management for frequent recipients

**Key Features**:
- CRUD operations for contacts (add, update, delete)
- Contact categories: family, friend, business, other
- Favorite contacts flag
- Transaction tracking (count + last used timestamp)
- Search functionality (name, address, notes)
- Get frequent contacts (sorted by transaction count)
- Import/Export for backup/restore

**Storage**: localStorage key `maya-contacts`

**Usage Example**:
```typescript
import { addContact, getFrequentContacts } from './services/contacts';

const contact = addContact({
  name: 'Maria Garcia',
  address: '5GrwvaEF...',
  category: 'family',
  favorite: true,
  notes: 'Sister - rent money'
});

const frequent = getFrequentContacts(10); // Top 10 most used
```

---

### 2. **notifications.ts** (188 lines)
**Purpose**: Notification center for payments, documents, rewards, security alerts

**Key Features**:
- 6 notification types: payment, document, reward, security, system, message
- Read/unread tracking
- Browser notification integration (native OS notifications)
- Helper functions for each notification type
- Max 100 notifications (automatic trimming)
- Filter by type, get unread count

**Storage**: localStorage key `maya-notifications`

**Usage Example**:
```typescript
import { notifyPaymentReceived, getUnreadCount } from './services/notifications';

notifyPaymentReceived('50.00', 'DALLA', 'Maria Garcia');
const unreadCount = getUnreadCount(); // For badge display
```

---

### 3. **recurring.ts** (234 lines)
**Purpose**: Recurring payment scheduler for rent, utilities, subscriptions

**Key Features**:
- 5 frequencies: daily, weekly, biweekly, monthly, yearly
- 6 categories: rent, utilities, subscription, loan, savings, other
- Active/inactive toggle
- Start date, end date, next payment date tracking
- Payment execution recording (success/failure tracking)
- Get payments due today/within 7 days
- Monthly commitment calculator (converts all frequencies to monthly)

**Storage**: localStorage key `maya-recurring-payments`

**Usage Example**:
```typescript
import { addRecurringPayment, getPaymentsDueToday } from './services/recurring';

const rentPayment = addRecurringPayment({
  name: 'Monthly Rent',
  recipientAddress: '5GrwvaEF...',
  amount: 1200,
  currency: 'bBZD',
  frequency: 'monthly',
  startDate: new Date(),
  active: true,
  category: 'rent'
});

const dueToday = getPaymentsDueToday();
```

---

### 4. **budgeting.ts** (346 lines)
**Purpose**: Budget tracking with categories, limits, and alerts

**Key Features**:
- 5 default categories: Groceries, Utilities, Transportation, Entertainment, Healthcare
- Monthly spending limits per category
- Alert thresholds (e.g., warn at 80%, alert at 100%)
- Automatic budget alerts (warning + exceeded)
- Monthly budget history (keeps last 12 months)
- Reset monthly budgets at start of new month
- Total limits and total spent calculations

**Storage**: 
- Categories: `maya-budget-categories`
- Alerts: `maya-budget-alerts`
- History: `maya-budget-history`

**Usage Example**:
```typescript
import { addBudgetCategory, recordSpending, getBudgetAlerts } from './services/budgeting';

const category = addBudgetCategory({
  name: 'Dining Out',
  color: '#ec4899',
  monthlyLimit: 300,
  currency: 'DALLA',
  alertThreshold: 75,
  active: true
});

recordSpending(category.id, 50); // Logs spending to category
const alerts = getBudgetAlerts(); // Check for threshold alerts
```

---

### 5. **currency.ts** (237 lines)
**Purpose**: Multi-currency calculator for DALLA/bBZD/USD/GBP

**Key Features**:
- Exchange rate management (oracle-based + cached fallback)
- 4 supported currencies: DALLA, bBZD, USD, GBP
- bBZD pegged to GBP (1:1)
- Currency conversion with history tracking
- Cross-rate calculation (e.g., DALLA → USD via bBZD)
- Format currency amounts (DALLA: 12 decimals, others: 2)
- Currency symbols (Ɗ for DALLA, $ for bBZD/USD, £ for GBP)

**Storage**: 
- Rates: `maya-exchange-rates`
- History: `maya-conversion-history`

**Default Rates**:
- DALLA/bBZD: 0.5 (1 DALLA = 0.5 bBZD)
- bBZD/GBP: 1.0 (pegged)
- DALLA/USD: 0.6 (1 DALLA ≈ 0.6 USD)

**Usage Example**:
```typescript
import { convertCurrency, formatCurrency } from './services/currency';

const result = convertCurrency(100, 'DALLA', 'bBZD');
console.log(formatCurrency(result.toAmount, 'bBZD')); // "50.00 bBZD"
```

---

### 6. **messaging.ts** (297 lines)
**Purpose**: P2P messaging system with payment integration

**Key Features**:
- Text messaging between wallet addresses
- 4 message types: text, payment-request, payment-confirmation, split-bill
- Conversation-based organization
- Unread message tracking
- Message encryption flag
- Pakit storage integration for backup/sync
- Payment request creation
- Split bill functionality
- Max 500 messages per conversation (auto-trim old)

**Storage**: localStorage key `maya-conversations`

**Usage Example**:
```typescript
import { sendMessage, sendPaymentRequest, sendSplitBillRequest } from './services/messaging';

// Send text message
await sendMessage('5GrwvaEF...', 'Maria', 'Hey, coffee tomorrow?', 'text');

// Request payment
await sendPaymentRequest('5GrwvaEF...', 'Maria', 25, 'DALLA', 'Lunch split');

// Split bill with multiple people
await sendSplitBillRequest(
  ['5GrwvaEF...', '5HpG9w8EF...'], 
  120, 
  'bBZD', 
  'Dinner at Blue Hole Restaurant'
);
```

---

### 7. **theme.tsx** (145 lines)
**Purpose**: Dark mode theme provider with React context

**Key Features**:
- React Context API for theme management
- `useTheme()` hook for components
- System preference detection (prefers-color-scheme: dark)
- localStorage persistence
- Automatic theme application to `<html>` element
- Theme toggle function
- Tailwind CSS dark mode integration (class strategy)

**Storage**: localStorage key `maya-theme`

**Tailwind Config**:
```javascript
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dalla: { light: '#fbbf24', dark: '#f59e0b' },
        bbzd: { light: '#10b981', dark: '#059669' },
      }
    }
  }
}
```

**Usage Example**:
```typescript
import { ThemeProvider, useTheme } from './services/theme';

// Wrap app with provider
<ThemeProvider>
  <App />
</ThemeProvider>

// Use in components
function Header() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

---

### 8. **qrcode.ts** (185 lines)
**Purpose**: QR code generation for payment requests

**Key Features**:
- Generate payment URI (belizechain: protocol)
- Parse scanned QR codes
- Support for amount, currency, message parameters
- Payment request flag
- Address validation (Substrate format)
- Shorten address for display
- Copy to clipboard utility
- Web Share API integration
- SVG generation placeholder (use `qrcode.react` in production)

**Usage Example**:
```typescript
import { generatePaymentURI, parsePaymentURI, copyAddressToClipboard } from './services/qrcode';

// Generate URI for QR code
const uri = generatePaymentURI({
  address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  amount: 100,
  currency: 'DALLA',
  message: 'Coffee payment'
});
// Result: "belizechain:5GrwvaEF...?amount=100&currency=DALLA&message=Coffee%20payment"

// Parse scanned QR
const data = parsePaymentURI(uri);

// Copy address to clipboard
await copyAddressToClipboard(address);
```

**Production QR Code Component**:
```typescript
import QRCode from 'qrcode.react';

<QRCode value={uri} size={256} level="H" includeMargin />
```

---

### 9. **notes.ts** (273 lines)
**Purpose**: Transaction notes/memos with categorization

**Key Features**:
- Add notes to transactions (max 500 characters)
- Category assignment (Groceries, Rent, etc.)
- Multi-tag support (personal, business, tax-deductible)
- Search notes by text/category/tag
- Auto-suggestions for categories and tags
- Import/Export functionality
- Note statistics (category counts, tag counts)
- Prepare note for transaction sending

**Storage**: localStorage key `maya-transaction-notes`

**Suggested Categories**: Groceries, Utilities, Rent, Transportation, Healthcare, Entertainment, Shopping, Dining, Savings, Investment, Transfer, Payment, Gift, Other

**Suggested Tags**: personal, business, family, emergency, recurring, one-time, reimbursement, tax-deductible

**Usage Example**:
```typescript
import { addTransactionNote, searchTransactionNotes, SUGGESTED_CATEGORIES } from './services/notes';

// Add note after transaction
addTransactionNote(
  '0x1234...', // tx hash
  'Monthly grocery shopping at Brodie\'s',
  'Groceries',
  ['personal', 'recurring']
);

// Search all notes
const results = searchTransactionNotes('grocery');

// Get statistics
const stats = getNoteStatistics();
// { totalNotes: 45, categorizedNotes: 42, taggedNotes: 38, ... }
```

---

## 🎯 Integration Roadmap

### Phase 1: Service Layer ✅ (COMPLETED)
- ✅ All 9 service files created
- ✅ TypeScript interfaces defined
- ✅ localStorage patterns established
- ✅ Core business logic implemented

### Phase 2: UI Components (NEXT)
Create React components for each service:

1. **Contacts Component** (`/contacts` page)
   - Contact list with search/filter
   - Add/Edit contact form
   - Favorite toggle
   - Delete confirmation

2. **Notifications Dropdown** (Header)
   - Notification list with unread badge
   - Mark as read button
   - Clear all button
   - Filter by type

3. **Recurring Payments Page** (`/recurring`)
   - Payment list with status (active/paused)
   - Add new recurring payment form
   - Edit/Delete actions
   - Due soon section

4. **Budget Dashboard** (`/budget`)
   - Category cards with progress bars
   - Monthly spending chart
   - Alert notifications
   - Add/Edit category form

5. **Currency Calculator Widget**
   - Amount input
   - Currency dropdowns (DALLA/bBZD/USD/GBP)
   - Live conversion display
   - Conversion history

6. **Messages Page** (`/messages`)
   - Conversation list
   - Chat interface with message bubbles
   - Send text/payment request buttons
   - Split bill modal

7. **QR Code Modal** (Receive page)
   - QR code display
   - Copy address button
   - Share button (Web Share API)
   - Amount/message input for payment requests

8. **Transaction Notes Input** (Send page)
   - Note text area
   - Category dropdown
   - Tag multi-select
   - Character counter

9. **Theme Toggle** (Settings page)
   - Light/Dark mode switch
   - Preview of colors
   - System preference option

### Phase 3: Integration
Wire services to existing pages:

- **Send Page**: Add contact selector, note input, recurring payment creation
- **Receive Page**: Add QR code display, payment request creation
- **History Page**: Display notes, search by category/tag
- **Header**: Add notifications dropdown, messages badge, theme toggle

### Phase 4: Testing
- Unit tests for all service functions
- Integration tests for localStorage persistence
- E2E tests for user flows
- Accessibility testing

---

## 🔧 Installation Requirements

Add these npm packages to `ui/maya-wallet/package.json`:

```json
{
  "dependencies": {
    "qrcode.react": "^3.1.0",  // QR code generation
    "date-fns": "^2.30.0"      // Date formatting for recurring payments
  }
}
```

Install:
```bash
cd ui/maya-wallet && npm install
```

---

## 📚 Usage Notes

### localStorage Keys
All services use prefixed localStorage keys to avoid conflicts:

- `maya-contacts`
- `maya-notifications`
- `maya-recurring-payments`
- `maya-budget-categories`
- `maya-budget-alerts`
- `maya-budget-history`
- `maya-exchange-rates`
- `maya-conversion-history`
- `maya-conversations`
- `maya-theme`
- `maya-transaction-notes`

### Browser Compatibility
- **Notifications API**: Requires user permission (Chrome 50+, Firefox 44+, Safari 16+)
- **Web Share API**: Mobile only (Chrome 89+, Safari 12.2+)
- **Clipboard API**: HTTPS required (Chrome 63+, Firefox 53+, Safari 13.1+)

### Lint Errors
Current compile errors for missing `@belizechain/shared/utils/logging` are expected. Will resolve after:
```bash
cd ui/shared && npm install
```

### Data Migration
For production, consider:
- Cloud backup sync (via Pakit)
- Multi-device synchronization
- Data encryption at rest
- Export/Import for user backups

---

## 🎨 Design System Integration

All services follow consistent patterns:

1. **TypeScript interfaces** for type safety
2. **localStorage persistence** for client-side storage
3. **Error handling** with try/catch + logging
4. **Validation** before saving (length limits, format checks)
5. **Auto-trimming** for storage limits (notifications: 100, messages: 500/conversation, history: 12 months)
6. **Export/Import** for data portability

---

## 🚀 Next Steps

1. Create UI components for each service
2. Integrate with existing Maya Wallet pages
3. Add Polkadot.js integration for blockchain events (payment notifications, etc.)
4. Implement Pakit backup/sync for critical data
5. Add unit tests for all service functions
6. Create user documentation

---

## 📖 Related Documentation

- See `docs/AI_INSTRUCTIONS_INDEX.md` for complete project structure
- See `ui/.github-instructions.md` for UI-specific guidelines
- See `DEVELOPMENT_GUIDE.md` for architecture overview
