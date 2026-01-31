'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Vault,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  CurrencyDollar,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ChartLineUp,
  ShieldCheck
} from 'phosphor-react';

export default function TreasuryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'signers'>('overview');

  const treasuryData = {
    balance: {
      dalla: '15,234,567',
      bBZD: '8,456,789',
      totalUSD: '23,691,356'
    },
    multiSig: {
      required: 4,
      total: 7,
      threshold: '4-of-7'
    },
    signers: [
      { name: 'Central Bank Governor', address: '5F3s...8dHk', verified: true, signed: 156 },
      { name: 'Finance Minister', address: '5Gk2...9mNp', verified: true, signed: 148 },
      { name: 'Treasury Secretary', address: '5Hj7...2qWr', verified: true, signed: 142 },
      { name: 'Comptroller General', address: '5Km9...5tYu', verified: true, signed: 139 },
      { name: 'Deputy Finance', address: '5Lt4...3xZv', verified: true, signed: 127 },
      { name: 'Audit Director', address: '5Mw8...7cBn', verified: true, signed: 119 },
      { name: 'Legal Counsel', address: '5Nx6...4vPm', verified: true, signed: 103 }
    ],
    proposals: [
      {
        id: 1,
        title: 'National Infrastructure Fund',
        amount: '2,500,000 DALLA',
        proposer: 'Central Bank Governor',
        signatures: 5,
        status: 'pending',
        timeLeft: '2 days',
        description: 'Allocation for highway reconstruction project'
      },
      {
        id: 2,
        title: 'Education Technology Grant',
        amount: '850,000 DALLA',
        proposer: 'Finance Minister',
        signatures: 4,
        status: 'approved',
        timeLeft: 'Executed',
        description: 'Digital learning platforms for public schools'
      },
      {
        id: 3,
        title: 'Healthcare Equipment Purchase',
        amount: '1,200,000 bBZD',
        proposer: 'Treasury Secretary',
        signatures: 2,
        status: 'rejected',
        timeLeft: 'Expired',
        description: 'Medical devices for regional hospitals'
      }
    ],
    recentTransactions: [
      { type: 'out', amount: '850,000 DALLA', to: 'Education Ministry', time: '2 hours ago' },
      { type: 'in', amount: '3,200,000 DALLA', from: 'Tourism Revenue', time: '1 day ago' },
      { type: 'out', amount: '450,000 bBZD', to: 'Infrastructure Fund', time: '3 days ago' },
      { type: 'in', amount: '1,800,000 bBZD', from: 'Tax Collection', time: '5 days ago' }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Treasury</h1>
              <p className="text-xs text-gray-400">Multi-sig & Governance</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center">
            <Vault size={20} className="text-white" weight="fill" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-2">
          {['overview', 'proposals', 'signers'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'overview' && (
          <>
            {/* Balance Card */}
            <GlassCard variant="gradient" blur="lg" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/80 text-sm mb-1">Total Treasury Balance</p>
                  <h2 className="text-3xl font-bold text-white">${treasuryData.balance.totalUSD}</h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-700/20 flex items-center justify-center">
                  <Wallet size={24} className="text-white" weight="fill" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/20">
                <div>
                  <p className="text-white/60 text-xs">DALLA Holdings</p>
                  <p className="text-white font-bold text-lg">{treasuryData.balance.dalla}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">bBZD Holdings</p>
                  <p className="text-white font-bold text-lg">{treasuryData.balance.bBZD}</p>
                </div>
              </div>
            </GlassCard>

            {/* Multi-sig Info */}
            <GlassCard variant="dark" blur="md" className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-white" weight="fill" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Multi-Signature Protection</h3>
                  <p className="text-sm text-gray-400">{treasuryData.multiSig.threshold} signatures required</p>
                </div>
              </div>
              <div className="flex items-center justify-around pt-4 border-t border-gray-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{treasuryData.multiSig.required}</p>
                  <p className="text-xs text-gray-400">Required</p>
                </div>
                <div className="text-2xl text-gray-300">/</div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-400">{treasuryData.multiSig.total}</p>
                  <p className="text-xs text-gray-400">Total Signers</p>
                </div>
              </div>
            </GlassCard>

            {/* Recent Transactions */}
            <div>
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-sm font-semibold text-gray-300">Recent Transactions</h3>
                <ChartLineUp size={16} className="text-gray-400" weight="bold" />
              </div>
              <GlassCard variant="dark" blur="sm" className="divide-y divide-gray-100">
                {treasuryData.recentTransactions.map((tx, i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'in' ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        {tx.type === 'in' ? (
                          <ArrowDownLeft size={20} className="text-emerald-400" weight="bold" />
                        ) : (
                          <ArrowUpRight size={20} className="text-red-400" weight="bold" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{tx.type === 'in' ? tx.from : tx.to}</p>
                        <p className="text-xs text-gray-400">{tx.time}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${tx.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'in' ? '+' : '-'}{tx.amount}
                    </p>
                  </div>
                ))}
              </GlassCard>
            </div>
          </>
        )}

        {activeTab === 'proposals' && (
          <div className="space-y-3">
            {treasuryData.proposals.map((proposal) => (
              <GlassCard key={proposal.id} variant="dark" blur="md" className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{proposal.title}</h3>
                    <p className="text-sm text-gray-400">{proposal.description}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    proposal.status === 'approved' ? 'bg-emerald-500/100/20 text-emerald-400' :
                    proposal.status === 'rejected' ? 'bg-red-500/100/20 text-red-400' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {proposal.status}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                  <div>
                    <p className="text-xs text-gray-400">Amount</p>
                    <p className="font-bold text-white">{proposal.amount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Signatures</p>
                    <p className="font-bold text-white">{proposal.signatures}/{treasuryData.multiSig.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="font-bold text-white">{proposal.timeLeft}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {activeTab === 'signers' && (
          <div className="space-y-3">
            {treasuryData.signers.map((signer, i) => (
              <GlassCard key={i} variant="dark" blur="sm" className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-400 flex items-center justify-center text-white font-bold">
                      {signer.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{signer.name}</p>
                        {signer.verified && (
                          <CheckCircle size={16} className="text-emerald-500" weight="fill" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{signer.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-forest-400">{signer.signed}</p>
                    <p className="text-xs text-gray-400">signatures</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
