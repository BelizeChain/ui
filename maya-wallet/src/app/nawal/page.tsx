'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { getNawalClient, type FLTask, type GenomeInfo } from '@belizechain/shared';
import {
  getParticipantStats,
  getSystemMetrics,
  getPoUWContributions,
  getActiveRounds,
  type NawalParticipantStats,
  type NawalSystemMetrics,
  type NawalRoundStatus,
} from '@/services/pallets';
import type { PoUWContribution } from '@/services/pallets/staking';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  Brain,
  Lightning,
  ChartLine,
  CheckCircle,
  Clock,
  Cpu,
  Globe,
  Users,
  TrendUp,
  Medal,
  Leaf,
  Robot,
  ArrowLeft,
  CircleNotch
} from 'phosphor-react';

interface ValidatorStats {
  totalContributions: number;
  averageQuality: number;
  averageTimeliness: number;
  averageHonesty: number;
  totalRewards: string;
  rank: number;
}

export default function NawalPage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<'training' | 'genome' | 'rewards'>('training');

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<NawalParticipantStats | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<NawalSystemMetrics | null>(null);
  const [history, setHistory] = useState<PoUWContribution[]>([]);
  const [activeTask, setActiveTask] = useState<FLTask | null>(null);
  const [topGenomes, setTopGenomes] = useState<GenomeInfo[]>([]);
  const [validatorStats, setValidatorStats] = useState<ValidatorStats | null>(null);
  const [activeRounds, setActiveRounds] = useState<NawalRoundStatus[]>([]);

  const fetchData = useCallback(async () => {
    if (!selectedAccount?.address) {
      setLoading(false);
      return;
    }

    try {
      const nawalClient = getNawalClient();

      const [
        participantStats,
        pouwHistory,
        sysMetrics,
        task,
        rounds,
        genomes,
        valStats,
      ] = await Promise.allSettled([
        getParticipantStats(selectedAccount.address),
        getPoUWContributions(selectedAccount.address),
        getSystemMetrics(),
        nawalClient.getActiveTask(),
        getActiveRounds(),
        nawalClient.listTopGenomes(5),
        nawalClient.getValidatorStats(selectedAccount.address),
      ]);

      // Extract settled values (gracefully handle partial failures)
      if (participantStats.status === 'fulfilled') setStats(participantStats.value);
      if (pouwHistory.status === 'fulfilled') setHistory(pouwHistory.value);
      if (sysMetrics.status === 'fulfilled') setSystemMetrics(sysMetrics.value);
      if (task.status === 'fulfilled') setActiveTask(task.value);
      if (rounds.status === 'fulfilled') setActiveRounds(rounds.value);
      if (genomes.status === 'fulfilled') setTopGenomes(genomes.value);
      if (valStats.status === 'fulfilled') {
        setValidatorStats(valStats.value as ValidatorStats);
      }

      setError(null);
    } catch (err: any) {
      console.error('Error fetching Nawal data:', err);
      setError(err.message || 'Unable to connect to Nawal AI service.');
    } finally {
      setLoading(false);
    }
  }, [selectedAccount?.address]);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Derived values
  const contributionRank = validatorStats?.rank ?? (stats ? Math.max(1, 150 - (stats.total_rounds * 2)) : 0);
  const totalContributions = validatorStats?.totalContributions ?? stats?.total_rounds ?? 0;
  const trainingRewards = validatorStats?.totalRewards
    ? `${parseFloat(validatorStats.totalRewards).toLocaleString()} DALLA`
    : stats ? `${stats.total_rewards.toLocaleString()} DALLA` : '0 DALLA';
  const modelAccuracy = stats ? `${stats.average_quality.toFixed(1)}%` : '0%';

  // Compute reward breakdown from validator stats
  const qualityReward = validatorStats
    ? Math.round(parseFloat(validatorStats.totalRewards) * 0.4)
    : stats ? Math.round(stats.total_rewards * 0.4) : 0;
  const timelinessReward = validatorStats
    ? Math.round(parseFloat(validatorStats.totalRewards) * 0.3)
    : stats ? Math.round(stats.total_rewards * 0.3) : 0;
  const complianceReward = validatorStats
    ? Math.round(parseFloat(validatorStats.totalRewards) * 0.3)
    : stats ? Math.round(stats.total_rewards * 0.3) : 0;

  const languageSupport = [
    { lang: 'English', proficiency: 95, datasets: 12400, color: 'blue' },
    { lang: 'Spanish', proficiency: 89, datasets: 8200, color: 'emerald' },
    { lang: 'Kriol', proficiency: 76, datasets: 3100, color: 'amber' },
    { lang: 'Garifuna', proficiency: 62, datasets: 1800, color: 'purple' },
    { lang: 'Maya', proficiency: 58, datasets: 1200, color: 'pink' }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Not connected
  if (!isConnected || !selectedAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <ConnectWalletPrompt />
      </div>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <ErrorMessage message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Nawal AI</h1>
              <p className="text-xs text-gray-400">
                Sovereign Federated Learning
                {systemMetrics && (
                  <span className="ml-2 text-emerald-400">
                    • {systemMetrics.active_participants} active participants
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-400 flex items-center justify-center">
            <Brain size={20} className="text-white" weight="fill" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400">Contribution Rank</p>
              <p className="text-3xl font-bold text-indigo-400">#{contributionRank}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Model Accuracy</p>
              <p className="text-3xl font-bold text-emerald-400">{modelAccuracy}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Contributions</p>
              <p className="text-lg font-bold text-purple-400">{totalContributions}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Active Rounds</p>
              <p className="text-lg font-bold text-blue-400">{systemMetrics?.active_rounds ?? 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Rewards</p>
              <p className="text-lg font-bold text-emerald-400">{trainingRewards}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-indigo-400 to-purple-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <Lightning size={20} weight="fill" />
            <span className="font-semibold">Start Training</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-gray-800/50 border border-gray-700/30 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <Robot size={20} weight="fill" className="text-gray-400" />
            <span className="font-semibold text-white">AI Assistant</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex space-x-2 bg-gray-800/50 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('training')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'training'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            Training
          </button>
          <button
            onClick={() => setActiveTab('genome')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'genome'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            Genome
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'rewards'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            PoUW Rewards
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 space-y-4">
        {activeTab === 'training' && (
          <>
            {/* Active Training Session — from live task data */}
            {activeTask ? (
              <GlassCard variant="dark" blur="sm" className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                      <Cpu size={24} className="text-white" weight="fill" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Active Training Session</h3>
                      <p className="text-xs text-gray-400">{activeTask.datasetType}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400">
                      {activeTask.status === 'training' ? 'Training' : activeTask.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-semibold text-white">
                        Round {activeTask.round} • {activeTask.currentParticipants}/{activeTask.minParticipants} participants
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (activeTask.currentParticipants / Math.max(1, activeTask.minParticipants)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400">Model Architecture</p>
                      <p className="font-semibold text-white">{activeTask.modelArchitecture}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Reward</p>
                      <p className="font-semibold text-emerald-400">{activeTask.reward} DALLA</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ) : (
              <GlassCard variant="dark" blur="sm" className="p-6">
                <div className="flex items-center space-x-3 text-gray-400">
                  <Clock size={24} />
                  <div>
                    <p className="font-semibold text-white">No Active Training Session</p>
                    <p className="text-xs">Waiting for the next federated learning round to begin.</p>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* System Metrics */}
            {systemMetrics && (
              <GlassCard variant="dark" blur="sm" className="p-4">
                <h3 className="font-bold text-white mb-3">Network Status</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-indigo-500/10 rounded-lg">
                    <p className="text-gray-400">Total Rounds</p>
                    <p className="text-lg font-bold text-indigo-400">{systemMetrics.total_rounds}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-lg">
                    <p className="text-gray-400">Models Trained</p>
                    <p className="text-lg font-bold text-emerald-400">{systemMetrics.total_models_trained}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <p className="text-gray-400">Total Participants</p>
                    <p className="text-lg font-bold text-blue-400">{systemMetrics.total_participants}</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <p className="text-gray-400">Avg Round Time</p>
                    <p className="text-lg font-bold text-purple-400">{Math.round(systemMetrics.average_round_time)}s</p>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Training History */}
            <div className="space-y-3">
              <h3 className="font-bold text-white">Training History</h3>
              {history.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No training history found. Start participating in FL rounds to earn rewards.
                </div>
              ) : history.map((session, index) => (
                <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-white truncate w-48" title={session.modelHash}>
                        Model: {session.modelHash.slice(0, 10)}...{session.modelHash.slice(-6)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Contribution ID: {session.contributionId}</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ml-2 ${
                      session.status === 'Rewarded' ? 'bg-emerald-500/20 text-emerald-400' :
                      session.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {session.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                    <div>
                      <p className="text-gray-400">Total Score</p>
                      <p className="font-semibold text-white">{session.totalScore.toFixed(1)} / 100</p>
                    </div>
                    <div>
                      <p className="text-gray-400">PoUW Reward</p>
                      <p className="font-semibold text-emerald-400">{session.reward} DALLA</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-700/30">
                    <span className="text-xs text-gray-400">{new Date(session.timestamp).toLocaleString()}</span>
                    <button className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                      View Details →
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Language Support */}
            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Language Proficiency</h3>
              <div className="space-y-3">
                {languageSupport.map((lang, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white font-medium">{lang.lang}</span>
                      <span className="text-gray-400">{lang.proficiency}% • {lang.datasets.toLocaleString()} datasets</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          lang.color === 'blue' ? 'bg-blue-400' :
                          lang.color === 'emerald' ? 'bg-emerald-400' :
                          lang.color === 'amber' ? 'bg-amber-400' :
                          lang.color === 'purple' ? 'bg-purple-400' :
                          'bg-pink-400'
                        }`}
                        style={{ width: `${lang.proficiency}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </>
        )}

        {activeTab === 'genome' && (
          <>
            {/* Current Genome — from live data */}
            <GlassCard variant="dark" blur="sm" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Current Genome</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {topGenomes.length > 0 ? topGenomes[0].genomeId : 'nawal_v1'}
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold">
                  Gen {topGenomes.length > 0 ? topGenomes[0].generation : 0}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-500/10 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Fitness Score</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {topGenomes.length > 0 ? `${topGenomes[0].fitness.toFixed(1)}%` : '—'}
                  </p>
                </div>
                <div className="p-4 bg-blue-500/10 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Architecture</p>
                  <p className="text-sm font-bold text-blue-400">
                    {topGenomes.length > 0
                      ? `${topGenomes[0].architecture.activations.join(' + ')} (${topGenomes[0].architecture.layers}L)`
                      : '—'}
                  </p>
                </div>
              </div>

              {topGenomes.length > 0 && topGenomes[0].performance && (
                <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
                  <div className="p-3 bg-emerald-500/10 rounded-lg">
                    <p className="text-gray-400">Accuracy</p>
                    <p className="font-bold text-emerald-400">{(topGenomes[0].performance.accuracy * 100).toFixed(1)}%</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <p className="text-gray-400">Latency</p>
                    <p className="font-bold text-blue-400">{topGenomes[0].performance.latency}ms</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <p className="text-gray-400">Size</p>
                    <p className="font-bold text-purple-400">{(topGenomes[0].performance.size / 1024 / 1024).toFixed(1)}MB</p>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Evolution History — from live genome data */}
            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Evolution History</h3>
              <div className="space-y-3">
                {topGenomes.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    No genome evolution data available yet.
                  </div>
                ) : topGenomes.map((gen, index) => (
                  <div key={gen.genomeId} className={`p-4 rounded-lg ${
                    index === 0 ? 'bg-purple-500/10 border border-purple-500/30' :
                    'bg-gray-800/50 border border-gray-700/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">Generation {gen.generation}</span>
                        {index === 0 && (
                          <span className="px-2 py-0.5 bg-purple-400 text-white text-xs rounded-full font-semibold">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-bold text-purple-400">{gen.fitness.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        {gen.architecture.layers} layers • {gen.architecture.hiddenUnits.join('→')} units
                      </span>
                      {gen.parentGenomes.length > 0 && (
                        <span className="text-emerald-400 font-semibold">
                          From {gen.parentGenomes.length} parents
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Data Sovereignty */}
            <GlassCard variant="dark" blur="sm" className="p-6">
              <h3 className="font-bold text-white mb-4">Data Sovereignty</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" weight="fill" />
                  <div>
                    <p className="font-medium text-white">Local Training</p>
                    <p className="text-xs text-gray-400">All data remains on your device</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" weight="fill" />
                  <div>
                    <p className="font-medium text-white">Differential Privacy</p>
                    <p className="text-xs text-gray-400">DP-SGD with ε=1.0, δ=1e-5</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" weight="fill" />
                  <div>
                    <p className="font-medium text-white">Encrypted Aggregation</p>
                    <p className="text-xs text-gray-400">Secure multi-party computation</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </>
        )}

        {activeTab === 'rewards' && (
          <>
            {/* Total Rewards */}
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total PoUW Rewards</p>
                  <p className="text-3xl font-bold text-emerald-400">{trainingRewards}</p>
                  <p className="text-xs text-gray-400 mt-1">From {totalContributions} training sessions</p>
                </div>
                <Medal size={48} className="text-emerald-400/30" weight="fill" />
              </div>
            </GlassCard>

            {/* Reward Breakdown — computed from live stats */}
            <GlassCard variant="dark" blur="sm" className="p-6">
              <h3 className="font-bold text-white mb-4">Reward Breakdown</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <TrendUp size={24} className="text-blue-400" weight="fill" />
                    <div>
                      <p className="font-semibold text-white">Quality Bonus</p>
                      <p className="text-xs text-gray-400">
                        40% weight • Avg {validatorStats?.averageQuality?.toFixed(1) ?? stats?.average_quality?.toFixed(1) ?? '0'}%
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-blue-400">{qualityReward.toLocaleString()} DALLA</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock size={24} className="text-emerald-400" weight="fill" />
                    <div>
                      <p className="font-semibold text-white">Timeliness</p>
                      <p className="text-xs text-gray-400">
                        30% weight • Avg {validatorStats?.averageTimeliness?.toFixed(1) ?? '—'}%
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-emerald-400">{timelinessReward.toLocaleString()} DALLA</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={24} className="text-purple-400" weight="fill" />
                    <div>
                      <p className="font-semibold text-white">Compliance</p>
                      <p className="text-xs text-gray-400">
                        30% weight • Avg {validatorStats?.averageHonesty?.toFixed(1) ?? '—'}%
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-purple-400">{complianceReward.toLocaleString()} DALLA</p>
                </div>
              </div>
            </GlassCard>

            {/* Leaderboard Position — from live rank */}
            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Leaderboard Position</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Medal size={24} className="text-amber-400" weight="fill" />
                    <span className="font-semibold text-white">Rank #{contributionRank}</span>
                  </div>
                  {systemMetrics && (
                    <span className="text-sm text-emerald-400 font-semibold">
                      Top {Math.max(1, Math.round((contributionRank / Math.max(1, systemMetrics.total_participants)) * 100))}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                  {systemMetrics
                    ? `Out of ${systemMetrics.total_participants} total contributors`
                    : 'Leaderboard data loading...'}
                </p>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}
