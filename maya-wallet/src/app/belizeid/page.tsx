'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode.react';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  IdentificationCard,
  ShieldCheck,
  Fingerprint,
  QrCode,
  Warning,
  CheckCircle,
  Clock,
  Plus,
  Download,
  Share,
  Copy,
  ArrowLeft,
  X,
  Sparkle,
  LockKey,
  Globe,
  MapPin,
  Buildings,
  Check,
  EyeSlash,
  Key,
  ShieldChevron,
} from 'phosphor-react';

interface VerifiableCredential {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  status: 'Active' | 'Revoked';
  zkSupported: boolean;
  fields: Record<string, string>;
  signature: string;
}

export default function BelizeIDPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'credentials' | 'did' | 'zk-proofs'>('credentials');
  const [selectedCred, setSelectedCred] = useState<VerifiableCredential | null>(null);
  const [zkProofGenerated, setZkProofGenerated] = useState<{
    type: string;
    proof: string;
    publicInputs: Record<string, string>;
  } | null>(null);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);

  const didString = `did:belize:${selectedAccount?.address || '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'}`;

  const credentials: VerifiableCredential[] = [
    {
      id: 'cred-1',
      title: 'Belize Digital Driver\'s License',
      issuer: 'Department of Transport (Belmopan)',
      issueDate: 'Jan 15, 2026',
      status: 'Active',
      zkSupported: true,
      signature: '0x8f2910fa8921b349201948201928409182390148209384028309482093840923',
      fields: {
        'Full Name': 'Wicked Sovereign Citizen',
        'Date of Birth': '1990-09-21 (Protected via ZK)',
        'Class': 'A / B (Motor Vehicles & Light Trucks)',
        'License No': 'BZ-DL-849204',
        'Jurisdiction': 'Belize District',
        'Organ Donor': 'Yes',
      },
    },
    {
      id: 'cred-2',
      title: 'National Voter Registration Card',
      issuer: 'Elections & Boundaries Commission',
      issueDate: 'Feb 10, 2026',
      status: 'Active',
      zkSupported: true,
      signature: '0x3289ab71f829c488e91024823901482093840283094820938409238409238409',
      fields: {
        'Constituency': 'Belize Rural South (San Pedro & Caye Caulker)',
        'Voter ID': 'BZ-VOTE-2026-99',
        'Polling Station': 'San Pedro High School',
        'Electoral Status': 'Registered Citizen',
      },
    },
    {
      id: 'cred-3',
      title: 'Belize Land Title Deed Ownership',
      issuer: 'Ministry of Natural Resources (LandLedger)',
      issueDate: 'Aug 24, 2026',
      status: 'Active',
      zkSupported: true,
      signature: '0x45a9018492018492018492018492018492018492018492018492018492018492',
      fields: {
        'Parcel ID': 'San Pedro Ambergris #482A',
        'Tenure Type': 'Freehold Absolute Title',
        'Area': '0.75 Acres Waterfront',
        'Deed Hash': '0x8f2d91c4a019b882391028391029381029381029',
      },
    },
  ];

  const handleGenerateZkProof = (type: 'age' | 'citizenship' | 'land') => {
    setIsGeneratingProof(true);
    setTimeout(() => {
      setIsGeneratingProof(false);
      const proofHex = `0xZK_SNARK_GROTH16_${type.toUpperCase()}_${Date.now().toString(16).toUpperCase()}_VALIDATED`;
      const publicInputs: Record<string, string> =
        type === 'age'
          ? { 'Condition': 'Age >= 18', 'Birthdate Exposed': 'NO (Hidden)', 'Status': 'Verified Adult' }
          : type === 'citizenship'
          ? { 'Condition': 'Belize Sovereign National', 'National ID Exposed': 'NO (Hidden)', 'Status': 'Valid Citizen' }
          : { 'Condition': 'Ambergris Freehold Tenure', 'Parcel Bounds Exposed': 'NO (Hidden)', 'Status': 'Title Holder' };

      setZkProofGenerated({
        type: type === 'age' ? 'Proof of Adult Age (18+)' : type === 'citizenship' ? 'Proof of Belizean Citizenship' : 'Proof of Land Tenure',
        proof: proofHex,
        publicInputs,
      });
      addNotification({
        type: 'success',
        message: `Generated Zero-Knowledge ${type.toUpperCase()} proof!`,
      });
    }, 1000);
  };

  const handleDownloadVP = () => {
    if (!zkProofGenerated) return;
    const vp = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation', 'ZeroKnowledgePresentation'],
      holder: didString,
      verifiableCredential: {
        type: zkProofGenerated.type,
        proofType: 'Groth16/Snark',
        proofValue: zkProofGenerated.proof,
        publicAssertions: zkProofGenerated.publicInputs,
      },
    };
    const blob = new Blob([JSON.stringify(vp, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `belizeid-zk-presentation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification({
      type: 'success',
      message: 'Downloaded W3C Verifiable Presentation (VP) JSON.',
    });
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to view your sovereign BelizeID verifiable credentials." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 z-10">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors">
                <ArrowLeft size={24} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                BelizeID Sovereign Digital Identity
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold">
                  W3C DID
                </span>
              </h1>
              <p className="text-xs text-slate-400">Verifiable Credentials • Zero-Knowledge Proofs • ICAO 9303 Biometrics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck size={16} weight="bold" />
              On-Chain Verified
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Sovereign Identity DID</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-cyan-300 font-mono">did:belize</span>
            </div>
            <span className="text-[11px] text-slate-400 block truncate">{selectedAccount.address.slice(0, 16)}...</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Verifiable Credentials</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">3 Active</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Government Certified</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">ZK Privacy Shield</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400">Groth16 Snarks</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Zero Data Leakage</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Biometric Anchor</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400">ICAO 9303</span>
            </div>
            <span className="text-[11px] text-slate-400 block">NFC e-Passport Linked</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['credentials', 'did', 'zk-proofs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[140px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'credentials'
                ? 'Verifiable Credentials'
                : tab === 'did'
                ? 'W3C DID Document'
                : 'Zero-Knowledge Proofs'}
            </button>
          ))}
        </div>

        {/* Tab 1: Credentials */}
        {activeTab === 'credentials' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {credentials.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCred(c)}
                  className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-5 space-y-3 cursor-pointer transition-all shadow-xl text-xs group"
                >
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-[10px] flex items-center gap-1">
                      <Check size={12} weight="bold" />
                      {c.status}
                    </span>
                    <span className="text-[10px] text-slate-500">{c.issueDate}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{c.issuer}</p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-1.5 font-mono text-[10px]">
                    {Object.entries(c.fields).slice(0, 3).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-slate-400">
                        <span>{k}:</span>
                        <span className="text-white font-bold truncate max-w-[140px]">{v}</span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full py-2 bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-300 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1">
                    Inspect Cryptographic Details ➔
                  </button>
                </div>
              ))}
            </div>

            {/* Credential Modal */}
            {selectedCred && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-xs relative">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{selectedCred.title}</h3>
                      <p className="text-slate-400 text-[11px]">{selectedCred.issuer}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCred(null)}
                      className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Verified Attributes</span>
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                      {Object.entries(selectedCred.fields).map(([k, v]) => (
                        <div key={k} className="flex justify-between border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-slate-400">{k}:</span>
                          <span className="text-emerald-300 font-bold">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Issuer Ed25519 Signature</span>
                    <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[10px] text-cyan-300 break-all">
                      {selectedCred.signature}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedCred, null, 2));
                        addNotification({ type: 'success', message: 'Credential JSON copied!' });
                      }}
                      className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      <Copy size={14} /> Copy JSON-LD
                    </button>
                    <button
                      onClick={() => setSelectedCred(null)}
                      className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      Close Inspector
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: DID Document */}
        {activeTab === 'did' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe size={22} className="text-cyan-400" />
                  W3C Decentralized Identifier Document
                </h3>
                <p className="text-slate-400 mt-1">Cryptographic public keys and service endpoints registered on BelizeChain.</p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(didString);
                  addNotification({ type: 'success', message: 'DID String copied to clipboard!' });
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
              >
                <Copy size={14} /> Copy DID
              </button>
            </div>

            <pre className="bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-emerald-400 text-[11px] overflow-x-auto leading-relaxed">
{`{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "${didString}",
  "verificationMethod": [{
    "id": "${didString}#keys-1",
    "type": "Ed25519VerificationKey2020",
    "controller": "${didString}",
    "publicKeyMultibase": "z6MkpTHR8VNsBxYAAWHuEc2KaLfNGoMoV"
  }],
  "authentication": [
    "${didString}#keys-1"
  ],
  "assertionMethod": [
    "${didString}#keys-1"
  ],
  "service": [{
    "id": "${didString}#belize-messaging",
    "type": "BelizeMeshRelay",
    "serviceEndpoint": "https://relay.belizechain.org/did/endpoint"
  }]
}`}
            </pre>
          </div>
        )}

        {/* Tab 3: ZK Proofs */}
        {activeTab === 'zk-proofs' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <EyeSlash size={22} className="text-purple-400" />
                Zero-Knowledge Selective Disclosure Studio
              </h3>
              <p className="text-slate-400 mt-1">
                Generate cryptographic proofs to verify attributes to third parties without revealing your private data.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="font-bold text-white text-sm block">1. Prove Adult Age (18+)</span>
                  <p className="text-slate-400 text-[11px]">Proves legal adult status for hospitality & banking without revealing exact birthdate.</p>
                </div>
                <button
                  onClick={() => handleGenerateZkProof('age')}
                  disabled={isGeneratingProof}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkle size={14} weight="bold" />
                  {isGeneratingProof ? 'Proving...' : 'Generate 18+ ZK Proof'}
                </button>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="font-bold text-white text-sm block">2. Prove Belizean Citizenship</span>
                  <p className="text-slate-400 text-[11px]">Proves sovereign national status for land ownership and voting without revealing full name.</p>
                </div>
                <button
                  onClick={() => handleGenerateZkProof('citizenship')}
                  disabled={isGeneratingProof}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck size={14} weight="bold" />
                  {isGeneratingProof ? 'Proving...' : 'Generate Citizen ZK Proof'}
                </button>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="font-bold text-white text-sm block">3. Prove Land Tenure</span>
                  <p className="text-slate-400 text-[11px]">Proves real-estate freehold ownership in Ambergris Caye without exposing parcel boundary coordinates.</p>
                </div>
                <button
                  onClick={() => handleGenerateZkProof('land')}
                  disabled={isGeneratingProof}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldChevron size={14} weight="bold" />
                  {isGeneratingProof ? 'Proving...' : 'Generate Land ZK Proof'}
                </button>
              </div>
            </div>

            {zkProofGenerated && (
              <div className="bg-slate-950 p-5 rounded-2xl border border-purple-500/40 space-y-4 font-mono text-[11px] shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-purple-300 font-bold flex items-center gap-2">
                    <Sparkle size={16} />
                    {zkProofGenerated.type} (Groth16 Snark)
                  </span>
                  <span className="text-emerald-400 font-bold">Cryptographically Valid</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Public Disclosures (Zero Private Leakage)</span>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    {Object.entries(zkProofGenerated.publicInputs).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[11px]">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-white font-bold">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Snark Proof Payload Hex</span>
                  <p className="text-emerald-400 bg-slate-900 p-3 rounded-xl border border-slate-800 break-all text-[10px]">
                    {zkProofGenerated.proof}
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleDownloadVP}
                    className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
                  >
                    <Download size={16} weight="bold" /> Download Verifiable Presentation (.json)
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(zkProofGenerated.proof);
                      addNotification({ type: 'success', message: 'Proof hex copied to clipboard!' });
                    }}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2"
                  >
                    <Copy size={16} /> Copy Proof Hex
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
