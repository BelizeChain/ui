'use client';

import React, { useState, useEffect } from 'react';
import {
  Scales,
  ShieldCheck,
  WarningCircle,
  PlusCircle,
  Hourglass,
  ArrowClockwise,
  CheckCircle,
  XCircle,
  ArrowSquareOut,
  FileText,
  Heartbeat,
} from 'phosphor-react';
import { useWallet } from '@/contexts/WalletContext';
import {
  getAllDisputes,
  getUserJusticeStatus,
  openDispute,
  appealRuling,
  type FormattedDispute,
  type UserJusticeStatus,
} from '@/services/pallets/justice';

export default function CitizenJusticePage() {
  const { selectedAccount, isConnected } = useWallet();
  const account = selectedAccount?.address;
  const [allDisputes, setAllDisputes] = useState<FormattedDispute[]>([]);
  const [userStatus, setUserStatus] = useState<UserJusticeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');

  // Open Dispute Modal State
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [targetAddress, setTargetAddress] = useState('');
  const [severity, setSeverity] = useState<0 | 1 | 2>(1);
  const [evidenceText, setEvidenceText] = useState('');

  // Appeal Modal State
  const [appealDispute, setAppealDispute] = useState<FormattedDispute | null>(null);
  const [counterEvidenceText, setCounterEvidenceText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const disputes = await getAllDisputes();
      setAllDisputes(disputes);

      if (account) {
        const st = await getUserJusticeStatus(account);
        setUserStatus(st);
      }
    } catch (err) {
      console.error('Failed to load justice data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 20_000);
    return () => clearInterval(timer);
  }, [account]);

  async function handleOpenDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!account) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      // Deterministic 32-byte Blake2b evidence hash
      const evidenceHash =
        '0x' +
        Array.from(new TextEncoder().encode(evidenceText || 'Evidentiary Statement'))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .padEnd(64, '0')
          .slice(0, 64);

      const res = await openDispute(account, targetAddress, evidenceHash, severity);
      setActionSuccess(`Restorative dispute opened successfully! Tx: ${res.hash.slice(0, 10)}...`);
      setIsOpenModalOpen(false);
      setTargetAddress('');
      setEvidenceText('');
      await loadData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to open dispute');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAppealSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account || !appealDispute) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const counterHash =
        '0x' +
        Array.from(new TextEncoder().encode(counterEvidenceText || 'Counter Evidence'))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .padEnd(64, '0')
          .slice(0, 64);

      const res = await appealRuling(account, appealDispute.id, counterHash);
      setActionSuccess(`Appeal lodged for Dispute #${appealDispute.id}! Tx: ${res.hash.slice(0, 10)}...`);
      setAppealDispute(null);
      setCounterEvidenceText('');
      await loadData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to appeal ruling');
    } finally {
      setIsSubmitting(false);
    }
  }

  const myCases = [
    ...(userStatus?.activeDisputesAsTarget || []),
    ...(userStatus?.activeDisputesAsDisputant || []),
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-amber-950/30 via-slate-900/40 to-transparent border-b border-white/5 px-4 pt-8 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scales size={26} weight="fill" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Citizen Justice & Restorative Gateway</h1>
                <p className="text-xs text-gray-400">Ethical dispute resolution, cooling-off safeguards & mediation</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpenModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
              >
                <PlusCircle size={16} weight="bold" />
                Open Dispute
              </button>
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300"
              >
                <ArrowClockwise size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Alerts */}
        {actionSuccess && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" weight="fill" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-300 text-xs flex items-center gap-2">
            <XCircle size={18} className="text-red-400 flex-shrink-0" weight="fill" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Citizen Standing Card */}
        {account && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heartbeat size={18} className="text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Your Civic Standing</h3>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  userStatus?.rehabStatus === 'Clean'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : userStatus?.rehabStatus === 'InCoolingOff'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : userStatus?.rehabStatus === 'InRehabilitation'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                }`}
              >
                {userStatus?.rehabStatus || 'Clean'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-[11px] text-gray-400 block">Cooling-Off Target</span>
                <span className="text-sm font-mono font-semibold text-white mt-0.5 block">
                  {userStatus?.coolingOffEndBlock ? `Block #${userStatus.coolingOffEndBlock}` : 'None active'}
                </span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-[11px] text-gray-400 block">Escrowed Under Review</span>
                <span className="text-sm font-mono font-semibold text-amber-300 mt-0.5 block">
                  {userStatus?.slashPendingPlanck ? `${(Number(userStatus.slashPendingPlanck) / 1e12).toFixed(2)} DALLA` : '0.00 DALLA'}
                </span>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[11px] text-gray-400 block">Involved Cases</span>
                <span className="text-sm font-mono font-semibold text-cyan-300 mt-0.5 block">
                  {myCases.length} active
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'my'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Cases ({myCases.length})
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'public'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Civic Docket ({allDisputes.length})
          </button>
        </div>

        {/* Disputes List */}
        <div className="space-y-3">
          {(activeTab === 'my' ? myCases : allDisputes).length === 0 ? (
            <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <ShieldCheck size={40} className="mx-auto text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-300">No active dispute proceedings</p>
              <p className="text-xs text-gray-500 mt-1">
                {activeTab === 'my' ? 'Your account has no disputes filed or active.' : 'All clear across the network.'}
              </p>
            </div>
          ) : (
            (activeTab === 'my' ? myCases : allDisputes).map((dispute) => {
              const isTarget = account === dispute.target;
              const canAppeal = isTarget && dispute.status === 'Ruled' && !dispute.appealEvidence;

              return (
                <div
                  key={dispute.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-amber-500/30 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-sm">#{dispute.id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                          dispute.severity === 'Severe'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : dispute.severity === 'Moderate'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {dispute.severity}
                      </span>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-gray-300 bg-white/[0.02] p-2.5 rounded-xl">
                    <div className="truncate">
                      <span className="text-gray-500 font-sans">Disputant: </span>
                      <span title={dispute.disputant}>{dispute.disputant}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-gray-500 font-sans">Target: </span>
                      <span title={dispute.target} className="text-amber-300/90">{dispute.target}</span>
                    </div>
                  </div>

                  {dispute.resolution && (
                    <div className="text-xs p-2.5 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                      <span className="text-gray-400">Resolution:</span>
                      <span className="font-semibold text-white">
                        {dispute.resolution.type === 'Mediated'
                          ? `Mediated (${dispute.resolution.slashBps / 100}% Slashed)`
                          : dispute.resolution.type}
                      </span>
                    </div>
                  )}

                  {canAppeal && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setAppealDispute(dispute)}
                        className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
                      >
                        <ArrowSquareOut size={14} />
                        Lodge Legal Appeal
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Open Dispute Modal */}
      {isOpenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Scales size={22} className="text-amber-400" />
                <h3 className="text-base font-bold text-white">Open Restorative Dispute</h3>
              </div>
              <button onClick={() => setIsOpenModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleOpenDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Target Account Address
                </label>
                <input
                  type="text"
                  placeholder="5..."
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Infraction Severity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSeverity(0)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                      severity === 0
                        ? 'border-blue-500 bg-blue-500/20 text-blue-200'
                        : 'border-white/10 bg-white/5 text-gray-400'
                    }`}
                  >
                    Minor
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity(1)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                      severity === 1
                        ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                        : 'border-white/10 bg-white/5 text-gray-400'
                    }`}
                  >
                    Moderate
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity(2)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                      severity === 2
                        ? 'border-rose-500 bg-rose-500/20 text-rose-200'
                        : 'border-white/10 bg-white/5 text-gray-400'
                    }`}
                  >
                    Severe
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Evidence Statement / IPFS CID
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe alleged infraction or provide IPFS hash..."
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200/90 leading-relaxed">
                Opening a dispute reserves the on-chain dispute bond. Frivolous filings will forfeit the bond to the treasury.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsOpenModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isConnected}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs rounded-xl"
                >
                  {isSubmitting ? 'Filing Dispute...' : 'File Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appeal Modal */}
      {appealDispute && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Scales size={22} className="text-purple-400" />
                <h3 className="text-base font-bold text-white">Appeal Ruling #{appealDispute.id}</h3>
              </div>
              <button onClick={() => setAppealDispute(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAppealSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Counter-Evidence & Exculpatory Details
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide detailed defense or link to cryptographic proof..."
                  value={counterEvidenceText}
                  onChange={(e) => setCounterEvidenceText(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAppealDispute(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isConnected}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs rounded-xl"
                >
                  {isSubmitting ? 'Lodging Appeal...' : 'Submit Appeal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
