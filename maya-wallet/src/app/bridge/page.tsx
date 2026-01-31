'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowsLeftRight, Info } from 'phosphor-react';

export default function BridgePage() {
  const router = useRouter();
  const [fromChain, setFromChain] = useState('BelizeChain');
  const [toChain, setToChain] = useState('Ethereum');
  const [amount, setAmount] = useState('');

  const chains = ['BelizeChain', 'Ethereum', 'Polkadot', 'Binance Smart Chain'];

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
              <h1 className="text-xl font-bold text-white">Cross-Chain Bridge</h1>
              <p className="text-xs text-gray-400">Transfer assets between blockchains</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-purple-500/30">
              <div className="flex items-center space-x-1">
                <Info size={14} weight="fill" className="text-purple-400" />
                <span className="text-xs text-purple-400 font-semibold">Bridge</span>
              </div>
            </div>
            <ArrowsLeftRight size={32} className="text-purple-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        {/* Bridge Form */}
        <div className="bg-gray-800 rounded-2xl shadow-md p-6 space-y-6">
          {/* From Chain */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">From Chain</label>
            <select
              value={fromChain}
              onChange={(e) => setFromChain(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-caribbean-500 font-semibold"
            >
              {chains.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Swap Chains Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                const temp = fromChain;
                setFromChain(toChain);
                setToChain(temp);
              }}
              className="p-3 bg-caribbean-50 text-caribbean-400 rounded-xl hover:bg-caribbean-100 transition-colors"
            >
              <ArrowsLeftRight size={24} weight="bold" />
            </button>
          </div>

          {/* To Chain */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">To Chain</label>
            <select
              value={toChain}
              onChange={(e) => setToChain(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-caribbean-500 font-semibold"
            >
              {chains.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-caribbean-500 text-lg font-semibold"
            />
          </div>

          {/* Bridge Button */}
          <button
            disabled={!amount || parseFloat(amount) <= 0 || fromChain === toChain}
            className="w-full py-4 bg-gradient-to-r from-caribbean-600 to-caribbean-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Initiate Bridge Transfer
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-blue-500/10 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info size={24} className="text-blue-600 flex-shrink-0" weight="fill" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Cross-chain transfers require:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Bridge fees (0.1% of transfer amount)</li>
              <li>Gas fees on destination chain</li>
              <li>10-30 minute confirmation time</li>
            </ul>
          </div>
        </div>

        {/* Supported Chains */}
        <div className="bg-gray-800 rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-white mb-3">Supported Blockchains</h3>
          <div className="grid grid-cols-2 gap-2">
            {chains.map(chain => (
              <div key={chain} className="p-3 bg-gray-50 rounded-lg text-center text-sm font-medium text-gray-300">
                {chain}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
