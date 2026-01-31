'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
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
  ArrowLeft
} from 'phosphor-react';

export default function PakitPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'storage' | 'jobs' | 'analytics'>('storage');

  const storageStats = {
    totalCapacity: '2.4 TB',
    used: '856 GB',
    usedPercentage: 35.6,
    documents: 1247,
    spaceSaved: '42%',
    compressionRatio: 3.2
  };

  const storageTiers = [
    {
      name: 'Hot Storage',
      icon: <Fire size={24} weight="fill" className="text-orange-400" />,
      location: 'RAM + Local SSD',
      size: '124 GB',
      files: 89,
      speed: 'Ultra-fast',
      color: 'from-orange-500 to-red-400'
    },
    {
      name: 'Warm Storage',
      icon: <CloudArrowUp size={24} weight="fill" className="text-blue-400" />,
      location: 'IPFS',
      size: '432 GB',
      files: 658,
      speed: 'Fast',
      color: 'from-blue-500 to-cyan-400'
    },
    {
      name: 'Cold Storage',
      icon: <Snowflake size={24} weight="fill" className="text-purple-400" />,
      location: 'Arweave',
      size: '300 GB',
      files: 500,
      speed: 'Archival',
      color: 'from-purple-500 to-pink-400'
    }
  ];

  const quantumJobs = [
    {
      id: 'QJ-1234',
      file: 'land_title_scan_042.pdf',
      status: 'completed',
      originalSize: '45.2 MB',
      compressedSize: '12.1 MB',
      ratio: '73%',
      algorithm: 'Quantum LZ4',
      timestamp: '2 hours ago'
    },
    {
      id: 'QJ-1235',
      file: 'biometric_data_batch.dat',
      status: 'processing',
      originalSize: '128 MB',
      compressedSize: '-',
      ratio: '-',
      algorithm: 'Quantum Zstd',
      timestamp: '5 minutes ago'
    },
    {
      id: 'QJ-1236',
      file: 'archive_2025_q4.zip',
      status: 'queued',
      originalSize: '2.1 GB',
      compressedSize: '-',
      ratio: '-',
      algorithm: 'Hybrid Brotli',
      timestamp: 'Pending'
    }
  ];

  const recentFiles = [
    { name: 'SSN_Verification.pdf', size: '2.4 MB', type: 'Document', tier: 'Hot', cid: 'Qm...abc123' },
    { name: 'Property_Deed_042.pdf', size: '8.1 MB', type: 'Land Title', tier: 'Warm', cid: 'Qm...def456' },
    { name: 'Employment_Contract.docx', size: '1.2 MB', type: 'Document', tier: 'Hot', cid: 'Qm...ghi789' },
    { name: 'Tourism_License.jpg', size: '4.5 MB', type: 'Image', tier: 'Warm', cid: 'Qm...jkl012' }
  ];

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

      <div className="p-4 space-y-6">
        {/* Storage Overview */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400">Total Storage</p>
              <p className="text-2xl font-bold text-white">{storageStats.used}</p>
              <p className="text-xs text-gray-400">of {storageStats.totalCapacity}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                <MagicWand size={16} className="text-purple-400" weight="fill" />
                <span className="text-sm font-semibold text-purple-400">{storageStats.spaceSaved} saved</span>
              </div>
              <p className="text-xs text-gray-400">{storageStats.compressionRatio}x compression</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all"
                style={{ width: `${storageStats.usedPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{storageStats.usedPercentage}% used</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <p className="text-xs text-gray-400">Documents</p>
              <p className="text-lg font-bold text-blue-400">{storageStats.documents}</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <p className="text-xs text-gray-400">Compression</p>
              <p className="text-lg font-bold text-purple-400">{storageStats.compressionRatio}x</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-blue-400 to-cyan-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <UploadSimple size={20} weight="fill" />
            <span className="font-semibold">Upload</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 bg-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <FolderOpen size={20} weight="fill" className="text-gray-400" />
            <span className="font-semibold text-white">Browse</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <div className="flex space-x-2 bg-gray-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('storage')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'storage'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            Storage Tiers
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'jobs'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            Quantum Jobs
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-200'
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
                    <button className="text-blue-400 font-semibold hover:text-blue-700">Manage →</button>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Recent Files */}
            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Recent Files</h3>
              <div className="space-y-3">
                {recentFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-white text-sm">{file.name}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs text-gray-400">{file.size}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">{file.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          file.tier === 'Hot' ? 'bg-orange-500/20 text-orange-400' :
                          file.tier === 'Warm' ? 'bg-blue-500/100/20 text-blue-400' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {file.tier}
                        </span>
                      </div>
                    </div>
                    <button className="ml-3">
                      <DownloadSimple size={20} className="text-blue-400" weight="fill" />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-3">
            {quantumJobs.map((job, index) => (
              <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <Atom size={24} className="text-purple-400 flex-shrink-0" weight="fill" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{job.file}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Job ID: {job.id}</p>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${
                    job.status === 'completed' ? 'bg-emerald-500/100/20 text-emerald-400' :
                    job.status === 'processing' ? 'bg-blue-500/100/20 text-blue-400' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {job.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                  <div>
                    <p className="text-gray-400">Original Size</p>
                    <p className="font-semibold text-white">{job.originalSize}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Compressed</p>
                    <p className="font-semibold text-white">{job.compressedSize}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Archive size={14} className="text-gray-400" />
                    <span className="text-gray-400">{job.algorithm}</span>
                  </div>
                  {job.ratio !== '-' && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-semibold">
                      {job.ratio} saved
                    </span>
                  )}
                </div>
              </GlassCard>
            ))}

            <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center space-x-2 text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors">
              <Atom size={20} weight="bold" />
              <span className="font-medium">New Quantum Job</span>
            </button>
          </div>
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
                    <p className="text-2xl font-bold text-purple-400">3.2x</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <p className="text-xs text-gray-400">Space Saved</p>
                    <p className="text-2xl font-bold text-blue-400">1.2 TB</p>
                  </div>
                </div>
              </div>

              {/* Algorithm Performance */}
              <div>
                <h4 className="font-semibold text-white mb-3">Algorithm Usage</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Quantum Zstd</span>
                      <span className="font-semibold text-white">45%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">LZ4</span>
                      <span className="font-semibold text-white">30%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Brotli</span>
                      <span className="font-semibold text-white">25%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Savings */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Estimated Monthly Savings</p>
                    <p className="text-3xl font-bold text-emerald-400">$142</p>
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
