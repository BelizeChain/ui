/**
 * Maya Wallet — Economy pallet reads (pallet_belize_economy)
 *
 * Only the storage items that exist on chain are read here. `TotalSupply`
 * (DALLA), `TotalBbzdSupply`, `CentralBankReserves` and `MintingHalted` are all
 * `StorageValue`s with `ValueQuery`.
 *
 * Note on `CentralBankReserves`: the pallet documents it as BZD reserves held
 * **off-chain** by the Central Bank and reported for audit transparency, with
 * the invariant that it must equal or exceed `TotalBbzdSupply` (1:1 backing).
 * Any ratio derived from it is therefore an on-chain *reported* figure, not an
 * independently verified audit.
 */

import { initializeApi } from '../blockchain';

const PLANCK_PER_DALLA = 1_000_000_000_000n;

/** Planck (12 decimals) → 2-decimal string. */
function formatUnits(planck: string): string {
  try {
    const value = BigInt(planck);
    const whole = value / PLANCK_PER_DALLA;
    const frac = value % PLANCK_PER_DALLA;
    return `${whole.toString()}.${frac.toString().padStart(12, '0').slice(0, 2)}`;
  } catch {
    return '0.00';
  }
}

export interface EconomySupply {
  /** `economy.totalSupply` — DALLA in circulation. */
  dallaTotalSupply: string;
  dallaTotalSupplyPlanck: string;
  /** `economy.totalBbzdSupply` — bBZD in circulation. */
  bbzdTotalSupply: string;
  bbzdTotalSupplyPlanck: string;
  /** `economy.centralBankReserves` — off-chain reserves reported on chain. */
  centralBankReserves: string;
  centralBankReservesPlanck: string;
  /**
   * `reserves / bbzdSupply` as a percentage, to 2 dp. `null` when no bBZD has
   * been minted, because the ratio is then undefined rather than 0 or 100.
   */
  backingRatioPercent: number | null;
  /** `economy.mintingHalted` — the pallet's defence-in-depth halt flag. */
  mintingHalted: boolean;
}

/** Read the economy pallet's supply/reserve storage. Returns `null` on failure. */
export async function getEconomySupply(): Promise<EconomySupply | null> {
  try {
    const api = await initializeApi();
    const economy = api.query.economy;
    if (!economy?.totalSupply) return null;

    const [totalSupply, bbzdSupply, reserves, halted] = await Promise.all([
      economy.totalSupply(),
      economy.totalBbzdSupply(),
      economy.centralBankReserves(),
      economy.mintingHalted(),
    ]);

    const dallaTotalSupplyPlanck = totalSupply.toString();
    const bbzdTotalSupplyPlanck = bbzdSupply.toString();
    const centralBankReservesPlanck = reserves.toString();

    const bbzd = BigInt(bbzdTotalSupplyPlanck);
    const backingRatioPercent =
      bbzd === 0n
        ? null
        : Number((BigInt(centralBankReservesPlanck) * 10_000n) / bbzd) / 100;

    return {
      dallaTotalSupply: formatUnits(dallaTotalSupplyPlanck),
      dallaTotalSupplyPlanck,
      bbzdTotalSupply: formatUnits(bbzdTotalSupplyPlanck),
      bbzdTotalSupplyPlanck,
      centralBankReserves: formatUnits(centralBankReservesPlanck),
      centralBankReservesPlanck,
      backingRatioPercent,
      mintingHalted: Boolean(halted?.toJSON?.() ?? halted),
    };
  } catch (error) {
    console.error('Failed to read economy supply:', error);
    return null;
  }
}
