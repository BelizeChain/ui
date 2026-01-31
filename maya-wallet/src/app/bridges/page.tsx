'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import * as interopService from '@/services/pallets/interoperability';
import {
  GitBranch,
  ArrowsLeftRight,
  CheckCircle,
  Clock,
  Warning,
  CurrencyDollar,
  Users,
  ArrowLeft
} from 'phosphor-react';

export default function BridgesPage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();
  
  const [activeTab, setActiveTab] = useState<'transfer' | 'history' | 'validators'>('transfer');
  const [fromChain, setFromChain] = useState('belizechain');
  const [toChain, setToChain] = useState('ethereum');
  const [amount, setAmount] = useState('');
  
  const [bridges, setBridges] = useState<interopService.Bridge[]>([]);
  const [transfers, setTransfers] = useState<interopService.BridgeTransfer[]>([]);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [validators, setValidators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

  // Fetch bridges and transfers from blockchain
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const bridgesData = await interopService.getBridges();
        setBridges(bridgesData);
        
        if (selectedAccount) {
          const transfersData = await interopService.getUserBridgeTransfers(selectedAccount.address);
          setTransfers(transfersData);
        }
      } catch (err: any) {
        console.error('Failed to fetch bridge data:', err);
        setError(err.message || 'Unable to load bridge data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedAccount]);

  // Calculate stats from real data
  const bridgeStats = {
    totalTransfers: transfers.length,
    totalVolume: transfers.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0).toFixed(2) + ' DALLA',
    successRate: transfers.length > 0 
      ? ((transfers.filter(t => t.status === 'Completed').length / transfers.length) * 100).toFixed(1) + '%'
      : '0%',
    avgTime: bridges.length > 0
      ? (bridges.reduce((sum, b) => sum + b.estimatedTime, 0) / bridges.length).toFixed(1) + ' min'
      : '0 min'
  };

  const chains = [
    { id: 'belizechain', name: 'BelizeChain', color: 'emerald' },
    { id: 'ethereum', name: 'Ethereum', color: 'blue' },
    { id: 'polkadot', name: 'Polkadot', color: 'pink' }
  ];

  if (loading) {
    return <LoadingSpinner message="Loading bridge data from blockchain..." fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Bridges</h1>
              <p className="text-xs text-gray-400">Cross-Chain Interoperability</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GitBranch size={32} className="text-blue-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Transfers</p>
              <p className="text-2xl font-bold text-white">{bridgeStats.totalTransfers}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-emerald-400">{bridgeStats.successRate}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="dark-medium" blur="lg" className="p-1">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('transfer')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'transfer'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-700/30'
              }`}
            >
              Transfer
            </button>
            <button
              onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('validators')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'validators'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            Validators
          </button>
          </div>
        </GlassCard>
      </div>

      <div className="px-4 space-y-4">
        {activeTab === 'transfer' && (
          <>
            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Bridge Transfer</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-300 mb-2 block">From Chain</label>
                  <select
                    value={fromChain}
                    onChange={(e) => setFromChain(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-gray-700/30 text-white rounded-lg outline-none focus:border-blue-500"
                  >
                    {chains.map(chain => (
                      <option key={chain.id} value={chain.id}>{chain.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center">
                  <button className="p-2 bg-blue-100 rounded-full">
                    <ArrowsLeftRight size={20} className="text-blue-400" weight="bold" />
                  </button>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-300 mb-2 block">To Chain</label>
                  <select
                    value={toChain}
                    onChange={(e) => setToChain(e.target.value)}
                    className="w-full p-3 bg-gray-800/50 border border-gray-700/30 text-white rounded-lg outline-none focus:border-blue-500"
                  >
                    {chains.filter(c => c.id !== fromChain).map(chain => (
                      <option key={chain.id} value={chain.id}>{chain.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-300 mb-2 block">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-3 bg-gray-200 border border-gray-700 rounded-lg outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">DALLA</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h4 className="font-bold text-white mb-3">Transfer Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Bridge Fee</span>
                  <span className="font-semibold text-white">0.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Estimated Time</span>
                  <span className="font-semibold text-white">~4.2 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Min. Amount</span>
                  <span className="font-semibold text-white">100 DALLA</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Validator Threshold</span>
                  <span className="font-semibold text-white">14 of 21</span>
                </div>
              </div>
            </GlassCard>

            <button className="w-full flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded-xl shadow-lg">
              <GitBranch size={20} weight="fill" />
              <span className="font-semibold">Initiate Transfer</span>
            </button>
          </>
        )}

        {activeTab === 'history' && (
          <>
            {transferHistory.map((transfer) => (
              <GlassCard key={transfer.id} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white mb-1">{transfer.amount}</h3>
                    <p className="text-xs text-gray-400">{transfer.id}</p>
                  </div>
                  <span className={`px-2 py-0.5 ${transfer.status === 'completed' ? 'bg-emerald-500/100/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'} text-xs rounded-full font-semibold`}>
                    {transfer.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3 p-2 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                  <span className="text-sm font-semibold text-white">{transfer.from}</span>
                  <ArrowsLeftRight size={16} className="text-gray-400" />
                  <span className="text-sm font-semibold text-white">{transfer.to}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Transfer Time</p>
                    <p className="font-semibold text-white">{transfer.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400">Date</p>
                    <p className="font-semibold text-white">{transfer.date}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </>
        )}

        {activeTab === 'validators' && (
          <>
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Active Validators</p>
                  <p className="text-2xl font-bold text-white">21</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Avg Uptime</p>
                  <p className="text-2xl font-bold text-emerald-400">99.8%</p>
                </div>
              </div>
            </GlassCard>

            {validators.map((validator, index) => (
              <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white mb-1">{validator.name}</h3>
                    <p className="text-xs font-mono text-gray-400">{validator.address}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/100/20 text-emerald-400 text-xs rounded-full font-semibold">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Uptime</p>
                    <p className="font-semibold text-white">{validator.uptime}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Signatures</p>
                    <p className="font-semibold text-white">{validator.signed}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
