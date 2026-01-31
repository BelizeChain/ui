'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, Warning, CircleNotch, X, ArrowSquareOut } from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

export interface Transaction {
  id: string;
  type: 'vote' | 'approval' | 'nomination' | 'proposal' | 'transfer' | 'other';
  status: 'pending' | 'success' | 'error';
  message: string;
  txHash?: string;
  error?: string;
  timestamp: number;
  retryFn?: () => Promise<void>;
}

interface TransactionContextValue {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => string;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  clearCompleted: () => void;
}

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
}

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newTx: Transaction = {
      ...tx,
      id,
      timestamp: Date.now(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    return id;
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    );
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setTransactions((prev) => prev.filter((tx) => tx.status === 'pending'));
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction,
        removeTransaction,
        clearCompleted,
      }}
    >
      {children}
      <TransactionToasts transactions={transactions} onRemove={removeTransaction} />
    </TransactionContext.Provider>
  );
}

interface TransactionToastsProps {
  transactions: Transaction[];
  onRemove: (id: string) => void;
}

function TransactionToasts({ transactions, onRemove }: TransactionToastsProps) {
  // Show only last 5 transactions
  const visibleTransactions = transactions.slice(0, 5);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-md">
      {visibleTransactions.map((tx) => (
        <TransactionToast key={tx.id} transaction={tx} onRemove={() => onRemove(tx.id)} />
      ))}
    </div>
  );
}

interface TransactionToastProps {
  transaction: Transaction;
  onRemove: () => void;
}

function TransactionToast({ transaction, onRemove }: TransactionToastProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (transaction.retryFn) {
      setIsRetrying(true);
      try {
        await transaction.retryFn();
      } catch (error) {
        console.error('Retry failed:', error);
      } finally {
        setIsRetrying(false);
      }
    }
  };

  const getIcon = () => {
    if (transaction.status === 'pending' || isRetrying) {
      return <CircleNotch size={24} className="text-blue-400 animate-spin" weight="bold" />;
    }
    if (transaction.status === 'success') {
      return <CheckCircle size={24} className="text-emerald-400" weight="fill" />;
    }
    return <Warning size={24} className="text-red-400" weight="fill" />;
  };

  const getBorderColor = () => {
    if (transaction.status === 'pending' || isRetrying) return 'border-blue-500/30';
    if (transaction.status === 'success') return 'border-emerald-500/30';
    return 'border-red-500/30';
  };

  const getBackgroundColor = () => {
    if (transaction.status === 'pending' || isRetrying) return 'bg-blue-500/10';
    if (transaction.status === 'success') return 'bg-emerald-500/10';
    return 'bg-red-500/10';
  };

  return (
    <GlassCard
      variant="dark-medium"
      blur="lg"
      className={cn(
        'p-4 border animate-slide-in-right',
        getBorderColor(),
        getBackgroundColor()
      )}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white mb-1">{transaction.message}</p>
          {transaction.error && (
            <p className="text-xs text-red-400 mb-2">{transaction.error}</p>
          )}
          {transaction.txHash && (
            <a
              href={`/explorer/tx/${transaction.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              View Transaction
              <ArrowSquareOut size={14} weight="bold" />
            </a>
          )}
          {transaction.status === 'error' && transaction.retryFn && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="mt-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          )}
        </div>
        <button
          onClick={onRemove}
          className="p-1 hover:bg-gray-700/50 rounded transition-colors"
        >
          <X size={16} className="text-gray-400" weight="bold" />
        </button>
      </div>
    </GlassCard>
  );
}
