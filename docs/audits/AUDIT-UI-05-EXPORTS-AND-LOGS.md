# AUDIT-UI-05 — Dead Exports: Wiring, Removal, and Debug Logging

| Field | Value |
|---|---|
| **Audit ID** | AUDIT-UI-05 |
| **Scope** | Acting on the UI-03 dead-export inventory; removing debug logging from shipped source |
| **Date** | 2026-10-16 |
| **Status** | **COMPLETE** — 5 junk files removed, 37 debug logs stripped, 2 scanner bugs found and fixed, 1 premise corrected |
| **Method** | Re-derive the inventory with a corrected scanner, verify every claim against the whole repo, then triage each item as *junk* / *unwired feature* / *already-correct*, and validate by build |

---

## 1. Why this needed a second pass

UI-03 produced an inventory of 65 dead exports and a list of 55 debug logs, then
stopped and asked. Two things were wrong with the inventory it left behind.

**The scanner undercounted.** It scored an export as "used" whenever its name appeared
anywhere outside the defining file. Barrels contain lines like:

```ts
export * from './ShellReadinessPanel';   // matches the symbol ShellReadinessPanel
```

The module name in a re-export path is spelled the same as the symbol it forwards, so
**every barrel re-export counted as a use.** That hid whole families of dead code,
including the largest cluster found in this pass.

**The reasoning about `shared` was wrong.** UI-03 left 9 exports in place on the grounds
that `shared` is a published package and unused exports there are public API. That
premise does not hold:

```
npm view @belizechain/shared  → 404 Not Found
shared/package.json           → no `private`, no `files`, no `publishConfig`
shared-library.yml            → `npm publish --dry-run` only, never a real publish
```

Nothing is published and nothing is consumed from outside this monorepo. "Unused in this
repo" **is** evidence for deletion.

---

## 2. Corrected inventory

Excluding re-export lines from reference counting, and counting a symbol as used only
when some file genuinely imports or reads it:

| Package | DEAD (UI-03 reported) | **DEAD (corrected)** | TEST-ONLY | LOCAL |
|---|---:|---:|---:|---:|
| `shared` | 9 | **13** | 0 | 24 |
| `maya-wallet` | 45 | **85** | **9** | 58 |
| `blue-hole-portal` | 11 | **11** | 0 | 35 |
| **Total** | 65 | **109** | **9** | 117 |

(The DEAD and LOCAL figures here are post-removal — the five files deleted in §3 are gone.
Pre-removal the DEAD total was 123. TEST-ONLY is covered in §4.3.)

**Every claim was then re-verified independently** — a full-repo `grep` per symbol
across `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` and `.md`, excluding build output and the
defining file. Result: **zero false positives.** The only non-code hits were in
documentation (a README showing `addContact` in an import example, an archived progress
doc listing `connectToChain`), which are records of what the code once did, not
consumers.

### 2.1 The cascade — deleting a dead file can orphan more

Two exports became dead **as a result of the removals in §3**, which is why the corrected
figures shifted again during this pass:

| Newly dead | Its sole consumer was |
|---|---|
| `localeInfo` (`shared/src/i18n/index.ts`) | `LanguageSwitcher.tsx` — deleted in §3.5 |
| `BelizeAccount` (`shared/src/types/index.ts`) | `maya-wallet/src/store/account.ts` — deleted in §3.2 |

Neither appears in the v3 counts, because at that point the files about to be deleted were
still counting as consumers. **A dead-export inventory is a moving target: each removal
pass can reveal the next one.** Both are coherent types/constants with no remaining
caller, so they are reported here rather than removed mid-pass — the same treatment as
§4.3.

**Newly revealed clusters** (hidden by the barrel false-negative):

| Location | Dead | Why it had been invisible |
|---|---:|---|
| `maya-wallet/src/services/pallets/community.ts` | 9 | `pallets/index.ts` forwards them |
| `maya-wallet/src/services/pallets/bns.ts` | 8 | same |
| `maya-wallet/src/services/pallets/interoperability.ts` | 7 | same |
| `maya-wallet/src/services/pallets/landledger.ts` | 5 | same |
| `maya-wallet/src/services/pallets/payroll.ts` | 5 | same |
| `maya-wallet/src/services/pallets/oracle.ts` | 5 | same |
| `maya-wallet/src/services/pallets/governance.ts` | 4 | same |
| `maya-wallet/src/services/pallets/staking.ts` | 2 | same |

The `shared` total of 14 decomposes as: 2 API-client getters, `getTranslations`,
`SkeletonCard` (4 — all forwards from `src/index.ts`); the five `styles` exports and
`StorageMetadata`/`StorageStats` (7); and the two files deleted in §3.4–3.5 (3).

---

## 3. Removed — 5 files of verified junk

The user's instruction was to wire things up, but to remove anything that turns out to be
junk. These five are junk: not merely unreferenced, but **superseded by a live
equivalent**. Each was checked against its live counterpart before deletion.

### 3.1 `maya-wallet/src/app/domains/page.tsx` — 445-line orphaned duplicate

| Evidence | `/domains` (removed) | `/bns` (kept) |
|---|---|---|
| Linked from anywhere | **nothing** | `app/more/page.tsx:129` |
| Last content change | 2026-06-02 | 2026-10-08 |
| Size | 445 lines | 1,526 lines |
| Tabs | my-domains, register, marketplace, hosting | identical four |
| Raw `api.query` calls | **3** | **0** — uses the service layer |
| Fields read off `DomainRecord` | `expiresAt`, `verified` — **neither exists** | via typed service |

`pallet-bns` `DomainRecord` is `owner`, `original_owner`, `registered_at`,
`purchase_price`, `tier`, `locked_until`, `transfer_count`. The orphan page read
`recordData?.expiresAt` (always `0`) and `recordData?.verified` (always falsy), so its
verification badge could never render and its expiry column was permanently zero.

The canonical page imports 11 functions from `services/pallets/bns.ts` and makes no raw
API calls. The e2e spec `tests/e2e/07-bns.spec.ts` targets `/bns`. Removing `/domains`
breaks nothing.

### 3.2 `maya-wallet/src/store/account.ts` — superseded state container

A zustand store with `connectWallet` / `disconnectWallet` / `updateBalance` /
`refreshBalance`, imported by **nothing**. `contexts/WalletContext.tsx` owns wallet state
and is the one every component uses. Two sources of truth for account state is a defect
waiting to happen; the live one stays.

### 3.3 `maya-wallet/src/services/community-indexer.service.ts` — orphaned by UI-03

Its only consumer was `LeaderboardCard.tsx`, deleted in UI-03. It then imported nothing
and was imported by nothing. `services/pallets/community.ts` is the live
community-service module (and gained `getProjectContributors` etc. as dead exports of its
own — a different problem, see §4).

### 3.4 + 3.5 `shared/src/components/ShellReadinessPanel.tsx`, `LanguageSwitcher.tsx`

Both were reachable **only** through barrel re-export lines — the exact false-negative
class. Neither was imported by any app.

- `ShellReadinessPanel` was superseded: `MayaShellReadinessPanel` (280 lines) and
  `PortalShellReadinessPanel` (306 lines) are app-specific forks that both exist and are
  rendered. The 101-line shared original was the ancestor.
- `LanguageSwitcher` was superseded by `maya-wallet/src/app/language/page.tsx`, a
  self-contained screen with its own local state. `useI18n` (the live i18n hook) *is*
  used, by `app/providers.tsx:21` — the switcher **component** was the dead part.

The barrel was updated in the same commit. Both apps' own `components/ui/index.ts` define
their own `LanguageSwitcher`, so no app is affected.

---

## 4. Deliberately NOT removed — the "wire it up" case

These are the items where removal would delete a **capability**, not clean up junk. The
inventory is the deliverable.

### 4.1 `services/pallets/*.ts` — the typed service layer, bypassed by design gaps

`bns.ts` alone declares 21 functions; `getPrimaryDomain`, `getTextRecords` and
`clearPrimaryDomain` are dead while 18 siblings are live. The 38 newly-revealed dead
exports across the eight pallet service modules are the same story: pages call
`api.query.*` inline instead of going through the service.

This is **not** a remove-the-export decision. `services/pallets/bns.ts` is good code —
typed returns, verified pallet knowledge, and comments recording earlier fixes (for
example, noting that `bns.domains` does not exist and the registry is `domainRegistry`,
which the orphan page it replaced had read correctly). Deleting these functions deletes
the intended interface and leaves the inline duplication in the pages as the only
implementation.

The work to do here is the reverse of deletion: move inline page queries onto these
functions. That is a page-by-page refactor of roughly ten screens, and it belongs in its
own pass.

### 4.2 `maya-wallet/src/services/contacts.ts` — 10 dead functions, unwired feature

`getContacts` is consumed by `app/contacts/page.tsx`. None of the other ten are. The page
has a **`+` create button with no `onClick`** — a dead UI affordance — and filters/sorts
in the component rather than calling `searchContacts` / `getFavoriteContacts`.

So the capability exists, the entry point is visible, and nothing connects them. Wiring
`addContact` here is a small, bounded feature fix and the clearest candidate in this
inventory. It was **not** done in this pass because it changes what the UI can do, and
that is a product decision.

### 4.3 The TEST-ONLY bucket — a passing suite is not integration

Found while verifying §4.2, and it is the most misleading category in the whole
inventory. The scanner counts test files as consumers, so an export reached only by its
own unit test scores as "live". Re-running with tests separated out:

| Package | DEAD | **TEST-ONLY** | LOCAL |
|---|---:|---:|---:|
| `shared` | 13 | 0 | 24 |
| `maya-wallet` | 85 | **9** | 58 |
| `blue-hole-portal` | 11 | 0 | 35 |

All 9 test-only exports are in one file: **`maya-wallet/src/services/budgeting.ts`**.

`budgeting.test.ts` is a thorough suite — 5 tests covering seeding, CRUD, thresholds,
acknowledgement and aggregation. It passes. It proves the module **works**. It says
nothing about whether anything **calls** it, and here nothing much does:

| `budgeting.ts` (13 exports) | Reach |
|---|---|
| `getBudgetCategories`, `addBudgetCategory` | used by the app |
| `resetMonthlyBudgets`, `updateBudgetFromTransactions` | **no caller at all** |
| `updateBudgetCategory`, `deleteBudgetCategory`, `recordSpending`, `getBudgetAlerts`, `acknowledgeBudgetAlert`, `clearAcknowledgedAlerts`, `getUnacknowledgedAlertsCount`, `getTotalLimits`, `getTotalSpent` | **only `budgeting.test.ts`** |

**11 of 13 exports have no application caller.** The consequence for reading this audit:
a green test count is not evidence that a module is integrated, and the UI-03 baseline
line "vitest → 14 passed" includes tests that exercise code the app never runs. Coverage
and integration are different measurements, and this repo's suite cannot distinguish
them.

Not deleted, for the same reason as §4.2: the code is correct and the feature is
coherent; what is missing is a caller.

### 4.4 Other unwired features, reported only

`services/pallets/identity.ts` (`registerBelizeID`, `submitSSNVerification` — no caller;
the `belizeid` page does not register), `services/notifications.ts` (9 `notify*` helpers),
`services/oracle.ts` (5), portal `services/analytics.ts` (18 types),
`services/monitoring.ts` (7, including `monitoringService` itself),
`lib/blockchain/hooks.ts` (6).

None of these are junk. Each is either a feature awaiting its caller or a type set
supporting data the app does not yet render.

---

## 5. Console logging — 37 debug traces removed, 18 kept

UI-03 measured 306 `console.*` calls: 251 `error`/`warn` and **55** `log`/`debug`/`info`.
The 55 were triaged by what the message *does*, not by its level.

### 5.1 Removed (37 — counted from the diff, and classified line by line)

| Class | Count | Examples |
|---|---:|---|
| Per-operation traces | 16 | `[PAKIT] Message bundle uploaded to IPFS: <hash>`, `[BLE-MESH] Received mesh message:`, `Transaction status:` |
| Lifecycle chatter | 10 | `[BLE-MESH] Bluetooth Mesh initialized`, `[WALLET] Wallet disconnected`, `[BLOCKCHAIN] API ready` |
| Connection banners | 6 | `[BLOCKCHAIN] Chain: <name>`, `[BLOCKCHAIN] Node: <name>`, `Connected to BelizeChain` |
| State transitions | 4 | `Transaction finalized:`, `[PROOF] Emergency alert submitted via Mesh pallet:` |
| Rehydration/status | 1 | `Rehydrating locale from localStorage:` |

All fire during normal operation and carry no error signal.

### 5.2 Kept (18) — and why each is not a debug trace

| Site | Reason |
|---|---|
| `console.debug` in catch blocks (4: `identity.ts` ×2, `blockchain.ts` ×2) | **Error diagnostics.** A failed query is not debug chatter; these are the same class as the `console.warn` calls fixed in UI-03. |
| `[BLE-MESH] Web Bluetooth API not available — mesh tier disabled` | A **capability notification** — tells the operator a platform feature is off. |
| `[BLE-MESH] No peers discovered — WebBluetooth cannot scan for advertisers` | Explains a platform limitation, in the same class as the above. |
| API-route `[auth] verify ok` (maya + portal) | **Server-side** request logging. That is the operational record for a route. |
| `[BLOCKCHAIN-SERVICE] Reconnection attempt N/M` | Operational signal for a degraded connection. |
| Developer-page `console.log` (maya ×2, portal ×3) | Inside **code samples** shown to developers — contents of template literals, not executed code. |
| `lib/blockchain/hooks.ts` ×1, `fee-estimator.ts` ×1 | Inside **JSDoc comments**. |
| `shared/src/utils/logger.ts` ×2 | The logger's own sinks. |

A blanket `console.log` sweep would have deleted all 18. That is why this was done by
reading each site — the classification is the work.

### 5.3 The strip broke a live hook, and tsc caught it

`shared/src/hooks/useWallet.ts` had:

```ts
callback || ((status: any) => {
  console.log('Transaction status:', status.toHuman());
})
```

The log **was** the callback body. Removing it left an empty arrow function with an
unused parameter, and `shared` sets `noUnusedLocals`, so `tsc` failed with
`TS6133: 'status' is declared but its value is never read`.

This file **is** live — `useWallet` is imported by both `LoginGate.tsx` files and by the
portal's `store/admin.ts`. The fix keeps the contract and drops the noise:

```ts
// The default used to console.log every status. Callers that want
// progress reporting pass their own callback; the default is a no-op.
callback || (() => {})
```

Neither consumer calls `signAndSend`, so no caller-visible behaviour changes. **This is
the case the "verify before removing" instruction was for** — the automated pass could
not have known that a `console.log` was load-bearing.

### 5.4 A second fallout: an unused binding in the portal

Stripping `console.log(… , hash)` in `app/governance/proposals/page.tsx` left
`const { hash } = await voteOnProposal(...)` unused, which raised the portal's warning
count from 149 to 150. Caught by comparing lint counts against the previous run, not by
the build. The destructuring is gone; the call remains, since submitting the vote is the
point. Portal is back to **149**.

---

## 6. Verification

| Gate | Result |
|---|---|
| `tsc --noEmit` — `shared` | **OK** (after §5.3 fix; failed before it) |
| `tsc --noEmit` — `maya-wallet` | **OK** |
| `tsc --noEmit` — `blue-hole-portal` | **OK** |
| `next build` — `maya-wallet` | **OK**, all routes dynamic |
| `next build` — `blue-hole-portal` | **OK**, all routes dynamic |
| `npx vitest run` | 3 files, **14 passed, 1 skipped** |
| `eslint` — `maya-wallet` | 0 errors, **275** warnings *(was 296)* |
| `eslint` — `blue-hole-portal` | 0 errors, **149** warnings *(= baseline)* |
| `eslint` — `shared` | 0 errors, **16** warnings *(was 17)* |
| Debug-level `console` calls | **18** *(was 55)* |
| `check-doc-claims.sh ui` | **PASSED** |

**Every removal is verified by `tsc` and `next build`, not by the grep alone.** A
surviving import of a deleted module is a compile error, so build success is stronger
evidence than any static scan. The e2e spec that covers this area targets `/bns`, which
was kept.

---

## 7. Open items

| Item | Detail |
|---|---|
| ~10 pages inline `api.query.*` | Should move onto `services/pallets/*`. The dead exports are the *symptom*; the duplication is the cause. Largest single piece of debt in the UI. |
| `contacts/page.tsx` `+` button | Has no `onClick`. `addContact` exists and is unused. Smallest genuine feature gap found. |
| `services/notifications.ts` | 9 unused `notify*` helpers. Either wire to real events or drop. |
| `blue-hole-portal/src/services/monitoring.ts` | `monitoringService` itself is unused — the whole module may be dead, but it needs a read-through first. |
| 120 "LOCAL" exports | `export` keyword unnecessary (symbol used only in its own file). Cosmetic; safe to flip to non-exported, but low value. |

---

## 8. Auditor's notes

1. **Both bugs in this pass were in the auditing tools, not the code.** A barrel
   re-export counted as a use; a package's non-publication was read as publication. The
   scanner said 65 dead exports and the real number was 109. Every previous conclusion
   drawn from that scanner should be re-read against the corrected figures — which is why
   UI-03 carries a correction banner rather than a quiet edit.

2. **The one thing the build could not catch was the one thing that mattered.**
   Removing a `console.log` that was the *entire body* of a live callback type-checked as
   an empty function, and only `noUnusedLocals` in `shared` surfaced it. A repo with less
   strict tsconfig would have shipped a silently-empty status callback.

3. **Lint counts are a cheap regression detector.** Portal's warning count going 149 → 150
   was the only signal that the strip had orphaned a destructuring. Comparing counts
   before/after every change is worth the two seconds.

4. **"Unused" still is not "dead".** 109 dead exports, and the correct action for the
   large majority was **nothing** — they are the typed service layer and coherent feature
   code awaiting callers. Five files were junk. The distinction was made by reading each
   cluster against its live counterpart, not by sorting on a number.
