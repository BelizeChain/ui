/**
 * Maya Wallet — Treasury Integration
 *
 * The BelizeChain runtime does NOT register `pallet_treasury`. Treasury funds
 * live in the sovereign account derived from `TreasuryPalletId = b"py/trsry"`
 * (runtime/src/lib.rs:660), and "treasury spend proposals" are governance
 * proposals of type `TreasurySpend` in `pallet_belize_governance`. This
 * module mirrors blue-hole-portal's treasury service for Maya Wallet pages.
 */

import { stringToU8a, u8aConcat, u8aToHex } from '@polkadot/util';
import { encodeAddress } from '@polkadot/util-crypto';
import { initializeApi } from '../blockchain';
import { getActiveProposals } from './governance';

/** SS58 prefix configured on the BelizeChain runtime (runtime/src/lib.rs:262). */
export const BELIZECHAIN_SS58_PREFIX = 1981;

/** PalletId bytes for the main treasury (`b"py/trsry"`). */
const TREASURY_PALLET_ID = stringToU8a('py/trsry');

/**
 * Derive the treasury SS58 address from its PalletId. Substrate prefixes
 * pallet-derived accounts with `b"modl"` and zero-pads to 32 bytes
 * (`PalletId::into_account_truncating` on the runtime side).
 */
function deriveTreasuryAddress(): string {
  const prefix = stringToU8a('modl');
  const seed = u8aConcat(prefix, TREASURY_PALLET_ID);
  const padded = new Uint8Array(32);
  padded.set(seed.subarray(0, Math.min(seed.length, 32)));
  return encodeAddress(padded, BELIZECHAIN_SS58_PREFIX);
}

/** Public so callers can show the address in the UI for transparency. */
export const TREASURY_ADDRESS = deriveTreasuryAddress();
/** Hex form retained for logging/debug. */
export const TREASURY_ADDRESS_HEX = u8aToHex(
  (() => {
    const padded = new Uint8Array(32);
    padded.set(u8aConcat(stringToU8a('modl'), TREASURY_PALLET_ID));
    return padded;
  })(),
);

export interface TreasuryBalance {
  freePlanck: string;
  freeDalla: string;
  reservedPlanck: string;
}

function planckToDalla(planck: string): string {
  try {
    const value = BigInt(planck);
    const whole = value / 1_000_000_000_000n;
    const frac = value % 1_000_000_000_000n;
    const fracStr = frac.toString().padStart(12, '0').slice(0, 2);
    return `${whole.toString()}.${fracStr}`;
  } catch {
    return '0';
  }
}

/** Read the treasury account's `system.account` entry. Zeros on error. */
export async function getTreasuryBalance(): Promise<TreasuryBalance> {
  try {
    const api = await initializeApi();
    const accountRaw: unknown = await api.query.system.account(TREASURY_ADDRESS);
    const account = accountRaw as {
      data?: {
        free?: { toString(): string };
        reserved?: { toString(): string };
      };
    };
    const freePlanck = account?.data?.free?.toString?.() ?? '0';
    const reservedPlanck = account?.data?.reserved?.toString?.() ?? '0';
    return { freePlanck, freeDalla: planckToDalla(freePlanck), reservedPlanck };
  } catch (error) {
    console.error('Failed to read treasury balance:', error);
    return { freePlanck: '0', freeDalla: '0', reservedPlanck: '0' };
  }
}

export interface TreasurySpendProposalView {
  id: number;
  title: string;
  description: string;
  proposer: string;
  beneficiary: string;
  amountDalla: string;
  status: string;
  createdAt: number;
  voteEnd: number;
  voteCount: { ayes: number; nays: number };
}

/**
 * List active governance proposals filtered down to treasury-spend ones.
 * Re-projects the governance fetch rather than issuing duplicate entries().
 */
export async function getTreasurySpendProposals(): Promise<TreasurySpendProposalView[]> {
  const all = await getActiveProposals();
  return all
    .filter((p) => p.category === 'Treasury' || p.value !== '0' || p.beneficiary !== '')
    .map((p) => ({
      id: p.index,
      title: p.title,
      description: p.description,
      proposer: p.proposer,
      beneficiary: p.beneficiary,
      amountDalla: p.value,
      status: p.status,
      createdAt: p.createdAt,
      voteEnd: p.voteEnd,
      voteCount: p.voteCount,
    }));
}
