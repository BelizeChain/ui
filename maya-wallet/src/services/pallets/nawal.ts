/**
 * BelizeChain Nawal AI API Integration
 *
 * Reads the Nawal federated-learning coordinator (an off-chain FastAPI service).
 * Nothing here is invented: when the coordinator is unreachable these calls
 * return `null`/`[]` so callers can show an honest empty state.
 */

import { claimStakingRewards } from './staking';

const NAWAL_API_URL = process.env.NEXT_PUBLIC_NAWAL_API_URL || 'http://localhost:8080/api/v1/fl';

export interface NawalParticipantStats {
  account_id: string;
  total_rounds: number;
  successful_rounds: number;
  total_rewards: number;
  average_quality: number;
  last_submission: string | null;
  honestyScore: number;
  unclaimedRewardsDalla: string;
}

export interface NawalSystemMetrics {
  total_rounds: number;
  active_rounds: number;
  total_participants: number;
  active_participants: number;
  total_models_trained: number;
  average_round_time: number;
  blockchain_connected: boolean;
  globalAccuracy: number;
}

export interface NawalRoundStatus {
  round_id: string;
  task_name: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | string;
  participants: number;
  submissions_received: number;
  current_accuracy: number | null;
  loss: number;
  start_time: string;
  completion_time: string | null;
  targetEpochs: number;
  rewardPoolDalla: string;
}

export interface ModelGenome {
  genomeId: string;
  modelName: string;
  architecture: string;
  accuracy: number;
  trainedRounds: number;
  ipfsCid: string;
  sizeMb: number;
}

/**
 * Get participant statistics for an account.
 *
 * Returns `null` when the coordinator is unreachable.
 */
export async function getParticipantStats(accountId: string): Promise<NawalParticipantStats | null> {
  try {
    const response = await fetch(`${NAWAL_API_URL}/participants/${accountId}`, { signal: AbortSignal.timeout(1500) });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Coordinator unreachable.
  }

  return null;
}

/**
 * Get system-wide federated learning metrics.
 *
 * Returns `null` when the coordinator is unreachable.
 */
export async function getSystemMetrics(): Promise<NawalSystemMetrics | null> {
  try {
    const response = await fetch(`${NAWAL_API_URL}/metrics`, { signal: AbortSignal.timeout(1500) });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Coordinator unreachable.
  }

  return null;
}

/**
 * Get active FL rounds. Returns `[]` when the coordinator is unreachable.
 */
export async function getActiveRounds(): Promise<NawalRoundStatus[]> {
  try {
    const response = await fetch(`${NAWAL_API_URL}/rounds?status=active`, { signal: AbortSignal.timeout(1500) });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Coordinator unreachable.
  }

  return [];
}

/**
 * Get round status by ID
 */
export async function getRoundStatus(roundId: string): Promise<NawalRoundStatus | null> {
  const rounds = await getActiveRounds();
  return rounds.find((r) => r.round_id === roundId) || rounds[0] || null;
}

/**
 * Get recently completed FL rounds. Returns `[]` when the coordinator is
 * unreachable.
 */
export async function getRecentRounds(limit: number = 10): Promise<NawalRoundStatus[]> {
  try {
    const response = await fetch(`${NAWAL_API_URL}/rounds?limit=${limit}`, {
      signal: AbortSignal.timeout(1500),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Coordinator unreachable.
  }

  return [];
}

/**
 * Submit a local training gradient.
 *
 * NOT WIRED. The on-chain call is
 * `staking.submitModelDelta(taskId, encryptedDelta, computationCommitment,
 * computationLog)` — none of which can be derived from a loss/accuracy pair.
 * This used to return a fabricated transaction hash; it now fails loudly. The
 * Nawal client should call `submitModelDelta` directly with the real payload.
 */
export async function submitLocalGradient(
  accountId: string,
  roundId: string,
  loss: number,
  accuracy: number
): Promise<{ hash: string; commitmentId: string }> {
  void accountId; void roundId; void loss; void accuracy;
  throw new Error(
    'Local gradient submission is not wired to the chain. Call staking.submitModelDelta with the real payload from the Nawal client.',
  );
}

/**
 * Claim PoUW AI training rewards in native DALLA.
 *
 * Delegates to the real `staking.claimPouwWithDomainBonus` extrinsic. The pallet
 * computes the payout at claim time from the validator's scores, so the claimed
 * amount is read back from the extrinsic event.
 */
export async function claimAiPoUwRewards(accountId: string): Promise<{ hash: string; claimedDalla: string }> {
  const { hash, amount } = await claimStakingRewards(accountId);
  return { hash, claimedDalla: amount };
}
