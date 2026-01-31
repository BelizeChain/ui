'use client';

import { useState, useEffect } from 'react';
import { useBlockchain } from '@/lib/blockchain/hooks';

export interface KYCApplication {
  id: number;
  applicant: string;
  accountType: 'Citizen' | 'Business' | 'Tourism';
  kycLevel: 'Basic' | 'Standard' | 'Enhanced';
  status: 'Pending' | 'Approved' | 'Rejected' | 'UnderReview';
  riskScore: number; // 0-100
  submittedAt: number;
  reviewedAt?: number;
  reviewer?: string;
  ssnVerified: boolean;
  passportVerified: boolean;
  addressVerified: boolean;
  fullName: string;
  email: string;
  district: string;
}

export interface ComplianceStats {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  averageRiskScore: number;
  averageProcessingTime: number; // in hours
}

export interface VerificationStatus {
  ssn: boolean;
  passport: boolean;
  address: boolean;
  businessRegistration: boolean;
}

/**
 * Hook for Compliance pallet queries
 * Provides KYC applications, risk scores, verification status
 */
export function useCompliance() {
  const { api, isConnected } = useBlockchain();
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api || !isConnected) {
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const fetchComplianceData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Query application count
        const appCount = await api.query.belizeCompliance?.applicationCount();
        const count = appCount ? parseInt(appCount.toString()) : 0;

        // Fetch all applications
        const appPromises = [];
        for (let i = 0; i < count; i++) {
          appPromises.push(api.query.belizeCompliance?.kycApplications(i));
        }

        const appResults = await Promise.all(appPromises);
        const parsedApps = appResults
          .map((result: any, index) => {
            if (!result) return null;
            const app = result.isSome ? result.unwrap() : result;
            if (!app || !app.applicant) return null;

            return {
              id: index,
              applicant: app.applicant.toString(),
              accountType: app.accountType.toString() as 'Citizen' | 'Business' | 'Tourism',
              kycLevel: app.kycLevel.toString() as 'Basic' | 'Standard' | 'Enhanced',
              status: app.status.toString() as any,
              riskScore: app.riskScore ? parseInt(app.riskScore.toString()) : 0,
              submittedAt: app.submittedAt ? parseInt(app.submittedAt.toString()) : Date.now(),
              reviewedAt: app.reviewedAt ? parseInt(app.reviewedAt.toString()) : undefined,
              reviewer: app.reviewer?.toString(),
              ssnVerified: app.ssnVerified?.isTrue || false,
              passportVerified: app.passportVerified?.isTrue || false,
              addressVerified: app.addressVerified?.isTrue || false,
              fullName: app.fullName?.toString() || 'Unknown',
              email: app.email?.toString() || '',
              district: app.district?.toString() || 'Unknown',
            } as KYCApplication;
          })
          .filter((a): a is KYCApplication => a !== null);

        setApplications(parsedApps);

        // Calculate statistics
        const pending = parsedApps.filter(a => a.status === 'Pending' || a.status === 'UnderReview').length;
        const approved = parsedApps.filter(a => a.status === 'Approved').length;
        const rejected = parsedApps.filter(a => a.status === 'Rejected').length;
        const avgRisk = parsedApps.reduce((sum, a) => sum + a.riskScore, 0) / parsedApps.length || 0;

        // Calculate average processing time for reviewed applications
        const reviewed = parsedApps.filter(a => a.reviewedAt);
        const avgTime = reviewed.length > 0
          ? reviewed.reduce((sum, a) => sum + (a.reviewedAt! - a.submittedAt), 0) / reviewed.length / (1000 * 60 * 60)
          : 0;

        setStats({
          totalApplications: parsedApps.length,
          pendingReview: pending,
          approved,
          rejected,
          averageRiskScore: avgRisk,
          averageProcessingTime: avgTime,
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Compliance pallet query error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch compliance data');
        setIsLoading(false);
      }
    };

    fetchComplianceData();

    // Subscribe to application changes
    if (api.query.belizeCompliance?.applicationCount) {
      api.query.belizeCompliance.applicationCount((count: any) => {
        fetchComplianceData(); // Refetch on new applications
      }).then((unsub) => {
        unsubscribe = unsub as any;
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [api, isConnected]);

  return {
    applications,
    stats,
    isLoading,
    error,
    isConnected,
  };
}

/**
 * Hook to get KYC status for specific account
 */
export function useKYCStatus(address: string | null) {
  const { api, isConnected } = useBlockchain();
  const [status, setStatus] = useState<'None' | 'Pending' | 'Approved' | 'Rejected'>('None');
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!api || !isConnected || !address) {
      setStatus('None');
      setVerification(null);
      setIsLoading(false);
      return;
    }

    const fetchKYCStatus = async () => {
      try {
        setIsLoading(true);

        // Query KYC status
        const kycStatus = await api.query.belizeCompliance?.kycStatus(address);
        setStatus(kycStatus ? kycStatus.toString() as any : 'None');

        // Query verification status
        const verificationStatus: any = await api.query.belizeCompliance?.verificationStatus(address);
        if (verificationStatus && verificationStatus.isSome) {
          const vs = verificationStatus.unwrap();
          setVerification({
            ssn: vs.ssn?.isTrue || false,
            passport: vs.passport?.isTrue || false,
            address: vs.address?.isTrue || false,
            businessRegistration: vs.businessRegistration?.isTrue || false,
          });
        } else if (verificationStatus) {
          // Handle non-Option type
          const vs: any = verificationStatus;
          setVerification({
            ssn: vs.ssn?.isTrue || false,
            passport: vs.passport?.isTrue || false,
            address: vs.address?.isTrue || false,
            businessRegistration: vs.businessRegistration?.isTrue || false,
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error('KYC status query error:', err);
        setStatus('None');
        setVerification(null);
        setIsLoading(false);
      }
    };

    fetchKYCStatus();
  }, [api, isConnected, address]);

  return { status, verification, isLoading };
}
