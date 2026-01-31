'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChartBar,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Users,
  ShoppingCart,
  Handshake,
  CalendarBlank,
  FunnelSimple,
  Spinner
} from 'phosphor-react';
import { useWallet } from '@belizechain/shared';
import { TransactionIndexer, type Transaction } from '@belizechain/shared';
import { initializeApi } from '@/services/blockchain';

export default function ActivityPage() {
  const router = useRouter();
  const { selectedAccount } = useWallet();
  const [activeFilter, setActiveFilter] = useState<'all' | 'sent' | 'received' | 'staking'>('all');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [selectedAccount, activeFilter]);

  async function loadTransactions() {
    if (!selectedAccount?.address) {
      setError('No wallet connected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const api = await initializeApi();
      const indexer = new TransactionIndexer(api);
      
      const txs = await indexer.getAccountHistory(selectedAccount.address, {
        type: activeFilter,
        limit: 100,
      });
      
      setTransactions(txs);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transaction history. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Calculate stats from real transactions
  const stats = React.useMemo(() => {
    const sent = transactions
      .filter(tx => tx.from === selectedAccount?.address && tx.type === 'transfer')
      .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
    
    const received = transactions
      .filter(tx => tx.to === selectedAccount?.address && (tx.type === 'transfer' || tx.type === 'reward'))
      .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
    
    const stakingRewards = transactions
      .filter(tx => tx.type === 'reward')
      .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
    
    return {
      totalSent: sent.toFixed(2) + ' DALLA',
      totalReceived: received.toFixed(2) + ' DALLA',
      stakingRewards: stakingRewards.toFixed(2) + ' DALLA',
      transactionCount: transactions.length,
    };
  }, [transactions, selectedAccount]);
  // Helper to format relative time
  function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) return new Date(timestamp).toLocaleDateString();
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  // Helper to get transaction icon
  function getTransactionIcon(tx: Transaction) {
    const isSent = tx.from === selectedAccount?.address;
    
    switch (tx.type) {
      case 'transfer':
        return isSent ? <ArrowUpRight size={20} weight="bold" /> : <ArrowDownLeft size={20} weight="bold" />;
      case 'staking':
        return <Coins size={20} weight="fill" />;
      case 'governance':
        return <Handshake size={20} weight="fill" />;
      case 'merchant':
        return <ShoppingCart size={20} weight="fill" />;
      case 'reward':
        return <ArrowDownLeft size={20} weight="bold" />;
      default:
        return <ArrowUpRight size={20} weight="bold" />;
    }
  }

  // Helper to get transaction display text
  function getTransactionDisplay(tx: Transaction): { label: string; color: string } {
    const isSent = tx.from === selectedAccount?.address;
    
    if (tx.type === 'staking') {
      return { label: tx.metadata?.description || 'Staking', color: 'text-purple-400' };
    }
    if (tx.type === 'reward') {
      return { label: tx.metadata?.description || 'Reward', color: 'text-emerald-400' };
    }
    if (isSent) {
      return { label: `To ${tx.to.slice(0, 8)}...${tx.to.slice(-6)}`, color: 'text-red-400' };
    }
    return { label: `From ${tx.from.slice(0, 8)}...${tx.from.slice(-6)}`, color: 'text-emerald-400' };
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
              <h1 className="text-xl font-bold text-white">Activity History</h1>
              <p className="text-xs text-gray-400">{stats.transactionCount} transactions</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-500 to-emerald-400 flex items-center justify-center">
            <ChartBar size={20} className="text-white" weight="fill" />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex px-4 gap-2 pb-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'sent', label: 'Sent' },
            { id: 'received', label: 'Received' },
            { id: 'staking', label: 'Staking' }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? 'bg-forest-500 text-white'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Overview */}
        <GlassCard variant="gradient" blur="lg" className="p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/80 text-xs mb-1">Total Sent</p>
              <p className="text-white font-bold text-lg">{stats.totalSent}</p>
            </div>
            <div>
              <p className="text-white/80 text-xs mb-1">Total Received</p>
              <p className="text-white font-bold text-lg">{stats.totalReceived}</p>
            </div>
            <div>
              <p className="text-white/80 text-xs mb-1">Staking Rewards</p>
              <p className="text-white font-bold text-lg">{stats.stakingRewards}</p>
            </div>
            <div>
              <p className="text-white/80 text-xs mb-1">Transactions</p>
              <p className="text-white font-bold text-lg">{stats.transactionCount}</p>
            </div>
          </div>
        </GlassCard>

        {/* Time Filter */}
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-semibold text-gray-300">Recent Activity</h3>
          <button
            onClick={loadTransactions}
            className="text-sm font-medium text-forest-400 hover:text-forest-300 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} className="text-forest-400 animate-spin" />
            <p className="ml-3 text-gray-400">Loading transactions...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <GlassCard variant="dark" blur="sm" className="p-4">
            <p className="text-red-400 text-center">{error}</p>
          </GlassCard>
        )}

        {/* Activity List */}
        {!loading && !error && transactions.length === 0 && (
          <GlassCard variant="dark" blur="sm" className="p-8">
            <p className="text-gray-400 text-center">No transactions found</p>
            <p className="text-gray-500 text-sm text-center mt-2">
              Your transaction history will appear here
            </p>
          </GlassCard>
        )}

        {!loading && !error && transactions.length > 0 && (
          <div className="space-y-3">
            {transactions.map((tx, index) => {
              const display = getTransactionDisplay(tx);
              const isSent = tx.from === selectedAccount?.address;
              
              return (
                <GlassCard key={tx.hash || index} variant="dark" blur="sm" className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isSent && tx.type === 'transfer' ? 'bg-red-100' :
                        tx.type === 'reward' || (!isSent && tx.type === 'transfer') ? 'bg-emerald-100' :
                        'bg-purple-100'
                      }`}>
                        <div className={
                          isSent && tx.type === 'transfer' ? 'text-red-400' :
                          tx.type === 'reward' || (!isSent && tx.type === 'transfer') ? 'text-emerald-400' :
                          'text-purple-400'
                        }>
                          {getTransactionIcon(tx)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {display.label}
                        </p>
                        <p className="text-xs text-gray-400">{formatRelativeTime(tx.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${display.color}`}>
                        {isSent && tx.type === 'transfer' ? '-' : '+'}{tx.amount} {tx.asset}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{tx.type}</p>
                    </div>
                  </div>
                  {tx.status === 'failed' && (
                    <div className="mt-2 px-2 py-1 bg-red-900/30 border border-red-700/50 rounded text-xs text-red-400">
                      Transaction failed
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* Export Button */}
        <button 
          onClick={() => {
            // TODO: Implement CSV export
            alert('Export functionality coming soon!');
          }}
          className="w-full py-3 bg-gray-900/70 border-2 border-forest-500 hover:bg-forest-50 text-forest-400 hover:text-forest-600 font-semibold rounded-xl transition-all"
        >
          Export Activity Report
        </button>
      </div>
    </div>
  );
}
