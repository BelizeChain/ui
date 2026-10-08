/**
 * Maya Wallet — Compliance pallet reads (pallet_belize_compliance)
 *
 * The pallet stores per-account status plus flag lists. It does **not** store
 * reserves, liabilities, tier-based transaction limits or exportable
 * certificates — an earlier version of the compliance page read a non-existent
 * `compliance.totalReserves` / `compliance.totalLiabilities` pair and, because
 * that always failed, displayed hardcoded reserve and limit figures instead.
 */

import { initializeApi } from '../blockchain';

export interface ComplianceStatusView {
  verificationLevel: string;
  riskLevel: string;
  whitelisted: boolean;
  restricted: boolean;
  /** Block-derived timestamp recorded by the pallet. */
  lastVerification: number;
}

/**
 * Read `compliance.complianceStatusOf(account)`.
 * Returns `null` when the account has no compliance record.
 */
export async function getComplianceStatus(
  address: string,
): Promise<ComplianceStatusView | null> {
  try {
    const api = await initializeApi();
    if (!api.query.compliance?.complianceStatusOf) return null;

    const raw = (await api.query.compliance.complianceStatusOf(address)) as any;
    if (!raw || raw.isNone) return null;

    const data = (raw.toJSON?.() ?? raw.unwrap?.().toJSON?.()) as
      | Record<string, unknown>
      | null;

    if (!data) return null;

    return {
      verificationLevel: String(data.verificationLevel ?? ''),
      riskLevel: String(data.riskLevel ?? ''),
      whitelisted: Boolean(data.whitelisted),
      restricted: Boolean(data.restricted),
      lastVerification: Number(data.lastVerification ?? 0),
    };
  } catch (error) {
    console.error('Failed to read compliance status:', error);
    return null;
  }
}

export interface RestrictionView {
  restricted: boolean;
  reason: string;
}

/**
 * Read `compliance.restrictedAccounts(account)`, a `(bool, Vec<u8>)` entry.
 * Returns `null` when the account has no entry, so callers can distinguish
 * "not restricted" from "unknown".
 */
export async function getAccountRestriction(
  address: string,
): Promise<RestrictionView | null> {
  try {
    const api = await initializeApi();
    if (!api.query.compliance?.restrictedAccounts) return null;

    const raw = (await api.query.compliance.restrictedAccounts(address)) as any;
    if (!raw || raw.isNone) return null;

    const decoded = raw.toJSON?.() as [boolean, unknown] | null;
    if (!Array.isArray(decoded)) return null;

    return {
      restricted: Boolean(decoded[0]),
      reason: decodeReason(decoded[1]),
    };
  } catch (error) {
    console.error('Failed to read restricted-account entry:', error);
    return null;
  }
}

/**
 * The reason is a `Vec<u8>`; `toJSON()` renders it as a byte array. Decode it
 * with `TextDecoder` and fall back to an empty string on malformed UTF-8.
 */
function decodeReason(raw: unknown): string {
  if (!Array.isArray(raw) || raw.length === 0) return '';
  try {
    return new TextDecoder().decode(new Uint8Array(raw as number[]));
  } catch {
    return '';
  }
}
