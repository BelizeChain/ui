'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowsLeftRight, Info } from 'phosphor-react';
import { GlassCard } from '@/components/ui';
import Link from 'next/link';

export default function WalletExchangePage() {
  const router = useRouter();

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
              <h1 className="text-xl font-bold text-white">Currency Exchange</h1>
              <p className="text-xs text-gray-400">Swap between DALLA & bBZD</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-cyan-500/30">
              <div className="flex items-center space-x-1">
                <Info size={14} weight="fill" className="text-cyan-400" />
                <span className="text-xs text-cyan-400 font-semibold">Coming Soon</span>
              </div>
            </div>
            <ArrowsLeftRight size={32} className="text-cyan-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        <div className="bg-gray-800 rounded-2xl shadow-md p-8 text-center">
          <p className="text-gray-400 mb-4">Exchange feature coming soon</p>
          <Link 
            href="/trade" 
            className="inline-block px-6 py-3 bg-caribbean-600 text-white rounded-xl font-semibold hover:bg-caribbean-700"
          >
            Go to Trading
          </Link>
        </div>
      </div>
    </div>
  );
}
