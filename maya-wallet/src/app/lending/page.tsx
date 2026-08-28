'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
} from 'phosphor-react';

interface LendingAsset {
  id: string;
  name: string;
  symbol: string;
  type: 'Native' | 'Statutory' | 'Cross-Chain';
  supplyApy: number;
  borrowApr: number;
  totalSupplied: string;
  totalBorrowed: string;
  maxLtv: number;
  userSupplied: number;
  userBorrowed: number;
  isCollateral: boolean;
  color: string;
}

export default function LendingPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [assets, setAssets] = useState<LendingAsset[]>([
    {
      id: 'dalla',
      name: 'DALLA',
      symbol: 'Ɗ',
      type: 'Native',
      supplyApy: 8.4,
      borrowApr: 11.2,
      totalSupplied: '1,450,000 Ɗ',
      totalBorrowed: '620,000 Ɗ',
      maxLtv: 75,
      userSupplied: 2500,
      userBorrowed: 0,
      isCollateral: true,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'bbzd',
      name: 'bBZD (Sandbox)',
      symbol: 'BZ$',
      type: 'Statutory',
      supplyApy: 5.2,
      borrowApr: 7.8,
      totalSupplied: '2,800,000 BZ$',
      totalBorrowed: '1,950,000 BZ$',
      maxLtv: 80,
      userSupplied: 0,
      userBorrowed: 850,
      isCollateral: false,
      color: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'wdot',
      name: 'Wrapped DOT',
      symbol: 'wDOT',
      type: 'Cross-Chain',
      supplyApy: 9.6,
      borrowApr: 13.5,
      totalSupplied: '45,000 wDOT',
      totalBorrowed: '18,500 wDOT',
      maxLtv: 70,
      userSupplied: 0,
      userBorrowed: 0,
      isCollateral: false,
      color: 'from-purple-500 to-pink-600',
    },
    {
      id: 'weth',
      name: 'Wrapped Ether',
      symbol: 'wETH',
      type: 'Cross-Chain',
      supplyApy: 4.8,
      borrowApr: 6.9,
      totalSupplied: '280 wETH',
      totalBorrowed: '95 wETH',
      maxLtv: 65,
      userSupplied: 0,
      userBorrowed: 0,
      isCollateral: false,
      color: 'from-indigo-500 to-blue-600',
    },
  ]);

  const [activeModal, setActiveModal] = useState<{
    type: 'supply' | 'borrow' | 'repay' | 'withdraw';
    asset: LendingAsset;
  } | null>(null);
  const [modalAmount, setModalAmount] = useState('');

  // Total User Metrics (Estimated in bBZD value for summary)
  // Assuming 1 DALLA = 0.5 bBZD
  const totalCollateralValue = assets.reduce((sum, a) => {
    if (!a.isCollateral) return sum;
    const value = a.id === 'dalla' ? a.userSupplied * 0.5 : a.userSupplied;
    return sum + value;
  }, 0);

  const totalBorrowedValue = assets.reduce((sum, a) => {
    const value = a.id === 'dalla' ? a.userBorrowed * 0.5 : a.userBorrowed;
    return sum + value;
  }, 0);

  const maxBorrowLimit = totalCollateralValue * 0.75;
  const borrowUtilizationPct = maxBorrowLimit > 0 ? Math.round((totalBorrowedValue / maxBorrowLimit) * 100) : 0;
  const healthFactor = totalBorrowedValue > 0 ? (totalCollateralValue * 0.75) / totalBorrowedValue : 999;

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
      message: `Successfully executed ${type.toUpperCase()} for ${amt} ${asset.symbol}!`,
    });

    setModalAmount('');
    setActiveModal(null);
  };

  const toggleCollateral = (id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isCollateral: !a.isCollateral } : a))
    );
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to access BelizeChain collateralized lending and money markets." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 z-10">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors">
                <ArrowLeft size={24} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Collateralized Money Markets</h1>
              <p className="text-xs text-slate-400">Micro-Lending Protocol • 50-80% LTV • Supply Yield & Borrow</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Bank size={16} weight="bold" />
              Testbed Money Market
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Testbed Notice */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/30 rounded-3xl p-4 sm:p-5 flex items-start gap-3 shadow-lg">
          <Info size={24} className="text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-cyan-300">Decentralized Micro-Lending Testnet Protocol</h4>
            <p className="text-slate-300 leading-relaxed">
              Borrow bBZD stablecoins by locking unpegged DALLA or cross-chain wrapped assets as collateral. All interest rates dynamically adjust based on pool liquidity utilization.
            </p>
          </div>
        </div>

        {/* Health Factor & Position Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Collateral</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">BZ$ {totalCollateralValue.toFixed(2)}</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Active Earning Collateral</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Borrowed</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300 font-mono">BZ$ {totalBorrowedValue.toFixed(2)}</span>
            </div>
            <span className="text-[11px] text-slate-400 block">{borrowUtilizationPct}% of borrow limit</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Borrow Limit</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400 font-mono">BZ$ {maxBorrowLimit.toFixed(2)}</span>
            </div>
            <span className="text-[11px] text-slate-400 block">75% weighted max LTV</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Collateral Health Factor</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-lg font-bold font-mono ${healthFactor > 2 ? 'text-emerald-400' : healthFactor > 1.3 ? 'text-amber-400' : 'text-rose-400'}`}>
                {healthFactor > 50 ? '∞ Safe' : healthFactor.toFixed(2)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">Liquidation at &lt; 1.05</span>
          </div>
        </div>

        {/* Markets Table */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
            Available Supply & Borrow Pools
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 shadow-xl text-xs flex flex-col justify-between transition-all"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${asset.color} flex items-center justify-center font-bold text-white text-sm shadow-md`}>
                        {asset.symbol}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{asset.name}</h3>
                        <span className="text-slate-400 text-[10px]">{asset.type} • Max LTV {asset.maxLtv}%</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-emerald-400 font-bold text-xs font-mono block">Supply: {asset.supplyApy}% APY</span>
                      <span className="text-amber-400 font-bold text-[11px] font-mono block">Borrow: {asset.borrowApr}% APR</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Market Liquidity:</span>
                      <span className="text-white font-bold">{asset.totalSupplied}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Your Supplied:</span>
                      <span className="text-emerald-400 font-bold">{asset.userSupplied} {asset.symbol}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Your Borrowed:</span>
                      <span className="text-amber-400 font-bold">{asset.userBorrowed} {asset.symbol}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => setActiveModal({ type: 'supply', asset })}
                    className="py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded-xl border border-emerald-500/30 text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ArrowDownLeft size={14} weight="bold" /> Supply
                  </button>

                  <button
                    onClick={() => setActiveModal({ type: 'borrow', asset })}
                    className="py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold rounded-xl border border-cyan-500/30 text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ArrowUpRight size={14} weight="bold" /> Borrow
                  </button>

                  {asset.userSupplied > 0 && (
                    <button
                      onClick={() => setActiveModal({ type: 'withdraw', asset })}
                      className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-[11px] transition-all col-span-1"
                    >
                      Withdraw
                    </button>
                  )}

                  {asset.userBorrowed > 0 && (
                    <button
                      onClick={() => setActiveModal({ type: 'repay', asset })}
                      className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-[11px] transition-all col-span-1"
                    >
                      Repay
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-base capitalize flex items-center gap-2">
                <Bank size={20} className="text-cyan-400" />
                {activeModal.type} {activeModal.asset.name}
              </span>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAction} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-bold block mb-1">
                  Amount to {activeModal.type} ({activeModal.asset.symbol})
                </label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={modalAmount}
                  onChange={(e) => setModalAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Interest Rate:</span>
                  <span className="text-white font-bold">
                    {activeModal.type === 'supply' || activeModal.type === 'withdraw'
                      ? `${activeModal.asset.supplyApy}% APY`
                      : `${activeModal.asset.borrowApr}% APR`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Max LTV:</span>
                  <span className="text-slate-200">{activeModal.asset.maxLtv}%</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs transition-all uppercase tracking-wider shadow-lg"
              >
                Confirm {activeModal.type}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
