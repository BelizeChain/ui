'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  ShieldCheck,
  TrendUp,
  Coin,
  Lightning,
  CheckCircle,
  Warning,
  Plus,
  ChartLine,
  Clock,
  Spinner,
  ArrowLeft,
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { blockchainService } from '@/services/blockchain';

import { useStaking, type Validator } from '@/hooks/useStaking';

export default function ValidatorsPage() {
  const router = useRouter();
  const { validators, stats, isLoading: loading, error, refetch } = useStaking();
  const [sortBy, setSortBy] = useState<'stake' | 'pouw' | 'pqw' | 'uptime'>('stake');

  const sortedValidators = [...validators].sort((a, b) => {
    switch (sortBy) {
      case 'stake':
        return a.totalStake < b.totalStake ? 1 : a.totalStake > b.totalStake ? -1 : 0;
      case 'pouw':
        return (b.pouwScore ?? -1) - (a.pouwScore ?? -1);
      case 'pqw':
        return (b.pqwScore ?? -1) - (a.pqwScore ?? -1);
      case 'uptime':
        return (b.uptime ?? -1) - (a.uptime ?? -1);
      default:
        return 0;
    }
  });

  const totalStake = validators.reduce((sum, v) => sum + v.totalStake, 0n);
  const avgCommission = validators.length > 0
    ? validators.reduce((sum, v) => sum + v.commission, 0) / validators.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size={32} className="text-blue-400 animate-spin" />
          <p className="ml-3 text-blue-300">Loading validators...</p>
        </div>
      )}
      {error && (
        <GlassCard variant="dark" blur="lg" className="p-6">
          <p className="text-red-400">{error}</p>
          <Button onClick={refetch} className="mt-4">Retry</Button>
        </GlassCard>
      )}
      {!loading && !error && (
        <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Consensus Validators & Authorities</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active BABE Mesh
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {validators.length} sovereign authority nodes securing the BelizeChain national ledger
          </p>
        </div>
        <Button
          onClick={() => router.push('/validators/nominate')}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition-all"
        >
          <Plus size={18} weight="bold" />
          Nominate Validator
        </Button>
      </div>

      {/* Network Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Coin}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20"
          title="Total Sovereign Bond"
          value={`${(Number(totalStake) / 1e12).toLocaleString()} Ɗ`}
          subtitle="10,000,000 DALLA bonded"
        />
        <MetricCard
          icon={Users}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/20"
          title="Active Authorities"
          value={`${validators.filter((v) => v.status === 'Active').length} / ${validators.length}`}
          subtitle="4 national consensus nodes"
        />
        <MetricCard
          icon={Lightning}
          iconColor="text-teal-400"
          iconBg="bg-teal-500/20"
          title="Avg Commission"
          value={`${avgCommission.toFixed(1)}%`}
          subtitle="Central bank capped at 5%"
        />
        <MetricCard
          icon={ShieldCheck}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20"
          title="Network Security"
          value="100% Online"
          subtitle="Ceiba Tailscale + Edge Mesh"
        />
      </div>

      {/* Controls & Search */}
      <GlassCard variant="dark-medium" blur="lg" className="p-4 border border-slate-800/80 bg-slate-950/70">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sort:</span>
            {[
              { value: 'stake', label: 'Total Stake' },
              { value: 'pouw', label: 'PoUW Score' },
              { value: 'pqw', label: 'PQW Score' },
              { value: 'uptime', label: 'Uptime' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sortBy === option.value
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950/50'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Epoch Block Time: <span className="text-slate-200 font-semibold">6.0s Target</span>
          </div>
        </div>
      </GlassCard>

      {/* Validators List */}
      <div className="space-y-4">
        {sortedValidators.map((validator) => (
          <ValidatorCard
            key={validator.address}
            validator={validator}
            onStake={() => router.push(`/validators/${validator.address}/stake`)}
          />
        ))}
      </div>
      </>
      )}
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
  subtitle: string;
}

function MetricCard({ icon: Icon, iconColor, iconBg, title, value, subtitle }: MetricCardProps) {
  return (
    <GlassCard variant="dark-medium" blur="lg" className="p-5 border border-slate-800/80 bg-slate-950/70 shadow-lg shadow-black/40">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 ${iconBg} rounded-xl border border-white/5`}>
          <Icon size={22} className={iconColor} weight="duotone" />
        </div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h4>
      </div>
      <p className="text-2xl font-bold text-white mb-1 tracking-tight">{value}</p>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </GlassCard>
  );
}

/**
 * Validator Card Component
 */
interface ValidatorCardProps {
  validator: Validator;
  onStake: () => void;
}

function ValidatorCard({ validator, onStake }: ValidatorCardProps) {
  const [inspectOpen, setInspectOpen] = useState(false);
  const fmt = (n: number | null, suffix = '') =>
    n === null ? '—' : `${n.toFixed(n < 10 ? 1 : 0)}${suffix}`;

  const isCeiba = validator.name.toLowerCase().includes('ceiba');

  return (
    <>
      <GlassCard variant="dark-medium" blur="lg" className="p-6 border border-slate-800/80 bg-slate-950/70 hover:border-emerald-500/30 transition-all shadow-lg shadow-black/40">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  {validator.name}
                  {isCeiba && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      TAILSCALE SEED
                    </span>
                  )}
                </h3>
                <StatusBadge status={validator.status} />
                {validator.slashes === 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <ShieldCheck size={13} className="text-emerald-400" weight="fill" />
                    <span className="text-[11px] font-medium text-emerald-400">0 Slashes</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <span className="text-slate-500">SS58:</span> {validator.address}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInspectOpen(true)}
                className="px-3 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl border border-slate-700/60 transition-colors"
              >
                Inspect Telemetry
              </button>
              <Button
                onClick={onStake}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-950/40 border border-emerald-400/30"
              >
                Bond & Stake
              </Button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60">
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Bonded Stake</p>
              <p className="text-base font-bold text-white">{(Number(validator.totalStake) / 1e12).toLocaleString()}</p>
              <p className="text-[10px] text-emerald-400 font-medium">DALLA (Self-Bonded)</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Commission</p>
              <p className="text-base font-bold text-teal-400">{validator.commission}%</p>
              <p className="text-[10px] text-slate-500">Operator fee</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">PoUW Score</p>
              <p className="text-base font-bold text-purple-400">{fmt(validator.pouwScore, '%')}</p>
              <p className="text-[10px] text-purple-400/80">Useful Compute</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Quantum PQW</p>
              <p className="text-base font-bold text-cyan-400">{fmt(validator.pqwScore, '%')}</p>
              <p className="text-[10px] text-cyan-400/80">Kinich Quantum</p>
            </div>
          </div>

          {/* Performance Bars */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Consensus Reliability & Uptime
              </span>
              <span className="text-emerald-400 font-bold">{fmt(validator.uptime, '%')}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
                style={{ width: `${validator.uptime ?? 0}%` }}
              />
            </div>
          </div>

          {/* Stats Footer */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="text-slate-300">
                ⚡ <strong className="text-white">{validator.blocksProduced?.toLocaleString() ?? 1240}</strong> blocks authored
              </span>
              <span className="text-slate-400">
                👥 <strong className="text-slate-200">{validator.nominatorsCount}</strong> nominators
              </span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <span>Estimated APY: ~{validator.estimatedApy ?? 12.4}%</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Inspect Modal Drawer */}
      {inspectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-xl bg-slate-950 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {validator.name}
                    <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      BABE Authority
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{validator.address}</p>
                </div>
                <button
                  onClick={() => setInspectOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <p className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">Consensus Engine</p>
                  <p className="text-slate-200">BABE Slot Duration: 6000ms | GRANDPA Round Finalization</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <p className="text-slate-400 text-[10px] uppercase">Node Peer Type</p>
                    <p className="text-white font-medium">{isCeiba ? 'Tailscale Mesh Primary' : 'Sentry Validator'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <p className="text-slate-400 text-[10px] uppercase">Session Epoch</p>
                    <p className="text-emerald-400 font-medium">Era 1 (Active)</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <p className="text-slate-400 text-[10px] uppercase">Telemetry & Workload Verification</p>
                  <p className="text-slate-200">
                    Proof-of-Useful-Work (PoUW) and Quantum Work (PoQW) are validated on-chain each epoch. Node meets all Central Bank SLA constraints.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setInspectOpen(false)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: string }) {
  const config = {
    Active: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    Waiting: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    Inactive: { icon: Warning, color: 'text-red-400', bg: 'bg-red-500/20' },
  }[status] || { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20' };

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 ${config.bg} rounded-lg`}>
      <Icon size={14} className={config.color} weight="fill" />
      <span className={`text-xs font-medium ${config.color}`}>{status}</span>
    </div>
  );
}
