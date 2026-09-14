'use client';

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { X, PaperPlaneRight, Heart, User } from 'phosphor-react';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: React.ReactNode;
    address: string;
  };
  content: React.ReactNode;
  timestamp: string;
  likes: number;
  liked?: boolean;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postAuthor: string;
  postContent: React.ReactNode;
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
        avatar: <User size={20} weight="fill" className="text-teal-400" />,
        address: '5FHne...',
      },
      content: 'Outstanding contribution to BelizeChain decentralized computing network. This verifiable compute proof was validated on block #149,210.',
      timestamp: '1h ago',
      likes: 5,
      liked: false,
    },
    {
      id: '2',
      author: {
        name: 'John Martinez',
        avatar: <User size={20} weight="fill" className="text-cyan-400" />,
        address: '5DAn3...',
      },
      content: 'Approved and seconded in the Orange Walk district municipal council docket.',
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
        name: selectedAccount.name || 'Verified Citizen',
        avatar: <User size={20} weight="fill" className="text-teal-400" />,
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
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full max-h-[90vh] flex flex-col">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-950/40">
              <div>
                <h2 className="text-base font-bold text-white">Assembly Discussion</h2>
                <p className="text-xs text-slate-400">Citizen comments & deliberative review</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Original Post Summary */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex-shrink-0">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold text-xs flex-shrink-0">
                  {postAuthor?.[0] || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-xs">{postAuthor}</p>
                  <div className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">{postContent}</div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">No comments recorded on this assembly docket yet.</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                      {comment.author.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-white text-xs">
                            {comment.author.name}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {comment.author.address}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed">{comment.content}</div>
                      </div>
                      <div className="flex items-center space-x-4 mt-1.5 px-2">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={cn(
                            'flex items-center space-x-1 text-xs font-semibold transition-colors',
                            comment.liked ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'
                          )}
                        >
                          <Heart
                            size={13}
                            weight={comment.liked ? 'fill' : 'regular'}
                          />
                          <span className="font-mono text-[11px]">{comment.likes > 0 && comment.likes}</span>
                        </button>
                        <span className="text-[10px] text-slate-500 font-mono">{comment.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex-shrink-0">
              <div className="flex items-end space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs flex-shrink-0">
                  {selectedAccount?.name?.[0] || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Submit deliberative comment..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none text-xs leading-relaxed"
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
                  className="p-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold transition-all shadow-md"
                  title="Submit Comment"
                >
                  <PaperPlaneRight size={18} weight="fill" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
