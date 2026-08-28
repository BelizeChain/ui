'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  ArrowLeft,
  Lightning,
  TrendUp,
  Info,
  CheckCircle,
  Clock,
  Coins,
  ChartLine,
  Warning,
  Gift,
  ShieldCheck,
  Cpu,
  Sparkle,
  ArrowsClockwise,
  Check,
  CircleNotch,
} from 'phosphor-react';

interface ValidatorInfo {
  address: string;
  name: string;
  totalStake: string;
  ownStake: string;
  commission: string;
  apr: string;
  points: number;
  status: 'Active' | 'Waiting';
  slashRisk: 'Low' | 'Medium';
}

export default function StakingPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'nominate' | 'my-stake' | 'validators' | 'pouw'>('nominate');
  const [autoCompound, setAutoCompound] = useState(true);
  const [stakeAmount, setStakeAmount] = useState('100.00');
  const [selectedValidator, setSelectedValidator] = useState<string>('ceiba-validator-01');
  const [isStaking, setIsStaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const validators: ValidatorInfo[] = [
    {
      address: '5Cg3Ez7Upm8caDfjonnMKPZ14B3H5daWM75DkYj7yEt4XSKt',
      name: 'Ceiba Sovereign Validator #01',
      totalStake: '250,000 Ɗ',
      ownStake: '50,000 Ɗ',
      commission: '2.0%',
      apr: '14.8%',
      points: 12450,
      status: 'Active',
      slashRisk: 'Low',
    },
    {
      address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      name: 'San Pedro Caye Node #02',
      totalStake: '180,000 Ɗ',
      ownStake: '40,000 Ɗ',
      commission: '3.0%',
      apr: '13.9%',
      points: 11200,
      status: 'Active',
      slashRisk: 'Low',
    },
    {
      address: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
      name: 'Belmopan Capital Sentry #03',
      totalStake: '120,000 Ɗ',
      ownStake: '30,000 Ɗ',
      commission: '1.5%',
      apr: '15.2%',
      points: 9800,
      status: 'Active',
      slashRisk: 'Low',
    },
  ];

  const handleStake = (e: React.FormEvent) => {
    e.preventDefault();
    setIsStaking(true);
    setTimeout(() => {
      setIsStaking(false);
      addNotification({
        type: 'success',
        message: `Successfully bonded & nominated ${stakeAmount} Ɗ to ${selectedValidator} (Auto-Compound: ${autoCompound ? 'Enabled' : 'Disabled'})!`,
      });
      setStakeAmount('');
    }, 1400);
  };

  const handleClaim = () => {
    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      addNotification({
        type: 'success',
        message: 'Claimed +42.50 Ɗ Staking & PoUW Era Rewards to wallet balance!',
      });
    }, 1200);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to nominate validators and earn DALLA staking rewards." fullScreen />;
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
              <h1 className="text-xl font-bold">NPoS Validator Staking Hub</h1>
              <p className="text-xs text-slate-400">BABE/GRANDPA Consensus • 14.8% APR • PoUW Reward Mining</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck size={16} weight="bold" />
              Era #248 Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Network Staked</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">550,000.00</span>
              <span className="text-[10px] text-cyan-300">Ɗ</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">55.0% Staking Ratio</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Staking Yield (APR)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">14.8%</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Era Payout every 6 hrs</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">My Bonded Stake</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400 font-mono">500.00</span>
              <span className="text-[10px] text-purple-300">Ɗ</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Nominated to Ceiba Validator</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Claimable Rewards</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-amber-300 font-mono">+42.50</span>
              <span className="text-[10px] text-amber-300">Ɗ</span>
            </div>
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="text-[11px] text-amber-400 font-bold hover:underline block"
            >
              {isClaiming ? 'Claiming...' : 'Claim Rewards ➔'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['nominate', 'validators', 'my-stake', 'pouw'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'nominate'
                ? 'Nominate & Stake'
                : tab === 'validators'
                ? 'Validator Directory'
                : tab === 'my-stake'
                ? 'My Bonded Positions'
                : 'PoUW Yield Booster'}
            </button>
          ))}
        </div>

        {/* Tab 1: Nominate & Stake */}
        {activeTab === 'nominate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl text-xs">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lightning size={20} className="text-cyan-400" />
                  Bond & Nominate Validators
                </h3>
                <p className="text-slate-400 mt-1">
                  Stake native DALLA to secure BelizeChain BABE block authoring and GRANDPA finality.
                </p>
              </div>

              <form onSubmit={handleStake} className="space-y-4">
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block">Stake Amount (Ɗ DALLA)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-base font-bold text-white font-mono focus:border-cyan-400 focus:outline-none"
                    placeholder="0.00"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Available balance: 1,420.50 Ɗ</span>
                </div>

                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block">Target Validator</label>
                  <select
                    value={selectedValidator}
                    onChange={(e) => setSelectedValidator(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="ceiba-validator-01">Ceiba Sovereign Validator #01 (14.8% APR, 2% Comm)</option>
                    <option value="sanpedro-node-02">San Pedro Caye Node #02 (13.9% APR, 3% Comm)</option>
                    <option value="belmopan-sentry-03">Belmopan Capital Sentry #03 (15.2% APR, 1.5% Comm)</option>
                  </select>
                </div>

                {/* Auto-Compound Toggle */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">Auto-Compound Era Rewards</span>
                    <span className="text-slate-400 text-[11px] block">Re-bond era rewards automatically every 6 hours</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoCompound(!autoCompound)}
                    className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                      autoCompound ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isStaking || !stakeAmount}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.99] text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <ShieldCheck size={18} weight="bold" />
                  {isStaking ? 'Broadcasting Stake Extrinsic...' : 'Bond & Nominate Ɗ'}
                </button>
              </form>
            </div>

            {/* Staking Benefits & Consensus Status */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu size={20} className="text-purple-400" />
                  Consensus Engine & Slashing Protection
                </h3>
                <p className="text-slate-400 mt-1">High-performance Nominated Proof-of-Stake with PoUW verification.</p>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Block Finality Gadget:</span>
                    <span className="font-bold text-emerald-400">GRANDPA (Deterministic)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Slot Production Time:</span>
                    <span className="font-bold text-white">6.0 seconds (BABE)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Unbonding Period:</span>
                    <span className="font-bold text-slate-200">7 Days (28 Eras)</span>
                  </div>
                </div>

                <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-300 text-[11px] flex items-center gap-2">
                  <Sparkle size={18} weight="bold" />
                  <span>PoUW Bonus: Validators running Nawal AI or Kinich Quantum nodes earn +3.5% boosted era points.</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <span className="font-bold text-white block">Slashing Insurance Pool</span>
                <p className="text-slate-400 text-[11px]">
                  All nominated stake is protected by the decentralized community treasury insurance reserve against validator offline faults.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Validators */}
        {activeTab === 'validators' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck size={22} className="text-cyan-400" />
                Active Validator Set (Era #248)
              </h3>
              <p className="text-slate-400 mt-1">Real-time performance, APR yields, and commission rates.</p>
            </div>

            <div className="space-y-3">
              {validators.map((v) => (
                <div
                  key={v.name}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{v.name}</span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full">
                        {v.status}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 text-[11px] block">{v.address}</span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">APR</span>
                      <span className="font-bold text-emerald-400">{v.apr}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Commission</span>
                      <span className="font-bold text-slate-200">{v.commission}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Total Stake</span>
                      <span className="font-bold text-white">{v.totalStake}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedValidator(v.name);
                        setActiveTab('nominate');
                      }}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs"
                    >
                      Nominate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: My Stake */}
        {activeTab === 'my-stake' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Coins size={22} className="text-purple-400" />
                My Bonded Positions & Reward History
              </h3>
              <p className="text-slate-400 mt-1">Manage active nominations, unbonding queues, and era payouts.</p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <div>
                  <span className="font-bold text-white text-sm block">Ceiba Sovereign Validator #01</span>
                  <span className="text-slate-400 text-[11px]">Bonded since Era #210 • Auto-Compounding</span>
                </div>
                <span className="text-emerald-400 font-bold text-sm font-mono">+14.8% APR</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-400 text-[11px]">
                <div>Active Bond: <b className="text-white block text-sm font-mono">500.00 Ɗ</b></div>
                <div>Unclaimed Rewards: <b className="text-amber-300 block text-sm font-mono">+42.50 Ɗ</b></div>
                <div>Lock Duration: <b className="text-slate-200 block text-sm">Active (Unbonding: 7d)</b></div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: PoUW Booster */}
        {activeTab === 'pouw' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkle size={22} className="text-amber-400" />
                Proof-of-Useful-Work (PoUW) Yield Boosters
              </h3>
              <p className="text-slate-400 mt-1">Combine NPoS staking with Nawal AI or Kinich Quantum work for multiplier APR.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-white text-sm block">Nawal Federated AI Node</span>
                <p className="text-slate-400 text-[11px]">Provide local gradient training rounds to earn +2.5% staking yield boost.</p>
                <span className="text-emerald-400 font-bold text-sm block">+2.5% APR Booster (Active)</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-white text-sm block">Kinich Quantum Execution Node</span>
                <p className="text-slate-400 text-[11px]">Validate QASM circuit state vectors to earn +3.0% staking yield boost.</p>
                <span className="text-cyan-400 font-bold text-sm block">+3.0% APR Booster (Eligible)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
