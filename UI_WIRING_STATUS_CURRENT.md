# UI Wiring Status — AUTHORITATIVE (supersedes prior status docs)

**Last verified:** 2026-10-15 (every claim re-read against source; supersedes the 2026-10-08 pass)
**Scope:** `maya-wallet` + `blue-hole-portal`
**Honest completion:** the 2026-10-08 verdict — "every remaining gap is a *missing
backend*, never a fabricated surface" — **did not hold.** See the re-verification below.

---

> ### ⚠️ RE-VERIFIED 2026-10-15 — one live fabrication, three corrections
>
> Every claim in this document was re-read against the source. Most hold. These do not:
>
> **1. The portal's root page was fabricating its validator fleet.**
> `blue-hole-portal/src/app/page.tsx` (the live route `/`) rendered a hardcoded
> "National Validator Performance Matrix" with no loading state and no unreachable
> branch: a second validator (`Edge-Validator-2`) that **does not exist** (the live
> authority set is 1), `0 Slashing events · 100% Uptime`, a block number falling back
> to a hardcoded `18,340`, `Attesting 100% of rounds`, and **two internal Tailscale IPs**
> (`100.119.97.38:30333` and `:30334`). The page's own copy claimed "Real-time status".
> **Fixed** — the panel now reads real `staking.validators` records and shows honest
> empty / unavailable states.
>
> **2. The fix credited below went into a file that was never rendered.**
> `blue-hole-portal/src/components/Dashboard.tsx` had **zero importers** — 2,491 lines
> nothing could reach. Its correct `'Node unreachable'` / `'Awaiting Activation'`
> handling never reached a user, while the live page kept the fabrications. The dead
> file has been deleted.
>
> **3. Item 7's services-page finding was two-thirds stale.**
> The page **does** carry a disclosure (amber `role="note"`, added in `a93df38`) and it
> **was** linked from `HomeScreen.tsx`. The catalogue is **10** services, not nine. The
> one part that stands is that no backend exists — which the disclosure itself states.
>
> **4. Three pages rendered hardcoded values as chain data.** `governance`
> (`1,850,000 Ɗ` treasury balance, `72.4%` voter turnout, "Super-Majority Attained"),
> `profile` (`87.50 Ɗ` rewards, `142` extrinsics, `8 Referenda`, plus fake prefilled
> personal data: `citizen@belizechain.org`, `+501 822-2222`, `Belmopan`) and `land`
> (`100% Cleared & Compliant`). All three now read real data or state plainly that the
> figure is not tracked.
>
> **5. 40 unreachable source files were removed** (import-graph scan, per-package `@/`
> resolution, then confirmed by deleting them and passing `tsc --noEmit` and
> `next build` for both apps). Details in `docs/audits/`.

---

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
- ⚠️ **Finding (2026-10-08, corrected 2026-10-15):** `maya-wallet/src/app/services/page.tsx` presents **ten** government services with illustrative fees (e.g. "50 DALLA", "150 DALLA") and processing times. **Correction:** it *does* carry an honest amber disclosure stating that no backend exists and that the fees are placeholders, and it *was* linked — from `HomeScreen.tsx`, which has since been deleted as an orphan. What stands is the missing backend, and the page says so itself. See item 7 below.

### Fixed this session (was mock — now real or honestly gated)
| Location | Status |
|---|---|
| `maya-wallet/src/app/bridge/page.tsx` | ✅ Real source txHash; relayer steps honestly "Awaiting" |
| `maya-wallet/src/app/offline/page.tsx` | ✅ Real `signRaw` / explicit unsigned envelope; no invented hash on failure |
| `maya-wallet/src/services/bluetooth-mesh.service.ts` | ✅ Was already real signRaw + 0x00 marker (doc was stale) |
| `maya-wallet/src/services/oracle.ts` | ✅ DALLA fabrication removed; pegged statutory rates correctly labeled |
| `blue-hole-portal/src/components/Dashboard.tsx` | ⚠️ **DELETED 2026-10-15 — it was never rendered.** Zero importers, 2,491 lines. The honest `unreachable` / `Awaiting Activation` handling recorded here never reached a user, because nothing rendered the file. The live root page kept the fabrications until they were fixed — see the re-verification block. |

### Also wired or gated in passes 2–4 (full detail in section below)
payroll, belizeid, treasury, governance, community, staking, bns, landledger,
compliance, developer, nawal benchmark, mesh probe, pakit,
education, scanner, messages.

### Blue Hole Portal
- **Explorer pages:** ✅ chain-wired (real hooks).
- **Dashboard widgets:** ❌ **was fabricated — corrected 2026-10-15.** The root page
  rendered a hardcoded validator panel (fictional second validator, `100% Uptime`,
  hardcoded block fallback, internal IPs). It now reads `staking.validators` and shows
  honest empty / unavailable states. The `components/Dashboard.tsx` this document
  credited with the fix has been deleted — it was never rendered.

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
7. ~~`maya-wallet/src/app/services/page.tsx` — un-disclosed and unlinked.~~ **Re-verified
   2026-10-15:** this was wrong on both counts. The page carries an honest disclosure
   and was linked from `HomeScreen.tsx` (now deleted as an orphan). What remains true is
   the missing backend — and the page states that itself. No action needed unless the
   catalogue is actually wired.

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
