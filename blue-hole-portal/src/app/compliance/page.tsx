'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Warning,
  CheckCircle,
  XCircle,
  Clock,
  User,
  IdentificationCard,
  MapPin,
  Calendar,
  FunnelSimple,
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useBlockchain } from '@/lib/blockchain/hooks';

type KYCStatus = 'Pending' | 'Approved' | 'Rejected' | 'Flagged';
type KYCLevel = 'Basic' | 'Standard' | 'Enhanced';

interface KYCApplication {
  id: number;
  applicantName: string;
  applicantAddress: string;
  kycLevel: KYCLevel;
  status: KYCStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  district: string;
  accountType: 'Citizen' | 'Business' | 'Tourism';
  ssnVerified: boolean;
  passportVerified: boolean;
  addressVerified: boolean;
  amlFlags: number;
  riskScore: number;
}

const mockApplications: KYCApplication[] = [
  {
    id: 1,
    applicantName: 'John Martinez',
    applicantAddress: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    kycLevel: 'Standard',
    status: 'Pending',
    submittedAt: '2026-01-24T10:00:00Z',
    district: 'Belize',
    accountType: 'Citizen',
    ssnVerified: true,
    passportVerified: false,
    addressVerified: true,
    amlFlags: 0,
    riskScore: 15,
  },
  {
    id: 2,
    applicantName: 'Tropical Tours Ltd',
    applicantAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    kycLevel: 'Enhanced',
    status: 'Flagged',
    submittedAt: '2026-01-23T14:30:00Z',
    district: 'Cayo',
    accountType: 'Tourism',
    ssnVerified: false,
    passportVerified: true,
    addressVerified: false,
    amlFlags: 2,
    riskScore: 68,
  },
  {
    id: 3,
    applicantName: 'Maria Rodriguez',
    applicantAddress: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
    kycLevel: 'Basic',
    status: 'Approved',
    submittedAt: '2026-01-22T09:00:00Z',
    reviewedAt: '2026-01-23T11:00:00Z',
    reviewedBy: 'FSC Officer #42',
    district: 'Corozal',
    accountType: 'Citizen',
    ssnVerified: true,
    passportVerified: true,
    addressVerified: true,
    amlFlags: 0,
    riskScore: 8,
  },
];

export default function CompliancePage() {
  const router = useRouter();
  const { isReady } = useBlockchain();
  const [applications, setApplications] = useState(mockApplications);
  const [filterStatus, setFilterStatus] = useState<'All' | KYCStatus>('All');
  const [filterRisk, setFilterRisk] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');

  const filteredApplications = applications.filter((app) => {
    const statusMatch = filterStatus === 'All' || app.status === filterStatus;
    const riskMatch =
      filterRisk === 'All' ||
      (filterRisk === 'Low' && app.riskScore < 30) ||
      (filterRisk === 'Medium' && app.riskScore >= 30 && app.riskScore < 70) ||
      (filterRisk === 'High' && app.riskScore >= 70);
    return statusMatch && riskMatch;
  });

  const handleApprove = (id: number) => {
    // TODO: Submit approval extrinsic
    alert(`Approved KYC application #${id}`);
  };

  const handleReject = (id: number) => {
    // TODO: Submit rejection extrinsic
    alert(`Rejected KYC application #${id}`);
  };

  const pendingCount = applications.filter((a) => a.status === 'Pending').length;
  const flaggedCount = applications.filter((a) => a.status === 'Flagged').length;
  const approvedCount = applications.filter((a) => a.status === 'Approved').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance & KYC</h1>
          <p className="text-sm text-gray-400">
            {pendingCount} pending • {flaggedCount} flagged • {approvedCount} approved
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl">
          <ShieldCheck size={20} className="text-blue-400" weight="fill" />
          <span className="text-sm font-medium text-blue-400">FSC Oversight Mode</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Clock}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/20"
          title="Pending Review"
          value={pendingCount.toString()}
          subtitle="Awaiting approval"
        />
        <MetricCard
          icon={Warning}
          iconColor="text-red-400"
          iconBg="bg-red-500/20"
          title="Flagged"
          value={flaggedCount.toString()}
          subtitle="AML alerts"
        />
        <MetricCard
          icon={CheckCircle}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20"
          title="Approved"
          value={approvedCount.toString()}
          subtitle="This month"
        />
        <MetricCard
          icon={ShieldCheck}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/20"
          title="Compliance Rate"
          value="94.2%"
          subtitle="Overall"
        />
      </div>

      {/* Filters */}
      <GlassCard variant="dark-medium" blur="lg" className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <FunnelSimple size={20} className="text-gray-400" weight="bold" />
            <span className="text-sm text-gray-400">Status:</span>
            {(['All', 'Pending', 'Flagged', 'Approved', 'Rejected'] as const).map((status) => (
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

          {/* Risk Filter */}
          <div className="flex items-center gap-2 md:ml-auto">
            <span className="text-sm text-gray-400">Risk:</span>
            {(['All', 'Low', 'Medium', 'High'] as const).map((risk) => (
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

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}
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

/**
 * Application Card Component
 */
interface ApplicationCardProps {
  application: KYCApplication;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

function ApplicationCard({ application, onApprove, onReject }: ApplicationCardProps) {
  const getRiskColor = (score: number) => {
    if (score < 30) return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Low Risk' };
    if (score < 70) return { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Medium Risk' };
    return { color: 'text-red-400', bg: 'bg-red-500/20', label: 'High Risk' };
  };

  const riskConfig = getRiskColor(application.riskScore);

  return (
    <GlassCard variant="dark-medium" blur="lg" className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-white">{application.applicantName}</h3>
              <StatusBadge status={application.status} />
              <div className={`px-2 py-1 ${riskConfig.bg} rounded-lg`}>
                <span className={`text-xs font-medium ${riskConfig.color}`}>{riskConfig.label}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 font-mono mb-2">
              {application.applicantAddress.slice(0, 10)}...{application.applicantAddress.slice(-8)}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <User size={14} weight="duotone" />
                <span>{application.accountType}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={14} weight="duotone" />
                <span>{application.district} District</span>
              </div>
              <div className="flex items-center gap-1.5">
                <IdentificationCard size={14} weight="duotone" />
                <span>{application.kycLevel} KYC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="grid grid-cols-3 gap-3">
          <VerificationBadge
            label="SSN"
            verified={application.ssnVerified}
          />
          <VerificationBadge
            label="Passport"
            verified={application.passportVerified}
          />
          <VerificationBadge
            label="Address"
            verified={application.addressVerified}
          />
        </div>

        {/* AML Flags */}
        {application.amlFlags > 0 && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-2">
              <Warning size={20} className="text-red-400" weight="fill" />
              <span className="text-sm font-medium text-red-400">
                {application.amlFlags} AML Flag{application.amlFlags > 1 ? 's' : ''} Detected
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {application.status === 'Pending' || application.status === 'Flagged' ? (
          <div className="flex items-center gap-3 pt-4 border-t border-gray-700/50">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar size={16} weight="duotone" />
              <span>Submitted {formatDate(application.submittedAt)}</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                onClick={() => onReject(application.id)}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <XCircle size={16} weight="fill" />
                Reject
              </Button>
              <Button
                onClick={() => onApprove(application.id)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <CheckCircle size={16} weight="fill" />
                Approve
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 pt-4 border-t border-gray-700/50 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <Calendar size={16} weight="duotone" />
              <span>Reviewed {formatDate(application.reviewedAt!)}</span>
            </div>
            {application.reviewedBy && <span>by {application.reviewedBy}</span>}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

/**
 * Verification Badge Component
 */
function VerificationBadge({ label, verified }: { label: string; verified: boolean }) {
  return (
    <div
      className={`p-2 rounded-lg ${
        verified
          ? 'bg-emerald-500/20 border border-emerald-500/30'
          : 'bg-gray-700 border border-gray-600'
      }`}
    >
      <div className="flex items-center justify-center gap-1.5">
        {verified ? (
          <CheckCircle size={14} className="text-emerald-400" weight="fill" />
        ) : (
          <XCircle size={14} className="text-gray-500" weight="fill" />
        )}
        <span
          className={`text-xs font-medium ${
            verified ? 'text-emerald-400' : 'text-gray-500'
          }`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: string }) {
  const config = {
    Pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    Approved: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    Rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
    Flagged: { icon: Warning, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  }[status] || { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20' };

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 ${config.bg} rounded-lg`}>
      <Icon size={14} className={config.color} weight="fill" />
      <span className={`text-xs font-medium ${config.color}`}>{status}</span>
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
