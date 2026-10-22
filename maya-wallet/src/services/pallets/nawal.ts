/**
 * BelizeChain Nawal AI API Integration
 *
 * Reads the Nawal federated-learning coordinator (an off-chain FastAPI service).
 * Nothing here is invented: when the coordinator is unreachable these calls
 * return `null`/`[]` so callers can show an honest empty state.
 *
 * Requests go to this app's own `/api/fl/*` route, which forwards them
 * server-side with the API key the coordinator requires. Two earlier shapes
 * could not work:
 *
 * - a base URL defaulting to `http://localhost:8080`, which from a browser means
 *   the visitor's own machine;
 * - calling `/api/nawal/*` directly, which nginx forwards to the coordinator
 *   without a key, so every read answered 401 and the page showed empty tiles.
 *
 * The credential stays on the server — see `app/api/fl/[...path]/route.ts`.
 */

import { claimStakingRewards } from './staking';

/**
 * Path of this app's Nawal proxy, relative to the current origin.
 *
 * These helpers are only called from client components, so the origin is
 * always available; the bare path is a safe fallback for a same-origin fetch.
 */
function nawalFlUrl(path: string): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/api/fl/${path}`;
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
    const response = await fetch(nawalFlUrl(`participants/${encodeURIComponent(accountId)}`), {
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
 * Get system-wide federated learning metrics.
 *
 * Returns `null` when the coordinator is unreachable.
 */
export async function getSystemMetrics(): Promise<NawalSystemMetrics | null> {
  try {
    const response = await fetch(nawalFlUrl('metrics'), { signal: AbortSignal.timeout(1500) });
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
    const response = await fetch(nawalFlUrl(`rounds/${encodeURIComponent(roundId)}`), {
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
