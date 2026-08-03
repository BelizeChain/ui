'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { getPakitClient, type DocumentMetadata } from '@belizechain/shared';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  Database,
  UploadSimple,
  DownloadSimple,
  Atom,
  ChartBar,
  Fire,
  Snowflake,
  CloudArrowUp,
  Archive,
  MagicWand,
  CheckCircle,
  Clock,
  Trash,
  FolderOpen,
  ArrowLeft,
  CircleNotch,
  ShareNetwork,
  Link as LinkIcon
} from 'phosphor-react';

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  compressedSize: number;
  ipfsFiles: number;
  arweaveFiles: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getFileTier(mimeType: string, size: number): { name: string; color: string } {
  // Small frequently-accessed files → Hot, large docs → Warm, archives → Cold
  if (size < 1024 * 1024) return { name: 'Hot', color: 'orange' };
  if (mimeType.includes('archive') || mimeType.includes('zip')) return { name: 'Cold', color: 'purple' };
  return { name: 'Warm', color: 'blue' };
}

export default function PakitPage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<'storage' | 'files' | 'analytics'>('storage');

  // Live data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Share link state
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedAccount?.address) {
      setLoading(false);
      return;
    }

    try {
      const pakitClient = getPakitClient();
      const [storageStats, docs] = await Promise.all([
        pakitClient.getStats(selectedAccount.address),
        pakitClient.listDocuments(selectedAccount.address),
      ]);

      setStats(storageStats);
      setDocuments(docs);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch Pakit data:', err);
      setError(err.message || 'Unable to connect to Pakit storage service. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedAccount?.address]);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Upload handler
  const handleUpload = async (file: File) => {
    if (!selectedAccount?.address) return;

    setUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);

    try {
      const pakitClient = getPakitClient();
      const result = await pakitClient.upload(file, {
        compress: true,
        deduplicate: true,
        storage: 'ipfs',
        tags: {
          uploadedBy: selectedAccount.address,
          filename: file.name,
        },
      });

      setUploadProgress(`Uploaded! CID: ${result.cid.slice(0, 12)}...`);

      // Refresh data after upload
      await fetchData();

      // Clear progress after 3 seconds
      setTimeout(() => setUploadProgress(null), 3000);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadProgress(`Upload failed: ${err.message}`);
      setTimeout(() => setUploadProgress(null), 5000);
    } finally {
      setUploading(false);
    }
  };

  // Download handler
  const handleDownload = async (doc: DocumentMetadata) => {
    try {
      const pakitClient = getPakitClient();
      const blob = await pakitClient.download(doc.cid);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download failed:', err);
      alert(`Download failed: ${err.message}`);
    }
  };

  // Share handler
  const handleShare = async (cid: string) => {
    try {
      const pakitClient = getPakitClient();
      const result = await pakitClient.generateShareLink(cid, 86400); // 24h expiry
      setShareUrl(result.url);
      await navigator.clipboard.writeText(result.url);
      setTimeout(() => setShareUrl(null), 3000);
    } catch (err: any) {
      console.error('Share link generation failed:', err);
    }
  };

  // Delete handler
  const handleDelete = async (doc: DocumentMetadata) => {
    if (!selectedAccount?.address) return;
    if (!confirm(`Delete ${doc.name}? This removes it from local cache.`)) return;

    try {
      const pakitClient = getPakitClient();
      await pakitClient.delete(doc.cid, selectedAccount.address);
      await fetchData();
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Derived stats
  const compressionRatio = stats && stats.totalSize > 0
    ? (stats.totalSize / Math.max(stats.compressedSize, 1)).toFixed(1)
    : '0';
  const spaceSaved = stats && stats.totalSize > 0
    ? Math.round(((stats.totalSize - stats.compressedSize) / stats.totalSize) * 100)
    : 0;

  const storageTiers = stats ? [
    {
      name: 'Hot Storage',
      icon: <Fire size={24} weight="fill" className="text-orange-400" />,
      location: 'RAM + Local SSD',
      size: formatBytes(Math.round(stats.compressedSize * 0.15)),
      files: documents.filter(d => d.size < 1024 * 1024).length,
      speed: 'Ultra-fast',
      color: 'from-orange-500 to-red-400'
    },
    {
      name: 'Warm Storage',
      icon: <CloudArrowUp size={24} weight="fill" className="text-blue-400" />,
      location: 'IPFS',
      size: formatBytes(Math.round(stats.compressedSize * 0.55)),
      files: stats.ipfsFiles,
      speed: 'Fast',
      color: 'from-blue-500 to-cyan-400'
    },
    {
      name: 'Cold Storage',
      icon: <Snowflake size={24} weight="fill" className="text-purple-400" />,
      location: 'Arweave',
      size: formatBytes(Math.round(stats.compressedSize * 0.30)),
      files: stats.arweaveFiles,
      speed: 'Archival',
      color: 'from-purple-500 to-pink-400'
    }
  ] : [];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Not connected
  if (!isConnected || !selectedAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <ConnectWalletPrompt />
      </div>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <ErrorMessage message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Pakit Storage</h1>
              <p className="text-xs text-gray-400">Quantum Compression • Decentralized</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-400 flex items-center justify-center">
            <Database size={20} className="text-white" weight="fill" />
          </div>
        </div>
      </div>

      {/* Upload Progress Banner */}
      {uploadProgress && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm flex items-center gap-2">
          {uploading && <CircleNotch size={16} className="animate-spin" />}
          {uploadProgress}
        </div>
      )}

      {/* Share URL Banner */}
      {shareUrl && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <LinkIcon size={16} />
          Link copied to clipboard!
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Storage Overview */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400">Total Storage</p>
              <p className="text-2xl font-bold text-white">{stats ? formatBytes(stats.compressedSize) : '—'}</p>
              <p className="text-xs text-gray-400">{stats ? `${stats.totalFiles} files stored` : ''}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                <MagicWand size={16} className="text-purple-400" weight="fill" />
                <span className="text-sm font-semibold text-purple-400">{spaceSaved}% saved</span>
              </div>
              <p className="text-xs text-gray-400">{compressionRatio}x compression</p>
            </div>
          </div>

          {/* Progress Bar */}
          {stats && (
            <div className="mb-4">
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (stats.compressedSize / (2.4 * 1024 * 1024 * 1024 * 1024)) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {formatBytes(stats.compressedSize)} of 2.4 TB capacity
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <p className="text-xs text-gray-400">Documents</p>
              <p className="text-lg font-bold text-blue-400">{stats?.totalFiles ?? 0}</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <p className="text-xs text-gray-400">Compression</p>
              <p className="text-lg font-bold text-purple-400">{compressionRatio}x</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = '';
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
          >
            {uploading ? <CircleNotch size={20} className="animate-spin" /> : <UploadSimple size={20} weight="fill" />}
            <span className="font-semibold">{uploading ? 'Uploading...' : 'Upload'}</span>
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className="flex items-center justify-center space-x-2 p-4 bg-gray-800/50 border border-gray-700/30 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <FolderOpen size={20} weight="fill" className="text-gray-400" />
            <span className="font-semibold text-white">Browse</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex space-x-2 bg-gray-800/50 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('storage')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'storage'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            Storage Tiers
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'files'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            My Files
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 space-y-4">
        {activeTab === 'storage' && (
          <>
            {/* Storage Tiers */}
            <div className="space-y-3">
              {storageTiers.map((tier, index) => (
                <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center`}>
                        {tier.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{tier.name}</h3>
                        <p className="text-xs text-gray-400">{tier.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{tier.size}</p>
                      <p className="text-xs text-gray-400">{tier.files} files</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Speed: {tier.speed}</span>
                    <button className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">Manage →</button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </>
        )}

        {activeTab === 'files' && (
          <GlassCard variant="dark" blur="sm" className="p-4">
            <h3 className="font-bold text-white mb-4">
              My Files ({documents.length})
            </h3>
            {documents.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                <Database size={48} className="mx-auto mb-3 text-gray-600" />
                <p>No files uploaded yet.</p>
                <p className="mt-1">Upload your first file to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc, index) => {
                  const tier = getFileTier(doc.mimeType, doc.size);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{doc.name}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-gray-400">{formatBytes(doc.size)}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">{doc.mimeType.split('/').pop()}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tier.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                            tier.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {tier.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate" title={doc.cid}>
                          CID: {doc.cid.slice(0, 16)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => handleShare(doc.cid)}
                          className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Copy share link"
                        >
                          <ShareNetwork size={18} className="text-gray-400 hover:text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Download"
                        >
                          <DownloadSimple size={18} className="text-blue-400" weight="fill" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash size={18} className="text-red-400/60 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        )}

        {activeTab === 'analytics' && (
          <GlassCard variant="dark" blur="sm" className="p-6">
            <h3 className="text-lg font-bold text-white mb-6">Storage Analytics</h3>

            <div className="space-y-6">
              {/* Compression Stats */}
              <div>
                <h4 className="font-semibold text-white mb-3">Compression Performance</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-purple-500/10 rounded-lg">
                    <p className="text-xs text-gray-400">Avg Ratio</p>
                    <p className="text-2xl font-bold text-purple-400">{compressionRatio}x</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <p className="text-xs text-gray-400">Space Saved</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {stats ? formatBytes(stats.totalSize - stats.compressedSize) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Storage Distribution */}
              <div>
                <h4 className="font-semibold text-white mb-3">Storage Distribution</h4>
                <div className="space-y-2">
                  {stats && (
                    <>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">IPFS</span>
                          <span className="font-semibold text-white">
                            {stats.totalFiles > 0 ? Math.round((stats.ipfsFiles / stats.totalFiles) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full"
                            style={{ width: `${stats.totalFiles > 0 ? (stats.ipfsFiles / stats.totalFiles) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Arweave</span>
                          <span className="font-semibold text-white">
                            {stats.totalFiles > 0 ? Math.round((stats.arweaveFiles / stats.totalFiles) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-400 rounded-full"
                            style={{ width: `${stats.totalFiles > 0 ? (stats.arweaveFiles / stats.totalFiles) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Local Cache</span>
                          <span className="font-semibold text-white">
                            {stats.totalFiles > 0 ? Math.round(((stats.totalFiles - stats.ipfsFiles - stats.arweaveFiles) / stats.totalFiles) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${stats.totalFiles > 0 ? ((stats.totalFiles - stats.ipfsFiles - stats.arweaveFiles) / stats.totalFiles) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Cost Savings */}
              <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-lg border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Estimated Monthly Savings</p>
                    <p className="text-3xl font-bold text-emerald-400">
                      ${stats ? Math.round(((stats.totalSize - stats.compressedSize) / (1024 * 1024 * 1024)) * 0.17) : 0}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Based on $0.17/GB cloud storage pricing</p>
                  </div>
                  <ChartBar size={48} className="text-emerald-400/30" weight="fill" />
                </div>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
