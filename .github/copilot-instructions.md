# BelizeChain UI — Maya Wallet & Blue Hole Portal

## Project Identity
- **Repo**: `BelizeChain/ui`
- **Role**: Frontend applications for BelizeChain ecosystem
- **Language**: TypeScript
- **Framework**: Next.js 14 (App Router), React 18+, Turborepo
- **Branch**: `main` (default)

## Applications
- **Maya Wallet**: Citizen/business wallet — DALLA/bBZD management, governance voting, staking
- **Blue Hole Portal**: Government dashboard — treasury, compliance, analytics
- **Shared Components**: GlassCard UI library, Polkadot.js hooks, Mayan-themed design system

## Deployment Target: Ceiba Self-Hosted
- **Active ops source of truth**: `../belizechain/docs/operations/CEIBA_OPERATIONS_RUNBOOK.md`, `../belizechain/docs/deployment/PHASE2_CEIBA_SERVICES_PLAN.md`, and `../infra/docker-compose.ceiba.yml`
- **Current host**: Ceiba (`ssh wicked@100.81.45.25` over Tailscale)
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

## Rules
- Ceiba self-hosted is the active deployment target for BelizeChain rollout work.
- Prefer adjacent local sibling repos and Ceiba docs over stale AKS, ACR, Vercel, or Kubernetes-era notes.
- Treat the current infra compose contract as authoritative until the UI/image handoff is explicitly changed.
