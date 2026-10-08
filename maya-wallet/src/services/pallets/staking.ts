/**
 * BelizeChain Staking Pallet Integration
 * Handles Proof of Useful Work (PoUW), federated learning rewards, and validator operations
 */

import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';
import { bytesToString } from '../../lib/codec';

export interface StakingInfo {
  /** Total bonded stake, formatted DALLA. */
  totalStaked: string;
  /** Bonded stake actively backing PoUW work. */
  activeStake: string;
  /** Stake scheduled for release, formatted DALLA. */
  unbonding: string;
  /**
   * Claimable reward, or `null` when it cannot be determined.
   *
   * The pallet computes the payout at claim time from the validator's
   * quality/timeliness/honesty/quantum scores plus a stake bonus, and stores no
   * per-account accrual. `staking.epochRewards` is the global per-epoch pool, so
   * no claimable figure can be read from storage.
   */
  rewardsEarned: string | null;
  /**
   * `Active` while registered in `staking.validators`, `Inactive` while an
   * unbond is pending, otherwise `None`.
   */
  validatorStatus: 'None' | 'Active' | 'Inactive';
  /** Current PoUW epoch (`staking.currentEpoch`). This pallet has no eras. */
  epoch: number;
  /** PoUW score breakdown from `staking.validators`, or `null` when not registered. */
  scores: {
    quality: number;
    timeliness: number;
    honesty: number;
    compliance: number;
    totalContributions: number;
  } | null;
}

/**
 * The caller's current-epoch federated-learning submission, from
 * `staking.modelSubmissions`. Only one submission is stored per validator per
 * epoch, and the pallet keeps no history.
 */
export interface ModelSubmission {
  address: string;
  /** `blake2_256(model_weights || nonce || task_id)`, hex. */
  computationCommitment: string;
  /** `blake2_256(timestamped_execution_log)`, hex. */
  computationLog: string;
  /** Size of the encrypted delta payload, in bytes. */
  encryptedDeltaBytes: number;
  /** Block number the delta was submitted at. */
  submittedAt: number;
}

export interface Validator {
  address: string;
  /** Always 0 — the PoUW staking pallet has no commission concept. */
  commission: number;
  totalStake: string;
  /** Same as `totalStake` — the pallet has no nominators to split stake from. */
  ownStake: string;
  /** Always 0 — the pallet has no nominators. */
  nominatorCount: number;
  isActive: boolean;
  /** `ValidatorInfo.totalContributions` — recorded PoUW contributions. */
  rewardPoints: number;
  /** `ValidatorInfo.computeCapacity` — declared compute weight. */
  computeCapacity: number;
  /** `ValidatorInfo.qualityScore` (0-100). */
  qualityScore: number;
  /** `ValidatorInfo.location` — free-form node label. */
  name?: string;
}

/**
 * Unwrap an `Option<T>` codec, returning `null` for `None` or an empty value.
 */
function unwrapOption<T = any>(value: any): T | null {
  if (value == null) return null;
  if (typeof value.isNone === 'boolean') return value.isNone ? null : value.unwrap();
  if (value.isEmpty) return null;
  return value as T;
}

/**
 * Get staking information for an address.
 *
 * Reads the PoUW staking pallet's real storage — `validators`,
 * `currentEpoch` and `pendingUnbonds`. It is not the classic Substrate staking
 * pallet: there are no eras, no nominators, no commission and no per-account
 * reward ledger.
 */
export async function getStakingInfo(address: string): Promise<StakingInfo> {
  const api = await initializeApi();

  try {
    const [validatorOpt, epochCodec, pendingOpt]: any[] = await Promise.all([
      api.query.staking?.validators?.(address),
      api.query.staking?.currentEpoch?.(),
      api.query.staking?.pendingUnbonds?.(address),
    ]);

    const epoch = Number(epochCodec?.toString() ?? 0);
    const pending = unwrapOption<any>(pendingOpt);
    const pendingStake = pending ? (pending.toArray?.()[0] ?? pending[0]) : null;
    const unbonding = pendingStake ? formatBalance(pendingStake.toString()) : '0.00';

    const validator = unwrapOption<any>(validatorOpt);
    if (!validator) {
      return {
        totalStaked: '0.00',
        activeStake: '0.00',
        unbonding,
        rewardsEarned: null,
        validatorStatus: pending ? 'Inactive' : 'None',
        epoch,
        scores: null,
      };
    }

    const stake = formatBalance(validator.stake?.toString() ?? '0');
    return {
      totalStaked: stake,
      activeStake: stake,
      unbonding,
      rewardsEarned: null,
      validatorStatus: 'Active',
      epoch,
      scores: {
        quality: Number(validator.qualityScore?.toString() ?? 0),
        timeliness: Number(validator.timelinessScore?.toString() ?? 0),
        honesty: Number(validator.honestyScore?.toString() ?? 0),
        compliance: Number(validator.complianceScore?.toString() ?? 0),
        totalContributions: Number(validator.totalContributions?.toString() ?? 0),
      },
    };
  } catch (error) {
    console.error('Failed to fetch staking info:', error);
    return {
      totalStaked: '0.00',
      activeStake: '0.00',
      unbonding: '0.00',
      rewardsEarned: null,
      validatorStatus: 'None',
      epoch: 0,
      scores: null,
    };
  }
}

/**
 * Register as a PoUW validator by bonding DALLA.
 *
 * Real signature: `staking.joinValidators(stake, computeCapacity, location)`.
 * The pallet has no nominator concept — the caller stakes for themselves.
 * `location` is a free-form node label, not a validator address.
 */
export async function stakeDalla(
  address: string,
  amount: string,
  computeCapacity: number | string = 100,
  location: string = 'Maya Wallet',
): Promise<{ hash: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    const amountInPlanck = BigInt(Math.floor(parseFloat(amount) * 1e12));

    const tx = api.tx.staking.joinValidators(
      amountInPlanck.toString(),
      Number(computeCapacity) || 100,
      location || 'Maya Wallet',
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

          // Extract the payout from the pallet's `PouWRewardsClaimedWithBonus
          // { operator, base_reward, domain_bonus, total_reward }` event.
          events.forEach(({ event }) => {
            if (api.events.staking.PouWRewardsClaimedWithBonus?.is(event)) {
              const [, , , totalReward] = event.data;
              rewardAmount = formatBalance(totalReward.toString());
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
 * Read the caller's current-epoch federated-learning submission.
 *
 * `staking.modelSubmissions` holds at most one delta per validator per epoch and
 * the pallet keeps no history, so this returns a single record or `null`.
 */
export async function getModelSubmission(address: string): Promise<ModelSubmission | null> {
  const api = await initializeApi();

  try {
    const opt: any = await api.query.staking?.modelSubmissions?.(address);
    const delta = unwrapOption<any>(opt);
    if (!delta) return null;

    return {
      address,
      computationCommitment: delta.computationCommitment?.toHex?.() ?? '0x',
      computationLog: delta.computationLog?.toHex?.() ?? '0x',
      encryptedDeltaBytes: delta.encryptedDelta?.length ?? 0,
      submittedAt: Number(delta.submittedAt?.toString() ?? 0),
    };
  } catch (error) {
    console.error('Failed to fetch model submission:', error);
    return null;
  }
}

/**
 * Get all active validators
 */
export async function getActiveValidators(): Promise<Validator[]> {
  const api = await initializeApi();

  try {
    const entries: any = await api.query.staking?.validators?.entries?.() || [];

    // Field names come from this chain's PoUW staking pallet, which is NOT the
    // classic Substrate staking pallet: it has no eras, no nominator split and no
    // commission. Reading `erasStakers`/`erasRewardPoints` here silently yielded
    // 0.00 for every stake.
    const validatorList: Validator[] = entries.map(([key, raw]: [any, any]) => {
      const data: any = raw?.unwrap ? raw.unwrap() : raw;
      const stake = data?.stake?.toString() ?? '0';

      return {
        address: key.args[0].toString(),
        // No commission concept in this pallet — reported as 0, never invented.
        commission: 0,
        totalStake: formatBalance(stake),
        // One bonded stake per validator; there are no nominators to split from.
        ownStake: formatBalance(stake),
        nominatorCount: 0,
        isActive: true,
        rewardPoints: Number(data?.totalContributions?.toString() ?? 0),
        computeCapacity: Number(data?.computeCapacity?.toString() ?? 0),
        qualityScore: Number(data?.qualityScore?.toString() ?? 0),
        name: bytesToString(data?.location) || undefined,
      };
    });

    return validatorList.sort((a, b) => parseFloat(b.totalStake) - parseFloat(a.totalStake));
  } catch (error) {
    console.error('Failed to fetch on-chain validators:', error);
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
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}
