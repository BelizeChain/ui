/**
 * Canonical Belize district list.
 *
 * Mirrors `BelizeDistrict` in `pallets/mesh/src/types.rs`, which the runtime
 * shares with `pallet-governance`. The governance pallet validates district
 * indices with `ensure!(idx < 6, Error::InvalidDistrict)`, and `getActiveReferenda`
 * decodes the same ordinal order, so this array's order is load-bearing:
 *
 *   0 = Belize, 1 = Cayo, 2 = Corozal, 3 = Orange Walk, 4 = Stann Creek, 5 = Toledo
 *
 * There are six administrative districts. Belize City and Belmopan are the two
 * cities (within Belize and Cayo respectively) and San Pedro is a town in the
 * Belize District — none of them are districts of their own, so they are
 * deliberately not listed here.
 */
export const BELIZE_DISTRICTS = [
  'Belize',
  'Cayo',
  'Corozal',
  'Orange Walk',
  'Stann Creek',
  'Toledo',
] as const;

export type BelizeDistrict = (typeof BELIZE_DISTRICTS)[number];

/** The district a run of data index `0..6` refers to, or `undefined` if out of range. */
export function districtFromIndex(index: number): BelizeDistrict | undefined {
  return BELIZE_DISTRICTS[index];
}
