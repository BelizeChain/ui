/**
 * Blue Hole Portal — Justice Pallet Integration (Pallet 35)
 * Arbitration docket, mediator rulings, rehabilitation status, and restorative justice tracking.
 */

import { connectionManager } from '@/lib/blockchain/connection';
import { web3FromAddress } from '@polkadot/extension-dapp';
import type { DisputeRecord, DisputeSeverity, DisputeStatus, RehabStatus, DisputeResolution } from '@belizechain/shared';

export interface PortalDispute {
  id: number;
  disputant: string;
  target: string;
  evidenceHash: string;
  severity: DisputeSeverity;
  openedAt: number;
  status: DisputeStatus;
  resolution: DisputeResolution | null;
  bondDalla: string;
  appealEvidence: string | null;
}

function parseSeverity(val: any): DisputeSeverity {
  const str = typeof val === 'object' && val !== null ? Object.keys(val)[0] : String(val);
  if (str === '0' || str === 'Minor') return 'Minor';
  if (str === '1' || str === 'Moderate') return 'Moderate';
  return 'Severe';
}

function parseStatus(val: any): DisputeStatus {
  const str = typeof val === 'object' && val !== null ? Object.keys(val)[0] : String(val);
  if (['Pending', 'UnderReview', 'Ruled', 'Appealed', 'Closed'].includes(str)) {
    return str as DisputeStatus;
  }
  return 'Pending';
}

function parseResolution(raw: any): DisputeResolution | null {
  if (!raw || raw.isNone || raw.isEmpty) return null;
  const val = raw.unwrap ? raw.unwrap() : raw;
  const str = typeof val === 'object' && val !== null ? Object.keys(val)[0] : String(val);
  if (str === 'Dismissed') return { type: 'Dismissed' };
  if (str === 'Upheld') return { type: 'Upheld' };
  if (str === 'Mediated') {
    const bps = val.Mediated?.slash_bps || val.slash_bps || 0;
    return { type: 'Mediated', slashBps: Number(bps) };
  }
  return null;
}

function planckToDalla(planck: string): string {
  try {
    const val = BigInt(planck);
    const whole = Number(val) / 1e12;
    return whole.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } catch {
    return '0.00';
  }
}

/**
 * Fetch all disputes from the chain
 */
export async function getAllDisputes(): Promise<PortalDispute[]> {
  try {
    const api = await connectionManager.connect();
    if (!api.query.belizeJustice?.disputes) return [];

    const entries = await api.query.belizeJustice.disputes.entries();
    const list: PortalDispute[] = [];

    for (const [key, valueOpt] of entries) {
      if ((valueOpt as any).isSome) {
        const id = (key.args[0] as any).toNumber();
        const record = (valueOpt as any).unwrap();
        list.push({
          id,
          disputant: record.disputant.toString(),
          target: record.target.toString(),
          evidenceHash: record.evidence_hash.toHex ? record.evidence_hash.toHex() : record.evidence_hash.toString(),
          severity: parseSeverity(record.severity.toJSON()),
          openedAt: Number(record.opened_at.toString()),
          status: parseStatus(record.status.toJSON()),
          resolution: parseResolution(record.resolution),
          bondDalla: planckToDalla(record.bond.toString()),
          appealEvidence: record.appeal_evidence?.isSome ? record.appeal_evidence.unwrap().toHex() : null,
        });
      }
    }

    return list.sort((a, b) => b.id - a.id);
  } catch (error) {
    console.error('Failed to get disputes:', error);
    return [];
  }
}

/**
 * Get active list of approved mediators
 */
export async function getMediatorList(): Promise<string[]> {
  try {
    const api = await connectionManager.connect();
    if (!api.query.belizeJustice?.mediatorList) return [];

    const list = await api.query.belizeJustice.mediatorList();
    return (list as any).map((account: any) => account.toString());
  } catch (error) {
    console.error('Failed to query mediator list:', error);
    return [];
  }
}

/**
 * Issue mediator ruling on an active dispute
 * resolutionCode: 0=Dismissed, 1=Upheld, 2=Mediated
 */
export async function issueMediatorRuling(
  signerAddress: string,
  disputeId: number,
  resolutionCode: 0 | 1 | 2,
  slashBps: number = 0
): Promise<{ hash: string }> {
  const api = await connectionManager.connect();
  const injector = await web3FromAddress(signerAddress);

  const tx = api.tx.belizeJustice.mediatorRuling(disputeId, resolutionCode, slashBps);

  return new Promise((resolve, reject) => {
    tx.signAndSend(signerAddress, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        if (dispatchError.isModule) {
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
        } else {
          reject(new Error(dispatchError.toString()));
        }
        return;
      }

      if (status.isInBlock || status.isFinalized) {
        resolve({ hash: txHash.toHex() });
      }
    }).catch(reject);
  });
}

/**
 * Complete rehabilitation for an account that finished cooling-off
 */
export async function completeRehabilitation(
  signerAddress: string,
  targetAccount: string
): Promise<{ hash: string }> {
  const api = await connectionManager.connect();
  const injector = await web3FromAddress(signerAddress);

  const tx = api.tx.belizeJustice.completeRehabilitation(targetAccount);

  return new Promise((resolve, reject) => {
    tx.signAndSend(signerAddress, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        if (dispatchError.isModule) {
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`));
        } else {
          reject(new Error(dispatchError.toString()));
        }
        return;
      }

      if (status.isInBlock || status.isFinalized) {
        resolve({ hash: txHash.toHex() });
      }
    }).catch(reject);
  });
}
