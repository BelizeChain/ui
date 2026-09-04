'use client';

import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  ShieldCheck,
  Coins,
  FileText,
  LockKey,
  CheckCircle,
  XCircle,
  ArrowClockwise,
  MagnifyingGlass,
  PlusCircle,
  WarningOctagon,
  EyeSlash,
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/store/wallet';
import {
  getAllReports,
  getWhistleblowerPoolBalance,
  reviewReport,
  fundWhistleblowerPool,
  type PortalReport,
} from '@/services/pallets/whistleblower';

export default function WhistleblowerPortalPage() {
  const { selectedAccount } = useWalletStore();
  const account = selectedAccount?.address;
  const isConnected = !!selectedAccount;
  const [reports, setReports] = useState<PortalReport[]>([]);
  const [poolBalance, setPoolBalance] = useState<string>('0.00');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Review Modal State
  const [selectedReport, setSelectedReport] = useState<PortalReport | null>(null);
  const [verdict, setVerdict] = useState<0 | 1>(0); // 0=Verified, 1=Dismissed
  const [reasoningText, setReasoningText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fund Pool Modal State
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState('10000');

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [reportList, pool] = await Promise.all([
        getAllReports(),
        getWhistleblowerPoolBalance(),
      ]);
      setReports(reportList);
      setPoolBalance(pool);
    } catch (err) {
      console.error('Failed to load whistleblower data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20_000);
    return () => clearInterval(interval);
  }, []);

  const filteredReports = reports.filter((r) => {
    const matches =
      r.id.toString().includes(searchQuery) ||
      r.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.commitment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'all') return matches;
    return matches && r.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const verifiedCount = reports.filter((r) => ['Verified', 'Claimed'].includes(r.status)).length;
  const pendingCount = reports.filter((r) => ['Pending', 'UnderReview'].includes(r.status)).length;

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReport || !account) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      // Deterministic 32-byte hash of reasoning note
      const reasoningHash =
        '0x' +
        Array.from(new TextEncoder().encode(reasoningText || 'Council Review Verified'))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .padEnd(64, '0')
          .slice(0, 64);

      const res = await reviewReport(account, selectedReport.id, verdict, reasoningHash);
      setActionSuccess(`Verdict on Report #${selectedReport.id} confirmed on-chain! Tx: ${res.hash.slice(0, 10)}...`);
      setSelectedReport(null);
      await loadData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to review report');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFundPoolSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fundWhistleblowerPool(account, fundAmount);
      setActionSuccess(`Whistleblower reward pool funded with ${fundAmount} DALLA! Tx: ${res.hash.slice(0, 10)}...`);
      setIsFundingModalOpen(false);
      await loadData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to fund pool');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-cyan-500/30">
            <Megaphone size={32} className="text-cyan-400" weight="fill" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Integrity Commission & Protected Disclosures
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                Pallet 36
              </span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Zero-knowledge pseudonymity shield, council investigation docket, and bounty pool escrow.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => setIsFundingModalOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold flex items-center gap-1.5"
          >
            <PlusCircle size={16} weight="bold" />
            Fund Bounty Pool
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-white/10 hover:bg-white/5 text-gray-300 flex items-center gap-2"
          >
            <ArrowClockwise size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" weight="fill" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-3">
          <XCircle size={20} className="text-red-400 flex-shrink-0" weight="fill" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-5 border-white/10 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Whistleblower Pool</span>
            <Coins size={20} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 mt-2">{poolBalance} DALLA</div>
          <div className="text-xs text-gray-400 mt-1">Sovereign bounty treasury</div>
        </GlassCard>

        <GlassCard className="p-5 border-white/10 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Disclosures Filed</span>
            <LockKey size={20} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{reports.length}</div>
          <div className="text-xs text-gray-400 mt-1">Pseudonymous commitments</div>
        </GlassCard>

        <GlassCard className="p-5 border-white/10 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pending Review</span>
            <EyeSlash size={20} className="text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-violet-300 mt-2">{pendingCount}</div>
          <div className="text-xs text-gray-400 mt-1">Awaiting Council verdict</div>
        </GlassCard>

        <GlassCard className="p-5 border-white/10 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Verified & Succeeded</span>
            <ShieldCheck size={20} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-2">{verifiedCount}</div>
          <div className="text-xs text-gray-400 mt-1">Integrity bounties awarded</div>
        </GlassCard>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search report ID, target, commitment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'pending', 'underreview', 'verified', 'dismissed', 'claimed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterStatus === st
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <GlassCard className="overflow-hidden border-white/10 bg-slate-900/30">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText size={20} className="text-cyan-400" />
            Integrity Chamber Disclosures
          </h2>
          <span className="text-xs text-gray-400">{filteredReports.length} cases</span>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Megaphone size={48} className="mx-auto text-gray-600 mb-3" />
            <p className="text-base font-medium">No protected disclosures in this view</p>
            <p className="text-xs text-gray-500 mt-1">Submitted reports with zero-knowledge commitments will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase text-gray-400 tracking-wider">
                  <th className="px-6 py-3.5">Report</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Target Account</th>
                  <th className="px-6 py-3.5">Commitment (ZK)</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Escrowed Bounty</th>
                  <th className="px-6 py-3.5 text-right">Council Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReports.map((report) => {
                  const isPending = ['Pending', 'UnderReview'].includes(report.status);
                  return (
                    <tr key={report.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-cyan-400">
                        #{report.id}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            report.category === 'ChainExploit'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : report.category === 'SystematicAbuse'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {report.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-300">
                        <span title={report.target}>
                          {report.target.slice(0, 6)}...{report.target.slice(-4)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        <span title={report.commitment}>
                          {report.commitment.slice(0, 10)}...{report.commitment.slice(-6)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                            report.status === 'Verified'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : report.status === 'Claimed'
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                              : report.status === 'Dismissed'
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-emerald-400">
                        {report.escrowedRewardDalla ? `${report.escrowedRewardDalla} DALLA` : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPending ? (
                          <Button
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                            className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium text-xs h-8"
                          >
                            <ShieldCheck size={14} className="mr-1" />
                            Review
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-500 font-mono">Concluded</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="max-w-lg w-full p-6 border-cyan-500/30 bg-slate-950 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={22} className="text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Council Investigation #{selectedReport.id}</h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-white/5 p-3 rounded-lg text-xs space-y-1 font-mono text-gray-300">
              <div>Category: <span className="text-cyan-300">{selectedReport.category}</span></div>
              <div>Target: <span className="text-white">{selectedReport.target}</span></div>
              <div>Evidence Hash: <span className="text-gray-400 block truncate">{selectedReport.evidenceHash}</span></div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Council Finding
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVerdict(0)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      verdict === 0
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <CheckCircle size={22} />
                    Verified (Release Bounty)
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerdict(1)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      verdict === 1
                        ? 'border-rose-500 bg-rose-500/20 text-rose-200'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <XCircle size={22} />
                    Dismissed (Slash Bond)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Deliberation Memo / Reasoning
                </label>
                <textarea
                  rows={3}
                  value={reasoningText}
                  onChange={(e) => setReasoningText(e.target.value)}
                  placeholder="Summary of findings and evidentiary confirmation..."
                  className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !isConnected}
                  className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold"
                >
                  {isSubmitting ? 'Recording Verdict...' : 'Submit Finding'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Fund Pool Modal */}
      {isFundingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full p-6 border-cyan-500/30 bg-slate-950 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Coins size={22} className="text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Fund Whistleblower Pool</h3>
              </div>
              <button
                onClick={() => setIsFundingModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFundPoolSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Amount in DALLA
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-cyan-500/50"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Allocates treasury DALLA into the autonomous bounty escrow pool.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFundingModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !isConnected}
                  className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold"
                >
                  {isSubmitting ? 'Transferring...' : 'Confirm Funding'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
