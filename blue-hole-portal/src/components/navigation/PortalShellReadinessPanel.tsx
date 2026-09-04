'use client';

import React, { useState } from 'react';
import {
  getRuntimeConfig,
  isLocalRuntimeConfig,
  useServiceProbes,
} from '@belizechain/shared';
import { useWalletStore } from '@/store/wallet';
import { useBlockchain } from '@/lib/blockchain/hooks';
import { useSystem } from '@/hooks/useSystem';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  CheckCircle,
  WarningCircle,
  HardDrives,
  Wallet,
  GlobeHemisphereWest,
  X,
  CaretRight,
  ArrowsClockwise,
  ShieldCheck,
} from 'phosphor-react';

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function PortalShellReadinessPanel({ className = '' }: { className?: string }) {
  const [showModal, setShowModal] = useState(false);
  const runtimeConfig = getRuntimeConfig();
  const usesLocalRuntime = isLocalRuntimeConfig(runtimeConfig);
  const { probes, isLoading: probesLoading, onlineCount, summary } = useServiceProbes();
  const { status, error, reconnect } = useBlockchain();
  const { systemInfo } = useSystem();
  const { selectedAccount, isConnecting, error: walletError, connectWallet } = useWalletStore();

  const isNetworkOk = status === 'ready' || status === 'connected';
  const isWalletOk = !!selectedAccount;
  const isOpsOk = summary === 'online';
  const allSystemsNominal = isNetworkOk && isOpsOk;

  return (
    <>
      {/* High-Tech Sovereign Ribbon */}
      <div className={`relative ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-teal-500/25 shadow-lg shadow-teal-950/30">
          {/* Status Badge & Title */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2.5 group text-left transition-opacity hover:opacity-90"
          >
            <div className="relative flex items-center justify-center">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  allSystemsNominal ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`absolute w-4 h-4 rounded-full animate-ping opacity-40 ${
                  allSystemsNominal ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-teal-400 block">
                Sovereign Telemetry
              </span>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-teal-200 transition-colors flex items-center gap-1">
                {allSystemsNominal ? 'All Government Nodes Nominal' : 'Telemetry Inspection Required'}
                <CaretRight size={12} className="text-teal-400 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </button>

          {/* Micro Telemetry Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5">
            {/* 1. Consensus Pill */}
            <div
              onClick={() => setShowModal(true)}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 text-xs transition-colors"
            >
              <GlobeHemisphereWest size={15} className={isNetworkOk ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="text-slate-400 font-medium hidden sm:inline">Consensus:</span>
              <span className="text-white font-bold font-mono">
                {systemInfo?.blockNumber ? `#${systemInfo.blockNumber.toLocaleString()}` : 'Connecting'}
              </span>
            </div>

            {/* 2. Authority Pill */}
            <div
              onClick={() => {
                if (!selectedAccount) {
                  connectWallet();
                } else {
                  setShowModal(true);
                }
              }}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 text-xs transition-colors"
            >
              <Wallet size={15} className={isWalletOk ? 'text-teal-300' : 'text-slate-400'} />
              <span className="text-slate-400 font-medium hidden sm:inline">Authority:</span>
              <span className="text-white font-bold font-mono">
                {selectedAccount ? selectedAccount.meta.name || truncateAddress(selectedAccount.address) : 'Connect Wallet'}
              </span>
            </div>

            {/* 3. Services Status Pill */}
            <div
              onClick={() => setShowModal(true)}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 text-xs transition-colors"
            >
              <Activity size={15} className={isOpsOk ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="text-slate-400 font-medium hidden sm:inline">Ops APIs:</span>
              <span className="text-white font-bold font-mono">
                {probesLoading ? 'Probing...' : `${onlineCount}/${probes.length} Online`}
              </span>
            </div>

            {/* 4. IPFS Gateway */}
            <div
              onClick={() => setShowModal(true)}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 text-xs transition-colors"
            >
              <HardDrives size={15} className="text-cyan-400" />
              <span className="text-slate-400 font-medium hidden md:inline">Storage:</span>
              <span className="text-white font-bold font-mono">
                {usesLocalRuntime ? 'Local' : 'Ceiba IPFS'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Telemetry Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-teal-500/30 rounded-3xl p-6 shadow-2xl shadow-teal-950/60 overflow-hidden text-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-300">
                    <ShieldCheck size={26} weight="duotone" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Sovereign Command Center Telemetry</h3>
                    <p className="text-xs text-slate-400">Real-time health verification across BelizeChain infrastructure</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                {/* Consensus Network */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GlobeHemisphereWest size={18} className="text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Consensus</span>
                    </div>
                    {isNetworkOk ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle size={14} weight="fill" /> Online
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <WarningCircle size={14} weight="fill" /> Syncing
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white mb-1">
                    {systemInfo?.chainName || runtimeConfig.networkName}
                  </p>
                  <p className="text-xs text-slate-400 font-mono break-all mb-2">
                    {runtimeConfig.blockchainWsUrl}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                    <span>Block Height:</span>
                    <span className="font-bold text-white font-mono">
                      #{systemInfo?.blockNumber.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                    <span>Active Peers:</span>
                    <span className="font-bold text-white font-mono">{systemInfo?.peersCount || 0} nodes</span>
                  </div>
                </div>

                {/* Operator Wallet */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wallet size={18} className="text-teal-300" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Authority Wallet</span>
                    </div>
                    {isWalletOk ? (
                      <span className="text-xs font-bold text-teal-300 flex items-center gap-1">
                        <CheckCircle size={14} weight="fill" /> Connected
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">Disconnected</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white mb-1">
                    {selectedAccount?.meta.name || 'No Extension Account'}
                  </p>
                  <p className="text-xs text-slate-400 font-mono break-all mb-2">
                    {selectedAccount?.address || 'Connect Polkadot{.js} or Talisman to sign transactions'}
                  </p>
                  {!selectedAccount && (
                    <button
                      onClick={connectWallet}
                      disabled={isConnecting}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-bold text-teal-300 transition-colors"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect Government Wallet'}
                    </button>
                  )}
                </div>

                {/* Microservice Probes */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity size={18} className="text-purple-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">National Ops APIs</span>
                    </div>
                    <span className="text-xs font-bold text-teal-300 font-mono">
                      {onlineCount}/{probes.length} Healthy
                    </span>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {probes.map((probe) => (
                      <div key={probe.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/5">
                        <span className="text-slate-300 font-medium">{probe.label}</span>
                        <span
                          className={`font-mono font-bold ${
                            probe.state === 'online'
                              ? 'text-emerald-400'
                              : probe.state === 'checking'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {probe.state}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storage & Gateway */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrives size={18} className="text-cyan-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">IPFS Depository</span>
                    </div>
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                      <CheckCircle size={14} weight="fill" /> Ready
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white mb-1">Pakit Sovereign IPFS Gateway</p>
                  <p className="text-xs text-slate-400 font-mono break-all mb-2">
                    {runtimeConfig.ipfsGatewayUrl}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-white/5">
                    Land titles, civic evidence, court filings, and biometric proofs are cryptographically pinned on BelizeChain IPFS clusters.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    reconnect();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-teal-300 transition-colors"
                >
                  <ArrowsClockwise size={15} />
                  <span>Reconnect Telemetry</span>
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}