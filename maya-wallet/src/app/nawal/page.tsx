'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
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
  ArrowLeft
} from 'phosphor-react';

export default function NawalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'training' | 'genome' | 'rewards'>('training');

  const aiStats = {
    contributionRank: 12,
    totalContributions: 847,
    trainingRewards: '2,456 DALLA',
    modelAccuracy: '94.7%',
    currentGeneration: 42,
    genomeId: 'nawal_v1_gen42',
    activeLanguages: ['English', 'Spanish', 'Kriol']
  };

  const trainingHistory = [
    {
      id: 'TR-8945',
      task: 'Tourism Revenue Prediction',
      model: 'BelizeChainLLM v2.1',
      rounds: 12,
      accuracy: '96.2%',
      reward: '245 DALLA',
      status: 'completed',
      timestamp: '2 hours ago'
    },
    {
      id: 'TR-8946',
      task: 'Land Price Forecasting',
      model: 'BelizeChainLLM v2.1',
      rounds: 8,
      accuracy: '89.4%',
      reward: '180 DALLA',
      status: 'completed',
      timestamp: '6 hours ago'
    },
    {
      id: 'TR-8947',
      task: 'Compliance Pattern Detection',
      model: 'BelizeChainLLM v2.2',
      rounds: 5,
      accuracy: '-',
      reward: '~320 DALLA',
      status: 'training',
      timestamp: '10 minutes ago'
    }
  ];

  const genomeEvolution = [
    {
      generation: 42,
      fitness: 94.7,
      architecture: 'Transformer + MoE',
      improvement: '+2.3%',
      status: 'current'
    },
    {
      generation: 41,
      fitness: 92.4,
      architecture: 'Transformer',
      improvement: '+1.8%',
      status: 'previous'
    },
    {
      generation: 40,
      fitness: 90.6,
      architecture: 'Transformer + Attention',
      improvement: '+3.1%',
      status: 'archived'
    }
  ];

  const languageSupport = [
    { lang: 'English', proficiency: 95, datasets: 12400, color: 'blue' },
    { lang: 'Spanish', proficiency: 89, datasets: 8200, color: 'emerald' },
    { lang: 'Kriol', proficiency: 76, datasets: 3100, color: 'amber' },
    { lang: 'Garifuna', proficiency: 62, datasets: 1800, color: 'purple' },
    { lang: 'Maya', proficiency: 58, datasets: 1200, color: 'pink' }
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
              <h1 className="text-xl font-bold text-white">Nawal AI</h1>
              <p className="text-xs text-gray-400">Sovereign Federated Learning</p>
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
              <p className="text-3xl font-bold text-indigo-400">#{aiStats.contributionRank}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Model Accuracy</p>
              <p className="text-3xl font-bold text-emerald-400">{aiStats.modelAccuracy}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Contributions</p>
              <p className="text-lg font-bold text-purple-400">{aiStats.totalContributions}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Generation</p>
              <p className="text-lg font-bold text-blue-400">{aiStats.currentGeneration}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Rewards</p>
              <p className="text-lg font-bold text-forest-400">{aiStats.trainingRewards}</p>
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
          <button className="flex items-center justify-center space-x-2 p-4 bg-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <Robot size={20} weight="fill" className="text-gray-400" />
            <span className="font-semibold text-white">AI Assistant</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex space-x-2 bg-gray-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('training')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'training'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            Training
          </button>
          <button
            onClick={() => setActiveTab('genome')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'genome'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            Genome
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'rewards'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
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
            {/* Current Training */}
            <GlassCard variant="dark" blur="sm" className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                    <Cpu size={24} className="text-white" weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Active Training Session</h3>
                    <p className="text-xs text-gray-400">Compliance Pattern Detection</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500/100 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-400">Live</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="font-semibold text-white">Round 5 of 15</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all" style={{ width: '33%' }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-400">Current Loss</p>
                    <p className="font-semibold text-white">0.042</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Learning Rate</p>
                    <p className="font-semibold text-white">5e-5</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Training History */}
            <div className="space-y-3">
              {trainingHistory.map((session, index) => (
                <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{session.task}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{session.model} • {session.rounds} rounds</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ml-2 ${
                      session.status === 'completed' ? 'bg-emerald-500/100/20 text-emerald-400' :
                      'bg-blue-500/100/20 text-blue-400'
                    }`}>
                      {session.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                    <div>
                      <p className="text-gray-400">Accuracy</p>
                      <p className="font-semibold text-white">{session.accuracy}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">PoUW Reward</p>
                      <p className="font-semibold text-forest-400">{session.reward}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-400">{session.timestamp}</span>
                    <button className="text-xs text-indigo-400 font-semibold hover:text-indigo-700">
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
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-${lang.color}-400 rounded-full`}
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
            <GlassCard variant="dark" blur="sm" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Current Genome</h3>
                  <p className="text-xs text-gray-400 mt-1">{aiStats.genomeId}</p>
                </div>
                <div className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                  Gen {aiStats.currentGeneration}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-500/10 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Fitness Score</p>
                  <p className="text-2xl font-bold text-purple-400">94.7%</p>
                </div>
                <div className="p-4 bg-blue-500/10 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Architecture</p>
                  <p className="text-sm font-bold text-blue-400">Transformer + MoE</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Evolution History</h3>
              <div className="space-y-3">
                {genomeEvolution.map((gen, index) => (
                  <div key={index} className={`p-4 rounded-lg ${
                    gen.status === 'current' ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200' :
                    'bg-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">Generation {gen.generation}</span>
                        {gen.status === 'current' && (
                          <span className="px-2 py-0.5 bg-purple-400 text-white text-xs rounded-full font-semibold">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-bold text-purple-400">{gen.fitness}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{gen.architecture}</span>
                      <span className="text-emerald-400 font-semibold">{gen.improvement}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

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
            <GlassCard variant="dark-medium" blur="lg" className="p-6 bg-gradient-to-br from-forest-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total PoUW Rewards</p>
                  <p className="text-3xl font-bold text-forest-400">{aiStats.trainingRewards}</p>
                  <p className="text-xs text-gray-400 mt-1">From {aiStats.totalContributions} training sessions</p>
                </div>
                <Medal size={48} className="text-forest-400/30" weight="fill" />
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-6">
              <h3 className="font-bold text-white mb-4">Reward Breakdown</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <TrendUp size={24} className="text-blue-400" weight="fill" />
                    <div>
                      <p className="font-semibold text-white">Quality Bonus</p>
                      <p className="text-xs text-gray-400">40% weight</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-blue-400">982 DALLA</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock size={24} className="text-emerald-400" weight="fill" />
                    <div>
                      <p className="font-semibold text-white">Timeliness</p>
                      <p className="text-xs text-gray-400">30% weight</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-emerald-400">737 DALLA</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={24} className="text-purple-400" weight="fill" />
                    <div>
                      <p className="font-semibold text-white">Compliance</p>
                      <p className="text-xs text-gray-400">30% weight</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-purple-400">737 DALLA</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Leaderboard Position</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Medal size={24} className="text-amber-400" weight="fill" />
                    <span className="font-semibold text-white">Rank #12</span>
                  </div>
                  <span className="text-sm text-emerald-400 font-semibold">↑ 3 positions</span>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Top 5% of all contributors
                </p>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}
