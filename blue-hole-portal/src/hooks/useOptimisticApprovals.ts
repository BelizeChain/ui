'use client';

import { useState, useCallback } from 'react';
import { useBlockchain } from '@/lib/blockchain/hooks';
import { useWalletStore } from '@/store/wallet';

interface OptimisticApproval {
  proposalId: string;
  approver: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  error?: string;
}

export function useOptimisticApprovals() {
  const { api } = useBlockchain();
  const { selectedAccount } = useWalletStore();
  const [optimisticApprovals, setOptimisticApprovals] = useState<Map<string, OptimisticApproval>>(
    new Map()
  );
  const [isApproving, setIsApproving] = useState(false);

  // Add optimistic approval instantly
  const addOptimisticApproval = useCallback((proposalId: string) => {
    if (!selectedAccount) return;

    const approvalKey = `${proposalId}-${selectedAccount.address}`;
    const optimisticApproval: OptimisticApproval = {
      proposalId,
      approver: selectedAccount.address,
      timestamp: Date.now(),
      status: 'pending',
    };

    setOptimisticApprovals((prev) => {
      const updated = new Map(prev);
      updated.set(approvalKey, optimisticApproval);
      return updated;
    });

    return approvalKey;
  }, [selectedAccount]);

  // Update approval status
  const updateApprovalStatus = useCallback((
    approvalKey: string,
    status: 'confirmed' | 'failed',
    txHash?: string,
    error?: string
  ) => {
    setOptimisticApprovals((prev) => {
      const updated = new Map(prev);
      const approval = updated.get(approvalKey);
      if (approval) {
        updated.set(approvalKey, { ...approval, status, txHash, error });
      }
      return updated;
    });

    // Remove after 5 seconds if confirmed
    if (status === 'confirmed') {
      setTimeout(() => {
        setOptimisticApprovals((prev) => {
          const updated = new Map(prev);
          updated.delete(approvalKey);
          return updated;
        });
      }, 5000);
    }
  }, []);

  // Remove approval manually
  const removeOptimisticApproval = useCallback((approvalKey: string) => {
    setOptimisticApprovals((prev) => {
      const updated = new Map(prev);
      updated.delete(approvalKey);
      return updated;
    });
  }, []);

  // Submit approval to blockchain
  const submitApproval = useCallback(async (
    proposalId: string,
    proposalType: 'treasury' | 'kyc' | 'governance' = 'treasury'
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!api || !selectedAccount) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsApproving(true);

    // Add optimistic approval first
    const approvalKey = addOptimisticApproval(proposalId);
    if (!approvalKey) {
      setIsApproving(false);
      return { success: false, error: 'Failed to create optimistic approval' };
    }

    try {
      // Create approval extrinsic based on type
      let approvalExtrinsic;
      if (proposalType === 'treasury') {
        approvalExtrinsic = (api.tx as any).belizeEconomy.approveProposal(proposalId);
      } else if (proposalType === 'kyc') {
        approvalExtrinsic = (api.tx as any).belizeCompliance.approveApplication(proposalId);
      } else {
        approvalExtrinsic = (api.tx as any).belizeGovernance.approveProposal(proposalId);
      }

      // Sign and send transaction
      return new Promise((resolve) => {
        approvalExtrinsic.signAndSend(
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

              // Update approval status
              updateApprovalStatus(
                approvalKey,
                success ? 'confirmed' : 'failed',
                txHash,
                error
              );

              setIsApproving(false);
              resolve({ success, txHash, error });
            }
          }
        ).catch((err: Error) => {
          const error = err.message || 'Transaction failed';
          updateApprovalStatus(approvalKey, 'failed', undefined, error);
          setIsApproving(false);
          resolve({ success: false, error });
        });
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      updateApprovalStatus(approvalKey, 'failed', undefined, error);
      setIsApproving(false);
      return { success: false, error };
    }
  }, [api, selectedAccount, addOptimisticApproval, updateApprovalStatus]);

  // Submit rejection to blockchain
  const submitRejection = useCallback(async (
    proposalId: string,
    proposalType: 'treasury' | 'kyc' | 'governance' = 'treasury',
    reason?: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!api || !selectedAccount) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsApproving(true);

    try {
      // Create rejection extrinsic based on type
      let rejectionExtrinsic;
      if (proposalType === 'treasury') {
        rejectionExtrinsic = (api.tx as any).belizeEconomy.rejectProposal(proposalId);
      } else if (proposalType === 'kyc') {
        rejectionExtrinsic = (api.tx as any).belizeCompliance.rejectApplication(proposalId, reason || '');
      } else {
        rejectionExtrinsic = (api.tx as any).belizeGovernance.rejectProposal(proposalId);
      }

      // Sign and send transaction
      return new Promise((resolve) => {
        rejectionExtrinsic.signAndSend(
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

              setIsApproving(false);
              resolve({ success, txHash, error });
            }
          }
        ).catch((err: Error) => {
          const error = err.message || 'Transaction failed';
          setIsApproving(false);
          resolve({ success: false, error });
        });
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setIsApproving(false);
      return { success: false, error };
    }
  }, [api, selectedAccount]);

  // Calculate approval count with optimistic approvals
  const calculateOptimisticApprovalCount = useCallback((
    proposalId: string,
    currentCount: number
  ): number => {
    const pendingApprovals = Array.from(optimisticApprovals.values()).filter(
      (a) => a.proposalId === proposalId && a.status === 'pending'
    );
    return currentCount + pendingApprovals.length;
  }, [optimisticApprovals]);

  // Get pending approvals for a proposal
  const getPendingApprovals = useCallback((proposalId: string) => {
    return Array.from(optimisticApprovals.values()).filter(
      (a) => a.proposalId === proposalId
    );
  }, [optimisticApprovals]);

  // Check if user has pending approval
  const hasPendingApproval = useCallback((proposalId: string) => {
    if (!selectedAccount) return false;
    const approvalKey = `${proposalId}-${selectedAccount.address}`;
    return optimisticApprovals.has(approvalKey);
  }, [selectedAccount, optimisticApprovals]);

  return {
    submitApproval,
    submitRejection,
    calculateOptimisticApprovalCount,
    getPendingApprovals,
    hasPendingApproval,
    removeOptimisticApproval,
    isApproving,
    optimisticApprovals: Array.from(optimisticApprovals.values()),
  };
}
