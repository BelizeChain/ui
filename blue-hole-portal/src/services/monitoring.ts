/**
 * External System Monitoring Service
 * Production-grade integration with Nawal AI, Kinich Quantum, and Pakit Storage
 * NO MOCK DATA - All functions query real services
 */

import { blockchainService } from './blockchain';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface BlockchainHealth {
  blockHeight: number;
  finalizedBlock: number;
  peerCount: number;
  syncStatus: 'syncing' | 'synced';
  finalityLag: number;
  transactionsPerSecond: number;
  averageBlockTime: number;
  status: 'operational' | 'degraded' | 'down';
}

export interface TrainingRound {
  roundId: number;
  status: 'active' | 'completed' | 'failed';
  modelAccuracy: number;
  participatingValidators: number;
  startedAt: Date;
  estimatedCompletion?: Date;
}

export interface NawalAIStatus {
  activeRounds: TrainingRound[];
  overallAccuracy: number;
  totalParticipants: number;
  privacyMetrics: {
    epsilon: number;
    delta: number;
    clipNorm: number;
  };
  genomeEvolution: {
    generation: number;
    bestArchitecture: string;
    fitnessScore: number;
  };
  status: 'operational' | 'degraded' | 'down';
}

export interface QuantumJob {
  jobId: string;
  algorithm: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  backend: 'azure' | 'ibm' | 'simulator';
  progress: number;
  estimatedTimeRemaining?: number;
}

export interface KinichQuantumStatus {
  runningJobs: QuantumJob[];
  queueDepth: number;
  successRate: number;
  backends: {
    azure: {
      status: 'online' | 'offline';
      queueTime: number;
    };
    ibm: {
      status: 'online' | 'offline';
      queueTime: number;
    };
  };
  errorMitigation: {
    zneEnabled: boolean;
    readoutCorrectionEnabled: boolean;
    successRate: number;
  };
  status: 'operational' | 'degraded' | 'down';
}

export interface PakitStorageStatus {
  capacityUsed: number; // in bytes
  capacityTotal: number; // in bytes
  deduplicationRatio: number; // e.g., 2.5 means 2.5:1 ratio
  compressionRatio: number; // e.g., 3.2 means 3.2:1 ratio
  ipfs: {
    status: 'online' | 'offline';
    nodeCount: number;
    pinCount: number;
  };
  arweave: {
    status: 'online' | 'offline';
    permanentStorage: number; // in bytes
    estimatedCost: number; // in AR tokens
  };
  status: 'operational' | 'degraded' | 'down';
}

export interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  system: 'blockchain' | 'nawal' | 'kinich' | 'pakit';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

// ============================================================================
// Monitoring Service Class
// ============================================================================

class MonitoringService {
  private nawalEndpoint: string;
  private kinichEndpoint: string;
  private pakitEndpoint: string;
  private alerts: SystemAlert[] = [];

  constructor() {
    this.nawalEndpoint = process.env.NEXT_PUBLIC_NAWAL_ENDPOINT || 'http://localhost:8001';
    this.kinichEndpoint = process.env.NEXT_PUBLIC_KINICH_ENDPOINT || 'http://localhost:8002';
    this.pakitEndpoint = process.env.NEXT_PUBLIC_PAKIT_ENDPOINT || 'http://localhost:8003';
  }

  // ============================================================================
  // Blockchain Monitoring
  // ============================================================================

  /**
   * Get comprehensive blockchain health metrics
   */
  async getBlockchainMetrics(): Promise<BlockchainHealth> {
    try {
      const metrics = await blockchainService.getMetrics();
      
      // Calculate transactions per second (estimate from recent blocks)
      const transactionsPerSecond = metrics.transactionsInBlock / 6; // Assuming 6s block time

      // Calculate average block time (6 seconds target for Substrate)
      const averageBlockTime = 6;

      // Determine status based on metrics
      let status: 'operational' | 'degraded' | 'down' = 'operational';
      
      if (metrics.syncStatus === 'syncing') {
        status = 'degraded';
      }
      
      if (metrics.finalityLag > 10) {
        status = 'degraded';
      }
      
      if (metrics.peerCount < 5) {
        status = 'degraded';
      }

      const health: BlockchainHealth = {
        blockHeight: metrics.blockHeight,
        finalizedBlock: metrics.finalizedBlock,
        peerCount: metrics.peerCount,
        syncStatus: metrics.syncStatus,
        finalityLag: metrics.finalityLag,
        transactionsPerSecond,
        averageBlockTime,
        status,
      };

      // Generate alerts if needed
      this.checkBlockchainAlerts(health);

      return health;
    } catch (error) {
      console.error('Failed to get blockchain metrics:', error);
      
      // Generate critical alert
      this.addAlert({
        severity: 'critical',
        system: 'blockchain',
        message: 'Failed to connect to blockchain node',
      });

      return {
        blockHeight: 0,
        finalizedBlock: 0,
        peerCount: 0,
        syncStatus: 'syncing',
        finalityLag: 0,
        transactionsPerSecond: 0,
        averageBlockTime: 6,
        status: 'down',
      };
    }
  }

  private checkBlockchainAlerts(health: BlockchainHealth): void {
    if (health.finalityLag > 20) {
      this.addAlert({
        severity: 'warning',
        system: 'blockchain',
        message: `High finality lag: ${health.finalityLag} blocks`,
      });
    }

    if (health.peerCount < 5) {
      this.addAlert({
        severity: 'warning',
        system: 'blockchain',
        message: `Low peer count: ${health.peerCount}`,
      });
    }
  }

  // ============================================================================
  // Nawal AI Monitoring
  // ============================================================================

  /**
   * Get Nawal federated learning status
   */
  async getNawalStatus(): Promise<NawalAIStatus> {
    try {
      const response = await fetch(`${this.nawalEndpoint}/api/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Nawal API returned ${response.status}`);
      }

      const data = await response.json();

      const status: NawalAIStatus = {
        activeRounds: data.active_rounds?.map((round: any) => ({
          roundId: round.round_id,
          status: round.status,
          modelAccuracy: round.model_accuracy || 0,
          participatingValidators: round.participating_validators || 0,
          startedAt: new Date(round.started_at),
          estimatedCompletion: round.estimated_completion 
            ? new Date(round.estimated_completion) 
            : undefined,
        })) || [],
        overallAccuracy: data.overall_accuracy || 0,
        totalParticipants: data.total_participants || 0,
        privacyMetrics: {
          epsilon: data.privacy_metrics?.epsilon || 0,
          delta: data.privacy_metrics?.delta || 0,
          clipNorm: data.privacy_metrics?.clip_norm || 0,
        },
        genomeEvolution: {
          generation: data.genome_evolution?.generation || 0,
          bestArchitecture: data.genome_evolution?.best_architecture || 'unknown',
          fitnessScore: data.genome_evolution?.fitness_score || 0,
        },
        status: data.status || 'operational',
      };

      this.checkNawalAlerts(status);

      return status;
    } catch (error) {
      console.error('Failed to get Nawal status:', error);
      
      this.addAlert({
        severity: 'critical',
        system: 'nawal',
        message: 'Failed to connect to Nawal AI service',
      });

      return {
        activeRounds: [],
        overallAccuracy: 0,
        totalParticipants: 0,
        privacyMetrics: { epsilon: 0, delta: 0, clipNorm: 0 },
        genomeEvolution: { generation: 0, bestArchitecture: 'unknown', fitnessScore: 0 },
        status: 'down',
      };
    }
  }

  private checkNawalAlerts(status: NawalAIStatus): void {
    if (status.overallAccuracy < 0.8) {
      this.addAlert({
        severity: 'warning',
        system: 'nawal',
        message: `Low model accuracy: ${(status.overallAccuracy * 100).toFixed(1)}%`,
      });
    }

    const failedRounds = status.activeRounds.filter(r => r.status === 'failed');
    if (failedRounds.length > 0) {
      this.addAlert({
        severity: 'warning',
        system: 'nawal',
        message: `${failedRounds.length} training rounds failed`,
      });
    }
  }

  // ============================================================================
  // Kinich Quantum Monitoring
  // ============================================================================

  /**
   * Get Kinich quantum computing status
   */
  async getKinichStatus(): Promise<KinichQuantumStatus> {
    try {
      const response = await fetch(`${this.kinichEndpoint}/api/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Kinich API returned ${response.status}`);
      }

      const data = await response.json();

      const status: KinichQuantumStatus = {
        runningJobs: data.running_jobs?.map((job: any) => ({
          jobId: job.job_id,
          algorithm: job.algorithm,
          status: job.status,
          backend: job.backend,
          progress: job.progress || 0,
          estimatedTimeRemaining: job.estimated_time_remaining,
        })) || [],
        queueDepth: data.queue_depth || 0,
        successRate: data.success_rate || 0,
        backends: {
          azure: {
            status: data.backends?.azure?.status || 'offline',
            queueTime: data.backends?.azure?.queue_time || 0,
          },
          ibm: {
            status: data.backends?.ibm?.status || 'offline',
            queueTime: data.backends?.ibm?.queue_time || 0,
          },
        },
        errorMitigation: {
          zneEnabled: data.error_mitigation?.zne_enabled || false,
          readoutCorrectionEnabled: data.error_mitigation?.readout_correction_enabled || false,
          successRate: data.error_mitigation?.success_rate || 0,
        },
        status: data.status || 'operational',
      };

      this.checkKinichAlerts(status);

      return status;
    } catch (error) {
      console.error('Failed to get Kinich status:', error);
      
      this.addAlert({
        severity: 'critical',
        system: 'kinich',
        message: 'Failed to connect to Kinich quantum service',
      });

      return {
        runningJobs: [],
        queueDepth: 0,
        successRate: 0,
        backends: {
          azure: { status: 'offline', queueTime: 0 },
          ibm: { status: 'offline', queueTime: 0 },
        },
        errorMitigation: {
          zneEnabled: false,
          readoutCorrectionEnabled: false,
          successRate: 0,
        },
        status: 'down',
      };
    }
  }

  private checkKinichAlerts(status: KinichQuantumStatus): void {
    if (status.queueDepth > 50) {
      this.addAlert({
        severity: 'warning',
        system: 'kinich',
        message: `High job queue depth: ${status.queueDepth}`,
      });
    }

    if (status.successRate < 0.7) {
      this.addAlert({
        severity: 'warning',
        system: 'kinich',
        message: `Low success rate: ${(status.successRate * 100).toFixed(1)}%`,
      });
    }

    if (status.backends.azure.status === 'offline' && status.backends.ibm.status === 'offline') {
      this.addAlert({
        severity: 'critical',
        system: 'kinich',
        message: 'All quantum backends offline',
      });
    }
  }

  // ============================================================================
  // Pakit Storage Monitoring
  // ============================================================================

  /**
   * Get Pakit decentralized storage status
   */
  async getPakitStatus(): Promise<PakitStorageStatus> {
    try {
      const response = await fetch(`${this.pakitEndpoint}/api/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Pakit API returned ${response.status}`);
      }

      const data = await response.json();

      const status: PakitStorageStatus = {
        capacityUsed: data.capacity_used || 0,
        capacityTotal: data.capacity_total || 0,
        deduplicationRatio: data.deduplication_ratio || 1,
        compressionRatio: data.compression_ratio || 1,
        ipfs: {
          status: data.ipfs?.status || 'offline',
          nodeCount: data.ipfs?.node_count || 0,
          pinCount: data.ipfs?.pin_count || 0,
        },
        arweave: {
          status: data.arweave?.status || 'offline',
          permanentStorage: data.arweave?.permanent_storage || 0,
          estimatedCost: data.arweave?.estimated_cost || 0,
        },
        status: data.status || 'operational',
      };

      this.checkPakitAlerts(status);

      return status;
    } catch (error) {
      console.error('Failed to get Pakit status:', error);
      
      this.addAlert({
        severity: 'critical',
        system: 'pakit',
        message: 'Failed to connect to Pakit storage service',
      });

      return {
        capacityUsed: 0,
        capacityTotal: 0,
        deduplicationRatio: 1,
        compressionRatio: 1,
        ipfs: { status: 'offline', nodeCount: 0, pinCount: 0 },
        arweave: { status: 'offline', permanentStorage: 0, estimatedCost: 0 },
        status: 'down',
      };
    }
  }

  private checkPakitAlerts(status: PakitStorageStatus): void {
    const usagePercentage = (status.capacityUsed / status.capacityTotal) * 100;
    
    if (usagePercentage > 95) {
      this.addAlert({
        severity: 'critical',
        system: 'pakit',
        message: `Storage capacity critical: ${usagePercentage.toFixed(1)}% used`,
      });
    } else if (usagePercentage > 85) {
      this.addAlert({
        severity: 'warning',
        system: 'pakit',
        message: `Storage capacity high: ${usagePercentage.toFixed(1)}% used`,
      });
    }

    if (status.ipfs.status === 'offline') {
      this.addAlert({
        severity: 'warning',
        system: 'pakit',
        message: 'IPFS backend offline',
      });
    }
  }

  // ============================================================================
  // Alert Management
  // ============================================================================

  private addAlert(alert: Omit<SystemAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    // Check if similar alert already exists (within last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const existingAlert = this.alerts.find(
      a => a.system === alert.system && 
           a.message === alert.message && 
           a.timestamp.getTime() > fiveMinutesAgo
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const newAlert: SystemAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...alert,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.unshift(newAlert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }
  }

  /**
   * Get all system alerts
   */
  getAlerts(includeAcknowledged = false): SystemAlert[] {
    if (includeAcknowledged) {
      return [...this.alerts];
    }
    return this.alerts.filter(a => !a.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  // ============================================================================
  // Aggregated Health Check
  // ============================================================================

  /**
   * Get overall system health status
   */
  async getSystemHealth(): Promise<{
    blockchain: BlockchainHealth;
    nawal: NawalAIStatus;
    kinich: KinichQuantumStatus;
    pakit: PakitStorageStatus;
    overallStatus: 'operational' | 'degraded' | 'down';
  }> {
    const [blockchain, nawal, kinich, pakit] = await Promise.all([
      this.getBlockchainMetrics(),
      this.getNawalStatus(),
      this.getKinichStatus(),
      this.getPakitStatus(),
    ]);

    // Determine overall status
    let overallStatus: 'operational' | 'degraded' | 'down' = 'operational';
    
    if ([blockchain.status, nawal.status, kinich.status, pakit.status].includes('down')) {
      overallStatus = 'down';
    } else if ([blockchain.status, nawal.status, kinich.status, pakit.status].includes('degraded')) {
      overallStatus = 'degraded';
    }

    return {
      blockchain,
      nawal,
      kinich,
      pakit,
      overallStatus,
    };
  }
}

// Export singleton instance (safe for SSR)
let monitoringServiceInstance: MonitoringService | null = null;

export const monitoringService = (() => {
  if (typeof window === 'undefined') {
    // Return a proxy during SSR that throws meaningful errors
    return new Proxy({} as MonitoringService, {
      get() {
        throw new Error('MonitoringService cannot be used during server-side rendering');
      }
    });
  }
  
  if (!monitoringServiceInstance) {
    monitoringServiceInstance = new MonitoringService();
  }
  
  return monitoringServiceInstance;
})();
