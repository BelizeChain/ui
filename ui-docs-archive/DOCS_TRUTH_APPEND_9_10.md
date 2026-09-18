# UI Wiring Status — AUTHORITATIVE (supersedes prior status docs)

**Last verified:** 2026-09-10 (live source-code scan)
**Scope:** `maya-wallet` + `blue-hole-portal`

> This document is the single source of truth for UI wiring status.
> It supersedes the conflicting claims previously made in:
> - `README_WIRING_STATUS.md` / `SUMMARY.md` ("15% complete" — pre-wiring snapshot)
> - `UI_WIRING_STATUS.md` ("85% COMPLETE" — undated estimate)
> - `WIRING_COMPLETE_REPORT.md` ("9 of 14 pages")
> - `WIRING_PROGRESS_SUMMARY.md` ("100% wired / feature-complete" — **false** when written; mocks existed)
> - `maya-wallet/WIRING_PROGRESS.md` ("15% complete" — pre-wiring snapshot)

---

## Verified actual state (2026-09-10)

### Maya Wallet
- **Service layer:** ✅ 100% — all 15 pallet services exist and are production TypeScript APIs (`src/services/pallets/*`).
- **Page wiring:** 🟡 **9 of 14 high-priority pages wired** (~64%) — consistent with `tests/README.md` and the `TESTING_*` docs; deferred: Nawal (needs FL server + checkpoints), Pakit (needs IPFS/Arweave), plus 2 deferred service-activation pages.

### Known REMAINING mock/placeholder paths (not "complete")
| Location | What is mock |
|---|---|
| `maya-wallet/src/app/bridge/page.tsx` (~line 100) | Fabricated `mockTx` transaction hash |
| `maya-wallet/src/app/offline/page.tsx` (~line 106) | Fabricated `mockSignature` proof |
| `maya-wallet/src/services/bluetooth-mesh.service.ts` (~line 251) | Returns literal `'mock_signature'`; peer discovery still labeled mock (~line 138) |
| `maya-wallet/src/services/oracle.ts` (~lines 71–110) | Hardcoded fallback rates when the Oracle is unavailable (fallback, not primary path) |
| `blue-hole-portal/src/components/Dashboard.tsx` (~lines 300–330) | Hardcoded system-status tiles ("Block #145,234", "2.3 TB used", "87 nodes active", "3 jobs running") and hardcoded Recent Activity feed |

### Blue Hole Portal
- **Explorer pages:** ✅ chain-wired (`src/app/explorer/*` uses real chain hooks — `useRecentBlocks`, `useBlockNumber`; no mock tokens found in portal pages).
- **Dashboard widgets:** 🟡 partially hardcoded (see table above).

### Intentional stubs (by design, not bugs)
- `/wallet/exchange` redirects to `/trade` (real DEX UI).
- Appearance dark-mode toggles = "Coming Soon".
- Education enrollment = client-side placeholder.

---

## Honest completion percentages
| Component | Backend services | Page wiring |
|---|---|---|
| Maya Wallet | 100% | **9/14 high-priority (~64%)** — full app has 54+ pages, untracked lower-priority pages vary |
| Blue Hole Portal | hook-based chain access real | Explorer ✅; Dashboard widgets 🟡 |
| Shared library | Complete | n/a |

**Bottom line:** NOT feature-complete and NOT 100% wired. Remaining real work before Phase 2 is honest: clear the 5 mock paths above, wire the deferred pages once their backend services (nawal FL server, Pakit storage) are activated on Ceiba.
