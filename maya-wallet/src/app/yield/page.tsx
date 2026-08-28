'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  TrendUp,
  Sparkle,
  Coins,
  ShieldCheck,
  ArrowLeft,
  ArrowsClockwise,
  ChartLineUp,
  Lightning,
  TreeEvergreen,
  LockKey,
  CheckCircle,
  CurrencyDollar,
  X,
  Plus,
} from 'phosphor-react';

interface YieldVault {
  id: string;
  name: string;
  depositToken: 'DALLA' | 'bBZD' | 'wDOT' | 'wETH';
  tokenSymbol: string;
  apy: number;
  baseApy: number;
  boostApy: number;
  tvl: string;
  strategies: string[];
  riskLevel: 'Low' | 'Moderate' | 'Enhanced';
  userDeposited: number;
  pendingRewards: number;
  autoCompoundFrequency: string;
}

const INITIAL_VAULTS: YieldVault[] = [
  {
    id: 'vault-1',
    name: 'DALLA Sovereign Maxi Compounder',
    depositToken: 'DALLA',
    tokenSymbol: 'Ɗ',
    apy: 18.4,
    baseApy: 14.2,
    boostApy: 4.2,
    tvl: '12,450,000 Ɗ',
    strategies: ['NPoS Validator Staking', 'Kinich Quantum PoUW Bonus', 'BelizeX Trading Fee Buyback'],
    riskLevel: 'Low',
    userDeposited: 2500,
    pendingRewards: 48.75,
    autoCompoundFrequency: 'Every 6 Hours',
  },
  {
    id: 'vault-2',
    name: 'bBZD Inflation Defense Stable Vault',
    depositToken: 'bBZD',
    tokenSymbol: 'BZ$',
    apy: 11.2,
    baseApy: 8.5,
    boostApy: 2.7,
    tvl: '8,920,000 BZ$',
    strategies: ['Collateralized Money Market Supply', 'AMM Liquidity Routing Spread', 'SSB Reserve Backing'],
    riskLevel: 'Low',
    userDeposited: 1200,
    pendingRewards: 24.18,
    autoCompoundFrequency: 'Every 12 Hours',
  },
  {
    id: 'vault-3',
    name: 'Blue Economy Carbon & Solar Booster',
    depositToken: 'DALLA',
    tokenSymbol: 'Ɗ',
    apy: 15.6,
    baseApy: 11.8,
    boostApy: 3.8,
    tvl: '4,150,000 Ɗ',
    strategies: ['Mangrove Reforestation Credit Yields', 'LoRa Solar Relay Mining Rewards', 'Municipal Green Rebates'],
    riskLevel: 'Moderate',
    userDeposited: 0,
    pendingRewards: 0,
    autoCompoundFrequency: 'Daily',
  },
  {
    id: 'vault-4',
    name: 'Cross-Chain Snowbridge Liquidity Vault',
    depositToken: 'wDOT',
    tokenSymbol: 'wDOT',
    apy: 12.8,
    baseApy: 9.4,
    boostApy: 3.4,
    tvl: '350,000 wDOT',
    strategies: ['Polkadot XCM Teleport Fees', 'Ethereum Snowbridge Relayer Incentives', 'DEX Arb Routing'],
    riskLevel: 'Moderate',
    userDeposited: 45,
    pendingRewards: 0.94,
    autoCompoundFrequency: 'Daily',
  },
];

export default function YieldPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [vaults, setVaults] = useState<YieldVault[]>(INITIAL_VAULTS);
  const [selectedVault, setSelectedVault] = useState<YieldVault | null>(null);
  const [modalAction, setModalAction] = useState<'deposit' | 'withdraw' | null>(null);
  const [amountInput, setAmountInput] = useState('500');
  const [isProcessing, setIsProcessing] = useState(false);

  // Yield Calculator state
  const [calcPrincipal, setCalcPrincipal] = useState('10000');
  const [calcDurationMonths, setCalcDurationMonths] = useState(12);

  // Totals
  const totalDallaDeposited = vaults
    .filter((v) => v.depositToken === 'DALLA')
    .reduce((sum, v) => sum + v.userDeposited, 0);

  const totalBbzdDeposited = vaults
    .filter((v) => v.depositToken === 'bBZD')
    .reduce((sum, v) => sum + v.userDeposited, 0);

  const totalPendingRewardsDalla = vaults
    .filter((v) => v.depositToken === 'DALLA')
    .reduce((sum, v) => sum + v.pendingRewards, 0);

  const handleDepositOrWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVault) return;

    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (modalAction === 'deposit') {
        setVaults((prev) =>
          prev.map((v) =>
            v.id === selectedVault.id ? { ...v, userDeposited: v.userDeposited + val } : v
          )
        );
        addNotification({
          type: 'success',
          message: `Successfully routed and deposited ${val} ${selectedVault.depositToken} into ${selectedVault.name}!`,
        });
      } else {
        setVaults((prev) =>
          prev.map((v) =>
            v.id === selectedVault.id ? { ...v, userDeposited: Math.max(0, v.userDeposited - val) } : v
          )
        );
        addNotification({
          type: 'success',
          message: `Successfully withdrawn ${val} ${selectedVault.depositToken} from ${selectedVault.name}!`,
        });
      }
      setModalAction(null);
    }, 1200);
  };

  const handleHarvestAll = () => {
    if (totalPendingRewardsDalla <= 0) return;

    setVaults((prev) =>
      prev.map((v) => ({
        ...v,
        pendingRewards: 0,
      }))
    );

    addNotification({
      type: 'success',
      message: `Auto-harvested and compounded ${totalPendingRewardsDalla.toFixed(2)} DALLA directly back into vaults!`,
    });
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to access DeFi Yield Aggregators & Auto-Compounding Vaults." fullScreen />;
  }

  // Calculated Projector Returns
  const projectedReturn =
    parseFloat(calcPrincipal || '0') *
    Math.pow(1 + 0.184 / 12, calcDurationMonths) -
    parseFloat(calcPrincipal || '0');

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 z-10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors">
                <ArrowLeft size={24} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <ChartLineUp size={24} className="text-cyan-400" />
                DeFi Yield Aggregator & Compounder
              </h1>
              <p className="text-xs text-slate-400">
                1-Deposit Optimal APY • Multi-Strategy Vaults • Automated Gasless Compounding
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Sparkle size={16} weight="bold" />
              Auto-Compound Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Dashboard Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-900 border border-cyan-500/20 rounded-3xl p-5 shadow-xl space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Total Vault Deposits</span>
              <Coins size={20} className="text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {totalDallaDeposited.toLocaleString()} <span className="text-xs font-mono text-cyan-400">Ɗ</span> /{' '}
              {totalBbzdDeposited.toLocaleString()} <span className="text-xs font-mono text-emerald-400">BZ$</span>
            </div>
            <p className="text-[11px] text-slate-400">Optimally routed across 4 automated strategies</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-3xl p-5 shadow-xl space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Pending Auto-Compound Yield</span>
              <Coins size={20} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              +{totalPendingRewardsDalla.toFixed(2)} <span className="text-xs font-mono">Ɗ</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[10px] text-slate-400">Auto-reinvests every 6h</span>
              <button
                onClick={handleHarvestAll}
                disabled={totalPendingRewardsDalla <= 0}
                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40"
              >
                Harvest Now
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 via-slate-900 to-slate-900 border border-purple-500/20 rounded-3xl p-5 shadow-xl space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Strategy Rebalance Engine</span>
              <ArrowsClockwise size={20} className="text-purple-400" />
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 pt-1">
              <CheckCircle size={18} className="text-purple-400" weight="fill" />
              Dynamic Optimal Routing
            </div>
            <p className="text-[11px] text-slate-400">
              Auto-rebalances capital to maximize net APY after gas considerations.
            </p>
          </div>
        </div>

        {/* Vault Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {vaults.map((vault) => (
            <div
              key={vault.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 shadow-xl space-y-4 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                      {vault.depositToken} Vault
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{vault.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Net APY</span>
                    <span className="text-emerald-400 font-bold text-lg">{vault.apy}%</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Yield + PoUW Boost:</span>
                    <span className="text-white font-bold">
                      {vault.baseApy}% + <span className="text-cyan-300">+{vault.boostApy}% Boost</span>
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Value Locked (TVL):</span>
                    <span className="text-white font-bold">{vault.tvl}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Compounding Cadence:</span>
                    <span className="text-slate-300 font-bold">{vault.autoCompoundFrequency}</span>
                  </div>
                </div>

                {/* Strategies List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Capital Strategies:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {vault.strategies.map((strat, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-300"
                      >
                        ✓ {strat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* User Holding */}
                {vault.userDeposited > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex justify-between items-center text-xs">
                    <span className="text-emerald-400 font-semibold">Your Balance:</span>
                    <span className="text-white font-bold">
                      {vault.userDeposited.toLocaleString()} {vault.depositToken} (+{vault.pendingRewards.toFixed(2)}{' '}
                      yield)
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    setSelectedVault(vault);
                    setModalAction('deposit');
                  }}
                  className="py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} weight="bold" />
                  Deposit
                </button>
                <button
                  onClick={() => {
                    setSelectedVault(vault);
                    setModalAction('withdraw');
                  }}
                  disabled={vault.userDeposited <= 0}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-40"
                >
                  Withdraw
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Yield Compound Simulator */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ChartLineUp size={22} className="text-emerald-400" />
              Interactive Multi-Strategy Yield Projector
            </h3>
            <p className="text-slate-400 mt-1">
              Estimate compounding interest across BelizeChain's high-efficiency automated vaults.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 uppercase font-semibold mb-1 block">Deposit Amount (DALLA)</label>
              <input
                type="number"
                value={calcPrincipal}
                onChange={(e) => setCalcPrincipal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 uppercase font-semibold mb-1 block">Compounding Duration</label>
              <select
                value={calcDurationMonths}
                onChange={(e) => setCalcDurationMonths(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold focus:border-cyan-400 focus:outline-none"
              >
                <option value={1}>1 Month (Short-term)</option>
                <option value={6}>6 Months (Mid-term)</option>
                <option value={12}>1 Year (Standard APY)</option>
                <option value={36}>3 Years (Max Compound)</option>
              </select>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-center space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Estimated Net Return:</span>
              <span className="text-lg font-bold text-emerald-400">
                +{projectedReturn.toLocaleString('en-US', { maximumFractionDigits: 2 })} Ɗ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit / Withdraw Modal */}
      {modalAction && selectedVault && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-xs">
            <button
              onClick={() => setModalAction(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Coins size={22} weight="fill" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white capitalize">
                  {modalAction} {selectedVault.depositToken}
                </h3>
                <p className="text-slate-400 text-[11px]">{selectedVault.name}</p>
              </div>
            </div>

            <form onSubmit={handleDepositOrWithdraw} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">
                  Amount to {modalAction} ({selectedVault.depositToken})
                </label>
                <input
                  type="number"
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Vault APY:</span>
                  <span className="text-emerald-400 font-bold">{selectedVault.apy}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Auto-Compound:</span>
                  <span className="text-white font-bold">{selectedVault.autoCompoundFrequency}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkle size={16} weight="bold" />
                {isProcessing ? 'Processing Extrinsic...' : `Confirm ${modalAction}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
