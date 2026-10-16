# BelizeChain UI — Maya Wallet & Blue Hole Portal

## Project Identity
- **Repo**: `BelizeChain/ui`
- **Role**: Frontend applications for BelizeChain ecosystem
- **Language**: TypeScript
- **Framework**: Next.js 14 (App Router), React 18+, Turborepo
- **Branch**: `main` (default)

## ⚠️ Live state — read this first

**This file holds conventions, not live values.** No host IPs, spec versions, or image
tags — those drift, and a restated value is a second copy that cannot be verified. This
file named `100.81.45.25`, retired on 2026-10-07, until 2026-10-14.

→ **Read [`../../belizechain/docs/ECOSYSTEM_STATE.md`](../../belizechain/docs/ECOSYSTEM_STATE.md)
before any claim about live state and before starting work here.** It carries the current
chain / host / endpoint facts (each with the date verified), the authority order for when
documents disagree, and the open workstreams.
**If this file and that one disagree about a live value, that one wins.**

### How to work here

- **Verify, don't infer.** Read the source or query the live system. Say "not verified"
rather than asserting — an unsourced factual claim is a defect, not a shortcut.
- **When a doc contradicts the code, the code wins**, and the doc is a bug to fix.
- **Put volatile facts in `ECOSYSTEM_STATE.md`, not here.** Conventions stay here.

## Applications
- **Maya Wallet**: Citizen/business wallet — DALLA/bBZD management, governance voting, staking
- **Blue Hole Portal**: Government dashboard — treasury, compliance, analytics
- **Shared Components**: GlassCard UI library, Polkadot.js hooks, Mayan-themed design system

## Deployment Target: Ceiba Self-Hosted
- **Active ops source of truth**: `../belizechain/docs/operations/CEIBA_OPERATIONS_RUNBOOK.md`, `../belizechain/docs/deployment/PHASE2_CEIBA_SERVICES_PLAN.md`, and `../infra/docker-compose.ceiba.yml`
- **Current host**: `ceiba` — `ssh wicked@ceiba` (Tailscale `100.119.97.38`, LAN `10.0.0.19`). `100.81.45.25` is the **retired** host and runs no containers.
- **Current frontend routing contract**: HTTPS via the Oracle edge → Ceiba nginx, which routes `/` **by hostname** through the `$root_backend` map in `../infra/nginx/nginx.conf`. Every name also serves `/rpc`, `/ws`, `/api/nawal`, `/api/kinich`, `/api/pakit`, `/ipfs`.
- **Current infra note**: apex and `www` serve the `org` site; `testnet.*` and `portal.*` serve Blue Hole Portal (`ui`); `wallet.*` serves Maya Wallet (`maya`) **at the root**; `explorer.*` serves the explorer. Both UI images are built **without** absolute URLs, so they derive `/rpc`, `/ws` and `/api/*` from `window.location.origin` — that is why every name must serve those paths. The old `/wallet/` path 301s to `wallet.belizechain.org`. Rollout/rollback contract: `../infra/deploy/CEIBA_UI_ROLLOUT.md` (current); `../infra/docs/B1_MAYA_EXPOSURE_2026-06-13.md` is the historical first cut.

## Deployment Status: Phase 2 — Maya Wallet LIVE (2026-09-21); remaining items below
### What needs to be done:
1. **Keep repo tooling on Node 24** — local `.nvmrc`, Dockerfile, workflows, and package metadata should stay aligned.
2. **Maya Wallet Ceiba route/image contract** — DONE: the `maya` service serves `wallet.belizechain.org` at the root (built with `NEXT_PUBLIC_BASE_PATH` unset, and with `-f Dockerfile.maya`); see `../infra/deploy/CEIBA_UI_ROLLOUT.md` for the rollout/rollback procedure.
3. **If promoting another app from this repo to Ceiba**:
   - both deployed apps are gated behind a signed session in their **root layout** (a server component), so a new app must either do the same or consciously opt out
   - Portal requires BelizeID KYC level 2+; Maya Wallet gates on key ownership only (no KYC) so citizens can onboard
   - `AUTH_SESSION_SECRET` is read at **runtime** (unlike `NEXT_PUBLIC_*`, which is baked at build time); it fails closed when unset
   - build an explicit image per app target from this Dockerfile
   - pin the chosen image in `infra/.env` / `infra/docker-compose.ceiba.yml`
   - validate reverse-proxy routing against the shared runtime config helper in `shared/src/lib/runtime-config.ts`
4. **Do not treat old AKS/Vercel placeholders as source of truth** — Ceiba self-hosted docs and infra compose files are authoritative for current deployment work.

## Sibling Services (Ceiba compose contract)
| Service | Image | Ports |
|---------|-------|-------|
| ceiba-node | `belizechain/ceiba-node:latest` | 30333, 9944, 9615 |
| kinich | `belizechain/kinich-quantum:latest` | internal 8888 |
| nawal | `belizechain/nawal:latest` | internal 8080 |
| pakit | `belizechain/pakit-storage:latest` | internal 8001 |
| ui | `belizechain/blue-hole-portal:latest` | internal 3000 |

## Dev Commands
```bash
npm install                              # Install dependencies
npm run dev                              # Dev server
npm run build                            # Production build
docker build --build-arg APP_NAME=blue-hole-portal --target portal -t belizechain/ui-portal:local .
docker build --build-arg APP_NAME=maya-wallet --target wallet -t belizechain/maya-wallet:local .
```

## Code-Health Audit Series — read before touching `maya-wallet` or `blue-hole-portal`

Eight audits (`UI-00` → `UI-08`) have been run against this repo. **All commits through
`98717be` are pushed.** The documents in `docs/audits/` are the authority on what was
checked, what was fixed, and what was deliberately left — read the relevant one before
re-deriving a finding, and re-measure anything they state as a count.

**Current work item: [`docs/audits/AUDIT-UI-08-WIRING-PLAN.md`](../docs/audits/AUDIT-UI-08-WIRING-PLAN.md)**
— 25 dead exports in `services/pallets/*` that make real chain calls and have no caller.
Each is listed with its signature, its chain call, its host page, and whether it needs
wiring or building. Start with its §1 (a metadata read) before writing any wiring code.

### Gates and baselines — run all five before every commit

| Gate | Baseline at hand-off |
|---|---|
| `npx tsc --noEmit` in `shared`, `maya-wallet`, `blue-hole-portal` | 0 errors each |
| `npm run lint` | maya **271**, portal **149**, shared **16** warnings; **0 errors** |
| `npm run build` (`maya-wallet`) | exit 0, no warnings |
| `npx vitest run` (repo root) | 3 files, 14 passed / 1 skipped |
| `./belizechain/scripts/doc-claims/check-doc-claims.sh ui` | PASSED |

### Before you build: check memory, ask before killing anything

This workstation (~15 GB) has crashed VS Code **four times** under memory pressure during
this series. Run `free -m` first; if available is below ~2 GB, **stop and report** rather
than building. Stale Pylint LSP daemons pinned to `nawal-ai/.venv` are the usual consumer —
**killing processes requires explicit owner approval.**

**Ask before pushing** — this repo runs 5 active workflows and Actions credits are limited.

**A scan that produces a deletion list must be validated against a known-good case first.**
Four separate bugs in one such scanner were caught this series; the worst hid every `.tsx`
page and inflated a dead count from 63 to 142. See `docs/audits/AUDIT-UI-07-SERVICE-WIRING.md` §5.

## Rules
- Ceiba self-hosted is the active deployment target for BelizeChain rollout work.
- Prefer adjacent local sibling repos and Ceiba docs over stale AKS, ACR, Vercel, or Kubernetes-era notes.
- Treat the current infra compose contract as authoritative until the UI/image handoff is explicitly changed.
