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
  connect: (fallbackToLocal?: boolean | unknown) => Promise<void>;
  connectLocal: (customName?: string) => void;
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
    void connect();
  }, []);

  const DEMO_ACCOUNTS: WalletAccount[] = [
    {
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      name: 'Wicked (Belizean Citizen #001)',
      source: 'sovereign-local',
    },
    {
      address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      name: 'Bob (Treasury Relayer)',
      source: 'sovereign-local',
    },
  ];

  const connectLocal = (customName: string = 'Wicked (Belizean Citizen #001)') => {
    setAccounts(DEMO_ACCOUNTS);
    setSelectedAccount(DEMO_ACCOUNTS[0]);
    setIsConnected(true);
    setError(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedWalletAddress', DEMO_ACCOUNTS[0].address);
      localStorage.setItem('walletMode', 'sovereign-local');
    }
  };

  const connect = async (fallbackToLocal: boolean | unknown = true) => {
    const shouldFallback = typeof fallbackToLocal === 'boolean' ? fallbackToLocal : true;
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection is only available in the browser.');
      }

      // Check if user previously chosen sovereign-local
      const savedMode = localStorage.getItem('walletMode');
      if (savedMode === 'sovereign-local' && !shouldFallback) {
        connectLocal();
        return;
      }

      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
      // Enable Polkadot extension
      const extensions = await web3Enable('Maya Wallet');
      
      if (extensions.length === 0) {
        if (shouldFallback) {
          console.info('No extension found. Connecting as Sovereign Citizen Local session.');
          connectLocal();
          return;
        }
        throw new Error(
          'No Polkadot wallet extension found. Please install Polkadot.js extension.'
        );
      }

      // Get accounts from extension
      const allAccounts = await web3Accounts();
      
      if (allAccounts.length === 0) {
        if (shouldFallback) {
          connectLocal();
          return;
        }
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
      const savedAddress = typeof window !== 'undefined' ? localStorage.getItem('selectedWalletAddress') : null;
      const targetAccount = walletAccounts.find(acc => acc.address === savedAddress) || walletAccounts[0];
      setSelectedAccount(targetAccount);
      setIsConnected(true);
      
      // Save to localStorage
      if (typeof window !== 'undefined' && targetAccount) {
        localStorage.setItem('selectedWalletAddress', targetAccount.address);
        localStorage.setItem('walletMode', 'extension');
      }
    } catch (err) {
      console.warn('Wallet extension connection fallback triggered:', err);
      if (shouldFallback) {
        connectLocal();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to connect wallet');
        setIsConnected(false);
      }
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
    connectLocal,
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
