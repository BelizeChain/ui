/**
 * BelizeChain Community Pallet Integration
 * Handles community governance, local initiatives, and grassroots proposals
 */

import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';
import { bytesToString } from '@/lib/codec';

export interface CommunityGroup {
  groupId: string;
  name: string;
  description: string;
  location: {
    district: string;
    village?: string;
  };
  founder: string;
  members: string[];
  memberCount: number;
  treasury: string; // Community treasury balance
  proposalCount: number;
  createdAt: number;
  isActive: boolean;
  category: 'Environmental' | 'Education' | 'Healthcare' | 'Infrastructure' | 'Cultural' | 'Economic' | 'Other';
}

export interface CommunityProposal {
  proposalId: string;
  proposer: string;
  beneficiary: string;
  proposalType: string;
  title: string;
  description: string;
  amount: string;
  deposit: string;
  status: 'EthicsReview' | 'Active' | 'Approved' | 'Rejected' | 'Cancelled';
  submissionBlock: number;
  votingDeadline: number;
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
}

/** Proposal type codes accepted by `submitCommunityProposal` (u8). */
export const COMMUNITY_PROPOSAL_TYPES = [
  { code: 0, label: 'Local Project' },
  { code: 1, label: 'Education Module' },
  { code: 2, label: 'Green Initiative' },
  { code: 3, label: 'Cultural Preservation' },
  { code: 4, label: 'Disaster Relief' },
  { code: 5, label: 'Community Bounty' },
] as const;

export interface Milestone {
  id: string;
  description: string;
  fundingAmount: string;
  deadline: number;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Delayed';
  completedAt?: number;
  verifiedBy?: string;
}

export interface CommunityFund {
  fundId: string;
  name: string;
  description: string;
  targetAmount: string;
  currentAmount: string;
  contributors: number;
  deadline: number;
  purpose: string;
  status: 'Active' | 'Funded' | 'Expired' | 'Withdrawn';
  createdAt: number;
}

export interface CommunityEvent {
  eventId: string;
  groupId: string;
  title: string;
  description: string;
  location: string;
  startTime: number;
  endTime: number;
  organizer: string;
  attendees: string[];
  maxAttendees?: number;
  requiresRSVP: boolean;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
}

export interface EducationModule {
  moduleId: number;
  title: string;
  description: string;
  rewardAmount: string; // In DALLA
  totalCompletions: number;
  /** `null` means unlimited completions are allowed. */
  maxCompletions: number | null;
  active: boolean;
}

export interface UserEducationProgress {
  moduleId: number;
  completedAt?: number;
  rewardClaimed: boolean;
}

export interface GreenProject {
  projectId: number;
  name: string;
  description: string;
  targetFunding: string; // In DALLA
  currentFunding: string;
  contributorCount: number;
  deadline?: number;
  isActive: boolean;
  category: 'Conservation' | 'Renewable Energy' | 'Waste Management' | 'Reforestation' | 'Water Conservation';
  milestones: ProjectMilestone[];
}

export interface ProjectMilestone {
  description: string;
  targetAmount: string;
  achieved: boolean;
  achievedAt?: number;
}

export interface SRSInfo {
  score: number; // 0-10,000
  tier: number; // 1-5
  participationCount: number;
  volunteerHours: number;
  educationModulesCompleted: number;
  greenProjectContributions: string;
  monthlyFeeExemption: string;
  lastUpdated: number;
}

/**
 * Get all community groups
 */
export async function getCommunityGroups(
  district?: string,
  category?: string
): Promise<CommunityGroup[]> {
  const api = await initializeApi();

  try {
    const groups: any = await api.query.community?.groups?.entries?.() || [];

    if (!groups || groups.length === 0) {
      return [];
    }

    return groups
      .filter(([, value]: [any, any]) => {
        const data = value.unwrap();
        const districtMatch = !district || data.district.toString() === district;
        const categoryMatch = !category || data.category.toString() === category;
        return districtMatch && categoryMatch && data.isActive.toHuman();
      })
      .map(([key, value]: [any, any]) => {
        const groupId = key.args[0].toString();
        const data = value.unwrap();

        return {
          groupId,
          name: data.name.toString(),
          description: data.description.toString(),
          location: {
            district: data.district.toString(),
            village: data.village?.toString(),
          },
          founder: data.founder.toString(),
          members: data.members.toHuman() as string[],
          memberCount: data.memberCount.toNumber(),
          treasury: formatBalance(data.treasury.toString()),
          proposalCount: data.proposalCount.toNumber(),
          createdAt: data.createdAt.toNumber(),
          isActive: data.isActive.toHuman(),
          category: data.category.toString() as any,
        };
      });
  } catch (error) {
    console.error('Failed to fetch community groups:', error);
    return [];
  }
}

/**
 * Create new community group
 */
export async function createCommunityGroup(
  address: string,
  data: {
    name: string;
    description: string;
    district: string;
    village?: string;
    category: string;
  }
): Promise<{ hash: string; groupId: string }> {
  await initializeApi();  // connection init; result unused

  try {
    void data;
    // The community pallet has no `createGroup` extrinsic; community groups
    // are formed implicitly through participation and endorsements.
    void address;
    throw new Error('Creating a community group is not supported by the community pallet.');
  } catch (error) {
    console.error('Create community group failed:', error);
    throw error;
  }
}

/**
 * Join community group
 */
export async function joinCommunityGroup(
  address: string,
  groupId: string
): Promise<{ hash: string }> {
  await initializeApi();  // connection init; result unused

  try {
    const injector = await web3FromAddress(address);
    // No `joinGroup` extrinsic; joining is implicit. Best-effort: record
    // participation under activityCode 0 (membership) so the chain reflects
    // user intent.
    void groupId; void injector;
    throw new Error('Joining a community group is implicit; no extrinsic exists.');
  } catch (error) {
    console.error('Join group failed:', error);
    throw error;
  }
}

/**
 * Get community proposals
 */
export async function getCommunityProposals(
  status?: string
): Promise<CommunityProposal[]> {
  const api = await initializeApi();

  try {
    // Real storage is `communityProposals`. The previous name (`proposals`) does
    // not exist, so this always threw and silently returned an empty list.
    const proposals: any = await api.query.community.communityProposals.entries();

    if (!proposals || proposals.length === 0) {
      return [];
    }

    return proposals
      .map(([key, value]: [any, any]) => {
        const data = value.unwrap();
        return {
          proposalId: key.args[0].toString(),
          proposer: data.proposer.toString(),
          beneficiary: data.beneficiary.toString(),
          proposalType: data.proposalType.toString(),
          title: bytesToString(data.title),
          description: bytesToString(data.description),
          amount: formatBalance(data.amount.toString()),
          deposit: formatBalance(data.deposit.toString()),
          status: data.status.toString() as CommunityProposal['status'],
          submissionBlock: data.submissionBlock.toNumber(),
          votingDeadline: data.votingDeadline.toNumber(),
          votesFor: data.votesFor.toNumber(),
          votesAgainst: data.votesAgainst.toNumber(),
          totalVotes: data.totalVotes.toNumber(),
        };
      })
      .filter((p: CommunityProposal) => !status || p.status === status);
  } catch (error) {
    console.error('Failed to fetch community proposals:', error);
    return [];
  }
}

/**
 * Submit community proposal
 */
export async function submitCommunityProposal(
  address: string,
  data: {
    proposalTypeCode: number;
    beneficiary: string;
    amount: string;
    title: string;
    description: string;
  }
): Promise<{ hash: string; proposalId: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    const amountInPlanck = BigInt(Math.floor(parseFloat(data.amount) * 1e12));
    // Real signature: submitCommunityProposal(proposalTypeCode:u8, beneficiary:AccountId,
    //   amount:u128, title:Bytes, description:Bytes).
    const tx = api.tx.community.submitCommunityProposal(
      data.proposalTypeCode,
      data.beneficiary,
      amountInPlanck.toString(),
      data.title,
      data.description,
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let proposalId = '';

          events.forEach(({ event }) => {
            if (api.events.community?.ProposalSubmitted?.is(event)) {
              const [, id] = event.data;
              proposalId = id.toString();
            }
          });

          resolve({
            hash: txHash.toString(),
            proposalId,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Submit proposal failed:', error);
    throw error;
  }
}

/**
 * Vote on community proposal
 */
export async function voteOnCommunityProposal(
  address: string,
  proposalId: string,
  vote: 'Yes' | 'No' | 'Abstain'
): Promise<{ hash: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    // Real signature: voteCommunityProposal(proposalId:u32, approve:bool).
    // Abstain is not representable on chain; treat it as a no-op error.
    if (vote === 'Abstain') {
      throw new Error('Abstain votes are not supported by the community pallet.');
    }
    const tx = api.tx.community.voteCommunityProposal(
      Number.parseInt(proposalId, 10),
      vote === 'Yes',
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Vote failed:', error);
    throw error;
  }
}

/**
 * Contribute to community fund
 */
export async function contributeToCommunityFund(
  address: string,
  fundId: string,
  amount: string
): Promise<{ hash: string }> {
  await initializeApi();  // connection init; result unused

  try {
    const injector = await web3FromAddress(address);
    // No `contributeFund` extrinsic; funding flows through proposal execution
    // and green-project contributions only.
    void fundId; void amount; void injector;
    throw new Error(
      'Generic community-fund contributions are not supported. Use contributeToGreenProject for specific projects.',
    );
  } catch (error) {
    console.error('Contribution failed:', error);
    throw error;
  }
}

/**
 * Get community events
 */
export async function getCommunityEvents(
  groupId?: string,
  upcoming: boolean = true
): Promise<CommunityEvent[]> {
  const api = await initializeApi();

  try {
    const events: any = await api.query.community?.events?.entries?.() || [];

    if (!events || events.length === 0) {
      return [];
    }

    const now = Date.now();

    return events
      .filter(([, value]: [any, any]) => {
        const data = value.unwrap();
        const groupMatch = !groupId || data.groupId.toString() === groupId;
        const timeMatch = !upcoming || data.startTime.toNumber() > now;
        return groupMatch && timeMatch;
      })
      .map(([key, value]: [any, any]) => {
        const eventId = key.args[0].toString();
        const data = value.unwrap();

        return {
          eventId,
          groupId: data.groupId.toString(),
          title: data.title.toString(),
          description: data.description.toString(),
          location: data.location.toString(),
          startTime: data.startTime.toNumber(),
          endTime: data.endTime.toNumber(),
          organizer: data.organizer.toString(),
          attendees: data.attendees.toHuman() as string[],
          maxAttendees: data.maxAttendees?.toNumber(),
          requiresRSVP: data.requiresRSVP.toHuman(),
          status: data.status.toString() as any,
        };
      })
      .sort((a: { startTime: number }, b: { startTime: number }) => a.startTime - b.startTime);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return [];
  }
}

/**
 * RSVP to community event
 */
export async function rsvpToEvent(
  address: string,
  eventId: string
): Promise<{ hash: string }> {
  await initializeApi();  // connection init; result unused

  try {
    const injector = await web3FromAddress(address);
    // No `rsvpEvent` extrinsic on chain; events live off-chain. Throw so the
    // UI can branch to an off-chain RSVP backend.
    void eventId; void injector;
    throw new Error('Event RSVP is not yet a chain operation; persist off-chain.');
  } catch (error) {
    console.error('RSVP failed:', error);
    throw error;
  }
}

/**
 * Get user's community groups
 */
export async function getUserCommunityGroups(address: string): Promise<CommunityGroup[]> {
  const allGroups = await getCommunityGroups();
  return allGroups.filter(group => group.members.includes(address));
}

/**
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}

/**
 * Get all education modules
 */
export async function getEducationModules(): Promise<EducationModule[]> {
  const api = await initializeApi();

  try {
    const modules: any = await api.query.community?.educationModules?.entries();

    if (!modules || modules.length === 0) {
      return [];
    }

    return modules.map(([key, value]: [any, any]) => {
      const moduleId = key.args[0].toNumber();
      const data = value.unwrap();

      return {
        moduleId,
        title: bytesToString(data.title),
        description: bytesToString(data.description),
        rewardAmount: formatBalance(data.rewardAmount.toString()),
        totalCompletions: data.totalCompletions.toNumber(),
        maxCompletions: data.maxCompletions.isSome
          ? data.maxCompletions.unwrap().toNumber()
          : null,
        active: data.active.valueOf() as boolean,
      };
    });
  } catch (error) {
    console.error('Failed to fetch education modules:', error);
    return [];
  }
}

/**
 * Get user's education progress
 */
export async function getUserEducationProgress(
  address: string
): Promise<UserEducationProgress[]> {
  const api = await initializeApi();

  try {
    // Real storage is `completedEducation` (StorageDoubleMap AccountId, u32 ->
    // CompletionData). `userEducationProgress` does not exist on this chain.
    const progress: any = await api.query.community.completedEducation.entries(address);

    if (!progress || progress.length === 0) {
      return [];
    }

    return progress.map(([key, value]: [any, any]) => {
      const moduleId = key.args[1].toNumber();
      const data = value.unwrap();

      return {
        moduleId,
        completedAt: data.completedAt?.toNumber(),
        rewardClaimed: data.rewardClaimed.valueOf() as boolean,
      };
    });
  } catch (error) {
    console.error('Failed to fetch education progress:', error);
    return [];
  }
}

/**
 * Complete education module and claim reward
 */
export async function completeEducationModule(
  address: string,
  moduleId: number
): Promise<{ hash: string; rewardAmount: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    // Real signature: completeEducationModule(moduleId:u32, completionProof:Bytes).
    const tx = api.tx.community.completeEducationModule(moduleId, '0x');

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let rewardAmount = '0';

          events.forEach(({ event }) => {
            if (api.events.community?.EducationModuleCompleted?.is(event)) {
              const [, , reward] = event.data;
              rewardAmount = formatBalance(reward.toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            rewardAmount,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Complete education module failed:', error);
    throw error;
  }
}

/**
 * Get all green projects
 */
export async function getGreenProjects(): Promise<GreenProject[]> {
  const api = await initializeApi();

  try {
    const projects: any = await api.query.community?.greenProjects?.entries();

    if (!projects || projects.length === 0) {
      return [];
    }

    return projects.map(([key, value]: [any, any]) => {
      const projectId = key.args[0].toNumber();
      const data = value.unwrap();

      return {
        projectId,
        name: data.name.toString(),
        description: data.description.toString(),
        targetFunding: formatBalance(data.targetFunding.toString()),
        currentFunding: formatBalance(data.currentFunding.toString()),
        contributorCount: data.contributorCount.toNumber(),
        deadline: data.deadline?.toNumber(),
        isActive: data.isActive.toHuman(),
        category: data.category?.toString() as any || 'Conservation',
        milestones: data.milestones?.toHuman() as ProjectMilestone[] || [],
      };
    });
  } catch (error) {
    console.error('Failed to fetch green projects:', error);
    return [];
  }
}

/**
 * Contribute to green project
 */
export async function contributeToGreenProject(
  address: string,
  projectId: number,
  amount: string
): Promise<{ hash: string; newTotal: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    // Real signature: contributeToGreenProject(projectId:u32, amount:u64).
    // Note: amount is u64 here (capped at ~18e18) and represents whole-token
    // units, not planck. We pass the raw whole-token amount.
    const amountWhole = Math.max(0, Math.floor(parseFloat(amount)));
    const tx = api.tx.community.contributeToGreenProject(projectId, amountWhole);

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let newTotal = '0';

          events.forEach(({ event }) => {
            if (api.events.community?.GreenProjectContribution?.is(event)) {
              const [, , , total] = event.data;
              newTotal = formatBalance(total.toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            newTotal,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Green project contribution failed:', error);
    throw error;
  }
}

/**
 * Get project contributors
 */
export async function getProjectContributors(
  projectId: number
): Promise<Array<{ address: string; amount: string; timestamp: number }>> {
  const api = await initializeApi();

  try {
    const contributors: any = await api.query.community?.greenProjectContributors?.entries(projectId);

    if (!contributors || contributors.length === 0) {
      return [];
    }

    return contributors.map(([key, value]: [any, any]) => {
      const address = key.args[1].toString();
      const data = value.unwrap();

      return {
        address,
        amount: formatBalance(data.amount.toString()),
        timestamp: data.timestamp.toNumber(),
      };
    });
  } catch (error) {
    console.error('Failed to fetch project contributors:', error);
    return [];
  }
}

/**
 * Get user's SRS (Social Responsibility Score) information
 */
export async function getUserSRS(address: string): Promise<SRSInfo | null> {
  const api = await initializeApi();

  try {
    const srsData: any = await api.query.community?.socialResponsibilityScores(address);

    if (!srsData || srsData.isNone) {
      return null;
    }

    const data = srsData.unwrap();

    return {
      score: data.score.toNumber(),
      tier: data.tier.toNumber(),
      participationCount: data.participationCount.toNumber(),
      volunteerHours: data.volunteerHours.toNumber(),
      educationModulesCompleted: data.educationModulesCompleted.toNumber(),
      greenProjectContributions: formatBalance(data.greenProjectContributions.toString()),
      monthlyFeeExemption: formatBalance(data.monthlyFeeExemption.toString()),
      lastUpdated: data.lastUpdated.toNumber(),
    };
  } catch (error) {
    console.error('Failed to fetch SRS info:', error);
    return null;
  }
}

/**
 * Calculate effective fee with SRS discount
 */
export async function calculateEffectiveFee(
  address: string,
  originalFee: string
): Promise<{ effectiveFee: string; discount: string; discountPercent: number }> {
  const api = await initializeApi();

  try {
    const feeInPlanck = parseFloat(originalFee) * Math.pow(10, 12);
    const result: any = await api.query.community?.calculateEffectiveFee(address, feeInPlanck);

    if (!result) {
      return {
        effectiveFee: originalFee,
        discount: '0',
        discountPercent: 0,
      };
    }

    const [effectiveFee, discountPercent] = result;
    const effective = formatBalance(effectiveFee.toString());
    const discountAmount = (parseFloat(originalFee) - parseFloat(effective)).toFixed(2);

    return {
      effectiveFee: effective,
      discount: discountAmount,
      discountPercent: discountPercent.toNumber(),
    };
  } catch (error) {
    console.error('Failed to calculate effective fee:', error);
    return {
      effectiveFee: originalFee,
      discount: '0',
      discountPercent: 0,
    };
  }
}
