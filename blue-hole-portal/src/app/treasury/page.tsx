'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Coin,
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
import { ConfirmDialog } from '@/components/ui';
import { useBlockchain } from '@/lib/blockchain/hooks';
import { useWalletStore } from '@/store/wallet';
import {
  TREASURY_ADDRESS,
  getTreasuryBalance,
  getTreasurySpendProposals,
  voteOnProposal,
  type TreasurySpendProposalView,
} from '@/services/pallets/treasury';

interface TreasuryMetrics {
  dallaBalance: string;
  totalSpendProposals: number;
  activeSpendProposals: number;
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

const EMPTY_METRICS: TreasuryMetrics = {
  dallaBalance: '0',
  totalSpendProposals: 0,
  activeSpendProposals: 0,
};

/** Active on-chain proposal states map to the UI's "Pending" bucket. */
const ACTIVE_STATUSES = new Set(['Voting', 'Active', 'Pending']);

function mapChainStatusToUi(s: string): SpendProposal['status'] {
  if (ACTIVE_STATUSES.has(s)) return 'Pending';
  if (s === 'Executed') return 'Executed';
  if (s === 'Approved' || s === 'Passed') return 'Approved';
  if (s === 'Rejected' || s === 'Failed' || s === 'Cancelled') return 'Rejected';
  return 'Pending';
}

function shortenAddress(addr: string): string {
  if (!addr) return 'Unknown';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function toUiSpendProposal(p: TreasurySpendProposalView): SpendProposal {
  return {
    id: p.id,
    title: p.title || `Proposal #${p.id}`,
    beneficiary: p.beneficiary,
    beneficiaryName: shortenAddress(p.beneficiary),
    amountDALLA: p.amountDalla,
    status: mapChainStatusToUi(p.status),
    proposer: p.proposer,
    proposerName: shortenAddress(p.proposer),
    // On-chain tally is stake-weighted; treat ayes as "approvals" and total
    // cast as the denominator so the progress bar shows aye share.
    approvals: p.voteCount.ayes,
    requiredApprovals: Math.max(1, p.voteCount.ayes + p.voteCount.nays),
    createdAt: p.createdAt ? `block #${p.createdAt}` : 'unknown',
    expiresAt: p.voteEnd ? `block #${p.voteEnd}` : 'unknown',
    // Category is not encoded on-chain for treasury spends today; default to
    // "Economic" so the existing category badge has a valid value.
    category: 'Economic',
  };
}

export default function TreasuryPage() {
  const router = useRouter();
  const { isReady } = useBlockchain();
  const { selectedAccount } = useWalletStore();
  const [metrics, setMetrics] = useState<TreasuryMetrics>(EMPTY_METRICS);
  const [spendProposals, setSpendProposals] = useState<SpendProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [submittingApprovalFor, setSubmittingApprovalFor] = useState<number | null>(null);
  const [pendingApproval, setPendingApproval] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Executed'>('All');
  // `lastGood` keeps the most recent successful fetch around so transient RPC
  // failures don't blank the page mid-render.
  const lastGood = useRef<{ metrics: TreasuryMetrics; proposals: SpendProposal[] } | null>(null);

  const refresh = async () => {
    try {
      const [balance, chainProposals] = await Promise.all([
        getTreasuryBalance(),
        getTreasurySpendProposals(),
      ]);
      const uiProposals = chainProposals.map(toUiSpendProposal);
      const activeCount = uiProposals.filter((p) => p.status === 'Pending').length;
      const nextMetrics: TreasuryMetrics = {
        dallaBalance: balance.freeDalla,
        totalSpendProposals: uiProposals.length,
        activeSpendProposals: activeCount,
      };
      lastGood.current = { metrics: nextMetrics, proposals: uiProposals };
      setMetrics(nextMetrics);
      setSpendProposals(uiProposals);
    } catch (error) {
      console.error('Treasury refresh failed:', error);
      if (lastGood.current) {
        setMetrics(lastGood.current.metrics);
        setSpendProposals(lastGood.current.proposals);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      await refresh();
    };
    void tick();
    const interval = setInterval(tick, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isReady]);

  const filteredProposals = spendProposals.filter(
    (p) => filterStatus === 'All' || p.status === filterStatus,
  );

  /**
   * "Approve" on this UI maps to casting an Aye vote on the underlying
   * governance proposal. The on-chain pallet does not support pre-selected
   * multi-sig approvers; approval is by stake-weighted Aye/Nay tally.
   */
  const handleApprove = async (proposalId: number) => {
    setVoteError(null);
    if (!selectedAccount) {
      setVoteError('Connect a wallet account before voting.');
      return;
    }
    // Defer the on-chain Aye vote until the user confirms.
    setPendingApproval(proposalId);
  };

  const submitApproval = async () => {
    if (!selectedAccount || pendingApproval === null) return;
    const proposalId = pendingApproval;
    setSubmittingApprovalFor(proposalId);
    try {
      await voteOnProposal(selectedAccount.address, proposalId, 'Aye');
      await refresh();
      setPendingApproval(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Vote failed.';
      setVoteError(`Vote failed for proposal #${proposalId}: ${message}`);
      setPendingApproval(null);
    } finally {
      setSubmittingApprovalFor(null);
    }
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

      {voteError && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
          {voteError}
        </div>
      )}

      {/* Treasury Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          icon={Coin}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20"
          title="DALLA Balance"
          value={loading ? '…' : metrics.dallaBalance}
          subtitle={shortenAddress(TREASURY_ADDRESS)}
        />
        <MetricCard
          icon={FileText}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/20"
          title="Active Spend Proposals"
          value={loading ? '…' : metrics.activeSpendProposals.toString()}
          subtitle={`${metrics.totalSpendProposals} on-chain total`}
        />
        <MetricCard
          icon={ChartLine}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/20"
          title="Monthly Flow"
          value="—"
          subtitle="requires event-history indexer"
        />
      </div>

      {/* Treasury source-of-truth */}
      <GlassCard variant="dark-medium" blur="lg" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <ArrowsLeftRight size={24} className="text-blue-400" weight="duotone" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Treasury Account</h3>
            <p className="text-xs text-gray-400">
              Funds held in the on-chain account derived from <code>PalletId(&quot;py/trsry&quot;)</code>.
              Spend proposals execute via the governance pallet.
            </p>
          </div>
        </div>
        <div className="p-3 bg-gray-800/60 border border-gray-700 rounded-lg font-mono text-xs text-gray-300 break-all">
          {TREASURY_ADDRESS}
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
          {loading && filteredProposals.length === 0 && (
            <GlassCard variant="dark-medium" blur="lg" className="p-6 text-sm text-gray-400">
              Loading on-chain proposals…
            </GlassCard>
          )}
          {!loading && filteredProposals.length === 0 && (
            <GlassCard variant="dark-medium" blur="lg" className="p-6 text-sm text-gray-400">
              No treasury spend proposals match this filter.
            </GlassCard>
          )}
          {filteredProposals.map((proposal) => (
            <SpendProposalCard
              key={proposal.id}
              proposal={proposal}
              submitting={submittingApprovalFor === proposal.id}
              onApprove={handleApprove}
              onViewDetails={() => router.push(`/treasury/proposals/${proposal.id}`)}
            />
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={pendingApproval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingApproval(null);
        }}
        title="Approve spend proposal?"
        description={
          pendingApproval !== null
            ? `Approving casts an on-chain Aye vote on treasury proposal #${pendingApproval}. This authorizes release of national funds and is recorded permanently.`
            : undefined
        }
        confirmLabel="Approve & Vote Aye"
        loading={submittingApprovalFor !== null}
        onConfirm={submitApproval}
      />
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
  submitting: boolean;
  onApprove: (id: number) => void;
  onViewDetails: () => void;
}

function SpendProposalCard({ proposal, submitting, onApprove, onViewDetails }: SpendProposalCardProps) {
  const approvalPercentage = Math.min(
    100,
    (proposal.approvals / proposal.requiredApprovals) * 100,
  );
  const isApproved = proposal.status === 'Approved' || proposal.status === 'Executed';

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
              <span className="text-gray-400">Aye votes (stake-weighted)</span>
              <span className="text-gray-400">
                {proposal.approvals} aye / {proposal.requiredApprovals} cast
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
            <span>Voting ends {proposal.expiresAt}</span>
          </div>
          {proposal.status === 'Pending' && !isApproved && (
            <div onClick={(e) => e.stopPropagation()}>
              <Button
                onClick={() => onApprove(proposal.id)}
                disabled={submitting}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={16} weight="fill" />
                {submitting ? 'Voting…' : 'Vote Aye'}
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

