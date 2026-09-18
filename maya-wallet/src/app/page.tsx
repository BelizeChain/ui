'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { MayaShellReadinessPanel } from '@/components/MayaShellReadinessPanel';
import {
  getStakingInfo,
  getPoUWContributions,
  getTourismRewards,
  type StakingInfo,
  type PoUWContribution,
  type TourismReward,
} from '@/services/pallets';
import { getExchangeRate } from '@/services/oracle';
import { formatDisplayNumber, formatDalla, formatBbzd } from '@/lib/utils';
import {
  Eye,
  EyeSlash,
  ChartLine,
  Coins,
  Gift,
  Brain,
  Lightning,
  PaperPlaneTilt,
  QrCode,
  ArrowsLeftRight,
  ShieldCheck,
  Scales,
  IdentificationCard,
  Bank,
  Clock,
  X,
  CheckCircle,
  SlidersHorizontal,
  CaretRight,
} from 'phosphor-react';

/** Format a unix-seconds timestamp as a short relative-time label. */
function timeAgo(tsSeconds: number): string {
  if (!tsSeconds) return '';
  const deltaMs = Date.now() - tsSeconds * 1000;
  if (deltaMs < 0) return 'just now';
  const mins = Math.floor(deltaMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 86400);
  return `${days}d ago`;
}

/** Build a normalized 7-point sparkline (range ~6..38) from a real numeric series. */
function buildSparkline(series: number[]): number[] {
  const points = series.slice(0, 7).reverse();
  if (points.length === 0) return [20, 20, 20, 20, 20, 20, 20];
  const max = Math.max(...points, 1);
  const scaled = points.map((v) => 6 + (v / max) * 32);
  while (scaled.length < 7) scaled.unshift(scaled[0] ?? 20);
  return scaled;
}

export default function HomeNew() {
  const { balance, balanceLoading, isConnected, connect, selectedAccount } = useWallet();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [showAllTrends, setShowAllTrends] = useState(false);
  const [showActivityFilter, setShowActivityFilter] = useState(false);
  const [activityFilter, setActivityFilter] = useState<string>('all');

  // Real on-chain data
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [pouwContributions, setPouwContributions] = useState<PoUWContribution[]>([]);
  const [tourismRewards, setTourismRewards] = useState<TourismReward[]>([]);
  const [rates, setRates] = useState<{ dalla: number; bbzd: number }>({ dalla: 0, bbzd: 0 });
  const [currencyPref, setCurrencyPref] = useState<'DALLA' | 'BZD' | 'USD'>('DALLA');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('maya-currency-pref') as 'DALLA' | 'BZD' | 'USD' | null;
      if (saved && (saved === 'DALLA' || saved === 'BZD' || saved === 'USD')) {
        setCurrencyPref(saved);
      }
    }
  }, []);

  const handleCurrencyChange = (pref: 'DALLA' | 'BZD' | 'USD') => {
    setCurrencyPref(pref);
    if (typeof window !== 'undefined') {
      localStorage.setItem('maya-currency-pref', pref);
    }
  };

  useEffect(() => {
    const address = selectedAccount?.address;
    if (!address) {
      setStakingInfo(null);
      setPouwContributions([]);
      setTourismRewards([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [staking, pouw, tourism, dallaRate, bbzdRate] = await Promise.all([
        getStakingInfo(address).catch(() => null),
        getPoUWContributions(address).catch(() => [] as PoUWContribution[]),
        getTourismRewards(address).catch(() => [] as TourismReward[]),
        getExchangeRate('DALLA', 'USD').then((r) => r.rate).catch(() => 0),
        getExchangeRate('bBZD', 'USD').then((r) => r.rate).catch(() => 0),
      ]);
      if (cancelled) return;
      setStakingInfo(staking);
      setPouwContributions(pouw);
      setTourismRewards(tourism);
      setRates({ dalla: dallaRate, bbzd: bbzdRate });
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedAccount?.address]);

  // Real balances
  const parseAmount = (val?: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(/,/g, '')) || 0;
  };
  const dallaBal = parseAmount(balance?.dalla);
  const bbzdBal = parseAmount(balance?.bBZD);
  const stakedBal = parseAmount(stakingInfo?.totalStaked);
  const totalDallaHolding = dallaBal + stakedBal;

  // DALLA is the unpegged native cryptocurrency
  const dallaOracleRate = rates.dalla > 0 ? rates.dalla : 0;
  const bbzdRate = 0.5; // Statutory peg: 1 bBZD = 1 BZD = $0.50 USD

  const formattedPrimaryTotal = useMemo(() => {
    if (currencyPref === 'DALLA') {
      return formatDalla(totalDallaHolding);
    }
    if (currencyPref === 'BZD') {
      if (dallaOracleRate > 0) {
        const totalBzd = totalDallaHolding * (dallaOracleRate * 2.0) + bbzdBal * 1.0;
        return formatBbzd(totalBzd);
      }
      return formatDalla(totalDallaHolding);
    }
    // USD
    if (dallaOracleRate > 0) {
      const totalUsd = totalDallaHolding * dallaOracleRate + bbzdBal * bbzdRate;
      return `$${formatDisplayNumber(totalUsd)}`;
    }
    return formatDalla(totalDallaHolding);
  }, [currencyPref, totalDallaHolding, bbzdBal, dallaOracleRate, bbzdRate]);

  const secondaryConversionText = useMemo(() => {
    if (currencyPref === 'DALLA') {
      if (dallaOracleRate > 0) {
        const usdVal = totalDallaHolding * dallaOracleRate + bbzdBal * 0.5;
        const bzdVal = totalDallaHolding * (dallaOracleRate * 2.0) + bbzdBal * 1.0;
        return `≈ $${formatDisplayNumber(usdVal)} USD (${formatBbzd(bzdVal)}) • ${bbzdBal.toFixed(2)} bBZD`;
      }
      return `Native Cryptocurrency (Unpegged) • ${formatDisplayNumber(bbzdBal)} bBZD available`;
    }
    if (currencyPref === 'BZD') {
      if (dallaOracleRate > 0) {
        return `≈ $${formatDisplayNumber(totalDallaHolding * dallaOracleRate + bbzdBal * 0.5)} USD (${formatDalla(totalDallaHolding)})`;
      }
      return `DALLA is unpegged • Holdings: ${formatDalla(totalDallaHolding)} + BZ$ ${bbzdBal.toFixed(2)} bBZD`;
    }
    // USD
    if (dallaOracleRate > 0) {
      return `≈ ${formatBbzd(totalDallaHolding * (dallaOracleRate * 2) + bbzdBal * 1.0)} (${formatDalla(totalDallaHolding)})`;
    }
    return `DALLA is unpegged • Holdings: ${formatDalla(totalDallaHolding)} + $${(bbzdBal * 0.5).toFixed(2)} bBZD`;
  }, [currencyPref, totalDallaHolding, bbzdBal, dallaOracleRate]);

  // Real assets (DALLA + bBZD always; Staked only when there is an active stake)
  const assets = useMemo(() => {
    const list = [
      {
        id: 'dalla',
        name: 'DALLA',
        symbol: 'Ɗ',
        displayAmount: formatDalla(dallaBal),
        priceInfo: 'Native • Unpegged',
        secondaryInfo:
          dallaOracleRate > 0
            ? `≈ $${formatDisplayNumber(dallaBal * dallaOracleRate)} USD`
            : 'Native Cryptocurrency',
        color: 'from-emerald-500 to-teal-500',
        badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        icon: Coins,
      },
      {
        id: 'bbzd',
        name: 'bBZD',
        symbol: 'BZ$',
        displayAmount: formatBbzd(bbzdBal),
        priceInfo: 'Pegged: 1 BZD = $0.50',
        secondaryInfo: `≈ $${formatDisplayNumber(bbzdBal * 0.5)} USD • Stablecoin`,
        color: 'from-cyan-500 to-blue-500',
        badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
        icon: Coins,
      },
    ];
    if (stakedBal > 0) {
      list.push({
        id: 'staked',
        name: 'Staked DALLA',
        symbol: 'Ɗ',
        displayAmount: formatDalla(stakedBal),
        priceInfo: 'PoUW APY',
        secondaryInfo: 'Securing BelizeChain Validators',
        color: 'from-purple-500 to-violet-600',
        badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
        icon: Lightning,
      });
    }
    return list;
  }, [dallaBal, bbzdBal, stakedBal, dallaOracleRate]);

  // Real rewards/trends derived from on-chain data
  const trends = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      value: string;
      monthlyValue: string;
      totalValue: string;
      icon: typeof Gift;
      color: string;
      chartData: number[];
      stats: Record<string, number | string>;
    }> = [];

    if (tourismRewards.length > 0) {
      const cashbackTotal = tourismRewards.reduce((s, r) => s + parseFloat(r.cashbackAmount || '0'), 0);
      const spendTotal = tourismRewards.reduce((s, r) => s + parseFloat(r.amountSpent || '0'), 0);
      const merchants = new Set(tourismRewards.map((r) => r.merchant)).size;
      list.push({
        id: 'tourism',
        title: 'Tourism Rewards',
        subtitle: 'Verified Cashback',
        value: `+${cashbackTotal.toFixed(2)}`,
        monthlyValue: `+${cashbackTotal.toFixed(2)} DALLA`,
        totalValue: `${cashbackTotal.toFixed(2)} DALLA`,
        icon: Gift,
        color: 'from-amber-500 to-orange-500',
        chartData: buildSparkline(tourismRewards.map((r) => parseFloat(r.cashbackAmount || '0'))),
        stats: { merchants, spending: `${spendTotal.toFixed(2)} DALLA` },
      });
    }

    if (pouwContributions.length > 0) {
      const rewardTotal = pouwContributions.reduce((s, c) => s + parseFloat(c.reward || '0'), 0);
      const avg = (key: 'qualityScore' | 'timelinessScore' | 'honestyScore') =>
        Math.round(pouwContributions.reduce((s, c) => s + c[key], 0) / pouwContributions.length);
      list.push({
        id: 'pouw',
        title: 'PoUW Rewards',
        subtitle: 'Federated Learning',
        value: `+${rewardTotal.toFixed(2)}`,
        monthlyValue: `+${rewardTotal.toFixed(2)} DALLA`,
        totalValue: `${rewardTotal.toFixed(2)} DALLA`,
        icon: Brain,
        color: 'from-cyan-500 to-blue-500',
        chartData: buildSparkline(pouwContributions.map((c) => c.totalScore)),
        stats: {
          contributions: pouwContributions.length,
          quality: avg('qualityScore'),
          timeliness: avg('timelinessScore'),
          honesty: avg('honestyScore'),
        },
      });
    }

    return list;
  }, [tourismRewards, pouwContributions]);

  // Real staking position (single position from the staking ledger)
  const stakingPositions = useMemo(() => {
    if (!stakingInfo || stakedBal <= 0) return [];
    return [
      {
        id: 'dalla-stake',
        amount: stakedBal.toFixed(0),
        active: stakingInfo.activeStake,
        unbonding: stakingInfo.unbonding,
        rewards: stakingInfo.rewardsEarned,
        era: stakingInfo.era,
      },
    ];
  }, [stakingInfo, stakedBal]);

  // Real activity feed merged from on-chain reward events
  const activities = useMemo(() => {
    const items = [
      ...pouwContributions.map((c) => ({
        id: `pouw-${c.contributionId}`,
        type: 'pouw',
        title: 'PoUW Rewards',
        subtitle: 'Federated Learning',
        amount: `+${c.reward} DALLA`,
        time: timeAgo(c.timestamp),
        ts: c.timestamp,
        icon: Brain,
        color: 'text-cyan-400',
      })),
      ...tourismRewards.map((r) => ({
        id: `tourism-${r.rewardId}`,
        type: 'tourism',
        title: 'Tourism Cashback',
        subtitle: r.merchantName || 'Verified Merchant',
        amount: `+${r.cashbackAmount} DALLA`,
        time: timeAgo(r.timestamp),
        ts: r.timestamp,
        icon: Gift,
        color: 'text-amber-400',
      })),
    ];
    return items.sort((a, b) => b.ts - a.ts);
  }, [pouwContributions, tourismRewards]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#030914] to-slate-950 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
          <div className="relative overflow-hidden bg-slate-900/90 rounded-3xl p-8 border border-slate-800 backdrop-blur-2xl shadow-2xl">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 p-0.5 shadow-xl shadow-cyan-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                  <Coins size={38} weight="fill" className="text-cyan-300" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Maya Sovereign Wallet</h2>
              <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                Sovereign citizen access to BelizeChain assets, post-quantum security, and civic democracy
              </p>

              <MayaShellReadinessPanel className="mb-6 text-left" />

              <button
                onClick={connect}
                className="w-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-400 hover:opacity-95 text-slate-950 font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-cyan-500/25 active:scale-[0.98]"
              >
                Connect Sovereign Identity
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#030914] to-slate-950 text-white pb-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                Sovereign Citizen Portal
              </span>
            </div>
            <h1 className="text-white text-2xl sm:text-3xl font-black tracking-tight mt-1.5">Welcome, Belizean</h1>
          </div>

          {selectedAccount?.address && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-200 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{selectedAccount.name || `${selectedAccount.address.slice(0, 6)}...${selectedAccount.address.slice(-4)}`}</span>
            </div>
          )}
        </motion.div>

        {/* System Readiness Panel */}
        <div>
          <MayaShellReadinessPanel />
        </div>

        {/* Hero Balance Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/20"
        >
          {/* Ambient decorative glowing halogens */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Coins size={18} weight="fill" />
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Sovereign Holdings</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Currency Switcher Pill */}
                <div className="flex items-center bg-slate-950/80 backdrop-blur-md rounded-2xl p-1 border border-slate-800 text-xs font-bold">
                  {(['USD', 'BZD', 'DALLA'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => handleCurrencyChange(c)}
                      className={`px-3 py-1 rounded-xl transition-all ${
                        currencyPref === c
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {c === 'DALLA' ? 'Ɗ DALLA' : c}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title={balanceVisible ? 'Hide Balance' : 'Show Balance'}
                >
                  {balanceVisible ? <Eye size={18} weight="fill" /> : <EyeSlash size={18} weight="fill" />}
                </button>
              </div>
            </div>

            {balanceVisible ? (
              <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }}>
                <h2 className="text-white text-4xl sm:text-5xl font-black tracking-tight font-sans">
                  {formattedPrimaryTotal}
                </h2>
                <p className="text-slate-400 text-xs mt-1.5 font-medium">{secondaryConversionText}</p>
              </motion.div>
            ) : (
              <div>
                <h2 className="text-white text-4xl sm:text-5xl font-black tracking-widest">••••••</h2>
              </div>
            )}

            {/* Quick Action Buttons Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
              <Link
                href="/send"
                className="group flex flex-col items-center justify-center py-3.5 px-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 active:scale-95 transition-all text-white text-xs font-bold shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2 group-hover:scale-110 transition-transform">
                  <PaperPlaneTilt size={20} weight="fill" />
                </div>
                <span>Send</span>
              </Link>
              <Link
                href="/receive"
                className="group flex flex-col items-center justify-center py-3.5 px-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 active:scale-95 transition-all text-white text-xs font-bold shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                  <QrCode size={20} weight="fill" />
                </div>
                <span>Receive</span>
              </Link>
              <Link
                href="/trade?mode=amm"
                className="group flex flex-col items-center justify-center py-3.5 px-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 active:scale-95 transition-all text-white text-xs font-bold shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                  <ArrowsLeftRight size={20} weight="bold" />
                </div>
                <span>Swap</span>
              </Link>
              <Link
                href="/staking"
                className="group flex flex-col items-center justify-center py-3.5 px-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 active:scale-95 transition-all text-white text-xs font-bold shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                  <Coins size={20} weight="fill" />
                </div>
                <span>Staking</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Civic Safeguards & Democracy Hub */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} weight="bold" className="text-cyan-400" />
              <h3 className="text-white text-sm font-bold uppercase tracking-wider">Civic Safeguards & Democracy</h3>
            </div>
            <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
              Sovereign
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Whistleblower */}
            <Link
              href="/whistleblower"
              className="group p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-900/60 transition-all shadow-md"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={18} weight="fill" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">Whistleblower</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">Encrypted sovereign tip-offs & escrow rewards</p>
            </Link>

            {/* Citizen Court */}
            <Link
              href="/community"
              className="group p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-900/60 transition-all shadow-md"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-300 group-hover:scale-110 transition-transform">
                  <Scales size={18} weight="fill" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">Citizen Court</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">On-chain community dispute arbitration</p>
            </Link>

            {/* BelizeID */}
            <Link
              href="/belizeid"
              className="group p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900/60 transition-all shadow-md"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                  <IdentificationCard size={18} weight="fill" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">BelizeID</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">Decentralized credentials & civic status</p>
            </Link>

            {/* Governance */}
            <Link
              href="/governance"
              className="group p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-900/60 transition-all shadow-md"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                  <Bank size={18} weight="fill" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">Governance</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">Democracy referenda & Treasury proposals</p>
            </Link>
          </div>
        </div>

        {/* Assets Section */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins size={20} weight="bold" className="text-cyan-400" />
              <h3 className="text-white text-base font-bold">Sovereign Asset Portfolio</h3>
            </div>
            <button
              onClick={() => setShowAllAssets(true)}
              className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-cyan-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              View All ({assets.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-slate-950 p-5 rounded-2xl border border-slate-800/90 hover:border-slate-700 space-y-3 shadow-lg transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${asset.color} flex items-center justify-center shadow-md`}>
                      <asset.icon size={18} weight="fill" className="text-slate-950" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{asset.name}</p>
                      <span className="text-[10px] text-slate-500 font-mono">{asset.symbol}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${asset.badgeBg}`}>
                    {asset.priceInfo}
                  </span>
                </div>

                <div>
                  <p className="text-white text-2xl font-black font-mono tracking-tight">{asset.displayAmount}</p>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">{asset.secondaryInfo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Protocol Rewards & Trends */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartLine size={20} weight="bold" className="text-cyan-400" />
              <h3 className="text-white text-base font-bold">Protocol Yield & Contributions</h3>
            </div>
            {trends.length > 0 && (
              <button
                onClick={() => setShowAllTrends(true)}
                className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-cyan-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Details
              </button>
            )}
          </div>

          {trends.length === 0 ? (
            <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-8 text-center space-y-2">
              <Gift size={36} className="mx-auto text-slate-600" weight="thin" />
              <p className="text-xs font-bold text-slate-300">No protocol rewards recorded yet</p>
              <p className="text-[11px] text-slate-500">Tourism verified cashback and PoUW AI rewards will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trends.map((trend) => (
                <div
                  key={trend.id}
                  onClick={() => setSelectedTrend(selectedTrend === trend.id ? null : trend.id)}
                  className="bg-slate-950 rounded-2xl p-4 border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${trend.color} flex items-center justify-center shadow-md`}>
                        <trend.icon size={20} weight="fill" className="text-slate-950" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{trend.title}</p>
                        <p className="text-slate-400 text-xs">{trend.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Mini sparkline */}
                      <div className="w-20 h-8">
                        <svg className="w-full h-full" viewBox="0 0 100 40">
                          <polyline
                            points={trend.chartData
                              .map((val, i) => `${(i / (trend.chartData.length - 1)) * 100},${40 - val}`)
                              .join(' ')}
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold font-mono text-sm">{trend.value}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {selectedTrend === trend.id && (
                    <div className="pt-3 border-t border-slate-800 space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">This Month</p>
                          <p className="text-emerald-400 font-bold">{trend.monthlyValue}</p>
                        </div>
                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                          <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Total Earned</p>
                          <p className="text-white font-bold">{trend.totalValue}</p>
                        </div>
                      </div>

                      {trend.stats && trend.id === 'tourism' && (
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                          <div className="flex justify-between text-slate-400">
                            <span>Verified Merchants:</span>
                            <span className="text-white font-bold">{trend.stats.merchants}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Monthly Spending:</span>
                            <span className="text-white font-bold">{trend.stats.spending}</span>
                          </div>
                        </div>
                      )}

                      {trend.stats && trend.id === 'pouw' && (
                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-[11px]">
                          <div className="flex justify-between text-slate-400">
                            <span>Total Contributions:</span>
                            <span className="text-white font-bold">{trend.stats.contributions}</span>
                          </div>
                          <div className="space-y-1.5 pt-1">
                            <div>
                              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                                <span>Quality Score</span>
                                <span className="text-cyan-300 font-bold">{trend.stats.quality}%</span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5">
                                <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: `${trend.stats.quality}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                                <span>Timeliness</span>
                                <span className="text-emerald-300 font-bold">{trend.stats.timeliness}%</span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5">
                                <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${trend.stats.timeliness}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staking Section */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightning size={20} weight="bold" className="text-cyan-400" />
              <h3 className="text-white text-base font-bold">Validator Staking & Security</h3>
            </div>
            <Link href="/staking">
              <button className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-cyan-400 hover:text-white hover:bg-slate-800 transition-colors">
                Manage Staking
              </button>
            </Link>
          </div>

          {stakingPositions.length === 0 ? (
            <div className="bg-slate-950/60 rounded-2xl border border-slate-800 p-8 text-center space-y-3">
              <Lightning size={36} className="mx-auto text-slate-600" weight="thin" />
              <p className="text-xs font-bold text-slate-300">No active staking delegation</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Stake DALLA with network validators to secure block production and earn PoUW reward yields.
              </p>
              <div>
                <Link href="/staking">
                  <button className="bg-gradient-to-r from-cyan-500 to-emerald-400 hover:opacity-95 text-slate-950 font-bold py-2.5 px-6 rounded-2xl transition-all text-xs shadow-lg shadow-cyan-500/20">
                    Start Staking DALLA
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            stakingPositions.map((stake) => (
              <div key={stake.id} className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Coins size={20} weight="fill" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Staking Delegation</p>
                      <p className="text-slate-400 text-xs font-mono">Era {stake.era}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-xl font-bold font-mono">{stake.amount} Ɗ</p>
                    <p className="text-slate-500 text-[10px]">Staked DALLA</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-3 rounded-xl text-center border border-slate-800">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">Active</p>
                    <p className="text-emerald-400 font-bold font-mono text-xs">{stake.active}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl text-center border border-slate-800">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">Unbonding</p>
                    <p className="text-amber-400 font-bold font-mono text-xs">{stake.unbonding}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl text-center border border-slate-800">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">Rewards</p>
                    <p className="text-white font-bold font-mono text-xs">{stake.rewards}</p>
                  </div>
                </div>

                <Link href="/staking" className="block">
                  <button className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold py-2.5 px-4 rounded-xl transition-all text-xs">
                    Manage Staking Positions
                  </button>
                </Link>
              </div>
            ))
          )}
        </div>

        {/* Activity Ledger Section */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={20} weight="bold" className="text-cyan-400" />
              <h3 className="text-white text-base font-bold">Recent On-Chain Activity</h3>
            </div>
            <button
              onClick={() => setShowActivityFilter(!showActivityFilter)}
              className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-cyan-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <SlidersHorizontal size={12} weight="bold" />
              <span>Filter</span>
            </button>
          </div>

          {/* Activity Filter Dropdown */}
          {showActivityFilter && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-950 rounded-2xl p-3 border border-slate-800 space-y-2"
            >
              <p className="text-slate-400 text-xs font-bold">Filter by category:</p>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'tourism', 'pouw', 'staking', 'send', 'received'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActivityFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase text-[10px] transition-all ${
                      activityFilter === filter
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="space-y-2.5">
            {activities.filter((activity) => activityFilter === 'all' || activity.type === activityFilter).length === 0 ? (
              <div className="bg-slate-950/60 rounded-2xl p-8 border border-slate-800 text-center space-y-2">
                <Clock size={36} className="mx-auto text-slate-600" weight="thin" />
                <p className="text-slate-400 text-xs font-bold">No activity found for selected filter</p>
              </div>
            ) : (
              activities
                .filter((activity) => activityFilter === 'all' || activity.type === activityFilter)
                .map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                        <activity.icon size={18} weight="fill" className={activity.color} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs">{activity.title}</p>
                        <p className="text-slate-400 text-[11px]">{activity.subtitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold font-mono text-xs ${activity.amount.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {activity.amount}
                      </p>
                      <p className="text-slate-500 text-[10px] font-mono">{activity.time}</p>
                    </div>
                  </motion.div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* All Assets Modal */}
      {showAllAssets && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <h2 className="text-white text-base font-bold flex items-center gap-2">
                <Coins size={18} className="text-cyan-400" />
                All Sovereign Assets
              </h2>
              <button
                onClick={() => setShowAllAssets(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto">
              {assets.map((asset) => (
                <div key={asset.id} className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${asset.color} flex items-center justify-center shadow-md`}>
                        <asset.icon size={18} weight="fill" className="text-slate-950" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{asset.name}</p>
                        <p className="text-slate-400 text-[11px]">{asset.priceInfo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-mono font-bold text-base">{asset.displayAmount}</p>
                      <p className="text-slate-500 text-[10px]">{asset.secondaryInfo}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* All Trends Modal */}
      {showAllTrends && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <h2 className="text-white text-base font-bold flex items-center gap-2">
                <ChartLine size={18} className="text-cyan-400" />
                All Protocol Rewards
              </h2>
              <button
                onClick={() => setShowAllTrends(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {trends.map((trend) => (
                <div key={trend.id} className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${trend.color} flex items-center justify-center shadow-md`}>
                        <trend.icon size={18} weight="fill" className="text-slate-950" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{trend.title}</p>
                        <p className="text-slate-400 text-xs">{trend.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-emerald-400 font-bold font-mono text-base">{trend.value}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">This Month</p>
                      <p className="text-emerald-400 font-bold">{trend.monthlyValue}</p>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Total Earned</p>
                      <p className="text-white font-bold">{trend.totalValue}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
