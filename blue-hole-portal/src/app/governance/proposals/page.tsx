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
import { useBlockchain } from '@/lib/blockchain/hooks';
import { useWalletStore } from '@/store/wallet';

type ProposalStatus = 'Active' | 'Passed' | 'Failed' | 'Rejected';
type VoteType = 'Aye' | 'Nay' | 'Abstain';

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

// Mock data - will be replaced with real blockchain data
const mockProposals: Proposal[] = [
  {
    id: 1,
    title: 'Treasury Allocation Q1 2026 - Education Infrastructure',
    description: 'Proposal to allocate 2.5M DALLA for upgrading educational infrastructure across 6 districts, including new computer labs, internet connectivity, and teacher training programs.',
    proposer: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    proposerName: 'Ministry of Education',
    department: 'Education',
    status: 'Active',
    ayeVotes: 28,
    nayVotes: 5,
    abstainVotes: 2,
    totalVotes: 35,
    threshold: 66,
    amountDALLA: '2,500,000',
    category: 'Treasury',
    createdAt: '2026-01-20T10:00:00Z',
    endsAt: '2026-01-27T23:59:59Z',
  },
  {
    id: 2,
    title: 'Validator Commission Rate Adjustment',
    description: 'Reduce maximum validator commission from 20% to 15% to incentivize better returns for delegators and promote network decentralization.',
    proposer: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    proposerName: 'Network Governance Council',
    department: 'Network Operations',
    status: 'Active',
    ayeVotes: 42,
    nayVotes: 8,
    abstainVotes: 1,
    totalVotes: 51,
    threshold: 66,
    category: 'Policy',
    createdAt: '2026-01-18T14:30:00Z',
    endsAt: '2026-01-26T23:59:59Z',
  },
  {
    id: 3,
    title: 'Tourism Cashback Program Expansion',
    description: 'Increase tourism merchant cashback rewards from 5-8% to 7-10% for Q1-Q2 2026 to boost adoption and attract more international visitors.',
    proposer: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
    proposerName: 'Tourism Board',
    department: 'Tourism',
    status: 'Passed',
    ayeVotes: 67,
    nayVotes: 3,
    abstainVotes: 2,
    totalVotes: 72,
    threshold: 66,
    amountDALLA: '500,000',
    category: 'Treasury',
    createdAt: '2026-01-10T09:00:00Z',
    endsAt: '2026-01-17T23:59:59Z',
  },
  {
    id: 4,
    title: 'Emergency Hurricane Relief Fund',
    description: 'Establish emergency fund of 5M DALLA for rapid hurricane disaster response, accessible via multi-sig approval from Prime Minister and Finance Minister.',
    proposer: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
    proposerName: 'National Emergency Management',
    department: 'Emergency Services',
    status: 'Passed',
    ayeVotes: 89,
    nayVotes: 1,
    abstainVotes: 0,
    totalVotes: 90,
    threshold: 66,
    amountDALLA: '5,000,000',
    category: 'Emergency',
    createdAt: '2026-01-05T11:00:00Z',
    endsAt: '2026-01-12T23:59:59Z',
  },
  {
    id: 5,
    title: 'Quantum Node Hardware Upgrade',
    description: 'Upgrade Kinich quantum computing nodes to support 127-qubit systems for improved PQW verification and national research capabilities.',
    proposer: '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw',
    proposerName: 'Science & Technology Division',
    department: 'Technology',
    status: 'Active',
    ayeVotes: 15,
    nayVotes: 12,
    abstainVotes: 5,
    totalVotes: 32,
    threshold: 66,
    amountDALLA: '1,200,000',
    category: 'Technical',
    createdAt: '2026-01-22T16:00:00Z',
    endsAt: '2026-01-29T23:59:59Z',
  },
  {
    id: 6,
    title: 'BNS Domain Price Reduction',
    description: 'Reduce .bz domain registration fee from 100 DALLA to 50 DALLA to encourage adoption of decentralized web hosting.',
    proposer: '5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL',
    proposerName: 'Digital Infrastructure Team',
    department: 'Technology',
    status: 'Failed',
    ayeVotes: 22,
    nayVotes: 48,
    abstainVotes: 10,
    totalVotes: 80,
    threshold: 66,
    category: 'Policy',
    createdAt: '2026-01-08T13:00:00Z',
    endsAt: '2026-01-15T23:59:59Z',
  },
];

export default function GovernanceProposalsPage() {
  const router = useRouter();
  const { isReady } = useBlockchain();
  const { selectedAccount } = useWalletStore();
  const [proposals, setProposals] = useState<Proposal[]>(mockProposals);
  const [filterStatus, setFilterStatus] = useState<ProposalStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'ending' | 'votes'>('newest');

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

  // Vote on proposal
  const handleVote = async (proposalId: number, vote: VoteType) => {
    if (!selectedAccount) {
      alert('Please connect your wallet to vote');
      return;
    }

    // TODO: Submit vote extrinsic to blockchain
    console.log(`Voting ${vote} on proposal ${proposalId}`);
    alert(`Vote ${vote} submitted for Proposal #${proposalId}`);
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
        {filteredProposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onVote={handleVote}
            onViewDetails={() => router.push(`/governance/proposals/${proposal.id}`)}
          />
        ))}

        {filteredProposals.length === 0 && (
          <GlassCard variant="dark-medium" blur="lg" className="p-12 text-center">
            <FileText size={48} className="text-gray-600 mx-auto mb-4" weight="duotone" />
            <p className="text-lg font-medium text-gray-400">No proposals found</p>
            <p className="text-sm text-gray-500 mt-2">
              {filterStatus === 'All'
                ? 'No proposals have been created yet'
                : `No ${filterStatus.toLowerCase()} proposals`}
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

/**
 * Proposal Card Component
 */
interface ProposalCardProps {
  proposal: Proposal;
  onVote: (proposalId: number, vote: VoteType) => void;
  onViewDetails: () => void;
}

function ProposalCard({ proposal, onVote, onViewDetails }: ProposalCardProps) {
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
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                <ThumbsUp size={14} weight="fill" />
                Aye
              </Button>
              <Button
                onClick={() => onVote(proposal.id, 'Nay')}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                <ThumbsDown size={14} weight="fill" />
                Nay
              </Button>
              <Button
                onClick={() => onVote(proposal.id, 'Abstain')}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium flex items-center gap-1.5"
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
