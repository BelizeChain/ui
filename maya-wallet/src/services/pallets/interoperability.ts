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

export const SUPPORTED_EXPANDED_CHAINS: ChainMetadata[] = [
  {
    id: 'belizechain',
    name: NETWORK_NAME,
    symbol: 'Ɗ',
    category: 'Substrate',
    icon: 'BZ',
    type: 'substrate',
    nativeGasToken: 'DALLA',
    estimatedTimeMin: 0.5,
    explorerUrl: 'https://scan.belizechain.org/tx/',
    addressPlaceholder: '5Cg3... / r1... (Substrate SS58)',
  },
  {
    id: 'base',
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
    id: 'arbitrum',
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
    id: 'optimism',
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
    id: 'polygon',
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
    id: 'ethereum',
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
    id: 'bsc',
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
    id: 'solana',
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
    id: 'tron',
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
    id: 'sui',
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
    id: 'near',
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
    id: 'avalanche',
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
    id: 'bitcoin',
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
    id: 'polkadot',
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
    const targetChainIndex = Number.parseInt(bridgeId, 10) || 0;
    const assetIndex = Number.parseInt(asset, 10) || 0;
    const tx = api.tx.interoperability.initiateBridge(
      targetChainIndex,
      toAddress,
      amountInPlanck.toString(),
      assetIndex,
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let transferId = `BRG-${Date.now().toString().slice(-6)}`;
          let estimatedFee = '0.05';

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
  const targetChain = SUPPORTED_EXPANDED_CHAINS.find((c) => c.id === chainId);
  const type = targetChain?.type || 'evm';

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
      return { isValid: true };
  }
}

/**
 * Get explorer URL for cross-chain transaction
 */
export function getCrossChainExplorerUrl(chainId: string, txHash: string): string {
  const chain = SUPPORTED_EXPANDED_CHAINS.find((c) => c.id === chainId);
  if (chain?.explorerUrl) {
    return `${chain.explorerUrl}${txHash}`;
  }
  return `https://etherscan.io/tx/${txHash}`;
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
