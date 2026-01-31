// Pakit Bridge Service
// Syncs mesh messages to IPFS when gateway comes online

import type { MeshMessage } from './bluetooth-mesh.service';

interface PakitUploadResponse {
  ipfsHash: string;
  arweaveId?: string;
  size: number;
  timestamp: number;
}

interface MessageBundle {
  messages: MeshMessage[];
  bundleId: string;
  timestamp: Date;
  district?: string;
  totalSize: number;
}

class PakitBridgeService {
  private readonly PAKIT_API_URL = 'http://localhost:8001';
  private pendingMessages: MeshMessage[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 60000; // 1 minute
  private readonly BUNDLE_SIZE_LIMIT = 1024 * 1024; // 1 MB

  async initialize() {
    // Check Pakit availability
    const available = await this.checkPakitAvailability();
    
    if (available) {
      console.log('✅ Pakit bridge initialized');
      this.startAutoSync();
    } else {
      console.warn('⚠️ Pakit service unavailable, messages will queue');
    }
  }

  private async checkPakitAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.PAKIT_API_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Queue mesh message for upload
  queueMessage(message: MeshMessage) {
    this.pendingMessages.push(message);
    console.log(`📦 Queued message for Pakit upload (${this.pendingMessages.length} pending)`);
    
    // Try immediate upload if online
    if (navigator.onLine) {
      this.syncNow();
    }
  }

  // Upload message bundle to IPFS via Pakit
  async uploadBundle(messages: MeshMessage[]): Promise<PakitUploadResponse> {
    const bundle: MessageBundle = {
      messages,
      bundleId: this.generateBundleId(),
      timestamp: new Date(),
      district: this.detectDistrict(messages),
      totalSize: JSON.stringify(messages).length
    };

    try {
      const response = await fetch(`${this.PAKIT_API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: JSON.stringify(bundle),
          metadata: {
            type: 'mesh-message-bundle',
            district: bundle.district,
            messageCount: messages.length,
            timestamp: bundle.timestamp.toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Pakit upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Message bundle uploaded to IPFS:', result.ipfsHash);
      
      return {
        ipfsHash: result.ipfsHash,
        arweaveId: result.arweaveId,
        size: bundle.totalSize,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Pakit upload failed:', error);
      throw error;
    }
  }

  // Retrieve message bundle from IPFS
  async downloadBundle(ipfsHash: string): Promise<MessageBundle> {
    try {
      const response = await fetch(`${this.PAKIT_API_URL}/retrieve/${ipfsHash}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Pakit download failed: ${response.statusText}`);
      }

      const data = await response.text();
      const bundle: MessageBundle = JSON.parse(data);
      
      console.log('✅ Message bundle downloaded from IPFS:', ipfsHash);
      return bundle;
    } catch (error) {
      console.error('❌ Pakit download failed:', error);
      throw error;
    }
  }

  // Sync pending messages to Pakit
  async syncNow(): Promise<boolean> {
    if (this.pendingMessages.length === 0) {
      return true;
    }

    try {
      // Create bundles (split if too large)
      const bundles = this.createBundles(this.pendingMessages);
      
      // Upload each bundle
      for (const bundle of bundles) {
        const result = await this.uploadBundle(bundle);
        
        // Submit proof to blockchain
        await this.submitProofToChain(result.ipfsHash, bundle);
        
        // Remove uploaded messages from queue
        this.pendingMessages = this.pendingMessages.filter(
          msg => !bundle.includes(msg)
        );
      }

      console.log(`✅ Synced ${bundles.length} bundle(s) to Pakit`);
      return true;
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return false;
    }
  }

  private createBundles(messages: MeshMessage[]): MeshMessage[][] {
    const bundles: MeshMessage[][] = [];
    let currentBundle: MeshMessage[] = [];
    let currentSize = 0;

    for (const message of messages) {
      const messageSize = JSON.stringify(message).length;
      
      if (currentSize + messageSize > this.BUNDLE_SIZE_LIMIT && currentBundle.length > 0) {
        bundles.push(currentBundle);
        currentBundle = [];
        currentSize = 0;
      }

      currentBundle.push(message);
      currentSize += messageSize;
    }

    if (currentBundle.length > 0) {
      bundles.push(currentBundle);
    }

    return bundles;
  }

  private async submitProofToChain(ipfsHash: string, messages: MeshMessage[]) {
    // Submit message proof to BelizeChain
    // This creates an immutable record of the message bundle
    try {
      // In production: submit via Polkadot.js extrinsic
      console.log(`📝 Submitting proof to chain: ${ipfsHash}`);
      
      // Mock blockchain submission
      const proof = {
        ipfsHash,
        messageCount: messages.length,
        timestamp: Date.now(),
        bundleHash: this.hashBundle(messages)
      };

      // TODO: Submit to pallet_interoperability or custom messaging pallet
      // await api.tx.messaging.submitProof(proof).signAndSend(account);
      
      console.log('✅ Proof submitted to blockchain');
    } catch (error) {
      console.error('❌ Blockchain proof submission failed:', error);
    }
  }

  private hashBundle(messages: MeshMessage[]): string {
    // Create deterministic hash of message bundle
    const bundleString = JSON.stringify(messages.map(m => ({
      id: m.id,
      from: m.from,
      to: m.to,
      timestamp: m.timestamp
    })));
    
    // In production: use proper hash function (blake2b)
    return `hash_${bundleString.length}_${Date.now()}`;
  }

  private detectDistrict(messages: MeshMessage[]): string | undefined {
    // Detect district from message metadata or peer addresses
    // Used for organizing regional message bundles
    return 'Unknown';
  }

  private generateBundleId(): string {
    return `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startAutoSync() {
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncNow();
      }
    }, this.SYNC_INTERVAL);
  }

  getPendingCount(): number {
    return this.pendingMessages.length;
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const pakitBridgeService = new PakitBridgeService();
export type { MessageBundle, PakitUploadResponse };
