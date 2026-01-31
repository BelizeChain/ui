'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChartLine, 
  Coin, 
  Users, 
  FileText, 
  ShieldCheck, 
  Activity,
  TrendUp,
  Warning,
  CheckCircle,
  Spinner,
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useBlockchain } from '@/lib/blockchain/hooks';
import { useWalletStore } from '@/store/wallet';
import { useEconomy } from '@/hooks/useEconomy';
import { useStaking } from '@/hooks/useStaking';
import { useGovernance } from '@/hooks/useGovernance';
import { useCompliance } from '@/hooks/useCompliance';
import { useSystem } from '@/hooks/useSystem';

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatDALLA(amount: bigint): string {
  const value = Number(amount) / 1e12; // 12 decimals
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

function formatBBZD(amount: bigint): string {
  const value = Number(amount) / 1e12; // 12 decimals
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

/**
 * National Dashboard - Home Page for Blue Hole Portal
 * 
 * Shows government/validator overview:
 * - Key metrics (treasury, validators, proposals, network health)
 * - Recent activity feed
 * - Active proposals widget
 * - Network status
 * - Quick actions
 */
export default function NationalDashboard() {
  const router = useRouter();
  const { isReady, status, error, reconnect } = useBlockchain();
  const { selectedAccount, connectWallet } = useWalletStore();
  
  // Blockchain data hooks
  const { treasuryBalance, proposals: treasuryProposals, isLoading: economyLoading } = useEconomy();
  const { validators, stats: stakingStats, isLoading: stakingLoading } = useStaking();
  const { proposals: governanceProposals, isLoading: governanceLoading } = useGovernance();
  const { applications, stats: complianceStats, isLoading: complianceLoading } = useCompliance();
  const { systemInfo, networkStats, isLoading: systemLoading } = useSystem();

  // Loading state
  const isLoadingData = economyLoading || stakingLoading || governanceLoading || complianceLoading || systemLoading;

  // Auto-connect wallet on mount
  useEffect(() => {
    if (!selectedAccount) {
      connectWallet();
    }
  }, [selectedAccount, connectWallet]);

  return (
    <div className="p-6 space-y-6">
      {/* Error Banner */}
      {error && (
        <GlassCard variant="dark-medium" blur="lg" className="p-4 border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <Warning size={24} className="text-red-400" weight="fill" />
            <div>
              <p className="text-sm font-medium text-red-400">Connection Error</p>
              <p className="text-xs text-gray-400">{error}</p>
            </div>
            <Button 
              onClick={reconnect}
              className="ml-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
            >
              Retry
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Treasury DALLA */}
          <MetricCard
            icon={Coin}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/20"
            title="Treasury DALLA"
            value={isLoadingData ? '...' : formatDALLA(treasuryBalance?.dalla || 0n)}
            trend="+2.4%"
            trendLabel="vs last month"
            onClick={() => router.push('/treasury')}
          />

          {/* Treasury bBZD */}
          <MetricCard
            icon={Coin}
            iconColor="text-blue-400"
            iconBg="bg-blue-500/20"
            title="Treasury bBZD"
            value={isLoadingData ? '...' : formatBBZD(treasuryBalance?.bBZD || 0n)}
            trend="+1.8%"
            trendLabel="vs last month"
            onClick={() => router.push('/treasury')}
          />

          {/* Active Validators */}
          <MetricCard
            icon={Users}
            iconColor="text-purple-400"
            iconBg="bg-purple-500/20"
            title="Active Validators"
            value={isLoadingData ? '...' : `${stakingStats?.activeValidators || 0}/${(stakingStats?.activeValidators || 0) + (stakingStats?.waitingValidators || 0)}`}
            trend={stakingStats ? `${((stakingStats.activeValidators / (stakingStats.activeValidators + stakingStats.waitingValidators)) * 100).toFixed(1)}%` : '0%'}
            trendLabel="utilization"
            onClick={() => router.push('/validators')}
          />

          {/* Active Proposals */}
          <MetricCard
            icon={FileText}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/20"
            title="Active Proposals"
            value={isLoadingData ? '...' : governanceProposals.filter(p => p.status === 'Active').length.toString()}
            badge={`${governanceProposals.filter(p => p.status === 'Active').length} pending votes`}
            onClick={() => router.push('/governance/proposals')}
          />
      </div>

      {/* Network Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Health */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <ShieldCheck size={24} className="text-emerald-400" weight="duotone" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Network Health</h3>
                <p className="text-xs text-gray-400">Real-time system status</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-400">
                {isLoadingData ? '...' : systemInfo?.health === 'Healthy' ? '99%' : systemInfo?.health === 'Syncing' ? '75%' : '50%'}
              </p>
              <p className="text-xs text-gray-400">Overall health</p>
            </div>
          </div>

          {/* Health Metrics */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Network Status</span>
                <span className="text-sm font-medium text-white">{systemInfo?.health || 'Unknown'}</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: systemInfo?.health === 'Healthy' ? '99%' : '75%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Peers Connected</span>
                <span className="text-sm font-medium text-white">{systemInfo?.peersCount || 0}</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: `${Math.min(100, (systemInfo?.peersCount || 0) * 10)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Block Height</span>
                <span className="text-sm font-medium text-white">#{systemInfo?.blockNumber.toLocaleString() || '0'}</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400" style={{ width: '97.3%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Current Block</p>
                <p className="text-lg font-bold text-white">#{systemInfo?.blockNumber.toLocaleString() || '0'}</p>
              </div>
              <Button 
                onClick={() => router.push('/analytics')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl"
              >
                View Analytics
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Recent Activity */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Activity size={24} className="text-purple-400" weight="duotone" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                <p className="text-xs text-gray-400">Last 24 hours</p>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="space-y-4">
            <ActivityItem
              icon={FileText}
              iconColor="text-blue-400"
              iconBg="bg-blue-500/20"
              title="New Proposal: Treasury Allocation Q1 2026"
              subtitle="Finance Department • 2 hours ago"
              action="View"
              onClick={() => router.push('/governance/proposals/1')}
            />
            
            <ActivityItem
              icon={Users}
              iconColor="text-emerald-400"
              iconBg="bg-emerald-500/20"
              title="Validator Joined: BelizeCityNode"
              subtitle="Staking • 4 hours ago"
              action="View"
              onClick={() => router.push('/validators')}
            />
            
            <ActivityItem
              icon={CheckCircle}
              iconColor="text-purple-400"
              iconBg="bg-purple-500/20"
              title="Proposal Executed: Education Budget 2026"
              subtitle="Education Department • 6 hours ago"
              action="View"
              onClick={() => router.push('/governance/proposals/2')}
            />
            
            <ActivityItem
              icon={Warning}
              iconColor="text-amber-400"
              iconBg="bg-amber-500/20"
              title="KYC Review Required: 12 Pending Applications"
              subtitle="FSC Compliance • 8 hours ago"
              action="Review"
              onClick={() => router.push('/compliance')}
            />
            
            <ActivityItem
              icon={TrendUp}
              iconColor="text-teal-400"
              iconBg="bg-teal-500/20"
              title="Tourism Revenue +15% This Quarter"
              subtitle="Tourism Department • 12 hours ago"
              action="View"
              onClick={() => router.push('/analytics')}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <Button 
              onClick={() => router.push('/activity')}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl"
            >
              View All Activity
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <GlassCard variant="dark-medium" blur="lg" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <ChartLine size={24} className="text-blue-400" weight="duotone" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Quick Actions</h3>
            <p className="text-xs text-gray-400">Common government tasks</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            icon={FileText}
            label="Create Proposal"
            onClick={() => router.push('/governance/proposals/new')}
          />
          <QuickActionButton
            icon={Coin}
            label="Treasury Spend"
            onClick={() => router.push('/treasury/spend')}
          />
          <QuickActionButton
            icon={Users}
            label="Manage Validators"
            onClick={() => router.push('/validators')}
          />
          <QuickActionButton
            icon={ShieldCheck}
            label="KYC Review"
            onClick={() => router.push('/compliance')}
          />
        </div>
      </GlassCard>
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
  trend?: string;
  trendLabel?: string;
  badge?: string;
  onClick: () => void;
}

function MetricCard({ icon: Icon, iconColor, iconBg, title, value, trend, trendLabel, badge, onClick }: MetricCardProps) {
  return (
    <GlassCard variant="dark-medium" blur="lg" className="p-6 hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 ${iconBg} rounded-xl`}>
          <Icon size={24} className={iconColor} weight="duotone" />
        </div>
        <h4 className="text-sm font-medium text-gray-400">{title}</h4>
      </div>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      {trend && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-emerald-400">{trend}</span>
          {trendLabel && <span className="text-xs text-gray-500">{trendLabel}</span>}
        </div>
      )}
      {badge && (
        <div className="mt-2 inline-flex px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg">
          <span className="text-xs font-medium text-amber-400">{badge}</span>
        </div>
      )}
    </GlassCard>
  );
}

/**
 * Activity Item Component
 */
interface ActivityItemProps {
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  action: string;
  onClick: () => void;
}

function ActivityItem({ icon: Icon, iconColor, iconBg, title, subtitle, action, onClick }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-700/30 rounded-xl transition-colors cursor-pointer" onClick={onClick}>
      <div className={`p-2 ${iconBg} rounded-lg flex-shrink-0`}>
        <Icon size={20} className={iconColor} weight="duotone" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      <Button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg flex-shrink-0">
        {action}
      </Button>
    </div>
  );
}

/**
 * Quick Action Button Component
 */
interface QuickActionButtonProps {
  icon: any;
  label: string;
  onClick: () => void;
}

function QuickActionButton({ icon: Icon, label, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-4 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-xl transition-all flex flex-col items-center gap-2 group"
    >
      <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
        <Icon size={24} className="text-blue-400" weight="duotone" />
      </div>
      <span className="text-sm font-medium text-white">{label}</span>
    </button>
  );
}
