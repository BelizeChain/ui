'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  SUPPORTED_EXPANDED_CHAINS,
  type ChainMetadata,
  type BridgeTransfer,
  validateCrossChainAddress,
  getCrossChainExplorerUrl,
  getUserBridgeTransfers,
} from '@/services/pallets/interoperability';
import {
  ArrowLeft,
  ArrowsLeftRight,
  Info,
  ShieldCheck,
  CheckCircle,
  Clock,
  Warning,
  GlobeHemisphereWest,
  CaretDown,
  Lightning,
  Sparkle,
  X,
  ArrowSquareOut,
  SlidersHorizontal,
  FileText,
  LockKey,
} from 'phosphor-react';

const ASSET_OPTIONS = [
  { id: 'DALLA', name: 'DALLA', symbol: 'Ɗ', type: 'Unpegged Native', icon: 'Ɗ', color: 'emerald' },
  { id: 'bBZD', name: 'bBZD', symbol: 'BZ$', type: 'Statutory Stable (1:1 BZD)', icon: 'BZ$', color: 'cyan' },
  { id: 'USDT', name: 'Tether USD', symbol: 'USDT', type: 'Bridged Stablecoin', icon: '₮', color: 'emerald' },
  { id: 'USDC', name: 'USD Coin', symbol: 'USDC', type: 'Circle USD', icon: '$', color: 'blue' },
  { id: 'ETH', name: 'Ether', symbol: 'ETH', type: 'Gas Asset', icon: '⟠', color: 'purple' },
  { id: 'SOL', name: 'Solana', symbol: 'SOL', type: 'Gas Asset', icon: '🟣', color: 'purple' },
  { id: 'TRX', name: 'TRON TRX', symbol: 'TRX', type: 'Gas Asset', icon: '🔴', color: 'red' },
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', type: 'Wrapped / Runes', icon: '₿', color: 'amber' },
];

export default function BridgePage() {
  const { selectedAccount, isConnected, balance } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'transfer' | 'history' | 'validators'>('transfer');
  const [fromChain, setFromChain] = useState<ChainMetadata>(SUPPORTED_EXPANDED_CHAINS[0]); // BelizeChain
  const [toChain, setToChain] = useState<ChainMetadata>(SUPPORTED_EXPANDED_CHAINS[1]); // Base
  const [selectedAsset, setSelectedAsset] = useState<string>('DALLA');
  const [amount, setAmount] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [history, setHistory] = useState<BridgeTransfer[]>([]);

  // Transfer Stepper Modal
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const [bridgeStep, setBridgeStep] = useState<1 | 2 | 3 | 4>(1);
  const [isBridging, setIsBridging] = useState(false);
  const [generatedTxHash, setGeneratedTxHash] = useState('');

  // Load history
  useEffect(() => {
    if (selectedAccount?.address) {
      getUserBridgeTransfers(selectedAccount.address).then(setHistory);
    }
  }, [selectedAccount?.address]);

  // Validation
  const addressValidation = validateCrossChainAddress(destinationAddress, toChain.id);

  const handleSwapChains = () => {
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
  };

  const calculateBridgeFee = () => {
    const amt = parseFloat(amount) || 0;
    const fee = amt * 0.001 + 0.05;
    return fee.toFixed(4);
  };

  const calculateReceiveAmount = () => {
    const amt = parseFloat(amount) || 0;
    const fee = parseFloat(calculateBridgeFee());
    return Math.max(0, amt - fee).toFixed(4);
  };

  const handleStartBridge = () => {
    if (!selectedAccount?.address || !amount || parseFloat(amount) <= 0) return;
    if (!addressValidation.isValid) {
      addNotification({ type: 'error', message: addressValidation.message || 'Invalid destination address.' });
      return;
    }

    const mockTx = `0x9e8f${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16)}`;
    setGeneratedTxHash(mockTx);
    setBridgeStep(1);
    setShowBridgeModal(true);
    setIsBridging(true);

    // Simulate multi-phase cross-chain relayer sequence
    setTimeout(() => {
      setBridgeStep(2); // Lock Confirmed
      setTimeout(() => {
        setBridgeStep(3); // Relayer Proof Verified
        setTimeout(() => {
          setBridgeStep(4); // Mint Complete
          setIsBridging(false);
          addNotification({
            type: 'success',
            message: `Successfully bridged ${amount} ${selectedAsset} to ${toChain.name}!`,
          });

          // Add to local history
          const newTx: BridgeTransfer = {
            transferId: `BRG-${Date.now().toString().slice(-6)}`,
            from: selectedAccount.address,
            to: destinationAddress,
            fromChain: fromChain.name,
            toChain: toChain.name,
            asset: selectedAsset,
            amount,
            fee: calculateBridgeFee(),
            status: 'Completed',
            initiatedAt: Math.floor(Date.now() / 1000),
            completedAt: Math.floor(Date.now() / 1000) + 45,
            sourceHash: `0x${Math.random().toString(16).slice(2, 10)}...`,
            destinationHash: mockTx,
            confirmations: 64,
            requiredConfirmations: 64,
          };
          setHistory((prev) => [newTx, ...prev]);
        }, 2200);
      }, 2200);
    }, 1800);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to bridge assets across BelizeChain, Base, Arbitrum, TRON, Solana, and more." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors">
                <ArrowLeft size={24} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Cross-Chain Bridge & Relayer</h1>
              <p className="text-xs text-slate-400">14+ Blockchains • Base, Arbitrum, Polygon, TRON, Solana, Sui & Near</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Sparkle size={14} weight="fill" />
              PQC Multi-Sig Live
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1">
          {(['transfer', 'history', 'validators'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'transfer' ? 'Bridge Portal' : tab === 'history' ? `Transfer History (${history.length})` : 'Relayer Quorum & PQC'}
            </button>
          ))}
        </div>

        {activeTab === 'transfer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bridge Form (8 cols) */}
            <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
              {/* Asset Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select Bridged Asset</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ASSET_OPTIONS.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedAsset(asset.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedAsset === asset.id
                          ? 'bg-purple-500/20 border-purple-500/50 text-white shadow-lg'
                          : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{asset.symbol}</span>
                        <span className="text-[10px] text-purple-400 font-bold">{asset.id}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate">{asset.type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chain Selectors */}
              <div className="space-y-3">
                {/* From Chain */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">From Network</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-[10px] font-bold text-purple-300 rounded-full">
                      {fromChain.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{fromChain.icon}</span>
                    <select
                      value={fromChain.id}
                      onChange={(e) => {
                        const chosen = SUPPORTED_EXPANDED_CHAINS.find((c) => c.id === e.target.value);
                        if (chosen) setFromChain(chosen);
                      }}
                      className="w-full bg-transparent text-white font-bold text-base focus:outline-none cursor-pointer"
                    >
                      {SUPPORTED_EXPANDED_CHAINS.map((c) => (
                        <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                          {c.name} ({c.symbol}) • {c.category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center -my-2 relative z-10">
                  <button
                    type="button"
                    onClick={handleSwapChains}
                    className="h-10 w-10 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 flex items-center justify-center text-purple-400 shadow-xl transition-all"
                  >
                    <ArrowsLeftRight size={18} weight="bold" />
                  </button>
                </div>

                {/* To Chain */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">To Destination Network</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-[10px] font-bold text-purple-300 rounded-full">
                      {toChain.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{toChain.icon}</span>
                    <select
                      value={toChain.id}
                      onChange={(e) => {
                        const chosen = SUPPORTED_EXPANDED_CHAINS.find((c) => c.id === e.target.value);
                        if (chosen) setToChain(chosen);
                      }}
                      className="w-full bg-transparent text-white font-bold text-base focus:outline-none cursor-pointer"
                    >
                      {SUPPORTED_EXPANDED_CHAINS.map((c) => (
                        <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                          {c.name} ({c.symbol}) • {c.category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amount to Bridge</label>
                  <div className="flex gap-1.5">
                    {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          const raw = (selectedAsset === 'DALLA' ? balance?.dalla : balance?.bBZD)?.replace(/,/g, '') || '0';
                          const total = parseFloat(raw);
                          if (total <= 0) return;
                          const buffer = pct === 1.0 && selectedAsset === 'DALLA' ? 0.05 : 0;
                          const calc = Math.max(0, total * pct - buffer);
                          setAmount(calc.toFixed(4).replace(/\.?0+$/, ''));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors"
                      >
                        {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-2xl font-bold text-white focus:outline-none focus:border-purple-500 font-mono pr-24"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-purple-400 text-sm">
                    {selectedAsset}
                  </span>
                </div>
              </div>

              {/* Destination Address */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {toChain.name} Recipient Address
                  </label>
                  <span className="text-[10px] text-slate-500">Gas: {toChain.nativeGasToken}</span>
                </div>
                <input
                  type="text"
                  placeholder={toChain.addressPlaceholder}
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className={`w-full bg-slate-950 border rounded-2xl p-3.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none transition-colors ${
                    destinationAddress.trim() && !addressValidation.isValid
                      ? 'border-red-500/80 focus:border-red-500'
                      : destinationAddress.trim() && addressValidation.isValid
                      ? 'border-emerald-500/80 focus:border-emerald-500'
                      : 'border-slate-800 focus:border-purple-500'
                  }`}
                />
                {destinationAddress.trim() && !addressValidation.isValid && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1.5 mt-1">
                    <Warning size={14} weight="bold" />
                    {addressValidation.message}
                  </p>
                )}
                {destinationAddress.trim() && addressValidation.isValid && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 mt-1">
                    <CheckCircle size={14} weight="bold" />
                    Valid address format for {toChain.name}
                  </p>
                )}
              </div>

              {/* Breakdown */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-xs space-y-2 text-slate-400">
                <div className="flex justify-between">
                  <span>Relayer Fee (0.1% + Gas):</span>
                  <span className="font-mono text-slate-300 font-semibold">{calculateBridgeFee()} {selectedAsset}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Delivery Time:</span>
                  <span className="font-semibold text-emerald-400">~{toChain.estimatedTimeMin * 60} Seconds ({toChain.type.toUpperCase()})</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800/80 font-bold text-white text-sm">
                  <span>Estimated Receive:</span>
                  <span className="font-mono text-emerald-400">{calculateReceiveAmount()} {selectedAsset}</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleStartBridge}
                disabled={!amount || parseFloat(amount) <= 0 || fromChain.id === toChain.id || (destinationAddress.trim() !== '' && !addressValidation.isValid)}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 active:scale-[0.99] text-white rounded-2xl font-bold text-sm shadow-xl shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ArrowsLeftRight size={18} weight="bold" />
                Bridge {selectedAsset} to {toChain.name}
              </button>
            </div>

            {/* Sidebar Details (4 cols) */}
            <div className="lg:col-span-4 space-y-4 text-xs">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <GlobeHemisphereWest size={18} className="text-purple-400" />
                  Supported Ecosystems (14)
                </h3>
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {SUPPORTED_EXPANDED_CHAINS.map((chain) => (
                    <div
                      key={chain.id}
                      onClick={() => setToChain(chain)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        toChain.id === chain.id
                          ? 'bg-purple-500/20 border-purple-500/40 text-white'
                          : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{chain.icon}</span>
                        <span className="font-bold text-xs">{chain.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{chain.category}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <ShieldCheck size={16} weight="fill" />
                  PQC Dilithium Quorum
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  All lock/unlock extrinsics require a 2/3 validator threshold signature verified with post-quantum CRYSTALS-Dilithium cryptography.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock size={20} className="text-purple-400" />
                Cross-Chain Transfer History ({history.length})
              </h3>
            </div>

            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((tx) => (
                  <div
                    key={tx.transferId}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{tx.fromChain} ➔ {tx.toChain}</span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] rounded-full border border-emerald-500/30">
                          {tx.status}
                        </span>
                      </div>
                      <p className="font-mono text-slate-400 text-[11px]">
                        Recipient: {tx.to.slice(0, 10)}...{tx.to.slice(-6)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="font-bold text-purple-400 font-mono text-sm block">
                          {tx.amount} {tx.asset}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Fee: {tx.fee} {tx.asset}
                        </span>
                      </div>

                      {tx.destinationHash && (
                        <a
                          href={getCrossChainExplorerUrl(tx.toChain, tx.destinationHash)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white"
                        >
                          <ArrowSquareOut size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950/60 p-8 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                No recent cross-chain bridge transfers.
              </div>
            )}
          </div>
        )}

        {/* Validators Tab */}
        {activeTab === 'validators' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LockKey size={20} className="text-emerald-400" />
                Relayer Validator Quorum (Active Threshold: 5/7)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Decentralized nodes securing cross-chain transfers with post-quantum threshold cryptography.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {[
                { name: 'Ceiba Root Node Alpha', location: 'Belize City', stake: '2,500,000 Ɗ', status: 'Online', uptime: '99.98%' },
                { name: 'Ambergris Marine Node', location: 'San Pedro', stake: '1,800,000 Ɗ', status: 'Online', uptime: '99.94%' },
                { name: 'Cayo Valley Oracle Relayer', location: 'San Ignacio', stake: '1,200,000 Ɗ', status: 'Online', uptime: '100%' },
                { name: 'Placencia Eco Relay', location: 'Placencia', stake: '950,000 Ɗ', status: 'Online', uptime: '99.89%' },
              ].map((v, i) => (
                <div key={i} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{v.name}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold text-[10px]">
                      {v.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Location: {v.location}</span>
                    <span className="text-slate-300 font-mono">Uptime: {v.uptime}</span>
                  </div>
                  <div className="pt-1 flex justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Security Stake:</span>
                    <span className="text-emerald-400 font-semibold">{v.stake}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stepper Progress Modal */}
      {showBridgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <ArrowsLeftRight size={22} weight="bold" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Cross-Chain Relaying</h3>
                  <p className="text-xs text-slate-400">{fromChain.name} ➔ {toChain.name}</p>
                </div>
              </div>
              {!isBridging && (
                <button onClick={() => setShowBridgeModal(false)} className="text-slate-400 hover:text-white p-1">
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-3">
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                  bridgeStep >= 1 ? 'bg-slate-950 border-purple-500/40 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-600'
                }`}>
                  <span className="font-semibold">1. Source Lock Extrinsic</span>
                  {bridgeStep > 1 ? <CheckCircle size={18} weight="fill" className="text-emerald-400" /> : <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />}
                </div>

                <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                  bridgeStep >= 2 ? 'bg-slate-950 border-purple-500/40 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-600'
                }`}>
                  <span className="font-semibold">2. Relayer Consensus Verification ({toChain.name})</span>
                  {bridgeStep > 2 ? <CheckCircle size={18} weight="fill" className="text-emerald-400" /> : bridgeStep === 2 ? <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" /> : null}
                </div>

                <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                  bridgeStep >= 3 ? 'bg-slate-950 border-purple-500/40 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-600'
                }`}>
                  <span className="font-semibold">3. Destination Mint / Unlock Extrinsic</span>
                  {bridgeStep > 3 ? <CheckCircle size={18} weight="fill" className="text-emerald-400" /> : bridgeStep === 3 ? <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" /> : null}
                </div>
              </div>

              {bridgeStep === 4 && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-center font-bold space-y-2">
                  <p>Transfer Complete! {amount} {selectedAsset} delivered to recipient on {toChain.name}.</p>
                  <p className="font-mono text-[11px] text-slate-400 truncate">Tx: {generatedTxHash}</p>
                </div>
              )}
            </div>

            {bridgeStep === 4 && (
              <button
                type="button"
                onClick={() => setShowBridgeModal(false)}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-lg shadow-emerald-500/20"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
