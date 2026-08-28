'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  Users,
  ChartLine,
  Plus,
  CheckCircle,
  Warning,
  X,
  ArrowLeft,
  Scales,
  Coins,
  ThumbsUp,
  ThumbsDown,
  Sparkle,
  HourglassMedium,
  ShieldCheck,
  Check,
} from 'phosphor-react';

interface Referendum {
  id: number;
  title: string;
  category: 'National Policy' | 'Treasury Grant' | 'District Infrastructure' | 'Runtime Upgrade';
  proposer: string;
  description: string;
  requestedAmount?: string;
  ayes: number;
  nays: number;
  endBlock: number;
  status: 'Active' | 'Passed' | 'Executed';
  myVote?: 'Aye' | 'Nay';
}

export default function GovernancePage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'referendums' | 'council' | 'delegation' | 'create'>('referendums');
  const [conviction, setConviction] = useState<number>(1);
  const [votingId, setVotingId] = useState<number | null>(null);

  const [referendums, setReferendums] = useState<Referendum[]>([
    {
      id: 14,
      title: 'BIP-14: Caye Caulker Marine Coral Restoration Sensor Network',
      category: 'District Infrastructure',
      proposer: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      description: 'Deploy 40 LoRaWAN water-quality sensor buoys around the Belize Barrier Reef connected to Nawal AI environmental models.',
      requestedAmount: '45,000 bBZD',
      ayes: 1420,
      nays: 45,
      endBlock: 1495000,
      status: 'Active',
    },
    {
      id: 13,
      title: 'BIP-13: ink! v5 Gas RefTime Optimization Runtime Upgrade',
      category: 'Runtime Upgrade',
      proposer: 'Ceiba Foundation Technical Committee',
      description: 'Upgrade Wasm contract execution limits to allow 2.5x larger smart contract state access.',
      ayes: 3890,
      nays: 120,
      endBlock: 1491000,
      status: 'Passed',
    },
  ]);

  const handleVote = (id: number, vote: 'Aye' | 'Nay') => {
    setVotingId(id);
    setTimeout(() => {
      setReferendums((prev) =>
        prev.map((r) => (r.id === id ? { ...r, myVote: vote, ayes: vote === 'Aye' ? r.ayes + 10 * conviction : r.ayes, nays: vote === 'Nay' ? r.nays + 10 * conviction : r.nays } : r))
      );
      setVotingId(null);
      addNotification({
        type: 'success',
        message: `Cast ${vote} vote on BIP-${id} with ${conviction}x conviction multiplier!`,
      });
    }, 1200);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to vote on BelizeChain sovereign governance referendums." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors">
                <ArrowLeft size={24} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">BelizeChain Sovereign Governance</h1>
              <p className="text-xs text-slate-400">National Referendums • Quadratic Voting • Treasury Grants</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Scales size={16} weight="bold" />
              Quadratic Voting Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Treasury Reserve Balance</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">1,850,000</span>
              <span className="text-[10px] text-emerald-300">Ɗ</span>
            </div>
            <span className="text-[11px] text-slate-400 block">+ BZ$ 450,000 bBZD</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Citizen Voter Turnout</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300 font-mono">72.4%</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Super-Majority Attained</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Voting Mechanism</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400">Quadratic</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Anti-Whale Decentralized</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Conviction Multiplier</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-amber-300 font-mono">{conviction}x Weight</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Locked for {conviction * 2} Eras</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['referendums', 'council', 'delegation', 'create'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'referendums'
                ? 'Active Referendums'
                : tab === 'council'
                ? 'District Councils'
                : tab === 'delegation'
                ? 'Vote Delegation'
                : 'Submit Proposal'}
            </button>
          ))}
        </div>

        {/* Conviction Selector Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-white block">Conviction Voting Multiplier</span>
            <p className="text-slate-400 text-[11px]">Lock your bonded voting stake to increase voting power weight.</p>
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 6].map((c) => (
              <button
                key={c}
                onClick={() => setConviction(c)}
                className={`px-3 py-1.5 rounded-xl font-bold font-mono transition-all ${
                  conviction === c
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {c}x
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Referendums */}
        {activeTab === 'referendums' && (
          <div className="space-y-4">
            {referendums.map((r) => {
              const totalVotes = r.ayes + r.nays;
              const ayePct = totalVotes > 0 ? Math.round((r.ayes / totalVotes) * 100) : 50;

              return (
                <div
                  key={r.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 font-bold rounded-full text-[10px]">
                          {r.category}
                        </span>
                        <span className="text-slate-500 text-[11px] font-mono">BIP #{r.id}</span>
                      </div>
                      <h3 className="font-bold text-white text-sm">{r.title}</h3>
                    </div>

                    <span
                      className={`px-3 py-1 font-bold rounded-full text-[10px] ${
                        r.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">{r.description}</p>

                  {r.requestedAmount && (
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Requested Treasury Grant:</span>
                      <span className="text-emerald-400 font-bold font-mono">{r.requestedAmount}</span>
                    </div>
                  )}

                  {/* Voting Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-emerald-400 font-bold">Aye: {r.ayes} ({ayePct}%)</span>
                      <span className="text-rose-400 font-bold">Nay: {r.nays} ({100 - ayePct}%)</span>
                    </div>
                    <div className="w-full bg-rose-500/30 rounded-full h-2 overflow-hidden flex">
                      <div className="bg-emerald-500 h-2 transition-all duration-500" style={{ width: `${ayePct}%` }} />
                    </div>
                  </div>

                  {/* Voting Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleVote(r.id, 'Aye')}
                      disabled={votingId === r.id || r.status !== 'Active'}
                      className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        r.myVote === 'Aye'
                          ? 'bg-emerald-500 text-slate-950 shadow-lg'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      }`}
                    >
                      <ThumbsUp size={16} weight="bold" />
                      Vote Aye ({conviction}x)
                    </button>

                    <button
                      onClick={() => handleVote(r.id, 'Nay')}
                      disabled={votingId === r.id || r.status !== 'Active'}
                      className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        r.myVote === 'Nay'
                          ? 'bg-rose-500 text-white shadow-lg'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      }`}
                    >
                      <ThumbsDown size={16} weight="bold" />
                      Vote Nay ({conviction}x)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Council */}
        {activeTab === 'council' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={22} className="text-purple-400" />
                Belize 6-District Sovereign Council
              </h3>
              <p className="text-slate-400 mt-1">Elected representatives overseeing fast-track emergency and infrastructure proposals.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { district: 'Ambergris Caye & Cayes', seats: 2, councilor: 'Wicked (Founder Node)', status: 'Active' },
                { district: 'Belmopan Capital', seats: 2, councilor: 'Ministry Technical Lead', status: 'Active' },
                { district: 'Stann Creek / Placencia', seats: 2, councilor: 'Eco-Tourism Chamber', status: 'Active' },
                { district: 'Cayo / San Ignacio', seats: 1, councilor: 'Agricultural Cooperative', status: 'Active' },
              ].map((d) => (
                <div key={d.district} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{d.district}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full">{d.status}</span>
                  </div>
                  <span className="text-slate-400 text-[11px] block">Councilor: {d.councilor} ({d.seats} Seats)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Delegation */}
        {activeTab === 'delegation' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs max-w-lg mx-auto">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={22} className="text-cyan-400" />
                Delegate Citizen Voting Power
              </h3>
              <p className="text-slate-400 mt-1">Delegate your voting power to trusted technical or ecological delegates.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addNotification({ type: 'success', message: 'Voting power successfully delegated to Ceiba Foundation!' });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Delegate Address or BNS (.bz)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ceiba-foundation.bz"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
              >
                Delegate Voting Power
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Create */}
        {activeTab === 'create' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs max-w-lg mx-auto">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus size={22} className="text-emerald-400" />
                Submit Sovereign Proposal to Parliament
              </h3>
              <p className="text-slate-400 mt-1">Deposit 100 Ɗ bond to initiate national referendum.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addNotification({ type: 'success', message: 'Proposal submitted! Bonded 100 Ɗ to initiate referendum.' });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Proposal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BIP-15: Placencia Solar-Powered Mesh Relay Node"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Category</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-400 focus:outline-none">
                  <option value="District Infrastructure">District Infrastructure</option>
                  <option value="Treasury Grant">Treasury Grant</option>
                  <option value="National Policy">National Policy</option>
                  <option value="Runtime Upgrade">Runtime Upgrade</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Detailed Description & Milestones</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide rationale, technical specifications, and delivery milestones..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
              >
                Submit Proposal (100 Ɗ Bond)
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
