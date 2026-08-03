/**
 * BelizeChain Nawal AI API Integration
 * Handles interactions with the local Nawal AI Federated Learning Server
 */

const NAWAL_API_URL = process.env.NEXT_PUBLIC_NAWAL_API_URL || 'http://localhost:8080/api/v1/fl';

export interface NawalParticipantStats {
  account_id: string;
  total_rounds: number;
  successful_rounds: number;
  total_rewards: number;
  average_quality: number;
  last_submission: string | null;
}

export interface NawalSystemMetrics {
  total_rounds: number;
  active_rounds: number;
  total_participants: number;
  active_participants: number;
  total_models_trained: number;
  average_round_time: number;
  blockchain_connected: boolean;
}

export interface NawalRoundStatus {
  round_id: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | string;
  participants: number;
  submissions_received: number;
  current_accuracy: number | null;
  start_time: string;
  completion_time: string | null;
}

/**
 * Get participant statistics for an account
 */
export async function getParticipantStats(accountId: string): Promise<NawalParticipantStats | null> {
  try {
    const response = await fetch(`${NAWAL_API_URL}/participants/${accountId}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch participant stats: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching participant stats:', error);
    return null;
  }
}

/**
 * Get system-wide federated learning metrics
 */
export async function getSystemMetrics(): Promise<NawalSystemMetrics | null> {
  try {
    const response = await fetch(`${NAWAL_API_URL}/metrics`);
    if (!response.ok) {
      throw new Error(`Failed to fetch system metrics: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return null;
  }
}

/**
 * Get FL round status
 */
export async function getRoundStatus(roundId: string): Promise<NawalRoundStatus | null> {
  try {
    const response = await fetch(`${NAWAL_API_URL}/rounds/${roundId}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch round status: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching status for round ${roundId}:`, error);
    return null;
  }
}

/**
 * Get currently active FL rounds
 */
export async function getActiveRounds(): Promise<NawalRoundStatus[]> {
  try {
    const response = await fetch(`${NAWAL_API_URL}/rounds?status=active`);
    if (!response.ok) {
      throw new Error(`Failed to fetch active rounds: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching active rounds:', error);
    return [];
  }
}

/**
 * Get recently completed FL rounds
 */
export async function getRecentRounds(limit: number = 10): Promise<NawalRoundStatus[]> {
  try {
    const response = await fetch(`${NAWAL_API_URL}/rounds?status=completed&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch recent rounds: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching recent rounds:', error);
    return [];
  }
}
