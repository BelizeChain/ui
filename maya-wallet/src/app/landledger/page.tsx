'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  House,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  Leaf,
  ArrowsLeftRight,
  Upload,
  Eye,
  ArrowLeft,
  Coins,
  ShieldCheck,
  DownloadSimple,
  TreeEvergreen,
  Receipt,
  Sparkle,
  Check,
  Compass,
} from 'phosphor-react';

interface LandParcel {
  parcelId: string;
  district: string;
  location: string;
  sizeAcres: number;
  tenure: 'Freehold Absolute' | 'Leasehold Crown' | 'Agricultural Grant';
  assessedValueBBZD: number;
  annualTaxBBZD: number;
  taxStatus: 'Paid' | 'Due';
  ownerAddress: string;
  deedCid: string;
  gpsCoords: string;
}

export default function LandLedgerPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'my-titles' | 'district-cadastre' | 'tax-pay' | 'transfer'>('my-titles');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Belize (Ambergris Caye)');
  const [payingTaxId, setPayingTaxId] = useState<string | null>(null);

  const [myParcels, setMyParcels] = useState<LandParcel[]>([
    {
      parcelId: 'BZ-AMB-482A',
      district: 'Belize (Ambergris Caye)',
      location: 'San Pedro Town, Beachfront North',
      sizeAcres: 0.75,
      tenure: 'Freehold Absolute',
      assessedValueBBZD: 450000,
      annualTaxBBZD: 675,
      taxStatus: 'Paid',
      ownerAddress: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      deedCid: 'QmZtmD2qtQgStation89uVb1e4R8W...',
      gpsCoords: '17.9214° N, 87.9611° W',
    },
    {
      parcelId: 'BZ-CYO-1092',
      district: 'Cayo (Belmopan)',
      location: 'Mountain View Boulevard, Belmopan',
      sizeAcres: 2.2,
      tenure: 'Freehold Absolute',
      assessedValueBBZD: 180000,
      annualTaxBBZD: 270,
      taxStatus: 'Due',
      ownerAddress: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      deedCid: 'QmYwAPJzv5CZsnA625s3Xf2nemtK...',
      gpsCoords: '17.2510° N, 88.7590° W',
    },
  ]);

  const handlePayTax = (parcel: LandParcel) => {
    setPayingTaxId(parcel.parcelId);
    setTimeout(() => {
      setMyParcels((prev) =>
        prev.map((p) => (p.parcelId === parcel.parcelId ? { ...p, taxStatus: 'Paid' } : p))
      );
      setPayingTaxId(null);
      addNotification({
        type: 'success',
        message: `Property Tax for ${parcel.parcelId} paid (${parcel.annualTaxBBZD} bBZD) with 5% statutory digital rebate credited!`,
      });
    }, 1300);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to view your official Belize LandLedger property titles." fullScreen />;
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
              <h1 className="text-xl font-bold">Belize National LandLedger</h1>
              <p className="text-xs text-slate-400">Cadastral GIS Registry • Freehold Titles • Stamp Duty & Tax</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck size={16} weight="bold" />
              Ministry Verified
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">My Registered Titles</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">2 Properties</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">2.95 Total Acres</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Assessed Value</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300 font-mono">BZ$ 630,000</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Government Cadastral Rate</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Annual Tax Status</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-amber-300 font-mono">270.00 bBZD</span>
              <span className="text-[10px] text-amber-300">Due</span>
            </div>
            <span className="text-[11px] text-slate-400 block">1 Paid • 1 Due</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Deed Storage</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400">Pakit IPFS</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Cryptographically Anchored</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['my-titles', 'district-cadastre', 'tax-pay', 'transfer'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'my-titles'
                ? 'My Land Titles'
                : tab === 'district-cadastre'
                ? 'District Cadastre Map'
                : tab === 'tax-pay'
                ? 'Property Tax Portal'
                : 'Title Transfer Escrow'}
            </button>
          ))}
        </div>

        {/* Tab 1: My Land Titles */}
        {activeTab === 'my-titles' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myParcels.map((p) => (
                <div
                  key={p.parcelId}
                  className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-5 space-y-4 shadow-xl text-xs transition-all"
                >
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <House size={18} className="text-emerald-400" weight="bold" />
                      <span className="font-bold text-white text-sm font-mono">{p.parcelId}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.taxStatus === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      Tax: {p.taxStatus}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm">{p.location}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} /> {p.district} • {p.gpsCoords}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Tenure Type</span>
                      <span className="text-white font-bold">{p.tenure}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Parcel Size</span>
                      <span className="text-white font-bold">{p.sizeAcres} Acres</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Assessed Value</span>
                      <span className="text-cyan-300 font-bold">BZ$ {p.assessedValueBBZD.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Annual Property Tax</span>
                      <span className="text-emerald-400 font-bold">{p.annualTaxBBZD} bBZD</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => addNotification({ type: 'success', message: `Downloaded Title Deed PDF for ${p.parcelId} from Pakit IPFS!` })}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <DownloadSimple size={14} /> Title Deed (PDF)
                    </button>
                    {p.taxStatus === 'Due' && (
                      <button
                        onClick={() => handlePayTax(p)}
                        disabled={payingTaxId === p.parcelId}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <Receipt size={14} weight="bold" />
                        {payingTaxId === p.parcelId ? 'Paying...' : 'Pay Tax (5% Off)'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: District Cadastre */}
        {activeTab === 'district-cadastre' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass size={22} className="text-cyan-400" />
                  National Cadastral Parcel Registry
                </h3>
                <p className="text-slate-400 mt-1">Browse registered parcels by district.</p>
              </div>

              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="Belize (Ambergris Caye)">Belize District (Ambergris Caye & Cayes)</option>
                <option value="Cayo (Belmopan)">Cayo District (Belmopan & San Ignacio)</option>
                <option value="Stann Creek (Placencia)">Stann Creek (Placencia & Dangriga)</option>
                <option value="Corozal">Corozal District</option>
                <option value="Orange Walk">Orange Walk District</option>
                <option value="Toledo (Punta Gorda)">Toledo District (Punta Gorda)</option>
              </select>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3 text-center">
              <MapPin size={48} className="text-emerald-400 mx-auto" weight="duotone" />
              <div className="space-y-1">
                <span className="font-bold text-white text-base block">{selectedDistrict} GIS Cadastre</span>
                <p className="text-slate-400 text-[11px]">
                  14,820 Freehold Titles anchored on BelizeChain consensus. All titles immune to double-allocation and forged paper certificates.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Tax Portal */}
        {activeTab === 'tax-pay' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt size={22} className="text-emerald-400" />
                Ministry Property Tax & Stamp Duty Portal
              </h3>
              <p className="text-slate-400 mt-1">
                Pay annual municipal taxes and stamp duties directly in statutory **bBZD** with automated on-chain receipt.
              </p>
            </div>

            <div className="space-y-3">
              {myParcels.map((p) => (
                <div key={p.parcelId} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white font-mono">{p.parcelId}</span>
                    <span className="text-slate-400 text-[11px] block">{p.location} • Due: {p.annualTaxBBZD} bBZD</span>
                  </div>
                  {p.taxStatus === 'Due' ? (
                    <button
                      onClick={() => handlePayTax(p)}
                      disabled={payingTaxId === p.parcelId}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs"
                    >
                      {payingTaxId === p.parcelId ? 'Processing...' : 'Pay Tax'}
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-[10px] flex items-center gap-1">
                      <Check size={12} weight="bold" /> Tax Settled
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Transfer Escrow */}
        {activeTab === 'transfer' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs max-w-lg mx-auto">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowsLeftRight size={22} className="text-cyan-400" />
                Initiate Title Deed Transfer Escrow
              </h3>
              <p className="text-slate-400 mt-1">Secure 3-party escrow between Buyer, Seller, and Ministry Notary.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addNotification({
                  type: 'success',
                  message: 'Transfer Escrow initialized! Sent to Ministry of Natural Resources for digital signoff.',
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Select Parcel to Transfer</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-400 focus:outline-none">
                  {myParcels.map((p) => (
                    <option key={p.parcelId} value={p.parcelId}>
                      {p.parcelId} ({p.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Buyer Maya Wallet Address or BNS (.bz)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. buyer.bz or r1Sa..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Agreed Sale Price (bBZD)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.99] text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <ArrowsLeftRight size={18} weight="bold" />
                Initialize Transfer Escrow
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
