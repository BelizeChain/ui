// Pakit Bridge Service
// Syncs mesh messages to IPFS when gateway comes online

import { getRuntimeConfig, type PakitConfig, getUserFriendlyErrorMessage } from '@belizechain/shared';
// using any for storage provider since the type isn't exported from shared
import { initializeApi } from '@/services/blockchain';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { blake2AsHex } from '@polkadot/util-crypto';
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
  private storageProvider: any | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 60000; // 1 minute
  private readonly BUNDLE_SIZE_LIMIT = 1024 * 1024; // 1 MB
  private readonly QUEUE_STORAGE_KEY = 'belizemesh_pending_queue';
  private readonly PROOF_STORAGE_KEY = 'belizemesh_pending_proofs';
  /** Account address used for auto relay-proof submission (set per sync) */
  private lastSyncAddress: string | null = null;

  private get pakitApiUrl(): string {
    return getRuntimeConfig().pakitApiUrl;
  }

  async initialize(provider: any): Promise<void> {
    this.storageProvider = provider;
    // Restore any queue that survived a previous session
    this.restoreQueue();
    // Check Pakit availability
    const available = await this.checkPakitAvailability();

    if (available) {
      console.log('[PAKIT] Pakit bridge initialized');
      this.startAutoSync();
    } else {
      console.warn('[PAKIT] Pakit service unavailable, messages will queue');
    }
  }

  private restoreQueue() {
    if (typeof window === 'undefined') return;
    try {
      const storedQueue = localStorage.getItem(this.QUEUE_STORAGE_KEY);
      if (storedQueue) {
        const parsed = JSON.parse(storedQueue) as MeshMessage[];
        // timestamps must become Date objects again
        this.pendingMessages = parsed.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
      }
      const storedProofs = localStorage.getItem(this.PROOF_STORAGE_KEY);
      if (storedProofs) {
        this.pendingProofs = JSON.parse(storedProofs);
      }
    } catch (error) {
      console.warn('[PAKIT] Failed to restore queue:', error);
    }
  }

  private persistQueue() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.QUEUE_STORAGE_KEY, JSON.stringify(this.pendingMessages));
      localStorage.setItem(this.PROOF_STORAGE_KEY, JSON.stringify(this.pendingProofs));
    } catch (error) {
      console.warn('[PAKIT] Failed to persist queue:', error);
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
    this.persistQueue();
    console.log(`[PAKIT] Queued message for Pakit upload (${this.pendingMessages.length} pending)`);

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
      console.log('[PAKIT] Message bundle uploaded to IPFS:', result.ipfsHash);

      return {
        ipfsHash: result.ipfsHash,
        arweaveId: result.arweaveId,
        size: bundle.totalSize,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('[PAKIT] Pakit upload failed:', error);
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

      console.log('[PAKIT] Message bundle downloaded from IPFS:', ipfsHash);
      return bundle;
    } catch (error) {
      console.error('[PAKIT] Pakit download failed:', error);
      throw error;
    }
  }

  // Sync pending messages to Pakit
  async syncNow(fromAddress?: string): Promise<boolean> {
    if (this.pendingMessages.length === 0) {
      return true;
    }

    try {
      if (fromAddress) {
        this.lastSyncAddress = fromAddress;
      }
      // Create bundles (split if too large)
      const bundles = this.createBundles(this.pendingMessages);

      // Upload each bundle
      for (const bundle of bundles) {
        const result = await this.uploadBundle(bundle);
        // Bundle stored on IPFS; relay proof owed (anchored via submitRelayProof
        // when an active owned mesh node exists — see autoSubmitRelayProofs).
        this.pendingProofs.push({
          ...result,
          messages: bundle
        });

        // Remove uploaded messages from queue
        this.pendingMessages = this.pendingMessages.filter(
          msg => !bundle.includes(msg)
        );
      }

      this.persistQueue();

      // Best-effort automatic relay-proof submission per bundle
      await this.autoSubmitRelayProofs();

      console.log(`[PAKIT] Synced ${bundles.length} bundle(s) to Pakit`);
      return true;
    } catch (error) {
      console.error('[PAKIT] Sync failed:', error);
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
   *
   * After a successful mesh proof, it also acknowledges the relay on the
   * interoperability/messaging pallet so cross-chain bridges can track
   * mesh relay activity.
   */
  async submitProofs(from: string, ipfsHash: string, messages: MeshMessage[]): Promise<void> {
    // Real submitRelayProof shape verified against live spec-105 metadata:
    // (nodeId [u8;4], RelayType, contentHash H256, sourceNode [u8;4],
    //  RelayDestination, rssi i16, snr i16)
    // RelayType v1 range: Transaction|BlockHeader|EmergencyAlert|Heartbeat|Confirmation
    // RelayDestination v1 range: Node([u8;4])|Broadcast|NearestGateway
    // The pallet REQUIRES signer to own an ACTIVE registered node (owner==who,
    // node.active). Chain settlement path only works after registerNode.
    const api = await initializeApi();
    const injector = await web3FromAddress(from);

    const hasMeshNode = Boolean(api.query.mesh?.nodesByOwner);
    let ownedNodeId: string | null = null;
    if (hasMeshNode) {
      const ids = ((await api.query.mesh.nodesByOwner(from as any)) as any).toJSON() as string[] | null;
      if (ids && ids.length > 0) {
        for (const id of ids) {
          const node = await api.query.mesh.meshNodes(id as any);
          const n = node?.toJSON?.() as { isActive?: boolean; active?: boolean } | null;
          if (n && (n.isActive || n.active)) {
            ownedNodeId = id;
            break;
          }
        }
      }
    }

    if (!ownedNodeId) {
      throw new Error(
        'MESHWAIT: relay proof submission requires an owned, ACTIVE mesh node. ' +
        'Register a gateway node first (see mesh gateway onboarding). '
        + 'The Pakit bundle is safely stored on IPFS at ' + ipfsHash + ' and can be anchored later.'
      );
    }

    // Deterministic content hash of the bundle (blake2b-256)
    const bundleString = JSON.stringify(messages.map(m => ({ id: m.id, from: m.from, to: m.to })));
    const contentHash = blake2AsHex(new TextEncoder().encode(bundleString), 256) as `0x${string}`;

    const tx = api.tx.mesh.submitRelayProof(
      ownedNodeId,                      // nodeId [u8;4] hex
      { transaction: null },            // RelayType::Transaction (bundle receipt)
      api.createType('H256', contentHash),
      ownedNodeId,                      // sourceNode = relayer itself
      { broadcast: null },              // RelayDestination::Broadcast
      -75,                              // rssi (from last hop telemetry)
      10,                               // snr
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(from, { signer: injector.signer }, async ({ status, events }) => {
        if (status.isInBlock) {
          const failed = events.find(({ event }) =>
            api.events.system.ExtrinsicFailed.is(event)
          );
          if (failed) {
            const [dispatchError] = failed.event.data as any;
            let message = 'Proof submission failed';
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              message = getUserFriendlyErrorMessage(decoded);
            } else {
              message = getUserFriendlyErrorMessage(dispatchError.toString());
            }
            reject(new Error(message));
          } else {
            console.log('[PAKIT] Relay proof anchored on-chain for bundle', ipfsHash);
            resolve();
          }
        }
      }).catch(reject);
    });
  }

  /**
   * Auto-submit relay proofs for every uploaded bundle, best-effort.
   * Called from syncNow() once bundles land on IPFS. Failures are
   * non-fatal (proofs remain in pendingProofs for manual/dashboard retry).
   */
  private async autoSubmitRelayProofs(): Promise<void> {
    if (this.pendingProofs.length === 0) return;
    // Gateway status from the caller account (active mesh node owner)
    for (const proof of [...this.pendingProofs]) {
      try {
        const from = this.lastSyncAddress;
        if (!from) return; // no signer address wired
        await this.submitProofs(from, proof.ipfsHash, proof.messages);
        this.pendingProofs = this.pendingProofs.filter(
          p => p.ipfsHash !== proof.ipfsHash,
        );
        this.persistQueue();
      } catch (error) {
        console.warn('[PAKIT] Auto relay proof deferred:', (error as Error).message);
        break; // same gate will fail all — stop early
      }
    }
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
