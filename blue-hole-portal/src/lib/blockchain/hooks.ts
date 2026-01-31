/**
 * React Hooks for Blockchain Interaction
 * 
 * Provides React hooks for:
 * - Connection management
 * - Chain info retrieval
 * - Storage queries
 * - Event subscriptions
 * - Extrinsic submission
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ApiPromise } from '@polkadot/api';
import type { Codec } from '@polkadot/types/types';
import {
  connectionManager,
  type ConnectionStatus,
  type ChainInfo,
} from './connection';

/**
 * Hook to manage blockchain connection
 * Auto-connects on mount, provides connection status and API instance
 */
export function useBlockchain() {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>({
    status: 'connecting',
    message: 'Initializing...',
  });
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Subscribe to connection status changes
    const unsubscribe = connectionManager.onConnectionChange((newStatus) => {
      if (isMounted) {
        setStatus(newStatus);
        setIsReady(newStatus.status === 'ready' || newStatus.status === 'connected');
        if (newStatus.status === 'error') {
          setError(newStatus.message);
        } else {
          setError(null);
        }
      }
    });

    // Connect to blockchain
    connectionManager
      .connect()
      .then((connectedApi) => {
        if (isMounted) {
          setApi(connectedApi);
          setIsReady(true);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Connection failed');
          setStatus({ status: 'error', message: 'Failed to connect' });
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const reconnect = useCallback(async () => {
    try {
      await connectionManager.disconnect();
      const connectedApi = await connectionManager.connect();
      setApi(connectedApi);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reconnection failed');
    }
  }, []);

  return {
    api,
    status: status.status,
    statusMessage: status.message,
    isReady,
    isConnected: connectionManager.isConnected(),
    error,
    reconnect,
  };
}

/**
 * Hook to fetch chain information
 */
export function useChainInfo() {
  const [chainInfo, setChainInfo] = useState<ChainInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { api, isReady } = useBlockchain();

  useEffect(() => {
    if (!isReady || !api) return;

    let isMounted = true;

    const fetchChainInfo = async () => {
      try {
        const info = await connectionManager.getChainInfo();
        if (isMounted && info) {
          setChainInfo(info);
        }
      } catch (error) {
        console.error('Failed to fetch chain info:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchChainInfo();

    // Update block number every 6 seconds (average block time)
    const interval = setInterval(fetchChainInfo, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [api, isReady]);

  return { chainInfo, loading };
}

/**
 * Hook to query storage
 * Automatically refetches when dependencies change
 * 
 * @example
 * const { data, loading, error } = useStorage('system', 'account', [address]);
 */
export function useStorage<T = Codec>(
  pallet: string,
  method: string,
  params: any[] = [],
  options: { skip?: boolean; refetchInterval?: number } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { api, isReady } = useBlockchain();

  useEffect(() => {
    if (!isReady || !api || options.skip) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const fetchStorage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query path
        const query = api.query[pallet]?.[method];
        if (!query) {
          throw new Error(`Storage ${pallet}.${method} not found`);
        }

        // Subscribe to storage changes
        const unsub = await query(...params, (result: any) => {
          if (isMounted) {
            setData(result as T);
            setLoading(false);
          }
        });
        
        // Store unsubscribe function (cast to any to avoid type errors)
        unsubscribe = unsub as any;
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Storage query failed');
          setLoading(false);
        }
      }
    };

    fetchStorage();

    // Optionally refetch at interval
    let interval: NodeJS.Timeout | undefined;
    if (options.refetchInterval) {
      interval = setInterval(fetchStorage, options.refetchInterval);
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [api, isReady, pallet, method, JSON.stringify(params), options.skip, options.refetchInterval]);

  return { data, loading, error };
}

/**
 * Hook to subscribe to events
 * 
 * @example
 * useEvents((events) => {
 *   events.forEach(({ event, phase }) => {
 *     if (event.section === 'democracy' && event.method === 'Proposed') {
 *       console.log('New proposal:', event.data);
 *     }
 *   });
 * });
 */
export function useEvents(
  callback: (events: any[]) => void,
  options: { skip?: boolean } = {}
) {
  const { api, isReady } = useBlockchain();
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isReady || !api || options.skip) return;

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const subscribeToEvents = async () => {
      const unsub = await api.query.system.events((events: any) => {
        if (isMounted) {
          callbackRef.current(events);
        }
      });
      unsubscribe = unsub as any;
    };

    subscribeToEvents();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [api, isReady, options.skip]);
}

/**
 * Hook to get constant values from runtime
 * 
 * @example
 * const { data: existentialDeposit } = useConst('balances', 'existentialDeposit');
 */
export function useConst<T = Codec>(pallet: string, name: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const { api, isReady } = useBlockchain();

  useEffect(() => {
    if (!isReady || !api) {
      setLoading(false);
      return;
    }

    try {
      const constant = api.consts[pallet]?.[name];
      if (constant) {
        setData(constant as T);
      }
    } catch (error) {
      console.error(`Failed to fetch constant ${pallet}.${name}:`, error);
    } finally {
      setLoading(false);
    }
  }, [api, isReady, pallet, name]);

  return { data, loading };
}

/**
 * Hook to fetch current block number with auto-updates
 */
export function useBlockNumber() {
  const [blockNumber, setBlockNumber] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { api, isReady } = useBlockchain();

  useEffect(() => {
    if (!isReady || !api) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const subscribeToBlocks = async () => {
      const unsub = await api.rpc.chain.subscribeNewHeads((header) => {
        if (isMounted) {
          setBlockNumber(header.number.toNumber());
          setLoading(false);
        }
      });
      unsubscribe = unsub as any;
    };

    subscribeToBlocks();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [api, isReady]);

  return { blockNumber, loading };
}

/**
 * Hook to fetch account balance (DALLA + bBZD)
 */
export function useBalance(address: string | null) {
  const { data: accountData, loading } = useStorage('system', 'account', [address], {
    skip: !address,
  });

  const [balance, setBalance] = useState({
    dalla: '0',
    bBZD: '0',
    total: '0',
  });

  useEffect(() => {
    if (accountData) {
      // Extract balance from account data
      const free = (accountData as any).data?.free?.toString() || '0';
      // TODO: Query bBZD balance from economy pallet
      setBalance({
        dalla: free,
        bBZD: '0', // Will be implemented when economy pallet is integrated
        total: free,
      });
    }
  }, [accountData]);

  return { balance, loading };
}
