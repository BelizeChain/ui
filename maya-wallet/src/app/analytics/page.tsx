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
        const [stakingData, votingHistory, tradeHistory] = await Promise.all([
          stakingService.getStakingInfo(selectedAccount.address),
          governanceService.getVotingHistory(selectedAccount.address),
          belizexService.getTradeHistory(selectedAccount.address, 30)
        ]);
        
        setStakingInfo(stakingData);
        setGovernanceActivity(votingHistory);
        setTradingData(tradeHistory);
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

  const spendingCategories = [
    { name: 'Tourism', amount: '4,250 DALLA', percentage: 35, color: 'blue' },
    { name: 'Groceries', amount: '2,100 DALLA', percentage: 17, color: 'emerald' },
    { name: 'Transport', amount: '1,850 DALLA', percentage: 15, color: 'amber' },
    { name: 'Entertainment', amount: '1,500 DALLA', percentage: 12, color: 'purple' },
    { name: 'Others', amount: '2,550 DALLA', percentage: 21, color: 'gray' }
  ];

  const insights = [
    { title: 'Tourism Cashback Opportunity', description: 'Earn 8% cashback on tourism spending. Potential: 340 DALLA/month', type: 'opportunity', impact: 'high' },
    { title: 'Staking Rewards Available', description: 'Your balance qualifies for 12% APY staking. Estimated: 2,948 DALLA/year', type: 'opportunity', impact: 'high' },
    { title: 'Spending Pattern Changed', description: 'Tourism spending increased 45% this month vs last month', type: 'insight', impact: 'medium' }
  ];

  const monthlyData = [
    { month: 'Sep', income: 5200, spending: 3800 },
    { month: 'Oct', income: 5200, spending: 4100 },
    { month: 'Nov', income: 5200, spending: 3900 },
    { month: 'Dec', income: 5200, spending: 4500 },
    { month: 'Jan', income: 5200, spending: 4250 }
  ];

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
            {spendingCategories.map((category) => (
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
            ))}
          </div>
        </GlassCard>

        <GlassCard variant="dark" blur="sm" className="p-4">
          <h3 className="font-bold text-white mb-4">Monthly Overview</h3>
          <div className="space-y-2">
            {monthlyData.map((data) => (
              <div key={data.month} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg border border-gray-700/30">
                <span className="text-sm font-semibold text-gray-300 w-12">{data.month}</span>
                <div className="flex-1 mx-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-6 bg-gradient-to-r from-emerald-400 to-emerald-400 rounded" style={{ width: `${(data.income / 6000) * 100}%` }} />
                    <div className="flex-1 h-6 bg-gradient-to-r from-red-400 to-red-400 rounded" style={{ width: `${(data.spending / 6000) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Net</p>
                  <p className="text-sm font-bold text-white">{data.income - data.spending} DALLA</p>
                </div>
              </div>
            ))}
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
            {insights.map((insight, index) => (
              <div key={index} className={`p-3 rounded-lg ${insight.type === 'opportunity' ? 'bg-emerald-500/100/10 border border-emerald-500/30' : 'bg-blue-500/100/10 border border-blue-500/30'}`}>
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-white text-sm">{insight.title}</h4>
                  <span className={`px-2 py-0.5 ${insight.impact === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/100/20 text-blue-400'} text-xs rounded-full font-semibold`}>
                    {insight.impact === 'high' ? 'High Impact' : 'Medium Impact'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{insight.description}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
