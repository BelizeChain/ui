'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  Globe,
  MagnifyingGlass,
  ShoppingCart,
  LockKey,
  Plus,
  CheckCircle,
  Clock,
  ArrowLeft,
  X,
  UploadSimple,
  Tag,
  Storefront,
  CloudArrowUp,
  Sparkle,
  Copy,
  Coins,
  Check,
  ShareNetwork,
  ArrowsClockwise,
  ShieldCheck,
  Fingerprint,
  FileText,
  Lightning,
} from 'phosphor-react';

interface DnsRecord {
  type: 'SS58' | 'DID' | 'RWA' | 'TXT' | 'IPFS' | 'A' | 'CNAME';
  key: string;
  value: string;
}

interface DomainRecord {
  name: string;
  tld: '.bz' | '.caye' | '.belize';
  owner: string;
  resolvedAddress: string;
  didIdentifier?: string;
  landLedgerParcelId?: string;
  ipfsContentCid?: string;
  subdomains: string[];
  expires: string;
  records: DnsRecord[];
  isPrimary?: boolean;
}

interface MarketListing {
  name: string;
  tld: '.bz' | '.caye' | '.belize';
  priceDalla: number;
  priceBBZD: number;
  seller: string;
  category: 'Commercial' | 'Tourism' | 'Premium' | 'Civic';
  featured?: boolean;
}

const INITIAL_MARKET_LISTINGS: MarketListing[] = [
  { name: 'belize', tld: '.caye', priceDalla: 2500, priceBBZD: 12500, seller: 'r1Sa...9sj24', category: 'Premium', featured: true },
  { name: 'resort', tld: '.bz', priceDalla: 1200, priceBBZD: 6000, seller: '5FHn...94ty', category: 'Tourism' },
  { name: 'diving', tld: '.bz', priceDalla: 850, priceBBZD: 4250, seller: '5FLS...59Y', category: 'Tourism' },
  { name: 'bank', tld: '.belize', priceDalla: 5000, priceBBZD: 25000, seller: '5Grw...11QA', category: 'Commercial', featured: true },
  { name: 'ambergris', tld: '.caye', priceDalla: 3200, priceBBZD: 16000, seller: '5DTest...9981', category: 'Premium' },
  { name: 'belmopan', tld: '.belize', priceDalla: 4500, priceBBZD: 22500, seller: 'r1UW...2501', category: 'Civic', featured: true },
  { name: 'barrier-reef', tld: '.bz', priceDalla: 1800, priceBBZD: 9000, seller: 'r1XM...9902', category: 'Tourism' },
];

export default function BNSPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'my-domains' | 'register' | 'dns-records' | 'hosting' | 'marketplace'>('my-domains');
  const [searchName, setSearchName] = useState('');
  const [selectedTld, setSelectedTld] = useState<'.bz' | '.caye' | '.belize'>('.bz');
  const [regYears, setRegYears] = useState(1);
  const [autoBindDid, setAutoBindDid] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Selected Domain for Record / Subdomain Editing
  const [selectedDomainIndex, setSelectedDomainIndex] = useState<number>(0);

  // Subdomain Creation Form
  const [newSubdomainPrefix, setNewSubdomainPrefix] = useState('');
  const [isAddingSubdomain, setIsAddingSubdomain] = useState(false);

  // IPFS Hosting Update Form
  const [newIpfsCid, setNewIpfsCid] = useState('');
  const [isUpdatingCid, setIsUpdatingCid] = useState(false);

  // New DNS Record Form
  const [newRecordType, setNewRecordType] = useState<DnsRecord['type']>('TXT');
  const [newRecordKey, setNewRecordKey] = useState('');
  const [newRecordValue, setNewRecordValue] = useState('');

  // Marketplace Category Filter
  const [marketCategoryFilter, setMarketCategoryFilter] = useState<'All' | 'Premium' | 'Tourism' | 'Commercial' | 'Civic'>('All');

  // Listing for Sale Form
  const [listPriceDalla, setListPriceDalla] = useState('');
  const [showListModal, setShowListModal] = useState(false);
  const [domainToList, setDomainToList] = useState<DomainRecord | null>(null);

  const [myDomains, setMyDomains] = useState<DomainRecord[]>([
    {
      name: 'wicked',
      tld: '.bz',
      owner: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      resolvedAddress: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      didIdentifier: 'did:belize:cit:2026:88942-wicked',
      landLedgerParcelId: 'BZ-AMB-2026-0782',
      ipfsContentCid: 'QmZtmD2qtQgStation89uVb1e4R8W3c8jE7a',
      subdomains: ['pay.wicked.bz', 'api.wicked.bz', 'dao.wicked.bz'],
      expires: 'Aug 2030',
      isPrimary: true,
      records: [
        { type: 'SS58', key: 'crypto.substrate', value: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24' },
        { type: 'DID', key: 'identity.w3c', value: 'did:belize:cit:2026:88942-wicked' },
        { type: 'RWA', key: 'landledger.deed', value: 'BZ-AMB-2026-0782 (Ambergris Caye Beachfront)' },
        { type: 'TXT', key: 'email', value: 'admin@wicked.bz' },
        { type: 'IPFS', key: 'dapp.root', value: 'QmZtmD2qtQgStation89uVb1e4R8W3c8jE7a' },
      ],
    },
    {
      name: 'sanpedro',
      tld: '.caye',
      owner: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      resolvedAddress: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      didIdentifier: 'did:belize:org:sanpedro-caye',
      landLedgerParcelId: 'BZ-AMB-2026-0104',
      ipfsContentCid: 'QmYwAPJzv5CZsnA625s3Xf2nemtK7mP8q',
      subdomains: ['resort.sanpedro.caye', 'marina.sanpedro.caye'],
      expires: 'Jan 2029',
      isPrimary: false,
      records: [
        { type: 'SS58', key: 'crypto.substrate', value: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24' },
        { type: 'DID', key: 'identity.w3c', value: 'did:belize:org:sanpedro-caye' },
        { type: 'RWA', key: 'landledger.deed', value: 'BZ-AMB-2026-0104 (San Pedro Marina Commercial)' },
        { type: 'TXT', key: 'location', value: 'San Pedro Town, Ambergris Caye, Belize' },
      ],
    },
  ]);

  const [marketListings, setMarketListings] = useState<MarketListing[]>(INITIAL_MARKET_LISTINGS);

  const currentDomain = myDomains[selectedDomainIndex] || myDomains[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    addNotification({ type: 'success', message: `Copied to clipboard: ${text.slice(0, 16)}...` });
  };

  // Domain search availability simulation
  const searchAvailability = useMemo(() => {
    if (!searchName.trim()) return null;
    const clean = searchName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const isTaken = myDomains.some((d) => d.name === clean && d.tld === selectedTld);
    const isMarket = marketListings.some((m) => m.name === clean && m.tld === selectedTld);
    const isReserved = ['government', 'police', 'centralbank', 'customs', 'defense'].includes(clean);

    let pricePerYearDalla = 10;
    if (clean.length <= 3) pricePerYearDalla = 50;
    else if (clean.length <= 5) pricePerYearDalla = 20;

    return {
      name: clean,
      tld: selectedTld,
      available: !isTaken && !isMarket && !isReserved,
      isReserved,
      pricePerYearDalla,
      category: clean.length <= 3 ? 'Super Premium' : clean.length <= 5 ? 'Premium' : 'Standard',
    };
  }, [searchName, selectedTld, myDomains, marketListings]);

  // Handle Domain Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchAvailability || !searchAvailability.available || !selectedAccount?.address) return;

    setIsRegistering(true);
    setTimeout(() => {
      setIsRegistering(false);
      const userAddr = selectedAccount.address;
      const initialRecords: DnsRecord[] = [
        { type: 'SS58', key: 'crypto.substrate', value: userAddr },
      ];

      if (autoBindDid) {
        initialRecords.push({
          type: 'DID',
          key: 'identity.w3c',
          value: `did:belize:cit:2026:${searchAvailability.name}`,
        });
      }

      const newDomain: DomainRecord = {
        name: searchAvailability.name,
        tld: selectedTld,
        owner: userAddr,
        resolvedAddress: userAddr,
        didIdentifier: autoBindDid ? `did:belize:cit:2026:${searchAvailability.name}` : undefined,
        subdomains: [],
        expires: `Sep ${2026 + regYears}`,
        isPrimary: myDomains.length === 0,
        records: initialRecords,
      };

      setMyDomains([newDomain, ...myDomains]);
      addNotification({
        type: 'success',
        message: `Registered sovereign domain ${searchAvailability.name}${selectedTld} for ${regYears} year(s) on BelizeChain!`,
      });
      setSearchName('');
      setActiveTab('my-domains');
    }, 1200);
  };

  // Set Primary Domain
  const handleSetPrimary = (index: number) => {
    const updated = myDomains.map((d, i) => ({
      ...d,
      isPrimary: i === index,
    }));
    setMyDomains(updated);
    addNotification({
      type: 'success',
      message: `Set ${updated[index].name}${updated[index].tld} as your primary sovereign reverse handle!`,
    });
  };

  // Handle Add Subdomain
  const handleAddSubdomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubdomainPrefix.trim() || !currentDomain) return;

    setIsAddingSubdomain(true);
    setTimeout(() => {
      const cleanPrefix = newSubdomainPrefix.toLowerCase().replace(/[^a-z0-9-]/g, '');
      const fullSubdomain = `${cleanPrefix}.${currentDomain.name}${currentDomain.tld}`;
      
      if (!currentDomain.subdomains.includes(fullSubdomain)) {
        currentDomain.subdomains.push(fullSubdomain);
        setMyDomains([...myDomains]);
        addNotification({
          type: 'success',
          message: `Anchored subdomain ${fullSubdomain} to ${currentDomain.name}${currentDomain.tld}!`,
        });
      }
      setIsAddingSubdomain(false);
      setNewSubdomainPrefix('');
    }, 800);
  };

  // Handle Add DNS Record
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordKey.trim() || !newRecordValue.trim() || !currentDomain) return;

    currentDomain.records.push({
      type: newRecordType,
      key: newRecordKey.trim(),
      value: newRecordValue.trim(),
    });

    setMyDomains([...myDomains]);
    setNewRecordKey('');
    setNewRecordValue('');
    addNotification({
      type: 'success',
      message: `Anchored ${newRecordType} record [${newRecordKey}] on ${currentDomain.name}${currentDomain.tld}`,
    });
  };

  // Quick Anchor BelizeID
  const handleQuickAnchorBelizeID = () => {
    if (!currentDomain) return;
    const didVal = `did:belize:cit:2026:88942-${currentDomain.name}`;
    currentDomain.didIdentifier = didVal;
    
    // Check if record exists
    const existing = currentDomain.records.find((r) => r.type === 'DID');
    if (existing) {
      existing.value = didVal;
    } else {
      currentDomain.records.push({ type: 'DID', key: 'identity.w3c', value: didVal });
    }
    setMyDomains([...myDomains]);
    addNotification({
      type: 'success',
      message: `Bound BelizeID DID (${didVal}) to ${currentDomain.name}${currentDomain.tld}!`,
    });
  };

  // Quick Anchor LandLedger Deed
  const handleQuickAnchorLandLedger = () => {
    if (!currentDomain) return;
    const deedParcel = 'BZ-AMB-2026-0782';
    currentDomain.landLedgerParcelId = deedParcel;
    
    const existing = currentDomain.records.find((r) => r.type === 'RWA');
    if (existing) {
      existing.value = `${deedParcel} (Ambergris Caye Beachfront)`;
    } else {
      currentDomain.records.push({
        type: 'RWA',
        key: 'landledger.deed',
        value: `${deedParcel} (Ambergris Caye Beachfront)`,
      });
    }
    setMyDomains([...myDomains]);
    addNotification({
      type: 'success',
      message: `Anchored LandLedger Deed ${deedParcel} to ${currentDomain.name}${currentDomain.tld}!`,
    });
  };

  // Handle IPFS CID Update
  const handleUpdateIpfsCid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpfsCid.trim() || !currentDomain) return;

    setIsUpdatingCid(true);
    setTimeout(() => {
      currentDomain.ipfsContentCid = newIpfsCid.trim();
      
      const existing = currentDomain.records.find((r) => r.type === 'IPFS');
      if (existing) {
        existing.value = newIpfsCid.trim();
      } else {
        currentDomain.records.push({ type: 'IPFS', key: 'dapp.root', value: newIpfsCid.trim() });
      }

      setMyDomains([...myDomains]);
      setIsUpdatingCid(false);
      setNewIpfsCid('');
      addNotification({
        type: 'success',
        message: `Deployed Pakit IPFS Website CID to ${currentDomain.name}${currentDomain.tld}!`,
      });
    }, 900);
  };

  // Handle Buy Marketplace Domain
  const handleBuyMarketDomain = (item: MarketListing) => {
    if (!selectedAccount?.address) return;

    const newDomain: DomainRecord = {
      name: item.name,
      tld: item.tld,
      owner: selectedAccount.address,
      resolvedAddress: selectedAccount.address,
      subdomains: [],
      expires: 'Aug 2028',
      isPrimary: false,
      records: [
        { type: 'SS58', key: 'crypto.substrate', value: selectedAccount.address },
        { type: 'DID', key: 'identity.w3c', value: `did:belize:cit:${item.name}` },
      ],
    };

    setMyDomains([newDomain, ...myDomains]);
    setMarketListings(marketListings.filter((m) => !(m.name === item.name && m.tld === item.tld)));
    addNotification({
      type: 'success',
      message: `Atomic Escrow Settled! Acquired ${item.name}${item.tld} for ${item.priceDalla.toLocaleString()} Ɗ!`,
    });
  };

  // Handle List for Sale
  const handleListDomainForSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainToList || !listPriceDalla) return;

    const price = parseFloat(listPriceDalla);
    if (isNaN(price) || price <= 0) {
      addNotification({ type: 'error', message: 'Please enter a valid price in DALLA' });
      return;
    }

    const newListing: MarketListing = {
      name: domainToList.name,
      tld: domainToList.tld,
      priceDalla: price,
      priceBBZD: price * 5,
      seller: `${selectedAccount?.address?.slice(0, 4)}...${selectedAccount?.address?.slice(-4)}`,
      category: 'Premium',
    };

    setMarketListings([newListing, ...marketListings]);
    setShowListModal(false);
    setListPriceDalla('');
    setDomainToList(null);
    addNotification({
      type: 'success',
      message: `Listed ${domainToList.name}${domainToList.tld} on P2P Marketplace for ${price} Ɗ!`,
    });
  };

  const filteredMarketListings = useMemo(() => {
    if (marketCategoryFilter === 'All') return marketListings;
    return marketListings.filter((m) => m.category === marketCategoryFilter);
  }, [marketListings, marketCategoryFilter]);

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to register and manage Belize Name Service (.bz, .caye, .belize) sovereign domains."
        fullScreen
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#030914] text-slate-100 flex flex-col font-sans pb-28 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-cyan-600/15 via-teal-900/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-[20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-bl from-blue-600/10 via-emerald-950/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[25%] w-[650px] h-[500px] bg-gradient-to-t from-teal-800/10 via-cyan-950/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-[#030914]/80 backdrop-blur-2xl border-b border-cyan-500/15 shadow-lg shadow-cyan-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button
                title="Return to Maya Wallet"
                className="p-2.5 bg-slate-900/80 hover:bg-slate-800 rounded-2xl text-slate-300 hover:text-cyan-300 transition-all border border-cyan-500/20 shadow-inner group"
              >
                <ArrowLeft size={20} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5 tracking-tight">
                <span className="p-1.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 text-cyan-400">
                  <Globe size={20} weight="bold" />
                </span>
                <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                  Belize Name Service
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-500/30 hidden sm:inline-block">
                  .bz • .caye • .belize
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Sovereign Web3 Identifiers • Pakit IPFS DApp Hosting • DID & LandLedger Gateway
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <ShieldCheck size={15} weight="fill" className="text-emerald-400" />
              BNS Consensus Anchored
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Registered Domains */}
          <div className="bg-slate-900/60 border border-cyan-500/20 hover:border-cyan-500/40 rounded-3xl p-5 shadow-xl shadow-cyan-950/10 backdrop-blur-xl space-y-3 transition-all">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-cyan-300/80">Active Domains</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Globe size={18} weight="bold" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                {myDomains.length}
              </span>
              <span className="text-xs text-slate-400 ml-2 font-mono">Sovereign Names</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
              <span>Total Subdomains:</span>
              <span className="text-cyan-300 font-bold">
                {myDomains.reduce((acc, d) => acc + d.subdomains.length, 0)} Active
              </span>
            </div>
          </div>

          {/* Card 2: Primary Web3 Handle */}
          <div className="bg-slate-900/60 border border-purple-500/20 hover:border-purple-500/40 rounded-3xl p-5 shadow-xl shadow-purple-950/10 backdrop-blur-xl space-y-3 transition-all">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-purple-300/80">Primary Citizen Handle</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Fingerprint size={18} weight="bold" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-purple-300 tracking-tight">
                {myDomains.find((d) => d.isPrimary)?.name || 'None'}
                <span className="text-purple-400 text-lg">{myDomains.find((d) => d.isPrimary)?.tld || ''}</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
              <span>Reverse DID:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle size={13} weight="fill" /> Active Resolution
              </span>
            </div>
          </div>

          {/* Card 3: Decentralized IPFS Web Apps */}
          <div className="bg-slate-900/60 border border-emerald-500/20 hover:border-emerald-500/40 rounded-3xl p-5 shadow-xl shadow-emerald-950/10 backdrop-blur-xl space-y-3 transition-all">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-emerald-300/80">Pakit Hosted DApps</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CloudArrowUp size={18} weight="bold" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-300 tracking-tight">
                {myDomains.filter((d) => d.ipfsContentCid).length}
              </span>
              <span className="text-xs text-slate-400 ml-2 font-mono">Live Sites</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
              <span>Decentralized Swarm:</span>
              <span className="text-emerald-400 font-bold">Pakit DAG Node</span>
            </div>
          </div>

          {/* Card 4: Base Registration Fee */}
          <div className="bg-slate-900/60 border border-amber-500/20 hover:border-amber-500/40 rounded-3xl p-5 shadow-xl shadow-amber-950/10 backdrop-blur-xl space-y-3 transition-all">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-300/80">Base Registration</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Coins size={18} weight="bold" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300 tracking-tight">
                10.00 Ɗ
              </span>
              <span className="text-xs text-slate-400 ml-1.5 font-mono">/ year</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
              <span>Pegged Equivalent:</span>
              <span className="text-cyan-300 font-bold">50.00 bBZD</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/70 border border-cyan-500/20 rounded-2xl p-1.5 overflow-x-auto text-xs font-bold gap-1.5 backdrop-blur-xl shadow-lg">
          {(
            [
              { id: 'my-domains', label: 'My Domains', icon: Globe },
              { id: 'register', label: 'Search & Register', icon: MagnifyingGlass },
              { id: 'dns-records', label: 'DNS & DID Records', icon: FileText },
              { id: 'hosting', label: 'Pakit IPFS Hosting', icon: CloudArrowUp },
              { id: 'marketplace', label: 'P2P Marketplace', icon: Storefront },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon size={16} weight={isActive ? 'bold' : 'regular'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: My Domains */}
        {activeTab === 'my-domains' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Globe size={16} className="text-cyan-400" />
                Your Registered Sovereign Domain Portfolio ({myDomains.length})
              </h2>
              <button
                onClick={() => setActiveTab('register')}
                className="px-3.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus size={14} weight="bold" /> Register New Name
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {myDomains.map((d, index) => (
                <div
                  key={`${d.name}${d.tld}`}
                  className={`bg-slate-900/60 border ${
                    d.isPrimary
                      ? 'border-cyan-500/40 shadow-xl shadow-cyan-950/30'
                      : 'border-slate-800 hover:border-cyan-500/30'
                  } rounded-3xl p-6 space-y-5 backdrop-blur-xl flex flex-col justify-between transition-all group`}
                >
                  <div className="space-y-4">
                    {/* Domain Title Bar */}
                    <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            <Globe size={22} weight="bold" />
                          </span>
                          <div>
                            <span className="font-black text-white text-xl font-mono tracking-tight">
                              {d.name}
                              <span className="text-cyan-400">{d.tld}</span>
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {d.isPrimary ? (
                                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[10px] font-bold font-mono flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                                  <Sparkle size={12} weight="fill" /> PRIMARY REVERSE HANDLE
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSetPrimary(index)}
                                  className="text-[10px] text-slate-400 hover:text-cyan-300 underline font-mono transition-colors"
                                >
                                  Set as Primary
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-[11px] font-bold font-mono flex items-center gap-1.5">
                        <Clock size={13} /> Expires {d.expires}
                      </span>
                    </div>

                    {/* Integrated Bindings & Anchors */}
                    <div className="space-y-2 bg-[#030914]/70 p-4 rounded-2xl border border-slate-800/90 font-mono text-xs">
                      {/* Substrate Address */}
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[11px]">Resolved SS58:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-200 font-bold">{d.resolvedAddress.slice(0, 12)}...{d.resolvedAddress.slice(-6)}</span>
                          <button
                            onClick={() => handleCopy(d.resolvedAddress, `ss58-${d.name}`)}
                            className="text-slate-400 hover:text-cyan-300 p-1 rounded transition-colors"
                            title="Copy Address"
                          >
                            {copiedKey === `ss58-${d.name}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* BelizeID Sovereign Passport Anchor */}
                      <div className="flex justify-between items-center text-slate-400 pt-1.5 border-t border-slate-800/50">
                        <span className="text-[11px] flex items-center gap-1">
                          <Fingerprint size={13} className="text-purple-400" /> BelizeID DID:
                        </span>
                        {d.didIdentifier ? (
                          <div className="flex items-center gap-1.5">
                            <Link href="/belizeid" className="text-purple-300 hover:text-purple-200 font-bold truncate max-w-[200px] underline decoration-purple-500/40">
                              {d.didIdentifier}
                            </Link>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedDomainIndex(index);
                              handleQuickAnchorBelizeID();
                            }}
                            className="text-[10px] text-cyan-400 hover:underline"
                          >
                            + Bind BelizeID DID
                          </button>
                        )}
                      </div>

                      {/* LandLedger Title Deed Anchor */}
                      <div className="flex justify-between items-center text-slate-400 pt-1.5 border-t border-slate-800/50">
                        <span className="text-[11px] flex items-center gap-1">
                          <ShieldCheck size={13} className="text-teal-400" /> LandLedger Deed:
                        </span>
                        {d.landLedgerParcelId ? (
                          <div className="flex items-center gap-1.5">
                            <Link href="/landledger" className="text-teal-300 hover:text-teal-200 font-bold truncate max-w-[200px] underline decoration-teal-500/40">
                              {d.landLedgerParcelId}
                            </Link>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedDomainIndex(index);
                              handleQuickAnchorLandLedger();
                            }}
                            className="text-[10px] text-cyan-400 hover:underline"
                          >
                            + Anchor Land Deed
                          </button>
                        )}
                      </div>

                      {/* IPFS Website CID */}
                      <div className="flex justify-between items-center text-slate-400 pt-1.5 border-t border-slate-800/50">
                        <span className="text-[11px] flex items-center gap-1">
                          <CloudArrowUp size={13} className="text-emerald-400" /> Pakit IPFS DApp:
                        </span>
                        {d.ipfsContentCid ? (
                          <span className="text-emerald-400 font-bold">{d.ipfsContentCid.slice(0, 14)}...</span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">No website linked</span>
                        )}
                      </div>
                    </div>

                    {/* Subdomains Chips */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                          Active Subdomains ({d.subdomains.length})
                        </span>
                        <button
                          onClick={() => {
                            setSelectedDomainIndex(index);
                            setActiveTab('dns-records');
                          }}
                          className="text-[10px] text-cyan-400 hover:underline font-mono"
                        >
                          + Create Subdomain
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {d.subdomains.length > 0 ? (
                          d.subdomains.map((sub) => (
                            <span
                              key={sub}
                              className="px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 rounded-xl text-cyan-300 text-[11px] font-mono hover:border-cyan-500/40 transition-colors"
                            >
                              {sub}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-xs italic font-mono">No subdomains created yet.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        setSelectedDomainIndex(index);
                        setActiveTab('dns-records');
                      }}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700/80 text-slate-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700/50"
                    >
                      <FileText size={15} /> Records
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDomainIndex(index);
                        setActiveTab('hosting');
                      }}
                      className="py-2.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-emerald-500/30"
                    >
                      <CloudArrowUp size={15} weight="bold" /> IPFS Web
                    </button>
                    <button
                      onClick={() => {
                        setDomainToList(d);
                        setShowListModal(true);
                      }}
                      className="py-2.5 px-3 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-purple-500/30"
                    >
                      <Storefront size={15} weight="bold" /> List P2P
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Live Sovereign Name Search & Registrar */}
        {activeTab === 'register' && (
          <div className="max-w-2xl mx-auto bg-slate-900/60 border border-cyan-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2.5 tracking-tight">
                <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <MagnifyingGlass size={22} weight="bold" />
                </span>
                Live Sovereign Name Search & Registrar
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Claim your sovereign .bz, .caye, or .belize Web3 domain directly on BelizeChain consensus.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5 text-xs">
              <div>
                <label className="text-slate-400 uppercase font-bold mb-1.5 block text-[11px] tracking-wider">
                  Domain Name
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      placeholder="e.g. belmopan, reef, mybiz"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className="w-full bg-[#030914] border border-cyan-500/30 rounded-2xl p-4 text-sm text-white font-mono placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 shadow-inner"
                    />
                  </div>
                  <select
                    value={selectedTld}
                    onChange={(e) => setSelectedTld(e.target.value as any)}
                    className="bg-[#030914] border border-cyan-500/30 rounded-2xl px-4 py-3 text-sm font-bold text-cyan-300 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value=".bz">.bz (Belize Sovereign)</option>
                    <option value=".caye">.caye (Islands & Tourism)</option>
                    <option value=".belize">.belize (National Civic)</option>
                  </select>
                </div>
              </div>

              {/* Live Availability Feedback Banner */}
              {searchAvailability && (
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    searchAvailability.available
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                  } space-y-2`}
                >
                  <div className="flex justify-between items-center font-mono">
                    <span className="font-black text-base">
                      {searchAvailability.name}
                      <span className="text-cyan-300">{searchAvailability.tld}</span>
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-current bg-black/20">
                      {searchAvailability.available
                        ? 'AVAILABLE FOR REGISTRATION'
                        : searchAvailability.isReserved
                        ? 'RESERVED GOVERNMENT DOMAIN'
                        : 'ALREADY REGISTERED ON CHAIN'}
                    </span>
                  </div>
                  {searchAvailability.available && (
                    <div className="flex justify-between items-center text-[11px] text-slate-300 pt-1 border-t border-emerald-500/20">
                      <span>Tier: <strong className="text-white">{searchAvailability.category}</strong></span>
                      <span>Standard rate: <strong className="text-emerald-300">{searchAvailability.pricePerYearDalla}.00 Ɗ</strong> (~{(searchAvailability.pricePerYearDalla * 5).toFixed(2)} bBZD) / year</span>
                    </div>
                  )}
                </div>
              )}

              {/* Registration Duration Selector */}
              <div>
                <label className="text-slate-400 uppercase font-bold mb-1.5 block text-[11px] tracking-wider">
                  Registration Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setRegYears(y)}
                      className={`py-3 rounded-2xl font-bold text-xs border transition-all ${
                        regYears === y
                          ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black border-cyan-400 shadow-md shadow-cyan-500/20'
                          : 'bg-[#030914] border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/30'
                      }`}
                    >
                      {y} Year{y > 1 ? 's' : ''}
                      {y === 5 && <span className="block text-[9px] text-slate-950 font-black uppercase">Save 20%</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-Bind Options */}
              <div className="bg-[#030914]/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-slate-300 font-bold text-xs block">Sovereign Bindings:</span>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoBindDid}
                    onChange={(e) => setAutoBindDid(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-500"
                  />
                  <span className="text-slate-300 text-xs">
                    Automatically mint & bind <strong>BelizeID Sovereign DID</strong> (<code>did:belize:cit:2026:{searchName || 'name'}</code>)
                  </span>
                </label>
              </div>

              {/* Price Calculation Box */}
              <div className="bg-[#030914] p-4 rounded-2xl border border-cyan-500/20 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Price per year:</span>
                  <span className="text-white font-bold">
                    {searchAvailability?.pricePerYearDalla || 10}.00 Ɗ
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1.5 border-t border-slate-800">
                  <span>Total Registration Cost ({regYears} yr):</span>
                  <span className="text-emerald-400 font-black text-sm">
                    {(searchAvailability?.pricePerYearDalla || 10) * regYears}.00 Ɗ (~{((searchAvailability?.pricePerYearDalla || 10) * regYears * 5).toFixed(2)} bBZD)
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering || !searchAvailability || !searchAvailability.available}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 disabled:opacity-40 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2"
              >
                {isRegistering ? (
                  <>
                    <ArrowsClockwise size={16} className="animate-spin" /> Anchoring to BelizeChain Consensus...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} weight="bold" /> Register {searchName || 'Domain'}{selectedTld}
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: DNS & DID Records */}
        {activeTab === 'dns-records' && (
          <div className="bg-slate-900/60 border border-cyan-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2.5 tracking-tight">
                  <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <FileText size={22} weight="bold" />
                  </span>
                  DNS, DID & RWA Record Manager
                </h3>
                <p className="text-slate-400 mt-1 text-xs">
                  Configure Substrate addresses, W3C DIDs, LandLedger deeds, and IPFS CIDs for{' '}
                  <span className="text-cyan-300 font-mono font-bold">
                    {currentDomain.name}
                    {currentDomain.tld}
                  </span>
                </p>
              </div>

              {/* Domain Selector */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-xs">Domain:</span>
                <select
                  value={selectedDomainIndex}
                  onChange={(e) => setSelectedDomainIndex(parseInt(e.target.value))}
                  className="bg-[#030914] border border-cyan-500/30 rounded-xl p-2.5 text-xs text-cyan-300 font-mono font-bold focus:border-cyan-400 focus:outline-none"
                >
                  {myDomains.map((d, i) => (
                    <option key={`${d.name}${d.tld}`} value={i}>
                      {d.name}{d.tld}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Anchor Action Bar */}
            <div className="flex flex-wrap gap-2.5 p-3.5 bg-[#030914]/80 rounded-2xl border border-cyan-500/20 items-center justify-between">
              <span className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                <Lightning size={16} className="text-amber-400" weight="fill" /> Quick Sovereign Anchors:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleQuickAnchorBelizeID}
                  className="px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all"
                >
                  <Fingerprint size={14} weight="bold" /> Bind BelizeID Passport
                </button>
                <button
                  type="button"
                  onClick={handleQuickAnchorLandLedger}
                  className="px-3 py-1.5 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all"
                >
                  <ShieldCheck size={14} weight="bold" /> Anchor Land Deed
                </button>
              </div>
            </div>

            {/* Current Records Table */}
            <div className="space-y-3">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                Active Consensus Records ({currentDomain.records.length})
              </span>
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="text-slate-500 bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase">
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Key / Protocol</th>
                      <th className="p-3.5">Value / Target Identifier</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-[#030914]">
                    {currentDomain.records.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black border ${
                            rec.type === 'DID'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : rec.type === 'RWA'
                              ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                              : rec.type === 'SS58'
                              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                              : rec.type === 'IPFS'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {rec.type}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-200 font-bold">{rec.key}</td>
                        <td className="p-3.5 text-slate-300 truncate max-w-md">{rec.value}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              currentDomain.records.splice(idx, 1);
                              setMyDomains([...myDomains]);
                              addNotification({ type: 'success', message: `Removed record ${rec.key}` });
                            }}
                            className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                            title="Remove Record"
                          >
                            <X size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add New Record Form */}
            <form onSubmit={handleAddRecord} className="bg-[#030914] p-5 rounded-2xl border border-cyan-500/20 space-y-4">
              <span className="font-bold text-white text-xs block">Add New DNS / DID / RWA Record</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block text-[10px]">Record Type</label>
                  <select
                    value={newRecordType}
                    onChange={(e) => setNewRecordType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
                  >
                    <option value="TXT">TXT (Custom Text / Email)</option>
                    <option value="SS58">SS58 (Crypto Address)</option>
                    <option value="DID">DID (W3C Sovereign Identity)</option>
                    <option value="RWA">RWA (LandLedger Title Deed)</option>
                    <option value="IPFS">IPFS (Pakit CID)</option>
                    <option value="A">A (IPv4)</option>
                    <option value="CNAME">CNAME (Alias)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block text-[10px]">Record Key / Host</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. twitter, email, crypto.eth"
                    value={newRecordKey}
                    onChange={(e) => setNewRecordKey(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block text-[10px]">Record Value</label>
                  <input
                    type="text"
                    required
                    placeholder="Target address, DID or value..."
                    value={newRecordValue}
                    onChange={(e) => setNewRecordValue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="py-3 px-6 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-cyan-500/20"
              >
                <Plus size={16} weight="bold" /> Anchor Record to Domain
              </button>
            </form>

            {/* Subdomain Management */}
            <div className="bg-[#030914] p-5 rounded-2xl border border-cyan-500/20 space-y-4">
              <span className="font-bold text-white text-xs block">
                Manage Subdomains for {currentDomain.name}{currentDomain.tld}
              </span>
              <form onSubmit={handleAddSubdomain} className="flex gap-2">
                <div className="flex-1 flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="e.g. pay, api, vault"
                    value={newSubdomainPrefix}
                    onChange={(e) => setNewSubdomainPrefix(e.target.value)}
                    className="bg-transparent border-none text-white font-mono focus:outline-none flex-1 py-3"
                  />
                  <span className="text-cyan-400 font-mono font-bold">
                    .{currentDomain.name}{currentDomain.tld}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={isAddingSubdomain || !newSubdomainPrefix.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Plus size={16} weight="bold" />
                  {isAddingSubdomain ? 'Creating...' : 'Create Subdomain'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 4: IPFS Web Hosting */}
        {activeTab === 'hosting' && (
          <div className="bg-slate-900/60 border border-cyan-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl text-xs">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2.5 tracking-tight">
                <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <CloudArrowUp size={22} weight="bold" />
                </span>
                Decentralized Pakit IPFS Website Hosting
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Link your sovereign BNS domain directly to frontend IPFS directory CIDs stored across the Pakit node network.
              </p>
            </div>

            <div className="space-y-4">
              {myDomains.map((d, i) => (
                <div
                  key={`${d.name}${d.tld}`}
                  className="bg-[#030914] p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-500/30 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-white text-base font-mono">
                        {d.name}{d.tld}
                      </span>
                      {d.ipfsContentCid ? (
                        <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle size={12} weight="fill" /> Live on Pakit IPFS
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 rounded-full text-[10px]">
                          No CID Linked
                        </span>
                      )}
                    </div>
                    {d.ipfsContentCid && (
                      <p className="text-slate-400 text-xs font-mono">
                        Public Gateway:{' '}
                        <a
                          href={`https://ipfs.belizechain.org/ipfs/${d.ipfsContentCid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-300 underline hover:text-cyan-200 truncate inline-block max-w-sm"
                        >
                          https://ipfs.belizechain.org/ipfs/{d.ipfsContentCid}
                        </a>
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setNewIpfsCid(d.ipfsContentCid || '');
                        setSelectedDomainIndex(i);
                      }}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all border border-slate-700/50"
                    >
                      Update CID
                    </button>
                    {d.ipfsContentCid && (
                      <a
                        href={`https://ipfs.belizechain.org/ipfs/${d.ipfsContentCid}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs transition-all border border-emerald-500/30 flex items-center gap-1"
                      >
                        Launch DApp
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Update CID Form */}
            <form onSubmit={handleUpdateIpfsCid} className="bg-[#030914] p-5 rounded-2xl border border-emerald-500/20 space-y-4">
              <span className="font-bold text-white text-xs block">
                Update IPFS CID for {currentDomain.name}{currentDomain.tld}
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="QmZtmD... or bafybeic..."
                  value={newIpfsCid}
                  onChange={(e) => setNewIpfsCid(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isUpdatingCid || !newIpfsCid.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <CloudArrowUp size={16} weight="bold" />
                  {isUpdatingCid ? 'Publishing...' : 'Deploy to Domain'}
                </button>
              </div>

              {/* Sample Starters */}
              <div className="pt-2">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-1.5">
                  Demo Web DApp Starter Templates:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNewIpfsCid('QmZtmD2qtQgStation89uVb1e4R8W3c8jE7a')}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/30 rounded-lg text-slate-300 text-[10px] font-mono transition-colors"
                  >
                    Maya Portfolio Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewIpfsCid('QmYwAPJzv5CZsnA625s3Xf2nemtK7mP8q')}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/30 rounded-lg text-slate-300 text-[10px] font-mono transition-colors"
                  >
                    Resort & Tourism Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewIpfsCid('bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku')}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/30 rounded-lg text-slate-300 text-[10px] font-mono transition-colors"
                  >
                    Decentralized Storefront
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Tab 5: P2P Marketplace */}
        {activeTab === 'marketplace' && (
          <div className="bg-slate-900/60 border border-cyan-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2.5 tracking-tight">
                  <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Storefront size={22} weight="bold" />
                  </span>
                  BNS Sovereign Domain Marketplace
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Trade verified Belizean domains and national commercial handles with instant atomic escrow settlement.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 bg-[#030914] p-1.5 rounded-2xl border border-slate-800">
                {(['All', 'Premium', 'Tourism', 'Commercial', 'Civic'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMarketCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                      marketCategoryFilter === cat
                        ? 'bg-purple-500 text-white font-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMarketListings.map((item) => (
                <div
                  key={`${item.name}${item.tld}`}
                  className="bg-[#030914] p-5 rounded-3xl border border-slate-800 hover:border-purple-500/40 space-y-4 transition-all shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-black text-white text-lg font-mono block tracking-tight">
                          {item.name}
                          <span className="text-cyan-400">{item.tld}</span>
                        </span>
                        <span className="text-slate-500 text-[10px] font-mono">Seller: {item.seller}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-full text-[10px] font-bold">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center font-mono">
                    <div>
                      <span className="text-emerald-400 font-black text-base block">
                        {item.priceDalla.toLocaleString()} Ɗ
                      </span>
                      <span className="text-slate-400 text-[10px]">BZ$ {item.priceBBZD.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => handleBuyMarketDomain(item)}
                      className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-purple-500/20"
                    >
                      Buy Escrow
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* List Domain Modal */}
      {showListModal && domainToList && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#030914] border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Storefront size={20} className="text-purple-400" />
                List {domainToList.name}{domainToList.tld}
              </h3>
              <button
                onClick={() => setShowListModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleListDomainForSale} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-bold text-[10px] block mb-1">
                  Asking Price in DALLA (Ɗ)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 500"
                  value={listPriceDalla}
                  onChange={(e) => setListPriceDalla(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white font-mono focus:border-purple-400 focus:outline-none"
                />
                {listPriceDalla && !isNaN(parseFloat(listPriceDalla)) && (
                  <p className="text-slate-400 text-[10px] mt-1 font-mono">
                    Equivalent: ~BZ$ {(parseFloat(listPriceDalla) * 5).toLocaleString()} bBZD
                  </p>
                )}
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <p>• Domain ownership transfers to atomic escrow pallet upon listing.</p>
                <p>• You may cancel the listing at any time before settlement.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-500/25"
              >
                Publish to P2P Marketplace
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
