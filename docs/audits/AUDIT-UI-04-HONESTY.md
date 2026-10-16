# AUDIT-UI-04 — Data Honesty: Fabricated Values Rendered as Chain Data

| Field | Value |
|---|---|
| **Audit ID** | AUDIT-UI-04 |
| **Scope** | Every page in `maya-wallet` and `blue-hole-portal` that renders a numeric or status claim |
| **Date** | 2026-10-15 |
| **Status** | **REMEDIATED** — 4 files corrected; 3 pages confirmed legitimate and left unchanged |
| **Method** | Pattern sweep for hardcoded values in JSX, then **each hit read in context** to separate genuine fabrication from legitimate format previews |

---

## Why this audit exists

`UI_WIRING_STATUS_CURRENT.md` (2026-10-08) closed with:

> "The UI no longer claims anything it cannot do."

That verdict was reached by auditing the wrong file. The portal's
`components/Dashboard.tsx` had been corrected to show `'Node unreachable'` and
`'Awaiting Activation'` — but **nothing rendered that file.** It had zero importers. The
live route, `app/page.tsx`, still carried every fabrication the "fixed" file had removed.

**The lesson, and the reason this document exists: a fix applied to an unreachable file is
indistinguishable from no fix at all — and it produces a green audit.** Checking the fix
exists is not enough; the file containing it must be reachable.

---

## C-01 — Portal root page fabricated its validator fleet (CRITICAL)

```
LOCATION  : blue-hole-portal/src/app/page.tsx  (route "/", 470 lines)
SEVERITY  : CRITICAL — false operational claims on a live government dashboard
```

A "National Validator Performance Matrix" rendered hardcoded JSX with **no condition, no
loading state and no unreachable branch**:

| Rendered | Reality |
|---|---|
| `Ceiba-Validator-01` / `Authoring Primary` | hardcoded |
| `Edge-Validator-2` / `Peer Sentry Synced` | **a second validator that does not exist** — the live authority set is **1** |
| `0 Slashing events · 100% Uptime` | zero chain reads behind it |
| `#{systemInfo?.blockNumber \|\| '18,340'} (100%)` | **fabricated block number *and* fabricated finality** whenever the node was unreachable |
| `100.119.97.38:30333` and `:30334` | **real internal Tailscale IPs hardcoded** — and `:30334` is not a port this stack exposes (P2P is `30333`) |
| `1.2ms (Zero Drift)`, `Attesting 100% of rounds` | pure invention |
| Copy: *"Real-time status of sovereign consensus authoring nodes"* | explicitly claims real-time |
| `${stakingStats?.activeValidators \|\| 2} Active` | the `\|\| 2` fallback **invented two validators** when the staking read failed |

The page **did** use real hooks (`useEconomy`, `useStaking`, `useGovernance`,
`useSystem`) elsewhere — one whole panel was decorative.

**FIX:** the panel now renders the real `validators` array from `useStaking()`
(`staking.validators` + the session authority set), showing truncated account, status,
total stake, PoUW quality and slash count per validator. Values the pallet does not
publish are labelled as such (`Not published`, `Not tracked by pallet`) rather than shown
as zero. Empty and loading states are explicit. The block number is shown only when read;
otherwise `block height unavailable`.

Two further hardcoded figures on the same page were corrected: the whistleblower card's
`50,000 Ɗ Pool` / `0 Security Breaches` and the treasury card's `100.2% Peg Ratio` /
`Statutory Peg Attested` — neither is read from chain. Both now describe the mechanism and
state where the real figure comes from.

---

## C-02 — `governance` rendered a fabricated treasury balance and turnout (HIGH)

```
LOCATION  : maya-wallet/src/app/governance/page.tsx  lines 116, 125
SEVERITY  : HIGH — a fabricated national treasury balance
```

| Rendered | Reality |
|---|---|
| `1,850,000 Ɗ` "Treasury Reserve Balance" + `+ BZ$ 450,000 bBZD` | never read from chain |
| `72.4%` "Citizen Voter Turnout" + `Super-Majority Attained` | not tracked anywhere — no vote-history indexer exists |

**FIX:** treasury is now read via `getTreasuryBalance()` (`system.account` of the treasury
address), polled on the existing 30-second interval, showing `freeDalla` plus reserved.
Unavailable reads render `—` / `Treasury read unavailable`, never a number. The turnout
card was replaced with **Referenda On Record** — a real count from `referendumInfoOf`,
already fetched by the page.

A dead `interface Referendum` (unused; the file uses the imported `ChainReferendum`) was
also removed.

---

## C-03 — `profile` fabricated an entire on-chain activity history (HIGH)

```
LOCATION  : maya-wallet/src/app/profile/page.tsx  lines 20-23, 227-249
SEVERITY  : HIGH — invented personal and financial history
```

The section headed **"Civic & On-Chain Statistics"** read no chain data at all:

| Rendered | Reality |
|---|---|
| `Jan 2025` "Member Since" | invented |
| `142` "Extrinsics" | invented |
| `87.50 Ɗ` "Rewards" | invented |
| `8 Referenda` "Civic Votes" | invented |

The form was also prefilled with **fake personal data**, presented as the user's own:
`citizen@belizechain.org`, `+501 822-2222`, `Belmopan`, and a namefalling back to
`'Belizean Citizen'`.

**FIX:** form fields now default to empty (name falls back to the connected account's own
name). The statistics block shows the real account address and an explicit amber notice
that extrinsic counts, reward totals and vote history are **not indexed on chain**, so they
are left blank rather than shown as zero — "zero would be a claim this wallet cannot
make."

---

## C-04 — `land` claimed a fabricated tax status (MEDIUM)

```
LOCATION  : maya-wallet/src/app/land/page.tsx  line 182
SEVERITY  : MEDIUM — a false clean-bill-of-health on property records
```

`100%` `Cleared & Compliant` / "Zero outstanding municipal liens" was hardcoded, on a page
that otherwise reads real `LandTitle` records from the chain.

**FIX:** the tile now counts real encumbrances across the user's registered titles
(`p.encumbrances?.length`), and states plainly that municipal tax standing is *not*
published by the pallet and therefore is not claimed.

---

## Checked and found LEGITIMATE — deliberately unchanged (3)

Reporting these matters as much as the findings above. Each was a sweep hit and each was
read in context before being cleared:

| Location | Why it is correct |
|---|---|
| `maya-wallet/src/app/language/page.tsx:165,169` — `BZ$ 1,234.56`, `1,234,567.89` | **Format previews.** Labelled "Currency Format" and "Number Format"; they demonstrate how the selected locale renders numbers. Hardcoding is the point. |
| `maya-wallet/src/app/settings/appearance/page.tsx:124` — `1,250.00 Ɗ` | **Theme preview.** Inside a mock wallet card rendered to show the chosen appearance, alongside a `CONNECTED` chip. |
| `blue-hole-portal/src/app/governance/proposals/[id]/page.tsx:347,349` — `0%`, `100%` | **Chart axis labels** for a threshold meter; the actual value is `{proposal.threshold}%` from chain. |

`maya-wallet/src/app/appearance/page.tsx:261` (`5,234 DALLA`) is the same theme-preview
pattern and was left in place.

---

## Flagged for verification, NOT changed

**`maya-wallet/src/app/bns/page.tsx:268-270` — locally-invented domain pricing.**

```ts
let pricePerYearDalla = 10;
if (clean.length <= 3) pricePerYearDalla = 50;
else if (clean.length <= 5) pricePerYearDalla = 20;
```

The registration price is computed in the UI rather than read from the BNS pallet, and the
card then shows `Pegged Equivalent: 50.00 bBZD` — which implies a DALLA↔bBZD rate, while
the same file's own comment at line 75 states *"No DALLA/bBZD rate is assumed."*

**Not changed**, because correcting it requires reading the real registration fee from
`pallet-bns` — guessing a replacement would repeat the original mistake. Verify the
pallet's fee model, then wire or remove.

---

## Remaining honesty gaps (not fabrications — honest absences)

These are correctly disclosed today and need a backend, not a code fix:

1. Bridge relayer — "Awaiting" states.
2. Nawal FL — PoUW activity gated on the FL server.
3. Pakit — upload/vault gated on the browser gateway.
4. Compliance KYC intake, analytics/vote-history indexer, reports PDF export — absent
   off-chain. The indexer absence is what forces C-03's blank state.

---

*End of AUDIT-UI-04.*
