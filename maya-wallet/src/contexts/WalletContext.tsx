'use client';

/**
 * Wallet Context Provider
 * Manages user wallet connection and blockchain state
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Defer importing extension APIs to the client at runtime to avoid SSR window access
import { useBalanceSubscription, useNotifications } from '@/hooks/useBlockchainEvents';

interface WalletAccount {
  address: string;
  name?: string;
  source: string;
}

interface WalletContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Account data
  accounts: WalletAccount[];
  selectedAccount: WalletAccount | null;
  
  // Balance data
  balance: {
    dalla: string;
    bBZD: string;
    total: string;
  } | null;
  balanceLoading: boolean;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
  }>;
  unreadNotifications: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  selectAccount: (address: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only run on client-side to avoid SSR issues
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<WalletAccount | null>(null);

  // Subscribe to balance for selected account
  const { balance, isLoading: balanceLoading } = useBalanceSubscription(
    isMounted ? (selectedAccount?.address || null) : null
  );

  // Subscribe to notifications for selected account
  const {
    notifications,
    unreadCount: unreadNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
  } = useNotifications(isMounted ? (selectedAccount?.address || null) : null);

  // Auto-connect on mount if previously connected
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedAddress = localStorage.getItem('selectedWalletAddress');
    if (savedAddress) {
      connect().then(() => {
        const account = accounts.find(acc => acc.address === savedAddress);
        if (account) {
          setSelectedAccount(account);
        }
      });
    }
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection is only available in the browser.');
      }

      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
      // Enable Polkadot extension
      const extensions = await web3Enable('Maya Wallet');
      
      if (extensions.length === 0) {
        throw new Error(
          'No Polkadot wallet extension found. Please install Polkadot.js extension.'
        );
      }

      // Get accounts from extension
      const allAccounts = await web3Accounts();
      
      if (allAccounts.length === 0) {
        throw new Error(
          'No accounts found in wallet. Please create an account in your Polkadot.js extension.'
        );
      }

      const walletAccounts: WalletAccount[] = allAccounts.map(account => ({
        address: account.address,
        name: account.meta.name,
        source: account.meta.source,
      }));

      setAccounts(walletAccounts);
      setSelectedAccount(walletAccounts[0]); // Auto-select first account
      setIsConnected(true);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedWalletAddress', walletAccounts[0].address);
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccounts([]);
    setSelectedAccount(null);
    setIsConnected(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selectedWalletAddress');
    }
  };

  const selectAccount = (address: string) => {
    const account = accounts.find(acc => acc.address === address);
    if (account) {
      setSelectedAccount(account);
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedWalletAddress', address);
      }
    }
  };

  const value: WalletContextType = {
    isConnected,
    isConnecting,
    error,
    accounts,
    selectedAccount,
    balance,
    balanceLoading,
    notifications,
    unreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    connect,
    disconnect,
    selectAccount,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
