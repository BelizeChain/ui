# AUDIT-UI-02 — Dependency Hygiene & the `shared` Exports Map

| Field | Value |
|---|---|
| **Audit ID** | AUDIT-UI-02 |
| **Scope** | All four `package.json` manifests, `package-lock.json`, and the `shared` package exports map |
| **Date** | 2026-10-15 → 2026-10-16 |
| **Status** | **COMPLETE** — 44 unused entries removed, 5 phantom dependencies declared, 10 dead exports dropped, 1 phantom module deleted |
| **Method** | Per-package import extraction cross-checked against that package's own manifest, then empirical removal: `npm install`, `tsc`, both production builds |

---

## 1. Why this audit exists

Three separate problems, all invisible to the build:

**1. Orphaned dependencies.** AUDIT-UI-00 deleted 40 unreachable files. Every package
those files imported became a dependency with zero remaining importers.

**2. A declared API that was never built.** `shared/package.json` advertised **11**
export subpaths:

```json
"./components": "./dist/components/index.js",
"./styles":     "./dist/styles/index.js",
"./hooks":      "./dist/hooks/index.js",
"./utils":      "./dist/utils/index.js",
"./utils/logging": "./dist/utils/logging.js",
"./utils/logger":  "./dist/utils/logger.js",
"./api/pakit-client":  "./dist/api/pakit-client.js",
"./api/nawal-client":  "./dist/api/nawal-client.js",
"./api/kinich-client": "./dist/api/kinich-client.js",
"./blockchain": "./dist/blockchain/index.js"
```

`tsup.config.ts` has a single entry (`src/index.ts`), so **`dist/` contains only
`index.*`.** Ten of the eleven subpaths pointed at files that are never emitted, and
three (`./hooks`, `./utils`, `./blockchain`) had no source file either. Importing any of
them fails to resolve — the declared API was fiction.

**3. Phantom dependencies.** Packages importing modules they never declared. These work
*today* because npm hoists the package to the root `node_modules` as some other
package's transitive dependency — and break the moment that parent drops it. A phantom
is a time bomb, not a warning.

---

## 2. Method

For each package: extract every bare module specifier from its own source, and check it
against **its own** `dependencies` + `devDependencies` + `peerDependencies`. Checking at
the workspace root would hide phantoms, because hoisting makes them resolve — the check
has to be per-manifest, not repo-wide.

**Scanned:** `src/**`, `tests/**`, `scripts/**`, and root config files (`*.config.*`,
`tailwind.config.js`, `postcss.config.js`).

**Deliberately excluded:** `dist/` — built output references every transitive type it
re-exports, which pollutes the result with false "used" signals.

### 2.1 False positives found and eliminated

**`dist/` pollution.** The first pass reported a dozen dependencies as "used" purely
because a bundled `.d.ts` mentioned them. Excluding `dist/` removed the class.

**Comments that name a removed API.** A comment documenting *why* a dependency was
dropped (e.g. the note explaining that `require('node-fetch')` was removed) matched the
import regex and was reported as a live import. This is the same class recorded in
AUDIT-UI-01 §6.2 — and it is a **false positive that grows over time**, because such
comments are exactly what should be kept.

Fixed by stripping block and line comments before matching (`(?<!:)//` so a URL is not
truncated mid-line). The stripper was then **validated by diffing the raw and stripped
results** — it removed exactly five matches across the whole repo:

| Removed match | Where | What it actually was |
|---|---|---|
| `node-fetch` | `shared/scripts/test_civic_flow.js` | a comment explaining its removal |
| `tailwindcss` ×2 | `shared/tailwind.config.js` | `/** @type {import('tailwindcss').Config} */` |
| `next` | `maya-wallet/next.config.js` | `/** @type {import('next').NextConfig} */` |
| `tailwindcss` ×2 | `maya-wallet/tailwind.config.js` | same JSDoc type annotation |
| `next` | `blue-hole-portal/next.config.js` | same JSDoc type annotation |

**All five are JSDoc `@type` annotations or a comment — zero real imports were hidden.**

**`vitest` reported undeclared in all three packages.** Investigated rather than
"fixed" — see §3.4. It is correct as configured.

---

## 3. Changes

### 3.1 Removed — 44 dependency entries

Computed from `git diff` against `HEAD`, not counted by hand:

| Package | Removed | Added |
|---|---|---|
| `shared` | 8 | 1 |
| `maya-wallet` | 20 | 0 |
| `blue-hole-portal` | 16 | 4 |
| **Total** | **44** | **5** |

<details>
<summary>Full removal list</summary>

**`shared` (8):** `@polkadot/api-contract`, `@polkadot/types-codec`,
`@radix-ui/react-dialog`, `@radix-ui/react-progress`, `@radix-ui/react-slot`,
`@radix-ui/react-tabs`, `class-variance-authority`, `framer-motion`

**`maya-wallet` (20):** `@ducanh2912/next-pwa`, `@polkadot/extension-inject`,
`@polkadot/keyring`, `@polkadot/types`, `@radix-ui/react-alert-dialog`,
`@radix-ui/react-checkbox`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`,
`@radix-ui/react-popover`, `@radix-ui/react-radio-group`, `@radix-ui/react-select`,
`@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-switch`,
`@radix-ui/react-tooltip`, `@zxing/browser`, `@zxing/library`, `cmdk`, `concurrently`,
`tsup`

**`blue-hole-portal` (16):** `@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`,
`@radix-ui/react-switch`, `@radix-ui/react-toast`, `@tanstack/react-table`, `date-fns`,
`jspdf`, `jspdf-autotable`, `react-hook-form`, `react-window`, `tsup`,
`@testing-library/jest-dom`, `@testing-library/react`, `@types/react-window`, `jest`,
`jest-environment-jsdom`

</details>

`tsup` was declared in all three packages but is the **build tool of `shared` only** —
the two Next.js apps build with `next build`.

### 3.2 Deleted — `shared/src/utils/logging.ts`

A four-line re-export of `./logger`. Its **only** consumer in the entire repo was the
broken `"./utils/logging"` exports entry — no code imported it. Once the exports map was
trimmed it had zero importers by any measure.

### 3.3 Declared — 5 phantom dependencies

Imported by real code, declared by nobody:

| Phantom | Package | Actually needed by |
|---|---|---|
| `@radix-ui/react-avatar` | `blue-hole-portal` | components using Avatar |
| `lucide-react` | `blue-hole-portal` | icon imports |
| `tailwindcss-animate` | `blue-hole-portal` | `tailwind.config.js:167` |
| `@playwright/test` | `blue-hole-portal` | its own `test:e2e` script + `playwright.config.ts` |
| `@polkadot/keyring` | `shared` | `scripts/test_civic_flow.js` (devDependency — script only) |

Each was verified to have a real consumer before being declared. `@playwright/test` in
particular was checked against `blue-hole-portal/tests/e2e/01-dashboard.spec.ts` and
`playwright.config.ts` — the script would have failed on a clean checkout.

### 3.4 The exports map — 11 subpaths → 1

Every subpath was checked for importers before removal. **Nothing imports them** — both
apps import the bare root (`from '@belizechain/shared'`), and
`shared/src/index.ts` already re-exports the components, styles, API clients and logger
that the subpaths advertised. The remaining subpaths were redundant *and* non-functional.

The map is now just the root entry. `npm run build --workspace=shared` confirms `dist/`
contains only `index.{js,mjs,d.ts,d.mts}` and their maps.

### 3.5 Scripts corrected — the jest stack was dead

`blue-hole-portal`'s `test` script ran **`jest`**, but:

- no jest config exists anywhere in the package,
- its only test file (`src/lib/utils.test.ts`) imports from **`vitest`**,
- and after §3.1 the jest packages are gone.

| Script | Before | After |
|---|---|---|
| `test` | `jest` | `vitest run --dir src` |
| `test:watch` | `jest --watch` | `vitest --dir src` |

`--dir src` is load-bearing: without it vitest's default include picks up
`tests/e2e/01-dashboard.spec.ts`, which fails with *"Playwright Test did not expect
test.describe() to be called here"* — reproduced during this audit. The root
`vitest.config.ts` already scopes its `include` to `*/src/**/*.test.ts` for the same
reason; the package script now matches that intent.

### 3.6 What was deliberately NOT changed

**`vitest` is not declared in any package — and that is correct.** The scanner flags it,
but it is a false positive: the dependency is **root-owned and CI-backed**.

- Root `package.json` declares `vitest: 5.0.3` and exposes `test:unit: vitest run`.
- CI **never** runs the package `test` scripts for unit tests. It calls the root script
  with a path filter:

  | Workflow | Line | Command |
  |---|---|---|
  | `blue-hole-portal.yml` | 103 | `npm run test:unit --workspaces=false -- blue-hole-portal/` |
  | `maya-wallet.yml` | 115 | `npm run test:unit --workspaces=false -- maya-wallet/` |
  | `shared-library.yml` | 87 | `npm run test:unit --workspaces=false -- shared/` |

  Declaring vitest three more times would create three more places to bump one version.

**`maya-wallet`'s `test: playwright test` is deliberate** — also CI-backed
(`maya-wallet.yml` installs chromium at line 106 and runs the suite at line 121). It is
a different convention from the portal's `test`, but it is an intentional one and was
left alone.

---

## 4. Verification

Every gate re-run after the changes, on the working tree:

| Gate | Result |
|---|---|
| `npm ls --depth=0` | valid tree; 2 `extraneous` entries (§5) |
| `tsc --noEmit` — `shared` | **0 errors** |
| `tsc --noEmit` — `maya-wallet` | **0 errors** |
| `tsc --noEmit` — `blue-hole-portal` | **0 errors** |
| `npm test` — `blue-hole-portal` | 1 file, **3 tests passed** (previously failed) |
| `npx vitest run` — root | 3 files, **14 passed, 1 skipped** = baseline |
| `npm run build` — `shared` | success; `dist/` = `index.*` only |
| `npm run build` — `blue-hole-portal` | **exit 0**, all routes `ƒ (Dynamic)` |
| `npm run build` — `maya-wallet` | **exit 0**, all routes `ƒ (Dynamic)` |
| `eslint` — `maya-wallet` | 0 errors, **305** warnings = baseline |
| `eslint` — `blue-hole-portal` | 0 errors, **149** warnings = baseline |
| `eslint` — `shared` | 0 errors, **17** warnings |
| Phantom scan | **3 remaining, all `vitest`** — root-owned, §3.6 |
| `check-doc-claims.sh ui` | **PASSED** (exit 0) |

The lockfile shrank by **529 packages** in the prune.

---

## 5. Open items

| Item | Detail |
|---|---|
| `shared/tailwind.config.js:1` | `/** @type {import('tailwindcss').Config} */` references a package `shared` does not declare. Inert (JSDoc only, file is not type-checked) and resolves via hoisting. Not worth a declaration for a type annotation. |
| Root `test-e2e.js` | Imports `@polkadot/api`, which the root manifest does not declare — works via hoisting. The root is private and the script is unreferenced by any npm script or workflow. |
| `shared/scripts/test_civic_flow.js` | A manual integration harness, unreferenced by package.json or CI. Kept (it is a runnable dev tool), but nothing invokes it. |
| 2 `extraneous` packages | `@emnapi/runtime`, `@img/sharp-wasm32` — both **present in `package-lock.json`**; sharp/Next.js optional-dependency artifacts. Unrelated to this change. |
| `maya-wallet/UI_AUDIT_2026-01-29.md` | Claimed the `shared/api/*-client` subpaths were "✅ Wired"; they never resolved. Correction banner added. |
| `ui-docs-archive/` | `WIRING_PROGRESS.md` / `WIRING_GUIDE.md` still name the removed subpaths. It is an archive; left as historical record. |

---

## 6. Auditor's notes

1. **The exports map was the real find.** 44 orphaned dependencies are bookkeeping. A
   package advertising a public API it does not build is a correctness problem — and it
   had already produced a false "✅ Wired" claim in a committed audit document
   (§5). The declared surface is now the actual surface.

2. **The `vitest` finding is the one to remember.** The tool was right that nothing
   declares it, and wrong that anything is broken. Three greps of the workflows settled
   it. Declaring it per-package would have been a plausible, tidy-looking "fix" that
   added three redundant version pins and contradicted how CI actually runs tests.

3. **The comment-stripper is validated, not assumed.** It was checked by diffing raw
   against stripped output across the whole repo and confirming all five removed matches
   were JSDoc annotations. A scanner that silently drops a real import would be worse
   than no scanner.

4. **The portal's test script was fixed twice.** Changing `jest` → `vitest run` made the
   script runnable but still failing, because it pulled in a Playwright spec. The first
   fix was found by running the script — the root `vitest run` passed the whole time and
   would never have revealed it.
