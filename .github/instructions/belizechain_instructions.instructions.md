---
name: "BelizeChain Multi-Repo Engineering and Review Rules"
description: "Use when writing or reviewing BelizeChain sibling-repo code, frontend, Python services, Rust contracts, infra configs, workflows, or deployment docs. Covers evidence-driven review, multi-repo source-of-truth selection, Ceiba alignment, and validation."
applyTo:
  - "**/*.py"
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.rs"
  - "**/*.toml"
  - "**/*.yml"
  - "**/*.yaml"
  - "**/*.sh"
  - "docs/**/*.md"
  - ".github/**/*.md"
  - ".github/workflows/**/*.yml"
  - "README.md"
---
# BelizeChain Multi-Repo Engineering and Review Rules

## Sources Of Truth

- **For live state — chain version, head height, epoch, host address, service endpoints, deployed contract addresses — read `../../../belizechain/docs/ECOSYSTEM_STATE.md`.** It is the only place volatile values are recorded; each carries the date it was verified and the command to re-check it. **Do not trust a volatile value restated anywhere else** — not in a README, not in `copilot-instructions.md`, not in this file. A restated value is a second copy that cannot be verified, and it drifts.
- For repo-local behavior, prefer `.github/copilot-instructions.md`, the owning source file, build manifests, and the matching test slice over README prose.
- For cross-repo architecture and sibling responsibilities, use `../belizechain/docs/architecture/multi-repo-overview.md`.
- For live Ceiba operations, prefer `../belizechain/docs/operations/CEIBA_OPERATIONS_RUNBOOK.md`, `../belizechain/docs/deployment/PHASE2_CEIBA_SERVICES_PLAN.md`, and `../infra/docker-compose.ceiba.yml` over older deployment notes.
- For GitHub-facing repo status, releases, workflows, and PR state, prefer `gh` data over handwritten compatibility tables.

## Verify Before Asserting

- Every factual claim must come from something you read or ran **in this session**. A plausible-sounding number is not evidence — if you have not checked it, write "not verified" rather than stating it as fact.
- Restate the requested change in one line before editing, then confirm afterwards that the diff contains only that change.
- Run the cheapest check that could prove you wrong *before* making the claim, not after.
- When a document and the implementation disagree, the implementation wins and the document is the bug — say which one you checked.

## Review Standard

- Call something a bug only when you can connect it to code, tests, command output, logs, or a concrete contract violation.
- Separate confirmed defects, probable risks, and open questions.
- If documentation disagrees with implementation, call out the mismatch explicitly and state which source is authoritative for the task.
- Mention missing tests, missing rollback steps, stale docs, or validation gaps when they materially affect confidence.
- If you find adjacent stale docs or operational drift while touching a file, either fix it in the same slice or call it out explicitly.

## Multi-Repo Expectations

- Identify the owning repo and downstream consumers before proposing a fix that spans the core chain, UI, infra, GEM, Nawal, Kinich, or Pakit.
- Call out cross-repo API, RPC, workflow, and deployment implications explicitly.
- Prefer adjacent local clones under `/home/wicked/Projects/Belizechain` before falling back to remote inspection.

## Validation

- After changes, prefer the smallest relevant check first: targeted unit or integration tests, a focused build or typecheck, then wider validation only when needed.
- For review-only tasks, cite the specific test or command that would prove or disprove the concern.
- If no direct validation is possible, say what evidence is missing instead of overstating confidence.

## Ops And Deployment

- Ceiba is the active self-hosted environment. Verify commands and bind addresses against the current runbook and infra repo before suggesting changes.
- Treat `sudo`, `systemctl`, Docker restarts, compose changes, and data resets as high-impact actions. State the blast radius and rollback path before recommending them.
