'use client';

import React, { useState } from 'react';
import { GlassCard } from './ui';
import { useWallet } from '@/contexts/WalletContext';
import {
  X,
  ImageSquare,
  Smiley,
  MapPin,
  Globe,
  Users,
  Leaf,
  Scales
} from 'phosphor-react';
import { cn } from '@/lib/utils';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (post: {
    content: string;
    type: 'community' | 'governance' | 'environment';
    district?: string;
  }) => void;
}

export function CreatePostModal({ isOpen, onClose, onPost }: CreatePostModalProps) {
  const { selectedAccount } = useWallet();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'community' | 'governance' | 'environment'>('community');
  const [district, setDistrict] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const postTypes = [
    { value: 'community', label: 'Community', icon: Users, color: 'text-blue-400 bg-blue-500/20' },
    { value: 'governance', label: 'Governance', icon: Scales, color: 'text-purple-400 bg-purple-500/20' },
    { value: 'environment', label: 'Environment', icon: Leaf, color: 'text-emerald-400 bg-emerald-500/20' },
  ];

  const districts = [
    'Belize City',
    'Belmopan',
    'Orange Walk',
    'Corozal',
    'Cayo',
    'Stann Creek',
    'Toledo',
    'Islands'
  ];

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onPost({
        content: content.trim(),
        type: postType as 'community' | 'governance' | 'environment',
        district: district || undefined,
      });
      setContent('');
      setDistrict('');
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create Post</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700/50 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {selectedAccount?.name?.[0] || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {selectedAccount?.name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedAccount?.address.slice(0, 6)}...{selectedAccount?.address.slice(-4)}
                  </p>
                </div>
              </div>

              {/* Post Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Post Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {postTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setPostType(type.value as any)}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-2',
                          postType === type.value
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                        )}
                      >
                        <div className={cn('p-2 rounded-lg', type.color)}>
                          <Icon size={20} weight="fill" />
                        </div>
                        <span className="text-xs font-semibold text-white">
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* District Selection */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  <MapPin size={16} className="inline mr-1 text-emerald-400" weight="fill" />
                  District (Optional)
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  style={{
                    colorScheme: 'dark',
                  }}
                >
                  <option value="" style={{ backgroundColor: '#1f2937', color: '#9ca3af' }}>Select district...</option>
                  {districts.map((d) => (
                    <option key={d} value={d} style={{ backgroundColor: '#1f2937', color: '#ffffff' }}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text Area */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  What's happening in Belize?
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts, ideas, or updates..."
                  className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                  rows={6}
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                      <ImageSquare size={20} className="text-gray-400 hover:text-emerald-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                      <Smiley size={20} className="text-gray-400 hover:text-emerald-400" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-400">
                    {content.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700/50 flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg border border-gray-700 hover:bg-gray-700/50 font-semibold text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
