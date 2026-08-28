'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  Wallet,
  TrendDown,
  TrendUp,
  Warning,
  Plus,
  ChartBar,
  ArrowLeft,
  Coins,
  CheckCircle,
  Bank,
  Receipt,
  Sparkle,
  ShieldCheck,
} from 'phosphor-react';

interface BudgetCategory {
  id: string;
  name: string;
  allocatedBBZD: number;
  spentBBZD: number;
  iconColor: string;
}

export default function BudgetPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [categories, setCategories] = useState<BudgetCategory[]>([
    {
      id: 'c1',
      name: 'Groceries & Household Supplies',
      allocatedBBZD: 800,
      spentBBZD: 420,
      iconColor: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'c2',
      name: 'Utility Bills (BEL & BWS)',
      allocatedBBZD: 350,
      spentBBZD: 310,
      iconColor: 'from-amber-500 to-amber-600',
    },
    {
      id: 'c3',
      name: 'Dining & Eco-Tourism POS',
      allocatedBBZD: 400,
      spentBBZD: 180,
      iconColor: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'c4',
      name: 'DALLA Staking DCA Vault',
      allocatedBBZD: 500,
      spentBBZD: 500,
      iconColor: 'from-cyan-500 to-blue-600',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');

  const totalAllocated = categories.reduce((sum, c) => sum + c.allocatedBBZD, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spentBBZD, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const spendPct = Math.round((totalSpent / totalAllocated) * 100);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatLimit) return;

    const newCategory: BudgetCategory = {
      id: `c-${Date.now()}`,
      name: newCatName,
      allocatedBBZD: parseFloat(newCatLimit),
      spentBBZD: 0,
      iconColor: 'from-cyan-500 to-blue-600',
    };

    setCategories([...categories, newCategory]);
    setNewCatName('');
    setNewCatLimit('');
    setShowAddModal(false);
    addNotification({
      type: 'success',
      message: `Created budget envelope: ${newCatName} (BZ$ ${parseFloat(newCatLimit).toFixed(2)})!`,
    });
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to access citizen budget envelopes and savings goals." fullScreen />;
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
              <h1 className="text-xl font-bold">Citizen Fiscal Budgeting</h1>
              <p className="text-xs text-slate-400">Monthly Spending Envelopes • DCA Savings Vaults • bBZD & DALLA</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Plus size={16} weight="bold" />
            Add Envelope
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Monthly Budget</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">BZ$ {totalAllocated.toLocaleString()}</span>
            </div>
            <span className="text-[11px] text-slate-400 block">{categories.length} active envelopes</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Spent (Mtd)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300 font-mono">BZ$ {totalSpent.toLocaleString()}</span>
            </div>
            <span className="text-[11px] text-slate-400 block">{spendPct}% of monthly cap</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Remaining Balance</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">BZ$ {totalRemaining.toLocaleString()}</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Healthy Fiscal Buffer</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">DCA Staking Vault</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400 font-mono">1,250 Ɗ</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Earning 14.8% APR</span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold text-white text-sm">Monthly Budget Utilization</span>
            <span className="font-mono font-bold text-cyan-300">{spendPct}% Spent</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
            <div
              className={`h-3 transition-all duration-500 ${
                spendPct >= 90
                  ? 'bg-rose-500'
                  : spendPct >= 75
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
              }`}
              style={{ width: `${Math.min(spendPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
            Budget Envelopes ({categories.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((c) => {
              const pct = Math.round((c.spentBBZD / c.allocatedBBZD) * 100);
              const isOver = pct >= 90;

              return (
                <div
                  key={c.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-3 shadow-xl text-xs transition-all"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">{c.name}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isOver ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {pct}% Used
                    </span>
                  </div>

                  <div className="flex justify-between font-mono text-[11px] text-slate-400">
                    <span>Spent: <strong className="text-white">BZ$ {c.spentBBZD}</strong></span>
                    <span>Limit: <strong className="text-slate-200">BZ$ {c.allocatedBBZD}</strong></span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-2 transition-all duration-500 ${
                        pct >= 90 ? 'bg-rose-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-base flex items-center gap-2">
                <Plus size={20} className="text-emerald-400" />
                Add Budget Envelope
              </span>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-bold block mb-1">Envelope Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Healthcare & Pharmacy"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-bold block mb-1">Monthly Limit (bBZD)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={newCatLimit}
                  onChange={(e) => setNewCatLimit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
              >
                Create Envelope
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
