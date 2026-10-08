'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  getPayrollRecord,
  getSalaryPayments,
  getEmployeeRoster,
  getEmployerPayments,
  type EmployeeRosterEntry,
  type PayrollRecord,
  type SalaryPayment,
} from '@/services/pallets/payroll';
import {
  Briefcase,
  Users,
  ArrowLeft,
  Coins,
  ShieldCheck,
  Receipt,
  Lightning,
  DownloadSimple,
} from 'phosphor-react';

export default function PayrollPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'my-payslips' | 'deductions' | 'advance' | 'employer-roster'>('my-payslips');
  const [advanceAmount, setAdvanceAmount] = useState('500.00');
  const [isSubmittingAdvance] = useState(false);

  // Employee side
  const [employmentRecord, setEmploymentRecord] = useState<PayrollRecord | null>(null);
  const [payslips, setPayslips] = useState<SalaryPayment[]>([]);

  // Employer side
  const [roster, setRoster] = useState<EmployeeRosterEntry[]>([]);
  const [employerPayments, setEmployerPayments] = useState<SalaryPayment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Hoisted so the callback's deps match the compiler-inferred dependency
  // (react-hooks/preserve-manual-memoization).
  const address = selectedAccount?.address;

  const loadPayroll = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError('');
    try {
      const [record, payments, employerRoster, madePayments] = await Promise.all([
        getPayrollRecord(address),
        getSalaryPayments(address, 24),
        getEmployeeRoster(address),
        getEmployerPayments(address, 50),
      ]);
      setEmploymentRecord(record);
      setPayslips(payments);
      setRoster(employerRoster);
      setEmployerPayments(madePayments);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPayslips([]);
      setRoster([]);
      setEmployerPayments([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    // Deferred so the initial load doesn't set state during the effect body
    // (react-hooks/set-state-in-effect).
    Promise.resolve().then(loadPayroll);
  }, [loadPayroll]);

  // Advances and batch payroll are EMPLOYER-side actions: there is no
  // employee-initiated advance extrinsic, and the pallet's `batchPayment` is
  // employer-signed. Both buttons gate honestly instead of faking a result.
  const handleRequestAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    addNotification({
      type: 'info',
      message: 'Salary advances are employer-issued (payroll.issueBonus on chain). Ask your employer to issue the advance — there is no employee-initiated extrinsic.',
    });
    setAdvanceAmount('');
  };

  const handleExecuteBatchPayroll = () => {
    addNotification({
      type: 'info',
      message: 'Batch disbursement is employer-signed (payroll.batchPayment) and has no portal in this wallet yet. The roster below is read-only.',
    });
  };

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to view on-chain salary records and the roster you pay."
        fullScreen
      />
    );
  }

  // Everything below is read from payroll.employees / payroll.payrollRecords.
  const monthlyGross = employmentRecord ? parseFloat(employmentRecord.salary) : null;
  const totalPaid = employmentRecord ? parseFloat(employmentRecord.totalPaid) : null;
  const totalWithheld = employmentRecord ? parseFloat(employmentRecord.totalDeductions) : null;
  const ytdNet = payslips
    .filter((p) => p.timestamp && new Date(p.timestamp).getFullYear() === new Date().getFullYear())
    .reduce((sum, p) => sum + parseFloat(p.netAmount), 0);

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
                On-Chain Payroll
              </h1>
              <p className="text-xs text-slate-400">
                pallet payroll • salary records, deductions and employer roster
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold font-mono flex items-center gap-1.5">
              <ShieldCheck size={14} weight="fill" />
              {roster.length} Employees Paid
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-center text-xs">
            {error}
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Base Salary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Gross Salary / Period</span>
              <Briefcase size={18} className="text-emerald-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-white">
                {monthlyGross != null ? monthlyGross.toFixed(2) : '—'}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Worker type:</span>
              <span className="text-emerald-300 font-bold">{employmentRecord?.workerType ?? '—'}</span>
            </div>
          </div>

          {/* Card 2: Total Paid */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total Gross Paid</span>
              <ShieldCheck size={18} className="text-purple-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-purple-300">
                {totalPaid != null ? totalPaid.toFixed(2) : '—'}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Status:</span>
              <span className="text-emerald-400 font-bold">{employmentRecord?.active ? 'Active' : '—'}</span>
            </div>
          </div>

          {/* Card 3: Withheld */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total Deductions Withheld</span>
              <Coins size={18} className="text-cyan-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-cyan-300">
                {totalWithheld != null ? totalWithheld.toFixed(2) : '—'}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Last paid at block:</span>
              <span className="text-slate-300 font-bold">{employmentRecord?.lastPaid ?? '—'}</span>
            </div>
          </div>

          {/* Card 4: YTD Net */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">YTD Net Received</span>
              <Lightning size={18} className="text-amber-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-amber-300">{ytdNet.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Payments on record:</span>
              <span className="text-emerald-400 font-bold">{payslips.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-2xl p-1 overflow-x-auto text-xs font-bold gap-1">
          {(['my-payslips', 'deductions', 'advance', 'employer-roster'] as const).map((tab) => (
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
                ? 'My Salary Records'
                : tab === 'deductions'
                ? 'Deductions'
                : tab === 'advance'
                ? 'Salary Advance'
                : 'Roster I Pay'}
            </button>
          ))}
        </div>

        {/* Tab 1: My Salary Records */}
        {activeTab === 'my-payslips' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt size={22} className="text-emerald-400" />
                On-Chain Salary Records
              </h3>
              <p className="text-slate-400 mt-1">
                Read from payroll.payrollRecords. Each record carries a blake2_256 payment
                commitment over gross, deductions, net, employer, employee and block.
              </p>
            </div>

            {loading && (
              <div className="text-center py-8 text-slate-400 text-xs">Loading on-chain payroll records…</div>
            )}
            {!loading && payslips.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No on-chain salary payments recorded for this account yet.
              </div>
            )}
            <div className="space-y-4">
              {payslips.map((p) => (
                <div
                  key={p.paymentId}
                  className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="font-bold text-white text-sm block">{p.employer}</span>
                      <span className="text-slate-400 text-[11px]">
                        {p.date ?? '—'} • block {p.blockNumber} • {p.category}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold text-[10px]">
                      {p.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-400 text-[11px] font-mono">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Gross Amount</span>
                      <span className="text-white font-bold text-xs">{p.currency === 'bBZD' ? 'BZ$' : 'Ɗ'} {p.amount}</span>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Total Deductions</span>
                      <span className="text-purple-300 font-bold text-xs">{p.currency === 'bBZD' ? 'BZ$' : 'Ɗ'} {p.deductions}</span>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Category</span>
                      <span className="text-amber-300 font-bold text-xs">{p.category}</span>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Net Disbursed</span>
                      <span className="text-emerald-400 font-bold text-xs">{p.netAmount}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Payslip_${p.paymentId}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        addNotification({ type: 'success', message: `Downloaded Payslip JSON for ${p.paymentId}!` });
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

        {/* Tab 2: Deductions */}
        {activeTab === 'deductions' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck size={22} className="text-purple-400" />
                Withholdings
              </h3>
              <p className="text-slate-400 mt-1">
                The pallet stores a single aggregated deductions figure per payment. It does not
                split SSB, PAYE or any other statutory component, so no per-tax breakdown can be
                shown.
              </p>
            </div>

            {loading && (
              <div className="text-center py-8 text-slate-400 text-xs">Loading…</div>
            )}
            {!loading && payslips.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No withholding records for this account.
              </div>
            )}
            {!loading && payslips.length > 0 && (
              <>
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-slate-500 block text-[10px] uppercase">
                    Total deducted across {payslips.length} payments
                  </span>
                  <span className="font-bold text-purple-300 text-2xl font-mono block">
                    {payslips.reduce((sum, p) => sum + parseFloat(p.deductions), 0).toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2">
                  {payslips.map((p) => (
                    <div
                      key={p.paymentId}
                      className="flex justify-between font-mono text-[11px] bg-slate-950 p-3.5 rounded-2xl border border-slate-800"
                    >
                      <span className="text-slate-400">
                        {p.date ?? '—'} • {p.employer.slice(0, 14)}…
                      </span>
                      <span className="text-purple-300 font-bold">{p.deductions}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 3: Salary Advance */}
        {activeTab === 'advance' && (
          <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lightning size={22} className="text-amber-400" />
                Salary Advance
              </h3>
              <p className="text-slate-400 mt-1">
                Advances are issued by the employer via payroll.issueBonus. There is no
                employee-initiated advance extrinsic, so this form cannot disburse anything — it
                tells you who to ask instead.
              </p>
            </div>

            <form onSubmit={handleRequestAdvance} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">Requested Amount</label>
                <input
                  type="number"
                  placeholder="500.00"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-base font-bold text-white font-mono focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  No maximum is stored on chain; eligibility is an employer policy.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAdvance || !advanceAmount}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <Lightning size={16} weight="bold" />
                Why Can I Not Request This?
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Roster I Pay */}
        {activeTab === 'employer-roster' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users size={22} className="text-emerald-400" />
                  Employees Paid By This Account
                </h3>
                <p className="text-slate-400 mt-0.5">
                  Read from payroll.employees where the employer key is your address. The pallet
                  stores no name, job title or department label — only a department id.
                </p>
              </div>

              <button
                onClick={handleExecuteBatchPayroll}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-slate-700/50"
              >
                <Coins size={16} weight="bold" />
                How Do I Disburse?
              </button>
            </div>

            {loading && <div className="text-center py-8 text-slate-400 text-xs">Loading roster…</div>}
            {!loading && roster.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                This account pays no employees. Enrollment is an employer action through
                payroll.addEmployee.
              </div>
            )}
            {!loading && roster.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800 text-[10px] uppercase">
                      <th className="pb-2">Employee</th>
                      <th className="pb-2">Dept id</th>
                      <th className="pb-2">Worker type</th>
                      <th className="pb-2">Salary / period</th>
                      <th className="pb-2">Paid to date</th>
                      <th className="pb-2">Withheld to date</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {roster.map((emp) => (
                      <tr key={emp.employee} className="hover:bg-slate-800/30">
                        <td className="py-3 text-slate-200 truncate max-w-[160px]">{emp.employee}</td>
                        <td className="py-3 text-slate-400">{emp.departmentId}</td>
                        <td className="py-3 text-slate-400">{emp.workerType}</td>
                        <td className="py-3 text-white font-bold">{emp.salary}</td>
                        <td className="py-3 text-emerald-400 font-bold">{emp.totalPaid}</td>
                        <td className="py-3 text-purple-300">{emp.totalDeductions}</td>
                        <td className="py-3 text-right">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              emp.active
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {emp.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && employerPayments.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">
                  Recent payments made ({employerPayments.length})
                </span>
                {employerPayments.slice(0, 10).map((p) => (
                  <div
                    key={p.paymentId}
                    className="flex justify-between font-mono text-[11px] bg-slate-950 p-3.5 rounded-2xl border border-slate-800"
                  >
                    <span className="text-slate-400 truncate max-w-[55%]">{p.employee}</span>
                    <span className="text-emerald-400 font-bold">{p.netAmount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
