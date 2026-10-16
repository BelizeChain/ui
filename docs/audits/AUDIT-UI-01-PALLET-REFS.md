# AUDIT-UI-01 — Runtime Pallet Reference Cross-Check

| Field | Value |
|---|---|
| **Audit ID** | AUDIT-UI-01 |
| **Scope** | Every `api.query.*`, `api.tx.*`, `api.rpc.*` reference across `maya-wallet`, `blue-hole-portal`, `shared` |
| **Date** | 2026-10-15 → 2026-10-16 |
| **Status** | **COMPLETE** — 3 wrong references fixed, 1 unreachable script removed, 0 known-bad references remain |
| **Method** | Machine cross-check of every call site against the resolved Rust source of each pallet; result validated by re-running the TypeScript build |

---

## 1. Why this audit exists

The UI calls the chain through polkadot-js by string name:

```ts
api.query.bns.hostedWebsites(name)   // ← a string. Nothing type-checks it.
api.tx.balances.transferAllowDeath(dest, amount)
```

None of these are type-checked at build time. `api.query.bns.hostingConfigs` compiles
perfectly and returns `undefined` at runtime. `tsc` cannot help; `next build` cannot
help. The only way to know a call is real is to compare it against the Rust source of
the pallet that actually executes it.

That is what this audit did — for every reference in the three packages.

---

## 2. Method

### Runtime surface (what the chain *can* answer)

Extracted from `belizechain/runtime/src/lib.rs` `construct_runtime!`: **35 pallets**.

| Source | Count | Resolved to |
|---|---|---|
| Belize pallets | 19 | `belizechain/pallets/<name>/src/lib.rs` |
| Polkadot SDK pallets | 16 | vendored git checkout under `~/.cargo/git/checkouts/polkadot-sdk-*/` |
| Registry crates | 0 | — |
| **Unresolved** | **0** | — |

The SDK path is taken from `Cargo.lock` by **exact version** (see §4.5) — not from
whatever crate happens to be newest in the local registry.

### Call sites (what the UI *actually* calls)

Scanned all `.ts`/`.tsx` across the three packages, excluding `node_modules` and
`.next`:

**365 call sites → 138 distinct `(namespace, pallet, item)` tuples.**

| Namespace | Sites |
|---|---|
| `query` | 230 |
| `rpc` | 65 |
| `tx` | 70 |

### Name matching

polkadot-js exposes Rust `snake_case` as `camelCase`. A matching step is therefore
unavoidable — and getting it wrong produces both false positives and false negatives
(§4.3). The audit uses a faithful port of polkadot-js's `stringToCamelCase`, verified
in §4.3.

---

## 3. Result

```
SUMMARY: 121 ok, 0 bad-pallet, 2 bad-item  (of 138 distinct tuples)
```

| Bucket | Count | Meaning |
|---|---|---|
| **ok** | 121 | Reference resolves on the real pallet |
| **bad-pallet** | **0** | No reference names a pallet that doesn't exist |
| **bad-item** | 2 | Neither is a defect — both are comments (§5) |
| Pallet ref, no item | 8 | All legitimate existence guards / optional chaining (§6) |
| RPC methods | 15 | Informational; `api.rpc.*` is node-provided, not pallet storage |

**The headline number is `bad-pallet: 0`.** No UI code calls a pallet that isn't in
the runtime.

---

## 4. False-positive classes found and eliminated

Six. Each one is recorded because each one *nearly* produced a wrong conclusion, and
the class — not the instance — is the reusable lesson.

### 4.1 The regex only matched `pallet_*`-prefixed aliases

The runtime names some pallets without the prefix (`frame_system` → `System`). The
first extractor skipped them silently. Fixed by reading the alias from
`construct_runtime!` rather than pattern-matching the type path.

### 4.2 A truncated command hid the forcing line

`| head -120` cut the output before the line that disproved the hypothesis. This is
the fourth time in this audit series that a truncating pipe produced a false absence.
**A grep that shows nothing is not evidence of nothing.**

### 4.3 snake_case vs camelCase — all 48 `tx` hits were false positives

The first comparison lowercased both sides. Rust calls are `snake_case`; polkadot-js
exposes `camelCase`. So `batch_all` compared against `batchall` — never equal.

The fix was not "lowercase harder". It was a faithful port of polkadot-js's actual
`stringToCamelCase`, **validated against the real library across 629 real names** —
identical output on every one.

Outcome: the 48 flagged `tx` references were all real; the comparison had been wrong,
not the code.

**Near-miss avoided:** two storage reads looked wrong under manual inspection —
`bbzdBalances` and `lpBalances`. Rather than "fix" them, the transform was tested
directly:

```
stringCamelCase('BBZDBalances')  →  bbzdBalances   ✓
stringCamelCase('LPBalances')    →  lpBalances     ✓
```

**Both were correct as written.** Manual assumption was wrong; the code was right.
Editing them would have broken two working reads and called it a fix.

### 4.4 Wrong `pallet-balances` resolved

Two versions exist locally (registry 33, git 51). The resolver initially picked the
registry copy — a *different* pallet with a different extrinsic set. Fixed by
resolving from `Cargo.lock` by exact version.

### 4.5 `Cargo.lock` hyphen vs Rust underscore

`Cargo.lock` names crates `pallet-balances`; Rust refers to them `pallet_balances`.
A one-character mismatch, and the lookup silently fell through to the registry —
reintroducing §4.4. Fixed by normalising both sides.

### 4.6 "Referenced" across package boundaries

A repo-wide text search reports a file as referenced even when the importer is in a
*different* package, where `@/` resolves somewhere else entirely. Import resolution
must be scoped to the importing file's own package.

---

## 5. The 3 real fixes

### 5.1 `blue-hole-portal/src/app/developer/page.tsx` — `transfer` does not exist

```diff
-const transfer = api.tx.balances.transfer(dest, 1000000000000);
+const transfer = api.tx.balances.transferAllowDeath(dest, 1000000000000);
```

The code sample told developers to call an extrinsic that **is not in the runtime**.

Verified against the pinned SDK rev (`660acefe`, stable2606),
`substrate/frame/balances/src/lib.rs`:

```
649:  pub fn transfer_allow_death(
683:  pub fn transfer_keep_alive(
710:  pub fn transfer_all(

grep -c 'pub fn transfer(' → 0
```

`transfer` was removed from `pallet-balances`; `transfer_allow_death` is its
replacement. A developer copying that sample got an unresolvable extrinsic.

### 5.2 `maya-wallet/src/app/domains/page.tsx` — wrong storage item

```diff
-const hostingInfo = await api.query.bns.hostingConfigs(domainName);
+const hostingInfo = await api.query.bns.hostedWebsites(domainName);
```

`pallet-bns` has no `HostingConfigs`. Its storage items are:
`DomainRegistry`, `AccountDomains`, `DomainResolution`, `PrimaryDomain`,
`DomainListings`, **`HostedWebsites`**, `ExternalDomains`, `DomainVerification`,
`SSLCertificates`, `TotalDomains`, `TotalHostingRevenue`, `TotalMarketplaceRevenue`,
`ContentHistory`, `CurrentContentVersion`.

`HostedWebsites` carries the fields the page needs (`contentHash`, `expiresAt`) and
shares the same key type, so the read is a straight rename — behaviour unchanged,
`undefined` removed.

### 5.3 `shared/src/utils/fee-estimator.ts` — doc example

Two occurrences in the JSDoc `@param` and `@example` block replaced with
`transferAllowDeath`. Documentation only — no runtime effect — but it is the sample
developers copy, which is exactly how §5.1 propagated.

---

## 6. Deliberate removals and non-fixes

### 6.1 `maya-wallet/tests/seed-local.ts` — DELETED

An unreferenced dev script. Verified before deletion:

- No reference in any `package.json`, `.ts`, `.js`, `.sh`, or workflow file (grep, all
  extensions, whole repo).
- `tests/` is not in `maya-wallet/tsconfig.json`'s `include`.
- The file was Polkadot-tutorial boilerplate written against `pallet-sudo` and
  `pallet-template` — **neither is in this runtime**. Its proposal call also requires a
  compliance-verified (KYC) account, which the tutorial code does not establish.

It could not be repaired into something true, so it was removed rather than left as a
script that cannot run. The remaining `tests/` directory is coherent: `README.md`,
`e2e/`, `fixtures/`, `integration/`, `integration-fixtures.ts`.

### 6.2 Both remaining `bad-item` results are comments

**`maya-wallet/src/services/pallets/community.ts:697`** — the comment documents the
opposite of a defect:

> `calculate_effective_fee` is a Rust trait method, not storage — the old
> `api.query.community.calculateEffectiveFee(...)` call could never resolve.

A previous bug, already fixed, with the reason recorded.

**`maya-wallet/src/services/gem.ts:16`** — the comment warns developers away from the
wrong API:

> Uses `@polkadot/api-contract` (the only correct way to call an ink! contract via
> pallet-contracts) — not `api.query.contracts.call`, which does not exist.

`maya-wallet/src/services/pallets/index.ts:86` carries the same note. Comments that
name a removed API are the reason the removal stays removed.

### 6.3 The 8 "pallet referenced with no item" results are correct code

Each is an existence guard or optional chain — the defensive pattern that makes a
UI survive a runtime upgrade:

```ts
if (!api.query.belizeJustice) return defaultStatus;          // guard
const registry = (this.api.query.mesh as any)?.emergencyAuthorities;  // optional chain
api.query.governance?.proposals(proposalId, () => {...});    // optional chain
```

These are the opposite of the defects this audit hunted. Left alone.

### 6.4 Flagged, NOT fixed — `toJSON() as string[]` in `domains/page.tsx`

```ts
const recordData = record.toJSON() as any;
```

The page decodes its domain list through a cast that the file's own comment admits is
unverified. It is **not** changed here: the correct decode depends on how
`DomainRegistry` actually serialises, and guessing would replace an admitted unknown
with a confident wrong answer. Recorded as an open item (see §8).

---

## 7. Verification

Re-run after all fixes, on the committed working tree:

| Gate | Result |
|---|---|
| `tsc --noEmit` — `shared` | **0 errors** |
| `tsc --noEmit` — `maya-wallet` | **0 errors** |
| `tsc --noEmit` — `blue-hole-portal` | **0 errors** |
| `next build` — `blue-hole-portal` | **exit 0**, all routes `ƒ (Dynamic)` |
| `next build` — `maya-wallet` | **exit 0**, all routes `ƒ (Dynamic)` |
| `eslint` — `maya-wallet` | 0 errors, 305 warnings |
| `eslint` — `blue-hole-portal` | 0 errors, 149 warnings |
| `vitest run` | 3 files, **14 passed, 1 skipped** |
| `check-doc-claims.sh ui` | **PASSED** (exit 0) |

Test count and warning counts match the AUDIT-UI-00 baseline exactly — the fixes
changed no behaviour.

Re-running the cross-check tool on the fixed tree gives the same
`121 ok, 0 bad-pallet, 2 bad-item` — both remaining items being the §6.2 comments.

---

## 8. Open items

| Item | Why it is not fixed here |
|---|---|
| `domains/page.tsx` `toJSON() as string[]` decode | Needs verification of how `DomainRegistry` serialises. Guessing replaces a known unknown with an unknown error. |
| `bns/page.tsx` hardcoded 5:1 DALLA→bBZD rate | See §8.1. Four sites; contradicts the file's own comment. Needs the `pallet-oracle` rate, not a guess. |
| `bns/page.tsx:268-270` local price computation | Derives domain price from name length (10 / 20 / 50 Ɗ) rather than reading it from `pallet-bns`. Needs the real pallet fee. |
| 8 orphaned dependencies | Identified in AUDIT-UI-00; removal needs a lockfile update and rebuild. |

### 8.1 `bns/page.tsx` assumes a DALLA/bBZD rate it says it does not

The file contradicts itself inside one module.

The `MarketListing` interface is explicit:

```ts
/** Only set when the listing is actually priced in bBZD. No DALLA/bBZD rate is assumed. */
priceBBZD?: number;
```

And then the same file multiplies by **5** in three places and labels the result
"Pegged Equivalent":

| Line | Code |
|---|---|
| 665-669 | `10.00 Ɗ` and `Pegged Equivalent: 50.00 bBZD` — **both literals**, a 5:1 rate baked in as two constants |
| 993 | `(~{(searchAvailability.pricePerYearDalla * 5).toFixed(2)} bBZD) / year` |
| 1050 | `{(searchAvailability?.pricePerYearDalla \|\| 10) * regYears * 5}` |
| 1504 | `Equivalent: ~BZ$ {(parseFloat(listPriceDalla) * 5).toLocaleString()} bBZD` |

The literal `5` is an assumed exchange rate presented to the user as a fact about the
peg. Whether 5 is close to correct is beside the point — **nothing in the UI reads the
rate from the chain.** The runtime has an oracle pallet with a bBZD deviation cap
precisely because the rate is a maintained value, not a constant.

Not fixed here because the correct number must come from `pallet-oracle`, and a
plausible guess is exactly the failure mode AUDIT-UI-04 exists to catch.

---

## 9. Auditor's notes

1. **The tool is throwaway.** It lives at `/tmp/pallet-ref-audit2.py`, not in the
   repo. It depends on a local Rust checkout and a pinned SDK rev; committing it would
   create a maintenance claim nobody is going to honour. The *result* is committed —
   that is what matters.

2. **Every wrong conclusion in this audit was caught by validation, not by care.**
   The camelCase port was checked against the real library; the resolver was checked
   against `Cargo.lock`; the two "suspicious" storage reads were tested rather than
   edited. The audit produced the right answer because it was made to prove itself,
   not because it was careful.

3. **`bad-pallet: 0` is the claim to trust.** It is a complete, machine-checked
   statement over a closed set: every pallet name in the UI was looked up in
   `construct_runtime!`. The `bad-item` buckets depend on string matching and are
   reported with their false-positive classes attached.

4. **This audit caught what type-checking structurally cannot.** The money-moving UI
   calls the chain by string. A build cannot tell a real storage item from a plausible
   one, and `hostingConfigs` was plausible.
