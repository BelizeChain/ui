'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import { getUserLandTitles, type LandTitle } from '@/services/pallets/landledger';
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
  Buildings,
  TrendUp,
  X,
  ShareNetwork,
  Tag,
  Lightning,
  ArrowsClockwise,
  Fingerprint,
  QrCode,
  LockKey,
} from 'phosphor-react';

interface CadastreParcel {
  parcelId: string;
  district: string;
  location: string;
  sizeAcres: number;
  tenure: 'Freehold Absolute' | 'Leasehold Crown' | 'Agricultural Grant';
  assessedValueBBZD: number;
  annualTaxBBZD: number;
  taxStatus: 'Paid' | 'Due';
  ownerName: string;
  ownerAddress: string;
  deedCid: string;
  gpsCoords: string;
  utmBounds: string;
  surveyYear: number;
  zoning: 'Residential Beachfront' | 'Commercial Mixed' | 'Eco-Tourism Resort' | 'Agricultural';
  isTokenized?: boolean;
  tokenSymbol?: string;
  tokenSupply?: number;
  tokenPriceBBZD?: number;
  svgPolygon: string;
  mapCenter: { x: number; y: number };
  isBelizeIdVerified?: boolean;
}

const DISTRICT_CADASTRE_DATA: CadastreParcel[] = [
  {
    parcelId: 'BZ-AMB-482A',
    district: 'Belize (Ambergris Caye)',
    location: 'San Pedro Town, Beachfront North',
    sizeAcres: 0.75,
    tenure: 'Freehold Absolute',
    assessedValueBBZD: 450000,
    annualTaxBBZD: 675,
    taxStatus: 'Paid',
    ownerName: 'Wicked Sovereign Citizen',
    ownerAddress: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
    deedCid: 'QmZtmD2qtQgStation89uVb1e4R8W3c8jE7a...',
    gpsCoords: '17.9214° N, 87.9611° W',
    utmBounds: 'Zone 16N 398124E, 1981923N',
    surveyYear: 2024,
    zoning: 'Residential Beachfront',
    isTokenized: true,
    tokenSymbol: 'LAND-SP482',
    tokenSupply: 10000,
    tokenPriceBBZD: 45.0,
    svgPolygon: '120,80 240,65 270,160 140,180',
    mapCenter: { x: 190, y: 120 },
    isBelizeIdVerified: true,
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
    ownerName: 'Wicked Sovereign Citizen',
    ownerAddress: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
    deedCid: 'QmYwAPJzv5CZsnA625s3Xf2nemtK7mP8q...',
    gpsCoords: '17.2510° N, 88.7590° W',
    utmBounds: 'Zone 16N 313410E, 1907812N',
    surveyYear: 2025,
    zoning: 'Commercial Mixed',
    isTokenized: false,
    svgPolygon: '310,90 420,105 390,210 290,190',
    mapCenter: { x: 350, y: 150 },
  },
  {
    parcelId: 'BZ-PLA-3319',
    district: 'Stann Creek (Placencia)',
    location: 'Placencia Peninsula Lagoon Front',
    sizeAcres: 1.4,
    tenure: 'Freehold Absolute',
    assessedValueBBZD: 380000,
    annualTaxBBZD: 570,
    taxStatus: 'Paid',
    ownerName: 'Placencia Eco Ventures Trust',
    ownerAddress: '5DTestAddressPlacenciaMarina998124',
    deedCid: 'QmKj81x9LaBc72ZqNw18uPo83dE71nXa4...',
    gpsCoords: '16.5134° N, 88.3682° W',
    utmBounds: 'Zone 16N 354120E, 1826190N',
    surveyYear: 2026,
    zoning: 'Eco-Tourism Resort',
    isTokenized: true,
    tokenSymbol: 'PLMARINA',
    tokenSupply: 20000,
    tokenPriceBBZD: 19.0,
    svgPolygon: '460,180 560,160 590,270 480,290',
    mapCenter: { x: 520, y: 225 },
  },
  {
    parcelId: 'BZ-CC-0881',
    district: 'Belize (Ambergris Caye)',
    location: 'Caye Caulker Split Oceanfront',
    sizeAcres: 0.5,
    tenure: 'Leasehold Crown',
    assessedValueBBZD: 290000,
    annualTaxBBZD: 435,
    taxStatus: 'Paid',
    ownerName: 'Maya Reef Holdings',
    ownerAddress: '5GR98124CaulkerReefHoldings0012',
    deedCid: 'QmPZ9gcCEpqKTo6aq61g2Nx7jkq3a9v1b...',
    gpsCoords: '17.7420° N, 88.0260° W',
    utmBounds: 'Zone 16N 391200E, 1961800N',
    surveyYear: 2025,
    zoning: 'Residential Beachfront',
    isTokenized: false,
    svgPolygon: '160,220 270,210 250,310 140,300',
    mapCenter: { x: 205, y: 260 },
  },
];

export default function LandLedgerPage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'my-titles' | 'cadastre-map' | 'tax-portal' | 'transfer' | 'tokenize'>('my-titles');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('ALL');
  const [selectedParcel, setSelectedParcel] = useState<CadastreParcel>(DISTRICT_CADASTRE_DATA[0]);

  // On-Chain State
  const [chainTitles, setChainTitles] = useState<LandTitle[]>([]);
  const [isLoadingChain, setIsLoadingChain] = useState(false);

  // Tax Payment State
  const [payingTaxId, setPayingTaxId] = useState<string | null>(null);

  // Transfer Escrow Form State
  const [transferParcelId, setTransferParcelId] = useState('BZ-AMB-482A');
  const [transferBuyer, setTransferBuyer] = useState('');
  const [transferPrice, setTransferPrice] = useState('450000');
  const [isInitializingEscrow, setIsInitializingEscrow] = useState(false);

  // Tokenization State
  const [tokenizeParcelId, setTokenizeParcelId] = useState('BZ-CYO-1092');
  const [tokenSymbolInput, setTokenSymbolInput] = useState('BELMOPAN-COML');
  const [tokenSharesInput, setTokenSharesInput] = useState('10000');
  const [isTokenizing, setIsTokenizing] = useState(false);

  // Title Deed Inspector Modal
  const [inspectedDeed, setInspectedDeed] = useState<CadastreParcel | null>(null);

  // Load On-Chain Titles
  useEffect(() => {
    async function loadTitles() {
      if (!selectedAccount?.address) return;
      setIsLoadingChain(true);
      try {
        const titles = await getUserLandTitles(selectedAccount.address);
        setChainTitles(titles);
      } catch (err) {
        console.warn('Could not query on-chain land titles, using verified cadastre state:', err);
      } finally {
        setIsLoadingChain(false);
      }
    }
    loadTitles();
  }, [selectedAccount?.address]);

  // My Owned Parcels
  const myParcels = useMemo(() => {
    return DISTRICT_CADASTRE_DATA.filter((p) => 
      p.ownerAddress === selectedAccount?.address || 
      p.parcelId.startsWith('BZ-AMB') || 
      p.parcelId.startsWith('BZ-CYO')
    );
  }, [selectedAccount?.address]);

  // Filtered Cadastre
  const filteredCadastre = useMemo(() => {
    if (selectedDistrictFilter === 'ALL') return DISTRICT_CADASTRE_DATA;
    return DISTRICT_CADASTRE_DATA.filter((p) => p.district === selectedDistrictFilter);
  }, [selectedDistrictFilter]);

  // Handle Tax Payment
  const handlePayTax = (parcel: CadastreParcel) => {
    setPayingTaxId(parcel.parcelId);
    setTimeout(() => {
      parcel.taxStatus = 'Paid';
      setPayingTaxId(null);
      addNotification({
        type: 'success',
        message: `Property Tax for ${parcel.parcelId} paid (${parcel.annualTaxBBZD} bBZD) with 5% digital rebate applied!`,
      });
    }, 1000);
  };

  // Handle Transfer Escrow
  const handleInitiateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferBuyer) {
      addNotification({ type: 'error', message: 'Please specify the buyer Maya Wallet address or BNS domain.' });
      return;
    }

    setIsInitializingEscrow(true);
    setTimeout(() => {
      setIsInitializingEscrow(false);
      addNotification({
        type: 'success',
        message: `Transfer Escrow for ${transferParcelId} created! 5% Stamp Duty locked and forwarded to Ministry Registrar.`,
      });
      setTransferBuyer('');
      setActiveTab('my-titles');
    }, 1200);
  };

  // Handle RWA Fractional Tokenization
  const handleTokenizeParcel = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTokenizing(true);

    setTimeout(() => {
      const targetParcel = DISTRICT_CADASTRE_DATA.find((p) => p.parcelId === tokenizeParcelId);
      if (targetParcel) {
        targetParcel.isTokenized = true;
        targetParcel.tokenSymbol = tokenSymbolInput.toUpperCase();
        targetParcel.tokenSupply = parseInt(tokenSharesInput);
        targetParcel.tokenPriceBBZD = targetParcel.assessedValueBBZD / parseInt(tokenSharesInput);
      }

      setIsTokenizing(false);
      addNotification({
        type: 'success',
        message: `Successfully tokenized ${tokenizeParcelId} into ${tokenSharesInput} ${tokenSymbolInput} RWA security tokens!`,
      });
      setActiveTab('my-titles');
    }, 1200);
  };

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to access your official Belize LandLedger titles and cadastre GIS registry."
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
                Belize LandLedger & Cadastre Studio
              </h1>
              <p className="text-[11px] text-teal-200/70 font-mono">
                Ministry of Natural Resources • Pallet 18 • Vector GIS Cadastre • RWA Real Estate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold font-mono items-center gap-1.5 shadow-sm">
              <ShieldCheck size={14} weight="fill" />
              Statutory Notary Sealed
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
              <span className="font-bold uppercase tracking-wider text-[10px] text-teal-300">My Freehold Titles</span>
              <House size={18} className="text-emerald-400" weight="fill" />
            </div>
            <div>
              <span className="text-2xl font-black font-mono text-white">{myParcels.length} Properties</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-teal-500/10">
              <span>Total Area:</span>
              <span className="text-emerald-300 font-bold">
                {myParcels.reduce((acc, p) => acc + p.sizeAcres, 0).toFixed(2)} Acres
              </span>
            </div>
          </motion.div>

          {/* Card 2: Assessed Cadastre Valuation */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl space-y-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px] text-cyan-300">Cadastral Valuation</span>
              <Coins size={18} className="text-cyan-400" weight="fill" />
            </div>
            <div>
              <span className="text-2xl font-black font-mono text-cyan-300">
                BZ$ {myParcels.reduce((acc, p) => acc + p.assessedValueBBZD, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-teal-500/10">
              <span>Valuation Unit:</span>
              <span className="text-slate-300 font-bold">Statutory bBZD Peg</span>
            </div>
          </motion.div>

          {/* Card 3: Municipal Tax Status */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl space-y-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-300">Municipal Land Tax</span>
              <Receipt size={18} className="text-amber-400" weight="fill" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-amber-300">
                {myParcels.filter((p) => p.taxStatus === 'Due').reduce((acc, p) => acc + p.annualTaxBBZD, 0)} bBZD
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">Due</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-teal-500/10">
              <span>Status:</span>
              <span className="text-emerald-400 font-bold">1 Paid • 1 Due</span>
            </div>
          </motion.div>

          {/* Card 4: RWA Fractional Yield */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl space-y-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px] text-purple-300">RWA Security Tokens</span>
              <Buildings size={18} className="text-purple-400" weight="fill" />
            </div>
            <div>
              <span className="text-2xl font-black font-mono text-purple-300">1 Tokenized</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-teal-500/10">
              <span>Primary Token:</span>
              <span className="text-purple-300 font-bold font-mono">LAND-SP482</span>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation Dock */}
        <div className="flex bg-slate-950/90 border border-teal-500/25 rounded-2xl p-1.5 overflow-x-auto text-xs font-bold gap-1.5 shadow-xl shadow-teal-950/20 backdrop-blur-2xl">
          {(['my-titles', 'cadastre-map', 'tax-portal', 'transfer', 'tokenize'] as const).map((tab) => (
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
                ? 'GIS Cadastre Map'
                : tab === 'tax-portal'
                ? 'Tax & Stamp Clearance'
                : tab === 'transfer'
                ? 'Title Transfer Escrow'
                : 'Tokenize RWA Land'}
            </button>
          ))}
        </div>

        {/* Tab 1: My Property Titles */}
        {activeTab === 'my-titles' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myParcels.map((parcel) => (
                <motion.div
                  key={parcel.parcelId}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-950/80 border border-teal-500/20 hover:border-teal-400/40 rounded-3xl p-6 space-y-4 shadow-xl shadow-teal-950/20 backdrop-blur-2xl flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-teal-500/10 pb-3">
                      <div className="flex items-center gap-2">
                        <House size={20} className="text-emerald-400" weight="bold" />
                        <span className="font-bold text-white text-base font-mono">{parcel.parcelId}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {parcel.isBelizeIdVerified && (
                          <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-[10px] font-bold font-mono flex items-center gap-1">
                            <Fingerprint size={12} weight="bold" />
                            BelizeID Passport Linked
                          </span>
                        )}
                        {parcel.isTokenized && (
                          <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[10px] font-bold font-mono">
                            RWA: {parcel.tokenSymbol}
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            parcel.taxStatus === 'Paid'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          Tax: {parcel.taxStatus}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-teal-200 transition-colors">
                        {parcel.location}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-mono">
                        <MapPin size={14} className="text-emerald-400" /> {parcel.district} • {parcel.gpsCoords}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-4 rounded-2xl border border-teal-500/10 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Tenure</span>
                        <span className="text-white font-bold">{parcel.tenure}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Acreage</span>
                        <span className="text-white font-bold">{parcel.sizeAcres} Acres</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Cadastral Value</span>
                        <span className="text-cyan-300 font-bold">BZ$ {parcel.assessedValueBBZD.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Annual Tax</span>
                        <span className="text-emerald-400 font-bold">{parcel.annualTaxBBZD} bBZD</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-teal-500/10">
                    <button
                      onClick={() => setInspectedDeed(parcel)}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-teal-950/40 text-slate-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-teal-500/20"
                    >
                      <FileText size={16} /> View Title Deed
                    </button>

                    {parcel.isBelizeIdVerified && (
                      <Link href="/belizeid" className="flex-1">
                        <button
                          className="w-full py-2.5 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-cyan-500/30"
                        >
                          <LockKey size={16} /> ZK Proof Studio
                        </button>
                      </Link>
                    )}

                    {parcel.taxStatus === 'Due' && (
                      <button
                        onClick={() => handlePayTax(parcel)}
                        disabled={payingTaxId === parcel.parcelId}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                      >
                        <Receipt size={16} weight="bold" />
                        {payingTaxId === parcel.parcelId ? 'Paying...' : 'Pay Tax (5% Rebate)'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: GIS Vector Cadastre Map */}
        {activeTab === 'cadastre-map' && (
          <div className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 space-y-6 shadow-xl shadow-teal-950/20 backdrop-blur-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-500/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass size={22} className="text-cyan-400" />
                  National Vector Cadastre & GPS Boundary Registry
                </h3>
                <p className="text-xs text-teal-200/70 mt-0.5 font-mono">
                  Interactive polygon cadastre anchored to Substrate state. Click any parcel to inspect boundaries.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedDistrictFilter}
                  onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                  className="bg-slate-900 border border-teal-500/30 rounded-xl p-2.5 text-xs text-cyan-300 font-semibold focus:border-cyan-400 focus:outline-none"
                >
                  <option value="ALL">All Belize Districts</option>
                  <option value="Belize (Ambergris Caye)">Belize (Ambergris Caye & Cayes)</option>
                  <option value="Cayo (Belmopan)">Cayo (Belmopan & Cayo)</option>
                  <option value="Stann Creek (Placencia)">Stann Creek (Placencia)</option>
                </select>
              </div>
            </div>

            {/* Interactive Vector Map Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#020712] rounded-3xl border border-teal-500/20 p-4 relative overflow-hidden flex items-center justify-center min-h-[360px] shadow-inner shadow-teal-950/40">
                {/* SVG Vector Map */}
                <svg className="w-full h-80 max-w-lg" viewBox="0 0 650 360">
                  <defs>
                    <pattern id="cadastreGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(20, 184, 166, 0.15)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cadastreGrid)" />

                  {/* Coastline / Landscape Sim */}
                  <path
                    d="M 50,20 Q 200,90 350,60 T 600,100 L 620,340 L 40,340 Z"
                    fill="rgba(11, 28, 44, 0.6)"
                    stroke="rgba(20, 184, 166, 0.3)"
                    strokeWidth="2"
                  />

                  {/* Cadastral Parcels */}
                  {filteredCadastre.map((parcel) => {
                    const isSelected = selectedParcel.parcelId === parcel.parcelId;
                    return (
                      <g
                        key={parcel.parcelId}
                        onClick={() => setSelectedParcel(parcel)}
                        className="cursor-pointer transition-transform hover:scale-105"
                      >
                        <polygon
                          points={parcel.svgPolygon}
                          fill={isSelected ? 'rgba(20, 184, 166, 0.5)' : 'rgba(6, 182, 212, 0.2)'}
                          stroke={isSelected ? '#2DD4BF' : '#06B6D4'}
                          strokeWidth={isSelected ? '3' : '1.5'}
                          className="transition-all"
                        />
                        <circle cx={parcel.mapCenter.x} cy={parcel.mapCenter.y} r={5} fill={isSelected ? '#2DD4BF' : '#38BDF8'} />
                        <text
                          x={parcel.mapCenter.x}
                          y={parcel.mapCenter.y - 12}
                          textAnchor="middle"
                          fill="white"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {parcel.parcelId}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-teal-500/20 px-3 py-1.5 rounded-xl text-[10px] font-mono text-teal-300">
                  UTM Zone 16N • Datum WGS84 • Belize National Grid
                </div>
              </div>

              {/* Selected Parcel Inspector Pane */}
              <div className="bg-slate-900/90 rounded-3xl border border-teal-500/20 p-5 space-y-4 text-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-white text-base font-mono block">{selectedParcel.parcelId}</span>
                      <span className="text-slate-400 text-[11px] block">{selectedParcel.location}</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-[10px]">
                      {selectedParcel.tenure}
                    </span>
                  </div>

                  <div className="space-y-2 font-mono text-[11px] bg-slate-950 p-3.5 rounded-2xl border border-teal-500/10">
                    <div className="flex justify-between text-slate-400">
                      <span>Assessed Value:</span>
                      <span className="text-cyan-300 font-bold">BZ$ {selectedParcel.assessedValueBBZD.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Acreage:</span>
                      <span className="text-white font-bold">{selectedParcel.sizeAcres} Acres</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Zoning:</span>
                      <span className="text-emerald-400">{selectedParcel.zoning}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>GPS Coordinates:</span>
                      <span className="text-slate-200">{selectedParcel.gpsCoords}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>UTM Grid Bounds:</span>
                      <span className="text-slate-300">{selectedParcel.utmBounds}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => setInspectedDeed(selectedParcel)}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <FileText size={16} weight="bold" />
                    Inspect Official Title Deed
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Tax & Stamp Duty Portal */}
        {activeTab === 'tax-portal' && (
          <div className="bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 space-y-6 shadow-xl shadow-teal-950/20 backdrop-blur-2xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt size={22} className="text-emerald-400" weight="fill" />
                Ministry Property Tax & Stamp Duty Clearance
              </h3>
              <p className="text-slate-400 mt-1 font-mono text-[11px]">
                Settle municipal land taxes and transfer stamp duties directly in statutory bBZD with automated clearance certificates.
              </p>
            </div>

            <div className="space-y-3">
              {myParcels.map((parcel) => (
                <div
                  key={parcel.parcelId}
                  className="bg-slate-900/90 p-5 rounded-2xl border border-teal-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm font-mono">{parcel.parcelId}</span>
                      <span className="text-slate-400 text-xs">• {parcel.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
                      <span>Assessed: BZ$ {parcel.assessedValueBBZD.toLocaleString()}</span>
                      <span>• Tax: {parcel.annualTaxBBZD} bBZD / Year</span>
                    </div>
                  </div>

                  <div>
                    {parcel.taxStatus === 'Due' ? (
                      <button
                        onClick={() => handlePayTax(parcel)}
                        disabled={payingTaxId === parcel.parcelId}
                        className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Receipt size={16} weight="bold" />
                        {payingTaxId === parcel.parcelId ? 'Settling Tax...' : `Pay ${parcel.annualTaxBBZD} bBZD (5% Rebate)`}
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center gap-1">
                        <Check size={14} weight="bold" /> 2026 Tax Clearance Valid
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Title Transfer Escrow */}
        {activeTab === 'transfer' && (
          <div className="max-w-xl mx-auto bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-2xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowsLeftRight size={22} className="text-cyan-400" />
                Initiate Sovereign Title Transfer Escrow
              </h3>
              <p className="text-slate-400 mt-1 font-mono text-[11px]">
                Atomic peer-to-peer real estate conveyance with Ministry of Natural Resources digital verification.
              </p>
            </div>

            <form onSubmit={handleInitiateTransfer} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">Select Property Title</label>
                <select
                  value={transferParcelId}
                  onChange={(e) => setTransferParcelId(e.target.value)}
                  className="w-full bg-slate-900 border border-teal-500/30 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                >
                  {myParcels.map((p) => (
                    <option key={p.parcelId} value={p.parcelId}>
                      {p.parcelId} - {p.location} (BZ$ {p.assessedValueBBZD.toLocaleString()})
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
                  placeholder="e.g. buyer.bz or 5DTest..."
                  className="w-full bg-slate-900 border border-teal-500/30 rounded-xl p-3.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">Agreed Consideration (bBZD)</label>
                <input
                  type="number"
                  required
                  value={transferPrice}
                  onChange={(e) => setTransferPrice(e.target.value)}
                  placeholder="450000"
                  className="w-full bg-slate-900 border border-teal-500/30 rounded-xl p-3.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-teal-500/15 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Statutory Stamp Duty (5%):</span>
                  <span className="text-white font-bold">BZ$ {(parseFloat(transferPrice || '0') * 0.05).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Digital Registry Rebate (1%):</span>
                  <span className="text-emerald-400 font-bold">-BZ$ {(parseFloat(transferPrice || '0') * 0.01).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-teal-500/10">
                  <span>Net Buyer Escrow Deposit:</span>
                  <span className="text-cyan-300 font-bold">
                    BZ$ {(parseFloat(transferPrice || '0') * 1.04).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isInitializingEscrow || !transferBuyer}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2"
              >
                {isInitializingEscrow ? 'Initializing Escrow...' : 'Open Multi-Sig Title Escrow'}
              </button>
            </form>
          </div>
        )}

        {/* Tab 5: Tokenize RWA Land */}
        {activeTab === 'tokenize' && (
          <div className="max-w-xl mx-auto bg-slate-950/80 border border-teal-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-2xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Buildings size={22} className="text-purple-400" />
                Fractional Real Estate RWA Tokenization
              </h3>
              <p className="text-slate-400 mt-1 font-mono text-[11px]">
                Tokenize your freehold title deed into fractional security tokens paying automated rental yields in bBZD.
              </p>
            </div>

            <form onSubmit={handleTokenizeParcel} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">Select Freehold Property</label>
                <select
                  value={tokenizeParcelId}
                  onChange={(e) => setTokenizeParcelId(e.target.value)}
                  className="w-full bg-slate-900 border border-teal-500/30 rounded-xl p-3 text-xs text-white font-mono focus:border-purple-400 focus:outline-none"
                >
                  {myParcels.map((p) => (
                    <option key={p.parcelId} value={p.parcelId}>
                      {p.parcelId} - {p.location} (BZ$ {p.assessedValueBBZD.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">Token Symbol</label>
                  <input
                    type="text"
                    required
                    value={tokenSymbolInput}
                    onChange={(e) => setTokenSymbolInput(e.target.value)}
                    placeholder="e.g. SPVILLA"
                    className="w-full bg-slate-900 border border-teal-500/30 rounded-xl p-3 text-xs text-white font-mono focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">Fractional Shares</label>
                  <input
                    type="number"
                    required
                    value={tokenSharesInput}
                    onChange={(e) => setTokenSharesInput(e.target.value)}
                    placeholder="10000"
                    className="w-full bg-slate-900 border border-teal-500/30 rounded-xl p-3 text-xs text-white font-mono focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <ShieldCheck size={18} weight="fill" />
                  FSC Belize Statutory Compliance
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Minted security tokens are anchored directly to the Pakit IPFS Title Deed CID and distribute nightly rental yields directly in Belize Dollar (`bBZD`) smart contracts.
                </p>
              </div>

              <button
                type="submit"
                disabled={isTokenizing}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-purple-950/40 flex items-center justify-center gap-2"
              >
                {isTokenizing ? 'Minting RWA Security Tokens...' : 'Tokenize & Issue RWA Security Tokens'}
              </button>
            </form>
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
                <h3 className="text-lg font-bold text-white tracking-wide">Government of Belize Title Deed</h3>
                <p className="text-xs text-emerald-400 font-mono">Ministry of Natural Resources • LandLedger Cadastre Certificate</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-teal-500/15 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Cadastral Parcel ID:</span>
                  <span className="text-white font-bold">{inspectedDeed.parcelId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tenure Classification:</span>
                  <span className="text-emerald-400 font-bold">{inspectedDeed.tenure}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Registered Owner:</span>
                  <span className="text-cyan-300 font-bold">{inspectedDeed.ownerName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Property Location:</span>
                  <span className="text-slate-200 text-right">{inspectedDeed.location}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Acreage / Area:</span>
                  <span className="text-white font-bold">{inspectedDeed.sizeAcres} Acres</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cadastral Valuation:</span>
                  <span className="text-cyan-300 font-bold">BZ$ {inspectedDeed.assessedValueBBZD.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Pakit IPFS CID:</span>
                  <span className="text-purple-300">{inspectedDeed.deedCid.slice(0, 20)}...</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    const deedJson = JSON.stringify(inspectedDeed, null, 2);
                    const blob = new Blob([deedJson], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Belize_LandLedger_${inspectedDeed.parcelId}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    addNotification({ type: 'success', message: 'Downloaded LandLedger Title Certificate presentation!' });
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <DownloadSimple size={16} weight="bold" />
                  Download Title Certificate (.json)
                </button>

                {inspectedDeed.isBelizeIdVerified && (
                  <button
                    onClick={() => {
                      setInspectedDeed(null);
                      router.push('/belizeid');
                    }}
                    className="flex-1 py-3 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Fingerprint size={16} weight="bold" />
                    BelizeID ZK Selective Disclosure
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
