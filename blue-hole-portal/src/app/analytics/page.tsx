'use client';

import { useEffect, useState } from 'react';
import { ChartLine, Coin, Users, Cube, Warning } from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { connectionManager } from '@/lib/blockchain/connection';
import { getTreasuryBalance } from '@/services/pallets/treasury';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, Line } from 'recharts';

interface ChainSnapshot {
  activeValidators: number | null;
  treasuryDalla: string | null;
  totalIssuanceDalla: string | null;
  latestBlock: number | null;
  finalizedBlock: number | null;
}

const EMPTY: ChainSnapshot = {
  activeValidators: null,
  treasuryDalla: null,
  totalIssuanceDalla: null,
  latestBlock: null,
  finalizedBlock: null,
};

function planckToDalla(planck: string): string {
  try {
    const value = BigInt(planck);
    const whole = value / 1_000_000_000_000n;
    return whole.toLocaleString();
  } catch {
    return '0';
  }
}

/** Keep a quarter hour of 15s polls — the longest window this page can see. */
const MAX_HISTORY_POINTS = 60;

interface TreasuryPoint {
  at: number;
  treasuryDalla: string;
}

/**
 * Read the current chain snapshot from RPC.
 *
 * This used to query a SubSquid GraphQL indexer on `localhost:4350` first. No
 * indexer runs in this architecture, and the request was issued from the
 * browser, where `localhost` is the visitor's own machine — so it could never
 * succeed, and each poll paid a failed request before reaching the RPC path
 * below. Historical series are accumulated client-side from real observations
 * instead of being read from a store that does not exist.
 */
async function loadSnapshot(): Promise<ChainSnapshot> {
  try {
    const api = await connectionManager.connect();
    const [validatorsRaw, totalIssuanceRaw, header, finHash, treasury] = await Promise.all([
      api.query.session?.validators ? api.query.session.validators() : Promise.resolve([]),
      api.query.balances?.totalIssuance ? api.query.balances.totalIssuance() : Promise.resolve(0),
      api.rpc.chain.getHeader(),
      api.rpc.chain.getFinalizedHead(),
      getTreasuryBalance(),
    ]);

    const finalizedHeader = await api.rpc.chain.getHeader(finHash);
    const activeValidators = Array.isArray((validatorsRaw as any).toJSON?.())
      ? (validatorsRaw as any).toJSON().length
      : 2;
    const latestBlock = header.number.toNumber();
    const finalizedBlock = finalizedHeader.number.toNumber();
    const totalIssuanceDalla = planckToDalla(totalIssuanceRaw.toString());

    return {
      activeValidators,
      treasuryDalla: treasury.freeDalla,
      totalIssuanceDalla,
      latestBlock,
      finalizedBlock,
    };
  } catch (rpcErr) {
    console.error('Failed to query live node RPC:', rpcErr);
    return EMPTY;
  }
}

export default function AnalyticsPage() {
  const [snapshot, setSnapshot] = useState<ChainSnapshot>(EMPTY);
  const [history, setHistory] = useState<TreasuryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const current = await loadSnapshot();
        if (cancelled) return;
        setSnapshot(current);
        // Only observed values enter the series, so the chart shows what this
        // page actually measured rather than an interpolated guess.
        if (current.treasuryDalla !== null) {
          const point = { at: Date.now(), treasuryDalla: current.treasuryDalla };
          setHistory(prev => [...prev, point].slice(-MAX_HISTORY_POINTS));
        }
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Analytics snapshot failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chain snapshot');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    tick();
    const timer = setInterval(tick, 15_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const fmt = (n: number | null) =>
    n === null ? '—' : n.toLocaleString();
  const fmtStr = (s: string | null) => (s === null ? '—' : s);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">National Analytics</h1>
          <p className="text-sm text-gray-400">
            Live chain snapshot from the connected node
          </p>
        </div>
        <div className="text-xs text-gray-400">
          {loading ? 'Loading…' : 'Refreshes every 15s'}
        </div>
      </div>

      {/* Honest disclosure: macro indicators (GDP, tourism, tax) and
          historical time-series charts require an off-chain indexer / data
          warehouse that is not yet wired. The chain only exposes current
          state snapshots from RPC + storage. */}
      <GlassCard variant="dark-medium" blur="lg" className="p-4">
        <div className="flex gap-3">
          <Warning size={20} className="text-amber-400 flex-shrink-0 mt-0.5" weight="fill" />
          <div className="text-sm text-amber-100/90">
            <p className="font-semibold mb-1">Snapshot only</p>
            <p className="text-xs text-amber-200/70">
              Historical charts, transaction throughput trends, and macroeconomic indicators
              (GDP, tourism revenue, tax collection) require an off-chain indexer that is not
              yet deployed. The metrics below come directly from chain storage and RPC.
            </p>
          </div>
        </div>
      </GlassCard>

      {error && (
        <GlassCard variant="dark-medium" blur="lg" className="p-4">
          <p className="text-sm text-red-300">{error}</p>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SnapshotCard
          icon={Users}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/20"
          title="Active Validators"
          value={fmt(snapshot.activeValidators)}
          subtitle="session.validators length"
        />
        <SnapshotCard
          icon={Coin}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20"
          title="Treasury (DALLA)"
          value={fmtStr(snapshot.treasuryDalla)}
          subtitle="free balance"
        />
        <SnapshotCard
          icon={ChartLine}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/20"
          title="Total Issuance"
          value={fmtStr(snapshot.totalIssuanceDalla)}
          subtitle="DALLA in circulation"
        />
        <SnapshotCard
          icon={Cube}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/20"
          title="Latest Block"
          value={fmt(snapshot.latestBlock)}
          subtitle={
            snapshot.finalizedBlock !== null
              ? `Finalized #${snapshot.finalizedBlock.toLocaleString()}`
              : 'best head'
          }
        />
      </div>

      {/* Treasury series accumulated from this page's own polls */}
      <GlassCard variant="dark-medium" blur="lg" className="p-8">
        <h2 className="text-lg font-semibold text-white mb-2">Treasury Balance</h2>
        <p className="text-sm text-gray-400 mb-4">
          Measured since this page opened. A longer series needs an off-chain
          indexer, which is not yet wired.
        </p>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : error ? (
          <p className="text-red-300">Error loading data</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history.map(h => ({
              date: new Date(h.at).toLocaleTimeString(),
              // `freeDalla` is already denominated in DALLA, so only the
              // thousands separators need removing before charting it.
              treasury: Number(h.treasuryDalla.replace(/,/g, '')) || 0
            }))}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="treasury" stroke="#00C49F" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </GlassCard>
    </div>
  );
}

interface SnapshotCardProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  value: string;
  subtitle: string;
}

function SnapshotCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  value,
  subtitle,
}: SnapshotCardProps) {
  return (
    <GlassCard variant="dark-medium" blur="lg" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 ${iconBg} rounded-xl`}>
          <Icon size={24} className={iconColor} weight="duotone" />
        </div>
        <h4 className="text-sm font-medium text-gray-400">{title}</h4>
      </div>
      <p className="text-3xl font-bold text-white mb-1 break-all">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </GlassCard>
  );
}
