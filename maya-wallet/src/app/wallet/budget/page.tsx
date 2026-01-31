'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, TrendDown, Warning, Plus, ChartBar } from 'phosphor-react';
import { getBudgetCategories, getTotalSpent, getTotalLimits, updateBudgetFromTransactions, type BudgetCategory } from '@/services/budgeting';
import { useWallet, useI18n } from '@belizechain/shared';
import { GlassCard } from '@/components/ui';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

export default function BudgetPage() {
  const router = useRouter();
  const { selectedAccount } = useWallet();
  const { t } = useI18n();
  const account = selectedAccount as InjectedAccountWithMeta;
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudget();
  }, [account?.address]);

  const loadBudget = async () => {
    setLoading(true);
    try {
      // Update budget from blockchain if account connected
      if (account?.address) {
        await updateBudgetFromTransactions(account.address);
      }
      
      const cats = getBudgetCategories();
      const spent = getTotalSpent();
      const limits = getTotalLimits();
      
      setCategories(cats);
      setTotalSpent(spent.dalla + spent.bbzd);
      setTotalBudget(limits.dalla + limits.bbzd);
    } catch (error) {
      console.error('Failed to load budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500/100';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500/100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Budget Tracker</h1>
              <p className="text-xs text-gray-400">Monitor spending & set limits</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-teal-500/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-teal-500/30">
              <div className="flex items-center space-x-1">
                <ChartBar size={14} weight="fill" className="text-teal-400" />
                <span className="text-xs text-teal-400 font-semibold">Tracking</span>
              </div>
            </div>
            <Wallet size={32} className="text-teal-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        {loading ? (
          /* Loading Skeleton */
          <>
            <div className="bg-gray-800 rounded-2xl shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-800 rounded-2xl shadow-md p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </>
        ) : (
          <>
        {/* Overall Budget Card */}
        <div className="bg-gray-800 rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Monthly Budget</h2>
            <Wallet size={24} className="text-caribbean-500" weight="bold" />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Ɗ{totalSpent.toFixed(2)} of Ɗ{totalBudget.toFixed(2)}</span>
              <span className="font-semibold text-white">
                {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${getProgressColor((totalSpent / totalBudget) * 100)}`}
                style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="text-sm text-gray-400">
            Remaining: <span className="font-bold text-caribbean-400">Ɗ{Math.max(0, totalBudget - totalSpent).toFixed(2)}</span>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {categories.map((category) => {
            const spent = category.spent || 0;
            const percentage = (spent / category.monthlyLimit) * 100;

            return (
              <div key={category.name} className="bg-gray-800 rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">{category.name}</h3>
                  <span className="text-sm text-gray-400">
                    {Math.round(percentage)}%
                  </span>
                </div>

                <div className="mb-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getProgressColor(percentage)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Ɗ{spent.toFixed(2)} / Ɗ{category.monthlyLimit.toFixed(2)}</span>
                  {percentage >= 80 && (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Warning size={16} weight="bold" />
                      <span className="text-xs font-medium">Near limit</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Category Button */}
        <button className="w-full flex items-center justify-center gap-2 py-4 bg-gray-800 border-2 border-dashed border-caribbean-300 text-caribbean-400 rounded-xl hover:bg-caribbean-50 transition-colors">
          <Plus size={24} weight="bold" />
          <span className="font-semibold">Add Custom Category</span>
        </button>
        </>
        )}
      </div>
    </div>
  );
}
