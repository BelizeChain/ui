'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Coin,
  TrendUp,
  TrendDown,
  Plus,
  CheckCircle,
  Clock,
  Warning,
  Users,
  ArrowsLeftRight,
  FileText,
  ChartLine,
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useBlockchain } from '@/lib/blockchain/hooks';
import { useWalletStore } from '@/store/wallet';

interface TreasuryMetrics {
  dallaBalance: string;
  bbzdBalance: string;
  dallaChange24h: number;
  bbzdChange24h: number;
  totalSpendProposals: number;
  activeSpendProposals: number;
  monthlyBurn: string;
  monthlyInflow: string;
}

interface SpendProposal {
  id: number;
  title: string;
  beneficiary: string;
  beneficiaryName: string;
  amountDALLA?: string;
  amountbBZD?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Executed';
  proposer: string;
  proposerName: string;
  approvals: number;
  requiredApprovals: number;
  createdAt: string;
  expiresAt: string;
  category: 'Infrastructure' | 'Social' | 'Economic' | 'Emergency';
}

// Mock data
const mockMetrics: TreasuryMetrics = {
  dallaBalance: '12,450,000',
  bbzdBalance: '8,200,000',
  dallaChange24h: 2.4,
  bbzdChange24h: -0.8,
  totalSpendProposals: 47,
  activeSpendProposals: 8,
  monthlyBurn: '450,000',
  monthlyInflow: '1,200,000',
};

const mockSpendProposals: SpendProposal[] = [
  {
    id: 1,
    title: 'Education Infrastructure Q1 2026',
    beneficiary: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    beneficiaryName: 'Ministry of Education',
    amountDALLA: '2,500,000',
    status: 'Pending',
    proposer: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    proposerName: 'Prime Minister Office',
    approvals: 4,
    requiredApprovals: 7,
    createdAt: '2026-01-20T10:00:00Z',
    expiresAt: '2026-01-30T23:59:59Z',
    category: 'Infrastructure',
  },
  {
    id: 2,
    title: 'Tourism Merchant Incentive Program',
    beneficiary: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
    beneficiaryName: 'Tourism Board',
    amountDALLA: '500,000',
    status: 'Approved',
    proposer: '5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL',
    proposerName: 'Finance Minister',
    approvals: 7,
    requiredApprovals: 7,
    createdAt: '2026-01-18T14:00:00Z',
    expiresAt: '2026-01-28T23:59:59Z',
    category: 'Economic',
  },
  {
    id: 3,
    title: 'Hurricane Emergency Fund Replenishment',
    beneficiary: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
    beneficiaryName: 'National Emergency Management',
    amountDALLA: '3,000,000',
    status: 'Executed',
    proposer: '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw',
    proposerName: 'Prime Minister Office',
    approvals: 7,
    requiredApprovals: 7,
    createdAt: '2026-01-15T09:00:00Z',
    expiresAt: '2026-01-25T23:59:59Z',
    category: 'Emergency',
  },
  {
    id: 4,
    title: 'Public Health Initiative Q1',
    beneficiary: '5D5PhZQNJzcJXVBxwJxZcsutjKPqUPydrvpu6HeiBfMae2Qu',
    beneficiaryName: 'Ministry of Health',
    amountbBZD: '1,200,000',
    status: 'Pending',
    proposer: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    proposerName: 'Health Minister',
    approvals: 5,
    requiredApprovals: 7,
    createdAt: '2026-01-22T11:00:00Z',
    expiresAt: '2026-02-01T23:59:59Z',
    category: 'Social',
  },
];

export default function TreasuryPage() {
  const router = useRouter();
  const { isReady } = useBlockchain();
  const { selectedAccount } = useWalletStore();
  const [metrics] = useState(mockMetrics);
  const [spendProposals] = useState(mockSpendProposals);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Executed'>('All');

  const filteredProposals = spendProposals.filter(
    (p) => filterStatus === 'All' || p.status === filterStatus
  );

  // Approve spend proposal
  const handleApprove = (proposalId: number) => {
    if (!selectedAccount) {
      alert('Please connect your wallet');
      return;
    }
    // TODO: Submit approval extrinsic
    alert(`Approved spend proposal #${proposalId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Treasury Management</h1>
          <p className="text-sm text-gray-400">National funds oversight & spend proposals</p>
        </div>
        <Button
          onClick={() => router.push('/treasury/spend/new')}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl flex items-center gap-2"
        >
          <Plus size={20} weight="bold" />
          New Spend Proposal
        </Button>
      </div>

      {/* Treasury Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Coin}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20"
          title="DALLA Balance"
          value={metrics.dallaBalance}
          change={metrics.dallaChange24h}
          changeLabel="24h change"
        />
        <MetricCard
          icon={Coin}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/20"
          title="bBZD Balance"
          value={metrics.bbzdBalance}
          change={metrics.bbzdChange24h}
          changeLabel="24h change"
        />
        <MetricCard
          icon={FileText}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/20"
          title="Active Proposals"
          value={metrics.activeSpendProposals.toString()}
          subtitle={`${metrics.totalSpendProposals} total`}
        />
        <MetricCard
          icon={ChartLine}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/20"
          title="Monthly Net Flow"
          value={`+${(parseInt(metrics.monthlyInflow.replace(/,/g, '')) - parseInt(metrics.monthlyBurn.replace(/,/g, ''))).toLocaleString()}`}
          subtitle={`${metrics.monthlyInflow} in / ${metrics.monthlyBurn} out`}
        />
      </div>

      {/* Treasury Flow */}
      <GlassCard variant="dark-medium" blur="lg" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <ArrowsLeftRight size={24} className="text-blue-400" weight="duotone" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Treasury Flow (30 Days)</h3>
            <p className="text-xs text-gray-400">Monthly inflows and outflows</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Inflows</span>
              <TrendUp size={20} className="text-emerald-400" weight="duotone" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{metrics.monthlyInflow} DALLA</p>
            <p className="text-xs text-gray-500 mt-1">
              From staking rewards, fees, and other sources
            </p>
          </div>

          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Outflows</span>
              <TrendDown size={20} className="text-red-400" weight="duotone" />
            </div>
            <p className="text-2xl font-bold text-red-400">{metrics.monthlyBurn} DALLA</p>
            <p className="text-xs text-gray-500 mt-1">
              Spend proposals, burns, and operational costs
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Spend Proposals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Spend Proposals</h2>
          <div className="flex items-center gap-2">
            {(['All', 'Pending', 'Approved', 'Executed'] as const).map((status) => (
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
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <SpendProposalCard
              key={proposal.id}
              proposal={proposal}
              onApprove={handleApprove}
              onViewDetails={() => router.push(`/treasury/proposals/${proposal.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Metric Card Component
 */
interface MetricCardProps {
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  subtitle?: string;
}

function MetricCard({ icon: Icon, iconColor, iconBg, title, value, change, changeLabel, subtitle }: MetricCardProps) {
  return (
    <GlassCard variant="dark-medium" blur="lg" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 ${iconBg} rounded-xl`}>
          <Icon size={24} className={iconColor} weight="duotone" />
        </div>
        <h4 className="text-sm font-medium text-gray-400">{title}</h4>
      </div>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
          {changeLabel && <span className="text-xs text-gray-500">{changeLabel}</span>}
        </div>
      )}
      {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
    </GlassCard>
  );
}

/**
 * Spend Proposal Card Component
 */
interface SpendProposalCardProps {
  proposal: SpendProposal;
  onApprove: (id: number) => void;
  onViewDetails: () => void;
}

function SpendProposalCard({ proposal, onApprove, onViewDetails }: SpendProposalCardProps) {
  const approvalPercentage = (proposal.approvals / proposal.requiredApprovals) * 100;
  const isApproved = proposal.approvals >= proposal.requiredApprovals;

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
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <Users size={16} weight="duotone" />
                <span>Beneficiary: {proposal.beneficiaryName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText size={16} weight="duotone" />
                <span>Proposer: {proposal.proposerName}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-400">
              {proposal.amountDALLA ? `${proposal.amountDALLA} DALLA` : `${proposal.amountbBZD} bBZD`}
            </p>
            <p className="text-xs text-gray-400 mt-1">Requested amount</p>
          </div>
        </div>

        {/* Approval Progress */}
        {proposal.status === 'Pending' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Multi-Sig Approvals</span>
              <span className="text-gray-400">
                {proposal.approvals} / {proposal.requiredApprovals} required
              </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isApproved
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : 'bg-gradient-to-r from-blue-500 to-blue-400'
                }`}
                style={{ width: `${approvalPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={16} weight="duotone" className="text-amber-400" />
            <span>Expires {formatDate(proposal.expiresAt)}</span>
          </div>
          {proposal.status === 'Pending' && !isApproved && (
            <div onClick={(e) => e.stopPropagation()}>
              <Button
                onClick={() => onApprove(proposal.id)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <CheckCircle size={16} weight="fill" />
                Approve
              </Button>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: string }) {
  const config = {
    Pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
    Approved: { icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
    Executed: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
    Rejected: { icon: Warning, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  }[status] || { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' };

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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
