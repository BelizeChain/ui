'use client';

import { useState, useEffect } from 'react';
import { useBlockchain } from '@/lib/blockchain/hooks';
import {
  getComplianceRecords,
  getComplianceStats,
  type ComplianceRecord,
  type ComplianceStats,
} from '@/services/pallets/compliance';

/**
 * Hook for Compliance pallet queries
 * Provides compliance records and statistics using the unified service.
 */
export function useCompliance() {
  const { isConnected } = useBlockchain();
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let timer: NodeJS.Timeout;

    const fetchComplianceData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [fetchedRecords, fetchedStats] = await Promise.all([
          getComplianceRecords(),
          getComplianceStats()
        ]);

        if (!cancelled) {
          setRecords(fetchedRecords);
          setStats(fetchedStats);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Compliance service query error:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch compliance data');
          setIsLoading(false);
        }
      }
    };

    fetchComplianceData();
    timer = setInterval(fetchComplianceData, 30_000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [isConnected]);

  return {
    records,
    stats,
    isLoading,
    error,
    isConnected,
  };
}

