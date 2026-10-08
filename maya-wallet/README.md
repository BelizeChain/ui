# Maya Wallet 👤

**The Citizen Experience for BelizeChain**

Maya Wallet is designed to be the simplest, most user-friendly blockchain wallet in the world. If you can send a text message, you can use Maya Wallet.

## 🎯 Design Philosophy

### Zero Crypto Jargon
- No "wallets", "gas fees", "transactions"
- Use everyday language: "Send money", "Get paid", "My documents"
- Hide all blockchain complexity

### WhatsApp-Simple
- One-tap actions
- Visual feedback
- Clear success/error messages
- Intuitive navigation

### Mobile-First
- Designed for smartphones (80% of Belizeans)
- Touch-friendly (44px tap targets)
- Fast loading (< 3 seconds)
- Offline-capable

## ✨ Features

### 1. **Home Screen**
- Balance display (DALLA + bBZD)
- Show/hide balance toggle
- Recent transactions (last 10)
- Quick actions (send, receive, documents, services)
- Tourism rewards banner

### 2. **Send Money**
- Contact picker
- Amount input with currency selector
- Fee estimate + on-chain transfer (`submitTransfer`)
- Confirmation screen with success feedback

### 3. **Receive Money**
- QR code generator
- Share address button
- Payment request

### 4. **Documents**
- BelizeID credentials and land titles from the on-chain register
- View/download/share

### 5. **Government Services**
- A service-catalogue page exists, but **no government-services backend is
  deployed** — the listed services are not yet executable.

### 6. **Tourism Rewards** *(not yet available)*
- On-chain tourism redemption is not implemented
  (see `src/services/pallets/oracle.ts`)

## 🚀 Getting Started

### Development
```bash
npm run dev
```
Open [http://localhost:3001](http://localhost:3001)

### Build
```bash
npm run build
npm start
```

### PWA
Maya Wallet is a Progressive Web App:
- Works offline
- Installable on home screen
- Push notifications
- Background sync

## 🎨 Design System

Uses the shared Belizean design system:
- **Caribbean Blue** (#0066CC) - Primary
- **Jungle Green** (#00A86B) - Success
- **Maya Gold** (#FFD700) - Rewards

## 🔐 Security

- Biometric authentication (planned)
- Secure key storage
- Transaction limits
- Multi-factor for large amounts

## 🌍 Accessibility

- WCAG 2.1 Level AA
- Screen reader support
- High contrast mode
- Multi-language (English, Spanish, Kriol)

## 📱 Progressive Web App

Maya Wallet can be installed on any device:
- iOS: Safari > Share > Add to Home Screen
- Android: Chrome > Menu > Install App

## 🛣️ Roadmap

- [x] Welcome screen
- [x] Home screen with balance
- [x] Transaction history
- [ ] Send money flow
- [ ] Receive money (QR codes)
- [ ] Document storage
- [ ] Government services
- [ ] Tourism rewards
- [ ] Biometric authentication
- [ ] Offline mode
- [ ] Multi-language

## 📄 License

Copyright © 2025 Government of Belize

---

**Built with ❤️ for every Belizean** 🇧🇿
