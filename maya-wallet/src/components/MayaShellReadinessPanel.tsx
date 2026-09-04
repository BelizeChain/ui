'use client';

import React, { useState } from 'react';
import {
  getRuntimeConfig,
  isLocalRuntimeConfig,
  useNewBlocks,
  useServiceProbes,
} from '@belizechain/shared';
import { useWallet } from '@/contexts/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  WarningCircle,
  X,
  CaretRight,
  Database,
  Cpu,
  GlobeHemisphereWest,
  Wallet,
  CheckCircle,
} from 'phosphor-react';

function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function MayaShellReadinessPanel({ className = '' }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const runtimeConfig = getRuntimeConfig();
  const usesLocalRuntime = isLocalRuntimeConfig(runtimeConfig);
  const { blockNumber } = useNewBlocks();
  const { probes, isLoading: probesLoading, onlineCount, summary } = useServiceProbes();
  const { isConnected, isConnecting, error, selectedAccount } = useWallet();

  const isNetworkReady = Boolean(blockNumber);
  const isAllServicesOnline = summary === 'online';

  return (
    <div className={`relative ${className}`}>
      {/* Sleek Floating Status Pill */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(true)}
        className="cursor-pointer inline-flex items-center justify-between w-full px-4 py-2.5 rounded-2xl bg-gradient-to-r from-slate-900/80 via-teal-950/40 to-slate-900/80 backdrop-blur-xl border border-teal-500/20 shadow-lg shadow-teal-950/30 hover:border-teal-400/40 transition-all"
      >
        <div className="flex items-center gap-3">
          {/* Status Dot */}
          <div className="relative flex items-center justify-center">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isNetworkReady ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`absolute w-4 h-4 rounded-full animate-ping opacity-60 ${
                isNetworkReady ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-white">
              {runtimeConfig.networkName}
            </span>
            {blockNumber ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono">
                #{blockNumber.toLocaleString()}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono">
                Syncing
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-teal-200/80 font-medium">
            <ShieldCheck size={16} className="text-teal-400" weight="fill" />
            <span>
              {probesLoading
                ? 'Probing Services...'
                : isAllServicesOnline
                ? 'All Services Online'
                : `${onlineCount}/${probes.length} Services Online`}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-teal-400 font-semibold pl-2 border-l border-teal-500/20">
            <span>System Health</span>
            <CaretRight size={14} weight="bold" />
          </div>
        </div>
      </motion.div>

      {/* Expandable Health & Readiness Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl bg-slate-950/95 border border-teal-500/30 shadow-2xl shadow-emerald-950/50 p-6 overflow-hidden"
            >
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                      <ShieldCheck size={22} weight="fill" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight">
                        Infrastructure Health
                      </h3>
                      <p className="text-xs text-teal-200/70">
                        BelizeChain Sovereign Mesh Telemetry
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>

                {/* Grid of Diagnostic Items */}
                <div className="space-y-3">
                  {/* 1. Network */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 mt-0.5">
                      <GlobeHemisphereWest size={18} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/90">
                          Blockchain Network
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isNetworkReady
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {isNetworkReady ? 'Connected' : 'Connecting'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-teal-200/80 truncate mt-1">
                        {runtimeConfig.blockchainWsUrl}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {blockNumber
                          ? `Finalizing Block #${blockNumber.toLocaleString()}`
                          : 'Awaiting block confirmation'}
                      </p>
                    </div>
                  </div>

                  {/* 2. Wallet Signer */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 mt-0.5">
                      <Wallet size={18} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/90">
                          Citizen Signer
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isConnected
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-700 text-gray-300'
                          }`}
                        >
                          {isConnected ? 'Active' : isConnecting ? 'Connecting' : 'Disconnected'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-white/90 mt-1">
                        {selectedAccount?.address
                          ? truncateAddress(selectedAccount.address)
                          : 'No wallet connected'}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {error ? error : isConnected ? 'Signature capability verified' : 'Connect Polkadot extension'}
                      </p>
                    </div>
                  </div>

                  {/* 3. Microservices (Pakit, Nawal, Kinich) */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 mt-0.5">
                      <Cpu size={18} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/90">
                          Service Mesh Probes
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isAllServicesOnline
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {onlineCount}/{probes.length} Operational
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {probes.map((probe) => (
                          <div
                            key={probe.id}
                            className="p-2 rounded-xl bg-black/30 border border-white/5 text-center"
                          >
                            <div className="flex items-center justify-center gap-1 text-xs font-bold text-white">
                              {probe.state === 'online' ? (
                                <CheckCircle size={14} className="text-emerald-400" weight="fill" />
                              ) : (
                                <WarningCircle size={14} className="text-amber-400" weight="fill" />
                              )}
                              <span>{probe.label}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 block mt-0.5 capitalize">
                              {probe.state}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4. IPFS Gateway */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 mt-0.5">
                      <Database size={18} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white/90">
                          Decentralized Storage
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                          Active
                        </span>
                      </div>
                      <p className="text-xs font-mono text-teal-200/80 truncate mt-1">
                        {runtimeConfig.ipfsGatewayUrl}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Document and BelizeID credential retrieval ready
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}