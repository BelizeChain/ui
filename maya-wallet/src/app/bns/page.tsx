'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  GlobeHemisphereWest,
  MagnifyingGlass,
  ShoppingCart,
  LockKey,
  Plus,
  CheckCircle,
  Clock,
  ArrowLeft,
  X,
  UploadSimple,
  Link as LinkIcon,
  Tag,
  Storefront,
  CloudArrowUp,
  Sparkle,
  Copy,
  Globe,
  Coins,
  Check,
} from 'phosphor-react';

interface DomainRecord {
  name: string;
  tld: '.bz' | '.caye' | '.belize';
  owner: string;
  resolvedAddress: string;
  ipfsContentCid?: string;
  subdomains: string[];
  expires: string;
}

export default function BNSPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'my-domains' | 'register' | 'hosting' | 'marketplace'>('my-domains');
  const [searchName, setSearchName] = useState('');
  const [selectedTld, setSelectedTld] = useState<'.bz' | '.caye' | '.belize'>('.bz');
  const [regYears, setRegYears] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false);

  const [myDomains, setMyDomains] = useState<DomainRecord[]>([
    {
      name: 'wicked',
      tld: '.bz',
      owner: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      resolvedAddress: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      ipfsContentCid: 'QmZtmD2qtQgStation89uVb1e4R8W...',
      subdomains: ['pay.wicked.bz', 'api.wicked.bz'],
      expires: 'Aug 2030',
    },
    {
      name: 'sanpedro',
      tld: '.caye',
      owner: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      resolvedAddress: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      ipfsContentCid: 'QmYwAPJzv5CZsnA625s3Xf2nemtK...',
      subdomains: ['resort.sanpedro.caye'],
      expires: 'Jan 2028',
    },
  ]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName || !selectedAccount?.address) return;

    setIsRegistering(true);
    setTimeout(() => {
      setIsRegistering(false);
      const fullName = `${searchName.toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
      const newDomain: DomainRecord = {
        name: fullName,
        tld: selectedTld,
        owner: selectedAccount.address,
        resolvedAddress: selectedAccount.address,
        subdomains: [],
        expires: `Aug ${2026 + regYears}`,
      };
      setMyDomains([newDomain, ...myDomains]);
      addNotification({
        type: 'success',
        message: `Registered ${fullName}${selectedTld} for ${regYears} year(s) in native DALLA!`,
      });
      setSearchName('');
      setActiveTab('my-domains');
    }, 1400);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to register and manage Belize Name Service (.bz) domains." fullScreen />;
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
              <h1 className="text-xl font-bold">Belize Name Service (.bz & .caye)</h1>
              <p className="text-xs text-slate-400">Decentralized TLD Registrar • IPFS Web Hosting • Subdomain Gateways</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Globe size={16} weight="bold" />
              BNS Protocol Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">My Active Domains</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">2 Domains</span>
            </div>
            <span className="text-[11px] text-cyan-300 font-semibold">3 Active Subdomains</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Registration Fee</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">10.00 Ɗ</span>
              <span className="text-[10px] text-slate-400">/ year</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Fixed statutory pricing</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Primary Web3 Handle</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-purple-300 font-mono">wicked.bz</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Reverse resolved</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">IPFS DApp Hosting</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400">2 Live Sites</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Pakit IPFS linked</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['my-domains', 'register', 'hosting', 'marketplace'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'my-domains'
                ? 'My Domains'
                : tab === 'register'
                ? 'Search & Register'
                : tab === 'hosting'
                ? 'IPFS Web Hosting'
                : 'Marketplace'}
            </button>
          ))}
        </div>

        {/* Tab 1: My Domains */}
        {activeTab === 'my-domains' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myDomains.map((d) => (
                <div
                  key={`${d.name}${d.tld}`}
                  className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-5 space-y-4 shadow-xl text-xs transition-all"
                >
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Globe size={18} className="text-cyan-400" weight="bold" />
                      <span className="font-bold text-white text-base font-mono">
                        {d.name}
                        <span className="text-cyan-300">{d.tld}</span>
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold">
                      Expires: {d.expires}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Target Address:</span>
                      <span className="text-white font-bold">{d.resolvedAddress.slice(0, 14)}...</span>
                    </div>
                    {d.ipfsContentCid && (
                      <div className="flex justify-between text-slate-400">
                        <span>IPFS Website CID:</span>
                        <span className="text-emerald-400 font-bold">{d.ipfsContentCid.slice(0, 14)}...</span>
                      </div>
                    )}
                  </div>

                  {/* Subdomains */}
                  {d.subdomains.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Active Subdomains</span>
                      <div className="flex flex-wrap gap-1.5">
                        {d.subdomains.map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-slate-800 rounded-lg text-slate-300 text-[10px] font-mono">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => addNotification({ type: 'success', message: `Copied https://${d.name}${d.tld} to clipboard!` })}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Copy size={14} /> Copy Web3 URL
                    </button>
                    <button
                      onClick={() => addNotification({ type: 'success', message: `Subdomain manager opened for ${d.name}${d.tld}` })}
                      className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      + Subdomain
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Register */}
        {activeTab === 'register' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl text-xs max-w-lg mx-auto">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MagnifyingGlass size={20} className="text-cyan-400" />
                Register Belize Name Service Domain
              </h3>
              <p className="text-slate-400 mt-1">Claim your sovereign Web3 identity on BelizeChain.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Domain Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. belmopan, reef, payment"
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

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Registration Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 5].map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setRegYears(y)}
                      className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                        regYears === y
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {y} Year{y > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Price per year:</span>
                  <span className="text-white font-bold">10.00 Ɗ</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5 text-xs">
                  <span className="text-white font-bold">Total Cost:</span>
                  <span className="text-emerald-400 font-bold">{regYears * 10}.00 Ɗ</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegistering || !searchName}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.99] text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Globe size={18} weight="bold" />
                {isRegistering ? 'Minting BNS Domain NFT...' : `Register ${searchName || 'Domain'}${selectedTld}`}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Hosting */}
        {activeTab === 'hosting' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CloudArrowUp size={22} className="text-emerald-400" />
                Decentralized IPFS Web Hosting Resolver
              </h3>
              <p className="text-slate-400 mt-1">Host censorship-resistant web dApps directly on Pakit IPFS linked to your BNS domain.</p>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base font-mono">wicked.bz</span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-[10px]">
                      Live on IPFS
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px] block font-mono">
                    Gateway: https://ipfs.belizechain.org/ipfs/QmZtmD2qtQg...
                  </span>
                </div>

                <button
                  onClick={() => addNotification({ type: 'success', message: 'Updated Pakit IPFS Website CID for wicked.bz!' })}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
                >
                  Update Site CID
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Marketplace */}
        {activeTab === 'marketplace' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Storefront size={22} className="text-purple-400" />
                BNS Premium Domain Marketplace
              </h3>
              <p className="text-slate-400 mt-1">Trade rare national names and commercial brand domains.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'belize.caye', price: '2,500 Ɗ', seller: 'r1Sa...9sj24' },
                { name: 'resort.bz', price: '1,200 Ɗ', seller: '5FHn...94ty' },
                { name: 'diving.bz', price: '850 Ɗ', seller: '5FLS...59Y' },
              ].map((m) => (
                <div key={m.name} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div>
                    <span className="font-bold text-white text-base font-mono block">{m.name}</span>
                    <span className="text-slate-500 text-[10px]">Seller: {m.seller}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-400 text-sm font-mono">{m.price}</span>
                    <button
                      onClick={() => addNotification({ type: 'success', message: `Submitted buy offer for ${m.name}!` })}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs"
                    >
                      Buy Name
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
