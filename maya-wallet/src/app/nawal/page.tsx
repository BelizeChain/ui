'use client';

import { useState, useEffect, useCallback } from 'react';
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
  type NawalParticipantStats,
  type NawalSystemMetrics,
  type NawalRoundStatus,
  type ModelGenome,
} from '@/services/pallets';
import {
  Brain,
  Lightning,
  CheckCircle,
  Globe,
  Robot,
  ArrowLeft,
  Coins,
  Download,
  Play,
} from 'phosphor-react';

export default function NawalPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'training' | 'pouw' | 'genomes' | 'benchmark'>('training');
  const [, setLoading] = useState(true);
  const [stats, setStats] = useState<NawalParticipantStats | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<NawalSystemMetrics | null>(null);
  const [rounds, setRounds] = useState<NawalRoundStatus[]>([]);
  const [genomes] = useState<ModelGenome[]>([]);

  // Client training state
  const [isTrainingLocal, setIsTrainingLocal] = useState(false);
  const [lastCommitment, setLastCommitment] = useState<string | null>(null);

  // Claim rewards state
  const [isClaiming, setIsClaiming] = useState(false);

  // Benchmark state
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<{ tokensPerSec: number; flopsGflops: number; webGlAccelerated: boolean } | null>(null);

  // Hoisted so the callback's deps match the compiler-inferred dependency
  // (react-hooks/preserve-manual-memoization).
  const address = selectedAccount?.address;

  const fetchData = useCallback(async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      const [participantStats, sysMetrics, activeRoundsList] = await Promise.all([
        getParticipantStats(address),
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
  }, [address]);

  useEffect(() => {
    // Deferred so the initial load doesn't set state during the effect body
    // (react-hooks/set-state-in-effect).
    Promise.resolve().then(fetchData);
  }, [fetchData]);

  const handleStartLocalTraining = async (roundId: string) => {
    if (!selectedAccount?.address) return;
    setIsTrainingLocal(true);

    try {
      const res = await submitLocalGradient(selectedAccount.address, roundId, 0, 0);
      setLastCommitment(res.commitmentId);
      addNotification({
        type: 'success',
        message: `Gradient commitment ${res.commitmentId} submitted.`,
      });
    } catch (err) {
      addNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gradient submission failed.',
      });
    } finally {
      setIsTrainingLocal(false);
    }
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

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    // CONFIG-002: real client-side benchmark — measure a threaded WebGPU/WebGL
    // matmul if available, else a plain JS loop; report actual numbers.
    try {
      const { measureDeviceThroughput } = await import('@/services/performance');
      const res = await measureDeviceThroughput();
      setBenchmarkResult(res);
      addNotification({
        type: 'success',
        message: `Device benchmark: ${res.flopsGflops} GFLOPS measured via ${res.webGlAccelerated ? 'WebGL-available' : 'CPU'} path.`,
      });
    } catch (err) {
      addNotification({ type: 'error', message: `Benchmark failed: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setIsBenchmarking(false);
    }
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
              <Brain size={14} weight="bold" />
              Nawal Client
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
              <span className="text-lg font-bold text-white">{systemMetrics?.active_participants ?? '—'}</span>
              <span className="text-[10px] text-slate-500">/ {systemMetrics?.total_participants ?? '—'} Total</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Across Belize Edge Devices</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Global Model Accuracy</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400">{systemMetrics ? `${systemMetrics.globalAccuracy}%` : '—'}</span>
            </div>
            <span className="text-[11px] text-slate-400 block">{systemMetrics?.total_models_trained ?? '—'} models converged</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">PoUW Rewards Unclaimed</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400">+{stats?.unclaimedRewardsDalla ?? '—'}</span>
              <span className="text-[10px] text-emerald-300">Ɗ</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Honesty Score: {stats?.honestyScore ?? '—'}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">FL Training Rounds</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300">{stats?.total_rounds ?? '—'}</span>
              <span className="text-[10px] text-slate-500">Completed</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Avg Quality: {stats?.average_quality ?? '—'}</span>
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
                  Train machine learning models on your local device without exposing raw data.
                  Submissions carry a hash commitment, not a zero-knowledge proof, and earn PoUW rewards.
                </p>
              </div>

              <div className="space-y-4">
                {rounds.length === 0 ? (
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                    No active federated-learning rounds. The Nawal coordinator is unreachable or has
                    no open round.
                  </div>
                ) : (
                  rounds.map((round) => (
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
                      <div className="pt-2 border-t border-slate-800/80 text-[11px] text-purple-300 font-bold">
                        Submitting gradient commitment…
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
                          Submit Gradient Commitment
                        </button>
                      </div>
                    )}
                  </div>
                  ))
                )}
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
                  Rewards are computed by the staking pallet at claim time from the validator
                  quality, timeliness, honesty and quantum scores plus a stake bonus.
                </p>
              </div>

              <button
                onClick={handleClaimRewards}
                disabled={isClaiming || stats?.unclaimedRewardsDalla === '0.00'}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
              >
                {isClaiming ? 'Claiming On-Chain...' : `Claim ${stats?.unclaimedRewardsDalla ?? '—'} Ɗ Rewards`}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">Total AI Mined</span>
                <span className="text-lg font-bold text-white font-mono">{stats?.total_rewards ?? '—'} Ɗ</span>
                <span className="text-[11px] text-emerald-400">Across {stats?.successful_rounds ?? '—'} verified rounds</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">Honesty Score</span>
                <span className="text-lg font-bold text-purple-400 font-mono">{stats?.honestyScore ?? '—'}</span>
                <span className="text-[11px] text-slate-400">Reported by the Nawal coordinator</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">Average Quality</span>
                <span className="text-lg font-bold text-cyan-300 font-mono">{stats?.average_quality ?? '—'}</span>
                <span className="text-[11px] text-slate-400">Reported by the Nawal coordinator</span>
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
              {genomes.length === 0 ? (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                  No model genomes are published yet. Converged models are listed here once the
                  Nawal coordinator exposes them.
                </div>
              ) : (
                genomes.map((g) => (
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
                    onClick={() => addNotification({ type: 'success', message: `Model weights for ${g.modelName} are published at ${g.ipfsCid}.` })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    Download Weights
                  </button>
                </div>
                ))
              )}
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
                  In-Browser Compute Diagnostics
                </h3>
                <p className="text-slate-400 mt-1">
                  Measures your device with a real matrix-multiply pass in JavaScript. WebGL
                  availability is reported, but the throughput figure is always measured JavaScript
                  work, never a GPU estimate.
                </p>
              </div>

              <button
                onClick={handleRunBenchmark}
                disabled={isBenchmarking}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
              >
                {isBenchmarking ? 'Measuring…' : 'Run Diagnostics'}
              </button>
            </div>

            {benchmarkResult ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[10px]">Estimated Inference Speed</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">{benchmarkResult.tokensPerSec} tok/s</span>
                  <span className="text-[11px] text-slate-400">Derived from measured FLOPs with a 2-param/token model</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[10px]">Measured Throughput</span>
                  <span className="text-lg font-bold text-purple-400 font-mono">{benchmarkResult.flopsGflops} GFLOPs</span>
                  <span className="text-[11px] text-slate-400">From the JavaScript matmul pass</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[10px]">WebGL Availability</span>
                  <span className="text-lg font-bold text-teal-300 font-mono">
                    {benchmarkResult.webGlAccelerated ? 'Available' : 'Not available'}
                  </span>
                  <span className="text-[11px] text-slate-400">Detected, not used for the measurement</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-8 rounded-2xl border border-slate-800 text-center text-slate-500">
                Click Run Diagnostics to measure this device compute throughput.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
