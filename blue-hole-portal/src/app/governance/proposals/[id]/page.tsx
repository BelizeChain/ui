'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle, XCircle, Clock, ThumbsUp, ThumbsDown, Minus,
  User, FileText, CalendarBlank, Coin, ChatCircle, TrendUp, ShareNetwork
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/store/wallet';

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

// Mock proposal data (will be replaced with blockchain queries)
const mockProposal: Proposal = {
  id: 1,
  title: 'Treasury Allocation for Q1 2026',
  description: `# Proposal Summary

This proposal requests allocation of **2,500,000 DALLA** from the National Treasury for Q1 2026 operational expenses across all government departments.

## Budget Breakdown

### Ministry Allocations
- **Finance & Economic Development**: 750,000 DALLA (30%)
- **Education**: 625,000 DALLA (25%)
- **Health & Wellness**: 500,000 DALLA (20%)
- **Infrastructure & Public Works**: 375,000 DALLA (15%)
- **Tourism & Culture**: 250,000 DALLA (10%)

### Justification

The proposed allocation aligns with our national priorities:

1. **Economic Recovery**: Post-hurricane infrastructure repairs require immediate funding
2. **Education Excellence**: New school year preparations and teacher training programs
3. **Healthcare Access**: Expanding rural clinic operations
4. **Tourism Growth**: Marketing campaigns for high season

### Expected Outcomes

- **GDP Growth**: Projected 4.5% increase through Q1
- **Employment**: Creation of 150+ government positions
- **Infrastructure**: Completion of 5 major road projects
- **Tourism**: 20% increase in visitor arrivals

## Timeline

- **Approval Deadline**: February 15, 2026
- **Disbursement**: March 1, 2026
- **Reporting**: Monthly expenditure reports to Foundation Board

## Risk Mitigation

Multi-sig approval from Foundation Board (4/7 required) ensures transparent fund management and accountability.`,
  proposer: {
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    name: 'Minister of Finance',
    department: 'Finance & Economic Development',
  },
  status: 'Active',
  category: 'Treasury',
  votes: {
    aye: 3250000,
    nay: 875000,
    abstain: 450000,
    total: 4575000,
  },
  threshold: 66,
  amount: '2,500,000',
  currency: 'DALLA',
  createdAt: '2026-01-20',
  endsAt: '2026-02-15',
};

// Mock vote history timeline
const voteHistory = [
  { voter: 'BelizeCityNode', vote: 'Aye', amount: '1.2M DALLA', timestamp: '2026-01-21 10:30' },
  { voter: 'CorozalValidator', vote: 'Aye', amount: '950K DALLA', timestamp: '2026-01-22 14:15' },
  { voter: 'OrangeWalkStaking', vote: 'Nay', amount: '875K DALLA', timestamp: '2026-01-22 16:45' },
  { voter: 'StannCreekNode', vote: 'Aye', amount: '1.1M DALLA', timestamp: '2026-01-23 09:20' },
  { voter: 'ToledoValidator', vote: 'Abstain', amount: '450K DALLA', timestamp: '2026-01-24 11:00' },
];

// Mock related proposals
const relatedProposals = [
  { id: 2, title: 'Q4 2025 Treasury Report', status: 'Passed' },
  { id: 7, title: 'Budget Transparency Policy', status: 'Active' },
  { id: 12, title: 'Ministry Restructure', status: 'Failed' },
];

export default function ProposalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { selectedAccount } = useWalletStore();
  const [proposal] = useState(mockProposal);
  const [userVote, setUserVote] = useState<'Aye' | 'Nay' | 'Abstain' | null>(null);
  const [voteAmount, setVoteAmount] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  const approvalPercentage = (proposal.votes.aye / proposal.votes.total) * 100;
  const daysRemaining = Math.ceil(
    (new Date(proposal.endsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleVote = async (vote: 'Aye' | 'Nay' | 'Abstain') => {
    if (!selectedAccount || !voteAmount) return;
    
    setIsVoting(true);
    // TODO: Integrate with blockchain transaction signing
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction
    setUserVote(vote);
    setIsVoting(false);
  };

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

            {/* Vote History Timeline */}
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <ChatCircle size={24} className="text-blue-400" weight="duotone" />
                <h3 className="text-lg font-bold text-white">Vote History</h3>
              </div>
              <div className="space-y-3">
                {voteHistory.map((vote, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      vote.vote === 'Aye' ? 'bg-emerald-500/20' :
                      vote.vote === 'Nay' ? 'bg-red-500/20' : 'bg-gray-500/20'
                    }`}>
                      {vote.vote === 'Aye' ? <ThumbsUp size={20} className="text-emerald-400" weight="fill" /> :
                       vote.vote === 'Nay' ? <ThumbsDown size={20} className="text-red-400" weight="fill" /> :
                       <Minus size={20} className="text-gray-400" weight="bold" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{vote.voter}</p>
                      <p className="text-xs text-gray-400">{vote.timestamp}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-300">{vote.amount}</p>
                      <p className={`text-xs font-semibold ${
                        vote.vote === 'Aye' ? 'text-emerald-400' :
                        vote.vote === 'Nay' ? 'text-red-400' : 'text-gray-400'
                      }`}>{vote.vote}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Vote Weight (DALLA)
                      </label>
                      <input
                        type="text"
                        value={voteAmount}
                        onChange={(e) => setVoteAmount(e.target.value)}
                        placeholder="Enter amount..."
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        onClick={() => handleVote('Aye')}
                        disabled={!voteAmount || isVoting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <ThumbsUp size={16} weight="fill" />
                        Vote Aye
                      </Button>
                      <Button
                        onClick={() => handleVote('Nay')}
                        disabled={!voteAmount || isVoting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <ThumbsDown size={16} weight="fill" />
                        Vote Nay
                      </Button>
                      <Button
                        onClick={() => handleVote('Abstain')}
                        disabled={!voteAmount || isVoting}
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

            {/* Related Proposals */}
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShareNetwork size={20} className="text-purple-400" weight="duotone" />
                <h3 className="text-base font-bold text-white">Related Proposals</h3>
              </div>
              <div className="space-y-2">
                {relatedProposals.map((related) => (
                  <button
                    key={related.id}
                    onClick={() => router.push(`/governance/proposals/${related.id}`)}
                    className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors text-left"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white line-clamp-1">{related.title}</p>
                      <p className="text-xs text-gray-500">Proposal #{related.id}</p>
                    </div>
                    <StatusBadge status={related.status as any} size="sm" />
                  </button>
                ))}
              </div>
            </GlassCard>
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
