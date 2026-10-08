'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  getUserLandTitles,
  getAllProperties,
  initiatePropertyTransfer,
  type LandTitle,
} from '@/services/pallets/landledger';
import {
  House,
  MapPin,
  FileText,
  ArrowsLeftRight,
  ArrowLeft,
  Coins,
  DownloadSimple,
  Fingerprint,
  ShieldCheck,
  ShieldWarning,
  X,
} from 'phosphor-react';

const SQM_PER_ACRE = 4046.8564224;

/** `coordinates` is a raw `(latitude, longitude)` pair, stored as integers. */
function formatCoordinates(coords: LandTitle['coordinates']): string {
  if (!coords) return 'Not recorded';
  return `${coords.latitude}° N, ${coords.longitude}° W`;
}

function toAcres(areaSqm: number): string {
  return (areaSqm / SQM_PER_ACRE).toFixed(2);
}

/**
 * Normalise the real GPS coordinates into the SVG viewport.
 *
 * This is a plain equirectangular scatter of the stored points — not a survey
 * projection. The pallet stores no polygon geometry, so no parcel outline can
 * be drawn; only the point and its id are real.
 */
function projectCoordinates(
  all: LandTitle[],
  coords: LandTitle['coordinates'],
  width: number,
  height: number,
): { x: number; y: number } | null {
  if (!coords) return null;
  const points = all
    .map((p) => p.coordinates)
    .filter((c): c is { latitude: number; longitude: number } => c !== undefined);
  if (points.length === 0) return null;

  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;
  const pad = 40;

  return {
    x: pad + ((coords.longitude - minLng) / spanLng) * (width - 2 * pad),
    y: pad + ((maxLat - coords.latitude) / spanLat) * (height - 2 * pad),
  };
}


export default function LandLedgerPage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'my-titles' | 'cadastre-map' | 'transfer'>('my-titles');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // On-chain state. `allProperties` is the full national register (for the
  // cadastre view); `myTitles` is the caller's subset.
  const [allProperties, setAllProperties] = useState<LandTitle[]>([]);
  const [myTitles, setMyTitles] = useState<LandTitle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Transfer Escrow Form State
  const [transferTitleId, setTransferTitleId] = useState('');
  const [transferBuyer, setTransferBuyer] = useState('');
  const [transferPrice, setTransferPrice] = useState('');
  const [isInitializingEscrow, setIsInitializingEscrow] = useState(false);

  // Title Deed Inspector Modal
  const [inspectedDeed, setInspectedDeed] = useState<LandTitle | null>(null);

  // Hoisted so the callback's deps match the compiler-inferred dependency
  // (react-hooks/preserve-manual-memoization).
  const address = selectedAccount?.address;

  const loadProperties = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const [everyProperty, owned] = await Promise.all([
        getAllProperties(),
        getUserLandTitles(address),
      ]);
      setAllProperties(everyProperty);
      setMyTitles(owned);
      setTransferTitleId((current) => current || owned[0]?.titleId || '');
    } catch (err) {
      console.warn('LandLedger query failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    // Deferred so the initial load doesn't set state during the effect body
    // (react-hooks/set-state-in-effect).
    Promise.resolve().then(loadProperties);
  }, [loadProperties]);

  const filteredProperties = useMemo(() => {
    if (typeFilter === 'ALL') return allProperties;
    return allProperties.filter((p) => p.propertyType === typeFilter);
  }, [allProperties, typeFilter]);

  const propertyTypes = useMemo(
    () => Array.from(new Set(allProperties.map((p) => p.propertyType))).sort(),
    [allProperties],
  );

  const totalAreaSqm = myTitles.reduce((acc, p) => acc + p.areaSqm, 0);
  const totalAssessed = myTitles.reduce((acc, p) => acc + BigInt(p.assessedValue || '0'), 0n);
  const activeEncumbrances = myTitles.reduce(
    (acc, p) => acc + p.encumbrances.filter((e) => e.active).length,
    0,
  );

  const inspectedSelected = useMemo(
    () => allProperties.find((p) => p.titleId === selectedPropertyId) ?? null,
    [allProperties, selectedPropertyId],
  );

  // Handle Transfer Escrow
  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferBuyer) {
      addNotification({ type: 'error', message: 'Please specify the buyer Maya Wallet address or BNS domain.' });
      return;
    }

    const title = myTitles.find((t) => t.titleId === transferTitleId);
    if (!title) {
      addNotification({ type: 'error', message: `Property ${transferTitleId} is not one of your on-chain titles.` });
      return;
    }

    setIsInitializingEscrow(true);
    try {
      const res = await initiatePropertyTransfer(
        selectedAccount!.address,
        title.titleId,
        transferBuyer,
        transferPrice || undefined,
      );
      addNotification({
        type: 'success',
        message: `Transfer of property ${title.titleId} submitted: ${res.hash.slice(0, 16)}…`,
      });
      setTransferBuyer('');
      setTransferPrice('');
      setActiveTab('my-titles');
      await loadProperties();
    } catch (err) {
      addNotification({ type: 'error', message: `Transfer failed: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setIsInitializingEscrow(false);
    }
  };

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to access your Belize LandLedger titles and the national property register."
        fullScreen
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#030914] text-slate-100 flex flex-col font-sans pb-28">
      {/* Ambient Cyber-Ocean Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-2xl border-b border-teal-500/20 shadow-lg shadow-teal-950/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Return to Maya Wallet"
                className="p-2.5 bg-slate-900/90 hover:bg-teal-950/50 rounded-2xl text-teal-300 hover:text-white transition-all border border-teal-500/30 shadow-md shadow-teal-950/30"
              >
                <ArrowLeft size={18} weight="bold" />
              </motion.button>
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <House size={22} className="text-emerald-400" weight="fill" />
                Belize LandLedger Register
              </h1>
              <p className="text-[11px] text-teal-200/70 font-mono">
                pallet landLedger • on-chain property register
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold font-mono items-center gap-1.5 shadow-sm">
              <ShieldCheck size={14} weight="fill" />
              {allProperties.length} Registered Properties
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1 relative z-10">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Registered Titles */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl space-y-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px] text-teal-300">My Registered Titles</span>
              <House size={18} className="text-emerald-400" weight="fill" />
            </div>
            <div>
              <span className="text-2xl font-black font-mono text-white">{myTitles.length} Properties</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-teal-500/10">
              <span>Total Area:</span>
              <span className="text-emerald-300 font-bold">{toAcres(totalAreaSqm)} Acres</span>
            </div>
          </motion.div>

          {/* Card 2: Assessed Valuation */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl space-y-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px] text-cyan-300">Assessed Value</span>
              <Coins size={18} className="text-cyan-400" weight="fill" />
            </div>
            <div>
              <span className="text-2xl font-black font-mono text-cyan-300">
                {totalAssessed.toString()}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-teal-500/10">
              <span>Unit:</span>
              <span className="text-slate-300 font-bold">bBZD (raw pallet value)</span>
            </div>
          </motion.div>

          {/* Card 3: Encumbrances */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl space-y-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-300">Active Encumbrances</span>
              <ShieldWarning size={18} className="text-amber-400" weight="fill" />
            </div>
            <div>
              <span className="text-2xl font-black font-mono text-amber-300">{activeEncumbrances}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-teal-500/10">
              <span>Effect:</span>
              <span className="text-slate-300 font-bold">Blocks transfer</span>
            </div>
          </motion.div>

          {/* Card 4: Register Coverage */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl space-y-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px] text-purple-300">National Register</span>
              <MapPin size={18} className="text-purple-400" weight="fill" />
            </div>
            <div>
              <span className="text-2xl font-black font-mono text-purple-300">{allProperties.length} Parcels</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-teal-500/10">
              <span>Government verified:</span>
              <span className="text-purple-300 font-bold">
                {allProperties.filter((p) => p.governmentVerified).length}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation Dock */}
        <div className="flex bg-slate-950/90 border border-teal-500/25 rounded-2xl p-1.5 overflow-x-auto text-xs font-bold gap-1.5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl">
          {(['my-titles', 'cadastre-map', 'transfer'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 rounded-xl capitalize transition-all whitespace-nowrap text-center ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-teal-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              {tab === 'my-titles'
                ? 'My Property Titles'
                : tab === 'cadastre-map'
                ? 'National Register Map'
                : 'Title Transfer'}
            </button>
          ))}
        </div>

        {/* Tab 1: My Property Titles */}
        {activeTab === 'my-titles' && (
          <div className="space-y-4">
            {myTitles.length === 0 ? (
              <div className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-10 text-center space-y-2">
                <House size={32} className="text-slate-600 mx-auto" weight="fill" />
                <p className="text-sm font-bold text-slate-300">
                  {isLoading ? 'Reading the on-chain register…' : 'No land titles are registered to this account.'}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  Titles are read from landLedger.properties by owner. Registration is done by the
                  land registry through landLedger.registerProperty.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myTitles.map((title) => (
                  <motion.div
                    key={title.titleId}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-950/80 border border-teal-500/20 hover:border-teal-400/40 rounded-3xl p-6 space-y-4 shadow-xl shadow-teal-950/20 backdrop-blur-2xl flex flex-col justify-between transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-teal-500/10 pb-3">
                        <div className="flex items-center gap-2">
                          <House size={20} className="text-emerald-400" weight="bold" />
                          <span className="font-bold text-white text-base font-mono">
                            Property #{title.titleId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {title.governmentVerified && (
                            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold font-mono">
                              Government Verified
                            </span>
                          )}
                          {!title.surveyed && (
                            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold font-mono">
                              Not Surveyed
                            </span>
                          )}
                          {title.encumbrances.some((e) => e.active) && (
                            <span className="px-2.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-[10px] font-bold font-mono">
                              Encumbered
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-white text-base group-hover:text-teal-200 transition-colors">
                          {title.titleNumber || 'Untitled'}
                        </h3>
                        {title.description && (
                          <p className="text-xs text-slate-400 mt-1">{title.description}</p>
                        )}
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-mono">
                          <MapPin size={14} className="text-emerald-400" /> {formatCoordinates(title.coordinates)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-4 rounded-2xl border border-teal-500/10 text-xs font-mono">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">Type</span>
                          <span className="text-white font-bold">{title.propertyType}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">Area</span>
                          <span className="text-white font-bold">
                            {toAcres(title.areaSqm)} ac ({title.areaSqm.toLocaleString()} m²)
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">Assessed Value</span>
                          <span className="text-cyan-300 font-bold">{title.assessedValue} bBZD</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase">Zoning</span>
                          <span className="text-emerald-400 font-bold">{title.zoning}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-teal-500/10">
                      <button
                        onClick={() => setInspectedDeed(title)}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-teal-950/40 text-slate-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-teal-500/20"
                      >
                        <FileText size={16} /> View Record
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: National Register Map */}
        {activeTab === 'cadastre-map' && (
          <div className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 space-y-6 shadow-xl shadow-teal-950/20 backdrop-blur-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-500/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin size={22} className="text-cyan-400" />
                  National Property Register
                </h3>
                <p className="text-xs text-teal-200/70 mt-0.5 font-mono">
                  Live points from landLedger.properties. The pallet stores a GPS coordinate pair, not
                  polygon boundaries, so no parcel outline is drawn.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-slate-900 border border-teal-500/30 rounded-xl p-2.5 text-xs text-cyan-300 font-semibold focus:border-cyan-400 focus:outline-none"
                >
                  <option value="ALL">All Property Types</option>
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {allProperties.length === 0 ? (
              <div className="bg-slate-950 rounded-3xl border border-teal-500/20 p-10 text-center space-y-2">
                <MapPin size={32} className="text-slate-600 mx-auto" weight="fill" />
                <p className="text-sm font-bold text-slate-300">
                  {isLoading ? 'Reading the register…' : 'No properties are registered on chain yet.'}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  Register a parcel through landLedger.registerProperty to see it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#020712] rounded-3xl border border-teal-500/20 p-4 relative overflow-hidden flex items-center justify-center min-h-[360px] shadow-inner shadow-teal-950/40">
                  <svg className="w-full h-80 max-w-lg" viewBox="0 0 650 360">
                    <defs>
                      <pattern id="cadastreGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(20, 184, 166, 0.15)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#cadastreGrid)" />

                    {filteredProperties.map((property) => {
                      const point = projectCoordinates(allProperties, property.coordinates, 650, 360);
                      if (!point) return null;
                      const isSelected = inspectedSelected?.titleId === property.titleId;
                      return (
                        <g
                          key={property.titleId}
                          onClick={() => setSelectedPropertyId(property.titleId)}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={isSelected ? 10 : 6}
                            fill={isSelected ? '#2DD4BF' : '#38BDF8'}
                            opacity={0.85}
                          />
                          <text
                            x={point.x}
                            y={point.y - 14}
                            textAnchor="middle"
                            fill="white"
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            #{property.titleId}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-teal-500/20 px-3 py-1.5 rounded-xl text-[10px] font-mono text-teal-300">
                    Plain lat/lng scatter • not a survey projection
                  </div>
                </div>

                {/* Selected Property Inspector Pane */}
                <div className="bg-slate-900/90 rounded-3xl border border-teal-500/20 p-5 space-y-4 text-xs flex flex-col justify-between">
                  {inspectedSelected ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-white text-base font-mono block">
                              Property #{inspectedSelected.titleId}
                            </span>
                            <span className="text-slate-400 text-[11px] block">
                              {inspectedSelected.titleNumber || 'Untitled'}
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-[10px]">
                            {inspectedSelected.propertyType}
                          </span>
                        </div>

                        <div className="space-y-2 font-mono text-[11px] bg-slate-950 p-3.5 rounded-2xl border border-teal-500/10">
                          <div className="flex justify-between text-slate-400">
                            <span>Assessed Value:</span>
                            <span className="text-cyan-300 font-bold">{inspectedSelected.assessedValue} bBZD</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Area:</span>
                            <span className="text-white font-bold">
                              {toAcres(inspectedSelected.areaSqm)} ac
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Zoning:</span>
                            <span className="text-emerald-400">{inspectedSelected.zoning}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>GPS:</span>
                            <span className="text-slate-200">{formatCoordinates(inspectedSelected.coordinates)}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Owner:</span>
                            <span className="text-slate-300 truncate max-w-[45%]">{inspectedSelected.owner}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Surveyed / Verified:</span>
                            <span className="text-slate-200">
                              {inspectedSelected.surveyed ? 'yes' : 'no'} /{' '}
                              {inspectedSelected.governmentVerified ? 'yes' : 'no'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setInspectedDeed(inspectedSelected)}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <FileText size={16} weight="bold" />
                        Inspect Property Record
                      </button>
                    </>
                  ) : (
                    <p className="text-slate-500 text-center my-auto">
                      Select a property on the map to inspect its on-chain record.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Title Transfer */}
        {activeTab === 'transfer' && (
          <div className="max-w-xl mx-auto bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-2xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowsLeftRight size={22} className="text-cyan-400" />
                Transfer a Property Title
              </h3>
              <p className="text-slate-400 mt-1 font-mono text-[11px]">
                Submits landLedger.transferProperty. The chain requires you to be the current owner,
                the property to be government-verified, the buyer to hold KYC level 2 or above, and
                no active encumbrance.
              </p>
            </div>

            {myTitles.length === 0 ? (
              <div className="bg-slate-900/90 p-6 rounded-2xl border border-teal-500/15 text-center text-slate-400">
                You hold no on-chain titles, so there is nothing to transfer.
              </div>
            ) : (
              <form onSubmit={handleInitiateTransfer} className="space-y-4">
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">Property Title</label>
                  <select
                    value={transferTitleId}
                    onChange={(e) => setTransferTitleId(e.target.value)}
                    className="w-full bg-slate-900 border border-teal-500/30 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  >
                    {myTitles.map((t) => (
                      <option key={t.titleId} value={t.titleId}>
                        Property #{t.titleId} — {t.titleNumber || 'Untitled'} ({t.propertyType},{' '}
                        {toAcres(t.areaSqm)} ac)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">
                    Buyer Maya Wallet Address or .bz Domain
                  </label>
                  <input
                    type="text"
                    required
                    value={transferBuyer}
                    onChange={(e) => setTransferBuyer(e.target.value)}
                    placeholder="e.g. buyer.bz or r1…"
                    className="w-full bg-slate-900 border border-teal-500/30 rounded-xl p-3.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">
                    Declared Transfer Price (bBZD)
                  </label>
                  <input
                    type="number"
                    value={transferPrice}
                    onChange={(e) => setTransferPrice(e.target.value)}
                    placeholder="Leave blank for a nil-price transfer"
                    className="w-full bg-slate-900 border border-teal-500/30 rounded-xl p-3.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    Stored verbatim as transferPrice on chain. The pallet applies no stamp duty or
                    rebate of its own — those figures were previously shown here and were invented.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isInitializingEscrow || !transferBuyer}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2"
                >
                  {isInitializingEscrow ? 'Submitting Transfer…' : 'Submit Title Transfer'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Title Deed Inspector Modal */}
      <AnimatePresence>
        {inspectedDeed && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border-2 border-teal-500/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative text-xs"
            >
              <button
                onClick={() => setInspectedDeed(null)}
                className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-2 border-b border-teal-500/10 pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <House size={32} className="text-slate-950" weight="fill" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">LandLedger Property Record</h3>
                <p className="text-xs text-emerald-400 font-mono">
                  landLedger.properties #{inspectedDeed.titleId}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-teal-500/15 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Title Number:</span>
                  <span className="text-white font-bold">{inspectedDeed.titleNumber || '—'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Property Type:</span>
                  <span className="text-emerald-400 font-bold">{inspectedDeed.propertyType}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Zoning:</span>
                  <span className="text-emerald-400 font-bold">{inspectedDeed.zoning}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Registered Owner:</span>
                  <span className="text-cyan-300 font-bold truncate max-w-[50%]">{inspectedDeed.owner}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Coordinates:</span>
                  <span className="text-slate-200 text-right">{formatCoordinates(inspectedDeed.coordinates)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Area:</span>
                  <span className="text-white font-bold">
                    {toAcres(inspectedDeed.areaSqm)} ac ({inspectedDeed.areaSqm.toLocaleString()} m²)
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Assessed Value:</span>
                  <span className="text-cyan-300 font-bold">{inspectedDeed.assessedValue} bBZD</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Verified / Surveyed:</span>
                  <span className="text-slate-200">
                    {inspectedDeed.governmentVerified ? 'verified' : 'unverified'} /{' '}
                    {inspectedDeed.surveyed ? 'surveyed' : 'not surveyed'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Encumbrances:</span>
                  <span className={inspectedDeed.encumbrances.length > 0 ? 'text-amber-300 font-bold' : 'text-slate-300'}>
                    {inspectedDeed.encumbrances.length}
                  </span>
                </div>
              </div>

              {inspectedDeed.encumbrances.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/20 space-y-2 text-[11px]">
                  <span className="text-amber-300 font-bold uppercase text-[10px] block">Encumbrances</span>
                  {inspectedDeed.encumbrances.map((enc, i) => (
                    <div key={i} className="flex justify-between font-mono text-slate-400">
                      <span>
                        {enc.encumbranceType}
                        {enc.description ? ` — ${enc.description}` : ''}
                      </span>
                      <span className={enc.active ? 'text-amber-300' : 'text-slate-500'}>
                        {enc.active ? 'active' : 'released'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    const recordJson = JSON.stringify(inspectedDeed, null, 2);
                    const blob = new Blob([recordJson], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `LandLedger_Property_${inspectedDeed.titleId}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    addNotification({ type: 'success', message: 'Downloaded the on-chain property record.' });
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <DownloadSimple size={16} weight="bold" />
                  Download Record (.json)
                </button>

                <button
                  onClick={() => {
                    setInspectedDeed(null);
                    router.push('/belizeid');
                  }}
                  className="flex-1 py-3 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Fingerprint size={16} weight="bold" />
                  BelizeID
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
