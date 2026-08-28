'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  CalendarBlank,
  Plus,
  Trash,
  Pause,
  Play,
  Repeat,
  ArrowLeft,
  Coins,
  Lightning,
  Drop,
  WifiHigh,
  Globe,
  CheckCircle,
} from 'phosphor-react';

interface RecurringSubscription {
  id: string;
  name: string;
  recipient: string;
  amount: string;
  currency: 'bBZD' | 'DALLA';
  interval: 'Daily' | 'Weekly' | 'Monthly';
  nextExecution: string;
  active: boolean;
  category: 'Utility' | 'Telecom' | 'Domain' | 'Savings';
}

export default function RecurringPaymentsPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [subscriptions, setSubscriptions] = useState<RecurringSubscription[]>([
    {
      id: 'sub-1',
      name: 'Belize Electricity Limited (BEL)',
      recipient: 'r1Sa...9sj24 (BEL Statutory Account)',
      amount: '145.00',
      currency: 'bBZD',
      interval: 'Monthly',
      nextExecution: 'Sep 1, 2026',
      active: true,
      category: 'Utility',
    },
    {
      id: 'sub-2',
      name: 'Belize Water Services (BWS)',
      recipient: '5FHne...94ty (BWS Municipal Billing)',
      amount: '48.50',
      currency: 'bBZD',
      interval: 'Monthly',
      nextExecution: 'Sep 5, 2026',
      active: true,
      category: 'Utility',
    },
    {
      id: 'sub-3',
      name: 'BNS Domain Auto-Renewal (.bz)',
      recipient: 'bns-registrar.bz',
      amount: '10.00',
      currency: 'DALLA',
      interval: 'Monthly',
      nextExecution: 'Oct 15, 2026',
      active: true,
      category: 'Domain',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [subName, setSubName] = useState('');
  const [subRecipient, setSubRecipient] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subCurrency, setSubCurrency] = useState<'bBZD' | 'DALLA'>('bBZD');
  const [subInterval, setSubInterval] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');

  const handleToggleActive = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextState = !s.active;
          addNotification({
            type: nextState ? 'success' : 'info',
            message: `${nextState ? 'Resumed' : 'Paused'} recurring subscription: ${s.name}`,
          });
          return { ...s, active: nextState };
        }
        return s;
      })
    );
  };

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName || !subAmount || !subRecipient) return;

    const newSub: RecurringSubscription = {
      id: `sub-${Date.now()}`,
      name: subName,
      recipient: subRecipient,
      amount: parseFloat(subAmount).toFixed(2),
      currency: subCurrency,
      interval: subInterval,
      nextExecution: 'In 30 days',
      active: true,
      category: 'Utility',
    };

    setSubscriptions([...subscriptions, newSub]);
    setSubName('');
    setSubRecipient('');
    setSubAmount('');
    setShowAddModal(false);
    addNotification({
      type: 'success',
      message: `Created automated recurring schedule for ${subName}!`,
    });
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to manage recurring utility and smart contract subscriptions." fullScreen />;
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
              <h1 className="text-xl font-bold">Automated Subscriptions</h1>
              <p className="text-xs text-slate-400">Utility Auto-Pay • BNS Domain Renewals • Scheduled Transfers</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Plus size={16} weight="bold" />
            New Schedule
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Recurring Schedules</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">{subscriptions.filter((s) => s.active).length} Active</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Substrate Scheduled Extrinsics</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Monthly Committed bBZD</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300 font-mono">
                BZ$ {subscriptions.filter((s) => s.active && s.currency === 'bBZD').reduce((sum, s) => sum + parseFloat(s.amount), 0).toFixed(2)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">Utilities & services</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Monthly Committed DALLA</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {subscriptions.filter((s) => s.active && s.currency === 'DALLA').reduce((sum, s) => sum + parseFloat(s.amount), 0).toFixed(2)} Ɗ
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">Web3 registrar renewals</span>
          </div>
        </div>

        {/* Subscription Cards */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
            Scheduled Payments ({subscriptions.length})
          </h2>

          <div className="space-y-3">
            {subscriptions.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400">
                      {s.name.includes('Electricity') ? <Lightning size={20} className="text-amber-400" /> : s.name.includes('Water') ? <Drop size={20} className="text-cyan-400" /> : <Globe size={20} className="text-purple-400" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{s.name}</h3>
                      <span className="text-slate-500 text-[10px] font-mono">{s.recipient}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-emerald-400 text-base font-mono block">
                      {s.currency === 'bBZD' ? `BZ$ ${s.amount}` : `${s.amount} Ɗ`}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {s.interval} • Next: {s.nextExecution}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      s.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.active ? 'Active Schedule' : 'Paused'}
                  </span>

                  <button
                    onClick={() => handleToggleActive(s.id)}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    {s.active ? <Pause size={14} /> : <Play size={14} />}
                    {s.active ? 'Pause' : 'Resume'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-base flex items-center gap-2">
                <Plus size={20} className="text-emerald-400" />
                New Recurring Schedule
              </span>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubscription} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-bold block mb-1">Service / Subscription Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DigiNet Fiber 100Mbps"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-bold block mb-1">Recipient Address or BNS (.bz)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. diginet.bz or r1Sa..."
                  value={subRecipient}
                  onChange={(e) => setSubRecipient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 uppercase font-bold block mb-1">Amount</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={subAmount}
                    onChange={(e) => setSubAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase font-bold block mb-1">Currency</label>
                  <select
                    value={subCurrency}
                    onChange={(e) => setSubCurrency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="bBZD">bBZD</option>
                    <option value="DALLA">DALLA (Ɗ)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
              >
                Create Recurring Auto-Pay
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
