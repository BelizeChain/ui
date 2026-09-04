'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  ShieldCheck,
  DownloadSimple,
  UploadSimple,
  Key,
  LockKey,
  CheckCircle,
  XCircle,
  Coins,
  ArrowClockwise,
  EyeSlash,
  Warning,
  Copy,
} from 'phosphor-react';
import { useWallet } from '@/contexts/WalletContext';
import {
  generateWhistleblowerCommitment,
  submitReport,
  claimReward,
  getAllReports,
  getWhistleblowerPoolBalance,
  type FormattedReport,
} from '@/services/pallets/whistleblower';
import type { WhistleblowerTicket } from '@belizechain/shared';

export default function WhistleblowerShieldPage() {
  const { selectedAccount, isConnected } = useWallet();
  const account = selectedAccount?.address;
  const [reports, setReports] = useState<FormattedReport[]>([]);
  const [poolBalance, setPoolBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'submit' | 'claim' | 'docket'>('submit');

  // Submit Form State
  const [targetAddress, setTargetAddress] = useState('');
  const [category, setCategory] = useState<0 | 1 | 2>(0);
  const [evidenceText, setEvidenceText] = useState('');
  const [generatedTicket, setGeneratedTicket] = useState<WhistleblowerTicket | null>(null);

  // Claim Form State
  const [claimReportId, setClaimReportId] = useState('');
  const [claimSecret, setClaimSecret] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [list, pool] = await Promise.all([
        getAllReports(),
        getWhistleblowerPoolBalance(),
      ]);
      setReports(list);
      setPoolBalance(pool);
    } catch (err) {
      console.error('Failed to load whistleblower data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 20_000);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!account) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      // 1. Generate cryptographic commitment & secret
      const { commitment, secret } = generateWhistleblowerCommitment(account);

      // 2. Hash evidence
      const evidenceHash =
        '0x' +
        Array.from(new TextEncoder().encode(evidenceText || 'Whistleblower Disclosure'))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .padEnd(64, '0')
          .slice(0, 64);

      // 3. Submit extrinsic on-chain
      const res = await submitReport(account, commitment, targetAddress, evidenceHash, category);

      const catNames: ('Fraud' | 'SystematicAbuse' | 'ChainExploit')[] = ['Fraud', 'SystematicAbuse', 'ChainExploit'];
      const ticket: WhistleblowerTicket = {
        reportId: res.reportId,
        commitment,
        secret,
        target: targetAddress,
        category: catNames[category],
        evidenceHash,
        timestamp: Date.now(),
        accountAddress: account,
      };

      setGeneratedTicket(ticket);
      setActionSuccess(`Disclosure filed with zero-knowledge commitment! Tx: ${res.hash.slice(0, 10)}...`);
      setTargetAddress('');
      setEvidenceText('');
      await loadData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  }

  function downloadTicketJSON() {
    if (!generatedTicket) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(generatedTicket, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `whistleblower-ticket-${generatedTicket.reportId || 'disclosure'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function copySecretToClipboard() {
    if (!generatedTicket) return;
    navigator.clipboard.writeText(generatedTicket.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.reportId) setClaimReportId(json.reportId.toString());
        if (json.secret) setClaimSecret(json.secret);
      } catch (err) {
        setActionError('Failed to parse uploaded ticket JSON');
      }
    };
    reader.readAsText(file);
  }

  async function handleClaimReward(e: React.FormEvent) {
    e.preventDefault();
    if (!account || !claimReportId || !claimSecret) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await claimReward(account, Number(claimReportId), claimSecret);
      setActionSuccess(`Whistleblower bounty reward claimed successfully! Tx: ${res.hash.slice(0, 10)}...`);
      setClaimReportId('');
      setClaimSecret('');
      await loadData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to claim reward. Verify your secret matches the commitment.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-cyan-950/30 via-slate-900/40 to-transparent border-b border-white/5 px-4 pt-8 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Megaphone size={26} weight="fill" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Whistleblower Shield & Bounties</h1>
                <p className="text-xs text-gray-400">Zero-knowledge commitments, integrity disclosures & escrow claims</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-2">
                <Coins size={16} />
                <span>Pool: {(Number(poolBalance) / 1e12).toLocaleString()} DALLA</span>
              </div>
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'submit'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            File Disclosure
          </button>
          <button
            onClick={() => setActiveTab('claim')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'claim'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Claim Bounty
          </button>
          <button
            onClick={() => setActiveTab('docket')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'docket'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Public Cases ({reports.length})
          </button>
        </div>

        {/* Tab 1: Submit Disclosure */}
        {activeTab === 'submit' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-5">
              <div className="flex items-center gap-2">
                <EyeSlash size={20} className="text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Anonymous Misconduct Disclosure
                </h3>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                    Target Account (Accused)
                  </label>
                  <input
                    type="text"
                    placeholder="5..."
                    value={targetAddress}
                    onChange={(e) => setTargetAddress(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                    Misconduct Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCategory(0)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                        category === 0
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-200'
                          : 'border-white/10 bg-white/5 text-gray-400'
                      }`}
                    >
                      Fraud (Bribery)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategory(1)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                        category === 1
                          ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                          : 'border-white/10 bg-white/5 text-gray-400'
                      }`}
                    >
                      Systematic Abuse
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategory(2)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                        category === 2
                          ? 'border-rose-500 bg-rose-500/20 text-rose-200'
                          : 'border-white/10 bg-white/5 text-gray-400'
                      }`}
                    >
                      Protocol Exploit
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                    Evidence Statement / Payload
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe transaction details, addresses involved, or attach IPFS CID..."
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                    required
                  />
                </div>

                <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-[11px] text-cyan-200/90 leading-relaxed">
                  Your identity is protected by a client-side cryptographic commitment. Never share your private secret key until claiming your reward after verification.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !isConnected}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20"
                >
                  {isSubmitting ? 'Filing Pseudonymous Report...' : 'File Protected Disclosure'}
                </button>
              </form>
            </div>

            {/* Generated Ticket Card */}
            {generatedTicket && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={22} className="text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Encrypted Receipt & Whistleblower Ticket</h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    Case #{generatedTicket.reportId || 'Pending'}
                  </span>
                </div>

                <div className="p-3.5 bg-black/40 border border-white/5 rounded-2xl font-mono text-xs space-y-2 text-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Commitment Hash:</span>
                    <span className="text-cyan-300 truncate max-w-[200px]">{generatedTicket.commitment}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Secret Claim Key:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-300 truncate max-w-[180px]">{generatedTicket.secret}</span>
                      <button
                        onClick={copySecretToClipboard}
                        className="text-gray-400 hover:text-white"
                        title="Copy Secret"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  {copied && <p className="text-[10px] text-emerald-400 text-right">Copied to clipboard!</p>}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadTicketJSON}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    Download Ticket (.json)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Claim Bounty */}
        {activeTab === 'claim' && (
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins size={20} className="text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Claim Verified Bounty
                </h3>
              </div>

              <label className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all">
                <UploadSimple size={14} />
                Load Ticket (.json)
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <form onSubmit={handleClaimReward} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Report ID
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={claimReportId}
                  onChange={(e) => setClaimReportId(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                  Secret Key (32-byte hex from your ticket)
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={claimSecret}
                  onChange={(e) => setClaimSecret(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>

              <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl text-[11px] text-purple-200/90 leading-relaxed">
                When you reveal your secret to claim, the chain verifies that your address and secret match the stored commitment and automatically disburses the escrowed DALLA reward into your wallet.
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isConnected}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20"
              >
                {isSubmitting ? 'Verifying & Claiming...' : 'Claim Bounty Reward'}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Public Docket */}
        {activeTab === 'docket' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                <ShieldCheck size={40} className="mx-auto text-gray-600 mb-2" />
                <p className="text-sm font-medium text-gray-300">No disclosures filed yet</p>
                <p className="text-xs text-gray-500 mt-1">Submitted reports with zero-knowledge commitments will appear here.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/30 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400 text-sm">#{report.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {report.category}
                      </span>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-gray-300 bg-white/[0.02] p-2.5 rounded-xl">
                    <div className="truncate">
                      <span className="text-gray-500 font-sans">Target: </span>
                      <span title={report.target}>{report.target}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-gray-500 font-sans">Commitment: </span>
                      <span title={report.commitment} className="text-cyan-300/80">{report.commitment}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
