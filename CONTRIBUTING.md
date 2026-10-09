# Contributing to BelizeChain UI

Thanks for helping build the frontends for BelizeChain. This repo holds the two
citizen- and government-facing apps plus their shared library.

## What lives here

| Workspace | App | Purpose |
|---|---|---|
| `maya-wallet` | Maya Wallet | Citizen/business wallet — DALLA & bBZD, governance, staking |
| `blue-hole-portal` | Blue Hole Portal | Government dashboard — treasury, compliance, analytics |
| `shared` | `@belizechain/shared` | Shared components, hooks, runtime config |

The monorepo is driven by Turborepo. Workspace directories are declared in the
root `package.json` `workspaces` field.

## Getting started

```bash
npm install
npm run dev:maya        # Maya Wallet only
npm run dev:bluehole    # Blue Hole Portal only
npm run dev:all         # both, concurrently
```

Node 24 is the supported runtime — keep local `.nvmrc`, the Dockerfiles and the
workflows aligned with it.

## Before you open a pull request

Run these from the repo root and make sure they pass:

```bash
npm run lint
npm run test:unit
npm run build
```

Type-check a single app when you only touched it:

```bash
npx tsc --noEmit -p apps/<app>/tsconfig.json
```

## Deployment contract

Ceiba is the deployment target, and routing is **hostname-based** through the
`$root_backend` map in `infra/nginx/nginx.conf`. Both UI images are built without
absolute URLs and derive `/rpc`, `/ws` and `/api/*` from `window.location.origin`,
so **every public name must serve those paths**.

If you promote an app or change what a hostname serves, update the pin in
`infra/.env` / `infra/docker-compose.ceiba.yml` and follow the rollout and
rollback procedure in `infra/deploy/CEIBA_UI_ROLLOUT.md`.

## Pull requests

- One logical change per PR; keep the diff reviewable.
- Conventional Commits for the subject line (`feat(wallet): …`, `fix(portal): …`).
- Describe what you verified and how. "Builds locally" is not verification of a
  deployed path.
- Do not commit secrets. `AUTH_SESSION_SECRET` is read at **runtime** and fails
  closed when unset; never inline it or any other credential.

## Security and compliance

Maya Wallet and Blue Hole Portal handle citizen identity and government finance
data. Report suspected vulnerabilities privately to the maintainers rather than
opening a public issue.

## License

MIT — see [LICENSE](./LICENSE).
