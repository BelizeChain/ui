# AUDIT-UI-03 — Code Quality: Defects, Metrics, and Dead Exports

| Field | Value |
|---|---|
| **Audit ID** | AUDIT-UI-03 |
| **Scope** | Code-quality signals across `shared`, `maya-wallet`, `blue-hole-portal` — error swallowing, debug logging, type escapes, dead exports |
| **Date** | 2026-10-16 |
| **Status** | **COMPLETE** — 6 silent failure paths fixed, 2 dead components removed, 65 dead exports inventoried and classified |
| **Method** | Mechanical scan of shipped `src` (tests excluded), then per-finding triage into *defect* / *metric* / *unwired feature*, each validated by reading |

---

## 1. The discipline this audit follows

Three different things look identical to a scanner and must not be treated the same:

| Kind | Example | Action |
|---|---|---|
| **Defect** | an empty `catch` that hides a failed subscription | **fix** |
| **Metric** | 378 uses of `any` | **report honestly**; mass-rewriting types is a project, not a cleanup |
| **Unwired feature** | CRUD functions a page never calls | **surface it**; deleting a product capability is not a cleanup decision |

A fourth category is just as important: **things a scanner flags that are correct as
written.** Four such classes were found here and are recorded in §5, because re-flagging
them next audit is the expensive failure mode.

---

## 2. What was measured (shipped `src`, tests excluded)

Figures are the **pre-fix** state for the two rows this audit changed (marked *), which are
now zero; everything else is unchanged.

| Signal | `shared` | `maya-wallet` | `blue-hole-portal` | **Total** |
|---|---:|---:|---:|---:|
| `any` (annotation or cast) | 13 | 236 | 129 | **378** |
| `console.*` | 16 | 213 | 77 | **306** |
| — `console.log` / `debug` / `info` | 4 | 33 | 18 | **55** |
| — `console.error` / `warn` | 12 | 180 | 59 | **251** |
| Empty `catch` blocks * | 0 | 8 | 0 | **8** |
| `eslint-disable` | 0 | 2 | 1 | **3** |
| Non-null assertions | 2 | 9 | 0 | **11** |
| `TODO`/`FIXME`/`HACK` | 0 | 1 | 1 | **2** |

The `any` total is the number the eslint `no-explicit-any` rule warns about; the eslint
warning counts (296 + 149 + 17 = 462, §6) are dominated by it but include other rules.

**The `console.*` split matters.** 251 of 306 are `error`/`warn` — mostly inside `catch`
blocks, which is legitimate error reporting in a browser app. Only **55** are
`log`/`debug`/`info`, i.e. actual debug leftovers. See §5.6 for why those were left in
place.

---

## 3. Fixed

### 3.1 Six silent failure paths — `maya-wallet/src/hooks/useBlockchainEvents.ts`

Six subscription hooks set up their listener behind an empty catch:

```ts
try { unsub = await subscribeToStakingRewards(address, (reward) => { … }); } catch (err) {}
```

If the subscription fails — pallet unavailable, RPC error — nothing is logged, `unsub`
stays `null`, and the hook returns `[]` forever. The UI then renders **"no data yet"**
for what is actually a **failure**. This is the exact defect class recorded in
`/memories/repo/ui-fabricated-services.md`: *reads look like "no data yet"; never like an
error.*

All six now warn, matching the convention already used in the same file (lines 258, 267):

```ts
} catch (err) { console.warn('Staking rewards subscription failed:', err); }
```

**Reachability, checked before touching it:** `useStakingRewardsSubscription` is live —
`useNotifications` consumes it, and `WalletContext` consumes that. So at least one of
these silent catches was on a live path. The fix changes no control flow; it only adds a
diagnostic.

### 3.2 Two dead components removed — `maya-wallet/src/components/community/`

| File | Evidence |
|---|---|
| `LeaderboardCard.tsx` | zero references repo-wide — the only mention of the symbol in the entire repo was its own declaration |
| `ProposalCard.tsx` | zero references; every `ProposalCard` hit elsewhere is **portal's** `components/ui/proposal-card.tsx`, a different file |

Both survived AUDIT-UI-00's sweep. Verified by deletion: `tsc --noEmit` → **OK**,
`next build` → **OK**.

**One of them contained a genuine AI-agent mistake**, which is worth recording even
though the file is gone:

```ts
} catch (e) {
  // showError is exported from the service file          ← false
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { showError } = require('@/services/community-indexer.service');
  showError('Failed to load leaderboard');                 ← TypeError
}
```

`showError` is declared at `community-indexer.service.ts:22` **without `export`**. The
comment asserts it is exported; it never was. When the catch fired, `showError` would be
`undefined` and calling it would throw a `TypeError` **inside the error handler** — so the
failure path was itself broken, and hidden behind a `catch` that would have swallowed the
evidence. The service's own methods already call `showError` internally and rethrow, so
the component's duplicate toast was redundant as well as broken. The comment is what made
it dangerous: it asserted the opposite of the truth, and the lint suppression stopped
anyone from noticing the `require`.

---

## 4. Dead exports — 65 found, inventoried, not mass-deleted

For every exported symbol in each package's `src`, references were counted repo-wide
excluding the defining file, then classified by whether the symbol is referenced inside
its own file:

| Package | **DEAD** (no reference anywhere) | LOCAL (own file only) | Can be trimmed? |
|---|---:|---:|---|
| `shared` | 9 | 19 | **No — published package** |
| `maya-wallet` | 45 | 41 | Yes (private app) |
| `blue-hole-portal` | 11 | 35 | Yes (private app) |

**`shared` is not private** (`package.json` has no `private: true`). An unused export
there is still published API surface, so "unused in this repo" is not evidence for
deletion. Those 9 are left alone deliberately.

### 4.1 Why the other 56 were not mass-deleted

They are not one thing. Two samples:

- **`maya-wallet/src/services/contacts.ts`** — 10 dead functions (`addContact`,
  `deleteContact`, `importContacts`, …) while `getContacts` **is** used by
  `app/contacts/page.tsx`. The page lists contacts but cannot create or edit one. That is
  an **unwired feature**, not junk.
- **`maya-wallet/src/services/pallets/identity.ts`** — 6 dead functions including
  `registerBelizeID` and `submitSSNVerification`. The `belizeid` page exists but never
  calls them.

Deleting these removes a capability someone may intend to wire up. That is a product
decision, not a code-hygiene one, so the inventory is reported rather than acted on.

**Where deletion is clearly safe and worthwhile**, the simplest test is reachability of
the whole file (§3.2) — that has been done.

Details of the largest clusters, for whoever picks this up:

| Location | Dead exports | Note |
|---|---:|---|
| `blue-hole-portal/src/services/analytics.ts` | 18 | types only |
| `maya-wallet/src/services/notifications.ts` | 9 | `notify*` helpers + queries |
| `maya-wallet/src/services/contacts.ts` | 10 | CRUD, page is read-only |
| `maya-wallet/src/services/pallets/identity.ts` | 6 | KYC registration |
| `blue-hole-portal/src/services/monitoring.ts` | 7 | incl. `monitoringService` itself |
| `blue-hole-portal/src/lib/blockchain/hooks.ts` | 6 | `useChainInfo`, `useStorage`, … |
| `maya-wallet/src/hooks/useBlockchainEvents.ts` | 7 | 6 hooks referenced only by the dead `useAllEventsSubscription` composite, plus the composite itself |

---

## 5. Flagged but NOT changed — and why

### 5.1 `layout.tsx` empty catches are correct

```js
navigator.serviceWorker.getRegistrations().then(…).catch(function() {});
caches.keys().then(…).catch(function() {});
```

Inline boot script, best-effort SW/cache cleanup. There is no user-facing surface to
report to, and an unhandled rejection in a page boot script would be worse than silence.
Left as written.

### 5.2 `useGovernanceProposalsSubscription`'s bare catch is documented intent

```ts
} catch {
  // Keep last successful snapshot on transient errors.
}
```

A polling hook that deliberately retains the previous good value. The comment states the
intent; this is not the §3.1 pattern. Left.

### 5.3 The `TODO` hits are phone-number placeholders

Both are `placeholder="+501 XXX-XXXX"` — the `XXX` is a phone format mask, not a marker.
The scan's `\bXXX\b` rule cannot tell them apart. Zero real TODO/FIXME/HACK markers in
shipped code.

### 5.4 The `.then()` "unhandled rejection" candidates are mostly the React pattern

55 sites were flagged by a "no `.catch()` within 12 lines" heuristic. Almost all are:

```ts
useEffect(() => { Promise.resolve().then(() => { … }); }, []);
```

— the standard way to run async work in an effect without making the callback `async`.
The heuristic cannot see a `try`/`catch` inside the called function, so it over-reports.
**Not a defect class, and not mass-edited.** Treat as a lead, not a finding.

### 5.5 The three `eslint-disable` comments

| Site | Verdict |
|---|---|
| `staking/page.tsx:64` `react-hooks/exhaustive-deps` | conventional and deliberate |
| `blue-hole-portal/lib/utils.ts:49` `no-control-regex` | deliberate — the regex intentionally matches control characters |
| `components/community/LeaderboardCard.tsx:21` `no-var-requires` | **was hiding the broken `require` in §3.2** — removed with the file |

### 5.6 `console.log` left in place

55 `log`/`debug`/`info` calls spread over ~15 files, the largest being
`bluetooth-mesh.service.ts` (9), `blue-hole-portal/lib/blockchain/connection.ts` (7) and
`pakit-bridge.service.ts` (6). They are noise in a production console, but they are not
defects: no behaviour depends on them, and the three biggest clusters are in services
(mesh radio, chain connection, storage bridge) where field diagnostics have real value.
Removing them is cosmetic churn across 15 files, so it is reported rather than done.
`shared/src/utils/logger.ts` matched too — that one is the logger's own sink, which is
correct.

### 5.7 The 378 `any`

Almost all are `as any` on polkadot-js results and `(raw: any)` in mapping callbacks —
the boundary where untyped chain data enters the app. Removing them properly means typing
every pallet response, which is a project with its own verification burden, not a
cleanup. Recorded as a metric. `tsc` is clean at `strict: true` today because of them, not
in spite of them — this is the known cost of the chain boundary.

---

## 6. Verification

| Gate | Result |
|---|---|
| `tsc --noEmit` — `maya-wallet` (after deletion) | **OK** |
| `next build` — `maya-wallet` (after deletion) | **OK** |
| `tsc --noEmit` — `shared` / `blue-hole-portal` | 0 errors (unchanged) |
| `next build` — `blue-hole-portal` | exit 0, all routes dynamic |
| `npx vitest run` — root | 3 files, **14 passed, 1 skipped** |
| `eslint` — `maya-wallet` | 0 errors, **296** warnings *(was 305 — the two deleted components carried warnings of their own)* |
| `eslint` — `blue-hole-portal` | 0 errors, **149** warnings = baseline |
| `eslint` — `shared` | 0 errors, **17** warnings |
| `check-doc-claims.sh ui` | **PASSED** |

Deleting the two components is verified by the build, not by the grep alone: `tsc` fails
on any surviving import of a deleted module.

---

## 7. Auditor's notes

1. **The one real defect was inside dead code.** The broken `require` in §3.2 could never
   fire, because `LeaderboardCard` was never rendered. Its value is as a specimen: a
   comment asserting a falsehood, an `eslint-disable` suppressing the one rule that would
   have caught it, and an empty-adjacent `catch` hiding the failure. All three mechanisms
   worked together to keep a mistake invisible. That is the pattern to watch for.

2. **The scan over-reports by a factor of roughly five on `.then()`.** 55 flagged, and
   reading them showed the React effect pattern. Heuristics that cannot see inside a
   called function will always do this; the remedy is reading, not a better regex.

3. **"Unused" is not "dead" in a published package.** `shared`'s 9 unused exports are
   shipped API. This is the same distinction that kept `logging.ts` alive in
   AUDIT-UI-00 before the exports map was understood — and that turned out to be the
   wrong call for the right reason: the file was only "used" by a broken declaration.
   Here the check is explicit: `private` is unset in `shared`, so its surface is real.

4. **The dead-export inventory is the deliverable, not the deletions.** 56 dead exports in
   two apps is a real finding, but most are coherent feature code awaiting wiring. The
   listing in §4.1 tells the next person exactly where the decision points are.
