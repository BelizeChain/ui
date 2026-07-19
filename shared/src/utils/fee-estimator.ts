/**
 * Fee Estimation Utility
 *
 * Uses `api.tx.*.paymentInfo()` to estimate transaction fees before signing.
 * Works with both Maya Wallet and Blue Hole Portal.
 */

import type { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';

/** Estimated fee breakdown returned to the UI. */
export interface FeeEstimate {
  /** Total fee in Planck (smallest unit). */
  totalPlanck: bigint;
  /** Total fee formatted in DALLA (human-readable). */
  totalDALLA: string;
  /** Weight of the transaction. */
  weight: string;
  /** Class of the extrinsic (Normal, Operational, Mandatory). */
  class: string;
  /** Partial fee (excluding tip). */
  partialFeePlanck: bigint;
  /** Whether estimation succeeded. */
  ok: true;
}

export interface FeeEstimateError {
  ok: false;
  error: string;
}

export type FeeEstimateResult = FeeEstimate | FeeEstimateError;

const DALLA_DECIMALS = 12;

/**
 * Format a Planck amount to a human-readable DALLA string.
 */
function planckToDALLA(planck: bigint, decimals: number = DALLA_DECIMALS): string {
  const divisor = BigInt(10 ** decimals);
  const whole = planck / divisor;
  const fraction = planck % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0');
  // Show up to 6 significant decimal places, trimming trailing zeros
  const trimmed = fractionStr.slice(0, 6).replace(/0+$/, '') || '0';
  return `${whole}.${trimmed}`;
}

/**
 * Estimate the fee for a built (but unsigned) extrinsic.
 *
 * @param api     - Connected ApiPromise instance
 * @param tx      - The extrinsic to estimate (e.g. `api.tx.balances.transfer(dest, amount)`)
 * @param sender  - The sender's address (used for weight calculation)
 * @returns       - Fee estimate or error
 *
 * @example
 * ```ts
 * const tx = api.tx.balances.transfer(dest, amount);
 * const fee = await estimateFee(api, tx, selectedAccount.address);
 * if (fee.ok) {
 *   console.log(`Estimated fee: ${fee.totalDALLA} DALLA`);
 * }
 * ```
 */
export async function estimateFee(
  _api: ApiPromise,
  tx: SubmittableExtrinsic<'promise'>,
  sender: string,
): Promise<FeeEstimateResult> {
  try {
    const paymentInfo = await tx.paymentInfo(sender);

    const partialFeePlanck = BigInt(paymentInfo.partialFee.toString());

    return {
      ok: true,
      totalPlanck: partialFeePlanck,
      totalDALLA: planckToDALLA(partialFeePlanck),
      weight: paymentInfo.weight.toString(),
      class: paymentInfo.class.toString(),
      partialFeePlanck,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to estimate fee',
    };
  }
}

/**
 * Estimate the fee for a batch of extrinsics.
 *
 * @param api     - Connected ApiPromise instance
 * @param txs     - Array of extrinsics to batch
 * @param sender  - The sender's address
 * @returns       - Fee estimate for the entire batch
 */
export async function estimateBatchFee(
  api: ApiPromise,
  txs: SubmittableExtrinsic<'promise'>[],
  sender: string,
): Promise<FeeEstimateResult> {
  try {
    const batchTx = api.tx.utility.batchAll(txs);
    return estimateFee(api, batchTx, sender);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to estimate batch fee',
    };
  }
}

/**
 * Quick helper: get fee as a formatted string, or a fallback on error.
 */
export async function getEstimatedFeeString(
  api: ApiPromise,
  tx: SubmittableExtrinsic<'promise'>,
  sender: string,
  fallback: string = '~0.001 DALLA',
): Promise<string> {
  const result = await estimateFee(api, tx, sender);
  return result.ok ? `${result.totalDALLA} DALLA` : fallback;
}
