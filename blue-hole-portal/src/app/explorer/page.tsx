'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MagnifyingGlass, Cube, ArrowsLeftRight, Clock, Hash, CheckCircle } from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { useRecentBlocks, useBlockNumber } from '@/lib/blockchain/hooks';

function shortenHash(value: string, lead = 10, tail = 8): string {
  if (!value) return '';
  if (value.length <= lead + tail) return value;
  return `${value.slice(0, lead)}...${value.slice(-tail)}`;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr${hours === 1 ? '' : 's'} ago`;
}

export default function ExplorerPage() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState<'blocks' | 'transactions'>('blocks');

  const { blocks, txs, finalizedNumber, loading } = useRecentBlocks(15);
  const { blockNumber: latestBlock } = useBlockNumber();

  // Average block time from the timestamps of recently observed blocks.
  let avgBlockTime = 0;
  if (blocks.length >= 2) {
    const newest = blocks[0].timestamp;
    const oldest = blocks[blocks.length - 1].timestamp;
    avgBlockTime = (newest - oldest) / 1000 / (blocks.length - 1);
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    // Detail routes (block/tx/account) are not built yet; filter the in-memory
    // feed so a search still narrows the visible list instead of 404-ing.
    setActiveTab('transactions');
  };

  const filteredTxs = searchValue.trim()
    ? txs.filter((t) => {
        const q = searchValue.trim().toLowerCase();
        return (
          t.hash.toLowerCase().includes(q) ||
          t.method.toLowerCase().includes(q) ||
          (t.signer?.toLowerCase().includes(q) ?? false) ||
          String(t.block) === q
        );
      })
    : txs;

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
                <p className="text-lg font-bold text-white">
                  {latestBlock ? `#${latestBlock.toLocaleString()}` : '—'}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="dark-medium" blur="lg" className="p-4">
            <div className="flex items-center gap-3">
              <ArrowsLeftRight size={24} className="text-emerald-400" weight="duotone" />
              <div>
                <p className="text-xs text-gray-400">Recent TXs</p>
                <p className="text-lg font-bold text-white">{txs.length}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="dark-medium" blur="lg" className="p-4">
            <div className="flex items-center gap-3">
              <Clock size={24} className="text-purple-400" weight="duotone" />
              <div>
                <p className="text-xs text-gray-400">Avg Block Time</p>
                <p className="text-lg font-bold text-white">
                  {avgBlockTime > 0 ? `${avgBlockTime.toFixed(1)}s` : '—'}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="dark-medium" blur="lg" className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-emerald-400" weight="duotone" />
              <div>
                <p className="text-xs text-gray-400">Finalized</p>
                <p className="text-lg font-bold text-white">
                  {finalizedNumber ? `#${finalizedNumber.toLocaleString()}` : '—'}
                </p>
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
            {loading && blocks.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">Connecting to the network…</p>
            )}
            {!loading && blocks.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No blocks observed yet.</p>
            )}
            {blocks.map((block) => (
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
                      <span className="text-xs text-gray-400">{timeAgo(block.timestamp)}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Hash: </span>
                        <code className="text-blue-400">{shortenHash(block.hash, 18, 0)}</code>
                      </div>
                      <div>
                        <span className="text-gray-400">Validator: </span>
                        <code className="text-emerald-400">
                          {block.author ? shortenHash(block.author) : 'unknown'}
                        </code>
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
            {loading && txs.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">Connecting to the network…</p>
            )}
            {!loading && filteredTxs.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No signed transactions observed yet.</p>
            )}
            {filteredTxs.map((tx) => (
              <GlassCard
                key={`${tx.block}-${tx.index}`}
                variant="dark-medium"
                blur="lg"
                className="p-4 hover:border-blue-500/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Hash size={20} className="text-purple-400" weight="duotone" />
                      <code className="text-sm text-blue-400">{shortenHash(tx.hash, 12, 8)}</code>
                      <CheckCircle size={16} className="text-emerald-400" weight="fill" />
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                        {tx.method}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Block: </span>
                        <span className="text-white font-medium">#{tx.block.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Signer: </span>
                        <code className="text-emerald-400">
                          {tx.signer ? shortenHash(tx.signer) : '—'}
                        </code>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{timeAgo(tx.timestamp)}</p>
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
