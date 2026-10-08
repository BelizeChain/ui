'use client';

import { useState, useEffect } from 'react';
import { useBlockchain } from '@/lib/blockchain/hooks';
import { connectionManager } from '@/lib/blockchain/connection';

export interface Validator {
  address: string;
  name: string;
  /** Always 0 — the PoUW staking pallet has no commission concept. */
  commission: number;
  totalStake: bigint;
  ownStake: bigint;
  /** Always 0 — the PoUW staking pallet has no nominators. */
  nominatorsCount: number;
  /** Validator quality score (0-100), from `staking.validators`. */
  pouwScore: number | null;
  /** Always null — no quantum score is published on the validator record. */
  pqwScore: number | null;
  /** Always null — the pallet does not track uptime. */
  uptime: number | null;
  /** Always null — the pallet does not publish an APY. */
  estimatedApy: number | null;
  /** `Active` when the account is in the session authority set, else `Waiting`. */
  status: 'Active' | 'Waiting' | 'Inactive';
  /** Always null — the pallet does not count authored blocks. */
  blocksProduced: number | null;
  /** `staking.slashingSpans` — number of times the validator was slashed. */
  slashes: number | null;
  /** Always null — no per-validator reward ledger exists. */
  rewardsPaid: number | null;
}

export interface StakingStats {
  totalStaked: bigint;
  activeValidators: number;
  waitingValidators: number;
  /** Always 0 — the PoUW staking pallet has no nominators. */
  totalNominators: number;
  /** Always null — the pallet does not publish an APY. */
  averageApy: number | null;
  /** Current PoUW epoch (`staking.currentEpoch`). This pallet has no eras. */
  currentEpoch: number;
}

interface StakingSnapshot {
  validators: Validator[];
  stats: StakingStats;
}

/**
 * Read the PoUW staking pallet.
 *
 * This is not Substrate's `pallet_staking`: validators self-stake through
 * `staking.joinValidators`, and there are no nominators, eras, commissions or
 * per-account reward ledgers.
 */
async function fetchStakingSnapshot(): Promise<StakingSnapshot> {
  const api = await connectionManager.connect();

  const [entries, epochCodec, sessionValidators] = await Promise.all([
    api.query.staking?.validators?.entries?.() ?? Promise.resolve([]),
    api.query.staking?.currentEpoch?.(),
    api.query.session?.validators?.(),
  ]);

  const currentEpoch = Number(epochCodec?.toString() ?? 0);
  const activeSet = new Set<string>(
    ((sessionValidators as unknown as Array<{ toString(): string }>) ?? []).map((account) =>
      account.toString(),
    ),
  );

  const validators: Validator[] = [];
  let totalStaked = 0n;

  for (const [key, record] of (entries as any[]) ?? []) {
    const address = key.args[0].toString();
    const info: any = record?.unwrap ? record.unwrap() : record;
    const stake = BigInt(info?.stake?.toString() ?? 0);
    const slashes = await api.query.staking?.slashingSpans?.(address);

    totalStaked += stake;
    validators.push({
      address,
      name: `${address.slice(0, 6)}…${address.slice(-4)}`,
      commission: 0,
      totalStake: stake,
      ownStake: stake,
      nominatorsCount: 0,
      pouwScore: Number(info?.qualityScore?.toString() ?? 0),
      pqwScore: null,
      uptime: null,
      estimatedApy: null,
      status: activeSet.has(address) ? 'Active' : 'Waiting',
      blocksProduced: null,
      slashes: Number(slashes?.toString() ?? 0),
      rewardsPaid: null,
    });
  }

  validators.sort((a, b) => (a.totalStake > b.totalStake ? -1 : 1));

  return {
    validators,
    stats: {
      totalStaked,
      activeValidators: validators.filter((v) => v.status === 'Active').length,
      waitingValidators: validators.filter((v) => v.status === 'Waiting').length,
      totalNominators: 0,
      averageApy: null,
      currentEpoch,
    },
  };
}

/**
 * Hook for PoUW staking queries — validator set and network staking statistics.
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

    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const snapshot = await fetchStakingSnapshot();
        if (cancelled) return;

        setValidators(snapshot.validators);
        setStats(snapshot.stats);
      } catch (err) {
        if (cancelled) return;
        console.error('Staking data query error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch staking data');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();
    const timer = setInterval(run, 30_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isConnected]);

  const refetch = async () => {
    setIsLoading(true);
    try {
      const snapshot = await fetchStakingSnapshot();
      setValidators(snapshot.validators);
      setStats(snapshot.stats);
    } catch (err) {
      console.error('Manual staking fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    validators,
    stats,
    isLoading,
    error,
    isConnected,
    refetch,
  };
}
