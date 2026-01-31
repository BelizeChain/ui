'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard, AssetCard, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import * as belizexService from '@/services/pallets/belizex';
import {
  ArrowsLeftRight,
  TrendUp,
  Coins,
  CaretDown,
  Swap,
  Vault,
  Lightning,
  ChartLine,
  ArrowLeft
} from 'phosphor-react';

export default function TradePage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();
  
  const [fromCurrency, setFromCurrency] = useState('DALLA');
  const [toCurrency, setToCurrency] = useState('bBZD');
  const [amount, setAmount] = useState('');
  const [activeTab, setActiveTab] = useState('swap');
  
  const [pools, setPools] = useState<belizexService.LiquidityPool[]>([]);
  const [assets, setAssets] = useState<belizexService.Asset[]>([]);
  const [swapQuote, setSwapQuote] = useState<belizexService.SwapQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);

  // Fetch pools and assets from blockchain
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        const [poolsData, assetsData] = await Promise.all([
          belizexService.getLiquidityPools(),
          belizexService.getAssets()
        ]);
        
        setPools(poolsData);
        setAssets(assetsData);
      } catch (err: any) {
        console.error('Failed to fetch BelizeX data:', err);
        setError(err.message || 'Unable to load exchange data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get swap quote when amount changes
  useEffect(() => {
    async function fetchQuote() {
      if (!amount || parseFloat(amount) <= 0) {
        setSwapQuote(null);
        return;
      }

      try {
        const quote = await belizexService.getSwapQuote(fromCurrency, toCurrency, amount);
        setSwapQuote(quote);
      } catch (err) {
        console.error('Failed to get swap quote:', err);
        setSwapQuote(null);
      }
    }

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [amount, fromCurrency, toCurrency]);

  // Execute swap
  const handleSwap = async () => {
    if (!selectedAccount || !swapQuote) return;

    setSwapping(true);
    try {
      const result = await belizexService.executeSwap(
        selectedAccount.address,
        fromCurrency,
        toCurrency,
        amount,
        swapQuote.minimumReceived
      );
      
      alert(`Swap successful! Received ${result.outputAmount} ${toCurrency}`);
      setAmount('');
      setSwapQuote(null);
    } catch (err: any) {
      console.error('Swap failed:', err);
      alert(`Swap failed: ${err.message || 'Unknown error'}`);
    } finally {
      setSwapping(false);
    }
  };

  const estimatedOutput = swapQuote?.outputAmount || '0.00';
  const exchangeRate = swapQuote && amount && parseFloat(amount) > 0
    ? (parseFloat(swapQuote.outputAmount) / parseFloat(amount)).toFixed(4)
    : '0.0000';

  // Calculate total stats from pools
  const total24hVolume = pools.reduce((sum, pool) => sum + parseFloat(pool.volume24h || '0'), 0);
  const totalLiquidity = pools.reduce((sum, pool) => sum + parseFloat(pool.totalLiquidity || '0'), 0);

  // Show loading state
  if (loading) {
    return <LoadingSpinner message="Loading BelizeX data from blockchain..." fullScreen />;
  }

  // Show error state
  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">BelizeX</h1>
              <p className="text-xs text-gray-400">Decentralized Exchange</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-emerald-500/30">
              <div className="flex items-center space-x-1">
                <TrendUp size={14} weight="fill" className="text-emerald-400" />
                <span className="text-xs text-emerald-400 font-semibold">Live</span>
              </div>
            </div>
            <ArrowsLeftRight size={32} className="text-emerald-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1">24h Volume</p>
              <p className="text-lg font-bold text-white">${total24hVolume.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1">Liquidity</p>
              <p className="text-lg font-bold text-white">${totalLiquidity.toLocaleString()}</p>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-3 border border-gray-700/30">
              <p className="text-xs text-gray-400 mb-1">Pairs</p>
              <p className="text-lg font-bold text-white">{pools.length}</p>
            </div>
          </div>
        </GlassCard>

        {/* Trading Tabs */}
        <GlassCard variant="dark" blur="md" className="p-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="swap">Swap</TabsTrigger>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
              <TabsTrigger value="nfts">NFTs</TabsTrigger>
            </TabsList>

            {/* Swap Tab */}
            <TabsContent value="swap" className="mt-4">
              <GlassCard variant="dark-medium" blur="lg" className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Swap Tokens</h2>
                  <div className="flex items-center space-x-1 text-xs text-forest-600 bg-forest-100/50 px-2 py-1 rounded-lg">
                    <Lightning size={14} weight="fill" />
                    <span>Instant</span>
                  </div>
                </div>

                {/* From */}
                <div className="mb-3">
                  <label className="text-sm text-gray-400 mb-2 block font-medium">From</label>
                  <div className="bg-gradient-to-br from-forest-50/50 to-emerald-50/50 rounded-xl p-4 border border-forest-200">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-400"
                      />
                      <button className="flex items-center space-x-2 bg-gray-800/80 hover:bg-gray-700 px-3 py-2 rounded-lg border border-forest-200 transition-all">
                        <Coins size={20} className="text-forest-600" weight="fill" />
                        <span className="font-semibold text-white">{fromCurrency}</span>
                        <CaretDown size={16} className="text-gray-400" weight="fill" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">Balance: 5,234.50 DALLA</p>
                  </div>
                </div>

                {/* Swap Icon */}
                <div className="flex justify-center -my-3 relative z-10">
                  <button className="bg-gradient-to-br from-forest-500 to-emerald-600 hover:from-forest-600 hover:to-emerald-700 p-3 rounded-xl text-white shadow-lg transform hover:scale-110 transition-all duration-300">
                    <ArrowsLeftRight size={20} weight="bold" />
                  </button>
                </div>

                {/* To */}
                <div className="mb-6">
                  <label className="text-sm text-gray-400 mb-2 block font-medium">To</label>
                  <div className="bg-gradient-to-br from-forest-50/50 to-emerald-50/50 rounded-xl p-4 border border-forest-200">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={estimatedOutput}
                        readOnly
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-2xl font-bold text-white outline-none"
                      />
                      <button className="flex items-center space-x-2 bg-gray-800/80 hover:bg-gray-700 px-3 py-2 rounded-lg border border-forest-200 transition-all">
                        <Vault size={20} className="text-forest-600" weight="fill" />
                        <span className="font-semibold text-white">{toCurrency}</span>
                        <CaretDown size={16} className="text-gray-400" weight="fill" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">Balance: 2,617.25 bBZD</p>
                  </div>
                </div>

                {/* Exchange Rate Info */}
                {swapQuote && (
                  <div className="bg-forest-50/50 rounded-lg p-3 mb-6 border border-forest-200">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">Exchange Rate</span>
                      <span className="font-semibold text-white">1 {fromCurrency} = {exchangeRate} {toCurrency}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">Price Impact</span>
                      <span className={`font-semibold ${swapQuote.priceImpact > 5 ? 'text-red-500' : 'text-white'}`}>
                        {swapQuote.priceImpact.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Network Fee</span>
                      <span className="font-semibold text-white">{swapQuote.fee} DALLA</span>
                    </div>
                  </div>
                )}

                {/* Connect Wallet or Swap Button */}
                {!isConnected ? (
                  <ConnectWalletPrompt message="Connect wallet to swap tokens" />
                ) : (
                  <button 
                    onClick={handleSwap}
                    disabled={!amount || !swapQuote || swapping || parseFloat(amount) <= 0}
                    className="w-full bg-gradient-to-r from-forest-500 to-emerald-600 hover:from-forest-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Swap size={20} weight="fill" />
                    <span>{swapping ? 'Swapping...' : 'Swap Tokens'}</span>
                  </button>
                )}
              </GlassCard>
            </TabsContent>

            {/* Crypto Tab */}
            <TabsContent value="crypto" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Registered Assets</h3>
                  <button className="text-xs text-forest-600 hover:text-forest-700 font-semibold flex items-center space-x-1" aria-label="View all assets">
                    <ChartLine size={14} weight="fill" />
                    <span>View All</span>
                  </button>
                </div>
                
                {assets.length === 0 ? (
                  <div className="bg-gray-800/50 rounded-xl p-8 text-center">
                    <Coins size={48} className="mx-auto mb-3 text-gray-500" />
                    <p className="text-gray-300 font-semibold mb-2">No Assets Found</p>
                    <p className="text-gray-400 text-sm">
                      Start the blockchain node to see registered assets
                    </p>
                  </div>
                ) : (
                  assets.slice(0, 5).map(asset => (
                    <GlassCard key={asset.id} variant="dark" blur="sm" className="p-4 hover:scale-[1.02] transition-transform">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-forest-500 flex items-center justify-center text-white text-xl font-bold">
                            {asset.symbol.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{asset.symbol}</p>
                            <p className="text-xs text-gray-400">{asset.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">{asset.price}</p>
                          <div className={`flex items-center space-x-1 text-xs ${(asset.change ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            <TrendUp size={12} weight="fill" className={(asset.change ?? 0) < 0 ? 'rotate-180' : ''} />
                            <span>{Math.abs(asset.change ?? 0)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-200">
                        <span>24h Volume: {asset.volume}</span>
                        <span className="text-forest-600 font-semibold">Trade →</span>
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>
            </TabsContent>

            {/* NFT Tab */}
            <TabsContent value="nfts" className="mt-4">
              <div className="space-y-4">
                {/* NFT Marketplace Coming Soon */}
                {/* NFT collections will come from gem/ smart contracts */}
                <div className="bg-gray-800/50 rounded-xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                    N
                  </div>
                  <p className="text-gray-300 font-semibold mb-2">NFT Marketplace Coming Soon</p>
                  <p className="text-gray-400 text-sm">
                    NFT collections will be integrated from GEM smart contracts
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </GlassCard>
      </div>
    </div>
  );
}
