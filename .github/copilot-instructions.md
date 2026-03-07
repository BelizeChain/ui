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

## Azure Deployment Target
- **ACR**: `belizechainacr.azurecr.io` → image: `belizechainacr.azurecr.io/ui`
- **AKS**: `belizechain-aks` (Free tier, 1x Standard_D2s_v3, K8s v1.33.6)
- **Resource Group**: `BelizeChain` in `centralus`
- **Subscription**: `77e6d0a2-78d2-4568-9f5a-34bd62357c40`
- **Tenant**: `belizechain.org`

## Deployment Status: Phase 2 — TODO
### What needs to be done:
1. **Verify Dockerfile** — Ensure multi-stage build works (Node.js builder → nginx/node runtime)
2. **Update deploy.yml** — Migrate from VM/SSH to AKS deployment:
   - Use `azure/login@v2` with `${{ secrets.AZURE_CREDENTIALS }}`
   - Use `azure/aks-set-context@v4` with `${{ secrets.AKS_CLUSTER_NAME }}`
   - Push image to `belizechainacr.azurecr.io/ui`
   - `kubectl apply` Deployment + Service (expose port 3000 or 80)
3. **Configure GitHub Secrets** (if not already set):
   - `ACR_USERNAME` = `belizechainacr`
   - `ACR_PASSWORD` = (get from `az acr credential show --name belizechainacr`)
   - `AZURE_CREDENTIALS` = (service principal JSON for `belizechain-github-actions`)
   - `AZURE_RESOURCE_GROUP` = `BelizeChain`
   - `AKS_CLUSTER_NAME` = `belizechain-aks`
4. **K8s namespace**: Deploy into `belizechain` namespace (same as core node)
5. **Connect to blockchain node**: Configure Polkadot.js WebSocket URL to internal AKS service `ws://belizechain-node.belizechain.svc.cluster.local:9944`

## Sibling Services (same AKS cluster)
| Service | Image | Ports |
|---------|-------|-------|
| belizechain-node | `belizechainacr.azurecr.io/belizechain-node` | 30333, 9944, 9615 |
| kinich-quantum | `belizechainacr.azurecr.io/kinich` | 8000 |
| nawal-ai | `belizechainacr.azurecr.io/nawal` | 8001 |
| pakit-storage | `belizechainacr.azurecr.io/pakit` | 8002 |

## Dev Commands
```bash
npm install                              # Install dependencies
npm run dev                              # Dev server
npm run build                            # Production build
docker build -t belizechainacr.azurecr.io/ui .  # Docker image
az acr login --name belizechainacr       # ACR login
```

## Rules
- AKS cost ceiling: Free tier only, 1 node Standard_D2s_v3 (~$75/mo total for ALL services)
- All services share the single AKS node — keep resource requests minimal
- Use internal K8s DNS for inter-service communication
