'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldWarning,
  ShieldCheck,
  WarningOctagon,
  Flag,
  Brain,
  ArrowClockwise,
  CheckCircle,
  XCircle,
  Sparkle,
} from 'phosphor-react';
import { useWallet } from '@/contexts/WalletContext';
import {
  flagContent,
  getModerationItems,
  FLAG_REASON_LABELS,
} from '@/services/pallets/moderation';
import type { ModerationItem } from '@belizechain/shared';

export default function CommunityModerationPage() {
  const { selectedAccount, isConnected } = useWallet();
  const account = selectedAccount?.address;
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Flag Submission Form
  const [contentHash, setContentHash] = useState('');
  const [selectedReason, setSelectedReason] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const list = await getModerationItems();
      setItems(list);
    } catch (err) {
      console.error('Failed to load moderation items:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 20_000);
    return () => clearInterval(timer);
  }, []);

  async function handleFlagSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account || !contentHash) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await flagContent(account, contentHash, selectedReason);
      setActionSuccess(`Community flag registered on-chain! Tx: ${res.hash.slice(0, 10)}...`);
      setContentHash('');
      await loadData();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to flag content. You can only flag each item once.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-rose-950/30 via-slate-900/40 to-transparent border-b border-white/5 px-4 pt-8 pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldWarning size={26} weight="fill" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Community Safety & Content Flagging</h1>
                <p className="text-xs text-gray-400">Decentralized reporting, Nawal AI telemetry & transparent moderation</p>
              </div>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 self-start sm:self-auto"
            >
              <ArrowClockwise size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Alerts */}
        {actionSuccess && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" weight="fill" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-300 text-xs flex items-center gap-2">
            <XCircle size={18} className="text-red-400 flex-shrink-0" weight="fill" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Flag Submission Form */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 space-y-5">
          <div className="flex items-center gap-2">
            <Flag size={20} className="text-rose-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Flag Problematic or Illicit Content
            </h3>
          </div>

          <form onSubmit={handleFlagSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Content Hash (32-byte Blake2b hex)
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={contentHash}
                onChange={(e) => setContentHash(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-rose-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Violation Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(FLAG_REASON_LABELS).map(([key, { label, desc }]) => {
                  const idx = Number(key) as 0 | 1 | 2 | 3 | 4;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedReason(idx)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedReason === idx
                          ? 'border-rose-500 bg-rose-500/20 text-rose-200'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xs font-bold">{label}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl text-[11px] text-rose-200/90 leading-relaxed">
              When an item accumulates 5 community flags (or an elevated Nawal AI risk score), it is automatically enqueued into the priority moderation court for swift review.
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isConnected}
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20"
            >
              {isSubmitting ? 'Registering Flag...' : 'Submit Community Flag'}
            </button>
          </form>
        </div>

        {/* Flagged & Monitored Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
              Community Moderation Registry ({items.length})
            </h3>
            <span className="text-xs text-gray-500">Live on-chain state</span>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <ShieldCheck size={40} className="mx-auto text-emerald-500/40 mb-2" />
              <p className="text-sm font-medium text-gray-300">No flagged items on record</p>
              <p className="text-xs text-gray-500 mt-1">Items flagged by community members will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.contentHash}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-rose-300 truncate max-w-[200px]" title={item.contentHash}>
                      {item.contentHash}
                    </span>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        item.ruling === 'Cleared'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : item.ruling === 'Removed'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : item.isQueued
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-white/5 text-gray-400'
                      }`}
                    >
                      {item.ruling ? `Ruled: ${item.ruling}` : item.isQueued ? 'In Review Queue' : 'Flagged'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white/[0.02] p-2.5 rounded-xl">
                    <div>
                      <span className="text-gray-500 font-sans">Flags: </span>
                      <span className="font-bold text-amber-300">{item.flagCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-sans">Nawal AI Score: </span>
                      <span className="font-bold text-purple-300">
                        {item.nawalScore !== undefined && item.nawalScore !== null ? `${item.nawalScore}/100` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
