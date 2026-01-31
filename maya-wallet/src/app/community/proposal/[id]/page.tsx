'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Coins,
  ChartBar,
  Users
} from 'phosphor-react';

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params.id as string;
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<'approve' | 'reject' | null>(null);

  // Mock proposal data - would come from blockchain
  const proposal = {
    id: parseInt(proposalId),
    title: proposalId === '42' ? 'Build Community Center in Orange Walk' : 
           proposalId === '43' ? 'Increase Tourism Cashback to 10%' :
           'Solar Panel Installation in Schools',
    description: `This proposal aims to ${proposalId === '42' ? 'construct a new community center in Orange Walk that will serve as a hub for local events, education programs, and community gatherings. The facility will include a multipurpose hall, computer lab, and meeting rooms.' :
      proposalId === '43' ? 'increase the tourism cashback reward from 7% to 10% to further incentivize spending at verified merchants and boost the local economy.' :
      'install solar panels on all public schools across Cayo district, reducing energy costs and promoting renewable energy education.'}`,
    district: proposalId === '42' ? 'Orange Walk' : proposalId === '43' ? 'Belize City' : 'Cayo',
    value: proposalId === '42' ? 50000 : proposalId === '43' ? 0 : 75000,
    status: proposalId === '42' ? 'passed' : 'voting' as 'voting' | 'passed' | 'rejected',
    votesFor: proposalId === '42' ? 1250 : proposalId === '43' ? 890 : 2100,
    votesAgainst: proposalId === '42' ? 340 : proposalId === '43' ? 560 : 450,
    deadline: proposalId === '42' ? 'Ended 2 days ago' : proposalId === '43' ? '3 days left' : '5 days left',
    proposer: {
      name: 'John Martinez',
      avatar: '👨🏾',
      address: '5Fj8x...9Kp2'
    },
    createdAt: '2026-01-10',
    details: {
      budget: proposalId === '42' ? [
        { item: 'Construction Materials', amount: 25000 },
        { item: 'Labor Costs', amount: 15000 },
        { item: 'Equipment', amount: 8000 },
        { item: 'Permits & Legal', amount: 2000 }
      ] : proposalId === '43' ? [] : [
        { item: 'Solar Panels', amount: 45000 },
        { item: 'Installation', amount: 20000 },
        { item: 'Maintenance Training', amount: 5000 },
        { item: 'Monitoring Systems', amount: 5000 }
      ],
      timeline: '6 months',
      beneficiaries: proposalId === '42' ? '5,000+ residents' : proposalId === '43' ? 'All tourists' : '2,500+ students'
    }
  };

  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  const approvalPercentage = totalVotes > 0 ? Math.round((proposal.votesFor / totalVotes) * 100) : 0;

  const handleVote = (vote: 'approve' | 'reject') => {
    setUserVote(vote);
    setHasVoted(true);
  };

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
            <h1 className="text-white text-xl font-bold">Proposal #{proposal.id}</h1>
            <p className="text-gray-400 text-sm">
              {proposal.status === 'voting' ? 'Active Vote' : proposal.status === 'passed' ? 'Passed' : 'Rejected'}
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
            proposal.status === 'passed' ? 'bg-emerald-500/100/20 text-emerald-400 border border-emerald-500/30' :
            proposal.status === 'rejected' ? 'bg-red-500/100/20 text-red-400 border border-red-500/30' :
            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {proposal.status === 'passed' ? <CheckCircle size={20} weight="fill" /> :
             proposal.status === 'rejected' ? <XCircle size={20} weight="fill" /> :
             <ChartBar size={20} weight="fill" />}
            <span className="font-semibold">{proposal.status === 'voting' ? 'Active Voting' : proposal.status === 'passed' ? 'Proposal Passed' : 'Proposal Rejected'}</span>
          </div>
        </motion.div>

        {/* Title & Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 mb-4"
        >
          <h2 className="text-white text-2xl font-bold mb-4">{proposal.title}</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin size={18} weight="fill" />
              <span className="text-sm">{proposal.district}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar size={18} weight="fill" />
              <span className="text-sm">{proposal.createdAt}</span>
            </div>
            {proposal.value > 0 && (
              <>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Coins size={18} weight="fill" />
                  <span className="text-sm font-semibold">Ɗ{proposal.value.toLocaleString()} DALLA</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Users size={18} weight="fill" />
                  <span className="text-sm">{proposal.details.beneficiaries}</span>
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-gray-700">
            <p className="text-gray-300 leading-relaxed">{proposal.description}</p>
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
                <span className="text-emerald-400 font-bold">{proposal.votesFor.toLocaleString()} votes ({approvalPercentage}%)</span>
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
                <span className="text-red-400 font-bold">{proposal.votesAgainst.toLocaleString()} votes ({100 - approvalPercentage}%)</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-red-500 to-rose-600 h-3 rounded-full transition-all"
                  style={{ width: `${100 - approvalPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {proposal.status === 'voting' && (
            <p className="text-gray-400 text-sm mt-4">Deadline: {proposal.deadline}</p>
          )}
        </motion.div>

        {/* Budget Breakdown */}
        {proposal.details.budget.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 mb-4"
          >
            <h3 className="text-white text-lg font-bold mb-4">Budget Breakdown</h3>
            <div className="space-y-3">
              {proposal.details.budget.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-300">{item.item}</span>
                  <span className="text-emerald-400 font-semibold">Ɗ{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-700 flex items-center justify-between">
                <span className="text-white font-bold">Total</span>
                <span className="text-emerald-400 font-bold text-lg">Ɗ{proposal.value.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Voting Actions */}
        {proposal.status === 'voting' && !hasVoted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 mb-4"
          >
            <h3 className="text-white text-lg font-bold mb-4">Cast Your Vote</h3>
            <p className="text-gray-400 text-sm mb-4">Your voting power: <span className="text-emerald-400 font-semibold">1,250 DALLA</span></p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleVote('approve')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={24} weight="fill" />
                Approve
              </button>
              <button
                onClick={() => handleVote('reject')}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <XCircle size={24} weight="fill" />
                Reject
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
                ? 'bg-emerald-500/100/10 border-emerald-500/30' 
                : 'bg-red-500/100/10 border-red-500/30'
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
                  Vote Cast Successfully!
                </h4>
                <p className="text-gray-400 text-sm">
                  You voted to {userVote} this proposal with 1,250 DALLA
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
