type PublicRuntimeEnv = {
  NEXT_PUBLIC_BLOCKCHAIN_WS?: string;
  NEXT_PUBLIC_BLOCKCHAIN_RPC?: string;
  NEXT_PUBLIC_BELI_NFT_CONTRACT?: string;
  NEXT_PUBLIC_DALLA_CONTRACT?: string;
  NEXT_PUBLIC_DAO_CONTRACT?: string;
  NEXT_PUBLIC_FAUCET_CONTRACT?: string;
  NEXT_PUBLIC_PSP37_CONTRACT?: string;
  NEXT_PUBLIC_DEX_FACTORY_CONTRACT?: string;
  NEXT_PUBLIC_DEX_ROUTER_CONTRACT?: string;
  NEXT_PUBLIC_GEM_DEPLOYMENT_NETWORK?: string;
  NEXT_PUBLIC_IPFS_GATEWAY?: string;
  NEXT_PUBLIC_KINICH_API?: string;
  NEXT_PUBLIC_KINICH_API_URL?: string;
  NEXT_PUBLIC_NAWAL_API?: string;
  NEXT_PUBLIC_NAWAL_API_URL?: string;
  NEXT_PUBLIC_NETWORK_NAME?: string;
  NEXT_PUBLIC_PAKIT_API?: string;
  NEXT_PUBLIC_PAKIT_API_URL?: string;
};

declare global {
  interface Window {
    ENV?: Partial<PublicRuntimeEnv>;
  }
}

export interface RuntimeConfig {
  blockchainRpcUrl: string;
  blockchainWsUrl: string;
  endpointSource: 'env' | 'proxy' | 'local';
  gemContracts: {
    beliNft?: string;
    dalla?: string;
    dao?: string;
    faucet?: string;
    psp37?: string;
    dexFactory?: string;
    dexRouter?: string;
  };
  /**
   * Identifier for the on-chain GEM deployment that `gemContracts` corresponds to.
   * Matches the timestamped `deployment-*.json` artifact under `gem/`.
   */
  gemDeploymentId: string;
  ipfsGatewayUrl: string;
  kinichApiUrl: string;
  nawalApiUrl: string;
  networkName: string;
  pakitApiUrl: string;
}

/**
 * Built-in Ceiba testnet deployment of GEM contracts.
 * Sourced from `gem/deployment-1791482394057.json`, deployed 2026-10-08 on
 * chain D ("Jade", runtime spec 110). The previous instances were wiped by the
 * 2026-09-29 re-genesis, so every address here post-dates it.
 *
 * Override any of these via `NEXT_PUBLIC_*_CONTRACT` env vars.
 *
 * Note: the dex pair contract is uploaded as code only (factory instantiates
 * pairs on demand via `create_pair`), so there is no fixed pair address.
 */
const CEIBA_GEM_DEPLOYMENT = {
  id: '1791482394057',
  dalla: 'r1SqoNCdgah6zWqzPJSNmKcknW2KaCvruSz6Mg8jBTd6jqtyL',
  beliNft: 'r1UxXWdW89AQ9ewvdRUthaEPR4vvWrgxn3VeHKVMB2rYsUUvv',
  dao: 'r1ScgRVx963TurkyzkTNLQbmhBfzhaj5x8YCHgM7yLFkmx8eh',
  faucet: 'r1Wcf2YSzSeziDHG82ku9zRbaLNqfQG3A3c6mbTsnJPGxKqCG',
  psp37: 'r1Vc9kffhRY2K5gTFdwMagLbGGSzwfhoH71EkZpTMpR9t6Dei',
  dexFactory: 'r1WhHW5jeHRRn2H3JFnLi9ek8MKQi1rtxamcSASKXjkDs1yTw',
  dexRouter: 'r1SwipZJQbrTvrUutUsUv7ZhLvp3Cb2dwpFW6gSKUks1poUPm',
  dexPairCodeHash: '0x76abcda9d0dbbf650e786d4cad63ecbca6a74fee291c3a1ae1d00d53b2dbce82',
} as const;

const localHostnames = new Set(['127.0.0.1', '::1', 'localhost']);

const publicEnv: PublicRuntimeEnv = {
  NEXT_PUBLIC_BLOCKCHAIN_WS: process.env.NEXT_PUBLIC_BLOCKCHAIN_WS,
  NEXT_PUBLIC_BLOCKCHAIN_RPC: process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC,
  NEXT_PUBLIC_BELI_NFT_CONTRACT: process.env.NEXT_PUBLIC_BELI_NFT_CONTRACT,
  NEXT_PUBLIC_DALLA_CONTRACT: process.env.NEXT_PUBLIC_DALLA_CONTRACT,
  NEXT_PUBLIC_DAO_CONTRACT: process.env.NEXT_PUBLIC_DAO_CONTRACT,
  NEXT_PUBLIC_FAUCET_CONTRACT: process.env.NEXT_PUBLIC_FAUCET_CONTRACT,
  NEXT_PUBLIC_PSP37_CONTRACT: process.env.NEXT_PUBLIC_PSP37_CONTRACT,
  NEXT_PUBLIC_DEX_FACTORY_CONTRACT: process.env.NEXT_PUBLIC_DEX_FACTORY_CONTRACT,
  NEXT_PUBLIC_DEX_ROUTER_CONTRACT: process.env.NEXT_PUBLIC_DEX_ROUTER_CONTRACT,
  NEXT_PUBLIC_GEM_DEPLOYMENT_NETWORK: process.env.NEXT_PUBLIC_GEM_DEPLOYMENT_NETWORK,
  NEXT_PUBLIC_IPFS_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
  NEXT_PUBLIC_KINICH_API: process.env.NEXT_PUBLIC_KINICH_API,
  NEXT_PUBLIC_KINICH_API_URL: process.env.NEXT_PUBLIC_KINICH_API_URL,
  NEXT_PUBLIC_NAWAL_API: process.env.NEXT_PUBLIC_NAWAL_API,
  NEXT_PUBLIC_NAWAL_API_URL: process.env.NEXT_PUBLIC_NAWAL_API_URL,
  NEXT_PUBLIC_NETWORK_NAME: process.env.NEXT_PUBLIC_NETWORK_NAME,
  NEXT_PUBLIC_PAKIT_API: process.env.NEXT_PUBLIC_PAKIT_API,
  NEXT_PUBLIC_PAKIT_API_URL: process.env.NEXT_PUBLIC_PAKIT_API_URL,
};

function readPublicEnv(...keys: Array<keyof PublicRuntimeEnv>): string | undefined {
  const browserEnv = typeof window !== 'undefined' ? window.ENV : undefined;

  for (const key of keys) {
    const browserValue = browserEnv?.[key];
    if (typeof browserValue === 'string' && browserValue.trim()) {
      return browserValue;
    }

    const buildValue = publicEnv[key];
    if (typeof buildValue === 'string' && buildValue.trim()) {
      return buildValue;
    }
  }

  return undefined;
}

function getBrowserOrigin(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const { origin, hostname } = window.location;
  if (!origin || localHostnames.has(hostname)) {
    return null;
  }

  return origin;
}

function toHttpUrl(origin: string, path: string): string {
  return new URL(path, origin).toString();
}

function toWebSocketUrl(origin: string, path: string): string {
  const url = new URL(path, origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

function isLocalWsUrl(url: string): boolean {
  return url.includes('127.0.0.1') || url.includes('localhost');
}

function getEndpointSource(hasEnvOverride: boolean, hasProxyOrigin: boolean): RuntimeConfig['endpointSource'] {
  if (hasEnvOverride) {
    return 'env';
  }

  if (hasProxyOrigin) {
    return 'proxy';
  }

  return 'local';
}

export function getRuntimeConfig(): RuntimeConfig {
  const browserOrigin = getBrowserOrigin();

  const wsOverride = readPublicEnv('NEXT_PUBLIC_BLOCKCHAIN_WS');
  const rpcOverride = readPublicEnv('NEXT_PUBLIC_BLOCKCHAIN_RPC');
  const pakitOverride = readPublicEnv('NEXT_PUBLIC_PAKIT_API', 'NEXT_PUBLIC_PAKIT_API_URL');
  const kinichOverride = readPublicEnv('NEXT_PUBLIC_KINICH_API', 'NEXT_PUBLIC_KINICH_API_URL');
  const nawalOverride = readPublicEnv('NEXT_PUBLIC_NAWAL_API', 'NEXT_PUBLIC_NAWAL_API_URL');
  const ipfsOverride = readPublicEnv('NEXT_PUBLIC_IPFS_GATEWAY');
  const networkNameOverride = readPublicEnv('NEXT_PUBLIC_NETWORK_NAME');
  const dallaContract = readPublicEnv('NEXT_PUBLIC_DALLA_CONTRACT');
  const beliNftContract = readPublicEnv('NEXT_PUBLIC_BELI_NFT_CONTRACT');
  const daoContract = readPublicEnv('NEXT_PUBLIC_DAO_CONTRACT');
  const faucetContract = readPublicEnv('NEXT_PUBLIC_FAUCET_CONTRACT');
  const psp37Contract = readPublicEnv('NEXT_PUBLIC_PSP37_CONTRACT');
  const dexFactoryContract = readPublicEnv('NEXT_PUBLIC_DEX_FACTORY_CONTRACT');
  const dexRouterContract = readPublicEnv('NEXT_PUBLIC_DEX_ROUTER_CONTRACT');
  const gemDeploymentId =
    readPublicEnv('NEXT_PUBLIC_GEM_DEPLOYMENT_NETWORK') || CEIBA_GEM_DEPLOYMENT.id;

  const hasProxyOrigin = Boolean(browserOrigin);

  return {
    blockchainRpcUrl:
      rpcOverride ||
      (browserOrigin ? toHttpUrl(browserOrigin, '/rpc') : 'http://127.0.0.1:9933'),
    blockchainWsUrl:
      wsOverride ||
      (browserOrigin ? toWebSocketUrl(browserOrigin, '/ws') : 'ws://127.0.0.1:9944'),
    endpointSource: getEndpointSource(Boolean(wsOverride || rpcOverride), hasProxyOrigin),
    gemContracts: {
      beliNft: beliNftContract || CEIBA_GEM_DEPLOYMENT.beliNft,
      dalla: dallaContract || CEIBA_GEM_DEPLOYMENT.dalla,
      dao: daoContract || CEIBA_GEM_DEPLOYMENT.dao,
      faucet: faucetContract || CEIBA_GEM_DEPLOYMENT.faucet,
      psp37: psp37Contract || CEIBA_GEM_DEPLOYMENT.psp37,
      dexFactory: dexFactoryContract || CEIBA_GEM_DEPLOYMENT.dexFactory,
      dexRouter: dexRouterContract || CEIBA_GEM_DEPLOYMENT.dexRouter,
    },
    gemDeploymentId,
    ipfsGatewayUrl:
      ipfsOverride ||
      (browserOrigin ? toHttpUrl(browserOrigin, '/ipfs') : 'http://127.0.0.1:8082/ipfs'),
    kinichApiUrl:
      kinichOverride ||
      (browserOrigin ? toHttpUrl(browserOrigin, '/api/kinich') : 'http://localhost:8888'),
    nawalApiUrl:
      nawalOverride ||
      (browserOrigin ? toHttpUrl(browserOrigin, '/api/nawal') : 'http://localhost:8080'),
    networkName:
      networkNameOverride ||
      (browserOrigin ? 'BelizeChain Mainnet' : 'Local Development'),
    pakitApiUrl:
      pakitOverride ||
      (browserOrigin ? toHttpUrl(browserOrigin, '/api/pakit') : 'http://localhost:8001'),
  };
}

export function getBlockchainWsEndpoints(): string[] {
  const primaryEndpoint = getRuntimeConfig().blockchainWsUrl;

  if (!isLocalWsUrl(primaryEndpoint)) {
    return [primaryEndpoint];
  }

  return Array.from(new Set([primaryEndpoint, 'ws://127.0.0.1:9944', 'ws://localhost:9944']));
}

export function isLocalRuntimeConfig(config: RuntimeConfig = getRuntimeConfig()): boolean {
  return config.endpointSource === 'local';
}