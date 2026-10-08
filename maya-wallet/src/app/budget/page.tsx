'use client';

import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  addBudgetCategory,
  BUDGET_CATEGORIES_KEY,
  getBudgetCategories,
  type BudgetCategory,
} from '@/services/budgeting';
import { getStakingInfo, type StakingInfo } from '@/services/pallets/staking';
import { ArrowLeft, Plus, X } from 'phosphor-react';

const CURRENCY_SYMBOLS: Record<BudgetCategory['currency'], string> = {
  DALLA: 'Ɗ',
  bBZD: 'BZ$',
};

interface CurrencyTotals {
  currency: BudgetCategory['currency'];
  symbol: string;
  limit: number;
  spent: number;
  remaining: number;
  spendPct: number;
}

/** Aggregate active envelopes per currency — DALLA and bBZD have no fixed peg,
 *  so they must never be summed into a single number. */
function getCurrencyTotals(categories: BudgetCategory[]): CurrencyTotals[] {
  const totals = new Map<BudgetCategory['currency'], { limit: number; spent: number }>();

  for (const category of categories.filter((c) => c.active)) {
    const entry = totals.get(category.currency) ?? { limit: 0, spent: 0 };
    entry.limit += category.monthlyLimit;
    entry.spent += category.spent;
    totals.set(category.currency, entry);
  }

  return Array.from(totals.entries()).map(([currency, { limit, spent }]) => ({
    currency,
    symbol: CURRENCY_SYMBOLS[currency],
    limit,
    spent,
    remaining: limit - spent,
    spendPct: limit > 0 ? Math.round((spent / limit) * 100) : 0,
  }));
}

function formatTotals(entries: CurrencyTotals[], pick: (totals: CurrencyTotals) => number): string {
  if (entries.length === 0) return '—';
  return entries.map((totals) => `${totals.symbol} ${pick(totals).toLocaleString()}`).join(' · ');
}

const BUDGET_CHANGED_EVENT = 'maya-budget-changed';

function subscribeToBudget(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  window.addEventListener(BUDGET_CHANGED_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(BUDGET_CHANGED_EVENT, callback);
  };
}

function getStoredBudgetSnapshot(): string {
  return window.localStorage.getItem(BUDGET_CATEGORIES_KEY) ?? '';
}

/** Parse the raw payload the budgeting service writes to localStorage. */
function parseBudgetCategories(raw: string): BudgetCategory[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BudgetCategory[]) : [];
  } catch {
    return [];
  }
}

export default function BudgetPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [stakingError, setStakingError] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');

  // Envelopes are backed by the budgeting service's localStorage store and are
  // read through useSyncExternalStore (SSR-safe: the server snapshot is empty).
  const storedBudget = useSyncExternalStore(subscribeToBudget, getStoredBudgetSnapshot, () => '');
  const categories = useMemo(() => parseBudgetCategories(storedBudget), [storedBudget]);

  // Seed the service defaults on first visit; the event makes the external
  // store re-read what the service just wrote.
  useEffect(() => {
    if (window.localStorage.getItem(BUDGET_CATEGORIES_KEY) === null) {
      getBudgetCategories();
      window.dispatchEvent(new Event(BUDGET_CHANGED_EVENT));
    }
  }, []);

  // DCA vault card: real on-chain stake for the connected account.
  useEffect(() => {
    if (!selectedAccount?.address) return;

    let cancelled = false;
    getStakingInfo(selectedAccount.address)
      .then((info) => {
        if (!cancelled) setStakingInfo(info);
      })
      .catch(() => {
        if (!cancelled) setStakingError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedAccount?.address]);

  const currencyTotals = useMemo(() => getCurrencyTotals(categories), [categories]);

  const vaultValue = stakingInfo ? `${stakingInfo.totalStaked} Ɗ` : '—';
  let vaultDetail = 'Reading on-chain stake…';
  if (stakingError) {
    vaultDetail = 'Staking read failed';
  } else if (stakingInfo) {
    vaultDetail =
      stakingInfo.totalStaked === '0.00'
        ? 'No staked position on chain'
        : `Epoch ${stakingInfo.epoch} · Rewards claimable on demand`;
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatLimit) return;

    const created = addBudgetCategory({
      name: newCatName,
      color: '#06b6d4',
      monthlyLimit: parseFloat(newCatLimit),
      currency: 'bBZD', // the modal collects a bBZD limit
      alertThreshold: 80,
      active: true,
    });

    // Same-tab notification so the external store re-reads what the service wrote
    window.dispatchEvent(new Event(BUDGET_CHANGED_EVENT));
    setNewCatName('');
    setNewCatLimit('');
    setShowAddModal(false);
    addNotification({
      type: 'success',
      message: `Created budget envelope: ${created.name} (BZ$ ${created.monthlyLimit.toFixed(2)})!`,
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
              <span className="text-lg font-bold text-white font-mono">{formatTotals(currencyTotals, (t) => t.limit)}</span>
            </div>
            <span className="text-[11px] text-slate-400 block">{categories.length} active envelopes</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Spent (Mtd)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300 font-mono">{formatTotals(currencyTotals, (t) => t.spent)}</span>
            </div>
            <span className="text-[11px] text-slate-400 block">
              {currencyTotals.length === 0
                ? 'No active envelopes yet'
                : `${currencyTotals.map((t) => `${t.spendPct}%`).join(' / ')} of monthly cap`}
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Remaining Balance</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">{formatTotals(currencyTotals, (t) => t.remaining)}</span>
            </div>
            <span
              className={`text-[11px] font-semibold ${
                currencyTotals.some((t) => t.remaining < 0) ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {currencyTotals.some((t) => t.remaining < 0) ? 'Over budget' : 'Within budget'}
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">DCA Staking Vault</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400 font-mono">{vaultValue}</span>
            </div>
            <span className="text-[11px] text-slate-400 block">{vaultDetail}</span>
          </div>
        </div>

        {/* Per-currency utilization (DALLA and bBZD are separate units) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs">
          <span className="font-bold text-white text-sm block">Monthly Budget Utilization</span>
          {currencyTotals.length === 0 ? (
            <p className="text-slate-400">No active envelopes yet — add one to start tracking.</p>
          ) : (
            currencyTotals.map((t) => (
              <div key={t.currency} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold">{t.currency} envelopes</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {t.symbol} {t.spent.toLocaleString()} / {t.limit.toLocaleString()} ({t.spendPct}% Spent)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div
                    className={`h-3 transition-all duration-500 ${
                      t.spendPct >= 90
                        ? 'bg-rose-500'
                        : t.spendPct >= 75
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                    }`}
                    style={{ width: `${Math.min(t.spendPct, 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Categories List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
            Budget Envelopes ({categories.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((c) => {
              const pct = c.monthlyLimit > 0 ? Math.round((c.spent / c.monthlyLimit) * 100) : 0;
              const isOver = pct >= 90;
              const symbol = CURRENCY_SYMBOLS[c.currency];

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
                    <span>Spent: <strong className="text-white">{symbol} {c.spent.toLocaleString()}</strong></span>
                    <span>Limit: <strong className="text-slate-200">{symbol} {c.monthlyLimit.toLocaleString()}</strong></span>
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
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">
                <X size={18} />
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
