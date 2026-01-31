'use client';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
// Removed walletLogger to fix SSR issues
import type { Balance } from '@belizechain/shared';

let api: ApiPromise | null = null;
let wsProvider: WsProvider | null = null;

// BelizeChain node endpoint (default to local development node)
// Only access window in browser environment
const NODE_ENDPOINT = typeof window !== 'undefined' 
  ? process.env.NEXT_PUBLIC_NODE_ENDPOINT || 'ws://127.0.0.1:9944'
  : 'ws://127.0.0.1:9944';

/**
 * Initialize connection to BelizeChain node
 */
export async function initializeApi(): Promise<ApiPromise> {
  if (api && api.isConnected) {
    return api;
  }

  try {
    wsProvider = new WsProvider(NODE_ENDPOINT);
    api = await ApiPromise.create({ provider: wsProvider });
    
    const chain = await api.rpc.system.chain();
    const version = await api.rpc.system.version();
    const nodeName = await api.rpc.system.name();
    console.log('Connected to BelizeChain', {
      chain: chain.toString(),
      version: version.toString(),
      nodeName: nodeName.toString(),
    });

    return api;
  } catch (error) {
    console.error('Failed to connect to BelizeChain node', error);
    throw new Error('Unable to connect to blockchain. Please ensure the node is running.');
  }
}

/**
 * Disconnect from BelizeChain node
 */
export async function disconnectApi(): Promise<void> {
  if (api) {
    await api.disconnect();
    api = null;
  }
  if (wsProvider) {
    await wsProvider.disconnect();
    wsProvider = null;
  }
}

/**
 * Get account balance from blockchain
 */
export async function fetchBalance(address: string): Promise<Balance> {
  const apiInstance = await initializeApi();
  
  try {
    // Get account data
    const accountInfo: any = await apiInstance.query.system.account(address);
    const balances = accountInfo.data;
    
    // Convert from Planck (smallest unit) to DALLA (12 decimals)
    const free = formatBalance(balances.free.toString());
    const reserved = formatBalance(balances.reserved.toString());
    const total = (parseFloat(free) + parseFloat(reserved)).toFixed(2);
    
    // Get bBZD balance from economy pallet (if available)
    let bBZD = '0.00';
    try {
      const bBZDBalance = await apiInstance.query.economy?.bBzdBalances(address);
      if (bBZDBalance) {
        bBZD = formatBalance(bBZDBalance.toString());
      }
    } catch (error) {
      console.warn('bBZD balance not available:', error);
    }

    return {
      dalla: free,
      bBZD,
      free,
      reserved,
      total,
    };
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    throw new Error('Unable to fetch account balance');
  }
}

/**
 * Submit a transfer transaction
 */
export async function submitTransfer(
  from: string,
  to: string,
  amount: string,
  currency: 'dalla' | 'bBZD' = 'dalla'
): Promise<{ hash: string; blockHash?: string }> {
  const apiInstance = await initializeApi();
  
  try {
    // Get the signer from the extension
    const injector = await web3FromAddress(from);
    
    // Convert amount to Planck (smallest unit, 12 decimals)
    const amountInPlanck = parseFloat(amount) * Math.pow(10, 12);
    
    let tx;
    if (currency === 'dalla') {
      // Native token transfer
      tx = apiInstance.tx.balances.transfer(to, amountInPlanck);
    } else {
      // bBZD transfer via economy pallet
      tx = apiInstance.tx.economy?.transferBbzd(to, amountInPlanck);
      if (!tx) {
        throw new Error('bBZD transfers not available');
      }
    }

    // Sign and send transaction
    return new Promise((resolve, reject) => {
      tx.signAndSend(from, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          console.log(`Transaction included in block: ${status.asInBlock}`);
          
          // Check for errors
          events.forEach(({ event }) => {
            if (apiInstance.events.system.ExtrinsicFailed.is(event)) {
              const [dispatchError]: any = event.data;
              let errorMessage = 'Transaction failed';
              
              if (dispatchError.isModule) {
                const decoded = apiInstance.registry.findMetaError(dispatchError.asModule);
                errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
              }
              
              reject(new Error(errorMessage));
            }
          });

          resolve({
            hash: txHash.toString(),
            blockHash: status.asInBlock.toString(),
          });
        } else if (status.isFinalized) {
          console.log(`Transaction finalized: ${status.asFinalized}`);
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Transfer failed', error);
    throw new Error(error instanceof Error ? error.message : 'Transaction failed');
  }
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  currency: 'DALLA' | 'bBZD';
  timestamp: number;
  blockNumber: number;
  status: 'success' | 'failed' | 'pending';
  fee?: string;
  type: 'send' | 'receive';
  category?: string;
  note?: string;
}

/**
 * Get transaction history for an address
 * Note: This queries recent blocks. In production, use an indexer service.
 */
export async function fetchTransactionHistory(address: string, limit: number = 50): Promise<Transaction[]> {
  const apiInstance = await initializeApi();
  
  try {
    const transactions: Transaction[] = [];
    
    // Get current block number
    const currentHeader = await apiInstance.rpc.chain.getHeader();
    const currentBlock = currentHeader.number.toNumber();
    
    // Query last N blocks (adjust based on average block time)
    // BelizeChain: ~6 second blocks, so 600 blocks = ~1 hour
    const blocksToQuery = Math.min(600, currentBlock);
    const startBlock = Math.max(0, currentBlock - blocksToQuery);
    
    // Query blocks in reverse order (newest first)
    for (let blockNum = currentBlock; blockNum >= startBlock && transactions.length < limit; blockNum--) {
      try {
        const blockHash = await apiInstance.rpc.chain.getBlockHash(blockNum);
        const signedBlock = await apiInstance.rpc.chain.getBlock(blockHash);
        const apiAt = await apiInstance.at(blockHash);
        
        // Get timestamp from block
        const timestamp: any = await apiAt.query.timestamp.now();
        const timestampMs = timestamp.toNumber ? timestamp.toNumber() : Date.now();
        
        // Process extrinsics
        signedBlock.block.extrinsics.forEach((extrinsic, index) => {
          const { method: { method, section } } = extrinsic;
          
          // Check for transfer transactions
          if (section === 'balances' && method === 'transfer') {
            const [to, amount] = extrinsic.args;
            const from = extrinsic.signer.toString();
            
            if (from === address || to.toString() === address) {
              transactions.push({
                hash: extrinsic.hash.toString(),
                from,
                to: to.toString(),
                amount: formatBalance(amount.toString()),
                currency: 'DALLA',
                timestamp: timestampMs,
                blockNumber: blockNum,
                status: 'success',
                type: from === address ? 'send' : 'receive',
              });
            }
          } else if (section === 'economy' && method === 'transferBbzd') {
            const [to, amount] = extrinsic.args;
            const from = extrinsic.signer.toString();
            
            if (from === address || to.toString() === address) {
              transactions.push({
                hash: extrinsic.hash.toString(),
                from,
                to: to.toString(),
                amount: formatBalance(amount.toString()),
                currency: 'bBZD',
                timestamp: timestampMs,
                blockNumber: blockNum,
                status: 'success',
                type: from === address ? 'send' : 'receive',
              });
            }
          }
        });
      } catch (error) {
        console.debug(`Error querying block ${blockNum}:`, error);
        // Continue with next block
      }
    }
    
    return transactions.slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    console.error('Transaction history query failed', { error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Estimate transaction fees
 */
export async function estimateFee(
  from: string,
  to: string,
  amount: string,
  currency: 'dalla' | 'bBZD' = 'dalla'
): Promise<string> {
  const apiInstance = await initializeApi();
  
  try {
    const amountInPlanck = parseFloat(amount) * Math.pow(10, 12);
    
    let tx;
    if (currency === 'dalla') {
      tx = apiInstance.tx.balances.transfer(to, amountInPlanck);
    } else {
      tx = apiInstance.tx.economy?.transferBbzd(to, amountInPlanck);
      if (!tx) {
        throw new Error('bBZD transfers not available');
      }
    }

    const info = await tx.paymentInfo(from);
    return formatBalance(info.partialFee.toString());
  } catch (error) {
    console.error('Failed to estimate fee:', error);
    return '0.01'; // Default fee estimate
  }
}

/**
 * Subscribe to balance changes
 */
export async function subscribeToBalance(
  address: string,
  callback: (balance: Balance) => void
): Promise<() => void> {
  const apiInstance = await initializeApi();
  
  const unsubscribe: any = await apiInstance.query.system.account(address, async (accountInfo: any) => {
    const balances = accountInfo.data;
    const free = formatBalance(balances.free.toString());
    const reserved = formatBalance(balances.reserved.toString());
    const total = (parseFloat(free) + parseFloat(reserved)).toFixed(2);
    
    // Query bBZD balance from economy pallet
    let bBZD = '0.00';
    try {
      const bBZDBalance = await apiInstance.query.economy?.bBzdBalances(address);
      if (bBZDBalance && !bBZDBalance.isEmpty) {
        bBZD = formatBalance(bBZDBalance.toString());
      }
    } catch (error) {
      // bBZD pallet not available or no balance
      console.debug('bBZD balance query failed:', error);
    }
    
    callback({
      dalla: free,
      bBZD,
      free,
      reserved,
      total,
    });
  });

  return unsubscribe as () => void;
}

/**
 * Format balance from Planck to DALLA (12 decimals)
 */
function formatBalance(planck: string): string {
  const value = parseFloat(planck) / Math.pow(10, 12);
  return value.toFixed(2);
}

/**
 * Get current block number
 */
export async function getCurrentBlockNumber(): Promise<number> {
  const apiInstance = await initializeApi();
  const header = await apiInstance.rpc.chain.getHeader();
  return header.number.toNumber();
}

/**
 * Subscribe to new transactions for an address
 */
export async function subscribeToTransactions(
  address: string,
  callback: (transaction: Transaction) => void
): Promise<() => void> {
  const apiInstance = await initializeApi();
  
  // Subscribe to new blocks and filter for transactions
  const unsubscribe = await apiInstance.rpc.chain.subscribeNewHeads(async (header) => {
    try {
      const blockHash = header.hash;
      const blockNumber = header.number.toNumber();
      const signedBlock = await apiInstance.rpc.chain.getBlock(blockHash);
      const apiAt = await apiInstance.at(blockHash);
      
      // Get timestamp
      const timestamp: any = await apiAt.query.timestamp.now();
      const timestampMs = timestamp.toNumber ? timestamp.toNumber() : Date.now();
      
      // Process extrinsics
      signedBlock.block.extrinsics.forEach((extrinsic) => {
        const { method: { method, section } } = extrinsic;
        
        if (section === 'balances' && method === 'transfer') {
          const [to, amount] = extrinsic.args;
          const from = extrinsic.signer.toString();
          
          if (from === address || to.toString() === address) {
            callback({
              hash: extrinsic.hash.toString(),
              from,
              to: to.toString(),
              amount: formatBalance(amount.toString()),
              currency: 'DALLA',
              timestamp: timestampMs,
              blockNumber,
              status: 'success',
              type: from === address ? 'send' : 'receive',
            });
          }
        } else if (section === 'economy' && method === 'transferBbzd') {
          const [to, amount] = extrinsic.args;
          const from = extrinsic.signer.toString();
          
          if (from === address || to.toString() === address) {
            callback({
              hash: extrinsic.hash.toString(),
              from,
              to: to.toString(),
              amount: formatBalance(amount.toString()),
              currency: 'bBZD',
              timestamp: timestampMs,
              blockNumber,
              status: 'success',
              type: from === address ? 'send' : 'receive',
            });
          }
        }
      });
    } catch (error) {
      console.error('Error processing block:', error);
    }
  });

  return unsubscribe;
}

/**
 * Check if address is valid
 */
export function isValidAddress(address: string): boolean {
  try {
    const { decodeAddress, encodeAddress } = require('@polkadot/util-crypto');
    return encodeAddress(decodeAddress(address)) === address;
  } catch {
    return false;
  }
}
