/**
 * BelizeChain Nawal AI API Integration
 *
 * Reads the Nawal federated-learning coordinator (an off-chain FastAPI service).
 * Nothing here is invented: when the coordinator is unreachable these calls
 * return `null`/`[]` so callers can show an honest empty state.
 *
 * Two things make that empty state common, and neither is a bug in this file:
 *
 * 1. The base URL used to default to `http://localhost:8080`, which from a
 *    browser means the visitor's own machine. It now comes from the shared
 *    runtime config, which derives `<origin>/api/nawal` behind the reverse
 *    proxy and only falls back to localhost when there is no browser origin.
 * 2. Every `/api/v1/*` route on the coordinator requires an API key, and a
 *    browser cannot hold one. Those requests answer 401 and are treated as
 *    "no data". To populate these tiles for real, the coordinator has to be
 *    reached from a server-side route that adds the key — the `/health` and
 *    `/metrics` endpoints are the only unauthenticated ones.
 */

import { getRuntimeConfig } from '@belizechain/shared';
import { claimStakingRewards } from './staking';

/**
 * Base URL of the coordinator's federated-learning API.
 *
 * The proxy maps `/api/nawal/*` onto the service root, so the coordinator's own
 * `/api/v1/fl/*` prefix is appended here rather than assumed to be part of the
 * runtime-config value.
 */
function nawalApiBase(): string {
  return `${getRuntimeConfig().nawalApiUrl}/api/v1/fl`;
}

export interface NawalParticipantStats {
  account_id: string;
  total_rounds: number;
  successful_rounds: number;
  total_rewards: number;
  average_quality: number;
  last_submission: string | null;
  /** Not served by the coordinator; derived on-chain or shown as “—”. */
  honestyScore?: number;
  unclaimedRewardsDalla?: string;
}

export interface NawalSystemMetrics {
  total_rounds: number;
  active_rounds: number;
  total_participants: number;
  active_participants: number;
  total_models_trained: number;
  average_round_time: number;
  blockchain_connected: boolean;
  /**
   * The coordinator reports no accuracy figure — `SystemMetrics` has no such
   * field. Optional so callers fall back to “—” instead of rendering
   * `undefined%`.
   */
  globalAccuracy?: number;
}

export interface NawalRoundStatus {
  round_id: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | string;
  participants: number;
  submissions_received: number;
  current_accuracy: number | null;
  start_time: string;
  completion_time: string | null;
  /** Not served by the coordinator; optional so a missing value reads as “—”. */
  task_name?: string;
  loss?: number;
  targetEpochs?: number;
  rewardPoolDalla?: string;
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
    const response = await fetch(`${nawalApiBase()}/participants/${accountId}`, { signal: AbortSignal.timeout(1500) });
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
    const response = await fetch(`${nawalApiBase()}/metrics`, { signal: AbortSignal.timeout(1500) });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Coordinator unreachable.
  }

  return null;
}

/**
 * Get active FL rounds.
 *
 * The coordinator exposes rounds only as `POST /api/v1/fl/rounds` (create) and
 * `GET /api/v1/fl/rounds/{round_id}` (one round). There is no list endpoint, so
 * this always returns `[]` — that is a missing backend route, not empty state.
 * `getRoundStatus` reads a specific round directly.
 */
export async function getActiveRounds(): Promise<NawalRoundStatus[]> {
  return [];
}

/**
 * Get round status by ID, from the coordinator’s real per-round endpoint.
 */
export async function getRoundStatus(roundId: string): Promise<NawalRoundStatus | null> {
  try {
    const response = await fetch(`${nawalApiBase()}/rounds/${encodeURIComponent(roundId)}`, {
      signal: AbortSignal.timeout(1500),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Coordinator unreachable.
  }

  return null;
}

/**
 * Get recently completed FL rounds.
 *
 * Same missing list endpoint as `getActiveRounds`, so this returns `[]` rather
 * than pretending to page through rounds it cannot ask for.
 */
export async function getRecentRounds(limit: number = 10): Promise<NawalRoundStatus[]> {
  void limit;
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
