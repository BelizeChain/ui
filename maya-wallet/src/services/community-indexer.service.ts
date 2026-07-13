// src/services/community-indexer.service.ts

import { initializeApi } from '@/services/blockchain';
import type { CommunityProposal, SRSData } from '@/services/types'; // placeholder for generated types

// Retry helper with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delay = 200): Promise<T> {
  let lastError: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      // exponential backoff
      await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
    }
  }
  throw lastError;
}

import { toast } from 'sonner';
function showError(message: string) {
  toast.error(message, { description: 'Community service error' });
}

/** Service to query community pallet data from the blockchain */
export class CommunityIndexerService {
  /** Retrieve leaderboard of accounts sorted by SRS score */
  async getLeaderboard(limit: number = 10): Promise<Array<{ account: string; srs: SRSData }>> {
    try {
      return await withRetry(async () => {
        const api = await initializeApi();
        const entries = await api.query.community.srsScores.entries();
        const scores = entries.map(([key, opt]) => ({
          account: key.args[0].toString(),
          srs: opt.unwrapOrDefault(),
        }));
        scores.sort((a, b) => (b.srs.total ?? 0) - (a.srs.total ?? 0));
        return scores.slice(0, limit);
      });
    } catch (e) {
      showError('Failed to load leaderboard');
      throw e;
    }
  }

  /** Retrieve all community proposals */
  async getProposals(): Promise<Array<{ id: number; proposal: CommunityProposal }>> {
    try {
      return await withRetry(async () => {
        const api = await initializeApi();
        const entries = await api.query.community.communityProposals.entries();
        return entries.map(([key, opt]) => ({
          id: key.args[0].toNumber(),
          proposal: opt.unwrapOrDefault(),
        }));
      });
    } catch (e) {
      showError('Failed to load proposals');
      throw e;
    }
  }

  // RPC based fetch SRS for a specific account
  async getSRS(account: string): Promise<SRSData> {
    try {
      return await withRetry(async () => {
        const api = await initializeApi();
        return await api.rpc.communityApi.getSrs(account);
      });
    } catch (e) {
      showError('Failed to load SRS for account');
      throw e;
    }
  }

  // RPC based fetch all proposals (RPC version)
  async getProposalsRpc(): Promise<CommunityProposal[]> {
    try {
      return await withRetry(async () => {
        const api = await initializeApi();
        return await api.rpc.communityApi.getProposals();
      });
    } catch (e) {
      showError('Failed to load proposals via RPC');
      throw e;
    }
  }

  // RPC based fetch leaderboard (optionally limit)
  async getLeaderboardRpc(limit: number = 10): Promise<Array<{ account: string; srs: SRSData }>> {
    try {
      return await withRetry(async () => {
        const api = await initializeApi();
        const raw = await api.rpc.communityApi.getLeaderboard();
        const sorted = raw.sort((a, b) => (b.srs.total ?? 0) - (a.srs.total ?? 0));
        return sorted.slice(0, limit);
      });
    } catch (e) {
      showError('Failed to load leaderboard via RPC');
      throw e;
    }
  }

}

export const communityIndexer = new CommunityIndexerService();
