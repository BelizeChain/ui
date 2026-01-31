/**
 * FSC Compliance Exporter
 * 
 * Generates regulatory compliance reports for Financial Services Commission (FSC) oversight.
 * Supports CSV and PDF formats for KYC records, transaction analytics, and audit trails.
 */

import { ApiPromise } from '@polkadot/api';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface KYCRecord {
  accountId: string;
  citizenId: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
  kycDate: Date;
  verifiedBy: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface TransactionSummary {
  period: string;
  totalTransactions: number;
  totalVolume: string;
  uniqueAccounts: number;
  averageTransaction: string;
  suspiciousActivity: number;
}

export interface ComplianceReport {
  reportDate: Date;
  periodStart: Date;
  periodEnd: Date;
  kycRecords: KYCRecord[];
  transactionSummary: TransactionSummary;
  validatorActivity: {
    activeValidators: number;
    totalStaked: string;
    slashingEvents: number;
  };
  amlAlerts: {
    highValueTransactions: number;
    rapidTransactions: number;
    crossBorderTransactions: number;
  };
}

export class FSCExporter {
  private api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    console.log(`Generating FSC report from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch KYC records
    const kycRecords = await this.fetchKYCRecords();

    // Calculate transaction summary
    const transactionSummary = await this.calculateTransactionSummary(startDate, endDate);

    // Get validator activity
    const validatorActivity = await this.getValidatorActivity();

    // Detect AML alerts
    const amlAlerts = await this.detectAMLAlerts(startDate, endDate);

    return {
      reportDate: new Date(),
      periodStart: startDate,
      periodEnd: endDate,
      kycRecords,
      transactionSummary,
      validatorActivity,
      amlAlerts,
    };
  }

  /**
   * Fetch KYC records from identity pallet
   */
  private async fetchKYCRecords(): Promise<KYCRecord[]> {
    const records: KYCRecord[] = [];

    try {
      // Query all identity registrations
      const identities = await this.api.query.identity?.identityOf.entries();

      for (const [key, value] of identities || []) {
        const accountId = key.args[0].toString();
        const identity: any = (value as any).unwrap();

        // Extract KYC data from identity pallet
        const kycStatus = await this.api.query.compliance?.kycStatus?.(accountId);
        const kycData: any = await this.api.query.compliance?.kycRecords?.(accountId);

        records.push({
          accountId,
          citizenId: identity.info?.additional?.[0]?.[1]?.asRaw?.toString() || 'N/A',
          fullName: this.decodeIdentityField(identity.info?.display) || 'Unknown',
          dateOfBirth: 'N/A', // Extract from additional fields if available
          address: this.decodeIdentityField(identity.info?.legal) || 'N/A',
          kycStatus: kycStatus?.toString() as any || 'Pending',
          kycDate: new Date(), // Extract from KYC data
          verifiedBy: kycData?.verifier?.toString() || 'System',
          riskLevel: this.calculateRiskLevel(accountId),
        });
      }
    } catch (error) {
      console.error('Error fetching KYC records:', error);
    }

    return records;
  }

  /**
   * Calculate transaction summary for period
   */
  private async calculateTransactionSummary(
    startDate: Date,
    endDate: Date
  ): Promise<TransactionSummary> {
    let totalTransactions = 0;
    let totalVolume = BigInt(0);
    const uniqueAccounts = new Set<string>();
    let suspiciousActivity = 0;

    try {
      const currentBlock = await this.api.rpc.chain.getHeader();
      const currentBlockNum = currentBlock.number.toNumber();

      // Scan blocks in date range
      for (let i = Math.max(0, currentBlockNum - 10000); i <= currentBlockNum; i++) {
        const blockHash = await this.api.rpc.chain.getBlockHash(i);
        const signedBlock = await this.api.rpc.chain.getBlock(blockHash);
        const apiAt = await this.api.at(blockHash);
        const timestamp = await apiAt.query.timestamp.now();
        const blockDate = new Date((timestamp as any).toNumber());

        if (blockDate < startDate || blockDate > endDate) continue;

        signedBlock.block.extrinsics.forEach((extrinsic) => {
          const { method, signer } = extrinsic;

          if (method.section === 'balances' || method.section === 'economy') {
            totalTransactions++;
            uniqueAccounts.add(signer.toString());

            const amount = method.args[1]?.toString() || '0';
            totalVolume += BigInt(amount);

            // Flag suspicious activity (e.g., high-value transfers)
            if (BigInt(amount) > BigInt(10 ** 12) * BigInt(1000000)) {
              suspiciousActivity++;
            }
          }
        });
      }
    } catch (error) {
      console.error('Error calculating transaction summary:', error);
    }

    const avgTransaction = totalTransactions > 0
      ? (totalVolume / BigInt(totalTransactions)).toString()
      : '0';

    return {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      totalTransactions,
      totalVolume: this.formatBalance(totalVolume.toString()),
      uniqueAccounts: uniqueAccounts.size,
      averageTransaction: this.formatBalance(avgTransaction),
      suspiciousActivity,
    };
  }

  /**
   * Get validator activity metrics
   */
  private async getValidatorActivity() {
    try {
      const sessionValidators = await this.api.query.session?.validators();
      const activeValidators = (sessionValidators as any)?.length || 0;

      const activeEra = await this.api.query.staking?.activeEra();
      const currentEra = (activeEra as any)?.unwrap()?.index?.toNumber() || 0;

      let totalStaked = BigInt(0);
      const allValidators = await this.api.query.staking?.validators.entries();

      for (const [key] of allValidators || []) {
        const accountId = key.args[0].toString();
        const exposure: any = await this.api.query.staking?.erasStakers(currentEra, accountId);
        totalStaked += BigInt(exposure?.total?.toString() || '0');
      }

      // Get slashing events
      const slashingSpans = await this.api.query.staking?.slashingSpans.entries();

      return {
        activeValidators,
        totalStaked: this.formatBalance(totalStaked.toString()),
        slashingEvents: slashingSpans?.length || 0,
      };
    } catch (error) {
      console.error('Error getting validator activity:', error);
      return {
        activeValidators: 0,
        totalStaked: '0',
        slashingEvents: 0,
      };
    }
  }

  /**
   * Detect AML alert indicators
   */
  private async detectAMLAlerts(startDate: Date, endDate: Date) {
    return {
      highValueTransactions: 0, // TODO: Implement detection logic
      rapidTransactions: 0,
      crossBorderTransactions: 0,
    };
  }

  /**
   * Export report as CSV
   */
  exportCSV(report: ComplianceReport): string {
    const rows: string[] = [];

    // Header
    rows.push('FSC Compliance Report');
    rows.push(`Generated: ${report.reportDate.toISOString()}`);
    rows.push(`Period: ${report.periodStart.toLocaleDateString()} - ${report.periodEnd.toLocaleDateString()}`);
    rows.push('');

    // KYC Summary
    rows.push('KYC RECORDS');
    rows.push('Account ID,Citizen ID,Full Name,Status,Risk Level,Verified Date');
    report.kycRecords.forEach((record) => {
      rows.push(
        `${record.accountId},${record.citizenId},${record.fullName},${record.kycStatus},${record.riskLevel},${record.kycDate.toISOString()}`
      );
    });
    rows.push('');

    // Transaction Summary
    rows.push('TRANSACTION SUMMARY');
    rows.push(`Period,${report.transactionSummary.period}`);
    rows.push(`Total Transactions,${report.transactionSummary.totalTransactions}`);
    rows.push(`Total Volume (DALLA),${report.transactionSummary.totalVolume}`);
    rows.push(`Unique Accounts,${report.transactionSummary.uniqueAccounts}`);
    rows.push(`Average Transaction (DALLA),${report.transactionSummary.averageTransaction}`);
    rows.push(`Suspicious Activity Flags,${report.transactionSummary.suspiciousActivity}`);
    rows.push('');

    // Validator Activity
    rows.push('VALIDATOR ACTIVITY');
    rows.push(`Active Validators,${report.validatorActivity.activeValidators}`);
    rows.push(`Total Staked (DALLA),${report.validatorActivity.totalStaked}`);
    rows.push(`Slashing Events,${report.validatorActivity.slashingEvents}`);
    rows.push('');

    // AML Alerts
    rows.push('AML ALERTS');
    rows.push(`High-Value Transactions,${report.amlAlerts.highValueTransactions}`);
    rows.push(`Rapid Transactions,${report.amlAlerts.rapidTransactions}`);
    rows.push(`Cross-Border Transactions,${report.amlAlerts.crossBorderTransactions}`);

    return rows.join('\n');
  }

  /**
   * Export report as PDF
   */
  exportPDF(report: ComplianceReport): jsPDF {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('FSC Compliance Report', 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated: ${report.reportDate.toLocaleString()}`, 14, 28);
    doc.text(
      `Period: ${report.periodStart.toLocaleDateString()} - ${report.periodEnd.toLocaleDateString()}`,
      14,
      34
    );

    let yPos = 45;

    // KYC Summary Table
    doc.setFontSize(14);
    doc.text('KYC Records', 14, yPos);
    yPos += 8;

    doc.autoTable({
      startY: yPos,
      head: [['Account ID', 'Name', 'Status', 'Risk', 'Verified']],
      body: report.kycRecords.map((r) => [
        r.accountId.slice(0, 10) + '...',
        r.fullName,
        r.kycStatus,
        r.riskLevel,
        r.kycDate.toLocaleDateString(),
      ]),
      styles: { fontSize: 8 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Transaction Summary
    doc.setFontSize(14);
    doc.text('Transaction Summary', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.text(`Total Transactions: ${report.transactionSummary.totalTransactions}`, 14, yPos);
    doc.text(`Total Volume: ${report.transactionSummary.totalVolume} DALLA`, 14, yPos + 6);
    doc.text(`Unique Accounts: ${report.transactionSummary.uniqueAccounts}`, 14, yPos + 12);
    doc.text(`Suspicious Activity: ${report.transactionSummary.suspiciousActivity}`, 14, yPos + 18);

    yPos += 28;

    // Validator Activity
    doc.setFontSize(14);
    doc.text('Validator Activity', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.text(`Active Validators: ${report.validatorActivity.activeValidators}`, 14, yPos);
    doc.text(`Total Staked: ${report.validatorActivity.totalStaked} DALLA`, 14, yPos + 6);
    doc.text(`Slashing Events: ${report.validatorActivity.slashingEvents}`, 14, yPos + 12);

    return doc;
  }

  /**
   * Helper: Decode identity field
   */
  private decodeIdentityField(field: any): string | null {
    if (!field) return null;
    if (field.isRaw) return field.asRaw.toUtf8();
    if (field.isData) return field.asData.toString();
    return field.toString();
  }

  /**
   * Helper: Calculate risk level based on account activity
   */
  private calculateRiskLevel(accountId: string): 'Low' | 'Medium' | 'High' {
    // TODO: Implement actual risk scoring logic
    return 'Low';
  }

  /**
   * Helper: Format balance from Planck to DALLA
   */
  private formatBalance(value: string): string {
    const num = BigInt(value);
    const divisor = BigInt(10 ** 12);
    const whole = num / divisor;
    const fraction = num % divisor;
    const fractionStr = fraction.toString().padStart(12, '0').slice(0, 2);
    return `${whole.toLocaleString()}.${fractionStr}`;
  }
}

/**
 * Helper function to download CSV
 */
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper function to download PDF
 */
export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}
