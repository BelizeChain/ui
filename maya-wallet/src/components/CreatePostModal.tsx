'use client';

import React, { useState } from 'react';
import { GlassCard } from './ui';
import { useWallet } from '@/contexts/WalletContext';
import {
  X,
  ImageSquare,
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
    { value: 'community', label: 'District Initiative', icon: Users, color: 'text-blue-300 bg-blue-500/15' },
    { value: 'governance', label: 'Civic Governance', icon: Scales, color: 'text-cyan-300 bg-cyan-500/15' },
    { value: 'environment', label: 'Reef & Ecology', icon: Leaf, color: 'text-emerald-300 bg-emerald-500/15' },
  ];

  const districts = [
    'Belize City',
    'Belmopan',
    'Orange Walk',
    'Corozal',
    'Cayo',
    'Stann Creek',
    'Toledo',
    'San Pedro / Islands'
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
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">District Assembly Submission</h2>
                <p className="text-xs text-slate-400">Publish a citizen initiative or community petition</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/40 flex items-center justify-center text-cyan-300 font-bold">
                  {selectedAccount?.name?.[0] || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">
                    {selectedAccount?.name || 'Verified Citizen'}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedAccount?.address ? `${selectedAccount.address.slice(0, 6)}...${selectedAccount.address.slice(-4)}` : 'On-Chain Identity'}
                  </p>
                </div>
              </div>

              {/* Post Type Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Initiative Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {postTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setPostType(type.value as any)}
                        className={cn(
                          'p-3 rounded-xl border transition-all flex flex-col items-center space-y-1.5 text-center',
                          postType === type.value
                            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-sm'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 text-slate-400'
                        )}
                      >
                        <div className={cn('p-1.5 rounded-lg', type.color)}>
                          <Icon size={18} weight="fill" />
                        </div>
                        <span className="text-xs font-semibold">
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* District Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  <MapPin size={14} className="inline mr-1 text-teal-400" weight="fill" />
                  Belize District / Municipality
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-sm font-sans"
                  style={{
                    colorScheme: 'dark',
                  }}
                >
                  <option value="" style={{ backgroundColor: '#090d16', color: '#94a3b8' }}>Select District Jurisdiction...</option>
                  {districts.map((d) => (
                    <option key={d} value={d} style={{ backgroundColor: '#090d16', color: '#ffffff' }}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text Area */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Assembly Proposal / Statement
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Introduce a district assembly proposal, local community initiative, or civic question..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none text-sm leading-relaxed"
                  rows={5}
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500 font-mono">
                    Strictly respectful, sovereign civic discourse
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {content.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-end space-x-3 bg-slate-950/40">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 font-semibold text-slate-300 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold transition-all text-sm shadow-md"
              >
                {isSubmitting ? 'Publishing...' : 'Publish to Assembly'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
