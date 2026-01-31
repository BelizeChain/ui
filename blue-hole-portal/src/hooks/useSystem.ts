'use client';

import { useState, useEffect } from 'react';
import { useBlockchain } from '@/lib/blockchain/hooks';

export interface SystemInfo {
  blockNumber: number;
  blockHash: string;
  blockTime: number; // in seconds
  peersCount: number;
  health: 'Healthy' | 'Syncing' | 'Degraded';
  chainName: string;
  version: string;
}

export interface NetworkStats {
  totalTransactions: number;
  transactionsPerSecond: number;
  averageBlockTime: number;
  totalBlocks: number;
}

/**
 * Hook for System pallet queries and network health
 * Provides block number, network stats, chain info
 */
export function useSystem() {
  const { api, isConnected } = useBlockchain();
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !isConnected) {
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const fetchSystemData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Query chain info
        const [chain, nodeName, nodeVersion] = await Promise.all([
          api.rpc.system.chain(),
          api.rpc.system.name(),
          api.rpc.system.version(),
        ]);

        // Query current block
        const header = await api.rpc.chain.getHeader();
        const blockNumber = header.number.toNumber();
        const blockHash = header.hash.toString();

        // Query network health
        const health = await api.rpc.system.health();
        const peers = health.peers.toNumber();
        const isSyncing = health.isSyncing.isTrue;

        setSystemInfo({
          blockNumber,
          blockHash,
          blockTime: 6, // BelizeChain produces blocks every 6 seconds
          peersCount: peers,
          health: isSyncing ? 'Syncing' : peers > 0 ? 'Healthy' : 'Degraded',
          chainName: chain.toString(),
          version: nodeVersion.toString(),
        });

        // Calculate network statistics
        // Query total transactions from System pallet events
        const events: any = await api.query.system.events();
        const txCount = events.filter((record: any) => 
          record.event.section === 'system' && record.event.method === 'ExtrinsicSuccess'
        ).length;

        setNetworkStats({
          totalTransactions: txCount,
          transactionsPerSecond: txCount / 6, // Approximate based on block time
          averageBlockTime: 6,
          totalBlocks: blockNumber,
        });

        setIsLoading(false);
      } catch (err) {
        console.error('System pallet query error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch system data');
        setIsLoading(false);
      }
    };

    fetchSystemData();

    // Subscribe to new blocks
    if (api.rpc.chain.subscribeNewHeads) {
      api.rpc.chain.subscribeNewHeads((header: any) => {
        setSystemInfo((prev) => prev ? {
          ...prev,
          blockNumber: header.number.toNumber(),
          blockHash: header.hash.toString(),
        } : null);
      }).then((unsub) => {
        unsubscribe = unsub as any;
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [api, isConnected]);

  return {
    systemInfo,
    networkStats,
    isLoading,
    error,
    isConnected,
  };
}

/**
 * Hook to get recent blocks
 */
export function useRecentBlocks(count: number = 10) {
  const { api, isConnected } = useBlockchain();
  const [blocks, setBlocks] = useState<Array<{ number: number; hash: string; timestamp: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!api || !isConnected) {
      setIsLoading(false);
      return;
    }

    const fetchBlocks = async () => {
      try {
        setIsLoading(true);
        const header = await api.rpc.chain.getHeader();
        const currentBlock = header.number.toNumber();

        const blockPromises = [];
        for (let i = 0; i < count && currentBlock - i >= 0; i++) {
          blockPromises.push(
            api.rpc.chain.getBlockHash(currentBlock - i).then(async (hash) => {
              const block = await api.rpc.chain.getBlock(hash);
              return {
                number: currentBlock - i,
                hash: hash.toString(),
                timestamp: Date.now() - i * 6000, // 6 second block time
              };
            })
          );
        }

        const blockData = await Promise.all(blockPromises);
        setBlocks(blockData);
        setIsLoading(false);
      } catch (err) {
        console.error('Recent blocks query error:', err);
        setBlocks([]);
        setIsLoading(false);
      }
    };

    fetchBlocks();
  }, [api, isConnected, count]);

  return { blocks, isLoading };
}
