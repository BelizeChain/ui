# AUDIT-UI-00 — Baseline, Dead Code & Orphan Removal

| Field | Value |
|---|---|
| **Audit ID** | AUDIT-UI-00 |
| **Scope** | `maya-wallet`, `blue-hole-portal`, `shared` — build health, unreachable code, orphaned dependencies |
| **Date** | 2026-10-15 |
| **Status** | **COMPLETE** — 40 unreachable files removed, 8 orphaned deps identified, baseline green |
| **Method** | Import-graph analysis, then empirical deletion: files removed, `tsc --noEmit` and `next build` re-run for all three packages |

---

## 1. Baseline (all green, pre-change)

| Gate | Result |
|---|---|
| `tsc --noEmit` — `shared` | **0 errors** |
| `tsc --noEmit` — `maya-wallet` | **0 errors** |
| `tsc --noEmit` — `blue-hole-portal` | **0 errors** |
| `eslint` — `shared` | 0 errors, 17 warnings |
| `eslint` — `maya-wallet` | 0 errors, 361 warnings |
| `eslint` — `blue-hole-portal` | 0 errors, 196 warnings |
| `vitest run` | 3 files, 14 passed, 1 skipped |

**Total: 0 errors, 574 warnings.** The warnings are dominated by
`@typescript-eslint/no-explicit-any`. That is a code-quality metric, not a defect
count, and is reported as such.

### Scale

| Package | Pages | API routes | Components |
|---|---|---|---|
| `maya-wallet` | 68 | 4 | 36 |
| `blue-hole-portal` | 21 | 4 | 26 |
| `shared` | — | — | 18 |
| **Total** | **89** | 8 | **80** |

285 source files / ~76,300 LOC across the three packages.

---

## 2. Dead code — 40 files removed

An import-graph scan resolved every internal specifier (`@/…`, `@belizechain/shared/…`,
relative) and listed files with no inbound edge. Two independent passes were needed:

- **Pass 1 returned 34 candidates — it was wrong.** It resolved `@/` against all three
  packages in order, so a portal file importing `@/lib/auth/session` could falsely
  resolve to **maya-wallet's** copy.
- **Pass 2 (authoritative)** scoped `@/` to the importing file's own package. Result: 30
  orphans, with only 2 unresolvable specifiers.

Every candidate was then verified three ways before deletion:

1. **Strict specifier check** — only real `import`/`require`/dynamic-import strings that
   could resolve to the file, package-corrected.
2. **Empirical quarantine** — all files moved out of the tree, then
   `tsc --noEmit` (×3) and `next build` (×2) re-run. All passed.
3. **Transitive check** — a `ui/index.ts` barrel was found **shadowed** by a sibling
   `ui.tsx` (module resolution prefers the file), making its 12 children unreachable too.

### 2.1 Two candidates were NOT dead — kept, with reasons

| File | Why it was kept |
|---|---|
| `shared/src/utils/logging.ts` | 92-byte re-export shim. `shared` is **not** `private`, and its `package.json` `exports` map explicitly declares `"./utils/logging"`. An export entry that names a file is a declaration of public API; deleting the file would fix the wrong end. The **build** is what doesn't produce it — see §5. |
| `maya-wallet/src/types/mesh.d.ts` | Uses `export`, so it is a module, not ambient — but `app/mesh/page.tsx` imports `@/types/mesh`. It was missed by the scanner because `.d.ts` was absent from its extension list. |

**A third false positive was caught and discarded:** `blue-hole-portal/src/components/`
`ErrorBoundary.tsx` was flagged "REFERENCED" by a repo-wide text search, because
`maya-wallet/src/app/providers.tsx` imports `@/components/ErrorBoundary` — which resolves
to **maya-wallet's own** file. Portal's copy is genuinely unreachable.

### 2.2 Removed (40)

**`blue-hole-portal` (7)** — `components/Dashboard.tsx` (2,491 lines), `ErrorBoundary.tsx`,
`LoadingStates.tsx`, `Pagination.tsx`, `SearchFilter.tsx`, `services/fsc-exporter.ts`,
`services/pallets/index.ts`

**`maya-wallet` (21)** — `components/`: `CommentsModal`, `CreatePostModal`, `HomeScreen`,
`I18nProvider`, `QRScanner`, `TransactionConfirmation`, `WelcomeScreen`,
`community/ProposalsPage`, `dashboard/DashboardHome`, `trade/TradingChartCanvas`.
`services/`: `currency`, `events`, `messaging`, `notes`, `qrcode`, `recurring`, `theme`,
`pallets/mesh-gateway-onboarding`. Plus `styles/design-tokens.ts`.

**`shared` (12)** — `components/ui/` barrel + `asset-card`, `avatar`, `badge-display`,
`button`, `card`, `dialog`, `glass-card`, `post-card`, `progress`, `proposal-card`,
`stat-card`, `tabs`.

The `shared/src/components/ui/` directory was a legacy duplicate set: `components/index.ts`
labels the single-file `ui.tsx` as **"PRIMARY"**, and `ui.tsx` shadows the directory's
`index.ts` in module resolution. All 12 were duplicated in **both** apps' own
`components/ui/`, so nothing was lost.

### 2.3 Orphaned dependencies (identified; `package.json` not yet changed)

These had **zero** importers once the removed files were excluded — verified against
`src`, tests, configs and scripts:

| Dependency | Declared in | Sole user (now removed) |
|---|---|---|
| `jspdf` | `blue-hole-portal` | `services/fsc-exporter.ts` |
| `@zxing/browser` | `maya-wallet` | `components/QRScanner.tsx` |
| `@polkadot/types-codec` | `shared` | removed scan path |
| `@radix-ui/react-dialog` | `shared` | `components/ui/dialog.tsx` |
| `@radix-ui/react-progress` | `shared` | `components/ui/progress.tsx` |
| `@radix-ui/react-tabs` | `shared` | `components/ui/tabs.tsx` |
| `@radix-ui/react-slot` | `shared` | `components/ui/button.tsx` |
| `class-variance-authority` | `shared` | `components/ui/*` |

**Not yet removed** — a dependency change requires a lockfile update and a rebuild, and
was deliberately left out of this pass so the deletion stays independently verifiable.
`clsx` was checked and **is** still used (`components/ui.tsx`, `styles/index.ts`).

---

## 3. Post-change verification

| Gate | Before | After |
|---|---|---|
| `tsc --noEmit` × 3 packages | 0 errors | **0 errors** |
| `next build` × 2 apps | exit 0 | **exit 0** — all routes still `ƒ (Dynamic)` |
| `tsup` build — `shared` | exit 0 | **exit 0** |
| `vitest run` | 14 passed, 1 skipped | **14 passed, 1 skipped** |
| `eslint` — `maya-wallet` | 361 warnings | **306** |
| `eslint` — `blue-hole-portal` | 196 warnings | **149** |

Warnings fell by 102 as a side effect of removing unreachable code. Errors remain 0.

---

## 4. Method notes — four false findings caught before they were written

This audit nearly produced four wrong findings. Each is recorded because the pattern is
repeatable:

1. **Truncated grep hides the disproving line.** `grep … | head -6` cut off
   `maya-wallet/src/app/layout.tsx:39`, making `force-dynamic` look absent. It is present,
   with a full explanatory comment. **A grep that shows absence is not evidence of
   absence.**
2. **Text-search false positive.** A repo-wide search for `@/components/ErrorBoundary`
   matched, but the importer was in another package where `@/` resolves elsewhere.
3. **Alias collision.** The first scanner resolved `@/` across all packages, producing 34
   false orphans instead of 30.
4. **Bash `while read` skips a final line without a trailing newline.** `logging.ts` was
   silently skipped by both the quarantine loop *and* the "still present?" check, which
   used the same construct. Caught only by reconciling counts (28 vs 29).

---

## 5. Open item — `shared`'s `exports` map is broken

`shared/tsup.config.ts` declares `entry: ['src/index.ts']`, so `dist/` contains only
`index.js`, `index.mjs` and the `.d.ts` pair. But `shared/package.json` declares **11**
export paths. **10 of them point at files that are never built:**

```
OK       .                    -> ./dist/index.js
MISSING  ./components         -> ./dist/components/index.js
MISSING  ./styles             -> ./dist/styles/index.js
MISSING  ./hooks              -> ./dist/hooks/index.js
MISSING  ./utils              -> ./dist/utils/index.js
MISSING  ./utils/logging      -> ./dist/utils/logging.js
MISSING  ./utils/logger       -> ./dist/utils/logger.js
MISSING  ./api/pakit-client   -> ./dist/api/pakit-client.js
MISSING  ./api/nawal-client   -> ./dist/api/nawal-client.js
MISSING  ./api/kinich-client  -> ./dist/api/kinich-client.js
MISSING  ./blockchain         -> ./dist/blockchain/index.js
```

Nothing breaks today because both apps import the bare `@belizechain/shared` root. The
declared subpath API is nevertheless false. **Not fixed here** — it needs a decision about
which subpaths are intended, then either `tsup` entry points or a corrected `exports` map.
This is also why `utils/logging.ts` was kept rather than deleted.

---

## 6. Not yet done

| Item | Audit |
|---|---|
| Cross-check all 39 `api.query.*` / `api.tx.*` pallet references against runtime source | `AUDIT-UI-01` (planned) |
| `any` reduction (426 occurrences), 59 `console.log` | `AUDIT-UI-03` (planned) |
| Remaining stale doc references to removed files (`PROJECT_STRUCTURE.md`, `maya-wallet/src/services/README.md`, `INTEGRATION_GUIDE.md`) | tracked |
| Playwright e2e suites and the 34 proptest/fuzz harnesses — **not run** in this pass | unverified |

**Sections deliberately left alone:** `ui-docs-archive/` and `docs/archive/` are
explicitly historical. They now reference removed files, which is expected of an archive
and is preferable to rewriting history.

---

*End of AUDIT-UI-00.*
