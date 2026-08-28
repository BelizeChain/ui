'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  Database,
  UploadSimple,
  DownloadSimple,
  Fire,
  Snowflake,
  CloudArrowUp,
  Archive,
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
  LockKeyOpen,
  HardDrives,
  Coins,
  Sparkle,
  Key,
  Cpu,
  Globe,
  ArrowsClockwise,
  Eye,
  EyeSlash,
  CaretRight,
  ChartBar,
  Fingerprint,
} from 'phosphor-react';

interface StoredFile {
  id: string;
  name: string;
  cid: string;
  size: string;
  tier: 'Hot' | 'Warm' | 'Cold';
  encrypted: boolean;
  category: 'LandLedger Deed' | 'Identity Credential' | 'Neural Model' | 'Encrypted Backup' | 'Personal';
  uploadDate: string;
  replications: number;
  leaseExpires: string;
  ivHex?: string;
}

interface StorageNode {
  id: string;
  name: string;
  location: string;
  latency: string;
  status: 'ONLINE' | 'SYNCING';
  allocatedGb: number;
  totalGb: number;
  rewardRate: string;
}

const PAKIT_NODES: StorageNode[] = [
  { id: 'node-bz-01', name: 'Ceiba Primary Validator Node', location: 'Belize City Hub', latency: '4ms', status: 'ONLINE', allocatedGb: 480, totalGb: 1000, rewardRate: '0.85 Ɗ/GB' },
  { id: 'node-bz-02', name: 'Belmopan Government Archival', location: 'Belmopan Central', latency: '9ms', status: 'ONLINE', allocatedGb: 820, totalGb: 2000, rewardRate: '0.80 Ɗ/GB' },
  { id: 'node-bz-03', name: 'Ambergris Caye LandLedger Node', location: 'San Pedro Caye', latency: '14ms', status: 'ONLINE', allocatedGb: 290, totalGb: 500, rewardRate: '0.90 Ɗ/GB' },
  { id: 'node-bz-04', name: 'Maya Mountain Solar Mesh Node', location: 'Cayo District', latency: '22ms', status: 'ONLINE', allocatedGb: 140, totalGb: 250, rewardRate: '0.95 Ɗ/GB' },
];

export default function PakitPage() {
  const { selectedAccount, isConnected, balance } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'vault' | 'upload' | 'backup' | 'mining' | 'nodes'>('vault');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Upload & Encryption Form State
  const [fileName, setFileName] = useState('');
  const [fileContentText, setFileContentText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StoredFile['category']>('LandLedger Deed');
  const [selectedTier, setSelectedTier] = useState<'Hot' | 'Warm' | 'Cold'>('Hot');
  const [enableZkEncryption, setEnableZkEncryption] = useState(true);
  const [isEncryptingAndPinning, setIsEncryptingAndPinning] = useState(false);
  const [simulatedCiphertext, setSimulatedCiphertext] = useState<string | null>(null);

  // Backup & Keystore State
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lastBackupCid, setLastBackupCid] = useState<string | null>(null);

  // Mining Simulation State
  const [miningStorageAllocated, setMiningStorageAllocated] = useState(50);
  const [isHarvestingMiningRewards, setIsHarvestingMiningRewards] = useState(false);
  const [unclaimedMiningRewards, setUnclaimedMiningRewards] = useState(42.50);

  // Stored Files Collection
  const [files, setFiles] = useState<StoredFile[]>([
    {
      id: 'doc-1',
      name: 'San_Pedro_Parcel_482A_Deed.pdf',
      cid: 'QmZtmD2qtQgStation89uVb1e4R8W3c8jE...',
      size: '2.4 MB',
      tier: 'Hot',
      encrypted: true,
      category: 'LandLedger Deed',
      uploadDate: 'Aug 24, 2026',
      replications: 12,
      leaseExpires: 'Aug 2027',
      ivHex: '4a8f9b2c01e7d38a',
    },
    {
      id: 'doc-2',
      name: 'BelizeID_Citizen_001_Biometric_Credential.enc',
      cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtK7mP8q...',
      size: '480 KB',
      tier: 'Hot',
      encrypted: true,
      category: 'Identity Credential',
      uploadDate: 'Aug 20, 2026',
      replications: 16,
      leaseExpires: 'Permanent (Sovereign DID)',
      ivHex: '91bc73ea80d524fa',
    },
    {
      id: 'doc-3',
      name: 'Maya_BelizeNLP_Weights_v1.safetensors',
      cid: 'QmPZ9gcCEpqKTo6aq61g2Nx7jkq3a9v1b...',
      size: '1.2 GB',
      tier: 'Warm',
      encrypted: false,
      category: 'Neural Model',
      uploadDate: 'Aug 15, 2026',
      replications: 6,
      leaseExpires: 'Feb 2027',
    },
    {
      id: 'doc-4',
      name: 'MayaWallet_Encrypted_Keystore_Snapshot.pakit',
      cid: 'QmKj81x9LaBc72ZqNw18uPo83dE71nXa4...',
      size: '64 KB',
      tier: 'Hot',
      encrypted: true,
      category: 'Encrypted Backup',
      uploadDate: 'Aug 27, 2026',
      replications: 24,
      leaseExpires: 'Permanent',
      ivHex: 'f391ac8902c4819d',
    },
  ]);

  // Handle Real-Time Simulated AES-256-GCM Encryption & Upload
  const handleUploadAndPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) return;

    setIsEncryptingAndPinning(true);

    setTimeout(() => {
      const generatedIv = Math.random().toString(16).substring(2, 18);
      const newCid = `Qm${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}`;
      const generatedCiphertext = enableZkEncryption
        ? `0x${Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
        : null;

      const newFile: StoredFile = {
        id: `doc-${Date.now()}`,
        name: fileName.endsWith('.enc') || !enableZkEncryption ? fileName : `${fileName}.enc`,
        cid: newCid,
        size: fileContentText ? `${(fileContentText.length / 1024).toFixed(1)} KB` : '1.4 MB',
        tier: selectedTier,
        encrypted: enableZkEncryption,
        category: selectedCategory,
        uploadDate: 'Just now',
        replications: selectedTier === 'Hot' ? 12 : selectedTier === 'Warm' ? 6 : 3,
        leaseExpires: 'Aug 2027 (1 Year)',
        ivHex: enableZkEncryption ? generatedIv : undefined,
      };

      setFiles([newFile, ...files]);
      setIsEncryptingAndPinning(false);
      setSimulatedCiphertext(generatedCiphertext);

      addNotification({
        type: 'success',
        message: `Successfully encrypted & pinned ${newFile.name} to Pakit IPFS with CID ${newCid.slice(0, 14)}...!`,
      });

      setFileName('');
      setFileContentText('');
      setActiveTab('vault');
    }, 1200);
  };

  // Handle Changing Storage Tier
  const handleMigrateTier = (fileId: string, newTier: 'Hot' | 'Warm' | 'Cold') => {
    setFiles(
      files.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            tier: newTier,
            replications: newTier === 'Hot' ? 12 : newTier === 'Warm' ? 6 : 3,
          };
        }
        return f;
      })
    );
    addNotification({
      type: 'info',
      message: `Migrated file to ${newTier} storage tier with updated replication policy.`,
    });
  };

  // Handle Keystore Cloud Backup
  const handleCreateKeystoreBackup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!backupPassword || backupPassword.length < 8) {
      addNotification({ type: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }

    setIsCreatingBackup(true);
    setTimeout(() => {
      const backupCid = `QmVault${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;
      const backupFile: StoredFile = {
        id: `backup-${Date.now()}`,
        name: `Wicked_Citizen001_Backup_${new Date().toISOString().slice(0, 10)}.pakit`,
        cid: backupCid,
        size: '72 KB',
        tier: 'Hot',
        encrypted: true,
        category: 'Encrypted Backup',
        uploadDate: 'Just now',
        replications: 24,
        leaseExpires: 'Permanent (Sovereign Safe)',
        ivHex: 'b819f9024a10e82c',
      };

      setFiles([backupFile, ...files]);
      setLastBackupCid(backupCid);
      setIsCreatingBackup(false);
      setBackupPassword('');

      addNotification({
        type: 'success',
        message: `Sovereign Keystore encrypted and pinned to 24 Pakit nodes! CID: ${backupCid.slice(0, 16)}...`,
      });
    }, 1500);
  };

  // Handle Mining Rewards Claim
  const handleClaimMiningRewards = () => {
    setIsHarvestingMiningRewards(true);
    setTimeout(() => {
      const rewardAmt = unclaimedMiningRewards;
      setUnclaimedMiningRewards(0);
      setIsHarvestingMiningRewards(false);
      addNotification({
        type: 'success',
        message: `Claimed +${rewardAmt.toFixed(2)} DALLA (Ɗ) Proof-of-Storage mining rewards directly to your Maya Wallet!`,
      });
    }, 1000);
  };

  // Filtered Files
  const filteredFiles = useMemo(() => {
    if (selectedCategoryFilter === 'ALL') return files;
    return files.filter((f) => f.category === selectedCategoryFilter);
  }, [files, selectedCategoryFilter]);

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to access your Pakit zero-knowledge storage vault and cloud node network."
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
                <Database size={22} className="text-cyan-400" />
                Pakit Zero-Knowledge Storage Cloud
              </h1>
              <p className="text-xs text-slate-400">
                AES-256-GCM Client Encryption • LandLedger Deeds • Multi-Node IPFS Sharding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              4 Geo-Nodes Online
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Vault Capacity */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Vault Storage</span>
              <HardDrives size={18} className="text-cyan-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-white">1.21 GB</span>
              <span className="text-xs text-slate-400 ml-1">/ 100 GB</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full" style={{ width: '1.2%' }} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{files.length} Pinned Files</span>
              <span className="text-cyan-300 font-bold">100% Retrievable</span>
            </div>
          </div>

          {/* Card 2: Cryptographic Security */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Encryption Level</span>
              <ShieldCheck size={18} className="text-purple-400" />
            </div>
            <div>
              <span className="text-xl font-bold text-purple-300">AES-256-GCM</span>
            </div>
            <p className="text-xs text-slate-400">Zero-Knowledge client side. Nodes only hold encrypted ciphertext shards.</p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
              <CheckCircle size={14} weight="fill" /> Key controlled by Citizen DID
            </div>
          </div>

          {/* Card 3: Multi-Tier Distribution */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Tier Distribution</span>
              <Archive size={18} className="text-amber-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold font-mono">
                Hot: 3
              </span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold font-mono">
                Warm: 1
              </span>
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-bold font-mono">
                Cold: 0
              </span>
            </div>
            <p className="text-xs text-slate-400">12x average replication across Belize geo-distributed IPFS clusters.</p>
          </div>

          {/* Card 4: Storage Mining Yield */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Mining Rewards</span>
              <Coins size={18} className="text-emerald-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-emerald-400">+{unclaimedMiningRewards.toFixed(2)}</span>
              <span className="text-xs text-emerald-300 font-bold ml-1">Ɗ</span>
            </div>
            <button
              onClick={handleClaimMiningRewards}
              disabled={isHarvestingMiningRewards || unclaimedMiningRewards <= 0}
              className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              {isHarvestingMiningRewards ? (
                <CircleNotch size={14} className="animate-spin" />
              ) : (
                <Sparkle size={14} weight="bold" />
              )}
              {unclaimedMiningRewards > 0 ? 'Claim Mining Yield' : 'No Rewards Pending'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-2xl p-1 overflow-x-auto text-xs font-bold">
          {(['vault', 'upload', 'backup', 'mining', 'nodes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'vault'
                ? 'My Encrypted Vault'
                : tab === 'upload'
                ? 'Encrypt & Pin File'
                : tab === 'backup'
                ? 'Keystore Cloud Backup'
                : tab === 'mining'
                ? 'Proof-of-Storage Mining'
                : 'Pakit Network Nodes'}
            </button>
          ))}
        </div>

        {/* Tab 1: My Encrypted Vault */}
        {activeTab === 'vault' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-5">
            {/* Header & Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database size={20} className="text-cyan-400" />
                  Decentralized Pinned Assets & Documents
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  End-to-end encrypted files anchored to your sovereign account on BelizeChain.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                {['ALL', 'LandLedger Deed', 'Identity Credential', 'Neural Model', 'Encrypted Backup'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      selectedCategoryFilter === cat
                        ? 'bg-slate-800 text-cyan-300 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat === 'ALL' ? 'All Files' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Files List */}
            <div className="space-y-3">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText size={20} className="text-cyan-400" />
                      <span className="font-bold text-white text-sm tracking-wide">{file.name}</span>
                      {file.encrypted && (
                        <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <LockKey size={12} weight="bold" /> AES-GCM Encrypted
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          file.tier === 'Hot'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : file.tier === 'Warm'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        }`}
                      >
                        {file.tier} Tier
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
                      <div>
                        <span className="text-slate-500">IPFS CID: </span>
                        <span className="text-cyan-300">{file.cid.slice(0, 16)}...</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Replications: </span>
                        <span className="text-white font-bold">{file.replications} Nodes</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Lease: </span>
                        <span className="text-emerald-400">{file.leaseExpires}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Tier Migration */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    {/* Tier Switcher Dropdown */}
                    <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[10px]">
                      {(['Hot', 'Warm', 'Cold'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => handleMigrateTier(file.id, t)}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            file.tier === t
                              ? 'bg-slate-800 text-cyan-300 font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() =>
                        addNotification({
                          type: 'success',
                          message: `Downloading & client-decrypting ${file.name} from Pakit IPFS...`,
                        })
                      }
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all border border-slate-700/50"
                      title="Download and Decrypt"
                    >
                      <DownloadSimple size={15} weight="bold" />
                      Decrypt & Download
                    </button>

                    <button
                      onClick={() =>
                        addNotification({
                          type: 'info',
                          message: `IPFS Gateway Link Copied: https://ipfs.belizechain.org/ipfs/${file.cid}`,
                        })
                      }
                      className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
                      title="Share IPFS Link"
                    >
                      <ShareNetwork size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Encrypt & Pin File */}
        {activeTab === 'upload' && (
          <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CloudArrowUp size={22} className="text-cyan-400" />
                Zero-Knowledge File Encryption & IPFS Pinning
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Your file is encrypted locally in your browser using AES-256-GCM before sharding to Pakit nodes.
              </p>
            </div>

            <form onSubmit={handleUploadAndPin} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">
                  Document / Asset Filename
                </label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. Ambergris_Caye_Freehold_Deed_Parcel_482.pdf"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">
                  Document Classification
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-cyan-300 font-semibold focus:border-cyan-400 focus:outline-none"
                >
                  <option value="LandLedger Deed">LandLedger Title Deed & Survey Certificate</option>
                  <option value="Identity Credential">BelizeID Biometric Credential / Passport</option>
                  <option value="Neural Model">Nawal AI Neural Weights (.safetensors)</option>
                  <option value="Encrypted Backup">Maya Wallet Sovereign Keystore Backup</option>
                  <option value="Personal">Personal Sovereign Vault Note</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">
                  Optional Secret Content / Notes
                </label>
                <textarea
                  rows={3}
                  value={fileContentText}
                  onChange={(e) => setFileContentText(e.target.value)}
                  placeholder="Enter private metadata, boundary coordinates, or secret notes to encrypt inside the file payload..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Storage Tier Radio */}
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">
                  Storage Tier & Redundancy
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Hot', 'Warm', 'Cold'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTier(t)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedTier === t
                          ? 'border-cyan-500/60 bg-cyan-500/15 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold block text-xs">{t} Tier</span>
                      <span className="text-[10px] text-slate-400">
                        {t === 'Hot' ? '12 Nodes (Fast)' : t === 'Warm' ? '6 Nodes (Mid)' : '3 Nodes (Archival)'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ZK Encryption Toggle */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">Client-Side ZK AES-256-GCM Encryption</span>
                  <span className="text-slate-400 text-[11px] block">
                    Derived from Ed25519 session key `did:belize:{selectedAccount.address.slice(0, 10)}...`
                  </span>
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
                disabled={isEncryptingAndPinning || !fileName}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2"
              >
                {isEncryptingAndPinning ? (
                  <>
                    <CircleNotch size={18} className="animate-spin" />
                    Encrypting & Pinning to 12 Pakit Nodes...
                  </>
                ) : (
                  <>
                    <CloudArrowUp size={18} weight="bold" />
                    Encrypt & Pin Document to Pakit
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Keystore Cloud Backup */}
        {activeTab === 'backup' && (
          <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Fingerprint size={22} className="text-purple-400" />
                Sovereign Keystore Cloud Backup
              </h3>
              <p className="text-slate-400 mt-1">
                Export an encrypted keystore snapshot replicated across 24 geo-distributed Pakit archival nodes.
              </p>
            </div>

            <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-purple-300 font-bold">
                <ShieldCheck size={18} weight="fill" />
                Zero-Knowledge Sovereign Vault Protection
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Your private seed phrase is encrypted using Argon2id key derivation + AES-256-GCM. No validator or
                server can ever decrypt your backup without your master passphrase.
              </p>
            </div>

            <form onSubmit={handleCreateKeystoreBackup} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1.5 block text-[11px]">
                  Master Backup Passphrase
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    placeholder="Enter strong encryption passphrase (min 8 chars)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 pr-10 text-xs text-white focus:border-purple-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Target Account:</span>
                  <span className="text-white font-bold">{selectedAccount.address.slice(0, 16)}...</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Replication Target:</span>
                  <span className="text-cyan-300">24 Pakit IPFS Nodes</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>KDF Rounds:</span>
                  <span className="text-purple-300">Argon2id (m=64MB, t=4)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingBackup || !backupPassword}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2"
              >
                {isCreatingBackup ? (
                  <>
                    <CircleNotch size={18} className="animate-spin" />
                    Generating Zero-Knowledge Backup...
                  </>
                ) : (
                  <>
                    <LockKey size={18} weight="bold" />
                    Create & Pin Sovereign Keystore Backup
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Proof-of-Storage Mining */}
        {activeTab === 'mining' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl backdrop-blur-md text-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <HardDrives size={22} className="text-cyan-400" />
                  Proof-of-Storage (PoSt) Mining
                </h3>
                <p className="text-slate-400 mt-1">
                  Commit local NVMe drive capacity to replicate Pakit shards and earn daily DALLA (`Ɗ`) rewards.
                </p>
              </div>

              <button
                onClick={handleClaimMiningRewards}
                disabled={unclaimedMiningRewards <= 0 || isHarvestingMiningRewards}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center gap-1.5"
              >
                <Sparkle size={16} weight="bold" />
                Claim +{unclaimedMiningRewards.toFixed(2)} DALLA
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold text-[11px] block">Allocated Capacity</span>
                <span className="text-2xl font-bold font-mono text-cyan-300 block">{miningStorageAllocated} GB</span>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={miningStorageAllocated}
                  onChange={(e) => setMiningStorageAllocated(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 mt-2"
                />
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold text-[11px] block">Estimated Daily Yield</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 block">
                  +{(miningStorageAllocated * 0.028).toFixed(2)} Ɗ / Day
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  ~{((miningStorageAllocated * 0.028 * 30 * 0.25)).toFixed(2)} USD / Month
                </span>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-semibold text-[11px] block">PoSt Challenge Health</span>
                <span className="text-2xl font-bold font-mono text-purple-400 block">100% Passed</span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <CheckCircle size={12} weight="fill" /> 0 Slashing Events
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Pakit Network Nodes */}
        {activeTab === 'nodes' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl backdrop-blur-md text-xs">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe size={22} className="text-cyan-400" />
                BelizeChain Pakit Storage Mesh Nodes
              </h3>
              <p className="text-slate-400 mt-1">Geo-distributed validator and archival storage nodes across Belize.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PAKIT_NODES.map((node) => (
                <div key={node.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-white text-sm block">{node.name}</span>
                      <span className="text-slate-400 text-[11px] block">{node.location}</span>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded-full text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {node.status}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Shards Capacity:</span>
                      <span className="text-white font-bold">
                        {node.allocatedGb} GB / {node.totalGb} GB
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full rounded-full"
                        style={{ width: `${(node.allocatedGb / node.totalGb) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-slate-400 pt-1">
                      <span>Latency: {node.latency}</span>
                      <span className="text-emerald-400 font-bold">Rate: {node.rewardRate}</span>
                    </div>
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
