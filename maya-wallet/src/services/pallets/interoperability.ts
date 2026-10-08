/**
 * BelizeChain Interoperability Pallet Integration
 * Handles cross-chain bridges to Ethereum, Base, Arbitrum, Tron, Solana, Sui, Near, Bitcoin, and Polkadot ecosystems
 */

import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';
import { bytesToString } from '../../lib/codec';

/**
 * Display name for this chain.
 *
 * Taken from the build-time value rather than hardcoded. This source previously
 * labelled the chain "BelizeChain Mainnet" in every environment, which is wrong
 * on the Ceiba testnet. `NEXT_PUBLIC_*` is inlined by the build, so the value is
 * identical on the server and the client and cannot cause a hydration mismatch —
 * unlike reading `window.location` at module scope.
 */
const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME ?? 'BelizeChain Testnet';

export interface ChainMetadata {
  id: string;
  name: string;
  symbol: string;
  category: 'Layer 2' | 'Layer 1' | 'Non-EVM' | 'Substrate';
  icon: string;
  type: 'evm' | 'solana' | 'tron' | 'sui' | 'near' | 'bitcoin' | 'substrate';
  nativeGasToken: string;
  estimatedTimeMin: number;
  explorerUrl: string;
  addressPlaceholder: string;
}

/**
 * The chain this wallet runs on. It is **not** a `BridgeChain` variant, so it
 * can never be passed to `initiateBridge`.
 */
export const SOURCE_CHAIN: ChainMetadata = {
  id: 'belizechain',
  name: NETWORK_NAME,
  symbol: 'Ɗ',
  category: 'Substrate',
  icon: 'BZ',
  type: 'substrate',
  nativeGasToken: 'DALLA',
  estimatedTimeMin: 0.5,
  explorerUrl: 'https://explorer.belizechain.org/extrinsic/',
  addressPlaceholder: '5Cg3... / r1... (Substrate SS58)',
};

/**
 * Display metadata for `BridgeChain` variants.
 *
 * **`id` must be the exact runtime variant name** (PascalCase), because that
 * name is resolved through `BRIDGE_CHAIN_INDEX` to build the extrinsic's chain
 * index. Using a lower-case slug like `'ethereum'` resolved to `undefined`.
 */
export const BRIDGE_CHAIN_CATALOGUE: ChainMetadata[] = [
  {
    id: 'Base',
    name: 'Base (Coinbase L2)',
    symbol: 'BASE',
    category: 'Layer 2',
    icon: 'BASE',
    type: 'evm',
    nativeGasToken: 'ETH',
    estimatedTimeMin: 1,
    explorerUrl: 'https://basescan.org/tx/',
    addressPlaceholder: '0x... (42-char EVM Address)',
  },
  {
    id: 'ArbitrumOne',
    name: 'Arbitrum One',
    symbol: 'ARB',
    category: 'Layer 2',
    icon: 'ARB',
    type: 'evm',
    nativeGasToken: 'ETH',
    estimatedTimeMin: 1.5,
    explorerUrl: 'https://arbiscan.io/tx/',
    addressPlaceholder: '0x... (42-char EVM Address)',
  },
  {
    id: 'Optimism',
    name: 'Optimism (OP Mainnet)',
    symbol: 'OP',
    category: 'Layer 2',
    icon: 'OP',
    type: 'evm',
    nativeGasToken: 'ETH',
    estimatedTimeMin: 1.5,
    explorerUrl: 'https://optimistic.etherscan.io/tx/',
    addressPlaceholder: '0x... (42-char EVM Address)',
  },
  {
    id: 'Polygon',
    name: 'Polygon PoS / POL',
    symbol: 'POL',
    category: 'Layer 2',
    icon: 'POL',
    type: 'evm',
    nativeGasToken: 'POL',
    estimatedTimeMin: 2,
    explorerUrl: 'https://polygonscan.com/tx/',
    addressPlaceholder: '0x... (42-char EVM Address)',
  },
  {
    id: 'Ethereum',
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    category: 'Layer 1',
    icon: 'ETH',
    type: 'evm',
    nativeGasToken: 'ETH',
    estimatedTimeMin: 4,
    explorerUrl: 'https://etherscan.io/tx/',
    addressPlaceholder: '0x... (42-char EVM Address)',
  },
  {
    id: 'BinanceSmartChain',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    category: 'Layer 1',
    icon: 'BNB',
    type: 'evm',
    nativeGasToken: 'BNB',
    estimatedTimeMin: 1,
    explorerUrl: 'https://bscscan.com/tx/',
    addressPlaceholder: '0x... (42-char EVM Address)',
  },
  {
    id: 'Solana',
    name: 'Solana Mainnet',
    symbol: 'SOL',
    category: 'Non-EVM',
    icon: 'SOL',
    type: 'solana',
    nativeGasToken: 'SOL',
    estimatedTimeMin: 0.5,
    explorerUrl: 'https://solscan.io/tx/',
    addressPlaceholder: '7Ec... (Base58 Solana Address)',
  },
  {
    id: 'Tron',
    name: 'TRON (USDT Hub)',
    symbol: 'TRX',
    category: 'Non-EVM',
    icon: 'TRX',
    type: 'tron',
    nativeGasToken: 'TRX',
    estimatedTimeMin: 1,
    explorerUrl: 'https://tronscan.org/#/transaction/',
    addressPlaceholder: 'T9yD... (34-char Base58Check TRON Address)',
  },
  {
    id: 'Sui',
    name: 'Sui Network',
    symbol: 'SUI',
    category: 'Non-EVM',
    icon: 'SUI',
    type: 'sui',
    nativeGasToken: 'SUI',
    estimatedTimeMin: 0.5,
    explorerUrl: 'https://suiscan.xyz/mainnet/tx/',
    addressPlaceholder: '0x... (66-char Sui Hex Address)',
  },
  {
    id: 'Near',
    name: 'Near Protocol',
    symbol: 'NEAR',
    category: 'Non-EVM',
    icon: 'NEAR',
    type: 'near',
    nativeGasToken: 'NEAR',
    estimatedTimeMin: 1,
    explorerUrl: 'https://nearblocks.io/txns/',
    addressPlaceholder: 'user.near / 64-char Hex',
  },
  {
    id: 'Avalanche',
    name: 'Avalanche C-Chain',
    symbol: 'AVAX',
    category: 'Layer 1',
    icon: 'AVAX',
    type: 'evm',
    nativeGasToken: 'AVAX',
    estimatedTimeMin: 1,
    explorerUrl: 'https://snowtrace.io/tx/',
    addressPlaceholder: '0x... (42-char EVM Address)',
  },
  {
    id: 'Bitcoin',
    name: 'Bitcoin (Lightning / Runes)',
    symbol: 'BTC',
    category: 'Non-EVM',
    icon: 'BTC',
    type: 'bitcoin',
    nativeGasToken: 'BTC',
    estimatedTimeMin: 10,
    explorerUrl: 'https://mempool.space/tx/',
    addressPlaceholder: 'bc1p... / 1... / 3... (Bitcoin Address)',
  },
  {
    id: 'Polkadot',
    name: 'Polkadot Relay',
    symbol: 'DOT',
    category: 'Substrate',
    icon: 'DOT',
    type: 'substrate',
    nativeGasToken: 'DOT',
    estimatedTimeMin: 2,
    explorerUrl: 'https://polkadot.subscan.io/extrinsic/',
    addressPlaceholder: '15... (Polkadot SS58 Address)',
  },
];

/** The source chain followed by every described bridge target. */
export const SUPPORTED_EXPANDED_CHAINS: ChainMetadata[] = [
  SOURCE_CHAIN,
  ...BRIDGE_CHAIN_CATALOGUE,
];

/**
 * The runtime's `BridgeChain` variants, indexed exactly as
 * `pallet_interoperability::decode_chain` decodes them.
 *
 * `initiateBridge` takes a `u8` chain index, not a variant name, so this map is
 * the only correct way to turn a picker selection into an extrinsic argument.
 * An earlier version did `Number.parseInt(bridgeId, 10) || 0` on a variant name
 * like `'Ethereum'`; `parseInt` returned `NaN`, `|| 0` silently produced
 * **Bitcoin**, and the transfer was submitted against the wrong chain.
 *
 * Keep in sync with `decode_chain` in
 * `pallets/interoperability/src/lib.rs`.
 */
export const BRIDGE_CHAIN_INDEX: Readonly<Record<string, number>> = {
  Bitcoin: 0,
  Ethereum: 1,
  Solana: 2,
  BinanceSmartChain: 3,
  Tron: 4,
  Ripple: 5,
  Cardano: 6,
  Dogecoin: 7,
  Polygon: 8,
  Litecoin: 9,
  Polkadot: 10,
  Avalanche: 11,
  CosmosHub: 12,
  Ton: 13,
  InternetComputer: 14,
  Near: 15,
  Stellar: 16,
  Algorand: 17,
  Tezos: 18,
  EOS: 19,
  Hedera: 20,
  Fantom: 21,
  Aptos: 22,
  Sui: 23,
  Kava: 24,
  Celo: 25,
  Harmony: 26,
  Cronos: 27,
  Thorchain: 28,
  Gnosis: 29,
  ArbitrumOne: 30,
  Optimism: 31,
  Base: 32,
  ZkSyncEra: 33,
  Linea: 34,
  Scroll: 35,
  Mantle: 36,
  PolygonZkEvm: 37,
  Metis: 38,
  Boba: 39,
  Zora: 40,
  Moonbeam: 41,
  Moonriver: 42,
  Kusama: 43,
  OKTC: 44,
  Waves: 45,
  Qtum: 46,
  BitTorrentChain: 47,
  ICON: 48,
  VeChain: 49,
  XCM: 50,
};

/**
 * `BridgeAsset` variants, indexed as `decode_asset` decodes them.
 *
 * The pallet supports exactly two bridged assets. The picker used to offer
 * USDT, USDC, ETH, SOL, TRX and BTC as well; `Number.parseInt('bBZD', 10) || 0`
 * then resolved to DALLA, so selecting bBZD bridged DALLA instead.
 */
export const BRIDGE_ASSET_INDEX: Readonly<Record<string, number>> = {
  DALLA: 0,
  bBZD: 1,
};

/** `BridgeAsset` symbol for an index, for rendering decoded transfers. */
export const BRIDGE_ASSET_BY_INDEX: readonly string[] = ['DALLA', 'bBZD'];

/** Look up the runtime chain index for a `BridgeChain` variant name. */
export function getBridgeChainIndex(chain: string): number | null {
  return BRIDGE_CHAIN_INDEX[chain] ?? null;
}

/** Look up the runtime asset index for a `BridgeAsset` symbol. */
export function getBridgeAssetIndex(asset: string): number | null {
  return BRIDGE_ASSET_INDEX[asset] ?? null;
}

/**
 * Mirrors `interoperability.chainConfigurations: BridgeChain -> ChainConfig`.
 *
 * `status` is derived from `enabled` — the pallet stores a boolean, not a
 * lifecycle state — and there is no daily/transaction limit or per-chain
 * asset list. An earlier version of this file read a non-existent `bridges`
 * map and, when that failed, returned a hardcoded registry that declared all
 * 50+ chains Active with invented 10,000,000 / 500,000 limits.
 */
export interface Bridge {
  /** The `BridgeChain` variant name, e.g. 'Ethereum'. */
  id: string;
  name: string;
  chain: string;
  status: 'Active' | 'Disabled';
  /** Largest single transfer accepted, in DALLA. */
  maxAmount: string;
  minConfirmations: number;
  /** Fee in basis points. */
  feeRateBps: number;
  pqSignaturesRequired: number;
  rpcEndpoint: string;
  contractAddress?: string;
}

export interface BridgeTransfer {
  transferId: string;
  from: string;
  to: string;
  fromChain: string;
  toChain: string;
  asset: string;
  amount: string;
  fee: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Refunded';
  initiatedAt: number;
  completedAt?: number;
  sourceHash?: string;
  destinationHash?: string;
  confirmations: number;
  requiredConfirmations: number;
}

export interface CrossChainAsset {
  symbol: string;
  name: string;
  originChain: string;
  totalLocked: string;
  totalMinted: string;
  isWrapped: boolean;
  contractAddress?: string;
  belizeAddress?: string;
}

/**
 * Get all available bridges
 */
export async function getBridges(): Promise<Bridge[]> {
  try {
    const api = await initializeApi();
    if (!api.query.interoperability?.chainConfigurations) return [];

    const entries = await api.query.interoperability.chainConfigurations.entries();
    const bridges: Bridge[] = [];

    for (const [key, raw] of entries as any[]) {
      const data = raw?.toJSON?.();
      if (!data) continue;
      const id = String(key?.args?.[0] ?? '');
      bridges.push({
        id,
        name: id,
        chain: id,
        status: data.enabled ? 'Active' : 'Disabled',
        maxAmount: formatBalance(String(data.maxAmount ?? '0')),
        minConfirmations: Number(data.minConfirmations ?? 0),
        feeRateBps: Number(data.feeRate ?? 0),
        pqSignaturesRequired: Number(data.pqSignaturesRequired ?? 0),
        rpcEndpoint: bytesToString(data.rpcEndpoint),
        contractAddress: data.contractAddress ? bytesToString(data.contractAddress) : undefined,
      });
    }

    return bridges;
  } catch (error) {
    console.warn('Failed to query on-chain bridge configurations:', error);
  }

  // No fabricated registry. A hardcoded list used to be returned here claiming
  // every chain was 'Active' with invented limits and fees. Bridge availability
  // is a security-relevant claim: if the chain does not say a bridge is enabled,
  // the UI must not imply that it is.
  return [];
}

/**
 * The chains that can actually be bridged to, from `chainConfigurations`.
 *
 * This is what the picker must be driven by. The runtime's `BridgeChain` enum
 * has 51 variants, but a variant is only usable once governance has written a
 * `ChainConfig` for it — and `update_bridge_config` refuses to create one, so a
 * configuration can only arrive via genesis or a runtime migration.
 *
 * Display fields are looked up by exact variant name; a variant the catalogue
 * does not describe still appears, with its id as the label, rather than being
 * hidden or given invented metadata.
 */
export async function getConfiguredChains(includeDisabled = false): Promise<ChainMetadata[]> {
  const bridges = await getBridges();
  return bridges
    .filter((bridge) => includeDisabled || bridge.status === 'Active')
    .map((bridge) => {
      const catalogue = BRIDGE_CHAIN_CATALOGUE.find((c) => c.id === bridge.id);
      if (catalogue) return catalogue;
      return {
        id: bridge.id,
        name: bridge.id,
        symbol: bridge.id.slice(0, 3).toUpperCase(),
        category: 'Layer 1' as const,
        icon: bridge.id.slice(0, 3).toUpperCase(),
        type: 'evm' as const,
        nativeGasToken: '—',
        estimatedTimeMin: 0,
        explorerUrl: '',
        addressPlaceholder: 'Address format for this chain is not validated by the wallet',
      };
    });
}

/**
 * One entry of `interoperability.bridgeValidators`.
 *
 * There is no separate relayer registry: a relayer exists only as a
 * `BridgeValidator` entry keyed by its `BridgeChain`. The previous UI invented
 * a fixed set of named nodes with stakes and uptimes and a "5/7" threshold;
 * nothing on chain stores a node name, an uptime percentage or a quorum size.
 */
export interface BridgeValidatorView {
  chain: string;
  account: string;
  /** ML-DSA-87 (FIPS 204) public key, hex — 2592 bytes max. */
  pqPublicKeyHex: string;
  /** `BridgeChain` variants this validator signs for. */
  supportedChains: string[];
  stake: string;
  /** 0-100 as recorded by the pallet. */
  reliabilityScore: number;
  signaturesCount: number;
  failedSignatures: number;
}

/** Read every registered bridge validator, across all chains. */
export async function getBridgeValidators(): Promise<BridgeValidatorView[]> {
  try {
    const api = await initializeApi();
    if (!api.query.interoperability?.bridgeValidators) return [];

    const entries = await api.query.interoperability.bridgeValidators.entries();
    const validators: BridgeValidatorView[] = [];

    for (const [key, raw] of entries as any[]) {
      const data = raw?.toJSON?.();
      if (!data) continue;
      validators.push({
        chain: String(key?.args?.[0] ?? ''),
        account: String(data.account ?? ''),
        pqPublicKeyHex: bytesToHex(data.pqPublicKey),
        supportedChains: Array.isArray(data.supportedChains)
          ? data.supportedChains.map((c: unknown) => String(c))
          : [],
        stake: formatBalance(String(data.stake ?? '0')),
        reliabilityScore: Number(data.reliabilityScore ?? 0),
        signaturesCount: Number(data.signaturesCount ?? 0),
        failedSignatures: Number(data.failedSignatures ?? 0),
      });
    }

    return validators;
  } catch (error) {
    console.warn('Failed to read bridge validators:', error);
    return [];
  }
}

/**
 * Initiate cross-chain transfer
 */
export async function initiateBridgeTransfer(
  address: string,
  bridgeId: string,
  toAddress: string,
  asset: string,
  amount: string
): Promise<{ hash: string; transferId: string; estimatedFee: string }> {
  const api = await initializeApi();

  try {
    const injector = await web3FromAddress(address);
    const amountInPlanck = BigInt(Math.floor(parseFloat(amount) * 1e12));

    // Resolve the picker's selection to the runtime's numeric arguments.
    // Defaulting to 0 here — as this used to — silently retargets the transfer
    // to Bitcoin and treats bBZD as DALLA, so an unknown name must abort.
    const targetChainIndex = getBridgeChainIndex(bridgeId);
    if (targetChainIndex === null) {
      throw new Error(
        `"${bridgeId}" is not a BridgeChain variant, so no chain index exists for it. Nothing was submitted.`,
      );
    }

    const assetIndex = getBridgeAssetIndex(asset);
    if (assetIndex === null) {
      throw new Error(
        `"${asset}" is not a bridged asset. pallet interoperability supports DALLA and bBZD only. Nothing was submitted.`,
      );
    }

    const tx = api.tx.interoperability.initiateBridge(
      targetChainIndex,
      toAddress,
      amountInPlanck.toString(),
      assetIndex,
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          // Both values come from the pallet's own events. When an event is
          // absent we report it as absent rather than defaulting to a
          // timestamp-derived id and a made-up 0.05 fee.
          let transferId = '';
          let estimatedFee = '';

          events.forEach(({ event }) => {
            if (api.events.interoperability?.BridgeTransactionInitiated?.is(event)) {
              const [txId] = event.data;
              transferId = `BRG-${txId.toString()}`;
            }
            if (api.events.interoperability?.BridgeFeeCollected?.is(event)) {
              const [, fee] = event.data;
              estimatedFee = formatBalance(fee.toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            transferId,
            estimatedFee,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    // Never invent a hash. bridge/page.tsx renders an explicit "Awaiting" state
    // when this throws, whereas a fabricated txHash would look like a real
    // submission and leave the user believing funds had moved.
    console.error('Bridge transfer failed:', error);
    throw error;
  }
}

const BRIDGE_STATUSES = ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded'] as const;
type BridgeStatus = (typeof BRIDGE_STATUSES)[number];

/** Normalise a pallet status into the UI union rather than casting it blindly. */
function toBridgeStatus(raw: string | undefined): BridgeStatus {
  if (raw === 'Finalized' || raw === 'Executed') {
    return 'Completed';
  }
  return BRIDGE_STATUSES.find((status) => status === raw) ?? 'Pending';
}

/**
 * Shape one `interoperability.bridgeTransactions` entry as the UI expects.
 *
 * Shared by the history read and the single-transfer read so the two cannot
 * drift in how they decode the same record.
 */
function mapBridgeTransaction(id: number, entry: any): BridgeTransfer {
  const data = entry.unwrap();

  let to = '';
  // No invented defaults: a transfer whose operation we cannot decode must not
  // be reported as targeting 'Base' with an amount of 0.
  let targetChain = '';
  let asset = '';
  let amount = '0';

  const op = data.operation;
  if (op?.isLockAndMint) {
    const o = op.asLockAndMint;
    to = o.targetAddress?.toUtf8?.() || o.targetAddress?.toString() || '';
    targetChain = o.targetChain?.toString() || '';
    asset = o.asset?.toString() || '';
    amount = formatBalance(o.amount?.toString() || '0');
  } else if (op?.isBurnAndUnlock) {
    const o = op.asBurnAndUnlock;
    to = o.recipient?.toUtf8?.() || o.recipient?.toString() || '';
    targetChain = o.sourceChain?.toString() || '';
    asset = o.asset?.toString() || '';
    amount = formatBalance(o.amount?.toString() || '0');
  } else if (op?.isMessagePassing) {
    targetChain = op.asMessagePassing.targetChain?.toString() || '';
  }

  return {
    transferId: `BRG-${id}`,
    from: data.initiator.toString(),
    to,
    fromChain: NETWORK_NAME,
    toChain: targetChain,
    asset,
    amount,
    fee: formatBalance(data.fee?.toString() || '0'),
    status: toBridgeStatus(data.status?.toString()),
    initiatedAt: data.initiatedAt?.toNumber() || 0,
    completedAt: data.completedAt?.isSome ? data.completedAt.unwrap().toNumber() : undefined,
    confirmations: data.collectedSignatures?.toNumber() || 0,
    requiredConfirmations: data.requiredSignatures?.toNumber() || 0,
  };
}

/**
 * Get user's bridge transfer history
 */
export async function getUserBridgeTransfers(
  address: string,
  limit: number = 50
): Promise<BridgeTransfer[]> {
  try {
    const api = await initializeApi();
    const allTransfers: any = await api.query.interoperability?.bridgeTransactions?.entries?.() || [];

    if (allTransfers && allTransfers.length > 0) {
      return allTransfers
        .filter(([, value]: [any, any]) => {
          if (!value || value.isNone) return false;
          const data = value.unwrap();
          return data.initiator?.toString() === address;
        })
        .map(([key, value]: [any, any]) => mapBridgeTransaction(Number(key.args[0].toString()), value))
        .sort((a: { initiatedAt: number }, b: { initiatedAt: number }) => b.initiatedAt - a.initiatedAt)
        .slice(0, limit);
    }
  } catch (error) {
    console.warn('Failed to query on-chain bridge transfers:', error);
  }

  // No fabricated history: a real query returns what the chain holds, and an
  // empty result is the honest answer for an account with no bridge activity.
  // (A hardcoded bootstrap list used to be returned for specific addresses,
  // presenting invented "Completed" transfers worth tens of thousands.)
  return [];
}

/**
 * Validate cross-chain address format for any supported network
 */
export function validateCrossChainAddress(address: string, chainId: string): { isValid: boolean; message?: string } {
  if (!address || !address.trim()) {
    return { isValid: false, message: 'Recipient address is required.' };
  }

  const trimmed = address.trim();
  const targetChain = BRIDGE_CHAIN_CATALOGUE.find((c) => c.id === chainId);

  // A chain the catalogue does not describe gets no format check. Returning
  // `isValid: true` with an explicit message is honest; the previous code fell
  // back to `type: 'evm'` and rejected valid non-EVM addresses with an EVM
  // format error.
  if (!targetChain) {
    return {
      isValid: true,
      message: `Address format is not validated for ${chainId}. Confirm it on the destination chain before sending.`,
    };
  }

  const type = targetChain.type;

  switch (type) {
    case 'evm':
      // 0x + 40 hex characters
      if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
        return { isValid: true };
      }
      return { isValid: false, message: `Invalid EVM address format for ${targetChain?.name || 'network'}. Must be 0x followed by 40 hex characters.` };

    case 'tron':
      // Starts with T, 34 Base58 characters
      if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmed)) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Invalid TRON address format. Must start with "T" and contain 34 Base58 characters.' };

    case 'solana':
      // Base58, typically 32 to 44 characters
      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Invalid Solana address format. Must be 32-44 Base58 characters.' };

    case 'sui':
      // 0x + 64 hex characters
      if (/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Invalid Sui address format. Must be 0x followed by 64 hex characters.' };

    case 'near':
      // Named account (e.g. alice.near) or 64 hex characters
      if (/^([a-z0-9_-]+\.)*(near|tg|testnet)$/.test(trimmed) || /^[a-fA-F0-9]{64}$/.test(trimmed)) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Invalid NEAR account ID format (e.g. name.near or 64-char hex).' };

    case 'bitcoin':
      // SegWit bc1, Legacy 1, P2SH 3
      if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(trimmed)) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Invalid Bitcoin address format (bc1, 1, or 3).' };

    case 'substrate':
      // SS58 formatted address (47 to 49 chars)
      if (trimmed.length >= 47 && trimmed.length <= 49) {
        return { isValid: true };
      }
      return { isValid: false, message: 'Invalid Substrate / BelizeChain address length.' };

    default:
      // An address type the wallet has no rule for is reported as unvalidated
      // rather than silently accepted.
      return {
        isValid: true,
        message: `Address format is not validated for ${targetChain.name}. Confirm it on the destination chain before sending.`,
      };
  }
}

/**
 * Get explorer URL for cross-chain transaction
 */
export function getCrossChainExplorerUrl(chainId: string, txHash: string): string {
  const chain = BRIDGE_CHAIN_CATALOGUE.find((c) => c.id === chainId);
  if (chain?.explorerUrl) {
    return `${chain.explorerUrl}${txHash}`;
  }
  // No explorer is known for this chain, so no link is offered. The previous
  // fallback sent every unknown chain to etherscan, which showed a valid-looking
  // page for a transaction that never happened there.
  return '';
}

/**
 * Get bridge by chain
 */
export async function getBridgeByChain(chain: string): Promise<Bridge | null> {
  const bridges = await getBridges();
  return bridges.find((b) => b.chain.toLowerCase() === chain.toLowerCase()) || null;
}

/**
 * Get bridge transfer status.
 *
 * Reads the real record. This previously returned a hardcoded completed
 * transfer for any id at all, including ids that had never existed.
 */
export async function getBridgeTransfer(transferId: string): Promise<BridgeTransfer | null> {
  const id = Number.parseInt(transferId.replace(/^BRG-/, ''), 10);
  if (!Number.isFinite(id)) {
    return null;
  }

  try {
    const api = await initializeApi();
    // The generated query types for this pallet are loose, so the Option wrapper
    // is asserted here — the same idiom the history read above uses.
    const entry: any = await api.query.interoperability.bridgeTransactions(id);
    if (!entry || entry.isNone) {
      return null;
    }
    return mapBridgeTransaction(id, entry);
  } catch (error) {
    console.error('Failed to read bridge transfer', transferId, error);
    return null;
  }
}

/**
 * Estimate the bridge fee from the chain's configured `feeRate` (basis points).
 *
 * The previous implementation used an invented formula (0.1% + a flat 0.05)
 * that had no relationship to what the pallet actually charges.
 */
export async function estimateBridgeFee(bridgeId: string, amount: string): Promise<{ fee: string; estimatedTime: number }> {
  const amt = parseFloat(amount) || 0;

  try {
    const api = await initializeApi();
    if (!api.query.interoperability?.chainConfigurations) {
      return { fee: '0.00', estimatedTime: 0 };
    }
    const raw: any = await api.query.interoperability.chainConfigurations(bridgeId as any);
    if (!raw || raw.isNone) {
      return { fee: '0.00', estimatedTime: 0 };
    }
    const feeRateBps = Number((raw.toJSON() as any)?.feeRate ?? 0);
    const fee = (amt * feeRateBps) / 10_000;
    // The pallet records no per-chain time estimate.
    return { fee: fee.toFixed(2), estimatedTime: 0 };
  } catch (error) {
    console.error('Failed to estimate bridge fee:', error);
    return { fee: '0.00', estimatedTime: 0 };
  }
}

/**
 * Cancel pending bridge transfer
 */
export async function cancelBridgeTransfer(address: string, transferId: string): Promise<{ hash: string }> {
  void address; void transferId;
  throw new Error('Bridge cancellation is not supported; transactions are secured by multi-sig quorum.');
}

/**
 * Claim refund for failed transfer
 */
export async function claimBridgeRefund(address: string, transferId: string): Promise<{ hash: string; refundAmount: string }> {
  void address; void transferId;
  throw new Error('Bridge refund claims are processed automatically by relayer unlock handlers.');
}

/**
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}

/**
 * Render a `Vec<u8>` decoded by `toJSON()` (an array of numbers) as a `0x…`
 * hex string. Returns an empty string for anything that is not a byte array.
 */
function bytesToHex(raw: unknown): string {
  if (!Array.isArray(raw) || raw.length === 0) return '';
  return `0x${raw.map((byte) => Number(byte).toString(16).padStart(2, '0')).join('')}`;
}
