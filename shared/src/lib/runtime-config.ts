type PublicRuntimeEnv = {
  NEXT_PUBLIC_BLOCKCHAIN_WS?: string;
  NEXT_PUBLIC_BLOCKCHAIN_RPC?: string;
  NEXT_PUBLIC_BELI_NFT_CONTRACT?: string;
  NEXT_PUBLIC_DALLA_CONTRACT?: string;
  NEXT_PUBLIC_DAO_CONTRACT?: string;
  NEXT_PUBLIC_FAUCET_CONTRACT?: string;
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
  };
  ipfsGatewayUrl: string;
  kinichApiUrl: string;
  nawalApiUrl: string;
  networkName: string;
  pakitApiUrl: string;
}

const localHostnames = new Set(['127.0.0.1', '::1', 'localhost']);

const publicEnv: PublicRuntimeEnv = {
  NEXT_PUBLIC_BLOCKCHAIN_WS: process.env.NEXT_PUBLIC_BLOCKCHAIN_WS,
  NEXT_PUBLIC_BLOCKCHAIN_RPC: process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC,
  NEXT_PUBLIC_BELI_NFT_CONTRACT: process.env.NEXT_PUBLIC_BELI_NFT_CONTRACT,
  NEXT_PUBLIC_DALLA_CONTRACT: process.env.NEXT_PUBLIC_DALLA_CONTRACT,
  NEXT_PUBLIC_DAO_CONTRACT: process.env.NEXT_PUBLIC_DAO_CONTRACT,
  NEXT_PUBLIC_FAUCET_CONTRACT: process.env.NEXT_PUBLIC_FAUCET_CONTRACT,
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
      beliNft: beliNftContract,
      dalla: dallaContract,
      dao: daoContract,
      faucet: faucetContract,
    },
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
      (browserOrigin ? 'BelizeChain Testnet' : 'Local Development'),
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