// BLE transport abstraction for BelizeMesh (Tier 2).
//
// Why this exists: `navigator.bluetooth` (Web Bluetooth) is implemented only in
// Chromium-family browsers on desktop, Android, and Samsung Internet. It is
// absent from every browser on iOS — Apple requires all iOS browsers to use
// WebKit, and WebKit does not implement Web Bluetooth — and from Android and iOS
// WebViews. Measured against MDN browser-compat-data 2026-11-18.
//
// The wallet is packaged for iOS/Android with Capacitor, where
// `@capacitor-community/bluetooth-le` exposes the platform CoreBluetooth /
// android.bluetooth APIs instead. This module picks whichever transport the
// current runtime has, so the mesh service itself never branches on platform.
//
// The plugin is imported dynamically through a non-literal specifier on
// purpose: the web bundle must not require a native-only package, and the repo
// deliberately keeps it out of `package.json` until the native shell is built.
// If the package is missing at runtime we report `unsupported`, never crash.

/** A live GATT link to one mesh peer. */
export interface BleLink {
  /** Human-readable device name, for the peer list. Empty when unknown. */
  readonly deviceName: string;
  /** True while the underlying GATT connection is up. */
  readonly connected: boolean;
  /** Write one payload to the mesh characteristic. */
  write(bytes: Uint8Array): Promise<void>;
  /** Register a callback for inbound notifications on the characteristic. */
  onNotify(handler: (bytes: Uint8Array) => void): void;
  /** Tear the link down. Safe to call twice. */
  disconnect(): Promise<void>;
}

/** Result of trying to open a link. */
export type BleConnectResult =
  | { ok: true; link: BleLink }
  | { ok: false; reason: 'unsupported' | 'cancelled' | 'failed'; detail: string };

/** Characteristic pair used by the BelizeChain mesh protocol. */
export interface MeshGattIds {
  serviceUuid: string;
  characteristicUuid: string;
}

const NATIVE_PLUGIN_SPECIFIER = '@capacitor-community/bluetooth-le';

/**
 * True when running inside the Capacitor native shell rather than a browser.
 * Capacitor injects `window.Capacitor`; it is absent on the web build.
 */
export function isNativeShell(): boolean {
  if (typeof window === 'undefined') return false;
  const capacitor = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  return capacitor?.isNativePlatform?.() === true;
}

/**
 * Open a BLE link using the best transport this runtime offers.
 *
 * Native shell → Capacitor BLE plugin (works on iOS, incl. CoreBluetooth).
 * Browser      → Web Bluetooth, where the browser implements it.
 * Neither      → `{ ok: false, reason: 'unsupported' }` with a usable message.
 */
export async function connectMeshLink(ids: MeshGattIds): Promise<BleConnectResult> {
  if (isNativeShell()) {
    return connectViaCapacitor(ids);
  }
  return connectViaWebBluetooth(ids);
}

/** Web Bluetooth path. Chromium/Android only — see module header. */
async function connectViaWebBluetooth(ids: MeshGattIds): Promise<BleConnectResult> {
  const bluetooth = typeof navigator === 'undefined' ? undefined : navigator.bluetooth;
  if (!bluetooth) {
    return {
      ok: false,
      reason: 'unsupported',
      detail:
        'Web Bluetooth is unavailable in this browser. It is absent from all iOS ' +
        'browsers and from embedded WebViews, and Firefox does not implement it. ' +
        'Use Chrome, Edge or Opera on Android or desktop, or the native app.',
    };
  }

  try {
    const device = await bluetooth.requestDevice({
      filters: [{ services: [ids.serviceUuid] }],
      optionalServices: [ids.serviceUuid],
    });

    const server = await device.gatt?.connect();
    if (!server) {
      return { ok: false, reason: 'failed', detail: 'GATT server unavailable on the selected device.' };
    }

    const service = await server.getPrimaryService(ids.serviceUuid);
    const characteristic = await service.getCharacteristic(ids.characteristicUuid);
    await characteristic.startNotifications();

    const link: BleLink = {
      deviceName: device.name ?? '',
      get connected() {
        return server.connected;
      },
      async write(bytes: Uint8Array) {
        await characteristic.writeValue(toArrayBuffer(bytes));
      },
      onNotify(handler: (bytes: Uint8Array) => void) {
        characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
          const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
          const value = target.value;
          if (value) handler(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
        });
      },
      async disconnect() {
        if (server.connected) server.disconnect();
      },
    };

    return { ok: true, link };
  } catch (error) {
    // A user dismissing the device chooser throws with NotFoundError. That is a
    // normal outcome, not a fault, so it must not be reported as "failed".
    const name = error instanceof Error ? error.name : '';
    if (name === 'NotFoundError') {
      return { ok: false, reason: 'cancelled', detail: 'No Bluetooth device was selected.' };
    }
    return {
      ok: false,
      reason: 'failed',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Capacitor path — the one that works on iOS.
 *
 * The plugin is `@capacitor-community/bluetooth-le`. Only the handful of members
 * used here are modelled, so a plugin upgrade cannot silently change our call
 * sites, and the module is not required for a web build.
 */
async function connectViaCapacitor(ids: MeshGattIds): Promise<BleConnectResult> {
  const plugin = await loadCapacitorPlugin();
  if (!plugin.ok) {
    return { ok: false, reason: 'unsupported', detail: plugin.detail };
  }
  const ble = plugin.plugin;

  try {
    await ble.initialize({ androidNeverForLocation: true });

    const device = await ble.requestDevice({
      services: [ids.serviceUuid],
      optionalServices: [ids.serviceUuid],
    });

    const deviceId = device.deviceId;
    await ble.connect(deviceId, undefined, undefined, { timeout: 20_000 });

    const notified: Array<(bytes: Uint8Array) => void> = [];
    await ble.startNotifications(deviceId, ids.serviceUuid, ids.characteristicUuid, (value) => {
      const bytes =
        value instanceof DataView
          ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
          : new Uint8Array(value);
      for (const handler of notified) handler(bytes);
    });

    const link: BleLink = {
      deviceName: device.name ?? device.localName ?? '',
      connected: true,
      async write(bytes: Uint8Array) {
        await ble.write(deviceId, ids.serviceUuid, ids.characteristicUuid, toView(bytes));
      },
      onNotify(handler: (bytes: Uint8Array) => void) {
        notified.push(handler);
      },
      async disconnect() {
        try {
          await ble.stopNotifications(deviceId, ids.serviceUuid, ids.characteristicUuid);
        } catch {
          // Already stopped — treat as success.
        }
        await ble.disconnect(deviceId);
      },
    };

    return { ok: true, link };
  } catch (error) {
    return {
      ok: false,
      reason: 'failed',
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Load the Capacitor BLE plugin, or explain why it is unavailable. */
async function loadCapacitorPlugin(): Promise<
  { ok: true; plugin: CapacitorBlePlugin } | { ok: false; detail: string }
> {
  try {
    // Non-literal specifier: keeps webpack from resolving a package the web
    // build does not have. TypeScript types this `any` for the same reason.
    const loaded = (await import(
      /* webpackIgnore: true */ NATIVE_PLUGIN_SPECIFIER
    )) as unknown as CapacitorBlePluginModule;
    const found = loaded.BleClient ?? loaded.default;
    if (!found) {
      return {
        ok: false,
        detail: `${NATIVE_PLUGIN_SPECIFIER} exported no BleClient. Reinstall the plugin.`,
      };
    }
    return { ok: true, plugin: found };
  } catch {
    return {
      ok: false,
      detail:
        'Native BLE plugin is not installed in this build. Add ' +
        `${NATIVE_PLUGIN_SPECIFIER} and rebuild the app.`,
    };
  }
}

/** Wrap bytes as a DataView without copying, as the plugin's write() expects. */
function toView(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/**
 * Copy bytes into a plain ArrayBuffer.
 *
 * Web Bluetooth's `writeValue` takes `BufferSource`, which in current
 * TypeScript lib types is `ArrayBufferView<ArrayBuffer>` — a `Uint8Array`
 * backed by a `SharedArrayBuffer` does not satisfy it. Copying is correct here
 * anyway: mesh payloads are at most 512 bytes.
 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

// ── Minimal structural types for the Capacitor BLE plugin ─────────────────────
// Declared locally rather than imported so the web bundle does not depend on a
// native-only package.

interface CapacitorBleDevice {
  deviceId: string;
  name?: string;
  localName?: string;
}

interface CapacitorBlePlugin {
  initialize(options?: { androidNeverForLocation?: boolean }): Promise<void>;
  requestDevice(options: {
    services: string[];
    optionalServices?: string[];
  }): Promise<CapacitorBleDevice>;
  connect(
    deviceId: string,
    onDisconnect?: (deviceId: string) => void,
    onConnect?: (deviceId: string) => void,
    options?: { timeout?: number },
  ): Promise<void>;
  write(
    deviceId: string,
    service: string,
    characteristic: string,
    value: DataView,
  ): Promise<void>;
  startNotifications(
    deviceId: string,
    service: string,
    characteristic: string,
    callback: (value: DataView | Uint8Array) => void,
  ): Promise<void>;
  stopNotifications(deviceId: string, service: string, characteristic: string): Promise<void>;
  disconnect(deviceId: string): Promise<void>;
}

interface CapacitorBlePluginModule {
  BleClient?: CapacitorBlePlugin;
  default?: CapacitorBlePlugin;
}
