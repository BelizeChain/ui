/**
 * BelizeChain Governance Pallet Integration
 * Handles proposals, voting, district councils, and treasury
 */

import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';
import { bytesToString } from '@/lib/codec';

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

/** Mirrors `governance.referendums: u32 -> Referendum`. */
export interface Referendum {
  index: number;
  title: string;
  description: string;
  /** Ballot option labels, in order. */
  options: string[];
  /** Vote totals per option — `voteCounts[i]` corresponds to `options[i]`. */
  voteCounts: number[];
  totalVotes: number;
  quorumPercentage: number;
  votingStart: number;
  votingEnd: number;
  status: string;
  district?: string;
  winningOption?: number;
}

/** District representation is a membership list; the pallet stores no motions. */
export interface DistrictCouncil {
  district: 'Belize' | 'Cayo' | 'Corozal' | 'Orange Walk' | 'Stann Creek' | 'Toledo';
  members: string[];
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

/**
 * A council vote from the `governanceCouncil` pallet_collective instance.
 *
 * `pallet_collective` keys votes by (AccountId, ProposalHash) and stores aye /
 * balance / conviction — there is no proposal index, no timestamp, and no
 * `votingOf` accessor.
 */
export interface Vote {
  proposalHash: string;
  voter: string;
  vote: 'Aye' | 'Nay';
  balance: string;
  conviction: string;
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
    const entries: any[] = await api.query.governance?.proposals?.entries?.() || [];
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
    if (results.length > 0) {
      return results;
    }
  } catch (error) {
    console.warn('Failed to fetch on-chain proposals:', error);
  }

  // No fabricated referenda. Two invented proposals with made-up vote counts
  // (ayes 842/620) used to be returned whenever the query failed or came back
  // empty, making an idle governance pallet look like it had live votes.
  return [];
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
    // Storage item is `referendums`; there is no `referendumInfoOf`
    // (that name belongs to Substrate's pallet_democracy). The shape is also
    // the custom one: options[], voteCounts[], district, winningOption — not
    // hash/tally/threshold.
    if (!api.query.governance?.referendums) return [];

    const entries = await api.query.governance.referendums.entries();
    const referenda: Referendum[] = [];

    for (const [key, raw] of entries as any[]) {
      const data = raw?.toJSON?.();
      if (!data) continue;
      const options = Array.isArray(data.options) ? data.options : [];
      const counts = Array.isArray(data.voteCounts) ? data.voteCounts : [];

      referenda.push({
        index: Number(data.id ?? key?.args?.[0] ?? 0),
        title: bytesToString(data.title),
        description: bytesToString(data.description),
        options: options.map((o: unknown) => bytesToString(o)),
        voteCounts: counts.map(Number),
        totalVotes: Number(data.totalVotes ?? 0),
        quorumPercentage: Number(data.quorumPercentage ?? 0),
        votingStart: Number(data.votingStart ?? 0),
        votingEnd: Number(data.votingEnd ?? 0),
        status: String(data.status),
        district: data.district ? String(data.district) : undefined,
        winningOption: data.winningOption != null ? Number(data.winningOption) : undefined,
      });
    }

    return referenda.sort((a, b) => b.index - a.index);
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
    // `districtCouncils` and `districtMotions` do not exist. District
    // representation is `districtRepresentation: BelizeDistrict -> Vec<AccountId>`,
    // which is a membership list only — the pallet records no prime, no
    // proposal count and no per-district motions.
    if (!api.query.governance?.districtRepresentation) return null;

    const raw: any = await api.query.governance.districtRepresentation(district as any);
    if (!raw || raw.isNone) return null;

    const members: string[] = (raw.toJSON() as string[] | null) ?? [];

    return {
      district: district as any,
      members,
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
    // `governance.votingOf` does not exist. Council votes live in the
    // `governanceCouncil` pallet_collective instance, whose `voting` map is
    // keyed (AccountId, ProposalHash) — so there is no single-value lookup by
    // account and the entries must be filtered.
    if (!api.query.governanceCouncil?.voting) return [];

    const entries = await api.query.governanceCouncil.voting.entries();
    const votes: Vote[] = [];

    for (const [key, raw] of entries as any[]) {
      const args = key?.args ?? [];
      if (String(args[0]) !== address) continue;
      const data = raw?.toJSON?.();
      if (!data) continue;

      votes.push({
        proposalHash: String(args[1]),
        voter: address,
        // pallet_collective `Voting` uses aye/nay booleans plus a vote index.
        vote: data.aye ? 'Aye' : 'Nay',
        balance: formatBalance(String(data.balance ?? '0')),
        conviction: String(data.conviction ?? 'None'),
      });
    }

    return votes.slice(0, limit);
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
export interface CouncilMember {
  account: string;
  /** Foundation board role, e.g. `Founder`. */
  role: string;
  termStart: number;
  termEnd: number;
  isRotating: boolean;
  communityRank: number;
  votingWeight: number;
  votesReceived: number;
  proposalsAuthored: number;
  participationRate: number;
  consecutiveTerms: number;
}

/**
 * Read the governors council (`governance.councilMembers`, StorageMap AccountId ->
 * CouncilMember). This is the real, on-chain civic representation — unlike the
 * delegate leaderboard the community page used to hardcode.
 */
export async function getCouncilMembers(): Promise<CouncilMember[]> {
  const api = await initializeApi();

  try {
    const entries: any = await api.query.governance.councilMembers.entries();
    return entries.map(([key, value]: [any, any]) => {
      const m = value.unwrap();
      return {
        account: key.args[0].toString(),
        role: m.role.toString(),
        termStart: m.termStart.toNumber(),
        termEnd: m.termEnd.toNumber(),
        isRotating: m.isRotating.valueOf() as boolean,
        communityRank: m.communityRank.toNumber(),
        votingWeight: m.votingWeight.toNumber(),
        votesReceived: m.votesReceived.toNumber(),
        proposalsAuthored: m.proposalsAuthored.toNumber(),
        participationRate: m.participationRate.toNumber(),
        consecutiveTerms: m.consecutiveTerms.toNumber(),
      };
    });
  } catch (error) {
    console.error('Failed to fetch council members:', error);
    return [];
  }
}
