/**
 * BelizeChain Quantum Pallet Integration
 * Handles quantum workload orchestration via Kinich backend
 */

import { ApiPromise } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';

export interface QuantumJob {
  jobId: string;
  submitter: string;
  circuit: string; // QASM or circuit description
  backend: 'Azure' | 'IBM' | 'Simulator';
  shots: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Queued' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';
  submittedAt: number;
  startedAt?: number;
  completedAt?: number;
  cost: string; // DALLA cost
  results?: QuantumResult;
  errorMessage?: string;
}

export interface QuantumResult {
  counts: Record<string, number>; // Measurement results
  executionTime: number; // Milliseconds
  qubitsUsed: number;
  circuitDepth: number;
  errorMitigation?: {
    method: 'ZNE' | 'ReadoutCorrection' | 'None';
    applied: boolean;
  };
  metadata?: Record<string, any>;
}

export interface QuantumWorkProof {
  proofId: string;
  jobId: string;
  submitter: string;
  workHash: string; // Hash of quantum computation
  reward: string; // DALLA reward for PQW
  timestamp: number;
  verificationStatus: 'Pending' | 'Verified' | 'Rejected';
}

export interface QuantumBackend {
  name: string;
  provider: 'Azure' | 'IBM' | 'Local';
  qubits: number;
  status: 'Available' | 'Busy' | 'Maintenance' | 'Offline';
  queueLength: number;
  averageWaitTime: number; // Minutes
  costPerShot: string; // DALLA per shot
  features: string[]; // e.g., ['ErrorMitigation', 'HighFidelity']
}

/**
 * Get available quantum backends
 */
export async function getQuantumBackends(): Promise<QuantumBackend[]> {
  const api = await initializeApi();
  
  try {
    const backends: any = await api.query.quantum?.backends.entries();
    
    if (!backends || backends.length === 0) {
      return [];
    }

    return backends.map(([key, value]: [any, any]) => {
      const name = key.args[0].toString();
      const data = value.unwrap();
      
      return {
        name,
        provider: data.provider.toString() as any,
        qubits: data.qubits.toNumber(),
        status: data.status.toString() as any,
        queueLength: data.queueLength.toNumber(),
        averageWaitTime: data.averageWaitTime.toNumber(),
        costPerShot: formatBalance(data.costPerShot.toString()),
        features: data.features.toHuman() as string[],
      };
    });
  } catch (error) {
    console.error('Failed to fetch quantum backends:', error);
    return [];
  }
}

/**
 * Submit quantum job
 */
export async function submitQuantumJob(
  address: string,
  circuit: string,
  backend: string,
  shots: number = 1024,
  priority: 'Low' | 'Medium' | 'High' = 'Medium'
): Promise<{ hash: string; jobId: string; estimatedCost: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    
    const tx = api.tx.quantum.submitJob(
      circuit,
      backend,
      shots,
      priority
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let jobId = '';
          let estimatedCost = '0.00';
          
          events.forEach(({ event }) => {
            if (api.events.quantum?.JobSubmitted?.is(event)) {
              const [, id, cost] = event.data;
              jobId = id.toString();
              estimatedCost = formatBalance(cost.toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            jobId,
            estimatedCost,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Submit quantum job failed:', error);
    throw error;
  }
}

/**
 * Get quantum job status and results
 */
export async function getQuantumJob(jobId: string): Promise<QuantumJob | null> {
  const api = await initializeApi();
  
  try {
    const job: any = await api.query.quantum?.jobs(jobId);
    
    if (!job || job.isNone) {
      return null;
    }

    const data = job.unwrap();
    
    return {
      jobId,
      submitter: data.submitter.toString(),
      circuit: data.circuit.toString(),
      backend: data.backend.toString() as any,
      shots: data.shots.toNumber(),
      priority: data.priority.toString() as any,
      status: data.status.toString() as any,
      submittedAt: data.submittedAt.toNumber(),
      startedAt: data.startedAt?.toNumber(),
      completedAt: data.completedAt?.toNumber(),
      cost: formatBalance(data.cost.toString()),
      results: data.results?.toHuman() as QuantumResult,
      errorMessage: data.errorMessage?.toString(),
    };
  } catch (error) {
    console.error('Failed to fetch quantum job:', error);
    return null;
  }
}

/**
 * Get user's quantum job history
 */
export async function getUserQuantumJobs(
  address: string,
  limit: number = 50
): Promise<QuantumJob[]> {
  const api = await initializeApi();
  
  try {
    const allJobs: any = await api.query.quantum?.jobs.entries();
    
    if (!allJobs || allJobs.length === 0) {
      return [];
    }

    return allJobs
      .filter(([, value]: [any, any]) => {
        const data = value.unwrap();
        return data.submitter.toString() === address;
      })
      .map(([key, value]: [any, any]) => {
        const jobId = key.args[0].toString();
        const data = value.unwrap();
        
        return {
          jobId,
          submitter: data.submitter.toString(),
          circuit: data.circuit.toString(),
          backend: data.backend.toString() as any,
          shots: data.shots.toNumber(),
          priority: data.priority.toString() as any,
          status: data.status.toString() as any,
          submittedAt: data.submittedAt.toNumber(),
          startedAt: data.startedAt?.toNumber(),
          completedAt: data.completedAt?.toNumber(),
          cost: formatBalance(data.cost.toString()),
          results: data.results?.toHuman() as QuantumResult,
          errorMessage: data.errorMessage?.toString(),
        };
      })
      .sort((a: { submittedAt: number }, b: { submittedAt: number }) => b.submittedAt - a.submittedAt)
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch user quantum jobs:', error);
    return [];
  }
}

/**
 * Cancel quantum job (if not started)
 */
export async function cancelQuantumJob(
  address: string,
  jobId: string
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.quantum.cancelJob(jobId);

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Cancel quantum job failed:', error);
    throw error;
  }
}

/**
 * Get Proof of Quantum Work (PQW) history
 */
export async function getQuantumWorkProofs(
  address: string,
  limit: number = 20
): Promise<QuantumWorkProof[]> {
  const api = await initializeApi();
  
  try {
    const proofs: any = await api.query.quantum?.workProofs.entries(address);
    
    if (!proofs || proofs.length === 0) {
      return [];
    }

    return proofs
      .map(([key, value]: [any, any]) => {
        const proofId = key.args[1].toString();
        const data = value.unwrap();
        
        return {
          proofId,
          jobId: data.jobId.toString(),
          submitter: address,
          workHash: data.workHash.toString(),
          reward: formatBalance(data.reward.toString()),
          timestamp: data.timestamp.toNumber(),
          verificationStatus: data.status.toString() as any,
        };
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch quantum work proofs:', error);
    return [];
  }
}

/**
 * Claim PQW reward for completed quantum job
 */
export async function claimQuantumReward(
  address: string,
  jobId: string
): Promise<{ hash: string; reward: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.quantum.claimReward(jobId);

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let reward = '0.00';
          
          events.forEach(({ event }) => {
            if (api.events.quantum?.RewardClaimed?.is(event)) {
              const [, , amount] = event.data;
              reward = formatBalance(amount.toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            reward,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Claim quantum reward failed:', error);
    throw error;
  }
}

/**
 * Estimate quantum job cost
 */
export async function estimateQuantumCost(
  backend: string,
  shots: number
): Promise<{ cost: string; estimatedTime: number }> {
  const api = await initializeApi();
  
  try {
    const backendData: any = await api.query.quantum?.backends(backend);
    
    if (!backendData || backendData.isNone) {
      throw new Error('Backend not found');
    }

    const data = backendData.unwrap();
    const costPerShot = parseFloat(formatBalance(data.costPerShot.toString()));
    const cost = (costPerShot * shots).toFixed(2);
    const estimatedTime = data.averageWaitTime.toNumber();

    return {
      cost,
      estimatedTime,
    };
  } catch (error) {
    console.error('Failed to estimate quantum cost:', error);
    return {
      cost: '0.00',
      estimatedTime: 0,
    };
  }
}

/**
 * Get quantum statistics for user
 */
export async function getQuantumStats(address: string): Promise<{
  totalJobs: number;
  completedJobs: number;
  totalCost: string;
  totalRewards: string;
  averageExecutionTime: number;
  favoriteBackend: string;
}> {
  const jobs = await getUserQuantumJobs(address, 1000);
  const proofs = await getQuantumWorkProofs(address, 1000);

  const completedJobs = jobs.filter(j => j.status === 'Completed').length;
  const totalCost = jobs.reduce((sum, j) => sum + parseFloat(j.cost), 0);
  const totalRewards = proofs.reduce((sum, p) => sum + parseFloat(p.reward), 0);
  
  const executionTimes = jobs
    .filter(j => j.results?.executionTime)
    .map(j => j.results!.executionTime);
  const averageExecutionTime = executionTimes.length > 0
    ? executionTimes.reduce((sum, t) => sum + t, 0) / executionTimes.length
    : 0;

  // Find most used backend
  const backendCounts: Record<string, number> = {};
  jobs.forEach(j => {
    backendCounts[j.backend] = (backendCounts[j.backend] || 0) + 1;
  });
  const favoriteBackend = Object.entries(backendCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

  return {
    totalJobs: jobs.length,
    completedJobs,
    totalCost: totalCost.toFixed(2),
    totalRewards: totalRewards.toFixed(2),
    averageExecutionTime: Math.round(averageExecutionTime),
    favoriteBackend,
  };
}

/**
 * Validate QASM circuit format
 */
export function validateQASM(circuit: string): { valid: boolean; error?: string } {
  // Basic QASM validation
  if (!circuit.trim()) {
    return { valid: false, error: 'Circuit cannot be empty' };
  }

  if (!circuit.includes('OPENQASM')) {
    return { valid: false, error: 'Circuit must start with OPENQASM version' };
  }

  if (!circuit.includes('qreg')) {
    return { valid: false, error: 'Circuit must declare quantum registers' };
  }

  if (!circuit.includes('creg') && !circuit.includes('measure')) {
    return { valid: false, error: 'Circuit should include measurements' };
  }

  return { valid: true };
}

/**
 * Generate simple quantum circuit template
 */
export function generateCircuitTemplate(qubits: number, type: 'Bell' | 'GHZ' | 'Random'): string {
  switch (type) {
    case 'Bell':
      return `OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0], q[1];
measure q -> c;`;

    case 'GHZ':
      const ghzQubits = Math.max(2, qubits);
      let ghz = `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[${ghzQubits}];\ncreg c[${ghzQubits}];\n`;
      ghz += `h q[0];\n`;
      for (let i = 1; i < ghzQubits; i++) {
        ghz += `cx q[0], q[${i}];\n`;
      }
      ghz += `measure q -> c;`;
      return ghz;

    case 'Random':
      let random = `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[${qubits}];\ncreg c[${qubits}];\n`;
      for (let i = 0; i < qubits; i++) {
        random += `h q[${i}];\n`;
      }
      random += `measure q -> c;`;
      return random;

    default:
      return '';
  }
}

/**
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}
