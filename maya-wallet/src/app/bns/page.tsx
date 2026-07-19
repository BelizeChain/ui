'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import * as bnsService from '@/services/pallets/bns';
import { getPakitClient } from '@belizechain/shared';
import {
  GlobeHemisphereWest,
  MagnifyingGlass,
  ShoppingCart,
  LockKey,
  Plus,
  CheckCircle,
  Clock,
  ArrowLeft
} from 'phosphor-react';

export default function BNSPage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();
  
  const [activeTab, setActiveTab] = useState<'domains' | 'marketplace' | 'hosting'>('domains');
  const [myDomains, setMyDomains] = useState<bnsService.Domain[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<bnsService.DomainListing[]>([]);
  const [hostingStats, setHostingStats] = useState({ totalSites: 0, storage: '0 GB' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deployment states
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployDomain, setDeployDomain] = useState<string>('');
  const [deployFile, setDeployFile] = useState<File | null>(null);
  const [deployStatus, setDeployStatus] = useState<string | null>(null);

  // Fetch user domains and marketplace from blockchain
  useEffect(() => {
    async function fetchData() {
      if (!selectedAccount) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const [domainsData, listingsData] = await Promise.all([
          bnsService.getUserDomains(selectedAccount.address),
          bnsService.getMarketplaceListings()
        ]);
        
        setMyDomains(domainsData);
        setMarketplaceListings(listingsData);

        // Derive hosting stats from real on-chain hosted-website records for
        // the user's domains. Uptime/bandwidth have no on-chain source.
        const hostedSites = await Promise.all(
          domainsData.map((d) => bnsService.getHostedWebsite(d.name).catch(() => null))
        );
        const activeSites = hostedSites.filter((s) => s && s.isActive);
        const totalBytes = activeSites.reduce((sum, s) => sum + (s?.sizeBytes ?? 0), 0);
        setHostingStats({
          totalSites: activeSites.length,
          storage: formatBytes(totalBytes),
        });
      } catch (err: any) {
        console.error('Failed to fetch BNS data:', err);
        setError(err.message || 'Unable to load domain data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedAccount]);

  const handleDeploy = async () => {
    if (!selectedAccount || !deployDomain || !deployFile) return;

    setIsDeploying(true);
    setDeployStatus('Uploading to Pakit IPFS...');
    setError(null);

    try {
      // 1. Upload to Pakit Storage
      const pakitClient = getPakitClient();
      const uploadResult = await pakitClient.upload(deployFile, {
        storage: 'ipfs',
        compress: true,
        tags: {
          owner: selectedAccount.address,
          category: 'CDN',
          domain: deployDomain
        }
      });

      // 2. Link hash to domain via blockchain
      setDeployStatus('Linking hash on-chain...');
      const txResult = await bnsService.hostWebsite(
        selectedAccount.address,
        deployDomain,
        uploadResult.cid,
        uploadResult.hash
      );

      setDeployStatus(`Success! Hash: ${txResult.hash}`);
      setDeployFile(null);
      
      // Clear status after 5s
      setTimeout(() => setDeployStatus(null), 5000);
    } catch (err: any) {
      console.error('Deploy failed:', err);
      setError(err.message || 'Deployment failed');
      setDeployStatus(null);
    } finally {
      setIsDeploying(false);
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Format a byte count into a human-readable size string
  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return '0 GB';
    const gb = bytes / 1e9;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / 1e6;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(bytes / 1e3).toFixed(0)} KB`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading BNS domains from blockchain..." fullScreen />;
  }

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your wallet to view your .bz domains" fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} fullScreen />;
  }

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
              <h1 className="text-xl font-bold text-white">BNS Domains</h1>
              <p className="text-xs text-gray-400">Belize Name Service • .bz TLD</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GlobeHemisphereWest size={32} className="text-purple-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">My Domains</p>
              <p className="text-2xl font-bold text-white">{myDomains.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-indigo-600">~24.7K DALLA</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="dark-medium" blur="lg" className="p-1">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('domains')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'domains'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              My Domains
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'marketplace'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab('hosting')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'hosting'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Hosting
          </button>
          </div>
        </GlassCard>
      </div>

      <div className="px-4 space-y-4">
        {activeTab === 'domains' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg">
                <Plus size={20} weight="fill" />
                <span className="font-semibold">Register .bz</span>
              </button>
              <button className="flex items-center justify-center space-x-2 p-4 bg-gray-800 rounded-xl shadow-sm">
                <MagnifyingGlass size={20} weight="fill" className="text-gray-400" />
                <span className="font-semibold text-white">Search</span>
              </button>
            </div>

            {myDomains.map((domain, index) => (
              <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white mb-1">{domain.name}</h3>
                    <p className="text-xs text-gray-400">Expires: {domain.expires}</p>
                  </div>
                  <span className={`px-2 py-0.5 ${domain.status === 'active' ? 'bg-emerald-500/100/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'} text-xs rounded-full font-semibold`}>
                    {domain.status === 'active' ? 'Active' : 'Pending'}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Resolution</span>
                    <span className="font-mono text-white">{domain.resolution}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Hosting</span>
                    <span className="uppercase font-semibold text-indigo-600">{domain.hosting}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {domain.ssl ? (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-500/10 rounded-lg">
                      <LockKey size={14} className="text-emerald-600" weight="fill" />
                      <span className="text-xs font-semibold text-emerald-700">SSL Enabled</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-lg">
                      <LockKey size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-400">No SSL</span>
                    </div>
                  )}
                  <button className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-semibold">Manage →</button>
                </div>
              </GlassCard>
            ))}
          </>
        )}

        {activeTab === 'marketplace' && (
          <>
            <GlassCard variant="dark" blur="sm" className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <MagnifyingGlass size={20} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search domains..."
                  className="flex-1 bg-transparent outline-none text-white placeholder-gray-400"
                />
              </div>
            </GlassCard>

            {marketplaceListings.map((listing, index) => (
              <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white mb-1">{listing.name}</h3>
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full font-semibold">
                      {listing.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">{listing.price}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Views</p>
                    <p className="text-sm font-semibold text-white">{listing.views}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Offers</p>
                    <p className="text-sm font-semibold text-white">{listing.offers}</p>
                  </div>
                </div>

                <button className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg">
                  <ShoppingCart size={16} weight="fill" />
                  <span className="font-semibold text-sm">Make Offer</span>
                </button>
              </GlassCard>
            ))}
          </>
        )}

        {activeTab === 'hosting' && (
          <>
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Active Sites</p>
                  <p className="text-2xl font-bold text-white">{hostingStats.totalSites}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Storage Used</p>
                  <p className="text-2xl font-bold text-white">{hostingStats.storage}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Hosting Features</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={20} className="text-emerald-600" weight="fill" />
                    <span className="text-sm font-semibold text-white">IPFS/Arweave Storage</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={20} className="text-emerald-600" weight="fill" />
                    <span className="text-sm font-semibold text-white">Automatic SSL Certificates</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={20} className="text-emerald-600" weight="fill" />
                    <span className="text-sm font-semibold text-white">Quantum Compression</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock size={20} className="text-gray-400" />
                    <span className="text-sm text-gray-400">CDN Distribution (Coming Soon)</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-4 mt-4">
              <h3 className="font-bold text-white mb-4">Deploy New Site</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Select Domain</label>
                  <select 
                    value={deployDomain}
                    onChange={(e) => setDeployDomain(e.target.value)}
                    className="w-full bg-gray-800/80 text-white px-4 py-3 rounded-xl border border-gray-700 outline-none"
                    disabled={isDeploying}
                  >
                    <option value="">-- Choose a domain --</option>
                    {myDomains.map(d => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Website Bundle (ZIP or index.html)</label>
                  <input
                    type="file"
                    accept=".zip,.html,.htm"
                    onChange={(e) => setDeployFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
                    disabled={isDeploying}
                  />
                </div>

                {deployStatus && (
                  <div className={`p-3 rounded-lg text-sm font-semibold ${
                    deployStatus.includes('Success') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    {deployStatus}
                  </div>
                )}

                <button 
                  onClick={handleDeploy}
                  disabled={!deployDomain || !deployFile || isDeploying}
                  className="w-full flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Plus size={20} weight="fill" />
                  <span className="font-semibold">{isDeploying ? 'Deploying...' : 'Deploy to CDN'}</span>
                </button>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}
