'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard, Tabs, TabsContent, TabsList, TabsTrigger, AssetCard } from '@/components/ui';
import { useWallet } from '@/contexts/WalletContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendUp,
  Buildings,
  Image as ImageIcon,
  Globe,
  Fingerprint,
  Atom,
  Database,
  Brain,
  ArrowUp,
  ArrowDown,
  Swap,
  ChartLine,
  Clock,
  Eye,
  EyeSlash
} from 'phosphor-react';

export default function Home() {
  const { balance, balanceLoading, isConnected, connect } = useWallet();
  const [activeTab, setActiveTab] = useState('crypto');
  const [balanceVisible, setBalanceVisible] = useState(true);

  // Calculate display balance
  const displayBalance = {
    dalla: balance?.dalla || '0.00',
    bbzd: balance?.bBZD || '0.00',
    total: balance?.total || '0.00'
  };

  // If not connected, show connect button
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-emerald-50 flex items-center justify-center px-4 pb-24 font-sans">
        <GlassCard variant="medium" blur="lg" className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center">
            <Wallet size={32} weight="fill" className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            Connect your Polkadot wallet to access Maya Wallet and manage your BelizeChain assets
          </p>
          <button
            onClick={connect}
            className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
            aria-label="Connect Polkadot wallet"
          >
            Connect Wallet
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Make sure you have Polkadot.js extension installed
          </p>
        </GlassCard>
      </div>
    );
  }

  // Mock crypto assets (updated with real balances)
  const cryptoAssets = [
    { symbol: 'DALLA', name: 'Dalla Token', price: 1.25, change: 5.2, volume: '2.4M', balance: displayBalance.dalla },
    { symbol: 'bBZD', name: 'Belize Dollar', price: 0.50, change: 0.1, volume: '1.8M', balance: displayBalance.bbzd },
    { symbol: 'DOT', name: 'Polkadot', price: 42.30, change: -2.4, volume: '850K', balance: '12.45' }
  ];

  // Mock land assets
  const landAssets = [
    { symbol: 'LAND-001', name: 'Coastal Property - Ambergris Caye', price: 125000, change: 3.2, volume: '45K', balance: '1' },
    { symbol: 'LAND-042', name: 'Rainforest Plot - Cayo District', price: 68500, change: 1.8, volume: '12K', balance: '1' }
  ];

  // Mock NFT collections
  const nftAssets = [
    { symbol: 'BELI', name: 'Belize Heritage NFTs', price: 150.00, change: 12.5, volume: '45K', balance: '3' },
    { symbol: 'MAYA', name: 'Maya Artifacts Collection', price: 280.00, change: 8.3, volume: '28K', balance: '1' }
  ];

  // Mock Pakit storage
  const pakitStats = {
    totalStorage: '2.4 TB',
    usedStorage: '856 GB',
    documents: 1247,
    compressionSaved: '42%'
  };

  // Mock Nawal AI
  const nawalStats = {
    contributions: 12,
    qualityScore: 94,
    dallaEarned: 600.0,
    rank: 4
  };

  // Mock Kinich Quantum
  const kinichStats = {
    jobsCompleted: 8,
    quantumTime: '127 hrs',
    pqwRewards: 245.5,
    efficiency: 96
  };

  // Recent activity
  const recentActivity = [
    { type: 'Received', asset: 'DALLA', amount: '+125.00', time: '2h ago', from: 'Maria Garcia' },
    { type: 'Sent', asset: 'bBZD', amount: '-50.00', time: '5h ago', to: 'Blue Hole Divers' },
    { type: 'Swap', asset: 'DALLA → bBZD', amount: '100 → 50', time: '1d ago', via: 'BelizeX' },
    { type: 'Staking', asset: 'DALLA', amount: '+1.71', time: '1d ago', from: 'Daily Rewards' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-white to-emerald-50 pb-24 font-sans">
      {/* Header with Balance */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(168, 213, 186, 0.4) 0%, transparent 50%),
                               radial-gradient(circle at 80% 80%, rgba(88, 151, 109, 0.4) 0%, transparent 50%)`
            }}
          />
        </div>

        <GlassCard variant="gradient" blur="lg" className="m-4 relative">
          <div className="mb-4">
            <p className="text-sm mb-1" style={{ color: '#ffffff', opacity: 0.9 }}>Total Balance</p>
            <div className="flex items-baseline space-x-3">
              {balanceLoading ? (
                <div className="h-10 w-48 bg-white/20 rounded-lg animate-pulse" />
              ) : (
                <>
                  <h1 className="text-4xl font-bold" style={{ color: '#ffffff' }}>
                    ${(parseFloat(displayBalance.dalla) * 1.25 + parseFloat(displayBalance.bbzd) * 0.50).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h1>
                  <div className="flex items-center space-x-1" style={{ color: '#6ee7b7' }}>
                    <TrendUp size={16} weight="fill" />
                    <span className="text-sm font-semibold">+5.2%</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>DALLA</p>
              {balanceLoading ? (
                <div className="h-6 w-24 bg-white/20 rounded animate-pulse mb-1" />
              ) : (
                <>
                  <p className="text-xl font-bold" style={{ color: '#ffffff' }}>{parseFloat(displayBalance.dalla).toLocaleString()}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>${(parseFloat(displayBalance.dalla) * 1.25).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </>
              )}
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>bBZD</p>
              {balanceLoading ? (
                <div className="h-6 w-24 bg-white/20 rounded animate-pulse mb-1" />
              ) : (
                <>
                  <p className="text-xl font-bold" style={{ color: '#ffffff' }}>{parseFloat(displayBalance.bbzd).toLocaleString()}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>${(parseFloat(displayBalance.bbzd) * 0.50).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 border border-white/30 transition-all flex flex-col items-center space-y-1">
              <ArrowUp size={20} weight="bold" style={{ color: '#ffffff' }} />
              <span className="text-xs font-semibold" style={{ color: '#ffffff' }}>Send</span>
            </button>
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 border border-white/30 transition-all flex flex-col items-center space-y-1">
              <ArrowDown size={20} weight="bold" style={{ color: '#ffffff' }} />
              <span className="text-xs font-semibold" style={{ color: '#ffffff' }}>Receive</span>
            </button>
            <Link href="/trade">
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-3 border border-white/30 transition-all flex flex-col items-center space-y-1 w-full">
                <Swap size={20} weight="bold" style={{ color: '#ffffff' }} />
                <span className="text-xs font-semibold" style={{ color: '#ffffff' }}>Swap</span>
              </button>
            </Link>
          </div>
        </GlassCard>
      </div>

      {/* Main Dashboard with Tabs */}
      <div className="px-4 -mt-6 mb-6">
        <GlassCard variant="light" blur="md" className="p-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full overflow-x-auto flex-nowrap">
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
              <TabsTrigger value="land">Land</TabsTrigger>
              <TabsTrigger value="nfts">NFTs</TabsTrigger>
              <TabsTrigger value="pakit">Pakit</TabsTrigger>
              <TabsTrigger value="nawal">Nawal AI</TabsTrigger>
              <TabsTrigger value="kinich">Kinich</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Crypto Tab */}
            <TabsContent value="crypto" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Your Crypto Assets</h3>
                  <Link href="/trade" className="text-xs text-forest-600 hover:text-forest-700 font-semibold" aria-label="Go to Trade page">
                    Trade →
                  </Link>
                </div>
                {cryptoAssets.map(asset => (
                  <AssetCard key={asset.symbol} asset={asset} />
                ))}
              </div>
            </TabsContent>

            {/* Land Tab */}
            <TabsContent value="land" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Land Registry</h3>
                  <button className="text-xs text-forest-600 hover:text-forest-700 font-semibold" aria-label="View all land registry entries">
                    View All →
                  </button>
                </div>
                {landAssets.map(asset => (
                  <GlassCard key={asset.symbol} variant="light" blur="sm" className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                          <Buildings size={24} weight="fill" className="text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{asset.symbol}</p>
                          <p className="text-xs text-gray-600">{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${asset.price.toLocaleString()}</p>
                        <div className={`flex items-center space-x-1 text-xs ${asset.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          <TrendUp size={12} weight="fill" />
                          <span>+{asset.change}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <button className="text-xs text-forest-600 font-semibold" aria-label="View land certificate">View Certificate →</button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </TabsContent>

            {/* NFTs Tab */}
            <TabsContent value="nfts" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Your NFT Collections</h3>
                  <button className="text-xs text-forest-600 hover:text-forest-700 font-semibold">
                    Browse →
                  </button>
                </div>
                {nftAssets.map(asset => (
                  <GlassCard key={asset.symbol} variant="light" blur="sm" className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                          <ImageIcon size={24} weight="fill" className="text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{asset.symbol}</p>
                          <p className="text-xs text-gray-500">{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{asset.balance} NFTs</p>
                        <p className="text-xs text-gray-500">Floor: {asset.price} DALLA</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
                      <span className="text-gray-500">24h Vol: {asset.volume}</span>
                      <span className="text-emerald-600 font-semibold">+{asset.change}%</span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </TabsContent>

            {/* Pakit Tab */}
            <TabsContent value="pakit" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Decentralized Storage</h3>
                  <button className="text-xs text-forest-600 hover:text-forest-700 font-semibold">
                    Manage →
                  </button>
                </div>
                
                <GlassCard variant="medium" blur="lg" className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Database size={24} weight="fill" className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Pakit Storage</h3>
                      <p className="text-xs text-gray-500">IPFS + Arweave</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Storage</span>
                      <span className="font-semibold text-gray-900">{pakitStats.totalStorage}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Used</span>
                      <span className="font-semibold text-gray-900">{pakitStats.usedStorage}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full" style={{ width: '36%' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                      <div className="bg-cyan-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-cyan-700">{pakitStats.documents}</p>
                        <p className="text-xs text-gray-600">Documents</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-blue-700">{pakitStats.compressionSaved}</p>
                        <p className="text-xs text-gray-600">Space Saved</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </TabsContent>

            {/* Nawal AI Tab */}
            <TabsContent value="nawal" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Federated Learning</h3>
                  <button className="text-xs text-forest-600 hover:text-forest-700 font-semibold">
                    Details →
                  </button>
                </div>
                
                <GlassCard variant="medium" blur="lg" className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <Brain size={24} weight="fill" className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Nawal AI</h3>
                      <p className="text-xs text-gray-500">Proof of Useful Work</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Contributions</span>
                      <span className="font-semibold text-gray-900">{nawalStats.contributions} cycles</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Quality Score</span>
                      <span className="font-semibold text-purple-600">{nawalStats.qualityScore}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">DALLA Earned</span>
                      <span className="font-semibold text-emerald-600">+{nawalStats.dallaEarned}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-purple-700">#{nawalStats.rank}</p>
                        <p className="text-xs text-gray-600">Global Rank</p>
                      </div>
                      <div className="bg-pink-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-pink-700">Active</p>
                        <p className="text-xs text-gray-600">Status</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </TabsContent>

            {/* Kinich Quantum Tab */}
            <TabsContent value="kinich" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Quantum Computing</h3>
                  <button className="text-xs text-forest-600 hover:text-forest-700 font-semibold">
                    Dashboard →
                  </button>
                </div>
                
                <GlassCard variant="medium" blur="lg" className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Atom size={24} weight="fill" className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Kinich Quantum</h3>
                      <p className="text-xs text-gray-500">Azure Quantum + IBM Q</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Jobs Completed</span>
                      <span className="font-semibold text-gray-900">{kinichStats.jobsCompleted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Quantum Time</span>
                      <span className="font-semibold text-gray-900">{kinichStats.quantumTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">PQW Rewards</span>
                      <span className="font-semibold text-emerald-600">+{kinichStats.pqwRewards} DALLA</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                      <div className="bg-indigo-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-indigo-700">{kinichStats.efficiency}%</p>
                        <p className="text-xs text-gray-600">Efficiency</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-purple-700">Running</p>
                        <p className="text-xs text-gray-600">Status</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                  <button className="text-xs text-forest-600 hover:text-forest-700 font-semibold">
                    View All →
                  </button>
                </div>
                {recentActivity.map((activity, index) => (
                  <GlassCard key={index} variant="light" blur="sm" className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          activity.type === 'Received' ? 'bg-emerald-100' :
                          activity.type === 'Sent' ? 'bg-blue-100' :
                          activity.type === 'Swap' ? 'bg-purple-100' :
                          'bg-amber-100'
                        }`}>
                          {activity.type === 'Received' ? <ArrowDown size={20} weight="fill" className="text-emerald-600" /> :
                           activity.type === 'Sent' ? <ArrowUp size={20} weight="fill" className="text-blue-600" /> :
                           activity.type === 'Swap' ? <Swap size={20} weight="fill" className="text-purple-600" /> :
                           <ChartLine size={20} weight="fill" className="text-amber-600" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{activity.type}</p>
                          <p className="text-xs text-gray-500">{activity.asset}</p>
                          <p className="text-xs text-gray-400">{activity.from || activity.to || activity.via}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${activity.amount.startsWith('+') ? 'text-emerald-600' : activity.amount.startsWith('-') ? 'text-red-600' : 'text-gray-900'}`}>
                          {activity.amount}
                        </p>
                        <div className="flex items-center justify-end space-x-1 text-xs text-gray-400">
                          <Clock size={12} />
                          <span>{activity.time}</span>
                        </div>
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
