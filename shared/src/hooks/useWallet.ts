/**
 * Polkadot.js Wallet Integration Hook
 * Provides wallet connection, account management, and transaction signing
 */

import { useState, useEffect, useCallback } from 'react';
import type { InjectedAccountWithMeta, InjectedExtension } from '@polkadot/extension-inject/types';
import { ApiPromise, WsProvider } from '@polkadot/api';

export interface WalletState {
  isConnected: boolean;
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  extension: InjectedExtension | null;
  api: ApiPromise | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  selectAccount: (address: string) => void;
  signAndSend: (extrinsic: any, callback?: (status: any) => void) => Promise<void>;
}

const WS_ENDPOINT = process.env.NEXT_PUBLIC_WS_ENDPOINT || 'ws://localhost:9944';

export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    accounts: [],
    selectedAccount: null,
    extension: null,
    api: null,
    isLoading: false,
    error: null,
  });

  // Initialize API connection
  useEffect(() => {
    let mounted = true;

    async function initApi() {
      try {
        const provider = new WsProvider(WS_ENDPOINT);
        const api = await ApiPromise.create({ provider });
        
        if (mounted) {
          setState(prev => ({ ...prev, api }));
        }
      } catch (error) {
        console.error('Failed to initialize API:', error);
        if (mounted) {
          setState(prev => ({ 
            ...prev, 
            error: 'Failed to connect to blockchain node' 
          }));
        }
      }
    }

    initApi();

    return () => {
      mounted = false;
      if (state.api) {
        state.api.disconnect();
      }
    };
  }, []);

  // Load saved account from localStorage
  useEffect(() => {
    const savedAddress = localStorage.getItem('selectedAccount');
    if (savedAddress && state.accounts.length > 0) {
      const account = state.accounts.find(acc => acc.address === savedAddress);
      if (account) {
        setState(prev => ({ ...prev, selectedAccount: account }));
      }
    }
  }, [state.accounts]);

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Dynamic import to avoid SSR issues
      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');

      // Request access to the extension
      const extensions = await web3Enable('BelizeChain');
      
      if (extensions.length === 0) {
        throw new Error('No Polkadot extension found. Please install Polkadot.js extension.');
      }

      // Get all accounts
      const accounts = await web3Accounts();
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please create an account in your Polkadot.js extension.');
      }

      setState(prev => ({
        ...prev,
        isConnected: true,
        accounts,
        selectedAccount: accounts[0],
        extension: extensions[0],
        isLoading: false,
      }));

      // Save to localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('selectedAccount', accounts[0].address);

    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      accounts: [],
      selectedAccount: null,
      extension: null,
    }));

    localStorage.removeItem('walletConnected');
    localStorage.removeItem('selectedAccount');
  }, []);

  const selectAccount = useCallback((address: string) => {
    const account = state.accounts.find(acc => acc.address === address);
    if (account) {
      setState(prev => ({ ...prev, selectedAccount: account }));
      localStorage.setItem('selectedAccount', address);
    }
  }, [state.accounts]);

  const signAndSend = useCallback(async (
    extrinsic: any,
    callback?: (status: any) => void
  ) => {
    if (!state.selectedAccount || !state.extension || !state.api) {
      throw new Error('Wallet not connected');
    }

    try {
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(state.selectedAccount.address);

      await extrinsic.signAndSend(
        state.selectedAccount.address,
        { signer: injector.signer },
        callback || ((status: any) => {
          console.log('Transaction status:', status.toHuman());
        })
      );
    } catch (error: any) {
      console.error('Failed to sign and send:', error);
      throw new Error(error.message || 'Failed to send transaction');
    }
  }, [state.selectedAccount, state.extension, state.api]);

  // Auto-connect if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected === 'true' && !state.isConnected && !state.isLoading && state.api) {
      // Only auto-connect if we have an API connection and aren't already connecting
      connect().catch((error) => {
        console.error('Auto-connect failed:', error);
        // Clear the flag if auto-connect fails
        localStorage.removeItem('walletConnected');
      });
    }
  }, [connect, state.isConnected, state.isLoading, state.api]);

  return {
    ...state,
    connect,
    disconnect,
    selectAccount,
    signAndSend,
  };
}

/**
 * Hook for querying account balance
 */
export function useBalance(address: string | null) {
  const [balance, setBalance] = useState<{
    free: string;
    reserved: string;
    frozen: string;
    total: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setBalance(null);
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function fetchBalance() {
      setIsLoading(true);
      
      try {
        const provider = new WsProvider(WS_ENDPOINT);
        const api = await ApiPromise.create({ provider });

        const unsub = await api.query.system.account(address, (account: any) => {
          if (!mounted) return;

          const free = BigInt(account.data.free.toString());
          const reserved = BigInt(account.data.reserved.toString());
          const frozen = BigInt(account.data.frozen?.toString() || '0');
          const divisor = BigInt(1e12); // 12 decimals for DALLA

          setBalance({
            free: (free / divisor).toString(),
            reserved: (reserved / divisor).toString(),
            frozen: (frozen / divisor).toString(),
            total: ((free + reserved) / divisor).toString(),
          });
          setIsLoading(false);
        });

        unsubscribe = unsub as any;
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setIsLoading(false);
      }
    }

    fetchBalance();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [address]);

  return { balance, isLoading };
}

/**
 * Hook for subscribing to new blocks
 */
export function useNewBlocks() {
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [blockHash, setBlockHash] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function subscribe() {
      try {
        const provider = new WsProvider(WS_ENDPOINT);
        const api = await ApiPromise.create({ provider });

        unsubscribe = await api.rpc.chain.subscribeNewHeads((header) => {
          if (!mounted) return;

          setBlockNumber(header.number.toNumber());
          setBlockHash(header.hash.toHex());
        });
      } catch (error) {
        console.error('Failed to subscribe to new blocks:', error);
      }
    }

    subscribe();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { blockNumber, blockHash };
}
