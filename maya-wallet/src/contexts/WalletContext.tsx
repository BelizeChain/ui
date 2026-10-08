'use client';

/**
 * Wallet Context Provider
 * Manages user wallet connection and blockchain state
 */

import React, { createContext, useContext, useState, useEffect, useSyncExternalStore, ReactNode } from 'react';
// Defer importing extension APIs to the client at runtime to avoid SSR window access
import { useBalanceSubscription, useNotifications } from '@/hooks/useBlockchainEvents';

/** Stable no-op subscription used with useSyncExternalStore for mount detection. */
const subscribeNoop = () => () => {};

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
  // Mount detection without a state-setting effect
  // (react-hooks/set-state-in-effect): false during SSR, true on the client.
  const isMounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  /**
   * Connect through the Polkadot.js extension.
   *
   * There is deliberately no fallback: this used to call `connectLocal()`, which
   * marked the session connected against the Substrate **dev** accounts
   * (Alice 5GrwvaEF… presented as "Wicked (Belizean Citizen #001)" and Bob as
   * a treasury relayer). Every balance, staking, title and payroll screen then
   * rendered another account's testnet data as the user's. No extension now
   * means no connection.
   */
  const connect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection is only available in the browser.');
      }

      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
      const extensions = await web3Enable('Maya Wallet');

      if (extensions.length === 0) {
        throw new Error(
          'No Polkadot wallet extension found. Install the Polkadot.js extension to connect.'
        );
      }

      const allAccounts = await web3Accounts();

      if (allAccounts.length === 0) {
        throw new Error(
          'No accounts found in your wallet extension. Create an account there, then connect again.'
        );
      }

      const walletAccounts: WalletAccount[] = allAccounts.map(account => ({
        address: account.address,
        name: account.meta.name,
        source: account.meta.source,
      }));

      setAccounts(walletAccounts);
      const savedAddress = localStorage.getItem('selectedWalletAddress');
      const targetAccount = walletAccounts.find(acc => acc.address === savedAddress) || walletAccounts[0];
      setSelectedAccount(targetAccount);
      setIsConnected(true);
      localStorage.setItem('selectedWalletAddress', targetAccount.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      setIsConnected(false);
      setAccounts([]);
      setSelectedAccount(null);
    } finally {
      setIsConnecting(false);
    }
  };

  // Auto-connect on mount if previously connected. Declared after `connect`
  // for the React Compiler's declaration-order check; deferred so connect
  // doesn't set state during the effect body (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    void Promise.resolve().then(() => connect());
  }, []);

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
