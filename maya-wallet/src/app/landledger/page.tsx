'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import * as landLedgerService from '@/services/pallets/landledger';
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
  ArrowLeft
} from 'phosphor-react';

export default function LandLedgerPage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();
  
  const [activeTab, setActiveTab] = useState<'properties' | 'transfers' | 'documents'>('properties');
  const [properties, setProperties] = useState<landLedgerService.LandTitle[]>([]);
  const [transfers, setTransfers] = useState<landLedgerService.PropertyTransfer[]>([]);
  const [documents, setDocuments] = useState<landLedgerService.PropertyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch land titles and documents from blockchain
  useEffect(() => {
    async function fetchData() {
      if (!selectedAccount) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const [titlesData, transfersData] = await Promise.all([
          landLedgerService.getUserLandTitles(selectedAccount.address),
          landLedgerService.getPropertyTransferHistory('all')
        ]);
        
        setProperties(titlesData);
        setTransfers(transfersData);
        
        // Get documents for each property
        const allDocs = [];
        for (const title of titlesData) {
          const docs = await landLedgerService.getPropertyDocuments(title.titleId);
          allDocs.push(...docs);
        }
        setDocuments(allDocs);
      } catch (err: any) {
        console.error('Failed to fetch land ledger data:', err);
        setError(err.message || 'Unable to load property data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedAccount]);

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading) {
    return <LoadingSpinner message="Loading land titles from blockchain..." fullScreen />;
  }

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your wallet to view your land titles" fullScreen />;
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
              <h1 className="text-xl font-bold text-white">LandLedger</h1>
              <p className="text-xs text-gray-400">Property Registry & Titles</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <House size={32} className="text-orange-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Properties</p>
              <p className="text-2xl font-bold text-white">{properties.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-amber-600">915K bBZD</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Documents</p>
              <p className="text-2xl font-bold text-white">{documents.length}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="dark-medium" blur="lg" className="p-1">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('properties')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'properties'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-700/30'
              }`}
            >
              Properties
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'transfers'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-700/30'
              }`}
            >
              Transfers
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'documents'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            Documents
          </button>
          </div>
        </GlassCard>
      </div>

      <div className="px-4 space-y-4">
        {activeTab === 'properties' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl shadow-lg">
                <MapPin size={20} weight="fill" />
                <span className="font-semibold">Register Property</span>
              </button>
              <button className="flex items-center justify-center space-x-2 p-4 bg-gray-800 rounded-xl shadow-sm">
                <ArrowsLeftRight size={20} weight="fill" className="text-gray-400" />
                <span className="font-semibold text-white">Transfer</span>
              </button>
            </div>

            {properties.map((property) => (
              <GlassCard key={property.id} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white mb-1">{property.name}</h3>
                    <p className="text-xs text-gray-400">{property.id}</p>
                  </div>
                  <span className={`px-2 py-0.5 ${property.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'} text-xs rounded-full font-semibold`}>
                    {property.status === 'Active' ? 'Verified' : 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Location</p>
                      <p className="text-sm font-semibold text-white">{property.location.district}{property.location.village ? `, ${property.location.village}` : ''}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Area</p>
                    <p className="text-sm font-semibold text-white">{property.area}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Type</p>
                    <p className="text-sm font-semibold text-white">{property.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Value</p>
                    <p className="text-sm font-semibold text-amber-600">{property.value}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-emerald-500/10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Leaf size={16} className="text-emerald-600" weight="fill" />
                    <span className="text-xs font-semibold text-emerald-700">Environmental: {property.environmental}</span>
                  </div>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold">View →</button>
                </div>
              </GlassCard>
            ))}
          </>
        )}

        {activeTab === 'transfers' && (
          <>
            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Transfer History</h3>
              <div className="space-y-3">
                {transfers.map((transfer) => (
                  <div key={transfer.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{transfer.property}</h4>
                      <span className={`px-2 py-0.5 ${transfer.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'} text-xs rounded-full font-semibold`}>
                        {transfer.status === 'Completed' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <p className="text-gray-400">From</p>
                        <p className="font-semibold text-white">{transfer.from}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">To</p>
                        <p className="font-semibold text-white">{transfer.to}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{transfer.date}</p>
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold">Details →</button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <button className="w-full flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl shadow-lg">
              <ArrowsLeftRight size={20} weight="fill" />
              <span className="font-semibold">Initiate Transfer</span>
            </button>
          </>
        )}

        {activeTab === 'documents' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl shadow-lg">
                <Upload size={20} weight="fill" />
                <span className="font-semibold">Upload</span>
              </button>
              <button className="flex items-center justify-center space-x-2 p-4 bg-gray-800 rounded-xl shadow-sm">
                <Eye size={20} weight="fill" className="text-gray-400" />
                <span className="font-semibold text-white">Browse</span>
              </button>
            </div>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Property Documents</h3>
              <div className="space-y-3">
                {documents.map((doc, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FileText size={20} className="text-amber-600" weight="fill" />
                        <div>
                          <p className="text-sm font-semibold text-white">{doc.name}</p>
                          <p className="text-xs text-gray-400">{doc.type} • {doc.size}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <p className="text-gray-400">Uploaded: {doc.uploaded}</p>
                      <button className="text-blue-600 hover:text-blue-700 font-semibold">View →</button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}
