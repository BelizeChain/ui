'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  Calculator,
  ArrowLeft,
  Coins,
  CurrencyDollar,
  TrendUp,
  Percent,
  Receipt,
  Sparkle,
  ChartLineUp,
} from 'phosphor-react';

export default function CalculatorPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'fx-swap' | 'staking-apy' | 'ssb-tax'>('fx-swap');

  // FX state
  const [fxAmount, setFxAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState<'bBZD' | 'DALLA' | 'USD'>('bBZD');

  // Staking state
  const [stakeAmount, setStakeAmount] = useState('5000');
  const [stakeDurationMonths, setStakeDurationMonths] = useState(12);
  const [hasPouwBoost, setHasPouwBoost] = useState(true);

  // SSB Tax state
  const [grossWage, setGrossWage] = useState('2500');

  // Calculations
  const calculatedDalla = fromCurrency === 'bBZD' ? parseFloat(fxAmount || '0') * 2 : fromCurrency === 'USD' ? parseFloat(fxAmount || '0') * 4 : parseFloat(fxAmount || '0');
  const calculatedBBZD = fromCurrency === 'DALLA' ? parseFloat(fxAmount || '0') * 0.5 : fromCurrency === 'USD' ? parseFloat(fxAmount || '0') * 2 : parseFloat(fxAmount || '0');

  const baseApr = 14.8;
  const effectiveApr = hasPouwBoost ? baseApr + 3.5 : baseApr;
  const estimatedYieldDalla = (parseFloat(stakeAmount || '0') * (effectiveApr / 100) * (stakeDurationMonths / 12)).toFixed(2);

  const grossMonthly = parseFloat(grossWage || '0');
  const ssbEmployee = (grossMonthly * 0.04).toFixed(2);
  const ssbEmployer = (grossMonthly * 0.05).toFixed(2);
  const ssbTotal = (grossMonthly * 0.09).toFixed(2);
  const taxableIncome = Math.max(grossMonthly - 1666.67, 0); // BZ$ 20,000 annual exemption
  const payeTax = (taxableIncome * 0.25).toFixed(2);
  const netTakeHome = (grossMonthly - parseFloat(ssbEmployee) - parseFloat(payeTax)).toFixed(2);

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to use BelizeChain statutory financial calculators." fullScreen />;
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
              <h1 className="text-xl font-bold">Financial & Staking Calculators</h1>
              <p className="text-xs text-slate-400">FX Converter • NPoS Staking Compounding • SSB 9% & PAYE Tax</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Calculator size={16} weight="bold" />
              Financial Toolkit
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['fx-swap', 'staking-apy', 'ssb-tax'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'fx-swap'
                ? 'FX Currency Converter'
                : tab === 'staking-apy'
                ? 'Staking APY Simulator'
                : 'SSB 9% & PAYE Tax'}
            </button>
          ))}
        </div>

        {/* Tab 1: FX Currency Converter */}
        {activeTab === 'fx-swap' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs max-w-lg mx-auto">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CurrencyDollar size={22} className="text-cyan-400" />
                Dual-Currency Real-Time Converter
              </h3>
              <p className="text-slate-400 mt-1">Pegged rate: 1.00 USD = 2.00 bBZD • 1.00 bBZD = 2.00 DALLA.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">You Enter</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={fxAmount}
                    onChange={(e) => setFxAmount(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-bold text-cyan-300 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="bBZD">bBZD</option>
                    <option value="DALLA">DALLA (Ɗ)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Equivalent in bBZD:</span>
                  <span className="text-cyan-300 font-bold">BZ$ {calculatedBBZD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Equivalent in DALLA:</span>
                  <span className="text-emerald-400 font-bold">{calculatedDalla.toFixed(2)} Ɗ</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Equivalent in USD:</span>
                  <span className="text-white font-bold">${(calculatedBBZD / 2).toFixed(2)} USD</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Staking APY Simulator */}
        {activeTab === 'staking-apy' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs max-w-lg mx-auto">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendUp size={22} className="text-emerald-400" />
                NPoS Staking Compounding Yield Simulator
              </h3>
              <p className="text-slate-400 mt-1">Simulate staking returns across BABE slot eras.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Bonded Stake (DALLA Ɗ)</label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Duration ({stakeDurationMonths} Months)</label>
                <input
                  type="range"
                  min={1}
                  max={36}
                  value={stakeDurationMonths}
                  onChange={(e) => setStakeDurationMonths(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div
                onClick={() => setHasPouwBoost(!hasPouwBoost)}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer"
              >
                <span className="text-slate-300">PoUW AI / Quantum / Solar Booster (+3.5% APR)</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${hasPouwBoost ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  {hasPouwBoost ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/40 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Effective Annual APR:</span>
                  <span className="text-emerald-400 font-bold">{effectiveApr.toFixed(1)}% APR</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2 text-sm">
                  <span className="text-white font-bold">Estimated Rewards:</span>
                  <span className="text-emerald-400 font-bold">+{estimatedYieldDalla} Ɗ</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: SSB & PAYE Tax */}
        {activeTab === 'ssb-tax' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs max-w-lg mx-auto">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt size={22} className="text-purple-400" />
                SSB Statutory 9% & PAYE Income Tax Estimator
              </h3>
              <p className="text-slate-400 mt-1">Belizean statutory withholding under Social Security Act.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Monthly Gross Salary (bBZD)</label>
                <input
                  type="number"
                  value={grossWage}
                  onChange={(e) => setGrossWage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white font-mono focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>SSB Employee Deduction (4%):</span>
                  <span className="text-amber-300 font-bold">- BZ$ {ssbEmployee}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>SSB Employer Contribution (5%):</span>
                  <span className="text-slate-300 font-bold">BZ$ {ssbEmployer}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total SSB Remittance (9%):</span>
                  <span className="text-cyan-300 font-bold">BZ$ {ssbTotal}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>PAYE Income Tax (25% on &gt; $1,666):</span>
                  <span className="text-rose-400 font-bold">- BZ$ {payeTax}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2 text-sm">
                  <span className="text-white font-bold">Net Take-Home Pay:</span>
                  <span className="text-emerald-400 font-bold">BZ$ {netTakeHome}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
