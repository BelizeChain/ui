'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  Bank,
  ArrowLeft,
  TrendUp,
  TrendDown,
  Coins,
  ShieldCheck,
  Warning,
  Sparkle,
  CheckCircle,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  ArrowsClockwise,
  Lightning,
  SlidersHorizontal,
  Check,
  Receipt,
  X,
  FileText,
  ChartLineUp,
  Activity,
} from 'phosphor-react';

interface LendingAsset {
  id: string;
  name: string;
  symbol: string;
  type: 'Native' | 'Statutory' | 'Cross-Chain' | 'RWA';
  supplyApy: number;
  borrowApr: number;
  totalSupplied: string;
  totalBorrowed: string;
  maxLtv: number;
  liquidationThreshold: number;
  userSupplied: number;
  userBorrowed: number;
  isCollateral: boolean;
  oraclePriceBBZD: number;
  color: string;
}

const INITIAL_LENDING_ASSETS: LendingAsset[] = [
  {
    id: 'dalla',
    name: 'DALLA (Native Consensus)',
    symbol: 'Ɗ',
    type: 'Native',
    supplyApy: 8.4,
    borrowApr: 11.2,
    totalSupplied: '1,450,000 Ɗ',
    totalBorrowed: '620,000 Ɗ',
    maxLtv: 75,
    liquidationThreshold: 82,
    userSupplied: 2500,
    userBorrowed: 0,
    isCollateral: true,
    oraclePriceBBZD: 5.0,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'bbzd',
    name: 'Statutory Belize Dollar',
    symbol: 'bBZD',
    type: 'Statutory',
    supplyApy: 5.2,
    borrowApr: 7.8,
    totalSupplied: '2,800,000 bBZD',
    totalBorrowed: '1,950,000 bBZD',
    maxLtv: 80,
    liquidationThreshold: 85,
    userSupplied: 0,
    userBorrowed: 850,
    isCollateral: false,
    oraclePriceBBZD: 1.0,
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'bzsolar',
    name: 'Belmopan Solar Bond (RWA)',
    symbol: 'BZSOLAR',
    type: 'RWA',
    supplyApy: 9.8,
    borrowApr: 12.5,
    totalSupplied: '500,000 BZSOLAR',
    totalBorrowed: '180,000 BZSOLAR',
    maxLtv: 70,
    liquidationThreshold: 78,
    userSupplied: 50,
    userBorrowed: 0,
    isCollateral: true,
    oraclePriceBBZD: 100.0,
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'wdot',
    name: 'Wrapped Polkadot',
    symbol: 'wDOT',
    type: 'Cross-Chain',
    supplyApy: 9.6,
    borrowApr: 13.5,
    totalSupplied: '45,000 wDOT',
    totalBorrowed: '18,500 wDOT',
    maxLtv: 70,
    liquidationThreshold: 75,
    userSupplied: 0,
    userBorrowed: 0,
    isCollateral: false,
    oraclePriceBBZD: 14.2,
    color: 'from-purple-500 to-pink-600',
  },
  {
    id: 'weth',
    name: 'Wrapped Ethereum',
    symbol: 'wETH',
    type: 'Cross-Chain',
    supplyApy: 4.8,
    borrowApr: 6.9,
    totalSupplied: '280 wETH',
    totalBorrowed: '95 wETH',
    maxLtv: 65,
    liquidationThreshold: 72,
    userSupplied: 0,
    userBorrowed: 0,
    isCollateral: false,
    oraclePriceBBZD: 6400.0,
    color: 'from-indigo-500 to-blue-600',
  },
];

export default function LendingPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [assets, setAssets] = useState<LendingAsset[]>(INITIAL_LENDING_ASSETS);
  const [activeTab, setActiveTab] = useState<'markets' | 'my-position' | 'flash-loan' | 'analytics'>('markets');

  const [activeModal, setActiveModal] = useState<{
    type: 'supply' | 'borrow' | 'repay' | 'withdraw';
    asset: LendingAsset;
  } | null>(null);
  const [modalAmount, setModalAmount] = useState('');

  // Flash Loan State
  const [flashLoanAsset, setFlashLoanAsset] = useState<string>('bbzd');
  const [flashLoanAmount, setFlashLoanAmount] = useState<string>('50000');
  const [isExecutingFlash, setIsExecutingFlash] = useState(false);

  // Total User Metrics (Computed in bBZD via Oracle Price)
  const totalCollateralValueBBZD = useMemo(() => {
    return assets.reduce((sum, a) => {
      if (!a.isCollateral) return sum;
      return sum + a.userSupplied * a.oraclePriceBBZD;
    }, 0);
  }, [assets]);

  const totalBorrowedValueBBZD = useMemo(() => {
    return assets.reduce((sum, a) => {
      return sum + a.userBorrowed * a.oraclePriceBBZD;
    }, 0);
  }, [assets]);

  const maxBorrowLimitBBZD = totalCollateralValueBBZD * 0.75;
  const borrowUtilizationPct = maxBorrowLimitBBZD > 0 ? Math.round((totalBorrowedValueBBZD / maxBorrowLimitBBZD) * 100) : 0;
  const healthFactor = totalBorrowedValueBBZD > 0 ? (totalCollateralValueBBZD * 0.75) / totalBorrowedValueBBZD : 999;

  // Handle Supply/Borrow/Withdraw/Repay Actions
  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal || !modalAmount) return;

    const amt = parseFloat(modalAmount);
    if (isNaN(amt) || amt <= 0) return;

    const { type, asset } = activeModal;

    setAssets((prev) =>
      prev.map((a) => {
        if (a.id === asset.id) {
          if (type === 'supply') {
            return { ...a, userSupplied: a.userSupplied + amt, isCollateral: true };
          } else if (type === 'withdraw') {
            return { ...a, userSupplied: Math.max(a.userSupplied - amt, 0) };
          } else if (type === 'borrow') {
            return { ...a, userBorrowed: a.userBorrowed + amt };
          } else if (type === 'repay') {
            return { ...a, userBorrowed: Math.max(a.userBorrowed - amt, 0) };
          }
        }
        return a;
      })
    );

    addNotification({
      type: 'success',
      message: `Successfully executed ${type.toUpperCase()} of ${amt.toLocaleString()} ${asset.symbol}!`,
    });

    setModalAmount('');
    setActiveModal(null);
  };

  // Handle Flash Loan Execution
  const handleExecuteFlashLoan = (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecutingFlash(true);

    setTimeout(() => {
      setIsExecutingFlash(false);
      const fee = parseFloat(flashLoanAmount) * 0.0005; // 0.05% flash loan fee
      addNotification({
        type: 'success',
        message: `Flash Loan of ${parseFloat(flashLoanAmount).toLocaleString()} ${flashLoanAsset.toUpperCase()} executed atomically in block #1,492,308! Fee paid: ${fee.toFixed(2)} ${flashLoanAsset.toUpperCase()}.`,
      });
    }, 1400);
  };

  const toggleCollateral = (id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isCollateral: !a.isCollateral } : a))
    );
  };

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to access sovereign BelizeChain collateralized lending and money markets."
        fullScreen
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button
                title="Return to Maya Wallet"
                className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-all border border-slate-700/50"
              >
                <ArrowLeft size={20} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Bank size={22} className="text-emerald-400" />
                BelizeChain Sovereign Money Markets & Lending
              </h1>
              <p className="text-xs text-slate-400">
                Statutory bBZD Stablecoin • 50-80% LTV • Dynamic Utilization APYs • Zero-Fee Collateral Vaults
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold font-mono flex items-center gap-1.5">
              <ShieldCheck size={14} weight="fill" />
              Mainnet Consensus Secured
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Collateral */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total Collateral</span>
              <Coins size={18} className="text-emerald-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-white">
                BZ$ {totalCollateralValueBBZD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Earning APY:</span>
              <span className="text-emerald-300 font-bold">+8.4% Average</span>
            </div>
          </div>

          {/* Card 2: Total Borrowed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total Borrowed</span>
              <ArrowUpRight size={18} className="text-cyan-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-cyan-300">
                BZ$ {totalBorrowedValueBBZD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Pool Utilization:</span>
              <span className="text-cyan-300 font-bold">{borrowUtilizationPct}% of limit</span>
            </div>
          </div>

          {/* Card 3: Borrow Capacity Limit */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Borrow Capacity</span>
              <Bank size={18} className="text-purple-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-purple-300">
                BZ$ {maxBorrowLimitBBZD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Weighted Max LTV:</span>
              <span className="text-slate-300">75% Statutory Limit</span>
            </div>
          </div>

          {/* Card 4: Health Factor Meter */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Collateral Health Factor</span>
              <Activity size={18} className={healthFactor > 2 ? 'text-emerald-400' : 'text-amber-400'} />
            </div>
            <div>
              <span
                className={`text-2xl font-bold font-mono ${
                  healthFactor > 2 ? 'text-emerald-400' : healthFactor > 1.3 ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {healthFactor > 50 ? '∞ Safe' : healthFactor.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Liquidation Risk:</span>
              <span className={healthFactor > 2 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {healthFactor > 2 ? 'Zero Risk' : 'High Alert (<1.05)'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-2xl p-1 overflow-x-auto text-xs font-bold gap-1">
          {(['markets', 'my-position', 'flash-loan', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 rounded-xl capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'markets'
                ? 'Supply & Borrow Markets'
                : tab === 'my-position'
                ? 'My Collateral Position'
                : tab === 'flash-loan'
                ? 'Flash Loan Studio'
                : 'Protocol Analytics'}
            </button>
          ))}
        </div>

        {/* Tab 1: Supply & Borrow Markets */}
        {activeTab === 'markets' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-md flex flex-col justify-between transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${asset.color} flex items-center justify-center font-black text-white text-sm shadow-md`}
                        >
                          {asset.symbol}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">{asset.name}</h3>
                          <span className="text-slate-400 text-xs font-mono">
                            {asset.type} • Max LTV {asset.maxLtv}%
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-emerald-400 font-bold text-xs block">Supply: {asset.supplyApy}% APY</span>
                        <span className="text-cyan-300 font-bold text-[11px] block">Borrow: {asset.borrowApr}% APR</span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Total Market Liquidity:</span>
                        <span className="text-white font-bold">{asset.totalSupplied}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Oracle Price:</span>
                        <span className="text-cyan-300 font-bold">BZ$ {asset.oraclePriceBBZD.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Your Supplied:</span>
                        <span className="text-emerald-400 font-bold">
                          {asset.userSupplied.toLocaleString()} {asset.symbol}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Your Borrowed:</span>
                        <span className="text-amber-400 font-bold">
                          {asset.userBorrowed.toLocaleString()} {asset.symbol}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setActiveModal({ type: 'supply', asset })}
                      className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <ArrowDownLeft size={16} weight="bold" /> Supply
                    </button>

                    <button
                      onClick={() => setActiveModal({ type: 'borrow', asset })}
                      className="py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <ArrowUpRight size={16} weight="bold" /> Borrow
                    </button>

                    {asset.userSupplied > 0 && (
                      <button
                        onClick={() => setActiveModal({ type: 'withdraw', asset })}
                        className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all border border-slate-700/50"
                      >
                        Withdraw
                      </button>
                    )}

                    {asset.userBorrowed > 0 && (
                      <button
                        onClick={() => setActiveModal({ type: 'repay', asset })}
                        className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all border border-slate-700/50"
                      >
                        Repay
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: My Collateral Position */}
        {activeTab === 'my-position' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={22} className="text-emerald-400" />
                  Collateral & Borrow Position Inspector
                </h3>
                <p className="text-slate-400 mt-0.5">
                  Manage individual collateral toggles and monitor real-time liquidation thresholds.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {assets
                .filter((a) => a.userSupplied > 0 || a.userBorrowed > 0)
                .map((a) => (
                  <div
                    key={a.id}
                    className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center font-black text-white text-sm`}
                      >
                        {a.symbol}
                      </div>
                      <div>
                        <span className="font-bold text-white text-base block">{a.name}</span>
                        <span className="text-slate-400 text-xs font-mono">
                          Supplied: {a.userSupplied} {a.symbol} (BZ$ {(a.userSupplied * a.oraclePriceBBZD).toLocaleString()})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono text-xs">
                        <span className="text-slate-400 block text-[10px]">Borrowed</span>
                        <span className="text-cyan-300 font-bold">
                          {a.userBorrowed} {a.symbol}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleCollateral(a.id)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs border transition-all ${
                          a.isCollateral
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {a.isCollateral ? 'Collateral Enabled' : 'Collateral Disabled'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tab 3: Flash Loan Studio */}
        {activeTab === 'flash-loan' && (
          <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lightning size={22} className="text-amber-400" />
                Atomic Zero-Collateral Flash Loan Studio
              </h3>
              <p className="text-slate-400 mt-1">
                Borrow uncollateralized liquidity provided the loan is returned with 0.05% protocol fee within the same block execution transaction.
              </p>
            </div>

            <form onSubmit={handleExecuteFlashLoan} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">Select Flash Pool</label>
                <select
                  value={flashLoanAsset}
                  onChange={(e) => setFlashLoanAsset(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
                >
                  <option value="bbzd">Statutory Belize Dollar (bBZD) - Max Pool: 2.8M</option>
                  <option value="dalla">DALLA Consensus Token (Ɗ) - Max Pool: 1.45M</option>
                  <option value="wdot">Wrapped DOT (wDOT) - Max Pool: 45K</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">Flash Borrow Amount</label>
                <input
                  type="number"
                  required
                  value={flashLoanAmount}
                  onChange={(e) => setFlashLoanAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Protocol Flash Fee (0.05%):</span>
                  <span className="text-amber-300 font-bold">
                    {(parseFloat(flashLoanAmount || '0') * 0.0005).toFixed(2)} {flashLoanAsset.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Required Return Amount:</span>
                  <span className="text-white font-bold">
                    {(parseFloat(flashLoanAmount || '0') * 1.0005).toFixed(2)} {flashLoanAsset.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Execution Constraints:</span>
                  <span className="text-emerald-400 font-bold">Single Extrinsic Atomic Settlement</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isExecutingFlash || !flashLoanAmount}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <Lightning size={16} weight="bold" />
                {isExecutingFlash ? 'Simulating Atomic Flash Loan...' : 'Execute Atomic Flash Loan'}
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Protocol Analytics */}
        {activeTab === 'analytics' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ChartLineUp size={22} className="text-cyan-400" />
                BelizeChain Money Market Telemetry
              </h3>
              <p className="text-slate-400 mt-1">
                Real-time interest rate models, total value locked (TVL), and sovereign stability parameters.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Protocol TVL</span>
                <span className="text-xl font-bold font-mono text-emerald-400">BZ$ 8,420,000</span>
                <p className="text-slate-500 text-[11px]">Across 5 audited liquidity pools</p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Active Borrow Volume</span>
                <span className="text-xl font-bold font-mono text-cyan-300">BZ$ 4,110,000</span>
                <p className="text-slate-500 text-[11px]">48.8% aggregate utilization rate</p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Reserve Factor</span>
                <span className="text-xl font-bold font-mono text-purple-300">10.0% Statutory</span>
                <p className="text-slate-500 text-[11px]">Remitted to National Treasury Safety Pool</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Action Modal (Supply / Borrow / Withdraw / Repay) */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative text-xs"
            >
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${activeModal.asset.color} flex items-center justify-center font-black text-white text-base shadow-md`}
                >
                  {activeModal.asset.symbol}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white capitalize">
                    {activeModal.type} {activeModal.asset.name}
                  </h3>
                  <span className="text-slate-400 text-xs font-mono">
                    Oracle Rate: BZ$ {activeModal.asset.oraclePriceBBZD.toLocaleString()}
                  </span>
                </div>
              </div>

              <form onSubmit={handleAction} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-slate-400 uppercase font-semibold text-[10px]">
                      Amount to {activeModal.type}
                    </label>
                    <span className="text-slate-400 text-[10px] font-mono">
                      Supplied: {activeModal.asset.userSupplied} {activeModal.asset.symbol}
                    </span>
                  </div>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-base font-bold text-white font-mono focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setModalAmount((1000 * (pct / 100)).toString())}
                      className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl font-mono text-xs font-bold text-slate-300 hover:text-white transition-all"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Applicable Interest Rate:</span>
                    <span className="text-white font-bold">
                      {activeModal.type === 'supply' || activeModal.type === 'withdraw'
                        ? `${activeModal.asset.supplyApy}% APY`
                        : `${activeModal.asset.borrowApr}% APR`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Collateral Max LTV:</span>
                    <span className="text-cyan-300 font-bold">{activeModal.asset.maxLtv}%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Liquidation Threshold:</span>
                    <span className="text-purple-300 font-bold">{activeModal.asset.liquidationThreshold}%</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl"
                >
                  Confirm {activeModal.type} Transaction
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
