/**
 * Service types for Maya Wallet community and SRS pallets.
 *
 * These types mirror the on-chain structures exposed by
 * `community.srsScores` and `community.communityProposals`.
 */

/** Social Reputation Score data returned by the community pallet. */
export interface SRSData {
  /** Composite score (sum of all components). */
  total: number;
  /** Governance participation score. */
  governance?: number;
  /** Staking / PoUW contribution score. */
  staking?: number;
  /** Community engagement score. */
  engagement?: number;
  /** Compliance / KYC score bonus. */
  compliance?: number;
  /** Timestamp of last update. */
  lastUpdated?: number;
}

/** Community proposal as stored on-chain. */
export interface CommunityProposal {
  /** Optional ID for UI tracking. */
  id?: string | number;
  /** Proposal title. */
  title?: string;
  /** Proposal description or hash. */
  description?: string;
  /** Author account address. */
  author?: string;
  /** Proposal status. */
  status?: 'Open' | 'Approved' | 'Rejected' | 'Enacted';
  /** Number of votes for. */
  votesFor?: number;
  /** Number of votes against. */
  votesAgainst?: number;
  /** Block number when proposed. */
  proposedAt?: number;
  /** Block number when voting ends. */
  votingEndsAt?: number;
}
