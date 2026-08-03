'use client';

import { useState, useEffect } from 'react';
import { useBlockchain } from '@/lib/blockchain/hooks';
import {
  getTreasuryBalance,
  getTreasurySpendProposals,
  type TreasurySpendProposalView,
} from '@/services/pallets/treasury';

export interface TreasuryBalance {
  dalla: bigint;
  bBZD: bigint;
}

/**
 * Hook for Economy/Treasury pallet queries
 * Provides treasury balances and proposals using the unified service.
 */
export function useEconomy() {
  const { isConnected } = useBlockchain();
  const [treasuryBalance, setTreasuryBalance] = useState<TreasuryBalance | null>(null);
  const [proposals, setProposals] = useState<TreasurySpendProposalView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let timer: NodeJS.Timeout;

    const fetchEconomyData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [balanceData, propsData] = await Promise.all([
          getTreasuryBalance(),
          getTreasurySpendProposals()
        ]);

        if (!cancelled) {
          setTreasuryBalance({
            dalla: BigInt(balanceData.freePlanck),
            bBZD: 0n, // bBZD not tracked in basic free planck yet
          });
          setProposals(propsData);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Economy service query error:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch economy data');
          setIsLoading(false);
        }
      }
    };

    fetchEconomyData();
    timer = setInterval(fetchEconomyData, 30_000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [isConnected]);

  return {
    treasuryBalance,
    proposals,
    isLoading,
    error,
    isConnected,
    refetch: async () => {
      try {
        const [balanceData, propsData] = await Promise.all([
          getTreasuryBalance(),
          getTreasurySpendProposals()
        ]);
        setTreasuryBalance({
          dalla: BigInt(balanceData.freePlanck),
          bBZD: 0n,
        });
        setProposals(propsData);
      } catch (err) {
        console.error('Manual economy fetch error:', err);
      }
    }
  };
}

/**
 * Hook to get account balance for specific currency
 */
export function useAccountBalance(address: string | null, currency: 'DALLA' | 'bBZD') {
  const { api, isConnected } = useBlockchain();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!api || !isConnected || !address) {
      setBalance(null);
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        const accountBalance = await api.query.belizeEconomy?.balances(address, currency);
        setBalance(accountBalance ? BigInt(accountBalance.toString()) : 0n);
        setIsLoading(false);
      } catch (err) {
        console.error('Balance query error:', err);
        setBalance(null);
        setIsLoading(false);
      }
    };

    fetchBalance();

    // Subscribe to balance changes
    if (api.query.belizeEconomy?.balances) {
      api.query.belizeEconomy.balances(address, currency, (balance: any) => {
        setBalance(BigInt(balance.toString()));
      }).then((unsub) => {
        unsubscribe = unsub as any;
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [api, isConnected, address, currency]);

  return { balance, isLoading };
}
