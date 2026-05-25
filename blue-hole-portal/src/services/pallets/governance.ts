/**
 * Blue Hole Portal — Governance Pallet Integration
 *
 * Mirrors the Maya Wallet pattern in
 * `maya-wallet/src/services/pallets/governance.ts` (runtime index 22,
 * `pallet_governance::Proposals` keyed by `u32`) but uses the portal's
 * `BlockchainConnectionManager` to source the API.
 *
 * Only the surface area required by `/governance/proposals` and
 * `/governance/proposals/[id]` is implemented here.
 */

import { web3FromAddress } from '@polkadot/extension-dapp';
import { connectionManager } from '@/lib/blockchain/connection';

export interface Proposal {
  index: number;
  hash: string;
  proposer: string;
  /** Treasury amount requested, already converted from planck. */
  value: string;
  beneficiary: string;
  /** Proposal deposit, already converted from planck. */
  bond: string;
  title: string;
  description: string;
  /** Raw on-chain `ProposalType` variant name. */
  category: string;
  /** Raw on-chain `ProposalStatus` variant name. */
  status: string;
  voteCount: {
    ayes: number;
    nays: number;
  };
  voteEnd: number;
  createdAt: number;
}

/**
 * Convert a planck-denominated balance string into a human DALLA amount with
 * two fractional digits. Returns `'0'` on parse failure.
 */
function formatBalance(planck: string): string {
  try {
    const value = BigInt(planck);
    const dalla = Number(value) / 1e12;
    return dalla.toFixed(2);
  } catch {
    return '0';
  }
}

/**
 * Decode a `BoundedVec<u8, _>` (Substrate Bytes) into a UTF-8 string. Falls
 * back to a `0x...` hex representation if the bytes contain unprintable
 * control characters.
 */
function bytesToString(raw: unknown): string {
  if (raw == null) return '';
  const codec = raw as { toU8a?: () => Uint8Array; toString?: () => string };
  let bytes: Uint8Array | null = null;
  try {
    if (typeof codec.toU8a === 'function') {
      bytes = codec.toU8a();
    }
  } catch {
    bytes = null;
  }
  if (!bytes || bytes.length === 0) {
    return typeof codec.toString === 'function' ? codec.toString() : '';
  }
  try {
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/.test(decoded)) {
      return `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
    }
    return decoded;
  } catch {
    return `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
  }
}

/**
 * Map a raw on-chain `Proposal` codec into the UI `Proposal` shape.
 */
function mapOnChainProposal(p: any, idHint?: number): Proposal {
  const tally = p.vote_tally ?? p.voteTally ?? {};
  const status = String(p.status?.toString?.() ?? p.status ?? 'Voting');
  const id = typeof idHint === 'number' ? idHint : Number(p.id?.toString?.() ?? p.id ?? 0);

  let value = '0';
  let beneficiary = '';
  try {
    const action = p.action;
    const actionInner =
      action && typeof action.isSome === 'boolean' && action.isSome
        ? action.unwrap()
        : action;
    if (
      actionInner &&
      (actionInner.isTreasurySpend || actionInner.type === 'TreasurySpend')
    ) {
      const inner = actionInner.asTreasurySpend ?? actionInner.value ?? actionInner;
      if (inner?.amount) value = formatBalance(inner.amount.toString());
      if (inner?.beneficiary) beneficiary = inner.beneficiary.toString();
    }
  } catch {
    // Non-treasury proposals leave value/beneficiary as defaults.
  }

  return {
    index: id,
    hash: `proposal-${id}`,
    proposer: p.proposer?.toString?.() ?? String(p.proposer ?? ''),
    value,
    beneficiary,
    bond: p.deposit ? formatBalance(p.deposit.toString()) : '0',
    title: bytesToString(p.title),
    description: bytesToString(p.description),
    category:
      p.proposal_type?.toString?.() ??
      p.proposalType?.toString?.() ??
      'Other',
    status,
    voteCount: {
      ayes: Number(tally.ayes?.toString?.() ?? tally.ayes ?? 0),
      nays: Number(tally.nays?.toString?.() ?? tally.nays ?? 0),
    },
    voteEnd: Number(p.voting_end?.toString?.() ?? p.votingEnd?.toString?.() ?? 0),
    createdAt: Number(
      p.voting_start?.toString?.() ?? p.votingStart?.toString?.() ?? 0,
    ),
  };
}

/**
 * Iterate `pallet_governance::Proposals` (StorageMap u32 -> Proposal) and
 * return all entries in ascending ID order. Returns `[]` on any error.
 */
export async function getActiveProposals(): Promise<Proposal[]> {
  const api = await connectionManager.connect();
  try {
    if (!api.query.governance?.proposals) return [];
    const entries: any[] = await api.query.governance.proposals.entries();
    if (!entries || entries.length === 0) return [];

    const results: Proposal[] = [];
    for (const [key, opt] of entries) {
      try {
        const args = (key as any).args;
        const id = Number(args?.[0]?.toString?.() ?? args?.[0] ?? 0);
        const raw: any = typeof opt.unwrap === 'function' ? opt.unwrap() : opt;
        if (!raw) continue;
        results.push(mapOnChainProposal(raw, id));
      } catch (innerError) {
        console.warn('Failed to decode proposal entry; skipping:', innerError);
      }
    }
    results.sort((a, b) => a.index - b.index);
    return results;
  } catch (error) {
    console.error('Failed to fetch proposals:', error);
    return [];
  }
}

/**
 * Read a single on-chain `Proposal` by numeric ID. Returns `null` when the
 * proposal does not exist or on any decode failure.
 */
export async function getProposalById(proposalId: number): Promise<Proposal | null> {
  const api = await connectionManager.connect();
  try {
    const opt: any = await api.query.governance?.proposals(proposalId);
    if (!opt || (typeof opt.isNone === 'boolean' && opt.isNone)) return null;
    const p: any = typeof opt.unwrap === 'function' ? opt.unwrap() : opt;
    if (!p) return null;
    return mapOnChainProposal(p, proposalId);
  } catch (error) {
    console.error(`Failed to fetch proposal ${proposalId}:`, error);
    return null;
  }
}

/**
 * Submit a `governance.castVote(proposalId, voteChoiceIndex, conviction)`
 * extrinsic. `voteChoiceIndex`: 0 = Aye, 1 = Nay. Abstain is not supported
 * by the on-chain pallet today and will be reported as an error to the
 * caller.
 */
export async function voteOnProposal(
  address: string,
  proposalIndex: number,
  vote: 'Aye' | 'Nay',
  conviction: 'None' | 'Locked1x' | 'Locked2x' | 'Locked4x' | 'Locked8x' | 'Locked16x' = 'None',
): Promise<{ hash: string }> {
  const api = await connectionManager.connect();
  const injector = await web3FromAddress(address);
  const voteChoiceIndex = vote === 'Aye' ? 0 : 1;
  const convictionIndex =
    ({ None: 0, Locked1x: 1, Locked2x: 2, Locked4x: 3, Locked8x: 4, Locked16x: 5 } as const)[
      conviction
    ] ?? 0;
  const tx = api.tx.governance.castVote(proposalIndex, voteChoiceIndex, convictionIndex);

  return new Promise((resolve, reject) => {
    tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        reject(new Error(dispatchError.toString()));
        return;
      }
      if (status.isInBlock) {
        resolve({ hash: txHash.toString() });
      }
    }).catch(reject);
  });
}
