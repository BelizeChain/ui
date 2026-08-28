'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  Leaf,
  TrendUp,
  Users,
  CalendarBlank,
  CheckCircle,
  ArrowLeft,
  TreeEvergreen,
  Sparkle,
  ShieldCheck,
  Sun,
  Coins,
  Receipt,
  DownloadSimple,
} from 'phosphor-react';

interface GreenProject {
  id: string;
  title: string;
  district: string;
  category: 'Mangrove Restoration' | 'Barrier Reef Sensor Grid' | 'Solar LoRa Mesh Towers';
  targetAmount: string;
  raisedAmount: string;
  carbonCreditsGenerated: number;
  yieldBooster: string;
  status: 'Funding' | 'Active Restoration' | 'Verified';
}

export default function SustainabilityPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'blue-carbon' | 'solar-mesh' | 'eco-badges'>('blue-carbon');
  const [contributingId, setContributingId] = useState<string | null>(null);

  const [projects, setProjects] = useState<GreenProject[]>([
    {
      id: 'GP-01',
      title: 'Ambergris Caye Mangrove Biosphere Reforestation',
      district: 'Belize District (San Pedro)',
      category: 'Mangrove Restoration',
      targetAmount: '50,000 Ɗ',
      raisedAmount: '38,400 Ɗ',
      carbonCreditsGenerated: 1420,
      yieldBooster: '+2.5% Staking APR',
      status: 'Active Restoration',
    },
    {
      id: 'GP-02',
      title: 'Placencia Solar-Powered LoRa Mesh Node Array',
      district: 'Stann Creek District',
      category: 'Solar LoRa Mesh Towers',
      targetAmount: '30,000 Ɗ',
      raisedAmount: '21,500 Ɗ',
      carbonCreditsGenerated: 680,
      yieldBooster: '+3.5% Staking APR',
      status: 'Funding',
    },
    {
      id: 'GP-03',
      title: 'Turneffe Atoll Coral Nursery & Acoustic Sensor Array',
      district: 'Belize Offshore Cayes',
      category: 'Barrier Reef Sensor Grid',
      targetAmount: '75,000 Ɗ',
      raisedAmount: '75,000 Ɗ',
      carbonCreditsGenerated: 3100,
      yieldBooster: '+4.0% Staking APR',
      status: 'Verified',
    },
  ]);

  const handleContribute = (project: GreenProject) => {
    setContributingId(project.id);
    setTimeout(() => {
      setContributingId(null);
      addNotification({
        type: 'success',
        message: `Bonded 25.00 Ɗ to ${project.title}! Unlocked ${project.yieldBooster} booster.`,
      });
    }, 1200);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to view BelizeChain Blue Economy sustainability programs." fullScreen />;
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
              <h1 className="text-xl font-bold">Belize Blue Economy & Carbon Credits</h1>
              <p className="text-xs text-slate-400">Barrier Reef Preservation • Blue Carbon Offsets • Solar Mesh Mining</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Leaf size={16} weight="bold" />
              Blue Carbon Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Blue Carbon Offsets</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">5,200 MT</span>
            </div>
            <span className="text-[11px] text-slate-400 block">CO2e Sequestered</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Solar Mesh Repeater Yield</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-amber-300 font-mono">+3.5% APR</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Green Node Booster</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Mangrove Hectares Protected</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300 font-mono">340 Ha</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Coastal bio-shield</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Eco-Tourism POS Rebates</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400 font-mono">2.5%</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Auto-rebated on bBZD POS</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['blue-carbon', 'solar-mesh', 'eco-badges'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'blue-carbon'
                ? 'Blue Carbon Projects'
                : tab === 'solar-mesh'
                ? 'Solar Mesh Mining'
                : 'Eco-Certificates'}
            </button>
          ))}
        </div>

        {/* Tab 1: Blue Carbon */}
        {activeTab === 'blue-carbon' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-5 space-y-3 shadow-xl text-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-[10px]">
                        {p.status}
                      </span>
                      <span className="text-emerald-400 font-bold font-mono text-[10px]">{p.yieldBooster}</span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-sm">{p.title}</h3>
                      <p className="text-slate-400 text-[11px] mt-0.5">{p.district}</p>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1 font-mono text-[10px]">
                      <div className="flex justify-between text-slate-400">
                        <span>Funding:</span>
                        <span className="text-white font-bold">{p.raisedAmount} / {p.targetAmount}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Carbon Credits:</span>
                        <span className="text-cyan-300 font-bold">{p.carbonCreditsGenerated} MT CO2e</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleContribute(p)}
                    disabled={contributingId === p.id}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Leaf size={14} weight="bold" />
                    {contributingId === p.id ? 'Bonding Ɗ...' : 'Bond 25 Ɗ to Sponsor'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Solar Mesh */}
        {activeTab === 'solar-mesh' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sun size={22} className="text-amber-400" />
                Off-Grid Solar LoRa Mesh Staking Boosters
              </h3>
              <p className="text-slate-400 mt-1">
                Operate solar-powered 915MHz Meshtastic repeater stations along the reef and coastline to earn elevated PoUW staking rewards.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-white text-sm">Solar Tower Node #08 (San Pedro South)</span>
                <span className="text-slate-400 text-[11px] block">Battery: 98% • Solar Influx: 42W • Mesh Packets Relayed: 14,204</span>
              </div>
              <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold font-mono text-xs">
                +3.5% APR Active
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Eco Badges */}
        {activeTab === 'eco-badges' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck size={22} className="text-purple-400" />
                Verifiable On-Chain Eco-Tourism Badges
              </h3>
              <p className="text-slate-400 mt-1">
                Audited certificates for sustainable resorts, dive operators, and eco-tour guides.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-white text-sm block">Turneffe Marine Eco-Operator Badge</span>
                <p className="text-slate-400 text-[11px]">Certified 0% single-use plastic and 100% solar dive boat telemetry on BelizeChain.</p>
                <span className="text-emerald-400 text-[10px] font-bold block">✓ Verified by Ministry of Blue Economy</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-white text-sm block">Cayo Agroforestry Carbon Neutral Badge</span>
                <p className="text-slate-400 text-[11px]">Organic shade-grown cacao farm with satellite-verified canopy coverage on LandLedger.</p>
                <span className="text-emerald-400 text-[10px] font-bold block">✓ Verified by Ministry of Agriculture</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
