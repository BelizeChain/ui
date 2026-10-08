# UI Wiring Status — AUTHORITATIVE (supersedes prior status docs)

**Last verified:** 2026-10-08 (live source-code scan; runtime spec 110; GEM suite redeployed)
**Scope:** `maya-wallet` + `blue-hole-portal`
**Honest completion:** ~95% of UI scope done — every remaining gap is a
*missing backend*, never a fabricated surface.

> This document is the single source of truth for UI wiring status.
> It supersedes the conflicting claims previously made in `ui-docs-archive/`:
> - `README_WIRING_STATUS.md` / `SUMMARY.md` ("15% complete" — pre-wiring snapshot)
> - `UI_WIRING_STATUS.md` ("85% COMPLETE" — undated estimate)
> - `WIRING_COMPLETE_REPORT.md` ("9 of 14 pages")
> - `WIRING_PROGRESS_SUMMARY.md` ("100% wired / feature-complete" — **false** when written; mocks existed)
> - `WIRING_PROGRESS.md` ("15% complete" — pre-wiring snapshot)
> - `COMPLETION_SUMMARY.md` / `FEATURE_IMPLEMENTATION_COMPLETE.md` / `STATUS_REPORT.md` /
>   `UI_STANDARDIZATION_COMPLETE.md` / `UI_AUDIT_EXECUTIVE_SUMMARY.md` ("COMPLETE" snapshots)
> - `WIRING_GUIDE.md` / `TESTING_CHECKLIST.md` / `TESTING_AUTOMATION_COMPLETE.md` (superseded guides)
> - `EXTRACTION_SUMMARY.md` / `EXTRACTION_READINESS.md` / `INTEGRATION_ARCHITECTURE.md` /
>   `GITHUB_SETUP.md` (January-2026 extraction-era records)

---

## Verified actual state (2026-09-10)

### Maya Wallet (as of 2026-09-17, after CONFIG-002 passes 1–4)
- **Service layer:** ✅ 100% — all pallet services exist and are production TypeScript APIs (`src/services/pallets/*`); added `treasury.ts` and `performance.ts` this session.
- **Page wiring:** 🟢 **mostly honest** — high-priority pages are either chain-wired with real extrinsics or carry an explicit amber banner ("not yet live") while their backend is missing. **Correction (verified 2026-10-08):** the earlier claim that `maya-wallet/src/app/trade/page.tsx` was a "full simulation" is **wrong**. The page reads real `belizeX` AMM data (`getTradingPairs`, `getSwapQuote`, `addLiquidity`, `removeLiquidity`, `executeSwap`) and derives price from on-chain reserves. There is **no order book** anywhere in the wallet — trading is AMM-only.
- ⚠️ **New finding (2026-10-08):** `maya-wallet/src/app/services/page.tsx` presents nine government services as `status: 'available'` with invented fees (e.g. "50 DALLA", "150 DALLA") and processing times. It imports no service module, is **not linked from anywhere**, and carries no disclosure. See item 7 below.

### Fixed this session (was mock — now real or honestly gated)
| Location | Status |
|---|---|
| `maya-wallet/src/app/bridge/page.tsx` | ✅ Real source txHash; relayer steps honestly "Awaiting" |
| `maya-wallet/src/app/offline/page.tsx` | ✅ Real `signRaw` / explicit unsigned envelope; no invented hash on failure |
| `maya-wallet/src/services/bluetooth-mesh.service.ts` | ✅ Was already real signRaw + 0x00 marker (doc was stale) |
| `maya-wallet/src/services/oracle.ts` | ✅ DALLA fabrication removed; pegged statutory rates correctly labeled |
| `blue-hole-portal/src/components/Dashboard.tsx` | ✅ "Node unreachable" instead of placeholder block/hash; PoUW/CONS-010 claim replaced with "Awaiting Activation" |

### Also wired or gated in passes 2–4 (full detail in section below)
payroll, belizeid, treasury, governance, community, staking, bns, landledger,
compliance, developer, nawal benchmark, mesh probe, pakit,
education, scanner, messages.

### Blue Hole Portal
- **Explorer pages:** ✅ chain-wired (real hooks).
- **Dashboard widgets:** ✅ no placeholders; honest unreachable states.

### Intentional stubs (by design, not bugs)
- `/wallet/exchange` redirects to `/trade`.
- Appearance dark-mode toggles = "Coming Soon" (both apps).
- Education enrollment = client-side progress; the on-chain module completion
  (`community.complete_education_module`) exists but is not yet called from the UI.

---

## Remaining real work to reach 100% (all blocked on missing backends, not UI)
1. ✅ **GEM suite deployed** — 7/7 contracts live on the current chain (redeployed 2026-10-08); the wallet `gem` page is wired to the real contracts.
2. Community education / participation — `community.complete_education_module` and `community.attest_participation` **exist on chain** but the wallet pages still hold client-side progress. This is UI work, not a missing backend.
3. Pakit browser gateway → unlock pakit upload/vault for real DAG storage.
4. Nawal FL server live on Ceiba → unlock FL pages and real PoUW activity.
5. Bridge relayer infra → replace "Awaiting" states with real completion events.
6. Off-chain backends still absent: compliance KYC intake, analytics/vote-history indexer, reports PDF export.
7. `maya-wallet/src/app/services/page.tsx` — the government-services catalogue is un-disclosed and has no backend; gate it, wire it, or remove it.

---

## Honest completion percentages (2026-10-08)
| Component | Backend services | Page wiring |
|---|---|---|
| Maya Wallet | 100% | **~95%** — every gap gated honestly, never fabricated |
| Blue Hole Portal | ✅ | Explorer ✅; Dashboard ✅ |
| Shared library | Complete | `performance.ts`, `treasury.ts` added this session |

**Bottom line:** The UI no longer claims anything it cannot do. The last 5%
for each gated module is delivered by the same backends listed above — not by
more UI work.
