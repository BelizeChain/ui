/**
 * BelizeChain Contracts Pallet Integration (GEM Platform)
 * Handles ink! 4.0 smart contracts, PSP22 tokens, PSP34 NFTs, DAOs, and faucet
 */

import { ApiPromise } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';

export interface PSP22Token {
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  userBalance?: string;
  metadata?: {
    icon?: string;
    description?: string;
    website?: string;
  };
}

export interface PSP34NFT {
  contractAddress: string;
  collectionName: string;
  symbol: string;
  totalSupply: number;
  userTokens?: PSP34Token[];
  metadata?: {
    description?: string;
    image?: string;
    creator?: string;
  };
}

export interface PSP34Token {
  tokenId: string;
  owner: string;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  };
}

export interface DAOProposal {
  daoAddress: string;
  proposalId: string;
  proposer: string;
  title: string;
  description: string;
  actions: ProposalAction[];
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  status: 'Active' | 'Passed' | 'Rejected' | 'Executed' | 'Cancelled';
  startTime: number;
  endTime: number;
  executedAt?: number;
}

export interface ProposalAction {
  type: 'Transfer' | 'ContractCall' | 'ParameterChange';
  target: string;
  value?: string;
  data?: string;
}

export interface DeployedContract {
  address: string;
  deployer: string;
  codeHash: string;
  deployedAt: number;
  type: 'PSP22' | 'PSP34' | 'DAO' | 'Custom';
  name?: string;
  verified: boolean;
}

export interface FaucetClaim {
  claimId: string;
  recipient: string;
  amount: string; // 1000 DALLA per claim
  claimedAt: number;
  nextClaimAvailable: number; // 24hr cooldown
}

/**
 * Get PSP22 token balance
 */
export async function getPSP22Balance(
  contractAddress: string,
  walletAddress: string
): Promise<{ balance: string; decimals: number }> {
  const api = await initializeApi();
  
  try {
    // Call PSP22::balance_of(owner)
    const result: any = await api.query.contracts?.call(
      walletAddress,
      contractAddress,
      0,
      -1, // Gas limit (use max)
      null,
      { balanceOf: { owner: walletAddress } }
    );

    if (result.isOk) {
      const data = result.asOk.data.toHuman();
      return {
        balance: data.balance || '0',
        decimals: data.decimals || 12,
      };
    }

    return { balance: '0', decimals: 12 };
  } catch (error) {
    console.error('Failed to fetch PSP22 balance:', error);
    return { balance: '0', decimals: 12 };
  }
}

/**
 * Transfer PSP22 tokens
 */
export async function transferPSP22(
  address: string,
  contractAddress: string,
  to: string,
  amount: string
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    
    // PSP22::transfer(to, value, data)
    const tx = api.tx.contracts.call(
      contractAddress,
      0,
      -1, // Gas limit
      null,
      { transfer: { to, value: amount, data: [] } }
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('PSP22 transfer failed:', error);
    throw error;
  }
}

/**
 * Get PSP34 NFTs owned by user
 */
export async function getPSP34Tokens(
  contractAddress: string,
  walletAddress: string
): Promise<PSP34Token[]> {
  const api = await initializeApi();
  
  try {
    // Call PSP34::balance_of(owner)
    const balanceResult: any = await api.query.contracts?.call(
      walletAddress,
      contractAddress,
      0,
      -1,
      null,
      { balanceOf: { owner: walletAddress } }
    );

    if (!balanceResult.isOk) {
      return [];
    }

    const balance = balanceResult.asOk.data.toNumber();
    if (balance === 0) {
      return [];
    }

    // Call PSP34::owners_token_by_index for each token
    const tokens: PSP34Token[] = [];
    for (let i = 0; i < balance; i++) {
      const tokenResult: any = await api.query.contracts?.call(
        walletAddress,
        contractAddress,
        0,
        -1,
        null,
        { ownersTokenByIndex: { owner: walletAddress, index: i } }
      );

      if (tokenResult.isOk) {
        const tokenId = tokenResult.asOk.data.toString();
        
        // Get token metadata
        const metadataResult: any = await api.query.contracts?.call(
          walletAddress,
          contractAddress,
          0,
          -1,
          null,
          { tokenMetadata: { id: tokenId } }
        );

        const metadata = metadataResult.isOk 
          ? metadataResult.asOk.data.toHuman()
          : {};

        tokens.push({
          tokenId,
          owner: walletAddress,
          metadata: metadata as any,
        });
      }
    }

    return tokens;
  } catch (error) {
    console.error('Failed to fetch PSP34 tokens:', error);
    return [];
  }
}

/**
 * Transfer PSP34 NFT
 */
export async function transferPSP34(
  address: string,
  contractAddress: string,
  to: string,
  tokenId: string
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    
    // PSP34::transfer(to, id, data)
    const tx = api.tx.contracts.call(
      contractAddress,
      0,
      -1,
      null,
      { transfer: { to, id: tokenId, data: [] } }
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('PSP34 transfer failed:', error);
    throw error;
  }
}

/**
 * Get DAO proposals
 */
export async function getDAOProposals(
  daoAddress: string,
  status?: 'Active' | 'Passed' | 'Rejected' | 'Executed'
): Promise<DAOProposal[]> {
  const api = await initializeApi();
  
  try {
    // Call DAO::get_proposals()
    const result: any = await api.query.contracts?.call(
      daoAddress,
      daoAddress,
      0,
      -1,
      null,
      { getProposals: {} }
    );

    if (!result.isOk) {
      return [];
    }

    const proposals = result.asOk.data.toHuman() as DAOProposal[];
    
    if (status) {
      return proposals.filter(p => p.status === status);
    }

    return proposals;
  } catch (error) {
    console.error('Failed to fetch DAO proposals:', error);
    return [];
  }
}

/**
 * Submit DAO proposal
 */
export async function submitDAOProposal(
  address: string,
  daoAddress: string,
  proposal: {
    title: string;
    description: string;
    actions: ProposalAction[];
  }
): Promise<{ hash: string; proposalId: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    
    const tx = api.tx.contracts.call(
      daoAddress,
      0,
      -1,
      null,
      { 
        propose: {
          title: proposal.title,
          description: proposal.description,
          actions: proposal.actions,
        }
      }
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let proposalId = '';
          
          events.forEach(({ event }) => {
            if (api.events.contracts?.ContractEmitted?.is(event)) {
              const [, data] = event.data;
              const decoded = data.toHuman() as any;
              if (decoded.ProposalCreated) {
                proposalId = decoded.ProposalCreated.id;
              }
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
    console.error('Submit DAO proposal failed:', error);
    throw error;
  }
}

/**
 * Vote on DAO proposal
 */
export async function voteDAOProposal(
  address: string,
  daoAddress: string,
  proposalId: string,
  vote: 'For' | 'Against' | 'Abstain',
  votingPower?: string
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    
    const tx = api.tx.contracts.call(
      daoAddress,
      0,
      -1,
      null,
      { 
        vote: {
          proposalId,
          vote,
          votingPower: votingPower || '0',
        }
      }
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('DAO vote failed:', error);
    throw error;
  }
}

/**
 * Execute DAO proposal (after passing)
 */
export async function executeDAOProposal(
  address: string,
  daoAddress: string,
  proposalId: string
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    
    const tx = api.tx.contracts.call(
      daoAddress,
      0,
      -1,
      null,
      { execute: { proposalId } }
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Execute DAO proposal failed:', error);
    throw error;
  }
}

/**
 * Claim from testnet faucet (1000 DALLA per claim, 24hr cooldown)
 */
export async function claimFromFaucet(address: string): Promise<{ 
  hash: string;
  amount: string;
  nextClaimTime: number;
}> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const faucetAddress = api.consts.contracts?.faucetAddress.toString();
    
    const tx = api.tx.contracts.call(
      faucetAddress,
      0,
      -1,
      null,
      { claim: {} }
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let amount = '1000.00';
          const nextClaimTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
          
          events.forEach(({ event }) => {
            if (api.events.contracts?.ContractEmitted?.is(event)) {
              const [, data] = event.data;
              const decoded = data.toHuman() as any;
              if (decoded.FaucetClaimed) {
                amount = formatBalance(decoded.FaucetClaimed.amount);
              }
            }
          });

          resolve({
            hash: txHash.toString(),
            amount,
            nextClaimTime,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Faucet claim failed:', error);
    throw error;
  }
}

/**
 * Check faucet eligibility
 */
export async function checkFaucetEligibility(address: string): Promise<{
  eligible: boolean;
  lastClaim?: number;
  nextClaimTime?: number;
  reason?: string;
}> {
  const api = await initializeApi();
  
  try {
    const faucetAddress = api.consts.contracts?.faucetAddress.toString();
    
    const result: any = await api.query.contracts?.call(
      address,
      faucetAddress,
      0,
      -1,
      null,
      { canClaim: { account: address } }
    );

    if (result.isOk) {
      const data = result.asOk.data.toHuman() as any;
      
      if (data.eligible) {
        return { eligible: true };
      } else {
        return {
          eligible: false,
          lastClaim: data.lastClaim,
          nextClaimTime: data.nextClaimTime,
          reason: 'Must wait 24 hours between claims',
        };
      }
    }

    return {
      eligible: false,
      reason: 'Unable to check eligibility',
    };
  } catch (error) {
    console.error('Failed to check faucet eligibility:', error);
    return {
      eligible: false,
      reason: 'Error checking eligibility',
    };
  }
}

/**
 * Get deployed contracts by address
 */
export async function getDeployedContracts(deployer?: string): Promise<DeployedContract[]> {
  const api = await initializeApi();
  
  try {
    const contracts: any = await api.query.contracts?.contractInfoOf.entries();
    
    if (!contracts || contracts.length === 0) {
      return [];
    }

    return contracts
      .filter(([, value]: [any, any]) => {
        if (!deployer) return true;
        const info = value.unwrap();
        return info.deployer.toString() === deployer;
      })
      .map(([key, value]: [any, any]) => {
        const address = key.args[0].toString();
        const info = value.unwrap();
        
        return {
          address,
          deployer: info.deployer.toString(),
          codeHash: info.codeHash.toString(),
          deployedAt: info.deployedAt.toNumber(),
          type: info.contractType?.toString() as any || 'Custom',
          name: info.name?.toString(),
          verified: info.verified?.toHuman() || false,
        };
      })
      .sort((a: { deployedAt: number }, b: { deployedAt: number }) => b.deployedAt - a.deployedAt);
  } catch (error) {
    console.error('Failed to fetch deployed contracts:', error);
    return [];
  }
}

/**
 * Deploy smart contract
 */
export async function deployContract(
  address: string,
  wasmCode: Uint8Array,
  constructorData: any,
  value: string = '0'
): Promise<{ hash: string; contractAddress: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const valueInPlanck = parseFloat(value) * Math.pow(10, 12);
    
    const tx = api.tx.contracts.instantiateWithCode(
      valueInPlanck,
      -1, // Gas limit
      null,
      wasmCode,
      constructorData,
      []
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let contractAddress = '';
          
          events.forEach(({ event }) => {
            if (api.events.contracts?.Instantiated?.is(event)) {
              const [deployer, contract] = event.data;
              contractAddress = contract.toString();
            }
          });

          resolve({
            hash: txHash.toString(),
            contractAddress,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Contract deployment failed:', error);
    throw error;
  }
}

/**
 * Get user's GEM ecosystem stats
 */
export async function getGEMStats(address: string): Promise<{
  psp22Tokens: number;
  psp34Tokens: number;
  daoMemberships: number;
  deployedContracts: number;
  faucetClaims: number;
  lastFaucetClaim?: number;
}> {
  const deployedContracts = await getDeployedContracts(address);
  
  // Note: This would need to query multiple PSP22/PSP34 contracts
  // For now, returning placeholder structure
  
  return {
    psp22Tokens: 0, // Would need to query all known PSP22 contracts
    psp34Tokens: 0, // Would need to query all known PSP34 contracts
    daoMemberships: 0, // Would need to query all DAO contracts
    deployedContracts: deployedContracts.length,
    faucetClaims: 0, // Would need to query faucet history
  };
}

/**
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}
