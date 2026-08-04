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

export type OverallRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface AggregateRiskScore {
  overall: OverallRiskLevel;
  score: number; // 0–100
  breakdown: {
    kycRisk: number;      // weighted KYC-level contribution (0–30)
    amlRisk: number;      // weighted AML-alert contribution  (0–40)
    concentrationRisk: number; // high-risk account ratio      (0–30)
  };
  highRiskAccounts: number;
  unverifiedAccounts: number;
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
  aggregateRisk: AggregateRiskScore;
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

    // Calculate aggregate risk score from KYC records + AML alerts
    const aggregateRisk = this.calculateAggregateRiskScore(kycRecords, amlAlerts, transactionSummary);

    return {
      reportDate: new Date(),
      periodStart: startDate,
      periodEnd: endDate,
      kycRecords,
      transactionSummary,
      validatorActivity,
      amlAlerts,
      aggregateRisk,
    };
  }

  /**
   * Fetch KYC records from identity pallet
   */
  private async fetchKYCRecords(): Promise<KYCRecord[]> {
    const records: KYCRecord[] = [];

    try {
      // Query all identity registrations
      const identities = await this.api.query.identity?.identityOf?.entries?.() || [];

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
          riskLevel: await this.calculateRiskLevel(accountId),
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
      const allValidators = await this.api.query.staking?.validators?.entries?.() || [];

      for (const [key] of allValidators || []) {
        const accountId = key.args[0].toString();
        const exposure: any = await this.api.query.staking?.erasStakers(currentEra, accountId);
        totalStaked += BigInt(exposure?.total?.toString() || '0');
      }

      // Get slashing events
      const slashingSpans = await this.api.query.staking?.slashingSpans?.entries?.() || [];

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
   * Detect AML alert indicators by scanning recent blocks.
   *
   *  - highValueTransactions: token transfers at/above the high-value threshold
   *  - rapidTransactions: transfers from a sender within RAPID_WINDOW of their
   *    previous transfer (velocity / structuring signal)
   *  - crossBorderTransactions: cross-chain / bridge extrinsics (interoperability)
   */
  private async detectAMLAlerts(startDate: Date, endDate: Date) {
    const DALLA = BigInt(10 ** 12);
    const HIGH_VALUE_THRESHOLD = DALLA * BigInt(100000); // 100k DALLA
    const RAPID_WINDOW_MS = 60 * 1000; // consecutive transfers within 60s
    const CROSS_BORDER_SECTIONS = new Set([
      'interoperability',
      'bridge',
      'xcmpQueue',
      'polkadotXcm',
      'xcmPallet',
    ]);

    let highValueTransactions = 0;
    let rapidTransactions = 0;
    let crossBorderTransactions = 0;
    const lastTransferAt = new Map<string, number>();

    try {
      const currentBlock = await this.api.rpc.chain.getHeader();
      const currentBlockNum = currentBlock.number.toNumber();

      for (let i = Math.max(0, currentBlockNum - 10000); i <= currentBlockNum; i++) {
        const blockHash = await this.api.rpc.chain.getBlockHash(i);
        const signedBlock = await this.api.rpc.chain.getBlock(blockHash);
        const apiAt = await this.api.at(blockHash);
        const timestamp = await apiAt.query.timestamp.now();
        const blockTimeMs = (timestamp as any).toNumber();
        const blockDate = new Date(blockTimeMs);

        if (blockDate < startDate || blockDate > endDate) continue;

        signedBlock.block.extrinsics.forEach((extrinsic) => {
          const { method, signer } = extrinsic;

          // Cross-border: cross-chain / bridge transfers.
          if (CROSS_BORDER_SECTIONS.has(method.section)) {
            crossBorderTransactions++;
          }

          // Value- and velocity-based detection on token transfers.
          if (method.section === 'balances' || method.section === 'economy') {
            const amount = BigInt(method.args[1]?.toString() || '0');
            if (amount >= HIGH_VALUE_THRESHOLD) {
              highValueTransactions++;
            }

            const sender = signer.toString();
            const previous = lastTransferAt.get(sender);
            if (previous !== undefined && blockTimeMs - previous <= RAPID_WINDOW_MS) {
              rapidTransactions++;
            }
            lastTransferAt.set(sender, blockTimeMs);
          }
        });
      }
    } catch (error) {
      console.error('Error detecting AML alerts:', error);
    }

    return {
      highValueTransactions,
      rapidTransactions,
      crossBorderTransactions,
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
    rows.push('');

    // Aggregate Risk Score
    rows.push('AGGREGATE RISK ASSESSMENT');
    rows.push(`Overall Risk Level,${report.aggregateRisk.overall}`);
    rows.push(`Composite Score,${report.aggregateRisk.score}/100`);
    rows.push(`KYC Risk Component,${report.aggregateRisk.breakdown.kycRisk}/30`);
    rows.push(`AML Risk Component,${report.aggregateRisk.breakdown.amlRisk}/40`);
    rows.push(`Concentration Risk Component,${report.aggregateRisk.breakdown.concentrationRisk}/30`);
    rows.push(`High-Risk Accounts,${report.aggregateRisk.highRiskAccounts}`);
    rows.push(`Unverified Accounts,${report.aggregateRisk.unverifiedAccounts}`);

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

    yPos += 22;

    // Aggregate Risk Assessment
    doc.setFontSize(14);
    doc.text('Aggregate Risk Assessment', 14, yPos);
    yPos += 8;

    const risk = report.aggregateRisk;
    const riskColor = risk.overall === 'Critical' ? '#ef4444'
      : risk.overall === 'High' ? '#f97316'
      : risk.overall === 'Medium' ? '#eab308'
      : '#22c55e';

    doc.setFontSize(12);
    doc.setTextColor(riskColor);
    doc.text(`Overall: ${risk.overall} (${risk.score}/100)`, 14, yPos);
    doc.setTextColor('#000000');
    yPos += 8;

    doc.setFontSize(10);
    doc.text(`KYC Risk: ${risk.breakdown.kycRisk}/30`, 14, yPos);
    doc.text(`AML Risk: ${risk.breakdown.amlRisk}/40`, 80, yPos);
    doc.text(`Concentration: ${risk.breakdown.concentrationRisk}/30`, 140, yPos);
    yPos += 6;
    doc.text(`High-Risk Accounts: ${risk.highRiskAccounts}`, 14, yPos);
    doc.text(`Unverified Accounts: ${risk.unverifiedAccounts}`, 100, yPos);

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
   * Helper: Calculate risk level based on account holdings and history.
   *
   * Heuristic combining balance exposure with slashing history:
   *  - High:   >= 1M DALLA total, or any recorded slashing span
   *  - Medium: >= 100k DALLA total
   *  - Low:    otherwise
   */
  private async calculateRiskLevel(accountId: string): Promise<'Low' | 'Medium' | 'High'> {
    try {
      const DALLA = BigInt(10 ** 12);
      const HIGH_BALANCE = DALLA * BigInt(1000000); // 1M DALLA
      const MEDIUM_BALANCE = DALLA * BigInt(100000); // 100k DALLA

      const account: any = await this.api.query.system.account(accountId);
      const free = BigInt(account?.data?.free?.toString() || '0');
      const reserved = BigInt(account?.data?.reserved?.toString() || '0');
      const total = free + reserved;

      // Slashing history is a strong negative signal for staked accounts.
      const slashingSpans: any = await this.api.query.staking?.slashingSpans?.(accountId);
      const hasSlashing = !!slashingSpans && !slashingSpans.isNone && !slashingSpans.isEmpty;

      if (hasSlashing || total >= HIGH_BALANCE) return 'High';
      if (total >= MEDIUM_BALANCE) return 'Medium';
      return 'Low';
    } catch (error) {
      console.error('Error calculating risk level:', error);
      return 'Low';
    }
  }

  /**
   * Calculate an aggregate risk score that combines per-account KYC risk levels
   * with AML alert signals into an overall compliance risk assessment.
   *
   * Scoring breakdown (0–100):
   *  - KYC Risk       (0–30): ratio of unverified / high-risk accounts
   *  - AML Risk       (0–40): weighted sum of alert counts relative to transaction volume
   *  - Concentration  (0–30): proportion of high-risk accounts among all accounts
   */
  private calculateAggregateRiskScore(
    kycRecords: KYCRecord[],
    amlAlerts: ComplianceReport['amlAlerts'],
    txSummary: TransactionSummary,
  ): AggregateRiskScore {
    const total = Math.max(kycRecords.length, 1); // avoid division by zero

    // --- KYC Risk (0–30) ---
    const unverifiedAccounts = kycRecords.filter(r => r.kycStatus !== 'Verified').length;
    const rejectedAccounts = kycRecords.filter(r => r.kycStatus === 'Rejected').length;
    // Unverified accounts contribute linearly; rejected accounts are weighted 2×.
    const kycRiskRaw = ((unverifiedAccounts + rejectedAccounts) / total) * 30;
    const kycRisk = Math.min(30, Math.round(kycRiskRaw));

    // --- AML Risk (0–40) ---
    const totalAlerts = amlAlerts.highValueTransactions
      + amlAlerts.rapidTransactions
      + amlAlerts.crossBorderTransactions;
    const txCount = Math.max(txSummary.totalTransactions, 1);
    // Weight: high-value ×3, rapid ×2, cross-border ×1 (structuring & layering are higher risk).
    const weightedAlerts =
      amlAlerts.highValueTransactions * 3 +
      amlAlerts.rapidTransactions * 2 +
      amlAlerts.crossBorderTransactions * 1;
    // Normalize against transaction volume — a few alerts out of thousands is less concerning.
    const alertRatio = Math.min(weightedAlerts / txCount, 1);
    const amlRisk = Math.min(40, Math.round(alertRatio * 40));

    // --- Concentration Risk (0–30) ---
    const highRiskAccounts = kycRecords.filter(r => r.riskLevel === 'High').length;
    const concentrationRatio = highRiskAccounts / total;
    const concentrationRisk = Math.min(30, Math.round(concentrationRatio * 30));

    // --- Composite ---
    const score = kycRisk + amlRisk + concentrationRisk;
    const overall: OverallRiskLevel =
      score >= 70 ? 'Critical' :
      score >= 45 ? 'High' :
      score >= 20 ? 'Medium' :
      'Low';

    return {
      overall,
      score,
      breakdown: { kycRisk, amlRisk, concentrationRisk },
      highRiskAccounts,
      unverifiedAccounts,
    };
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
