'use client';

import { useState, useEffect } from 'react';
import { useBlockchain } from '@/lib/blockchain/hooks';
import type { ApiPromise } from '@polkadot/api';

export interface TreasuryBalance {
  dalla: bigint;
  bBZD: bigint;
}

export interface CurrencySupply {
  dalla: bigint;
  bBZD: bigint;
}

export interface TreasuryProposal {
  id: number;
  proposer: string;
  beneficiary: string;
  amount: bigint;
  currency: 'DALLA' | 'bBZD';
  bond: bigint;
  status: 'Proposed' | 'Approved' | 'Rejected' | 'Executed';
  approvers: string[];
  category: string;
  title: string;
  description: string;
}

export interface ExchangeRate {
  dalla_bzd: number;
  bbzd_bzd: number; // Always 1.0 (pegged)
}

/**
 * Hook for Economy pallet queries
 * Provides treasury balances, DALLA/bBZD supply, proposals, exchange rates
 */
export function useEconomy() {
  const { api, isConnected } = useBlockchain();
  const [treasuryBalance, setTreasuryBalance] = useState<TreasuryBalance | null>(null);
  const [totalSupply, setTotalSupply] = useState<CurrencySupply | null>(null);
  const [proposals, setProposals] = useState<TreasuryProposal[]>([]);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !isConnected) {
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const fetchEconomyData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Query treasury balances from Economy pallet
        const [dallaBalance, bBZDBalance] = await Promise.all([
          api.query.belizeEconomy?.treasuryBalance('DALLA'),
          api.query.belizeEconomy?.treasuryBalance('bBZD'),
        ]);

        setTreasuryBalance({
          dalla: dallaBalance ? BigInt(dallaBalance.toString()) : 0n,
          bBZD: bBZDBalance ? BigInt(bBZDBalance.toString()) : 0n,
        });

        // Query total supply for both currencies
        const [dallaTotalSupply, bBZDTotalSupply] = await Promise.all([
          api.query.belizeEconomy?.totalIssuance('DALLA'),
          api.query.belizeEconomy?.totalIssuance('bBZD'),
        ]);

        setTotalSupply({
          dalla: dallaTotalSupply ? BigInt(dallaTotalSupply.toString()) : 0n,
          bBZD: bBZDTotalSupply ? BigInt(bBZDTotalSupply.toString()) : 0n,
        });

        // Query exchange rates (bBZD is always 1:1 with BZD)
        const dallaRate = await api.query.belizeEconomy?.exchangeRate('DALLA');
        setExchangeRate({
          dalla_bzd: dallaRate ? parseFloat(dallaRate.toString()) / 1e12 : 0.5, // Default 0.5 BZD
          bbzd_bzd: 1.0, // Always pegged 1:1
        });

        // Query treasury proposals
        const proposalCount = await api.query.belizeEconomy?.proposalCount();
        const count = proposalCount ? parseInt(proposalCount.toString()) : 0;

        const proposalPromises = [];
        for (let i = 0; i < count; i++) {
          proposalPromises.push(api.query.belizeEconomy?.proposals(i));
        }

        const proposalResults = await Promise.all(proposalPromises);
        const parsedProposals: TreasuryProposal[] = proposalResults
          .map((result: any, index) => {
            if (!result) return null;
            const proposal = result.isSome ? result.unwrap() : result;
            if (!proposal || !proposal.proposer) return null;
            return {
              id: index,
              proposer: proposal.proposer.toString(),
              beneficiary: proposal.beneficiary.toString(),
              amount: BigInt(proposal.amount.toString()),
              currency: proposal.currency.toString() as 'DALLA' | 'bBZD',
              bond: BigInt(proposal.bond.toString()),
              status: proposal.status.toString() as any,
              approvers: proposal.approvers?.toArray().map((a: any) => a.toString()) || [],
              category: proposal.category?.toString() || 'Infrastructure',
              title: proposal.title?.toString() || `Proposal #${index}`,
              description: proposal.description?.toString() || '',
            };
          })
          .filter((p): p is TreasuryProposal => p !== null);

        setProposals(parsedProposals);
        setIsLoading(false);
      } catch (err) {
        console.error('Economy pallet query error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch economy data');
        setIsLoading(false);
      }
    };

    fetchEconomyData();

    // Subscribe to treasury balance changes
    if (api.query.belizeEconomy?.treasuryBalance) {
      api.query.belizeEconomy.treasuryBalance('DALLA', (balance: any) => {
        setTreasuryBalance((prev) => ({
          dalla: BigInt(balance.toString()),
          bBZD: prev?.bBZD || 0n,
        }));
      }).then((unsub) => {
        unsubscribe = unsub as any;
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [api, isConnected]);

  return {
    treasuryBalance,
    totalSupply,
    proposals,
    exchangeRate,
    isLoading,
    error,
    isConnected,
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
