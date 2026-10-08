/**
 * BelizeChain Meshtastic LoRa Mesh Network Pallet Service
 * Handles off-grid P2P transactions, BLE radio pairing, Relay Mining, and NEMO Emergency Broadcasts
 */

import { initializeApi } from '../blockchain';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { bytesToString } from '../../lib/codec';
import { BELIZE_DISTRICTS } from '../../lib/districts';

/** DALLA has 12 decimals. */
const DALLA_DECIMALS = 12n;

function formatDalla(planck: bigint): string {
  const base = 10n ** DALLA_DECIMALS;
  const whole = planck / base;
  const frac = (planck % base).toString().padStart(Number(DALLA_DECIMALS), '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole.toString();
}

export interface MeshRadioHardware {
  id: string;
  name: string;
  hardwareType: 'HeltecV3' | 'TBeam' | 'TBeamSupreme' | 'RAKWisBlock' | 'StationG2';
  frequency: '915MHz (US/Belize)' | '868MHz (EU)' | '433MHz (Asia)';
  batteryPercent: number;
  snr: number; // Signal-to-noise ratio in dB
  channelUtilization: number; // Percentage
  hops: number;
  connectionStatus: 'Connected' | 'Scanning' | 'Disconnected';
  pairedDeviceName?: string;
}

export interface RelayMiningStats {
  nodeId: string;
  packetsRelayed: number;
  transactionsRelayed: number;
  reputationScore: number; // 0 - 10000
  /** The pallet records no uptime metric, so this is genuinely unknown. */
  uptimePercent: number | null;
  unclaimedRewardsDalla: string;
  /** The pallet records no lifetime-total metric, only the claimable balance. */
  totalMinedDalla: string | null;
  isGateway: boolean;
}

export interface EmergencyAlert {
  id: string;
  message: string;
  severity: string;
  alertType: string;
  /** AccountId of the issuing authority — the pallet stores an account, not an agency name. */
  issuer: string;
  /** The pallet stores one district per alert, not a list of targets. */
  district: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  createdAt: number;
  expiresAt: number;
  resolved: boolean;
  relayCount: number;
  confirmations: number;
}

/**
 * On-chain mesh aggregates derived from `mesh.meshNodes`.
 *
 * There is deliberately no per-district repeater breakdown: a node's `region`
 * field is a LoRa *frequency band* (US915 / EU868 / CN433 …), not a geographic
 * district, so the chain cannot say how many repeaters sit in Cayo vs Toledo.
 * An earlier version of this file invented those per-district numbers, plus a
 * "signal strength" and "water coverage km" that no pallet measures.
 */
export interface MeshNetworkCoverage {
  totalNodes: number;
  activeNodes: number;
  gatewayNodes: number;
  messagesRelayed: number;
  transactionsRelayed: number;
  emergencyAlertsSent: number;
  /** Highest `lastSeen` block across nodes, or null when no node reports one. */
  lastSeenBlock: number | null;
}

/** Real per-district alert load, from `mesh.activeAlertCountPerDistrict`. */
export interface DistrictAlertLoad {
  district: string;
  activeAlerts: number;
}

/**
 * Read whole-network aggregates from `mesh.meshNodes`.
 * Returns null when the pallet is unavailable so callers can show an honest
 * empty state rather than a plausible-looking number.
 */
export async function getMeshNetworkCoverage(): Promise<MeshNetworkCoverage | null> {
  try {
    const api = await initializeApi();
    if (!api.query.mesh?.meshNodes) return null;

    const entries = await api.query.mesh.meshNodes.entries();
    const coverage: MeshNetworkCoverage = {
      totalNodes: 0,
      activeNodes: 0,
      gatewayNodes: 0,
      messagesRelayed: 0,
      transactionsRelayed: 0,
      emergencyAlertsSent: 0,
      lastSeenBlock: null,
    };

    for (const [, raw] of entries as any[]) {
      const node: any = raw?.toJSON?.();
      if (!node) continue;
      coverage.totalNodes += 1;
      if (node.active) coverage.activeNodes += 1;
      if (node.active && node.isGateway) coverage.gatewayNodes += 1;
      coverage.messagesRelayed += Number(node.messagesRelayed ?? 0);
      coverage.transactionsRelayed += Number(node.transactionsRelayed ?? 0);
      coverage.emergencyAlertsSent += Number(node.emergencyAlertsSent ?? 0);
      const seen = Number(node.lastSeen ?? 0);
      if (coverage.lastSeenBlock === null || seen > coverage.lastSeenBlock) {
        coverage.lastSeenBlock = seen;
      }
    }

    return coverage;
  } catch (err) {
    console.error('Failed to read mesh network coverage:', err);
    return null;
  }
}

/**
 * Active alert count for each of the six national districts.
 * `BELIZE_DISTRICTS` order matches the chain's `BelizeDistrict` enum once
 * whitespace is stripped ("Orange Walk" -> OrangeWalk, "Stann Creek" -> StannCreek).
 */
export async function getDistrictAlertLoads(): Promise<DistrictAlertLoad[]> {
  try {
    const api = await initializeApi();
    if (!api.query.mesh?.activeAlertCountPerDistrict) return [];

    return await Promise.all(
      BELIZE_DISTRICTS.map(async (district) => {
        const enumKey = district.replace(/\s+/g, '') as any;
        const count: any = await api.query.mesh.activeAlertCountPerDistrict(enumKey);
        return { district, activeAlerts: Number(count?.toString?.() ?? 0) };
      })
    );
  } catch (err) {
    console.error('Failed to read district alert loads:', err);
    return [];
  }
}

/**
 * Get active emergency alerts received via LoRa mesh
 */
export async function getEmergencyAlerts(): Promise<EmergencyAlert[]> {
  try {
    const api = await initializeApi();
    // Storage item is `emergencyAlerts`, not `activeAlerts`.
    if (!api.query.mesh?.emergencyAlerts) return [];

    const entries = await api.query.mesh.emergencyAlerts.entries();
    const alerts: EmergencyAlert[] = [];

    for (const [key, raw] of entries as any[]) {
      const data: any = raw?.toJSON?.();
      if (!data) continue;
      alerts.push({
        id: String(data.alertId ?? key?.args?.[0]?.toString() ?? ''),
        message: bytesToString(data.message),
        severity: String(data.severity),
        alertType: String(data.alertType),
        issuer: String(data.issuer),
        district: String(data.district),
        latitude: Number(data.latitude ?? 0),
        longitude: Number(data.longitude ?? 0),
        radiusMeters: Number(data.radiusMeters ?? 0),
        createdAt: Number(data.createdAt ?? 0),
        expiresAt: Number(data.expiresAt ?? 0),
        resolved: Boolean(data.resolved),
        relayCount: Number(data.relayCount ?? 0),
        confirmations: Number(data.confirmations ?? 0),
      });
    }

    return alerts;
  } catch (err) {
    console.error('Failed to query emergency alerts:', err);
  }

  // No fabricated alerts. A hardcoded NEMO advisory used to be returned whenever
  // the query failed or came back empty. An emergency feed must never invent an
  // alert that no authority issued.
  return [];
}

/**
 * Is `address` a registered NEMO emergency authority?
 *
 * Authoritative source is `mesh.emergencyAuthorities` — the runtime's
 * `is_emergency_authority` reads that same NEMO registry, so this mirrors the
 * exact check `issue_emergency_alert` performs on chain.
 */
export async function isEmergencyAuthority(address: string): Promise<boolean> {
  try {
    const api = await initializeApi();
    if (!api.query.mesh?.emergencyAuthorities) return false;
    const raw: any = await api.query.mesh.emergencyAuthorities(address as any);
    return Boolean(raw?.toJSON?.() ?? false);
  } catch (err) {
    console.error('Failed to read emergency authority status:', err);
    return false;
  }
}

/**
 * Get Relay Mining stats for the connected account
 */
export async function getRelayMiningStats(address: string): Promise<RelayMiningStats | null> {
  try {
    const api = await initializeApi();
    // `mesh.nodes` does not exist. Nodes are keyed by [u8;4] node id, so we go
    // through the owner index to find the ids this account actually owns.
    if (!api.query.mesh?.nodesByOwner) return null;

    const owned: any = await api.query.mesh.nodesByOwner(address as any);
    const nodeIds: string[] = (owned?.toJSON?.() as string[] | null) ?? [];
    if (nodeIds.length === 0) return null;

    let packetsRelayed = 0;
    let transactionsRelayed = 0;
    let reputationScore = 0;
    let isGateway = false;

    for (const nodeId of nodeIds) {
      const raw: any = await api.query.mesh.meshNodes(nodeId as any);
      // polkadot-js decodes struct fields to camelCase.
      const node: any = raw?.toJSON?.();
      if (!node) continue;
      packetsRelayed += Number(node.messagesRelayed ?? 0);
      transactionsRelayed += Number(node.transactionsRelayed ?? 0);
      reputationScore = Math.max(reputationScore, Number(node.reputation ?? 0));
      if (node.isGateway && node.active) isGateway = true;
    }

    const rewardRaw: any = api.query.mesh.relayRewards
      ? await api.query.mesh.relayRewards(address as any)
      : null;
    const unclaimed = rewardRaw ? BigInt(String(rewardRaw.toString())) : 0n;

    return {
      nodeId: nodeIds[0],
      packetsRelayed,
      transactionsRelayed,
      reputationScore,
      uptimePercent: null,
      unclaimedRewardsDalla: formatDalla(unclaimed),
      totalMinedDalla: null,
      isGateway,
    };
  } catch (err) {
    console.error('Failed to read relay mining stats:', err);
    return null;
  }
}

/**
 * Claim mined relay rewards in native DALLA
 */
export async function claimRelayRewards(address: string): Promise<{ hash: string; amountClaimed: string }> {
  try {
    const api = await initializeApi();
    const injector = await web3FromAddress(address);

    // Read the claimable balance first so we can report what was actually
    // claimed instead of a hardcoded amount.
    const rewardRaw: any = api.query.mesh.relayRewards
      ? await api.query.mesh.relayRewards(address as any)
      : null;
    const claimable = rewardRaw ? BigInt(String(rewardRaw.toString())) : 0n;

    const tx = api.tx.mesh.claimRelayRewards();
    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
        if (dispatchError) {
          reject(new Error(dispatchError.toString()));
          return;
        }
        if (status.isInBlock) {
          resolve({ hash: txHash.toString(), amountClaimed: formatDalla(claimable) });
        }
      }).catch(reject);
    });
  } catch (err) {
    // A failed claim must surface as a failure. It previously returned a
    // synthetic 0x4a9e... hash and a fabricated "240.50" payout, so a failed
    // claim looked identical to a successful one.
    throw err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Encode a transaction to 87-byte compressed LoRa payload
 */
/**
 * Build an illustrative LoRa frame for a voucher.
 *
 * This is NOT a wire-format encoder and it does NOT compress anything. The
 * previous version synthesised an "87-byte" hex string by padding with a
 * hardcoded 20-byte constant and truncating, then advertised the result as a
 * "237 byte frame utilisation" — so both the length and the efficiency figure
 * were artefacts of the truncation, not measurements. This version assembles
 * the frame from the caller's values only and reports its true length.
 */
export function encodeCompressedLoRaPacket(
  sender: string,
  recipient: string,
  amount: string,
  currency: 'DALLA' | 'bBZD'
): { hexPacket: string; byteLength: number; payloadRatio: string } {
  const nonce = (Date.now() % 65535).toString(16).padStart(4, '0');
  const currencyFlag = currency === 'DALLA' ? '01' : '02';
  const amountPlanck = BigInt(Math.floor(parseFloat(amount || '0') * 1e12))
    .toString(16)
    .padStart(16, '0');
  const senderSlice = sender.slice(0, 16);
  const recipientSlice = recipient.slice(0, 16);

  const rawHex = [
    'BZ01',
    currencyFlag,
    nonce,
    amountPlanck,
    Buffer.from(senderSlice).toString('hex').slice(0, 32),
    Buffer.from(recipientSlice).toString('hex').slice(0, 32),
  ].join('');

  const byteLength = Math.floor(rawHex.length / 2);

  return {
    hexPacket: `0x${rawHex}`,
    byteLength,
    payloadRatio: `${byteLength} bytes for a truncated sender/recipient pair — illustrative frame, not a compression result`,
  };
}

// ============================================================================
// BelizeMesh on-chain settlement (pallet_belize_mesh)
//
// Verified against live node spec 105 (2026-09-17):
// - submitMeshTransaction anchors FINANCIAL txs (MeshTxType:
//   transferDalla/transferBbzd/governanceVote/identityPing/nodeStatus) and
//   REQUIRES the signer to own a registered, active GATEWAY node.
// - Chat payloads do not settle here; message bundles are anchored via
//   submitRelayProof. This service exposes the settlement path with real
//   prerequisite checks so UI can gate on it honestly.
// ============================================================================

export interface MeshGatewayStatus {
  /** Signer owns an active gateway node because they registered one */
  hasGateway: boolean;
  gatewayNodeId?: string;
  nodesOwned: number;
}

export async function getGatewayStatus(address: string): Promise<MeshGatewayStatus> {
  const api = await initializeApi();
  if (!api.query.mesh?.nodesByOwner) {
    return { hasGateway: false, nodesOwned: 0 };
  }
  // nodesByOwner: AccountId -> Vec<[u8;4]> owned node ids
  const nodeIds = await api.query.mesh.nodesByOwner<any>(address as any);
  const ids = nodeIds.toJSON() as string[];
  if (!ids || ids.length === 0) {
    return { hasGateway: false, nodesOwned: 0 };
  }
  // meshNodes: [u8;4] -> MeshNode struct (owner, isGateway, active, ...)
  // JSON round-trip yields hex strings like "0x01020304"
  let gatewayNodeId: string | undefined;
  for (const id of ids) {
    const node = await api.query.mesh.meshNodes(id as any);
    const n = node.toJSON() as { isGateway?: boolean; active?: boolean } | null;
    if (n?.isGateway && n?.active) {
      gatewayNodeId = id.toString();
    }
  }
  return { hasGateway: gatewayNodeId !== undefined, gatewayNodeId, nodesOwned: ids.length };
}

export interface MeshSettlementRequest {
  /** MeshTxType variant (camelCase) */
  txType: 'transferDalla' | 'transferBbzd' | 'governanceVote' | 'identityPing' | 'nodeStatus';
  /** 32-byte settlement hash of the off-chain payload */
  signatureHash: `0x${string}`;
  /** [u8;4] Meshtastic node ids as 0x-prefixed hex */
  senderNodeId: string;
  recipientNodeId: string;
  gatewayNodeId: string;
  amount?: bigint;
  nonce: number;
  relayPath?: string[];
  hopCount: number;
  rssi: number;
  snr: number;
}

/**
 * Settle a mesh transaction on-chain. Fails fast unless the signer already
 * owns an active gateway node (pallet enforces this — see submit_mesh_transaction).
 */
export async function settleMeshTransaction(
  address: string,
  request: MeshSettlementRequest
): Promise<{ hash: string }> {
  const status = await getGatewayStatus(address);
  if (!status.hasGateway) {
    throw new Error(
      'MESHWAIT: no active gateway node owned by this account. Register a LoRa gateway (registerNode) before settling mesh transactions.'
    );
  }

  const api = await initializeApi();
  const injector = await web3FromAddress(address);

  // tx hash anchor: reuse the signature hash as the settlement anchor
  const signatureHash = api.createType('H256', request.signatureHash);

  const tx = api.tx.mesh.submitMeshTransaction(
    signatureHash,                         // txHash anchor
    { [request.txType]: null },
    request.senderNodeId,
    request.recipientNodeId,
    request.amount ?? 0n,
    request.nonce,
    signatureHash,
    request.gatewayNodeId,
    request.relayPath ?? [],
    request.hopCount,
    request.rssi,
    request.snr,
  );

  return new Promise((resolve, reject) => {
    tx.signAndSend(address, { signer: injector.signer }, ({ status: txStatus, txHash: hash, dispatchError }) => {
      if (dispatchError) {
        reject(new Error(`Mesh settlement failed: ${dispatchError.toString()}`));
      } else if (txStatus.isInBlock || txStatus.isFinalized) {
        resolve({ hash: hash.toString() });
      }
    }).catch(reject);
  });
}

/**
 * Register a Meshtastic node (incl. gateway role) for the signer.
 * Returns the extrinsic submit result.
 */
export async function registerMeshNode(
  address: string,
  params: {
    /** [u8;4] node id as 0x-prefixed hex */
    nodeId: string;
    role: 'client' | 'router' | 'gateway' | 'validatorRelay' | 'emergencyBeacon';
    hardware: 'heltecV3' | 'tBeam' | 'tBeamSupreme' | 'rakWisBlock' | 'stationG2';
    latitude: number;
    longitude: number;
    altitude: number;
    district: string;
  }
): Promise<{ hash: string }> {
  const api = await initializeApi();
  const injector = await web3FromAddress(address);

  const enumOf = (variant: string) => ({ [variant]: null });

  const tx = api.tx.mesh.registerNode(
    params.nodeId,                        // [u8;4] hex
    enumOf(params.role),
    enumOf(params.hardware),
    enumOf('us915'),
    Math.round(params.latitude),
    Math.round(params.longitude),
    Math.round(params.altitude),
    enumOf(DISTRICT_ENUMS[params.district.toLowerCase()] ?? 'Belize'),
    enumOf('coastal'),                    // terrain
  );

  return new Promise((resolve, reject) => {
    tx.signAndSend(address, { signer: injector.signer }, ({ status: txStatus, txHash, dispatchError }) => {
      if (dispatchError) {
        reject(new Error(`registerNode failed: ${dispatchError.toString()}`));
      } else if (txStatus.isInBlock || txStatus.isFinalized) {
        resolve({ hash: txHash.toString() });
      }
    }).catch(reject);
  });
}

const DISTRICT_ENUMS: Record<string, string> = {
  belize: 'Belize',
  cayo: 'Cayo',
  orangewalk: 'OrangeWalk',
  corozal: 'Corozal',
  stanncreek: 'StannCreek',
  toledo: 'Toledo',
};
