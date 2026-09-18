'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { formatDisplayNumber } from '@/lib/utils';
import {
  ArrowLeft,
  MagnifyingGlass,
  FunnelSimple,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  Warning,
  Copy,
  Check,
  ArrowsLeftRight,
} from 'phosphor-react';

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  from?: string;
  to?: string;
  amount: string;
  currency: 'DALLA' | 'bBZD';
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  note?: string;
  fee: string;
  blockNumber?: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();
  const account = selectedAccount as any;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sent' | 'received'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account?.address) {
      loadTransactionHistory();
    }
  }, [account?.address]);

  useEffect(() => {
    if (!isConnected && !account) {
      router.replace('/');
    }
  }, [isConnected, account, router]);

  const loadTransactionHistory = async () => {
    if (!account?.address) return;

    setLoading(true);
    try {
      const { fetchTransactionHistory } = await import('@/services/blockchain');
      const txs = await fetchTransactionHistory(account.address, 100);

      const formattedTxs: Transaction[] = txs.map((tx, index) => ({
        id: tx.hash || `tx-${index}`,
        type: tx.type === 'send' ? 'sent' : 'received',
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        currency: tx.currency,
        timestamp: tx.timestamp,
        status: tx.status === 'success' ? 'completed' : (tx.status as any),
        fee: tx.fee || '0.01',
        blockNumber: tx.blockNumber,
        note: tx.note,
      }));

      setTransactions(formattedTxs);
    } catch (error) {
      console.error('Failed to load transaction history', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return null;
  }

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesSearch =
      searchQuery === '' ||
      tx.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Calculate stats
  const totalSent = transactions
    .filter((tx) => tx.type === 'sent')
    .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
  const totalReceived = transactions
    .filter((tx) => tx.type === 'received')
    .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#030914] to-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={18} weight="bold" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Transaction History</h1>
                <p className="text-xs text-slate-400 font-mono">
                  {account?.address?.slice(0, 8)}...{account?.address?.slice(-6)}
                </p>
              </div>
            </div>

            <button
              onClick={loadTransactionHistory}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all font-medium"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Search input */}
          <div className="relative">
            <MagnifyingGlass
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              placeholder="Search by address, hash, or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-900 border border-emerald-500/20 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400">Total Received</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ArrowDown size={16} weight="bold" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-white tracking-tight">
              +{formatDisplayNumber(totalReceived)} <span className="text-xs text-emerald-400 font-mono">Ɗ</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-900/60 to-slate-900 border border-cyan-500/20 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-cyan-400">Total Sent</span>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ArrowUp size={16} weight="bold" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-white tracking-tight">
              -{formatDisplayNumber(totalSent)} <span className="text-xs text-cyan-400 font-mono">Ɗ</span>
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <FunnelSimple size={16} className="text-slate-500 shrink-0 ml-1" />
          {(['all', 'sent', 'received'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                filterType === type
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold shadow-md shadow-cyan-500/10'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {type === 'all' ? 'All Activity' : type === 'sent' ? 'Sent' : 'Received'}
            </button>
          ))}
          <span className="text-[11px] text-slate-500 ml-auto hidden sm:inline">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
          </span>
        </div>

        {/* Transaction List */}
        <div className="space-y-3 pb-8">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
              <Clock size={40} className="mx-auto mb-3 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No transactions found</p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? 'Try matching another address or hash' : 'Your sovereign on-chain transactions will appear here'}
              </p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} userAddress={account?.address} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface TransactionRowProps {
  transaction: Transaction;
  userAddress?: string;
}

function TransactionRow({ transaction, userAddress }: TransactionRowProps) {
  const isReceived = transaction.type === 'received';
  const timeAgo = formatTimeAgo(transaction.timestamp);
  const fullDate = new Date(transaction.timestamp).toLocaleString();
  const [copied, setCopied] = useState(false);

  const displayAddr = isReceived ? transaction.from : transaction.to;

  const copyHash = () => {
    if (transaction.id) {
      navigator.clipboard.writeText(transaction.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/30 transition-all backdrop-blur-xl shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isReceived
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}
          >
            {isReceived ? (
              <ArrowDown size={18} weight="bold" />
            ) : (
              <ArrowUp size={18} weight="bold" />
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {isReceived ? 'Received from' : 'Sent to'}
              </span>
              <span className="text-xs text-slate-400 font-mono truncate max-w-[160px] sm:max-w-[240px]">
                {displayAddr || 'BelizeChain Runtime'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  transaction.status === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                {transaction.status === 'completed' ? 'Confirmed' : 'Pending'}
              </span>

              <span className="text-[11px] text-slate-500" title={fullDate}>
                {timeAgo}
              </span>

              {transaction.blockNumber && (
                <span className="text-[11px] text-slate-500 font-mono">
                  #{transaction.blockNumber}
                </span>
              )}

              <button
                onClick={copyHash}
                className="text-[11px] text-slate-500 hover:text-cyan-400 flex items-center gap-1 font-mono transition-colors"
                title="Copy Transaction Hash"
              >
                {copied ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Copy size={12} />
                )}
                <span>{transaction.id.slice(0, 6)}...</span>
              </button>
            </div>

            {transaction.note && (
              <p className="text-xs text-slate-400 mt-2 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                "{transaction.note}"
              </p>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p
            className={`text-sm md:text-base font-bold font-mono ${
              isReceived ? 'text-emerald-400' : 'text-white'
            }`}
          >
            {isReceived ? '+' : '-'}{parseFloat(transaction.amount || '0').toFixed(2)} {transaction.currency === 'bBZD' ? 'bBZD' : 'Ɗ'}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">
            Fee: {transaction.fee} Ɗ
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
