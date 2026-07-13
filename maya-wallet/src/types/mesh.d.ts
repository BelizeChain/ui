// src/types/mesh.d.ts

/**
 * Core mesh message interface used throughout the application.
 */
export interface MeshMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  ttl: number;
  signature: string;
  route: string[];
}

/**
 * Response from the Pakit upload service.
 */
export interface PakitUploadResponse {
  ipfsHash: string;
  arweaveId?: string;
  size: number;
  timestamp: number;
}

/**
 * Pending proof bundle that has been uploaded to IPFS but not yet submitted on‑chain.
 */
export type PendingProof = PakitUploadResponse & { messages: MeshMessage[] };
