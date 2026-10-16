# AUDIT-UI-06 — Contacts Wiring, `/send` Prefill, and an Address-Validation Bug

| Field | Value |
|---|---|
| **Audit ID** | AUDIT-UI-06 |
| **Scope** | Wiring the dead affordances on `/contacts`; `?to=` deep-link prefill on `/send`; the `isValidAddress` bug found while wiring |
| **Date** | 2026-10-16 |
| **Status** | **COMPLETE** — 3 affordances wired, 1 blocking address bug fixed, 3 dead exports revived |
| **Method** | Read each affordance, determine whether its backing service function existed, wire it or remove it, then verify by build + lint + test + dead-export rescan |

---

## 1. The blocking finding: `isValidAddress` rejected every real address

Wiring the `+` add-contact button required validating the address the user types.
The helper already existed — and it was broken for this chain.

**Before** (`maya-wallet/src/services/blockchain.ts`):

```ts
export function isValidAddress(address: string): boolean {
  try {
    const { decodeAddress, encodeAddress } = require('@polkadot/util-crypto');
    return encodeAddress(decodeAddress(address)) === address;
  } catch { return false; }
}
```

`encodeAddress(bytes)` defaults to SS58 prefix **42**. This chain sets
`SS58Prefix = 1981`. So any genuine address round-trips to a *different string*
and the equality fails. Measured, not inferred:

```
chain address       : r1Wm6WgKeFpYHgngPgEF2p4NjzJs8QY5FyctGVcDnN24RGRur
re-encoded (prefix42): 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY

OLD impl  encodeAddress(decodeAddress(a)) === a  ->  false   ← real address REJECTED
```

This is the documented SS58 trap: same 32 bytes, different rendering. Comparing
*rendered addresses* instead of *public key bytes* fails — exactly as recorded in
the ecosystem notes for this chain.

**After:**

```ts
import { decodeAddress } from '@polkadot/util-crypto';

export function isValidAddress(address: string): boolean {
  try {
    decodeAddress(address);
    return true;
  } catch { return false; }
}
```

Validity means "decodes to a public key", which is what a validator should assert.
Prefix-versus-current-chain is a presentation concern, not a validity one.

Measured after the fix:

```
NEW impl  real chain address accepted?  ->  no throw (accepted)
NEW impl  'not-an-address' rejected?    ->  yes (rejected)
```

The `require(...)` inside the function was also replaced with a static import —
the same pattern flagged in UI-03.

---

## 2. Three affordances that looked wired and were not

`/contacts` presented three controls that did nothing.

### 2.1 The favourite star — an explicit no-op

```ts
onClick={(e) => { e.stopPropagation(); // Toggle favorite }}
```

The comment described the intended behaviour; the body stopped propagation and
returned. Now calls `updateContact(contact.id, { favorite: !contact.favorite })`
and refreshes.

### 2.2 The `+` button — no handler at all

Opened nothing. Now opens a `Dialog` with a form, validates the address through
`isValidAddress`, and surfaces `addContact`'s duplicate error rather than
swallowing it.

### 2.3 The send button — no handler

Now routes to `/send?to=<address>`.

---

## 3. `/send?to=` deep-link prefill

The send page ignored query parameters. A contact row's send button had nowhere
to lead, so the prefill is the other half of 2.3.

- `useSearchParams()` reads `to`; the resolution is deferred through
  `Promise.resolve().then(...)` to keep it out of the synchronous render pass.
- Matches a saved contact via `getContacts().find(...)` so the recipient shows
  the contact's **name**; falls back to `{ name: 'Custom Recipient', address: to }`.
- Applies `resolveAddress(to)` (the existing ENS-style resolver) and advances to
  the `amount` step.
- `resolveAddress` moved from inside the component to module level — it closed
  over nothing, so hoisting removes a per-render allocation.

`getContacts` was already imported; no new dependency.

---

## 4. Dead-export rescan — the wiring took effect

Re-ran the corrected scanner (AUDIT-UI-05's `unused-exports4.py`):

| | Before | After |
|---|---|---|
| TOTAL DEAD | 109 | **106** |
| TOTAL TEST-ONLY | 9 | 9 |
| maya-wallet DEAD | 85 | **82** |

The three exports that left the dead list are exactly the three functions the
wiring calls: `addContact`, `updateContact`, `getContacts`.

Still dead in the contacts service, and *correctly* so — these are unwired
features, not junk: `deleteContact`, `exportContacts`, `getContactByAddress`,
`getFavoriteContacts`, `getFrequentContacts`, `importContacts`,
`recordContactTransaction`, `searchContacts`.

---

## 5. Verification

| Gate | Result |
|---|---|
| `npx tsc --noEmit` (maya-wallet) | **0 errors** |
| `npm run lint` (maya-wallet) | **272 warnings, 0 errors** — was 274 |
| `npm run build` (maya-wallet) | **exit 0** — `✓ Compiled successfully in 6.1s`, `/contacts` and `/send` present, zero warnings |
| `npx vitest run` (monorepo) | **3 files passed, 14 passed / 1 skipped** — baseline held |
| `check-doc-claims.sh ui` | **PASSED** |

Two lint warnings cleared in this pass:

- `contacts/page.tsx` — an `as any` cast on the filter id, replaced with
  `([{...}] as const).map(...)`. Pre-existing; fixed.
- `documents/page.tsx:8` — `type PakitClient` imported and never used. Verified
  pre-existing (present in `91b1034^`, untouched by `91b1034`) and removed.

One warning deliberately **left**: `send/page.tsx:80` `watchAmount = watch('amount')`
triggers a React Compiler "Compilation Skipped" notice. This is structural to
`react-hook-form`'s `watch()` and is pre-existing on `HEAD`; it is a skipped
optimisation, not a defect.

---

## 6. Environment blocker (reported and resolved)

The build crashed the editor a third time. Cause was measured, not guessed:
**1.4 GB available, swap 100% full**, with two stale Pylint LSP daemons
(PIDs 1441280 @ 1.29 GB, 1338280 @ 1.28 GB) pinned to `nawal-ai/.venv` and up
~2 days. Reported to the user rather than worked around; on approval both were
killed, freeing ~3.1 GB (**4,570 MB available**), and the build then passed clean.

**Rule:** budget checks before builds on this box, and treat any process kill as
requiring explicit approval.

---

## 7. Not done — the page-to-service refactor

The task had two halves. This document covers the second (contacts wiring). The
first — re-pointing pages at `services/pallets/*` instead of raw `api.query` —
**was investigated and not implemented**, because the premise was weaker than
stated:

- Most pages **already use** their service layer. `/bns` issues **zero** raw
  `api.query` calls.
- The real remaining issue is ~39 *unused service exports*, not pages bypassing
  services.
- That is a separate scoped pass and needs a product decision per cluster: wire
  the feature, or delete the export.

Reporting this as unfinished rather than implying it shipped with the wiring.

---

## 8. Deferred items

| Item | Why deferred |
|---|---|
| ~39 dead `services/pallets/*` exports | Needs its own scoped pass + per-cluster product decision (§7) |
| `downloadSalarySlip` | Refetches from chain — a behaviour change, needs its own approval |
| `NotificationBell` vs `services/notifications.ts` | Two different notification systems; unifying is a design decision |
| Budgeting TEST-ONLY cluster | 11 of 13 exports have no app caller; 9 reachable only from the test |
| `localeInfo`, `BelizeAccount` | Orphaned as a cascade of the UI-00/UI-03 file removals |
