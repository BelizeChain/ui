'use client';

import { useState, useEffect } from 'react';
import { initializeApi } from '@/services/blockchain';
import { ApiPromise } from '@polkadot/api';
import { 
  Globe, 
  Upload, 
  Link as LinkIcon, 
  ArrowsClockwise, 
  CheckCircle, 
  XCircle 
} from 'phosphor-react';

interface Domain {
  name: string;
  owner: string;
  tier: number;
  verified: boolean;
  expiresAt: number;
  hosting?: {
    active: boolean;
    contentHash: string;
    expiresAt: number;
  };
}

export default function DomainsPage() {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-domains' | 'register' | 'marketplace' | 'hosting'>('my-domains');

  useEffect(() => {
    async function init() {
      try {
        const apiInstance = await initializeApi();
        setApi(apiInstance);
        
        // For demo purposes, use Alice's account
        // In production, this would come from wallet extension
        setAccount('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
      } catch (error) {
        console.error('Failed to initialize API:', error);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (api && account) {
      loadDomains();
    }
  }, [api, account]);

  const loadDomains = async () => {
    if (!api || !account) return;

    try {
      setLoading(true);

      // Query AccountDomains storage
      const accountDomains = await api.query.bns.accountDomains(account);
      
      // For demo: parse the response (adjust based on actual storage type)
      const domainList = accountDomains.toJSON() as string[] || [];
      
      // Fetch details for each domain
      const domainDetails = await Promise.all(
        domainList.map(async (domainName: string) => {
          const record = await api.query.bns.domainRegistry(domainName);
          const hostingInfo = await api.query.bns.hostingConfigs(domainName);
          
          const recordData = record.toJSON() as any;
          const hostingData = hostingInfo.toJSON() as any;
          
          return {
            name: domainName,
            owner: recordData?.owner || account,
            tier: recordData?.tier || 0,
            verified: recordData?.verified || false,
            expiresAt: recordData?.expiresAt || 0,
            hosting: hostingData ? {
              active: true,
              contentHash: hostingData.contentHash || '',
              expiresAt: hostingData.expiresAt || 0
            } : undefined
          };
        })
      );

      setDomains(domainDetails);
    } catch (error) {
      console.error('Failed to load domains:', error);
      // Set empty array on error
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-10 h-10 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">
            BelizeChain Name Service
          </h1>
        </div>
        <p className="text-gray-400 ml-13">
          Register domains, host websites, and link external domains
        </p>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex gap-2 bg-gray-800/50 rounded-lg p-1 shadow-sm border border-gray-700/30">
          <button
            onClick={() => setActiveTab('my-domains')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === 'my-domains'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            My Domains
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === 'register'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === 'marketplace'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab('hosting')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              activeTab === 'hosting'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700'
            }`}
          >
            Web Hosting
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {activeTab === 'my-domains' && (
          <MyDomainsTab domains={domains} loading={loading} onRefresh={loadDomains} />
        )}
        {activeTab === 'register' && <RegisterTab onSuccess={loadDomains} />}
        {activeTab === 'marketplace' && <MarketplaceTab />}
        {activeTab === 'hosting' && <HostingTab domains={domains} />}
      </div>
    </div>
  );
}

function MyDomainsTab({ domains, loading, onRefresh }: { 
  domains: Domain[]; 
  loading: boolean; 
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg p-12 text-center">
        <ArrowsClockwise className="w-12 h-12 text-purple-400 mx-auto mb-4" style={{ animation: 'spin 1s linear infinite' }} />
        <p className="text-gray-400">Loading your domains...</p>
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl shadow-lg p-12 text-center">
        <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No domains yet</h3>
        <p className="text-gray-400 mb-6">Register your first domain to get started</p>
        <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">
          Register Domain
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {domains.length} {domains.length === 1 ? 'Domain' : 'Domains'}
        </h2>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 text-purple-400 hover:bg-purple-500/100/100/10 rounded-lg transition"
        >
          <ArrowsClockwise className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {domains.map((domain) => (
        <DomainCard key={domain.name} domain={domain} />
      ))}
    </div>
  );
}

function DomainCard({ domain }: { domain: Domain }) {
  const tierNames = ['Basic (.bz)', 'Premium (.gov.bz)', 'Enterprise'];
  
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-2xl font-bold text-gray-800">{domain.name}</h3>
            {domain.verified && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>
          <p className="text-sm text-gray-400">{tierNames[domain.tier]}</p>
        </div>
        
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
          Active
        </span>
      </div>

      {domain.hosting?.active && (
        <div className="bg-green-500/10 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Hosting Active</span>
          </div>
          <p className="text-xs text-green-600 font-mono break-all">
            DAG: {domain.hosting.contentHash.slice(0, 20)}...
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
          Manage
        </button>
        {domain.hosting?.active ? (
          <button className="flex-1 py-2 px-4 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-500/100/10 transition">
            Update Content
          </button>
        ) : (
          <button className="flex-1 py-2 px-4 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-500/100/10 transition">
            Activate Hosting
          </button>
        )}
      </div>
    </div>
  );
}

function RegisterTab({ onSuccess }: { onSuccess: () => void }) {
  const [domainName, setDomainName] = useState('');
  const [selectedTier, setSelectedTier] = useState(0);
  const [loading, setLoading] = useState(false);

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Register New Domain</h2>
      
      {/* Domain input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Domain Name
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={domainName}
            onChange={(e) => setDomainName(e.target.value.toLowerCase())}
            placeholder="mydomain"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <span className="px-4 py-3 bg-gray-100 rounded-lg text-gray-300 font-medium">
            .bz
          </span>
        </div>
      </div>

      {/* Tier selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Select Tier
        </label>
        <div className="grid grid-cols-3 gap-4">
          <TierOption
            tier={0}
            name="Basic"
            price="10 DALLA"
            features={['3-month registration', 'Basic hosting']}
            selected={selectedTier === 0}
            onSelect={() => setSelectedTier(0)}
          />
          <TierOption
            tier={1}
            name="Premium"
            price="50 DALLA"
            features={['1-year registration', '.gov.bz/.com.bz', 'Priority support']}
            selected={selectedTier === 1}
            onSelect={() => setSelectedTier(1)}
          />
          <TierOption
            tier={2}
            name="Enterprise"
            price="200 DALLA"
            features={['Custom TLD', 'Unlimited hosting', 'Dedicated support']}
            selected={selectedTier === 2}
            onSelect={() => setSelectedTier(2)}
          />
        </div>
      </div>

      <button
        disabled={!domainName || loading}
        className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Registering...' : 'Register Domain'}
      </button>
    </div>
  );
}

function TierOption({ tier, name, price, features, selected, onSelect }: {
  tier: number;
  name: string;
  price: string;
  features: string[];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`p-4 rounded-lg border-2 transition text-left ${
        selected
          ? 'border-purple-600 bg-purple-500/10'
          : 'border-gray-200 hover:border-purple-300'
      }`}
    >
      <h4 className="font-semibold text-gray-800 mb-1">{name}</h4>
      <p className="text-xl font-bold text-purple-400 mb-3">{price}</p>
      <ul className="space-y-1">
        {features.map((feature, i) => (
          <li key={i} className="text-xs text-gray-400 flex items-start gap-1">
            <span className="text-purple-400 mt-0.5">•</span>
            {feature}
          </li>
        ))}
      </ul>
    </button>
  );
}

function MarketplaceTab() {
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-12 text-center">
      <LinkIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Domain Marketplace</h3>
      <p className="text-gray-400 mb-6">Buy and sell domains on the decentralized marketplace</p>
      <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">
        Browse Listings
      </button>
    </div>
  );
}

function HostingTab({ domains }: { domains: Domain[] }) {
  const hostedDomains = domains.filter(d => d.hosting?.active);
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Web Hosting</h2>
        <p className="text-gray-400 mb-6">
          Host your website on Pakit DAG storage with BNS. Upload your site and we'll handle the rest.
        </p>

        {hostedDomains.length > 0 ? (
          <div className="space-y-4">
            {hostedDomains.map((domain) => (
              <div key={domain.name} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-800">{domain.name}</h4>
                  <span className="text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-sm text-gray-400 font-mono break-all mb-3">
                  {domain.hosting?.contentHash}
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm">
                    Update Files
                  </button>
                  <button className="flex-1 py-2 px-4 border border-gray-300 text-gray-300 rounded-lg hover:bg-gray-700 transition text-sm">
                    View Site
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">No active hosting</p>
            <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">
              Activate Hosting
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
