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
  type: 'A' | 'CNAME' | 'TXT' | 'SS58' | 'DID' | 'IPFS';
  key: string;
  value: string;
}

interface DomainRecord {
  name: string;
  tld: '.bz' | '.caye' | '.belize';
  owner: string;
  resolvedAddress: string;
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
}

const INITIAL_MARKET_LISTINGS: MarketListing[] = [
  { name: 'belize', tld: '.caye', priceDalla: 2500, priceBBZD: 12500, seller: 'r1Sa...9sj24', category: 'Premium' },
  { name: 'resort', tld: '.bz', priceDalla: 1200, priceBBZD: 6000, seller: '5FHn...94ty', category: 'Tourism' },
  { name: 'diving', tld: '.bz', priceDalla: 850, priceBBZD: 4250, seller: '5FLS...59Y', category: 'Tourism' },
  { name: 'bank', tld: '.belize', priceDalla: 5000, priceBBZD: 25000, seller: '5Grw...11QA', category: 'Commercial' },
  { name: 'ambergris', tld: '.caye', priceDalla: 3200, priceBBZD: 16000, seller: '5DTest...9981', category: 'Premium' },
];

export default function BNSPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'my-domains' | 'register' | 'dns-records' | 'hosting' | 'marketplace'>('my-domains');
  const [searchName, setSearchName] = useState('');
  const [selectedTld, setSelectedTld] = useState<'.bz' | '.caye' | '.belize'>('.bz');
  const [regYears, setRegYears] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false);

  // Selected Domain for Record / Subdomain Editing
  const [selectedDomainIndex, setSelectedDomainIndex] = useState<number>(0);

  // Subdomain Creation Form
  const [newSubdomainPrefix, setNewSubdomainPrefix] = useState('');
  const [isAddingSubdomain, setIsAddingSubdomain] = useState(false);

  // IPFS Hosting Update Form
  const [newIpfsCid, setNewIpfsCid] = useState('');
  const [isUpdatingCid, setIsUpdatingCid] = useState(false);

  // New DNS Record Form
  const [newRecordType, setNewRecordType] = useState<'A' | 'CNAME' | 'TXT' | 'SS58' | 'DID'>('TXT');
  const [newRecordKey, setNewRecordKey] = useState('');
  const [newRecordValue, setNewRecordValue] = useState('');

  const [myDomains, setMyDomains] = useState<DomainRecord[]>([
    {
      name: 'wicked',
      tld: '.bz',
      owner: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      resolvedAddress: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      ipfsContentCid: 'QmZtmD2qtQgStation89uVb1e4R8W3c8jE7a',
      subdomains: ['pay.wicked.bz', 'api.wicked.bz', 'dao.wicked.bz'],
      expires: 'Aug 2030',
      isPrimary: true,
      records: [
        { type: 'SS58', key: 'crypto.substrate', value: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24' },
        { type: 'DID', key: 'identity.w3c', value: 'did:belize:cit:2026:88942-wicked' },
        { type: 'TXT', key: 'email', value: 'admin@wicked.bz' },
        { type: 'IPFS', key: 'dapp.root', value: 'QmZtmD2qtQgStation89uVb1e4R8W3c8jE7a' },
      ],
    },
    {
      name: 'sanpedro',
      tld: '.caye',
      owner: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      resolvedAddress: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      ipfsContentCid: 'QmYwAPJzv5CZsnA625s3Xf2nemtK7mP8q',
      subdomains: ['resort.sanpedro.caye'],
      expires: 'Jan 2029',
      isPrimary: false,
      records: [
        { type: 'SS58', key: 'crypto.substrate', value: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24' },
        { type: 'TXT', key: 'location', value: 'San Pedro Town, Ambergris Caye' },
      ],
    },
  ]);

  const currentDomain = myDomains[selectedDomainIndex] || myDomains[0];

  // Domain search availability simulation
  const searchAvailability = useMemo(() => {
    if (!searchName) return null;
    const clean = searchName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const isTaken = myDomains.some((d) => d.name === clean && d.tld === selectedTld);
    const isMarket = INITIAL_MARKET_LISTINGS.some((m) => m.name === clean && m.tld === selectedTld);

    return {
      name: clean,
      tld: selectedTld,
      available: !isTaken && !isMarket,
      pricePerYearDalla: clean.length <= 3 ? 50 : clean.length <= 5 ? 20 : 10,
    };
  }, [searchName, selectedTld, myDomains]);

  // Handle Domain Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchAvailability || !searchAvailability.available || !selectedAccount?.address) return;

    setIsRegistering(true);
    setTimeout(() => {
      setIsRegistering(false);
      const newDomain: DomainRecord = {
        name: searchAvailability.name,
        tld: selectedTld,
        owner: selectedAccount.address,
        resolvedAddress: selectedAccount.address,
        subdomains: [],
        expires: `Aug ${2026 + regYears}`,
        isPrimary: myDomains.length === 0,
        records: [
          { type: 'SS58', key: 'crypto.substrate', value: selectedAccount.address },
          { type: 'DID', key: 'identity.w3c', value: `did:belize:cit:${searchAvailability.name}` },
        ],
      };

      setMyDomains([newDomain, ...myDomains]);
      addNotification({
        type: 'success',
        message: `Registered ${searchAvailability.name}${selectedTld} for ${regYears} year(s) in native DALLA!`,
      });
      setSearchName('');
      setActiveTab('my-domains');
    }, 1400);
  };

  // Handle Add Subdomain
  const handleAddSubdomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubdomainPrefix || !currentDomain) return;

    setIsAddingSubdomain(true);
    setTimeout(() => {
      const fullSubdomain = `${newSubdomainPrefix.toLowerCase().replace(/[^a-z0-9-]/g, '')}.${currentDomain.name}${currentDomain.tld}`;
      currentDomain.subdomains.push(fullSubdomain);
      setIsAddingSubdomain(false);
      setNewSubdomainPrefix('');
      addNotification({
        type: 'success',
        message: `Created subdomain ${fullSubdomain} anchored to ${currentDomain.name}${currentDomain.tld}!`,
      });
    }, 1000);
  };

  // Handle Add DNS Record
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordKey || !newRecordValue || !currentDomain) return;

    currentDomain.records.push({
      type: newRecordType,
      key: newRecordKey,
      value: newRecordValue,
    });

    setNewRecordKey('');
    setNewRecordValue('');
    addNotification({
      type: 'success',
      message: `Added ${newRecordType} record [${newRecordKey}] to ${currentDomain.name}${currentDomain.tld}`,
    });
  };

  // Handle IPFS CID Update
  const handleUpdateIpfsCid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpfsCid || !currentDomain) return;

    setIsUpdatingCid(true);
    setTimeout(() => {
      currentDomain.ipfsContentCid = newIpfsCid;
      setIsUpdatingCid(false);
      setNewIpfsCid('');
      addNotification({
        type: 'success',
        message: `Updated Pakit IPFS Website CID for ${currentDomain.name}${currentDomain.tld}!`,
      });
    }, 1200);
  };

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to register and manage Belize Name Service (.bz & .caye) sovereign Web3 domains."
        fullScreen
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button
                title="Return to Maya Wallet"
                className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-all border border-slate-700/50"
              >
                <ArrowLeft size={20} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe size={22} className="text-cyan-400" />
                Belize Name Service (.bz, .caye, .belize)
              </h1>
              <p className="text-xs text-slate-400">
                Sovereign Web3 DNS Registrar • IPFS Web Hosting • Subdomain Gateways • Escrow Market
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold font-mono flex items-center gap-1.5">
              <ShieldCheck size={14} weight="fill" />
              BNS Consensus Anchored
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Registered Domains */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">My Active Domains</span>
              <Globe size={18} className="text-cyan-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-white">{myDomains.length} Domains</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Subdomains:</span>
              <span className="text-cyan-300 font-bold">
                {myDomains.reduce((acc, d) => acc + d.subdomains.length, 0)} Active
              </span>
            </div>
          </div>

          {/* Card 2: Primary Web3 Handle */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Primary Citizen Handle</span>
              <Fingerprint size={18} className="text-purple-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-purple-300">
                {myDomains.find((d) => d.isPrimary)?.name || 'wicked'}.bz
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Resolution:</span>
              <span className="text-emerald-400 font-bold">Reverse DID Bound</span>
            </div>
          </div>

          {/* Card 3: Decentralized IPFS Web Apps */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">IPFS Hosted DApps</span>
              <CloudArrowUp size={18} className="text-emerald-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-emerald-300">
                {myDomains.filter((d) => d.ipfsContentCid).length} Live Sites
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Storage Node:</span>
              <span className="text-slate-300">Pakit Zero-Knowledge</span>
            </div>
          </div>

          {/* Card 4: Base Registration Fee */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Base Registrar Fee</span>
              <Coins size={18} className="text-amber-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-amber-300">10.00 Ɗ</span>
              <span className="text-xs text-slate-400 ml-1">/ year</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Payment Tiers:</span>
              <span className="text-cyan-300 font-bold">DALLA / bBZD</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-2xl p-1 overflow-x-auto text-xs font-bold gap-1">
          {(['my-domains', 'register', 'dns-records', 'hosting', 'marketplace'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 rounded-xl capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'my-domains'
                ? 'My Domains'
                : tab === 'register'
                ? 'Search & Register'
                : tab === 'dns-records'
                ? 'DNS & DID Records'
                : tab === 'hosting'
                ? 'IPFS Web Hosting'
                : 'P2P Marketplace'}
            </button>
          ))}
        </div>

        {/* Tab 1: My Domains */}
        {activeTab === 'my-domains' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myDomains.map((d, index) => (
                <div
                  key={`${d.name}${d.tld}`}
                  className={`bg-slate-900/80 border ${
                    d.isPrimary ? 'border-cyan-500/40 shadow-cyan-500/10' : 'border-slate-800 hover:border-cyan-500/30'
                  } rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-md flex flex-col justify-between transition-all`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Globe size={20} className="text-cyan-400" weight="bold" />
                        <span className="font-bold text-white text-lg font-mono">
                          {d.name}
                          <span className="text-cyan-300">{d.tld}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {d.isPrimary && (
                          <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[10px] font-bold font-mono">
                            PRIMARY
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                          Expires: {d.expires}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Resolved SS58:</span>
                        <span className="text-white font-bold">{d.resolvedAddress.slice(0, 14)}...</span>
                      </div>
                      {d.ipfsContentCid && (
                        <div className="flex justify-between text-slate-400">
                          <span>IPFS Web CID:</span>
                          <span className="text-emerald-400 font-bold">{d.ipfsContentCid.slice(0, 14)}...</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-400">
                        <span>DNS Records:</span>
                        <span className="text-cyan-300 font-bold">{d.records.length} Configured</span>
                      </div>
                    </div>

                    {/* Subdomains */}
                    {d.subdomains.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                          Active Subdomains ({d.subdomains.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {d.subdomains.map((sub) => (
                            <span
                              key={sub}
                              className="px-2.5 py-1 bg-slate-800/90 border border-slate-700/60 rounded-xl text-cyan-300 text-[11px] font-mono"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setSelectedDomainIndex(index);
                        setActiveTab('dns-records');
                      }}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700/50"
                    >
                      <FileText size={16} /> Manage Records
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDomainIndex(index);
                        setActiveTab('hosting');
                      }}
                      className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <CloudArrowUp size={16} weight="bold" /> IPFS Hosting
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Search & Register */}
        {activeTab === 'register' && (
          <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MagnifyingGlass size={22} className="text-cyan-400" />
                Live Sovereign Name Search & Registrar
              </h3>
              <p className="text-slate-400 mt-1">
                Claim your sovereign .bz, .caye, or .belize Web3 identifier directly on BelizeChain consensus.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">Domain Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. belmopan, reef, mybiz"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                  <select
                    value={selectedTld}
                    onChange={(e) => setSelectedTld(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-bold text-cyan-300 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value=".bz">.bz</option>
                    <option value=".caye">.caye</option>
                    <option value=".belize">.belize</option>
                  </select>
                </div>
              </div>

              {/* Live Availability Preview */}
              {searchAvailability && (
                <div
                  className={`p-4 rounded-2xl border ${
                    searchAvailability.available
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                  } space-y-2`}
                >
                  <div className="flex justify-between items-center font-mono">
                    <span className="font-bold text-sm">
                      {searchAvailability.name}
                      {searchAvailability.tld}
                    </span>
                    <span className="text-xs font-bold">
                      {searchAvailability.available ? 'AVAILABLE FOR REGISTRATION' : 'ALREADY REGISTERED'}
                    </span>
                  </div>
                  {searchAvailability.available && (
                    <p className="text-slate-300 text-[11px]">
                      Standard rate: {searchAvailability.pricePerYearDalla}.00 Ɗ (or {(searchAvailability.pricePerYearDalla * 5).toFixed(2)} bBZD) / year.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">Registration Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setRegYears(y)}
                      className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                        regYears === y
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {y} Year{y > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Price per year:</span>
                  <span className="text-white font-bold">
                    {searchAvailability?.pricePerYearDalla || 10}.00 Ɗ
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Total Registration Cost:</span>
                  <span className="text-emerald-400 font-bold text-xs">
                    {(searchAvailability?.pricePerYearDalla || 10) * regYears}.00 Ɗ (~{((searchAvailability?.pricePerYearDalla || 10) * regYears * 5).toFixed(2)} bBZD)
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering || !searchAvailability || !searchAvailability.available}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2"
              >
                {isRegistering ? 'Registering BNS Sovereign Name...' : `Register ${searchName || 'Domain'}${selectedTld}`}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: DNS & DID Records */}
        {activeTab === 'dns-records' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText size={22} className="text-cyan-400" />
                  DNS & DID Text Record Manager
                </h3>
                <p className="text-slate-400 mt-0.5">
                  Configure Substrate SS58 addresses, W3C DIDs, and custom text records for{' '}
                  <span className="text-cyan-300 font-mono font-bold">
                    {currentDomain.name}
                    {currentDomain.tld}
                  </span>
                </p>
              </div>

              {/* Domain Selector */}
              <select
                value={selectedDomainIndex}
                onChange={(e) => setSelectedDomainIndex(parseInt(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
              >
                {myDomains.map((d, i) => (
                  <option key={`${d.name}${d.tld}`} value={i}>
                    {d.name}
                    {d.tld}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Records Table */}
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800 text-[10px] uppercase">
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Key / Host</th>
                      <th className="pb-2">Value / Target</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {currentDomain.records.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-md text-[10px] font-bold">
                            {rec.type}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-300 font-semibold">{rec.key}</td>
                        <td className="py-2.5 text-slate-400 truncate max-w-xs">{rec.value}</td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => {
                              currentDomain.records.splice(idx, 1);
                              setMyDomains([...myDomains]);
                              addNotification({ type: 'success', message: `Removed record ${rec.key}` });
                            }}
                            className="p-1 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add New Record Form */}
            <form onSubmit={handleAddRecord} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <span className="font-bold text-white text-xs block">Add New DNS / DID Record</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block text-[10px]">Record Type</label>
                  <select
                    value={newRecordType}
                    onChange={(e) => setNewRecordType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="TXT">TXT (Custom Text)</option>
                    <option value="SS58">SS58 (Crypto Address)</option>
                    <option value="DID">DID (W3C Identifier)</option>
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block text-[10px]">Record Value</label>
                  <input
                    type="text"
                    required
                    placeholder="Value or address..."
                    value={newRecordValue}
                    onChange={(e) => setNewRecordValue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="py-2.5 px-5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <Plus size={16} weight="bold" /> Add Record
              </button>
            </form>

            {/* Subdomain Management */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <span className="font-bold text-white text-xs block">
                Manage Subdomains for {currentDomain.name}
                {currentDomain.tld}
              </span>
              <form onSubmit={handleAddSubdomain} className="flex gap-2">
                <div className="flex-1 flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="e.g. pay, api, vault"
                    value={newSubdomainPrefix}
                    onChange={(e) => setNewSubdomainPrefix(e.target.value)}
                    className="bg-transparent border-none text-white font-mono focus:outline-none flex-1 py-2.5"
                  />
                  <span className="text-slate-400 font-mono">
                    .{currentDomain.name}
                    {currentDomain.tld}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={isAddingSubdomain || !newSubdomainPrefix}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
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
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CloudArrowUp size={22} className="text-emerald-400" />
                Decentralized Pakit IPFS Website Hosting
              </h3>
              <p className="text-slate-400 mt-1">
                Link your sovereign BNS domain directly to frontend IPFS directory CIDs stored across the Pakit node network.
              </p>
            </div>

            <div className="space-y-4">
              {myDomains.map((d) => (
                <div
                  key={`${d.name}${d.tld}`}
                  className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base font-mono">
                        {d.name}
                        {d.tld}
                      </span>
                      {d.ipfsContentCid ? (
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                          Live on IPFS
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 rounded-full text-[10px]">
                          No CID Linked
                        </span>
                      )}
                    </div>
                    {d.ipfsContentCid && (
                      <p className="text-slate-400 text-xs font-mono">
                        Gateway: <span className="text-cyan-300">https://ipfs.belizechain.org/ipfs/{d.ipfsContentCid}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setNewIpfsCid(d.ipfsContentCid || '');
                        setSelectedDomainIndex(myDomains.indexOf(d));
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all border border-slate-700/50"
                    >
                      Update CID
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Update CID Form */}
            <form onSubmit={handleUpdateIpfsCid} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <span className="font-bold text-white text-xs block">
                Update IPFS CID for {currentDomain.name}
                {currentDomain.tld}
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Qm... or bafy..."
                  value={newIpfsCid}
                  onChange={(e) => setNewIpfsCid(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isUpdatingCid || !newIpfsCid}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <CloudArrowUp size={16} weight="bold" />
                  {isUpdatingCid ? 'Publishing...' : 'Deploy to Domain'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 5: P2P Marketplace */}
        {activeTab === 'marketplace' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Storefront size={22} className="text-purple-400" />
                BNS Sovereign Domain Marketplace
              </h3>
              <p className="text-slate-400 mt-1">
                Trade verified Belizean domains and national commercial handles with instant atomic escrow settlement.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {INITIAL_MARKET_LISTINGS.map((item) => (
                <div
                  key={`${item.name}${item.tld}`}
                  className="bg-slate-950 p-5 rounded-2xl border border-slate-800 hover:border-purple-500/40 space-y-3 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-white text-base font-mono block">
                        {item.name}
                        <span className="text-cyan-300">{item.tld}</span>
                      </span>
                      <span className="text-slate-500 text-[10px]">Seller: {item.seller}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-md text-[10px] font-bold">
                      {item.category}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex justify-between items-center font-mono">
                    <div>
                      <span className="text-emerald-400 font-bold text-sm block">{item.priceDalla.toLocaleString()} Ɗ</span>
                      <span className="text-slate-400 text-[10px]">BZ$ {item.priceBBZD.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() =>
                        addNotification({
                          type: 'success',
                          message: `Atomic Escrow initialized! Purchased ${item.name}${item.tld} for ${item.priceDalla} Ɗ.`,
                        })
                      }
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
