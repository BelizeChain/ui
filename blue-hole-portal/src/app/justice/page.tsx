'use client';

import React, { useEffect, useState } from 'react';
import {
  Scales,
  ShieldCheck,
  WarningCircle,
  Hourglass,
  CheckCircle,
  XCircle,
  ArrowClockwise,
  MagnifyingGlass,
  FileText,
  Bank,
  Sliders,
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/store/wallet';
import {
  getAllDisputes,
  getMediatorList,
  issueMediatorRuling,
  completeRehabilitation,
  type PortalDispute,
} from '@/services/pallets/justice';

export default function JusticePortalPage() {
  const { selectedAccount } = useWalletStore();
  const account = selectedAccount?.address;
  const isConnected = !!selectedAccount;
  const [disputes, setDisputes] = useState<PortalDispute[]>([]);
  const [mediators, setMediators] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Ruling Modal State
  const [selectedDispute, setSelectedDispute] = useState<PortalDispute | null>(null);
  const [resolutionCode, setResolutionCode] = useState<0 | 1 | 2>(1); // 0=Dismissed, 1=Upheld, 2=Mediated
  const [slashBps, setSlashBps] = useState<number>(5000); // 50%
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [disputeList, modList] = await Promise.all([
        getAllDisputes(),
        getMediatorList(),
      ]);
      setDisputes(disputeList);
      setMediators(modList);
    } catch (err) {
      console.error('Failed to load justice data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20_000);
    return () => clearInterval(interval);
  }, []);

  const isUserMediator = account ? mediators.includes(account) : false;

  const filteredDisputes = disputes.filter((d) => {
    const matchesSearch =
      d.id.toString().includes(searchQuery) ||
      d.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.disputant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.evidenceHash.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && d.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const pendingCount = disputes.filter((d) => ['Pending', 'UnderReview'].includes(d.status)).length;
  const ruledCount = disputes.filter((d) => d.status === 'Ruled').length;
  const appealedCount = disputes.filter((d) => d.status === 'Appealed').length;

  async function handleRulingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDispute || !account) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await issueMediatorRuling(
        account,
        selectedDispute.id,
        resolutionCode,
        resolutionCode === 2 ? slashBps : 0
      );
      setActionSuccess(`Arbitral ruling recorded on-chain! Tx: ${res.hash.slice(0, 10)}...`);
      setSelectedDispute(null);
      await loadData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to submit arbitral ruling');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRehabilitate(target: string) {
    if (!account) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await completeRehabilitation(account, target);
      setActionSuccess(`Rehabilitation completed! Target reinstated. Tx: ${res.hash.slice(0, 10)}...`);
      await loadData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to complete rehabilitation');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-xl border border-amber-500/30">
              <Scales size={32} className="text-amber-400" weight="fill" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                Justice Court & Restorative Docket
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Pallet 35
                </span>
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Sovereign restorative justice layer, cooling-off dispute resolution, and arbitral rulings.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-5 border-white/10 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Docket</span>
            <Scales size={20} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{disputes.length}</div>
          <div className="text-xs text-gray-400 mt-1">Registered civic cases</div>
        </GlassCard>

        <GlassCard className="p-5 border-white/10 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Under Review</span>
            <Hourglass size={20} className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 mt-2">{pendingCount}</div>
          <div className="text-xs text-gray-400 mt-1">Awaiting mediator ruling</div>
        </GlassCard>

        <GlassCard className="p-5 border-white/10 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Appealed Cases</span>
            <WarningCircle size={20} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-300 mt-2">{appealedCount}</div>
          <div className="text-xs text-gray-400 mt-1">Counter-evidence lodged</div>
        </GlassCard>

        <GlassCard className="p-5 border-white/10 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Approved Mediators</span>
            <ShieldCheck size={20} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-2">{mediators.length}</div>
          <div className="text-xs text-gray-400 mt-1">
            {isUserMediator ? 'You are an active mediator' : 'Governance-appointed'}
          </div>
        </GlassCard>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID, account, hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'pending', 'ruled', 'appealed', 'closed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterStatus === st
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Disputes Docket Table */}
      <GlassCard className="overflow-hidden border-white/10 bg-slate-900/30">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText size={20} className="text-amber-400" />
            Active Arbitration Docket
          </h2>
          <span className="text-xs text-gray-400">{filteredDisputes.length} records</span>
        </div>

        {filteredDisputes.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Scales size={48} className="mx-auto text-gray-600 mb-3" />
            <p className="text-base font-medium">No disputes on the docket</p>
            <p className="text-xs text-gray-500 mt-1">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Civic restorative justice records will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold uppercase text-gray-400 tracking-wider">
                  <th className="px-6 py-3.5">ID</th>
                  <th className="px-6 py-3.5">Disputant & Target</th>
                  <th className="px-6 py-3.5">Severity</th>
                  <th className="px-6 py-3.5">Bond</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Resolution</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredDisputes.map((dispute) => {
                  const isPending = ['Pending', 'UnderReview'].includes(dispute.status);
                  return (
                    <tr key={dispute.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-amber-400">
                        #{dispute.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">By:</span>
                            <span className="font-mono text-gray-300 truncate max-w-[140px]" title={dispute.disputant}>
                              {dispute.disputant.slice(0, 6)}...{dispute.disputant.slice(-4)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">Target:</span>
                            <span className="font-mono text-amber-300/90 truncate max-w-[140px]" title={dispute.target}>
                              {dispute.target.slice(0, 6)}...{dispute.target.slice(-4)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            dispute.severity === 'Severe'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : dispute.severity === 'Moderate'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {dispute.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-300">
                        {dispute.bondDalla} DALLA
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                            dispute.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : dispute.status === 'Ruled'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : dispute.status === 'Appealed'
                              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                              : 'bg-gray-500/10 text-gray-300 border border-gray-500/20'
                          }`}
                        >
                          {dispute.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {dispute.resolution ? (
                          <div className="font-medium text-gray-300">
                            {dispute.resolution.type === 'Mediated'
                              ? `Mediated (${dispute.resolution.slashBps / 100}% Slash)`
                              : dispute.resolution.type}
                          </div>
                        ) : (
                          <span className="text-gray-500">Unresolved</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedDispute(dispute)}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium text-xs h-8"
                            >
                              <Scales size={14} className="mr-1.5" />
                              Rule
                            </Button>
                          )}
                          {dispute.status === 'Ruled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRehabilitate(dispute.target)}
                              className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs h-8"
                            >
                              Rehabilitate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Ruling Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <GlassCard className="max-w-lg w-full p-6 border-amber-500/30 bg-slate-950 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Scales size={22} className="text-amber-400" />
                <h3 className="text-lg font-bold text-white">Issue Arbitral Ruling #{selectedDispute.id}</h3>
              </div>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-white/5 p-3 rounded-lg text-xs space-y-1 font-mono text-gray-300">
              <div>Target: <span className="text-amber-300">{selectedDispute.target}</span></div>
              <div>Severity: <span className="text-white">{selectedDispute.severity}</span></div>
              <div>Evidence: <span className="text-gray-400 truncate block">{selectedDispute.evidenceHash}</span></div>
            </div>

            <form onSubmit={handleRulingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  Arbitration Verdict
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResolutionCode(0)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      resolutionCode === 0
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <CheckCircle size={20} />
                    Dismissed
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionCode(1)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      resolutionCode === 1
                        ? 'border-rose-500 bg-rose-500/20 text-rose-200'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <XCircle size={20} />
                    Upheld
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionCode(2)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      resolutionCode === 2
                        ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Sliders size={20} />
                    Mediated
                  </button>
                </div>
              </div>

              {resolutionCode === 2 && (
                <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-300">
                    <span>Settlement Slash Percentage:</span>
                    <span className="font-mono font-bold text-sm">{(slashBps / 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={slashBps}
                    onChange={(e) => setSlashBps(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>1% (Reprimand)</span>
                    <span>50% (Equitable)</span>
                    <span>100% (Maximum)</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDispute(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !isConnected}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                >
                  {isSubmitting ? 'Recording Ruling...' : 'Confirm Ruling'}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
