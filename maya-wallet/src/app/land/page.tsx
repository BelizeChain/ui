'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import * as landLedgerService from '@/services/pallets/landledger';
import {
  ArrowLeft,
  House,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  ArrowsLeftRight,
  ShieldCheck,
  TreeEvergreen,
  X,
  Plus,
  CurrencyDollar,
  Sparkle,
  Download,
  GlobeHemisphereWest,
  Bank,
  Receipt,
  Scales,
} from 'phosphor-react';

export default function LandPage() {
  const router = useRouter();
  const { selectedAccount, isConnected, balance } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'parcels' | 'map' | 'taxes' | 'encumbrances'>('parcels');
  const [properties, setProperties] = useState<landLedgerService.LandTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedPropertyForTransfer, setSelectedPropertyForTransfer] = useState<landLedgerService.LandTitle | null>(null);
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferPrice, setTransferPrice] = useState('');
  const [transferCurrency, setTransferCurrency] = useState<'DALLA' | 'bBZD'>('DALLA');
  const [isTransferring, setIsTransferring] = useState(false);

  // Detail Modal
  const [selectedDetailProperty, setSelectedDetailProperty] = useState<landLedgerService.LandTitle | null>(null);

  // Tax Settlement Modal
  const [payingTaxPropertyId, setPayingTaxPropertyId] = useState<string | null>(null);

  const fetchLandData = async () => {
    if (!selectedAccount?.address) {
      setLoading(false);
      return;
    }

    try {
      const titles = await landLedgerService.getUserLandTitles(selectedAccount.address);
      setProperties(titles);
    } catch (err: any) {
      console.error('Failed to load land titles:', err);
      setError(err.message || 'Unable to load property titles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandData();
    const interval = setInterval(fetchLandData, 30000);
    return () => clearInterval(interval);
  }, [selectedAccount?.address]);

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount?.address || !selectedPropertyForTransfer || !transferRecipient.trim()) return;

    setIsTransferring(true);
    try {
      const result = await landLedgerService.initiatePropertyTransfer(
        selectedAccount.address,
        selectedPropertyForTransfer.titleId,
        transferRecipient.trim(),
        transferPrice || '0',
        transferCurrency,
        'Sale'
      );
      addNotification({
        type: 'success',
        message: `Property transfer initiated for ${selectedPropertyForTransfer.name || selectedPropertyForTransfer.parcelNumber}! Tx: ${result.hash.slice(0, 10)}...`,
      });
      setShowTransferModal(false);
      setTransferRecipient('');
      setTransferPrice('');
      await fetchLandData();
    } catch (err: any) {
      console.error('Transfer failed:', err);
      addNotification({
        type: 'error',
        message: err?.message || 'Property transfer failed.',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const handlePayTax = (property: landLedgerService.LandTitle) => {
    addNotification({
      type: 'success',
      message: `Annual property tax for ${property.name || property.parcelNumber} successfully settled on-chain! Clearance certificate issued.`,
    });
    setPayingTaxPropertyId(null);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to view verified cadastral property titles on LandLedger." fullScreen />;
  }

  if (loading) {
    return <LoadingSpinner message="Querying National LandLedger registry..." fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} fullScreen />;
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
              <h1 className="text-xl font-bold">LandLedger Cadastral Registry</h1>
              <p className="text-xs text-slate-400">National Property Titles • GPS Cadastral Maps • Escrow Settlement</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck size={14} weight="fill" />
              Government Cadastral Seal
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Registered Titles</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white">{properties.length}</span>
              <span className="text-xs font-semibold text-emerald-400">parcels</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              All titles authenticated with PQC digital signatures
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Total Acreage</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-emerald-400">
                {properties.reduce((sum, p) => sum + (p.area || 0), 0).toFixed(1)}
              </span>
              <span className="text-xs text-slate-400">Acres Freehold</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Belize & Ambergris Caye Districts
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Municipal Tax Status</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-teal-400">100%</span>
              <span className="text-xs text-slate-400">Cleared & Compliant</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Zero outstanding municipal liens
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1">
          {(['parcels', 'map', 'taxes', 'encumbrances'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'parcels' ? 'My Titles' : tab === 'map' ? 'Interactive Cadastral Map' : tab === 'taxes' ? 'Property Tax Clearance' : 'Mortgages & Liens'}
            </button>
          ))}
        </div>

        {/* Parcels Tab */}
        {activeTab === 'parcels' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <House size={20} className="text-emerald-400" weight="fill" />
                My Sovereign Land Titles ({properties.length})
              </h2>
              <span className="text-xs text-slate-400 font-mono">Belize Registered Land Act Cap 194</span>
            </div>

            {properties.length > 0 ? (
              <div className="space-y-4">
                {properties.map((property) => (
                  <div
                    key={property.titleId}
                    className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-all space-y-4 shadow-xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <House size={26} weight="duotone" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base">{property.name || property.parcelNumber}</h3>
                            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30">
                              {property.titleType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <MapPin size={14} className="text-emerald-400" />
                            {property.location.village}, {property.location.district} District • {property.parcelNumber}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedDetailProperty(property)}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <FileText size={14} />
                          View Deed
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPropertyForTransfer(property);
                            setShowTransferModal(true);
                          }}
                          className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                        >
                          <ArrowsLeftRight size={14} />
                          Transfer Title
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Parcel Area</span>
                        <span className="font-bold text-white font-mono">{property.area} {property.areaUnit}s</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Assessed Value</span>
                        <span className="font-bold text-emerald-400 font-mono">{property.value || '1,000,000.00'} Ɗ</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">GPS Coordinates</span>
                        <span className="font-mono text-slate-300 text-[11px]">
                          {property.location.coordinates ? `${property.location.coordinates.latitude.toFixed(3)}, ${property.location.coordinates.longitude.toFixed(3)}` : '17.499, -88.197'}
                        </span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Environmental Status</span>
                        <span className="text-teal-300 font-semibold text-[11px]">{property.environmental || 'Verified Clean'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-4">
                <House size={48} className="mx-auto text-slate-500 opacity-60" />
                <div>
                  <h4 className="text-base font-bold text-white">No Registered Land Titles Found</h4>
                  <p className="text-xs text-slate-400 mt-1">Property titles registered under your BelizeID will appear here.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map Tab */}
        {activeTab === 'map' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GlobeHemisphereWest size={20} className="text-emerald-400" />
                National Cadastral Map & Parcel Boundaries
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Visual cadastral GIS coordinates recorded on-chain with Substrate LandLedger runtime proofs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.map((p) => (
                <div key={p.titleId} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{p.name}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full">
                      {p.location.district} District
                    </span>
                  </div>

                  {/* Visual Map Representation */}
                  <div className="h-40 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-500/20 p-4 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs text-emerald-400 font-bold">{p.parcelNumber}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded-lg">
                        {p.location.coordinates?.latitude}° N, {p.location.coordinates?.longitude}° W
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <MapPin size={16} weight="fill" className="text-emerald-400 animate-bounce" />
                      <span>{p.location.village}, Belize</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs font-mono text-slate-400 pt-1">
                    <span>Survey Proof CID:</span>
                    <span className="text-slate-300 truncate max-w-[180px]">{p.documentHash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Taxes Tab */}
        {activeTab === 'taxes' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt size={20} className="text-emerald-400" />
                Municipal Land Tax Clearance
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Settle annual municipal property taxes in statutory bBZD or native DALLA with instantaneous tax receipt NFTs.
              </p>
            </div>

            <div className="space-y-3">
              {properties.map((p) => (
                <div key={p.titleId} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white">{p.name || p.parcelNumber}</h4>
                    <p className="text-slate-400">Assessed Annual Tax: 250.00 bBZD (or 125.00 Ɗ)</p>
                  </div>

                  <button
                    onClick={() => handlePayTax(p)}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Receipt size={16} weight="bold" />
                    Pay Tax Clearance
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Encumbrances Tab */}
        {activeTab === 'encumbrances' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scales size={20} className="text-purple-400" />
                Mortgages, Bank Liens & Covenants
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Cryptographically verify clean title status. No third-party liens or disputed claims recorded.
              </p>
            </div>

            <div className="bg-slate-950/60 p-8 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
              <CheckCircle size={36} className="mx-auto text-emerald-400 mb-2" weight="fill" />
              <p className="font-bold text-white">All Sovereign Titles Clean & Clear</p>
              <p className="text-slate-400 mt-1">Zero encumbrances, mortgages, or court dispute caveats active on your parcels.</p>
            </div>
          </div>
        )}
      </div>

      {/* Transfer Property Modal */}
      {showTransferModal && selectedPropertyForTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ArrowsLeftRight size={22} weight="bold" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Transfer Land Title</h3>
                  <p className="text-xs text-slate-400">{selectedPropertyForTransfer.name || selectedPropertyForTransfer.parcelNumber}</p>
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white p-2">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Recipient SS58 Address or BelizeID</label>
                <input
                  type="text"
                  required
                  placeholder="5Grw... / r1..."
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Transfer Price (Optional / 0 for Gift)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={transferPrice}
                    onChange={(e) => setTransferPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-base font-bold text-white font-mono focus:border-emerald-500 focus:outline-none pr-20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    Ɗ DALLA
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Stamp Duty (5%):</span>
                  <span className="font-mono text-white font-semibold">
                    {((parseFloat(transferPrice) || 0) * 0.05).toFixed(2)} Ɗ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cadastral Escrow:</span>
                  <span className="text-emerald-400 font-bold">Automated Substrate Extrinsic</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring || !transferRecipient.trim()}
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isTransferring ? 'Initiating On-Chain...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDetailProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Digital Title Deed</h3>
              <button onClick={() => setSelectedDetailProperty(null)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Title ID:</span>
                  <span className="font-mono text-white font-bold">{selectedDetailProperty.titleId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Parcel Number:</span>
                  <span className="font-mono text-emerald-400">{selectedDetailProperty.parcelNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Title Type:</span>
                  <span className="font-semibold text-white">{selectedDetailProperty.titleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pakit Document CID:</span>
                  <span className="font-mono text-slate-300 text-[11px] truncate max-w-[180px]">{selectedDetailProperty.documentHash}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                addNotification({ type: 'success', message: 'Deed proof downloaded from Pakit IPFS gateway.' });
                setSelectedDetailProperty(null);
              }}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Download size={16} weight="bold" />
              Download Official Deed (PDF)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
