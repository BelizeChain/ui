# AUDIT-UI-07 — Service-Layer Wiring: the /bns Availability Simulation

| Field | Value |
|---|---|
| **Audit ID** | AUDIT-UI-07 |
| **Scope** | The `services/pallets/*` dead-export cluster: investigate whether pages bypass the service layer, wire what can be wired, triage the rest against the real chain surface |
| **Date** | 2026-10-16 |
| **Status** | **COMPLETE** — 1 real wire, 1 stale claim corrected, full triage produced, 4 scanner bugs found and fixed |
| **Method** | Cross-check every dead export's chain calls against the pallet source; search for dead affordances; verify each chain method's existence before calling anything junk |

---

## 1. The premise that failed

The working assumption from UI-03/05 was that pages bypass the typed service layer with
inline `api.query.*` calls, and that ~10 pages needed re-pointing at `services/pallets/*`.

**That premise is wrong.** Measured across every page in `maya-wallet/src/app`:

```
raw api.tx / api.query calls in pages:
      1 api.query.system.account
```

**One.** Pages use the service layer almost exclusively. There was no refactor to do — and
the earlier claim in `/memories/repo/ui-audit-series.md` ("~10 pages bypass with inline
`api.query.*`") has been corrected there.

Likewise, **no dead affordances remain**: a search for empty/no-op handlers
(`onClick={() => {}}`, `onSubmit={() => {}}`, `// TODO: wire`) returns nothing. The
contacts pass (UI-06) fixed the last ones.

So "wire it up" had no large target. What remained was one real defect.

---

## 2. The wire: `/bns` availability was a simulation

`/bns` presented a banner labelled **"Live Availability Feedback"** and enabled a
**Register** button based on this:

```ts
// Domain search availability simulation
const isTaken = myDomains.some((d) => d.name === clean && d.tld === selectedTld);
const isMarket = marketListings.some((m) => m.name === clean && m.tld === selectedTld);
const isReserved = ['government', 'police', ...].includes(clean);
available: !isTaken && !isMarket && !isReserved,
```

That checks only **the user's own domains** and **the marketplace listings already
loaded**. Any name registered to somebody else therefore read as **available**, and the
banner said so, under a label claiming the feedback was live. The user could then hit
Register on a name that already existed.

Meanwhile the correct query sat unused in the same service file:

```ts
// services/pallets/bns.ts — isDomainAvailable(domain)
const domainData: any = await api.query.bns.domainRegistry(normalizedDomain);
return domainData.isNone;   // true == free
```

**Wired.** Availability now comes from `bns.domainRegistry`, and nothing is claimed until
the chain answers:

- The result is stored **keyed by the domain it belongs to** (`.domain`), and the
  availability claim is gated on that key matching the name currently in the box. A stale
  answer therefore cannot flash a verdict for a different name.
- A failed query drops the answer (`setRegistryAnswer(null)`) rather than defaulting to
  "taken" or "available" — an unanswerable read claims nothing.
- Pending-ness is **derived** from the key mismatch, not stored. This is deliberate: the
  first attempt stored a `'pending'` status and called `setRegistryStatus` synchronously
  inside the effect, which the React Compiler rule rejected as
  *"Calling setState synchronously within an effect can trigger cascading renders"*. The
  derived form fixes that correctly instead of suppressing the rule.
- The local `myDomains` / `marketListings` checks are retained only where they add
  information the registry does not (marketplace listing state); the registry check
  replaces `myDomains`, which the registry already contains.

Result: **`isDomainAvailable` went from dead export to live code.**

---

## 3. A false claim about the live chain, corrected

`clearPrimaryDomain` guarded its call like this:

```ts
if (!api.tx.bns?.clearPrimaryDomain) {
  throw new Error(
    'Clearing a primary domain requires runtime spec 110, which is not deployed on this chain yet.',
  );
}
```

The claim is **false**. Proven by ancestry, not inference:

```
git log -S"clear_primary_domain" -- pallets/bns/src/lib.rs
  -> aa2b6ab feat(bns): add text records, avatar and primary-domain extrinsics

git merge-base --is-ancestor aa2b6ab ff74ee9   # ff74ee9 == the deployed spec-116 image
  -> ✅ YES
```

The extrinsic is present in the source that built the runtime now live at spec 116, and
the guard's own premise ("spec 110 … not deployed yet") is three specs stale. The guard
itself is fine — it is the *message* that asserts something untrue. Rewritten to state
what it actually means:

```ts
'The connected chain does not expose bns.clearPrimaryDomain, so a primary domain cannot be cleared here.'
```

This is the same defect class the series exists to catch: a confident, unsourced statement
about live state, embedded in shipped source.

---

## 4. Full triage: dead `services/pallets/*` exports

Every dead export was checked against the **pallet source**, converting camelCase to
snake_case for the Rust lookup (extrinsics are `pub fn leave_validators`, surfaced to JS as
`leaveValidators`).

| Bucket | Count | Meaning |
|---|---|---|
| **REAL** | 25 | makes a real chain call; no page calls it |
| **NO-CHAIN-CALL** | 34 | constant or local helper; no chain call |
| **STUB** | 5 | gated on an extrinsic that does not exist in any pallet |
| **UNVERIFIED** | 1 | calls an SDK-pallet storage item my scanner cannot see |

Total dead in `ui/*/src/services/pallets/`: **65** (maya 63, blue-hole-portal 2).

### 4.1 REAL — the 25 unwired features

Each of these calls a chain method that **exists**. Each has **no caller**, and no page
performs the equivalent inline. Wiring them means building UI that does not exist yet.

| File | Exports |
|---|---|
| `bns.ts` | `getDomain`, `getHostedWebsite`, `getPrimaryDomain`, `getTextRecords`, `hostWebsite`, `listDomainForSale`, `resolveDomain`, `clearPrimaryDomain` |
| `identity.ts` | `getAccountType`, `getDisplayName`, `registerBelizeID` |
| `oracle.ts` | `getVerifiedMerchant`, `getVerifiedMerchants`, `isMerchantVerified` |
| `community.ts` | `calculateEffectiveFee`, `getProjectContributors` |
| `governance.ts` | `getDistrictCouncil`, `submitProposal` |
| `landledger.ts` | `getLandTitle`, `getPropertyTransferHistory` |
| `payroll.ts` | `getSalarySlip`, `verifySalaryPayment` |
| `staking.ts` | `reportTrainingContribution`, `unstakeDalla` |
| `interoperability.ts` | `getBridgeTransfer` |

Two of these deserve named calls-out, because a UI affordance is *adjacent* to them:

- **`unstakeDalla`** → `staking.leaveValidators`. The staking page displays *"Leaving the
  validator set schedules the full stake for withdrawal after 14,400 blocks (~24 hours)"*
  — but there is **no leave button**. Wiring means adding one. That is a destructive chain
  action and a product decision, so it was **not** done unilaterally.
- **`registerBelizeID`** → `identity.registerIdentity`. `/belizeid` is read-only. Self-
  registration is a product decision (the pallet has issuer-driven attestation paths too).

### 4.2 STUB — 5 exports that can never succeed

Each is gated on `api.tx.<pallet>?.<extrinsic>` and throws when absent. Verified against
`belizechain/pallets`:

| Export | Extrinsic it needs | In any pallet? |
|---|---|---|
| `community.contributeToCommunityFund` | `contribute_to_community_fund` | ❌ no |
| `community.createCommunityGroup` | `create_community_group` | ❌ no |
| `interoperability.cancelBridgeTransfer` | `cancel_bridge_transfer` | ❌ no |
| `landledger.registerDocument` | `register_document` | ❌ no |
| `oracle.redeemTourismCashback` | `redeem_tourism_cashback` | ❌ no |

Checked for a renamed equivalent before concluding "missing": `landledger` exposes
`register_property / register_surveyor / transfer_property / verify_property /
add_encumbrance / remove_encumbrance / survey_property / grant_environmental_clearance /
get_owned_properties` — **no document extrinsic exists**. `community` exposes only
`contribute_to_green_project` — no fund, no group. `oracle` has no tourism/cashback
extrinsic at all. `interoperability` has no cancel/refund.

These are **honest but dead**: they throw accurate, useful errors naming the gap
(comparable to `identity.submitSSNVerification`, which correctly explains that SSN
verification is issuer-driven via `identity.issueSsn`). They are **not** fabricated data
and were **not deleted** — they document a real chain gap, and the guard means they would
start working the moment the extrinsic lands.

### 4.3 UNVERIFIED — 1 export

`governance.getVotingHistory` calls `api.query.governanceCouncil.voting`. My first pass
flagged this as **fabricated**, which was wrong:

```
runtime/src/lib.rs:
  GovernanceCouncil: pallet_collective::<Instance2> = 8
```

`governanceCouncil` is a **real namespace** — a `pallet_collective` instance. Its storage
items live in the Polkadot SDK, not in `belizechain/pallets/`, so a scanner that only reads
`pallets/*` cannot see them and reports a false "MISSING".

**Not confirmed either way.** Verifying whether `pallet_collective` exposes a `voting`
storage item requires a metadata read against a running node; no local source for the
crate was available. It is therefore recorded as **unverified** and left untouched — it is
not junk on current evidence.

---

## 5. Scanner bugs found (and why they matter)

This triage was done with a purpose-built scanner. It was wrong **four times**, each caught
by checking a result against a fact I already trusted:

1. **camelCase vs snake_case.** Rust extrinsics are `pub fn leave_validators`; the JS API
   surface is `leaveValidators`. Grepping Rust for the camelCase name matches nothing, so
   the first run reported **every** extrinsic as MISSING — i.e. it would have justified
   deleting the entire service layer.
2. **`.tsx` excluded from the reference count.** The reference universe globbed `*.ts`
   only. Every page is `.tsx`, so **all page usage was invisible** and the dead count
   inflated to 142 (from 63) — including functions demonstrably called from
   `bns/page.tsx` (`registerDomain`, imported at line 9). Caught by reconciling against the
   existing scanner's total.
3. **Pallet directory match was case-sensitive.** `landLedger` never matched the
   `landledger` directory.
4. **SDK pallets are invisible.** Only `belizechain/pallets/*` was searched, so
   `pallet_collective` storage read as non-existent (the §4.3 false positive).

The lesson generalises: **a tool that produces a deletion list must be validated against
known-good cases first.** Each of these bugs produced a *confident, wrong* list that would
have destroyed working code. All four were found by spot-checking a single result against
a trusted fact (`registerDomain` is used by `/bns`; `leave_validators` exists;
`GovernanceCouncil` is a real pallet).

---

## 6. Verification

| Gate | Result |
|---|---|
| `npx tsc --noEmit` (maya-wallet) | **0 errors** |
| `npm run lint` (maya-wallet) | **271 problems, 0 errors** (was 272) |
| `npm run build` (maya-wallet) | **exit 0** — `✓ Compiled successfully in 6.6s`, zero warnings |
| `npx vitest run` (monorepo) | **3 files, 14 passed / 1 skipped** — baseline held |
| `check-doc-claims.sh ui` | **PASSED** |
| Dead-export rescan | `isDomainAvailable` **dead → live**; count 64 → 63 |

The rescan moved by exactly the items changed, which is the check that the wiring actually
took effect: `isDomainAvailable` left the dead list entirely (now called from `/bns`), and
`clearPrimaryDomain` reclassified from STUB to REAL.

---

## 7. What is left, and why it needs the owner

The remaining 65 dead exports are **not junk** — with the single unverified exception, they
are either accurate honest stubs (§4.2) or working typed wrappers for features no page
implements yet (§4.1). Wiring the 25 REAL ones means designing ~20 new UI surfaces,
including destructive actions (`unstakeDalla`, `clearPrimaryDomain`) and identity
operations (`registerBelizeID`). That is a product decision per cluster, not a cleanup, and
it is out of scope for an audit pass.

**Recommended next step:** pick the clusters to build (staking leave-validator and BelizeID
registration are the two with adjacent UI already describing the action), and wire them as
individual deliverables.
