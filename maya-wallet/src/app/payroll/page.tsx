'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import * as payrollService from '@/services/pallets/payroll';
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
  ArrowLeft
} from 'phosphor-react';

export default function PayrollPage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();
  
  const [mode, setMode] = useState<'employee' | 'employer'>('employee');
  const [payrollRecord, setPayrollRecord] = useState<payrollService.PayrollRecord | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<payrollService.SalaryPayment[]>([]);
  const [stats, setStats] = useState<payrollService.PayrollStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeData, setEmployeeData] = useState({ salary: '0 DALLA', employer: 'N/A', nextPayment: 'N/A', totalEarned: '0 DALLA' });
  const [employees, setEmployees] = useState<any[]>([]);

  // Fetch payroll data from blockchain
  useEffect(() => {
    async function fetchData() {
      if (!selectedAccount) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const [recordData, paymentsData, statsData] = await Promise.all([
          payrollService.getPayrollRecord(selectedAccount.address),
          payrollService.getSalaryPayments(selectedAccount.address, 12),
          payrollService.getPayrollStats(selectedAccount.address)
        ]);
        
        setPayrollRecord(recordData);
        setPaymentHistory(paymentsData);
        setStats(statsData);
      } catch (err: any) {
        console.error('Failed to fetch payroll data:', err);
        setError(err.message || 'Unable to load payroll data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedAccount]);

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner message="Loading payroll data from blockchain..." fullScreen />;
  }

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your wallet to view your payroll information" fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Payroll</h1>
              <p className="text-xs text-gray-400">Automated Salary Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Briefcase size={32} className="text-emerald-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        <div className="flex space-x-2 bg-gray-800 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setMode('employee')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              mode === 'employee'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Employee View
          </button>
          <button
            onClick={() => setMode('employer')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              mode === 'employer'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Employer View
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {mode === 'employee' ? (
          <>
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <p className="text-sm text-gray-400 mb-1">Monthly Salary</p>
              <p className="text-3xl font-bold text-white">{employeeData.salary}</p>
              <p className="text-xs text-gray-400 mt-2">Employer: {employeeData.employer}</p>
            </GlassCard>

            <div className="grid grid-cols-2 gap-3">
              <GlassCard variant="dark" blur="sm" className="p-4">
                <CalendarBlank size={24} className="text-blue-600 mb-2" weight="fill" />
                <p className="text-xs text-gray-400">Next Payment</p>
                <p className="text-lg font-bold text-white">{employeeData.nextPayment}</p>
              </GlassCard>
              <GlassCard variant="dark" blur="sm" className="p-4">
                <TrendUp size={24} className="text-emerald-600 mb-2" weight="fill" />
                <p className="text-xs text-gray-400">Total Earned</p>
                <p className="text-lg font-bold text-white">{employeeData.totalEarned}</p>
              </GlassCard>
            </div>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Payment History</h3>
              <div className="space-y-3">
                {paymentHistory.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{payment.amount}</p>
                      <p className="text-xs text-gray-400">{new Date(payment.paymentDate * 1000).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 mb-1">
                        <CheckCircle size={14} className="text-emerald-600" weight="fill" />
                        <span className="text-xs text-emerald-600 font-semibold">Completed</span>
                      </div>
                      <button className="text-xs text-blue-600 hover:text-blue-700">View TX →</button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </>
        ) : (
          <>
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Employees</p>
                  <p className="text-3xl font-bold text-white">{employees.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Monthly Payroll</p>
                  <p className="text-3xl font-bold text-emerald-600">13,500 bBZD</p>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg">
                <Plus size={20} weight="fill" />
                <span className="font-semibold">Add Employee</span>
              </button>
              <button className="flex items-center justify-center space-x-2 p-4 bg-gray-800 rounded-xl shadow-sm">
                <CurrencyDollar size={20} weight="fill" className="text-gray-400" />
                <span className="font-semibold text-white">Pay All</span>
              </button>
            </div>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Employee List</h3>
              <div className="space-y-3">
                {employees.map((employee, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{employee.name}</h4>
                      <span className="px-2 py-0.5 bg-emerald-500/100/20 text-emerald-400 text-xs rounded-full font-semibold">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-400">Salary</p>
                        <p className="font-semibold text-white">{employee.salary}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Last Paid</p>
                        <p className="font-semibold text-white">{employee.lastPaid}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Paid</p>
                        <p className="font-semibold text-white">{employee.total}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}
