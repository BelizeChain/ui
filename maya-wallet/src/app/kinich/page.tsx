'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { getKinichClient, type QuantumJob } from '@belizechain/shared';
import {
  getQuantumBackends,
  getQuantumWorkProofs,
  getQuantumStats,
  estimateQuantumCost,
  type QuantumBackend as PalletQuantumBackend,
  type QuantumWorkProof,
} from '@/services/pallets';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  Atom,
  Lightning,
  ChartLine,
  CurrencyDollar,
  CheckCircle,
  Clock,
  Warning,
  Play,
  Pause,
  X,
  PlusCircle,
  Cpu,
  CloudArrowUp,
  ArrowLeft,
  CircleNotch
} from 'phosphor-react';

interface AccountQuantumStats {
  totalJobs: number;
  completedJobs: number;
  totalCost: string;
  totalRewards: string;
  averageExecutionTime: number;
  favoriteBackend: string;
}

export default function KinichPage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'rewards'>('dashboard');

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<QuantumJob[]>([]);
  const [backends, setBackends] = useState<PalletQuantumBackend[]>([]);
  const [workProofs, setWorkProofs] = useState<QuantumWorkProof[]>([]);
  const [accountStats, setAccountStats] = useState<AccountQuantumStats | null>(null);
  const [systemStats, setSystemStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalShots: 0,
    avgWaitTime: 0,
  });

  // Cost estimator state
  const [estimateQubits, setEstimateQubits] = useState(8);
  const [estimateShots, setEstimateShots] = useState(2048);
  const [estimatedCost, setEstimatedCost] = useState<{ cost: string; estimatedTime: number } | null>(null);
  const [estimating, setEstimating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!selectedAccount?.address) {
      setLoading(false);
      return;
    }

    try {
      const kinichClient = getKinichClient();

      const results = await Promise.allSettled([
        kinichClient.getSystemStats(),
        kinichClient.listJobs(selectedAccount.address, 20),
        getQuantumBackends(),
        getQuantumWorkProofs(selectedAccount.address, 20),
        getQuantumStats(selectedAccount.address),
      ]);

      if (results[0].status === 'fulfilled') setSystemStats(results[0].value);
      if (results[1].status === 'fulfilled') setJobs(results[1].value);
      if (results[2].status === 'fulfilled') setBackends(results[2].value);
      if (results[3].status === 'fulfilled') setWorkProofs(results[3].value);
      if (results[4].status === 'fulfilled') setAccountStats(results[4].value);

      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch Kinich data:', err);
      setError(err.message || 'Unable to connect to Kinich quantum service.');
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

  // Live cost estimation
  const handleEstimateCost = useCallback(async () => {
    if (backends.length === 0) return;

    setEstimating(true);
    try {
      const result = await estimateQuantumCost(backends[0]?.name || 'Azure', estimateShots);
      setEstimatedCost(result);
    } catch (err) {
      console.error('Cost estimation failed:', err);
      // Fallback estimation
      setEstimatedCost({
        cost: (estimateShots * 0.0012 * estimateQubits).toFixed(2),
        estimatedTime: Math.round(estimateShots * 0.005),
      });
    } finally {
      setEstimating(false);
    }
  }, [backends, estimateShots, estimateQubits]);

  // Trigger cost estimate when inputs change
  useEffect(() => {
    const timer = setTimeout(handleEstimateCost, 300);
    return () => clearTimeout(timer);
  }, [handleEstimateCost]);

  // Derived stats
  const totalPQWRewards = accountStats?.totalRewards ?? '0';
  const successRate = accountStats && accountStats.totalJobs > 0
    ? `${((accountStats.completedJobs / accountStats.totalJobs) * 100).toFixed(1)}%`
    : '—';

  const circuits = [
    { name: 'VQE Template', qubits: 4, gates: 24, type: 'Optimization' },
    { name: 'QAOA Max-Cut', qubits: 8, gates: 48, type: 'Combinatorial' },
    { name: 'QNN Classifier', qubits: 6, gates: 36, type: 'Machine Learning' },
    { name: 'Grover Search', qubits: 5, gates: 30, type: 'Search' }
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
  if (error && accountStats === null) {
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
              <h1 className="text-xl font-bold text-white">Kinich Quantum</h1>
              <p className="text-xs text-gray-400">Hybrid Quantum-Classical Computing</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {backends.length > 0 && (
              <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                backends.some(b => b.status === 'Available')
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-700/50 text-gray-400'
              }`}>
                {backends.find(b => b.status === 'Available')?.name || 'No Backend'}
              </div>
            )}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
              <Atom size={20} className="text-white" weight="fill" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-400">Total Jobs</p>
              <p className="text-2xl font-bold text-white">{accountStats?.totalJobs ?? systemStats.totalJobs}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-emerald-400">{successRate}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Total Cost</p>
              <p className="text-lg font-bold text-purple-400">{accountStats?.totalCost ?? '0'} DALLA</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Avg Time</p>
              <p className="text-lg font-bold text-blue-400">{accountStats?.averageExecutionTime ?? 0}ms</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">PQW Rewards</p>
              <p className="text-lg font-bold text-emerald-400">{totalPQWRewards} DALLA</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <PlusCircle size={20} weight="fill" />
            <span className="font-semibold">New Job</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-gray-800/50 border border-gray-700/30 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <Cpu size={20} weight="fill" className="text-gray-400" />
            <span className="font-semibold text-white">Circuit Builder</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex space-x-2 bg-gray-800/50 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'jobs'
                ? 'bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            Jobs
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'rewards'
                ? 'bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            PQW Rewards
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 space-y-4">
        {activeTab === 'dashboard' && (
          <>
            {/* Backend Status — from live data */}
            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Quantum Backends</h3>
              <div className="space-y-3">
                {backends.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <Atom size={32} className="mx-auto mb-2 text-gray-600" />
                    No quantum backends registered on-chain yet.
                  </div>
                ) : backends.map((backend, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      backend.status === 'Available'
                        ? 'bg-purple-500/10'
                        : 'bg-gray-800/50 border border-gray-700/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CloudArrowUp size={24} className={
                        backend.status === 'Available' ? 'text-purple-400' : 'text-gray-400'
                      } weight="fill" />
                      <div>
                        <p className="font-semibold text-white">{backend.name}</p>
                        <p className="text-xs text-gray-400">
                          {backend.provider} • {backend.qubits} qubits • Queue: {backend.queueLength}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {backend.status === 'Available' && (
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      )}
                      <span className={`text-xs font-semibold ${
                        backend.status === 'Available' ? 'text-emerald-400' :
                        backend.status === 'Busy' ? 'text-amber-400' :
                        'text-gray-400'
                      }`}>
                        {backend.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Circuit Templates */}
            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Circuit Templates</h3>
              <div className="grid grid-cols-2 gap-3">
                {circuits.map((circuit, index) => (
                  <div key={index} className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <p className="font-semibold text-white text-sm mb-1">{circuit.name}</p>
                    <p className="text-xs text-gray-400 mb-2">{circuit.type}</p>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-purple-400">{circuit.qubits}q</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">{circuit.gates}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Live Cost Estimator */}
            <GlassCard variant="dark" blur="sm" className="p-6">
              <h3 className="font-bold text-white mb-4">Cost Estimator</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Qubits</label>
                  <input
                    type="number"
                    value={estimateQubits}
                    onChange={(e) => setEstimateQubits(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Shots</label>
                  <input
                    type="number"
                    value={estimateShots}
                    onChange={(e) => setEstimateShots(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Estimated Cost:</span>
                    {estimating ? (
                      <CircleNotch size={24} className="text-purple-400 animate-spin" />
                    ) : (
                      <span className="text-2xl font-bold text-purple-400">
                        {estimatedCost ? `${estimatedCost.cost} DALLA` : '—'}
                      </span>
                    )}
                  </div>
                  {estimatedCost && (
                    <p className="text-xs text-gray-400 mt-1">
                      Est. wait: {estimatedCost.estimatedTime > 60
                        ? `${Math.round(estimatedCost.estimatedTime / 60)} min`
                        : `${estimatedCost.estimatedTime}s`
                      }
                      {backends.length > 0 && ` • ${backends[0].name}`}
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>
          </>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Atom size={48} className="mx-auto mb-3 text-gray-600" />
                <p>No quantum jobs found.</p>
                <p className="text-sm mt-1">Submit your first quantum circuit to get started.</p>
              </div>
            ) : jobs.map((job) => (
              <GlassCard key={job.jobId} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <Atom size={24} className="text-purple-400 flex-shrink-0" weight="fill" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{(job.circuit as any)?.circuitType?.toUpperCase() || 'Quantum Circuit'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Job ID: {job.jobId}</p>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${
                    job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    job.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                    job.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-700/50 text-gray-400'
                  }`}>
                    {job.status}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                  <div>
                    <p className="text-gray-400">Qubits / Gates</p>
                    <p className="font-semibold text-white">{job.circuit?.qubits || 0} / {job.circuit?.gates || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Shots</p>
                    <p className="font-semibold text-white">{job.results?.shots || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Cost</p>
                    <p className="font-semibold text-white">{job.estimatedCost} DALLA</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-700/30">
                  <div className="flex items-center space-x-2 text-xs">
                    <Lightning size={14} className="text-purple-400" weight="fill" />
                    <span className="text-gray-400">{job.results?.executionTime ? `${job.results.executionTime.toFixed(2)} ms` : 'Pending...'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                     <span className="text-gray-400">{new Date(job.submittedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {activeTab === 'rewards' && (
          <>
            {/* Total PQW Rewards */}
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total PQW Rewards</p>
                  <p className="text-3xl font-bold text-emerald-400">{totalPQWRewards} DALLA</p>
                  <p className="text-xs text-gray-400 mt-1">
                    From {accountStats?.completedJobs ?? 0} completed jobs
                    {accountStats?.favoriteBackend && accountStats.favoriteBackend !== 'None' && (
                      <span> • Preferred: {accountStats.favoriteBackend}</span>
                    )}
                  </p>
                </div>
                <CurrencyDollar size={48} className="text-emerald-400/30" weight="fill" />
              </div>
            </GlassCard>

            {/* PQW Proof History — from live blockchain data */}
            <div className="space-y-3">
              {workProofs.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <CurrencyDollar size={48} className="mx-auto mb-3 text-gray-600" />
                  <p>No Proof of Quantum Work rewards yet.</p>
                  <p className="text-sm mt-1">Complete quantum jobs to earn PQW rewards.</p>
                </div>
              ) : workProofs.map((proof, index) => (
                <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-white">Proof #{proof.proofId.slice(0, 8)}...</p>
                      <p className="text-xs text-gray-400 mt-0.5">Job: {proof.jobId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">{proof.reward} DALLA</p>
                      <div className="flex items-center space-x-1 mt-1">
                        {proof.verificationStatus === 'Verified' ? (
                          <>
                            <CheckCircle size={14} className="text-emerald-400" weight="fill" />
                            <span className="text-xs text-emerald-400">Verified</span>
                          </>
                        ) : proof.verificationStatus === 'Rejected' ? (
                          <>
                            <X size={14} className="text-red-400" weight="fill" />
                            <span className="text-xs text-red-400">Rejected</span>
                          </>
                        ) : (
                          <>
                            <Clock size={14} className="text-amber-400" weight="fill" />
                            <span className="text-xs text-amber-400">Pending</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-700/30">
                    <span className="text-gray-400 truncate" title={proof.workHash}>
                      Hash: {proof.workHash.slice(0, 16)}...
                    </span>
                    <span className="text-gray-400">
                      {new Date(proof.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
