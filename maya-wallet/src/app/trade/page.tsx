'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  ArrowsLeftRight,
  TrendUp,
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
} from 'phosphor-react';

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export default function TradePage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'swap' | 'orderbook' | 'liquidity'>('swap');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET' | 'STOP_LOSS'>('LIMIT');
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');

  // Swap State
  const [fromAsset, setFromAsset] = useState<'DALLA' | 'bBZD' | 'wDOT' | 'wETH'>('DALLA');
  const [toAsset, setToAsset] = useState<'DALLA' | 'bBZD' | 'wDOT' | 'wETH'>('bBZD');
  const [swapAmount, setSwapAmount] = useState('100');

  // Order Book State
  const [limitPrice, setLimitPrice] = useState('0.50');
  const [orderAmount, setOrderAmount] = useState('500');

  // Sample Live Order Book (V1 for Mainnet)
  const bids: OrderBookEntry[] = [
    { price: 0.4995, amount: 12500, total: 6243.75 },
    { price: 0.4980, amount: 8400, total: 4183.20 },
    { price: 0.4950, amount: 25000, total: 12375.00 },
    { price: 0.4910, amount: 15000, total: 7365.00 },
  ];

  const asks: OrderBookEntry[] = [
    { price: 0.5015, amount: 10200, total: 5115.30 },
    { price: 0.5030, amount: 14600, total: 7343.80 },
    { price: 0.5060, amount: 19800, total: 10018.80 },
    { price: 0.5100, amount: 31000, total: 15810.00 },
  ];

  const handleExecuteSwap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapAmount) return;

    const amt = parseFloat(swapAmount);
    const estOut = fromAsset === 'DALLA' && toAsset === 'bBZD' ? amt * 0.5 : fromAsset === 'bBZD' && toAsset === 'DALLA' ? amt * 2.0 : amt;

    addNotification({
      type: 'success',
      message: `Executed AMM Quick Swap: ${amt} ${fromAsset} ➔ ${estOut.toFixed(2)} ${toAsset} (0.3% LP fee)!`,
    });
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderAmount || (orderType === 'LIMIT' && !limitPrice)) return;

    addNotification({
      type: 'success',
      message: `Placed ${orderType} ${orderSide} Order for ${orderAmount} DALLA @ BZ$ ${limitPrice || 'Market'} on BelizeX Order Book V1!`,
    });
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to trade on BelizeX DEX and liquidity pools." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 z-10">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors">
                <ArrowLeft size={24} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">BelizeX DEX & Trading Floor</h1>
              <p className="text-xs text-slate-400">Order Book V1 • AMM Constant-Product Swaps • Liquidity Mining</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Sparkle size={16} weight="bold" />
              Mainnet Engine V1
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['swap', 'orderbook', 'liquidity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'swap'
                ? 'AMM Quick Swap'
                : tab === 'orderbook'
                ? 'Order Book V1 (Pro)'
                : 'Liquidity Pools & Farms'}
            </button>
          ))}
        </div>

        {/* Tab 1: AMM Quick Swap */}
        {activeTab === 'swap' && (
          <div className="max-w-lg mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowsLeftRight size={22} className="text-cyan-400" />
                Instant AMM Swap
              </h3>
              <p className="text-slate-400 mt-1">Guaranteed execution with low slippage across BelizeChain liquidity pools.</p>
            </div>

            <form onSubmit={handleExecuteSwap} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">You Pay</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                  <select
                    value={fromAsset}
                    onChange={(e) => setFromAsset(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-bold text-cyan-300 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="DALLA">DALLA (Ɗ)</option>
                    <option value="bBZD">bBZD (BZ$)</option>
                    <option value="wDOT">wDOT</option>
                    <option value="wETH">wETH</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-center -my-2">
                <button
                  type="button"
                  onClick={() => {
                    const temp = fromAsset;
                    setFromAsset(toAsset);
                    setToAsset(temp);
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 text-cyan-400 transition-all"
                >
                  <Swap size={16} weight="bold" />
                </button>
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">You Receive (Estimated)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    disabled
                    value={
                      fromAsset === 'DALLA' && toAsset === 'bBZD'
                        ? (parseFloat(swapAmount || '0') * 0.5).toFixed(2)
                        : fromAsset === 'bBZD' && toAsset === 'DALLA'
                        ? (parseFloat(swapAmount || '0') * 2.0).toFixed(2)
                        : (parseFloat(swapAmount || '0')).toFixed(2)
                    }
                    className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-emerald-400 font-mono"
                  />
                  <select
                    value={toAsset}
                    onChange={(e) => setToAsset(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-bold text-emerald-300 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="bBZD">bBZD (BZ$)</option>
                    <option value="DALLA">DALLA (Ɗ)</option>
                    <option value="wDOT">wDOT</option>
                    <option value="wETH">wETH</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Price Impact:</span>
                  <span className="text-emerald-400 font-semibold">&lt; 0.05%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Liquidity Provider Fee:</span>
                  <span className="text-slate-300">0.3%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Routing:</span>
                  <span className="text-cyan-400">Direct BelizeX AMM Curve</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg"
              >
                Swap Tokens Instantly
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Order Book V1 (Pro) */}
        {activeTab === 'orderbook' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Order Form */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl text-xs">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setOrderSide('BUY')}
                  className={`flex-1 py-2 font-bold rounded-lg text-xs transition-all ${
                    orderSide === 'BUY' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Buy DALLA
                </button>
                <button
                  type="button"
                  onClick={() => setOrderSide('SELL')}
                  className={`flex-1 py-2 font-bold rounded-lg text-xs transition-all ${
                    orderSide === 'SELL' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sell DALLA
                </button>
              </div>

              <div className="flex gap-2">
                {(['LIMIT', 'MARKET', 'STOP_LOSS'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                      orderType === type
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                {orderType !== 'MARKET' && (
                  <div>
                    <label className="text-slate-400 uppercase font-semibold mb-1 block">Limit Price (bBZD)</label>
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
                  <label className="text-slate-400 uppercase font-semibold mb-1 block">Amount (DALLA Ɗ)</label>
                  <input
                    type="number"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-3 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg ${
                    orderSide === 'BUY'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-rose-500 hover:bg-rose-400 text-white'
                  }`}
                >
                  Place {orderSide} {orderType} Order
                </button>
              </form>
            </div>

            {/* Depth Chart & Order Book */}
            <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base">Order Book V1: DALLA / bBZD</h3>
                  <span className="text-slate-400 text-[10px]">Spread: 0.0020 BZ$ (0.40%)</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold text-base font-mono">0.5000 BZ$</span>
                  <span className="text-slate-400 text-[10px] block">Mid Market Price</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono text-[11px]">
                {/* Bids */}
                <div className="space-y-2">
                  <span className="text-emerald-400 uppercase font-bold text-[10px] block">Bids (Buy Orders)</span>
                  <div className="space-y-1">
                    {bids.map((b, idx) => (
                      <div key={idx} className="flex justify-between p-2 bg-emerald-950/20 rounded-lg border border-emerald-500/20">
                        <span className="text-emerald-400 font-bold">{b.price.toFixed(4)}</span>
                        <span className="text-slate-300">{b.amount.toLocaleString()} Ɗ</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asks */}
                <div className="space-y-2">
                  <span className="text-rose-400 uppercase font-bold text-[10px] block">Asks (Sell Orders)</span>
                  <div className="space-y-1">
                    {asks.map((a, idx) => (
                      <div key={idx} className="flex justify-between p-2 bg-rose-950/20 rounded-lg border border-rose-500/20">
                        <span className="text-rose-400 font-bold">{a.price.toFixed(4)}</span>
                        <span className="text-slate-300">{a.amount.toLocaleString()} Ɗ</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Liquidity Pools & Farms */}
        {activeTab === 'liquidity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-base">DALLA / bBZD Liquidity Pool</h3>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-[10px]">
                  24.5% Farm APR
                </span>
              </div>
              <p className="text-slate-400">Earn 0.25% fee share on all AMM volume + bonus DALLA liquidity mining rewards.</p>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Total Pool Liquidity:</span>
                  <span className="text-white font-bold">BZ$ 1,850,000</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Your Staked LP Tokens:</span>
                  <span className="text-cyan-300 font-bold">450.00 LP</span>
                </div>
              </div>
              <button
                onClick={() => addNotification({ type: 'success', message: 'Harvested +35.40 Ɗ from DALLA/bBZD Pool Farm!' })}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkle size={16} weight="bold" />
                Harvest Farming Rewards (+35.40 Ɗ)
              </button>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-base">DALLA / wDOT Liquidity Pool</h3>
                <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 font-bold rounded-full text-[10px]">
                  18.2% Farm APR
                </span>
              </div>
              <p className="text-slate-400">Provide cross-chain liquidity for the Polkadot ecosystem and earn daily rewards.</p>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Total Pool Liquidity:</span>
                  <span className="text-white font-bold">95,000 wDOT</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Your Staked LP Tokens:</span>
                  <span className="text-purple-300 font-bold">0.00 LP</span>
                </div>
              </div>
              <button
                onClick={() => addNotification({ type: 'info', message: 'Deposit DALLA & wDOT to start earning LP yield.' })}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Plus size={16} weight="bold" />
                Deposit Liquidity
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
