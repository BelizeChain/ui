/**
 * Blue Hole Portal — Whistleblower Pallet Integration (Pallet 36)
 * Integrity commission disclosures, council review, reward pool management, and audit trails.
 */

import { connectionManager } from '@/lib/blockchain/connection';
import { web3FromAddress } from '@polkadot/extension-dapp';
import type { WhistleblowerReport, ReportCategory, ReportStatus } from '@belizechain/shared';

export interface PortalReport {
  id: number;
  commitment: string;
  target: string;
  evidenceHash: string;
  category: ReportCategory;
  submittedAt: number;
  status: ReportStatus;
  bondDalla: string;
  bondDepositor: string;
  reasoningHash: string | null;
  escrowedRewardDalla: string | null;
}

function parseCategory(val: any): ReportCategory {
  const str = typeof val === 'object' && val !== null ? Object.keys(val)[0] : String(val);
  if (str === '0' || str === 'Fraud') return 'Fraud';
  if (str === '1' || str === 'SystematicAbuse') return 'SystematicAbuse';
  return 'ChainExploit';
}

function parseStatus(val: any): ReportStatus {
  const str = typeof val === 'object' && val !== null ? Object.keys(val)[0] : String(val);
  if (['Pending', 'UnderReview', 'Verified', 'Dismissed', 'Claimed'].includes(str)) {
    return str as ReportStatus;
  }
  return 'Pending';
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
 * Fetch all protected reports for the Integrity Commission
 */
export async function getAllReports(): Promise<PortalReport[]> {
  try {
    const api = await connectionManager.connect();
    if (!api.query.belizeWhistleblower?.reports) return [];

    const entries = await api.query.belizeWhistleblower.reports.entries();
    const reports: PortalReport[] = [];

    for (const [key, valueOpt] of entries) {
      if ((valueOpt as any).isSome) {
        const id = (key.args[0] as any).toNumber();
        const r = (valueOpt as any).unwrap();

        let escrowedRewardDalla: string | null = null;
        try {
          const escrowOpt = await api.query.belizeWhistleblower.escrowedReward(id);
          if ((escrowOpt as any).isSome) {
            escrowedRewardDalla = planckToDalla((escrowOpt as any).unwrap().toString());
          }
        } catch {
          // Ignore
        }

        reports.push({
          id,
          commitment: r.commitment.toHex ? r.commitment.toHex() : r.commitment.toString(),
          target: r.target.toString(),
          evidenceHash: r.evidence_hash.toHex ? r.evidence_hash.toHex() : r.evidence_hash.toString(),
          category: parseCategory(r.category.toJSON()),
          submittedAt: Number(r.submitted_at.toString()),
          status: parseStatus(r.status.toJSON()),
          bondDalla: planckToDalla(r.bond.toString()),
          bondDepositor: r.bond_depositor.toString(),
          reasoningHash: r.reasoning_hash?.isSome ? r.reasoning_hash.unwrap().toHex() : null,
          escrowedRewardDalla,
        });
      }
    }

    return reports.sort((a, b) => b.id - a.id);
  } catch (error) {
    console.error('Failed to get whistleblower reports:', error);
    return [];
  }
}

/**
 * Query pool balance
 */
export async function getWhistleblowerPoolBalance(): Promise<string> {
  try {
    const api = await connectionManager.connect();
    if (!api.query.belizeWhistleblower?.whistleblowerPool) return '0.00';
    const pool = await api.query.belizeWhistleblower.whistleblowerPool();
    return planckToDalla(pool.toString());
  } catch {
    return '0.00';
  }
}

/**
 * Council Reviewer issues a verdict (Verified=0, Dismissed=1)
 */
export async function reviewReport(
  signerAddress: string,
  reportId: number,
  verdict: 0 | 1,
  reasoningHash: string
): Promise<{ hash: string }> {
  const api = await connectionManager.connect();
  const injector = await web3FromAddress(signerAddress);

  const formattedHash = reasoningHash.startsWith('0x') ? reasoningHash : `0x${reasoningHash}`;
  const tx = api.tx.belizeWhistleblower.reviewReport(reportId, verdict, formattedHash);

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
 * Fund the whistleblower pool (Governance action)
 */
export async function fundWhistleblowerPool(
  signerAddress: string,
  amountDalla: string
): Promise<{ hash: string }> {
  const api = await connectionManager.connect();
  const injector = await web3FromAddress(signerAddress);

  const amountPlanck = BigInt(Math.floor(parseFloat(amountDalla) * 1e12)).toString();
  const tx = api.tx.belizeWhistleblower.fundWhistleblowerPool(amountPlanck);

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
