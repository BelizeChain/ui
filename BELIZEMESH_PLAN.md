# BelizeMesh — Off-Grid Messaging Protocol

**Status:** v1 plan — Phase 1 (XMTP removal + emergency path fix) landed 2026-09-17
**Protocol name:** BelizeMesh (user-selected)
**Replaces:** the dormant XMTP integration (deprecated `@xmtp/xmtp-js` line; removed with commit d3a2316 and the 2026-09-17 Phase 1 strip)

## Why BelizeMesh exists
Maya Wallet uses Polkadot extension accounts that never expose private keys to
the web app, so any Ethereum-key-based messenger (XMTP, WalletConnect chat, etc.)
cannot be securely wired to the wallet. BelizeMesh uses only what the stack
already has: Polkadot SR25519 accounts, the live `pallet_belize_mesh`, real
Pakit/IPFS storage, and real Web Bluetooth LoRa pipes.

## Transport tiers (target architecture)

| Tier | Channel | Status |
|------|---------|--------|
| 1 | Local Wi-Fi / Wi-Fi Direct | ❌ **Deferred — native mobile app only** (browser cannot do Wi-Fi Direct or hotspot peer discovery) |
| 2 | BLE phone-to-phone mesh | 🟡 real Web Bluetooth GATT I/O exists; peer discovery, epidemic routing, and signatures still mocked |
| 3 | Meshtastic LoRa (915 MHz) | 🟡 real pipe on both ends (Web Bluetooth in maya-wallet, `LoRaMeshBridge` in pakit-storage); needs end-to-end wiring |
| 4 | On-chain settlement / receipts | ✅ `pallet_belize_mesh` already live: `submit_mesh_transaction`, `submit_relay_proof`, `register_node`, emergency alert family |
| 5 | eSIM / SMS gateway | ❌ deferred — needs gateway server + native app; do not build until after Tier 2/3 |

## Phase 1 (DONE — this commit)
- Deleted `src/services/xmtp.service.ts`; removed `@xmtp/*`, `ethers`, `viem`
  from `maya-wallet` deps. No remaining consumers (verified by grep).
- `MessagingContext.tsx`: stripped all XMTP branches, `via` type is now
  `'mesh' | 'chain'`, `initializeXMTP` removed, `isXMTPConnected` removed,
  mesh auto-init now wired into the mount effect.
- `blockchain-proof.service.ts` **rewritten honestly**: the previous
  implementation called three extrinsics that do not exist on any runtime
  (`interoperability.submitMessageProof`, `community.submitEmergencyAlert`,
  `governance.linkProposalMessage`). Now calls the real
  `pallet_belize_mesh.issueEmergencyAlert` with proper parameter encoding
  (AlertSeverity + EmergencyType + BelizeDistrict + ≤128-byte message +
  duration_blocks). Authority pre-check uses `identity.identityOf`
  'accountType=Government'. Browser fan-out remains via `emergency-broadcast`
  CustomEvent (no runtime subscription in this pallet version yet).

## Phase 2 (next work, ordered by payoff)
1. **Real signatures in `bluetooth-mesh.service.ts`**: replace the fake
   `0x01`-prefixed SHA-256 "signature" with Polkadot `signRaw` (SR25519) via
   the connected wallet account.
2. **Persistence**: conversations + offline Pakit queue currently live only in
   React state / in-memory arrays and are lost on reload. Move to localStorage.
3. **Automated retry loop**: `processQueue()` in the bluetooth service is never
   scheduled — wire it to an interval or reconnect event.
4. **Chain settlement for online mode**: route `sendMessage(mode==='online')`
   through `pallet_belize_mesh.submit_mesh_transaction` for receipts + dedup
   instead of the previous no-op path (this slice is intentionally not yet
   started — UI copy and `mode` routing must be updated together).
5. **Update `via` UI labels** (or introduce channels `'libp2p'` | `'loramesh'`
   mapping to real states in `messages/page.tsx`).

## Phase 3 (LoRa end-to-end)
- Wire `mesh/page.tsx` → Web Bluetooth → Heltec/Meshtastic board →
  Pakit `LoRaMeshBridge` (`pakit-storage/p2p/mesh/lora_bridge.py`) → IPFS →
  `submit_relay_proof`.
- Testable on the Basel testnet with an actual LoRa board (user hardware).

## Deferred (native mobile app)
- Wi-Fi Direct / Wi-Fi-Direct peer discovery (needs Android NsdManager /
  WiFi-Direct APIs; iOS has no equivalent for arbitrary phone-to-phone mesh)
- Hotspot master-node prompting
- eSIM SMS/CoAP emergency trickle (needs a gateway service + roaming profile)

## Verification checklist for Phase 1
- ✅ `npx tsc --noEmit` clean in maya-wallet
- ✅ `next build` succeeds (73 static pages) in maya-wallet
- ✅ blue-hole-portal build clean
- ✅ `npm audit` = 0 vulnerabilities (all Dependabot alerts cleared ecosystem-wide)

## Phase 2 status (DONE — commit 8bfc736, 2026-09-17)
- ✅ Real SR25519 signatures (signRaw via wallet extension; explicit 0x00
  unsigned marker rejected by validateMessage)
- ✅ Conversations persisted to localStorage (200 msgs/conversation bound)
- ✅ Pakit offline queue + proofs persisted and restored across reloads
- ✅ processQueue() retry loop scheduled every 15s from initialize()
- ✅ Incoming dedup cache (bounded 500 ids)

Remaining from Phase 2 list:
- Chain settlement for online mode via submit_mesh_transaction (item 4 —
  needs review of enum encodings against live node before wiring)
- `via` label/channel UI alignment in messages/page.tsx (item 5)

## Phase 2 items 4-5 status (2026-09-17, live-node verified)
- ✅ Live-node verification against Ceiba (spec 105):
  - issueEmergencyAlert encoding builds (27 bytes) exactly as wired — params:
    AlertSeverity, EmergencyType, i32 lat, i32 lon, u32 radius, Bytes msg,
    u32 duration_blocks, BelizeDistrict
  - submitMeshTransaction inspected: anchors FINANCIAL mesh txs and REQUIRES
    the signer to own a registered, ACTIVE GATEWAY node (pallet check
    gateway.owner == who, is_gateway, active). Zero mesh nodes registered on
    the live chain as of this session.
- ✅ Settlement service added (services/pallets/mesh.ts):
  - getGatewayStatus() reads nodesByOwner + meshNodes in their REAL storage
    shapes (AccountId -> Vec<[u8;4]>, [u8;4] hex -> struct)
  - settleMeshTransaction() with fail-fast MESHWAIT gate unless the signer
    owns an active gateway node
  - registerMeshNode() helper (encodings verified against live metadata)
- ✅ MessagingContext online-mode routing: chain settlement via identityPing
  receipt when a gateway node exists; otherwise BLE mesh + Pakit sync.
  gatewayStatus exposed via useMessaging().
- ✅ messages/page.tsx labeled honestly: send path marked as demo view;
  real transport flows through /messages/compose (which IS wired to
  MessagingContext). Success notification copy updated to say so.

## Remaining for full function (tracked, not yet done)
- registerNode for gateway users needs KYC level >= min_kyc_for_registration
  (identity pallet) — UI flow for gateway onboarding not yet built
- submitRelayProof wiring for Pakit bundle proofs (UI touch) — exists in
  pakit-bridge but proof submission still manual/dashboard-only
- Emergency alert runtime subscription (pallet has no push subscription yet)

## Status update (commit 9ace944)
- Gateway onboarding flow: done — real KYC gate from `identity.identityOf`/`ssnAttestations` via `mesh-gateway-onboarding.ts`, validated against live spec-105 metadata (`minKycForRegistration=1`).
- Auto relay proofs: done — `syncNow()` auto-submits real `submitRelayProof` per uploaded bundle (RelayType Transaction, RelayDestination Broadcast, blake2b contentHash), gated on owned+active node from `meshNodes`.
- Emergency alert push: done — real `mesh.EmergencyAlertIssued` subscription via `system.events` in `blockchain-proof.service.ts`, decoded into `EmergencyBroadcast` shape consumed by `MessagingContext`.
- Phase 3 LoRa end-to-end testing deferred: user has no Meshtastic/Heltec board; Web Bluetooth plumbing on both ends stays dormant until hardware is available.
