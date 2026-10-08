/**
 * BelizeChain Payroll Pallet Integration
 * Handles government and private payroll management, salary slips, deductions
 */

import { initializeApi } from '../blockchain';

/**
 * Mirrors `payroll.employees: (employer, employee) -> EmployeeRecord`.
 *
 * The pallet stores no employer name, job title, employment type or status —
 * an earlier version of this file invented all four. The map is also keyed by a
 * (employer, employee) tuple, so it cannot be read with a single account.
 */
export interface PayrollRecord {
  /** Composite key, `employer:employee` — the pallet has no record id here. */
  recordId: string;
  employee: string;
  employer: string;
  workerType: string;
  departmentId: number;
  salary: string;
  totalPaid: string;
  totalDeductions: string;
  lastPaid: number;
  startBlock: number;
  active: boolean;
}

/**
 * Mirrors `payroll.payrollRecords: u64 -> PayrollRecord`.
 *
 * `deductions` is a single u128 total, not an itemised list, and the pallet
 * records no pay period, status or transaction hash.
 */
export interface SalaryPayment {
  paymentId: string;
  employee: string;
  employer: string;
  /** Gross amount paid, in DALLA. */
  amount: string;
  deductions: string;
  netAmount: string;
  currency: 'DALLA' | 'bBZD';
  category: string;
  blockNumber: number;
  timestamp: number;
  paymentCommitment: string;
  /** Formatted payment date (UI convenience). */
  date?: string;
}

export interface SalarySlip {
  paymentId: string;
  employee: string;
  employer: string;
  amount: string;
  deductions: string;
  netAmount: string;
  currency: 'DALLA' | 'bBZD';
  category: string;
  blockNumber: number;
  timestamp: number;
  paymentCommitment: string;
}

export interface PayrollStats {
  totalEarnings: string; // Lifetime net, in DALLA
  yearToDate: string;
  lastPayment: string;
  averageMonthly: string;
  totalDeductions: string;
  paymentCount: number;
}

/**
 * Get payroll record for an employee
 */
export async function getPayrollRecord(address: string): Promise<PayrollRecord | null> {
  const api = await initializeApi();

  try {
    if (!api.query.payroll?.employees) return null;

    // `employees` is keyed by (employer, employee) with no per-employee index,
    // so filter the entries by the employee account.
    const entries = await api.query.payroll.employees.entries();
    for (const [key, raw] of entries as any[]) {
      const data = raw?.toJSON?.();
      if (!data || String(data.account) !== address) continue;

      const employer = String(key?.args?.[0] ?? '');
      return {
        recordId: `${employer}:${address}`,
        employee: address,
        employer,
        workerType: String(data.workerType),
        departmentId: Number(data.departmentId ?? 0),
        salary: formatBalance(String(data.salary ?? '0')),
        totalPaid: formatBalance(String(data.totalPaid ?? '0')),
        totalDeductions: formatBalance(String(data.totalDeductions ?? '0')),
        lastPaid: Number(data.lastPaid ?? 0),
        startBlock: Number(data.startBlock ?? 0),
        active: Boolean(data.active),
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch payroll record:', error);
    return null;
  }
}

/** Normalise a pallet `timestamp: u64` to milliseconds (seconds -> ms). */
function toMillis(ts: number): number {
  return ts > 1e12 ? ts : ts * 1000;
}

function toSalaryPayment(paymentId: string, data: any): SalaryPayment {
  const timestamp = Number(data.timestamp ?? 0);
  return {
    paymentId,
    employee: String(data.employee ?? ''),
    employer: String(data.employer ?? ''),
    amount: formatBalance(String(data.amount ?? '0')),
    deductions: formatBalance(String(data.deductions ?? '0')),
    netAmount: formatBalance(String(data.netAmount ?? '0')),
    currency: String(data.tokenType) === 'bBZD' ? 'bBZD' : 'DALLA',
    category: String(data.category),
    blockNumber: Number(data.blockNumber ?? 0),
    timestamp,
    paymentCommitment: String(data.paymentCommitment ?? ''),
    date: timestamp ? new Date(toMillis(timestamp)).toLocaleDateString() : undefined,
  };
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
    if (!api.query.payroll?.payrollRecords) return [];

    const entries = await api.query.payroll.payrollRecords.entries();
    const payments: SalaryPayment[] = [];

    for (const [key, raw] of entries as any[]) {
      const data = raw?.toJSON?.();
      if (!data || String(data.employee) !== address) continue;
      payments.push(toSalaryPayment(String(data.id ?? key?.args?.[0] ?? ''), data));
    }

    return payments.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch salary payments:', error);
    return [];
  }
}

/**
 * A single entry of the employer->employee roster (`payroll.employees`).
 *
 * The pallet stores no name, department label, role or tax itemisation — only
 * a `departmentId` number, a `workerType` enum and a salary commitment, so
 * job titles and PAYE/SSB splits cannot be shown.
 */
export interface EmployeeRosterEntry {
  employer: string;
  employee: string;
  salary: string;
  salaryCommitment: string;
  workerType: string;
  departmentId: number;
  active: boolean;
  lastPaid: number;
  totalPaid: string;
  totalDeductions: string;
  startBlock: number;
  metadataHash: string;
}

/**
 * Read the roster an address pays, i.e. `payroll.employees` entries keyed by
 * that employer. Returns `[]` if the address employs nobody.
 */
export async function getEmployeeRoster(employer: string): Promise<EmployeeRosterEntry[]> {
  const api = await initializeApi();

  try {
    if (!api.query.payroll?.employees) return [];
    const entries = await api.query.payroll.employees.entries();

    const roster: EmployeeRosterEntry[] = [];
    for (const [key, raw] of entries as any[]) {
      if (String(key?.args?.[0]) !== employer) continue;
      const data = raw?.toJSON?.();
      if (!data) continue;
      roster.push({
        employer,
        employee: String(data.account ?? key?.args?.[1] ?? ''),
        salary: formatBalance(String(data.salary ?? '0')),
        salaryCommitment: String(data.salaryCommitment ?? ''),
        workerType: String(data.workerType),
        departmentId: Number(data.departmentId ?? 0),
        active: Boolean(data.active),
        lastPaid: Number(data.lastPaid ?? 0),
        totalPaid: formatBalance(String(data.totalPaid ?? '0')),
        totalDeductions: formatBalance(String(data.totalDeductions ?? '0')),
        startBlock: Number(data.startBlock ?? 0),
        metadataHash: String(data.metadataHash ?? ''),
      });
    }

    return roster.sort((a, b) => a.employee.localeCompare(b.employee));
  } catch (error) {
    console.warn('Failed to fetch employee roster:', error);
    return [];
  }
}

/**
 * Read every payment an address made as an employer
 * (`payroll.payrollRecords` filtered by `employer`).
 */
export async function getEmployerPayments(
  employer: string,
  limit: number = 50
): Promise<SalaryPayment[]> {
  const api = await initializeApi();

  try {
    if (!api.query.payroll?.payrollRecords) return [];
    const entries = await api.query.payroll.payrollRecords.entries();

    const payments: SalaryPayment[] = [];
    for (const [key, raw] of entries as any[]) {
      const data = raw?.toJSON?.();
      if (!data || String(data.employer) !== employer) continue;
      payments.push(toSalaryPayment(String(data.id ?? key?.args?.[0] ?? ''), data));
    }

    return payments.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  } catch (error) {
    console.warn('Failed to fetch employer payments:', error);
    return [];
  }
}

/**
 * Get formatted salary slip
 */
export async function getSalarySlip(paymentId: string): Promise<SalarySlip | null> {
  const api = await initializeApi();

  try {
    if (!api.query.payroll?.payrollRecords) return null;

    const raw: any = await api.query.payroll.payrollRecords(paymentId);
    if (!raw || raw.isNone) return null;

    const payment = toSalaryPayment(paymentId, raw.toJSON());
    return {
      paymentId: payment.paymentId,
      employee: payment.employee,
      employer: payment.employer,
      amount: payment.amount,
      deductions: payment.deductions,
      netAmount: payment.netAmount,
      currency: payment.currency,
      category: payment.category,
      blockNumber: payment.blockNumber,
      timestamp: payment.timestamp,
      paymentCommitment: payment.paymentCommitment,
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
      paymentCount: 0,
    };
  }

  const currentYear = new Date().getFullYear();
  const totalEarnings = payments.reduce((sum, p) => sum + parseFloat(p.netAmount), 0);

  const yearToDate = payments
    .filter(p => p.timestamp && new Date(toMillis(p.timestamp)).getFullYear() === currentYear)
    .reduce((sum, p) => sum + parseFloat(p.netAmount), 0);

  const lastPayment = parseFloat(payments[0].netAmount);
  const averageMonthly = totalEarnings / payments.length;

  // `deductions` is a single u128 per payment — the pallet stores no
  // Tax/SSB itemisation, so those cannot be broken out.
  const totalDeductions = payments.reduce((sum, p) => sum + parseFloat(p.deductions), 0);

  return {
    totalEarnings: totalEarnings.toFixed(2),
    yearToDate: yearToDate.toFixed(2),
    lastPayment: lastPayment.toFixed(2),
    averageMonthly: averageMonthly.toFixed(2),
    totalDeductions: totalDeductions.toFixed(2),
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
  /** The on-chain commitment hash for this payment. */
  commitment?: string;
  blockNumber?: number;
  timestamp?: number;
}> {
  const api = await initializeApi();

  try {
    if (!api.query.payroll?.payrollRecords) return { verified: false };

    const raw: any = await api.query.payroll.payrollRecords(paymentId);
    if (!raw || raw.isNone) return { verified: false };

    const data = raw.toJSON() as any;
    return {
      verified: true,
      commitment: String(data.paymentCommitment ?? ''),
      blockNumber: Number(data.blockNumber ?? 0),
      timestamp: Number(data.timestamp ?? 0),
    };
  } catch (error) {
    console.error('Failed to verify payment:', error);
    return { verified: false };
  }
}

/**
 * Yearly income summary.
 *
 * The pallet stores deductions as a single u128 total, with no Tax/SSB
 * itemisation, so this reports gross income and total deductions only.
 */
export async function getTaxSummary(address: string, year: number): Promise<{
  year: number;
  totalIncome: string;
  totalDeductions: string;
  monthlyBreakdown: Array<{
    month: string;
    income: string;
    deductions: string;
  }>;
}> {
  const payments = await getSalaryPayments(address, 1000);

  const yearPayments = payments.filter(
    p => p.timestamp && new Date(toMillis(p.timestamp)).getFullYear() === year
  );

  const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(year, i).toLocaleString('default', { month: 'long' });
    const monthPayments = yearPayments.filter(
      p => new Date(toMillis(p.timestamp)).getMonth() === i
    );

    const income = monthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const deductions = monthPayments.reduce((sum, p) => sum + parseFloat(p.deductions), 0);

    return {
      month,
      income: income.toFixed(2),
      deductions: deductions.toFixed(2),
    };
  });

  const totalIncome = monthlyBreakdown.reduce((sum, m) => sum + parseFloat(m.income), 0);
  const totalDeductions = monthlyBreakdown.reduce((sum, m) => sum + parseFloat(m.deductions), 0);

  return {
    year,
    totalIncome: totalIncome.toFixed(2),
    totalDeductions: totalDeductions.toFixed(2),
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
  // The payroll pallet on BelizeChain is employer-driven: there is no
  // employee-initiated advance extrinsic. Employees must request advances
  // off-chain; the employer then issues a bonus via `payroll.issueBonus`.
  void address; void amount; void reason;
  await initializeApi();
  throw new Error(
    'Salary advances must be issued by the employer (payroll.issueBonus). ' +
      'No employee-initiated advance extrinsic exists on chain.',
  );
}

/**
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}
