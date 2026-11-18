import { afterEach, describe, expect, it, vi } from 'vitest';

import { isNativeShell } from './ble-transport';
import { detectMeshSupport, isAcceptableSignature } from './mesh-protocol';

// The mesh service is browser code, but the logic that decides "may this device
// join the mesh" and "is this payload signed" is pure. Those are exactly the
// parts that must not regress silently, and neither needs a radio to test.
//
// The repo's vitest `environment` is `node`, so globals are stubbed per test
// rather than pulled in with jsdom. `mesh-protocol.ts` deliberately holds no
// wallet or extension imports so this file can run without a browser.

const REAL_SR25519_SIGNATURE = '0x' + 'a1'.repeat(64); // 64 bytes → 130 chars
const REAL_ECDSA_SIGNATURE = '0x' + 'b2'.repeat(65); // 65 bytes → 132 chars

function stubBluetooth(present: boolean): void {
  vi.stubGlobal('navigator', { bluetooth: present ? {} : undefined });
}

function stubWindow(shape: Record<string, unknown> | undefined): void {
  vi.stubGlobal('window', shape);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isAcceptableSignature', () => {
  it('accepts a 64-byte sr25519 signature', () => {
    expect(REAL_SR25519_SIGNATURE).toHaveLength(130);
    expect(isAcceptableSignature(REAL_SR25519_SIGNATURE)).toBe(true);
  });

  it('accepts a 65-byte ecdsa signature', () => {
    expect(REAL_ECDSA_SIGNATURE).toHaveLength(132);
    expect(isAcceptableSignature(REAL_ECDSA_SIGNATURE)).toBe(true);
  });

  it('is case-insensitive about hex digits', () => {
    expect(isAcceptableSignature('0x' + 'AB'.repeat(64))).toBe(true);
  });

  // The regression this function exists to prevent: the previous check ended in
  // `signature.startsWith('0x')`, so every one of these was accepted as signed.
  it.each([
    ['the explicit unsigned marker', '0x00'],
    ['a bare prefix', '0x'],
    ['one hex digit', '0x1'],
    ['a short blob', '0xdeadbeef'],
    ['a signature one nibble too short', '0x' + 'a'.repeat(127)],
    ['a signature one nibble too long', '0x' + 'a'.repeat(131)],
    ['right length, non-hex characters', '0x' + 'z'.repeat(128)],
    ['a base58 address', '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'],
    ['the empty string', ''],
  ])('rejects %s', (_label, signature) => {
    expect(isAcceptableSignature(signature)).toBe(false);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a number', 12345],
    ['an object', { signature: '0x' + 'a'.repeat(128) }],
  ])('rejects %s rather than throwing', (_label, value) => {
    expect(isAcceptableSignature(value)).toBe(false);
  });
});

describe('isNativeShell', () => {
  it('is false when Capacitor is absent', () => {
    stubWindow({ isSecureContext: true });
    expect(isNativeShell()).toBe(false);
  });

  it('is false when Capacitor reports a web platform', () => {
    stubWindow({ Capacitor: { isNativePlatform: () => false } });
    expect(isNativeShell()).toBe(false);
  });

  it('is true when Capacitor reports a native platform', () => {
    stubWindow({ Capacitor: { isNativePlatform: () => true } });
    expect(isNativeShell()).toBe(true);
  });

  it('is false when there is no window at all', () => {
    expect(typeof window).toBe('undefined');
    expect(isNativeShell()).toBe(false);
  });
});

describe('detectMeshSupport', () => {
  it('reports supported inside the native shell even with no navigator.bluetooth', () => {
    // The iOS case: the Capacitor build has no Web Bluetooth but does have
    // CoreBluetooth. Reporting `no-api` here would disable mesh on the only
    // build that can use it.
    stubWindow({ Capacitor: { isNativePlatform: () => true } });
    stubBluetooth(false);

    expect(detectMeshSupport()).toEqual({ supported: true });
  });

  it('reports no-api on iOS-like browsers and names iOS in the detail', () => {
    stubWindow({ isSecureContext: true });
    stubBluetooth(false);

    const result = detectMeshSupport();
    expect(result.supported).toBe(false);
    if (result.supported) throw new Error('unreachable');
    expect(result.reason).toBe('no-api');
    expect(result.detail).toMatch(/iOS/);
  });

  it('reports insecure-context when the API exists but the page is not secure', () => {
    stubBluetooth(true);
    stubWindow({ isSecureContext: false });

    const result = detectMeshSupport();
    expect(result.supported).toBe(false);
    if (result.supported) throw new Error('unreachable');
    expect(result.reason).toBe('insecure-context');
    expect(result.detail).toMatch(/HTTPS/);
  });

  it('reports supported on a secure Chromium page', () => {
    stubBluetooth(true);
    stubWindow({ isSecureContext: true });

    expect(detectMeshSupport()).toEqual({ supported: true });
  });

  it('treats an undefined isSecureContext as secure rather than failing', () => {
    // Older WebViews omit isSecureContext. It is only meaningful when false, so
    // refusing to start mesh there would be wrong.
    stubBluetooth(true);
    stubWindow({ isSecureContext: undefined });

    expect(detectMeshSupport()).toEqual({ supported: true });
  });
});
