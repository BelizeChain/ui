// Pure mesh protocol logic: capability detection and signature shape checks.
//
// Kept in its own module, free of the wallet/extension imports that
// `bluetooth-mesh.service.ts` needs, so this logic can be unit-tested without a
// browser, a radio, or a Polkadot extension. Everything here is a total
// function over its inputs.

import { isNativeShell } from './ble-transport';

/**
 * Why Web Bluetooth can or cannot be used in the current runtime.
 *
 * `initialize()` returns a bare boolean, which cannot tell a page the
 * difference between "this browser will never support mesh" and "the user
 * dismissed the device picker just now". Those need different UI: the first is
 * permanent and should not offer a retry, the second should. Callers that want
 * that distinction use `detectMeshSupport()` before calling `initialize()`.
 */
export type MeshSupport =
  | { supported: true }
  | { supported: false; reason: 'no-api' | 'insecure-context'; detail: string };

/**
 * Report whether this runtime can reach a BLE API at all.
 *
 * In the Capacitor native shell the answer is yes on both iOS and Android,
 * because `@capacitor-community/bluetooth-le` wraps CoreBluetooth and
 * android.bluetooth. In a browser it depends on Web Bluetooth, which MDN
 * browser-compat-data (2026-11-18) shows is implemented in
 * Chrome/Edge/Opera and Chrome-on-Android only — Safari on macOS, every browser
 * on iOS, Firefox, and all WebViews report no `navigator.bluetooth`.
 */
export function detectMeshSupport(): MeshSupport {
  // Checked first: the native shell has no `navigator.bluetooth` on either
  // platform, so reporting `no-api` here would disable mesh on the one build
  // that can actually use it on iOS.
  if (isNativeShell()) {
    return { supported: true };
  }

  if (typeof navigator === 'undefined' || !navigator.bluetooth) {
    return {
      supported: false,
      reason: 'no-api',
      detail:
        'This browser has no Web Bluetooth support. It is unavailable on all ' +
        'iOS browsers (including Chrome and Firefox on iPhone, which must use ' +
        "Apple's engine) and in embedded WebViews. Mesh needs Chrome, Edge or " +
        'Opera on Android or desktop.',
    };
  }

  // Web Bluetooth is restricted to secure contexts, so plain HTTP fails even
  // where the API exists. Checked separately so the message is actionable.
  // `undefined` is treated as secure: it only means something when false.
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return {
      supported: false,
      reason: 'insecure-context',
      detail: 'Web Bluetooth requires HTTPS (or localhost). Serve the wallet over a secure context.',
    };
  }

  return { supported: true };
}

/** sr25519 public signature: 64 bytes → `0x` + 128 hex characters. */
const SR25519_SIGNATURE = /^0x[0-9a-f]{128}$/i;

/** ecdsa signature: 65 bytes → `0x` + 130 hex characters. */
const ECDSA_SIGNATURE = /^0x[0-9a-f]{130}$/i;

/**
 * Whether a mesh message carries a signature worth trusting.
 *
 * Accepts exactly the two shapes a Polkadot extension's `signRaw` returns:
 * sr25519 (130 characters) and ecdsa (132 characters). `signMessage()` emits
 * the literal `0x00` when no injector is available; that marker means
 * "unsigned" and is rejected here, so a receiver never treats an unverified
 * payload as proof of authorship.
 *
 * This replaces a check that ended in `signature.startsWith('0x')`, which
 * accepted any string with that prefix — including `0x1` — and made the length
 * test above it dead code. Its own comment warned against exactly that, so the
 * change restores stated intent rather than tightening policy.
 *
 * Not a cryptographic verification: it establishes that the field carries
 * plausible signature bytes. Real verification belongs on-chain, where the
 * relayer submits `submit_mesh_transaction` and the runtime checks the signer.
 */
export function isAcceptableSignature(signature: unknown): boolean {
  if (typeof signature !== 'string') return false;
  return SR25519_SIGNATURE.test(signature) || ECDSA_SIGNATURE.test(signature);
}
