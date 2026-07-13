import React from 'react';
import { Card, Badge } from '@belizechain/shared';
import { Users } from 'phosphor-react';
import type { CommunityProposal } from '@/services/types';

/**
 * Card displaying a single community proposal.
 * Shows title, author (short address), status badge, and a placeholder Vote button.
 */
export const ProposalCard: React.FC<{ proposal: CommunityProposal }> = ({ proposal }) => {
  const shortAddress = (addr: string) => (addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr);

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:shadow-xl transition-shadow cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Users size={20} weight="fill" className="text-jungle-500" />
          <h3 className="text-white font-medium">{proposal.title ?? 'Untitled Proposal'}</h3>
        </div>
        {/* Status badge – assuming proposal.status exists */}
        <Badge variant="info" className="bg-white/20 text-white border-white/30">
          {proposal.status ?? 'Open'}
        </Badge>
      </div>
      <p className="text-sm text-white/70 mb-2">by {shortAddress(proposal.author ?? '')}</p>
      <button className="mt-2 px-3 py-1 rounded bg-jungle-500 hover:bg-jungle-600 text-white text-sm transition-colors">
        Vote
      </button>
    </Card>
  );
};
