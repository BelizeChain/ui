'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import * as stakingService from '@/services/pallets/staking';
import {
  ArrowLeft,
  Lightning,
  TrendUp,
  Info,
  CheckCircle,
  Clock,
  Coins,
  ChartLine,
  ArrowUp,
  ArrowDown,
  CaretRight,
  Warning,
  Calendar
} from 'phosphor-react';

export default function StakingPage() {
  const { selectedAccount, isConnected } = useWallet();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  
  // Blockchain data state
  const [stakingData, setStakingData] = useState<any>(null);
  const [validators, setValidators] = useState<stakingService.Validator[]>([]);
  const [pouwHistory, setPouwHistory] = useState<stakingService.PoUWContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch blockchain data
  useEffect(() => {
    async function fetchStakingData() {
      if (!selectedAccount?.address) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const [info, validatorsList, contributions] = await Promise.all([
          stakingService.getStakingInfo(selectedAccount.address),
          stakingService.getActiveValidators(),
          stakingService.getPoUWContributions(selectedAccount.address, 10)
        ]);
        
        setStakingData(info);
        setValidators(validatorsList);
        setPouwHistory(contributions);
      } catch (err: any) {
        console.error('Failed to fetch staking data:', err);
        setError(err.message || 'Unable to load staking information. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchStakingData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchStakingData, 30000);
    return () => clearInterval(interval);
  }, [selectedAccount?.address]);

  // Calculate APR for validator
  const calculateAPR = (validatorCommission: number) => {
    const baseAPR = 15; // Base 15% APR
    return (baseAPR * (1 - validatorCommission / 100)).toFixed(1);
  };

  // Calculate daily/monthly rewards estimate
  const calculateRewards = (staked: string, apr: number) => {
    const stakedNum = parseFloat(staked);
    const daily = (stakedNum * apr / 100 / 365).toFixed(2);
    const monthly = (stakedNum * apr / 100 / 12).toFixed(2);
    return { daily, monthly };
  };

  // Calculate staking period
  const calculateStakingPeriod = () => {
    if (!pouwHistory || pouwHistory.length === 0) return '0 days';
    const oldest = Math.min(...pouwHistory.map(p => p.timestamp));
    const days = Math.floor((Date.now() - oldest * 1000) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  // Show loading state
  if (loading) {
    return <LoadingSpinner message="Loading staking data from blockchain..." fullScreen />;
  }

  // Show wallet connection prompt
  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your wallet to view staking information and earn PoUW rewards" fullScreen />;
  }

  // Show error state
  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} fullScreen />;
  }

  // Calculate overview data from blockchain
  const apr = stakingData?.activeStake ? 12.5 : 0;
  const rewards = stakingData?.activeStake ? calculateRewards(stakingData.activeStake, apr) : { daily: '0.00', monthly: '0.00' };
  const stakingPeriod = calculateStakingPeriod();

  const stakingOverview = {
    totalStaked: stakingData?.totalStaked || '0.00',
    totalRewards: stakingData?.rewardsEarned || '0.00',
    apr: apr.toString(),
    dailyRewards: `+${rewards.daily}`,
    monthlyRewards: `+${rewards.monthly}`,
    stakingPeriod
  };

  // Active positions from blockchain
  const activePositions = stakingData?.activeStake && parseFloat(stakingData.activeStake) > 0 ? [{
    id: 'stake-1',
    provider: 'Active Validator',
    amount: stakingData.activeStake,
    rewards: stakingData.rewardsEarned,
    apr: apr.toString(),
    startDate: new Date().toISOString().split('T')[0],
    status: 'active' as const,
    unlockDate: null
  }] : [];

  // PoUW history as staking history
  const stakingHistory = pouwHistory.map((contribution, index) => ({
    id: index + 1,
    type: 'reward' as const,
    amount: `+${contribution.reward} DALLA`,
    date: new Date(contribution.timestamp * 1000).toISOString().split('T')[0],
    provider: 'PoUW Reward'
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4 z-10">
        <div className="flex items-center gap-4">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-white" weight="bold" />
            </motion.button>
          </Link>
          <div>
            <h1 className="text-white text-2xl font-bold">Staking</h1>
            <p className="text-gray-400 text-sm">Earn rewards by staking DALLA</p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="px-6 pt-6 pb-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-900/90 via-teal-900/80 to-emerald-800/90 backdrop-blur-xl rounded-2xl p-4 border border-emerald-700/30"
          >
            <p className="text-white/80 text-xs mb-1">Total Staked</p>
            <p className="text-white text-2xl font-bold mb-1">{stakingOverview.totalStaked}</p>
            <p className="text-emerald-400 text-xs">DALLA</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700/50"
          >
            <p className="text-gray-400 text-xs mb-1">Total Rewards</p>
            <p className="text-white text-2xl font-bold mb-1">{stakingOverview.totalRewards}</p>
            <p className="text-emerald-400 text-xs">+{stakingOverview.apr}% APR</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30 text-center"
          >
            <p className="text-gray-400 text-xs mb-1">Daily</p>
            <p className="text-emerald-400 font-bold">{stakingOverview.dailyRewards}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30 text-center"
          >
            <p className="text-gray-400 text-xs mb-1">Monthly</p>
            <p className="text-emerald-400 font-bold">{stakingOverview.monthlyRewards}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/30 text-center"
          >
            <p className="text-gray-400 text-xs mb-1">Period</p>
            <p className="text-white font-bold text-sm">{stakingOverview.stakingPeriod}</p>
          </motion.div>
        </div>
      </div>

      {/* Active Positions */}
      <div className="px-6 mb-6">
        <h2 className="text-white text-xl font-bold mb-4">Active Positions</h2>
        {activePositions.map((position, index) => (
          <motion.div
            key={position.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border border-gray-700/50 mb-3"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Lightning size={24} weight="fill" className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold">{position.provider}</p>
                  <p className="text-gray-400 text-sm">{position.apr}% APR</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/100/20 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-semibold uppercase">Active</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Staked</p>
                <p className="text-white font-bold">{position.amount}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Earned</p>
                <p className="text-emerald-400 font-bold">{position.rewards}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Since</p>
                <p className="text-white font-bold text-xs">{position.startDate}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all">
                Add More
              </button>
              <button className="flex-1 bg-gray-700/50 hover:bg-gray-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all border border-gray-600/50">
                Unstake
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Available Validators */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold">Validators</h2>
          <button className="text-emerald-400 text-sm font-semibold">view all</button>
        </div>

        {validators.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Lightning size={48} className="mx-auto mb-2 opacity-50" />
            <p>No active validators found</p>
            <p className="text-sm">Start the blockchain node to see validators</p>
          </div>
        ) : (
          <div className="space-y-3">
            {validators.slice(0, 5).map((validator, index) => {
              const validatorAPR = calculateAPR(validator.commission);
              const validatorId = validator.address;
              
              return (
                <motion.div
                  key={validatorId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedProvider(selectedProvider === validatorId ? null : validatorId)}
                >
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          <Lightning size={20} weight="fill" className="text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-bold">{validator.name || `Validator ${validator.address.slice(0, 8)}...`}</p>
                            {validator.isActive && (
                              <CheckCircle size={16} weight="fill" className="text-emerald-400" />
                            )}
                          </div>
                          <p className="text-gray-400 text-xs">{validator.nominatorCount} nominators</p>
                        </div>
                      </div>
                      <CaretRight size={20} className={`text-gray-400 transition-transform ${selectedProvider === validatorId ? 'rotate-90' : ''}`} />
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">APR</p>
                        <p className="text-emerald-400 font-bold text-sm">{validatorAPR}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Fee</p>
                        <p className="text-white font-bold text-sm">{validator.commission.toFixed(1)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Stake</p>
                        <p className="text-white font-bold text-sm">{validator.totalStake}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-xs">Points</p>
                        <p className="text-white font-bold text-sm">{validator.rewardPoints}</p>
                      </div>
                    </div>

                    {selectedProvider === validatorId && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="pt-3 border-t border-gray-700/50 mt-3"
                      >
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Total Staked</span>
                            <span className="text-white font-semibold">{validator.totalStake} DALLA</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Own Stake</span>
                            <span className="text-white font-semibold">{validator.ownStake} DALLA</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Commission</span>
                            <span className="text-white font-semibold">{validator.commission.toFixed(2)}%</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Address</span>
                            <span className="text-white font-mono text-xs">{validator.address.slice(0, 12)}...</span>
                          </div>
                        </div>

                        <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all">
                          Stake with this Validator
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Staking History */}
      <div className="px-6 mb-6">
        <h2 className="text-white text-xl font-bold mb-4">History</h2>
        <div className="space-y-2">
          {stakingHistory.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center ${
                    item.type === 'reward' ? 'text-emerald-500' : 'text-purple-500'
                  }`}>
                    {item.type === 'reward' ? (
                      <TrendUp size={20} weight="fill" />
                    ) : (
                      <ArrowUp size={20} weight="fill" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {item.type === 'reward' ? 'Staking Reward' : 'Staked'}
                    </p>
                    <p className="text-gray-400 text-xs">{item.provider}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${
                    item.type === 'reward' ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {item.amount}
                  </p>
                  <p className="text-gray-400 text-xs">{item.date}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
