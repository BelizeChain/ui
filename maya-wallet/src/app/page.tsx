'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
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

export default function HomeNew() {
  const { balance, balanceLoading, isConnected, connect } = useWallet();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [showAllTrends, setShowAllTrends] = useState(false);
  const [showActivityFilter, setShowActivityFilter] = useState(false);
  const [activityFilter, setActivityFilter] = useState<string>('all');

  // Calculate display balance
  const displayBalance = {
    dalla: balance?.dalla || '0.00',
    bbzd: balance?.bBZD || '0.00',
    total: ((parseFloat(balance?.dalla || '0') * 1.25) + (parseFloat(balance?.bBZD || '0') * 0.50)).toFixed(2)
  };

  // Mock assets data
  const assets = [
    {
      id: 'dalla',
      name: 'DALLA',
      symbol: 'Ɗ',
      balance: displayBalance.dalla,
      value: (parseFloat(displayBalance.dalla) * 1.25).toFixed(2),
      change: '+5.2',
      color: 'from-emerald-500 to-teal-600',
      icon: Coins
    },
    {
      id: 'bbzd',
      name: 'bBZD',
      symbol: '$',
      balance: displayBalance.bbzd,
      value: (parseFloat(displayBalance.bbzd) * 0.50).toFixed(2),
      change: '+0.1',
      color: 'from-blue-500 to-cyan-600',
      icon: Coins
    },
    {
      id: 'dot',
      name: 'DOT',
      symbol: 'DOT',
      balance: '12.45',
      value: '526.54',
      change: '-2.4',
      color: 'from-pink-500 to-rose-600',
      icon: Coins
    },
    {
      id: 'staked',
      name: 'Staked',
      symbol: 'Ɗ',
      balance: '5000',
      value: '6250.00',
      change: '+12.5',
      color: 'from-purple-500 to-violet-600',
      icon: Lightning
    }
  ];

  // Mock activity/trends
  const trends = [
    {
      id: 'tourism',
      title: 'Tourism Rewards',
      subtitle: '7% Cashback',
      value: '+84.04',
      monthlyValue: '+84.04 DALLA',
      totalValue: '125.50 DALLA',
      change: '+12.5',
      icon: Gift,
      color: 'from-amber-500 to-orange-600',
      chartData: [40, 45, 50, 48, 52, 58, 62],
      stats: { merchants: 45, spending: '1200.5 DALLA' }
    },
    {
      id: 'pouw',
      title: 'PoUW Rewards',
      subtitle: 'Federated Learning',
      value: '+600.00',
      monthlyValue: '+600 DALLA',
      totalValue: '4250.75 DALLA',
      change: '+8.3',
      icon: Brain,
      color: 'from-purple-500 to-pink-600',
      chartData: [30, 35, 32, 38, 42, 45, 50],
      stats: { contributions: 12, quality: 94, timeliness: 89, honesty: 100 }
    }
  ];

  // Mock staking positions
  const stakingPositions = [
    {
      id: 'dalla-stake-1',
      amount: '5000',
      apr: '12.5',
      daily: '+1.71',
      monthly: '+52.05',
      total: '856.23',
      duration: '245 days'
    }
  ];

  // Mock activity feed
  const activities = [
    { id: 1, type: 'tourism', title: 'Tourism Cashback', subtitle: 'Blue Hole Divers', amount: '+12.5 DALLA', time: '2h ago', icon: Gift, color: 'text-amber-500' },
    { id: 2, type: 'pouw', title: 'PoUW Rewards', subtitle: 'Federated Learning', amount: '+50 DALLA', time: '5h ago', icon: Brain, color: 'text-purple-500' },
    { id: 3, type: 'staking', title: 'Staking Rewards', subtitle: 'Daily Distribution', amount: '+1.71 DALLA', time: '1d ago', icon: Lightning, color: 'text-emerald-500' },
    { id: 4, type: 'send', title: 'Sent DALLA', subtitle: 'To Alice', amount: '-50 DALLA', time: '2d ago', icon: ArrowUp, color: 'text-red-500' },
    { id: 5, type: 'received', title: 'Received bBZD', subtitle: 'From Bob', amount: '+100 bBZD', time: '3d ago', icon: ArrowDown, color: 'text-green-500' },
    { id: 6, type: 'tourism', title: 'Tourism Cashback', subtitle: 'Rainforest Tours', amount: '+8.25 DALLA', time: '3d ago', icon: Gift, color: 'text-amber-500' },
  ];

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-6 mb-8"
      >
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Profit</p>
              <p className="text-white text-2xl font-bold">${(parseFloat(displayBalance.total) * 0.96).toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-12 relative">
                {/* Mini sparkline */}
                <svg className="w-full h-full" viewBox="0 0 100 50">
                  <path
                    d="M0,40 Q25,35 50,25 T100,10"
                    fill="none"
                    stroke="url(#sparkGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="text-emerald-400 font-bold">5.7%</span>
            </div>
          </div>
        </div>
      </motion.div>

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
                  <div className="flex items-center gap-1">
                    {asset.change.startsWith('+') ? (
                      <TrendUp size={14} weight="fill" className="text-emerald-400" />
                    ) : (
                      <TrendDown size={14} weight="fill" className="text-red-400" />
                    )}
                    <span className={`text-sm font-bold ${asset.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {asset.change}%
                    </span>
                  </div>
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

        {stakingPositions.map((stake, index) => (
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
                  <p className="text-gray-400 text-sm">{stake.apr}% APR</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-2xl font-bold">{stake.amount}</p>
                <p className="text-gray-400 text-xs">Staked DALLA</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700/30">
                <p className="text-gray-400 text-xs mb-1">Daily</p>
                <p className="text-emerald-400 font-bold">{stake.daily}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700/30">
                <p className="text-gray-400 text-xs mb-1">Monthly</p>
                <p className="text-emerald-400 font-bold">{stake.monthly}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700/30">
                <p className="text-gray-400 text-xs mb-1">Total</p>
                <p className="text-white font-bold">{stake.total}</p>
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
          {activities
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
                  <div className="flex items-center gap-1">
                    {asset.change.startsWith('+') ? (
                      <TrendUp size={14} weight="fill" className="text-emerald-400" />
                    ) : (
                      <TrendDown size={14} weight="fill" className="text-red-400" />
                    )}
                    <span className={`text-sm font-bold ${asset.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {asset.change}%
                    </span>
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
