'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  Briefcase,
  Users,
  CalendarBlank,
  CurrencyDollar,
  CheckCircle,
  Clock,
  Plus,
  Download,
  TrendUp,
  ArrowLeft,
  Coins,
  ShieldCheck,
  Receipt,
  Lightning,
  FileText,
  Bank,
  Check,
} from 'phosphor-react';

export default function PayrollPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'payslips' | 'ssb' | 'advance'>('payslips');
  const [advanceAmount, setAdvanceAmount] = useState('500.00');
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);

  const payslips = [
    {
      id: 'PAY-BZ-2026-08',
      period: 'August 1 - August 31, 2026',
      gross: '4,500.00 bBZD',
      ssbEmployee: '180.00 bBZD (4%)',
      ssbEmployer: '225.00 bBZD (5%)',
      incomeTax: '350.00 bBZD',
      net: '3,970.00 bBZD',
      paymentDate: 'Aug 25, 2026',
      employer: 'Government of Belize (Ministry of Digital Transformation)',
      status: 'Paid On-Chain',
    },
    {
      id: 'PAY-BZ-2026-07',
      period: 'July 1 - July 31, 2026',
      gross: '4,500.00 bBZD',
      ssbEmployee: '180.00 bBZD (4%)',
      ssbEmployer: '225.00 bBZD (5%)',
      incomeTax: '350.00 bBZD',
      net: '3,970.00 bBZD',
      paymentDate: 'Jul 25, 2026',
      employer: 'Government of Belize (Ministry of Digital Transformation)',
      status: 'Paid On-Chain',
    },
  ];

  const handleRequestAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAdvance(true);
    setTimeout(() => {
      setIsSubmittingAdvance(false);
      addNotification({
        type: 'success',
        message: `Salary advance of ${advanceAmount} bBZD approved & disbursed instantly from employer payroll pool!`,
      });
      setAdvanceAmount('');
    }, 1200);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to view automated payroll slips and SSB deductions." fullScreen />;
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
              <h1 className="text-xl font-bold">Automated Payroll & SSB Hub</h1>
              <p className="text-xs text-slate-400">Social Security Board Deductions • Salary Slips • 0% Advances</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck size={16} weight="bold" />
              SSB Verified Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Monthly Base Salary</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">4,500.00</span>
              <span className="text-[10px] text-cyan-300">bBZD</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Disbursed on the 25th</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total SSB Contributed</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400 font-mono">3,240.00</span>
              <span className="text-[10px] text-purple-300">bBZD</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">100% Pension Vested</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Year-To-Date Net Pay</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">31,760.00</span>
              <span className="text-[10px] text-emerald-300">bBZD</span>
            </div>
            <span className="text-[11px] text-slate-400 block">8 Cycles Processed</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Available Salary Advance</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-amber-300 font-mono">1,500.00</span>
              <span className="text-[10px] text-amber-300">bBZD</span>
            </div>
            <span className="text-[11px] text-slate-400 block">0% Interest Advance</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['payslips', 'ssb', 'advance'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'payslips'
                ? 'Salary Slips'
                : tab === 'ssb'
                ? 'SSB Pension Ledger'
                : 'Request Salary Advance'}
            </button>
          ))}
        </div>

        {/* Tab 1: Payslips */}
        {activeTab === 'payslips' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt size={22} className="text-emerald-400" />
                Verified On-Chain Salary Slips
              </h3>
              <p className="text-slate-400 mt-1">
                Download cryptographically signed PDF payslips compliant with Central Bank and SSB standards.
              </p>
            </div>

            <div className="space-y-4">
              {payslips.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="font-bold text-white text-sm block">{p.employer}</span>
                      <span className="text-slate-400 text-[11px]">{p.period} • Paid: {p.paymentDate}</span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-[10px]">
                      {p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-400 text-[11px]">
                    <div>Gross Pay: <b className="text-slate-200 block">{p.gross}</b></div>
                    <div>SSB (Employee 4%): <b className="text-purple-300 block">{p.ssbEmployee}</b></div>
                    <div>Income Tax PAYE: <b className="text-amber-300 block">{p.incomeTax}</b></div>
                    <div>Net Disbursed: <b className="text-emerald-400 block text-sm">{p.net}</b></div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => addNotification({ type: 'success', message: `Downloaded Payslip PDF for ${p.id}!` })}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5"
                    >
                      <Download size={14} />
                      Download Payslip (PDF)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: SSB Pension */}
        {activeTab === 'ssb' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck size={22} className="text-purple-400" />
                Social Security Board (SSB) Contribution Schedule
              </h3>
              <p className="text-slate-400 mt-1">
                Automated 9% statutory contribution splitting between employer (5%) and employee (4%).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-white text-sm block">Employee Contribution (4%)</span>
                <p className="text-slate-400 text-[11px]">Automatically withheld from monthly gross salary and remitted to SSB on-chain.</p>
                <span className="font-bold text-purple-300 text-base font-mono block">180.00 bBZD / mo</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-white text-sm block">Employer Contribution (5%)</span>
                <p className="text-slate-400 text-[11px]">Direct employer statutory match credited towards national retirement and disability fund.</p>
                <span className="font-bold text-emerald-400 text-base font-mono block">225.00 bBZD / mo</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Advance */}
        {activeTab === 'advance' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lightning size={22} className="text-amber-400" />
                0% Interest Instant Salary Advance
              </h3>
              <p className="text-slate-400 mt-1">
                Request an instant advance against your earned monthly wages. Automatically deducted on next pay cycle.
              </p>
            </div>

            <form onSubmit={handleRequestAdvance} className="space-y-4 max-w-md">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Advance Amount (bBZD)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-base font-bold text-white font-mono focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Maximum available: 1,500.00 bBZD</span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAdvance || !advanceAmount}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Lightning size={16} weight="bold" />
                {isSubmittingAdvance ? 'Disbursing Advance...' : 'Request Instant Advance'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
