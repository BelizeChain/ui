'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge, useWallet, useI18n } from '@belizechain/shared';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import {
  ArrowLeft,
  MagnifyingGlass,
  FunnelSimple,
  ArrowUp,
  ArrowDown,
  Clock,
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
  const { selectedAccount } = useWallet();
  const { t } = useI18n();
  const account = selectedAccount as InjectedAccountWithMeta;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sent' | 'received'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account?.address) {
      loadTransactionHistory();
    }
  }, [account?.address]);

  const loadTransactionHistory = async () => {
    if (!account?.address) return;

    setLoading(true);
    try {
      // Load real blockchain transaction history
      const { fetchTransactionHistory } = await import('@/services/blockchain');
      const txs = await fetchTransactionHistory(account.address, 100);
      
      // Convert blockchain transactions to UI format
      const formattedTxs: Transaction[] = txs.map((tx, index) => ({
        id: tx.hash || `tx-${index}`,
        type: tx.type === 'send' ? 'sent' : 'received',
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        currency: tx.currency,
        timestamp: tx.timestamp,
        status: tx.status === 'success' ? 'completed' : tx.status as any,
        fee: tx.fee || '0.01',
        blockNumber: tx.blockNumber,
        note: tx.note,
      }));
      
      setTransactions(formattedTxs);
      console.log('Transaction history loaded', formattedTxs.length);
    } catch (error) {
      console.error('Failed to load transaction history', error);
      // Fall back to empty array on error
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (rawAmount: string): string => {
    // DALLA has 12 decimals
    const divisor = 1_000_000_000_000;
    const amount = parseInt(rawAmount, 10) / divisor;
    return amount.toFixed(2);
  };

  if (!account) {
    router.push('/');
    return null;
  }

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesSearch =
      searchQuery === '' ||
      (tx.from?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.to?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.note?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Calculate stats
  const totalSent = transactions
    .filter((tx) => tx.type === 'sent')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  const totalReceived = transactions
    .filter((tx) => tx.type === 'received')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-200 px-4 py-4">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.push('/')}
            className="mr-3 text-bluehole-700 hover:text-bluehole-900"
          >
            <ArrowLeft size={24} weight="bold" />
          </button>
          <h1 className="text-xl font-semibold text-bluehole-900">Transaction History</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlass
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-bluehole-400"
          />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-caribbean-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 grid grid-cols-2 gap-3 mb-4">
        <Card className="bg-jungle-50 border-jungle-200">
          <div className="flex items-center space-x-2 mb-1">
            <ArrowDown size={16} className="text-jungle-600" />
            <span className="text-sm text-jungle-700">{t.wallet.receive}d</span>
          </div>
          <p className="text-2xl font-bold text-jungle-900">
            ${totalReceived.toFixed(2)}
          </p>
        </Card>
        <Card className="bg-caribbean-50 border-caribbean-200">
          <div className="flex items-center space-x-2 mb-1">
            <ArrowUp size={16} className="text-caribbean-400" />
            <span className="text-sm text-caribbean-500">{t.wallet.send}</span>
          </div>
          <p className="text-2xl font-bold text-caribbean-900">
            ${totalSent.toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="px-4 mb-4">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <FunnelSimple size={20} className="text-bluehole-600 flex-shrink-0" />
          {(['all', 'sent', 'received'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterType === type
                  ? 'bg-caribbean-500 text-white'
                  : 'bg-gray-800 text-bluehole-700 border border-gray-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-4 pb-6 space-y-3">
        {filteredTransactions.length === 0 ? (
          <Card className="text-center py-12">
            <Clock size={48} className="mx-auto mb-3 text-bluehole-400" />
            <p className="text-bluehole-700 font-medium">No transactions found</p>
            <p className="text-sm text-bluehole-600 mt-1">
              {searchQuery ? 'Try a different search' : 'Your transactions will appear here'}
            </p>
          </Card>
        ) : (
          filteredTransactions.map((tx) => (
            <TransactionCard key={tx.id} transaction={tx} />
          ))
        )}
      </div>
    </div>
  );
}

interface TransactionCardProps {
  transaction: Transaction;
}

function TransactionCard({ transaction }: TransactionCardProps) {
  const isReceived = transaction.type === 'received';
  const timeAgo = formatTimeAgo(transaction.timestamp);
  const fullDate = new Date(transaction.timestamp).toLocaleString();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Icon */}
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isReceived
                ? 'bg-jungle-100 text-jungle-600'
                : 'bg-caribbean-100 text-caribbean-400'
            }`}
          >
            {isReceived ? (
              <ArrowDown size={20} weight="bold" />
            ) : (
              <ArrowUp size={20} weight="bold" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <p className="font-medium text-bluehole-900 truncate">
                {isReceived ? transaction.from : transaction.to}
              </p>
              <p
                className={`font-semibold text-lg flex-shrink-0 ml-2 ${
                  isReceived ? 'text-jungle-600' : 'text-bluehole-900'
                }`}
              >
                {isReceived ? '+' : '-'}${transaction.amount}
              </p>
            </div>

            <div className="flex items-center space-x-2 flex-wrap">
              <Badge
                variant={transaction.status === 'completed' ? 'success' : 'warning'}
                className="text-xs"
              >
                {transaction.currency}
              </Badge>
              <span className="text-xs text-bluehole-500" title={fullDate}>
                {timeAgo}
              </span>
              {transaction.blockNumber && (
                <span className="text-xs text-bluehole-400">
                  Block #{transaction.blockNumber}
                </span>
              )}
            </div>

            {transaction.note && (
              <p className="text-sm text-bluehole-600 mt-1 italic">"{transaction.note}"</p>
            )}
          </div>
        </div>
      </div>
    </Card>
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
