// Bluetooth Mesh Service for BelizeChain (BelizeMesh Tier 2)
// Offline messaging via Bluetooth LE connected Meshtastic-style GATT device.
// See BELIZEMESH_PLAN.md — signatures are real SR25519 via the wallet
// extension; routing is TTL-hop over the single GATT pipe (a true
// phone-to-phone mesh needs the native mobile app, per plan).

import { web3FromAddress } from '@polkadot/extension-dapp';

import { connectMeshLink, type BleLink } from './ble-transport';
import { detectMeshSupport, isAcceptableSignature, type MeshSupport } from './mesh-protocol';

// Re-exported so existing callers (`mesh/page.tsx`) keep their import path.
export { detectMeshSupport, isAcceptableSignature };
export type { MeshSupport };

// Web Bluetooth API type declarations
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options: {
        filters?: Array<{ services?: string[] }>;
        optionalServices?: string[];
      }): Promise<BluetoothDevice>;
    };
  }

  interface BluetoothDevice {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
  }

  interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
  }

  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    value?: DataView;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void;
  }
}

interface MeshPeer {
  id: string;
  name: string;
  address: string;
  rssi: number; // Signal strength
  lastSeen: Date;
  isRelay: boolean; // Can relay messages to other nodes
}

export interface MeshMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  ttl: number; // Time to live (hops)
  signature: string;
  route: string[]; // Path through mesh
}

interface QueuedMessage {
  message: MeshMessage;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  lastAttempt?: Date;
}

class BluetoothMeshService {
  private link: BleLink | null = null;
  private peers: Map<string, MeshPeer> = new Map();
  private messageQueue: QueuedMessage[] = [];
  private relayNodes: Set<string> = new Set();
  private seenMessageIds: Set<string> = new Set();
  private retryTimer: ReturnType<typeof setInterval> | null = null;
  private discoveryTimer: ReturnType<typeof setInterval> | null = null;
  private hasLoggedNoScanApi = false;

  // BelizeChain Mesh Protocol UUIDs
  private readonly SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
  private readonly CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

  private readonly MAX_MESSAGE_SIZE = 512; // Bytes
  private readonly MAX_HOPS = 5;
  private readonly DISCOVERY_INTERVAL = 30000; // 30 seconds
  private readonly RETRY_INTERVAL = 15000; // 15 seconds
  private readonly MAX_SEEN_MESSAGES = 500;
  private readonly MAX_QUEUE_SIZE = 200;
  private readonly MAX_SEND_ATTEMPTS = 3;

  async initialize(): Promise<boolean> {
    const support = detectMeshSupport();
    if (!support.supported) {
      // Web Bluetooth is an optional Tier-2 capability. Its absence is expected
      // on iOS and Firefox, not an error — logging it as console.error trips the
      // Next.js dev overlay and makes the whole wallet unusable there.
      console.info(`[BLE-MESH] Mesh tier disabled — ${support.detail}`);
      return false;
    }

    // Re-initialising an already-connected session would prompt the user for a
    // device a second time, which looks like a bug.
    if (this.link?.connected) {
      return true;
    }

    // `connectMeshLink` picks Web Bluetooth in a browser and the Capacitor BLE
    // plugin in the native iOS/Android shell — see ble-transport.ts.
    const result = await connectMeshLink({
      serviceUuid: this.SERVICE_UUID,
      characteristicUuid: this.CHARACTERISTIC_UUID,
    });

    if (!result.ok) {
      if (result.reason === 'cancelled') {
        console.info('[BLE-MESH] Pairing cancelled by user.');
      } else {
        console.error(`[BLE-MESH] Bluetooth Mesh initialization failed: ${result.detail}`);
      }
      return false;
    }

    this.link = result.link;
    this.link.onNotify((bytes) => this.handleIncomingMessage(bytes));

    this.startPeerDiscovery();

    // Schedule the retry loop for unsent queued messages
    if (!this.retryTimer) {
      this.retryTimer = setInterval(() => {
        void this.processQueue();
      }, this.RETRY_INTERVAL);
    }

    return true;
  }

  private async startPeerDiscovery() {
    // One interval per service instance. `initialize()` can be called again
    // after a reconnect, and an untracked interval would accumulate a new
    // timer on every call and outlive `disconnect()`.
    if (this.discoveryTimer) return;

    this.discoveryTimer = setInterval(() => {
      void this.discoverPeers().catch((error) => {
        console.error('Peer discovery error:', error);
      });
    }, this.DISCOVERY_INTERVAL);
  }

  private async discoverPeers() {
    // WebBluetooth exposes no scan API: a page cannot enumerate nearby
    // advertisers, it can only connect to a device the user selected. So there
    // is nothing to report here — inventing a peer would put a node that does
    // not exist into the relay list.
    //
    // Logged once rather than every DISCOVERY_INTERVAL; a repeating line every
    // 30s floods the console for the entire session and buries real errors.
    if (!this.hasLoggedNoScanApi) {
      this.hasLoggedNoScanApi = true;
      console.info('[BLE-MESH] No peers discovered — WebBluetooth cannot scan for advertisers.');
    }
  }

  private handleIncomingMessage(bytes: Uint8Array) {
    try {
      // Decode message
      const decoder = new TextDecoder();
      const messageData = decoder.decode(bytes);
      const message: MeshMessage = JSON.parse(messageData);

      // Validate signature
      if (!this.validateMessage(message)) {
        console.warn('[BLE-MESH] Invalid message signature');
        return;
      }

      // Dedup: drop packets we have already processed or relayed
      if (this.seenMessageIds.has(message.id)) {
        return;
      }
      this.seenMessageIds.add(message.id);
      if (this.seenMessageIds.size > this.MAX_SEEN_MESSAGES) {
        // Bound memory: drop the oldest quarter
        const ids = Array.from(this.seenMessageIds);
        for (const id of ids.slice(0, this.MAX_SEEN_MESSAGES / 2)) {
          this.seenMessageIds.delete(id);
        }
      }

      // Check if message is for us
      if (message.to === this.getLocalAddress()) {
        this.deliverMessage(message);
      } else if (message.ttl > 0 && this.isRelayNode()) {
        // Relay message to next hop
        this.relayMessage(message);
      }
    } catch (error) {
      console.error('Error handling incoming message:', error);
    }
  }

  async sendMessage(to: string, content: string): Promise<boolean> {
    if (!this.link) {
      console.error('[BLE-MESH] Bluetooth not initialized');
      return false;
    }

    const from = this.getLocalAddress();
    if (!from) {
      console.error('[BLE-MESH] No connected account — cannot attribute a mesh message.');
      return false;
    }

    try {
      const message: MeshMessage = {
        id: this.generateMessageId(),
        from,
        to,
        content,
        timestamp: new Date(),
        ttl: this.MAX_HOPS,
        signature: await this.signMessage(content),
        route: [from],
      };

      // Queue message
      this.messageQueue.push({
        message,
        status: 'pending',
        attempts: 0
      });

      // Bound the queue. Without a cap a long offline session grows it without
      // limit; the oldest entries are the least likely to still be useful.
      if (this.messageQueue.length > this.MAX_QUEUE_SIZE) {
        const overflow = this.messageQueue.length - this.MAX_QUEUE_SIZE;
        this.messageQueue.splice(0, overflow);
      }

      // Try to send immediately
      return await this.transmitMessage(message);
    } catch (error) {
      console.error('[BLE-MESH] Failed to send mesh message:', error);
      return false;
    }
  }

  private async transmitMessage(message: MeshMessage): Promise<boolean> {
    try {
      // Encode message
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(message));

      // Check size limit
      if (data.byteLength > this.MAX_MESSAGE_SIZE) {
        console.error('[BLE-MESH] Message too large for mesh transmission');
        return false;
      }

      // Write to the mesh characteristic
      await this.link!.write(data);
      return true;
    } catch (error) {
      console.error('[BLE-MESH] Transmission failed:', error);
      return false;
    }
  }

  private async relayMessage(message: MeshMessage) {
    const localAddress = this.getLocalAddress();
    if (!localAddress) return;

    // Decrease TTL
    message.ttl--;
    message.route.push(localAddress);

    // Check if we've seen this message before (prevent loops)
    if (message.route.filter(addr => addr === localAddress).length > 1) {
      return; // Already relayed this message
    }

    await this.transmitMessage(message);
  }

  private validateMessage(message: MeshMessage): boolean {
    if (!message || !message.from) return false;
    return isAcceptableSignature(message.signature);
  }

  private async signMessage(content: string): Promise<string> {
    // Real SR25519 signature via the connected wallet extension (Polkadot
    // signRaw). Falls back to an explicit unsigned marker ONLY when no
    // extension injector is available — receivers must treat such messages
    // as unverified rather than treating any 0x-prefixed blob as proof.
    const from = this.getLocalAddress();
    if (!from) return '0x00'; // no account to sign with
    try {
      const injector = await web3FromAddress(from);
      // `InjectedSigner` types `signRaw` as optional because a signer may only
      // expose `signPayload`. Narrowing here avoids `any` without assuming the
      // method is present.
      const signer = injector?.signer;
      if (signer?.signRaw) {
        const payload = new TextEncoder().encode(content);
        const result = await signer.signRaw({
          address: from,
          type: 'bytes',
          data: `0x${Buffer.from(payload).toString('hex')}`,
        });
        return result.signature;
      }
    } catch (error) {
      console.warn('[BLE-MESH] signRaw unavailable, message will be unsigned:', error);
    }
    return '0x00'; // explicit unsigned marker
  }

  private deliverMessage(message: MeshMessage) {
    // Emit event for UI to handle
    const event = new CustomEvent('mesh-message', { detail: message });
    window.dispatchEvent(event);
  }

  private generateMessageId(): string {
    return `mesh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLocalAddress(): string | null {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('belizechain_active_account');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed?.address === 'string' && parsed.address.length > 0) {
            return parsed.address;
          }
        }
      } catch {
        // Malformed cache — fall through to the honest null below.
      }
    }
    // No connected account means no identity to sign or attribute a message
    // with. Callers must treat this as "cannot send", never invent an address.
    return null;
  }

  private isRelayNode(): boolean {
    // Check if this node is configured as relay
    return true; // All nodes can relay by default
  }

  // Process message queue (retry failed messages)
  async processQueue() {
    const pending = this.messageQueue.filter(
      q => q.status === 'pending' && q.attempts < this.MAX_SEND_ATTEMPTS
    );

    for (const queued of pending) {
      queued.attempts++;
      queued.lastAttempt = new Date();

      const success = await this.transmitMessage(queued.message);
      if (success) {
        queued.status = 'sent';
      } else if (queued.attempts >= this.MAX_SEND_ATTEMPTS) {
        // Without this branch an exhausted entry stays 'pending' forever: it is
        // filtered out of every future pass but never leaves the queue, so the
        // queue only ever grows and the UI can never report the failure.
        queued.status = 'failed';
      }
    }
  }

  /** Snapshot of the send queue, for status display and tests. */
  getQueue(): ReadonlyArray<QueuedMessage> {
    return this.messageQueue;
  }

  // Get nearby peers
  getPeers(): MeshPeer[] {
    return Array.from(this.peers.values());
  }

  // Check if mesh is available
  isAvailable(): boolean {
    return this.link?.connected === true;
  }

  // Disconnect
  async disconnect() {
    if (this.link) {
      await this.link.disconnect();
      this.link = null;
    }
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = null;
    }
    this.hasLoggedNoScanApi = false;
    this.peers.clear();
  }
}

export const bluetoothMeshService = new BluetoothMeshService();
export type { MeshPeer, QueuedMessage };
