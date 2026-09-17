// BelizeMesh Emergency Broadcast Service
// Real chain integration for emergency alerts via the Mesh pallet.
//
// Truth table of the previous implementation (all removed):
// - `interoperability.submitMessageProof` — extrinsic never existed
// - `community.submitEmergencyAlert` — extrinsic never existed
// - `governance.linkProposalMessage` — extrinsic never existed
// The only on-chain truth is `pallet_belize_mesh.issue_emergency_alert`
// (verified in belizechain/pallets/mesh/src/lib.rs).

import { ApiPromise } from '@polkadot/api';

export interface EmergencyBroadcast {
  id: string;
  /** AlertSeverity variants of pallet_belize_mesh */
  level: 'advisory' | 'watch' | 'warning' | 'emergency' | 'catastrophic';
  /** Belize district name (BelizeDistrict pallet enum) */
  district: string;
  /** Emergency type (EmergencyType pallet enum) */
  alertType: EmergencyTypeKey;
  /** Decimal degrees */
  latitude: number;
  longitude: number;
  /** Broadcast radius in meters */
  radiusMeters: number;
  /** ≤128 bytes; longer strings are rejected by the pallet (MessageTooLong) */
  message: string;
  /** Minutes; converted to blocks client-side */
  durationMinutes?: number;
  ts: number;
}

type EmergencyTypeKey =
  | 'hurricane' | 'tropicalStorm' | 'flooding' | 'earthquake' | 'tsunami'
  | 'wildfire' | 'severeWeather' | 'publicSafety' | 'infrastructureFailure'
  | 'medicalEmergency' | 'searchAndRescue' | 'general';

const DISTRICT_TO_ENUM: Record<string, string> = {
  belize: 'Belize',
  cayo: 'Cayo',
  orangewalk: 'OrangeWalk',
  corozal: 'Corozal',
  stanncreek: 'StannCreek',
  toledo: 'Toledo',
};

const BLOCKS_PER_MINUTE = 10; // ~6s blocks on testnet; refine after chain tuning

class BlockchainProofService {
  private api: ApiPromise | null = null;

  async initialize(api: ApiPromise) {
    this.api = api;
    console.log('[PROOF] BelizeMesh proof service initialized (pallet_belize_mesh)');
  }

  /**
   * Submit an emergency alert through the mesh pallet.
   *
   * Chain-side prerequisites (runtime truth):
   * - signer must be registered as an emergency authority via the Identity
   *   pallet's is_emergency_authority check
   * - mesh emergency system must be active (config.emergency_system_active)
   * - message ≤ 128 bytes
   */
  async submitEmergencyBroadcast(
    broadcast: Omit<EmergencyBroadcast, 'id' | 'ts'>,
    account: any
  ): Promise<string> {
    if (!this.api) throw new Error('API not initialized');

    const mesh = this.api.tx.mesh as any;
    if (!mesh?.issueEmergencyAlert) {
      throw new Error('pallet_belize_mesh.issueEmergencyAlert not available on this runtime');
    }

    const districtEnum = DISTRICT_TO_ENUM[broadcast.district.toLowerCase()];
    if (!districtEnum) {
      throw new Error(`Unknown Belize district: ${broadcast.district}`);
    }

    // The pallet caps message at 128 bytes — guard before submission.
    const messageBytes = new TextEncoder().encode(broadcast.message);
    if (messageBytes.byteLength > 128) {
      throw new Error('Emergency message exceeds 128-byte limit (MessageTooLong)');
    }

    const durationBlocks = Math.max(
      1,
      Math.round((broadcast.durationMinutes ?? 60) * BLOCKS_PER_MINUTE),
    );

    try {
      const extrinsic = mesh.issueEmergencyAlert(
        { [broadcast.level]: null },           // AlertSeverity
        { [broadcast.alertType]: null },       // EmergencyType
        Math.round(broadcast.latitude),
        Math.round(broadcast.longitude),
        broadcast.radiusMeters,
        Array.from(messageBytes),              // Vec<u8> UTF-8
        durationBlocks,
        { [districtEnum]: null },              // BelizeDistrict
      );

      const hash = await extrinsic.signAndSend(account);
      console.log('[PROOF] Emergency alert submitted via Mesh pallet:', hash.toHex());

      // Fan out locally for UI + browser notification
      const event = new CustomEvent('emergency-broadcast', {
        detail: { ...broadcast, id: hash.toHex(), ts: Date.now() },
      });
      window.dispatchEvent(event);

      return hash.toHex();
    } catch (error) {
      console.error('[PROOF] Failed to submit emergency alert:', error);
      throw error;
    }
  }

  /**
   * Local subscription: the pallet v1 has no alert push subscription; consumers
   * receive the locally-dispatched event above instead (browser notification
   * is handled in MessagingContext once a real mesh peer relays the alert).
   */
  subscribeToEmergencyAlerts(
    callback: (broadcast: EmergencyBroadcast) => void,
  ): () => void {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as EmergencyBroadcast;
      callback(detail);
    };
    window.addEventListener('emergency-broadcast', handler as EventListener);
    return () => window.removeEventListener('emergency-broadcast', handler as EventListener);
  }

  /** Verifies on-chain that the signer is a registered emergency authority */
  async verifyEmergencyAuthority(address: string): Promise<boolean> {
    if (!this.api) return false;
    try {
      const identity = await this.api.query.identity?.identityOf?.(address);
      const identityData = identity as any;
      if (!identityData?.isSome) return false;
      return (identityData.unwrap() as any).info.additional.some(
        (item: [any, any]) =>
          item[0].toString().toLowerCase() === 'accounttype' &&
          item[1].toString().toLowerCase() === 'government',
      );
    } catch (error) {
      console.error('[PROOF] Authority verification failed:', error);
      return false;
    }
  }
}

export const blockchainProofService = new BlockchainProofService();
