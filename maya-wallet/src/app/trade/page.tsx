'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GlassCard, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import * as belizexService from '@/services/pallets/belizex';
import type { AssetSymbol, TradingPair, SwapQuote } from '@/services/pallets/belizex';
import {
  ArrowsLeftRight,
  TrendUp,
  Coins,
  Swap,
  Vault,
  Lightning,
  ArrowLeft,
} from 'phosphor-react';

const SLIPPAGE_PCT = 0.5;

function pairKey(p: TradingPair) {
  return `${p.baseAsset}/${p.quoteAsset}`;
}

function reservesFor(pair: TradingPair, baseToQuote: boolean) {
  return baseToQuote
    ? { reserveIn: pair.baseReserve, reserveOut: pair.quoteReserve }
    : { reserveIn: pair.quoteReserve, reserveOut: pair.baseReserve };
}

export default function TradePage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();

  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [baseToQuote, setBaseToQuote] = useState(true);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('swap');

  const refreshPairs = useCallback(async () => {
    try {
      const list = await belizexService.getTradingPairs();
      setPairs(list);
      if (!selectedPair && list.length > 0) {
        const active = list.find((p) => p.active && p.baseReserve > 0n && p.quoteReserve > 0n) ?? list[0];
        setSelectedPair(pairKey(active));
      }
      setLoadError(null);
    } catch (err: any) {
      console.error('Failed to fetch trading pairs:', err);
      setLoadError(err?.message ?? 'Unable to load trading pairs');
    } finally {
      setLoading(false);
    }
  }, [selectedPair]);

  useEffect(() => {
    setLoading(true);
    refreshPairs();
    const interval = setInterval(refreshPairs, 15000);
    return () => clearInterval(interval);
  }, [refreshPairs]);

  const currentPair = useMemo(
    () => pairs.find((p) => pairKey(p) === selectedPair) ?? null,
    [pairs, selectedPair],
  );

  const fromAsset: AssetSymbol | null = currentPair
    ? baseToQuote
      ? currentPair.baseAsset
      : currentPair.quoteAsset
    : null;
  const toAsset: AssetSymbol | null = currentPair
    ? baseToQuote
      ? currentPair.quoteAsset
      : currentPair.baseAsset
    : null;

  // Recompute quote whenever inputs change
  useEffect(() => {
    if (!currentPair || !fromAsset || !toAsset || !amount || parseFloat(amount) <= 0) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const q = await belizexService.getSwapQuote(fromAsset, toAsset, amount, SLIPPAGE_PCT);
        setQuote(q);
        setQuoteError(null);
      } catch (err: any) {
        setQuote(null);
        setQuoteError(err?.message ?? 'Unable to quote');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [amount, currentPair, fromAsset, toAsset]);

  const handleSwap = async () => {
    if (!selectedAccount || !quote) return;
    setSwapping(true);
    setTxHash(null);
    try {
      const result = await belizexService.executeSwap(selectedAccount.address, quote, false);
      setTxHash(result.hash);
      setAmount('');
      setQuote(null);
      await refreshPairs();
    } catch (err: any) {
      setQuoteError(err?.message ?? 'Swap failed');
    } finally {
      setSwapping(false);
    }
  };

  const handleFlip = () => {
    setBaseToQuote((v) => !v);
    setAmount('');
    setQuote(null);
  };

  if (loading) {
    return <LoadingSpinner message="Loading BelizeX pairs from chain..." fullScreen />;
  }
  if (loadError) {
    return <ErrorMessage message={loadError} onRetry={() => window.location.reload()} fullScreen />;
  }

  const exchangeRate =
    quote && quote.inputAmount && parseFloat(quote.inputAmount) > 0
      ? (parseFloat(quote.outputAmount) / parseFloat(quote.inputAmount)).toFixed(6)
      : '0.000000';

  const totalLiquidity = pairs.reduce(
    (sum, p) => sum + Number(belizexService.fromPlanck(p.baseReserve + p.quoteReserve, 2)),
    0,
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">BelizeX</h1>
              <p className="text-xs text-gray-400">Native AMM • belizeX pallet</p>
            </div>
          </div>
          <div className="bg-emerald-500/10 rounded-lg px-3 py-1.5 border border-emerald-500/30">
            <div className="flex items-center space-x-1">
              <TrendUp size={14} weight="fill" className="text-emerald-400" />
              <span className="text-xs text-emerald-400 font-semibold">Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1">Pairs</p>
              <p className="text-lg font-bold text-white">{pairs.length}</p>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1">Total Reserves</p>
              <p className="text-lg font-bold text-white">{totalLiquidity.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1">Active</p>
              <p className="text-lg font-bold text-white">{pairs.filter((p) => p.active).length}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="dark" blur="md" className="p-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="swap">Swap</TabsTrigger>
              <TabsTrigger value="pairs">Pairs</TabsTrigger>
            </TabsList>

            <TabsContent value="swap" className="mt-4">
              <GlassCard variant="dark-medium" blur="lg" className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Swap Tokens</h2>
                  <div className="flex items-center space-x-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                    <Lightning size={14} weight="fill" />
                    <span>Slippage {SLIPPAGE_PCT}%</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm text-gray-400 mb-2 block font-medium">Pair</label>
                  <select
                    value={selectedPair ?? ''}
                    onChange={(e) => {
                      setSelectedPair(e.target.value);
                      setAmount('');
                      setQuote(null);
                    }}
                    className="w-full bg-gray-800/80 text-white px-4 py-2 rounded-lg border border-gray-700"
                  >
                    {pairs.map((p) => (
                      <option key={pairKey(p)} value={pairKey(p)} disabled={!p.active}>
                        {p.baseAsset}/{p.quoteAsset}
                        {!p.active ? ' (paused)' : ''}
                        {p.baseReserve === 0n && p.quoteReserve === 0n ? ' • no liquidity' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="text-sm text-gray-400 mb-2 block font-medium">From</label>
                  <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-500"
                      />
                      <div className="flex items-center space-x-2 bg-gray-900/80 px-3 py-2 rounded-lg border border-gray-700">
                        <Coins size={20} className="text-emerald-400" weight="fill" />
                        <span className="font-semibold text-white">{fromAsset ?? '—'}</span>
                      </div>
                    </div>
                    {currentPair && (
                      <p className="text-xs text-gray-400">
                        Reserve: {belizexService.fromPlanck(reservesFor(currentPair, baseToQuote).reserveIn, 4)} {fromAsset}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-center -my-3 relative z-10">
                  <button
                    onClick={handleFlip}
                    className="bg-gradient-to-br from-emerald-500 to-forest-600 p-3 rounded-xl text-white shadow-lg hover:scale-110 transition-all"
                    aria-label="Flip direction"
                  >
                    <ArrowsLeftRight size={20} weight="bold" />
                  </button>
                </div>

                <div className="mb-6">
                  <label className="text-sm text-gray-400 mb-2 block font-medium">To (estimated)</label>
                  <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={quote?.outputAmount ?? '0.00'}
                        readOnly
                        className="flex-1 bg-transparent text-2xl font-bold text-white outline-none"
                      />
                      <div className="flex items-center space-x-2 bg-gray-900/80 px-3 py-2 rounded-lg border border-gray-700">
                        <Vault size={20} className="text-emerald-400" weight="fill" />
                        <span className="font-semibold text-white">{toAsset ?? '—'}</span>
                      </div>
                    </div>
                    {currentPair && (
                      <p className="text-xs text-gray-400">
                        Reserve: {belizexService.fromPlanck(reservesFor(currentPair, baseToQuote).reserveOut, 4)} {toAsset}
                      </p>
                    )}
                  </div>
                </div>

                {quote && (
                  <div className="bg-gray-800/30 rounded-lg p-3 mb-6 border border-gray-700/40 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rate</span>
                      <span className="text-white font-medium">
                        1 {fromAsset} ≈ {exchangeRate} {toAsset}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price impact</span>
                      <span
                        className={`font-medium ${
                          quote.priceImpactPct > 5
                            ? 'text-red-400'
                            : quote.priceImpactPct > 1
                            ? 'text-amber-400'
                            : 'text-white'
                        }`}
                      >
                        {quote.priceImpactPct.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Min received</span>
                      <span className="text-white font-medium">
                        {quote.minimumReceived} {toAsset}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pool fee</span>
                      <span className="text-white font-medium">
                        {quote.feeAmount} {fromAsset}
                        {currentPair ? ` (${(currentPair.feeRateBps / 100).toFixed(2)}%)` : ''}
                      </span>
                    </div>
                  </div>
                )}

                {quoteError && (
                  <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded-lg p-3 mb-4">
                    {quoteError}
                  </div>
                )}

                {txHash && (
                  <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-sm rounded-lg p-3 mb-4 break-all">
                    Swap submitted: {txHash}
                  </div>
                )}

                {!isConnected ? (
                  <ConnectWalletPrompt message="Connect wallet to swap tokens" />
                ) : (
                  <button
                    onClick={handleSwap}
                    disabled={!amount || !quote || swapping || parseFloat(amount) <= 0}
                    className="w-full bg-gradient-to-r from-emerald-500 to-forest-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Swap size={20} weight="fill" />
                    <span>{swapping ? 'Submitting...' : 'Swap Tokens'}</span>
                  </button>
                )}
              </GlassCard>
            </TabsContent>

            <TabsContent value="pairs" className="mt-4">
              <div className="space-y-3">
                {pairs.map((p) => (
                  <GlassCard key={pairKey(p)} variant="dark" blur="sm" className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-forest-500 flex items-center justify-center text-white font-bold">
                          {p.baseAsset.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {p.baseAsset}/{p.quoteAsset}
                          </p>
                          <p className="text-xs text-gray-400">Fee {(p.feeRateBps / 100).toFixed(2)}%</p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          p.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {p.active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                      <div>
                        <span className="text-gray-500">Base reserve: </span>
                        {belizexService.fromPlanck(p.baseReserve, 4)} {p.baseAsset}
                      </div>
                      <div>
                        <span className="text-gray-500">Quote reserve: </span>
                        {belizexService.fromPlanck(p.quoteReserve, 4)} {p.quoteAsset}
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">LP supply: </span>
                        {belizexService.fromPlanck(p.totalLpTokens, 4)}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </GlassCard>
      </div>
    </div>
  );
}
