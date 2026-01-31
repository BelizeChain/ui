/**
 * BelizeChain Governance Pallet Integration
 * Handles proposals, voting, district councils, and treasury
 */

import { ApiPromise } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';

export interface Proposal {
  index: number;
  hash: string;
  proposer: string;
  value: string; // Treasury amount requested
  beneficiary: string;
  bond: string;
  title: string;
  description: string;
  category: 'Infrastructure' | 'Development' | 'Community' | 'Emergency' | 'Other';
  status: 'Proposed' | 'Voting' | 'Approved' | 'Rejected' | 'Executed';
  voteCount: {
    ayes: number;
    nays: number;
  };
  voteEnd: number;
  createdAt: number;
}

export interface Referendum {
  index: number;
  hash: string;
  proposalHash: string;
  voteThreshold: 'SimpleMajority' | 'SuperMajority' | 'Unanimous';
  voteCount: {
    ayes: string; // Total DALLA voting yes
    nays: string; // Total DALLA voting no
    turnout: string; // Total DALLA voted
  };
  status: 'Voting' | 'Passed' | 'Failed' | 'Executed';
  voteEnd: number;
  delayPeriod: number;
}

export interface DistrictCouncil {
  district: 'Belize' | 'Cayo' | 'Corozal' | 'Orange Walk' | 'Stann Creek' | 'Toledo';
  members: string[];
  prime?: string; // District representative
  proposalCount: number;
  motions: Motion[];
}

export interface Motion {
  index: number;
  hash: string;
  proposer: string;
  title: string;
  description: string;
  threshold: number; // Required votes
  voteCount: {
    ayes: number;
    nays: number;
  };
  status: 'Voting' | 'Approved' | 'Rejected' | 'Executed';
  voteEnd: number;
}

export interface Vote {
  proposalIndex: number;
  voter: string;
  vote: 'Aye' | 'Nay';
  balance: string; // Conviction-weighted voting power
  conviction: 'None' | 'Locked1x' | 'Locked2x' | 'Locked4x' | 'Locked8x' | 'Locked16x';
  timestamp: number;
}

/**
 * Get all active proposals
 */
export async function getActiveProposals(): Promise<Proposal[]> {
  const api = await initializeApi();
  
  try {
    const proposals: any = await api.query.governance?.proposals();
    
    if (!proposals || proposals.length === 0) {
      return [];
    }

    return await Promise.all(
      proposals.map(async (proposalHash: any, index: number) => {
        const proposalData: any = await api.query.governance.proposalOf(proposalHash);
        const votingData: any = await api.query.governance.voting(index);
        
        const data = proposalData.unwrap();
        const voting = votingData?.unwrap();

        return {
          index,
          hash: proposalHash.toString(),
          proposer: data.proposer.toString(),
          value: formatBalance(data.value.toString()),
          beneficiary: data.beneficiary.toString(),
          bond: formatBalance(data.bond.toString()),
          title: data.title.toString(),
          description: data.description.toString(),
          category: data.category.toString() as any,
          status: data.status.toString() as any,
          voteCount: {
            ayes: voting?.ayes?.length || 0,
            nays: voting?.nays?.length || 0,
          },
          voteEnd: data.voteEnd.toNumber(),
          createdAt: data.createdAt.toNumber(),
        };
      })
    );
  } catch (error) {
    console.error('Failed to fetch proposals:', error);
    return [];
  }
}

/**
 * Submit a new treasury proposal
 */
export async function submitProposal(
  address: string,
  data: {
    value: string;
    beneficiary: string;
    title: string;
    description: string;
    category: string;
  }
): Promise<{ hash: string; proposalIndex: number }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const valueInPlanck = parseFloat(data.value) * Math.pow(10, 12);
    
    const tx = api.tx.governance.propose(
      valueInPlanck,
      data.beneficiary,
      data.title,
      data.description,
      data.category
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let proposalIndex = -1;
          
          // Extract proposal index from events
          events.forEach(({ event }) => {
            if (api.events.governance?.Proposed?.is(event)) {
              const [index] = event.data;
              proposalIndex = Number((index as any).toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            proposalIndex,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Proposal submission failed:', error);
    throw error;
  }
}

/**
 * Vote on a proposal
 */
export async function voteOnProposal(
  address: string,
  proposalIndex: number,
  vote: 'Aye' | 'Nay',
  conviction: 'None' | 'Locked1x' | 'Locked2x' | 'Locked4x' | 'Locked8x' | 'Locked16x' = 'None'
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.governance.vote(proposalIndex, { Standard: { vote, conviction } });

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Voting failed:', error);
    throw error;
  }
}

/**
 * Get all active referenda
 */
export async function getActiveReferenda(): Promise<Referendum[]> {
  const api = await initializeApi();
  
  try {
    const referenda: any = await api.query.governance?.referendumInfoOf.entries();
    
    if (!referenda || referenda.length === 0) {
      return [];
    }

    return referenda
      .filter(([, info]: [any, any]) => !info.isNone)
      .map(([key, info]: [any, any]) => {
        const index = key.args[0].toNumber();
        const data = info.unwrap();
        
        return {
          index,
          hash: data.hash.toString(),
          proposalHash: data.proposalHash.toString(),
          voteThreshold: data.threshold.toString() as any,
          voteCount: {
            ayes: formatBalance(data.tally.ayes.toString()),
            nays: formatBalance(data.tally.nays.toString()),
            turnout: formatBalance(data.tally.turnout.toString()),
          },
          status: data.status.toString() as any,
          voteEnd: data.end.toNumber(),
          delayPeriod: data.delay?.toNumber() || 0,
        };
      });
  } catch (error) {
    console.error('Failed to fetch referenda:', error);
    return [];
  }
}

/**
 * Get district council information
 */
export async function getDistrictCouncil(district: string): Promise<DistrictCouncil | null> {
  const api = await initializeApi();
  
  try {
    const members: any = await api.query.governance?.districtCouncils(district);
    const motions: any = await api.query.governance?.districtMotions(district);
    
    if (!members || members.isNone) {
      return null;
    }

    const councilData = members.unwrap();
    const motionData = motions?.toHuman() || [];

    return {
      district: district as any,
      members: councilData.members.toHuman() as string[],
      prime: councilData.prime?.toString(),
      proposalCount: councilData.proposalCount.toNumber(),
      motions: motionData.map((motion: any, index: number) => ({
        index,
        hash: motion.hash,
        proposer: motion.proposer,
        title: motion.title || `Motion ${index}`,
        description: motion.description || '',
        threshold: motion.threshold,
        voteCount: {
          ayes: motion.ayes?.length || 0,
          nays: motion.nays?.length || 0,
        },
        status: motion.status,
        voteEnd: motion.voteEnd || 0,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch district council:', error);
    return null;
  }
}

/**
 * Get voting history for an address
 */
export async function getVotingHistory(address: string, limit: number = 50): Promise<Vote[]> {
  const api = await initializeApi();
  
  try {
    const votes: any = await api.query.governance?.votingOf(address);
    
    if (!votes || votes.isNone) {
      return [];
    }

    const votingData = votes.unwrap();
    
    return votingData.votes
      .map((vote: any) => ({
        proposalIndex: vote.proposalIndex.toNumber(),
        voter: address,
        vote: vote.aye ? 'Aye' : 'Nay',
        balance: formatBalance(vote.balance.toString()),
        conviction: vote.conviction.toString() as any,
        timestamp: vote.timestamp?.toNumber() || 0,
      }))
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch voting history:', error);
    return [];
  }
}

/**
 * Second a proposal (support it for voting)
 */
export async function secondProposal(
  address: string,
  proposalIndex: number
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.governance.second(proposalIndex);

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Seconding proposal failed:', error);
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
