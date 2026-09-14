'use client';

import React, { useState } from 'react';
import { GlassCard } from './glass-card';
import { cn } from '@/lib/utils';
import { ArrowFatUp, ArrowFatDown, ChatDots, Share, MapPin, Users, Scales, Leaf } from 'phosphor-react';
import Link from 'next/link';

export interface PostCardProps {
  post: {
    author?: {
      name: string;
      avatar: string | React.ReactNode;
      district?: string;
    };
    content: string | React.ReactNode;
    timestamp: string;
    likes: number;
    comments: number;
    shares?: number;
    type?: 'community' | 'governance' | 'environment';
  };
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  href?: string;
  className?: string;
}

export function PostCard({
  post,
  href,
  onLike,
  onComment,
  onShare,
  className,
}: PostCardProps) {
  const {
    author,
    content,
    timestamp,
    likes: initialUpvotes,
    comments,
    shares = 0,
    type,
  } = post;

  // Internal state for interactive features
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [voteState, setVoteState] = useState<'up' | 'down' | null>(null);

  const handleUpvote = () => {
    if (voteState === 'up') {
      setVoteState(null);
      setUpvotes(upvotes - 1);
    } else if (voteState === 'down') {
      setVoteState('up');
      setUpvotes(upvotes + 2);
    } else {
      setVoteState('up');
      setUpvotes(upvotes + 1);
    }
    onLike?.();
  };

  const handleDownvote = () => {
    if (voteState === 'down') {
      setVoteState(null);
      setUpvotes(upvotes + 1);
    } else if (voteState === 'up') {
      setVoteState('down');
      setUpvotes(upvotes - 2);
    } else {
      setVoteState('down');
      setUpvotes(upvotes - 1);
    }
  };

  const handleComment = () => {
    onComment?.();
  };

  const handleShare = () => {
    onShare?.();
  };
  const typeBadges = {
    community: { label: 'District Initiative', icon: Users, color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
    governance: { label: 'Sovereign Governance', icon: Scales, color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
    environment: { label: 'Reef & Ecology', icon: Leaf, color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  };
  const TypeIcon = type ? typeBadges[type]?.icon : undefined;

  const content_component = (
    <div className={cn('bg-slate-900/90 border border-slate-800/80 hover:border-teal-500/40 rounded-2xl p-4 transition-all shadow-lg backdrop-blur-md', className)}>
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        {author?.avatar && typeof author.avatar !== 'string' ? (
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 font-bold shrink-0">
            {author.avatar}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold text-sm shrink-0">
            {author?.name ? author.name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
        
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-white text-sm">{author?.name || 'Anonymous'}</h3>
              {author?.district && (
                <p className="text-xs text-slate-400 flex items-center mt-0.5">
                  <MapPin size={12} weight="fill" className="mr-1 text-teal-400" />
                  {author?.district}
                </p>
              )}
            </div>
            {type && typeBadges[type] && (
              <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border', typeBadges[type].color)}>
                {TypeIcon && <TypeIcon size={12} weight="fill" aria-hidden="true" />}
                {typeBadges[type].label}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="text-slate-300 text-sm mb-3 leading-relaxed">{content}</div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-1">
            <div className="flex items-center space-x-4 text-slate-400">
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleUpvote}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    voteState === 'up' ? 'text-teal-400 bg-teal-500/20' : 'hover:text-teal-300 hover:bg-slate-800'
                  )}
                >
                  <ArrowFatUp size={16} weight={voteState === 'up' ? 'fill' : 'regular'} />
                </button>
                <span className={cn(
                  "text-xs font-bold min-w-[24px] text-center font-mono",
                  voteState === 'up' && 'text-teal-400',
                  voteState === 'down' && 'text-rose-400'
                )}>{upvotes}</span>
                <button
                  onClick={handleDownvote}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    voteState === 'down' ? 'text-rose-400 bg-rose-500/20' : 'hover:text-rose-300 hover:bg-slate-800'
                  )}
                >
                  <ArrowFatDown size={16} weight={voteState === 'down' ? 'fill' : 'regular'} />
                </button>
              </div>
              <button
                onClick={handleComment}
                className="flex items-center space-x-1.5 hover:text-cyan-300 transition-colors py-1 px-2 rounded-lg hover:bg-slate-800/60"
              >
                <ChatDots size={16} />
                <span className="text-xs font-semibold font-mono">{comments}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center space-x-1.5 hover:text-cyan-300 transition-colors py-1 px-2 rounded-lg hover:bg-slate-800/60"
              >
                <Share size={16} />
                {shares > 0 && <span className="text-xs font-semibold font-mono">{shares}</span>}
              </button>
            </div>
            <span className="text-xs text-slate-500 font-mono">{timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content_component}</Link>;
  }

  return content_component;
}
