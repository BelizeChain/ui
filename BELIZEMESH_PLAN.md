# BelizeMesh — Off-Grid Messaging Protocol

> ### ⚠️ CORRECTED 2026-10-15
>
> This plan references `maya-wallet/src/services/pallets/mesh-gateway-onboarding.ts`, which
> was **unreachable and has been removed** (import-graph scan; see
> `docs/audits/AUDIT-UI-00-BASELINE.md` §2). The mesh work that *is* live goes through
> `services/pallets/mesh.ts`, which remains in place. Read references to the onboarding
> module below as design intent, not as existing code.

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
| 2 | BLE phone-to-phone mesh | 🟡 real Web Bluetooth GATT I/O exists; peer discovery, epidemic routing, and signatures still mocked. ⚠️ **Android-only — see "Platform reach" below** |
| 3 | Meshtastic LoRa (915 MHz) | 🟡 real pipe on both ends (Web Bluetooth in maya-wallet, `LoRaMeshBridge` in pakit-storage); needs end-to-end wiring. ⚠️ **Also Android-only via the browser** |
| 3.5 | **Wi-Fi HaLow 802.11ah (256-QAM)** | ❌ **Design only — no hardware, no driver.** The only sub-GHz transport that carries 256-QAM. Complements LoRa rather than replacing it — see below |
| 4 | On-chain settlement / receipts | ✅ `pallet_belize_mesh` already live: `submit_mesh_transaction`, `submit_relay_proof`, `register_node`, emergency alert family |
| 5 | eSIM / SMS gateway | ❌ deferred — needs gateway server + native app; do not build until after Tier 2/3 |

## Transport is now platform-agnostic (2026-11-18)

`maya-wallet/src/services/ble-transport.ts` owns all BLE plumbing. It picks a
transport at runtime, so the mesh service no longer branches on platform:

| Runtime | Transport | iOS | Android | Web |
|---|---|---|---|---|
| Capacitor native shell | `@capacitor-community/bluetooth-le` (CoreBluetooth / android.bluetooth) | ✅ | ✅ | — |
| Browser | `navigator.bluetooth` (Web Bluetooth) | ❌ | ✅ | ✅ Chromium only |

Verified available on npm 2026-11-18: `@capacitor/core` 8.6.2,
`@capacitor-community/bluetooth-le` 8.4.0.

**Not yet wired:** the plugin is imported through a non-literal specifier and is
deliberately absent from `package.json`, so a web build needs no native package.
To activate iOS/Android BLE:

```bash
cd ui/maya-wallet
npm i @capacitor/core @capacitor/cli @capacitor-community/bluetooth-le
npm i -D @capacitor/ios @capacitor/android
npx cap add ios && npx cap add android
```

Then set `SERVER_URL`/`appId` in `capacitor.config.ts` pointing at the hosted
wallet, or bundle the Next.js export. **Requires macOS + Xcode for the iOS
build** — this cannot be produced on Linux.

### iOS limits that remain after native BLE

| Limit | Consequence |
|---|---|
| No background **advertising** | An iOS device can scan and connect, but cannot act as a discoverable relay while backgrounded. Foreground only. |
| Backgrounded GATT is slow | State-restoration works, but throughput is poor; do not design iOS as a routing node |
| App Store review | BLE use needs a declared purpose string; mesh/offline crypto apps get scrutiny |

So iOS becomes a **participant** (send/receive, foreground), not an equal
**relay**. Android remains the better router.

## Signature validation was accepting anything (fixed 2026-11-18)

`validateMessage()` used to end in:

```ts
return /^0x[0-9a-f]{130}$/i.test(sig) || sig.startsWith('0x');
```

Two defects compounded:

1. A real sr25519 signature is **64 bytes → `0x` + 128 hex = 130 characters**.
   The regex demanded 130 *hex digits* after `0x` (132 characters), so it never
   matched a genuine signature.
2. The `||` fallback then accepted **any** string beginning with `0x` — `0x1`,
   `0xdeadbeef`, `0x00` (our own unsigned marker) — so the length check was dead
   code and every inbound message passed "validation".

The catch-all's own comment said receivers must not treat any 0x-prefixed blob
as proof, so this restored stated intent rather than tightening policy.

Now owned by `maya-wallet/src/services/mesh-protocol.ts`:
`isAcceptableSignature()` accepts exactly `0x`+128 hex (sr25519) or `0x`+130 hex
(ecdsa) and rejects everything else, including non-strings.

This was never a cryptographic check and still is not. Real verification belongs
on-chain: the relayer submits `submit_mesh_transaction` and the runtime checks
the signer. The client-side check only keeps obviously unsigned payloads out of
the relay path.

Covered by `maya-wallet/src/services/mesh-protocol.test.ts` — **25 tests**. The
suite was falsified before it was trusted: restoring the old `startsWith('0x')`
behaviour fails exactly the 7 rejection cases, and the fix passes all 25.

Also fixed in the same pass:

| Bug | Effect |
|---|---|
| `processQueue()` never set `failed` | An entry past `MAX_SEND_ATTEMPTS` stayed `pending` forever — filtered out of every pass, never left the queue, and could never be reported as failed |
| `messageQueue` unbounded | Grows without limit across a long offline session; now capped at 200, oldest dropped |
| `discoverPeers()` logged every 30 s | Flooded the console for the whole session, burying real errors |
| `startPeerDiscovery()` discarded its interval handle | A new timer accumulated on every `initialize()` and survived `disconnect()` |

## Wi-Fi HaLow — the 256-QAM transport (Tier 1.5, not built)

BLE and LoRa are both low-throughput by design. If a site needs real bandwidth
over hundreds of metres, the sub-GHz option that actually carries 256-QAM is
**Wi-Fi HaLow, IEEE 802.11ah**. Measured from the standard (2026-11-18):

| Property | Value |
|---|---|
| Modulation | BPSK, QPSK, 16-QAM, 64-QAM, **256-QAM** |
| PHY | OFDM, 64-point FFT at 2 MHz (52 data + 4 pilot subcarriers) |
| Band (US) | **902–928 MHz ISM**, 26 channels at 2 MHz |
| Channel widths | 1, 2, 4, 8, 16 MHz |
| Range | ~1 km radius (802.11ah design target); 256-QAM reaches ~200 m |
| Peak rate | 433.3 Mbit/s at 16 MHz, 4 spatial streams |
| Silicon | Morse Micro MM6108, Newracom NRC7292 |

### Why this cannot be done in software on existing hardware

Our LoRa path is a **Meshtastic board**, i.e. a Semtech SX1262. That part is a
fixed-function modem: it implements LoRa CSS and (G)FSK only. There is no QAM
register and no DSP the host can reach, so 256-QAM cannot be added to it by
writing code. HaLow needs different silicon.

### The trade-off is physics, not implementation

256-QAM needs roughly 30 dB SNR. Long range gives the opposite. The tiers
therefore do not compete — they cover different distances:

| Tech | Modulation | Practical range | Good for |
|---|---|---|---|
| LoRa SF12 | CSS | 10–15 km | caye-to-caye text, emergency alerts |
| LoRa SF7 | CSS | ~2 km | village messaging |
| HaLow MCS0 | OFDM | ~1 km | campus / market coverage |
| **HaLow 256-QAM** | OFDM | **~200 m** | images, contracts, firmware, bulk sync |

A site wanting both runs **two radios**: HaLow for nearby bulk transfer, LoRa
for the long haul. They are complementary, and `pallet_belize_mesh` already
records relay proofs per node, so both can be paid on the same primitive.

**Status: design only.** No HaLow driver integration, no hardware, no tests.
Do not describe it as supported.


## Platform reach — Web Bluetooth excludes every iPhone

**Measured 2026-11-18 against MDN browser-compat-data (`api.Bluetooth.requestDevice`):**

| Browser | `navigator.bluetooth` |
|---|---|
| Chrome / Edge / Opera (desktop) | ✅ |
| Chrome, Opera, Samsung Internet (Android) | ✅ |
| Firefox (all platforms) | ❌ |
| Safari (macOS) | ❌ |
| **Every browser on iOS** | ❌ |
| Android WebView / iOS WebView | ❌ |

The iOS row is not a gap we can close by building harder. Apple requires all
browsers on iOS to use WebKit, and WebKit does not implement Web Bluetooth. So
Chrome-on-iPhone, Firefox-on-iPhone and Safari all report **no** `navigator.bluetooth`.

Consequences, stated plainly:

- **Tiers 2 and 3 cannot function on any iPhone.** Roughly half of Belizean
  smartphone users are on iOS, so any launch claim of "offline mesh payments for
  citizens" is false for that half until a native app exists.
- **No build target fixes this.** Only a native iOS app with CoreBluetooth can,
  and even then iOS will not let a backgrounded app act as a BLE mesh relay the
  way Android can.
- The wallet is a **PWA**, so the rest of it (balances, send/receive online,
  governance) works everywhere. It is specifically the BLE/LoRa transport that
  is Android-only.

What the code does about it now: `detectMeshSupport()` in
`maya-wallet/src/services/bluetooth-mesh.service.ts` returns a typed reason
(`no-api` | `insecure-context`) plus a user-readable explanation, and
`mesh/page.tsx` checks it **before** prompting for a device. Previously an
iPhone user and a user who cancelled the picker both saw "Bluetooth adapter
unavailable", which implied a retry might work.

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
- **iOS BLE mesh.** Web Bluetooth does not exist on iOS at all (see "Platform
  reach" above), so Tier 2 and Tier 3 need CoreBluetooth in a native app before
  any iPhone can take part. iOS also restricts background BLE advertising, so a
  native iOS peer cannot relay the way an Android peer can.
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
