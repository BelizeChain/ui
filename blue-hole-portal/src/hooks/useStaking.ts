'use client';

import { useState, useEffect } from 'react';
import { useBlockchain } from '@/lib/blockchain/hooks';

export interface Validator {
  address: string;
  name: string;
  commission: number; // Percentage (0-100)
  totalStake: bigint;
  ownStake: bigint;
  nominatorsCount: number;
  pouwScore: number; // Proof of Useful Work score (0-100)
  pqwScore: number; // Proof of Quantum Work score (0-100)
  uptime: number; // Percentage (0-100)
  estimatedApy: number; // Percentage
  status: 'Active' | 'Waiting' | 'Inactive';
  blocksProduced: number;
  slashes: number;
}

export interface Nominator {
  address: string;
  amount: bigint;
  targets: string[]; // Validator addresses
  timestamp: number;
}

export interface StakingStats {
  totalStaked: bigint;
  activeValidators: number;
  waitingValidators: number;
  totalNominators: number;
  averageApy: number;
  currentEra: number;
}

/**
 * Hook for Staking pallet queries
 * Provides validators, nominators, staking statistics
 */
export function useStaking() {
  const { api, isConnected } = useBlockchain();
  const [validators, setValidators] = useState<Validator[]>([]);
  const [stats, setStats] = useState<StakingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !isConnected) {
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const fetchStakingData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Query active validators
        const activeValidators: any = await api.query.belizeStaking?.validators();
        const validatorAddresses = activeValidators?.toArray().map((v: any) => v.toString()) || [];

        // Query current era
        const currentEra = await api.query.belizeStaking?.currentEra();
        const eraNumber = currentEra ? parseInt(currentEra.toString()) : 0;

        // Fetch detailed validator info
        const validatorPromises = validatorAddresses.map(async (address: string) => {
          const [prefs, exposure, pouwScore, pqwScore, uptime, blocks]: any[] = await Promise.all([
            api.query.belizeStaking?.validators(address),
            api.query.belizeStaking?.erasStakers(eraNumber, address),
            api.query.belizeStaking?.pouwScores(address), // Proof of Useful Work
            api.query.belizeConsensus?.pqwScores(address), // Proof of Quantum Work
            api.query.belizeStaking?.validatorUptime(address),
            api.query.belizeStaking?.blocksProduced(address),
          ]);

          const commission = prefs ? parseInt(prefs.commission?.toString() || '100000000') / 1e7 : 10; // Perbill to percentage
          const totalStake = exposure?.total ? BigInt(exposure.total.toString()) : 0n;
          const ownStake = exposure?.own ? BigInt(exposure.own.toString()) : 0n;
          const nominators = exposure?.others?.length || 0;

          return {
            address,
            name: `Validator ${address.slice(0, 8)}`, // TODO: Query identity pallet
            commission,
            totalStake,
            ownStake,
            nominatorsCount: nominators,
            pouwScore: pouwScore ? parseFloat(pouwScore.toString()) : 0,
            pqwScore: pqwScore ? parseFloat(pqwScore.toString()) : 0,
            uptime: uptime ? parseFloat(uptime.toString()) : 99.0,
            estimatedApy: calculateApy(commission, totalStake),
            status: 'Active' as const,
            blocksProduced: blocks ? parseInt(blocks.toString()) : 0,
            slashes: 0, // TODO: Query slashing spans
          };
        });

        const validatorData = await Promise.all(validatorPromises);
        setValidators(validatorData);

        // Calculate staking statistics
        const totalStaked = validatorData.reduce((sum, v) => sum + v.totalStake, 0n);
        const averageApy = validatorData.reduce((sum, v) => sum + v.estimatedApy, 0) / validatorData.length;

        // Query waiting validators
        const waiting: any = await api.query.belizeStaking?.waitingValidators();
        const waitingCount = waiting?.toArray().length || 0;

        // Query total nominators
        const nominators: any = await api.query.belizeStaking?.nominators.entries();
        const nominatorsCount = nominators?.length || 0;

        setStats({
          totalStaked,
          activeValidators: validatorData.length,
          waitingValidators: waitingCount,
          totalNominators: nominatorsCount,
          averageApy,
          currentEra: eraNumber,
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Staking pallet query error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch staking data');
        setIsLoading(false);
      }
    };

    fetchStakingData();

    // Subscribe to validator set changes
    if (api.query.belizeStaking?.validators) {
      api.query.belizeStaking.validators((validators: any) => {
        fetchStakingData(); // Refetch on validator changes
      }).then((unsub) => {
        unsubscribe = unsub as any;
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [api, isConnected]);

  return {
    validators,
    stats,
    isLoading,
    error,
    isConnected,
  };
}

/**
 * Hook to get nominator data for specific account
 */
export function useNominator(address: string | null) {
  const { api, isConnected } = useBlockchain();
  const [nominator, setNominator] = useState<Nominator | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!api || !isConnected || !address) {
      setNominator(null);
      setIsLoading(false);
      return;
    }

    const fetchNominator = async () => {
      try {
        setIsLoading(true);
        const nominatorData: any = await api.query.belizeStaking?.nominators(address);
        
        if (!nominatorData || nominatorData.isNone) {
          setNominator(null);
          setIsLoading(false);
          return;
        }

        const nom = nominatorData.unwrap ? nominatorData.unwrap() : nominatorData;
        setNominator({
          address,
          amount: BigInt(nom.amount?.toString() || '0'),
          targets: nom.targets?.toArray().map((t: any) => t.toString()) || [],
          timestamp: nom.timestamp ? parseInt(nom.timestamp.toString()) : Date.now(),
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Nominator query error:', err);
        setNominator(null);
        setIsLoading(false);
      }
    };

    fetchNominator();
  }, [api, isConnected, address]);

  return { nominator, isLoading };
}

/**
 * Calculate estimated APY based on commission and stake
 */
function calculateApy(commission: number, totalStake: bigint): number {
  // Base APY calculation (simplified)
  // Real calculation would include era rewards, inflation, etc.
  const baseApy = 20; // 20% base
  const commissionFactor = (100 - commission) / 100;
  const stakeFactor = totalStake > 1_000_000n ? 0.9 : 1.0; // Reduce APY for large validators
  return baseApy * commissionFactor * stakeFactor;
}
