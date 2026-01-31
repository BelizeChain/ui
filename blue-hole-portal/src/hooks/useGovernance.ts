'use client';

import { useState, useEffect } from 'react';
import { useBlockchain } from '@/lib/blockchain/hooks';

export interface Proposal {
  id: number;
  hash: string;
  proposer: string;
  title: string;
  description: string;
  amount: bigint;
  currency: 'DALLA' | 'bBZD';
  beneficiary: string;
  status: 'Active' | 'Passed' | 'Failed' | 'Rejected' | 'Executed';
  category: 'Treasury' | 'Policy' | 'Technical' | 'Emergency';
  createdAt: number;
  endsAt: number;
  deposit: bigint;
  threshold: number; // Percentage needed to pass (e.g., 66 for 66%)
}

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
 * Provides proposals, voting data, referendum info
 */
export function useGovernance() {
  const { api, isConnected } = useBlockchain();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !isConnected) {
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const fetchProposals = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Query public proposals (active)
        const publicProps: any = await api.query.belizeGovernance?.publicProps();
        const propArray = publicProps?.toArray() || [];

        // Query referendum count
        const refCount = await api.query.belizeGovernance?.referendumCount();
        const count = refCount ? parseInt(refCount.toString()) : 0;

        // Fetch all referendums
        const refPromises = [];
        for (let i = 0; i < count; i++) {
          refPromises.push(api.query.belizeGovernance?.referendumInfoOf(i));
        }

        const refResults = await Promise.all(refPromises);
        const parsedProposals = refResults
          .map((result: any, index) => {
            if (!result) return null;
            const ref = result.isSome ? result.unwrap() : result;
            if (!ref) return null;
            
            // Parse referendum data
            const ongoing = ref.isOngoing ? ref.asOngoing : ref;
            if (!ongoing) return null;

            return {
              id: index,
              hash: ongoing.proposalHash?.toString() || '',
              proposer: ongoing.proposer?.toString() || 'Unknown',
              title: ongoing.title?.toString() || `Referendum #${index}`,
              description: ongoing.description?.toString() || '',
              amount: ongoing.amount ? BigInt(ongoing.amount.toString()) : 0n,
              currency: ongoing.currency?.toString() as 'DALLA' | 'bBZD' || 'DALLA',
              beneficiary: ongoing.beneficiary?.toString() || '',
              status: 'Active' as const,
              category: ongoing.category?.toString() as any || 'Policy',
              createdAt: ongoing.createdAt ? parseInt(ongoing.createdAt.toString()) : Date.now(),
              endsAt: ongoing.endsAt ? parseInt(ongoing.endsAt.toString()) : Date.now() + 30 * 24 * 60 * 60 * 1000,
              deposit: ongoing.deposit ? BigInt(ongoing.deposit.toString()) : 0n,
              threshold: ongoing.threshold ? parseInt(ongoing.threshold.toString()) : 66,
            } as Proposal;
          })
          .filter((p): p is Proposal => p !== null);

        setProposals(parsedProposals);
        setIsLoading(false);
      } catch (err) {
        console.error('Governance pallet query error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch proposals');
        setIsLoading(false);
      }
    };

    fetchProposals();

    // Subscribe to proposal changes
    if (api.query.belizeGovernance?.publicProps) {
      api.query.belizeGovernance.publicProps((props: any) => {
        fetchProposals(); // Refetch on changes
      }).then((unsub) => {
        unsubscribe = unsub as any;
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [api, isConnected]);

  return {
    proposals,
    isLoading,
    error,
    isConnected,
  };
}

/**
 * Hook to get specific proposal by ID
 */
export function useProposal(proposalId: number) {
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
          id: proposalId,
          hash: ongoing.proposalHash?.toString() || '',
          proposer: ongoing.proposer?.toString() || 'Unknown',
          title: ongoing.title?.toString() || `Referendum #${proposalId}`,
          description: ongoing.description?.toString() || '',
          amount: ongoing.amount ? BigInt(ongoing.amount.toString()) : 0n,
          currency: ongoing.currency?.toString() as 'DALLA' | 'bBZD' || 'DALLA',
          beneficiary: ongoing.beneficiary?.toString() || '',
          status: 'Active',
          category: ongoing.category?.toString() as any || 'Policy',
          createdAt: ongoing.createdAt ? parseInt(ongoing.createdAt.toString()) : Date.now(),
          endsAt: ongoing.endsAt ? parseInt(ongoing.endsAt.toString()) : Date.now() + 30 * 24 * 60 * 60 * 1000,
          deposit: ongoing.deposit ? BigInt(ongoing.deposit.toString()) : 0n,
          threshold: ongoing.threshold ? parseInt(ongoing.threshold.toString()) : 66,
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
