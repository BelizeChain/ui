'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  FunnelSimple,
  CheckCircle,
  XCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Users,
  CalendarBlank,
  TrendUp,
  Warning,
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui';
import { useBlockchain } from '@/lib/blockchain/hooks';
import { useWalletStore } from '@/store/wallet';
import {
  getActiveProposals,
  voteOnProposal,
  type Proposal as ChainProposal,
} from '@/services/pallets/governance';

type ProposalStatus = 'Active' | 'Passed' | 'Failed' | 'Rejected';
type VoteType = 'Aye' | 'Nay' | 'Abstain';

/**
 * Map raw on-chain `ProposalStatus` variant names to the UI's compressed
 * status set. Anything we don't recognise is treated as `Active` so the row
 * still renders with vote controls instead of disappearing.
 */
function mapStatus(raw: string): ProposalStatus {
  switch (raw) {
    case 'Approved':
    case 'Executed':
    case 'Passed':
      return 'Passed';
    case 'Rejected':
      return 'Rejected';
    case 'Failed':
    case 'Cancelled':
      return 'Failed';
    default:
      return 'Active';
  }
}

/**
 * Map raw on-chain `ProposalType` variant names to the UI category set. The
 * portal only renders four buckets; everything unknown maps to `Policy`.
 */
function mapCategory(raw: string): Proposal['category'] {
  if (raw === 'Treasury' || raw === 'Emergency' || raw === 'Technical' || raw === 'Policy') {
    return raw;
  }
  if (raw === 'Department' || raw === 'Council' || raw === 'Community') return 'Policy';
  return 'Policy';
}

function chainToUiProposal(p: ChainProposal): Proposal {
  const ayeVotes = p.voteCount.ayes;
  const nayVotes = p.voteCount.nays;
  const totalVotes = ayeVotes + nayVotes;
  const amountDALLA =
    p.value && p.value !== '0' ? p.value : undefined;
  // Convert block-number timestamps (best-effort): the on-chain `voting_start`
  // and `voting_end` are block numbers, not unix times. Show them as a ISO
  // date only when they fit a plausible unix-ms range; otherwise fall back
  // to "now" so the sort/filter logic keeps working.
  const toIso = (n: number): string => {
    if (!Number.isFinite(n) || n <= 0) return new Date().toISOString();
    // Heuristic: > 10^12 looks like a millisecond timestamp; smaller values
    // are block numbers and we just leave them as "now" for display.
    if (n > 1_000_000_000_000) return new Date(n).toISOString();
    return new Date().toISOString();
  };
  return {
    id: p.index,
    title: p.title || `Proposal #${p.index}`,
    description: p.description || '',
    proposer: p.proposer,
    proposerName: p.proposer ? `${p.proposer.slice(0, 6)}…${p.proposer.slice(-4)}` : 'Unknown',
    department: p.category || 'General',
    status: mapStatus(p.status),
    ayeVotes,
    nayVotes,
    abstainVotes: 0,
    totalVotes,
    threshold: 66,
    amountDALLA,
    createdAt: toIso(p.createdAt),
    endsAt: toIso(p.voteEnd),
    category: mapCategory(p.category),
  };
}

interface Proposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  proposerName: string;
  department: string;
  status: ProposalStatus;
  ayeVotes: number;
  nayVotes: number;
  abstainVotes: number;
  totalVotes: number;
  threshold: number;
  amountDALLA?: string;
  amountbBZD?: string;
  createdAt: string;
  endsAt: string;
  category: 'Treasury' | 'Policy' | 'Technical' | 'Emergency';
}

// Proposal data is fetched live from `pallet_governance::Proposals` via
// `getActiveProposals()` below — no hardcoded fixtures.

export default function GovernanceProposalsPage() {
  const router = useRouter();
  const { isReady } = useBlockchain();
  const { selectedAccount } = useWalletStore();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [submittingVoteFor, setSubmittingVoteFor] = useState<number | null>(null);
  const [pendingVote, setPendingVote] = useState<{ proposalId: number; vote: VoteType } | null>(null);
  const [filterStatus, setFilterStatus] = useState<ProposalStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'ending' | 'votes'>('newest');

  // Poll `pallet_governance::Proposals` every 15s while the page is open.
  // We keep the last successful snapshot on transient errors so the list does
  // not flicker to empty between connection blips.
  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    let lastGood: Proposal[] | null = null;

    const tick = async () => {
      try {
        const live = await getActiveProposals();
        if (cancelled) return;
        const mapped = live.map(chainToUiProposal);
        lastGood = mapped;
        setProposals(mapped);
      } catch (err) {
        console.error('getActiveProposals failed:', err);
        if (lastGood && !cancelled) setProposals(lastGood);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    tick();
    const id = setInterval(tick, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isReady]);

  // Filter and sort proposals
  const filteredProposals = proposals
    .filter((p) => filterStatus === 'All' || p.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'ending') {
        return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
      } else {
        return b.totalVotes - a.totalVotes;
      }
    });

  // Vote on proposal — submits `governance.castVote(id, aye|nay, conviction=0)`.
  // Abstain is not supported by the on-chain pallet; we surface a clear error
  // rather than silently dropping the click.
  const handleVote = async (proposalId: number, vote: VoteType) => {
    setVoteError(null);
    if (!selectedAccount) {
      setVoteError('Connect a wallet account to vote.');
      return;
    }
    if (vote === 'Abstain') {
      setVoteError('Abstain is not supported by pallet_governance::castVote.');
      return;
    }
    // Defer the on-chain submission until the user confirms in the dialog.
    setPendingVote({ proposalId, vote });
  };

  // Submit the confirmed vote as an on-chain extrinsic.
  const submitVote = async () => {
    if (!selectedAccount || !pendingVote) return;
    const { proposalId, vote } = pendingVote;
    // Abstain is filtered out in handleVote, so only Aye/Nay reach here.
    if (vote === 'Abstain') return;
    setSubmittingVoteFor(proposalId);
    try {
      const { hash } = await voteOnProposal(selectedAccount.address, proposalId, vote);
      console.log(`Vote ${vote} for proposal ${proposalId} in block`, hash);
      // Optimistic refresh: pick up the new tally on the next poll tick.
      const refreshed = await getActiveProposals();
      setProposals(refreshed.map(chainToUiProposal));
      setPendingVote(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vote submission failed';
      setVoteError(message);
      setPendingVote(null);
    } finally {
      setSubmittingVoteFor(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Governance Proposals</h1>
          <p className="text-sm text-gray-400">
            {filteredProposals.length} {filterStatus === 'All' ? 'total' : filterStatus.toLowerCase()} proposal
            {filteredProposals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => router.push('/governance/proposals/new')}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center gap-2"
        >
          <Plus size={20} weight="bold" />
          Create Proposal
        </Button>
      </div>

      {/* Filters & Sort */}
      <GlassCard variant="dark-medium" blur="lg" className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <FunnelSimple size={20} className="text-gray-400" weight="bold" />
            <span className="text-sm text-gray-400">Filter:</span>
            {(['All', 'Active', 'Passed', 'Failed', 'Rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {status}
                {status !== 'All' && (
                  <span className="ml-1.5 opacity-70">
                    ({proposals.filter((p) => p.status === status).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 md:ml-auto">
            <span className="text-sm text-gray-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-gray-700 text-white text-xs rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="ending">Ending Soon</option>
              <option value="votes">Most Votes</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Proposals List */}
      <div className="space-y-4">
        {voteError && (
          <GlassCard variant="dark-medium" blur="lg" className="p-4 border border-red-500/30">
            <p className="text-sm text-red-300">{voteError}</p>
          </GlassCard>
        )}
        {filteredProposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            disabled={submittingVoteFor === proposal.id}
            onVote={handleVote}
            onViewDetails={() => router.push(`/governance/proposals/${proposal.id}`)}
          />
        ))}

        {filteredProposals.length === 0 && (
          <GlassCard variant="dark-medium" blur="lg" className="p-12 text-center">
            <FileText size={48} className="text-gray-600 mx-auto mb-4" weight="duotone" />
            <p className="text-lg font-medium text-gray-400">
              {loading ? 'Loading proposals…' : 'No proposals found'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {loading
                ? 'Querying pallet_governance::Proposals…'
                : filterStatus === 'All'
                  ? 'No proposals have been created yet'
                  : `No ${filterStatus.toLowerCase()} proposals`}
            </p>
          </GlassCard>
        )}
      </div>

      <ConfirmDialog
        open={pendingVote !== null}
        onOpenChange={(open) => {
          if (!open) setPendingVote(null);
        }}
        title={pendingVote ? `Cast ${pendingVote.vote} vote?` : 'Cast vote?'}
        description={
          pendingVote
            ? `This submits an on-chain governance.castVote extrinsic for proposal #${pendingVote.proposalId}. Your vote is recorded permanently and cannot be changed.`
            : undefined
        }
        confirmLabel={pendingVote ? `Vote ${pendingVote.vote}` : 'Confirm'}
        loading={submittingVoteFor !== null}
        onConfirm={submitVote}
      />
    </div>
  );
}

/**
 * Proposal Card Component
 */
interface ProposalCardProps {
  proposal: Proposal;
  disabled?: boolean;
  onVote: (proposalId: number, vote: VoteType) => void;
  onViewDetails: () => void;
}

function ProposalCard({ proposal, disabled, onVote, onViewDetails }: ProposalCardProps) {
  const votePercentage = proposal.totalVotes > 0 ? (proposal.ayeVotes / proposal.totalVotes) * 100 : 0;
  const isPassing = votePercentage >= proposal.threshold;
  const timeRemaining = getTimeRemaining(proposal.endsAt);

  return (
    <GlassCard
      variant="dark-medium"
      blur="lg"
      className="p-6 hover:bg-gray-700/50 transition-colors cursor-pointer"
      onClick={onViewDetails}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium text-gray-500">#{proposal.id}</span>
              <StatusBadge status={proposal.status} />
              <CategoryBadge category={proposal.category} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{proposal.title}</h3>
            <p className="text-sm text-gray-400 line-clamp-2">{proposal.description}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Users size={16} weight="duotone" />
            <span>{proposal.proposerName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarBlank size={16} weight="duotone" />
            <span>Created {formatDate(proposal.createdAt)}</span>
          </div>
          {proposal.amountDALLA && (
            <div className="flex items-center gap-1.5">
              <TrendUp size={16} weight="duotone" className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">{proposal.amountDALLA} DALLA</span>
            </div>
          )}
        </div>

        {/* Voting Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Approval Progress</span>
            <div className="flex items-center gap-2">
              {proposal.status === 'Active' && (
                <span
                  className={`font-medium ${
                    isPassing ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {votePercentage.toFixed(1)}% (requires {proposal.threshold}%)
                </span>
              )}
              <span className="text-gray-500">{proposal.totalVotes} votes</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isPassing
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400'
              }`}
              style={{ width: `${Math.min(votePercentage, 100)}%` }}
            />
            {/* Threshold Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/50"
              style={{ left: `${proposal.threshold}%` }}
            />
          </div>

          {/* Vote Breakdown */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ThumbsUp size={14} weight="fill" />
              <span>{proposal.ayeVotes} Aye</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-400">
              <ThumbsDown size={14} weight="fill" />
              <span>{proposal.nayVotes} Nay</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Minus size={14} weight="bold" />
              <span>{proposal.abstainVotes} Abstain</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {proposal.status === 'Active' && (
          <div className="flex items-center gap-3 pt-4 border-t border-gray-700/50">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock size={16} weight="duotone" className="text-amber-400" />
              <span className="text-amber-400 font-medium">{timeRemaining}</span>
            </div>
            <div className="flex items-center gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
              <Button
                onClick={() => onVote(proposal.id, 'Aye')}
                disabled={disabled}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
              >
                <ThumbsUp size={14} weight="fill" />
                Aye
              </Button>
              <Button
                onClick={() => onVote(proposal.id, 'Nay')}
                disabled={disabled}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
              >
                <ThumbsDown size={14} weight="fill" />
                Nay
              </Button>
              <Button
                onClick={() => onVote(proposal.id, 'Abstain')}
                disabled={disabled}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
              >
                <Minus size={14} weight="bold" />
                Abstain
              </Button>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: ProposalStatus }) {
  const config = {
    Active: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
    Passed: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
    Failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    Rejected: { icon: Warning, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  }[status];

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 ${config.bg} border ${config.border} rounded-lg`}>
      <Icon size={14} className={config.color} weight="fill" />
      <span className={`text-xs font-medium ${config.color}`}>{status}</span>
    </div>
  );
}

/**
 * Category Badge Component
 */
function CategoryBadge({ category }: { category: string }) {
  return (
    <div className="inline-flex items-center px-2 py-1 bg-gray-700 rounded-lg">
      <span className="text-xs text-gray-300">{category}</span>
    </div>
  );
}

/**
 * Utility Functions
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTimeRemaining(endDate: string): string {
  const now = new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) return 'Ended';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 0) return `${diffDays}d ${diffHours}h remaining`;
  return `${diffHours}h remaining`;
}
