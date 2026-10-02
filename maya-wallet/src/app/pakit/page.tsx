'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import { getPakitClient, getRuntimeConfig, type DocumentMetadata } from '@belizechain/shared';
import {
  Database,
  DownloadSimple,
  CloudArrowUp,
  Archive,
  CheckCircle,
  ArrowLeft,
  CircleNotch,
  ShareNetwork,
  ShieldCheck,
  FileText,
  HardDrives,
  Coins,
  Globe,
  Fingerprint,
} from 'phosphor-react';

/** Real document row backed by the Pakit API's DocumentMetadata. */
interface VaultFile {
  cid: string;
  name: string;
  mimeType: string;
  sizeLabel: string;
  uploadedLabel: string;
}

interface VaultStats {
  totalFiles: number;
  totalSize: number;
  ipfsFiles: number;
  arweaveFiles: number;
}

type VaultState = 'loading' | 'ready' | 'unreachable';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function toVaultFile(doc: DocumentMetadata): VaultFile {
  return {
    cid: doc.cid,
    name: doc.name,
    mimeType: doc.mimeType || 'application/octet-stream',
    sizeLabel: formatBytes(doc.size),
    uploadedLabel: doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—',
  };
}

export default function PakitPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'vault' | 'upload' | 'backup' | 'mining' | 'nodes'>('vault');

  // Upload Form State
  const [fileName, setFileName] = useState('');
  const [fileContentText, setFileContentText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('LandLedger Deed');
  const [isUploading, setIsUploading] = useState(false);

  // Real vault data from the Pakit API
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [vaultState, setVaultState] = useState<VaultState>('loading');
  const [sharingCid, setSharingCid] = useState<string | null>(null);

  const accountAddress = selectedAccount?.address;

  // Load real vault contents from the Pakit API whenever the account changes.
  useEffect(() => {
    if (!accountAddress) return;

    let cancelled = false;
    const client = getPakitClient();

    Promise.all([
      client.listDocuments(accountAddress),
      client.getStats(accountAddress).catch(() => null),
    ])
      .then(([documents, storageStats]) => {
        if (cancelled) return;
        setFiles(documents.map(toVaultFile));
        setStats(storageStats);
        setVaultState('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('[PAKIT] Vault load failed:', error);
        setVaultState('unreachable');
      });

    return () => {
      cancelled = true;
    };
  }, [accountAddress]);

  // Upload the composed document to the real Pakit API — receipts are real CIDs,
  // and failures report that nothing was pinned.
  const handleUploadAndPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || isUploading) return;

    setIsUploading(true);
    try {
      const content =
        fileContentText || `Empty document created from Maya Wallet on ${new Date().toISOString()}`;
      const blob = new File([content], fileName, { type: 'text/plain' });
      const result = await getPakitClient().upload(blob, {
        tags: { category: selectedCategory },
      });

      setFiles((prev) => [
        {
          cid: result.cid,
          name: fileName,
          mimeType: 'text/plain',
          sizeLabel: formatBytes(result.size || content.length),
          uploadedLabel: new Date().toLocaleDateString(),
        },
        ...prev,
      ]);
      addNotification({
        type: 'success',
        message: `Pinned to Pakit — CID: ${result.cid.slice(0, 16)}...`,
      });
      setFileName('');
      setFileContentText('');
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Pakit upload failed — nothing was pinned. ${
          error instanceof Error ? error.message : ''
        }`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (file: VaultFile) => {
    try {
      const blob = await getPakitClient().download(file.cid);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Download failed for ${file.name}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      });
    }
  };

  const handleShare = async (file: VaultFile) => {
    setSharingCid(file.cid);
    try {
      const share = await getPakitClient().generateShareLink(file.cid);
      await navigator.clipboard.writeText(share.url);
      addNotification({ type: 'success', message: `Share link copied: ${share.url}` });
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Could not create a share link: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      });
    } finally {
      setSharingCid(null);
    }
  };

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
                Sovereign Storage for LandLedger Deeds, Credentials and Backups
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 border ${
                vaultState === 'ready'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : vaultState === 'loading'
                  ? 'bg-slate-800/60 text-slate-300 border-slate-700/50'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  vaultState === 'ready'
                    ? 'bg-emerald-400 animate-pulse'
                    : vaultState === 'loading'
                    ? 'bg-slate-400'
                    : 'bg-rose-400'
                }`}
              />
              {vaultState === 'ready'
                ? 'Pakit service online'
                : vaultState === 'loading'
                ? 'Contacting Pakit...'
                : 'Pakit service offline'}
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
              <span className="text-2xl font-bold font-mono text-white">
                {stats ? formatBytes(stats.totalSize) : '—'}
              </span>
              <span className="text-xs text-slate-400 ml-1">stored on Pakit</span>
            </div>
            <p className="text-xs text-slate-400">
              {vaultState === 'unreachable'
                ? 'Pakit service unreachable — storage totals unavailable.'
                : 'Reported by the Pakit service for this account.'}
            </p>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{files.length} Pinned Documents</span>
              <span className="text-cyan-300 font-bold">
                {stats ? `${stats.ipfsFiles} on IPFS` : '—'}
              </span>
            </div>
          </div>

          {/* Card 2: Cryptographic Security */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Encryption Level</span>
              <ShieldCheck size={18} className="text-purple-400" />
            </div>
            <div>
              <span className="text-xl font-bold text-purple-300">Service-managed</span>
            </div>
            <p className="text-xs text-slate-400">
              Uploads go directly to the Pakit API through the configured gateway. This page does not
              hold or derive encryption keys.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
              <CheckCircle size={14} weight="fill" /> No client-side key material
            </div>
          </div>

          {/* Card 3: Multi-Tier Distribution */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Backend Distribution</span>
              <Archive size={18} className="text-amber-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-bold font-mono">
                IPFS: {stats?.ipfsFiles ?? '—'}
              </span>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold font-mono">
                Arweave: {stats?.arweaveFiles ?? '—'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Backend distribution reported by the Pakit service
              {stats ? ` across ${stats.totalFiles} file(s).` : '.'}
            </p>
          </div>

          {/* Card 4: Storage Mining Yield */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Mining Rewards</span>
              <Coins size={18} className="text-emerald-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-slate-400">—</span>
            </div>
            <p className="text-xs text-slate-400">
              Proof-of-storage rewards cannot be claimed from Maya Wallet yet — no reward extrinsic
              is wired to Pakit.
            </p>
            <span className="w-full py-1.5 bg-slate-800/60 text-slate-500 font-bold rounded-xl text-xs text-center block">
              Claiming unavailable
            </span>
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
                ? 'My Vault'
                : tab === 'upload'
                ? 'Pin File to Pakit'
                : tab === 'backup'
                ? 'Keystore Backup'
                : tab === 'mining'
                ? 'Proof-of-Storage Mining'
                : 'Pakit Service'}
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
                  Documents the Pakit service reports for your sovereign account on BelizeChain.
                </p>
              </div>
            </div>

            {/* Files List */}
            <div className="space-y-3">
              {vaultState === 'unreachable' && (
                <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4">
                  Pakit service unreachable — vault contents cannot be loaded right now.
                </p>
              )}

              {vaultState === 'loading' && (
                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <CircleNotch size={14} className="animate-spin" /> Loading documents from Pakit...
                </p>
              )}

              {vaultState === 'ready' && files.length === 0 && (
                <p className="text-xs text-slate-400 bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                  No documents pinned to this account yet. Use the &quot;Pin File to Pakit&quot; tab to
                  upload one.
                </p>
              )}

              {files.map((file) => (
                <div
                  key={file.cid}
                  className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText size={20} className="text-cyan-400" />
                      <span className="font-bold text-white text-sm tracking-wide">{file.name}</span>
                      <span className="px-2 py-0.5 bg-slate-800/80 text-slate-300 border border-slate-700/60 text-[10px] font-bold rounded-full">
                        {file.mimeType}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
                      <div className="sm:col-span-2 min-w-0">
                        <span className="text-slate-500">CID: </span>
                        <span className="text-cyan-300 break-all">{file.cid}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Size: </span>
                        <span className="text-white font-bold">{file.sizeLabel}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Pinned: </span>
                        <span className="text-emerald-400">{file.uploadedLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    <button
                      onClick={() => handleDownload(file)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all border border-slate-700/50"
                      title="Download from Pakit"
                    >
                      <DownloadSimple size={15} weight="bold" />
                      Download
                    </button>

                    <button
                      onClick={() => handleShare(file)}
                      disabled={sharingCid === file.cid}
                      className="p-2 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 rounded-xl text-slate-400 hover:text-white transition-all"
                      title="Copy share link"
                    >
                      {sharingCid === file.cid ? (
                        <CircleNotch size={16} className="animate-spin" />
                      ) : (
                        <ShareNetwork size={16} />
                      )}
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
                Pin a Document to Pakit
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                The document below is sent to the Pakit storage API as a text payload and pinned under
                your account; a real CID is returned on success.
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
                  onChange={(e) => setSelectedCategory(e.target.value)}
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

              {/* Storage-tier and client-side-encryption controls were removed: neither is backed by the Pakit API. */}

              <button
                type="submit"
                disabled={isUploading || !fileName}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <CircleNotch size={18} className="animate-spin" />
                    Uploading to Pakit...
                  </>
                ) : (
                  <>
                    <CloudArrowUp size={18} weight="bold" />
                    Pin Document to Pakit
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
                Sovereign Keystore Backup
              </h3>
              <p className="text-slate-400 mt-1">
                The extension wallet holds your keys — this page cannot export them.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <ShieldCheck size={18} weight="fill" />
                Backup is not available from this app yet
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Maya Wallet never receives your seed phrase or private keys — they stay inside the
                Polkadot.js browser extension or hardware signer you connected with. Because this page
                cannot read them, it cannot create or pin an encrypted keystore backup, and it will not
                pretend to.
              </p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Use your wallet extension&apos;s own account export/backup feature, or a hardware wallet
                recovery seed kept offline, to back up these keys.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Proof-of-Storage Mining */}
        {activeTab === 'mining' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl backdrop-blur-md text-xs">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardDrives size={22} className="text-cyan-400" />
                Proof-of-Storage (PoSt) Mining
              </h3>
              <p className="text-slate-400 mt-1">
                Committing drive capacity and claiming DALLA rewards is not available yet.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <Coins size={18} className="text-emerald-400" />
                No mining position is configured
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Pakit does not expose a capacity-commitment or reward-claim extrinsic to this app, so
                there is no yield to estimate and no rewards to claim from Maya Wallet. This panel will
                show real metrics once storage mining is wired to the wallet.
              </p>
            </div>
          </div>
        )}

        {/* Tab 5: Pakit Network */}
        {activeTab === 'nodes' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl backdrop-blur-md text-xs">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe size={22} className="text-cyan-400" />
                Pakit Storage Service
              </h3>
              <p className="text-slate-400 mt-1">
                Connection status of the Pakit service this wallet is configured to use.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-white text-sm block">Pakit Storage API</span>
                  <span className="text-slate-400 text-[11px] block break-all">
                    {getRuntimeConfig().pakitApiUrl}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 font-bold rounded-full text-[10px] flex items-center gap-1 ${
                    vaultState === 'ready'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : vaultState === 'loading'
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      vaultState === 'ready'
                        ? 'bg-emerald-400'
                        : vaultState === 'loading'
                        ? 'bg-slate-400'
                        : 'bg-rose-400'
                    }`}
                  />{' '}
                  {vaultState === 'ready' ? 'ONLINE' : vaultState === 'loading' ? 'CHECKING' : 'OFFLINE'}
                </span>
              </div>

              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Documents (this account):</span>
                  <span className="text-white font-bold">{stats ? stats.totalFiles : '—'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total size:</span>
                  <span className="text-white font-bold">{stats ? formatBytes(stats.totalSize) : '—'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>IPFS files:</span>
                  <span className="text-cyan-300 font-bold">{stats ? stats.ipfsFiles : '—'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Arweave files:</span>
                  <span className="text-cyan-300 font-bold">{stats ? stats.arweaveFiles : '—'}</span>
                </div>
              </div>
            </div>

            <p className="text-slate-500 text-[11px]">
              Per-node detail (geo-locations, latency, rewards) is not exposed by the current Pakit API.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
