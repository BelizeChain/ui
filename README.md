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

## 🎯 Features & Ecosystem (30 Live Modules)

### Maya Wallet (`/wallet` on Port 3001)
* 🆔 **BelizeID Sovereign Passport**: W3C DIDs (`did:belize:...`), ZK Selective Disclosure, biometric hardware binding, and LandLedger title deed anchors.
* 🗺️ **LandLedger National Cadastre**: Vector GIS district maps, parcel deed inspection, 5% stamp duty calculator (1% digital discount), and RWA tokenization wizard.
* ⚡ **Staking & Consensus Hub**: Live directory for the 4 active Substrate validators (`Ceiba-Validator-01`, `Edge-Validator-02`, `Reef-Validator-03`, `Maya-Validator-04`), bonding/nomination wizard, auto-compounding, and PoUW compute claims.
* 🌐 **BNS Sovereign Domain Registrar**: Multi-TLD registrar (`.bz`, `.caye`, `.belize`), DNS/DID record manager, 1-click BelizeID/LandLedger binding, Pakit IPFS hosting manager, and P2P marketplace with atomic escrow.
* ⚖️ **Citizen Restorative Justice (Pallet 35)**: Cooling-off block monitoring, restorative dispute filing, and arbitral appeal requests.
* 📢 **Whistleblower Shield (Pallet 36)**: Anonymous ZK commitment generation (`blake2_256`), encrypted receipt `.json` ticket downloads, and bounty claims.
* 🛡️ **Community Content Safety (Pallet 37)**: 5-category decentralized flagging with Nawal AI risk telemetry.
* 💱 **BelizeX DEX Pro**: AMM liquidity pools, token swaps, and Order Book V1.
* 📦 **Pakit Decentralized Storage**: Hot/Warm/Cold IPFS storage tiers and client-side encryption.
* ⚛️ **Kinich Quantum Hub**: Post-quantum Dilithium/Falcon key rotation, 10x photonic compression, and QASM circuit editor.
* 🧠 **Nawal AI Federated Learning**: Client gradient training simulation and PoUW mining claims.
* 📻 **LoRaWAN Mesh & Offline Signing**: 915MHz Meshtastic packet relaying, NEMO disaster alerts, and animated air-gapped QR signing.
* 🏛️ **Sovereign Governance & Multi-Sig Treasury**: Referenda voting, conviction multipliers, and M-of-N multi-sig disbursements.
* 📜 **Central Bank Compliance**: Statutory 100.2% collateral reserve attestation and FIU limits.

### Blue Hole Portal (Port 3002)
* 🏛️ **National Command Center**: Epoch telemetry, validator performance matrix, and system security monitor.
* ⚖️ **Arbitration Court Docket**: Judicial case triage, cooling-off timers, and mediator rulings with custom slash sliders.
* 📢 **Integrity Commission Desk**: 150,000 DALLA pool tracking, council investigation drawer, and reward disbursements.
* 🛡️ **Content Safety Registry**: Moderation queue triage and Nawal AI risk score simulator.
* 📊 **National Analytics**: Real-time economic telemetry with automated live Substrate node RPC fallback.
* 👥 **Validator Performance Matrix**: Live block authoring telemetry and multi-sig treasury disbursements.

---

## 🔍 Audit Findings & Next Session Handoff Notes

> [!IMPORTANT]
> **Host Memory Constraints & Safe Operation**
> - **System RAM**: Host has 14GB physical RAM, with ~5.3GB consumed by `rust-analyzer` and full swap.
> - **Node Dev Servers**: Must be run with `NODE_OPTIONS="--max-old-space-size=1024"`. Lower limits (512MB) cause V8 heap OOM crashes during Next.js Webpack compilation, while 1024MB runs reliably.
> - **Zero Headless Browsers**: Do not spawn unconstrained external Chromium or Puppeteer browser instances. Use `tsc --noEmit` and HTTP curl requests for verification. Use in-editor **`Simple Browser: Show`** (`Ctrl+Shift+P`) for visual checks.
> - **Next.js Base Path**: Maya Wallet is configured with `basePath: '/wallet'`. Always access routes via `http://localhost:3001/wallet/...`.

> [!NOTE]
> **Substrate Consensus & Smart Contracts Status**
> - **Substrate Validators**: 4 local validator nodes (`val-ceiba`, `val-reef`, `val-cayo`, `val-maya`) are healthy and authoring via Docker at `ws://127.0.0.1:9944`.
> - **Smart Contracts**: All 150 unit tests across ink! smart contracts (`dalla_token`, `simple_dao`, `dex`) passed. Live E2E scripts in `gem/scripts/test-e2e-live.js` have unsub-safe transaction handlers.
> - **Nawal AI Packaging**: `nawal-ai/nawal/` contains symlinks for local module imports; evaluate replacing with `pip install -e .` in the next session.

---

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

---

**Version:** 2.4.0 (Caribbean Cyber-Ocean & Civic Judiciary Suite)  
**Last Updated:** September 4, 2026  
**Maintainers:** BelizeChain Development Team  
**Built with ❤️ for the Sovereign Nation of Belize**

