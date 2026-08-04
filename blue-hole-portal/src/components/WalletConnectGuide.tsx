'use client';

import React from 'react';
import { Wallet, Info, ArrowRight } from 'phosphor-react';
import { useWalletStore } from '@/store/wallet';
import { GlassCard } from '@/components/ui/glass-card';

export function WalletConnectGuide() {
  const { selectedAccount, connectWallet, isConnecting } = useWalletStore();

  if (selectedAccount) {
    return null; // Don't show the guide if already connected
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-slide-in-right">
      <GlassCard variant="dark-medium" blur="lg" className="p-5 border-blue-500/30 shadow-2xl shadow-blue-900/20">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Wallet size={20} weight="duotone" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Action Required
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            </h3>
            <p className="mt-1 text-xs text-gray-400 leading-relaxed">
              Connect your Maya Wallet to sign transactions and fully interact with the Ceiba Testnet.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isConnecting ? 'Connecting...' : 'Connect Now'}
                {!isConnecting && <ArrowRight size={12} weight="bold" />}
              </button>
              <a href="/guide" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                <Info size={14} />
                Learn more
              </a>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
