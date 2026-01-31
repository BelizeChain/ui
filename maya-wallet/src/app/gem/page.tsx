'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import {
  FileCode,
  Code,
  Rocket,
  Package,
  Heart,
  Users,
  Play,
  Download,
  Copy,
  CheckCircle,
  Lightning,
  ArrowLeft
} from 'phosphor-react';

export default function GemPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'deploy' | 'contracts' | 'dao'>('deploy');

  const deployedContracts = [
    {
      name: 'DALLA Token',
      type: 'PSP22',
      address: '5GD4w5...NVsNB',
      deployed: '2024-12-10',
      calls: 15420,
      size: '10.5 KB'
    },
    {
      name: 'BeliNFT Collection',
      type: 'PSP34',
      address: '5Ho6Ks...iFQL7',
      deployed: '2024-12-15',
      calls: 8934,
      size: '14.9 KB'
    },
    {
      name: 'Tourism DAO',
      type: 'DAO',
      address: '5Fk3dM...8xR2P',
      deployed: '2025-01-05',
      calls: 2104,
      size: '12.9 KB'
    }
  ];

  const templates = [
    {
      name: 'PSP22 Token',
      description: 'Fungible token standard',
      icon: <Package size={24} weight="fill" className="text-blue-400" />,
      complexity: 'Beginner',
      gasEstimate: '~0.5 DALLA'
    },
    {
      name: 'PSP34 NFT',
      description: 'Non-fungible token collection',
      icon: <Heart size={24} weight="fill" className="text-pink-400" />,
      complexity: 'Intermediate',
      gasEstimate: '~0.8 DALLA'
    },
    {
      name: 'Simple DAO',
      description: 'Governance with voting',
      icon: <Users size={24} weight="fill" className="text-purple-400" />,
      complexity: 'Advanced',
      gasEstimate: '~1.2 DALLA'
    },
    {
      name: 'Faucet',
      description: 'Testnet token distribution',
      icon: <Lightning size={24} weight="fill" className="text-amber-400" />,
      complexity: 'Beginner',
      gasEstimate: '~0.4 DALLA'
    }
  ];

  const daoProposals = [
    {
      id: 'PROP-124',
      title: 'Increase Tourism Rewards to 10%',
      dao: 'Tourism DAO',
      votes: { yes: 1240, no: 340 },
      status: 'active',
      endsIn: '2 days'
    },
    {
      id: 'PROP-125',
      title: 'Fund Beach Cleanup Initiative',
      dao: 'Community DAO',
      votes: { yes: 2100, no: 180 },
      status: 'active',
      endsIn: '5 days'
    },
    {
      id: 'PROP-123',
      title: 'Update Treasury Multi-sig',
      dao: 'Main DAO',
      votes: { yes: 3450, no: 520 },
      status: 'passed',
      endsIn: 'Closed'
    }
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
              <h1 className="text-xl font-bold text-white">The Gem 💎</h1>
              <p className="text-xs text-gray-400">Smart Contracts Platform (ink!)</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-red-400 flex items-center justify-center">
            <FileCode size={20} className="text-white" weight="fill" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Contracts</p>
              <p className="text-2xl font-bold text-pink-400">3</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Total Calls</p>
              <p className="text-2xl font-bold text-blue-400">26.4K</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Gas Saved</p>
              <p className="text-2xl font-bold text-emerald-400">~40%</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-pink-400 to-red-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <Rocket size={20} weight="fill" />
            <span className="font-semibold">Deploy</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <Code size={20} weight="fill" className="text-gray-400" />
            <span className="font-semibold text-white">Interact</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex space-x-2 bg-gray-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('deploy')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'deploy'
                ? 'bg-gradient-to-r from-pink-500 to-red-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            Deploy
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'contracts'
                ? 'bg-gradient-to-r from-pink-500 to-red-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            My Contracts
          </button>
          <button
            onClick={() => setActiveTab('dao')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'dao'
                ? 'bg-gradient-to-r from-pink-500 to-red-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            DAO
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 space-y-4">
        {activeTab === 'deploy' && (
          <>
            <GlassCard variant="dark" blur="sm" className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white">Testnet Faucet</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Get 1000 DALLA every 10 minutes</p>
                </div>
                <Lightning size={32} className="text-amber-400" weight="fill" />
              </div>
              <button className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-semibold rounded-lg hover:shadow-lg transition-shadow">
                Claim Test DALLA
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                Next claim available in 8 minutes
              </p>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Contract Templates</h3>
              <div className="space-y-3">
                {templates.map((template, index) => (
                  <div key={index} className="p-4 bg-gray-200 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                          {template.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{template.name}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">{template.description}</p>
                        </div>
                      </div>
                      <Play size={20} className="text-pink-400" weight="fill" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded-full font-semibold ${
                        template.complexity === 'Beginner' ? 'bg-green-500/100/20 text-green-400' :
                        template.complexity === 'Intermediate' ? 'bg-blue-500/100/20 text-blue-400' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {template.complexity}
                      </span>
                      <span className="text-gray-400">Est. Gas: {template.gasEstimate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-6">
              <h3 className="font-bold text-white mb-4">SDK & Documentation</h3>
              <div className="space-y-3">
                <button className="w-full p-3 bg-gradient-to-r from-gray-200 to-gray-900 text-white rounded-lg flex items-center justify-between hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-3">
                    <Package size={20} weight="fill" />
                    <span className="font-medium">Install SDK</span>
                  </div>
                  <Download size={20} weight="fill" />
                </button>
                <div className="p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">Installation command:</p>
                  <div className="flex items-center justify-between bg-gray-200 text-white p-2 rounded font-mono text-xs">
                    <span>npm install @belizechain/gem-sdk</span>
                    <Copy size={14} className="cursor-pointer hover:text-blue-400" />
                  </div>
                </div>
              </div>
            </GlassCard>
          </>
        )}

        {activeTab === 'contracts' && (
          <div className="space-y-3">
            {deployedContracts.map((contract, index) => (
              <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-white">{contract.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        contract.type === 'PSP22' ? 'bg-blue-500/100/20 text-blue-400' :
                        contract.type === 'PSP34' ? 'bg-pink-100 text-pink-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {contract.type}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-gray-400">{contract.address}</p>
                  </div>
                  <button className="ml-2">
                    <Code size={20} className="text-pink-400" weight="fill" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                  <div>
                    <p className="text-gray-400">Deployed</p>
                    <p className="font-semibold text-white">{contract.deployed}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Calls</p>
                    <p className="font-semibold text-white">{contract.calls.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Size</p>
                    <p className="font-semibold text-white">{contract.size}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button className="flex-1 py-2 bg-gradient-to-r from-pink-400 to-red-400 text-white text-sm font-semibold rounded-lg hover:shadow-md transition-shadow">
                    Interact
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                    View
                  </button>
                </div>
              </GlassCard>
            ))}

            <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center space-x-2 text-gray-400 hover:border-pink-500 hover:text-pink-400 transition-colors">
              <Rocket size={20} weight="bold" />
              <span className="font-medium">Deploy New Contract</span>
            </button>
          </div>
        )}

        {activeTab === 'dao' && (
          <>
            <GlassCard variant="dark" blur="sm" className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white">My Voting Power</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Based on DALLA holdings</p>
                </div>
                <Users size={32} className="text-purple-400" weight="fill" />
              </div>
              <p className="text-3xl font-bold text-purple-400">5,234 votes</p>
            </GlassCard>

            <div className="space-y-3">
              {daoProposals.map((proposal, index) => (
                <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{proposal.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{proposal.dao} • {proposal.id}</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ml-2 ${
                      proposal.status === 'active' ? 'bg-blue-500/100/20 text-blue-400' :
                      proposal.status === 'passed' ? 'bg-emerald-500/100/20 text-emerald-400' :
                      'bg-red-500/100/20 text-red-400'
                    }`}>
                      {proposal.status}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">For: {proposal.votes.yes.toLocaleString()}</span>
                      <span className="text-gray-400">Against: {proposal.votes.no.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-l-full"
                        style={{ width: `${(proposal.votes.yes / (proposal.votes.yes + proposal.votes.no)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{proposal.endsIn}</span>
                    {proposal.status === 'active' && (
                      <div className="flex space-x-2">
                        <button className="px-4 py-1.5 bg-emerald-400 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700">
                          Vote For
                        </button>
                        <button className="px-4 py-1.5 bg-gray-200 text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-300">
                          Against
                        </button>
                      </div>
                    )}
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
