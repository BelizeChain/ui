// Blockchain Messaging Proof Service
// Anchors message proofs on BelizeChain for governance and emergency broadcasts

import { ApiPromise } from '@polkadot/api';

interface MessageProof {
  ipfsHash: string;
  bundleHash: string;
  messageCount: number;
  timestamp: number;
  district?: string;
  proofType: 'mesh-bundle' | 'governance-proposal' | 'emergency-broadcast';
}

interface GovernanceMessage {
  proposalId: number;
  messageHash: string;
  ipfsHash: string;
  author: string;
  timestamp: number;
}

export interface EmergencyBroadcast {
  id: string;
  level: 'info' | 'warning' | 'critical';
  district: string;
  message: string;
  ipfsHash: string;
  authoritySignature: string;
  timestamp: number;
  expiresAt: number;
}

class BlockchainProofService {
  private api: ApiPromise | null = null;

  async initialize(api: ApiPromise) {
    this.api = api;
    console.log('✅ Blockchain proof service initialized');
  }

  // Submit message proof to chain
  async submitMessageProof(
    proof: MessageProof,
    account: any
  ): Promise<string> {
    if (!this.api) throw new Error('API not initialized');

    try {
      // Submit to Interoperability pallet (repurposed for messaging)
      // In production: create dedicated pallet_messaging
      const extrinsic = this.api.tx.interoperability.submitMessageProof(
        proof.ipfsHash,
        proof.bundleHash,
        proof.messageCount,
        proof.district || 'Unknown'
      );

      const hash = await extrinsic.signAndSend(account);
      console.log('✅ Message proof submitted:', hash.toHex());
      return hash.toHex();
    } catch (error) {
      console.error('❌ Failed to submit message proof:', error);
      throw error;
    }
  }

  // Link governance proposal to message
  async linkGovernanceMessage(
    proposalId: number,
    ipfsHash: string,
    account: any
  ): Promise<string> {
    if (!this.api) throw new Error('API not initialized');

    try {
      const governanceMessage: GovernanceMessage = {
        proposalId,
        messageHash: this.hashMessage(ipfsHash),
        ipfsHash,
        author: account.address,
        timestamp: Date.now()
      };

      // Submit to Governance pallet
      const extrinsic = this.api.tx.governance.linkProposalMessage(
        proposalId,
        ipfsHash,
        governanceMessage.messageHash
      );

      const hash = await extrinsic.signAndSend(account);
      console.log('✅ Governance message linked:', hash.toHex());
      return hash.toHex();
    } catch (error) {
      console.error('❌ Failed to link governance message:', error);
      throw error;
    }
  }

  // Submit emergency broadcast (requires authority)
  async submitEmergencyBroadcast(
    broadcast: EmergencyBroadcast,
    account: any
  ): Promise<string> {
    if (!this.api) throw new Error('API not initialized');

    try {
      // Verify authority (must be government account or validator)
      const isAuthorized = await this.verifyBroadcastAuthority(account.address);
      if (!isAuthorized) {
        throw new Error('Not authorized to submit emergency broadcasts');
      }

      // Submit to Community pallet (emergency alerts)
      const extrinsic = this.api.tx.community.submitEmergencyAlert(
        broadcast.district,
        broadcast.level,
        broadcast.message,
        broadcast.ipfsHash,
        broadcast.expiresAt
      );

      const hash = await extrinsic.signAndSend(account);
      console.log('🚨 Emergency broadcast submitted:', hash.toHex());
      
      // Trigger mesh broadcast to offline nodes
      this.broadcastViaAllChannels(broadcast);
      
      return hash.toHex();
    } catch (error) {
      console.error('❌ Failed to submit emergency broadcast:', error);
      throw error;
    }
  }

  // Verify message proof on chain
  async verifyMessageProof(ipfsHash: string): Promise<boolean> {
    if (!this.api) throw new Error('API not initialized');

    try {
      // Query chain storage for proof
      const proof = await this.api.query.interoperability.messageProofs(ipfsHash);
      const proofData = proof as any;
      return proofData.isSome;
    } catch (error) {
      console.error('❌ Failed to verify message proof:', error);
      return false;
    }
  }

  // Get governance proposal messages
  async getGovernanceMessages(proposalId: number): Promise<GovernanceMessage[]> {
    if (!this.api) throw new Error('API not initialized');

    try {
      const messages = await this.api.query.governance.proposalMessages(proposalId);
      return messages.toJSON() as any;
    } catch (error) {
      console.error('❌ Failed to get governance messages:', error);
      return [];
    }
  }

  // Get active emergency broadcasts for district
  async getEmergencyBroadcasts(district?: string): Promise<EmergencyBroadcast[]> {
    if (!this.api) throw new Error('API not initialized');

    try {
      const broadcasts = district
        ? await this.api.query.community.districtAlerts(district)
        : await this.api.query.community.activeAlerts();
      
      return (broadcasts.toJSON() as any).filter((b: EmergencyBroadcast) => 
        b.expiresAt > Date.now()
      );
    } catch (error) {
      console.error('❌ Failed to get emergency broadcasts:', error);
      return [];
    }
  }

  // Subscribe to emergency broadcasts
  subscribeToEmergencyAlerts(
    callback: (broadcast: EmergencyBroadcast) => void,
    district?: string
  ): () => void {
    if (!this.api) throw new Error('API not initialized');

    let unsubscribe: (() => void) | undefined;

    (async () => {
      const unsub = await this.api!.query.community.activeAlerts((alerts: any) => {
        const broadcasts = alerts.toJSON() as EmergencyBroadcast[];
        broadcasts
          .filter(b => !district || b.district === district)
          .forEach(callback);
      });
      unsubscribe = unsub as any;
    })();

    return () => unsubscribe?.();
  }

  private async verifyBroadcastAuthority(address: string): Promise<boolean> {
    if (!this.api) return false;

    try {
      // Check if address is government account or validator
      const isValidator = await this.api.query.staking.validators(address);
      const validatorData = isValidator as any;
      const identity = await this.api.query.identity.identityOf(address);
      const identityData = identity as any;
      
      return validatorData.isSome || 
             (identityData.isSome && (identityData.unwrap() as any).info.additional.some(
               (item: any) => item[0].toString() === 'accountType' && item[1].toString() === 'Government'
             ));
    } catch (error) {
      console.error('❌ Authority verification failed:', error);
      return false;
    }
  }

  private async broadcastViaAllChannels(broadcast: EmergencyBroadcast) {
    // Broadcast through multiple channels
    console.log('🚨 Broadcasting emergency alert through all channels');
    
    // 1. XMTP broadcast to all conversations
    // 2. Bluetooth mesh broadcast
    // 3. SMS gateway (if available)
    // 4. Push notifications
    
    // Trigger custom event for UI
    const event = new CustomEvent('emergency-broadcast', { detail: broadcast });
    window.dispatchEvent(event);
  }

  private hashMessage(content: string): string {
    // In production: use blake2b hash
    return `0x${content.slice(0, 64)}`;
  }
}

export const blockchainProofService = new BlockchainProofService();
export type { MessageProof, GovernanceMessage };
