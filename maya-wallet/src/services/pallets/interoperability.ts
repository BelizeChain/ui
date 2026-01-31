/**
 * BelizeChain Interoperability Pallet Integration
 * Handles cross-chain bridges to Ethereum and Polkadot ecosystem
 */

import { ApiPromise } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';

export interface Bridge {
  id: string;
  name: string;
  chain: 'Ethereum' | 'Polkadot' | 'Kusama' | 'Other';
  status: 'Active' | 'Paused' | 'Maintenance';
  supportedAssets: string[];
  dailyLimit: string;
  transactionLimit: string;
  fee: string; // Percentage
  estimatedTime: number; // Minutes
}

export interface BridgeTransfer {
  transferId: string;
  from: string;
  to: string; // Cross-chain address
  fromChain: string;
  toChain: string;
  asset: string;
  amount: string;
  fee: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Refunded';
  initiatedAt: number;
  completedAt?: number;
  sourceHash?: string; // BelizeChain tx hash
  destinationHash?: string; // Target chain tx hash
  confirmations: number;
  requiredConfirmations: number;
}

export interface CrossChainAsset {
  symbol: string;
  name: string;
  originChain: string;
  totalLocked: string; // Amount locked in bridge
  totalMinted: string; // Wrapped tokens on BelizeChain
  isWrapped: boolean;
  contractAddress?: string; // On origin chain
  belizeAddress?: string; // Token address on BelizeChain
}

/**
 * Get all available bridges
 */
export async function getBridges(): Promise<Bridge[]> {
  const api = await initializeApi();
  
  try {
    const bridges: any = await api.query.interoperability?.bridges.entries();
    
    if (!bridges || bridges.length === 0) {
      return [];
    }

    return bridges.map(([key, value]: [any, any]) => {
      const id = key.args[0].toString();
      const data = value.unwrap();
      
      return {
        id,
        name: data.name.toString(),
        chain: data.chain.toString() as any,
        status: data.status.toString() as any,
        supportedAssets: data.supportedAssets.toHuman() as string[],
        dailyLimit: formatBalance(data.dailyLimit.toString()),
        transactionLimit: formatBalance(data.transactionLimit.toString()),
        fee: (data.fee.toNumber() / 100).toFixed(2), // Convert from basis points
        estimatedTime: data.estimatedTime.toNumber(),
      };
    });
  } catch (error) {
    console.error('Failed to fetch bridges:', error);
    return [];
  }
}

/**
 * Get bridge by chain
 */
export async function getBridgeByChain(chain: 'Ethereum' | 'Polkadot' | 'Kusama'): Promise<Bridge | null> {
  const bridges = await getBridges();
  return bridges.find(b => b.chain === chain && b.status === 'Active') || null;
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
    const amountInPlanck = parseFloat(amount) * Math.pow(10, 12);
    
    const tx = api.tx.interoperability.initiateBridgeTransfer(
      bridgeId,
      toAddress,
      asset,
      amountInPlanck
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let transferId = '';
          let estimatedFee = '0.00';
          
          events.forEach(({ event }) => {
            if (api.events.interoperability?.TransferInitiated?.is(event)) {
              const [, id, fee] = event.data;
              transferId = id.toString();
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
    console.error('Bridge transfer failed:', error);
    throw error;
  }
}

/**
 * Get bridge transfer status
 */
export async function getBridgeTransfer(transferId: string): Promise<BridgeTransfer | null> {
  const api = await initializeApi();
  
  try {
    const transfer: any = await api.query.interoperability?.transfers(transferId);
    
    if (!transfer || transfer.isNone) {
      return null;
    }

    const data = transfer.unwrap();
    
    return {
      transferId,
      from: data.from.toString(),
      to: data.to.toString(),
      fromChain: data.fromChain.toString(),
      toChain: data.toChain.toString(),
      asset: data.asset.toString(),
      amount: formatBalance(data.amount.toString()),
      fee: formatBalance(data.fee.toString()),
      status: data.status.toString() as any,
      initiatedAt: data.initiatedAt.toNumber(),
      completedAt: data.completedAt?.toNumber(),
      sourceHash: data.sourceHash?.toString(),
      destinationHash: data.destinationHash?.toString(),
      confirmations: data.confirmations.toNumber(),
      requiredConfirmations: data.requiredConfirmations.toNumber(),
    };
  } catch (error) {
    console.error('Failed to fetch transfer:', error);
    return null;
  }
}

/**
 * Get user's bridge transfer history
 */
export async function getUserBridgeTransfers(
  address: string,
  limit: number = 50
): Promise<BridgeTransfer[]> {
  const api = await initializeApi();
  
  try {
    const allTransfers: any = await api.query.interoperability?.transfers.entries();
    
    if (!allTransfers || allTransfers.length === 0) {
      return [];
    }

    return allTransfers
      .filter(([, value]: [any, any]) => {
        const data = value.unwrap();
        return data.from.toString() === address;
      })
      .map(([key, value]: [any, any]) => {
        const transferId = key.args[0].toString();
        const data = value.unwrap();
        
        return {
          transferId,
          from: data.from.toString(),
          to: data.to.toString(),
          fromChain: data.fromChain.toString(),
          toChain: data.toChain.toString(),
          asset: data.asset.toString(),
          amount: formatBalance(data.amount.toString()),
          fee: formatBalance(data.fee.toString()),
          status: data.status.toString() as any,
          initiatedAt: data.initiatedAt.toNumber(),
          completedAt: data.completedAt?.toNumber(),
          sourceHash: data.sourceHash?.toString(),
          destinationHash: data.destinationHash?.toString(),
          confirmations: data.confirmations.toNumber(),
          requiredConfirmations: data.requiredConfirmations.toNumber(),
        };
      })
      .sort((a: { initiatedAt: number }, b: { initiatedAt: number }) => b.initiatedAt - a.initiatedAt)
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch user transfers:', error);
    return [];
  }
}

/**
 * Get cross-chain assets
 */
export async function getCrossChainAssets(): Promise<CrossChainAsset[]> {
  const api = await initializeApi();
  
  try {
    const assets: any = await api.query.interoperability?.crossChainAssets.entries();
    
    if (!assets || assets.length === 0) {
      return [];
    }

    return assets.map(([key, value]: [any, any]) => {
      const symbol = key.args[0].toString();
      const data = value.unwrap();
      
      return {
        symbol,
        name: data.name.toString(),
        originChain: data.originChain.toString(),
        totalLocked: formatBalance(data.totalLocked.toString()),
        totalMinted: formatBalance(data.totalMinted.toString()),
        isWrapped: data.isWrapped.toHuman(),
        contractAddress: data.contractAddress?.toString(),
        belizeAddress: data.belizeAddress?.toString(),
      };
    });
  } catch (error) {
    console.error('Failed to fetch cross-chain assets:', error);
    return [];
  }
}

/**
 * Estimate bridge transfer fee
 */
export async function estimateBridgeFee(
  bridgeId: string,
  amount: string
): Promise<{ fee: string; estimatedTime: number }> {
  const api = await initializeApi();
  
  try {
    const bridge: any = await api.query.interoperability?.bridges(bridgeId);
    
    if (!bridge || bridge.isNone) {
      throw new Error('Bridge not found');
    }

    const data = bridge.unwrap();
    const feePercentage = data.fee.toNumber() / 10000; // From basis points
    const amountValue = parseFloat(amount);
    const fee = (amountValue * feePercentage).toFixed(2);
    const estimatedTime = data.estimatedTime.toNumber();

    return {
      fee,
      estimatedTime,
    };
  } catch (error) {
    console.error('Failed to estimate fee:', error);
    return {
      fee: '0.00',
      estimatedTime: 0,
    };
  }
}

/**
 * Cancel pending bridge transfer (if not yet processed)
 */
export async function cancelBridgeTransfer(
  address: string,
  transferId: string
): Promise<{ hash: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.interoperability.cancelTransfer(transferId);

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash }) => {
        if (status.isInBlock) {
          resolve({ hash: txHash.toString() });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Cancel transfer failed:', error);
    throw error;
  }
}

/**
 * Claim refund for failed transfer
 */
export async function claimBridgeRefund(
  address: string,
  transferId: string
): Promise<{ hash: string; refundAmount: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const tx = api.tx.interoperability.claimRefund(transferId);

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let refundAmount = '0.00';
          
          events.forEach(({ event }) => {
            if (api.events.interoperability?.RefundClaimed?.is(event)) {
              const [, , amount] = event.data;
              refundAmount = formatBalance(amount.toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            refundAmount,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Claim refund failed:', error);
    throw error;
  }
}

/**
 * Get bridge statistics
 */
export async function getBridgeStats(bridgeId: string): Promise<{
  totalVolume: string;
  totalTransfers: number;
  successRate: number;
  averageTime: number; // Minutes
  dailyVolume: string;
}> {
  const api = await initializeApi();
  
  try {
    const stats: any = await api.query.interoperability?.bridgeStats(bridgeId);
    
    if (!stats || stats.isNone) {
      return {
        totalVolume: '0.00',
        totalTransfers: 0,
        successRate: 0,
        averageTime: 0,
        dailyVolume: '0.00',
      };
    }

    const data = stats.unwrap();
    
    return {
      totalVolume: formatBalance(data.totalVolume.toString()),
      totalTransfers: data.totalTransfers.toNumber(),
      successRate: (data.successfulTransfers.toNumber() / Math.max(data.totalTransfers.toNumber(), 1)) * 100,
      averageTime: data.averageTime.toNumber(),
      dailyVolume: formatBalance(data.dailyVolume.toString()),
    };
  } catch (error) {
    console.error('Failed to fetch bridge stats:', error);
    return {
      totalVolume: '0.00',
      totalTransfers: 0,
      successRate: 0,
      averageTime: 0,
      dailyVolume: '0.00',
    };
  }
}

/**
 * Validate cross-chain address format
 */
export function validateCrossChainAddress(address: string, chain: 'Ethereum' | 'Polkadot' | 'Kusama'): boolean {
  switch (chain) {
    case 'Ethereum':
      // Ethereum address validation (0x + 40 hex chars)
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    
    case 'Polkadot':
    case 'Kusama':
      // Substrate address validation (would use @polkadot/util-crypto in production)
      return address.length >= 47 && address.length <= 48;
    
    default:
      return false;
  }
}

/**
 * Get explorer URL for cross-chain transaction
 */
export function getCrossChainExplorerUrl(chain: string, txHash: string): string {
  const explorers: Record<string, string> = {
    'Ethereum': 'https://etherscan.io/tx/',
    'Polkadot': 'https://polkadot.subscan.io/extrinsic/',
    'Kusama': 'https://kusama.subscan.io/extrinsic/',
  };

  const baseUrl = explorers[chain];
  return baseUrl ? `${baseUrl}${txHash}` : '';
}

/**
 * Format balance helper
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}
