/**
 * BelizeChain Oracle & Tourism Pallet Integration
 * Handles merchant verification and tourism cashback rewards
 * 
 * NOTE: Oracle pallet provides merchant verification ONLY.
 * bBZD peg is 1:1 with BZD (fixed by Central Bank, no price feed needed).
 */

import { ApiPromise } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';

export interface VerifiedMerchant {
  merchantId: string;
  businessName: string;
  owner: string;
  category: 'Hotel' | 'Restaurant' | 'Tour' | 'Retail' | 'Transportation' | 'Other';
  location: {
    district: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  cashbackRate: number; // 5.0 - 8.0 (percentage)
  verified: boolean;
  verificationDate?: number;
  verifier?: string; // Tourism Board address
  licenseNumber?: string;
  status: 'Active' | 'Suspended' | 'Revoked';
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
    const merchantData: any = await api.query.oracle?.verifiedMerchants(merchantId);
    
    if (!merchantData || merchantData.isNone) {
      return null;
    }

    const data = merchantData.unwrap();
    
    return {
      merchantId,
      businessName: data.businessName.toString(),
      owner: data.owner.toString(),
      category: data.category.toString() as any,
      location: {
        district: data.district.toString(),
        address: data.address.toString(),
        coordinates: data.coordinates?.toHuman() as any,
      },
      cashbackRate: data.cashbackRate.toNumber() / 100, // Convert from basis points
      verified: data.verified.toHuman(),
      verificationDate: data.verificationDate?.toNumber(),
      verifier: data.verifier?.toString(),
      licenseNumber: data.licenseNumber?.toString(),
      status: data.status.toString() as any,
    };
  } catch (error) {
    console.error('Failed to fetch merchant:', error);
    return null;
  }
}

/**
 * Get all verified merchants in a category
 */
export async function getVerifiedMerchants(
  category?: string,
  district?: string
): Promise<VerifiedMerchant[]> {
  const api = await initializeApi();
  
  try {
    const merchants: any = await api.query.oracle?.verifiedMerchants.entries();
    
    if (!merchants || merchants.length === 0) {
      return [];
    }

    return merchants
      .filter(([, value]: [any, any]) => {
        const data = value.unwrap();
        const categoryMatch = !category || data.category.toString() === category;
        const districtMatch = !district || data.district.toString() === district;
        const isActive = data.status.toString() === 'Active';
        return categoryMatch && districtMatch && isActive;
      })
      .map(([key, value]: [any, any]) => {
        const merchantId = key.args[0].toString();
        const data = value.unwrap();
        
        return {
          merchantId,
          businessName: data.businessName.toString(),
          owner: data.owner.toString(),
          category: data.category.toString() as any,
          location: {
            district: data.district.toString(),
            address: data.address.toString(),
            coordinates: data.coordinates?.toHuman() as any,
          },
          cashbackRate: data.cashbackRate.toNumber() / 100,
          verified: data.verified.toHuman(),
          verificationDate: data.verificationDate?.toNumber(),
          verifier: data.verifier?.toString(),
          licenseNumber: data.licenseNumber?.toString(),
          status: data.status.toString() as any,
        };
      });
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
    const merchantRecord: any = await api.query.oracle?.merchantsByAddress(address);
    
    if (!merchantRecord || merchantRecord.isNone) {
      return false;
    }

    const merchantId = merchantRecord.unwrap().toString();
    const merchant = await getVerifiedMerchant(merchantId);
    
    return Boolean(merchant?.verified) && merchant?.status === 'Active';
  } catch (error) {
    console.error('Failed to check merchant verification:', error);
    return false;
  }
}

/**
 * Get tourism rewards for a user
 */
export async function getTourismRewards(address: string, limit: number = 50): Promise<TourismReward[]> {
  const api = await initializeApi();
  
  try {
    const rewards: any = await api.query.oracle?.tourismRewards.entries(address);
    
    if (!rewards || rewards.length === 0) {
      return [];
    }

    return rewards
      .map(([key, value]: [any, any]) => {
        const rewardId = key.args[1].toString();
        const data = value.unwrap();
        
        return {
          rewardId,
          user: address,
          merchant: data.merchant.toString(),
          merchantName: data.merchantName.toString(),
          transactionHash: data.transactionHash.toString(),
          amountSpent: formatBalance(data.amountSpent.toString()),
          cashbackRate: data.cashbackRate.toNumber() / 100,
          cashbackAmount: formatBalance(data.cashbackAmount.toString()),
          timestamp: data.timestamp.toNumber(),
          status: data.status.toString() as any,
          redeemedAt: data.redeemedAt?.toNumber(),
          bBZDRedeemed: data.bBZDRedeemed ? formatBalance(data.bBZDRedeemed.toString()) : undefined,
        };
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch tourism rewards:', error);
    return [];
  }
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
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.oracle.redeemTourismRewards(rewardIds);

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let bBZDAmount = '0.00';
          
          // Extract bBZD amount from events
          events.forEach(({ event }) => {
            if (api.events.oracle?.RewardsRedeemed?.is(event)) {
              const [, amount] = event.data;
              bBZDAmount = formatBalance(amount.toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            bBZDAmount,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Redeem cashback failed:', error);
    throw error;
  }
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
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const amountInPlanck = parseFloat(amount) * Math.pow(10, 12);
    
    const tx = api.tx.oracle.reportMerchantTransaction(
      merchantId,
      transactionHash,
      amountInPlanck
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let cashbackAmount = '0.00';
          
          // Extract cashback amount from events
          events.forEach(({ event }) => {
            if (api.events.oracle?.CashbackEarned?.is(event)) {
              const [, , amount] = event.data;
              cashbackAmount = formatBalance(amount.toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            cashbackAmount,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Report transaction failed:', error);
    throw error;
  }
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
    .filter(m => m.location.coordinates)
    .map(m => ({
      merchantId: m.merchantId,
      name: m.businessName,
      category: m.category,
      latitude: m.location.coordinates!.latitude,
      longitude: m.location.coordinates!.longitude,
      cashbackRate: m.cashbackRate,
    }));
}

/**
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}
