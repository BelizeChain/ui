/**
 * BelizeChain Governance Pallet Integration
 * Handles proposals, voting, district councils, and treasury
 */

import { ApiPromise } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';

export interface Proposal {
  index: number;
  hash: string;
  proposer: string;
  value: string; // Treasury amount requested
  beneficiary: string;
  bond: string;
  title: string;
  description: string;
  /** Raw on-chain `ProposalType` variant name (e.g. `Treasury`, `Council`, `Community`, `Department`, `Emergency`). */
  category: string;
  /** Raw on-chain `ProposalStatus` variant name (`Pending`, `Voting`, `Approved`, `Rejected`, `Cancelled`, `Executed`). */
  status: string;
  voteCount: {
    ayes: number;
    nays: number;
  };
  voteEnd: number;
  createdAt: number;
}

export interface Referendum {
  index: number;
  hash: string;
  proposalHash: string;
  voteThreshold: 'SimpleMajority' | 'SuperMajority' | 'Unanimous';
  voteCount: {
    ayes: string; // Total DALLA voting yes
    nays: string; // Total DALLA voting no
    turnout: string; // Total DALLA voted
  };
  status: 'Voting' | 'Passed' | 'Failed' | 'Executed';
  voteEnd: number;
  delayPeriod: number;
}

export interface DistrictCouncil {
  district: 'Belize' | 'Cayo' | 'Corozal' | 'Orange Walk' | 'Stann Creek' | 'Toledo';
  members: string[];
  prime?: string; // District representative
  proposalCount: number;
  motions: Motion[];
}

export interface Motion {
  index: number;
  hash: string;
  proposer: string;
  title: string;
  description: string;
  threshold: number; // Required votes
  voteCount: {
    ayes: number;
    nays: number;
  };
  status: 'Voting' | 'Approved' | 'Rejected' | 'Executed';
  voteEnd: number;
}

export interface Vote {
  proposalIndex: number;
  voter: string;
  vote: 'Aye' | 'Nay';
  balance: string; // Conviction-weighted voting power
  conviction: 'None' | 'Locked1x' | 'Locked2x' | 'Locked4x' | 'Locked8x' | 'Locked16x';
  timestamp: number;
}

/**
 * Decode a `BoundedVec<u8, _>` (Substrate Bytes) into a UTF-8 string.
 * Returns the original hex with `0x` prefix if decoding produces non-printable
 * bytes, so callers always get something displayable.
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
    // If decode produced any unprintable bytes (other than common whitespace), fall back to hex.
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
 * Read a single on-chain `Proposal` (StorageMap u32 -> Proposal) by its
 * numeric ID. Returns `null` when the proposal does not exist.
 *
 * The chain stores `Proposals: StorageMap<u32, Proposal<AccountId, BlockNumber, Balance>>`
 * with title/description as `BoundedVec<u8, _>` (raw bytes). We decode bytes to
 * UTF-8 strings and convert enums via `.toString()`.
 */
export async function getProposalById(proposalId: number): Promise<Proposal | null> {
  const api = await initializeApi();
  try {
    const opt: any = await api.query.governance.proposals(proposalId);
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
 * Map a raw on-chain `Proposal` codec into the UI `Proposal` shape used by
 * `ProposalCard` and the proposal detail page.
 */
function mapOnChainProposal(p: any, idHint?: number): Proposal {
  const tally = p.vote_tally ?? p.voteTally ?? {};
  const status = String(p.status?.toString?.() ?? p.status ?? 'Voting');
  const id = typeof idHint === 'number' ? idHint : Number(p.id?.toString?.() ?? p.id ?? 0);

  // Map on-chain ProposalAction.TreasurySpend (if present) into UI `value`/`beneficiary`.
  let value = '0';
  let beneficiary = '';
  try {
    const action = p.action;
    const actionInner = action && typeof action.isSome === 'boolean' && action.isSome
      ? action.unwrap()
      : action;
    if (actionInner && (actionInner.isTreasurySpend || actionInner.type === 'TreasurySpend')) {
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
    category: (p.proposal_type?.toString?.() ?? p.proposalType?.toString?.() ?? 'Other') as Proposal['category'],
    status: status as Proposal['status'],
    voteCount: {
      ayes: Number(tally.ayes?.toString?.() ?? tally.ayes ?? 0),
      nays: Number(tally.nays?.toString?.() ?? tally.nays ?? 0),
    },
    voteEnd: Number(p.voting_end?.toString?.() ?? p.votingEnd?.toString?.() ?? 0),
    createdAt: Number(p.voting_start?.toString?.() ?? p.votingStart?.toString?.() ?? 0),
  };
}

/**
 * Get all on-chain proposals from `pallet_governance::Proposals`.
 *
 * The on-chain map is keyed by `u32` proposal ID (NOT by hash); we iterate
 * all entries, decode each `Proposal` struct, and return them in ascending ID
 * order. Returns `[]` on any error so the UI keeps rendering gracefully.
 */
export async function getActiveProposals(): Promise<Proposal[]> {
  const api = await initializeApi();
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
 * Submit a new treasury proposal
 */
export async function submitProposal(
  address: string,
  data: {
    value: string;
    beneficiary: string;
    title: string;
    description: string;
    category: string;
  }
): Promise<{ hash: string; proposalIndex: number }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const valueInPlanck = BigInt(Math.floor(parseFloat(data.value) * 1e12));

    // Map UI submission to the chain's treasury-spend proposal extrinsic.
    // Real signature: proposeTreasurySpend(recipient, amount, description, districtIndex?).
    const descriptionBytes = `${data.title}\n\n${data.description}`;
    const tx = api.tx.governance.proposeTreasurySpend(
      data.beneficiary,
      valueInPlanck.toString(),
      descriptionBytes,
      null,
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let proposalIndex = -1;
          
          // Extract proposal index from events
          events.forEach(({ event }) => {
            if (api.events.governance?.Proposed?.is(event)) {
              const [index] = event.data;
              proposalIndex = Number((index as any).toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            proposalIndex,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Proposal submission failed:', error);
    throw error;
  }
}

/**
 * Vote on a proposal
 */
export async function voteOnProposal(
  address: string,
  proposalIndex: number,
  vote: 'Aye' | 'Nay',
  conviction: 'None' | 'Locked1x' | 'Locked2x' | 'Locked4x' | 'Locked8x' | 'Locked16x' = 'None'
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    // Real signature: castVote(proposalId, voteChoiceIndex, conviction).
    // voteChoiceIndex: 0 = Aye, 1 = Nay. Conviction: 0..5.
    const voteChoiceIndex = vote === 'Aye' ? 0 : 1;
    const convictionIndex = (
      { None: 0, Locked1x: 1, Locked2x: 2, Locked4x: 3, Locked8x: 4, Locked16x: 5 } as const
    )[conviction] ?? 0;
    const tx = api.tx.governance.castVote(proposalIndex, voteChoiceIndex, convictionIndex);

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Voting failed:', error);
    throw error;
  }
}

/**
 * Get all active referenda
 */
export async function getActiveReferenda(): Promise<Referendum[]> {
  const api = await initializeApi();
  
  try {
    const referenda: any = await api.query.governance?.referendumInfoOf.entries();
    
    if (!referenda || referenda.length === 0) {
      return [];
    }

    return referenda
      .filter(([, info]: [any, any]) => !info.isNone)
      .map(([key, info]: [any, any]) => {
        const index = key.args[0].toNumber();
        const data = info.unwrap();
        
        return {
          index,
          hash: data.hash.toString(),
          proposalHash: data.proposalHash.toString(),
          voteThreshold: data.threshold.toString() as any,
          voteCount: {
            ayes: formatBalance(data.tally.ayes.toString()),
            nays: formatBalance(data.tally.nays.toString()),
            turnout: formatBalance(data.tally.turnout.toString()),
          },
          status: data.status.toString() as any,
          voteEnd: data.end.toNumber(),
          delayPeriod: data.delay?.toNumber() || 0,
        };
      });
  } catch (error) {
    console.error('Failed to fetch referenda:', error);
    return [];
  }
}

/**
 * Get district council information
 */
export async function getDistrictCouncil(district: string): Promise<DistrictCouncil | null> {
  const api = await initializeApi();
  
  try {
    const members: any = await api.query.governance?.districtCouncils(district);
    const motions: any = await api.query.governance?.districtMotions(district);
    
    if (!members || members.isNone) {
      return null;
    }

    const councilData = members.unwrap();
    const motionData = motions?.toHuman() || [];

    return {
      district: district as any,
      members: councilData.members.toHuman() as string[],
      prime: councilData.prime?.toString(),
      proposalCount: councilData.proposalCount.toNumber(),
      motions: motionData.map((motion: any, index: number) => ({
        index,
        hash: motion.hash,
        proposer: motion.proposer,
        title: motion.title || `Motion ${index}`,
        description: motion.description || '',
        threshold: motion.threshold,
        voteCount: {
          ayes: motion.ayes?.length || 0,
          nays: motion.nays?.length || 0,
        },
        status: motion.status,
        voteEnd: motion.voteEnd || 0,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch district council:', error);
    return null;
  }
}

/**
 * Get voting history for an address
 */
export async function getVotingHistory(address: string, limit: number = 50): Promise<Vote[]> {
  const api = await initializeApi();
  
  try {
    const votes: any = await api.query.governance?.votingOf(address);
    
    if (!votes || votes.isNone) {
      return [];
    }

    const votingData = votes.unwrap();
    
    return votingData.votes
      .map((vote: any) => ({
        proposalIndex: vote.proposalIndex.toNumber(),
        voter: address,
        vote: vote.aye ? 'Aye' : 'Nay',
        balance: formatBalance(vote.balance.toString()),
        conviction: vote.conviction.toString() as any,
        timestamp: vote.timestamp?.toNumber() || 0,
      }))
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch voting history:', error);
    return [];
  }
}

/**
 * Second a proposal (support it for voting)
 */
export async function secondProposal(
  address: string,
  proposalIndex: number
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    // The governance pallet has no `second` extrinsic; supporting a proposal
    // is expressed as an Aye cast vote with no conviction.
    void address;
    void api;
    throw new Error(
      `Seconding proposal ${proposalIndex} is not a separate extrinsic on chain. Cast an Aye vote instead.`,
    );
  } catch (error) {
    console.error('Seconding proposal failed:', error);
    throw error;
  }
}

/**
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}
