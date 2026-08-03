'use client';

import { useState, useEffect } from 'react';
import { useBlockchain } from '@/lib/blockchain/hooks';
import { connectionManager } from '@/lib/blockchain/connection';

export interface Validator {
  address: string;
  name: string;
  commission: number; // Percentage (0-100)
  totalStake: bigint;
  ownStake: bigint;
  nominatorsCount: number;
  pouwScore: number | null; // Proof of Useful Work score (0-100)
  pqwScore: number | null; // Proof of Quantum Work score (0-100)
  uptime: number | null; // Percentage (0-100)
  estimatedApy: number | null; // Percentage
  status: 'Active' | 'Waiting' | 'Inactive';
  blocksProduced: number | null;
  slashes: number | null;
  rewardsPaid: number | null;
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
  averageApy: number | null;
  currentEra: number;
}

/**
 * Hook for Staking queries
 * Provides validators and staking statistics using pallet_staking and pallet_session.
 */
export function useStaking() {
  const { isConnected } = useBlockchain();
  const [validators, setValidators] = useState<Validator[]>([]);
  const [stats, setStats] = useState<StakingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let timer: NodeJS.Timeout;

    const fetchStakingData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const api = await connectionManager.connect();
        
        // Get current era
        const activeEra = await api.query.staking?.activeEra();
        const currentEra = (activeEra as any)?.unwrapOrDefault()?.index?.toNumber() || 0;
        
        // Get all validators
        const allValidators = await api.query.staking?.validators.entries();
        const sessionValidators = await api.query.session?.validators();
        const activeSet = new Set((sessionValidators as any)?.map((v: any) => v.toString()) || []);
        
        const validatorList: Validator[] = [];
        let totalStaked = 0n;
        
        for (const [key, prefs] of allValidators || []) {
          const address = key.args[0].toString();
          const commission = (prefs as any).commission.toNumber() / 10_000_000;
          
          const exposure: any = await api.query.staking?.erasStakers(currentEra, address);
          const total = exposure?.total ? BigInt(exposure.total.toString()) : 0n;
          const own = exposure?.own ? BigInt(exposure.own.toString()) : 0n;
          const others = exposure?.others || [];
          
          totalStaked += total;

          // Attempt to get identity
          const identityOpt: any = await api.query.identity?.identityOf(address);
          let displayName = `${address.slice(0, 6)}…${address.slice(-4)}`;
          if (identityOpt && identityOpt.isSome) {
             const identity = identityOpt.unwrap();
             const rawName = identity.info?.display?.asRaw;
             if (rawName) {
                displayName = new TextDecoder().decode(rawName);
             }
          }
          
          validatorList.push({
            address,
            name: displayName,
            commission,
            totalStake: total,
            ownStake: own,
            nominatorsCount: others.length,
            pouwScore: null,
            pqwScore: null,
            uptime: null,
            estimatedApy: null,
            status: activeSet.has(address) ? 'Active' : 'Waiting',
            blocksProduced: null,
            slashes: null,
            rewardsPaid: null,
          });
        }
        
        // Sort active first, then by total stake
        validatorList.sort((a, b) => {
          if (a.status === 'Active' && b.status !== 'Active') return -1;
          if (a.status !== 'Active' && b.status === 'Active') return 1;
          return a.totalStake > b.totalStake ? -1 : 1;
        });

        // Nominators
        const nominators = await api.query.staking?.nominators.entries();
        const nominatorsCount = nominators?.length || 0;

        const activeCount = validatorList.filter(v => v.status === 'Active').length;
        const waitingCount = validatorList.filter(v => v.status === 'Waiting').length;

        if (!cancelled) {
          setValidators(validatorList);
          setStats({
            totalStaked,
            activeValidators: activeCount,
            waitingValidators: waitingCount,
            totalNominators: nominatorsCount,
            averageApy: null,
            currentEra,
          });
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Staking data query error:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch staking data');
          setIsLoading(false);
        }
      }
    };

    fetchStakingData();
    timer = setInterval(fetchStakingData, 30_000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [isConnected]);

  return {
    validators,
    stats,
    isLoading,
    error,
    isConnected,
    refetch: async () => {
      try {
        setIsLoading(true);
        const api = await connectionManager.connect();
        const activeEra = await api.query.staking?.activeEra();
        const currentEra = (activeEra as any)?.unwrapOrDefault()?.index?.toNumber() || 0;
        const allValidators = await api.query.staking?.validators.entries();
        const sessionValidators = await api.query.session?.validators();
        const activeSet = new Set((sessionValidators as any)?.map((v: any) => v.toString()) || []);
        const validatorList: Validator[] = [];
        let totalStaked = 0n;
        for (const [key, prefs] of allValidators || []) {
          const address = key.args[0].toString();
          const commission = (prefs as any).commission.toNumber() / 10_000_000;
          const exposure: any = await api.query.staking?.erasStakers(currentEra, address);
          const total = exposure?.total ? BigInt(exposure.total.toString()) : 0n;
          const own = exposure?.own ? BigInt(exposure.own.toString()) : 0n;
          const others = exposure?.others || [];
          totalStaked += total;
          let displayName = `${address.slice(0, 6)}…${address.slice(-4)}`;
          validatorList.push({
            address, name: displayName, commission, totalStake: total, ownStake: own,
            nominatorsCount: others.length, pouwScore: null, pqwScore: null, uptime: null,
            estimatedApy: null, status: activeSet.has(address) ? 'Active' : 'Waiting',
            blocksProduced: null, slashes: null, rewardsPaid: null
          });
        }
        validatorList.sort((a, b) => {
          if (a.status === 'Active' && b.status !== 'Active') return -1;
          if (a.status !== 'Active' && b.status === 'Active') return 1;
          return a.totalStake > b.totalStake ? -1 : 1;
        });
        const nominators = await api.query.staking?.nominators.entries();
        const nominatorsCount = nominators?.length || 0;
        const activeCount = validatorList.filter(v => v.status === 'Active').length;
        const waitingCount = validatorList.filter(v => v.status === 'Waiting').length;
        setValidators(validatorList);
        setStats({
          totalStaked, activeValidators: activeCount, waitingValidators: waitingCount,
          totalNominators: nominatorsCount, averageApy: null, currentEra,
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Manual staking fetch error:', err);
        setIsLoading(false);
      }
    }
  };
}
