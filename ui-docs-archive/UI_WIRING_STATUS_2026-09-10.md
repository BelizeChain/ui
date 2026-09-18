# UI Wiring Status — Session Archive 2026-09-17

Config passes 1–4 completed this date; AUTHORITATIVE doc is now
`../UI_WIRING_STATUS_CURRENT.md` (rewritten in place). This archive holds the
pre-pass snapshot for history.

## Verified actual state BEFORE passes (2026-09-10 snapshot)

### Maya Wallet
- Service layer: 15 pallet services existed and were real TS APIs
- Page wiring: 9 of 14 high-priority pages wired (~64%)
- Known mock paths (then): bridge mockTx, offline mockSignature,
  bluetooth-mesh mock_signature, oracle hardcoded fallbacks, portal
  dashboard hardcoded tiles

Subsequent CONFIG-002 passes 1–4 (2026-09-17) resolved or honestly re-labeled
every entry above. See `../UI_WIRING_STATUS_CURRENT.md` for current truth.
