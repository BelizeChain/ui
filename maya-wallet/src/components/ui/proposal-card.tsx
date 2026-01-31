import * as React from 'react';
import { GlassCard } from './glass-card';
import { Progress } from './progress';
import { cn } from '@/lib/utils';
import { MapPin } from 'phosphor-react';
import Link from 'next/link';

export interface ProposalCardProps {
  id: number;
  title: string;
  district?: string;
  value?: number;
  currency?: string;
  status: 'voting' | 'passed' | 'rejected' | 'active';
  votesFor: number;
  votesAgainst: number;
  deadline?: string;
  href?: string;
  className?: string;
}

export function ProposalCard({
  id,
  title,
  district,
  value,
  currency = 'DALLA',
  status,
  votesFor,
  votesAgainst,
  deadline,
  href,
  className,
}: ProposalCardProps) {
  const totalVotes = votesFor + votesAgainst;
  const progress = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;

  const statusBadges = {
    voting: { label: '🗳️ Voting', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    active: { label: '🗳️ Active', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    passed: { label: '✅ Passed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    rejected: { label: '❌ Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };

  const content_component = (
    <div
      className={cn('bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700/50 hover:border-gray-600/50 transition-all', href && 'cursor-pointer', className)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-bold text-emerald-400">#{id}</span>
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', statusBadges[status].color)}>
              {statusBadges[status].label}
            </span>
          </div>
          <h3 className="font-bold text-white mb-1">{title}</h3>
          <div className="flex items-center space-x-3 text-xs text-gray-400">
            {district && (
              <span className="flex items-center">
                <MapPin size={12} weight="fill" className="mr-1" />
                {district}
              </span>
            )}
            {value && (
              <span>Ɗ{value.toLocaleString()} {currency}</span>
            )}
          </div>
        </div>
      </div>

      {/* Voting Progress */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-emerald-400 font-medium">{votesFor} Yes</span>
          <span className="text-red-400 font-medium">{votesAgainst} No</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Deadline */}
      {deadline && (status === 'voting' || status === 'active') && (
        <p className="text-xs text-gray-400 mt-2">Ends in {deadline}</p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content_component}</Link>;
  }

  return content_component;
}
