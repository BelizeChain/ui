'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, ThumbsUp, ThumbsDown, Minus,
  User, FileText, CalendarBlank, Coin, ChatCircle
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/store/wallet';
import { useBlockchain } from '@/lib/blockchain/hooks';
import {
  getProposalById,
  voteOnProposal,
  type Proposal as ChainProposal,
} from '@/services/pallets/governance';

interface Proposal {
  id: number;
  title: string;
  description: string;
  proposer: {
    address: string;
    name: string;
    department: string;
  };
  status: 'Active' | 'Passed' | 'Failed' | 'Rejected' | 'Executed';
  category: 'Treasury' | 'Policy' | 'Technical' | 'Emergency';
  votes: {
    aye: number;
    nay: number;
    abstain: number;
    total: number;
  };
  threshold: number; // Percentage needed to pass
  amount?: string; // For treasury proposals
  currency?: 'DALLA' | 'bBZD';
  createdAt: string;
  endsAt: string;
  executedAt?: string;
}

function mapStatus(raw: string): Proposal['status'] {
  switch (raw) {
    case 'Approved':
    case 'Passed':
      return 'Passed';
    case 'Executed':
      return 'Executed';
    case 'Rejected':
      return 'Rejected';
    case 'Failed':
    case 'Cancelled':
      return 'Failed';
    default:
      return 'Active';
  }
}

function mapCategory(raw: string): Proposal['category'] {
  if (raw === 'Treasury' || raw === 'Policy' || raw === 'Technical' || raw === 'Emergency') {
    return raw;
  }
  return 'Policy';
}

function chainToUiProposal(p: ChainProposal): Proposal {
  const aye = p.voteCount.ayes;
  const nay = p.voteCount.nays;
  return {
    id: p.index,
    title: p.title || `Proposal #${p.index}`,
    description: p.description || '',
    proposer: {
      address: p.proposer,
      name: p.proposer ? `${p.proposer.slice(0, 6)}\u2026${p.proposer.slice(-4)}` : 'Unknown',
      department: p.category || 'General',
    },
    status: mapStatus(p.status),
    category: mapCategory(p.category),
    votes: { aye, nay, abstain: 0, total: aye + nay },
    threshold: 66,
    amount: p.value && p.value !== '0' ? p.value : undefined,
    currency: p.value && p.value !== '0' ? 'DALLA' : undefined,
    // Block numbers, not unix ms \u2014 surface them as-is for now.
    createdAt: String(p.createdAt),
    endsAt: String(p.voteEnd),
  };
}

export default function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap Next 16 async params; the id is the on-chain proposal index.
  const { id: idParam } = use(params);
  const proposalId = Number.parseInt(idParam, 10);
  const router = useRouter();
  const { isReady } = useBlockchain();
  const { selectedAccount } = useWalletStore();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<'Aye' | 'Nay' | 'Abstain' | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  // Poll the on-chain proposal every 15s. We deliberately ignore the legacy
  // `voteAmount` UI field below \u2014 `pallet_governance::castVote` weights by
  // stake, not arbitrary planck input.
  useEffect(() => {
    if (!isReady || !Number.isFinite(proposalId)) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const live = await getProposalById(proposalId);
        if (cancelled) return;
        if (!live) {
          setLoadError(`Proposal #${proposalId} not found on chain.`);
          setProposal(null);
        } else {
          setLoadError(null);
          setProposal(chainToUiProposal(live));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('getProposalById failed:', err);
          setLoadError(err instanceof Error ? err.message : 'Failed to load proposal.');
        }
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
  }, [isReady, proposalId]);

  const approvalPercentage = proposal && proposal.votes.total > 0
    ? (proposal.votes.aye / proposal.votes.total) * 100
    : 0;

  const handleVote = async (vote: 'Aye' | 'Nay' | 'Abstain') => {
    setVoteError(null);
    if (!selectedAccount) {
      setVoteError('Connect a wallet account to vote.');
      return;
    }
    if (vote === 'Abstain') {
      setVoteError('Abstain is not supported by pallet_governance::castVote.');
      return;
    }
    if (!proposal) return;
    setIsVoting(true);
    try {
      await voteOnProposal(selectedAccount.address, proposal.id, vote);
      setUserVote(vote);
      // Refresh immediately so the tally reflects this vote.
      const live = await getProposalById(proposal.id);
      if (live) setProposal(chainToUiProposal(live));
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : 'Vote submission failed.');
    } finally {
      setIsVoting(false);
    }
  };

  if (loading && !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <GlassCard variant="dark-medium" blur="lg" className="p-8 text-center">
          <p className="text-gray-300">Loading proposal #{proposalId}\u2026</p>
        </GlassCard>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <GlassCard variant="dark-medium" blur="lg" className="p-8 text-center max-w-md">
          <XCircle size={48} className="text-red-400 mx-auto mb-4" weight="duotone" />
          <p className="text-lg font-medium text-white mb-2">Proposal unavailable</p>
          <p className="text-sm text-gray-400 mb-4">{loadError ?? 'Unknown error.'}</p>
          <Button onClick={() => router.push('/governance/proposals')}>Back to proposals</Button>
        </GlassCard>
      </div>
    );
  }

  const daysRemaining = 0; // voteEnd is a block number; UI fallback until block-to-time helper lands.

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Proposal #{proposal.id}</h1>
              <p className="text-xs text-gray-400">View details & cast your vote</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {proposal.status === 'Active' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-lg">
                <Clock size={16} className="text-blue-400" weight="fill" />
                <span className="text-xs font-medium text-blue-300">
                  {daysRemaining} days left
                </span>
              </div>
            )}
            <StatusBadge status={proposal.status} />
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proposal Header */}
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{proposal.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <User size={16} weight="duotone" />
                      <span>{proposal.proposer.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText size={16} weight="duotone" />
                      <span>{proposal.proposer.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarBlank size={16} weight="duotone" />
                      <span>Created {new Date(proposal.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <CategoryBadge category={proposal.category} />
              </div>

              {proposal.amount && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mb-6">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <Coin size={32} className="text-emerald-400" weight="duotone" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Requested Amount</p>
                    <p className="text-2xl font-bold text-white">
                      {proposal.amount} <span className="text-emerald-400">{proposal.currency}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Proposal Description (Markdown-like rendering) */}
              <div className="prose prose-invert prose-sm max-w-none">
                {proposal.description.split('\n').map((line, idx) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={idx} className="text-xl font-bold text-white mt-6 mb-3">{line.slice(2)}</h1>;
                  } else if (line.startsWith('## ')) {
                    return <h2 key={idx} className="text-lg font-bold text-white mt-5 mb-2">{line.slice(3)}</h2>;
                  } else if (line.startsWith('### ')) {
                    return <h3 key={idx} className="text-base font-semibold text-gray-200 mt-4 mb-2">{line.slice(4)}</h3>;
                  } else if (line.startsWith('- ')) {
                    return <li key={idx} className="text-gray-300 ml-4">{line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>;
                  } else if (line.match(/^\d+\./)) {
                    return <li key={idx} className="text-gray-300 ml-4">{line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>;
                  } else if (line.trim()) {
                    return <p key={idx} className="text-gray-300 mb-3" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') }} />;
                  }
                  return <br key={idx} />;
                })}
              </div>
            </GlassCard>

            {/* Vote History Timeline (pending on-chain index) */}
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <ChatCircle size={24} className="text-blue-400" weight="duotone" />
                <h3 className="text-lg font-bold text-white">Vote History</h3>
              </div>
              <p className="text-sm text-gray-400">
                Individual vote history is not yet indexed from chain events. Live tallies are shown
                in the &ldquo;Vote Breakdown&rdquo; panel.
              </p>
            </GlassCard>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Voting Interface */}
            {proposal.status === 'Active' && (
              <GlassCard variant="dark-medium" blur="lg" className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Cast Your Vote</h3>
                
                {!selectedAccount ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400 mb-3">Connect wallet to vote</p>
                    <Button variant="default" size="sm">Connect Wallet</Button>
                  </div>
                ) : userVote ? (
                  <div className="text-center py-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-3 ${
                      userVote === 'Aye' ? 'bg-emerald-500/20 text-emerald-400' :
                      userVote === 'Nay' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      <CheckCircle size={20} weight="fill" />
                      <span className="font-semibold">You voted {userVote}</span>
                    </div>
                    <p className="text-xs text-gray-500">Your vote has been recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                      Vote weight is determined by your on-chain stake; no manual amount is
                      required. Abstain is not supported by <code>pallet_governance::castVote</code>.
                    </p>
                    {voteError && (
                      <p className="text-xs text-red-300">{voteError}</p>
                    )}
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        onClick={() => handleVote('Aye')}
                        disabled={isVoting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <ThumbsUp size={16} weight="fill" />
                        Vote Aye
                      </Button>
                      <Button
                        onClick={() => handleVote('Nay')}
                        disabled={isVoting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <ThumbsDown size={16} weight="fill" />
                        Vote Nay
                      </Button>
                      <Button
                        onClick={() => handleVote('Abstain')}
                        disabled={isVoting}
                        variant="secondary"
                      >
                        <Minus size={16} weight="bold" />
                        Abstain
                      </Button>
                    </div>
                  </div>
                )}
              </GlassCard>
            )}

            {/* Vote Breakdown */}
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Vote Breakdown</h3>
              
              {/* Approval Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400">Approval</span>
                  <span className="text-lg font-bold text-white">{approvalPercentage.toFixed(1)}%</span>
                </div>
                <div className="relative h-3 bg-gray-700/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${approvalPercentage}%` }}
                  />
                  <div 
                    className="absolute h-full border-r-2 border-blue-400"
                    style={{ left: `${proposal.threshold}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">0%</span>
                  <span className="text-xs text-blue-400">{proposal.threshold}% threshold</span>
                  <span className="text-xs text-gray-500">100%</span>
                </div>
              </div>

              {/* Vote Counts */}
              <div className="space-y-3">
                <VoteCount label="Aye" count={proposal.votes.aye} total={proposal.votes.total} color="emerald" />
                <VoteCount label="Nay" count={proposal.votes.nay} total={proposal.votes.total} color="red" />
                <VoteCount label="Abstain" count={proposal.votes.abstain} total={proposal.votes.total} color="gray" />
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Votes</span>
                  <span className="font-semibold text-white">{(proposal.votes.total / 1000000).toFixed(2)}M DALLA</span>
                </div>
              </div>
            </GlassCard>

            {/* Related Proposals: not indexed yet \u2014 hidden until tagging lands. */}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' }) {
  const config = {
    Active: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    Passed: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    Failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
    Rejected: { icon: XCircle, color: 'text-orange-400', bg: 'bg-orange-500/20' },
    Executed: { icon: CheckCircle, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  }[status] || { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20' };

  const Icon = config.icon;
  const iconSize = size === 'sm' ? 14 : 16;
  const padding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';
  const fontSize = size === 'sm' ? 'text-xs' : 'text-xs';

  return (
    <div className={`inline-flex items-center gap-1.5 ${padding} ${config.bg} rounded-lg`}>
      <Icon size={iconSize} className={config.color} weight="fill" />
      <span className={`${fontSize} font-semibold ${config.color}`}>{status}</span>
    </div>
  );
}

/**
 * Category Badge Component
 */
function CategoryBadge({ category }: { category: string }) {
  const colors = {
    Treasury: 'bg-emerald-500/20 text-emerald-400',
    Policy: 'bg-blue-500/20 text-blue-400',
    Technical: 'bg-purple-500/20 text-purple-400',
    Emergency: 'bg-red-500/20 text-red-400',
  }[category] || 'bg-gray-500/20 text-gray-400';

  return (
    <div className={`px-3 py-1.5 rounded-lg ${colors}`}>
      <span className="text-xs font-semibold">{category}</span>
    </div>
  );
}

/**
 * Vote Count Component
 */
interface VoteCountProps {
  label: string;
  count: number;
  total: number;
  color: 'emerald' | 'red' | 'gray';
}

function VoteCount({ label, count, total, color }: VoteCountProps) {
  const percentage = (count / total) * 100;
  const colorClasses = {
    emerald: { bg: 'bg-emerald-500/20', bar: 'bg-emerald-500', text: 'text-emerald-400' },
    red: { bg: 'bg-red-500/20', bar: 'bg-red-500', text: 'text-red-400' },
    gray: { bg: 'bg-gray-500/20', bar: 'bg-gray-500', text: 'text-gray-400' },
  }[color];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-400">{label}</span>
        <span className={`text-sm font-semibold ${colorClasses.text}`}>
          {(count / 1000000).toFixed(2)}M ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className={`h-2 ${colorClasses.bg} rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${colorClasses.bar} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
