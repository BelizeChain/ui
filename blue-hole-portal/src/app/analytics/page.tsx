'use client';

import { useEffect, useState } from 'react';
import { ChartLine, Coin, Users, Lightning, Cube, Warning } from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { connectionManager } from '@/lib/blockchain/connection';
import { getTreasuryBalance } from '@/services/pallets/treasury';
// Note: @apollo/client will be used once SubSquid indexer is deployed for historical data
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

async function loadSnapshot(): Promise<ChainSnapshot> {
  const api = await connectionManager.connect();

  const [validatorsRaw, issuanceRaw, headRaw, finalizedHashRaw, treasury] =
    await Promise.all([
      (
        api.query as unknown as { session: { validators: () => Promise<unknown> } }
      ).session.validators(),
      (
        api.query as unknown as {
          balances: { totalIssuance: () => Promise<{ toString(): string }> };
        }
      ).balances.totalIssuance(),
      (api.rpc as unknown as { chain: { getHeader: () => Promise<{ number: { toNumber(): number } }> } })
        .chain.getHeader(),
      (api.rpc as unknown as { chain: { getFinalizedHead: () => Promise<{ toString(): string }> } })
        .chain.getFinalizedHead(),
      getTreasuryBalance(),
    ]);

  const validators = validatorsRaw as { length: number } | { toJSON: () => unknown[] };
  const activeValidators =
    'length' in validators
      ? validators.length
      : Array.isArray(validators.toJSON())
      ? (validators.toJSON() as unknown[]).length
      : 0;

  const latestBlock = headRaw.number.toNumber();

  const finalizedHeader = await (
    api.rpc as unknown as {
      chain: { getHeader: (hash: string) => Promise<{ number: { toNumber(): number } }> };
    }
  ).chain.getHeader(finalizedHashRaw.toString());

  return {
    activeValidators,
    treasuryDalla: treasury.freeDalla,
    totalIssuanceDalla: planckToDalla(issuanceRaw.toString()),
    latestBlock,
    finalizedBlock: finalizedHeader.number.toNumber(),
  };
}

export default function AnalyticsPage() {
  const [snapshot, setSnapshot] = useState<ChainSnapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const next = await loadSnapshot();
        if (cancelled) return;
        setSnapshot(next);
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

      {/* Indexer-backed dashboard: Treasury Balance chart */}
      <GlassCard variant="dark-medium" blur="lg" className="p-8">
        <h2 className="text-lg font-semibold text-white mb-2">Treasury Balance (Historical)</h2>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : error ? (
          <p className="text-red-300">Error loading data</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={snapshot.treasuryDalla ? [{ date: 'Current', treasury: Number(snapshot.treasuryDalla.replace(/,/g, '')) || 0 }] : []}>
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
