'use client';

import { useState, useEffect } from 'react';
import { useBlockchain } from '@/lib/blockchain/hooks';
import {
  getActiveProposals,
  getProposalById,
  mapOnChainProposal,
  type Proposal as ChainProposal,
} from '@/services/pallets/governance';

export type Proposal = ChainProposal;

export interface Vote {
  voter: string;
  amount: bigint;
  voteType: 'Aye' | 'Nay' | 'Abstain';
  timestamp: number;
}

export interface VoteTally {
  aye: bigint;
  nay: bigint;
  abstain: bigint;
  total: bigint;
  approvalPercentage: number;
}

/**
 * Hook for Governance pallet queries
 * Provides proposals using the unified service.
 */
export function useGovernance() {
  const { isConnected } = useBlockchain();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let timer: NodeJS.Timeout;

    const fetchProposals = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const fetchedProposals = await getActiveProposals();

        if (!cancelled) {
          setProposals(fetchedProposals);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Governance service query error:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch proposals');
          setIsLoading(false);
        }
      }
    };

    fetchProposals();
    timer = setInterval(fetchProposals, 30_000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [isConnected]);

  return {
    proposals,
    isLoading,
    error,
    isConnected,
    refetch: async () => {
      try {
        const fetchedProposals = await getActiveProposals();
        setProposals(fetchedProposals);
      } catch (err) {
        console.error('Manual proposals fetch error:', err);
      }
    }
  };
}

/**
 * Hook to get specific proposal by ID
 */
export function useProposal(id: number) {
  const { isConnected } = useBlockchain();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let timer: NodeJS.Timeout;

    const fetchProposalDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const fetchedProposal = await getProposalById(id);
        
        if (!cancelled) {
          setProposal(fetchedProposal);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Proposal details query error:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch proposal details');
          setIsLoading(false);
        }
      }
    };

    fetchProposalDetails();
    timer = setInterval(fetchProposalDetails, 30_000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [isConnected, id]);

  return {
    proposal,
    isLoading,
    error,
    refetch: async () => {
      try {
        const fetchedProposal = await getProposalById(id);
        setProposal(fetchedProposal);
      } catch (err) {
        console.error('Manual proposal fetch error:', err);
      }
    }
  };
}

/**
 * Hook to get specific proposal by ID (Raw chain data)
 */
export function useProposalRaw(proposalId: number) {
  const { api, isConnected } = useBlockchain();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [tally, setTally] = useState<VoteTally | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!api || !isConnected) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const fetchProposalData = async () => {
      try {
        const opt: any = await api.query.governance?.proposals(proposalId);
        if (cancelled) return;

        if (!opt || (typeof opt.isNone === 'boolean' && opt.isNone)) {
          setProposal(null);
          setTally(null);
          setIsLoading(false);
          return;
        }

        const raw: any = typeof opt.unwrap === 'function' ? opt.unwrap() : opt;
        if (!raw) {
          setProposal(null);
          setTally(null);
          setIsLoading(false);
          return;
        }

        setProposal(mapOnChainProposal(raw, proposalId));

        // `proposal.voteTally` holds u32 *counts* (ayes/nays/abstentions), not
        // weighted balances.
        const counts = raw.voteTally ?? raw.vote_tally ?? {};
        const aye = BigInt(Number(counts.ayes ?? 0));
        const nay = BigInt(Number(counts.nays ?? 0));
        const abstain = BigInt(Number(counts.abstentions ?? 0));
        const total = aye + nay + abstain;

        setTally({
          aye,
          nay,
          abstain,
          total,
          approvalPercentage: total > 0n ? Number((aye * 10000n) / total) / 100 : 0,
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Proposal query error:', err);
        if (!cancelled) {
          setProposal(null);
          setTally(null);
          setIsLoading(false);
        }
      }
    };

    fetchProposalData();

    // Individual ballots live in `governance.votes`, a double map keyed by
    // (proposalId, AccountId). There is no on-chain index to enumerate them, so
    // the per-voter list stays empty; use `tally` for aggregate counts.
    setVotes([]);

    api.query.governance
      ?.proposals(proposalId, () => {
        void fetchProposalData();
      })
      .then((unsub) => {
        unsubscribe = unsub as unknown as () => void;
      })
      .catch(() => {
        // Subscription unavailable; the initial fetch above still stands.
      });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [api, isConnected, proposalId]);

  return {
    proposal,
    votes,
    tally,
    isLoading,
    isConnected,
  };
}
