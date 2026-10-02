'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  addLiquidity,
  executeSwap,
  fromPlanck,
  getLpBalance,
  getSwapQuote,
  getTradingPairs,
  removeLiquidity,
  type AssetSymbol,
  type SwapQuote,
  type TradingPair,
} from '@/services/pallets/belizex';
import {
  ArrowLeft,
  ArrowsLeftRight,
  CaretDown,
  CircleNotch,
  Info,
  MagnifyingGlass,
  Plus,
  Trash,
} from 'phosphor-react';

const ASSET_LABELS: Record<AssetSymbol, string> = {
  DALLA: 'DALLA',
  BBZD: 'bBZD',
  TourismDALLA: 'tDALLA',
  WUSDC: 'wUSDC',
};

const SLIPPAGE_OPTIONS = ['0.1', '0.5', '1.0'] as const;

function assetLabel(asset: AssetSymbol): string {
  return ASSET_LABELS[asset] ?? asset;
}

function pairSymbol(pair: TradingPair): string {
  return `${assetLabel(pair.baseAsset)}/${assetLabel(pair.quoteAsset)}`;
}

/** Quote-per-base price derived from the on-chain reserves (8dp display scale). */
function priceFromReserves(pair: TradingPair): number {
  if (pair.baseReserve <= 0n || pair.quoteReserve <= 0n) return 0;
  return Number((pair.quoteReserve * 100_000_000n) / pair.baseReserve) / 1e8;
}

function formatPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value >= 10) return value.toFixed(3);
  return value.toFixed(4);
}

function poolSharePct(lpTokens: bigint, totalLpTokens: bigint): number {
  if (lpTokens <= 0n || totalLpTokens <= 0n) return 0;
  return Number((lpTokens * 1_000_000n) / totalLpTokens) / 10_000;
}

export default function TradePage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  // Real on-chain trading pairs (belizeX is an AMM — see the notice in the page).
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [pairsState, setPairsState] = useState<'loading' | 'ready' | 'unreachable'>('loading');
  const [pairsRefresh, setPairsRefresh] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pairDropdownOpen, setPairDropdownOpen] = useState(false);
  const [pairSearch, setPairSearch] = useState('');

  // Swap form
  const [fromAsset, setFromAsset] = useState<AssetSymbol>('DALLA');
  const [toAsset, setToAsset] = useState<AssetSymbol>('BBZD');
  const [swapAmount, setSwapAmount] = useState('');
  const [slippage, setSlippage] = useState<(typeof SLIPPAGE_OPTIONS)[number]>('0.5');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [lastSwapHash, setLastSwapHash] = useState<string | null>(null);

  // Liquidity form
  const [lpBalance, setLpBalance] = useState<{ pair: string; value: bigint } | null>(null);
  const [lpRefresh, setLpRefresh] = useState(0);
  const [addBaseAmount, setAddBaseAmount] = useState('');
  const [addQuoteAmount, setAddQuoteAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [removeLpAmount, setRemoveLpAmount] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);

  const accountAddress = selectedAccount?.address;
  const selectedPair: TradingPair | null = pairs[selectedIndex] ?? null;

  // Load the real pairs from the belizeX pallet.
  useEffect(() => {
    let cancelled = false;
    getTradingPairs()
      .then((loaded) => {
        if (cancelled) return;
        setPairs(loaded);
        setPairsState('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('[BELIZEX] Failed to load trading pairs:', error);
        setPairsState('unreachable');
      });
    return () => {
      cancelled = true;
    };
  }, [pairsRefresh]);

  // Real quote for the current swap inputs (debounced).
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const amount = swapAmount.trim();
      if (!amount || parseFloat(amount) <= 0) {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(null);
        }
        return;
      }
      getSwapQuote(fromAsset, toAsset, amount, Number(slippage))
        .then((result) => {
          if (cancelled) return;
          setQuote(result);
          setQuoteError(null);
        })
        .catch((error) => {
          if (cancelled) return;
          setQuote(null);
          setQuoteError(error instanceof Error ? error.message : 'Quote unavailable');
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fromAsset, toAsset, swapAmount, slippage]);

  // Real LP balance for the selected pair.
  useEffect(() => {
    if (!accountAddress || !selectedPair) return;

    const symbol = pairSymbol(selectedPair);
    let cancelled = false;
    getLpBalance(accountAddress, selectedPair.baseAsset, selectedPair.quoteAsset)
      .then((value) => {
        if (!cancelled) setLpBalance({ pair: symbol, value });
      })
      .catch(() => {
        if (!cancelled) setLpBalance(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accountAddress, selectedPair, lpRefresh]);

  // Only show a balance that was fetched for the pair currently selected.
  const selectedLpBalance =
    selectedPair && lpBalance && lpBalance.pair === pairSymbol(selectedPair) ? lpBalance.value : null;

  const filteredPairs = useMemo(() => {
    const search = pairSearch.trim().toLowerCase();
    if (!search) return pairs;
    return pairs.filter((pair) => pairSymbol(pair).toLowerCase().includes(search));
  }, [pairs, pairSearch]);

  const swapButtonLabel = useMemo(() => {
    if (isSwapping) return 'Submitting swap...';
    if (!swapAmount.trim()) return 'Enter an amount';
    if (quoteError) return 'Swap unavailable';
    if (!quote) return 'Fetching quote...';
    return `Swap ${assetLabel(fromAsset)} → ${assetLabel(toAsset)}`;
  }, [isSwapping, swapAmount, quoteError, quote, fromAsset, toAsset]);

  const handleSelectPair = (index: number) => {
    setSelectedIndex(index);
    setPairDropdownOpen(false);
    setPairSearch('');
  };

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountAddress || !quote || isSwapping) return;

    setIsSwapping(true);
    try {
      const isTourismTrade = fromAsset === 'TourismDALLA' || toAsset === 'TourismDALLA';
      const result = await executeSwap(accountAddress, quote, isTourismTrade);
      setLastSwapHash(result.hash);
      addNotification({
        type: 'success',
        message: `Swap submitted — ${quote.inputAmount} ${assetLabel(fromAsset)} → ${quote.outputAmount} ${assetLabel(toAsset)} (tx: ${result.hash.slice(0, 16)}...)`,
      });
      setSwapAmount('');
      setQuote(null);
      setPairsRefresh((n) => n + 1);
      setLpRefresh((n) => n + 1);
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Swap failed — no funds moved. ${error instanceof Error ? error.message : ''}`,
      });
    } finally {
      setIsSwapping(false);
    }
  };

  // Pre-fill the quote side from the pool ratio as the user types a base amount.
  const handleAddBaseChange = (value: string) => {
    setAddBaseAmount(value);
    if (!selectedPair || selectedPair.baseReserve <= 0n) return;
    const base = parseFloat(value);
    if (!Number.isFinite(base) || base <= 0) {
      setAddQuoteAmount('');
      return;
    }
    const ratio = Number((selectedPair.quoteReserve * 100_000_000n) / selectedPair.baseReserve) / 1e8;
    setAddQuoteAmount((base * ratio).toFixed(4));
  };

  const handleAddLiquidity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountAddress || !selectedPair || isAdding) return;

    const base = parseFloat(addBaseAmount || '0');
    const quoteAmount = parseFloat(addQuoteAmount || '0');
    if (!base || base <= 0 || !quoteAmount || quoteAmount <= 0) {
      addNotification({ type: 'error', message: 'Enter both base and quote amounts.' });
      return;
    }

    setIsAdding(true);
    try {
      const result = await addLiquidity(
        accountAddress,
        selectedPair.baseAsset,
        selectedPair.quoteAsset,
        addBaseAmount,
        addQuoteAmount
      );
      addNotification({
        type: 'success',
        message: `Liquidity added to ${pairSymbol(selectedPair)} (tx: ${result.hash.slice(0, 16)}...)`,
      });
      setAddBaseAmount('');
      setAddQuoteAmount('');
      setLpRefresh((n) => n + 1);
      setPairsRefresh((n) => n + 1);
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Add liquidity failed — no funds moved. ${error instanceof Error ? error.message : ''}`,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveLiquidity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountAddress || !selectedPair || isRemoving) return;

    const lpAmount = parseFloat(removeLpAmount || '0');
    if (!lpAmount || lpAmount <= 0) {
      addNotification({ type: 'error', message: 'Enter an LP token amount to remove.' });
      return;
    }

    setIsRemoving(true);
    try {
      const result = await removeLiquidity(
        accountAddress,
        selectedPair.baseAsset,
        selectedPair.quoteAsset,
        removeLpAmount
      );
      addNotification({
        type: 'success',
        message: `Liquidity removed from ${pairSymbol(selectedPair)} (tx: ${result.hash.slice(0, 16)}...)`,
      });
      setRemoveLpAmount('');
      setLpRefresh((n) => n + 1);
      setPairsRefresh((n) => n + 1);
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Remove liquidity failed — no funds moved. ${error instanceof Error ? error.message : ''}`,
      });
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to swap on the BelizeX on-chain AMM and manage liquidity pools."
        fullScreen
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#030914] text-slate-100 flex flex-col font-sans pb-20 selection:bg-cyan-500/30">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-2xl border-b border-teal-500/20 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button
                title="Return to Maya Wallet"
                className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-all border border-teal-500/20 shadow-sm"
              >
                <ArrowLeft size={20} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowsLeftRight size={20} className="text-cyan-400" />
                BelizeX AMM Terminal
              </h1>
              <p className="text-[11px] text-slate-400">
                Constant-product swaps and liquidity on the belizeX pallet (Ceiba)
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 border ${
              pairsState === 'ready'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : pairsState === 'loading'
                ? 'bg-slate-800/60 text-slate-300 border-slate-700/50'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                pairsState === 'ready'
                  ? 'bg-emerald-400 animate-pulse'
                  : pairsState === 'loading'
                  ? 'bg-slate-400'
                  : 'bg-rose-400'
              }`}
            />
            {pairsState === 'ready'
              ? `${pairs.length} on-chain pair(s)`
              : pairsState === 'loading'
              ? 'Reading belizeX pairs...'
              : 'Chain unreachable'}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full p-3 sm:p-6 flex-1 space-y-5">
        {/* Honesty notice: belizeX is an AMM; there is no on-chain order book. */}
        <div className="flex items-start gap-2 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-3 text-[11px] text-slate-300">
          <Info size={15} className="text-cyan-400 shrink-0 mt-0.5" />
          <span>
            Order-book (CLOB) trading, limit orders and price charts are not shown here: belizeX is an
            on-chain AMM with no order-book storage, and no trade-indexer feed exists yet. Everything on
            this page reads and writes real chain state.
          </span>
        </div>

        {/* Pair Overview */}
        <div className="bg-slate-900/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <button
                onClick={() => setPairDropdownOpen((open) => !open)}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700/80 border border-teal-500/30 rounded-xl transition-all shadow-sm"
              >
                <span className="font-bold text-sm tracking-wide flex items-center gap-1 text-white">
                  {selectedPair ? pairSymbol(selectedPair) : 'No pairs available'}
                  <CaretDown size={14} className="text-cyan-400" />
                </span>
              </button>

              {pairDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-slate-900/95 border border-teal-500/30 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-2xl">
                  <div className="relative mb-2">
                    <MagnifyingGlass size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search pairs..."
                      value={pairSearch}
                      onChange={(e) => setPairSearch(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                    {filteredPairs.length === 0 && (
                      <p className="text-[11px] text-slate-500 p-2">No matching on-chain pairs.</p>
                    )}
                    {filteredPairs.map((pair) => {
                      const globalIndex = pairs.indexOf(pair);
                      const active = globalIndex === selectedIndex;
                      return (
                        <button
                          key={pairSymbol(pair)}
                          onClick={() => handleSelectPair(globalIndex)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                            active
                              ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300'
                              : 'hover:bg-slate-800/70 text-slate-300'
                          }`}
                        >
                          <span className="font-bold">{pairSymbol(pair)}</span>
                          <span className="flex items-center gap-2">
                            <span className="font-mono">{formatPrice(priceFromReserves(pair))}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${
                                pair.active
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {pair.active ? 'ACTIVE' : 'PAUSED'}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {selectedPair && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Price</span>
                  <span className="font-bold font-mono text-emerald-400">
                    {formatPrice(priceFromReserves(selectedPair))}{' '}
                    <span className="text-[11px] text-slate-400 font-normal">
                      {assetLabel(selectedPair.quoteAsset)}
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                    {assetLabel(selectedPair.baseAsset)} Reserve
                  </span>
                  <span className="font-mono text-slate-200">{fromPlanck(selectedPair.baseReserve, 2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                    {assetLabel(selectedPair.quoteAsset)} Reserve
                  </span>
                  <span className="font-mono text-slate-200">{fromPlanck(selectedPair.quoteReserve, 2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Swap Fee</span>
                  <span className="font-mono text-cyan-300">{(selectedPair.feeRateBps / 100).toFixed(2)}%</span>
                </div>
              </div>
            )}
          </div>

          {pairsState === 'unreachable' && (
            <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3">
              Could not read trading pairs from the belizeX pallet. Swapping and liquidity actions are
              disabled until the chain is reachable.
            </p>
          )}
          {pairsState === 'ready' && pairs.length === 0 && (
            <p className="text-xs text-slate-400 bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
              The chain reports no belizeX trading pairs yet. Liquidity providers can bootstrap them with
              the belizeX pallet extrinsics.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Swap Panel */}
          <div className="bg-slate-900/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowsLeftRight size={18} className="text-cyan-400" />
              Swap
            </h3>

            <form onSubmit={handleSwap} className="space-y-3 text-xs">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <label className="text-slate-400 uppercase font-semibold text-[10px] block">From</label>
                <div className="flex items-center gap-2">
                  <select
                    value={fromAsset}
                    onChange={(e) => setFromAsset(e.target.value as AssetSymbol)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400"
                  >
                    {(['DALLA', 'BBZD', 'TourismDALLA', 'WUSDC'] as const).map((asset) => (
                      <option key={asset} value={asset}>
                        {assetLabel(asset)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <label className="text-slate-400 uppercase font-semibold text-[10px] block">To</label>
                <div className="flex items-center gap-2">
                  <select
                    value={toAsset}
                    onChange={(e) => setToAsset(e.target.value as AssetSymbol)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400"
                  >
                    {(['DALLA', 'BBZD', 'TourismDALLA', 'WUSDC'] as const).map((asset) => (
                      <option key={asset} value={asset}>
                        {assetLabel(asset)}
                      </option>
                    ))}
                  </select>
                  <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-sm text-emerald-300 font-mono min-h-[36px] flex items-center">
                    {quote ? quote.outputAmount : '—'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold uppercase text-[10px]">Slippage tolerance</span>
                <div className="flex bg-slate-950/90 p-0.5 rounded-xl border border-slate-800 font-mono">
                  {SLIPPAGE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSlippage(option)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        slippage === option
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {option}%
                    </button>
                  ))}
                </div>
              </div>

              {quoteError && (
                <p className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5">
                  {quoteError}
                </p>
              )}

              {quote && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1.5 font-mono text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Minimum received:</span>
                    <span className="text-white font-bold">
                      {quote.minimumReceived} {assetLabel(toAsset)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price impact:</span>
                    <span className={quote.priceImpactPct >= 1 ? 'text-amber-300 font-bold' : 'text-white'}>
                      {quote.priceImpactPct.toFixed(3)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pool fee:</span>
                    <span className="text-white">
                      {quote.feeAmount} {assetLabel(fromAsset)}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSwapping || !quote}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2"
              >
                {isSwapping && <CircleNotch size={16} className="animate-spin" />}
                {swapButtonLabel}
              </button>

              {lastSwapHash && (
                <p className="text-[10px] text-slate-500 font-mono text-center break-all">
                  Last swap tx: {lastSwapHash}
                </p>
              )}
            </form>
          </div>

          {/* Liquidity Panel */}
          <div className="bg-slate-900/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus size={18} className="text-cyan-400" />
              Liquidity {selectedPair ? `· ${pairSymbol(selectedPair)}` : ''}
            </h3>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Your LP tokens:</span>
                <span className="text-white font-bold">
                  {selectedLpBalance === null ? '—' : fromPlanck(selectedLpBalance, 4)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Pool share:</span>
                <span className="text-cyan-300 font-bold">
                  {selectedLpBalance !== null && selectedPair
                    ? `${poolSharePct(selectedLpBalance, selectedPair.totalLpTokens).toFixed(4)}%`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Pool LP total:</span>
                <span className="text-slate-200">
                  {selectedPair ? fromPlanck(selectedPair.totalLpTokens, 2) : '—'}
                </span>
              </div>
            </div>

            {/* Add liquidity */}
            <form onSubmit={handleAddLiquidity} className="space-y-2 text-xs">
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Add Liquidity</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={`${selectedPair ? assetLabel(selectedPair.baseAsset) : 'Base'} amount`}
                  value={addBaseAmount}
                  onChange={(e) => handleAddBaseChange(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={`${selectedPair ? assetLabel(selectedPair.quoteAsset) : 'Quote'} amount`}
                  value={addQuoteAmount}
                  onChange={(e) => setAddQuoteAmount(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
              <button
                type="submit"
                disabled={isAdding || !selectedPair}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-slate-700/60"
              >
                {isAdding && <CircleNotch size={14} className="animate-spin" />}
                Add liquidity (quote side auto-filled from pool ratio)
              </button>
            </form>

            {/* Remove liquidity */}
            <form onSubmit={handleRemoveLiquidity} className="space-y-2 text-xs">
              <span className="text-slate-400 uppercase font-semibold text-[10px] block">Remove Liquidity</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="LP token amount"
                value={removeLpAmount}
                onChange={(e) => setRemoveLpAmount(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={isRemoving || !selectedPair}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-slate-700/60"
              >
                {isRemoving ? <CircleNotch size={14} className="animate-spin" /> : <Trash size={14} />}
                Remove liquidity
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
