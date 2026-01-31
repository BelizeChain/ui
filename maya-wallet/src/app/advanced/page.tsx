'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  GearSix,
  WifiHigh,
  Database,
  ShieldCheck,
  Warning,
  Info,
  CheckCircle,
  Code
} from 'phosphor-react';

export default function AdvancedPage() {
  const router = useRouter();
  const [rpcEndpoint, setRpcEndpoint] = useState('wss://rpc.belizechain.bz');
  const [debugMode, setDebugMode] = useState(false);
  const [developerMode, setDeveloperMode] = useState(false);
  const [cacheEnabled, setCacheEnabled] = useState(true);

  const rpcEndpoints = [
    { url: 'wss://rpc.belizechain.bz', name: 'BelizeChain Official', status: 'online', latency: '45ms' },
    { url: 'wss://rpc-backup.belizechain.bz', name: 'Backup Node', status: 'online', latency: '67ms' },
    { url: 'wss://archive.belizechain.bz', name: 'Archive Node', status: 'online', latency: '102ms' },
    { url: 'ws://127.0.0.1:9944', name: 'Local Node', status: 'offline', latency: 'N/A' }
  ];

  const storageInfo = {
    total: '512 MB',
    used: '287 MB',
    cached: '143 MB',
    database: '144 MB'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Advanced Settings</h1>
              <p className="text-xs text-gray-400">Network & Developer Options</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
            <GearSix size={20} className="text-white" weight="fill" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Warning Banner */}
        <GlassCard variant="dark" blur="sm" className="p-4 border-l-4 border-amber-500">
          <div className="flex items-start gap-3">
            <Warning size={24} className="text-amber-500 flex-shrink-0" weight="fill" />
            <div>
              <h3 className="font-bold text-amber-900">Caution Required</h3>
              <p className="text-sm text-amber-700 mt-1">
                Changes to these settings can affect wallet functionality. Only modify if you understand the implications.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* RPC Endpoint Selection */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 px-2">Network RPC Endpoint</h2>
          <GlassCard variant="dark" blur="sm" className="divide-y divide-gray-100">
            {rpcEndpoints.map((endpoint) => (
              <button
                key={endpoint.url}
                onClick={() => setRpcEndpoint(endpoint.url)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    endpoint.status === 'online' ? 'bg-emerald-500/100' : 'bg-gray-400'
                  } animate-pulse`} />
                  <div className="text-left">
                    <p className="font-medium text-white">{endpoint.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{endpoint.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{endpoint.latency}</span>
                  {rpcEndpoint === endpoint.url && (
                    <CheckCircle size={20} className="text-forest-500" weight="fill" />
                  )}
                </div>
              </button>
            ))}
          </GlassCard>
        </div>

        {/* Developer Options */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 px-2">Developer Options</h2>
          <GlassCard variant="dark" blur="sm" className="divide-y divide-gray-100">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                  <Code size={20} className="text-white" weight="fill" />
                </div>
                <div>
                  <p className="font-medium text-white">Developer Mode</p>
                  <p className="text-xs text-gray-400">Enable advanced debugging tools</p>
                </div>
              </div>
              <button
                onClick={() => setDeveloperMode(!developerMode)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  developerMode ? 'bg-forest-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-gray-200 rounded-full transition-transform ${
                  developerMode ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center">
                  <Warning size={20} className="text-white" weight="fill" />
                </div>
                <div>
                  <p className="font-medium text-white">Debug Logging</p>
                  <p className="text-xs text-gray-400">Console verbose output</p>
                </div>
              </div>
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  debugMode ? 'bg-forest-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-gray-200 rounded-full transition-transform ${
                  debugMode ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Storage & Cache */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 px-2">Storage Management</h2>
          <GlassCard variant="gradient" blur="lg" className="p-5 mb-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm mb-1">Storage Used</p>
                <h2 className="text-2xl font-bold text-white">{storageInfo.used}</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-700/20 flex items-center justify-center">
                <Database size={24} className="text-white" weight="fill" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
              <div>
                <p className="text-white/60 text-xs">Cached</p>
                <p className="text-white font-bold text-sm">{storageInfo.cached}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Database</p>
                <p className="text-white font-bold text-sm">{storageInfo.database}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Total</p>
                <p className="text-white font-bold text-sm">{storageInfo.total}</p>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-2 gap-3">
            <button className="py-3 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl transition-all">
              Clear Cache
            </button>
            <button className="py-3 bg-red-500/100 hover:bg-red-400 text-white font-semibold rounded-xl transition-all">
              Reset All Data
            </button>
          </div>
        </div>

        {/* Connection Info */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 px-2">Connection Status</h2>
          <GlassCard variant="dark" blur="sm" className="p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Network</span>
                <span className="font-medium text-white">BelizeChain Mainnet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Block Height</span>
                <span className="font-medium text-white">#2,456,789</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Peers Connected</span>
                <span className="font-medium text-white">47 nodes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Sync Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500/100 rounded-full animate-pulse" />
                  <span className="font-medium text-emerald-400">Synced</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Info Box */}
        <GlassCard variant="dark" blur="sm" className="p-4 border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-blue-500 flex-shrink-0" weight="fill" />
            <div>
              <p className="text-sm text-gray-300">
                Need help? Visit our <span className="text-blue-400 font-semibold">Developer Documentation</span> for detailed guides on RPC configuration and advanced features.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
