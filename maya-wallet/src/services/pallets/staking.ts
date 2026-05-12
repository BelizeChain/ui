/**
 * BelizeChain Staking Pallet Integration
 * Handles Proof of Useful Work (PoUW), federated learning rewards, and validator operations
 */

import { ApiPromise } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';

export interface StakingInfo {
  totalStaked: string;
  stakedBalance?: string; // Alias for totalStaked (UI compatibility)
  activeStake: string;
  unbonding: string;
  rewardsEarned: string;
  pendingRewards?: string; // Alias for rewardsEarned (UI compatibility)
  validatorStatus: 'None' | 'Waiting' | 'Active' | 'Inactive';
  nominatorStatus: 'None' | 'Active';
  era: number;
}

export interface PoUWContribution {
  contributionId: string;
  modelHash: string;
  qualityScore: number; // 0-100
  timelinessScore: number; // 0-100
  honestyScore: number; // 0-100
  totalScore: number; // 0-100 (weighted average)
  reward: string; // DALLA amount
  timestamp: number;
  status: 'Submitted' | 'Verified' | 'Rewarded' | 'Rejected';
}

export interface Validator {
  address: string;
  commission: number; // Percentage
  totalStake: string;
  ownStake: string;
  nominatorCount: number;
  isActive: boolean;
  rewardPoints: number;
  name?: string; // From BelizeID
}

/**
 * Get staking information for an address
 */
export async function getStakingInfo(address: string): Promise<StakingInfo> {
  const api = await initializeApi();
  
  try {
    const [stakingLedger, currentEra]: any = await Promise.all([
      api.query.staking?.ledger(address),
      api.query.staking?.currentEra(),
    ]);

    if (!stakingLedger || stakingLedger.isNone) {
      return {
        totalStaked: '0.00',
        activeStake: '0.00',
        unbonding: '0.00',
        rewardsEarned: '0.00',
        validatorStatus: 'None',
        nominatorStatus: 'None',
        era: currentEra?.toNumber() || 0,
      };
    }

    const ledger = stakingLedger.unwrap();
    const validatorPrefs: any = await api.query.staking?.validators(address);
    const nominatorPrefs: any = await api.query.staking?.nominators(address);
    
    // Calculate unbonding amount
    const unbonding = ledger.unlocking?.reduce((sum: number, chunk: any) => {
      return sum + parseFloat(chunk.value.toString());
    }, 0) || 0;

    // Get rewards
    const rewardsRecord: any = await api.query.staking?.rewards(address);
    const rewards = rewardsRecord?.toString() || '0';

    return {
      totalStaked: formatBalance(ledger.total.toString()),
      activeStake: formatBalance(ledger.active.toString()),
      unbonding: formatBalance(unbonding.toString()),
      rewardsEarned: formatBalance(rewards),
      validatorStatus: validatorPrefs && !validatorPrefs.isNone ? 'Active' : 'None',
      nominatorStatus: nominatorPrefs && !nominatorPrefs.isNone ? 'Active' : 'None',
      era: currentEra?.toNumber() || 0,
    };
  } catch (error) {
    console.error('Failed to fetch staking info:', error);
    return {
      totalStaked: '0.00',
      activeStake: '0.00',
      unbonding: '0.00',
      rewardsEarned: '0.00',
      validatorStatus: 'None',
      nominatorStatus: 'None',
      era: 0,
    };
  }
}

/**
 * Stake DALLA tokens
 */
export async function stakeDalla(
  address: string,
  amount: string,
  validatorAddress?: string
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const amountInPlanck = BigInt(Math.floor(parseFloat(amount) * 1e12));

    // Real signature: joinValidators(stake, computeCapacity, location:Bytes).
    // PoUW staking on BelizeChain registers the caller as a validator with a
    // compute-capacity weight; nominator-style staking is not supported.
    const computeCapacity = 100;
    const location = validatorAddress ?? 'wallet';
    const tx = api.tx.staking.joinValidators(
      amountInPlanck.toString(),
      computeCapacity,
      location,
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Staking failed:', error);
    throw error;
  }
}

/**
 * Unstake DALLA tokens
 */
export async function unstakeDalla(
  address: string,
  amount: string
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    // Real chain has no partial unbond; leaveValidators schedules the full
    // stake for withdrawal after the unbonding period.
    void amount;
    const tx = api.tx.staking.leaveValidators();

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Unstaking failed:', error);
    throw error;
  }
}

/**
 * Claim staking rewards
 */
export async function claimStakingRewards(address: string): Promise<{ hash: string; amount: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    // Real extrinsic: claimPouwWithDomainBonus() — distributes accumulated
    // PoUW + staking rewards to caller.
    const tx = api.tx.staking.claimPouwWithDomainBonus();

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let rewardAmount = '0.00';
          
          // Extract reward amount from events
          events.forEach(({ event }) => {
            if (api.events.staking.Reward?.is(event)) {
              const [, amount] = event.data;
              rewardAmount = formatBalance(amount.toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            amount: rewardAmount,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Claim rewards failed:', error);
    throw error;
  }
}

/**
 * Get PoUW contribution history
 */
export async function getPoUWContributions(address: string, limit: number = 20): Promise<PoUWContribution[]> {
  const api = await initializeApi();
  
  try {
    const contributions: any = await api.query.staking?.pouwContributions.entries(address);
    
    if (!contributions || contributions.length === 0) {
      return [];
    }

    return contributions
      .map(([key, value]: [any, any]) => {
        const data = value.unwrap();
        return {
          contributionId: key.args[1].toString(),
          modelHash: data.modelHash.toString(),
          qualityScore: data.qualityScore.toNumber(),
          timelinessScore: data.timelinessScore.toNumber(),
          honestyScore: data.honestyScore.toNumber(),
          totalScore: data.totalScore.toNumber(),
          reward: formatBalance(data.reward.toString()),
          timestamp: data.timestamp.toNumber(),
          status: data.status.toString() as any,
        };
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch PoUW contributions:', error);
    return [];
  }
}

/**
 * Get all active validators
 */
export async function getActiveValidators(): Promise<Validator[]> {
  const api = await initializeApi();
  
  try {
    const validators: any = await api.query.staking.validators.entries();
    const currentEra: any = await api.query.staking.currentEra();
    
    const validatorList = await Promise.all(
      validators.map(async ([key, prefs]: [any, any]) => {
        const address = key.args[0].toString();
        const exposure: any = await api.query.staking.erasStakers(currentEra, address);
        const points: any = await api.query.staking.erasRewardPoints(currentEra);
        
        return {
          address,
          commission: prefs.commission.toNumber() / 10000000, // Convert from perbill
          totalStake: formatBalance(exposure.total.toString()),
          ownStake: formatBalance(exposure.own.toString()),
          nominatorCount: exposure.others.length,
          isActive: true,
          rewardPoints: points.individual.get(address)?.toNumber() || 0,
        };
      })
    );

    return validatorList.sort((a, b) => parseFloat(b.totalStake) - parseFloat(a.totalStake));
  } catch (error) {
    console.error('Failed to fetch validators:', error);
    return [];
  }
}

/**
 * Report training contribution (called by Nawal federated learning client)
 */
export async function reportTrainingContribution(
  address: string,
  modelHash: string,
  qualityScore: number,
  timelinessScore: number,
  honestyScore: number
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    // Real signature: submitModelDelta(taskId, encryptedDelta, computationCommitment, computationLog).
    // UI doesn't carry taskId/log yet, so we encode the model hash into commitment
    // and pass empty delta/log placeholders. Nawal client should drive this directly
    // with the full payload when wired.
    void qualityScore; void timelinessScore; void honestyScore;
    const taskId = 0;
    const tx = api.tx.staking.submitModelDelta(
      taskId,
      '0x',
      modelHash,
      modelHash,
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Report training failed:', error);
    throw error;
  }
}

/**
 * Calculate estimated PoUW rewards
 */
export function calculatePoUWReward(
  qualityScore: number,
  timelinessScore: number,
  honestyScore: number,
  baseReward: number = 100
): number {
  // Weighted calculation: Quality 40%, Timeliness 30%, Honesty 30%
  const totalScore = (qualityScore * 0.4) + (timelinessScore * 0.3) + (honestyScore * 0.3);
  return (baseReward * totalScore) / 100;
}

/**
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}
