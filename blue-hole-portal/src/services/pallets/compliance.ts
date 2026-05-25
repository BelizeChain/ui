/**
 * Compliance pallet integration for Blue Hole Portal.
 *
 * Wraps `pallet_belize_compliance` (runtime index 23). The pallet stores a
 * `ComplianceStatus` per account and exposes mutation extrinsics that require
 * `TechnicalCouncilSuperMajority` origin — they are NOT citizen-callable from
 * a browser extension. This service therefore only exposes read paths used
 * by the FSC oversight dashboard.
 *
 * Citizen-facing KYC application intake is intentionally NOT modelled here:
 * the chain has no "application queue" storage map; document collection
 * lives in an off-chain backend that is not yet implemented.
 */

import { connectionManager } from '@/lib/blockchain/connection';

export type VerificationLevel =
  | 'None'
  | 'Basic'
  | 'Standard'
  | 'Enhanced'
  | 'Government';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Prohibited';

export interface ComplianceRecord {
  address: string;
  verificationLevel: VerificationLevel;
  riskLevel: RiskLevel;
  whitelisted: boolean;
  restricted: boolean;
  lastVerification: number; // unix seconds, 0 if never verified
}

export interface ComplianceStats {
  totalVerified: number;
  totalRestricted: number;
  totalSanctioned: number;
  totalAuditRecords: number;
}

type CodecWithToHuman = { toHuman: () => unknown; toString: () => string };
type StatusCodec = {
  verification_level?: CodecWithToHuman;
  verificationLevel?: CodecWithToHuman;
  risk_level?: CodecWithToHuman;
  riskLevel?: CodecWithToHuman;
  whitelisted?: { isTrue?: boolean; valueOf: () => boolean; toString: () => string };
  restricted?: { isTrue?: boolean; valueOf: () => boolean; toString: () => string };
  last_verification?: { toNumber: () => number };
  lastVerification?: { toNumber: () => number };
};

function parseVerificationLevel(value: unknown): VerificationLevel {
  const s = typeof value === 'string' ? value : String(value ?? '');
  if (s === 'Basic' || s === 'Standard' || s === 'Enhanced' || s === 'Government') {
    return s;
  }
  return 'None';
}

function parseRiskLevel(value: unknown): RiskLevel {
  const s = typeof value === 'string' ? value : String(value ?? '');
  if (s === 'Medium' || s === 'High' || s === 'Prohibited') return s;
  return 'Low';
}

function parseBool(codec: { toString: () => string } | undefined): boolean {
  if (!codec) return false;
  const s = codec.toString();
  return s === 'true' || s === 'True';
}

/**
 * Fetch compliance records for every account that has a stored status entry.
 */
export async function getComplianceRecords(): Promise<ComplianceRecord[]> {
  const api = await connectionManager.connect();
  const query = (api.query as Record<string, Record<string, unknown>>).compliance;
  if (!query || typeof query.complianceStatusOf !== 'function') {
    return [];
  }
  const statusOf = query.complianceStatusOf as unknown as {
    entries: () => Promise<Array<[{ args: { toString(): string }[] }, unknown]>>;
  };
  const entries = await statusOf.entries();

  const records: ComplianceRecord[] = entries.map(([key, raw]) => {
    const address = key.args[0].toString();
    const status = raw as StatusCodec;
    const verification = (status.verification_level ?? status.verificationLevel)?.toHuman();
    const risk = (status.risk_level ?? status.riskLevel)?.toHuman();
    const last = (status.last_verification ?? status.lastVerification)?.toNumber?.() ?? 0;
    return {
      address,
      verificationLevel: parseVerificationLevel(verification),
      riskLevel: parseRiskLevel(risk),
      whitelisted: parseBool(status.whitelisted),
      restricted: parseBool(status.restricted),
      lastVerification: last,
    };
  });

  return records;
}

/**
 * Read aggregate counters published by the pallet.
 *
 * Storage shape: `ComplianceStats: (u32, u32, u32, u32)` —
 * (verified, restricted, sanctioned, audit_records).
 */
export async function getComplianceStats(): Promise<ComplianceStats> {
  const api = await connectionManager.connect();
  const query = (api.query as Record<string, Record<string, unknown>>).compliance;
  if (!query || typeof query.complianceStats !== 'function') {
    return { totalVerified: 0, totalRestricted: 0, totalSanctioned: 0, totalAuditRecords: 0 };
  }
  const statsFn = query.complianceStats as unknown as () => Promise<
    | [{ toNumber(): number }, { toNumber(): number }, { toNumber(): number }, { toNumber(): number }]
    | undefined
  >;
  const raw = await statsFn();
  if (!raw) {
    return { totalVerified: 0, totalRestricted: 0, totalSanctioned: 0, totalAuditRecords: 0 };
  }
  return {
    totalVerified: raw[0].toNumber(),
    totalRestricted: raw[1].toNumber(),
    totalSanctioned: raw[2].toNumber(),
    totalAuditRecords: raw[3].toNumber(),
  };
}
