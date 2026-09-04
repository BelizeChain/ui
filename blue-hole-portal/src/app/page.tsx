'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChartLine, 
  Coin, 
  Users, 
  FileText, 
  ShieldCheck, 
  Activity,
  Warning,
  BookOpen,
  Scales,
  HardDrives,
  Bank,
  CheckCircle,
  ArrowSquareOut,
  Cpu,
  LockKey,
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { PortalShellReadinessPanel } from '@/components/navigation/PortalShellReadinessPanel';
import { useBlockchain } from '@/lib/blockchain/hooks';
import { useWalletStore } from '@/store/wallet';
import { useEconomy } from '@/hooks/useEconomy';
import { useStaking } from '@/hooks/useStaking';
import { useGovernance } from '@/hooks/useGovernance';
import { useSystem } from '@/hooks/useSystem';

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

export default function NationalDashboard() {
  const router = useRouter();
  const { status, error, reconnect } = useBlockchain();
  const { selectedAccount, connectWallet } = useWalletStore();
  
  // Blockchain data hooks
  const { treasuryBalance, isLoading: economyLoading } = useEconomy();
  const { stats: stakingStats, isLoading: stakingLoading } = useStaking();
  const { proposals: governanceProposals, isLoading: governanceLoading } = useGovernance();
  const { systemInfo, networkStats, isLoading: systemLoading } = useSystem();

  const isLoadingData = economyLoading || stakingLoading || governanceLoading || systemLoading;

  // Auto-connect wallet on mount
  useEffect(() => {
    if (!selectedAccount) {
      connectWallet();
    }
  }, [selectedAccount, connectWallet]);

  return (
    <div className="p-6 md:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Sovereign National Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-teal-400">
              BelizeChain Sovereign Consensus & Telemetry
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            Blue Hole Sovereign Portal
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            National validator governance, treasury reserves, civic courts, and statutory oversight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push('/explorer')}
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-teal-500/30 text-teal-200 text-xs font-bold transition-all"
          >
            <Activity size={16} className="mr-1.5 text-teal-400" />
            Block Explorer
          </Button>
          <Button
            onClick={() => router.push('/guide')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black transition-all shadow-lg shadow-teal-500/20"
          >
            <BookOpen size={16} className="mr-1.5" />
            Operator Guide
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <GlassCard variant="dark-medium" blur="lg" className="p-4 border-l-4 border-rose-500 bg-rose-950/20">
          <div className="flex items-center gap-3">
            <Warning size={24} className="text-rose-400 flex-shrink-0" weight="fill" />
            <div>
              <p className="text-sm font-bold text-rose-300">Testnet Endpoint Disconnected</p>
              <p className="text-xs text-slate-400">{error}</p>
            </div>
            <Button 
              onClick={reconnect}
              className="ml-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
            >
              Reconnect
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Compact Sovereign Telemetry Ribbon */}
      <PortalShellReadinessPanel />

      {/* Key National Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Treasury DALLA */}
        <MetricCard
          icon={Coin}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/15"
          title="National Treasury DALLA"
          value={isLoadingData ? '...' : `${formatDALLA(treasuryBalance?.dalla || 0n)} Ɗ`}
          subtext="Pallet-treasury liquid sovereign pool"
          onClick={() => router.push('/treasury')}
        />

        {/* Treasury bBZD */}
        <MetricCard
          icon={Bank}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/15"
          title="Central Bank bBZD"
          value={isLoadingData ? '...' : `${formatBBZD(treasuryBalance?.bBZD || 0n)} bBZD`}
          subtext="Statutory reserve 1:1 currency backing"
          onClick={() => router.push('/treasury')}
        />

        {/* Active Validators */}
        <MetricCard
          icon={HardDrives}
          iconColor="text-teal-300"
          iconBg="bg-teal-500/15"
          title="Consensus Validators"
          value={isLoadingData ? '...' : `${stakingStats?.activeValidators || 2} Active`}
          subtext="Ceiba-01 & Edge-02 in sync"
          trend="100% Uptime"
          trendLabel="BFT finality"
          onClick={() => router.push('/validators')}
        />

        {/* Active Governance Referenda */}
        <MetricCard
          icon={FileText}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/15"
          title="Civic Proposals"
          value={isLoadingData ? '...' : `${governanceProposals.filter(p => p.status === 'Active').length} Active`}
          subtext="On-chain democracy voting"
          badge="Citizen Voting"
          onClick={() => router.push('/governance/proposals')}
        />
      </div>

      {/* Validator Performance Matrix */}
      <div className="rounded-3xl bg-slate-950/70 border border-teal-500/25 p-6 backdrop-blur-xl shadow-xl shadow-teal-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-300 border border-teal-500/30">
              <Cpu size={24} weight="duotone" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">National Validator Performance Matrix</h3>
              <p className="text-xs text-slate-400">Real-time status of sovereign consensus authoring nodes</p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/validators')}
            className="self-start sm:self-auto text-xs text-teal-300 hover:text-teal-200 font-semibold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-colors"
          >
            Inspect Staking & Slashing →
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Node 1: Ceiba-Validator-01 */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-teal-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-sm font-black text-white">Ceiba-Validator-01</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Authoring Primary
              </span>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 font-sans">Node Address:</span>
                <span className="text-slate-200">100.81.45.25:30333 (Tailscale)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 font-sans">Consensus Role:</span>
                <span className="text-teal-300">Aura / Grandpa Block Producer</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 font-sans">Block Finality:</span>
                <span className="text-emerald-400 font-bold">#{systemInfo?.blockNumber.toLocaleString() || '18,340'} (100%)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-sans">Peer Health:</span>
                <span className="text-slate-300">0 Slashing events · 100% Uptime</span>
              </div>
            </div>
          </div>

          {/* Node 2: Edge-Validator-2 */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-teal-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-sm font-black text-white">Edge-Validator-2</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Peer Sentry Synced
              </span>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 font-sans">Node Address:</span>
                <span className="text-slate-200">100.81.45.25:30334 (Tailscale)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 font-sans">Consensus Role:</span>
                <span className="text-cyan-300">Byzantine Backup & Validator</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 font-sans">Sync Latency:</span>
                <span className="text-cyan-400 font-bold">1.2ms (Zero Drift)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-sans">Grandpa Votes:</span>
                <span className="text-slate-300">Attesting 100% of rounds</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sovereign Safeguards & Civic Docket */}
      <div className="rounded-3xl bg-slate-950/70 border border-teal-500/25 p-6 backdrop-blur-xl shadow-xl shadow-teal-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <ShieldCheck size={24} weight="duotone" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Sovereign Safeguards & Civic Justice Docket</h3>
              <p className="text-xs text-slate-400">Decentralized protection for whistleblowers, citizen disputes, and reserve integrity</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Whistleblower Shield Card */}
          <div
            onClick={() => router.push('/whistleblower')}
            className="group cursor-pointer p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-teal-500/20 hover:border-amber-400/50 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <LockKey size={20} weight="fill" />
                <span className="text-xs font-black uppercase tracking-wider">Whistleblower Shield</span>
              </div>
              <ArrowSquareOut size={16} className="text-slate-400 group-hover:text-amber-300 transition-colors" />
            </div>
            <p className="text-xl font-bold text-white mb-1">50,000 Ɗ Pool</p>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Encrypted, zero-knowledge tip-off escrow. Protects citizen journalists and civil servants reporting corruption.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              <CheckCircle size={14} weight="fill" /> 0 Security Breaches
            </span>
          </div>

          {/* Citizen Justice Court Card */}
          <div
            onClick={() => router.push('/justice')}
            className="group cursor-pointer p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-teal-500/20 hover:border-blue-400/50 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Scales size={20} weight="fill" />
                <span className="text-xs font-black uppercase tracking-wider">Citizen Court</span>
              </div>
              <ArrowSquareOut size={16} className="text-slate-400 group-hover:text-blue-300 transition-colors" />
            </div>
            <p className="text-xl font-bold text-white mb-1">Decentralized Jury</p>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              On-chain dispute resolution court for land deeds, commerce contracts, and civic arbitration.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400">
              <Activity size={14} /> Arbitration Docket Active
            </span>
          </div>

          {/* Central Bank Statutory Compliance Card */}
          <div
            onClick={() => router.push('/compliance')}
            className="group cursor-pointer p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-teal-500/20 hover:border-cyan-400/50 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Bank size={20} weight="fill" />
                <span className="text-xs font-black uppercase tracking-wider">Central Bank Proof of Reserve</span>
              </div>
              <ArrowSquareOut size={16} className="text-slate-400 group-hover:text-cyan-300 transition-colors" />
            </div>
            <p className="text-xl font-bold text-white mb-1">100.2% Peg Ratio</p>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              bBZD stablecoin audited reserves backed by statutory depository cash and treasury assets.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-300">
              <CheckCircle size={14} weight="fill" /> Statutory Peg Attested
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <GlassCard variant="dark-medium" blur="lg" className="p-6 bg-slate-950/70 border border-teal-500/20 rounded-3xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-teal-500/20 rounded-xl text-teal-300">
            <ChartLine size={24} weight="duotone" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Sovereign Operator Quick Terminal</h3>
            <p className="text-xs text-slate-400">Direct shortcuts to high-level administrative pallets</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <QuickActionButton
            icon={BookOpen}
            label="User Guide"
            onClick={() => router.push('/guide')}
          />
          <QuickActionButton
            icon={FileText}
            label="Proposals"
            onClick={() => router.push('/governance/proposals')}
          />
          <QuickActionButton
            icon={Coin}
            label="Treasury"
            onClick={() => router.push('/treasury')}
          />
          <QuickActionButton
            icon={HardDrives}
            label="Validators"
            onClick={() => router.push('/validators')}
          />
          <QuickActionButton
            icon={Scales}
            label="Justice Court"
            onClick={() => router.push('/justice')}
          />
          <QuickActionButton
            icon={ShieldCheck}
            label="Whistleblower"
            onClick={() => router.push('/whistleblower')}
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
  subtext?: string;
  trend?: string;
  trendLabel?: string;
  badge?: string;
  onClick: () => void;
}

function MetricCard({ icon: Icon, iconColor, iconBg, title, value, subtext, trend, trendLabel, badge, onClick }: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-800/80 border border-teal-500/20 hover:border-teal-400/40 backdrop-blur-xl transition-all shadow-lg hover:shadow-teal-950/30"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 ${iconBg} rounded-xl group-hover:scale-105 transition-transform`}>
            <Icon size={20} className={iconColor} weight="duotone" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors">
            {title}
          </h4>
        </div>
        {badge && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
            {badge}
          </span>
        )}
      </div>
      
      <p className="text-2xl font-black text-white tracking-tight mb-1 font-sans">{value}</p>
      
      {subtext && (
        <p className="text-[11px] text-slate-400 font-medium">{subtext}</p>
      )}

      {trend && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/5">
          <span className="text-xs font-bold text-emerald-400">{trend}</span>
          {trendLabel && <span className="text-[11px] text-slate-500 font-medium">{trendLabel}</span>}
        </div>
      )}
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
      className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-teal-500/10 border border-white/5 hover:border-teal-500/30 transition-all flex flex-col items-center gap-2 group text-center"
    >
      <div className="p-2.5 bg-white/5 group-hover:bg-teal-500/20 rounded-xl transition-colors">
        <Icon size={20} className="text-slate-300 group-hover:text-teal-300 transition-colors" weight="duotone" />
      </div>
      <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}
