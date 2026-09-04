/**
 * BelizeChain Whistleblower Pallet Service (Pallet 36)
 * Protected anonymous disclosure system with zero-knowledge commitment schemes,
 * cryptographic receipt tickets, and escrowed bounty claims.
 */

import { initializeApi } from '../blockchain';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { blake2AsHex, randomAsU8a, decodeAddress } from '@polkadot/util-crypto';
import { u8aConcat, stringToU8a, u8aToHex, hexToU8a } from '@polkadot/util';
import type { WhistleblowerReport, ReportCategory, ReportStatus, WhistleblowerTicket } from '@belizechain/shared';

const COMMITMENT_DOMAIN = 'BelizeChainWhistleblowerV1';

export interface FormattedReport {
  id: number;
  commitment: string;
  target: string;
  evidenceHash: string;
  category: ReportCategory;
  submittedAt: number;
  status: ReportStatus;
  bond: string;
  bondDepositor: string;
  reasoningHash: string | null;
  escrowedReward: string | null;
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

/**
 * Generate a domain-separated cryptographic commitment and a local secret key.
 * Formula: blake2_256(DOMAIN_TAG ++ account_pubkey_bytes ++ secret_bytes)
 */
export function generateWhistleblowerCommitment(accountAddress: string): {
  commitment: string;
  secret: string;
} {
  const secretBytes = randomAsU8a(32);
  const pubkeyBytes = decodeAddress(accountAddress);
  const domainBytes = stringToU8a(COMMITMENT_DOMAIN);

  const preimage = u8aConcat(domainBytes, pubkeyBytes, secretBytes);
  const commitment = blake2AsHex(preimage, 256);
  const secret = u8aToHex(secretBytes);

  return { commitment, secret };
}

/**
 * Fetch all whistleblower reports from the blockchain
 */
export async function getAllReports(): Promise<FormattedReport[]> {
  try {
    const api = await initializeApi();
    if (!api.query.belizeWhistleblower?.reports) {
      return [];
    }

    const entries = await api.query.belizeWhistleblower.reports.entries();
    const reports: FormattedReport[] = [];

    for (const [key, valueOpt] of entries) {
      if ((valueOpt as any).isSome) {
        const id = (key.args[0] as any).toNumber();
        const r = (valueOpt as any).unwrap();

        // Check for escrowed reward
        let escrowedReward: string | null = null;
        try {
          const escrowOpt = await api.query.belizeWhistleblower.escrowedReward(id);
          if ((escrowOpt as any).isSome) {
            escrowedReward = (escrowOpt as any).unwrap().toString();
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
          bond: r.bond.toString(),
          bondDepositor: r.bond_depositor.toString(),
          reasoningHash: r.reasoning_hash?.isSome ? r.reasoning_hash.unwrap().toHex() : null,
          escrowedReward,
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
 * Query Whistleblower reward pool balance
 */
export async function getWhistleblowerPoolBalance(): Promise<string> {
  try {
    const api = await initializeApi();
    if (!api.query.belizeWhistleblower?.whistleblowerPool) return '0';
    const pool = await api.query.belizeWhistleblower.whistleblowerPool();
    return pool.toString();
  } catch {
    return '0';
  }
}

/**
 * Submit a pseudonymous misconduct report.
 */
export async function submitReport(
  signerAddress: string,
  commitment: string,
  targetAddress: string,
  evidenceHash: string,
  category: 0 | 1 | 2
): Promise<{ hash: string; reportId?: number }> {
  const api = await initializeApi();
  const injector = await web3FromAddress(signerAddress);

  const formattedCommitment = commitment.startsWith('0x') ? commitment : `0x${commitment}`;
  const formattedEvidence = evidenceHash.startsWith('0x') ? evidenceHash : `0x${evidenceHash}`;

  const tx = api.tx.belizeWhistleblower.submitReport(
    formattedCommitment,
    targetAddress,
    formattedEvidence,
    category
  );

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
        let reportId: number | undefined;
        events.forEach(({ event }) => {
          if (api.events.belizeWhistleblower?.ReportSubmitted?.is(event)) {
            const [id] = event.data;
            reportId = Number(id.toString());
          }
        });

        resolve({ hash: txHash.toHex(), reportId });
      }
    }).catch(reject);
  });
}

/**
 * Claim reward for a verified report by revealing the secret.
 */
export async function claimReward(
  signerAddress: string,
  reportId: number,
  secretHex: string
): Promise<{ hash: string }> {
  const api = await initializeApi();
  const injector = await web3FromAddress(signerAddress);

  const secretFormatted = secretHex.startsWith('0x') ? secretHex : `0x${secretHex}`;
  const tx = api.tx.belizeWhistleblower.claimReward(reportId, secretFormatted);

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
