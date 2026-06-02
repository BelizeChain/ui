'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import * as stakingService from '@/services/pallets/staking';
import * as governanceService from '@/services/pallets/governance';
import * as belizexService from '@/services/pallets/belizex';
import { initializeApi } from '@/services/blockchain';
import { TransactionIndexer, type Transaction } from '@belizechain/shared';
import {
  ChartLineUp,
  TrendUp,
  TrendDown,
  CurrencyDollar,
  ShoppingCart,
  Users,
  Calendar,
  ArrowLeft
} from 'phosphor-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();
  
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [stakingInfo, setStakingInfo] = useState<stakingService.StakingInfo | null>(null);
  const [governanceActivity, setGovernanceActivity] = useState<any[]>([]);
  const [tradingData, setTradingData] = useState<belizexService.TradeHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data from blockchain
  useEffect(() => {
    async function fetchData() {
      if (!selectedAccount) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const api = await initializeApi();
        const [stakingData, votingHistory, tradeHistory, txHistory] = await Promise.all([
          stakingService.getStakingInfo(selectedAccount.address),
          governanceService.getVotingHistory(selectedAccount.address),
          belizexService.getTradeHistory(selectedAccount.address, 30),
          new TransactionIndexer(api).getAccountHistory(selectedAccount.address, { type: 'all', limit: 200 })
        ]);
        
        setStakingInfo(stakingData);
        setGovernanceActivity(votingHistory);
        setTradingData(tradeHistory);
        setTransactions(txHistory);
      } catch (err: any) {
        console.error('Failed to fetch analytics data:', err);
        setError(err.message || 'Unable to load analytics. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedAccount, timeRange]);

  if (loading) {
    return <LoadingSpinner message="Loading analytics from blockchain..." fullScreen />;
  }

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your wallet to view your analytics" fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} fullScreen />;
  }

  // Calculate wallet stats from blockchain data
  const walletStats = {
    totalBalance: stakingInfo ? `${stakingInfo.stakedBalance} DALLA` : '0 DALLA',
    monthlyChange: stakingInfo ? `+${((parseFloat(stakingInfo.pendingRewards || '0') / parseFloat(stakingInfo.stakedBalance || '1')) * 100).toFixed(1)}%` : '+0%',
    transactions: tradingData.length + governanceActivity.length,
    avgTransaction: tradingData.length > 0 
      ? (tradingData.reduce((sum, t) => sum + parseFloat(t.amount0 || '0'), 0) / tradingData.length).toFixed(2) + ' DALLA'
      : '0.00 DALLA'
  };

  // Derive spending-by-category from real outgoing transfers in the account history
  const fmtDalla = (n: number) => `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} DALLA`;
  const address = selectedAccount.address;
  const categoryColors = ['blue', 'emerald', 'amber', 'purple', 'gray'];
  const categoryTotals = new Map<string, number>();
  for (const t of transactions) {
    if (t.from !== address) continue;
    const cat = t.metadata?.category || t.type;
    categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + parseFloat(t.amount || '0'));
  }
  const totalSent = Array.from(categoryTotals.values()).reduce((a, b) => a + b, 0);
  const spendingCategories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount], i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      amount: fmtDalla(amount),
      percentage: totalSent > 0 ? Math.round((amount / totalSent) * 100) : 0,
      color: categoryColors[i % categoryColors.length]
    }));

  // Derive monthly income/spending from real transaction history (last 6 months)
  const monthlyMap = new Map<string, { month: string; income: number; spending: number; order: number }>();
  for (const t of transactions) {
    const d = new Date(t.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const order = d.getFullYear() * 12 + d.getMonth();
    const entry = monthlyMap.get(key) || {
      month: d.toLocaleString('en-US', { month: 'short' }),
      income: 0,
      spending: 0,
      order
    };
    const amt = parseFloat(t.amount || '0');
    if (t.to === address) entry.income += amt;
    if (t.from === address) entry.spending += amt;
    monthlyMap.set(key, entry);
  }
  const monthlyData = Array.from(monthlyMap.values()).sort((a, b) => a.order - b.order).slice(-6);
  const maxMonthly = Math.max(1, ...monthlyData.map((m) => Math.max(m.income, m.spending)));

  // Derive insights from real on-chain data only (no fabricated financial advice)
  const insights: { title: string; description: string; type: string; impact: string }[] = [];
  if (stakingInfo && parseFloat(stakingInfo.pendingRewards || '0') > 0) {
    insights.push({
      title: 'Staking rewards available',
      description: `You have ${stakingInfo.pendingRewards} DALLA in unclaimed staking rewards.`,
      type: 'opportunity',
      impact: 'high'
    });
  }
  if (spendingCategories.length > 0) {
    const top = spendingCategories[0];
    insights.push({
      title: 'Top spending category',
      description: `${top.name} accounts for ${top.percentage}% of your outgoing transfers (${top.amount}).`,
      type: 'insight',
      impact: 'medium'
    });
  }
  if (monthlyData.length > 0) {
    const last = monthlyData[monthlyData.length - 1];
    const net = last.income - last.spending;
    insights.push({
      title: `${last.month} net flow`,
      description: `${net >= 0 ? '+' : ''}${fmtDalla(net)} net this month.`,
      type: net >= 0 ? 'opportunity' : 'insight',
      impact: 'medium'
    });
  }

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
              <h1 className="text-xl font-bold text-white">Analytics</h1>
              <p className="text-xs text-gray-400">Wallet Insights & Optimization</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ChartLineUp size={32} className="text-purple-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        <GlassCard variant="dark-medium" blur="lg" className="p-1">
          <div className="flex space-x-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                timeRange === range
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-400 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-700/30'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
          </div>
        </GlassCard>

        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Balance</p>
              <p className="text-2xl font-bold text-white">{walletStats.totalBalance}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Monthly Change</p>
              <div className="flex items-center justify-end space-x-1">
                <TrendUp size={20} className="text-emerald-400" weight="fill" />
                <p className="text-2xl font-bold text-emerald-400">{walletStats.monthlyChange}</p>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 gap-3">
          <GlassCard variant="dark" blur="sm" className="p-4">
            <ShoppingCart size={24} className="text-violet-400 mb-2" weight="fill" />
            <p className="text-xs text-gray-400">Transactions</p>
            <p className="text-lg font-bold text-white">{walletStats.transactions}</p>
          </GlassCard>
          <GlassCard variant="dark" blur="sm" className="p-4">
            <CurrencyDollar size={24} className="text-fuchsia-400 mb-2" weight="fill" />
            <p className="text-xs text-gray-400">Avg Transaction</p>
            <p className="text-lg font-bold text-white">{walletStats.avgTransaction}</p>
          </GlassCard>
        </div>

        <GlassCard variant="dark" blur="sm" className="p-4">
          <h3 className="font-bold text-white mb-4">Spending by Category</h3>
          <div className="space-y-3">
            {spendingCategories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No outgoing transfers in your history yet.</p>
            ) : (
              spendingCategories.map((category) => (
              <div key={category.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{category.name}</span>
                  <span className="text-sm font-bold text-white">{category.amount}</span>
                </div>
                <div className="w-full h-2 bg-gray-700/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-${category.color}-500`}
                    style={{ width: `${category.percentage}%`, background: category.color === 'blue' ? '#3b82f6' : category.color === 'emerald' ? '#10b981' : category.color === 'amber' ? '#f59e0b' : category.color === 'purple' ? '#a855f7' : '#6b7280' }}
                  />
                </div>
              </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard variant="dark" blur="sm" className="p-4">
          <h3 className="font-bold text-white mb-4">Monthly Overview</h3>
          <div className="space-y-2">
            {monthlyData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No transaction history to chart yet.</p>
            ) : (
              monthlyData.map((data) => (
              <div key={data.month} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg border border-gray-700/30">
                <span className="text-sm font-semibold text-gray-300 w-12">{data.month}</span>
                <div className="flex-1 mx-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-6 bg-gradient-to-r from-emerald-400 to-emerald-400 rounded" style={{ width: `${(data.income / maxMonthly) * 100}%` }} />
                    <div className="flex-1 h-6 bg-gradient-to-r from-red-400 to-red-400 rounded" style={{ width: `${(data.spending / maxMonthly) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Net</p>
                  <p className="text-sm font-bold text-white">{fmtDalla(data.income - data.spending)}</p>
                </div>
              </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-emerald-500/100 rounded" />
              <span className="text-gray-400">Income</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500/100 rounded" />
              <span className="text-gray-400">Spending</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="dark" blur="sm" className="p-4">
          <h3 className="font-bold text-white mb-4">Smart Insights</h3>
          <div className="space-y-3">
            {insights.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No insights available yet. Activity will appear here as you use your wallet.</p>
            ) : (
              insights.map((insight, index) => (
              <div key={index} className={`p-3 rounded-lg ${insight.type === 'opportunity' ? 'bg-emerald-500/100/10 border border-emerald-500/30' : 'bg-blue-500/100/10 border border-blue-500/30'}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-white text-sm">{insight.title}</h4>
                  <span className={`px-2 py-0.5 ${insight.impact === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/100/20 text-blue-400'} text-xs rounded-full font-semibold`}>
                    {insight.impact === 'high' ? 'High Impact' : 'Medium Impact'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{insight.description}</p>
              </div>
            ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
