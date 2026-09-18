# UI Wiring Status — Final Audit

**Status:** 🟡 NOT COMPLETE — see `UI_WIRING_STATUS_CURRENT.md` (authoritative, 2026-09-10).

> ⚠️ CORRECTED 2026-09-10: This document previously claimed "100% Wired / no critical mock data remains" — that was **false**. Verified facts: 9/14 high-priority pages wired; mock paths remain in bridge, offline, bluetooth-mesh, oracle fallback, and portal Dashboard tiles. The historical text below is retained for the record of what WAS wired in this pass.

**Last verified:** July 2026 (Live source code scan)

---

## 🟢 Fully Wired & Complete
The following Phase 2 & Core features have been fully wired to real on-chain Substrate pallets, replacing all mock data:

1. **Analytics (`blue-hole-portal`)**
   - Wired to Subsquid Indexer GraphQL API for historical network snapshots.
2. **Bridges (`maya-wallet`)**
   - Wired to `interopService` (`getBridges`, `getUserBridgeTransfers`).
3. **BNS / Domains (`maya-wallet`)**
   - Wired to `bnsService` (`getUserDomains`, `hostWebsite`) with IPFS CID hashing.
4. **LandLedger (`maya-wallet`)**
   - Wired to `landLedgerService` (`getUserLandTitles`, `getPropertyTransferHistory`).
5. **Admin Portal (`blue-hole-portal`)**
   - Sudo / Council role verification fully implemented via `api.query`.
6. **FSC Compliance Exporter (`blue-hole-portal`)**
   - On-chain AML detection (velocity/structuring limits) and KYC score calculation implemented without mocks.
7. **Messaging (`maya-wallet`)**
   - Bluetooth Mesh and `blockchainProofService` initialized. (XMTP is gated pending secure Polkadot.js key derivation).
8. **Dashboards (`maya-wallet` / `blue-hole-portal`)**
   - All dashboard feeds (recent blocks, transactions, PoUW rewards) are reading directly from the network indexer.

## ⚪ Intentional Stubs (Not Bugs)
- **Exchange (`maya-wallet`)**: The `/wallet/exchange` route redirects to the fully implemented `/trade` decentralized exchange page.
- **Appearance Settings**: Dark/System mode toggles are marked "Coming Soon".
- **Education Modules**: Enrollment logic is purely client-side placeholders.

## Conclusion
The frontend UI is now **feature-complete** for Phase 2. No critical "mock data" remains in the primary blockchain workflows.
