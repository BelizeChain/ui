'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  Buildings,
  Scroll,
  Coins,
  ShieldCheck,
  TrendUp,
  ArrowLeft,
  Sparkle,
  CheckCircle,
  CurrencyDollar,
  MapPin,
  FileText,
  Clock,
  ArrowsClockwise,
  ChartLineUp,
  GlobeHemisphereWest,
  Plus,
  TreeEvergreen,
  Lightning,
  Drop,
  X,
} from 'phosphor-react';

interface RwaAsset {
  id: string;
  title: string;
  category: 'real-estate' | 'green-bond' | 'infrastructure' | 'agriculture';
  location: string;
  cadastralParcelId?: string;
  totalValuation: string;
  tokenSymbol: string;
  tokenPrice: string;
  annualYieldApy: string;
  fundedPercentage: number;
  availableTokens: number;
  totalTokens: number;
  issuer: string;
  maturityDate?: string;
  payoutSchedule: string;
  verifiedFsc: boolean;
  userTokens?: number;
  accruedYield?: string;
}

const INITIAL_RWA_ASSETS: RwaAsset[] = [
  {
    id: 'rwa-1',
    title: 'Ambergris Caye Luxury Eco-Resort & Villas',
    category: 'real-estate',
    location: 'San Pedro, Ambergris Caye, Belize District',
    cadastralParcelId: 'BZ-AMB-2026-8942',
    totalValuation: '4,500,000 BZ$',
    tokenSymbol: 'SPVILLA',
    tokenPrice: '45.00 BZ$',
    annualYieldApy: '11.8%',
    fundedPercentage: 84,
    availableTokens: 16000,
    totalTokens: 100000,
    issuer: 'Ambergris Hospitality Trust (FSC Reg. #8892)',
    payoutSchedule: 'Monthly in bBZD',
    verifiedFsc: true,
    userTokens: 120,
    accruedYield: '142.50 BZ$',
  },
  {
    id: 'rwa-2',
    title: 'Belmopan Sovereign Solar Microgrid Bond (Series A)',
    category: 'green-bond',
    location: 'Belmopan City, Cayo District',
    totalValuation: '10,000,000 BZ$',
    tokenSymbol: 'BZSOLAR',
    tokenPrice: '100.00 BZ$',
    annualYieldApy: '8.75%',
    fundedPercentage: 92,
    availableTokens: 8000,
    totalTokens: 100000,
    issuer: 'Belmopan Municipal Council & BEL',
    maturityDate: 'Oct 2031 (5-Year Term)',
    payoutSchedule: 'Quarterly in bBZD',
    verifiedFsc: true,
    userTokens: 50,
    accruedYield: '109.38 BZ$',
  },
  {
    id: 'rwa-3',
    title: 'Placencia Peninsula Deepwater Marina',
    category: 'infrastructure',
    location: 'Placencia Village, Stann Creek District',
    cadastralParcelId: 'BZ-PLA-2026-3319',
    totalValuation: '6,200,000 BZ$',
    tokenSymbol: 'PLMARINA',
    tokenPrice: '62.00 BZ$',
    annualYieldApy: '9.4%',
    fundedPercentage: 76,
    availableTokens: 24000,
    totalTokens: 100000,
    issuer: 'Belize Port Authority & Placencia Dev Corp',
    payoutSchedule: 'Quarterly in bBZD',
    verifiedFsc: true,
    userTokens: 0,
    accruedYield: '0.00 BZ$',
  },
  {
    id: 'rwa-4',
    title: 'Cayo Regenerative Cacao & Mahogany Agroforestry',
    category: 'agriculture',
    location: 'San Ignacio & Mountain Pine Ridge, Cayo District',
    cadastralParcelId: 'BZ-CAY-2026-1108',
    totalValuation: '2,800,000 BZ$',
    tokenSymbol: 'CAYOCACAO',
    tokenPrice: '28.00 BZ$',
    annualYieldApy: '13.2%',
    fundedPercentage: 65,
    availableTokens: 35000,
    totalTokens: 100000,
    issuer: 'Belize Agroforestry Guild & Blue Carbon Facility',
    payoutSchedule: 'Biannual in bBZD + DALLA',
    verifiedFsc: true,
    userTokens: 250,
    accruedYield: '215.00 BZ$',
  },
  {
    id: 'rwa-5',
    title: 'Barrier Reef Marine Sanctuary Conservation Note',
    category: 'green-bond',
    location: 'Glover’s Reef & South Water Caye',
    totalValuation: '3,000,000 BZ$',
    tokenSymbol: 'REEFNOTE',
    tokenPrice: '50.00 BZ$',
    annualYieldApy: '7.5%',
    fundedPercentage: 98,
    availableTokens: 1200,
    totalTokens: 60000,
    issuer: 'Coastal Zone Management Authority & Blue Economy Ministry',
    maturityDate: 'Dec 2029 (3-Year Term)',
    payoutSchedule: 'Quarterly in bBZD + Carbon Credits',
    verifiedFsc: true,
    userTokens: 80,
    accruedYield: '75.00 BZ$',
  },
];

export default function RwaPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [assets, setAssets] = useState<RwaAsset[]>(INITIAL_RWA_ASSETS);
  const [activeCategory, setActiveCategory] = useState<'all' | 'real-estate' | 'green-bond' | 'infrastructure' | 'agriculture'>('all');
  const [selectedAsset, setSelectedAsset] = useState<RwaAsset | null>(null);
  const [modalMode, setModalMode] = useState<'invest' | 'tokenize' | null>(null);

  // Investment Modal State
  const [investTokenCount, setInvestTokenCount] = useState('10');
  const [isSubmittingInvest, setIsSubmittingInvest] = useState(false);

  // Tokenize Property Modal State
  const [newPropTitle, setNewPropTitle] = useState('');
  const [newPropParcel, setNewPropParcel] = useState('');
  const [newPropValuation, setNewPropValuation] = useState('');
  const [newPropYield, setNewPropYield] = useState('10.5%');
  const [isSubmittingTokenize, setIsSubmittingTokenize] = useState(false);

  // Filtered Assets
  const filteredAssets = assets.filter((a) => (activeCategory === 'all' ? true : a.category === activeCategory));

  // Portfolio Totals
  const totalInvestedValue = assets.reduce((sum, a) => {
    const price = parseFloat(a.tokenPrice.replace(' BZ$', ''));
    return sum + (a.userTokens || 0) * price;
  }, 0);

  const totalAccruedYield = assets.reduce((sum, a) => {
    const accrued = parseFloat((a.accruedYield || '0').replace(' BZ$', ''));
    return sum + accrued;
  }, 0);

  const handleInvestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    const count = parseInt(investTokenCount, 10);
    if (isNaN(count) || count <= 0) return;

    setIsSubmittingInvest(true);
    setTimeout(() => {
      setIsSubmittingInvest(false);
      setAssets((prev) =>
        prev.map((item) =>
          item.id === selectedAsset.id
            ? {
                ...item,
                userTokens: (item.userTokens || 0) + count,
                availableTokens: Math.max(0, item.availableTokens - count),
              }
            : item
        )
      );

      const price = parseFloat(selectedAsset.tokenPrice.replace(' BZ$', ''));
      addNotification({
        type: 'success',
        message: `Successfully acquired ${count} ${selectedAsset.tokenSymbol} tokens for ${(count * price).toFixed(2)} bBZD!`,
      });
      setModalMode(null);
    }, 1200);
  };

  const handleClaimAllYield = () => {
    if (totalAccruedYield <= 0) return;

    setAssets((prev) =>
      prev.map((item) => ({
        ...item,
        accruedYield: '0.00 BZ$',
      }))
    );

    addNotification({
      type: 'success',
      message: `Dispatched ${totalAccruedYield.toFixed(2)} bBZD in RWA dividends directly to your Maya Wallet!`,
    });
  };

  const handleTokenizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropTitle || !newPropValuation) return;

    setIsSubmittingTokenize(true);
    setTimeout(() => {
      setIsSubmittingTokenize(false);
      const newAsset: RwaAsset = {
        id: `rwa-${Date.now()}`,
        title: newPropTitle,
        category: 'real-estate',
        location: 'Belize Cadastral Registry Plot',
        cadastralParcelId: newPropParcel || 'BZ-CAD-2026-9901',
        totalValuation: `${parseFloat(newPropValuation).toLocaleString()} BZ$`,
        tokenSymbol: newPropTitle.slice(0, 4).toUpperCase() + 'PROP',
        tokenPrice: '50.00 BZ$',
        annualYieldApy: newPropYield,
        fundedPercentage: 10,
        availableTokens: 9000,
        totalTokens: 10000,
        issuer: `${selectedAccount?.name || 'Verified Citizen'} (Deed Sealed)`,
        payoutSchedule: 'Monthly in bBZD',
        verifiedFsc: true,
        userTokens: 1000,
        accruedYield: '0.00 BZ$',
      };

      setAssets([newAsset, ...assets]);
      addNotification({
        type: 'success',
        message: `Property "${newPropTitle}" successfully tokenized into 10,000 fractional shares on BelizeChain!`,
      });
      setModalMode(null);
      setNewPropTitle('');
      setNewPropParcel('');
      setNewPropValuation('');
    }, 1500);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to trade tokenized real-world assets & municipal green bonds." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 z-10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors">
                <ArrowLeft size={24} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Buildings size={24} className="text-amber-400" />
                Tokenized Real-World Assets (RWA)
              </h1>
              <p className="text-xs text-slate-400">
                LandLedger Cadastral Deeds • Municipal Green Bonds • Regulated Secondary Trading
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalMode('tokenize')}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus size={16} weight="bold" />
              Tokenize Property
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Portfolio Summary Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 rounded-3xl p-5 shadow-xl space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>My RWA Portfolio Value</span>
              <CurrencyDollar size={20} className="text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {totalInvestedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs text-amber-400 font-mono">bBZD</span>
            </div>
            <p className="text-[11px] text-slate-400">Fractional real estate deeds & bond principal</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-3xl p-5 shadow-xl space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Accrued Dividend Yields</span>
              <Coins size={20} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              +{totalAccruedYield.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-mono">bBZD</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[10px] text-slate-400">Ready for instant harvest</span>
              <button
                onClick={handleClaimAllYield}
                disabled={totalAccruedYield <= 0}
                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40"
              >
                Harvest All
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 via-slate-900 to-slate-900 border border-blue-500/20 rounded-3xl p-5 shadow-xl space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>FSC Regulatory Shield</span>
              <ShieldCheck size={20} className="text-blue-400" />
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 pt-1">
              <CheckCircle size={18} className="text-blue-400" weight="fill" />
              100% Legally Enforceable
            </div>
            <p className="text-[11px] text-slate-400">
              Smart contracts mapped to Ministry of Natural Resources digital title deeds.
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto text-xs">
          {(
            [
              { id: 'all', label: 'All Tokenized Assets' },
              { id: 'real-estate', label: '🏖️ Real Estate Deeds' },
              { id: 'green-bond', label: '🌱 Sovereign Green Bonds' },
              { id: 'infrastructure', label: '⚓ Port & Infrastructure' },
              { id: 'agriculture', label: '🍫 Carbon & Agriculture' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`flex-1 min-w-[150px] py-2.5 font-bold rounded-xl transition-all ${
                activeCategory === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Asset Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {asset.category.replace('-', ' ')}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Annual APY</span>
                    <span className="text-emerald-400 font-bold text-sm">{asset.annualYieldApy}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{asset.title}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin size={14} className="text-amber-400" />
                    {asset.location}
                  </p>
                </div>

                {asset.cadastralParcelId && (
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-[11px] font-mono">
                    <span className="text-slate-500">Cadastral Deed:</span>
                    <span className="text-cyan-300 font-bold">{asset.cadastralParcelId}</span>
                  </div>
                )}

                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Valuation:</span>
                    <span className="text-white font-bold">{asset.totalValuation}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Token Price:</span>
                    <span className="text-amber-400 font-bold">{asset.tokenPrice}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Payout Schedule:</span>
                    <span className="text-slate-300">{asset.payoutSchedule}</span>
                  </div>
                </div>

                {/* Funding Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Subscription Progress</span>
                    <span className="text-white font-bold">{asset.fundedPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full"
                      style={{ width: `${asset.fundedPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* User Holding & Action */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                {(asset.userTokens || 0) > 0 && (
                  <div className="flex justify-between items-center text-xs bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                    <span className="text-emerald-400">Your Holding:</span>
                    <span className="text-white font-bold">
                      {asset.userTokens} {asset.tokenSymbol} (+{asset.accruedYield})
                    </span>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedAsset(asset);
                    setModalMode('invest');
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Coins size={16} weight="bold" />
                  Invest / Subscribe
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal 1: Invest / Subscribe Modal */}
      {modalMode === 'invest' && selectedAsset && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-xs">
            <button
              onClick={() => setModalMode(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Coins size={22} weight="fill" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Subscribe to {selectedAsset.tokenSymbol}</h3>
                <p className="text-slate-400 text-[11px]">{selectedAsset.title}</p>
              </div>
            </div>

            <form onSubmit={handleInvestSubmit} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Number of Fractional Tokens</label>
                <input
                  type="number"
                  min="1"
                  max={selectedAsset.availableTokens}
                  required
                  value={investTokenCount}
                  onChange={(e) => setInvestTokenCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Price per Token:</span>
                  <span className="text-white font-bold">{selectedAsset.tokenPrice}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Expected APY:</span>
                  <span className="text-emerald-400 font-bold">{selectedAsset.annualYieldApy}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2">
                  <span>Total Capital Required:</span>
                  <span className="text-amber-400 font-bold text-xs">
                    {(
                      parseInt(investTokenCount || '0', 10) *
                      parseFloat(selectedAsset.tokenPrice.replace(' BZ$', ''))
                    ).toFixed(2)}{' '}
                    bBZD
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingInvest}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkle size={16} weight="bold" />
                {isSubmittingInvest ? 'Confirming On-Chain Subscription...' : 'Confirm Subscription'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Tokenize New Property Modal */}
      {modalMode === 'tokenize' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-xs">
            <button
              onClick={() => setModalMode(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Buildings size={22} weight="fill" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tokenize Real Estate Asset</h3>
                <p className="text-slate-400 text-[11px]">Issue 10,000 fractional title tokens with LandLedger seal.</p>
              </div>
            </div>

            <form onSubmit={handleTokenizeSubmit} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Property / Asset Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Caye Caulker Beachfront Villa"
                  value={newPropTitle}
                  onChange={(e) => setNewPropTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">LandLedger Cadastral Parcel ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BZ-CC-2026-4412"
                  value={newPropParcel}
                  onChange={(e) => setNewPropParcel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block">Valuation (bBZD)</label>
                  <input
                    type="number"
                    required
                    placeholder="500000"
                    value={newPropValuation}
                    onChange={(e) => setNewPropValuation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block">Target APY Yield</label>
                  <input
                    type="text"
                    required
                    value={newPropYield}
                    onChange={(e) => setNewPropYield(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-400 font-bold focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingTokenize}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkle size={16} weight="bold" />
                {isSubmittingTokenize ? 'Minting Fractional Deed Tokens...' : 'Tokenize & Issue Shares'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
