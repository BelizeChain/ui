/**
 * BelizeChain Justice Pallet Service (Pallet 35)
 * Restorative justice layer, arbitration docket, cooling-off periods, and appeal management.
 */

import { initializeApi } from '../blockchain';
import { web3FromAddress } from '@polkadot/extension-dapp';
import type { DisputeRecord, DisputeSeverity, DisputeStatus, RehabStatus, DisputeResolution } from '@belizechain/shared';

export interface FormattedDispute {
  id: number;
  disputant: string;
  target: string;
  evidenceHash: string;
  severity: DisputeSeverity;
  openedAt: number;
  status: DisputeStatus;
  resolution: DisputeResolution | null;
  bond: string;
  appealEvidence: string | null;
}

export interface UserJusticeStatus {
  rehabStatus: RehabStatus;
  coolingOffEndBlock: number | null;
  slashPendingPlanck: string | null;
  activeDisputesAsTarget: FormattedDispute[];
  activeDisputesAsDisputant: FormattedDispute[];
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

/**
 * Fetch all disputes from chain
 */
export async function getAllDisputes(): Promise<FormattedDispute[]> {
  try {
    const api = await initializeApi();
    if (!api.query.belizeJustice?.disputes) {
      return [];
    }

    const entries = await api.query.belizeJustice.disputes.entries();
    const list: FormattedDispute[] = [];

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
          bond: record.bond.toString(),
          appealEvidence: record.appeal_evidence?.isSome ? record.appeal_evidence.unwrap().toHex() : null,
        });
      }
    }

    return list.sort((a, b) => b.id - a.id);
  } catch (error) {
    console.error('Failed to query disputes:', error);
    return [];
  }
}

/**
 * Fetch justice and rehabilitation status for a specific citizen account
 */
export async function getUserJusticeStatus(accountAddress: string): Promise<UserJusticeStatus> {
  const defaultStatus: UserJusticeStatus = {
    rehabStatus: 'Clean',
    coolingOffEndBlock: null,
    slashPendingPlanck: null,
    activeDisputesAsTarget: [],
    activeDisputesAsDisputant: [],
  };

  try {
    const api = await initializeApi();
    if (!api.query.belizeJustice) return defaultStatus;

    const [rehabRaw, coolingRaw, slashPendingRaw, allDisputes] = await Promise.all([
      api.query.belizeJustice.rehabilitationStatus(accountAddress),
      api.query.belizeJustice.coolingOffEnd(accountAddress),
      api.query.belizeJustice.slashPendingJusticeReview(accountAddress),
      getAllDisputes(),
    ]);

    const rehabStr = (rehabRaw as any).toJSON();
    const rehabStatus: RehabStatus = typeof rehabStr === 'string' ? (rehabStr as RehabStatus) : 'Clean';
    
    const coolingBlock = (coolingRaw as any).isSome ? Number((coolingRaw as any).unwrap().toString()) : null;
    const slashPending = (slashPendingRaw as any).isSome ? (slashPendingRaw as any).unwrap().toString() : null;

    return {
      rehabStatus,
      coolingOffEndBlock: coolingBlock,
      slashPendingPlanck: slashPending,
      activeDisputesAsTarget: allDisputes.filter(d => d.target === accountAddress),
      activeDisputesAsDisputant: allDisputes.filter(d => d.disputant === accountAddress),
    };
  } catch (error) {
    console.error('Failed to get user justice status:', error);
    return defaultStatus;
  }
}

/**
 * Open a restorative dispute against an alleged offender.
 * Requires OpenDisputeBond to prevent frivolous claims.
 */
export async function openDispute(
  signerAddress: string,
  targetAddress: string,
  evidenceHash: string,
  severity: 0 | 1 | 2
): Promise<{ hash: string; disputeId?: number }> {
  const api = await initializeApi();
  const injector = await web3FromAddress(signerAddress);

  // Ensure 32-byte hex hash format
  const formattedHash = evidenceHash.startsWith('0x') ? evidenceHash : `0x${evidenceHash}`;

  const tx = api.tx.belizeJustice.openDispute(targetAddress, formattedHash, severity);

  return new Promise((resolve, reject) => {
    tx.signAndSend(signerAddress, { signer: injector.signer }, ({ status, txHash, events, dispatchError }) => {
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
        let disputeId: number | undefined;
        events.forEach(({ event }) => {
          if (api.events.belizeJustice?.DisputeOpened?.is(event)) {
            const [id] = event.data;
            disputeId = Number(id.toString());
          }
        });

        resolve({ hash: txHash.toHex(), disputeId });
      }
    }).catch(reject);
  });
}

/**
 * Appeal an issued mediator ruling with counter-evidence
 */
export async function appealRuling(
  signerAddress: string,
  disputeId: number,
  counterEvidenceHash: string
): Promise<{ hash: string }> {
  const api = await initializeApi();
  const injector = await web3FromAddress(signerAddress);

  const formattedHash = counterEvidenceHash.startsWith('0x') ? counterEvidenceHash : `0x${counterEvidenceHash}`;
  const tx = api.tx.belizeJustice.appealRuling(disputeId, formattedHash);

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
