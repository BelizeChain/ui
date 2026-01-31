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
  CalendarBlank,
  Coins,
  FileText,
  Users,
  TrendUp
} from 'phosphor-react';

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params.id as string;
  const [hasVoted, setHasVoted] = useState(false);

  // Mock proposal data - in production, fetch from Pakit using proposal hash
  const proposal = {
    id: parseInt(proposalId),
    title: proposalId === '42' 
      ? 'Build Community Center in Orange Walk'
      : proposalId === '43'
      ? 'Increase Tourism Cashback to 10%'
      : 'Solar Panel Installation in Schools',
    district: proposalId === '42' ? 'Orange Walk' : proposalId === '43' ? 'Belize City' : 'Cayo',
    value: proposalId === '42' ? 50000 : proposalId === '43' ? 0 : 75000,
    status: proposalId === '42' ? 'passed' as const : 'voting' as const,
    votesFor: proposalId === '42' ? 1250 : proposalId === '43' ? 890 : 2100,
    votesAgainst: proposalId === '42' ? 340 : proposalId === '43' ? 560 : 450,
    deadline: proposalId === '42' ? 'Ended 2 days ago' : proposalId === '43' ? '3 days left' : '5 days left',
    proposer: {
      name: 'John Martinez',
      address: '5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc',
      avatar: '👨🏾'
    },
    createdAt: '2026-01-15',
    // This content would be fetched from Pakit in production
    pakitHash: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    description: proposalId === '42'
      ? 'This proposal seeks funding for the construction of a new community center in Orange Walk district. The center will serve as a hub for local events, education programs, and community gatherings. The facility will include a main hall (capacity 200), two meeting rooms, a computer lab with 20 workstations, and outdoor recreational space.\n\nKey Features:\n• 2,500 sq ft main hall with stage\n• Climate-controlled meeting rooms\n• Free public WiFi\n• Solar panels for sustainable energy\n• Wheelchair accessible throughout\n\nTimeline: Construction will begin 30 days after approval and is estimated to complete in 8 months.\n\nBudget Breakdown:\n• Construction: 35,000 DALLA\n• Equipment: 8,000 DALLA  \n• Landscaping: 4,000 DALLA\n• Contingency: 3,000 DALLA\n\nTotal: 50,000 DALLA'
      : proposalId === '43'
      ? 'This proposal recommends increasing the tourism cashback reward from the current 7% to 10% for all purchases made at verified tourism merchants across Belize.\n\nRationale:\nBelize\'s tourism sector is our primary economic driver. By increasing incentives, we can:\n• Boost tourist spending by an estimated 15%\n• Encourage more businesses to join the verified merchant program\n• Strengthen DALLA adoption among international visitors\n• Compete with neighboring countries offering similar programs\n\nImpact Analysis:\n• Current program: 7% cashback on ~$2M monthly tourism spending\n• Projected increase: 10% cashback on ~$2.3M monthly (15% growth)\n• Additional cost: ~90,000 DALLA/month from treasury\n• Expected ROI: 18-24 months through increased economic activity and tax revenue\n\nImplementation:\nIf approved, changes will take effect at the start of the next quarter (April 1, 2026).'
      : 'This proposal requests funding for solar panel installation across 15 public schools in Cayo district, reducing energy costs and providing hands-on renewable energy education for students.\n\nObjectives:\n• Install 5kW solar systems on each of 15 schools\n• Reduce electricity costs by 60-70%\n• Create educational programs around renewable energy\n• Achieve carbon neutrality for district schools by 2027\n\nBenefits:\n• Annual savings: ~18,000 DALLA in electricity costs\n• Educational value: Real-world STEM learning opportunities  \n• Environmental: Reduce CO2 emissions by 75 tons/year\n• Community: Excess power can support evening community programs\n\nInstallation Plan:\n• Phase 1 (Months 1-2): 5 schools\n• Phase 2 (Months 3-4): 5 schools\n• Phase 3 (Months 5-6): 5 schools\n\nBudget:\n• Solar panels & equipment: 52,000 DALLA\n• Installation: 15,000 DALLA\n• Monitoring systems: 5,000 DALLA\n• Training & maintenance (1yr): 3,000 DALLA'
  };

  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  const yesPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;

  const handleVote = (voteType: 'yes' | 'no') => {
    // TODO: Submit vote to blockchain
    setHasVoted(true);
    console.log(`Voted ${voteType} on proposal #${proposalId}`);
  };

  const statusColors = {
    voting: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    passed: 'bg-emerald-500/100/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/100/20 text-red-400 border-red-500/30'
  };

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
              <h1 className="text-white text-xl font-bold">Proposal #{proposal.id}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[proposal.status]}`}>
                {proposal.status === 'voting' ? '🗳️ Voting' : proposal.status === 'passed' ? '✅ Passed' : '❌ Rejected'}
              </span>
            </div>
            <p className="text-gray-400 text-sm">{proposal.district}</p>
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
          <h2 className="text-white text-2xl font-bold mb-4">{proposal.title}</h2>
          
          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={16} className="text-emerald-400" weight="fill" />
                <p className="text-gray-400 text-xs">District</p>
              </div>
              <p className="text-white font-semibold">{proposal.district}</p>
            </div>
            
            {proposal.value > 0 && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 border border-gray-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <Coins size={16} className="text-amber-400" weight="fill" />
                  <p className="text-gray-400 text-xs">Budget</p>
                </div>
                <p className="text-white font-semibold">Ɗ{proposal.value.toLocaleString()}</p>
              </div>
            )}
            
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-1">
                <CalendarBlank size={16} className="text-purple-400" weight="fill" />
                <p className="text-gray-400 text-xs">Created</p>
              </div>
              <p className="text-white font-semibold">{proposal.createdAt}</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} className="text-blue-400" weight="fill" />
                <p className="text-gray-400 text-xs">Proposer</p>
              </div>
              <p className="text-white font-semibold text-sm">{proposal.proposer.name}</p>
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
                <span className="text-white font-bold">{proposal.votesFor.toLocaleString()} ({yesPercentage.toFixed(1)}%)</span>
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
                <span className="text-white font-bold">{proposal.votesAgainst.toLocaleString()} ({noPercentage.toFixed(1)}%)</span>
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
              {proposal.deadline && proposal.status === 'voting' && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-400">Time Remaining</span>
                  <span className="text-amber-400 font-semibold">{proposal.deadline}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Proposal Description (from Pakit) */}
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
            {proposal.description}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700/50">
            <p className="text-gray-500 text-xs">
              Stored on Pakit: <span className="text-emerald-400 font-mono">{proposal.pakitHash}</span>
            </p>
          </div>
        </motion.div>

        {/* Voting Buttons */}
        {proposal.status === 'voting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            <button
              onClick={() => handleVote('yes')}
              disabled={hasVoted}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={24} weight="fill" />
              <span>{hasVoted ? 'Voted Yes' : 'Vote Yes'}</span>
            </button>

            <button
              onClick={() => handleVote('no')}
              disabled={hasVoted}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <XCircle size={24} weight="fill" />
              <span>{hasVoted ? 'Voted No' : 'Vote No'}</span>
            </button>
          </motion.div>
        )}

        {hasVoted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-500/100/20 border border-emerald-500/30 rounded-xl p-4 text-center"
          >
            <CheckCircle size={32} weight="fill" className="text-emerald-400 mx-auto mb-2" />
            <p className="text-emerald-400 font-semibold">Your vote has been recorded!</p>
            <p className="text-gray-400 text-sm mt-1">Thank you for participating in governance</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
