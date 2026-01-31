'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import {
  Code,
  Key,
  ShareNetwork,
  FileCode,
  Copy,
  CheckCircle,
  Book,
  TestTube,
  ArrowLeft
} from 'phosphor-react';

export default function DeveloperPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'api-keys' | 'docs' | 'webhooks'>('api-keys');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const apiKeys = [
    { name: 'Production API Key', key: 'bz_prod_7f8a...3d2e', created: '2025-12-15', lastUsed: '2026-01-15', requests: 45234, status: 'active' },
    { name: 'Development API Key', key: 'bz_dev_9b1c...5f4a', created: '2026-01-01', lastUsed: '2026-01-14', requests: 1247, status: 'active' },
    { name: 'Test API Key', key: 'bz_test_2d5e...8c7b', created: '2026-01-10', lastUsed: 'Never', requests: 0, status: 'inactive' }
  ];

  const sdkPackages = [
    { name: '@belizechain/wallet-sdk', version: '2.1.0', language: 'TypeScript', downloads: '12.4K' },
    { name: 'belizechain-py', version: '1.8.2', language: 'Python', downloads: '8.9K' },
    { name: '@belizechain/gem-sdk', version: '1.5.0', language: 'TypeScript', downloads: '5.2K' }
  ];

  const webhooks = [
    { url: 'https://api.example.com/webhooks/transactions', events: ['transaction.completed', 'payment.received'], status: 'active', lastTriggered: '2026-01-15 14:32' },
    { url: 'https://api.example.com/webhooks/staking', events: ['staking.reward', 'validator.status'], status: 'active', lastTriggered: '2026-01-14 09:18' }
  ];

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
              <h1 className="text-xl font-bold text-white">Developer Tools</h1>
              <p className="text-xs text-gray-400">APIs, SDKs & Documentation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Code size={32} className="text-slate-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">API Keys</p>
              <p className="text-2xl font-bold text-white">{apiKeys.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Requests</p>
              <p className="text-2xl font-bold text-slate-400">46.5K</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Webhooks</p>
              <p className="text-2xl font-bold text-white">{webhooks.length}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="dark-medium" blur="lg" className="p-1">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('api-keys')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'api-keys'
                  ? 'bg-gradient-to-r from-slate-500 to-zinc-400 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'docs'
                ? 'bg-gradient-to-r from-slate-500 to-zinc-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            Documentation
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'webhooks'
                ? 'bg-gradient-to-r from-slate-500 to-zinc-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            Webhooks
          </button>
          </div>
        </GlassCard>
      </div>

      <div className="px-4 space-y-4">
        {activeTab === 'api-keys' && (
          <>
            <button className="w-full flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-slate-400 to-zinc-400 text-white rounded-xl shadow-lg">
              <Key size={20} weight="fill" />
              <span className="font-semibold">Generate New API Key</span>
            </button>

            {apiKeys.map((apiKey, index) => (
              <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white mb-1">{apiKey.name}</h3>
                    <p className="text-xs font-mono text-gray-400">{apiKey.key}</p>
                  </div>
                  <span className={`px-2 py-0.5 ${apiKey.status === 'active' ? 'bg-emerald-500/100/20 text-emerald-400' : 'bg-gray-200 text-gray-400'} text-xs rounded-full font-semibold`}>
                    {apiKey.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div>
                    <p className="text-gray-400">Created</p>
                    <p className="font-semibold text-white">{apiKey.created}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Last Used</p>
                    <p className="font-semibold text-white">{apiKey.lastUsed}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                  <span className="text-sm text-gray-400">{apiKey.requests.toLocaleString()} requests</span>
                  <button
                    onClick={() => handleCopy(apiKey.key)}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    {copiedKey === apiKey.key ? (
                      <>
                        <CheckCircle size={16} className="text-emerald-400" weight="fill" />
                        <span className="text-xs font-semibold text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="text-gray-400" />
                        <span className="text-xs font-semibold text-white">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </GlassCard>
            ))}
          </>
        )}

        {activeTab === 'docs' && (
          <>
            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">SDK Packages</h3>
              <div className="space-y-3">
                {sdkPackages.map((pkg) => (
                  <div key={pkg.name} className="p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{pkg.name}</h4>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full font-mono">
                        v{pkg.version}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <FileCode size={16} className="text-slate-400" />
                        <span className="text-gray-400">{pkg.language}</span>
                      </div>
                      <span className="text-gray-400">{pkg.downloads} downloads</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Quick Start</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1"># Install SDK</p>
                  <p className="text-sm font-mono text-emerald-400">npm install @belizechain/wallet-sdk</p>
                </div>
                <div className="p-3 bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1"># Initialize Client</p>
                  <p className="text-sm font-mono text-blue-400">import {'{ BelizeClient }'} from '@belizechain/wallet-sdk';</p>
                  <p className="text-sm font-mono text-purple-400 mt-1">const client = new BelizeClient(apiKey);</p>
                </div>
              </div>
            </GlassCard>

            <a
              href="https://docs.belizechain.bz"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-slate-400 to-zinc-400 text-white rounded-xl shadow-lg"
            >
              <Book size={20} weight="fill" />
              <span className="font-semibold">View Full Documentation</span>
            </a>
          </>
        )}

        {activeTab === 'webhooks' && (
          <>
            <button className="w-full flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-slate-400 to-zinc-400 text-white rounded-xl shadow-lg">
              <ShareNetwork size={20} weight="fill" />
              <span className="font-semibold">Create Webhook</span>
            </button>

            {webhooks.map((webhook, index) => (
              <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white mb-1">Webhook #{index + 1}</h3>
                    <p className="text-xs font-mono text-gray-400 break-all">{webhook.url}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/100/20 text-emerald-400 text-xs rounded-full font-semibold">
                    Active
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2">Events</p>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <span key={event} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded font-mono">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <p className="text-gray-400">Last triggered: {webhook.lastTriggered}</p>
                  <button className="text-blue-400 hover:text-blue-700 font-semibold">Edit →</button>
                </div>
              </GlassCard>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
