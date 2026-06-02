'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  CalendarBlank,
  Coins,
  FileText,
  Users,
  TrendUp,
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
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
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

  const handleVote = async (voteType: 'yes' | 'no') => {
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
        voteType === 'yes' ? 'Aye' : 'Nay',
        'None',
      );
      setHasVoted(true);
      showToast({
        type: 'success',
        message: `Vote ${voteType === 'yes' ? 'YES' : 'NO'} submitted (${hash.slice(0, 10)}…).`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vote submission failed';
      showToast({ type: 'error', message });
    } finally {
      setIsVoting(false);
    }
  };

  const statusColors: Record<UiStatus, string> = {
    voting: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    passed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
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
  const ayes = proposal.voteCount.ayes;
  const nays = proposal.voteCount.nays;
  const totalVotes = ayes + nays;
  const yesPercentage = totalVotes > 0 ? (ayes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (nays / totalVotes) * 100 : 0;
  const numericBudget = Number.parseFloat(proposal.value) || 0;
  const displayTitle = proposal.title || `Proposal #${proposal.index}`;
  const displayDescription = proposal.description || 'No description provided on-chain.';
  const categoryLabel = proposal.category || 'General';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4 z-10">
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
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-white text-xl font-bold">Proposal #{proposal.index}</h1>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusColors[uiStatus]}`}>
                {uiStatus === 'voting' ? <Clock size={12} weight="fill" aria-hidden="true" /> : uiStatus === 'passed' ? <CheckCircle size={12} weight="fill" aria-hidden="true" /> : <XCircle size={12} weight="fill" aria-hidden="true" />}
                {uiStatus === 'voting' ? 'Voting' : uiStatus === 'passed' ? 'Passed' : 'Rejected'}
              </span>
            </div>
            <p className="text-gray-400 text-sm">{categoryLabel}</p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-white text-2xl font-bold mb-4">{displayTitle}</h2>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={16} className="text-emerald-400" weight="fill" />
                <p className="text-gray-400 text-xs">Category</p>
              </div>
              <p className="text-white font-semibold">{categoryLabel}</p>
            </div>

            {numericBudget > 0 && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Coins size={16} className="text-amber-400" weight="fill" />
                  <p className="text-gray-400 text-xs">Budget</p>
                </div>
                <p className="text-white font-semibold">Ɗ{numericBudget.toLocaleString()}</p>
              </div>
            )}

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-1">
                <CalendarBlank size={16} className="text-purple-400" weight="fill" />
                <p className="text-gray-400 text-xs">Voting starts (block)</p>
              </div>
              <p className="text-white font-semibold">#{proposal.createdAt.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-blue-400" weight="fill" />
                <p className="text-gray-400 text-xs">Proposer</p>
              </div>
              <p className="text-white font-semibold text-sm font-mono">{shortAddress(proposal.proposer)}</p>
            </div>
          </div>
        </motion.div>

        {/* Voting Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border border-gray-700/50 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendUp size={20} className="text-emerald-400" weight="fill" />
            <h3 className="text-white font-bold">Current Results</h3>
          </div>

          <div className="space-y-4">
            {/* Yes Votes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-400 font-semibold">Yes Votes</span>
                <span className="text-white font-bold">{ayes.toLocaleString()} ({yesPercentage.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${yesPercentage}%` }}
                />
              </div>
            </div>

            {/* No Votes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-400 font-semibold">No Votes</span>
                <span className="text-white font-bold">{nays.toLocaleString()} ({noPercentage.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-red-500 to-rose-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${noPercentage}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-700/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Total Votes</span>
                <span className="text-white font-semibold">{totalVotes.toLocaleString()}</span>
              </div>
              {uiStatus === 'voting' && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">Voting ends (block)</span>
                  <span className="text-amber-400 font-semibold">#{proposal.voteEnd.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Proposal Description (on-chain) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 border border-gray-700/50 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText size={20} className="text-blue-400" weight="fill" />
            <h3 className="text-white font-bold">Proposal Details</h3>
          </div>

          <div className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
            {displayDescription}
          </div>
        </motion.div>

        {/* Voting Buttons */}
        {uiStatus === 'voting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            <button
              onClick={() => void handleVote('yes')}
              disabled={hasVoted || isVoting || !selectedAccount}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={24} weight="fill" />
              <span>{hasVoted ? 'Voted Yes' : isVoting ? 'Submitting…' : 'Vote Yes'}</span>
            </button>

            <button
              onClick={() => void handleVote('no')}
              disabled={hasVoted || isVoting || !selectedAccount}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <XCircle size={24} weight="fill" />
              <span>{hasVoted ? 'Voted No' : isVoting ? 'Submitting…' : 'Vote No'}</span>
            </button>
          </motion.div>
        )}

        {!selectedAccount && uiStatus === 'voting' && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
            <p className="text-amber-300 text-xs">Connect a wallet account to cast a vote on-chain.</p>
          </div>
        )}

        {hasVoted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-500/100/20 border border-emerald-500/30 rounded-xl p-4 text-center"
          >
            <CheckCircle size={32} weight="fill" className="text-emerald-400 mx-auto mb-2" />
            <p className="text-emerald-400 font-semibold">Your vote has been submitted!</p>
            <p className="text-gray-400 text-sm mt-1">It will be reflected on-chain within a few blocks.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
