'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  ArrowsLeftRight,
  TrendUp,
  TrendDown,
  Coins,
  Swap,
  Vault,
  Lightning,
  ArrowLeft,
  ChartLineUp,
  Sparkle,
  SlidersHorizontal,
  Info,
  CheckCircle,
  Plus,
  CaretDown,
  CaretUp,
  Clock,
  Trash,
  MagnifyingGlass,
  Check,
  Percent,
  ChartBar,
  ShieldCheck,
  Activity,
  ArrowsClockwise,
  Wallet,
} from 'phosphor-react';

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  depthPercent: number;
}

interface ActiveOrder {
  id: string;
  pair: string;
  type: 'LIMIT' | 'MARKET' | 'STOP_LOSS';
  side: 'BUY' | 'SELL';
  price: number;
  amount: number;
  filled: number;
  timestamp: string;
  status: 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED';
}

interface MarketTrade {
  id: string;
  price: number;
  amount: number;
  side: 'BUY' | 'SELL';
  time: string;
}

interface TradingPair {
  symbol: string;
  base: string;
  quote: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  category: 'Sovereign' | 'Cross-Chain' | 'RWA & Eco';
}

const TRADING_PAIRS: TradingPair[] = [
  { symbol: 'DALLA/bBZD', base: 'DALLA', quote: 'bBZD', price: 0.5000, change24h: 4.25, high24h: 0.5280, low24h: 0.4810, volume24h: 1842500, category: 'Sovereign' },
  { symbol: 'DALLA/USDT', base: 'DALLA', quote: 'USDT', price: 0.2500, change24h: 3.80, high24h: 0.2640, low24h: 0.2405, volume24h: 940200, category: 'Sovereign' },
  { symbol: 'bBZD/USDC', base: 'bBZD', quote: 'USDC', price: 0.5000, change24h: 0.01, high24h: 0.5002, low24h: 0.4998, volume24h: 3450000, category: 'Sovereign' },
  { symbol: 'wDOT/DALLA', base: 'wDOT', quote: 'DALLA', price: 28.500, change24h: -1.45, high24h: 29.800, low24h: 27.900, volume24h: 42000, category: 'Cross-Chain' },
  { symbol: 'wETH/DALLA', base: 'wETH', quote: 'DALLA', price: 9200.0, change24h: 2.15, high24h: 9450.0, low24h: 8990.0, volume24h: 185, category: 'Cross-Chain' },
  { symbol: 'CARBON/bBZD', base: 'CARBON', quote: 'bBZD', price: 12.500, change24h: 8.90, high24h: 13.200, low24h: 11.400, volume24h: 15400, category: 'RWA & Eco' },
  { symbol: 'LAND-SP482/bBZD', base: 'LAND-SP482', quote: 'bBZD', price: 45000, change24h: 0.00, high24h: 45000, low24h: 45000, volume24h: 2, category: 'RWA & Eco' },
];

export default function TradePage() {
  const { selectedAccount, isConnected, balance } = useWallet();
  const { addNotification } = useUIStore();

  // Selected Market Pair
  const [selectedPair, setSelectedPair] = useState<TradingPair>(TRADING_PAIRS[0]);
  const [pairDropdownOpen, setPairDropdownOpen] = useState(false);
  const [pairFilter, setPairFilter] = useState<'All' | 'Sovereign' | 'Cross-Chain' | 'RWA & Eco'>('All');
  const [pairSearch, setPairSearch] = useState('');

  // Main UI Mode & Tabs
  const [tradingMode, setTradingMode] = useState<'PRO' | 'AMM'>('PRO');
  const [chartTimeframe, setChartTimeframe] = useState<'1m' | '5m' | '15m' | '1H' | '4H' | '1D'>('15m');
  const [chartType, setChartType] = useState<'candles' | 'depth'>('candles');
  const [bottomTab, setBottomTab] = useState<'orders' | 'history' | 'trades' | 'liquidity'>('orders');

  // Order Ticket State
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET' | 'STOP_LOSS'>('LIMIT');
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [limitPrice, setLimitPrice] = useState<string>(selectedPair.price.toFixed(4));
  const [orderAmount, setOrderAmount] = useState<string>('500');
  const [sliderPercent, setSliderPercent] = useState<number>(25);

  // AMM Quick Swap State
  const [fromAsset, setFromAsset] = useState<'DALLA' | 'bBZD' | 'wDOT' | 'wETH'>('DALLA');
  const [toAsset, setToAsset] = useState<'DALLA' | 'bBZD' | 'wDOT' | 'wETH'>('bBZD');
  const [swapAmount, setSwapAmount] = useState('100');
  const [slippage, setSlippage] = useState<'0.1' | '0.5' | '1.0'>('0.5');

  // Interactive Open Orders State
  const [openOrders, setOpenOrders] = useState<ActiveOrder[]>([
    {
      id: 'ord-8812',
      pair: 'DALLA/bBZD',
      type: 'LIMIT',
      side: 'BUY',
      price: 0.4950,
      amount: 1500,
      filled: 450,
      timestamp: '10:42:15 AM',
      status: 'PARTIALLY_FILLED',
    },
    {
      id: 'ord-8815',
      pair: 'DALLA/bBZD',
      type: 'LIMIT',
      side: 'SELL',
      price: 0.5250,
      amount: 2500,
      filled: 0,
      timestamp: '11:15:30 AM',
      status: 'OPEN',
    },
  ]);

  // Order History State
  const [orderHistory, setOrderHistory] = useState<ActiveOrder[]>([
    {
      id: 'ord-8790',
      pair: 'DALLA/bBZD',
      type: 'LIMIT',
      side: 'BUY',
      price: 0.4850,
      amount: 5000,
      filled: 5000,
      timestamp: 'Yesterday 04:12 PM',
      status: 'FILLED',
    },
    {
      id: 'ord-8742',
      pair: 'CARBON/bBZD',
      type: 'MARKET',
      side: 'BUY',
      price: 11.800,
      amount: 250,
      filled: 250,
      timestamp: 'Aug 26, 2026',
      status: 'FILLED',
    },
  ]);

  // Recent Public Market Trades
  const [recentTrades, setRecentTrades] = useState<MarketTrade[]>([
    { id: 't-1', price: 0.5000, amount: 2450, side: 'BUY', time: '12:04:12' },
    { id: 't-2', price: 0.4998, amount: 890, side: 'SELL', time: '12:03:55' },
    { id: 't-3', price: 0.5002, amount: 5120, side: 'BUY', time: '12:03:10' },
    { id: 't-4', price: 0.5000, amount: 1200, side: 'BUY', time: '12:02:44' },
    { id: 't-5', price: 0.4995, amount: 3400, side: 'SELL', time: '12:01:18' },
    { id: 't-6', price: 0.4990, amount: 6200, side: 'SELL', time: '12:00:52' },
  ]);

  // Live Simulated Order Book
  const bids: OrderBookEntry[] = useMemo(() => {
    const rawBids = [
      { price: selectedPair.price * 0.999, amount: 14200 },
      { price: selectedPair.price * 0.996, amount: 28500 },
      { price: selectedPair.price * 0.990, amount: 45000 },
      { price: selectedPair.price * 0.985, amount: 32000 },
      { price: selectedPair.price * 0.980, amount: 68000 },
      { price: selectedPair.price * 0.975, amount: 89000 },
    ];
    let runningTotal = 0;
    const maxTotal = rawBids.reduce((acc, b) => acc + b.amount, 0);
    return rawBids.map((b) => {
      runningTotal += b.amount;
      return {
        price: b.price,
        amount: b.amount,
        total: runningTotal,
        depthPercent: Math.min(100, (runningTotal / maxTotal) * 100),
      };
    });
  }, [selectedPair.price]);

  const asks: OrderBookEntry[] = useMemo(() => {
    const rawAsks = [
      { price: selectedPair.price * 1.001, amount: 12400 },
      { price: selectedPair.price * 1.004, amount: 21800 },
      { price: selectedPair.price * 1.010, amount: 38200 },
      { price: selectedPair.price * 1.015, amount: 49000 },
      { price: selectedPair.price * 1.020, amount: 72000 },
      { price: selectedPair.price * 1.025, amount: 95000 },
    ];
    let runningTotal = 0;
    const maxTotal = rawAsks.reduce((acc, a) => acc + a.amount, 0);
    return rawAsks.map((a) => {
      runningTotal += a.amount;
      return {
        price: a.price,
        amount: a.amount,
        total: runningTotal,
        depthPercent: Math.min(100, (runningTotal / maxTotal) * 100),
      };
    });
  }, [selectedPair.price]);

  // Handle Pair Switching
  const handleSelectPair = (pair: TradingPair) => {
    setSelectedPair(pair);
    setLimitPrice(pair.price.toFixed(4));
    setPairDropdownOpen(false);
  };

  // Handle Click-to-Trade from Order Book
  const handleOrderBookClick = (price: number, amount: number) => {
    setLimitPrice(price.toFixed(4));
    setOrderAmount(amount.toString());
    addNotification({
      type: 'info',
      message: `Pre-filled ${selectedPair.symbol} order ticket: ${amount} @ ${price.toFixed(4)}`,
    });
  };

  // Handle Placing Order
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(orderAmount || '0');
    const prc = parseFloat(limitPrice || selectedPair.price.toString());

    if (!amt || amt <= 0) {
      addNotification({ type: 'error', message: 'Please enter a valid order amount.' });
      return;
    }

    const newOrder: ActiveOrder = {
      id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
      pair: selectedPair.symbol,
      type: orderType,
      side: orderSide,
      price: prc,
      amount: amt,
      filled: orderType === 'MARKET' ? amt : 0,
      timestamp: new Date().toLocaleTimeString(),
      status: orderType === 'MARKET' ? 'FILLED' : 'OPEN',
    };

    if (orderType === 'MARKET') {
      setOrderHistory([newOrder, ...orderHistory]);
      setRecentTrades([
        {
          id: `t-${Date.now()}`,
          price: prc,
          amount: amt,
          side: orderSide,
          time: new Date().toLocaleTimeString(),
        },
        ...recentTrades,
      ]);
      addNotification({
        type: 'success',
        message: `Market ${orderSide} matched instantly! Executed ${amt} ${selectedPair.base} @ ${prc.toFixed(4)} ${selectedPair.quote}.`,
      });
    } else {
      setOpenOrders([newOrder, ...openOrders]);
      addNotification({
        type: 'success',
        message: `Placed ${orderType} ${orderSide} order on BelizeX CLOB: ${amt} ${selectedPair.base} @ ${prc.toFixed(4)} ${selectedPair.quote}.`,
      });
    }
  };

  // Handle Cancel Order
  const handleCancelOrder = (orderId: string) => {
    setOpenOrders(openOrders.filter((o) => o.id !== orderId));
    addNotification({
      type: 'info',
      message: `Cancelled order #${orderId} on BelizeX order book.`,
    });
  };

  // Handle Quick Swap Execution
  const handleExecuteSwap = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(swapAmount || '0');
    if (!amt || amt <= 0) return;

    const estOut =
      fromAsset === 'DALLA' && toAsset === 'bBZD'
        ? amt * 0.5
        : fromAsset === 'bBZD' && toAsset === 'DALLA'
        ? amt * 2.0
        : amt;

    addNotification({
      type: 'success',
      message: `AMM Swap Confirmed: ${amt} ${fromAsset} ➔ ${estOut.toFixed(2)} ${toAsset} (Slippage: ${slippage}%, LP fee: 0.3%)`,
    });
  };

  // Filtered Pairs for Watchlist
  const filteredPairs = useMemo(() => {
    return TRADING_PAIRS.filter((p) => {
      const matchCat = pairFilter === 'All' || p.category === pairFilter;
      const matchSearch = p.symbol.toLowerCase().includes(pairSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [pairFilter, pairSearch]);

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to access BelizeX DEX CLOB trading, liquidity pools, and AMM swaps."
        fullScreen
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20">
      {/* Top Pro Header & Ticker Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-[1720px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
          {/* Pair Selector & Back Button */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <button
                title="Return to Maya Wallet"
                className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-all border border-slate-700/50"
              >
                <ArrowLeft size={20} weight="bold" />
              </button>
            </Link>

            {/* Pair Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setPairDropdownOpen(!pairDropdownOpen)}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-all"
              >
                <div className="flex -space-x-1.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-[11px] font-black text-slate-950">
                    {selectedPair.base[0]}
                  </span>
                  <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[11px] font-black text-slate-950">
                    {selectedPair.quote[0]}
                  </span>
                </div>
                <div className="text-left">
                  <span className="font-bold text-sm tracking-wide flex items-center gap-1">
                    {selectedPair.symbol}
                    <CaretDown size={14} className="text-slate-400" />
                  </span>
                </div>
              </button>

              {/* Pair Switcher Modal Menu */}
              <AnimatePresence>
                {pairDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute left-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50"
                  >
                    <div className="relative mb-2">
                      <MagnifyingGlass size={16} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search markets..."
                        value={pairSearch}
                        onChange={(e) => setPairSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="flex gap-1 mb-2 pb-2 border-b border-slate-800/80 overflow-x-auto text-[10px]">
                      {(['All', 'Sovereign', 'Cross-Chain', 'RWA & Eco'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setPairFilter(cat)}
                          className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                            pairFilter === cat ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                      {filteredPairs.map((pair) => (
                        <button
                          key={pair.symbol}
                          onClick={() => handleSelectPair(pair)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                            selectedPair.symbol === pair.symbol
                              ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="font-bold">{pair.symbol}</span>
                          <div className="text-right">
                            <span className="font-mono block">{pair.price.toFixed(4)}</span>
                            <span
                              className={`text-[10px] font-semibold ${
                                pair.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {pair.change24h >= 0 ? `+${pair.change24h}%` : `${pair.change24h}%`}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 24h Ticker Statistics */}
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Last Price</span>
              <span className="text-base font-bold font-mono text-emerald-400 flex items-center gap-1">
                {selectedPair.price.toFixed(4)}{' '}
                <span className="text-[11px] text-slate-400 font-normal">{selectedPair.quote}</span>
              </span>
            </div>

            <div className="hidden sm:block">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">24h Change</span>
              <span
                className={`font-bold font-mono flex items-center gap-1 ${
                  selectedPair.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {selectedPair.change24h >= 0 ? (
                  <TrendUp size={14} weight="bold" />
                ) : (
                  <TrendDown size={14} weight="bold" />
                )}
                {selectedPair.change24h >= 0 ? `+${selectedPair.change24h}%` : `${selectedPair.change24h}%`}
              </span>
            </div>

            <div className="hidden md:block">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">24h High</span>
              <span className="font-mono text-slate-200 font-semibold">{selectedPair.high24h.toFixed(4)}</span>
            </div>

            <div className="hidden md:block">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">24h Low</span>
              <span className="font-mono text-slate-200 font-semibold">{selectedPair.low24h.toFixed(4)}</span>
            </div>

            <div className="hidden lg:block">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">24h Volume ({selectedPair.base})</span>
              <span className="font-mono text-cyan-300 font-semibold">{selectedPair.volume24h.toLocaleString()}</span>
            </div>

            <div className="hidden xl:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Ceiba CLOB Engine:</span>
              <span className="text-emerald-300 font-mono font-bold">2,500 TPS (12ms)</span>
            </div>
          </div>

          {/* Mode Switcher: Pro CLOB vs AMM Swap */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setTradingMode('PRO')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                tradingMode === 'PRO'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Order Book (Pro)
            </button>
            <button
              onClick={() => setTradingMode('AMM')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                tradingMode === 'AMM'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AMM Quick Swap
            </button>
          </div>
        </div>
      </header>

      {/* Main Trading Floor Grid */}
      <main className="max-w-[1720px] mx-auto w-full p-3 sm:p-4 flex-1 flex flex-col gap-4">
        {tradingMode === 'PRO' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            {/* Center Area: Interactive Chart & Bottom Positions (lg:col-span-8) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Chart Panel */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col shadow-xl backdrop-blur-md">
                {/* Chart Header & Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      <ChartLineUp size={18} className="text-cyan-400" />
                      {selectedPair.symbol} Price Chart
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-md font-mono">
                      Mainnet V1
                    </span>
                  </div>

                  {/* Timeframe Selectors & Chart Type */}
                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                      {(['1m', '5m', '15m', '1H', '4H', '1D'] as const).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setChartTimeframe(tf)}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            chartTimeframe === tf
                              ? 'bg-slate-800 text-cyan-300 font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>

                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                      <button
                        onClick={() => setChartType('candles')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          chartType === 'candles' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                        }`}
                      >
                        Candles
                      </button>
                      <button
                        onClick={() => setChartType('depth')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          chartType === 'depth' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                        }`}
                      >
                        Depth
                      </button>
                    </div>
                  </div>
                </div>

                {/* Simulated Interactive SVG / Canvas Candlestick Chart */}
                <div className="relative w-full h-72 sm:h-96 my-3 bg-slate-950/70 rounded-2xl border border-slate-800/60 p-4 flex flex-col justify-between overflow-hidden">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 grid grid-rows-4 grid-cols-6 pointer-events-none opacity-10">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="border-b border-r border-slate-400" />
                    ))}
                  </div>

                  {/* Chart Indicators & Legend */}
                  <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400">EMA(20): { (selectedPair.price * 0.994).toFixed(4) }</span>
                      <span className="text-purple-400">EMA(50): { (selectedPair.price * 0.988).toFixed(4) }</span>
                      <span className="text-cyan-400">VOL: 142.5K</span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold">O: { (selectedPair.price * 0.995).toFixed(4) }</span>{' '}
                      <span className="text-emerald-400">H: { selectedPair.high24h.toFixed(4) }</span>{' '}
                      <span className="text-rose-400">L: { selectedPair.low24h.toFixed(4) }</span>{' '}
                      <span className="text-emerald-400 font-bold">C: { selectedPair.price.toFixed(4) }</span>
                    </div>
                  </div>

                  {/* Visual Candlesticks SVG */}
                  <svg className="w-full h-56 sm:h-72 my-auto" viewBox="0 0 600 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Background Area Gradient */}
                    <path
                      d="M 0 160 Q 60 140 120 150 T 240 120 T 360 90 T 480 70 T 600 50 L 600 200 L 0 200 Z"
                      fill="url(#chartGlow)"
                    />

                    {/* Trend Line */}
                    <path
                      d="M 0 160 Q 60 140 120 150 T 240 120 T 360 90 T 480 70 T 600 50"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                    />

                    {/* Interactive Candlesticks */}
                    {[
                      { x: 30, o: 155, c: 145, h: 140, l: 165, up: true },
                      { x: 75, o: 145, c: 150, h: 142, l: 158, up: false },
                      { x: 120, o: 150, c: 135, h: 130, l: 155, up: true },
                      { x: 165, o: 135, c: 125, h: 120, l: 140, up: true },
                      { x: 210, o: 125, c: 132, h: 122, l: 138, up: false },
                      { x: 255, o: 132, c: 110, h: 105, l: 135, up: true },
                      { x: 300, o: 110, c: 100, h: 95, l: 115, up: true },
                      { x: 345, o: 100, c: 105, h: 98, l: 112, up: false },
                      { x: 390, o: 105, c: 85, h: 80, l: 110, up: true },
                      { x: 435, o: 85, c: 75, h: 70, l: 92, up: true },
                      { x: 480, o: 75, c: 82, h: 72, l: 88, up: false },
                      { x: 525, o: 82, c: 60, h: 55, l: 85, up: true },
                      { x: 570, o: 60, c: 50, h: 45, l: 65, up: true },
                    ].map((candle, idx) => (
                      <g key={idx} className="cursor-pointer hover:opacity-80 transition-opacity">
                        {/* Wick */}
                        <line
                          x1={candle.x}
                          y1={candle.h}
                          x2={candle.x}
                          y2={candle.l}
                          stroke={candle.up ? '#10b981' : '#f43f5e'}
                          strokeWidth="1.5"
                        />
                        {/* Body */}
                        <rect
                          x={candle.x - 6}
                          y={Math.min(candle.o, candle.c)}
                          width="12"
                          height={Math.max(4, Math.abs(candle.o - candle.c))}
                          fill={candle.up ? '#10b981' : '#f43f5e'}
                          rx="2"
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Bottom Time Axis */}
                  <div className="relative z-10 flex justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
                    <span>08:00</span>
                    <span>09:00</span>
                    <span>10:00</span>
                    <span>11:00</span>
                    <span>12:00</span>
                    <span className="text-cyan-400 font-bold">LIVE (Ceiba Substrate)</span>
                  </div>
                </div>
              </div>

              {/* Bottom Dashboard: Open Orders, Trade History, Public Trades, Liquidity */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md flex-1">
                {/* Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
                  <div className="flex gap-2 text-xs font-bold">
                    <button
                      onClick={() => setBottomTab('orders')}
                      className={`px-3 py-1.5 rounded-xl transition-all ${
                        bottomTab === 'orders'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Open Orders ({openOrders.length})
                    </button>
                    <button
                      onClick={() => setBottomTab('history')}
                      className={`px-3 py-1.5 rounded-xl transition-all ${
                        bottomTab === 'history'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Order History ({orderHistory.length})
                    </button>
                    <button
                      onClick={() => setBottomTab('trades')}
                      className={`px-3 py-1.5 rounded-xl transition-all ${
                        bottomTab === 'trades'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Market Trades
                    </button>
                    <button
                      onClick={() => setBottomTab('liquidity')}
                      className={`px-3 py-1.5 rounded-xl transition-all ${
                        bottomTab === 'liquidity'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      My LP Positions (2)
                    </button>
                  </div>
                </div>

                {/* Tab 1: Open Orders */}
                {bottomTab === 'orders' && (
                  <div className="overflow-x-auto">
                    {openOrders.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        No active open orders on the Ceiba CLOB.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-800 text-[11px]">
                            <th className="pb-2">Time</th>
                            <th className="pb-2">Pair</th>
                            <th className="pb-2">Type</th>
                            <th className="pb-2">Side</th>
                            <th className="pb-2">Price</th>
                            <th className="pb-2">Amount</th>
                            <th className="pb-2">Filled</th>
                            <th className="pb-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {openOrders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-slate-850/50">
                              <td className="py-3 text-slate-400">{ord.timestamp}</td>
                              <td className="py-3 font-bold text-white">{ord.pair}</td>
                              <td className="py-3 text-slate-300">{ord.type}</td>
                              <td className="py-3">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                    ord.side === 'BUY'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-rose-500/20 text-rose-400'
                                  }`}
                                >
                                  {ord.side}
                                </span>
                              </td>
                              <td className="py-3 font-bold text-white">{ord.price.toFixed(4)}</td>
                              <td className="py-3 text-slate-200">{ord.amount}</td>
                              <td className="py-3 text-cyan-400">
                                {((ord.filled / ord.amount) * 100).toFixed(0)}% ({ord.filled}/{ord.amount})
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => handleCancelOrder(ord.id)}
                                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[11px] font-bold border border-rose-500/30 transition-all"
                                >
                                  Cancel
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Tab 2: Order History */}
                {bottomTab === 'history' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-800 text-[11px]">
                          <th className="pb-2">Time</th>
                          <th className="pb-2">Pair</th>
                          <th className="pb-2">Type</th>
                          <th className="pb-2">Side</th>
                          <th className="pb-2">Executed Price</th>
                          <th className="pb-2">Amount</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {orderHistory.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-850/50">
                            <td className="py-3 text-slate-400">{ord.timestamp}</td>
                            <td className="py-3 font-bold text-white">{ord.pair}</td>
                            <td className="py-3 text-slate-300">{ord.type}</td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  ord.side === 'BUY'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {ord.side}
                              </span>
                            </td>
                            <td className="py-3 font-bold text-white">{ord.price.toFixed(4)}</td>
                            <td className="py-3 text-slate-200">{ord.amount}</td>
                            <td className="py-3">
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle size={14} weight="fill" />
                                {ord.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 3: Recent Market Trades */}
                {bottomTab === 'trades' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-800 text-[11px]">
                          <th className="pb-2">Time</th>
                          <th className="pb-2">Price ({selectedPair.quote})</th>
                          <th className="pb-2">Size ({selectedPair.base})</th>
                          <th className="pb-2">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {recentTrades.map((trade) => (
                          <tr key={trade.id} className="hover:bg-slate-850/50">
                            <td className="py-2 text-slate-400">{trade.time}</td>
                            <td
                              className={`py-2 font-bold ${
                                trade.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {trade.price.toFixed(4)}
                            </td>
                            <td className="py-2 text-slate-200">{trade.amount.toLocaleString()}</td>
                            <td className="py-2">
                              <span
                                className={`text-[10px] font-bold ${
                                  trade.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {trade.side}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 4: Liquidity Positions */}
                {bottomTab === 'liquidity' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">DALLA / bBZD LP Pool</span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-md text-[10px]">
                          24.5% APR
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                        <span>Staked LP Tokens:</span>
                        <span className="text-cyan-300 font-bold">450.00 LP (BZ$ 2,250.00)</span>
                      </div>
                      <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                        <span>Unclaimed Rewards:</span>
                        <span className="text-emerald-400 font-bold">+35.40 DALLA</span>
                      </div>
                      <button
                        onClick={() =>
                          addNotification({
                            type: 'success',
                            message: 'Harvested +35.40 DALLA rewards from DALLA/bBZD pool!',
                          })
                        }
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md"
                      >
                        Harvest Farming Yield
                      </button>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">CARBON / bBZD Eco Pool</span>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 font-bold rounded-md text-[10px]">
                          18.9% APR
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                        <span>Staked LP Tokens:</span>
                        <span className="text-purple-300 font-bold">120.00 LP (BZ$ 1,500.00)</span>
                      </div>
                      <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                        <span>Unclaimed Rewards:</span>
                        <span className="text-emerald-400 font-bold">+14.20 DALLA</span>
                      </div>
                      <button
                        onClick={() =>
                          addNotification({
                            type: 'success',
                            message: 'Harvested +14.20 DALLA rewards from CARBON/bBZD pool!',
                          })
                        }
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md"
                      >
                        Harvest Farming Yield
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Area: CLOB Order Book & Order Ticket (lg:col-span-4) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* CLOB Order Book V1 */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <Vault size={16} className="text-cyan-400" />
                      Order Book V1
                    </h3>
                    <span className="text-[10px] text-slate-400">Click any row to trade</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Spread</span>
                    <span className="text-xs font-mono text-cyan-300 font-bold">0.0015 (0.30%)</span>
                  </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-3 text-[10px] font-mono text-slate-400 pb-1.5 border-b border-slate-800/60">
                  <span>Price ({selectedPair.quote})</span>
                  <span className="text-right">Size ({selectedPair.base})</span>
                  <span className="text-right">Total</span>
                </div>

                {/* Asks (Sell Orders - Top, Red) */}
                <div className="space-y-0.5 my-1.5 font-mono text-[11px]">
                  {asks.slice(0, 5).reverse().map((ask, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleOrderBookClick(ask.price, ask.amount)}
                      className="relative grid grid-cols-3 py-1 px-1 rounded hover:bg-rose-500/10 cursor-pointer transition-colors"
                    >
                      {/* Depth visual bar */}
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-rose-500/15 rounded pointer-events-none transition-all"
                        style={{ width: `${ask.depthPercent}%` }}
                      />
                      <span className="text-rose-400 font-bold relative z-10">{ask.price.toFixed(4)}</span>
                      <span className="text-slate-300 text-right relative z-10">{ask.amount.toLocaleString()}</span>
                      <span className="text-slate-400 text-right relative z-10">{ask.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Mid Market Price Banner */}
                <div className="py-2 my-1 px-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold text-sm">{selectedPair.price.toFixed(4)}</span>
                    <TrendUp size={14} className="text-emerald-400" />
                  </div>
                  <span className="text-[10px] text-slate-400">Mid Market Price</span>
                </div>

                {/* Bids (Buy Orders - Bottom, Green) */}
                <div className="space-y-0.5 my-1.5 font-mono text-[11px]">
                  {bids.slice(0, 5).map((bid, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleOrderBookClick(bid.price, bid.amount)}
                      className="relative grid grid-cols-3 py-1 px-1 rounded hover:bg-emerald-500/10 cursor-pointer transition-colors"
                    >
                      {/* Depth visual bar */}
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 rounded pointer-events-none transition-all"
                        style={{ width: `${bid.depthPercent}%` }}
                      />
                      <span className="text-emerald-400 font-bold relative z-10">{bid.price.toFixed(4)}</span>
                      <span className="text-slate-300 text-right relative z-10">{bid.amount.toLocaleString()}</span>
                      <span className="text-slate-400 text-right relative z-10">{bid.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Execution Ticket */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Buy / Sell Side Selector */}
                  <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setOrderSide('BUY')}
                      className={`flex-1 py-2 font-bold rounded-xl text-xs transition-all ${
                        orderSide === 'BUY'
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Buy {selectedPair.base}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderSide('SELL')}
                      className={`flex-1 py-2 font-bold rounded-xl text-xs transition-all ${
                        orderSide === 'SELL'
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sell {selectedPair.base}
                    </button>
                  </div>

                  {/* Order Type Toggle */}
                  <div className="flex gap-1.5">
                    {(['LIMIT', 'MARKET', 'STOP_LOSS'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setOrderType(type)}
                        className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                          orderType === type
                            ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                            : 'border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {type.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Order Form */}
                  <form onSubmit={handlePlaceOrder} className="space-y-3 text-xs">
                    {orderType !== 'MARKET' && (
                      <div>
                        <div className="flex justify-between text-slate-400 font-semibold mb-1 text-[11px]">
                          <span>Limit Price</span>
                          <span>{selectedPair.quote}</span>
                        </div>
                        <input
                          type="number"
                          step="0.0001"
                          value={limitPrice}
                          onChange={(e) => setLimitPrice(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between text-slate-400 font-semibold mb-1 text-[11px]">
                        <span>Amount</span>
                        <span>{selectedPair.base}</span>
                      </div>
                      <input
                        type="number"
                        value={orderAmount}
                        onChange={(e) => setOrderAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    {/* Quick Percentage Buttons */}
                    <div className="flex gap-1.5">
                      {[25, 50, 75, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setSliderPercent(pct);
                            setOrderAmount((pct * 10).toString());
                          }}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                            sliderPercent === pct
                              ? 'bg-slate-800 text-cyan-300 border-cyan-500/40'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>

                    {/* Order Summary Box */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>Order Total:</span>
                        <span className="text-white font-bold">
                          {(
                            parseFloat(orderAmount || '0') *
                            parseFloat(limitPrice || selectedPair.price.toString())
                          ).toFixed(2)}{' '}
                          {selectedPair.quote}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Maker / Taker Fee:</span>
                        <span className="text-emerald-400 font-semibold">0.15% / 0.20%</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Execution Engine:</span>
                        <span className="text-cyan-400">Ceiba CLOB Pallet</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={`w-full py-3.5 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg ${
                        orderSide === 'BUY'
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          : 'bg-rose-500 hover:bg-rose-400 text-white'
                      }`}
                    >
                      Place {orderSide} {orderType} Order
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* AMM Quick Swap Mode */
          <div className="max-w-xl mx-auto w-full py-8">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ArrowsLeftRight size={22} className="text-cyan-400" />
                    BelizeChain AMM Quick Swap
                  </h2>
                  <p className="text-xs text-slate-400">Instant constant-product swaps with zero slippage routing</p>
                </div>
                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold font-mono">
                  Pool Curve V1
                </span>
              </div>

              <form onSubmit={handleExecuteSwap} className="space-y-4">
                {/* From Asset */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between text-slate-400 text-xs font-semibold mb-2">
                    <span>You Pay</span>
                    <span>Balance: 12,450.00 {fromAsset}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={swapAmount}
                      onChange={(e) => setSwapAmount(e.target.value)}
                      className="flex-1 bg-transparent text-xl font-mono font-bold text-white focus:outline-none"
                    />
                    <select
                      value={fromAsset}
                      onChange={(e) => setFromAsset(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-cyan-300 focus:outline-none"
                    >
                      <option value="DALLA">DALLA (Ɗ)</option>
                      <option value="bBZD">bBZD (BZ$)</option>
                      <option value="wDOT">wDOT</option>
                      <option value="wETH">wETH</option>
                    </select>
                  </div>
                </div>

                {/* Flip Button */}
                <div className="flex justify-center -my-2">
                  <button
                    type="button"
                    onClick={() => {
                      const temp = fromAsset;
                      setFromAsset(toAsset);
                      setToAsset(temp);
                    }}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 text-cyan-400 shadow-md transition-all"
                  >
                    <Swap size={18} weight="bold" />
                  </button>
                </div>

                {/* To Asset */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between text-slate-400 text-xs font-semibold mb-2">
                    <span>You Receive (Estimated)</span>
                    <span>Balance: 5,120.00 {toAsset}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled
                      value={
                        fromAsset === 'DALLA' && toAsset === 'bBZD'
                          ? (parseFloat(swapAmount || '0') * 0.5).toFixed(2)
                          : fromAsset === 'bBZD' && toAsset === 'DALLA'
                          ? (parseFloat(swapAmount || '0') * 2.0).toFixed(2)
                          : parseFloat(swapAmount || '0').toFixed(2)
                      }
                      className="flex-1 bg-transparent text-xl font-mono font-bold text-emerald-400 focus:outline-none"
                    />
                    <select
                      value={toAsset}
                      onChange={(e) => setToAsset(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-emerald-300 focus:outline-none"
                    >
                      <option value="bBZD">bBZD (BZ$)</option>
                      <option value="DALLA">DALLA (Ɗ)</option>
                      <option value="wDOT">wDOT</option>
                      <option value="wETH">wETH</option>
                    </select>
                  </div>
                </div>

                {/* Slippage Settings */}
                <div className="flex items-center justify-between px-2 text-xs">
                  <span className="text-slate-400">Slippage Tolerance</span>
                  <div className="flex gap-1.5 font-mono">
                    {(['0.1', '0.5', '1.0'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSlippage(s)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all ${
                          slippage === s
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {s}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Routing & Details */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Price Impact:</span>
                    <span className="text-emerald-400 font-semibold">&lt; 0.02%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Liquidity Provider Fee:</span>
                    <span className="text-slate-300">0.3%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Guaranteed Minimum:</span>
                    <span className="text-white">
                      {(parseFloat(swapAmount || '0') * 0.498).toFixed(2)} {toAsset}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl"
                >
                  Confirm Token Swap
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
