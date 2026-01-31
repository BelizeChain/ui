// Bluetooth Mesh Service for BelizeChain
// Implements offline messaging via Bluetooth LE and WiFi Direct

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
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private peers: Map<string, MeshPeer> = new Map();
  private messageQueue: QueuedMessage[] = [];
  private relayNodes: Set<string> = new Set();
  
  // BelizeChain Mesh Protocol UUIDs
  private readonly SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
  private readonly CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
  
  private readonly MAX_MESSAGE_SIZE = 512; // Bytes
  private readonly MAX_HOPS = 5;
  private readonly DISCOVERY_INTERVAL = 30000; // 30 seconds

  async initialize(): Promise<boolean> {
    if (!navigator.bluetooth) {
      console.error('❌ Web Bluetooth API not available');
      return false;
    }

    try {
      // Request Bluetooth device
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this.SERVICE_UUID] }],
        optionalServices: [this.SERVICE_UUID]
      });

      console.log('✅ Bluetooth device selected:', this.device.name);

      // Connect to GATT server
      const server = await this.device.gatt!.connect();
      console.log('✅ Connected to GATT server');

      // Get mesh service
      const service = await server.getPrimaryService(this.SERVICE_UUID);
      
      // Get characteristic for messaging
      this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);

      // Start listening for messages
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener('characteristicvaluechanged', this.handleIncomingMessage.bind(this));

      // Start peer discovery
      this.startPeerDiscovery();

      console.log('✅ Bluetooth Mesh initialized');
      return true;
    } catch (error) {
      console.error('❌ Bluetooth Mesh initialization failed:', error);
      return false;
    }
  }

  private async startPeerDiscovery() {
    setInterval(async () => {
      try {
        await this.discoverPeers();
      } catch (error) {
        console.error('Peer discovery error:', error);
      }
    }, this.DISCOVERY_INTERVAL);
  }

  private async discoverPeers() {
    // Scan for nearby BelizeChain nodes
    // In production, this would use BLE advertisements
    console.log('🔍 Discovering mesh peers...');
    
    // Mock peer discovery - in production, scan BLE advertisements
    // and identify BelizeChain nodes by service UUID
  }

  private handleIncomingMessage(event: Event) {
    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    
    if (!value) return;

    try {
      // Decode message
      const decoder = new TextDecoder();
      const messageData = decoder.decode(value);
      const message: MeshMessage = JSON.parse(messageData);

      // Validate signature
      if (!this.validateMessage(message)) {
        console.warn('⚠️ Invalid message signature');
        return;
      }

      // Check if message is for us
      if (message.to === this.getLocalAddress()) {
        console.log('📨 Received mesh message:', message);
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
    if (!this.characteristic) {
      console.error('❌ Bluetooth not initialized');
      return false;
    }

    try {
      const message: MeshMessage = {
        id: this.generateMessageId(),
        from: this.getLocalAddress(),
        to,
        content,
        timestamp: new Date(),
        ttl: this.MAX_HOPS,
        signature: await this.signMessage(content),
        route: [this.getLocalAddress()]
      };

      // Queue message
      this.messageQueue.push({
        message,
        status: 'pending',
        attempts: 0
      });

      // Try to send immediately
      return await this.transmitMessage(message);
    } catch (error) {
      console.error('❌ Failed to send mesh message:', error);
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
        console.error('❌ Message too large for mesh transmission');
        return false;
      }

      // Write to characteristic
      await this.characteristic!.writeValue(data);
      console.log('✅ Message transmitted via Bluetooth mesh');
      return true;
    } catch (error) {
      console.error('❌ Transmission failed:', error);
      return false;
    }
  }

  private async relayMessage(message: MeshMessage) {
    // Decrease TTL
    message.ttl--;
    message.route.push(this.getLocalAddress());

    // Check if we've seen this message before (prevent loops)
    if (message.route.filter(addr => addr === this.getLocalAddress()).length > 1) {
      return; // Already relayed this message
    }

    console.log(`📡 Relaying message (TTL: ${message.ttl})`);
    await this.transmitMessage(message);
  }

  private validateMessage(message: MeshMessage): boolean {
    // Verify signature
    // In production: use Polkadot signature verification
    return true;
  }

  private async signMessage(content: string): Promise<string> {
    // Sign with Polkadot keypair
    // In production: use actual wallet signing
    return 'mock_signature';
  }

  private deliverMessage(message: MeshMessage) {
    // Emit event for UI to handle
    const event = new CustomEvent('mesh-message', { detail: message });
    window.dispatchEvent(event);
  }

  private generateMessageId(): string {
    return `mesh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLocalAddress(): string {
    // Get user's BelizeChain address
    // In production: from wallet context
    return 'local_address';
  }

  private isRelayNode(): boolean {
    // Check if this node is configured as relay
    return true; // All nodes can relay by default
  }

  // Process message queue (retry failed messages)
  async processQueue() {
    const pending = this.messageQueue.filter(q => q.status === 'pending' && q.attempts < 3);
    
    for (const queued of pending) {
      queued.attempts++;
      queued.lastAttempt = new Date();
      
      const success = await this.transmitMessage(queued.message);
      queued.status = success ? 'sent' : 'pending';
    }
  }

  // Get nearby peers
  getPeers(): MeshPeer[] {
    return Array.from(this.peers.values());
  }

  // Check if mesh is available
  isAvailable(): boolean {
    return this.device !== null && this.device.gatt?.connected === true;
  }

  // Disconnect
  async disconnect() {
    if (this.device?.gatt?.connected) {
      await this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
    this.peers.clear();
    console.log('✅ Bluetooth Mesh disconnected');
  }
}

export const bluetoothMeshService = new BluetoothMeshService();
export type { MeshPeer, QueuedMessage };
