'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getDisplayName, getAccountType } from '@/services/pallets/identity';
import { isMerchantVerified } from '@/services/pallets/oracle';
import {
  ArrowLeft,
  UserCircle,
  Camera,
  Copy,
  CheckCircle,
  IdentificationCard,
  Check,
  ShieldCheck,
} from 'phosphor-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { selectedAccount, isConnected, connect } = useWallet();
  const account = selectedAccount as any;
  const [name, setName] = useState(account?.name ?? '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Read from chain: this page previously asserted "BelizeID Active" and
  // "Verified Citizen" for every connected wallet, registered or not.
  const [chainName, setChainName] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<'Citizen' | 'Business' | null>(null);
  // A registered merchant and a *verified* merchant are different states on chain;
  // `getAccountType` only reports the former.
  const [merchantVerified, setMerchantVerified] = useState(false);

  useEffect(() => {
    const address = selectedAccount?.address;
    if (!address) return;

    let cancelled = false;
    Promise.all([
      getDisplayName(address),
      getAccountType(address),
      isMerchantVerified(address),
    ])
      .then(([name, type, verified]) => {
        if (cancelled) return;
        // The `name` field may carry a multi-part registration payload; the
        // first line is the name, so that is what a profile header shows.
        setChainName(name?.split('\n')[0].trim() || null);
        setAccountType(type);
        setMerchantVerified(verified);
      })
      .catch((error) => {
        console.error('Failed to read on-chain identity:', error);
        if (!cancelled) {
          setChainName(null);
          setAccountType(null);
          setMerchantVerified(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedAccount?.address]);

  const handleCopyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveProfile = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (!isConnected || !account) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#030914] to-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
            <UserCircle size={36} weight="fill" />
          </div>
          <h2 className="text-xl font-bold text-white">Wallet Disconnected</h2>
          <p className="text-slate-400 text-xs">Please connect your BelizeChain wallet to access and manage your sovereign profile.</p>
          <button
            onClick={connect}
            className="w-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold py-3 rounded-2xl shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all text-xs"
          >
            Connect Sovereign Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#030914] to-slate-950 text-white pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-4 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/more"
              className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={18} weight="bold" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Citizen Profile</h1>
              <p className="text-xs text-slate-400">Manage your sovereign identity & credentials</p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              chainName
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {chainName ? 'BelizeID Active' : 'No BelizeID on chain'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {showSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-semibold">
            <CheckCircle size={20} weight="fill" className="text-emerald-400 shrink-0" />
            <span>Profile information updated and signed locally.</span>
          </div>
        )}

        {/* Profile Avatar Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-xl text-center space-y-4 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="relative inline-block">
              <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 p-0.5 shadow-xl shadow-cyan-500/20 mx-auto">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                  <UserCircle size={54} weight="fill" className="text-cyan-300" />
                </div>
              </div>
              <button
                className="absolute bottom-0 right-0 h-8 w-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center shadow-lg transition-colors text-slate-200"
                title="Update Avatar"
              >
                <Camera size={16} weight="bold" />
              </button>
            </div>

            <div className="mt-3 space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {chainName || name || 'Belizean Citizen'}
              </h2>
              <div className="flex items-center justify-center gap-2 pt-1">
                {accountType ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle size={12} weight="fill" />
                    {accountType === 'Business' ? 'Business Account' : 'Citizen Account'}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    Account type unknown
                  </span>
                )}
                {merchantVerified && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck size={12} weight="fill" /> Verified Merchant
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  SRS Quorum Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Address */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
            <IdentificationCard size={18} className="text-cyan-400" weight="bold" />
            <span>Sovereign SS58 Wallet Address</span>
          </div>

          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-3">
            <code className="text-xs font-mono text-cyan-200 break-all leading-relaxed">{account.address}</code>
            <button
              onClick={handleCopyAddress}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors shrink-0"
              title="Copy Address"
            >
              {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        {/* Personal Credentials */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCircle size={18} className="text-cyan-400" weight="bold" />
            <span>Personal Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold uppercase text-[10px]">Full Legal Name / Alias</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold uppercase text-[10px]">Encrypted Email Contact</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@domain.org"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold uppercase text-[10px]">Secure Phone Contact</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+501 XXX-XXXX"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-bold uppercase text-[10px]">Municipality / City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Belmopan, San Pedro"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck size={22} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">BelizeID SRS Credential</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Tier 2 Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Your sovereign identity is verified on-chain with zero-knowledge attestations. You have full access to governance voting, quadratic rewards, and validator delegating.
              </p>
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <IdentificationCard size={18} className="text-cyan-400" weight="bold" />
            <span>On-Chain Account</span>
          </h3>

          <div className="flex justify-between gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Address</span>
            <span className="text-white font-mono break-all text-right">
              {account?.address || 'Not connected'}
            </span>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-xs font-semibold text-amber-200">Activity statistics unavailable</p>
            <p className="mt-1 text-[11px] text-amber-200/80">
              Extrinsic counts, reward totals and vote history are not indexed on chain yet, so this
              wallet cannot read them. They are left blank rather than shown as zero, because zero
              would be a claim this wallet cannot make.
            </p>
          </div>
        </div>

        {/* Save Changes Button */}
        <button
          onClick={handleSaveProfile}
          className="w-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold py-4 rounded-2xl shadow-lg shadow-cyan-500/20 hover:opacity-95 active:scale-[0.99] transition-all text-xs flex items-center justify-center gap-2"
        >
          <Check size={16} weight="bold" />
          <span>Save Profile Credentials</span>
        </button>
      </div>
    </div>
  );
}
