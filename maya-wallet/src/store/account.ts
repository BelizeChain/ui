import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BelizeAccount, Balance } from '@belizechain/shared';

// Lazy import blockchain service to avoid SSR issues with Polkadot
let blockchainService: any = null;
const getBlockchainService = async () => {
  if (!blockchainService) {
    blockchainService = await import('../services/blockchain');
  }
  return blockchainService;
};

interface AccountState {
  account: BelizeAccount | null;
  isLoading: boolean;
  error: string | null;
  balanceUnsubscribe: (() => void) | null;
  eventsUnsubscribe: (() => void) | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  updateBalance: (balance: Balance) => void;
  refreshBalance: () => Promise<void>;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      account: null,
      isLoading: false,
      error: null,
      balanceUnsubscribe: null,
      eventsUnsubscribe: null,

      connectWallet: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Import Polkadot extension dynamically
          const { web3Accounts, web3Enable } = await import('@polkadot/extension-dapp');
          
          // Request access to extensions
          const extensions = await web3Enable('Maya Wallet');
          
          if (extensions.length === 0) {
            throw new Error('No wallet extension found. Please install Polkadot.js extension.');
          }

          // Get all accounts
          const accounts = await web3Accounts();
          
          if (accounts.length === 0) {
            throw new Error('No accounts found. Please create an account in your wallet extension.');
          }

          // Use first account (Future: add account selector UI)
          const polkadotAccount = accounts[0];

          // Create BelizeAccount from Polkadot account
          const belizeAccount: BelizeAccount = {
            address: polkadotAccount.address,
            name: polkadotAccount.meta.name,
            type: 'citizen' as any, // Default to citizen
            balance: {
              dalla: '0',
              bBZD: '0',
              free: '0',
              reserved: '0',
              total: '0',
            },
            isVerified: false,
          };

          set({ account: belizeAccount, isLoading: false });

          // Initialize blockchain connection and fetch real balance
          try {
            const blockchain = await getBlockchainService();
            await blockchain.initializeApi();
            const balance = await blockchain.fetchBalance(polkadotAccount.address);
            get().updateBalance(balance);
            
            // Subscribe to balance changes
            const unsubscribe = await blockchain.subscribeToBalance(
              polkadotAccount.address,
              (newBalance: Balance) => get().updateBalance(newBalance)
            );
            set({ balanceUnsubscribe: unsubscribe });
            
            // Subscribe to blockchain events for notifications
            try {
              const { subscribeToBlockchainEvents } = await import('../services/notifications');
              const eventsUnsub = await subscribeToBlockchainEvents(polkadotAccount.address);
              set({ eventsUnsubscribe: eventsUnsub });
            } catch (eventError) {
              console.warn('Failed to subscribe to blockchain events:', eventError);
            }
          } catch (balanceError) {
            console.error('Failed to fetch balance, using defaults:', balanceError);
            // Use default balance if blockchain connection fails
            get().updateBalance({
              dalla: '0.00',
              bBZD: '0.00',
              free: '0.00',
              reserved: '0.00',
              total: '0.00',
            });
          }

        } catch (error) {
          console.error('Failed to connect wallet:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to connect wallet',
            isLoading: false 
          });
        }
      },

      disconnectWallet: () => {
        const { balanceUnsubscribe, eventsUnsubscribe } = get();
        if (balanceUnsubscribe) {
          balanceUnsubscribe();
        }
        if (eventsUnsubscribe) {
          eventsUnsubscribe();
        }
        getBlockchainService().then(blockchain => blockchain.disconnectApi());
        set({ account: null, error: null, balanceUnsubscribe: null, eventsUnsubscribe: null });
      },

      updateBalance: (balance: Balance) => {
        const { account } = get();
        if (account) {
          set({ account: { ...account, balance } });
        }
      },

      refreshBalance: async () => {
        const { account } = get();
        if (!account) return;

        try {
          const blockchain = await getBlockchainService();
          const balance = await blockchain.fetchBalance(account.address);
          get().updateBalance(balance);
        } catch (error) {
          console.error('Failed to refresh balance:', error);
        }
      },
    }),
    {
      name: 'maya-wallet-account',
      partialize: (state) => ({ account: state.account }),
      skipHydration: typeof window === 'undefined', // SSR-safe: skip during server-side rendering
    }
  )
);
