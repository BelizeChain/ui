'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MagnifyingGlass, Cube, ArrowsLeftRight, Clock, Hash, CheckCircle, XCircle } from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';

export default function ExplorerPage() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState<'blocks' | 'transactions'>('blocks');

  // Mock data - replace with real blockchain queries
  const recentBlocks = [
    {
      number: 1234567,
      hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      timestamp: '2 mins ago',
      extrinsics: 8,
      validator: '5GrwvaEF...HGKutQY',
      finalized: true,
    },
    {
      number: 1234566,
      hash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
      timestamp: '8 mins ago',
      extrinsics: 12,
      validator: '5FHnei...9KutQY',
      finalized: true,
    },
    {
      number: 1234565,
      hash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
      timestamp: '14 mins ago',
      extrinsics: 6,
      validator: '5DTestD...MutQY',
      finalized: true,
    },
    {
      number: 1234564,
      hash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
      timestamp: '20 mins ago',
      extrinsics: 15,
      validator: '5GrwvaEF...HGKutQY',
      finalized: true,
    },
  ];

  const recentTransactions = [
    {
      hash: '0xabc123def456...xyz789',
      block: 1234567,
      timestamp: '1 min ago',
      from: '5GrwvaEF...HGKutQY',
      to: '5FHnei...9KutQY',
      value: '1,000 DALLA',
      status: 'success',
      type: 'Transfer',
    },
    {
      hash: '0xdef456abc123...xyz456',
      block: 1234567,
      timestamp: '3 mins ago',
      from: '5DTestD...MutQY',
      to: '5GrwvaEF...HGKutQY',
      value: '500 DALLA',
      status: 'success',
      type: 'Transfer',
    },
    {
      hash: '0xghi789jkl012...xyz123',
      block: 1234566,
      timestamp: '9 mins ago',
      from: '5FHnei...9KutQY',
      to: '5DTestD...MutQY',
      value: '2,500 DALLA',
      status: 'failed',
      type: 'Transfer',
    },
    {
      hash: '0xmno345pqr678...xyz890',
      block: 1234565,
      timestamp: '15 mins ago',
      from: '5GrwvaEF...HGKutQY',
      to: '5FHnei...9KutQY',
      value: '750 DALLA',
      status: 'success',
      type: 'Staking',
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue) {
      // Detect what type of search (block number, hash, address, etc.)
      console.log('Searching for:', searchValue);
    }
  };

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
              <h1 className="text-xl font-bold text-white">Blockchain Explorer</h1>
              <p className="text-xs text-gray-400">Browse blocks and transactions</p>
            </div>
          </div>
          <Cube size={32} className="text-blue-400" weight="duotone" />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by block number, hash, or address..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Search
            </button>
          </form>
        </GlassCard>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard variant="dark-medium" blur="lg" className="p-4">
            <div className="flex items-center gap-3">
              <Cube size={24} className="text-blue-400" weight="duotone" />
              <div>
                <p className="text-xs text-gray-400">Latest Block</p>
                <p className="text-lg font-bold text-white">1,234,567</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="dark-medium" blur="lg" className="p-4">
            <div className="flex items-center gap-3">
              <ArrowsLeftRight size={24} className="text-emerald-400" weight="duotone" />
              <div>
                <p className="text-xs text-gray-400">Total TXs</p>
                <p className="text-lg font-bold text-white">8.2M</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="dark-medium" blur="lg" className="p-4">
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-purple-400" weight="duotone" />
              <div>
                <p className="text-xs text-gray-400">Avg Block Time</p>
                <p className="text-lg font-bold text-white">6.2s</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="dark-medium" blur="lg" className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-emerald-400" weight="duotone" />
              <div>
                <p className="text-xs text-gray-400">Finalized</p>
                <p className="text-lg font-bold text-white">1,234,560</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-700/50">
          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'blocks'
                ? 'text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Recent Blocks
            {activeTab === 'blocks' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'transactions'
                ? 'text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Recent Transactions
            {activeTab === 'transactions' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
            )}
          </button>
        </div>

        {/* Blocks List */}
        {activeTab === 'blocks' && (
          <div className="space-y-3">
            {recentBlocks.map((block) => (
              <GlassCard
                key={block.number}
                variant="dark-medium"
                blur="lg"
                className="p-4 hover:border-blue-500/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Cube size={20} className="text-blue-400" weight="duotone" />
                      <span className="text-lg font-bold text-white">#{block.number.toLocaleString()}</span>
                      {block.finalized && (
                        <CheckCircle size={16} className="text-emerald-400" weight="fill" />
                      )}
                      <span className="text-xs text-gray-400">{block.timestamp}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Hash: </span>
                        <code className="text-blue-400">{block.hash.slice(0, 18)}...</code>
                      </div>
                      <div>
                        <span className="text-gray-400">Validator: </span>
                        <code className="text-emerald-400">{block.validator}</code>
                      </div>
                      <div>
                        <span className="text-gray-400">Extrinsics: </span>
                        <span className="text-white font-medium">{block.extrinsics}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Transactions List */}
        {activeTab === 'transactions' && (
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <GlassCard
                key={tx.hash}
                variant="dark-medium"
                blur="lg"
                className="p-4 hover:border-blue-500/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Hash size={20} className="text-purple-400" weight="duotone" />
                      <code className="text-sm text-blue-400">{tx.hash}</code>
                      {tx.status === 'success' ? (
                        <CheckCircle size={16} className="text-emerald-400" weight="fill" />
                      ) : (
                        <XCircle size={16} className="text-red-400" weight="fill" />
                      )}
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                        {tx.type}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Block: </span>
                        <span className="text-white font-medium">#{tx.block.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">From: </span>
                        <code className="text-emerald-400">{tx.from}</code>
                      </div>
                      <div>
                        <span className="text-gray-400">To: </span>
                        <code className="text-emerald-400">{tx.to}</code>
                      </div>
                      <div>
                        <span className="text-gray-400">Value: </span>
                        <span className="text-white font-medium">{tx.value}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{tx.timestamp}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Load More */}
        <div className="flex justify-center">
          <button className="px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-lg border border-gray-700/50 transition-colors">
            Load More
          </button>
        </div>
      </div>
    </div>
  );
}
