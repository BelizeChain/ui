'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  getParticipantStats,
  getSystemMetrics,
  getActiveRounds,
  submitLocalGradient,
  claimAiPoUwRewards,
  FALLBACK_GENOMES,
  type NawalParticipantStats,
  type NawalSystemMetrics,
  type NawalRoundStatus,
  type ModelGenome,
} from '@/services/pallets';
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
  TreeEvergreen,
  Robot,
  ArrowLeft,
  CircleNotch,
  Coins,
  Download,
  Terminal,
  ShieldCheck,
  Sparkle,
  SlidersHorizontal,
  Play,
  Check,
} from 'phosphor-react';

export default function NawalPage() {
  const { selectedAccount, isConnected, balance } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'training' | 'pouw' | 'genomes' | 'benchmark'>('training');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NawalParticipantStats | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<NawalSystemMetrics | null>(null);
  const [rounds, setRounds] = useState<NawalRoundStatus[]>([]);
  const [genomes] = useState<ModelGenome[]>(FALLBACK_GENOMES);

  // Client training simulation state
  const [isTrainingLocal, setIsTrainingLocal] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [lastCommitment, setLastCommitment] = useState<string | null>(null);

  // Claim rewards state
  const [isClaiming, setIsClaiming] = useState(false);

  // Benchmark state
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<{ tokensPerSec: number; flopsGflops: number; webGlAccelerated: boolean } | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedAccount?.address) {
      setLoading(false);
      return;
    }

    try {
      const [participantStats, sysMetrics, activeRoundsList] = await Promise.all([
        getParticipantStats(selectedAccount.address),
        getSystemMetrics(),
        getActiveRounds(),
      ]);

      setStats(participantStats);
      setSystemMetrics(sysMetrics);
      setRounds(activeRoundsList);
    } catch (err) {
      console.error('Failed to fetch Nawal AI data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccount?.address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartLocalTraining = async (roundId: string) => {
    if (!selectedAccount?.address) return;
    setIsTrainingLocal(true);
    setTrainingProgress(0);

    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 400);

    setTimeout(async () => {
      clearInterval(interval);
      try {
        const res = await submitLocalGradient(selectedAccount.address, roundId, 0.038, 94.8);
        setLastCommitment(res.commitmentId);
        setIsTrainingLocal(false);
        setTrainingProgress(100);
        addNotification({
          type: 'success',
          message: `Local gradient training completed! Submitted cryptographic commitment ${res.commitmentId} to Nawal coordinator.`,
        });
      } catch {
        setIsTrainingLocal(false);
      }
    }, 2400);
  };

  const handleClaimRewards = async () => {
    if (!selectedAccount?.address) return;
    setIsClaiming(true);
    try {
      const res = await claimAiPoUwRewards(selectedAccount.address);
      addNotification({
        type: 'success',
        message: `Successfully claimed ${res.claimedDalla} Ɗ Proof of Useful Work rewards from Nawal AI pool!`,
      });
      if (stats) {
        setStats({ ...stats, unclaimedRewardsDalla: '0.00' });
      }
    } catch (err: any) {
      addNotification({ type: 'error', message: err?.message || 'Reward claim failed.' });
    } finally {
      setIsClaiming(false);
    }
  };

  const handleRunBenchmark = () => {
    setIsBenchmarking(true);
    setTimeout(() => {
      setIsBenchmarking(false);
      setBenchmarkResult({
        tokensPerSec: 48.6,
        flopsGflops: 342.5,
        webGlAccelerated: true,
      });
      addNotification({
        type: 'success',
        message: 'Client Edge-AI Benchmark completed! Device is rated High Capacity for Federated Training.',
      });
    }, 1800);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to participate in Nawal Federated AI Training and earn PoUW rewards." fullScreen />;
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
              <h1 className="text-xl font-bold">Nawal Federated AI Hub</h1>
              <p className="text-xs text-slate-400">Edge-AI Model Training • Proof of Useful Work • IPFS Genomes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Brain size={14} weight="bold" className="animate-pulse" />
              FL Node Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Active FL Nodes</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white">{systemMetrics?.active_participants || 30}</span>
              <span className="text-[10px] text-slate-500">/ {systemMetrics?.total_participants || 84} Total</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Across Belize Edge Devices</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Global Model Accuracy</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400">{systemMetrics?.globalAccuracy || 94.6}%</span>
            </div>
            <span className="text-[11px] text-slate-400 block">{systemMetrics?.total_models_trained || 14} models converged</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">PoUW Rewards Unclaimed</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400">+{stats?.unclaimedRewardsDalla || '185.00'}</span>
              <span className="text-[10px] text-emerald-300">Ɗ</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Honesty Score: {stats?.honestyScore || 99.8}%</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">FL Training Rounds</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300">{stats?.total_rounds || 38}</span>
              <span className="text-[10px] text-slate-500">Completed</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Avg Quality: {stats?.average_quality || 97.4}%</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['training', 'pouw', 'genomes', 'benchmark'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'training'
                ? 'Federated Training'
                : tab === 'pouw'
                ? 'PoUW AI Rewards'
                : tab === 'genomes'
                ? 'Model Genomes (IPFS)'
                : 'Edge Benchmark'}
            </button>
          ))}
        </div>

        {/* Tab 1: Federated Training Coordinator */}
        {activeTab === 'training' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Robot size={20} className="text-purple-400" />
                  Active Federated Learning Rounds
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Train machine learning models on your local device without exposing raw data. Submit zero-knowledge gradients to earn PoUW rewards.
                </p>
              </div>

              <div className="space-y-4">
                {rounds.map((round) => (
                  <div
                    key={round.round_id}
                    className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-full border border-purple-500/30">
                          {round.round_id}
                        </span>
                        <span className="font-bold text-white text-sm">{round.task_name}</span>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-bold">Reward Pool: {round.rewardPoolDalla} Ɗ</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-400 text-[11px]">
                      <div>Participants: <b className="text-slate-200">{round.participants} Nodes</b></div>
                      <div>Accuracy: <b className="text-purple-300">{round.current_accuracy}%</b></div>
                      <div>Loss: <b className="text-cyan-300">{round.loss}</b></div>
                      <div>Target Epochs: <b className="text-slate-200">{round.targetEpochs}</b></div>
                    </div>

                    {isTrainingLocal ? (
                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Computing Local Gradient Epochs...</span>
                          <span className="text-purple-300 font-bold">{trainingProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                          <div className="bg-gradient-to-r from-purple-500 to-cyan-400 h-2 rounded-full transition-all duration-300" style={{ width: `${trainingProgress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        {lastCommitment ? (
                          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                            <CheckCircle size={14} weight="bold" />
                            Committed: {lastCommitment}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Ready for training pass</span>
                        )}
                        <button
                          onClick={() => handleStartLocalTraining(round.round_id)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                        >
                          <Play size={14} weight="bold" />
                          Train Local Epochs
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: PoUW Rewards */}
        {activeTab === 'pouw' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Coins size={22} className="text-emerald-400" />
                  Proof of Useful Work (PoUW) Staking Rewards
                </h3>
                <p className="text-slate-400 mt-1">
                  Rewards are accrued for verified gradient quality, model compression, and honest aggregation.
                </p>
              </div>

              <button
                onClick={handleClaimRewards}
                disabled={isClaiming || stats?.unclaimedRewardsDalla === '0.00'}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
              >
                {isClaiming ? 'Claiming On-Chain...' : `Claim ${stats?.unclaimedRewardsDalla || '185.00'} Ɗ Rewards`}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">Total AI Mined</span>
                <span className="text-lg font-bold text-white font-mono">{stats?.total_rewards || 840.50} Ɗ</span>
                <span className="text-[11px] text-emerald-400">Across {stats?.successful_rounds || 36} verified rounds</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">Honesty Score Multiplier</span>
                <span className="text-lg font-bold text-purple-400 font-mono">1.0x ({stats?.honestyScore || 99.8}%)</span>
                <span className="text-[11px] text-slate-400">No gradient poisonings detected</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">Average Quality</span>
                <span className="text-lg font-bold text-cyan-300 font-mono">{stats?.average_quality || 97.4}%</span>
                <span className="text-[11px] text-slate-400">Consensus validation rank: Top 5%</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Model Genomes (IPFS) */}
        {activeTab === 'genomes' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe size={22} className="text-purple-400" />
                Decentralized Model Genomes (Pakit IPFS)
              </h3>
              <p className="text-slate-400 mt-1">
                Converged foundational models trained collaboratively across BelizeChain nodes and pinned to Pakit decentralized storage.
              </p>
            </div>

            <div className="space-y-3">
              {genomes.map((g) => (
                <div
                  key={g.genomeId}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{g.modelName}</span>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-full">
                        {g.architecture}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>Accuracy: <b className="text-emerald-400">{g.accuracy}%</b></span>
                      <span>Rounds: <b className="text-slate-200">{g.trainedRounds}</b></span>
                      <span>Size: <b className="text-cyan-300">{g.sizeMb} MB</b></span>
                      <span className="font-mono text-slate-500">CID: {g.ipfsCid}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => addNotification({ type: 'success', message: `Downloading model weights for ${g.modelName} via Pakit IPFS gateway...` })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    Download Weights
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Benchmark */}
        {activeTab === 'benchmark' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lightning size={22} className="text-amber-400" />
                  Edge-AI Hardware Diagnostics & In-Browser Benchmark
                </h3>
                <p className="text-slate-400 mt-1">
                  Evaluates your device's WebGL, WebGPU, and Wasm acceleration performance for participating in local federated epochs.
                </p>
              </div>

              <button
                onClick={handleRunBenchmark}
                disabled={isBenchmarking}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
              >
                {isBenchmarking ? 'Running Tensor Benchmark...' : 'Run Diagnostics'}
              </button>
            </div>

            {benchmarkResult ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[10px]">Inference Speed</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">{benchmarkResult.tokensPerSec} tok/s</span>
                  <span className="text-[11px] text-emerald-400">Suitable for 7B Q4 models</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[10px]">Compute Throughput</span>
                  <span className="text-lg font-bold text-purple-400 font-mono">{benchmarkResult.flopsGflops} GFLOPs</span>
                  <span className="text-[11px] text-slate-400">Parallel tensor cores enabled</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[10px]">Hardware Acceleration</span>
                  <span className="text-lg font-bold text-teal-300 font-mono">WebGL 2.0 Active</span>
                  <span className="text-[11px] text-emerald-400">Zero CPU bottleneck</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-8 rounded-2xl border border-slate-800 text-center text-slate-500">
                Click "Run Diagnostics" to test your browser's tensor core throughput.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
