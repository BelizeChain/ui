'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Code, Terminal, Cube, Link as LinkIcon, FileCode, Flask, Package } from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';

export default function DeveloperPage() {
  const router = useRouter();

  const apiEndpoints = [
    { method: 'GET', endpoint: '/api/v1/blocks/latest', description: 'Get latest block' },
    { method: 'GET', endpoint: '/api/v1/blocks/{hash}', description: 'Get block by hash' },
    { method: 'GET', endpoint: '/api/v1/transactions/{hash}', description: 'Get transaction details' },
    { method: 'POST', endpoint: '/api/v1/transactions/submit', description: 'Submit transaction' },
    { method: 'GET', endpoint: '/api/v1/validators', description: 'List all validators' },
    { method: 'GET', endpoint: '/api/v1/validators/{address}', description: 'Get validator details' },
  ];

  const sdkExamples = [
    {
      title: 'Connect to Node',
      language: 'TypeScript',
      code: `import { ApiPromise, WsProvider } from '@polkadot/api';

const provider = new WsProvider('ws://localhost:9944');
const api = await ApiPromise.create({ provider });

console.log('Connected to chain:', await api.rpc.system.chain());`,
    },
    {
      title: 'Query Balance',
      language: 'TypeScript',
      code: `const address = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const { data: { free } } = await api.query.system.account(address);

console.log('Balance:', free.toHuman());`,
    },
    {
      title: 'Submit Extrinsic',
      language: 'TypeScript',
      code: `const transfer = api.tx.balances.transfer(dest, 1000000000000);
const hash = await transfer.signAndSend(sender);

console.log('Transaction hash:', hash.toHex());`,
    },
  ];

  const tools = [
    {
      icon: <Terminal size={24} weight="duotone" />,
      name: 'Blockchain CLI',
      description: 'Command-line interface for blockchain operations',
      status: 'Available',
      link: 'https://docs.belizechain.io/cli',
    },
    {
      icon: <Package size={24} weight="duotone" />,
      name: 'TypeScript SDK',
      description: 'Official SDK for building dApps',
      status: 'v1.2.0',
      link: 'https://www.npmjs.com/package/@belizechain/sdk',
    },
    {
      icon: <FileCode size={24} weight="duotone" />,
      name: 'Smart Contract Templates',
      description: 'Pre-built contract templates',
      status: 'Beta',
      link: '/developer/templates',
    },
    {
      icon: <Flask size={24} weight="duotone" />,
      name: 'Testnet Faucet',
      description: 'Get testnet DALLA for development',
      status: 'Active',
      link: '/developer/faucet',
    },
  ];

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
              <p className="text-xs text-gray-400">APIs, SDKs, and documentation</p>
            </div>
          </div>
          <Code size={32} className="text-purple-400" weight="duotone" />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        {/* Network Info */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Cube size={20} className="text-blue-400" weight="duotone" />
            Network Endpoints
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">WebSocket RPC</p>
              <code className="text-sm text-emerald-400 bg-gray-800/50 px-3 py-2 rounded block">
                ws://localhost:9944
              </code>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">HTTP RPC</p>
              <code className="text-sm text-emerald-400 bg-gray-800/50 px-3 py-2 rounded block">
                http://localhost:9933
              </code>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Testnet WebSocket</p>
              <code className="text-sm text-emerald-400 bg-gray-800/50 px-3 py-2 rounded block">
                wss://testnet.belizechain.io
              </code>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Mainnet WebSocket</p>
              <code className="text-sm text-emerald-400 bg-gray-800/50 px-3 py-2 rounded block">
                wss://rpc.belizechain.io
              </code>
            </div>
          </div>
        </GlassCard>

        {/* API Reference */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <LinkIcon size={20} className="text-blue-400" weight="duotone" />
            REST API Endpoints
          </h2>
          <div className="space-y-2">
            {apiEndpoints.map((endpoint, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm text-gray-300">{endpoint.endpoint}</code>
                </div>
                <p className="text-xs text-gray-400 hidden md:block">{endpoint.description}</p>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View Full API Documentation →
          </button>
        </GlassCard>

        {/* SDK Examples */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileCode size={20} className="text-blue-400" weight="duotone" />
            Code Examples
          </h2>
          <div className="space-y-4">
            {sdkExamples.map((example, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-b border-gray-700/50">
                  <p className="text-sm font-medium text-white">{example.title}</p>
                  <span className="text-xs text-gray-400">{example.language}</span>
                </div>
                <pre className="p-4 overflow-x-auto">
                  <code className="text-xs text-gray-300 leading-relaxed whitespace-pre">
                    {example.code}
                  </code>
                </pre>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Developer Tools */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Development Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((tool, index) => (
              <div
                key={index}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="text-purple-400">{tool.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white">{tool.name}</h3>
                      <span className="text-xs text-emerald-400">{tool.status}</span>
                    </div>
                    <p className="text-xs text-gray-400">{tool.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Resources */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Additional Resources</h2>
          <div className="space-y-2">
            <a
              href="https://docs.belizechain.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-blue-500/50 transition-colors"
            >
              <span className="text-sm text-gray-300">Developer Documentation</span>
              <LinkIcon size={16} className="text-gray-400" />
            </a>
            <a
              href="https://github.com/BelizeChain/belizechain"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-blue-500/50 transition-colors"
            >
              <span className="text-sm text-gray-300">GitHub Repository</span>
              <LinkIcon size={16} className="text-gray-400" />
            </a>
            <a
              href="https://discord.gg/belizechain"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-blue-500/50 transition-colors"
            >
              <span className="text-sm text-gray-300">Developer Community (Discord)</span>
              <LinkIcon size={16} className="text-gray-400" />
            </a>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
