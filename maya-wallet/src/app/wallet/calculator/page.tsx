'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calculator as CalcIcon, ArrowsDownUp } from 'phosphor-react';
import { convertCurrency, formatCurrency } from '@/services/currency';

export default function CalculatorPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('DALLA');
  const [toCurrency, setToCurrency] = useState('bBZD');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currencies = ['DALLA', 'bBZD', 'USD', 'BZD'];

  const handleConvert = async () => {
    const value = parseFloat(amount);
    if (!isNaN(value) && value > 0) {
      setLoading(true);
      try {
        const converted = await convertCurrency(value, fromCurrency, toCurrency);
        setResult(converted.toAmount);
      } catch (error) {
        console.error('Conversion failed:', error);
        setResult('0.00');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    if (result) {
      setAmount(result.toString());
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-caribbean-50 to-blue-50 pb-20">
      <div className="bg-gradient-to-r from-caribbean-600 to-caribbean-500 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-700/20 rounded-lg transition-colors">
            <ArrowLeft size={24} weight="bold" />
          </button>
          <h1 className="text-2xl font-bold">Currency Calculator</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Calculator Card */}
        <div className="bg-gray-800 rounded-2xl shadow-md p-6 space-y-6">
          {/* From Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">From</label>
            <div className="flex gap-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-caribbean-500 text-lg font-semibold"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-caribbean-500 font-semibold"
              >
                {currencies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwap}
              className="p-3 bg-caribbean-50 text-caribbean-400 rounded-xl hover:bg-caribbean-100 transition-colors"
            >
              <ArrowsDownUp size={24} weight="bold" />
            </button>
          </div>

          {/* To Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">To</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={result !== null ? result : ''}
                readOnly
                placeholder="0.00"
                className="flex-1 px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl text-lg font-semibold text-white"
              />
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-caribbean-500 font-semibold"
              >
                {currencies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={!amount || parseFloat(amount) <= 0 || loading}
            className="w-full py-4 bg-gradient-to-r from-caribbean-600 to-caribbean-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CalcIcon size={24} weight="bold" />
            {loading ? 'Converting...' : 'Convert'}
          </button>
        </div>

        {/* Exchange Rates */}
        <div className="bg-blue-500/10 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Current Exchange Rates</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-blue-800">
              <span>1 DALLA</span>
              <span className="font-semibold">= 0.5 bBZD</span>
            </div>
            <div className="flex justify-between text-blue-800">
              <span>1 bBZD</span>
              <span className="font-semibold">≈ 1.0 BZD</span>
            </div>
            <div className="flex justify-between text-blue-800">
              <span>1 bBZD</span>
              <span className="font-semibold">≈ 1.27 USD</span>
            </div>
          </div>
          <p className="text-blue-600 text-xs mt-3">Rates updated via Oracle pallet</p>
        </div>
      </div>
    </div>
  );
}
