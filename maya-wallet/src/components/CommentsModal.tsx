'use client';

import React, { useState } from 'react';
import { GlassCard } from './ui';
import { useWallet } from '@/contexts/WalletContext';
import { X, PaperPlaneRight, Heart } from 'phosphor-react';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    address: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  liked?: boolean;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postAuthor: string;
  postContent: string;
}

export function CommentsModal({
  isOpen,
  onClose,
  postId,
  postAuthor,
  postContent,
}: CommentsModalProps) {
  const { selectedAccount } = useWallet();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: {
        name: 'Sarah Williams',
        avatar: '👩🏻',
        address: '5FHne...',
      },
      content: 'This is amazing! Congrats on completing your first cycle! 🎉',
      timestamp: '1h ago',
      likes: 5,
      liked: false,
    },
    {
      id: '2',
      author: {
        name: 'John Martinez',
        avatar: '👨🏾',
        address: '5DAn3...',
      },
      content: 'Welcome to the PoUW network! Keep contributing!',
      timestamp: '45m ago',
      likes: 3,
      liked: true,
    },
  ]);

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedAccount) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: {
        name: selectedAccount.name || 'Anonymous',
        avatar: selectedAccount.name?.[0] || '👤',
        address: `${selectedAccount.address.slice(0, 5)}...`,
      },
      content: newComment.trim(),
      timestamp: 'Just now',
      likes: 0,
      liked: false,
    };

    setComments([...comments, comment]);
    setNewComment('');
  };

  const handleLikeComment = (commentId: string) => {
    setComments(
      comments.map((c) =>
        c.id === commentId
          ? {
              ...c,
              liked: !c.liked,
              likes: c.liked ? c.likes - 1 : c.likes + 1,
            }
          : c
      )
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full max-h-[90vh] flex flex-col">
          <GlassCard variant="medium" blur="xl" className="flex flex-col max-h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Comments</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Original Post */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">{postAuthor[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{postAuthor}</p>
                  <p className="text-sm text-gray-600 mt-1">{postContent}</p>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg">{comment.author.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-100 rounded-2xl px-4 py-3">
                        <p className="font-semibold text-gray-900 text-sm">
                          {comment.author.name}
                          <span className="text-xs text-gray-500 font-normal ml-2">
                            {comment.author.address}
                          </span>
                        </p>
                        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 px-2">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={cn(
                            'flex items-center space-x-1 text-xs font-semibold transition-colors',
                            comment.liked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                          )}
                        >
                          <Heart
                            size={14}
                            weight={comment.liked ? 'fill' : 'regular'}
                          />
                          <span>{comment.likes > 0 && comment.likes}</span>
                        </button>
                        <span className="text-xs text-gray-400">{comment.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="p-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-end space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">
                    {selectedAccount?.name?.[0] || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-4 py-2 rounded-2xl border border-gray-300 focus:border-forest-500 focus:ring-2 focus:ring-forest-200 outline-none transition-all resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="p-3 rounded-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all"
                >
                  <PaperPlaneRight size={20} weight="fill" />
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}
