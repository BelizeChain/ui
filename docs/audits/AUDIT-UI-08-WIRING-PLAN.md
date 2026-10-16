# AUDIT-UI-08 — PLAN: Wire the 25 REAL Service Exports

| Field | Value |
|---|---|
| **Audit ID** | AUDIT-UI-08 |
| **Status** | **PLAN — NOT STARTED.** This document is the starting point for the next session |
| **Predecessor** | [AUDIT-UI-07](./AUDIT-UI-07-SERVICE-WIRING.md) — triage that produced this list |
| **Date written** | 2026-10-16 |
| **Goal (owner's words)** | *"Those are supposed to be wired and built if missing and useful."* |

---

## 0. Where things stand — read this first

All 7 audit commits are **pushed** to `origin/main` (`98717be`). The tree is clean.
Nothing is outstanding from UI-00 → UI-07.

| | |
|---|---|
| Live chain | `Jade` (Chain D), **runtime spec 116** |
| Deployed node | `belizechain/ceiba-node:ff74ee9-stable2609-20261012` |
| Workspace | `/home/wicked/Projects/Belizechain/BelizeChain.code-workspace` |
| UI repo | `/home/wicked/Projects/Belizechain/ui`, branch `main` — check `git status` for whether the hand-off commit has been pushed |
| Audit docs | `ui/docs/audits/AUDIT-UI-00..08` |
| Scanner | `/tmp/pallet-crosscheck2.py` — **lives in `/tmp`, may be gone; see §7.1** |

> ⚠️ The two live-state rows above are **verified 2026-10-14**, sourced from
> `belizechain/docs/ECOSYSTEM_STATE.md` §2.1–2.2. That file is the authority and each of its
> values carries its own verification date; **a value without a date is a bug** there. Re-read
> it before trusting this table, and if the two disagree, **that file wins**.

**Counts at hand-off:** 65 dead exports remain in `ui/*/src/services/pallets/` —
**25 REAL** (this plan), 34 no-chain-call, 5 stubs, 1 unverified.

---

## 1. Task 1 — settle the capability question with a metadata read

**Do this before writing any wiring code.** It is a read-only query and it unblocks
several items at once.

Several UI sites gate on features whose availability was asserted — wrongly — in prose.
The guards themselves are live capability probes, so no code is broken, but we do not
currently *know* which of these the live chain exposes. One metadata read answers all of it:

```js
// run from ui/maya-wallet (has @polkadot/api)
const { ApiPromise, WsProvider } = require('@polkadot/api');
const api = await ApiPromise.create({
  provider: new WsProvider('wss://testnet.belizechain.org/ws'),
});
// 1. which BNS calls/storage does the live chain expose?
console.log('tx.bns   :', Object.keys(api.tx.bns).sort());
console.log('query.bns:', Object.keys(api.query.bns).sort());
// 2. resolve the UNVERIFIED item from UI-07 §4.3
console.log('collective.voting:', Boolean(api.query.governanceCouncil?.voting));
console.log('specVersion:', (await api.rpc.state.getRuntimeVersion()).specVersion.toNumber());
await api.disconnect();
```

> ⚠️ This touches a **live host**. Read-only, but confirm with the owner before running —
> that is the standing rule for this project, not a formality.

**What each outcome changes:**

| Finding | Consequence |
|---|---|
| `tx.bns.setPrimaryDomain` / `clearPrimaryDomain` present | the guard never fires on this chain; wire the UI freely |
| `query.bns.primaryDomain` present | `getPrimaryDomain` is live and reusable |
| `governanceCouncil.voting` present | `getDistrictCouncil` is **REAL**, not fabricated — it was only unverifiable (§4.5) |
| `runtime spec != 116` | chain has moved on; re-read `ECOSYSTEM_STATE.md` before trusting any count in this doc |

---

## 2. The 25 REAL exports

Each entry: signature → the chain call it makes → the page that should host it → work
needed. **"Wire" means a page already presents the affordance and only needs the call;
"build" means the UI does not exist yet.**

### 2.1 Cluster A — BNS (8) · host `/bns` · LOW RISK

The richest cluster, and the page already imports 12 sibling functions from the same
service, so patterns to copy exist in-file.

| Export | Signature | Chain call | Work |
|---|---|---|---|
| `getDomain` | `(domain: string) => Promise<Domain \| null>` | `bns.domainRegistry`, `bns.domainResolution` | **wire** — detail view for a searched domain |
| `getHostedWebsite` | `(domain) => Promise<HostedWebsite \| null>` | `bns.hostedWebsites` | **wire** — show hosting status on a domain you own |
| `getPrimaryDomain` | `(address) => Promise<string \| null>` | `bns.primaryDomain` | **wire** — cross-cutting; see §2.9 |
| `getTextRecords` | `(domain) => Promise<{key,value}[]>` | `bns.domainResolution` | **build** — read-back for the records `setTextRecord` already writes |
| `hostWebsite` | `(address, domain, contentHash, autoRenew=true) => {hash}` | `bns.activateHosting` | **build** — needs an upload flow + CID input |
| `listDomainForSale` | `(address, domain, price, currency, expiryDays?) => {hash}` | `bns.listDomain` | **build** — the marketplace tab exists read-only (`getMarketplaceListings`); this is its write side |
| `resolveDomain` | `(domain) => Promise<string \| null>` | `bns.domainResolution` | **wire** — cross-cutting; see §2.9 |
| `clearPrimaryDomain` | `(address) => {hash}` | `bns.clearPrimaryDomain` | **wire** — pairs with the existing "Set as Primary" button |

**Sensitive:** `clearPrimaryDomain` removes a user's reverse handle — needs a confirm step.

### 2.2 Cluster B — Identity (3) · host `/belizeid`, `/profile` · SENSITIVE

| Export | Signature | Chain call | Work |
|---|---|---|---|
| `getDisplayName` | `(address) => Promise<string \| undefined>` | `identity.identities` | **wire** — highest-leverage item in this whole plan; see §2.9 |
| `getAccountType` | `(address) => Promise<'Citizen' \| 'Business' \| null>` | `oracle.merchantCategories`, `payroll.verifiedEmployers` | **wire** — badge on profile / recipients |
| `registerBelizeID` | `(address, data) => {hash}` | `identity.registerIdentity` | **build** — `/belizeid` is read-only today; self-registration is a product decision |

**Note:** identity is the one cluster where a wrong write is hard to undo. Get the owner's
explicit sign-off on the registration flow shape before building it.

### 2.3 Cluster C — Oracle / merchants (3) · **no page exists** · MEDIUM

| Export | Signature | Chain call | Work |
|---|---|---|---|
| `getVerifiedMerchants` | `(category?, district?) => VerifiedMerchant[]` | `oracle.merchantCategories` | **build** — merchant directory doesn't exist |
| `getVerifiedMerchant` | `(merchantId) => VerifiedMerchant \| null` | `oracle.merchantCategories` | **build** — detail view for the above |
| `isMerchantVerified` | `(address) => boolean` | `oracle.merchantCategories` | **wire** — verification badge on any address display (cheap, cross-cutting) |

> ⚠️ `district` is accepted **for call-site compatibility but is not used** (the pallet
> does not key by district). Do not build a district filter on it without checking the
> pallet first.

### 2.4 Cluster D — Community (2) · host `/community`, `/community/sustainability` · LOW

| Export | Signature | Chain call | Work |
|---|---|---|---|
| `calculateEffectiveFee` | `(address, originalFee) => {effectiveFee, discount, discountPercent}` | `community.socialResponsibilityScores` | **wire** — show SRS-based fee discount in the send flow |
| `getProjectContributors` | `(projectId) => {address, amount, timestamp}[]` | `community.greenContributions` | **wire** — contributor list on a sustainability project |

> The `sustainability` page header records that three hardcoded projects with invented
> funding targets were already removed there. Do not reintroduce placeholders — this
> cluster is where that temptation lives.

### 2.5 Cluster E — Governance (2) · host `/governance` · SENSITIVE

| Export | Signature | Chain call | Work |
|---|---|---|---|
| `getDistrictCouncil` | `(district) => DistrictCouncil \| null` | `governance.districtRepresentation`, `governanceCouncil.voting` | **wire, after §1** — reads `governanceCouncil.voting`, the UI-07 unverified item |
| `submitProposal` | `(address, data) => {hash}` | `governance.proposeTreasurySpend` | **build** — spends treasury; needs amount/beneficiary UI + confirm |

### 2.6 Cluster F — LandLedger (2) · host `/landledger` · LOW

| Export | Signature | Chain call | Work |
|---|---|---|---|
| `getLandTitle` | `(titleId) => LandTitle \| null` | `landLedger.properties` | **wire** — title detail view |
| `getPropertyTransferHistory` | `(titleId) => PropertyTransfer[]` | `landLedger.transferRecords` | **wire** — history panel on a property |

### 2.7 Cluster G — Payroll (2) · host `/payroll` · LOW

| Export | Signature | Chain call | Work |
|---|---|---|---|
| `getSalarySlip` | `(paymentId) => SalarySlip \| null` | `payroll.payrollRecords` | **wire** — formatted slip view |
| `verifySalaryPayment` | `(paymentId) => {…}` | `payroll.payrollRecords` | **wire** — on-chain proof badge on a slip |

> Keep `getSalarySlip` (formats what is already read) distinct from `downloadSalarySlip`
> (which **refetches** from chain — a behaviour change still deferred from UI-06 §8).

### 2.8 Cluster H — Staking (2) · host `/staking` · **HIGHEST SENSITIVITY**

| Export | Signature | Chain call | Work |
|---|---|---|---|
| `unstakeDalla` | `(address, amount) => {hash}` | `staking.leaveValidators`, `staking.claimPouwWithDomainBonus` | **build** — the page **already prints** the 24 h unbonding notice with no button to act on it |
| `reportTrainingContribution` | `(address, modelHash, q, t, honesty) => {hash}` | `staking.submitModelDelta` | **not a UI wire** — doc says it is called by the *Nawal federated-learning client*. Confirm the intended caller before building any page UI |

**`unstakeDalla` is the stand-out.** The gap is visible to users: `/staking` tells them
what leaving the validator set does and offers no way to do it. It is also destructive and
irreversible on a 14,400-block (~24 h) unbonding schedule — so it needs a confirmation
step and explicit owner sign-off. **Do not implement it as a casual "wire".**

### 2.9 Cluster I — Interoperability (1) · host `/bridge`, `/bridges` · LOW

| Export | Signature | Chain call | Work |
|---|---|---|---|
| `getBridgeTransfer` | `(transferId) => BridgeTransfer \| null` | `interoperability.bridgeTransactions`, `chainConfigurations` | **wire** — status view for a transfer id (the function is honest: it reads the real record and previously returned a hardcoded "completed") |

### 2.10 The two cross-cutting wins

**`getDisplayName` and `resolveDomain` are worth doing first**, because they are not
single-page features — they replace raw `r1…` addresses with human names wherever an
address is shown. `resolveAddressToName` (in `identity.ts`, also dead) is a thin wrapper
over `getDisplayName`. Several pages already resolve addresses for display; check whether
they do it a second way before adding a third.

---

## 3. Suggested order

Ranked by value ÷ risk, not by cluster size:

| # | Item | Why first |
|---|---|---|
| 1 | §1 metadata read | Unblocks 4 items and closes the UI-07 unverified row |
| 2 | `getDisplayName` + `resolveDomain` (§2.10) | Cross-cutting; improves every page that shows an address |
| 3 | Cluster A leftovers (§2.1) | Same file, same page, patterns in-file |
| 4 | Clusters D, F, G, I | Low risk, clear host pages, read-only |
| 5 | Cluster C (§2.3) | Needs a new page — decide scope first |
| 6 | `getDistrictCouncil` (§2.5) | After §1 |
| 7 | **Owner decision:** `unstakeDalla`, `registerBelizeID`, `submitProposal` | Destructive / sensitive / spends funds |

**One deliverable at a time**, per the standing approval-gate rule. Commit each cluster
separately so a bad one can be reverted without losing the others.

---

## 4. Rules that must be followed (learned the hard way)

1. **Verify by measurement, never by reasoning.** Prove from file content or command
   output. An unsourced factual claim is a defect — see §5.
2. **Never delete from an unvalidated scan.** UI-07's scanner was wrong **4 times** and
   each error produced a confident, wrong deletion list. Spot-check one result against a
   fact you already trust *before* acting on the list.
3. **A `.ts`-only glob hides every page.** Pages are `.tsx`. This alone inflated a dead
   count from 63 to 142.
4. **camelCase ≠ snake_case.** Extrinsics are `pub fn leave_validators` on chain but
   `leaveValidators` in the JS surface.
5. **Grep showing absence ≠ absence.** Read the file.
6. **"Tests pass" is meaningless without the count.** Baseline: 3 files / 14 passed / 1
   skipped.
7. **Date every claim, or omit it.** `offline/page.tsx:32` says *"Verified against Ceiba on
   2026-10-07 (spec 109)"* — correctly framed and therefore still true. Undated claims rot:
   see §5.

---

## 5. Known trap: stale capability claims in shipped prose

Found while mapping the clusters above, and **fixed** in the hand-off commit on this branch
(the one whose message begins `docs(ui): hand off the 25-export wiring plan`).
Eleven sites asserted the chain was at spec 109
and that BNS reverse-resolution was *"not deployed yet"*. Both were false: the live chain
is **spec 116**, and the extrinsics' commit `aa2b6ab` is an ancestor of `ff74ee9`, the
commit the deployed image was built from:

```bash
git merge-base --is-ancestor aa2b6ab ff74ee9   # -> ✅ YES
```

Fixed sites — **prose only, zero behaviour change**; every guard was already a live
capability probe:

- `maya-wallet/src/services/pallets/bns.ts` — 8 sites (docs + 4 user-facing error strings)
- `maya-wallet/src/app/bns/page.tsx` — 3 sites (2 comments + the *"needs runtime spec 110"* label → *"unsupported by this chain"*)
- `shared/src/lib/runtime-config.ts` — the GEM deployment note now marks its spec as deployment-time

**The pattern to reuse:** describe the *capability probe*, never the chain's version.
A hardcoded version rots silently; a probe stays correct across every runtime upgrade.

**Still outstanding:** the portal's *"off-chain compliance backend … not yet deployed"*
claims (`compliance/apply/page.tsx:111,117`, `compliance/page.tsx:74`) are about a
**backend**, not the chain, and were **not** verified either way. Do not treat them as
true or false without checking.

---

## 6. Gates and baselines

Run all five before every commit. All currently green at `98717be` + the prose fix.

```bash
cd ui/shared           && npx tsc --noEmit     # 0 errors
cd ui/maya-wallet      && npx tsc --noEmit     # 0 errors
cd ui/blue-hole-portal && npx tsc --noEmit     # 0 errors
cd ui/maya-wallet      && npm run lint         # 271 warnings, 0 errors
cd ui/blue-hole-portal && npm run lint         # 149 warnings, 0 errors
cd ui/shared           && npm run lint         #  16 warnings, 0 errors
cd ui/maya-wallet      && nice -n 10 npm run build   # exit 0, no warnings
cd ui                  && npx vitest run       # 3 files, 14 passed / 1 skipped
cd /home/wicked/Projects/Belizechain && ./belizechain/scripts/doc-claims/check-doc-claims.sh ui
```

**Re-scan command** (rebuild it if `/tmp` was cleared — §7.1):

```bash
python3 /tmp/pallet-crosscheck2.py            # expect REAL to shrink as items get wired
```

**Baselines to beat:** maya lint 271 · portal lint 149 · shared lint 16 · vitest 14+1 ·
tsc 0 ×3 · dead exports 65 (25 REAL).

---

## 7. Environment and traps

### 7.1 `/tmp` does not survive

`scanner` scripts live in `/tmp` and have been lost to reboots before. If
`/tmp/pallet-crosscheck2.py` is gone, rebuild it from AUDIT-UI-07 §5's description of the
four bugs (the fixes are the important part, not the code).

### 7.2 This box crashes under memory pressure — check before building

~15 GB total; **four VS Code crashes** have happened across this audit series. Before any
build:

```bash
free -m      # if available < ~2 GB, STOP and report rather than building
```

Known consumer: stale **Pylint LSP daemons** pinned to `nawal-ai/.venv` (seen holding
~2.6 GB across 2 PIDs, up ~2 days). **Killing them requires explicit owner approval** —
ask, then kill. Report blockers; do not work around them silently.

### 7.3 Live-state authority

Volatile facts live in `belizechain/docs/ECOSYSTEM_STATE.md` — read it before asserting
any chain/host/spec value. If this document and that one disagree, **that one wins**.

### 7.4 Pushing

Was explicitly authorised for UI-06/07. **Ask again** before pushing a new batch — the
repo runs 5 active workflows and Actions credits are limited.

---

## 8. Definition of done — per item

An export is **wired**, not merely called, when:

- [ ] a user-reachable path invokes it (not just a test, not just a barrel re-export)
- [ ] loading, empty, and error states are handled — a failed read must not silently
      render as valid data (the `/bns` availability bug was exactly this class)
- [ ] the dead-export rescan shows it **gone from the REAL list**
- [ ] all five gates in §6 pass
- [ ] the commit message names what was wired and what was deliberately left
