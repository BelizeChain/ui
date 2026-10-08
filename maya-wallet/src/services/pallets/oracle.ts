/**
 * BelizeChain Oracle & Tourism Pallet Integration
 * Handles merchant verification and tourism cashback rewards
 *
 * NOTE: Oracle pallet provides merchant verification ONLY.
 * bBZD peg is 1:1 with BZD (fixed by Central Bank, no price feed needed).
 */

import { initializeApi } from '../blockchain';
import { bytesToString } from '../../lib/codec';

/**
 * Mirrors `oracle.merchantCategories: AccountId -> MerchantCategory`.
 *
 * The pallet records no business name, no cashback rate and no district —
 * `location` is an optional raw (latitude, longitude) pair, and `license` /
 * `certification` are byte strings. An earlier version of this file read a
 * non-existent `verifiedMerchants` map and invented every one of those fields.
 */
export interface VerifiedMerchant {
  /** The merchant's account — this is the storage key. */
  merchantId: string;
  owner: string;
  category: string;
  certification: string;
  license: string;
  coordinates?: { latitude: number; longitude: number };
  verifiedAt: number;
  expiresAt: number;
  /** Derived locally: `expiresAt` has not yet passed. */
  verified: boolean;
}

export interface TourismReward {
  rewardId: string;
  user: string;
  merchant: string;
  merchantName: string;
  transactionHash: string;
  amountSpent: string; // DALLA spent
  cashbackRate: number; // Percentage
  cashbackAmount: string; // DALLA earned
  timestamp: number;
  status: 'Pending' | 'Approved' | 'Redeemed' | 'Rejected';
  redeemedAt?: number;
  bBZDRedeemed?: string; // Amount redeemed for bBZD
}

/** Current chain block number, used to derive merchant expiry. */
async function currentBlock(api: Awaited<ReturnType<typeof initializeApi>>): Promise<number> {
  try {
    const header = await api.rpc.chain.getHeader();
    return header.number.toNumber();
  } catch {
    return 0;
  }
}

function toMerchant(address: string, raw: any, block: number): VerifiedMerchant | null {
  const data = raw?.toJSON?.();
  if (!data) return null;
  const loc = Array.isArray(data.location) ? data.location : null;
  return {
    merchantId: address,
    owner: String(data.merchant ?? address),
    category: String(data.category),
    certification: bytesToString(data.certification),
    license: bytesToString(data.license),
    coordinates: loc ? { latitude: Number(loc[0]), longitude: Number(loc[1]) } : undefined,
    verifiedAt: Number(data.verifiedAt ?? 0),
    expiresAt: Number(data.expiresAt ?? 0),
    verified: Number(data.expiresAt ?? 0) > block,
  };
}

export interface TourismStats {
  totalSpent: string;
  totalCashback: string;
  pendingCashback: string;
  redeemedCashback: string;
  transactionCount: number;
  favoriteCategories: {
    category: string;
    spent: string;
    percentage: number;
  }[];
}

/**
 * Get verified merchant information
 */
export async function getVerifiedMerchant(merchantId: string): Promise<VerifiedMerchant | null> {
  const api = await initializeApi();

  try {
    if (!api.query.oracle?.merchantCategories) return null;
    const raw: any = await api.query.oracle.merchantCategories(merchantId as any);
    if (!raw || raw.isNone) return null;
    return toMerchant(merchantId, raw, await currentBlock(api));
  } catch (error) {
    console.error('Failed to fetch merchant:', error);
    return null;
  }
}

/**
 * Get all verified merchants in a category
 */
/**
 * All verified merchants, optionally filtered by category.
 *
 * The `district` argument is retained for call-site compatibility but is not
 * applied: `merchantCategories` stores a raw coordinate pair, not a district,
 * so district filtering cannot be answered from chain state.
 */
export async function getVerifiedMerchants(
  category?: string,
  district?: string
): Promise<VerifiedMerchant[]> {
  void district;
  const api = await initializeApi();

  try {
    if (!api.query.oracle?.merchantCategories) return [];
    const entries = await api.query.oracle.merchantCategories.entries();
    const block = await currentBlock(api);

    const merchants: VerifiedMerchant[] = [];
    for (const [key, raw] of entries as any[]) {
      const address = key?.args?.[0]?.toString() ?? '';
      const merchant = toMerchant(address, raw, block);
      if (!merchant) continue;
      if (category && merchant.category !== category) continue;
      merchants.push(merchant);
    }
    return merchants;
  } catch (error) {
    console.error('Failed to fetch merchants:', error);
    return [];
  }
}

/**
 * Check if address is a verified merchant
 */
export async function isMerchantVerified(address: string): Promise<boolean> {
  const api = await initializeApi();

  try {
    if (!api.query.oracle?.merchantCategories) return false;
    const raw: any = await api.query.oracle.merchantCategories(address as any);
    if (!raw || raw.isNone) return false;
    const merchant = toMerchant(address, raw, await currentBlock(api));
    return merchant?.verified ?? false;
  } catch (error) {
    console.error('Failed to check merchant verification:', error);
    return false;
  }
}

/**
 * Get tourism rewards for a user
 */
/**
 * Tourism cashback rewards.
 *
 * There is no tourism-reward storage on chain — the oracle pallet tracks
 * merchant verification, price feeds, land registry, IoT devices and KYC, and
 * exposes `claimOracleRewards` for operator rewards only. The `tourismRewards`
 * map this function used to read has never existed, so the previous
 * implementation always threw and silently returned [].
 */
export async function getTourismRewards(address: string, limit: number = 50): Promise<TourismReward[]> {
  void address; void limit;
  return [];
}

/**
 * Get tourism statistics for a user
 */
export async function getTourismStats(address: string): Promise<TourismStats> {
  const rewards = await getTourismRewards(address, 1000);

  if (rewards.length === 0) {
    return {
      totalSpent: '0.00',
      totalCashback: '0.00',
      pendingCashback: '0.00',
      redeemedCashback: '0.00',
      transactionCount: 0,
      favoriteCategories: [],
    };
  }

  const totalSpent = rewards.reduce((sum, r) => sum + parseFloat(r.amountSpent), 0);
  const totalCashback = rewards.reduce((sum, r) => sum + parseFloat(r.cashbackAmount), 0);
  const pendingCashback = rewards
    .filter(r => r.status === 'Pending' || r.status === 'Approved')
    .reduce((sum, r) => sum + parseFloat(r.cashbackAmount), 0);
  const redeemedCashback = rewards
    .filter(r => r.status === 'Redeemed')
    .reduce((sum, r) => sum + parseFloat(r.cashbackAmount), 0);

  // Calculate favorite categories (would need merchant data in production)
  const favoriteCategories = [
    { category: 'Hotel', spent: '0.00', percentage: 0 },
    { category: 'Restaurant', spent: '0.00', percentage: 0 },
    { category: 'Tour', spent: '0.00', percentage: 0 },
  ];

  return {
    totalSpent: totalSpent.toFixed(2),
    totalCashback: totalCashback.toFixed(2),
    pendingCashback: pendingCashback.toFixed(2),
    redeemedCashback: redeemedCashback.toFixed(2),
    transactionCount: rewards.length,
    favoriteCategories,
  };
}

/**
 * Redeem tourism cashback for bBZD (1:1 conversion)
 */
export async function redeemTourismCashback(
  address: string,
  rewardIds: string[]
): Promise<{ hash: string; bBZDAmount: string }> {
  // Real chain has `oracle.claimOracleRewards()` (no per-id selection) and no
  // dedicated tourism redemption. Until a redemption extrinsic exists, expose
  // a clear failure so the UI can render an explanation instead of silently
  // failing inside the SDK encoder.
  void address; void rewardIds;
  await initializeApi();
  throw new Error(
    'Tourism redemption is not yet available on chain. Use oracle.claimOracleRewards via a future release.',
  );
}

/**
 * Report transaction to merchant for cashback
 * (Called automatically after payment to verified merchant)
 */
export async function reportMerchantTransaction(
  address: string,
  merchantId: string,
  transactionHash: string,
  amount: string
): Promise<{ hash: string; cashbackAmount: string }> {
  // No `reportMerchantTransaction` extrinsic exists on chain. Merchant
  // verification is done by oracles via `oracle.verifyMerchant`; cashback
  // accrual is expected to happen via a future extrinsic.
  void address; void merchantId; void transactionHash; void amount;
  await initializeApi();
  throw new Error(
    'Merchant transaction reporting is not yet wired to the oracle pallet.',
  );
}

/**
 * Get merchant map markers (for map visualization)
 */
export async function getMerchantMapMarkers(district?: string): Promise<Array<{
  merchantId: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  cashbackRate: number;
}>> {
  const merchants = await getVerifiedMerchants(undefined, district);

  return merchants
    .filter(m => m.coordinates)
    .map(m => ({
      merchantId: m.merchantId,
      // The pallet stores no business name; the merchant account is the only label.
      name: m.merchantId,
      category: m.category,
      latitude: m.coordinates!.latitude,
      longitude: m.coordinates!.longitude,
      // No cashback rate exists on chain.
      cashbackRate: 0,
    }));
}
