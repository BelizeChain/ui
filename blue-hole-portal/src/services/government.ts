import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';

let apiInstance: ApiPromise | null = null;

export interface TreasuryProposal {
  id: number;
  proposer: string;
  amount: number;
  currency: 'DALLA' | 'bBZD';
  beneficiary: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  approvals: string[]; // Addresses of approvers
  requiredApprovals: number;
  createdAt: Date;
  executedAt?: Date;
}

export interface EmergencyDeclaration {
  id: number;
  type: 'natural-disaster' | 'public-health' | 'security' | 'financial';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  declaredBy: string;
  approvedBy: string[];
  status: 'pending' | 'active' | 'resolved' | 'cancelled';
  declaredAt: Date;
  resolvedAt?: Date;
  affectedDistricts: string[];
  fundingAllocated?: number;
}

export interface ComplianceReport {
  id: string;
  type: 'kyc' | 'aml' | 'transaction-monitoring' | 'audit';
  period: { start: Date; end: Date };
  generatedBy: string;
  summary: {
    totalAccounts: number;
    kycVerified: number;
    flaggedTransactions: number;
    resolvedCases: number;
  };
  status: 'draft' | 'submitted' | 'approved';
  generatedAt: Date;
  fscApproval?: Date;
}

// Initialize Polkadot.js API
export async function initializeGovernmentApi(): Promise<void> {
  if (apiInstance) return;

  const wsProvider = new WsProvider(
    process.env.NEXT_PUBLIC_NODE_ENDPOINT || 'ws://127.0.0.1:9944'
  );
  
  apiInstance = await ApiPromise.create({ provider: wsProvider });
  await apiInstance.isReady;
}

// Get API instance
export function getGovernmentApi(): ApiPromise | null {
  return apiInstance;
}

// Disconnect API
export async function disconnectGovernmentApi(): Promise<void> {
  if (apiInstance) {
    await apiInstance.disconnect();
    apiInstance = null;
  }
}

// Treasury multi-sig operations

export async function getTreasuryProposals(): Promise<TreasuryProposal[]> {
  await initializeGovernmentApi();
  
  if (!apiInstance) {
    return [];
  }

  try {
    // Query economy pallet for pending treasury proposals
    const proposalsRaw = await apiInstance.query.economy?.treasuryProposals.entries();
    
    if (!proposalsRaw || proposalsRaw.length === 0) {
      return [];
    }

    const proposals: TreasuryProposal[] = [];

    for (const [key, value] of proposalsRaw) {
      const proposalId = Number((key.args[0] as any).toString());
      const proposalData = value.toJSON() as any;

      proposals.push({
        id: proposalId,
        proposer: proposalData.proposer,
        amount: proposalData.amount / 1_000_000_000_000, // DALLA decimals
        currency: proposalData.currency || 'DALLA',
        beneficiary: proposalData.beneficiary,
        description: proposalData.description || '',
        status: proposalData.status.toLowerCase(),
        approvals: proposalData.approvals || [],
        requiredApprovals: 4, // 4-of-7 multi-sig
        createdAt: new Date(proposalData.createdAt || Date.now()),
        executedAt: proposalData.executedAt ? new Date(proposalData.executedAt) : undefined,
      });
    }

    return proposals;
  } catch (error) {
    console.error('Failed to query treasury proposals:', error);
    return [];
  }
}

export async function approveTreasuryProposal(
  proposalId: number,
  approverAddress: string
): Promise<{ success: boolean; message: string }> {
  try {
    await initializeGovernmentApi();
    
    if (!apiInstance) {
      throw new Error('API not initialized');
    }

    const injector = await web3FromAddress(approverAddress);
    
    // Call economy.approveTreasuryProposal
    const tx = apiInstance.tx.economy?.approveTreasuryProposal(proposalId);
    
    if (!tx) {
      throw new Error('Treasury approval not available');
    }

    await tx.signAndSend(approverAddress, { signer: injector.signer });
    
    return {
      success: true,
      message: `Approved treasury proposal #${proposalId}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to approve proposal',
    };
  }
}

export async function createTreasuryProposal(
  proposer: string,
  amount: number,
  currency: 'DALLA' | 'bBZD',
  beneficiary: string,
  description: string
): Promise<{ success: boolean; message: string; proposalId?: number }> {
  try {
    await initializeGovernmentApi();
    
    if (!apiInstance) {
      throw new Error('API not initialized');
    }

    const injector = await web3FromAddress(proposer);
    const amountPlanck = BigInt(Math.floor(amount * 1e12));
    
    // Call economy.proposeTreasury
    const tx = apiInstance.tx.economy?.proposeTreasury(
      amountPlanck.toString(),
      currency,
      beneficiary,
      description
    );
    
    if (!tx) {
      throw new Error('Treasury proposal not available');
    }

    await tx.signAndSend(proposer, { signer: injector.signer });
    
    return {
      success: true,
      message: 'Treasury proposal created',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to create proposal',
    };
  }
}

// Emergency declarations

export async function getEmergencyDeclarations(): Promise<EmergencyDeclaration[]> {
  await initializeGovernmentApi();
  
  if (!apiInstance) {
    return [];
  }

  try {
    // Query compliance pallet for emergency declarations
    const emergenciesRaw = await apiInstance.query.compliance?.emergencies.entries();
    
    if (!emergenciesRaw || emergenciesRaw.length === 0) {
      return [];
    }

    const emergencies: EmergencyDeclaration[] = [];

    for (const [key, value] of emergenciesRaw) {
      const emergencyId = Number((key.args[0] as any).toString());
      const emergencyData = value.toJSON() as any;

      emergencies.push({
        id: emergencyId,
        type: emergencyData.type,
        severity: emergencyData.severity,
        description: emergencyData.description,
        declaredBy: emergencyData.declaredBy,
        approvedBy: emergencyData.approvedBy || [],
        status: emergencyData.status,
        declaredAt: new Date(emergencyData.declaredAt),
        resolvedAt: emergencyData.resolvedAt ? new Date(emergencyData.resolvedAt) : undefined,
        affectedDistricts: emergencyData.affectedDistricts || [],
      });
    }

    return emergencies;
  } catch (error) {
    console.error('Failed to query emergency declarations:', error);
    return [];
  }
}

export async function declareEmergency(
  declarerAddress: string,
  type: string,
  severity: string,
  description: string,
  affectedDistricts: string[]
): Promise<{ success: boolean; message: string }> {
  try {
    await initializeGovernmentApi();
    
    if (!apiInstance) {
      throw new Error('API not initialized');
    }

    const injector = await web3FromAddress(declarerAddress);
    
    // Call compliance.declareEmergency
    const tx = apiInstance.tx.compliance?.declareEmergency(
      type,
      severity,
      description,
      affectedDistricts
    );
    
    if (!tx) {
      throw new Error('Emergency declaration not available');
    }

    await tx.signAndSend(declarerAddress, { signer: injector.signer });
    
    return {
      success: true,
      message: 'Emergency declared successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to declare emergency',
    };
  }
}

// FSC Compliance

export async function getComplianceReports(): Promise<ComplianceReport[]> {
  await initializeGovernmentApi();
  
  if (!apiInstance) {
    return [];
  }

  try {
    // Query compliance pallet for reports
    const reportsRaw = await apiInstance.query.compliance?.reports.entries();
    
    if (!reportsRaw || reportsRaw.length === 0) {
      return [];
    }

    const reports: ComplianceReport[] = [];

    for (const [key, value] of reportsRaw) {
      const reportId = key.args[0].toString();
      const reportData = value.toJSON() as any;

      reports.push({
        id: reportId,
        type: reportData.type,
        period: {
          start: new Date(reportData.periodStart),
          end: new Date(reportData.periodEnd),
        },
        generatedBy: reportData.generatedBy,
        summary: {
          totalAccounts: reportData.totalAccounts || 0,
          kycVerified: reportData.kycVerified || 0,
          flaggedTransactions: reportData.flaggedTransactions || 0,
          resolvedCases: reportData.resolvedCases || 0,
        },
        status: reportData.status,
        generatedAt: new Date(reportData.generatedAt),
        fscApproval: reportData.fscApproval ? new Date(reportData.fscApproval) : undefined,
      });
    }

    return reports;
  } catch (error) {
    console.error('Failed to query compliance reports:', error);
    return [];
  }
}

export async function generateComplianceReport(
  generatorAddress: string,
  type: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ success: boolean; message: string; reportId?: string }> {
  try {
    await initializeGovernmentApi();
    
    if (!apiInstance) {
      throw new Error('API not initialized');
    }

    const injector = await web3FromAddress(generatorAddress);
    
    // Call compliance.generateReport
    const tx = apiInstance.tx.compliance?.generateReport(
      type,
      periodStart.getTime(),
      periodEnd.getTime()
    );
    
    if (!tx) {
      throw new Error('Report generation not available');
    }

    await tx.signAndSend(generatorAddress, { signer: injector.signer });
    
    return {
      success: true,
      message: 'Compliance report generation started',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to generate report',
    };
  }
}

// Export a service object for convenient access
export const governmentService = {
  initializeGovernmentApi,
  getTreasuryProposals,
  approveTreasuryProposal,
  createTreasuryProposal,
  getEmergencies: getEmergencyDeclarations,
  declareEmergency,
  getComplianceReports,
  generateComplianceReport,
};
