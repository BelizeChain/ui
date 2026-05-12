/**
 * BelizeChain BelizeX Pallet Integration
 *
 * Pallet on chain exposes:
 *   tx.belizeX.executeTrade(baseAsset, quoteAsset, amountIn, minAmountOut, isTourismTrade)
 *   tx.belizeX.addLiquidity(baseAsset, quoteAsset, baseAmount, quoteAmount, minLpTokens)
 *   tx.belizeX.removeLiquidity(baseAsset, quoteAsset, lpTokens, minBaseAmount, minQuoteAmount)
 *   query.belizeX.tradingPairs((AssetId, AssetId)) -> TradingPair
 *   query.belizeX.lpBalances((account, (AssetId, AssetId))) -> u128
 *
 * AssetId enum: DALLA | BBZD | TourismDALLA | WUSDC
 */

import type { ApiPromise } from '@polkadot/api';
import { web3FromAddress } from '@polkadot/extension-dapp';
import { initializeApi } from '../blockchain';

const PLANCK = 1_000_000_000_000n; // 12 decimals for all current belizeX assets

export type AssetSymbol = 'DALLA' | 'BBZD' | 'TourismDALLA' | 'WUSDC';
export const ASSET_SYMBOLS: AssetSymbol[] = ['DALLA', 'BBZD', 'TourismDALLA', 'WUSDC'];

/** belizeX pallet AssetId enum order — extrinsics accept the numeric index as u8. */
export const ASSET_ID_BY_SYMBOL: Record<AssetSymbol, number> = {
  DALLA: 0,
  BBZD: 1,
  TourismDALLA: 2,
  WUSDC: 3,
};

export interface TradingPair {
  baseAsset: AssetSymbol;
  quoteAsset: AssetSymbol;
  baseReserve: bigint;
  quoteReserve: bigint;
  totalLpTokens: bigint;
  feeRateBps: number;
  active: boolean;
}

export interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  priceImpactPct: number;
  minimumReceived: string;
  feeAmount: string;
  baseAsset: AssetSymbol;
  quoteAsset: AssetSymbol;
  /** True when swapping from base->quote, false for quote->base. */
  baseToQuote: boolean;
}

export interface SwapResult {
  hash: string;
}

export function toPlanck(amount: string | number): bigint {
  const s = typeof amount === 'number' ? amount.toString() : amount.trim();
  if (!s) return 0n;
  const [whole, frac = ''] = s.split('.');
  const fracPadded = (frac + '000000000000').slice(0, 12);
  return BigInt(whole || '0') * PLANCK + BigInt(fracPadded || '0');
}

export function fromPlanck(planck: bigint | string, fractionDigits = 4): string {
  const b = typeof planck === 'bigint' ? planck : BigInt(planck);
  const negative = b < 0n;
  const abs = negative ? -b : b;
  const whole = abs / PLANCK;
  const frac = abs % PLANCK;
  const fracStr = frac.toString().padStart(12, '0').slice(0, fractionDigits);
  const sign = negative ? '-' : '';
  return fractionDigits > 0 ? `${sign}${whole.toString()}.${fracStr}` : `${sign}${whole.toString()}`;
}

export async function getTradingPairs(api?: ApiPromise): Promise<TradingPair[]> {
  const a = api ?? (await initializeApi());
  const entries = await a.query.belizeX.tradingPairs.entries();
  return entries.map(([, value]) => {
    const data: any = (value as any).toJSON ? (value as any).toJSON() : value;
    return {
      baseAsset: data.baseAsset as AssetSymbol,
      quoteAsset: data.quoteAsset as AssetSymbol,
      baseReserve: BigInt(data.baseReserve ?? 0),
      quoteReserve: BigInt(data.quoteReserve ?? 0),
      totalLpTokens: BigInt(data.totalLpTokens ?? 0),
      feeRateBps: Number(data.feeRate ?? 0),
      active: !!data.active,
    } as TradingPair;
  });
}

export async function findPair(
  api: ApiPromise,
  from: AssetSymbol,
  to: AssetSymbol,
): Promise<{ pair: TradingPair; baseToQuote: boolean } | null> {
  if (from === to) return null;
  const pairs = await getTradingPairs(api);
  for (const p of pairs) {
    if (p.baseAsset === from && p.quoteAsset === to) return { pair: p, baseToQuote: true };
    if (p.baseAsset === to && p.quoteAsset === from) return { pair: p, baseToQuote: false };
  }
  return null;
}

export async function getSwapQuote(
  from: AssetSymbol,
  to: AssetSymbol,
  inputAmount: string,
  slippagePct = 0.5,
  api?: ApiPromise,
): Promise<SwapQuote> {
  const a = api ?? (await initializeApi());
  const located = await findPair(a, from, to);
  if (!located) throw new Error(`No trading pair found for ${from}/${to}`);
  const { pair, baseToQuote } = located;
  if (!pair.active) throw new Error(`Pair ${pair.baseAsset}/${pair.quoteAsset} is paused`);

  const reserveIn = baseToQuote ? pair.baseReserve : pair.quoteReserve;
  const reserveOut = baseToQuote ? pair.quoteReserve : pair.baseReserve;
  if (reserveIn === 0n || reserveOut === 0n) {
    throw new Error(`Pair ${pair.baseAsset}/${pair.quoteAsset} has no liquidity`);
  }

  const amountIn = toPlanck(inputAmount);
  if (amountIn <= 0n) throw new Error('Input amount must be positive');

  const feeBps = BigInt(pair.feeRateBps);
  const feeAmount = (amountIn * feeBps) / 10_000n;
  const amountInAfterFee = amountIn - feeAmount;
  const amountOut = (reserveOut * amountInAfterFee) / (reserveIn + amountInAfterFee);

  const num = amountOut * reserveIn * 10_000n;
  const den = amountIn * reserveOut;
  const impactBps = den === 0n ? 0n : 10_000n - num / den;
  const priceImpactPct = Number(impactBps) / 100;

  const slipBps = BigInt(Math.max(0, Math.round(slippagePct * 100)));
  const minOut = (amountOut * (10_000n - slipBps)) / 10_000n;

  return {
    inputAmount,
    outputAmount: fromPlanck(amountOut),
    priceImpactPct,
    minimumReceived: fromPlanck(minOut),
    feeAmount: fromPlanck(feeAmount),
    baseAsset: pair.baseAsset,
    quoteAsset: pair.quoteAsset,
    baseToQuote,
  };
}

export async function executeSwap(
  address: string,
  quote: SwapQuote,
  isTourismTrade = false,
): Promise<SwapResult> {
  const api = await initializeApi();
  const injector = await web3FromAddress(address);

  const amountIn = toPlanck(quote.inputAmount);
  const minOut = toPlanck(quote.minimumReceived);

  const tx = api.tx.belizeX.executeTrade(
    ASSET_ID_BY_SYMBOL[quote.baseAsset],
    ASSET_ID_BY_SYMBOL[quote.quoteAsset],
    amountIn.toString(),
    minOut.toString(),
    isTourismTrade,
  );

  return new Promise<SwapResult>((resolve, reject) => {
    tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        const msg = dispatchError.isModule
          ? api.registry.findMetaError(dispatchError.asModule).docs.join(' ') || dispatchError.toString()
          : dispatchError.toString();
        reject(new Error(msg));
        return;
      }
      if (status.isInBlock || status.isFinalized) {
        resolve({ hash: txHash.toString() });
      }
    }).catch(reject);
  });
}

export async function addLiquidity(
  address: string,
  baseAsset: AssetSymbol,
  quoteAsset: AssetSymbol,
  baseAmount: string,
  quoteAmount: string,
  minLpTokens = '0',
): Promise<{ hash: string }> {
  const api = await initializeApi();
  const injector = await web3FromAddress(address);

  const tx = api.tx.belizeX.addLiquidity(
    ASSET_ID_BY_SYMBOL[baseAsset],
    ASSET_ID_BY_SYMBOL[quoteAsset],
    toPlanck(baseAmount).toString(),
    toPlanck(quoteAmount).toString(),
    toPlanck(minLpTokens).toString(),
  );

  return new Promise((resolve, reject) => {
    tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        reject(new Error(dispatchError.toString()));
        return;
      }
      if (status.isInBlock || status.isFinalized) {
        resolve({ hash: txHash.toString() });
      }
    }).catch(reject);
  });
}

export async function removeLiquidity(
  address: string,
  baseAsset: AssetSymbol,
  quoteAsset: AssetSymbol,
  lpTokens: string,
  minBaseAmount = '0',
  minQuoteAmount = '0',
): Promise<{ hash: string }> {
  const api = await initializeApi();
  const injector = await web3FromAddress(address);

  const tx = api.tx.belizeX.removeLiquidity(
    ASSET_ID_BY_SYMBOL[baseAsset],
    ASSET_ID_BY_SYMBOL[quoteAsset],
    toPlanck(lpTokens).toString(),
    toPlanck(minBaseAmount).toString(),
    toPlanck(minQuoteAmount).toString(),
  );

  return new Promise((resolve, reject) => {
    tx.signAndSend(address, { signer: injector.signer }, ({ status, txHash, dispatchError }) => {
      if (dispatchError) {
        reject(new Error(dispatchError.toString()));
        return;
      }
      if (status.isInBlock || status.isFinalized) {
        resolve({ hash: txHash.toString() });
      }
    }).catch(reject);
  });
}

export async function getLpBalance(
  address: string,
  baseAsset: AssetSymbol,
  quoteAsset: AssetSymbol,
): Promise<bigint> {
  const api = await initializeApi();
  // Storage key uses the AssetId enum tuple — pass each variant as `{ DALLA: null }` form
  // since polkadot.js cannot decode a bare symbol string for non-unit enum input.
  const key: [object, object] = [{ [baseAsset]: null }, { [quoteAsset]: null }] as any;
  const raw: any = await api.query.belizeX.lpBalances(address, key);
  return BigInt(raw?.toString?.() ?? '0');
}

/**
 * Trade history requires an indexer to be efficient; the pallet does not
 * expose a per-account history query. Until an indexer is available this
 * returns an empty list. Kept as an export so analytics pages keep compiling.
 */
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

export async function getTradeHistory(_address: string, _limit = 50): Promise<TradeHistory[]> {
  return [];
}
