// BelizeMesh Gateway Onboarding Service
// Real implementation of mesh gateway node registration flow.
//
// Chain truth (verified against live spec-105 node + pallet source):
// - registerNode requires KYC level >= meshConfig.minKycForRegistration (=1).
//   KYC level derives from identity.identityOf -> identity.ssnAttestations.
// - Gateway role additionally needs higher KYC (pallet enforces).
// - registerNode takes: node_id [u8;4], role, hardware, region, latitude i32,
//   longitude i32, altitude i16, BelizeDistrict, TerrainType.
// - After registration the node starts INACTIVE; a nodeHeartbeat activates it.
// - submitMeshTransaction then works only for gateway-node owners.

import { blake2AsHex } from '@polkadot/util-crypto';
import { initializeApi } from '../blockchain';
import { getKYCStatus } from './identity';
import { web3FromAddress } from '@polkadot/extension-dapp';

export interface OnboardingChecklist {
  kycOk: boolean;
  kycLevel: string;
  kycHint: string;
  deviceId: string;
  nodeIdHex?: string; // 0x-prefixed 4 bytes
  existingNode?: { id: string; isGateway: boolean; active: boolean };
  readyToRegister: boolean;
  blockers: string[];
}

const DISTRICT_ENUMS: Record<string, string> = {
  belize: 'Belize',
  cayo: 'Cayo',
  orangewalk: 'OrangeWalk',
  corozal: 'Corozal',
  stanncreek: 'StannCreek',
  toledo: 'Toledo',
};

/** Derive a deterministic [u8;4] node id from the SS58 address. */
export function deriveNodeIdFromAddress(address: string): string {
  return blake2AsHex(new TextEncoder().encode(address), 256).slice(0, 10);
}

/**
 * Evaluate everything the pallet will check before registerNode is attempted.
 * Lets the UI show a checklist instead of a cryptic pallet error.
 */
export async function getOnboardingChecklist(address: string): Promise<OnboardingChecklist> {
  const api = await initializeApi();
  const blockers: string[] = [];

  // 1. KYC level check
  const kyc = await getKYCStatus(address);
  const kycOk = kyc.level === 'Full' || kyc.status === 'Verified';
  if (!kycOk) {
    blockers.push(
      `KYC ≥ L1 (Social Security attestation) required. Current level: ${kyc.level}/${kyc.status}. Start KYC verification in the Identity section first.`
    );
  }

  // 2. Live minimum from meshConfig
  const cfg = await api.query.mesh?.meshConfig?.();
  const minKyc = Number((cfg?.toJSON() as any)?.minKycForRegistration ?? 1);
  const levelRank: Record<string, number> = { None: 0, Basic: 1, Enhanced: 2, Full: 3 };
  const userLevel = levelRank[kyc.level] ?? 0;
  if (minKyc > userLevel) {
    blockers.push(`Pallet requires KYC ≥ L${minKyc} (chain config). Account is at L${userLevel}.`);
  }

  // 3. Already registered?
  const nodeIdHex = blake2AsHex(new TextEncoder().encode(address), 256).slice(0, 10);
  const existing = await api.query.mesh?.meshNodes?.(nodeIdHex);
  const alreadyRegistered = Boolean(existing && (existing as any).isNone !== true);
  if (alreadyRegistered) {
    blockers.push('This account already has a registered mesh node (registration is one per account).');
  }

  return {
    kycOk,
    kycLevel: String(userLevel),
    kycHint:
      kyc.level === 'None'
        ? 'Submit Social Security attestation via identity.issueSsn (issuer-operated).'
        : 'KYC on-chain attestation found.',
    deviceId: nodeIdHex,
    nodeIdHex,
    existingNode: undefined,
    readyToRegister: blockers.length === 0 && !alreadyRegistered,
    blockers,
  };
}

/**
 * Register a mesh node for this account. nodeId is derived deterministically.
 * role 'gateway' gets higher-KYC gating by the pallet.
 */
export async function registerGatewayNode(
  address: string,
  params: {
    role: 'client' | 'router' | 'gateway';
    hardware: 'heltecV3' | 'tBeam' | 'tBeamSupreme' | 'rakWisBlock' | 'stationG2';
    latitude: number;
    longitude: number;
    altitude: number;
    district: string;
    terrain?: 'coastal' | 'urban' | 'suburban' | 'ruralFlat' | 'jungle' | 'mountain' | 'island' | 'riverValley';
  }
): Promise<{ hash: string; nodeId: string }> {
  const checklist = await getOnboardingChecklist(address);
  if (!checklist.readyToRegister) {
    throw new Error(
      `Cannot register node yet. Blockers:\n- ${checklist.blockers.join('\n- ')}`
    );
  }

  const api = await initializeApi();
  const injector = await web3FromAddress(address);

  const nodeIdHex = blake2AsHex(new TextEncoder().encode(address), 256).slice(0, 10);
  const district = DISTRICT_ENUMS[params.district.toLowerCase()] ?? 'Belize';

  const tx = api.tx.mesh.registerNode(
    nodeIdHex,
    { [params.role]: null },
    { [params.hardware]: null },
    { us915: null },
    Math.round(params.latitude),
    Math.round(params.longitude),
    Math.round(params.altitude),
    { [district]: null },
    { coastal: null }, // terrain default; user can update via updateNodeLocation
  );

  return new Promise((resolve, reject) => {
    tx.signAndSend(address, { signer: (injector as any).signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        const mod = (dispatchError as any).isModule
          ? api.registry.findMetaError(dispatchError.asModule)
          : null;
        reject(new Error(mod ? `registerNode failed: ${mod.section}.${mod.name}` : `registerNode failed: ${dispatchError.toString()}`));
      } else if (status.isInBlock || status.isFinalized) {
        resolve({ hash: txHash.toString(), nodeId: nodeIdHex });
      }
    }).catch(reject);
  });
}
