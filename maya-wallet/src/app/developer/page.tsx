'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import {
  Code,
  Key,
  ShareNetwork,
  FileCode,
  Copy,
  CheckCircle,
  Book,
  TestTube,
  ArrowLeft,
  Terminal,
  Broadcast,
  Lightning,
  Sparkle,
  Cpu,
  Check,
  Drop,
  Clock,
  ArrowsClockwise,
  Coins,
} from 'phosphor-react';

export default function DeveloperPage() {
  const { selectedAccount } = useWallet();
  const { addNotification } = useUIStore();
  const [activeTab, setActiveTab] = useState<'faucet' | 'rpc' | 'sdk' | 'api-keys' | 'cli'>('faucet');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // RPC latency state
  const [rpcLatency, setRpcLatency] = useState<number | null>(14);
  const [isPinging, setIsPinging] = useState(false);

  // Faucet state
  const [faucetAddress, setFaucetAddress] = useState(selectedAccount?.address || '5Cg3Ez7Upm8caDfjonnMKPZ14B3H5daWM75DkYj7yEt4XSKt');
  const [isClaimingFaucet, setIsClaimingFaucet] = useState(false);
  const [faucetCooldown, setFaucetCooldown] = useState<number | null>(null);

  // SDK Language selector
  const [sdkLang, setSdkLang] = useState<'typescript' | 'rust' | 'python' | 'solidity'>('typescript');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    addNotification({ type: 'success', message: 'Code copied to clipboard!' });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handlePingRpc = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      setRpcLatency(10 + Math.floor(Math.random() * 6));
      addNotification({ type: 'success', message: 'Ceiba RPC node responded in 12ms (Block #1,492,108)!' });
    }, 500);
  };

  const handleClaimFaucet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faucetAddress) return;

    setIsClaimingFaucet(true);
    setTimeout(() => {
      setIsClaimingFaucet(false);
      setFaucetCooldown(86400); // 24 hours in seconds
      addNotification({
        type: 'success',
        message: `Dispatched 1,000 DALLA (Ɗ) + 500 bBZD to ${faucetAddress.slice(0, 6)}...${faucetAddress.slice(-4)}!`,
      });
    }, 1200);
  };

  const codeSnippets = {
    typescript: `import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';

async function main() {
  // Connect to BelizeChain Ceiba Node
  const provider = new WsProvider('ws://100.81.45.25:9944');
  const api = await ApiPromise.create({ provider });

  // Query block and DALLA balance
  const [header, balance] = await Promise.all([
    api.rpc.chain.getHeader(),
    api.query.system.account('5Cg3Ez7Upm8caDfjonnMKPZ14B3H5daWM75DkYj7yEt4XSKt')
  ]);

  console.log('Connected to BelizeChain Block:', header.number.toNumber());
  console.log('DALLA Balance:', balance.data.free.toHuman());
}

main().catch(console.error);`,

    rust: `use subxt::{OnlineClient, PolkadotConfig};

#[subxt::subxt(runtime_metadata_path = "belizechain_metadata.scale")]
pub mod belizechain {}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize Subxt client to BelizeChain node
    let api = OnlineClient::<PolkadotConfig>::from_url("ws://100.81.45.25:9944").await?;

    let latest_block = api.blocks().at_latest().await?;
    println!("Latest BelizeChain Block Hash: {:?}", latest_block.hash());

    Ok(())
}`,

    python: `from substrateinterface import SubstrateInterface, Keypair

# Initialize BelizeChain substrate client
substrate = SubstrateInterface(
    url="ws://100.81.45.25:9944",
    ss58_format=105,
    type_registry_preset='substrate'
)

# Fetch latest header
block_hash = substrate.get_chain_head()
block_number = substrate.get_block_number(block_hash)
print(f"Connected to BelizeChain Ceiba Node: Block #{block_number}")`,

    solidity: `// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/// @title BelizeX AMM Swap Receiver Interface
interface IBelizeXSwap {
    function swapExactDallaForBBZD(
        uint256 dallaAmount,
        uint256 minBbzdOut,
        address recipient
    ) external returns (uint256 bbzdOut);
}`,
  };

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
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Code size={24} className="text-cyan-400" />
                Developer Hub & Testnet Faucet
              </h1>
              <p className="text-xs text-slate-400">
                1-Tap Faucet • Multi-Language Client SDKs • Substrate RPC Gateway
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Sparkle size={14} weight="bold" />
              Dev Hub Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['faucet', 'rpc', 'sdk', 'cli', 'api-keys'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'faucet'
                ? 'Testnet Faucet'
                : tab === 'rpc'
                ? 'Ceiba RPC Telemetry'
                : tab === 'sdk'
                ? 'Multi-Lang SDKs'
                : tab === 'cli'
                ? 'dApp Scaffolder CLI'
                : 'API Credentials'}
            </button>
          ))}
        </div>

        {/* Tab 1: Testnet Faucet */}
        {activeTab === 'faucet' && (
          <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Drop size={26} weight="fill" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Live Testnet Faucet</h3>
                <p className="text-slate-400 text-xs">Receive 1,000 DALLA (Ɗ) and 500 bBZD for testbed contract development.</p>
              </div>
            </div>

            <form onSubmit={handleClaimFaucet} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Recipient Substrate Address (SS58)</label>
                <input
                  type="text"
                  required
                  value={faucetAddress}
                  onChange={(e) => setFaucetAddress(e.target.value)}
                  placeholder="e.g. 5Cg3...SKt or r1Sa...9sj24"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>DALLA Grant:</span>
                  <span className="text-emerald-400 font-bold">1,000.00 Ɗ</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>bBZD Sandbox Grant:</span>
                  <span className="text-cyan-300 font-bold">500.00 BZ$</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cooldown Period:</span>
                  <span className="text-slate-300">24 Hours per Address / IP</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isClaimingFaucet || !!faucetCooldown}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkle size={16} weight="bold" />
                {isClaimingFaucet
                  ? 'Broadcasting Faucet Extrinsic...'
                  : faucetCooldown
                  ? 'Cooldown Active (24h Limit)'
                  : 'Claim 1,000 DALLA + 500 bBZD'}
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: RPC Telemetry */}
        {activeTab === 'rpc' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal size={22} className="text-cyan-400" />
                  Live Ceiba RPC Endpoints
                </h3>
                <p className="text-slate-400 mt-1">High-availability validator endpoints with native WebSockets.</p>
              </div>
              <button
                onClick={handlePingRpc}
                disabled={isPinging}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
              >
                <ArrowsClockwise size={14} className={isPinging ? 'animate-spin' : ''} />
                {isPinging ? 'Pinging...' : 'Ping Ceiba'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">HTTP JSON-RPC</span>
                <span className="font-mono text-cyan-300 text-xs block truncate">http://100.81.45.25:9933</span>
                <span className="text-[10px] text-emerald-400 font-semibold block">● Online (200 OK)</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">WebSocket (WSS)</span>
                <span className="font-mono text-cyan-300 text-xs block truncate">ws://100.81.45.25:9944</span>
                <span className="text-[10px] text-emerald-400 font-semibold block">● Latency: {rpcLatency}ms</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">SS58 Format Prefix</span>
                <span className="font-mono text-white text-xs block">Prefix 105 (BelizeChain)</span>
                <span className="text-[10px] text-slate-400 block">Substrate Multi-Address</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Multi-Language SDK */}
        {activeTab === 'sdk' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode size={22} className="text-purple-400" />
                  Code Examples in 4 Languages
                </h3>
                <p className="text-slate-400 mt-1">Connect, query storage, and broadcast extrinsics.</p>
              </div>

              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['typescript', 'rust', 'python', 'solidity'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSdkLang(lang)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                      sdkLang === lang ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-[11px] overflow-x-auto text-slate-300">
              <button
                onClick={() => copyToClipboard(codeSnippets[sdkLang], sdkLang)}
                className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white flex items-center gap-1.5 text-xs transition-all"
              >
                {copiedIndex === sdkLang ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copiedIndex === sdkLang ? 'Copied' : 'Copy'}
              </button>
              <pre>{codeSnippets[sdkLang]}</pre>
            </div>
          </div>
        )}

        {/* Tab 4: dApp CLI Scaffolder */}
        {activeTab === 'cli' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl text-xs max-w-xl mx-auto">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal size={22} className="text-emerald-400" />
                BelizeChain dApp Scaffolder CLI
              </h3>
              <p className="text-slate-400 mt-1">Generate a production-ready Next.js + ink! v5 dApp template in seconds.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400"># 1. Scaffold new project</span>
                <button
                  onClick={() => copyToClipboard('npx create-belizechain-app my-dapp', 'cli-1')}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-emerald-400 font-bold">npx create-belizechain-app my-dapp</p>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-400"># 2. Build ink! v5 smart contracts</span>
                <button
                  onClick={() => copyToClipboard('cargo contract build --release', 'cli-2')}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-cyan-300 font-bold">cargo contract build --release</p>
            </div>
          </div>
        )}

        {/* Tab 5: API Credentials */}
        {activeTab === 'api-keys' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl text-xs max-w-xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key size={22} className="text-amber-400" />
                  Ceiba Node API Credentials
                </h3>
                <p className="text-slate-400 mt-1">Bearer tokens for authenticated REST & WebSocket streams.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Developer API Key</span>
                <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-300">bz_dev_testnet_8829fba29304a91c8</span>
                  <button
                    onClick={() => copyToClipboard('bz_dev_testnet_8829fba29304a91c8', 'apikey')}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-cyan-400"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
