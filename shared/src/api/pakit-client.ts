/**
 * Pakit Storage Client
 * Connects BelizeChain UI to Pakit decentralized storage backend
 * 
 * @see /home/wicked/BelizeChain/belizechain/pakit/
 */

export interface PakitConfig {
  apiUrl: string; // Default: http://localhost:8001
  timeout?: number; // Request timeout in ms
}

export interface UploadOptions {
  compress?: boolean;
  deduplicate?: boolean;
  storage?: 'ipfs' | 'arweave' | 'both';
  encrypt?: boolean;
  tags?: Record<string, string>;
}

export interface UploadResult {
  cid: string; // IPFS CID or Arweave TX ID
  hash: string; // Content hash for blockchain proof
  size: number; // Original size in bytes
  compressedSize?: number; // Compressed size if applicable
  storage: 'ipfs' | 'arweave';
  timestamp: number;
}

export interface DocumentMetadata {
  cid: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: number;
  tags?: Record<string, string>;
  owner: string; // Account address
}

export class PakitClient {
  private config: Required<PakitConfig>;

  constructor(config: PakitConfig) {
    this.config = {
      apiUrl: config.apiUrl,
      timeout: config.timeout || 30000,
    };
  }

  /**
   * Upload file to decentralized storage
   */
  async upload(
    file: File | Blob,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('compress', String(options.compress ?? true));
    formData.append('deduplicate', String(options.deduplicate ?? true));
    formData.append('storage', options.storage || 'ipfs');
    
    if (options.tags) {
      formData.append('tags', JSON.stringify(options.tags));
    }

    const response = await fetch(`${this.config.apiUrl}/api/v1/upload`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pakit upload failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Download file from decentralized storage
   */
  async download(cid: string): Promise<Blob> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/download/${cid}`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Pakit download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Get document metadata
   */
  async getMetadata(cid: string): Promise<DocumentMetadata> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/metadata/${cid}`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List documents owned by an account
   */
  async listDocuments(accountAddress: string): Promise<DocumentMetadata[]> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/documents/${accountAddress}`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list documents: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete document (removes from local cache, permanence depends on storage)
   */
  async delete(cid: string, accountAddress: string): Promise<void> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/delete/${cid}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account: accountAddress }),
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete: ${response.statusText}`);
    }
  }

  /**
   * Generate shareable link
   */
  async generateShareLink(
    cid: string,
    expiresIn?: number
  ): Promise<{ url: string; expiresAt?: number }> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/share/${cid}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn }),
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to generate share link: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get storage statistics
   */
  async getStats(accountAddress: string): Promise<{
    totalFiles: number;
    totalSize: number;
    compressedSize: number;
    ipfsFiles: number;
    arweaveFiles: number;
  }> {
    const response = await fetch(
      `${this.config.apiUrl}/api/v1/stats/${accountAddress}`,
      {
        signal: AbortSignal.timeout(this.config.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`);
    }

    return response.json();
  }
}

// Singleton instance
let pakitClient: PakitClient | null = null;

export function getPakitClient(apiUrl?: string): PakitClient {
  if (!pakitClient) {
    pakitClient = new PakitClient({
      apiUrl: apiUrl || (typeof window !== 'undefined' && (window as any).ENV?.NEXT_PUBLIC_PAKIT_API_URL) || 'http://localhost:8001',
    });
  }
  return pakitClient;
}
