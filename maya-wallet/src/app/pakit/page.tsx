'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
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
  Link as LinkIcon,
  ShieldCheck,
  FileText,
  LockKey,
  HardDrives,
  Coins,
  Sparkle,
} from 'phosphor-react';

interface StoredFile {
  id: string;
  name: string;
  cid: string;
  size: string;
  tier: 'Hot' | 'Warm' | 'Cold';
  encrypted: boolean;
  category: 'LandLedger Deed' | 'Identity Document' | 'Neural Model' | 'Personal';
  uploadDate: string;
}

export default function PakitPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'files' | 'upload' | 'mining' | 'land-deeds'>('files');
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'LandLedger Deed' | 'Identity Document' | 'Neural Model' | 'Personal'>('LandLedger Deed');
  const [selectedTier, setSelectedTier] = useState<'Hot' | 'Warm' | 'Cold'>('Hot');
  const [enableZkEncryption, setEnableZkEncryption] = useState(true);

  const [files, setFiles] = useState<StoredFile[]>([
    {
      id: 'doc-1',
      name: 'San_Pedro_Parcel_482A_Deed.pdf',
      cid: 'QmZtmD2qtQgStation89uVb1e4R8W...',
      size: '2.4 MB',
      tier: 'Hot',
      encrypted: true,
      category: 'LandLedger Deed',
      uploadDate: 'Aug 24, 2026',
    },
    {
      id: 'doc-2',
      name: 'BelizeID_Biometric_Credential.enc',
      cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtK...',
      size: '480 KB',
      tier: 'Hot',
      encrypted: true,
      category: 'Identity Document',
      uploadDate: 'Aug 20, 2026',
    },
    {
      id: 'doc-3',
      name: 'Maya_BelizeNLP_Weights_v1.safetensors',
      cid: 'QmPZ9gcCEpqKTo6aq61g2Nx7jkq3...',
      size: '1.2 GB',
      tier: 'Warm',
      encrypted: false,
      category: 'Neural Model',
      uploadDate: 'Aug 15, 2026',
    },
  ]);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) return;

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      const newFile: StoredFile = {
        id: `doc-${Date.now()}`,
        name: fileName,
        cid: `Qm${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`,
        size: '1.8 MB',
        tier: selectedTier,
        encrypted: enableZkEncryption,
        category: selectedCategory,
        uploadDate: 'Just now',
      };
      setFiles([newFile, ...files]);
      addNotification({
        type: 'success',
        message: `File pinned to Pakit IPFS with CID ${newFile.cid.slice(0, 14)}... (Encrypted: ${enableZkEncryption ? 'Yes' : 'No'})!`,
      });
      setFileName('');
      setActiveTab('files');
    }, 1400);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to access your Pakit decentralized storage vault." fullScreen />;
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
              <h1 className="text-xl font-bold">Pakit IPFS Storage Cloud</h1>
              <p className="text-xs text-slate-400">Decentralized Pinned Vault • LandLedger Deeds • Storage Mining</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Database size={16} weight="bold" />
              Pakit Node Online
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Pinned Storage</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">1.21 GB</span>
            </div>
            <span className="text-[11px] text-cyan-300 font-semibold">3 Files Pinned On-Chain</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Storage Redundancy</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">12 Nodes</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Belize Geo-Distributed IPFS</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">ZK Encryption</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400">AES-256-GCM</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Key held by Maya Wallet</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Storage Mining Rewards</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">+18.40</span>
              <span className="text-[10px] text-emerald-300">Ɗ</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Earned for pinning chunks</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['files', 'upload', 'land-deeds', 'mining'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'files'
                ? 'My Pinned Vault'
                : tab === 'upload'
                ? 'Upload & Pin'
                : tab === 'land-deeds'
                ? 'Land Title Deeds'
                : 'Storage Mining'}
            </button>
          ))}
        </div>

        {/* Tab 1: Pinned Vault */}
        {activeTab === 'files' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database size={20} className="text-cyan-400" />
                  IPFS Pinned Documents & Assets
                </h3>
                <p className="text-slate-400 mt-1">Cryptographically anchored to your BelizeChain account.</p>
              </div>

              <button
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                <CloudArrowUp size={16} weight="bold" />
                Upload New File
              </button>
            </div>

            <div className="space-y-3">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{f.name}</span>
                      {f.encrypted && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <LockKey size={10} weight="bold" /> Encrypted
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold rounded-full">
                        {f.tier} Tier
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
                      <span>CID: {f.cid}</span>
                      <span>• {f.size}</span>
                      <span>• {f.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addNotification({ type: 'success', message: `Downloading ${f.name} from Pakit IPFS...` })}
                      className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white"
                      title="Download"
                    >
                      <DownloadSimple size={18} />
                    </button>
                    <button
                      onClick={() => addNotification({ type: 'success', message: `IPFS Gateway URL copied: https://ipfs.belizechain.org/ipfs/${f.cid}` })}
                      className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white"
                      title="Share Gateway Link"
                    >
                      <LinkIcon size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Upload */}
        {activeTab === 'upload' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl text-xs max-w-lg mx-auto">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CloudArrowUp size={20} className="text-cyan-400" />
                Upload & Pin to Pakit IPFS
              </h3>
              <p className="text-slate-400 mt-1">Files are sharded and replicated across certified node operators.</p>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">File Document Name</label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. Caye_Caulker_Title_Deed_2026.pdf"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Category Classification</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="LandLedger Deed">LandLedger Title Deed & Survey</option>
                  <option value="Identity Document">Identity Document / Passport Scan</option>
                  <option value="Neural Model">Nawal AI Neural Weights (.safetensors)</option>
                  <option value="Personal">Personal Vault Document</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['Hot', 'Warm', 'Cold'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTier(t)}
                    className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                      selectedTier === t
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {t} Storage
                  </button>
                ))}
              </div>

              {/* ZK Encryption Toggle */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">Client-Side ZK Encryption</span>
                  <span className="text-slate-400 text-[11px] block">Encrypt with Maya Wallet private key before IPFS broadcast</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableZkEncryption(!enableZkEncryption)}
                  className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                    enableZkEncryption ? 'bg-purple-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <button
                type="submit"
                disabled={isUploading || !fileName}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.99] text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <CloudArrowUp size={18} weight="bold" />
                {isUploading ? 'Encrypting & Pinning to IPFS...' : 'Pin File to Pakit IPFS'}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Land Deeds */}
        {activeTab === 'land-deeds' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText size={22} className="text-emerald-400" />
                Belize LandLedger Deed Attachments
              </h3>
              <p className="text-slate-400 mt-1">Official land titles, survey maps, and transfer certificates stored on Pakit.</p>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">San Pedro Parcel #482A (Ambergris Caye)</span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-[10px]">
                      Title Deed Verified
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px] block">IPFS CID: QmZtmD2qtQgStation89uVb1e4R8W...</span>
                </div>
                <button
                  onClick={() => addNotification({ type: 'success', message: 'Opening official LandLedger Title Certificate...' })}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs"
                >
                  View Deed (PDF)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Storage Mining */}
        {activeTab === 'mining' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardDrives size={22} className="text-cyan-400" />
                Pakit Node Storage Mining
              </h3>
              <p className="text-slate-400 mt-1">Host storage shards on your local node and earn native DALLA (`Ɗ`).</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-white text-sm block">Local Storage Allocation</span>
                <p className="text-slate-400 text-[11px]">Allocated 50 GB NVMe drive capacity on Ceiba node.</p>
                <span className="font-bold text-cyan-300 text-base font-mono block">50.0 GB Dedicated</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-white text-sm block">Mining Yield (DALLA)</span>
                <p className="text-slate-400 text-[11px]">Proof-of-Storage challenge validation reward.</p>
                <span className="font-bold text-emerald-400 text-base font-mono block">+0.85 Ɗ / GB / Month</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
