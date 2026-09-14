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
  fetchBalances: (address?: string) => Promise<void>;
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
          
          if (selectedAccount?.address) {
            void get().fetchBalances(selectedAccount.address);
          }

          console.log(`[WALLET] Connected wallet: ${allAccounts.length} accounts found`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
          set({
            extensionAvailable: false,
            isConnecting: false,
            error: errorMessage,
          });
          console.error('[WALLET] Wallet connection failed:', error);
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
            dalla: '0.00',
            bBZD: '0.00',
            locked: '0.00',
            reserved: '0.00',
          },
        });
        console.log('[WALLET] Wallet disconnected');
      },
      
      // Select account
      selectAccount: (account: InjectedAccountWithMeta) => {
        set({ selectedAccount: account });
        console.log(`[WALLET] Selected account: ${account.meta.name || account.address}`);
        
        // Reset and trigger refresh of balances for new account
        set({
          balances: {
            dalla: '0.00',
            bBZD: '0.00',
            locked: '0.00',
            reserved: '0.00',
          },
        });
        void get().fetchBalances(account.address);
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

      // Fetch live balances from BelizeChain node
      fetchBalances: async (address?: string) => {
        const targetAddress = address || get().selectedAccount?.address;
        if (!targetAddress) return;
        try {
          const { connectionManager } = await import('@/lib/blockchain/connection');
          const api = await connectionManager.connect();
          if (!api?.query?.system?.account) return;

          const accountInfo: any = await api.query.system.account(targetAddress);
          const data = accountInfo.data;
          const freeBig = BigInt(data.free.toString());
          const dallaNum = Number(freeBig) / 1e12;
          const free = dallaNum.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          const reservedBig = BigInt(data.reserved.toString());
          const reserved = (Number(reservedBig) / 1e12).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          let bBZD = '0.00';
          try {
            if (api.query.belizeEconomy?.bBzdBalances) {
              const bBzdRaw: any = await api.query.belizeEconomy.bBzdBalances(targetAddress);
              if (bBzdRaw) {
                bBZD = (Number(BigInt(bBzdRaw.toString())) / 1e12).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
              }
            }
          } catch {
            // Ignore optional bBZD lookup
          }

          set({
            balances: {
              dalla: free,
              bBZD,
              locked: '0.00',
              reserved,
            },
          });
        } catch (err) {
          console.warn('[WALLET] Failed to fetch balances:', err);
        }
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
