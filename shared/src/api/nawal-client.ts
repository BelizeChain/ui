/**
 * Nawal Federated Learning Client
 * Connects BelizeChain UI to Nawal privacy-preserving ML backend
 * 
 * @see /home/wicked/BelizeChain/belizechain/nawal/
 */

export interface NawalConfig {
  apiUrl: string; // Default: http://localhost:8765
  timeout?: number;
}

export interface FLTask {
  taskId: string;
  round: number;
  datasetType: string; // 'census', 'healthcare', 'education', etc.
  modelArchitecture: string;
  targetMetric: string;
  deadline: number; // Unix timestamp
  minParticipants: number;
  currentParticipants: number;
  status: 'active' | 'training' | 'aggregating' | 'completed';
  reward: string; // DALLA amount
}

export interface ModelDelta {
  validatorAddress: string;
  taskId: string;
  round: number;
  weights: ArrayBuffer; // Serialized model weights
  metrics: {
    accuracy?: number;
    loss?: number;
    f1Score?: number;
  };
  privacy: {
    epsilon: number; // Differential privacy parameter
    delta: number;
  };
}

export interface PoUWScore {
  validatorAddress: string;
  taskId: string;
  round: number;
  quality: number; // 0-100 (40% weight)
  timeliness: number; // 0-100 (30% weight)
  honesty: number; // 0-100 (30% weight)
  totalScore: number; // 0-100
  reward: string; // DALLA earned
  timestamp: number;
}

export interface GenomeInfo {
  genomeId: string;
  architecture: {
    layers: number;
    hiddenUnits: number[];
    activations: string[];
  };
  fitness: number;
  generation: number;
  parentGenomes: string[];
  performance: {
    accuracy: number;
    latency: number; // ms
    size: number; // bytes
  };
}

export class NawalClient {
  private config: Required<NawalConfig>;

  constructor(config: NawalConfig) {
    this.config = {
      apiUrl: config.apiUrl,
      timeout: config.timeout || 60000, // FL tasks can be slow
    };
  }

  /**
   * Get active federated learning task
   */
  async getActiveTask(): Promise<FLTask | null> {
    const response = await fetch(`${this.config.apiUrl}/api/v1/tasks/active`, {
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (response.status === 404) {
      return null; // No active task
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch active task: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get task history
   */
  async getTaskHistory(limit = 10): Promise<FLTask[]> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/tasks/history?limit=${limit}`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch task history: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Join federated learning task as validator
   */
  async joinTask(
    taskId: string,
    validatorAddress: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/tasks/${taskId}/join`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ validatorAddress }),
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to join task: ${error}`);
    }

    return response.json();
  }

  /**
   * Submit model delta (trained weights)
   */
  async submitModelDelta(delta: ModelDelta): Promise<{
    success: boolean;
    poUWScore: PoUWScore;
  }> {
    const formData = new FormData();
    formData.append('validatorAddress', delta.validatorAddress);
    formData.append('taskId', delta.taskId);
    formData.append('round', String(delta.round));
    formData.append('weights', new Blob([delta.weights]));
    formData.append('metrics', JSON.stringify(delta.metrics));
    formData.append('privacy', JSON.stringify(delta.privacy));

    const response = await fetch(
      `${this.config.apiUrl}/api/v1/contributions/submit`,
      {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to submit model delta: ${error}`);
    }

    return response.json();
  }

  /**
   * Get PoUW score for validator
   */
  async getPoUWScore(
    validatorAddress: string,
    taskId?: string
  ): Promise<PoUWScore[]> {
    const url = taskId
      ? `${this.config.apiUrl}/api/v1/scores/${validatorAddress}/${taskId}`
      : `${this.config.apiUrl}/api/v1/scores/${validatorAddress}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PoUW score: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get validator statistics
   */
  async getValidatorStats(validatorAddress: string): Promise<{
    totalContributions: number;
    averageQuality: number;
    averageTimeliness: number;
    averageHonesty: number;
    totalRewards: string; // DALLA
    rank: number;
  }> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/validators/${validatorAddress}/stats`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch validator stats: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get evolved genome information
   */
  async getGenomeInfo(genomeId: string): Promise<GenomeInfo> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/genomes/${genomeId}`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch genome info: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List top-performing genomes
   */
  async listTopGenomes(limit = 10): Promise<GenomeInfo[]> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/genomes/top?limit=${limit}`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list genomes: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Download trained model
   */
  async downloadModel(taskId: string, round: number): Promise<Blob> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/models/${taskId}/round/${round}`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download model: ${response.statusText}`);
    }

    return response.blob();
  }
}

// Singleton instance
let nawalClient: NawalClient | null = null;

export function getNawalClient(apiUrl?: string): NawalClient {
  if (!nawalClient) {
    nawalClient = new NawalClient({
      apiUrl: apiUrl || (typeof window !== 'undefined' && (window as any).ENV?.NEXT_PUBLIC_NAWAL_API_URL) || 'http://localhost:8765',
    });
  }
  return nawalClient;
}
