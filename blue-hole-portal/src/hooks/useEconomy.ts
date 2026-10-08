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

    // DALLA is the native currency, so it lives in `system.account`; bBZD has
    // its own `economy.bbzdBalances` map. The old code queried a single
    // `belizeEconomy.balances(address, currency)` that does not exist — the
    // section name is `economy` and there is no combined balances map.
    const subscribe = (): Promise<unknown> => {
      if (currency === 'bBZD') {
        return api.query.economy.bbzdBalances(address, (value: any) => {
          setBalance(value?.isEmpty ? 0n : BigInt(value.toString()));
        });
      }
      return api.query.system.account(address, (accountInfo: any) => {
        setBalance(BigInt(accountInfo.data.free.toString()));
      });
    };

    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        const value: any =
          currency === 'bBZD'
            ? await api.query.economy.bbzdBalances(address)
            : await api.query.system.account(address);
        const raw = currency === 'bBZD' ? value : value?.data?.free;
        setBalance(raw && !raw.isEmpty ? BigInt(raw.toString()) : 0n);
        setIsLoading(false);
      } catch (err) {
        console.error('Balance query error:', err);
        setBalance(null);
        setIsLoading(false);
      }
    };

    fetchBalance();

    subscribe().then((unsub) => {
      unsubscribe = unsub as () => void;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [api, isConnected, address, currency]);

  return { balance, isLoading };
}
