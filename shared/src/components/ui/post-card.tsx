'use client';

import React, { useState } from 'react';
import { GlassCard } from './glass-card';
import { cn } from '@/lib/utils';
import { ArrowFatUp, ArrowFatDown, ChatDots, Share, MapPin } from 'phosphor-react';
import Link from 'next/link';

export interface PostCardProps {
  post: {
    author?: {
      name: string;
      avatar: string | React.ReactNode;
      district?: string;
    };
    content: string;
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
    community: { label: '👥 Community', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    governance: { label: '⚖️ Governance', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    environment: { label: '🌱 Environment', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  };

  const content_component = (
    <div className={cn('bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700/50 hover:border-gray-600/50 transition-all', className)}>
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        {author && typeof author.avatar === 'string' ? (
          <div className="text-3xl">{author.avatar}</div>
        ) : author ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-emerald-500 flex items-center justify-center text-white font-bold">
            {author.avatar}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold">
            ?
          </div>
        )}
        
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-white">{author?.name || 'Anonymous'}</h3>
              {author?.district && (
                <p className="text-xs text-gray-400 flex items-center">
                  <MapPin size={12} weight="fill" className="mr-1" />
                  {author?.district}
                </p>
              )}
            </div>
            {type && typeBadges[type] && (
              <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', typeBadges[type].color)}>
                {typeBadges[type].label}
              </span>
            )}
          </div>

          {/* Content */}
          <p className="text-gray-300 text-sm mb-3">{content}</p>

          {/* Footer Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-gray-400">
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleUpvote}
                  className={cn(
                    'p-1 rounded transition-colors',
                    voteState === 'up' ? 'text-emerald-500 bg-emerald-500/10' : 'hover:text-emerald-400 hover:bg-emerald-500/5'
                  )}
                >
                  <ArrowFatUp size={18} weight={voteState === 'up' ? 'fill' : 'regular'} />
                </button>
                <span className={cn(
                  "text-xs font-bold min-w-[24px] text-center",
                  voteState === 'up' && 'text-emerald-500',
                  voteState === 'down' && 'text-red-500'
                )}>{upvotes}</span>
                <button
                  onClick={handleDownvote}
                  className={cn(
                    'p-1 rounded transition-colors',
                    voteState === 'down' ? 'text-red-500 bg-red-500/10' : 'hover:text-red-400 hover:bg-red-500/5'
                  )}
                >
                  <ArrowFatDown size={18} weight={voteState === 'down' ? 'fill' : 'regular'} />
                </button>
              </div>
              <button
                onClick={handleComment}
                className="flex items-center space-x-1 hover:text-gray-300 transition-colors"
              >
                <ChatDots size={18} />
                <span className="text-xs font-semibold">{comments}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center space-x-1 hover:text-gray-300 transition-colors"
              >
                <Share size={18} />
                {shares > 0 && <span className="text-xs font-semibold">{shares}</span>}
              </button>
            </div>
            <span className="text-xs text-gray-500">{timestamp}</span>
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
