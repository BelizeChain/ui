'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  stakeDalla,
  claimStakingRewards,
  getActiveValidators,
  getStakingInfo,
  type StakingInfo,
  type Validator,
} from '@/services/pallets/staking';
import {
  ArrowLeft,
  ArrowRight,
  Lightning,
  CheckCircle,
  ShieldCheck,
  Sparkle,
  CircleNotch,
  HardDrives,
  Brain,
  LockKey,
} from 'phosphor-react';

/** `staking::UnbondingPeriod` = 14_400 blocks, i.e. ~24 hours at 6s blocks. */
const UNBONDING_PERIOD_BLOCKS = 14_400;

export default function StakingPage() {
  const { selectedAccount, isConnected, balance } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'bond' | 'validators' | 'my-stake' | 'pouw'>('bond');
  const [stakeAmount, setStakeAmount] = useState('250.00');
  const [computeCapacity, setComputeCapacity] = useState('100');
  const [nodeLocation, setNodeLocation] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [stakingLedger, setStakingLedger] = useState<StakingInfo | null>(null);
  const [validators, setValidators] = useState<Validator[]>([]);

  const loadStaking = async () => {
    if (!selectedAccount?.address) return;
    try {
      const [info, onChainValidators] = await Promise.all([
        getStakingInfo(selectedAccount.address),
        getActiveValidators(),
      ]);
      setStakingLedger(info);
      setValidators(onChainValidators);
    } catch (err) {
      console.warn('Could not load on-chain staking data:', err);
    }
  };

  useEffect(() => {
    // Deferred so the initial load doesn't set state during the effect body
    // (react-hooks/set-state-in-effect).
    Promise.resolve().then(loadStaking);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount?.address]);

  const refreshStaking = loadStaking;

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      addNotification({ type: 'error', message: 'Please enter a valid DALLA stake amount.' });
      return;
    }

    setIsStaking(true);
    try {
      const res = await stakeDalla(
        selectedAccount!.address,
        stakeAmount,
        computeCapacity,
        nodeLocation,
      );
      addNotification({
        type: 'success',
        message: `Registered as a PoUW validator with ${stakeAmount} DALLA bonded: ${res.hash.slice(0, 16)}…`,
      });
      setStakeAmount('');
      await refreshStaking();
    } catch (err) {
      addNotification({ type: 'error', message: `Stake failed: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setIsStaking(false);
    }
  };

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const res = await claimStakingRewards(selectedAccount!.address);
      addNotification({
        type: 'success',
        message: `Claimed ${res.amount} DALLA PoUW rewards: ${res.hash.slice(0, 16)}…`,
      });
      await refreshStaking();
    } catch (err) {
      addNotification({ type: 'error', message: `Claim failed: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to bond DALLA as a PoUW validator and earn staking + federated rewards."
        fullScreen
      />
    );
  }

  const activeValidatorData =
    validators.find((v) => v.address === selectedAccount?.address) ?? null;

  const totalNetworkStake = validators
    .reduce((sum, v) => sum + (parseFloat(v.totalStake.replace(/,/g, '')) || 0), 0)
    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
                PoUW Validator Staking
              </h1>
              <p className="text-[11px] text-teal-200/70 font-mono">
                Self-stake via joinValidators • PoUW federated rewards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm">
              <ShieldCheck size={14} weight="fill" />
              {validators.length} validator{validators.length === 1 ? '' : 's'} registered
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
              <span className="text-2xl font-black text-white font-mono">{totalNetworkStake}</span>
              <span className="text-xs text-cyan-300 font-bold">Ɗ</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-teal-500/10">
              <span>Validators:</span>
              <span className="text-emerald-400 font-bold">{validators.length}</span>
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
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Current PoUW Epoch</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-400 font-mono">{stakingLedger?.epoch ?? '—'}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-teal-500/10">
              <span>Block time:</span>
              <span className="text-slate-300">6.0s target</span>
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
              <span className="text-2xl font-black text-purple-300 font-mono">{stakingLedger?.activeStake ?? '—'}</span>
              <span className="text-xs text-purple-300 font-bold">Ɗ</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-teal-500/10">
              <span>Status:</span>
              <span className="text-teal-300 font-bold">{stakingLedger?.validatorStatus ?? 'None'}</span>
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
              <span className="text-[10px] uppercase font-bold text-amber-300 block">PoUW Quality Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-amber-300 font-mono">{stakingLedger?.scores?.quality ?? '—'}</span>
                <span className="text-xs text-amber-300 font-bold">/ 100</span>
              </div>
            </div>
            <button
              onClick={handleClaim}
              disabled={isClaiming || !stakingLedger?.scores}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 transition-colors pt-1 border-t border-teal-500/10 disabled:opacity-50"
            >
              <span>{isClaiming ? 'Claiming…' : 'Claim PoUW Rewards'}</span>
              {!isClaiming && <ArrowRight size={12} weight="bold" />}
            </button>
          </motion.div>
        </div>

        {/* Tab Navigation Dock */}
        <div className="flex bg-slate-950/90 border border-teal-500/25 rounded-2xl p-1.5 overflow-x-auto text-xs font-bold gap-1.5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl">
          {(['bond', 'validators', 'my-stake', 'pouw'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 rounded-xl capitalize transition-all whitespace-nowrap text-center ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-teal-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              {tab === 'bond'
                ? 'Bond & Register'
                : tab === 'validators'
                ? `Validators (${validators.length})`
                : tab === 'my-stake'
                ? 'My Bonding Record'
                : 'PoUW Compute Mining'}
            </button>
          ))}
        </div>

        {/* Tab 1: Bond & register */}
        {activeTab === 'bond' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stake Form */}
            <div className="lg:col-span-2 bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-2xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Lightning size={22} className="text-teal-400" weight="fill" />
                  Bond DALLA & Register as Validator
                </h3>
                <p className="text-xs text-teal-200/70 mt-1 font-mono">
                  PoUW staking is self-stake only — this call registers your account as a validator
                  with a compute-capacity weight. There is no nomination or delegation.
                </p>
              </div>

              <form onSubmit={handleStake} className="space-y-5">
                {/* Node parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 uppercase font-semibold mb-2 block text-[11px]">
                      Compute Capacity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={computeCapacity}
                      onChange={(e) => setComputeCapacity(e.target.value)}
                      className="w-full bg-slate-900/90 border border-teal-500/30 rounded-2xl p-3 text-sm text-white font-mono focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 uppercase font-semibold mb-2 block text-[11px]">
                      Node Location Label
                    </label>
                    <input
                      type="text"
                      value={nodeLocation}
                      onChange={(e) => setNodeLocation(e.target.value)}
                      placeholder="e.g. Belize City"
                      className="w-full bg-slate-900/90 border border-teal-500/30 rounded-2xl p-3 text-sm text-white font-mono focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Stake Amount */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-slate-400 uppercase font-semibold text-[11px]">Amount to Bond (DALLA)</label>
                    <span className="text-[11px] text-teal-300 font-mono">Available: {balance?.dalla ?? '—'} Ɗ</span>
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

                {/* Action Submit */}
                <button
                  type="submit"
                  disabled={isStaking}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2"
                >
                  {isStaking ? (
                    <>
                      <CircleNotch size={16} className="animate-spin" /> Submitting joinValidators…
                    </>
                  ) : (
                    <>
                      <LockKey size={16} weight="bold" /> Bond {stakeAmount || '0'} Ɗ & Register Validator
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* My validator record */}
            <div className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 space-y-5 shadow-xl backdrop-blur-2xl text-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-teal-500/10 pb-3">
                  <div>
                    <span className="text-base font-bold text-white block">
                      {activeValidatorData ? 'Registered Validator' : 'Not Registered'}
                    </span>
                    <span className="text-[11px] text-teal-300 font-mono block">
                      {selectedAccount.address.slice(0, 16)}...
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-bold font-mono text-[10px]">
                    {stakingLedger?.validatorStatus ?? 'None'}
                  </span>
                </div>

                <div className="space-y-2 font-mono text-[11px] bg-slate-900/90 p-4 rounded-2xl border border-teal-500/10">
                  <div className="flex justify-between text-slate-400">
                    <span>Bonded Stake:</span>
                    <span className="text-white font-bold">{stakingLedger?.activeStake ?? '—'} Ɗ</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Unbonding:</span>
                    <span className="text-amber-300 font-bold">{stakingLedger?.unbonding ?? '—'} Ɗ</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Compute Capacity:</span>
                    <span className="text-cyan-300 font-bold">{activeValidatorData?.computeCapacity ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Node Location:</span>
                    <span className="text-white text-right font-sans text-[10px] max-w-[160px] truncate">
                      {activeValidatorData?.name ?? '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>PoUW Quality Score:</span>
                    <span className="text-purple-300 font-bold">{stakingLedger?.scores?.quality ?? '—'} / 100</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Contributions:</span>
                    <span className="text-white font-bold">{stakingLedger?.scores?.totalContributions ?? '—'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-teal-950/30 border border-teal-500/20 rounded-2xl text-[11px] text-teal-200/80 leading-relaxed">
                  <ShieldCheck size={16} className="text-teal-400 inline mr-1.5" weight="bold" />
                  Leaving the validator set schedules the full stake for withdrawal after{' '}
                  {UNBONDING_PERIOD_BLOCKS.toLocaleString()} blocks (~24 hours). Partial unbond is not supported.
                </div>
              </div>

              <div className="pt-2 border-t border-teal-500/10">
                <Link href="/governance">
                  <button className="w-full py-2.5 bg-slate-900 hover:bg-teal-950/40 text-teal-300 border border-teal-500/20 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors">
                    <span>View Validator Council Votes</span>
                    <ArrowRight size={12} weight="bold" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Registered validators */}
        {activeTab === 'validators' && (
          <div className="space-y-4">
            {validators.length === 0 ? (
              <div className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-8 text-center text-xs text-slate-400">
                No validators are registered in <span className="font-mono">staking.validators</span> yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validators.map((val) => (
                  <div
                    key={val.address}
                    className="bg-slate-950/80 border border-teal-500/20 hover:border-teal-400/40 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-2xl transition-all"
                  >
                    <div className="flex justify-between items-start border-b border-teal-500/10 pb-3">
                      <div>
                        <span className="font-bold text-white text-base block">
                          {val.name ?? 'Unlabelled node'}
                        </span>
                        <span className="text-[11px] text-teal-300/80 font-mono">{val.address.slice(0, 24)}...</span>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold font-mono text-[10px]">
                        {val.isActive ? 'Registered' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-3.5 rounded-2xl border border-teal-500/10 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Bonded Stake</span>
                        <span className="text-white font-bold">{val.totalStake} Ɗ</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Compute Capacity</span>
                        <span className="text-cyan-300 font-bold">{val.computeCapacity}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">PoUW Quality</span>
                        <span className="text-purple-300 font-bold">{val.qualityScore} / 100</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Contributions</span>
                        <span className="text-emerald-400 font-bold">{val.rewardPoints}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setActiveTab('bond')}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <CheckCircle size={16} weight="bold" /> Bond & Register
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: My bonding record */}
        {activeTab === 'my-stake' && (
          <div className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 space-y-6 shadow-xl backdrop-blur-2xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardDrives size={22} className="text-teal-400" />
                My PoUW Staking Record
              </h3>
              <p className="text-slate-400 mt-1 font-mono text-[11px]">
                {selectedAccount.address.slice(0, 16)}... · epoch {stakingLedger?.epoch ?? '—'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-teal-500/15 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Bonded Stake</span>
                <span className="text-xl font-bold text-emerald-400 block">{stakingLedger?.activeStake ?? '—'} Ɗ</span>
                <span className="text-[10px] text-slate-400">Locked against PoUW work</span>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-teal-500/15 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Pending Unbond</span>
                <span className="text-xl font-bold text-slate-400 block">{stakingLedger?.unbonding ?? '—'} Ɗ</span>
                <span className="text-[10px] text-slate-500">{UNBONDING_PERIOD_BLOCKS.toLocaleString()} blocks (~24h)</span>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-teal-500/15 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">PoUW Contributions</span>
                <span className="text-xl font-bold text-cyan-300 block">{stakingLedger?.scores?.totalContributions ?? '—'}</span>
                <span className="text-[10px] text-teal-300">Recorded on the validator</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/90 rounded-2xl border border-teal-500/15 space-y-3">
              <span className="text-white font-bold block text-sm">Rewards</span>
              <p className="text-slate-400 leading-relaxed">
                The pallet computes the payout at claim time from your quality, timeliness, honesty
                and quantum scores plus a stake bonus, and stores no per-account accrual — so no
                claimable balance is shown here. Use “Claim PoUW Rewards” to collect it.
              </p>
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
                <span className="text-slate-500 text-[10px] uppercase">Node Location</span>
                <span className="text-lg font-bold text-purple-300 block">{activeValidatorData?.name ?? '—'}</span>
                <span className="text-[10px] text-slate-400">staking.validators.location</span>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-teal-500/15 space-y-1 font-mono">
                <span className="text-slate-500 text-[10px] uppercase">Quality Score</span>
                <span className="text-lg font-bold text-emerald-400 block">{stakingLedger?.scores?.quality ?? '—'} / 100</span>
                <span className="text-[10px] text-slate-400">staking.validators.qualityScore</span>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-teal-500/15 space-y-1 font-mono">
                <span className="text-slate-500 text-[10px] uppercase">Contributions</span>
                <span className="text-lg font-bold text-amber-300 block">{stakingLedger?.scores?.totalContributions ?? '—'}</span>
                <span className="text-[10px] text-teal-300">staking.validators.totalContributions</span>
              </div>
            </div>

            <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-2">
              <span className="text-purple-300 font-bold flex items-center gap-1.5">
                <Sparkle size={16} weight="fill" />
                Federated Model Training
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Validators submit encrypted model deltas with a hash commitment through
                <span className="font-mono"> staking.submitModelDelta</span>. Scores and rewards are
                recorded on-chain per epoch; the Nawal client drives submission, not this page.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
