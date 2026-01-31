'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, ChartLine, Plus, CheckCircle, Warning } from 'phosphor-react';
import { useI18n } from '@belizechain/shared';
import { useWallet } from '@/contexts/WalletContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import * as governanceService from '@/services/pallets/governance';

export default function GovernancePage() {
  const router = useRouter();
  const { t } = useI18n();
  const { selectedAccount, isConnected } = useWallet();
  
  const [proposals, setProposals] = useState<governanceService.Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch proposals from blockchain
  useEffect(() => {
    async function fetchProposals() {
      setLoading(true);
      setError(null);
      
      try {
        const activeProposals = await governanceService.getActiveProposals();
        setProposals(activeProposals);
      } catch (err: any) {
        console.error('Failed to fetch proposals:', err);
        setError(err.message || 'Unable to load proposals. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProposals();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchProposals, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate time remaining
  const calculateTimeRemaining = (voteEnd: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = voteEnd - now;
    if (remaining <= 0) return 'Ended';
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    if (days > 0) return `${days} days`;
    return `${hours} hours`;
  };

  // Show loading state
  if (loading) {
    return <LoadingSpinner message="Loading governance proposals from blockchain..." fullScreen />;
  }

  // Show error state
  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">National {t.governance.council}</h1>
              <p className="text-xs text-gray-400">{t.governance.vote} on national proposals and initiatives</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-blue-500/30">
              <div className="flex items-center space-x-1">
                <ChartLine size={14} weight="fill" className="text-blue-400" />
                <span className="text-xs text-blue-400 font-semibold">Governance</span>
              </div>
            </div>
            <Users size={32} className="text-blue-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        {/* Connect Wallet Prompt */}
        {!isConnected && (
          <ConnectWalletPrompt message="Connect your wallet to view and vote on governance proposals" />
        )}

        {/* Create Proposal Button */}
        {isConnected && (
          <button className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-caribbean-600 to-caribbean-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
            <Plus size={24} weight="bold" />
            Create Proposal
          </button>
        )}

        {/* Proposals List */}
        {proposals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Users size={48} className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-800 font-semibold mb-2">No Active Proposals</p>
            <p className="text-gray-600 text-sm">
              {isConnected 
                ? 'No governance proposals are currently active. Submit one to get started!'
                : 'Connect your wallet to view proposals'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal) => {
              const total = proposal.voteCount.ayes + proposal.voteCount.nays;
              const yesPercent = total > 0 ? (proposal.voteCount.ayes / total) * 100 : 0;
              const timeRemaining = calculateTimeRemaining(proposal.voteEnd);

              return (
                <div key={proposal.index} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{proposal.title}</h3>
                      <p className="text-gray-600 text-xs mt-1">{proposal.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {proposal.status === 'Approved' || proposal.status === 'Executed' ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                            <CheckCircle size={16} weight="fill" />
                            {proposal.status}
                          </span>
                        ) : proposal.status === 'Rejected' ? (
                          <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                            <Warning size={16} weight="fill" />
                            Rejected
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-caribbean-100 text-caribbean-600 rounded-full text-xs font-medium">
                            {proposal.status}
                          </span>
                        )}
                        <span className="text-gray-500 text-sm">Ends in {timeRemaining}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                          {proposal.category}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Treasury Request: {proposal.value} DALLA
                      </div>
                    </div>
                  </div>

                  {/* Vote Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-green-600 font-semibold">Ayes: {proposal.voteCount.ayes}</span>
                      <span className="text-red-600 font-semibold">Nays: {proposal.voteCount.nays}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${yesPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Vote Buttons */}
                  {(proposal.status === 'Proposed' || proposal.status === 'Voting') && isConnected && (
                    <div className="flex gap-3">
                      <button className="flex-1 py-2 bg-green-500/10 border border-green-200 text-green-700 rounded-lg font-semibold hover:bg-green-500/20 transition-colors">
                        Vote Aye
                      </button>
                      <button className="flex-1 py-2 bg-red-500/10 border border-red-200 text-red-700 rounded-lg font-semibold hover:bg-red-500/20 transition-colors">
                        Vote Nay
                      </button>
                    </div>
                  )}
                  {!isConnected && (proposal.status === 'Proposed' || proposal.status === 'Voting') && (
                    <div className="text-center py-2 text-gray-500 text-sm">
                      Connect wallet to vote
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
