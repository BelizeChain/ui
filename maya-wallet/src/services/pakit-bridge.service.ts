// Pakit Bridge Service
// Syncs mesh messages to IPFS when gateway comes online

import { getRuntimeConfig } from '@belizechain/shared';
import { initializeApi } from '@/services/blockchain';
import { web3FromAddress } from '@polkadot/extension-dapp';
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
  private pendingProofs: (PakitUploadResponse & { messages: MeshMessage[] })[] = [];
  private pendingMessages: MeshMessage[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 60000; // 1 minute
  private readonly BUNDLE_SIZE_LIMIT = 1024 * 1024; // 1 MB

  private get pakitApiUrl(): string {
    return getRuntimeConfig().pakitApiUrl;
  }

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
      const response = await fetch(`${this.pakitApiUrl}/health`, {
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
      const response = await fetch(`${this.pakitApiUrl}/upload`, {
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
      const response = await fetch(`${this.pakitApiUrl}/retrieve/${ipfsHash}`, {
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
        // Store the uploaded bundle for later proof submission via UI
        // Include the original messages for proof submission
        this.pendingProofs.push({
          ...result,
          messages: bundle
        });
        
        // Proof submission is now handled via the Mesh Operator Dashboard UI
        // The upload process only stores the bundle on IPFS; users will manually submit proofs.
        
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

  /**
   * Submit a mesh relay proof to the blockchain.
   * This method is intended to be called from the UI where the user's Polkadot
   * extension is available to sign the transaction.
   */
  async submitProofs(from: string, ipfsHash: string, messages: MeshMessage[]): Promise<void> {
    const api = await initializeApi();
    // Obtain signer from Polkadot extension
    const injector = await web3FromAddress(from);

    // Build the proof extrinsic. The extrinsic expects (ipfsHash, messageCount, timestamp, telemetry)
    const tx = api.tx.mesh.submitRelayProof(
      ipfsHash,
      messages.length,
      Date.now(),
      // Placeholder telemetry object – adjust fields as required by runtime
      { relayType: 'unknown', sourceNode: '0x0', destination: '0x0', rssi: 0, snr: 0 }
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(from, { signer: injector.signer }, ({ status, events }) => {
        if (status.isInBlock) {
          // Check for extrinsic failures
          const failed = events.find(({ event }) =>
            api.events.system.ExtrinsicFailed.is(event)
          );
          if (failed) {
            const [dispatchError] = failed.event.data as any;
            let message = 'Proof submission failed';
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              message = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
            }
            reject(new Error(message));
          } else {
            console.log('✅ Proof submitted on‑chain');
            resolve();
          }
        }
      }).catch(reject);
    });
  }

  // Deprecated proof submission method retained for reference
  private async submitProofToChain(ipfsHash: string, messages: MeshMessage[]) {
    // Original implementation retained but not used
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

 async getPendingCount(): Promise<number> {
    return this.pendingMessages.length;
  }

  /** Retrieve pending proof bundles that have been uploaded to IPFS but not yet submitted on‑chain */
  /**
   * Retrieve pending proof bundles that have been uploaded to IPFS but not yet submitted on‑chain.
   */
  async getPendingProofs(): Promise<(PakitUploadResponse & { messages: MeshMessage[] })[]> {
    return this.pendingProofs as any;
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
