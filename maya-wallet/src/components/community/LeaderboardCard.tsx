import React, { useEffect, useState } from 'react';
import { communityIndexer } from '@/services/community-indexer.service';
import type { SRSData } from '@/services/types';

/**
 * Glass‑morphism card that displays the top N accounts by SRS score.
 * Shows loading, error (via toast) and a simple list.
 */
export const LeaderboardCard: React.FC<{ limit?: number }> = ({ limit = 10 }) => {
  const [data, setData] = useState<Array<{ account: string; srs: SRSData }> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await communityIndexer.getLeaderboardRpc(limit);
        if (!cancelled) setData(result);
      } catch (e) {
        // showError is exported from the service file
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { showError } = require('@/services/community-indexer.service');
        showError('Failed to load leaderboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow">
      <h2 className="text-xl font-semibold text-white mb-3">Community Leaderboard</h2>
      {loading && <p className="text-white/70">Loading…</p>}
      {data && (
        <ul className="space-y-2">
          {data.map((row, idx) => (
            <li key={row.account} className="flex justify-between text-white">
              <span className="font-mono">{idx + 1}. {row.account.slice(0, 6)}…{row.account.slice(-4)}</span>
              <span className="font-medium">{row.srs.total ?? 0}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
