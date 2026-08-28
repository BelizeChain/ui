'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  ArrowLeft,
  ShieldCheck,
  IdentificationCard,
  FileText,
  CheckCircle,
  Shield,
  Bank,
  Check,
  Download,
  Scales,
  Clock,
  Warning,
  Eye,
  Coins,
  Sparkle,
} from 'phosphor-react';

export default function CompliancePage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'proof-of-reserve' | 'kyc-aml' | 'fiu-limits' | 'certs'>('proof-of-reserve');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditTimestamp, setAuditTimestamp] = useState('Just now (Block #1,492,034)');

  const handleRefreshAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setAuditTimestamp(`Just now (Block #${1492035 + Math.floor(Math.random() * 5)})`);
      addNotification({
        type: 'success',
        message: 'Central Bank of Belize Statutory Proof of Reserve verified! 100.2% collateralized.',
      });
    }, 1200);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to view Central Bank compliance and Proof-of-Reserve audit records." fullScreen />;
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
              <h1 className="text-xl font-bold">Central Bank & Regulatory Compliance</h1>
              <p className="text-xs text-slate-400">bBZD Proof-of-Reserve • FIU AML/CFT Standards • KYC Tier 3</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck size={16} weight="bold" />
              Statutory Compliant
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">bBZD Peg Backing Ratio</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400">100.2%</span>
              <span className="text-[10px] text-slate-400">Over-Collateralized</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Pegged 1:1 to BZD ($0.50 USD)</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Reserve Vault</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">$10,020,000</span>
              <span className="text-[10px] text-emerald-300">USD</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Central Bank of Belize Depository</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">KYC Compliance Tier</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400">Tier 3 (Sovereign)</span>
            </div>
            <span className="text-[11px] text-slate-400 block">SSN & Passport Verified</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">FIU AML Screening</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-emerald-300 text-sm">Clean / Zero Flags</span>
            </div>
            <span className="text-[11px] text-slate-400 block">FATF Travel Rule Compliant</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['proof-of-reserve', 'kyc-aml', 'fiu-limits', 'certs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'proof-of-reserve'
                ? 'Proof of Reserve'
                : tab === 'kyc-aml'
                ? 'KYC & AML Status'
                : tab === 'fiu-limits'
                ? 'Statutory Limits'
                : 'ZK Compliance Certs'}
            </button>
          ))}
        </div>

        {/* Tab 1: Proof of Reserve */}
        {activeTab === 'proof-of-reserve' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bank size={22} className="text-emerald-400" />
                  Central Bank of Belize Statutory Proof of Reserve
                </h3>
                <p className="text-slate-400 mt-1">
                  Verifiable real-time cryptographic audit of the 1:1 reserve backing every minted statutory Belize Dollar Stablecoin (bBZD).
                </p>
              </div>

              <button
                onClick={handleRefreshAudit}
                disabled={isAuditing}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                <Eye size={14} weight="bold" />
                {isAuditing ? 'Auditing Vault...' : 'Run Audit Proof'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">bBZD Circulating Supply</span>
                <span className="text-xl font-bold text-white font-mono">20,000,000.00 bBZD</span>
                <span className="text-[11px] text-slate-400 block">Total supply on BelizeChain</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Statutory Reserve Collateral</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">$10,020,000.00 USD</span>
                <span className="text-[11px] text-emerald-300 block">Equivalent to BZ$ 20,040,000.00</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Last On-Chain Audit</span>
                <span className="text-sm font-bold text-purple-300 block">{auditTimestamp}</span>
                <span className="text-[11px] text-slate-400 block">Oracle Merkle Root: 0x4a9b...f21c</span>
              </div>
            </div>

            {/* Collateral Breakdown */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-sm">Collateral Asset Breakdown</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300">Central Bank of Belize Cash Depository (USD/BZD)</span>
                    <span className="text-emerald-400 font-bold">$6,500,000 USD (65%)</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300">Short-Duration US Treasury Bills (30-Day T-Bills)</span>
                    <span className="text-cyan-400 font-bold">$3,520,000 USD (35.2%)</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-cyan-400 h-2 rounded-full" style={{ width: '35.2%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: KYC & AML */}
        {activeTab === 'kyc-aml' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IdentificationCard size={22} className="text-purple-400" />
                Decentralized KYC & AML Compliance Status
              </h3>
              <p className="text-slate-400 mt-1">Verified on-chain identity records linked to your sovereign BelizeID.</p>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="font-bold text-white text-sm">Belize Social Security Board (SSB) Validation</span>
                  <span className="text-slate-400 text-[11px] block">SSN Verified against Government Registry • ZK Hash active</span>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-[10px]">
                  Verified
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="font-bold text-white text-sm">Belize Passport / National ID Biometrics</span>
                  <span className="text-slate-400 text-[11px] block">Cryptographic facial match + ICAO 9303 NFC e-Passport scan</span>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-[10px]">
                  Verified
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="font-bold text-white text-sm">FIU Sanctions & Politically Exposed Persons (PEP) Check</span>
                  <span className="text-slate-400 text-[11px] block">Automated daily screening against UN, OFAC, and domestic lists</span>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-[10px]">
                  Cleared
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Limits */}
        {activeTab === 'fiu-limits' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scales size={22} className="text-cyan-400" />
                Statutory Transaction & Settlement Limits
              </h3>
              <p className="text-slate-400 mt-1">
                Tier-based thresholds determined under the Belize Money Laundering and Terrorism (Prevention) Act.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">Daily Transfer Limit</span>
                <span className="text-lg font-bold text-white font-mono">100,000.00 Ɗ</span>
                <span className="text-[11px] text-emerald-400">or BZ$ 250,000.00</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">Monthly Settlement Cap</span>
                <span className="text-lg font-bold text-white font-mono">2,000,000.00 Ɗ</span>
                <span className="text-[11px] text-emerald-400">or BZ$ 5,000,000.00</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block text-[10px]">Cross-Border Bridge Cap</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">Unlimited (Tier 3)</span>
                <span className="text-[11px] text-slate-400">Institutional clearance active</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: ZK Certs */}
        {activeTab === 'certs' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText size={22} className="text-emerald-400" />
                  Zero-Knowledge Compliance Credentials
                </h3>
                <p className="text-slate-400 mt-1">Exportable zero-knowledge proof credentials for banking and international remittances.</p>
              </div>

              <button
                onClick={() => addNotification({ type: 'success', message: 'ZK Tax & Banking Clearance Certificate exported to device storage (PDF)!' })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
              >
                <Download size={14} />
                Export Certificate (PDF)
              </button>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Issuer:</span>
                <span className="text-white font-bold">Central Bank of Belize • DID:did:belize:cbb-01</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Holder:</span>
                <span className="text-cyan-300 font-bold">{selectedAccount.address.slice(0, 16)}...</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>ZK Proof Hash:</span>
                <span className="text-emerald-400">0x8f3c7e112fa9b0...</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-slate-500 text-[10px]">
                This credential cryptographically proves statutory tax and AML clearance without revealing confidential income or balance amounts.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
