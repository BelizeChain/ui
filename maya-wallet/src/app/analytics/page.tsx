'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  ChartLineUp,
  TrendUp,
  TrendDown,
  CurrencyDollar,
  ShoppingCart,
  Users,
  Calendar,
  ArrowLeft,
  Coins,
  MapPin,
  Broadcast,
  Sparkle,
  ShieldCheck,
  Warning,
} from 'phosphor-react';

export default function AnalyticsPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '1y'>('30d');

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to view BelizeChain on-chain macroeconomic analytics." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors">
                <ArrowLeft size={24} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">BelizeChain Macroeconomic Analytics</h1>
              <p className="text-xs text-slate-400">On-Chain GDP • Velocity of Money • District Volume Heatmaps</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <ChartLineUp size={16} weight="bold" />
              Live Telemetry
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Sandbox Notice Banner */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 flex items-center gap-3 text-xs">
          <Warning size={20} className="text-cyan-400 shrink-0" weight="bold" />
          <p className="text-slate-300 leading-relaxed">
            <strong className="text-cyan-300">Testnet Ecosystem Analytics:</strong> Macro aggregates represent current Ceiba testbed extrinsic velocity and simulated economic activity across the 6 Belizean districts.
          </p>
        </div>

        {/* Metric Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total DALLA Supply</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">21,000,000</span>
              <span className="text-[10px] text-emerald-300">Ɗ</span>
            </div>
            <span className="text-[11px] text-slate-400 block">2.0% Annual Staking Yield Curve</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">30D Transaction Volume</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300 font-mono">BZ$ 1.48M</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">+18.4% MoM Velocity</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Wallet Nodes</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400 font-mono">4,120</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Identity Verified Citizens</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Average Extrinsic Fee</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">&lt; 0.001 Ɗ</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Sub-second finality</span>
          </div>
        </div>

        {/* District Activity Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin size={22} className="text-emerald-400" />
                District On-Chain Volume Distribution
              </h3>
              <p className="text-slate-400 mt-1">Transaction velocity across regional municipal hubs.</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { district: 'Ambergris Caye (San Pedro)', share: 38, vol: '562,400 bBZD', mainUse: 'Eco-Tourism & Hospitality POS' },
              { district: 'Belize District (Belize City)', share: 24, vol: '355,200 bBZD', mainUse: 'Commercial Trade & Port Invoices' },
              { district: 'Cayo District (Belmopan)', share: 18, vol: '266,400 bBZD', mainUse: 'Government SSB Payroll & LandLedger' },
              { district: 'Stann Creek (Placencia)', share: 12, vol: '177,600 bBZD', mainUse: 'Marine Conservation & Diving' },
              { district: 'Corozal & Orange Walk', share: 5, vol: '74,000 bBZD', mainUse: 'Agricultural Supply Chain' },
              { district: 'Toledo (Punta Gorda)', share: 3, vol: '44,400 bBZD', mainUse: 'Local Agroforestry & Micro-Grants' },
            ].map((d) => (
              <div key={d.district} className="space-y-1 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-white">{d.district}</span>
                  <span className="font-mono text-emerald-400 font-bold">{d.vol} ({d.share}%)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-1.5" style={{ width: `${d.share}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 block">Primary Driver: {d.mainUse}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
