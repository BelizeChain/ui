/**
 * Wallet Store - Zustand State Management
 * 
 * Manages:
 * - Polkadot.js extension accounts
 * - Selected account
 * - Account balances (DALLA + bBZD)
 * - Wallet connection status
 * - Account switching
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

interface WalletState {
  // Accounts
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  
  // Extension status
  extensionAvailable: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Balances
  balances: {
    dalla: string;
    bBZD: string;
    locked: string;
    reserved: string;
  };
  
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  selectAccount: (account: InjectedAccountWithMeta) => void;
  setBalances: (balances: Partial<WalletState['balances']>) => void;
  refreshAccounts: () => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      accounts: [],
      selectedAccount: null,
      extensionAvailable: false,
      isConnecting: false,
      error: null,
      balances: {
        dalla: '0',
        bBZD: '0',
        locked: '0',
        reserved: '0',
      },
      
      // Connect to Polkadot.js extension
      connectWallet: async () => {
        set({ isConnecting: true, error: null });
        
        try {
          // Check if extension is available
          if (typeof window === 'undefined') {
            throw new Error('Must be called in browser environment');
          }
          
          const { web3Accounts, web3Enable } = await import('@polkadot/extension-dapp');
          
          // Request access to extension
          const extensions = await web3Enable('Blue Hole Portal');
          
          if (extensions.length === 0) {
            throw new Error(
              'No Polkadot.js extension found. Please install Polkadot.js extension.'
            );
          }
          
          // Get all accounts
          const allAccounts = await web3Accounts();
          
          if (allAccounts.length === 0) {
            throw new Error(
              'No accounts found. Please create an account in Polkadot.js extension.'
            );
          }
          
          // Select first account if none selected
          const currentAccount = get().selectedAccount;
          const selectedAccount = currentAccount && allAccounts.find(
            (acc) => acc.address === currentAccount.address
          ) || allAccounts[0];
          
          set({
            accounts: allAccounts,
            selectedAccount,
            extensionAvailable: true,
            isConnecting: false,
            error: null,
          });
          
          console.log(`✅ Connected wallet: ${allAccounts.length} accounts found`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
          set({
            extensionAvailable: false,
            isConnecting: false,
            error: errorMessage,
          });
          console.error('❌ Wallet connection failed:', error);
        }
      },
      
      // Disconnect wallet
      disconnectWallet: () => {
        set({
          accounts: [],
          selectedAccount: null,
          extensionAvailable: false,
          error: null,
          balances: {
            dalla: '0',
            bBZD: '0',
            locked: '0',
            reserved: '0',
          },
        });
        console.log('🔌 Wallet disconnected');
      },
      
      // Select account
      selectAccount: (account: InjectedAccountWithMeta) => {
        set({ selectedAccount: account });
        console.log(`👤 Selected account: ${account.meta.name || account.address}`);
        
        // Reset balances when switching accounts
        set({
          balances: {
            dalla: '0',
            bBZD: '0',
            locked: '0',
            reserved: '0',
          },
        });
      },
      
      // Update balances
      setBalances: (newBalances: Partial<WalletState['balances']>) => {
        set((state) => ({
          balances: {
            ...state.balances,
            ...newBalances,
          },
        }));
      },
      
      // Refresh accounts from extension
      refreshAccounts: async () => {
        const { connectWallet } = get();
        await connectWallet();
      },
    }),
    {
      name: 'blue-hole-wallet',
      // Only persist selected account address (not full account object)
      partialize: (state) => ({
        selectedAccountAddress: state.selectedAccount?.address,
      }),
    }
  )
);

// Helper hook for wallet connection status
export function useWalletConnection() {
  const {
    selectedAccount,
    extensionAvailable,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
  } = useWalletStore();
  
  return {
    isConnected: !!selectedAccount && extensionAvailable,
    selectedAccount,
    isConnecting,
    error,
    connect: connectWallet,
    disconnect: disconnectWallet,
  };
}

// Helper hook for account balances
export function useAccountBalances() {
  const { balances, selectedAccount } = useWalletStore();
  
  return {
    balances,
    address: selectedAccount?.address || null,
    hasBalances: parseFloat(balances.dalla) > 0 || parseFloat(balances.bBZD) > 0,
  };
}
