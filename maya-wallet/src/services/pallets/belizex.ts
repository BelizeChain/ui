/**
 * BelizeChain BelizeX Pallet Integration
 * Handles DEX operations, liquidity pools, and asset registry
 */

import { ApiPromise } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: string;
  price?: string; // Current market price (UI compatibility)
  change?: number; // 24h price change percentage (UI compatibility)
  volume?: string; // 24h trading volume (UI compatibility)
  owner: string;
  isFrozen: boolean;
  metadata?: {
    description: string;
    website?: string;
    icon?: string;
  };
}

export interface LiquidityPool {
  id: string;
  token0: string; // Asset symbol
  token1: string;
  reserve0: string;
  reserve1: string;
  totalLiquidity: string;
  fee: number; // Percentage (e.g., 0.3 for 0.3%)
  volume24h: string;
  apy: number; // Annual percentage yield
}

export interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  priceImpact: number; // Percentage
  minimumReceived: string;
  fee: string;
  route: string[]; // Token symbols in swap path
}

export interface TradeHistory {
  hash: string;
  trader: string;
  type: 'Swap' | 'AddLiquidity' | 'RemoveLiquidity';
  token0: string;
  token1: string;
  amount0: string;
  amount1: string;
  timestamp: number;
  blockNumber: number;
}

/**
 * Get all registered assets
 */
export async function getAssets(): Promise<Asset[]> {
  const api = await initializeApi();
  
  try {
    const assets: any = await api.query.belizeX?.assets.entries();
    
    if (!assets || assets.length === 0) {
      return [];
    }

    return assets.map(([key, value]: [any, any]) => {
      const id = key.args[0].toString();
      const data = value.unwrap();
      
      return {
        id,
        symbol: data.symbol.toString(),
        name: data.name.toString(),
        decimals: data.decimals.toNumber(),
        totalSupply: formatBalance(data.totalSupply.toString(), data.decimals.toNumber()),
        owner: data.owner.toString(),
        isFrozen: data.isFrozen.toHuman(),
        metadata: data.metadata?.toHuman() as any,
      };
    });
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    return [];
  }
}

/**
 * Get asset balance for an address
 */
export async function getAssetBalance(address: string, assetId: string): Promise<string> {
  const api = await initializeApi();
  
  try {
    const balance: any = await api.query.belizeX?.assetBalances([assetId, address]);
    
    if (!balance || balance.isNone) {
      return '0.00';
    }

    const asset: any = await api.query.belizeX?.assets(assetId);
    const decimals = asset.unwrap().decimals.toNumber();

    return formatBalance(balance.unwrap().toString(), decimals);
  } catch (error) {
    console.error('Failed to fetch asset balance:', error);
    return '0.00';
  }
}

/**
 * Get all liquidity pools
 */
export async function getLiquidityPools(): Promise<LiquidityPool[]> {
  const api = await initializeApi();
  
  try {
    const pools: any = await api.query.belizeX?.liquidityPools.entries();
    
    if (!pools || pools.length === 0) {
      return [];
    }

    return await Promise.all(
      pools.map(async ([key, value]: [any, any]) => {
        const id = key.args[0].toString();
        const data = value.unwrap();
        
        // Get 24h volume and APY (would need indexer in production)
        const volume24h = '0.00'; // Placeholder
        const apy = 0; // Placeholder

        return {
          id,
          token0: data.token0.toString(),
          token1: data.token1.toString(),
          reserve0: formatBalance(data.reserve0.toString()),
          reserve1: formatBalance(data.reserve1.toString()),
          totalLiquidity: formatBalance(data.totalLiquidity.toString()),
          fee: data.fee.toNumber() / 10000, // Convert from basis points
          volume24h,
          apy,
        };
      })
    );
  } catch (error) {
    console.error('Failed to fetch liquidity pools:', error);
    return [];
  }
}

/**
 * Get swap quote
 */
export async function getSwapQuote(
  inputToken: string,
  outputToken: string,
  inputAmount: string,
  slippageTolerance: number = 0.5 // Default 0.5%
): Promise<SwapQuote> {
  const api = await initializeApi();
  
  try {
    const inputInPlanck = parseFloat(inputAmount) * Math.pow(10, 12);
    
    // Call runtime API for quote calculation
    // If a custom RPC is not available, throw a clear error for now
    const rpcAny = (api.rpc as any);
    if (!rpcAny?.belizeX?.getSwapQuote) {
      throw new Error('Swap quote RPC not available');
    }
    const quote: any = await rpcAny.belizeX.getSwapQuote(
      inputToken,
      outputToken,
      inputInPlanck
    );

    const outputAmount = formatBalance(quote.outputAmount.toString());
    const fee = formatBalance(quote.fee.toString());
    const priceImpact = quote.priceImpact.toNumber() / 100;
    
    // Calculate minimum received with slippage
    const minimumReceived = (parseFloat(outputAmount) * (1 - slippageTolerance / 100)).toFixed(2);

    return {
      inputAmount,
      outputAmount,
      priceImpact,
      minimumReceived,
      fee,
      route: quote.route.toHuman() as string[],
    };
  } catch (error) {
    console.error('Failed to get swap quote:', error);
    throw new Error('Unable to calculate swap quote');
  }
}

/**
 * Execute token swap
 */
export async function executeSwap(
  address: string,
  inputToken: string,
  outputToken: string,
  inputAmount: string,
  minimumOutput: string
): Promise<{ hash: string; outputAmount: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const inputInPlanck = parseFloat(inputAmount) * Math.pow(10, 12);
    const minOutputInPlanck = parseFloat(minimumOutput) * Math.pow(10, 12);
    
    const tx = api.tx.belizeX.swap(
      inputToken,
      outputToken,
      inputInPlanck,
      minOutputInPlanck
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let outputAmount = '0.00';
          
          // Extract output amount from events
          events.forEach(({ event }) => {
            if (api.events.belizeX?.Swapped?.is(event)) {
              const [, , , amount] = event.data;
              outputAmount = formatBalance(amount.toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            outputAmount,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Swap failed:', error);
    throw error;
  }
}

/**
 * Add liquidity to a pool
 */
export async function addLiquidity(
  address: string,
  token0: string,
  token1: string,
  amount0: string,
  amount1: string,
  minLiquidity: string = '0'
): Promise<{ hash: string; liquidityMinted: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const amount0InPlanck = parseFloat(amount0) * Math.pow(10, 12);
    const amount1InPlanck = parseFloat(amount1) * Math.pow(10, 12);
    const minLiquidityInPlanck = parseFloat(minLiquidity) * Math.pow(10, 12);
    
    const tx = api.tx.belizeX.addLiquidity(
      token0,
      token1,
      amount0InPlanck,
      amount1InPlanck,
      minLiquidityInPlanck
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let liquidityMinted = '0.00';
          
          // Extract liquidity minted from events
          events.forEach(({ event }) => {
            if (api.events.belizeX?.LiquidityAdded?.is(event)) {
              const [, , , , liquidity] = event.data;
              liquidityMinted = formatBalance(liquidity.toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            liquidityMinted,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Add liquidity failed:', error);
    throw error;
  }
}

/**
 * Remove liquidity from a pool
 */
export async function removeLiquidity(
  address: string,
  token0: string,
  token1: string,
  liquidityAmount: string,
  minAmount0: string = '0',
  minAmount1: string = '0'
): Promise<{ hash: string; amount0: string; amount1: string }> {
  const api = await initializeApi();
  
  try {
    const injector = await web3FromAddress(address);
    const liquidityInPlanck = parseFloat(liquidityAmount) * Math.pow(10, 12);
    const min0InPlanck = parseFloat(minAmount0) * Math.pow(10, 12);
    const min1InPlanck = parseFloat(minAmount1) * Math.pow(10, 12);
    
    const tx = api.tx.belizeX.removeLiquidity(
      token0,
      token1,
      liquidityInPlanck,
      min0InPlanck,
      min1InPlanck
    );

    return new Promise((resolve, reject) => {
      tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, events }) => {
        if (status.isInBlock) {
          let amount0 = '0.00';
          let amount1 = '0.00';
          
          // Extract amounts from events
          events.forEach(({ event }) => {
            if (api.events.belizeX?.LiquidityRemoved?.is(event)) {
              const [, , , amt0, amt1] = event.data;
              amount0 = formatBalance(amt0.toString());
              amount1 = formatBalance(amt1.toString());
            }
          });

          resolve({
            hash: txHash.toString(),
            amount0,
            amount1,
          });
        }
      }).catch(reject);
    });
  } catch (error) {
    console.error('Remove liquidity failed:', error);
    throw error;
  }
}

/**
 * Get trade history for an address
 */
export async function getTradeHistory(address: string, limit: number = 50): Promise<TradeHistory[]> {
  const api = await initializeApi();
  
  try {
    // In production, use an indexer. For now, scan recent blocks
    const currentHeader = await api.rpc.chain.getHeader();
    const currentBlock = currentHeader.number.toNumber();
    const blocksToQuery = Math.min(1000, currentBlock);
    const startBlock = Math.max(0, currentBlock - blocksToQuery);
    
    const trades: TradeHistory[] = [];

    for (let blockNum = currentBlock; blockNum >= startBlock && trades.length < limit; blockNum--) {
      try {
        const blockHash = await api.rpc.chain.getBlockHash(blockNum);
        const signedBlock = await api.rpc.chain.getBlock(blockHash);
        const apiAt = await api.at(blockHash);
        
        const timestamp: any = await apiAt.query.timestamp.now();
        const timestampMs = timestamp.toNumber ? timestamp.toNumber() : Date.now();

        signedBlock.block.extrinsics.forEach((extrinsic) => {
          const { method: { method, section } } = extrinsic;
          const signer = extrinsic.signer?.toString();
          
          if (section === 'belizeX' && signer === address) {
            if (method === 'swap') {
              const [token0, token1, amount0, minOutput] = extrinsic.args;
              trades.push({
                hash: extrinsic.hash.toString(),
                trader: signer,
                type: 'Swap',
                token0: token0.toString(),
                token1: token1.toString(),
                amount0: formatBalance(amount0.toString()),
                amount1: formatBalance(minOutput.toString()),
                timestamp: timestampMs,
                blockNumber: blockNum,
              });
            } else if (method === 'addLiquidity') {
              const [token0, token1, amount0, amount1] = extrinsic.args;
              trades.push({
                hash: extrinsic.hash.toString(),
                trader: signer,
                type: 'AddLiquidity',
                token0: token0.toString(),
                token1: token1.toString(),
                amount0: formatBalance(amount0.toString()),
                amount1: formatBalance(amount1.toString()),
                timestamp: timestampMs,
                blockNumber: blockNum,
              });
            } else if (method === 'removeLiquidity') {
              const [token0, token1, liquidity] = extrinsic.args;
              trades.push({
                hash: extrinsic.hash.toString(),
                trader: signer,
                type: 'RemoveLiquidity',
                token0: token0.toString(),
                token1: token1.toString(),
                amount0: formatBalance(liquidity.toString()),
                amount1: '0.00',
                timestamp: timestampMs,
                blockNumber: blockNum,
              });
            }
          }
        });
      } catch (error) {
        console.debug(`Error querying block ${blockNum}:`, error);
      }
    }

    return trades;
  } catch (error) {
    console.error('Failed to fetch trade history:', error);
    return [];
  }
}

/**
 * Format balance helper
 */
function formatBalance(planck: string, decimals: number = 12): string {
  const value = parseFloat(planck) / Math.pow(10, decimals);
  return value.toFixed(2);
}
