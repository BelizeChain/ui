import React, { useEffect, useState } from 'react';
import { communityIndexer } from '@/services/community-indexer.service';
import type { CommunityProposal } from '@/services/types';
import { ProposalCard } from '@/components/community/ProposalCard';
import { Card } from '@belizechain/shared';
import { toast } from 'sonner';

/**
 * Page that lists all community proposals.
 * Shows loading state, error toast, and renders each proposal via {@link ProposalCard}.
 */
const ProposalsPage: React.FC = () => {
  const [proposals, setProposals] = useState<CommunityProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await communityIndexer.getProposalsRpc();
        if (!cancelled) setProposals(data);
      } catch (e) {
        toast.error('Failed to load proposals');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-white/70">Loading proposals…</p>;
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-white mb-4">Community Proposals</h2>
      {proposals.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-white/70">No proposals available.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {proposals.map((p) => (
            <ProposalCard key={p.id ?? p.title} proposal={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProposalsPage;
