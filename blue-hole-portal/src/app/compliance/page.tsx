'use client';

import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Warning,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FunnelSimple,
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import {
  getComplianceRecords,
  getComplianceStats,
  type ComplianceRecord,
  type ComplianceStats,
  type VerificationLevel,
  type RiskLevel,
} from '@/services/pallets/compliance';

const VERIFICATION_FILTERS: Array<'All' | VerificationLevel> = [
  'All',
  'None',
  'Basic',
  'Standard',
  'Enhanced',
  'Government',
];
const RISK_FILTERS: Array<'All' | RiskLevel> = ['All', 'Low', 'Medium', 'High', 'Prohibited'];

export default function CompliancePage() {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterVerification, setFilterVerification] = useState<'All' | VerificationLevel>('All');
  const [filterRisk, setFilterRisk] = useState<'All' | RiskLevel>('All');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [recs, st] = await Promise.all([
          getComplianceRecords(),
          getComplianceStats(),
        ]);
        if (cancelled) return;
        setRecords(recs);
        setStats(st);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load compliance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load compliance data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const timer = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const filtered = records.filter((r) => {
    if (filterVerification !== 'All' && r.verificationLevel !== filterVerification) return false;
    if (filterRisk !== 'All' && r.riskLevel !== filterRisk) return false;
    return true;
  });

  const verifiedCount = records.filter((r) => r.verificationLevel !== 'None').length;
  const restrictedCount = records.filter((r) => r.restricted).length;
  const highRiskCount = records.filter(
    (r) => r.riskLevel === 'High' || r.riskLevel === 'Prohibited',
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance Registry</h1>
          <p className="text-sm text-gray-400">
            {loading
              ? 'Loading…'
              : `${records.length} on-chain records • ${verifiedCount} verified • ${restrictedCount} restricted`}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl">
          <ShieldCheck size={20} className="text-blue-400" weight="fill" />
          <span className="text-sm font-medium text-blue-400">FSC Oversight Mode</span>
        </div>
      </div>

      {/* On-chain caveat banner. Application intake (document upload, OCR,
          PII collection) is not on-chain; it needs an off-chain backend that
          is not yet wired. The mutation extrinsics
          (verify_account/update_risk_level/restrict_account/...) require
          `TechnicalCouncilSuperMajority`, not a citizen wallet — so this
          dashboard is intentionally read-only. */}
      <GlassCard variant="dark-medium" blur="lg" className="p-4">
        <div className="flex gap-3">
          <Warning size={20} className="text-amber-400 flex-shrink-0 mt-0.5" weight="fill" />
          <div className="text-sm text-amber-100/90">
            <p className="font-semibold mb-1">Read-only chain view</p>
            <p className="text-xs text-amber-200/70">
              On-chain compliance writes go through the Technical Council; the per-applicant
              review queue depends on an off-chain KYC backend that is not yet deployed. Records
              below come from <code className="text-amber-200">pallet_belize_compliance::ComplianceStatusOf</code>.
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
        <MetricCard
          icon={CheckCircle}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20"
          title="Verified Accounts"
          value={stats ? stats.totalVerified.toString() : '—'}
          subtitle="on-chain counter"
        />
        <MetricCard
          icon={XCircle}
          iconColor="text-red-400"
          iconBg="bg-red-500/20"
          title="Restricted"
          value={stats ? stats.totalRestricted.toString() : '—'}
          subtitle="restrict_account calls"
        />
        <MetricCard
          icon={Warning}
          iconColor="text-orange-400"
          iconBg="bg-orange-500/20"
          title="Sanctioned Entries"
          value={stats ? stats.totalSanctioned.toString() : '—'}
          subtitle="sanctions list size"
        />
        <MetricCard
          icon={ShieldCheck}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/20"
          title="High Risk Accounts"
          value={loading ? '—' : highRiskCount.toString()}
          subtitle="High + Prohibited"
        />
      </div>

      <GlassCard variant="dark-medium" blur="lg" className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <FunnelSimple size={20} className="text-gray-400" weight="bold" />
            <span className="text-sm text-gray-400">Verification:</span>
            {VERIFICATION_FILTERS.map((level) => (
              <button
                key={level}
                onClick={() => setFilterVerification(level)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterVerification === level
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 md:ml-auto flex-wrap">
            <span className="text-sm text-gray-400">Risk:</span>
            {RISK_FILTERS.map((risk) => (
              <button
                key={risk}
                onClick={() => setFilterRisk(risk)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterRisk === risk
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="space-y-4">
        {loading && records.length === 0 && (
          <GlassCard variant="dark-medium" blur="lg" className="p-8 text-center">
            <p className="text-sm text-gray-400">Loading compliance records…</p>
          </GlassCard>
        )}
        {!loading && filtered.length === 0 && (
          <GlassCard variant="dark-medium" blur="lg" className="p-8 text-center">
            <p className="text-sm text-gray-400">No matching records.</p>
          </GlassCard>
        )}
        {filtered.map((record) => (
          <RecordCard key={record.address} record={record} />
        ))}
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  value: string;
  subtitle: string;
}

function MetricCard({ icon: Icon, iconColor, iconBg, title, value, subtitle }: MetricCardProps) {
  return (
    <GlassCard variant="dark-medium" blur="lg" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 ${iconBg} rounded-xl`}>
          <Icon size={24} className={iconColor} weight="duotone" />
        </div>
        <h4 className="text-sm font-medium text-gray-400">{title}</h4>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </GlassCard>
  );
}

function RecordCard({ record }: { record: ComplianceRecord }) {
  const riskColor =
    record.riskLevel === 'Prohibited'
      ? { color: 'text-red-400', bg: 'bg-red-500/20' }
      : record.riskLevel === 'High'
      ? { color: 'text-orange-400', bg: 'bg-orange-500/20' }
      : record.riskLevel === 'Medium'
      ? { color: 'text-amber-400', bg: 'bg-amber-500/20' }
      : { color: 'text-emerald-400', bg: 'bg-emerald-500/20' };

  const verifColor =
    record.verificationLevel === 'None'
      ? { color: 'text-gray-400', bg: 'bg-gray-500/20' }
      : { color: 'text-blue-400', bg: 'bg-blue-500/20' };

  return (
    <GlassCard variant="dark-medium" blur="lg" className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <User size={16} className="text-gray-400" weight="duotone" />
            <span className="font-mono text-xs text-gray-300 break-all">{record.address}</span>
            <span className={`px-2 py-0.5 ${verifColor.bg} rounded-md text-xs ${verifColor.color}`}>
              {record.verificationLevel}
            </span>
            <span className={`px-2 py-0.5 ${riskColor.bg} rounded-md text-xs ${riskColor.color}`}>
              {record.riskLevel}
            </span>
            {record.whitelisted && (
              <span className="px-2 py-0.5 bg-emerald-500/20 rounded-md text-xs text-emerald-400">
                Whitelisted
              </span>
            )}
            {record.restricted && (
              <span className="px-2 py-0.5 bg-red-500/20 rounded-md text-xs text-red-400">
                Restricted
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={14} weight="duotone" />
            <span>
              {record.lastVerification > 0
                ? `Last verified ${new Date(record.lastVerification * 1000).toLocaleString()}`
                : 'Never verified'}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
