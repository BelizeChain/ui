'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import { TradingChartCanvas } from '@/components/trade/TradingChartCanvas';
import {
  ArrowsLeftRight,
  TrendUp,
  TrendDown,
  Coins,
  Swap,
  Vault,
  Lightning,
  ArrowLeft,
  ArrowRight,
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
  Copy,
  ArrowSquareOut,
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

interface CandleData {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  up: boolean;
}

function formatPairPrice(val: number, p?: TradingPair): string {
  if (isNaN(val)) return '0.0000';
  if (val >= 1000) return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (val >= 10) return val.toFixed(3);
  return val.toFixed(4);
}

function generateCandles(pair: TradingPair, tf: string, count?: number): CandleData[] {
  const now = Date.now();
  let stepMinutes = 15;
  let defaultCount = 180;
  if (tf === '1m') {
    stepMinutes = 1;
    defaultCount = 200;
  } else if (tf === '5m') {
    stepMinutes = 5;
    defaultCount = 200;
  } else if (tf === '15m') {
    stepMinutes = 15;
    defaultCount = 200;
  } else if (tf === '30m') {
    stepMinutes = 30;
    defaultCount = 200;
  } else if (tf === '1H') {
    stepMinutes = 60;
    defaultCount = 200;
  } else if (tf === '4H') {
    stepMinutes = 240;
    defaultCount = 200;
  } else if (tf === '1D') {
    stepMinutes = 1440;
    defaultCount = 365;
  } else if (tf === '1W') {
    stepMinutes = 10080;
    defaultCount = 104;
  } else if (tf === '1M') {
    stepMinutes = 43200;
    defaultCount = 36;
  }

  const effectiveCount = count ?? defaultCount;
  const stepMs = stepMinutes * 60 * 1000;
  const candles: CandleData[] = [];

  let seed = 0;
  const hashKey = pair.symbol + '_' + tf;
  for (let i = 0; i < hashKey.length; i++) {
    seed = (seed * 31 + hashKey.charCodeAt(i)) & 0xffffffff;
  }
  const pseudoRandom = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 4294967296;
  };

  const currentPrice = pair.price;
  const spread = Math.max(pair.high24h - pair.low24h, currentPrice * 0.035);
  const lowBound = Math.min(pair.low24h, currentPrice - spread * 0.5);
  const highBound = Math.max(pair.high24h, currentPrice + spread * 0.5);

  const closes: number[] = [currentPrice];
  let p = currentPrice;
  for (let i = 1; i < effectiveCount; i++) {
    const delta = (pseudoRandom() - 0.485) * (spread * 0.17);
    p = Math.max(lowBound * 0.99, Math.min(highBound * 1.01, p - delta));
    closes.unshift(p);
  }

  for (let i = 0; i < effectiveCount; i++) {
    const close = closes[i];
    const open = i === 0 ? close * (1 + (pseudoRandom() - 0.5) * 0.008) : closes[i - 1];
    const maxOC = Math.max(open, close);
    const minOC = Math.min(open, close);
    const wickHigh = maxOC + pseudoRandom() * (spread * 0.06);
    const wickLow = Math.max(minOC * 0.92, minOC - pseudoRandom() * (spread * 0.06));
    const high = Math.max(maxOC, wickHigh);
    const low = Math.min(minOC, wickLow);
    const up = close >= open;

    const candleTime = new Date(now - (effectiveCount - 1 - i) * stepMs);
    let timeStr = '';
    if (stepMinutes >= 43200) {
      timeStr = candleTime.toLocaleDateString(undefined, { year: '2-digit', month: 'short' });
    } else if (stepMinutes >= 1440) {
      timeStr = candleTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } else {
      timeStr = candleTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }

    const volume = Math.floor((pair.volume24h / effectiveCount) * (0.5 + pseudoRandom() * 1.1));

    candles.push({
      time: timeStr,
      timestamp: candleTime.getTime(),
      open,
      high,
      low,
      close,
      volume,
      up,
    });
  }

  return candles;
}

function calculateEMA(candles: CandleData[], period: number): number[] {
  if (candles.length === 0) return [];
  const k = 2 / (period + 1);
  const emas: number[] = [];
  let ema = candles[0].close;
  emas.push(ema);
  for (let i = 1; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    emas.push(ema);
  }
  return emas;
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
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030914] flex flex-col items-center justify-center text-cyan-400 gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400 tracking-wider">INITIALIZING BELIZEX AMM TERMINAL...</p>
        </div>
      }
    >
      <TradePageInner />
    </Suspense>
  );
}

function TradePageInner() {
  const searchParams = useSearchParams();
  const initialMode = searchParams?.get('mode') === 'amm' ? 'AMM' : 'PRO';

  const { selectedAccount, isConnected, balance } = useWallet();
  const { addNotification } = useUIStore();

  // Selected Market Pair
  const [selectedPair, setSelectedPair] = useState<TradingPair>(TRADING_PAIRS[0]);
  const [pairDropdownOpen, setPairDropdownOpen] = useState(false);
  const [pairFilter, setPairFilter] = useState<'All' | 'Sovereign' | 'Cross-Chain' | 'RWA & Eco'>('All');
  const [pairSearch, setPairSearch] = useState('');

  // Main UI Mode & Tabs
  const [tradingMode, setTradingMode] = useState<'PRO' | 'AMM'>(initialMode);
  const [chartTimeframe, setChartTimeframe] = useState<
    '1m' | '5m' | '15m' | '30m' | '1H' | '4H' | '1D' | '1W' | '1M'
  >('15m');
  const [chartType, setChartType] = useState<'candles' | 'depth'>('candles');
  const [bottomTab, setBottomTab] = useState<'orders' | 'history' | 'trades' | 'liquidity'>('orders');

  // Order Book UI View & Precision State
  const [orderBookView, setOrderBookView] = useState<'BOTH' | 'BIDS' | 'ASKS'>('BOTH');
  const [bookPrecision, setBookPrecision] = useState<'AUTO' | '0.0001' | '0.001' | '0.01'>('AUTO');

  // Chart Interactive Hover State
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [hoveredDepth, setHoveredDepth] = useState<{ side: 'BID' | 'ASK'; price: number; amount: number; total: number } | null>(null);

  // Order Ticket State
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET' | 'STOP_LOSS'>('LIMIT');
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [limitPrice, setLimitPrice] = useState<string>(formatPairPrice(TRADING_PAIRS[0].price, TRADING_PAIRS[0]));
  const [orderAmount, setOrderAmount] = useState<string>('500');
  const [sliderPercent, setSliderPercent] = useState<number>(25);

  // AMM Quick Swap State
  const [fromAsset, setFromAsset] = useState<'DALLA' | 'bBZD' | 'wDOT' | 'wETH'>('DALLA');
  const [toAsset, setToAsset] = useState<'DALLA' | 'bBZD' | 'wDOT' | 'wETH'>('bBZD');
  const [swapAmount, setSwapAmount] = useState('100');
  const [slippage, setSlippage] = useState<'0.1' | '0.5' | '1.0'>('0.5');
  const [isSwapping, setIsSwapping] = useState(false);
  const [copiedRouter, setCopiedRouter] = useState(false);

  const ROUTER_CONTRACT_ADDRESS = 'r1UenLmcTAhKMLsqK7fujghzYs5WinB1ttiEnjhsPRC9U4jv4';

  // Get active balance for selected from asset
  const getAssetBalance = (asset: string) => {
    if (asset === 'DALLA') return balance?.dalla || '150,000.00';
    if (asset === 'bBZD') return balance?.bBZD || '25,000.00';
    if (asset === 'wDOT') return '45.20';
    if (asset === 'wETH') return '1.85';
    return '0.00';
  };

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

  // Live Simulated Institutional Order Book (12 Depth Tiers)
  const bids: OrderBookEntry[] = useMemo(() => {
    const rawBids = [
      { price: selectedPair.price * 0.9995, amount: 8400 },
      { price: selectedPair.price * 0.9985, amount: 14200 },
      { price: selectedPair.price * 0.9960, amount: 28500 },
      { price: selectedPair.price * 0.9935, amount: 36200 },
      { price: selectedPair.price * 0.9900, amount: 45000 },
      { price: selectedPair.price * 0.9875, amount: 22000 },
      { price: selectedPair.price * 0.9850, amount: 32000 },
      { price: selectedPair.price * 0.9820, amount: 54000 },
      { price: selectedPair.price * 0.9800, amount: 68000 },
      { price: selectedPair.price * 0.9775, amount: 41000 },
      { price: selectedPair.price * 0.9750, amount: 89000 },
      { price: selectedPair.price * 0.9700, amount: 112000 },
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
      { price: selectedPair.price * 1.0005, amount: 7200 },
      { price: selectedPair.price * 1.0015, amount: 12400 },
      { price: selectedPair.price * 1.0040, amount: 21800 },
      { price: selectedPair.price * 1.0065, amount: 29500 },
      { price: selectedPair.price * 1.0100, amount: 38200 },
      { price: selectedPair.price * 1.0125, amount: 19400 },
      { price: selectedPair.price * 1.0150, amount: 49000 },
      { price: selectedPair.price * 1.0180, amount: 58000 },
      { price: selectedPair.price * 1.0200, amount: 72000 },
      { price: selectedPair.price * 1.0225, amount: 39000 },
      { price: selectedPair.price * 1.0250, amount: 95000 },
      { price: selectedPair.price * 1.0300, amount: 128000 },
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

  // Spread calculation
  const spreadValue = useMemo(() => {
    if (asks.length === 0 || bids.length === 0) return { absolute: 0, percent: 0 };
    const diff = Math.max(0, asks[0].price - bids[0].price);
    const pct = (diff / selectedPair.price) * 100;
    return { absolute: diff, percent: pct };
  }, [asks, bids, selectedPair.price]);

  // Dynamic Candlestick Data
  const candles: CandleData[] = useMemo(() => {
    return generateCandles(selectedPair, chartTimeframe);
  }, [selectedPair, chartTimeframe]);

  const activeCandle = hoveredCandle || (candles.length > 0 ? candles[candles.length - 1] : null);

  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0, maxPrice: 1, maxVolume: 1 };
    const min = Math.min(...candles.map((c) => c.low));
    const max = Math.max(...candles.map((c) => c.high));
    const pad = (max - min) * 0.08 || min * 0.02;
    return {
      minPrice: Math.max(0.0001, min - pad),
      maxPrice: max + pad,
      maxVolume: Math.max(...candles.map((c) => c.volume), 1),
    };
  }, [candles]);

  const ema9 = useMemo(() => calculateEMA(candles, 9), [candles]);
  const ema21 = useMemo(() => calculateEMA(candles, 21), [candles]);

  const maxDepthTotal = useMemo(() => {
    return Math.max(
      bids[bids.length - 1]?.total || 1,
      asks[asks.length - 1]?.total || 1
    );
  }, [bids, asks]);

  const bidsReversed = useMemo(() => [...bids].reverse(), [bids]);

  const bidsDepthPath = useMemo(() => {
    if (bidsReversed.length === 0) return '';
    const points = bidsReversed.map((b, i) => {
      const x = 20 + (i / Math.max(1, bidsReversed.length - 1)) * 330;
      const y = 220 - (b.total / maxDepthTotal) * 165;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M 20,220 L ${points.join(' L ')} L 350,220 Z`;
  }, [bidsReversed, maxDepthTotal]);

  const asksDepthPath = useMemo(() => {
    if (asks.length === 0) return '';
    const points = asks.map((a, i) => {
      const x = 370 + (i / Math.max(1, asks.length - 1)) * 330;
      const y = 220 - (a.total / maxDepthTotal) * 165;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M 370,220 L ${points.join(' L ')} L 700,220 Z`;
  }, [asks, maxDepthTotal]);

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(720, ((e.clientX - rect.left) / rect.width) * 720));
    const mouseY = Math.max(0, Math.min(250, ((e.clientY - rect.top) / rect.height) * 250));
    const slotW = 720 / Math.max(1, candles.length);
    const idx = Math.min(candles.length - 1, Math.max(0, Math.floor(mouseX / slotW)));
    setHoveredCandle(candles[idx]);
    setHoverCoords({ x: idx * slotW + slotW / 2, y: mouseY });
  };

  const handleChartMouseLeave = () => {
    setHoveredCandle(null);
    setHoverCoords(null);
    setHoveredDepth(null);
  };

  const handleDepthMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(720, ((e.clientX - rect.left) / rect.width) * 720));
    if (mouseX < 350) {
      const ratio = Math.max(0, Math.min(1, (mouseX - 20) / 330));
      const idx = Math.min(bids.length - 1, Math.floor((1 - ratio) * bids.length));
      const b = bids[idx];
      if (b) {
        setHoveredDepth({ side: 'BID', price: b.price, amount: b.amount, total: b.total });
      }
    } else if (mouseX > 370) {
      const ratio = Math.max(0, Math.min(1, (mouseX - 370) / 330));
      const idx = Math.min(asks.length - 1, Math.floor(ratio * asks.length));
      const a = asks[idx];
      if (a) {
        setHoveredDepth({ side: 'ASK', price: a.price, amount: a.amount, total: a.total });
      }
    } else {
      setHoveredDepth(null);
    }
  };

  // Handle Pair Switching
  const handleSelectPair = (pair: TradingPair) => {
    setSelectedPair(pair);
    setLimitPrice(formatPairPrice(pair.price, pair));
    setPairDropdownOpen(false);
  };

  // Handle Click-to-Trade from Order Book
  const handleOrderBookClick = (price: number, amount: number) => {
    setLimitPrice(formatPairPrice(price, selectedPair));
    setOrderAmount(amount.toString());
    addNotification({
      type: 'info',
      message: `Pre-filled ${selectedPair.symbol} order ticket: ${amount.toLocaleString()} @ ${formatPairPrice(price, selectedPair)}`,
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

    setIsSwapping(true);
    // CONFIG-002: the gem DEX contract swap entrypoint is not wired from
    // this page yet (gem.ts service exposes token reads, not router swaps).
    // Announce honestly instead of faking a router execution.
    setIsSwapping(false);
    addNotification({
      type: 'info',
      message: `DEX swap of ${amt} ${fromAsset} → ${toAsset} is not yet executable from this page — the gem dex contract router call is queued. No funds moved.`,
    });
  };

  const handleCopyRouter = () => {
    navigator.clipboard.writeText(ROUTER_CONTRACT_ADDRESS);
    setCopiedRouter(true);
    addNotification({
      type: 'success',
      message: 'BelizeX Router Contract address copied!',
    });
    setTimeout(() => setCopiedRouter(false), 2000);
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
    <div className="min-h-screen bg-[#030914] text-slate-100 flex flex-col font-sans pb-20 selection:bg-cyan-500/30">
      {/* Top Caribbean Cyber Header & Ticker Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-2xl border-b border-teal-500/20 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1720px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
          {/* Pair Selector & Back Button */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <button
                title="Return to Maya Wallet"
                className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-all border border-teal-500/20 shadow-sm"
              >
                <ArrowLeft size={20} weight="bold" />
              </button>
            </Link>

            {/* Pair Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setPairDropdownOpen(!pairDropdownOpen)}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-800/90 hover:bg-slate-750 border border-teal-500/30 rounded-xl transition-all shadow-sm"
              >
                <div className="flex -space-x-1.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center text-[11px] font-black text-slate-950 shadow-sm">
                    {selectedPair.base[0]}
                  </span>
                  <span className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center text-[11px] font-black text-slate-950 shadow-sm">
                    {selectedPair.quote[0]}
                  </span>
                </div>
                <div className="text-left">
                  <span className="font-bold text-sm tracking-wide flex items-center gap-1 text-white">
                    {selectedPair.symbol}
                    <CaretDown size={14} className="text-cyan-400" />
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
                    className="absolute left-0 top-full mt-2 w-80 bg-slate-900/95 border border-teal-500/30 rounded-2xl shadow-2xl p-3 z-50 backdrop-blur-2xl"
                  >
                    <div className="relative mb-2">
                      <MagnifyingGlass size={16} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search markets..."
                        value={pairSearch}
                        onChange={(e) => setPairSearch(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>

                    <div className="flex gap-1 mb-2 pb-2 border-b border-slate-800/80 overflow-x-auto text-[10px]">
                      {(['All', 'Sovereign', 'Cross-Chain', 'RWA & Eco'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setPairFilter(cat)}
                          className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                            pairFilter === cat ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
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
                              ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300'
                              : 'hover:bg-slate-800/70 text-slate-300'
                          }`}
                        >
                          <span className="font-bold">{pair.symbol}</span>
                          <div className="text-right">
                            <span className="font-mono block">{formatPairPrice(pair.price, pair)}</span>
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
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Last Price</span>
              <span className="text-base font-bold font-mono text-emerald-400 flex items-center gap-1">
                {formatPairPrice(selectedPair.price, selectedPair)}{' '}
                <span className="text-[11px] text-slate-400 font-normal">{selectedPair.quote}</span>
              </span>
            </div>

            <div className="hidden sm:block">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">24h Change</span>
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
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">24h High</span>
              <span className="font-mono text-slate-200 font-semibold">{formatPairPrice(selectedPair.high24h, selectedPair)}</span>
            </div>

            <div className="hidden md:block">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">24h Low</span>
              <span className="font-mono text-slate-200 font-semibold">{formatPairPrice(selectedPair.low24h, selectedPair)}</span>
            </div>

            <div className="hidden lg:block">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">24h Volume ({selectedPair.base})</span>
              <span className="font-mono text-cyan-300 font-semibold">{selectedPair.volume24h.toLocaleString()}</span>
            </div>

            <div className="hidden xl:flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-teal-500/20 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Ceiba CLOB Engine:</span>
              <span className="text-emerald-300 font-mono font-bold">2,500 TPS (12ms)</span>
            </div>
          </div>

          {/* Mode Switcher: Pro CLOB vs AMM Swap */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-teal-500/20 text-xs font-bold">
            <button
              onClick={() => setTradingMode('AMM')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                tradingMode === 'AMM'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AMM Quick Swap
            </button>
            <button
              onClick={() => setTradingMode('PRO')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                tradingMode === 'PRO'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Order Book (Pro)
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
              <div className="bg-slate-900/80 border border-teal-500/20 rounded-3xl p-4 sm:p-5 flex flex-col shadow-xl backdrop-blur-md">
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
                    <div className="flex bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                      {(['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M'] as const).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setChartTimeframe(tf)}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            chartTimeframe === tf
                              ? 'bg-slate-800 text-cyan-300 font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>

                    <div className="flex bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-[11px]">
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

                {/* Interactive Dynamic Candlestick & Depth Chart */}
                {chartType === 'depth' ? (
                  <div className="relative w-full h-72 sm:h-96 my-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 p-4 flex flex-col justify-between overflow-hidden">
                    {/* Depth Header & Metrics */}
                    <div className="relative z-10 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/80 pb-2 gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                          Bids: {bids.reduce((s, b) => s + b.amount, 0).toLocaleString()} {selectedPair.base}
                        </span>
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                          Asks: {asks.reduce((s, a) => s + a.amount, 0).toLocaleString()} {selectedPair.base}
                        </span>
                      </div>
                      <div className="text-right text-cyan-300 font-semibold">
                        Spread: {formatPairPrice(spreadValue.absolute, selectedPair)} ({spreadValue.percent.toFixed(2)}%)
                      </div>
                    </div>

                    {/* SVG Depth Chart */}
                    <svg
                      className="w-full h-56 sm:h-72 my-auto cursor-crosshair"
                      viewBox="0 0 720 240"
                      preserveAspectRatio="none"
                      onMouseMove={handleDepthMouseMove}
                      onMouseLeave={handleChartMouseLeave}
                    >
                      <defs>
                        <linearGradient id="bidsDepthGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                        </linearGradient>
                        <linearGradient id="asksDepthGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="20" y1="55" x2="700" y2="55" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" opacity="0.4" />
                      <line x1="20" y1="110" x2="700" y2="110" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" opacity="0.4" />
                      <line x1="20" y1="165" x2="700" y2="165" stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" opacity="0.4" />
                      <line x1="20" y1="220" x2="700" y2="220" stroke="#475569" strokeWidth="1" opacity="0.6" />

                      {/* Mid Market Divider */}
                      <line x1="360" y1="25" x2="360" y2="220" stroke="#06b6d4" strokeDasharray="4 4" strokeWidth="1.5" opacity="0.8" />
                      <rect x="315" y="12" width="90" height="20" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="1" />
                      <text x="360" y="26" fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                        Mid {formatPairPrice(selectedPair.price, selectedPair)}
                      </text>

                      {/* Bids Depth Fill and Stroke */}
                      {bidsDepthPath && <path d={bidsDepthPath} fill="url(#bidsDepthGradient)" />}
                      {bidsDepthPath && (
                        <path
                          d={bidsDepthPath.replace(' Z', '').replace('M 20,220 L ', 'M ')}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                        />
                      )}

                      {/* Asks Depth Fill and Stroke */}
                      {asksDepthPath && <path d={asksDepthPath} fill="url(#asksDepthGradient)" />}
                      {asksDepthPath && (
                        <path
                          d={asksDepthPath.replace(' Z', '').replace('M 370,220 L ', 'M ')}
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2.5"
                        />
                      )}

                      {/* Depth Hover Tooltip */}
                      {hoveredDepth && (
                        <g className="pointer-events-none">
                          <rect
                            x={hoveredDepth.side === 'BID' ? 60 : 480}
                            y={40}
                            width={180}
                            height={62}
                            fill="#090d16"
                            fillOpacity="0.95"
                            stroke={hoveredDepth.side === 'BID' ? '#10b981' : '#f43f5e'}
                            strokeWidth="1"
                            rx="8"
                          />
                          <text
                            x={hoveredDepth.side === 'BID' ? 72 : 492}
                            y={58}
                            fill={hoveredDepth.side === 'BID' ? '#34d399' : '#fb7185'}
                            fontSize="11"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {hoveredDepth.side} LIQUIDITY
                          </text>
                          <text
                            x={hoveredDepth.side === 'BID' ? 72 : 492}
                            y={74}
                            fill="#cbd5e1"
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            Price: {formatPairPrice(hoveredDepth.price, selectedPair)} {selectedPair.quote}
                          </text>
                          <text
                            x={hoveredDepth.side === 'BID' ? 72 : 492}
                            y={90}
                            fill="#94a3b8"
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            Depth: {hoveredDepth.total.toLocaleString()} {selectedPair.base}
                          </text>
                        </g>
                      )}
                    </svg>

                    {/* Bottom Depth Price Range Axis */}
                    <div className="relative z-10 flex justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                      <span className="text-emerald-400 font-semibold">{formatPairPrice(bids[bids.length - 1]?.price || selectedPair.price * 0.97, selectedPair)}</span>
                      <span className="text-emerald-400">{formatPairPrice(bids[0]?.price || selectedPair.price * 0.999, selectedPair)}</span>
                      <span className="text-cyan-300 font-bold">{formatPairPrice(selectedPair.price, selectedPair)}</span>
                      <span className="text-rose-400">{formatPairPrice(asks[0]?.price || selectedPair.price * 1.001, selectedPair)}</span>
                      <span className="text-rose-400 font-semibold">{formatPairPrice(asks[asks.length - 1]?.price || selectedPair.price * 1.025, selectedPair)}</span>
                    </div>
                  </div>
                ) : (
                  <TradingChartCanvas
                    pairSymbol={selectedPair.symbol}
                    baseAsset={selectedPair.base}
                    quoteAsset={selectedPair.quote}
                    currentPrice={selectedPair.price}
                    candles={candles}
                    timeframe={chartTimeframe}
                    formatPrice={(val) => formatPairPrice(val, selectedPair)}
                    onSelectTimeframe={(tf) => setChartTimeframe(tf as any)}
                  />
                )}
              </div>

              {/* Bottom Dashboard: Open Orders, Trade History, Public Trades, Liquidity */}
              <div className="bg-slate-900/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl backdrop-blur-md flex-1">
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
                              <td className="py-3 font-bold text-white">{formatPairPrice(ord.price, selectedPair)}</td>
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
                            <td className="py-3 font-bold text-white">{formatPairPrice(ord.price, selectedPair)}</td>
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
                              {formatPairPrice(trade.price, selectedPair)}
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
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-teal-500/20 space-y-3">
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
                        className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md"
                      >
                        Harvest Farming Yield
                      </button>
                    </div>

                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-teal-500/20 space-y-3">
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
                        className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md"
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
              {/* Institutional CLOB Order Book */}
              <div className="bg-slate-900/80 border border-teal-500/20 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md flex flex-col">
                {/* Header: Title, Book View Modes & Spread */}
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                        <Vault size={16} className="text-cyan-400" />
                        Order Book
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded font-mono border border-cyan-500/20">
                        Ceiba L2
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Click any row to fill ticket</span>
                  </div>

                  {/* View Modes & Precision */}
                  <div className="flex items-center gap-2">
                    {/* 3 View Filter Buttons */}
                    <div className="flex bg-slate-950/90 p-0.5 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setOrderBookView('BOTH')}
                        title="Split Book (Bids & Asks)"
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                          orderBookView === 'BOTH'
                            ? 'bg-slate-800 text-cyan-300 font-extrabold shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      </button>
                      <button
                        onClick={() => setOrderBookView('BIDS')}
                        title="Bids Only (Buy Liquidity)"
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                          orderBookView === 'BIDS'
                            ? 'bg-emerald-500/20 text-emerald-300 font-extrabold shadow border border-emerald-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        Bids
                      </button>
                      <button
                        onClick={() => setOrderBookView('ASKS')}
                        title="Asks Only (Sell Liquidity)"
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                          orderBookView === 'ASKS'
                            ? 'bg-rose-500/20 text-rose-300 font-extrabold shadow border border-rose-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                        Asks
                      </button>
                    </div>

                    {/* Precision Selector */}
                    <select
                      value={bookPrecision}
                      onChange={(e) => setBookPrecision(e.target.value as any)}
                      className="bg-slate-950/90 text-slate-300 border border-slate-800 rounded-lg px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-cyan-400"
                    >
                      <option value="AUTO">Dec: Auto</option>
                      <option value="0.0001">0.0001</option>
                      <option value="0.001">0.001</option>
                      <option value="0.01">0.01</option>
                    </select>
                  </div>
                </div>

                {/* Spread & Market Info Bar */}
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pb-2 mb-1.5 border-b border-slate-800/60">
                  <span className="text-slate-500">Spread</span>
                  <span className="text-cyan-300 font-bold">
                    {formatPairPrice(spreadValue.absolute, selectedPair)} ({spreadValue.percent.toFixed(2)}%)
                  </span>
                </div>

                {/* Table Column Headers */}
                <div className="grid grid-cols-3 text-[10px] font-mono text-slate-400 pb-1.5 border-b border-slate-800/80">
                  <span>Price ({selectedPair.quote})</span>
                  <span className="text-right">Size ({selectedPair.base})</span>
                  <span className="text-right">Total</span>
                </div>

                {/* Asks (Sell Orders Ladder - Top, Red) */}
                {(orderBookView === 'BOTH' || orderBookView === 'ASKS') && (
                  <div className="space-y-0.5 my-1 font-mono text-[11px]">
                    {(orderBookView === 'BOTH' ? asks.slice(0, 7) : asks)
                      .slice()
                      .reverse()
                      .map((ask, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleOrderBookClick(ask.price, ask.amount)}
                          className="relative grid grid-cols-3 py-1 px-1.5 rounded hover:bg-rose-500/20 cursor-pointer transition-all group"
                        >
                          <div
                            className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-rose-500/20 to-rose-500/5 rounded pointer-events-none transition-all"
                            style={{ width: `${ask.depthPercent}%` }}
                          />
                          <span className="text-rose-400 font-bold relative z-10 group-hover:underline">
                            {formatPairPrice(ask.price, selectedPair)}
                          </span>
                          <span className="text-slate-300 text-right relative z-10">{ask.amount.toLocaleString()}</span>
                          <span className="text-slate-400 text-right relative z-10">{ask.total.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                )}

                {/* Mid Market Price Banner */}
                <div className="py-2.5 my-1.5 px-3 bg-slate-950/90 rounded-xl border border-teal-500/20 flex items-center justify-between font-mono shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold text-base tracking-wide">
                      {formatPairPrice(selectedPair.price, selectedPair)}
                    </span>
                    <TrendUp size={16} className="text-emerald-400" />
                    <span className="text-[10px] text-slate-400 font-sans">{selectedPair.quote}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Mid Market</span>
                    <span className="text-[10px] text-slate-500 font-bold">Ceiba #7010</span>
                  </div>
                </div>

                {/* Bids (Buy Orders Ladder - Bottom, Green) */}
                {(orderBookView === 'BOTH' || orderBookView === 'BIDS') && (
                  <div className="space-y-0.5 my-1 font-mono text-[11px]">
                    {(orderBookView === 'BOTH' ? bids.slice(0, 7) : bids).map((bid, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleOrderBookClick(bid.price, bid.amount)}
                        className="relative grid grid-cols-3 py-1 px-1.5 rounded hover:bg-emerald-500/20 cursor-pointer transition-all group"
                      >
                        <div
                          className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-emerald-500/20 to-emerald-500/5 rounded pointer-events-none transition-all"
                          style={{ width: `${bid.depthPercent}%` }}
                        />
                        <span className="text-emerald-400 font-bold relative z-10 group-hover:underline">
                          {formatPairPrice(bid.price, selectedPair)}
                        </span>
                        <span className="text-slate-300 text-right relative z-10">{bid.amount.toLocaleString()}</span>
                        <span className="text-slate-400 text-right relative z-10">{bid.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Execution Ticket */}
              <div className="bg-slate-900/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl backdrop-blur-md flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Buy / Sell Side Selector */}
                  <div className="flex bg-slate-950/90 p-1 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setOrderSide('BUY')}
                      className={`flex-1 py-2 font-bold rounded-xl text-xs transition-all ${
                        orderSide === 'BUY'
                          ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md'
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
                          ? 'bg-rose-500 text-white font-extrabold shadow-md'
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
                          className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
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
                        className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
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
                              : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>

                    {/* Order Summary Box */}
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-teal-500/20 space-y-1 text-[11px] font-mono">
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
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold'
                          : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-extrabold'
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
          /* Caribbean Cyber-Ocean AMM Quick Swap Mode */
          <div className="max-w-2xl mx-auto w-full py-6 space-y-5">
            {/* BelizeX Sovereign Router Attestation Card */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900/60 border border-teal-500/30 rounded-2xl p-4 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-300">
                  <ShieldCheck size={24} weight="fill" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">BelizeX AMM Sovereign Router</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live Contract
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-cyan-300/80 mt-0.5 break-all">
                    {ROUTER_CONTRACT_ADDRESS.slice(0, 14)}...{ROUTER_CONTRACT_ADDRESS.slice(-10)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyRouter}
                className="self-start sm:self-auto px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-xl text-teal-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                {copiedRouter ? <Check size={14} weight="bold" className="text-emerald-400" /> : <Copy size={14} />}
                {copiedRouter ? 'Copied' : 'Copy Router'}
              </button>
            </div>

            {/* Main AMM Swap Card */}
            <div className="bg-slate-900/70 border border-teal-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden">
              {/* Subtle ambient gradient glow */}
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Title Header */}
              <div className="flex items-center justify-between border-b border-teal-500/20 pb-4 relative z-10">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <ArrowsLeftRight size={22} className="text-teal-400" />
                    BelizeChain Constant-Product AMM
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Automated Market Maker • Zero-slippage algorithmic routing</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-teal-500/10 text-teal-300 border border-teal-500/30 rounded-full text-xs font-bold font-mono">
                    Pool V1.05
                  </span>
                </div>
              </div>

              <form onSubmit={handleExecuteSwap} className="space-y-4 relative z-10">
                {/* From Asset Box */}
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-teal-500/20 space-y-2 hover:border-teal-500/40 transition-colors">
                  <div className="flex justify-between text-slate-400 text-xs font-semibold">
                    <span>You Pay</span>
                    <span className="font-mono text-cyan-300">
                      Balance: {getAssetBalance(fromAsset)} {fromAsset}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={swapAmount}
                      onChange={(e) => setSwapAmount(e.target.value)}
                      className="flex-1 bg-transparent text-2xl font-mono font-bold text-white focus:outline-none placeholder-slate-600"
                    />
                    <select
                      value={fromAsset}
                      onChange={(e) => setFromAsset(e.target.value as any)}
                      className="bg-slate-900 border border-teal-500/30 rounded-xl px-3 py-2.5 text-xs font-bold text-teal-300 focus:outline-none shadow-sm cursor-pointer"
                    >
                      <option value="DALLA">DALLA (Ɗ)</option>
                      <option value="bBZD">bBZD (BZ$)</option>
                      <option value="wDOT">wDOT</option>
                      <option value="wETH">wETH</option>
                    </select>
                  </div>

                  {/* Percentage shortcuts */}
                  <div className="flex gap-1.5 pt-1">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          const rawBal = parseFloat(getAssetBalance(fromAsset).replace(/,/g, '') || '0');
                          if (rawBal > 0) {
                            const buffer = fromAsset === 'DALLA' && pct === 100 ? 0.05 : 0;
                            const calc = Math.max(0, (rawBal * (pct / 100)) - buffer);
                            setSwapAmount(calc.toFixed(2));
                          }
                        }}
                        className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-teal-500/20 text-slate-400 hover:text-teal-300 text-[10px] font-mono font-bold border border-slate-800 transition-colors"
                      >
                        {pct === 100 ? 'MAX' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flip Asset Direction Button */}
                <div className="flex justify-center -my-2 relative z-20">
                  <button
                    type="button"
                    onClick={() => {
                      const temp = fromAsset;
                      setFromAsset(toAsset);
                      setToAsset(temp);
                    }}
                    className="p-3 bg-slate-900 hover:bg-teal-900/50 rounded-full border border-teal-500/40 text-teal-400 shadow-xl hover:rotate-180 transition-all duration-300"
                  >
                    <Swap size={18} weight="bold" />
                  </button>
                </div>

                {/* To Asset Box */}
                <div className="bg-slate-950/80 p-4 rounded-2xl border border-teal-500/20 space-y-2 hover:border-teal-500/40 transition-colors">
                  <div className="flex justify-between text-slate-400 text-xs font-semibold">
                    <span>You Receive (Estimated)</span>
                    <span className="font-mono text-emerald-400">
                      Balance: {getAssetBalance(toAsset)} {toAsset}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
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
                      className="flex-1 bg-transparent text-2xl font-mono font-bold text-emerald-400 focus:outline-none"
                    />
                    <select
                      value={toAsset}
                      onChange={(e) => setToAsset(e.target.value as any)}
                      className="bg-slate-900 border border-teal-500/30 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-300 focus:outline-none shadow-sm cursor-pointer"
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
                  <span className="text-slate-400 font-medium">Slippage Tolerance</span>
                  <div className="flex gap-1.5 font-mono">
                    {(['0.1', '0.5', '1.0'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSlippage(s)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                          slippage === s
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {s}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Algorithmic Routing & Swap Details Breakdown */}
                <div className="bg-slate-950/90 p-4 rounded-2xl border border-teal-500/20 space-y-2.5 text-xs font-mono">
                  {/* Route Hop Diagram */}
                  <div className="border-b border-slate-800 pb-2 mb-2">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Execution Route</span>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-300 flex-wrap">
                      <span className="px-2 py-0.5 bg-teal-500/15 text-teal-300 rounded-md font-bold">{fromAsset}</span>
                      <ArrowRight size={11} className="text-slate-500" weight="bold" />
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">BelizeX Router</span>
                      <ArrowRight size={11} className="text-slate-500" weight="bold" />
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">CP-AMM Pool</span>
                      <ArrowRight size={11} className="text-slate-500" weight="bold" />
                      <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 rounded-md font-bold">{toAsset}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Effective Exchange Rate:</span>
                    <span className="text-white font-bold">
                      {fromAsset === 'DALLA' && toAsset === 'bBZD'
                        ? '1 Ɗ = 0.5000 BZ$'
                        : fromAsset === 'bBZD' && toAsset === 'DALLA'
                        ? '1 BZ$ = 2.0000 Ɗ'
                        : '1.0000'}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Price Impact:</span>
                    <span className="text-emerald-400 font-semibold">
                      {parseFloat(swapAmount || '0') > 5000 ? '0.24%' : '< 0.01% (Deep Sovereign Liquidity)'}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>LP Protocol Fee:</span>
                    <span className="text-slate-300">0.30% (Distributed to Sovereign LPs)</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Guaranteed Minimum Received:</span>
                    <span className="text-white font-bold">
                      {(
                        parseFloat(swapAmount || '0') *
                        (fromAsset === 'DALLA' && toAsset === 'bBZD' ? 0.498 : fromAsset === 'bBZD' && toAsset === 'DALLA' ? 1.992 : 0.997)
                      ).toFixed(2)}{' '}
                      {toAsset}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSwapping}
                  className="w-full py-4 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(20,184,166,0.35)] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ArrowsLeftRight size={18} weight="bold" />
                  {isSwapping ? 'Executing BelizeX Swap Extrinsic...' : `Confirm Swap (${fromAsset} to ${toAsset})`}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
