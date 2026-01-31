/**
 * Kinich Quantum Computing Client
 * Connects BelizeChain UI to Kinich hybrid quantum-classical orchestrator
 * 
 * @see /home/wicked/BelizeChain/belizechain/kinich/
 */

export interface KinichConfig {
  apiUrl: string; // Default: http://localhost:8888
  timeout?: number;
}

export type QuantumBackend = 'azure-quantum' | 'ibm-quantum' | 'aws-braket' | 'spinq';

export interface QuantumJob {
  jobId: string;
  submitter: string; // Account address
  backend: QuantumBackend;
  circuit: {
    qubits: number;
    gates: number;
    depth: number;
    circuitType: string; // 'optimization', 'simulation', 'cryptography'
  };
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  submittedAt: number;
  completedAt?: number;
  estimatedCost: string; // DALLA
  actualCost?: string;
  results?: QuantumJobResults;
  errorMitigation?: {
    zne: boolean; // Zero-noise extrapolation
    readoutCorrection: boolean;
  };
}

export interface QuantumJobResults {
  counts: Record<string, number>; // Measurement outcomes
  probabilities?: Record<string, number>;
  executionTime: number; // ms
  shots: number;
  backendUsed: QuantumBackend;
  quality: {
    fidelity: number;
    errorRate: number;
  };
}

export interface SubmitJobParams {
  submitterAddress: string;
  circuit: string; // QASM or serialized circuit
  backend: QuantumBackend;
  shots: number;
  errorMitigation?: {
    zne?: boolean;
    readoutCorrection?: boolean;
  };
  priority?: 'low' | 'normal' | 'high';
}

export interface BackendInfo {
  name: QuantumBackend;
  status: 'available' | 'busy' | 'offline';
  qubits: number;
  queueLength: number;
  avgWaitTime: number; // seconds
  costPerShot: string; // DALLA
  capabilities: string[];
  lastUpdate: number;
}

export interface QPUAttestation {
  jobId: string;
  backend: QuantumBackend;
  attestation: {
    signed: boolean;
    signature: string;
    timestamp: number;
    proof: string; // Cryptographic proof of quantum execution
  };
  onChainProof: string; // Hash stored on blockchain
}

export class KinichClient {
  private config: Required<KinichConfig>;

  constructor(config: KinichConfig) {
    this.config = {
      apiUrl: config.apiUrl,
      timeout: config.timeout || 120000, // Quantum jobs can be slow
    };
  }

  /**
   * Submit quantum job
   */
  async submitJob(params: SubmitJobParams): Promise<{ jobId: string }> {
    const response = await fetch(`${this.config.apiUrl}/api/v1/jobs/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to submit job: ${error}`);
    }

    return response.json();
  }

  /**
   * Get job status and results
   */
  async getJob(jobId: string): Promise<QuantumJob> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/jobs/${jobId}`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch job: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List jobs for an account
   */
  async listJobs(
    accountAddress: string,
    limit = 20,
    status?: QuantumJob['status']
  ): Promise<QuantumJob[]> {
    const params = new URLSearchParams({
      account: accountAddress,
      limit: String(limit),
    });

    if (status) {
      params.append('status', status);
    }

    const response = await fetch(
      `${this.config.apiUrl}/api/v1/jobs?${params.toString()}`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list jobs: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Cancel pending job
   */
  async cancelJob(jobId: string, accountAddress: string): Promise<void> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/jobs/${jobId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account: accountAddress }),
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to cancel job: ${response.statusText}`);
    }
  }

  /**
   * Get available quantum backends
   */
  async listBackends(): Promise<BackendInfo[]> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/backends`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list backends: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get QPU attestation for job
   */
  async getAttestation(jobId: string): Promise<QPUAttestation> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/jobs/${jobId}/attestation`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch attestation: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Estimate job cost
   */
  async estimateCost(params: {
    backend: QuantumBackend;
    shots: number;
    qubits: number;
    gates: number;
  }): Promise<{ cost: string; breakdown: Record<string, string> }> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/jobs/estimate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to estimate cost: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get account quantum statistics
   */
  async getAccountStats(accountAddress: string): Promise<{
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalCost: string; // DALLA
    totalShots: number;
    favoriteBackend: QuantumBackend;
    avgExecutionTime: number; // ms
  }> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/accounts/${accountAddress}/stats`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch account stats: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Download job results as file
   */
  async downloadResults(jobId: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/jobs/${jobId}/results?format=${format}`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download results: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Get system-wide statistics
   */
  async getSystemStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    totalShots: number;
    backendUtilization: Record<QuantumBackend, number>; // 0-100%
    avgWaitTime: number; // seconds
  }> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/stats/system`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch system stats: ${response.statusText}`);
    }

    return response.json();
  }
}

// Singleton instance
let kinichClient: KinichClient | null = null;

export function getKinichClient(apiUrl?: string): KinichClient {
  if (!kinichClient) {
    kinichClient = new KinichClient({
      apiUrl: apiUrl || (typeof window !== 'undefined' && (window as any).ENV?.NEXT_PUBLIC_KINICH_API_URL) || 'http://localhost:8888',
    });
  }
  return kinichClient;
}
