'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldWarning,
  ShieldCheck,
  WarningOctagon,
  Brain,
  Users,
  CheckCircle,
  XCircle,
  ArrowClockwise,
  MagnifyingGlass,
  Prohibit,
  ArrowSquareOut,
  Funnel,
  Activity,
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/store/wallet';
import {
  getModerationItems,
  getModeratorSet,
  reviewContent,
  submitNawalAssessment,
} from '@/services/pallets/moderation';
import type { ModerationItem, ModerationRuling } from '@belizechain/shared';

export default function ModerationPortalPage() {
  const { selectedAccount } = useWalletStore();
  const account = selectedAccount?.address;
  const isConnected = !!selectedAccount;
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [moderators, setModerators] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'queued' | 'ruled'>('all');

  // Review Modal State
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [rulingIndex, setRulingIndex] = useState<0 | 1 | 2>(0); // 0=Cleared, 1=Removed, 2=Escalated
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Oracle Simulation Modal
  const [isOracleModalOpen, setIsOracleModalOpen] = useState(false);
  const [oracleHash, setOracleHash] = useState('');
  const [oracleScore, setOracleScore] = useState(85);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [itemList, modList] = await Promise.all([
        getModerationItems(),
        getModeratorSet(),
      ]);
      setItems(itemList);
      setModerators(modList);
    } catch (err) {
      console.error('Failed to load moderation data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20_000);
    return () => clearInterval(interval);
  }, []);

  const isUserModerator = account ? moderators.includes(account) : false;

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.contentHash.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterMode === 'queued') return matchesSearch && item.isQueued;
    if (filterMode === 'ruled') return matchesSearch && !!item.ruling;
    return matchesSearch;
  });

  const queuedCount = items.filter((i) => i.isQueued).length;
  const highRiskCount = items.filter((i) => (i.nawalScore ?? 0) >= 50).length;
  const ruledCount = items.filter((i) => !!i.ruling).length;

  async function handleRulingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem || !account) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await reviewContent(account, selectedItem.contentHash, rulingIndex);
      setActionSuccess(`Moderation ruling executed! Tx: ${res.hash.slice(0, 10)}...`);
      setSelectedItem(null);
      await loadData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to submit ruling');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOracleAssessmentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account || !oracleHash) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await submitNawalAssessment(account, oracleHash, oracleScore);
      setActionSuccess(`Nawal AI assessment submitted (Score: ${oracleScore})! Tx: ${res.hash.slice(0, 10)}...`);
      setIsOracleModalOpen(false);
      setOracleHash('');
      await loadData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to submit Nawal assessment');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-rose-500/20 to-purple-600/20 rounded-xl border border-rose-500/30">
            <ShieldWarning size={32} className="text-rose-400" weight="fill" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Content Safety & Nawal AI Filter
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                Pallet 37
              </span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Autonomous AI risk scoring, decentralized community flag thresholding, and moderator verdicts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => setIsOracleModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-1.5"
          >
            <Brain size={16} weight="bold" />
            Nawal AI Score
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-5 border-white/10 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Queue Items</span>
            <WarningOctagon size={20} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-300 mt-2">{queuedCount}</div>
          <div className="text-xs text-gray-400 mt-1">Awaiting human moderation</div>
        </GlassCard>

        <GlassCard className="p-5 border-white/10 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Nawal AI Alerts</span>
            <Brain size={20} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 mt-2">{highRiskCount}</div>
          <div className="text-xs text-gray-400 mt-1">Telemetry score ≥ 50 / 100</div>
        </GlassCard>

        <GlassCard className="p-5 border-white/10 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ruled & Closed</span>
            <ShieldCheck size={20} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-2">{ruledCount}</div>
          <div className="text-xs text-gray-400 mt-1">Binding on-chain rulings</div>
        </GlassCard>

        <GlassCard className="p-5 border-white/10 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Moderator Set</span>
            <Users size={20} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 mt-2">{moderators.length}</div>
          <div className="text-xs text-gray-400 mt-1">
            {isUserModerator ? 'You have moderation rights' : 'Authorized reviewers'}
          </div>
        </GlassCard>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by 32-byte content hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'queued', 'ruled'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterMode === mode
                  ? 'bg-rose-500 text-white font-semibold'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <GlassCard className="overflow-hidden border-white/10 bg-slate-900/30">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity size={20} className="text-rose-400" />
            Safety Registry & Flagged Content
          </h2>
          <span className="text-xs text-gray-400">{filteredItems.length} items</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ShieldCheck size={48} className="mx-auto text-emerald-500/40 mb-3" />
            <p className="text-base font-medium">All clear — no items currently require review</p>
            <p className="text-xs text-gray-500 mt-1">Items that surpass flag thresholds or receive high Nawal risk scores appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase text-gray-400 tracking-wider">
                  <th className="px-6 py-3.5">Content Hash</th>
                  <th className="px-6 py-3.5">Community Flags</th>
                  <th className="px-6 py-3.5">Nawal AI Risk</th>
                  <th className="px-6 py-3.5">Queue Status</th>
                  <th className="px-6 py-3.5">Ruling</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map((item) => (
                  <tr key={item.contentHash} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-300">
                      <span title={item.contentHash}>
                        {item.contentHash.slice(0, 10)}...{item.contentHash.slice(-8)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-amber-300">
                        {item.flagCount} flags
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.nawalScore !== undefined && item.nawalScore !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.nawalScore >= 70
                                  ? 'bg-rose-500'
                                  : item.nawalScore >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${item.nawalScore}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-gray-300">
                            {item.nawalScore}/100
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">Unscored</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.isQueued ? (
                        <span className="text-xs px-2.5 py-1 rounded-md font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          In Queue
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-md font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          Monitoring
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.ruling ? (
                        <span
                          className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                            item.ruling === 'Cleared'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : item.ruling === 'Removed'
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                              : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                          }`}
                        >
                          {item.ruling}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.isQueued && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                          className="bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs h-8"
                        >
                          Moderate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Review Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full p-6 border-rose-500/30 bg-slate-950 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <ShieldWarning size={22} className="text-rose-400" />
                <h3 className="text-lg font-bold text-white">Content Ruling</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-white/5 p-3 rounded-lg text-xs font-mono text-gray-300 break-all">
              Hash: <span className="text-rose-300">{selectedItem.contentHash}</span>
            </div>

            <form onSubmit={handleRulingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Select Ruling Action
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRulingIndex(0)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      rulingIndex === 0
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <CheckCircle size={20} />
                    Cleared
                  </button>

                  <button
                    type="button"
                    onClick={() => setRulingIndex(1)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      rulingIndex === 1
                        ? 'border-rose-500 bg-rose-500/20 text-rose-200'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Prohibit size={20} />
                    Removed
                  </button>

                  <button
                    type="button"
                    onClick={() => setRulingIndex(2)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      rulingIndex === 2
                        ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <ArrowSquareOut size={20} />
                    Escalated
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !isConnected}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                >
                  {isSubmitting ? 'Recording Ruling...' : 'Execute Ruling'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Nawal AI Assessment Modal */}
      {isOracleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full p-6 border-purple-500/30 bg-slate-950 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Brain size={22} className="text-purple-400" />
                <h3 className="text-lg font-bold text-white">Submit Nawal AI Risk Score</h3>
              </div>
              <button
                onClick={() => setIsOracleModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOracleAssessmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Content Hash (32-byte Blake2b hex)
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={oracleHash}
                  onChange={(e) => setOracleHash(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500/50"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-2">
                  <span className="font-semibold uppercase tracking-wider">AI Risk Score (0–100)</span>
                  <span className="font-mono font-bold text-purple-300">{oracleScore} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={oracleScore}
                  onChange={(e) => setOracleScore(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Scores ≥ 50 trigger automatic queuing for human review.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOracleModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !isConnected}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
