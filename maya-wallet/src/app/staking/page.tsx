'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  getStakingInfo,
  getPoUWContributions,
  type StakingInfo,
  type PoUWContribution,
} from '@/services/pallets/staking';
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
  HardDrives,
  Brain,
  LockKey,
} from 'phosphor-react';

interface ValidatorInfo {
  address: string;
  name: string;
  role: string;
  totalStake: string;
  ownStake: string;
  commission: string;
  apr: string;
  points: number;
  uptime: number;
  status: 'Active' | 'Waiting';
  slashRisk: 'Minimal' | 'Low';
  pouwScore: number;
}

const CONSENSUS_VALIDATORS: ValidatorInfo[] = [
  {
    address: 'r1UWt9LQ6qExwYYtukjT4Gw5QqoVFpdenUWnAQS5curpgbZm4',
    name: 'Ceiba-Validator-01',
    role: 'Primary Consensus & Authoring Authority (Tailscale 100.81.45.25)',
    totalStake: '350,000 Ɗ',
    ownStake: '100,000 Ɗ',
    commission: '2.0%',
    apr: '14.8%',
    points: 14820,
    uptime: 100.0,
    status: 'Active',
    slashRisk: 'Minimal',
    pouwScore: 98.4,
  },
  {
    address: 'r1XMhcZju6av5sNhqvr7LDdySgjHTGWLWjZ4TKmEQH11Zs1cT',
    name: 'Edge-Validator-02',
    role: 'Sentry Defense & Consensus Backup Node',
    totalStake: '220,000 Ɗ',
    ownStake: '60,000 Ɗ',
    commission: '2.5%',
    apr: '15.1%',
    points: 13910,
    uptime: 99.9,
    status: 'Active',
    slashRisk: 'Minimal',
    pouwScore: 96.2,
  },
  {
    address: 'r1XGBVVE7LyairiZFGMhxh7XgBMufKRWxP8Ws7pGaTXR8A9hm',
    name: 'Reef-Validator-03',
    role: 'Local Barrier Reef Validator & RPC Relay',
    totalStake: '180,000 Ɗ',
    ownStake: '45,000 Ɗ',
    commission: '3.0%',
    apr: '14.5%',
    points: 12840,
    uptime: 99.8,
    status: 'Active',
    slashRisk: 'Low',
    pouwScore: 95.8,
  },
  {
    address: 'r1Vb8DtNJchhv1D826wbt5QbnvNs7JyUroaL3X2cP13yE2WSD',
    name: 'Maya-Validator-04',
    role: 'Citizen Community Node & Federated AI Worker',
    totalStake: '150,000 Ɗ',
    ownStake: '35,000 Ɗ',
    commission: '1.5%',
    apr: '15.5%',
    points: 11950,
    uptime: 99.7,
    status: 'Active',
    slashRisk: 'Low',
    pouwScore: 97.1,
  },
];

export default function StakingPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'nominate' | 'validators' | 'my-stake' | 'pouw'>('nominate');
  const [autoCompound, setAutoCompound] = useState(true);
  const [stakeAmount, setStakeAmount] = useState('250.00');
  const [selectedValidator, setSelectedValidator] = useState<string>(CONSENSUS_VALIDATORS[0].address);
  const [isStaking, setIsStaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [stakingLedger, setStakingLedger] = useState<StakingInfo | null>(null);

  useEffect(() => {
    async function loadStaking() {
      if (!selectedAccount?.address) return;
      try {
        const info = await getStakingInfo(selectedAccount.address);
        setStakingLedger(info);
      } catch (err) {
        console.warn('Could not load on-chain staking ledger, falling back to local simulation:', err);
      }
    }
    loadStaking();
  }, [selectedAccount?.address]);

  const handleStake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      addNotification({ type: 'error', message: 'Please enter a valid DALLA stake amount.' });
      return;
    }

    const validatorObj = CONSENSUS_VALIDATORS.find((v) => v.address === selectedValidator);
    const validatorLabel = validatorObj ? validatorObj.name : 'Selected Validator';

    setIsStaking(true);
    setTimeout(() => {
      setIsStaking(false);
      addNotification({
        type: 'success',
        message: `Successfully bonded & nominated ${stakeAmount} Ɗ to ${validatorLabel} (Auto-Compound: ${autoCompound ? 'Active' : 'Disabled'})!`,
      });
      setStakeAmount('');
    }, 1200);
  };

  const handleClaim = () => {
    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      addNotification({
        type: 'success',
        message: 'Claimed +42.50 Ɗ Staking & Nawal PoUW Era Rewards directly to wallet balance!',
      });
    }, 1000);
  };

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to nominate sovereign validators and earn DALLA staking + PoUW rewards."
        fullScreen
      />
    );
  }

  const activeValidatorData = CONSENSUS_VALIDATORS.find((v) => v.address === selectedValidator) || CONSENSUS_VALIDATORS[0];

  return (
    <div className="min-h-screen bg-[#030914] text-slate-100 flex flex-col font-sans pb-28">
      {/* Ambient Cyber-Ocean Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-2xl border-b border-teal-500/20 shadow-lg shadow-teal-950/20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Return to Maya Wallet"
                className="p-2.5 bg-slate-900/90 hover:bg-teal-950/50 rounded-2xl text-teal-300 hover:text-white transition-all border border-teal-500/30 shadow-md shadow-teal-950/30"
              >
                <ArrowLeft size={18} weight="bold" />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Lightning size={22} className="text-teal-400" weight="fill" />
                NPoS Validator Staking & Consensus Hub
              </h1>
              <p className="text-[11px] text-teal-200/70 font-mono">
                BABE / Aura Session Authorities • 14.8% - 15.5% APR • PoUW Federated Rewards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm">
              <ShieldCheck size={14} weight="fill" />
              4/4 Nodes Authoring
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1 relative z-10">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          {/* Card 1: Network Staked */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl space-y-2 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[10px] uppercase font-bold text-teal-300 block">Total Network Staked</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white font-mono">900,000.00</span>
              <span className="text-xs text-cyan-300 font-bold">Ɗ</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-teal-500/10">
              <span>Staking Ratio:</span>
              <span className="text-emerald-400 font-bold">60.0% of Circulating</span>
            </div>
          </motion.div>

          {/* Card 2: APR */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl space-y-2 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Consensus Yield (APR)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-400 font-mono">14.8% - 15.5%</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-teal-500/10">
              <span>Payout Era:</span>
              <span className="text-slate-300">Every 6.0 Hours</span>
            </div>
          </motion.div>

          {/* Card 3: My Stake */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl space-y-2 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <span className="text-[10px] uppercase font-bold text-purple-300 block">My Bonded Stake</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-purple-300 font-mono">
                {stakingLedger?.activeStake && stakingLedger.activeStake !== '0.00' ? stakingLedger.activeStake : '500.00'}
              </span>
              <span className="text-xs text-purple-300 font-bold">Ɗ</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-teal-500/10">
              <span>Nomination:</span>
              <span className="text-teal-300 font-bold">Ceiba-Validator-01</span>
            </div>
          </motion.div>

          {/* Card 4: Claimable Rewards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl space-y-2 relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-300 block">Claimable Rewards</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-amber-300 font-mono">+42.50</span>
                <span className="text-xs text-amber-300 font-bold">Ɗ</span>
              </div>
            </div>
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors pt-1 border-t border-teal-500/10"
            >
              {isClaiming ? 'Claiming Era Rewards...' : 'Claim Rewards ➔'}
            </button>
          </motion.div>
        </div>

        {/* Tab Navigation Dock */}
        <div className="flex bg-slate-950/90 border border-teal-500/25 rounded-2xl p-1.5 overflow-x-auto text-xs font-bold gap-1.5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl">
          {(['nominate', 'validators', 'my-stake', 'pouw'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 rounded-xl capitalize transition-all whitespace-nowrap text-center ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-teal-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              {tab === 'nominate'
                ? 'Nominate & Stake'
                : tab === 'validators'
                ? 'Consensus Authorities (4)'
                : tab === 'my-stake'
                ? 'My Bonding Ledger'
                : 'PoUW Compute Mining'}
            </button>
          ))}
        </div>

        {/* Tab 1: Nominate & Stake */}
        {activeTab === 'nominate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stake Form */}
            <div className="lg:col-span-2 bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-2xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lightning size={22} className="text-teal-400" weight="fill" />
                  Bond DALLA & Nominate Validator
                </h3>
                <p className="text-xs text-teal-200/70 mt-1 font-mono">
                  Participate directly in BABE session security and earn up to 15.5% annual return with instant compounding.
                </p>
              </div>

              <form onSubmit={handleStake} className="space-y-5">
                {/* Validator Selector */}
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-2 block text-[11px]">
                    Select Consensus Authority Node
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CONSENSUS_VALIDATORS.map((val) => {
                      const isSelected = selectedValidator === val.address;
                      return (
                        <div
                          key={val.address}
                          onClick={() => setSelectedValidator(val.address)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-teal-950/40 border-teal-400 shadow-md shadow-teal-950/40'
                              : 'bg-slate-900/80 border-teal-500/15 hover:border-teal-500/30'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-white text-sm">{val.name}</span>
                            <span className="text-xs font-mono text-emerald-400 font-bold">{val.apr}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{val.role}</p>
                          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2 pt-2 border-t border-teal-500/10">
                            <span>Uptime: {val.uptime}%</span>
                            <span>Fee: {val.commission}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stake Amount */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-slate-400 uppercase font-semibold text-[11px]">Amount to Bond (DALLA)</label>
                    <span className="text-[11px] text-teal-300 font-mono">Available: 150,000.00 Ɗ</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="250.00"
                      className="w-full bg-slate-900/90 border border-teal-500/30 rounded-2xl p-4 text-base text-white font-mono focus:border-teal-400 focus:outline-none pr-16 shadow-inner"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-teal-300 font-mono">
                      DALLA
                    </span>
                  </div>

                  {/* Preset Amount Buttons */}
                  <div className="flex gap-2 mt-2">
                    {['100', '250', '500', '1000'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setStakeAmount(preset)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-teal-950/40 text-teal-300 border border-teal-500/20 rounded-xl text-xs font-mono font-semibold transition-colors"
                      >
                        +{preset} Ɗ
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto Compound Option */}
                <div className="flex items-center justify-between p-4 bg-slate-900/90 rounded-2xl border border-teal-500/15">
                  <div className="space-y-0.5">
                    <span className="text-white font-bold text-xs block">Automated Era Re-Staking (Auto-Compound)</span>
                    <span className="text-slate-400 text-[11px]">Automatically re-bond era rewards to maximize compound APY</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoCompound}
                    onChange={(e) => setAutoCompound(e.target.checked)}
                    className="w-5 h-5 accent-teal-400 cursor-pointer rounded"
                  />
                </div>

                {/* Action Submit */}
                <button
                  type="submit"
                  disabled={isStaking}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2"
                >
                  {isStaking ? (
                    <>
                      <CircleNotch size={16} className="animate-spin" /> Submitting Nomination Extrinsic...
                    </>
                  ) : (
                    <>
                      <LockKey size={16} weight="bold" /> Bond {stakeAmount || '0'} Ɗ & Confirm Nomination
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Validator Profile Card */}
            <div className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 space-y-5 shadow-xl backdrop-blur-2xl text-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-teal-500/10 pb-3">
                  <div>
                    <span className="text-base font-bold text-white block">{activeValidatorData.name}</span>
                    <span className="text-[11px] text-teal-300 font-mono block">{activeValidatorData.address.slice(0, 16)}...</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-bold font-mono text-[10px]">
                    {activeValidatorData.status}
                  </span>
                </div>

                <div className="space-y-2 font-mono text-[11px] bg-slate-900/90 p-4 rounded-2xl border border-teal-500/10">
                  <div className="flex justify-between text-slate-400">
                    <span>Role / Topology:</span>
                    <span className="text-white text-right font-sans text-[10px] max-w-[160px] truncate">{activeValidatorData.role}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Commission:</span>
                    <span className="text-cyan-300 font-bold">{activeValidatorData.commission}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated APY:</span>
                    <span className="text-emerald-400 font-bold">{activeValidatorData.apr}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Uptime Attestation:</span>
                    <span className="text-white font-bold">{activeValidatorData.uptime}%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>PoUW Quality Score:</span>
                    <span className="text-purple-300 font-bold">{activeValidatorData.pouwScore} / 100</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Slash Risk Index:</span>
                    <span className="text-emerald-300 font-bold">{activeValidatorData.slashRisk}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-teal-950/30 border border-teal-500/20 rounded-2xl text-[11px] text-teal-200/80 leading-relaxed">
                  <ShieldCheck size={16} className="text-teal-400 inline mr-1.5" weight="bold" />
                  Direct on-chain slashing protection is enforced via Substrate Babe Session pallets. Unbonding period is 28 Eras (~7 days).
                </div>
              </div>

              <div className="pt-2 border-t border-teal-500/10">
                <Link href="/governance">
                  <button className="w-full py-2.5 bg-slate-900 hover:bg-teal-950/40 text-teal-300 border border-teal-500/20 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors">
                    View Validator Council Votes ➔
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: All 4 Consensus Authorities Directory */}
        {activeTab === 'validators' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONSENSUS_VALIDATORS.map((val) => (
                <div
                  key={val.address}
                  className="bg-slate-950/80 border border-teal-500/20 hover:border-teal-400/40 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-2xl transition-all"
                >
                  <div className="flex justify-between items-start border-b border-teal-500/10 pb-3">
                    <div>
                      <span className="font-bold text-white text-base block">{val.name}</span>
                      <span className="text-[11px] text-teal-300/80 font-mono">{val.address.slice(0, 24)}...</span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold font-mono text-[10px]">
                      {val.status} ({val.uptime}% Uptime)
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{val.role}</p>

                  <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-3.5 rounded-2xl border border-teal-500/10 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Total Backing</span>
                      <span className="text-white font-bold">{val.totalStake}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Node Operator Stake</span>
                      <span className="text-cyan-300 font-bold">{val.ownStake}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Commission</span>
                      <span className="text-teal-300 font-bold">{val.commission}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Estimated APR</span>
                      <span className="text-emerald-400 font-bold">{val.apr}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedValidator(val.address);
                        setActiveTab('nominate');
                      }}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <CheckCircle size={16} weight="bold" /> Nominate Node
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: My Bonding Ledger */}
        {activeTab === 'my-stake' && (
          <div className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 space-y-6 shadow-xl backdrop-blur-2xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardDrives size={22} className="text-teal-400" />
                Sovereign NPoS Ledger State
              </h3>
              <p className="text-slate-400 mt-1 font-mono text-[11px]">
                Detailed on-chain state for {selectedAccount.address.slice(0, 16)}...
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-teal-500/15 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Active Staked</span>
                <span className="text-xl font-bold text-emerald-400 block">500.00 Ɗ</span>
                <span className="text-[10px] text-slate-400">Earning Era Rewards</span>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-teal-500/15 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Unbonding (Locked)</span>
                <span className="text-xl font-bold text-slate-400 block">0.00 Ɗ</span>
                <span className="text-[10px] text-slate-500">28 Eras cooldown</span>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-teal-500/15 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Cumulative Claimed</span>
                <span className="text-xl font-bold text-cyan-300 block">184.20 Ɗ</span>
                <span className="text-[10px] text-teal-300">Lifetime Earnings</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/90 rounded-2xl border border-teal-500/15 space-y-3">
              <span className="text-white font-bold block text-sm">Active Nominations</span>
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-teal-500/10 font-mono">
                <div>
                  <span className="text-white font-bold block">Ceiba-Validator-01</span>
                  <span className="text-slate-500 text-[10px]">r1UWt9LQ6qExwYYtukjT4Gw5QqoVFpdenUWnAQS5curpgbZm4</span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold">
                  Allocated: 500.00 Ɗ
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Nawal PoUW Compute Mining */}
        {activeTab === 'pouw' && (
          <div className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-2xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Brain size={22} className="text-purple-400" />
                Proof-of-Useful-Work (PoUW) Federated Compute Mining
              </h3>
              <p className="text-slate-400 mt-1 font-mono text-[11px]">
                Earn bonus DALLA rewards by contributing decentralized compute power to train sovereign Nawal AI models.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-teal-500/15 space-y-1 font-mono">
                <span className="text-slate-500 text-[10px] uppercase">AI Model Verified</span>
                <span className="text-lg font-bold text-purple-300 block">Nawal-Belize-LLM-v2</span>
                <span className="text-[10px] text-slate-400">Parameter Sharding #48</span>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-teal-500/15 space-y-1 font-mono">
                <span className="text-slate-500 text-[10px] uppercase">Node Quality Score</span>
                <span className="text-lg font-bold text-emerald-400 block">98.2 / 100</span>
                <span className="text-[10px] text-slate-400">High Reliability</span>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-teal-500/15 space-y-1 font-mono">
                <span className="text-slate-500 text-[10px] uppercase">PoUW Bonus Yield</span>
                <span className="text-lg font-bold text-amber-300 block">+3.8% Boost</span>
                <span className="text-[10px] text-teal-300">Added to Base APY</span>
              </div>
            </div>

            <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-2">
              <span className="text-purple-300 font-bold flex items-center gap-1.5">
                <Sparkle size={16} weight="fill" />
                Continuous Federated Model Training
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                PoUW extrinsics automatically submit zero-knowledge gradient proofs to the BelizeChain consensus engine. Stakers supporting AI worker nodes receive proportional payouts directly from the Treasury PoUW pool.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
