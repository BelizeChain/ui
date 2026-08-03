'use client';

import { useState, useEffect } from 'react';
import { useBlockchain } from '@/lib/blockchain/hooks';
import {
  getActiveProposals,
  getProposalById,
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

    let unsubscribe: (() => void) | undefined;

    const fetchProposalData = async () => {
      try {
        setIsLoading(true);

        // Query referendum info
        const refInfo: any = await api.query.belizeGovernance?.referendumInfoOf(proposalId);
        if (!refInfo) {
          setProposal(null);
          setIsLoading(false);
          return;
        }

        const ref: any = refInfo.isSome ? refInfo.unwrap() : refInfo;
        const ongoing = ref.isOngoing ? ref.asOngoing : ref;
        if (!ongoing || !ongoing.proposer) {
          setProposal(null);
          setIsLoading(false);
          return;
        }

        // Parse proposal
        const parsedProposal: Proposal = {
          index: proposalId,
          hash: ongoing.proposalHash?.toString() || '',
          proposer: ongoing.proposer?.toString() || 'Unknown',
          title: ongoing.title?.toString() || `Referendum #${proposalId}`,
          description: ongoing.description?.toString() || '',
          value: ongoing.amount ? ongoing.amount.toString() : '0',
          beneficiary: ongoing.beneficiary?.toString() || '',
          status: 'Active',
          category: ongoing.category?.toString() as any || 'Policy',
          createdAt: ongoing.createdAt ? parseInt(ongoing.createdAt.toString()) : Date.now(),
          voteEnd: ongoing.endsAt ? parseInt(ongoing.endsAt.toString()) : Date.now() + 30 * 24 * 60 * 60 * 1000,
          bond: ongoing.deposit ? ongoing.deposit.toString() : '0',
          voteCount: {
            ayes: ongoing.tally?.ayes ? parseInt(ongoing.tally.ayes.toString()) : 0,
            nays: ongoing.tally?.nays ? parseInt(ongoing.tally.nays.toString()) : 0,
          }
        };

        setProposal(parsedProposal);

        // Query votes for this proposal
        const votingData: any = await api.query.belizeGovernance?.voting(proposalId);
        if (votingData) {
          const voting: any = votingData.isSome ? votingData.unwrap() : votingData;
          const voteArray = voting.votes?.toArray() || [];
          
          const parsedVotes: Vote[] = voteArray.map((vote: any) => ({
            voter: vote.voter.toString(),
            amount: BigInt(vote.amount.toString()),
            voteType: vote.voteType.toString() as 'Aye' | 'Nay' | 'Abstain',
            timestamp: vote.timestamp ? parseInt(vote.timestamp.toString()) : Date.now(),
          }));

          setVotes(parsedVotes);

          // Calculate tally
          const aye = parsedVotes
            .filter(v => v.voteType === 'Aye')
            .reduce((sum, v) => sum + v.amount, 0n);
          const nay = parsedVotes
            .filter(v => v.voteType === 'Nay')
            .reduce((sum, v) => sum + v.amount, 0n);
          const abstain = parsedVotes
            .filter(v => v.voteType === 'Abstain')
            .reduce((sum, v) => sum + v.amount, 0n);
          const total = aye + nay + abstain;

          setTally({
            aye,
            nay,
            abstain,
            total,
            approvalPercentage: total > 0n ? Number(aye * 10000n / total) / 100 : 0,
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Proposal query error:', err);
        setProposal(null);
        setIsLoading(false);
      }
    };

    fetchProposalData();

    // Subscribe to voting changes
    if (api.query.belizeGovernance?.voting) {
      api.query.belizeGovernance.voting(proposalId, (voting: any) => {
        fetchProposalData(); // Refetch on vote changes
      }).then((unsub) => {
        unsubscribe = unsub as any;
      });
    }

    return () => {
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
