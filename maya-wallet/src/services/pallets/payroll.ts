/**
 * BelizeChain Payroll Pallet Integration
 * Handles government and private payroll management, salary slips, deductions
 */

import { ApiPromise } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';

export interface PayrollRecord {
  recordId: string;
  employee: string;
  employer: string;
  employerName: string;
  employmentType: 'Government' | 'Private' | 'Contractor';
  position?: string;
  department?: string;
  startDate: number;
  endDate?: number;
  status: 'Active' | 'Suspended' | 'Terminated';
}

export interface SalaryPayment {
  paymentId: string;
  employee: string;
  employer: string;
  amount?: string; // Alias for netSalary (UI compatibility)\n  date?: string; // Formatted payment date (UI compatibility)
  payPeriod: {
    start: number;
    end: number;
  };
  grossSalary: string;
  deductions: Deduction[];
  netSalary: string;
  currency: 'DALLA' | 'bBZD';
  paymentDate: number;
  paymentHash?: string; // Blockchain transaction hash
  status: 'Pending' | 'Paid' | 'Failed' | 'Disputed';
}

export interface Deduction {
  type: 'Tax' | 'SSB' | 'Insurance' | 'Loan' | 'Advance' | 'Other';
  description: string;
  amount: string;
  percentage?: number; // For tax/SSB
  mandatory: boolean;
}

export interface SalarySlip {
  paymentId: string;
  employee: string;
  employeeName?: string;
  employer: string;
  employerName: string;
  payPeriod: string; // Formatted date range
  position?: string;
  department?: string;
  basicSalary: string;
  allowances: Allowance[];
  grossSalary: string;
  deductions: Deduction[];
  totalDeductions: string;
  netSalary: string;
  currency: 'DALLA' | 'bBZD';
  paymentDate: string;
  paymentMethod: 'Direct' | 'Manual';
}

export interface Allowance {
  type: 'Housing' | 'Transportation' | 'Meal' | 'Education' | 'Medical' | 'Other';
  description: string;
  amount: string;
}

export interface PayrollStats {
  totalEarnings: string; // Lifetime
  yearToDate: string;
  lastPayment: string;
  averageMonthly: string;
  totalDeductions: string;
  taxPaid: string;
  ssbContributions: string;
  paymentCount: number;
}

/**
 * Get payroll record for an employee
 */
export async function getPayrollRecord(address: string): Promise<PayrollRecord | null> {
  const api = await initializeApi();
  
  try {
    const record: any = await api.query.payroll?.employees(address);
    
    if (!record || record.isNone) {
      return null;
    }

    const data = record.unwrap();
    
    return {
      recordId: data.recordId.toString(),
      employee: address,
      employer: data.employer.toString(),
      employerName: data.employerName.toString(),
      employmentType: data.employmentType.toString() as any,
      position: data.position?.toString(),
      department: data.department?.toString(),
      startDate: data.startDate.toNumber(),
      endDate: data.endDate?.toNumber(),
      status: data.status.toString() as any,
    };
  } catch (error) {
    console.error('Failed to fetch payroll record:', error);
    return null;
  }
}

/**
 * Get salary payment history
 */
export async function getSalaryPayments(
  address: string,
  limit: number = 12
): Promise<SalaryPayment[]> {
  const api = await initializeApi();
  
  try {
    const payments: any = await api.query.payroll?.payments.entries(address);
    
    if (!payments || payments.length === 0) {
      return [];
    }

    return payments
      .map(([key, value]: [any, any]) => {
        const paymentId = key.args[1].toString();
        const data = value.unwrap();
        
        return {
          paymentId,
          employee: address,
          employer: data.employer.toString(),
          payPeriod: {
            start: data.periodStart.toNumber(),
            end: data.periodEnd.toNumber(),
          },
          grossSalary: formatBalance(data.grossSalary.toString()),
          deductions: data.deductions.toHuman() as Deduction[],
          netSalary: formatBalance(data.netSalary.toString()),
          currency: data.currency.toString() as any,
          paymentDate: data.paymentDate.toNumber(),
          paymentHash: data.paymentHash?.toString(),
          status: data.status.toString() as any,
        };
      })
      .sort((a: { paymentDate: number }, b: { paymentDate: number }) => b.paymentDate - a.paymentDate)
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch salary payments:', error);
    return [];
  }
}

/**
 * Get formatted salary slip
 */
export async function getSalarySlip(paymentId: string): Promise<SalarySlip | null> {
  const api = await initializeApi();
  
  try {
    const payment: any = await api.query.payroll?.paymentsById(paymentId);
    
    if (!payment || payment.isNone) {
      return null;
    }

    const data = payment.unwrap();
    const record = await getPayrollRecord(data.employee.toString());
    
    return {
      paymentId,
      employee: data.employee.toString(),
      employeeName: data.employeeName?.toString(),
      employer: data.employer.toString(),
      employerName: data.employerName.toString(),
      payPeriod: formatPayPeriod(data.periodStart.toNumber(), data.periodEnd.toNumber()),
      position: record?.position,
      department: record?.department,
      basicSalary: formatBalance(data.basicSalary.toString()),
      allowances: data.allowances?.toHuman() as Allowance[] || [],
      grossSalary: formatBalance(data.grossSalary.toString()),
      deductions: data.deductions.toHuman() as Deduction[],
      totalDeductions: calculateTotalDeductions(data.deductions.toHuman() as Deduction[]),
      netSalary: formatBalance(data.netSalary.toString()),
      currency: data.currency.toString() as any,
      paymentDate: new Date(data.paymentDate.toNumber()).toLocaleDateString(),
      paymentMethod: data.paymentMethod.toString() as any,
    };
  } catch (error) {
    console.error('Failed to fetch salary slip:', error);
    return null;
  }
}

/**
 * Get payroll statistics
 */
export async function getPayrollStats(address: string): Promise<PayrollStats> {
  const payments = await getSalaryPayments(address, 1000);
  
  if (payments.length === 0) {
    return {
      totalEarnings: '0.00',
      yearToDate: '0.00',
      lastPayment: '0.00',
      averageMonthly: '0.00',
      totalDeductions: '0.00',
      taxPaid: '0.00',
      ssbContributions: '0.00',
      paymentCount: 0,
    };
  }

  const currentYear = new Date().getFullYear();
  const totalEarnings = payments.reduce((sum, p) => sum + parseFloat(p.netSalary), 0);
  
  const yearToDatePayments = payments.filter(p => 
    new Date(p.paymentDate).getFullYear() === currentYear
  );
  const yearToDate = yearToDatePayments.reduce((sum, p) => sum + parseFloat(p.netSalary), 0);
  
  const lastPayment = payments.length > 0 ? parseFloat(payments[0].netSalary) : 0;
  const averageMonthly = totalEarnings / Math.max(payments.length, 1);
  
  let totalDeductions = 0;
  let taxPaid = 0;
  let ssbContributions = 0;
  
  payments.forEach(payment => {
    payment.deductions.forEach(deduction => {
      const amount = parseFloat(deduction.amount);
      totalDeductions += amount;
      
      if (deduction.type === 'Tax') {
        taxPaid += amount;
      } else if (deduction.type === 'SSB') {
        ssbContributions += amount;
      }
    });
  });

  return {
    totalEarnings: totalEarnings.toFixed(2),
    yearToDate: yearToDate.toFixed(2),
    lastPayment: lastPayment.toFixed(2),
    averageMonthly: averageMonthly.toFixed(2),
    totalDeductions: totalDeductions.toFixed(2),
    taxPaid: taxPaid.toFixed(2),
    ssbContributions: ssbContributions.toFixed(2),
    paymentCount: payments.length,
  };
}

/**
 * Download salary slip as PDF (would integrate with PDF generation service)
 */
export async function downloadSalarySlip(paymentId: string): Promise<Blob> {
  const slip = await getSalarySlip(paymentId);
  
  if (!slip) {
    throw new Error('Salary slip not found');
  }

  // In production, this would call a PDF generation service
  // For now, return a JSON blob
  const jsonData = JSON.stringify(slip, null, 2);
  return new Blob([jsonData], { type: 'application/json' });
}

/**
 * Verify salary payment on blockchain
 */
export async function verifySalaryPayment(paymentId: string): Promise<{
  verified: boolean;
  transactionHash?: string;
  blockNumber?: number;
  timestamp?: number;
}> {
  const api = await initializeApi();
  
  try {
    const payment: any = await api.query.payroll?.paymentsById(paymentId);
    
    if (!payment || payment.isNone) {
      return { verified: false };
    }

    const data = payment.unwrap();
    const txHash = data.paymentHash?.toString();
    
    if (!txHash) {
      return { verified: false };
    }

    // Verify transaction exists on chain
    // In production, would query indexer or scan blocks
    return {
      verified: true,
      transactionHash: txHash,
      blockNumber: 0, // Would get from indexer
      timestamp: data.paymentDate.toNumber(),
    };
  } catch (error) {
    console.error('Failed to verify payment:', error);
    return { verified: false };
  }
}

/**
 * Get tax summary for year (for tax filing)
 */
export async function getTaxSummary(address: string, year: number): Promise<{
  year: number;
  totalIncome: string;
  totalTax: string;
  totalSSB: string;
  monthlyBreakdown: Array<{
    month: string;
    income: string;
    tax: string;
    ssb: string;
  }>;
}> {
  const payments = await getSalaryPayments(address, 1000);
  
  const yearPayments = payments.filter(p => 
    new Date(p.paymentDate).getFullYear() === year
  );

  const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(year, i).toLocaleString('default', { month: 'long' });
    const monthPayments = yearPayments.filter(p => 
      new Date(p.paymentDate).getMonth() === i
    );

    const income = monthPayments.reduce((sum, p) => sum + parseFloat(p.grossSalary), 0);
    const tax = monthPayments.reduce((sum, p) => {
      const taxDeduction = p.deductions.find(d => d.type === 'Tax');
      return sum + (taxDeduction ? parseFloat(taxDeduction.amount) : 0);
    }, 0);
    const ssb = monthPayments.reduce((sum, p) => {
      const ssbDeduction = p.deductions.find(d => d.type === 'SSB');
      return sum + (ssbDeduction ? parseFloat(ssbDeduction.amount) : 0);
    }, 0);

    return {
      month,
      income: income.toFixed(2),
      tax: tax.toFixed(2),
      ssb: ssb.toFixed(2),
    };
  });

  const totalIncome = monthlyBreakdown.reduce((sum, m) => sum + parseFloat(m.income), 0);
  const totalTax = monthlyBreakdown.reduce((sum, m) => sum + parseFloat(m.tax), 0);
  const totalSSB = monthlyBreakdown.reduce((sum, m) => sum + parseFloat(m.ssb), 0);

  return {
    year,
    totalIncome: totalIncome.toFixed(2),
    totalTax: totalTax.toFixed(2),
    totalSSB: totalSSB.toFixed(2),
    monthlyBreakdown,
  };
}

/**
 * Request salary advance (if employer supports)
 */
export async function requestSalaryAdvance(
  address: string,
  amount: string,
  reason: string
): Promise<{ hash: string; requestId: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const amountInPlanck = parseFloat(amount) * Math.pow(10, 12);
    
    const tx = api.tx.payroll.requestAdvance(amountInPlanck, reason);

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let requestId = '';
          
          events.forEach(({ event }) => {
            if (api.events.payroll?.AdvanceRequested?.is(event)) {
              const [, reqId] = event.data;
              requestId = reqId.toString();
            }
          });

          resolve({
            hash: txHash.toString(),
            requestId,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Request advance failed:', error);
    throw error;
  }
}

/**
 * Helper: Calculate total deductions
 */
function calculateTotalDeductions(deductions: Deduction[]): string {
  const total = deductions.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  return total.toFixed(2);
}

/**
 * Helper: Format pay period
 */
function formatPayPeriod(start: number, end: number): string {
  const startDate = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endDate = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startDate} - ${endDate}`;
}

/**
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}
