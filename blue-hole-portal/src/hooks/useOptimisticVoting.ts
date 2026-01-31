'use client';

import { useState, useCallback } from 'react';
import { useBlockchain } from '@/lib/blockchain/hooks';
import { useWalletStore } from '@/store/wallet';

export type VoteType = 'Aye' | 'Nay' | 'Abstain';

interface OptimisticVote {
  proposalId: string;
  voter: string;
  amount: bigint;
  voteType: VoteType;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  error?: string;
}

interface VoteTally {
  aye: bigint;
  nay: bigint;
  abstain: bigint;
  total: bigint;
  approvalPercentage: number;
}

export function useOptimisticVoting() {
  const { api } = useBlockchain();
  const { selectedAccount } = useWalletStore();
  const [optimisticVotes, setOptimisticVotes] = useState<Map<string, OptimisticVote>>(new Map());
  const [isVoting, setIsVoting] = useState(false);

  // Add optimistic vote instantly
  const addOptimisticVote = useCallback((
    proposalId: string,
    amount: bigint,
    voteType: VoteType
  ) => {
    if (!selectedAccount) return;

    const voteKey = `${proposalId}-${selectedAccount.address}`;
    const optimisticVote: OptimisticVote = {
      proposalId,
      voter: selectedAccount.address,
      amount,
      voteType,
      timestamp: Date.now(),
      status: 'pending',
    };

    setOptimisticVotes((prev) => {
      const updated = new Map(prev);
      updated.set(voteKey, optimisticVote);
      return updated;
    });

    return voteKey;
  }, [selectedAccount]);

  // Update vote status
  const updateVoteStatus = useCallback((
    voteKey: string,
    status: 'confirmed' | 'failed',
    txHash?: string,
    error?: string
  ) => {
    setOptimisticVotes((prev) => {
      const updated = new Map(prev);
      const vote = updated.get(voteKey);
      if (vote) {
        updated.set(voteKey, { ...vote, status, txHash, error });
      }
      return updated;
    });

    // Remove after 5 seconds if confirmed (failed stays for manual dismissal)
    if (status === 'confirmed') {
      setTimeout(() => {
        setOptimisticVotes((prev) => {
          const updated = new Map(prev);
          updated.delete(voteKey);
          return updated;
        });
      }, 5000);
    }
  }, []);

  // Remove vote manually
  const removeOptimisticVote = useCallback((voteKey: string) => {
    setOptimisticVotes((prev) => {
      const updated = new Map(prev);
      updated.delete(voteKey);
      return updated;
    });
  }, []);

  // Submit vote to blockchain
  const submitVote = useCallback(async (
    proposalId: string,
    amount: bigint,
    voteType: VoteType
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!api || !selectedAccount) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsVoting(true);

    // Add optimistic vote first
    const voteKey = addOptimisticVote(proposalId, amount, voteType);
    if (!voteKey) {
      setIsVoting(false);
      return { success: false, error: 'Failed to create optimistic vote' };
    }

    try {
      // Create vote extrinsic
      const voteExtrinsic = (api.tx as any).belizeGovernance.vote(
        proposalId,
        {
          Standard: {
            vote: voteType === 'Aye' ? { aye: true } : voteType === 'Nay' ? { nay: true } : { abstain: true },
            balance: amount.toString(),
          },
        }
      );

      // Sign and send transaction
      return new Promise((resolve) => {
        voteExtrinsic.signAndSend(
          selectedAccount.address,
          ({ status, events, dispatchError }: any) => {
            if (status.isInBlock || status.isFinalized) {
              let success = true;
              let error: string | undefined;
              const txHash = status.asInBlock?.toString() || status.asFinalized?.toString();

              // Check for errors
              if (dispatchError) {
                success = false;
                if (dispatchError.isModule) {
                  const decoded = api.registry.findMetaError(dispatchError.asModule);
                  error = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
                } else {
                  error = dispatchError.toString();
                }
              }

              // Update vote status
              updateVoteStatus(
                voteKey,
                success ? 'confirmed' : 'failed',
                txHash,
                error
              );

              setIsVoting(false);
              resolve({ success, txHash, error });
            }
          }
        ).catch((err: Error) => {
          const error = err.message || 'Transaction failed';
          updateVoteStatus(voteKey, 'failed', undefined, error);
          setIsVoting(false);
          resolve({ success: false, error });
        });
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      updateVoteStatus(voteKey, 'failed', undefined, error);
      setIsVoting(false);
      return { success: false, error };
    }
  }, [api, selectedAccount, addOptimisticVote, updateVoteStatus]);

  // Calculate tally with optimistic votes
  const calculateOptimisticTally = useCallback((
    proposalId: string,
    currentTally: VoteTally
  ): VoteTally => {
    const proposalVotes = Array.from(optimisticVotes.values()).filter(
      (v) => v.proposalId === proposalId && v.status === 'pending'
    );

    let aye = currentTally.aye;
    let nay = currentTally.nay;
    let abstain = currentTally.abstain;

    proposalVotes.forEach((vote) => {
      if (vote.voteType === 'Aye') aye += vote.amount;
      else if (vote.voteType === 'Nay') nay += vote.amount;
      else abstain += vote.amount;
    });

    const total = aye + nay + abstain;
    const approvalPercentage = total > 0n 
      ? Number((aye * 10000n) / total) / 100 
      : 0;

    return { aye, nay, abstain, total, approvalPercentage };
  }, [optimisticVotes]);

  // Get pending votes for a proposal
  const getPendingVotes = useCallback((proposalId: string) => {
    return Array.from(optimisticVotes.values()).filter(
      (v) => v.proposalId === proposalId
    );
  }, [optimisticVotes]);

  // Check if user has pending vote
  const hasPendingVote = useCallback((proposalId: string) => {
    if (!selectedAccount) return false;
    const voteKey = `${proposalId}-${selectedAccount.address}`;
    return optimisticVotes.has(voteKey);
  }, [selectedAccount, optimisticVotes]);

  return {
    submitVote,
    calculateOptimisticTally,
    getPendingVotes,
    hasPendingVote,
    removeOptimisticVote,
    isVoting,
    optimisticVotes: Array.from(optimisticVotes.values()),
  };
}
