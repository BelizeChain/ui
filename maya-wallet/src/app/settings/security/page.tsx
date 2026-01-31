'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, LockKey } from 'phosphor-react';
import { GlassCard } from '@/components/ui';

export default function SettingsSecurityPage() {
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
              <h1 className="text-xl font-bold text-white">Security Settings</h1>
              <p className="text-xs text-gray-400">Protect your account</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-red-500/30">
              <div className="flex items-center space-x-1">
                <LockKey size={14} weight="fill" className="text-red-400" />
                <span className="text-xs text-red-400 font-semibold">Coming Soon</span>
              </div>
            </div>
            <ShieldCheck size={32} className="text-red-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        <div className="bg-gray-800 rounded-2xl shadow-md p-6">
          <p className="text-gray-400 text-center">Security settings coming soon</p>
        </div>
      </div>
    </div>
  );
}
