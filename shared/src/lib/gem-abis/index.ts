/**
 * Raw ink! contract metadata (ABIs) for the GEM contracts deployed on BelizeChain.
 *
 * Source: `gem/sdk/contracts/*.json`, refreshed from `gem/<crate>/target/ink/*.json`
 * on 2026-05-12. Each JSON includes `source.hash` matching the on-chain code hash
 * recorded in `gem/deployment-1778544360130.json`.
 *
 * Consumers can pass these directly to `new Abi(metadata)` or `new ContractPromise`
 * from `@polkadot/api-contract`.
 */

import dallaAbi from './dalla.json';
import beliNftAbi from './belinft.json';
import daoAbi from './dao.json';
import faucetAbi from './faucet.json';
import psp37Abi from './psp37_multi_token.json';
import dexFactoryAbi from './dex_factory.json';
import dexPairAbi from './dex_pair.json';
import dexRouterAbi from './dex_router.json';

export const gemAbis = {
  dalla: dallaAbi,
  beliNft: beliNftAbi,
  dao: daoAbi,
  faucet: faucetAbi,
  psp37: psp37Abi,
  dexFactory: dexFactoryAbi,
  dexPair: dexPairAbi,
  dexRouter: dexRouterAbi,
} as const;

export type GemContractKey = keyof typeof gemAbis;

export {
  dallaAbi,
  beliNftAbi,
  daoAbi,
  faucetAbi,
  psp37Abi,
  dexFactoryAbi,
  dexPairAbi,
  dexRouterAbi,
};
