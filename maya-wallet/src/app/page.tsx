'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { MayaShellReadinessPanel } from '@/components/MayaShellReadinessPanel';
import {
  getStakingInfo,
  getPoUWContributions,
  getTourismRewards,
  type StakingInfo,
  type PoUWContribution,
  type TourismReward,
} from '@/services/pallets';
import { getExchangeRate } from '@/services/oracle';
import {
  Eye,
  EyeSlash,
  ArrowUp,
  ArrowDown,
  Swap,
  TrendUp,
  TrendDown,
  ChartLine,
  Coins,
  Gift,
  Brain,
  Lightning,
  CaretRight
} from 'phosphor-react';

/** Format a unix-seconds timestamp as a short relative-time label. */
function timeAgo(tsSeconds: number): string {
  if (!tsSeconds) return '';
  const deltaMs = Date.now() - tsSeconds * 1000;
  if (deltaMs < 0) return 'just now';
  const mins = Math.floor(deltaMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Build a normalized 7-point sparkline (range ~6..38) from a real numeric series. */
function buildSparkline(series: number[]): number[] {
  const points = series.slice(0, 7).reverse();
  if (points.length === 0) return [20, 20, 20, 20, 20, 20, 20];
  const max = Math.max(...points, 1);
  const scaled = points.map((v) => 6 + (v / max) * 32);
  while (scaled.length < 7) scaled.unshift(scaled[0] ?? 20);
  return scaled;
}

export default function HomeNew() {
  const { balance, balanceLoading, isConnected, connect, selectedAccount } = useWallet();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [showAllTrends, setShowAllTrends] = useState(false);
  const [showActivityFilter, setShowActivityFilter] = useState(false);
  const [activityFilter, setActivityFilter] = useState<string>('all');

  // Real on-chain data
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [pouwContributions, setPouwContributions] = useState<PoUWContribution[]>([]);
  const [tourismRewards, setTourismRewards] = useState<TourismReward[]>([]);
  const [rates, setRates] = useState<{ dalla: number; bbzd: number }>({ dalla: 0, bbzd: 0 });

  useEffect(() => {
    const address = selectedAccount?.address;
    if (!address) {
      setStakingInfo(null);
      setPouwContributions([]);
      setTourismRewards([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [staking, pouw, tourism, dallaRate, bbzdRate] = await Promise.all([
        getStakingInfo(address).catch(() => null),
        getPoUWContributions(address).catch(() => [] as PoUWContribution[]),
        getTourismRewards(address).catch(() => [] as TourismReward[]),
        getExchangeRate('DALLA', 'USD').then((r) => r.rate).catch(() => 0),
        getExchangeRate('bBZD', 'USD').then((r) => r.rate).catch(() => 0),
      ]);
      if (cancelled) return;
      setStakingInfo(staking);
      setPouwContributions(pouw);
      setTourismRewards(tourism);
      setRates({ dalla: dallaRate, bbzd: bbzdRate });
    })();
    return () => { cancelled = true; };
  }, [selectedAccount?.address]);

  // Real balances
  const dallaBal = parseFloat(balance?.dalla || '0');
  const bbzdBal = parseFloat(balance?.bBZD || '0');
  const stakedBal = parseFloat(stakingInfo?.totalStaked || '0');

  const displayBalance = {
    dalla: balance?.dalla || '0.00',
    bbzd: balance?.bBZD || '0.00',
    total: (dallaBal * rates.dalla + bbzdBal * rates.bbzd + stakedBal * rates.dalla).toFixed(2),
  };

  // Real assets (DALLA + bBZD always; Staked only when there is an active stake)
  const assets = useMemo(() => {
    const list = [
      {
        id: 'dalla',
        name: 'DALLA',
        symbol: 'Ɗ',
        balance: dallaBal.toFixed(2),
        value: (dallaBal * rates.dalla).toFixed(2),
        color: 'from-emerald-500 to-teal-600',
        icon: Coins,
      },
      {
        id: 'bbzd',
        name: 'bBZD',
        symbol: '$',
        balance: bbzdBal.toFixed(2),
        value: (bbzdBal * rates.bbzd).toFixed(2),
        color: 'from-blue-500 to-cyan-600',
        icon: Coins,
      },
    ];
    if (stakedBal > 0) {
      list.push({
        id: 'staked',
        name: 'Staked',
        symbol: 'Ɗ',
        balance: stakedBal.toFixed(2),
        value: (stakedBal * rates.dalla).toFixed(2),
        color: 'from-purple-500 to-violet-600',
        icon: Lightning,
      });
    }
    return list;
  }, [dallaBal, bbzdBal, stakedBal, rates.dalla, rates.bbzd]);

  // Real rewards/trends derived from on-chain data
  const trends = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      value: string;
      monthlyValue: string;
      totalValue: string;
      icon: typeof Gift;
      color: string;
      chartData: number[];
      stats: Record<string, number | string>;
    }> = [];

    if (tourismRewards.length > 0) {
      const cashbackTotal = tourismRewards.reduce((s, r) => s + parseFloat(r.cashbackAmount || '0'), 0);
      const spendTotal = tourismRewards.reduce((s, r) => s + parseFloat(r.amountSpent || '0'), 0);
      const merchants = new Set(tourismRewards.map((r) => r.merchant)).size;
      list.push({
        id: 'tourism',
        title: 'Tourism Rewards',
        subtitle: 'Verified Cashback',
        value: `+${cashbackTotal.toFixed(2)}`,
        monthlyValue: `+${cashbackTotal.toFixed(2)} DALLA`,
        totalValue: `${cashbackTotal.toFixed(2)} DALLA`,
        icon: Gift,
        color: 'from-amber-500 to-orange-600',
        chartData: buildSparkline(tourismRewards.map((r) => parseFloat(r.cashbackAmount || '0'))),
        stats: { merchants, spending: `${spendTotal.toFixed(2)} DALLA` },
      });
    }

    if (pouwContributions.length > 0) {
      const rewardTotal = pouwContributions.reduce((s, c) => s + parseFloat(c.reward || '0'), 0);
      const avg = (key: 'qualityScore' | 'timelinessScore' | 'honestyScore') =>
        Math.round(pouwContributions.reduce((s, c) => s + c[key], 0) / pouwContributions.length);
      list.push({
        id: 'pouw',
        title: 'PoUW Rewards',
        subtitle: 'Federated Learning',
        value: `+${rewardTotal.toFixed(2)}`,
        monthlyValue: `+${rewardTotal.toFixed(2)} DALLA`,
        totalValue: `${rewardTotal.toFixed(2)} DALLA`,
        icon: Brain,
        color: 'from-purple-500 to-pink-600',
        chartData: buildSparkline(pouwContributions.map((c) => c.totalScore)),
        stats: {
          contributions: pouwContributions.length,
          quality: avg('qualityScore'),
          timeliness: avg('timelinessScore'),
          honesty: avg('honestyScore'),
        },
      });
    }

    return list;
  }, [tourismRewards, pouwContributions]);

  // Real staking position (single position from the staking ledger)
  const stakingPositions = useMemo(() => {
    if (!stakingInfo || stakedBal <= 0) return [];
    return [
      {
        id: 'dalla-stake',
        amount: stakedBal.toFixed(0),
        active: stakingInfo.activeStake,
        unbonding: stakingInfo.unbonding,
        rewards: stakingInfo.rewardsEarned,
        era: stakingInfo.era,
      },
    ];
  }, [stakingInfo, stakedBal]);

  // Real activity feed merged from on-chain reward events
  const activities = useMemo(() => {
    const items = [
      ...pouwContributions.map((c) => ({
        id: `pouw-${c.contributionId}`,
        type: 'pouw',
        title: 'PoUW Rewards',
        subtitle: 'Federated Learning',
        amount: `+${c.reward} DALLA`,
        time: timeAgo(c.timestamp),
        ts: c.timestamp,
        icon: Brain,
        color: 'text-purple-500',
      })),
      ...tourismRewards.map((r) => ({
        id: `tourism-${r.rewardId}`,
        type: 'tourism',
        title: 'Tourism Cashback',
        subtitle: r.merchantName || 'Verified Merchant',
        amount: `+${r.cashbackAmount} DALLA`,
        time: timeAgo(r.timestamp),
        ts: r.timestamp,
        icon: Gift,
        color: 'text-amber-500',
      })),
    ];
    return items.sort((a, b) => b.ts - a.ts);
  }, [pouwContributions, tourismRewards]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Coins size={40} weight="fill" className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 text-center">Welcome to Maya</h2>
            <p className="text-gray-400 mb-8 text-center">
              Connect your wallet to access your BelizeChain assets
            </p>
            <MayaShellReadinessPanel className="mb-6" />
            <button
              onClick={connect}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/30"
            >
              Connect Wallet
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24 overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-8 pb-6"
      >
        <p className="text-gray-400 text-sm mb-1">Hello Belizean,</p>
        <h1 className="text-white text-3xl font-bold">Welcome!!</h1>
      </motion.div>

      <div className="mx-6 mb-6">
        <MayaShellReadinessPanel />
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mx-6 mb-6"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/90 via-teal-900/80 to-emerald-800/90 backdrop-blur-xl p-6 border border-emerald-700/30">
          {/* Decorative blur circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-400/15 rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/80 text-sm font-medium">Total Balance</p>
            </div>

            {balanceVisible ? (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="mb-4"
              >
                <h2 className="text-white text-5xl font-bold tracking-tight">
                  ${displayBalance.total}
                </h2>
              </motion.div>
            ) : (
              <div className="mb-4">
                <h2 className="text-white text-5xl font-bold">••••••</h2>
              </div>
            )}

            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="absolute top-2 right-2 p-2 hover:bg-gray-800/10 rounded-full transition-colors"
            >
              {balanceVisible ? (
                <Eye size={20} className="text-white/80" weight="fill" />
              ) : (
                <EyeSlash size={20} className="text-white/80" weight="fill" />
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Profit Section */}

      <div className="mb-8">
        <div className="flex items-center justify-between px-6 mb-4">
          <h3 className="text-white text-xl font-bold">Assets</h3>
          <button 
            onClick={() => setShowAllAssets(true)}
            className="text-emerald-400 text-sm font-semibold hover:text-emerald-300 transition-colors"
          >
            view all
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-6 pb-2">
            {assets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-shrink-0 w-44"
              >
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700/50">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${asset.color} flex items-center justify-center mb-3`}>
                    <asset.icon size={24} weight="fill" className="text-white" />
                  </div>
                  <p className="text-white font-bold text-lg mb-1">{asset.name}</p>
                  <p className="text-white text-2xl font-bold mb-2">${asset.value}</p>
                  <p className="text-gray-400 text-sm font-medium">{asset.balance} {asset.symbol}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-xl font-bold">Trends</h3>
          <button 
            onClick={() => setShowAllTrends(true)}
            className="text-emerald-400 text-sm font-semibold hover:text-emerald-300 transition-colors"
          >
            view all
          </button>
        </div>

        {trends.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 text-center">
            <p className="text-gray-400 text-sm">No rewards yet. Tourism cashback and PoUW contributions will appear here.</p>
          </div>
        ) : (
        <div className="space-y-3">
          {trends.map((trend, index) => (
            <motion.div
              key={trend.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="cursor-pointer"
              onClick={() => setSelectedTrend(selectedTrend === trend.id ? null : trend.id)}
            >
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${trend.color} flex items-center justify-center`}>
                      <trend.icon size={24} weight="fill" className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold">{trend.title}</p>
                      <p className="text-gray-400 text-sm">{trend.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Mini chart */}
                    <div className="w-20 h-8">
                      <svg className="w-full h-full" viewBox="0 0 100 40">
                        <polyline
                          points={trend.chartData.map((val, i) => `${(i / (trend.chartData.length - 1)) * 100},${40 - val}`).join(' ')}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{trend.value}</p>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedTrend === trend.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-gray-700/50"
                  >
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                        <p className="text-gray-400 text-xs mb-1">This Month</p>
                        <p className="text-emerald-400 font-bold">{trend.monthlyValue}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                        <p className="text-gray-400 text-xs mb-1">Total Earned</p>
                        <p className="text-white font-bold">{trend.totalValue}</p>
                      </div>
                    </div>

                    {/* Additional Stats */}
                    {trend.stats && (
                      <div className="space-y-2">
                        {trend.id === 'tourism' && (
                          <>
                            <div className="flex items-center justify-between text-sm py-2">
                              <span className="text-gray-400">Verified Merchants</span>
                              <span className="text-white font-semibold">{trend.stats.merchants}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm py-2">
                              <span className="text-gray-400">Monthly Spending</span>
                              <span className="text-white font-semibold">{trend.stats.spending}</span>
                            </div>
                          </>
                        )}
                        {trend.id === 'pouw' && (
                          <>
                            <div className="flex items-center justify-between text-sm mb-3 py-2">
                              <span className="text-gray-400">Contributions</span>
                              <span className="text-white font-semibold">{trend.stats.contributions}</span>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-400">Quality Score</span>
                                  <span className="text-emerald-400 font-semibold">{trend.stats.quality}%</span>
                                </div>
                                <div className="w-full bg-gray-700/50 rounded-full h-2">
                                  <div className="bg-emerald-500/100 h-2 rounded-full" style={{ width: `${trend.stats.quality}%` }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-400">Timeliness</span>
                                  <span className="text-emerald-400 font-semibold">{trend.stats.timeliness}%</span>
                                </div>
                                <div className="w-full bg-gray-700/50 rounded-full h-2">
                                  <div className="bg-emerald-500/100 h-2 rounded-full" style={{ width: `${trend.stats.timeliness}%` }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-400">Honesty</span>
                                  <span className="text-emerald-400 font-semibold">{trend.stats.honesty}%</span>
                                </div>
                                <div className="w-full bg-gray-700/50 rounded-full h-2">
                                  <div className="bg-emerald-500/100 h-2 rounded-full" style={{ width: `${trend.stats.honesty}%` }} />
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </div>

      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-xl font-bold">Staking</h3>
          <Link href="/staking">
            <button className="text-emerald-400 text-sm font-semibold hover:text-emerald-300 transition-colors">
              manage
            </button>
          </Link>
        </div>

        {stakingPositions.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 text-center">
            <p className="text-gray-400 text-sm mb-3">No active stake. Stake DALLA to earn PoUW rewards.</p>
            <Link href="/staking">
              <button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-2 px-5 rounded-xl transition-all text-sm">
                Start Staking
              </button>
            </Link>
          </div>
        ) : stakingPositions.map((stake, index) => (
          <motion.div
            key={stake.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border border-gray-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Coins size={24} weight="fill" className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Staking Rewards</p>
                  <p className="text-gray-400 text-sm">Era {stake.era}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-2xl font-bold">{stake.amount}</p>
                <p className="text-gray-400 text-xs">Staked DALLA</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700/30">
                <p className="text-gray-400 text-xs mb-1">Active</p>
                <p className="text-emerald-400 font-bold">{stake.active}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700/30">
                <p className="text-gray-400 text-xs mb-1">Unbonding</p>
                <p className="text-amber-400 font-bold">{stake.unbonding}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700/30">
                <p className="text-gray-400 text-xs mb-1">Rewards</p>
                <p className="text-white font-bold">{stake.rewards}</p>
              </div>
            </div>

            <Link href="/staking">
              <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-xl transition-all">
                Manage Staking
              </button>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-xl font-bold">Activity</h3>
          <button 
            onClick={() => setShowActivityFilter(!showActivityFilter)}
            className="text-emerald-400 text-sm font-semibold hover:text-emerald-300 transition-colors"
          >
            filter
          </button>
        </div>

        {/* Activity Filter Dropdown */}
        {showActivityFilter && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 border border-gray-700/50"
          >
            <p className="text-gray-400 text-xs mb-2">Filter by type:</p>
            <div className="flex flex-wrap gap-2">
              {['all', 'tourism', 'pouw', 'staking', 'send', 'received'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activityFilter === filter
                      ? 'bg-emerald-500/100 text-white'
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          {activities.filter(activity => activityFilter === 'all' || activity.type === activityFilter).length === 0 ? (
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/30 text-center">
              <p className="text-gray-400 text-sm">No activity yet.</p>
            </div>
          ) : activities
            .filter(activity => activityFilter === 'all' || activity.type === activityFilter)
            .map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              className="cursor-pointer"
            >
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center ${activity.color}`}>
                      <activity.icon size={20} weight="fill" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{activity.title}</p>
                      <p className="text-gray-400 text-xs">{activity.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${activity.amount.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {activity.amount}
                    </p>
                    <p className="text-gray-500 text-xs">{activity.time}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* All Assets Modal */}
      {showAllAssets && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full bg-gradient-to-b from-gray-900 to-gray-800 rounded-t-3xl max-h-[80vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl px-6 py-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-xl font-bold">All Assets</h2>
                <button
                  onClick={() => setShowAllAssets(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {assets.map((asset) => (
                <div key={asset.id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${asset.color} flex items-center justify-center`}>
                        <asset.icon size={24} weight="fill" className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-bold">{asset.name}</p>
                        <p className="text-gray-400 text-sm">{asset.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-xl font-bold">{asset.balance}</p>
                      <p className="text-gray-400 text-sm">${asset.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* All Trends Modal */}
      {showAllTrends && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full bg-gradient-to-b from-gray-900 to-gray-800 rounded-t-3xl max-h-[80vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl px-6 py-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-xl font-bold">All Rewards</h2>
                <button
                  onClick={() => setShowAllTrends(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {trends.map((trend) => (
                <div key={trend.id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${trend.color} flex items-center justify-center`}>
                        <trend.icon size={24} weight="fill" className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">{trend.title}</p>
                        <p className="text-gray-400 text-sm">{trend.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-white text-2xl font-bold">{trend.value}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                      <p className="text-gray-400 text-xs mb-1">This Month</p>
                      <p className="text-emerald-400 font-bold">{trend.monthlyValue}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30">
                      <p className="text-gray-400 text-xs mb-1">Total Earned</p>
                      <p className="text-white font-bold">{trend.totalValue}</p>
                    </div>
                  </div>

                  {trend.stats && trend.id === 'tourism' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Verified Merchants</span>
                        <span className="text-white font-semibold">{trend.stats.merchants}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Monthly Spending</span>
                        <span className="text-white font-semibold">{trend.stats.spending}</span>
                      </div>
                    </div>
                  )}

                  {trend.stats && trend.id === 'pouw' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Contributions</span>
                        <span className="text-white font-semibold">{trend.stats.contributions}</span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">Quality Score</span>
                          <span className="text-emerald-400 font-semibold">{trend.stats.quality}%</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2">
                          <div className="bg-emerald-500/100 h-2 rounded-full" style={{ width: `${trend.stats.quality}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">Timeliness</span>
                          <span className="text-emerald-400 font-semibold">{trend.stats.timeliness}%</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2">
                          <div className="bg-emerald-500/100 h-2 rounded-full" style={{ width: `${trend.stats.timeliness}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">Honesty</span>
                          <span className="text-emerald-400 font-semibold">{trend.stats.honesty}%</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2">
                          <div className="bg-emerald-500/100 h-2 rounded-full" style={{ width: `${trend.stats.honesty}%` }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
