'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Coins,
  ChartBar,
  Users,
  Calendar,
} from 'phosphor-react';
import { getProposalById, voteOnProposal, type Proposal } from '@/services/pallets';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/contexts/ToastContext';

type UiStatus = 'voting' | 'passed' | 'rejected';

function mapStatusForUi(chainStatus: string): UiStatus {
  const s = chainStatus.toLowerCase();
  if (s === 'approved' || s === 'executed') return 'passed';
  if (s === 'rejected' || s === 'cancelled') return 'rejected';
  return 'voting';
}

function shortAddress(addr: string): string {
  if (!addr) return '';
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params.id as string;
  const proposalIdNum = Number.parseInt(proposalId, 10);

  const { selectedAccount } = useWallet();
  const { showToast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<'approve' | 'reject' | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(proposalIdNum)) {
      setLoadError('Invalid proposal ID');
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    const POLL_MS = 15_000;
    const refresh = async () => {
      try {
        const result = await getProposalById(proposalIdNum);
        if (cancelled) return;
        if (!result) {
          setProposal(null);
          setLoadError(`Proposal #${proposalIdNum} not found on-chain`);
        } else {
          setProposal(result);
          setLoadError(null);
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load proposal');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    setIsLoading(true);
    void refresh();
    const interval = setInterval(() => { void refresh(); }, POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [proposalIdNum]);

  const handleVote = async (vote: 'approve' | 'reject') => {
    if (!selectedAccount) {
      showToast({ type: 'warning', message: 'Connect a wallet account to vote.' });
      return;
    }
    if (!proposal) return;
    try {
      setIsVoting(true);
      const { hash } = await voteOnProposal(
        selectedAccount.address,
        proposal.index,
        vote === 'approve' ? 'Aye' : 'Nay',
        'None',
      );
      setUserVote(vote);
      setHasVoted(true);
      showToast({
        type: 'success',
        message: `Vote ${vote === 'approve' ? 'APPROVE' : 'REJECT'} submitted (${hash.slice(0, 10)}…).`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vote submission failed';
      showToast({ type: 'error', message });
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <p className="text-gray-400 text-sm">Loading proposal #{proposalId}…</p>
      </div>
    );
  }

  if (loadError || !proposal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 px-6">
        <p className="text-red-400 text-sm mb-3">{loadError ?? 'Proposal unavailable'}</p>
        <Link href="/community" className="text-emerald-400 underline text-sm">Back to Community</Link>
      </div>
    );
  }

  const uiStatus = mapStatusForUi(proposal.status);
  const votesFor = proposal.voteCount.ayes;
  const votesAgainst = proposal.voteCount.nays;
  const totalVotes = votesFor + votesAgainst;
  const approvalPercentage = totalVotes > 0 ? Math.round((votesFor / totalVotes) * 100) : 0;
  const numericValue = Number.parseFloat(proposal.value) || 0;
  const displayTitle = proposal.title || `Proposal #${proposal.index}`;
  const displayDescription = proposal.description || 'No description provided on-chain.';
  const categoryLabel = proposal.category || 'General';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 z-10">
        <div className="flex items-center gap-4">
          <Link href="/community">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-white" weight="bold" />
            </motion.button>
          </Link>
          <div>
            <h1 className="text-white text-xl font-bold">Proposal #{proposal.index}</h1>
            <p className="text-gray-400 text-sm">
              {uiStatus === 'voting' ? 'Active Vote' : uiStatus === 'passed' ? 'Passed' : 'Rejected'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-6">
        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            uiStatus === 'passed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            uiStatus === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {uiStatus === 'passed' ? <CheckCircle size={20} weight="fill" /> :
             uiStatus === 'rejected' ? <XCircle size={20} weight="fill" /> :
             <ChartBar size={20} weight="fill" />}
            <span className="font-semibold">{uiStatus === 'voting' ? 'Active Voting' : uiStatus === 'passed' ? 'Proposal Passed' : 'Proposal Rejected'}</span>
          </div>
        </motion.div>

        {/* Title & Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 mb-4"
        >
          <h2 className="text-white text-2xl font-bold mb-4">{displayTitle}</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-400">
              <ChartBar size={18} weight="fill" />
              <span className="text-sm">{categoryLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar size={18} weight="fill" />
              <span className="text-sm">Block #{proposal.createdAt.toLocaleString()}</span>
            </div>
            {numericValue > 0 && (
              <>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Coins size={18} weight="fill" />
                  <span className="text-sm font-semibold">Ɗ{numericValue.toLocaleString()} DALLA</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Users size={18} weight="fill" />
                  <span className="text-sm font-mono">{shortAddress(proposal.beneficiary)}</span>
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-gray-700">
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{displayDescription}</p>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-700 flex items-center gap-2 text-gray-400">
            <Users size={16} weight="fill" />
            <span className="text-xs">Proposed by</span>
            <span className="text-xs font-mono text-gray-300">{shortAddress(proposal.proposer)}</span>
          </div>
        </motion.div>

        {/* Voting Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 mb-4"
        >
          <h3 className="text-white text-lg font-bold mb-4">Voting Results</h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={20} weight="fill" className="text-emerald-400" />
                  <span className="text-white font-semibold">Approve</span>
                </div>
                <span className="text-emerald-400 font-bold">{votesFor.toLocaleString()} votes ({approvalPercentage}%)</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full transition-all"
                  style={{ width: `${approvalPercentage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <XCircle size={20} weight="fill" className="text-red-400" />
                  <span className="text-white font-semibold">Reject</span>
                </div>
                <span className="text-red-400 font-bold">{votesAgainst.toLocaleString()} votes ({totalVotes > 0 ? 100 - approvalPercentage : 0}%)</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-red-500 to-rose-600 h-3 rounded-full transition-all"
                  style={{ width: `${totalVotes > 0 ? 100 - approvalPercentage : 0}%` }}
                />
              </div>
            </div>
          </div>

          {uiStatus === 'voting' && proposal.voteEnd > 0 && (
            <p className="text-gray-400 text-sm mt-4">Voting ends at block #{proposal.voteEnd.toLocaleString()}</p>
          )}
        </motion.div>

        {/* Voting Actions */}
        {uiStatus === 'voting' && !hasVoted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 mb-4"
          >
            <h3 className="text-white text-lg font-bold mb-4">Cast Your Vote</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleVote('approve')}
                disabled={isVoting}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={24} weight="fill" />
                {isVoting ? 'Submitting…' : 'Approve'}
              </button>
              <button
                onClick={() => handleVote('reject')}
                disabled={isVoting}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <XCircle size={24} weight="fill" />
                {isVoting ? 'Submitting…' : 'Reject'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Vote Confirmation */}
        {hasVoted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl p-6 border mb-4 ${
              userVote === 'approve'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              {userVote === 'approve' ? (
                <CheckCircle size={32} weight="fill" className="text-emerald-400" />
              ) : (
                <XCircle size={32} weight="fill" className="text-red-400" />
              )}
              <div>
                <h4 className={`font-bold ${userVote === 'approve' ? 'text-emerald-400' : 'text-red-400'}`}>
                  Vote Submitted!
                </h4>
                <p className="text-gray-400 text-sm">
                  You voted to {userVote} this proposal.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
