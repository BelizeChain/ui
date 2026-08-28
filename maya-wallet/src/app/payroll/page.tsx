'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  TrendUp,
  ArrowLeft,
  Coins,
  ShieldCheck,
  Receipt,
  Lightning,
  FileText,
  Bank,
  Check,
  ShareNetwork,
  ArrowsClockwise,
  Fingerprint,
  DownloadSimple,
  X,
  Buildings,
  UserPlus,
} from 'phosphor-react';

interface EmployeeRoster {
  id: string;
  name: string;
  department: string;
  role: string;
  walletAddress: string;
  grossSalaryBBZD: number;
  ssbEmployee: number;
  ssbEmployer: number;
  incomeTaxPAYE: number;
  netPayBBZD: number;
  status: 'Pending' | 'Paid' | 'Processing';
}

interface PayslipRecord {
  id: string;
  period: string;
  gross: number;
  ssbEmployee: number;
  ssbEmployer: number;
  incomeTax: number;
  net: number;
  paymentDate: string;
  employer: string;
  status: string;
  txHash: string;
}

const INITIAL_ROSTER: EmployeeRoster[] = [
  {
    id: 'EMP-001',
    name: 'Wicked Sovereign Citizen',
    department: 'Ministry of Digital Transformation',
    role: 'Principal Core Engineer',
    walletAddress: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
    grossSalaryBBZD: 4500,
    ssbEmployee: 180,
    ssbEmployer: 225,
    incomeTaxPAYE: 350,
    netPayBBZD: 3970,
    status: 'Paid',
  },
  {
    id: 'EMP-002',
    name: 'Elena Castillo',
    department: 'Ministry of Natural Resources',
    role: 'GIS Cadastre Registrar',
    walletAddress: '5DTestAddressElenaCastillo998124',
    grossSalaryBBZD: 3800,
    ssbEmployee: 152,
    ssbEmployer: 190,
    incomeTaxPAYE: 280,
    netPayBBZD: 3368,
    status: 'Pending',
  },
  {
    id: 'EMP-003',
    name: 'Mateo Bradley',
    department: 'Belize Port Authority',
    role: 'Maritime Logistics Officer',
    walletAddress: '5GR98124MateoBradleyPortAuth001',
    grossSalaryBBZD: 3200,
    ssbEmployee: 128,
    ssbEmployer: 160,
    incomeTaxPAYE: 210,
    netPayBBZD: 2862,
    status: 'Pending',
  },
  {
    id: 'EMP-004',
    name: 'Dr. Sofia Novelo',
    department: 'Karl Heusner Memorial Hospital',
    role: 'Chief Medical Officer',
    walletAddress: '5FLS98124DrSofiaNoveloKHMH001',
    grossSalaryBBZD: 5200,
    ssbEmployee: 208,
    ssbEmployer: 260,
    incomeTaxPAYE: 460,
    netPayBBZD: 4532,
    status: 'Pending',
  },
];

export default function PayrollPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'my-payslips' | 'ssb-pension' | 'advance' | 'employer-batch'>('my-payslips');
  const [advanceAmount, setAdvanceAmount] = useState('500.00');
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);

  // Employer Roster State
  const [roster, setRoster] = useState<EmployeeRoster[]>(INITIAL_ROSTER);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  // New Employee Modal / Form
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('Ministry of Digital Transformation');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpWallet, setNewEmpWallet] = useState('');
  const [newEmpSalary, setNewEmpSalary] = useState('3500');

  // Employee Payslips
  const [payslips] = useState<PayslipRecord[]>([
    {
      id: 'PAY-BZ-2026-08',
      period: 'August 1 - August 31, 2026',
      gross: 4500,
      ssbEmployee: 180,
      ssbEmployer: 225,
      incomeTax: 350,
      net: 3970,
      paymentDate: 'Aug 25, 2026',
      employer: 'Government of Belize (Ministry of Digital Transformation)',
      status: 'Paid On-Chain',
      txHash: '0x8f14c0a9b891823f98a7291a...',
    },
    {
      id: 'PAY-BZ-2026-07',
      period: 'July 1 - July 31, 2026',
      gross: 4500,
      ssbEmployee: 180,
      ssbEmployer: 225,
      incomeTax: 350,
      net: 3970,
      paymentDate: 'Jul 25, 2026',
      employer: 'Government of Belize (Ministry of Digital Transformation)',
      status: 'Paid On-Chain',
      txHash: '0x3a91b2c4e5f6789012345678...',
    },
  ]);

  // Handle Salary Advance
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

  // Handle Batch Payroll Execution
  const handleExecuteBatchPayroll = () => {
    setIsProcessingBatch(true);
    setTimeout(() => {
      setRoster((prev) => prev.map((emp) => ({ ...emp, status: 'Paid' })));
      setIsProcessingBatch(false);

      const totalNet = roster.reduce((acc, emp) => acc + emp.netPayBBZD, 0);
      const totalSsb = roster.reduce((acc, emp) => acc + emp.ssbEmployee + emp.ssbEmployer, 0);
      const totalTax = roster.reduce((acc, emp) => acc + emp.incomeTaxPAYE, 0);

      addNotification({
        type: 'success',
        message: `Batch Payroll Executed! Disbursed BZ$ ${totalNet.toLocaleString()} net to ${roster.length} employees, BZ$ ${totalSsb.toLocaleString()} to SSB, and BZ$ ${totalTax.toLocaleString()} to Belize Tax Service.`,
      });
    }, 1600);
  };

  // Handle Add Employee
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const gross = parseFloat(newEmpSalary || '0');
    const ssbEmp = gross * 0.04;
    const ssbEmpr = gross * 0.05;
    const tax = gross > 2500 ? (gross - 2500) * 0.15 : 0;
    const net = gross - ssbEmp - tax;

    const newEmp: EmployeeRoster = {
      id: `EMP-00${roster.length + 1}`,
      name: newEmpName,
      department: newEmpDept,
      role: newEmpRole,
      walletAddress: newEmpWallet || '5DTestGeneratedWalletAddress001',
      grossSalaryBBZD: gross,
      ssbEmployee: ssbEmp,
      ssbEmployer: ssbEmpr,
      incomeTaxPAYE: tax,
      netPayBBZD: net,
      status: 'Pending',
    };

    setRoster([...roster, newEmp]);
    setShowAddEmployee(false);
    setNewEmpName('');
    setNewEmpRole('');
    setNewEmpWallet('');
    addNotification({
      type: 'success',
      message: `Enrolled ${newEmpName} into automated BelizeChain payroll roster!`,
    });
  };

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to view automated payroll slips, SSB pension contributions, and enterprise disbursements."
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
                <Briefcase size={22} className="text-emerald-400" />
                Automated Civic & Enterprise Payroll Hub
              </h1>
              <p className="text-xs text-slate-400">
                Social Security Board (SSB) • Tax Withholding • 0% Advances • Batch Disbursal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold font-mono flex items-center gap-1.5">
              <ShieldCheck size={14} weight="fill" />
              SSB Statutory Connected
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Monthly Base Salary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Monthly Base Pay</span>
              <Briefcase size={18} className="text-emerald-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-white">4,500.00 bBZD</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Disbursal Cycle:</span>
              <span className="text-emerald-300 font-bold">25th of Every Month</span>
            </div>
          </div>

          {/* Card 2: Total SSB Pension */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total SSB Vested</span>
              <ShieldCheck size={18} className="text-purple-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-purple-300">3,240.00 bBZD</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Pension Status:</span>
              <span className="text-emerald-400 font-bold">100% Vested (48 Months)</span>
            </div>
          </div>

          {/* Card 3: Year-To-Date Net Pay */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">YTD Net Disbursed</span>
              <Coins size={18} className="text-cyan-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-cyan-300">31,760.00 bBZD</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Processed Cycles:</span>
              <span className="text-slate-300 font-bold">8 Consecutive Months</span>
            </div>
          </div>

          {/* Card 4: 0% Salary Advance */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Earned Wage Advance</span>
              <Lightning size={18} className="text-amber-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-amber-300">1,500.00 bBZD</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Interest Rate:</span>
              <span className="text-emerald-400 font-bold">0.0% APR (Statutory)</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-2xl p-1 overflow-x-auto text-xs font-bold gap-1">
          {(['my-payslips', 'ssb-pension', 'advance', 'employer-batch'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 rounded-xl capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'my-payslips'
                ? 'My Salary Slips'
                : tab === 'ssb-pension'
                ? 'SSB Pension Ledger'
                : tab === 'advance'
                ? '0% Salary Advance'
                : 'Enterprise Batch Payroll'}
            </button>
          ))}
        </div>

        {/* Tab 1: My Salary Slips */}
        {activeTab === 'my-payslips' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt size={22} className="text-emerald-400" />
                Verified On-Chain Salary Slips
              </h3>
              <p className="text-slate-400 mt-1">
                Cryptographically signed verifiable salary credentials issued on BelizeChain consensus.
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
                      <span className="text-slate-400 text-[11px]">
                        {p.period} • Paid: {p.paymentDate}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold text-[10px]">
                      {p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-400 text-[11px] font-mono">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Gross Salary</span>
                      <span className="text-white font-bold text-xs">BZ$ {p.gross.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">SSB (Employee 4%)</span>
                      <span className="text-purple-300 font-bold text-xs">BZ$ {p.ssbEmployee.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Income Tax (PAYE)</span>
                      <span className="text-amber-300 font-bold text-xs">BZ$ {p.incomeTax.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Net Disbursed</span>
                      <span className="text-emerald-400 font-bold text-xs">BZ$ {p.net.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Payslip_${p.id}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        addNotification({ type: 'success', message: `Downloaded Payslip JSON for ${p.id}!` });
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 border border-slate-700/50"
                    >
                      <DownloadSimple size={14} /> Download Payslip (.json)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: SSB Pension Ledger */}
        {activeTab === 'ssb-pension' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck size={22} className="text-purple-400" />
                Belize Social Security Board (SSB) Pension Ledger
              </h3>
              <p className="text-slate-400 mt-1">
                Transparent 9% statutory contribution splitting between employer (5%) and employee (4%) with automatic state pension allocation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-white text-sm block">Employee Contribution (4%)</span>
                <p className="text-slate-400 text-[11px]">
                  Automatically withheld from monthly gross salary and directly remitted to SSB smart contracts.
                </p>
                <span className="font-bold text-purple-300 text-lg font-mono block">180.00 bBZD / month</span>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-white text-sm block">Employer Match Contribution (5%)</span>
                <p className="text-slate-400 text-[11px]">
                  Statutory employer match credited directly into your national retirement and disability safety fund.
                </p>
                <span className="font-bold text-emerald-400 text-lg font-mono block">225.00 bBZD / month</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: 0% Salary Advance */}
        {activeTab === 'advance' && (
          <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lightning size={22} className="text-amber-400" />
                0% Interest Instant Salary Advance
              </h3>
              <p className="text-slate-400 mt-1">
                Access your earned wages before the 25th of the month. Disbursed instantly to your Maya Wallet and settled on the next pay cycle.
              </p>
            </div>

            <form onSubmit={handleRequestAdvance} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">Advance Amount (bBZD)</label>
                <input
                  type="number"
                  required
                  placeholder="500.00"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-base font-bold text-white font-mono focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Maximum eligible advance: 1,500.00 bBZD</span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAdvance || !advanceAmount}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <Lightning size={16} weight="bold" />
                {isSubmittingAdvance ? 'Disbursing Advance...' : 'Request Instant Advance'}
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Enterprise Batch Payroll Runner */}
        {activeTab === 'employer-batch' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users size={22} className="text-emerald-400" />
                  Enterprise & Civic Batch Payroll Runner
                </h3>
                <p className="text-slate-400 mt-0.5">
                  1-Click batch salary, SSB pension, and PAYE tax disbursal across your entire organization.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddEmployee(true)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-slate-700/50"
                >
                  <UserPlus size={16} /> Enroll Employee
                </button>
                <button
                  onClick={handleExecuteBatchPayroll}
                  disabled={isProcessingBatch}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Coins size={16} weight="bold" />
                  {isProcessingBatch ? 'Disbursing...' : 'Disburse Batch Payroll'}
                </button>
              </div>
            </div>

            {/* Roster Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 text-[10px] uppercase">
                    <th className="pb-2">ID / Employee</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Gross (bBZD)</th>
                    <th className="pb-2">SSB (9%)</th>
                    <th className="pb-2">Tax (PAYE)</th>
                    <th className="pb-2">Net Pay</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {roster.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/30">
                      <td className="py-3">
                        <span className="font-bold text-white block">{emp.name}</span>
                        <span className="text-[10px] text-slate-500">{emp.id} • {emp.role}</span>
                      </td>
                      <td className="py-3 text-slate-400">{emp.department}</td>
                      <td className="py-3 text-white font-bold">BZ$ {emp.grossSalaryBBZD.toLocaleString()}</td>
                      <td className="py-3 text-purple-300">BZ$ {(emp.ssbEmployee + emp.ssbEmployer).toFixed(2)}</td>
                      <td className="py-3 text-amber-300">BZ$ {emp.incomeTaxPAYE.toFixed(2)}</td>
                      <td className="py-3 text-emerald-400 font-bold">BZ$ {emp.netPayBBZD.toLocaleString()}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.status === 'Paid'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Enroll Employee Modal */}
      <AnimatePresence>
        {showAddEmployee && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative text-xs"
            >
              <button
                onClick={() => setShowAddEmployee(false)}
                className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-2 border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-white tracking-wide">Enroll New Employee</h3>
                <p className="text-xs text-slate-400">Add team member to automated smart contract payroll roster</p>
              </div>

              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block text-[10px]">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Carlos Marin"
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 uppercase font-semibold mb-1 block text-[10px]">Department</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Finance, IT, Ops"
                      value={newEmpDept}
                      onChange={(e) => setNewEmpDept(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 uppercase font-semibold mb-1 block text-[10px]">Role / Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Software Engineer"
                      value={newEmpRole}
                      onChange={(e) => setNewEmpRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block text-[10px]">
                    Maya Wallet Address or BNS (.bz)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. carlos.bz or 5DTest..."
                    value={newEmpWallet}
                    onChange={(e) => setNewEmpWallet(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block text-[10px]">Monthly Gross Salary (bBZD)</label>
                  <input
                    type="number"
                    required
                    placeholder="3500"
                    value={newEmpSalary}
                    onChange={(e) => setNewEmpSalary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <UserPlus size={16} weight="bold" /> Enroll & Activate Payroll
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
