'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
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
  ArrowLeft
} from 'phosphor-react';

export default function KinichPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'rewards'>('dashboard');

  const quantumStats = {
    totalJobs: 127,
    successRate: '95.3%',
    avgCostPerJob: '$3.20',
    pqwRewards: '1,234 DALLA',
    activeBackend: 'Azure Quantum',
    qubitsUsed: 12450,
    shotsExecuted: 458200
  };

  const recentJobs = [
    {
      id: 'KJ-5478',
      name: 'VQE Optimization - Tourism Route',
      type: 'VQE',
      qubits: 8,
      shots: 2048,
      status: 'completed',
      cost: '$2.45',
      runtime: '12.3s',
      backend: 'Azure Quantum',
      result: 'Optimal path found',
      timestamp: '2 hours ago'
    },
    {
      id: 'KJ-5479',
      name: 'QAOA - Land Distribution',
      type: 'QAOA',
      qubits: 12,
      shots: 4096,
      status: 'running',
      cost: '$4.20',
      runtime: '8.1s / ~15s',
      backend: 'Azure Quantum',
      result: 'In progress...',
      timestamp: '5 minutes ago'
    },
    {
      id: 'KJ-5480',
      name: 'QNN - Fraud Detection',
      type: 'QNN',
      qubits: 6,
      shots: 1024,
      status: 'queued',
      cost: '$1.80',
      runtime: '-',
      backend: 'IonQ',
      result: 'Pending',
      timestamp: 'Queued'
    }
  ];

  const pqwRewards = [
    {
      jobId: 'KJ-5445',
      type: 'VQE Circuit',
      difficulty: 'Medium',
      reward: '125 DALLA',
      verified: true,
      timestamp: '3 days ago'
    },
    {
      jobId: 'KJ-5456',
      type: 'QAOA Optimization',
      difficulty: 'High',
      reward: '340 DALLA',
      verified: true,
      timestamp: '2 days ago'
    },
    {
      jobId: 'KJ-5478',
      type: 'VQE Tourism',
      difficulty: 'Medium',
      reward: '165 DALLA',
      verified: false,
      timestamp: '2 hours ago'
    }
  ];

  const circuits = [
    { name: 'VQE Template', qubits: 4, gates: 24, type: 'Optimization' },
    { name: 'QAOA Max-Cut', qubits: 8, gates: 48, type: 'Combinatorial' },
    { name: 'QNN Classifier', qubits: 6, gates: 36, type: 'Machine Learning' },
    { name: 'Grover Search', qubits: 5, gates: 30, type: 'Search' }
  ];

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
            <div className="px-3 py-1.5 bg-purple-500/20 rounded-full text-purple-400 text-sm font-semibold">
              Azure Q
            </div>
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
              <p className="text-2xl font-bold text-white">{quantumStats.totalJobs}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-emerald-400">{quantumStats.successRate}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Qubits</p>
              <p className="text-lg font-bold text-purple-400">{quantumStats.qubitsUsed.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Avg Cost</p>
              <p className="text-lg font-bold text-blue-400">{quantumStats.avgCostPerJob}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">PQW Rewards</p>
              <p className="text-lg font-bold text-forest-400">{quantumStats.pqwRewards}</p>
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
          <button className="flex items-center justify-center space-x-2 p-4 bg-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <Cpu size={20} weight="fill" className="text-gray-400" />
            <span className="font-semibold text-white">Circuit Builder</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex space-x-2 bg-gray-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'jobs'
                ? 'bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            Jobs
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'rewards'
                ? 'bg-gradient-to-r from-purple-500 to-pink-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
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
            {/* Backend Status */}
            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Quantum Backends</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CloudArrowUp size={24} className="text-purple-400" weight="fill" />
                    <div>
                      <p className="font-semibold text-white">Azure Quantum</p>
                      <p className="text-xs text-gray-400">IonQ • Rigetti • Quantinuum</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500/100 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400">Active</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Atom size={24} className="text-gray-400" weight="fill" />
                    <div>
                      <p className="font-semibold text-white">IBM Quantum</p>
                      <p className="text-xs text-gray-400">Fallback backend</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">Standby</span>
                </div>
              </div>
            </GlassCard>

            {/* Circuit Templates */}
            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Circuit Templates</h3>
              <div className="grid grid-cols-2 gap-3">
                {circuits.map((circuit, index) => (
                  <div key={index} className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                    <p className="font-semibold text-white text-sm mb-1">{circuit.name}</p>
                    <p className="text-xs text-gray-400 mb-2">{circuit.type}</p>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-gray-400">{circuit.qubits}q</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">{circuit.gates}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Cost Calculator */}
            <GlassCard variant="dark" blur="sm" className="p-6">
              <h3 className="font-bold text-white mb-4">Cost Estimator</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Qubits</label>
                  <input 
                    type="number" 
                    defaultValue={8}
                    className="w-full px-4 py-2 bg-gray-200 border border-gray-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Shots</label>
                  <input 
                    type="number" 
                    defaultValue={2048}
                    className="w-full px-4 py-2 bg-gray-200 border border-gray-700 rounded-lg"
                  />
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Estimated Cost:</span>
                    <span className="text-2xl font-bold text-purple-400">$2.45</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Based on Azure Quantum IonQ pricing</p>
                </div>
              </div>
            </GlassCard>
          </>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-3">
            {recentJobs.map((job, index) => (
              <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <Atom size={24} className="text-purple-400 flex-shrink-0" weight="fill" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{job.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Job ID: {job.id}</p>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${
                    job.status === 'completed' ? 'bg-emerald-500/100/20 text-emerald-400' :
                    job.status === 'running' ? 'bg-blue-500/100/20 text-blue-400' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {job.status}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                  <div>
                    <p className="text-gray-400">Qubits</p>
                    <p className="font-semibold text-white">{job.qubits}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Shots</p>
                    <p className="font-semibold text-white">{job.shots}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Cost</p>
                    <p className="font-semibold text-white">{job.cost}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-xs">
                    <Lightning size={14} className="text-purple-400" weight="fill" />
                    <span className="text-gray-400">{job.runtime}</span>
                  </div>
                  <div className="flex space-x-2">
                    {job.status === 'running' && (
                      <button className="p-1.5 hover:bg-gray-200 rounded">
                        <Pause size={16} className="text-gray-400" weight="fill" />
                      </button>
                    )}
                    <button className="p-1.5 hover:bg-gray-200 rounded">
                      <ChartLine size={16} className="text-blue-400" weight="fill" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {activeTab === 'rewards' && (
          <>
            <GlassCard variant="dark-medium" blur="lg" className="p-6 bg-gradient-to-br from-forest-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total PQW Rewards</p>
                  <p className="text-3xl font-bold text-forest-400">{quantumStats.pqwRewards}</p>
                </div>
                <CurrencyDollar size={48} className="text-forest-400/30" weight="fill" />
              </div>
            </GlassCard>

            <div className="space-y-3">
              {pqwRewards.map((reward, index) => (
                <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{reward.type}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Job: {reward.jobId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-forest-400">{reward.reward}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        {reward.verified ? (
                          <>
                            <CheckCircle size={14} className="text-emerald-400" weight="fill" />
                            <span className="text-xs text-emerald-400">Verified</span>
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

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-200">
                    <span className={`px-2 py-1 rounded-full font-semibold ${
                      reward.difficulty === 'High' ? 'bg-red-500/100/20 text-red-400' :
                      reward.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-500/100/20 text-blue-400'
                    }`}>
                      {reward.difficulty}
                    </span>
                    <span className="text-gray-400">{reward.timestamp}</span>
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
