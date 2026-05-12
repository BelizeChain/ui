'use client';

/**
 * GEM Contracts Client (Maya Wallet)
 *
 * Wraps the four canonical ink! contracts deployed under `gem/`:
 *   - DALLA Token (PSP22)
 *   - BeliNFT Collection (PSP34)
 *   - Simple DAO
 *   - Faucet
 *
 * ABIs and contract addresses are sourced from `@belizechain/shared` so the same
 * deployment metadata is shared across Maya Wallet and Blue Hole Portal.
 *
 * Uses `@polkadot/api-contract` (the only correct way to call an ink! contract
 * via pallet-contracts) — not `api.query.contracts.call`, which does not exist.
 */

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { web3FromAddress } from '@polkadot/extension-dapp';
import {
  gemAbis,
  getRuntimeConfig,
  type GemContractKey,
  type RuntimeConfig,
} from '@belizechain/shared';
import { initializeApi } from './blockchain';

type GemContractAddresses = RuntimeConfig['gemContracts'];

const addressKeyMap: Record<GemContractKey, keyof GemContractAddresses> = {
  dalla: 'dalla',
  beliNft: 'beliNft',
  dao: 'dao',
  faucet: 'faucet',
  psp37: 'psp37',
  dexFactory: 'dexFactory',
  dexPair: 'dexFactory', // pairs are not pinned in runtime-config; callers supply address
  dexRouter: 'dexRouter',
};

const READ_GAS_LIMIT = { refTime: 5_000_000_000n, proofSize: 131_072n };
const WRITE_GAS_LIMIT = { refTime: 10_000_000_000n, proofSize: 262_144n };

// Cross-installed @polkadot/types copies cause WeightV2 nominal conflicts between
// `@polkadot/api-contract` (root) and `@polkadot/api` (workspace). The runtime
// shape is identical, so we build a WeightV2-compatible value and erase the type.
function makeGasLimit(api: ApiPromise, kind: 'read' | 'write'): unknown {
  const src = kind === 'read' ? READ_GAS_LIMIT : WRITE_GAS_LIMIT;
  return api.registry.createType('WeightV2', src);
}

export function getGemContractAddress(key: GemContractKey): string | undefined {
  const addresses = getRuntimeConfig().gemContracts;
  return addresses[addressKeyMap[key]];
}

/**
 * Build a `ContractPromise` for a known GEM contract. Returns null when the
 * contract address is not configured (e.g. DEX before it's been deployed).
 */
export function getGemContract(
  api: ApiPromise,
  key: GemContractKey,
  addressOverride?: string,
): ContractPromise | null {
  const address = addressOverride ?? getGemContractAddress(key);
  if (!address) return null;
  return new ContractPromise(api, gemAbis[key] as unknown as Record<string, unknown>, address);
}

async function dryRunQuery<T = unknown>(
  contract: ContractPromise,
  caller: string,
  method: string,
  args: unknown[] = [],
): Promise<T | null> {
  const fn = (contract.query as Record<string, ((...a: unknown[]) => Promise<unknown>) | undefined>)[
    method
  ];
  if (!fn) {
    throw new Error(`Contract method not found: ${method}`);
  }
  const gasLimit = makeGasLimit(contract.api as ApiPromise, 'read');
  const { result, output } = (await fn(caller, { gasLimit, storageDepositLimit: null }, ...args)) as {
    result: { isOk: boolean };
    output: { toJSON: () => T } | null;
  };
  if (!result.isOk || !output) return null;
  return output.toJSON();
}

/* ───────────── DALLA Token (PSP22) ───────────── */

export interface DallaMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  maxSupply: string;
}

export async function getDallaMetadata(caller: string): Promise<DallaMetadata | null> {
  const api = await initializeApi();
  const contract = getGemContract(api, 'dalla');
  if (!contract) return null;
  const [name, symbol, decimals, totalSupply, maxSupply] = await Promise.all([
    dryRunQuery<string | null>(contract, caller, 'tokenName'),
    dryRunQuery<string | null>(contract, caller, 'tokenSymbol'),
    dryRunQuery<number>(contract, caller, 'tokenDecimals'),
    dryRunQuery<string>(contract, caller, 'totalSupply'),
    dryRunQuery<string>(contract, caller, 'maxSupply'),
  ]);
  return {
    name: name ?? 'DALLA Token',
    symbol: symbol ?? 'DALLA',
    decimals: decimals ?? 12,
    totalSupply: String(totalSupply ?? '0'),
    maxSupply: String(maxSupply ?? '0'),
  };
}

export async function getDallaBalance(caller: string, owner: string): Promise<string> {
  const api = await initializeApi();
  const contract = getGemContract(api, 'dalla');
  if (!contract) return '0';
  const balance = await dryRunQuery<string>(contract, caller, 'balanceOf', [owner]);
  return String(balance ?? '0');
}

export async function transferDalla(
  from: string,
  to: string,
  value: string,
): Promise<string> {
  const api = await initializeApi();
  const contract = getGemContract(api, 'dalla');
  if (!contract) throw new Error('DALLA contract address not configured');
  const injector = await web3FromAddress(from);
  const tx = contract.tx.transfer(
    { gasLimit: makeGasLimit(api, 'write') as never, storageDepositLimit: null },
    to,
    value,
    [],
  );
  return new Promise((resolve, reject) => {
    tx.signAndSend(from, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        reject(new Error(dispatchError.toString()));
        return;
      }
      if (status.isInBlock || status.isFinalized) {
        resolve(txHash.toString());
      }
    }).catch(reject);
  });
}

/* ───────────── BeliNFT (PSP34) ───────────── */

export async function getBeliNftCollection(caller: string): Promise<{
  name: string;
  symbol: string;
  totalSupply: number;
} | null> {
  const api = await initializeApi();
  const contract = getGemContract(api, 'beliNft');
  if (!contract) return null;
  const [name, symbol, totalSupply] = await Promise.all([
    dryRunQuery<string>(contract, caller, 'collectionName'),
    dryRunQuery<string>(contract, caller, 'collectionSymbol'),
    dryRunQuery<number>(contract, caller, 'totalSupply'),
  ]);
  return {
    name: String(name ?? 'Belize NFT'),
    symbol: String(symbol ?? 'BNFT'),
    totalSupply: Number(totalSupply ?? 0),
  };
}

export async function getBeliNftBalanceOf(caller: string, owner: string): Promise<number> {
  const api = await initializeApi();
  const contract = getGemContract(api, 'beliNft');
  if (!contract) return 0;
  const balance = await dryRunQuery<number>(contract, caller, 'balanceOf', [owner]);
  return Number(balance ?? 0);
}

/**
 * Mint a new BeliNFT to `to` with the given metadata URI.
 * Typically only callable by the contract owner.
 */
export async function mintBeliNft(
  minter: string,
  to: string,
  uri: string,
): Promise<string> {
  const api = await initializeApi();
  const contract = getGemContract(api, 'beliNft');
  if (!contract) throw new Error('BeliNFT contract address not configured');
  const injector = await web3FromAddress(minter);
  const tx = contract.tx.mint(
    { gasLimit: makeGasLimit(api, 'write') as never, storageDepositLimit: null },
    to,
    uri,
  );
  return new Promise((resolve, reject) => {
    tx.signAndSend(minter, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        reject(new Error(dispatchError.toString()));
        return;
      }
      if (status.isInBlock || status.isFinalized) {
        resolve(txHash.toString());
      }
    }).catch(reject);
  });
}

/**
 * Transfer a BeliNFT owned by `sender` to `to`. The on-chain Id is encoded
 * as the PSP34 `Id::U64` variant.
 */
export async function transferBeliNft(
  sender: string,
  to: string,
  tokenId: number | string,
): Promise<string> {
  const api = await initializeApi();
  const contract = getGemContract(api, 'beliNft');
  if (!contract) throw new Error('BeliNFT contract address not configured');
  const injector = await web3FromAddress(sender);
  const id = { U64: Number(tokenId) };
  const tx = contract.tx.transfer(
    { gasLimit: makeGasLimit(api, 'write') as never, storageDepositLimit: null },
    to,
    id,
    [],
  );
  return new Promise((resolve, reject) => {
    tx.signAndSend(sender, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        reject(new Error(dispatchError.toString()));
        return;
      }
      if (status.isInBlock || status.isFinalized) {
        resolve(txHash.toString());
      }
    }).catch(reject);
  });
}

/**
 * Walk token IDs 0..totalSupply-1 calling `owner_of` to find tokens held by `owner`.
 * Bounded scan; for large collections this should be replaced with an indexer.
 */
export async function listBeliNftsOwnedBy(
  caller: string,
  owner: string,
  maxScan = 100,
): Promise<Array<{ id: number; uri: string | null }>> {
  const api = await initializeApi();
  const contract = getGemContract(api, 'beliNft');
  if (!contract) return [];
  const supplyRaw = await dryRunQuery<number>(contract, caller, 'totalSupply');
  const supply = Math.min(Number(supplyRaw ?? 0), maxScan);
  const owned: Array<{ id: number; uri: string | null }> = [];
  for (let i = 0; i < supply; i += 1) {
    try {
      const id = { U64: i };
      const ownerAddr = await dryRunQuery<string>(contract, caller, 'ownerOf', [id]);
      if (ownerAddr && String(ownerAddr) === owner) {
        const uri = await dryRunQuery<string>(contract, caller, 'tokenUri', [i]).catch(() => null);
        owned.push({ id: i, uri: uri ? String(uri) : null });
      }
    } catch {
      // skip
    }
  }
  return owned;
}

/* ───────────── Faucet ───────────── */

export interface FaucetStatus {
  canClaim: boolean;
  blocksUntilClaim: number;
  dripAmount: string;
  cooldown: number;
  faucetBalance: string;
}

export async function getFaucetStatus(caller: string, account: string): Promise<FaucetStatus | null> {
  const api = await initializeApi();
  const contract = getGemContract(api, 'faucet');
  if (!contract) return null;
  const [canClaim, blocksUntilClaim, dripAmount, cooldown, balance] = await Promise.all([
    dryRunQuery<boolean>(contract, caller, 'canClaim', [account]),
    dryRunQuery<number>(contract, caller, 'blocksUntilClaim', [account]),
    dryRunQuery<string>(contract, caller, 'dripAmount'),
    dryRunQuery<number>(contract, caller, 'cooldown'),
    dryRunQuery<string>(contract, caller, 'balance'),
  ]);
  return {
    canClaim: Boolean(canClaim),
    blocksUntilClaim: Number(blocksUntilClaim ?? 0),
    dripAmount: String(dripAmount ?? '0'),
    cooldown: Number(cooldown ?? 0),
    faucetBalance: String(balance ?? '0'),
  };
}

export async function claimFromFaucet(address: string): Promise<string> {
  const api = await initializeApi();
  const contract = getGemContract(api, 'faucet');
  if (!contract) throw new Error('Faucet contract address not configured');
  const injector = await web3FromAddress(address);
  const tx = contract.tx.claim({ gasLimit: makeGasLimit(api, 'write') as never, storageDepositLimit: null });
  return new Promise((resolve, reject) => {
    tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        reject(new Error(dispatchError.toString()));
        return;
      }
      if (status.isInBlock || status.isFinalized) {
        resolve(txHash.toString());
      }
    }).catch(reject);
  });
}

/* ───────────── Simple DAO ───────────── */

export interface DaoProposal {
  id: number;
  proposer: string;
  description: string;
  votesFor: string;
  votesAgainst: string;
  endBlock: number;
  status: string;
}

export async function getDaoProposalCount(caller: string): Promise<number> {
  const api = await initializeApi();
  const contract = getGemContract(api, 'dao');
  if (!contract) return 0;
  const count = await dryRunQuery<number | string>(contract, caller, 'proposalCount');
  return Number(count ?? 0);
}

export async function getDaoProposal(caller: string, proposalId: number): Promise<DaoProposal | null> {
  const api = await initializeApi();
  const contract = getGemContract(api, 'dao');
  if (!contract) return null;
  const result = await dryRunQuery<Record<string, unknown> | null>(contract, caller, 'getProposal', [
    proposalId,
  ]);
  if (!result) return null;
  return {
    id: proposalId,
    proposer: String(result.proposer ?? ''),
    description: String(result.description ?? ''),
    votesFor: String(result.yesVotes ?? result.yes_votes ?? result.votes_for ?? '0'),
    votesAgainst: String(result.noVotes ?? result.no_votes ?? result.votes_against ?? '0'),
    endBlock: Number(result.endBlock ?? result.end_block ?? 0),
    status: String((result.status as { type?: string })?.type ?? result.status ?? 'Unknown'),
  };
}

/**
 * Fetch the most recent DAO proposals. Walks proposal_count → 0 because the
 * contract has no list method; cheapest path is N dry-runs.
 */
export async function listDaoProposals(caller: string, limit = 10): Promise<DaoProposal[]> {
  const count = await getDaoProposalCount(caller);
  if (count === 0) return [];
  const start = Math.max(0, count - limit);
  const ids: number[] = [];
  for (let i = count - 1; i >= start; i -= 1) ids.push(i);
  const proposals = await Promise.all(ids.map((id) => getDaoProposal(caller, id)));
  return proposals.filter((p): p is DaoProposal => p !== null);
}

export async function voteOnDaoProposal(
  voter: string,
  proposalId: number,
  support: boolean,
): Promise<string> {
  const api = await initializeApi();
  const contract = getGemContract(api, 'dao');
  if (!contract) throw new Error('DAO contract address not configured');
  const injector = await web3FromAddress(voter);
  const tx = contract.tx.vote(
    { gasLimit: makeGasLimit(api, 'write') as never, storageDepositLimit: null },
    proposalId,
    support,
  );
  return new Promise((resolve, reject) => {
    tx.signAndSend(voter, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        reject(new Error(dispatchError.toString()));
        return;
      }
      if (status.isInBlock || status.isFinalized) {
        resolve(txHash.toString());
      }
    }).catch(reject);
  });
}

/**
 * Submit a new DAO proposal.
 * @param description plain-text description
 * @param transferTarget optional treasury recipient AccountId (or null for text-only proposal)
 * @param transferValueDalla DALLA amount in human units (decimal string); 0 for text-only
 */
export async function createDaoProposal(
  proposer: string,
  description: string,
  transferTarget: string | null,
  transferValueDalla: string,
): Promise<string> {
  const api = await initializeApi();
  const contract = getGemContract(api, 'dao');
  if (!contract) throw new Error('DAO contract address not configured');
  const injector = await web3FromAddress(proposer);

  const PLANCK = 1_000_000_000_000n;
  const trimmed = (transferValueDalla || '0').trim();
  const [whole, frac = ''] = trimmed.split('.');
  const fracPadded = (frac + '000000000000').slice(0, 12);
  const value = BigInt(whole || '0') * PLANCK + BigInt(fracPadded || '0');

  const tx = contract.tx.createProposal(
    { gasLimit: makeGasLimit(api, 'write') as never, storageDepositLimit: null },
    description,
    transferTarget ?? null,
    value.toString(),
  );

  return new Promise((resolve, reject) => {
    tx.signAndSend(proposer, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        reject(new Error(dispatchError.toString()));
        return;
      }
      if (status.isInBlock || status.isFinalized) {
        resolve(txHash.toString());
      }
    }).catch(reject);
  });
}

/* ───────────── Catalog ───────────── */

export interface GemContractDescriptor {
  key: GemContractKey;
  label: string;
  type: string;
  address?: string;
  deployed: boolean;
}

const CATALOG: Array<Omit<GemContractDescriptor, 'address' | 'deployed'>> = [
  { key: 'dalla', label: 'DALLA Token', type: 'PSP22' },
  { key: 'beliNft', label: 'BeliNFT Collection', type: 'PSP34' },
  { key: 'dao', label: 'Simple DAO', type: 'Governance' },
  { key: 'faucet', label: 'Testnet Faucet', type: 'Faucet' },
  { key: 'psp37', label: 'PSP37 Multi-Token', type: 'PSP37' },
  { key: 'dexFactory', label: 'BelizeX Factory', type: 'DEX' },
  { key: 'dexRouter', label: 'BelizeX Router', type: 'DEX' },
];

export function getGemContractCatalog(): GemContractDescriptor[] {
  return CATALOG.map((entry) => {
    const address = getGemContractAddress(entry.key);
    return { ...entry, address, deployed: Boolean(address) };
  });
}
