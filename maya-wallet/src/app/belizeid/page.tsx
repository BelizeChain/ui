'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  getBelizeID,
  getKYCStatus,
  getSSNRecord,
  getPassportRecord,
  type BelizeID,
  type KYCStatus,
  type PassportRecord,
  type SSNRecord,
} from '@/services/pallets/identity';
import { getUserLandTitles, type LandTitle } from '@/services/pallets/landledger';
import {
  ShieldCheck,
  Download,
  Copy,
  ArrowLeft,
  ArrowRight,
  X,
  Sparkle,
  Globe,
  Check,
  EyeSlash,
  ShieldChevron,
  House,
} from 'phosphor-react';

interface VerifiableCredential {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  /** Verbatim pallet status — attestations can be Active, Suspended, Expired, … */
  status: string;
  fields: Record<string, string>;
  /** Issuer anchor hash from the pallet. Empty when the pallet records none. */
  signature: string;
}

export default function BelizeIDPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'credentials' | 'did' | 'zk-proofs'>('credentials');
  // CONFIG-002: real on-chain BelizeID + KYC status (identity pallet).
  const [belizeID, setBelizeID] = useState<BelizeID | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [, setIdLoading] = useState(true);
  const [idError, setIdError] = useState('');
  const [selectedCred, setSelectedCred] = useState<VerifiableCredential | null>(null);
  const [zkProofGenerated, setZkProofGenerated] = useState<{
    type: string;
    proof: string;
    publicInputs: Record<string, string>;
  } | null>(null);
  const [isGeneratingProof] = useState(false);

  // Real on-chain attestations backing the credential list.
  const [ssnRecord, setSsnRecord] = useState<SSNRecord | null>(null);
  const [passportRecord, setPassportRecord] = useState<PassportRecord | null>(null);
  const [landTitles, setLandTitles] = useState<LandTitle[]>([]);

  // Hoisted so the callback deps match the compiler-inferred dependency
  // (react-hooks/preserve-manual-memoization).
  const address = selectedAccount?.address;

  const didString = `did:belize:${address ?? ''}`;

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      if (!address) {
        setIdLoading(false);
        return;
      }
      setIdLoading(true);
      try {
        const [id, kyc, ssn, passport, titles] = await Promise.all([
          getBelizeID(address),
          getKYCStatus(address),
          getSSNRecord(address),
          getPassportRecord(address),
          getUserLandTitles(address),
        ]);
        if (cancelled) return;
        setBelizeID(id);
        setKycStatus(kyc);
        setSsnRecord(ssn);
        setPassportRecord(passport);
        setLandTitles(titles);
        setIdError('');
      } catch (err) {
        if (!cancelled) setIdError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setIdLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [address]);

  /**
   * Verifiable credentials derived from chain state.
   *
   * The wallet cannot mint credentials: both `identity.identityOf` and the
   * attestation maps are written by registered issuers. Only credentials that
   * actually exist on chain are listed — an earlier version hardcoded a
   * driver's licence, a voter registration card and a land deed with invented
   * licence numbers and fabricated signature hashes.
   */
  const credentials: VerifiableCredential[] = useMemo(() => {
    const list: VerifiableCredential[] = [];

    if (belizeID) {
      list.push({
        id: `belizeid-${belizeID.id}`,
        title: 'BelizeID Registration',
        issuer: 'BelizeChain identity pallet',
        issueDate: 'On chain',
        status: 'Active',
        signature: '',
        fields: {
          'Identity ID': belizeID.id,
          'Registered Name': belizeID.name || '—',
          'Linked Accounts': String(belizeID.accounts.length),
          'DID Doc CID': belizeID.didDocCid || '—',
        },
      });
    }

    if (ssnRecord) {
      list.push({
        id: 'ssn-attestation',
        title: 'SSN Attestation',
        issuer: ssnRecord.issuer,
        issueDate: ssnRecord.issuedAt ? new Date(ssnRecord.issuedAt * 1000).toLocaleDateString() : '—',
        status: ssnRecord.verified ? 'Active' : ssnRecord.status,
        signature: ssnRecord.anchor,
        fields: {
          'Standard Version': String(ssnRecord.standardVersion),
          'Format OK': ssnRecord.formatOk ? 'yes' : 'no',
          'Hash': ssnRecord.hash,
          'Valid Until': ssnRecord.validUntil ? new Date(ssnRecord.validUntil * 1000).toLocaleDateString() : '—',
          'Status': ssnRecord.status,
        },
      });
    }

    if (passportRecord) {
      list.push({
        id: 'passport-attestation',
        title: 'Passport Attestation',
        issuer: passportRecord.issuer,
        issueDate: passportRecord.issuedAt ? new Date(passportRecord.issuedAt * 1000).toLocaleDateString() : '—',
        status: passportRecord.verified ? 'Active' : passportRecord.status,
        signature: passportRecord.anchor,
        fields: {
          'Standard Version': String(passportRecord.standardVersion),
          'Format OK': passportRecord.formatOk ? 'yes' : 'no',
          'Hash': passportRecord.hash,
          'Valid Until': passportRecord.validUntil ? new Date(passportRecord.validUntil * 1000).toLocaleDateString() : '—',
          'Status': passportRecord.status,
        },
      });
    }

    if (kycStatus && kycStatus.status !== 'None') {
      list.push({
        id: 'kyc-verification',
        title: 'KYC Verification',
        issuer: 'BelizeChain compliance pallet',
        issueDate: kycStatus.verificationDate
          ? new Date(kycStatus.verificationDate * 1000).toLocaleDateString()
          : '—',
        status: kycStatus.status,
        signature: '',
        fields: {
          Level: kycStatus.level,
          Status: kycStatus.status,
          Documents: kycStatus.documents.length > 0 ? kycStatus.documents.join(', ') : '—',
        },
      });
    }

    for (const title of landTitles) {
      list.push({
        id: `land-${title.titleId}`,
        title: `Land Title — property #${title.titleId}`,
        issuer: 'BelizeChain landLedger pallet',
        issueDate: title.registeredAt ? new Date(title.registeredAt * 1000).toLocaleDateString() : '—',
        status: title.governmentVerified ? 'Active' : 'Unverified',
        signature: '',
        fields: {
          'Title Number': title.titleNumber || '—',
          'Property Type': title.propertyType,
          'Zoning': title.zoning,
          'Area (m²)': String(title.areaSqm),
          'Assessed Value': `${title.assessedValue} bBZD`,
        },
      });
    }

    return list;
  }, [belizeID, ssnRecord, passportRecord, kycStatus, landTitles]);

  // CONFIG-002: no ZK circuit runs in the browser. Instead of fabricating a
  // fake "0xZK_SNARK_GROTH16_..._VALIDATED" proof, we show honestly what a
  // ZK proof WOULD attest without exposing hidden data.
  const handleGenerateZkProof = (type: 'age' | 'citizenship' | 'land') => {
    const publicInputs: Record<string, string> =
      type === 'age'
        ? { 'Statement': 'Age >= 18 (attestation only)', 'Birthdate Revealed': 'NO', 'Status': 'Wired to ZK circuit — pending integration with identity pallet' }
        : type === 'citizenship'
        ? { 'Statement': 'Belizean nationality attestation', 'National ID Revealed': 'NO', 'Status': 'Wired to ZK circuit — pending integration with identity pallet' }
        : { 'Statement': 'Freehold tenure attestation', 'Parcel Bounds Revealed': 'NO', 'Status': 'Wired to ZK circuit — pending integration with landledger pallet' };

    setZkProofGenerated({
      type: type === 'age' ? 'Proof of Adult Age (18+) — NOT CRYPTOGRAPHICALLY PROVEN' : type === 'citizenship' ? 'Proof of Belizean Citizenship — NOT CRYPTOGRAPHICALLY PROVEN' : 'Proof of Land Tenure — NOT CRYPTOGRAPHICALLY PROVEN',
      proof: 'DESIGN PREVIEW — no real zk-SNARK circuit executed',
      publicInputs,
    });
    addNotification({
      type: 'info',
      message: 'ZK proof generation is a design preview — real Groth16 circuit integration is queued.',
    });
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
    <div className="min-h-screen bg-[#030914] text-white pb-24 selection:bg-cyan-500/30">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-2xl border-b border-teal-500/20 px-6 py-4 z-10 shadow-lg">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors border border-teal-500/20">
                <ArrowLeft size={22} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                BelizeID Sovereign Identity
                <span className="px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/30 rounded-full text-[10px] font-mono font-bold">
                  W3C DID
                </span>
              </h1>
              <p className="text-xs text-slate-400">On-chain identity • issuer attestations • selective disclosure</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-teal-500/15 text-teal-300 border border-teal-500/30 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
              <ShieldCheck size={16} weight="bold" />
              {belizeID ? 'On-Chain Identity Found' : 'No On-Chain Identity'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Holographic Sovereign Passport Hero Card */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-[#071d2b] to-[#04121a] border border-teal-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                  BelizeID
                </span>
                {belizeID && (
                  <span className="text-xs text-slate-400 font-mono">Identity #{belizeID.id}</span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {selectedAccount.name || 'Sovereign Citizen'}
              </h2>
              <div className="flex items-center gap-2 font-mono text-xs text-cyan-300">
                <Globe size={16} className="text-teal-400" />
                <span className="break-all">{didString}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(didString);
                    addNotification({ type: 'success', message: 'DID String copied to clipboard' });
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-teal-500/20 backdrop-blur-md">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-teal-500/20">
                {(selectedAccount.name || 'BZ').charAt(0).toUpperCase()}
              </div>
              <div className="text-xs space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">KYC Level</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck size={14} weight="fill" /> {kycStatus?.level ?? '—'}
                </span>
                <span className="text-slate-400 text-[11px] block">Status: {kycStatus?.status ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/80 border border-teal-500/20 rounded-2xl p-4 space-y-1 backdrop-blur-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Sovereign Identity DID</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-cyan-300 font-mono">did:belize</span>
            </div>
            <span className="text-[11px] text-slate-400 block truncate">{selectedAccount.address.slice(0, 16)}...</span>
          </div>

          <div className="bg-slate-900/80 border border-teal-500/20 rounded-2xl p-4 space-y-1 backdrop-blur-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Verifiable Credentials</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">{credentials.length}</span>
            </div>
            <span className="text-[11px] text-teal-300 font-semibold">From on-chain attestations</span>
          </div>

          <div className="bg-slate-900/80 border border-teal-500/20 rounded-2xl p-4 space-y-1 backdrop-blur-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">SSN / Passport</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-teal-400 font-mono">
                {[ssnRecord?.verified, passportRecord?.verified].filter(Boolean).length}/2
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">Active attestations</span>
          </div>

          <div className="bg-slate-900/80 border border-teal-500/20 rounded-2xl p-4 space-y-1 backdrop-blur-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Land Titles Held</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300 font-mono">{landTitles.length}</span>
            </div>
            <span className="text-[11px] text-slate-400 block">landLedger register</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/90 border border-teal-500/20 rounded-2xl p-1 overflow-x-auto backdrop-blur-xl shadow-md">
          {(['credentials', 'did', 'zk-proofs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[140px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-teal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'credentials'
                ? `Verifiable Credentials (${credentials.length})`
                : tab === 'did'
                ? 'W3C DID Document'
                : 'Selective Disclosure'}
            </button>
          ))}
        </div>

        {/* Tab 1: Credentials */}
        {activeTab === 'credentials' && (
          <div className="space-y-4">
            {idError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-xs text-center">
                On-chain identity lookup failed: {idError}
              </div>
            )}
            {!belizeID && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
                No BelizeID is registered for this address on chain. Any credentials shown below come
                from other pallets (compliance KYC, landLedger titles); issuer attestations require a
                registered issuer account.
              </div>
            )}
            {credentials.length === 0 && (
              <div className="p-8 bg-slate-900/70 border border-teal-500/20 rounded-3xl text-center text-slate-400 text-xs">
                This account holds no verifiable credentials on chain.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {credentials.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCred(c)}
                  className="bg-slate-900/80 border border-teal-500/25 hover:border-teal-400/60 rounded-3xl p-5 space-y-3 cursor-pointer transition-all hover:shadow-[0_0_25px_rgba(20,184,166,0.15)] text-xs group backdrop-blur-xl"
                >
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 font-mono font-bold rounded-full text-[10px] flex items-center gap-1 border border-teal-500/30">
                      <Check size={12} weight="bold" />
                      {c.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{c.issueDate}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{c.issuer}</p>
                  </div>

                  <div className="bg-slate-950/90 p-3 rounded-2xl border border-teal-500/15 space-y-1.5 font-mono text-[10px]">
                    {Object.entries(c.fields).slice(0, 3).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-slate-400">
                        <span>{k}:</span>
                        <span className="text-white font-bold truncate max-w-[140px]">{v}</span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full py-2.5 bg-slate-800/80 group-hover:bg-gradient-to-r group-hover:from-teal-500 group-hover:to-cyan-500 group-hover:text-slate-950 text-slate-300 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 border border-slate-700">
                    <span>Inspect Attestation</span>
                    <ArrowRight size={13} weight="bold" />
                  </button>
                </div>
              ))}
            </div>

            {/* Credential Modal */}
            {selectedCred && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="bg-slate-900 border border-teal-500/30 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl backdrop-blur-2xl text-xs relative">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{selectedCred.title}</h3>
                      <p className="text-teal-400/80 text-[11px]">{selectedCred.issuer}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCred(null)}
                      className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">On-chain fields</span>
                    <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-teal-500/20 space-y-2 font-mono text-[11px]">
                      {Object.entries(selectedCred.fields).map(([k, v]) => (
                        <div key={k} className="flex justify-between border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-slate-400">{k}:</span>
                          <span className="text-teal-300 font-bold">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedCred.signature && (
                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Issuer anchor</span>
                      <p className="bg-slate-950/90 p-2.5 rounded-xl border border-teal-500/20 font-mono text-[10px] text-cyan-300 break-all">
                        {selectedCred.signature}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {selectedCred.id.startsWith('land-') && (
                      <Link href="/landledger" className="col-span-2">
                        <button className="w-full py-2.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all">
                          <House size={15} weight="bold" /> Open property in LandLedger
                        </button>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedCred, null, 2));
                        addNotification({ type: 'success', message: 'Credential JSON copied!' });
                      }}
                      className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700"
                    >
                      <Copy size={14} /> Copy JSON-LD
                    </button>
                    <button
                      onClick={() => setSelectedCred(null)}
                      className="py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20"
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
          <div className="bg-slate-900/80 border border-teal-500/25 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-xs backdrop-blur-xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe size={22} className="text-cyan-400" />
                  Decentralized Identifier
                </h3>
                <p className="text-slate-400 mt-1">
                  The identifier is derived from your SS58 address. The identity pallet stores a DID
                  document <em>CID</em>, not the document itself, and this wallet does not synthesise
                  a public key or a service endpoint that the chain never recorded.
                </p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(didString);
                  addNotification({ type: 'success', message: 'DID String copied to clipboard!' });
                }}
                className="px-4 py-2 bg-slate-800/80 hover:bg-teal-500/20 text-slate-200 hover:text-teal-300 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 border border-slate-700"
              >
                <Copy size={14} /> Copy DID
              </button>
            </div>

            <div className="bg-slate-950/90 p-5 rounded-2xl border border-teal-500/20 font-mono text-[11px] space-y-2 overflow-x-auto">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">id</span>
                <span className="text-teal-300 break-all">{didString}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">verificationMethod</span>
                <span className="text-slate-300">sr25519 (Substrate account key)</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">DID document CID</span>
                <span className={belizeID?.didDocCid ? 'text-cyan-300 break-all' : 'text-amber-300'}>
                  {belizeID?.didDocCid || 'not published on chain'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Identity id</span>
                <span className="text-slate-300">{belizeID?.id ?? '—'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: ZK Proofs */}
        {activeTab === 'zk-proofs' && (
          <div className="bg-slate-900/80 border border-teal-500/25 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-xs backdrop-blur-xl">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <EyeSlash size={22} className="text-teal-400" />
                Zero-Knowledge Selective Disclosure Studio
              </h3>
              <p className="text-slate-400 mt-1">
                Generate cryptographic proofs to verify attributes to third parties without revealing your private data.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/90 p-5 rounded-2xl border border-teal-500/20 space-y-3 flex flex-col justify-between hover:border-teal-400/50 transition-colors">
                <div className="space-y-1.5">
                  <span className="font-bold text-white text-sm block">1. Prove Adult Age (18+)</span>
                  <p className="text-slate-400 text-[11px]">Proves legal adult status for hospitality & banking without revealing exact birthdate.</p>
                </div>
                <button
                  onClick={() => handleGenerateZkProof('age')}
                  disabled={isGeneratingProof}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-90 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-teal-500/20"
                >
                  <Sparkle size={14} weight="bold" />
                  {isGeneratingProof ? 'Proving...' : 'Generate 18+ ZK Proof'}
                </button>
              </div>

              <div className="bg-slate-950/90 p-5 rounded-2xl border border-teal-500/20 space-y-3 flex flex-col justify-between hover:border-teal-400/50 transition-colors">
                <div className="space-y-1.5">
                  <span className="font-bold text-white text-sm block">2. Prove Belizean Citizenship</span>
                  <p className="text-slate-400 text-[11px]">Proves sovereign national status for land ownership and voting without revealing full name.</p>
                </div>
                <button
                  onClick={() => handleGenerateZkProof('citizenship')}
                  disabled={isGeneratingProof}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-90 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-teal-500/20"
                >
                  <ShieldCheck size={14} weight="bold" />
                  {isGeneratingProof ? 'Proving...' : 'Generate Citizen ZK Proof'}
                </button>
              </div>

              <div className="bg-slate-950/90 p-5 rounded-2xl border border-teal-500/20 space-y-3 flex flex-col justify-between hover:border-teal-400/50 transition-colors">
                <div className="space-y-1.5">
                  <span className="font-bold text-white text-sm block">3. Prove Land Tenure</span>
                  <p className="text-slate-400 text-[11px]">Proves real-estate freehold ownership in Ambergris Caye without exposing parcel boundary coordinates.</p>
                </div>
                <button
                  onClick={() => handleGenerateZkProof('land')}
                  disabled={isGeneratingProof}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-cyan-500/20"
                >
                  <ShieldChevron size={14} weight="bold" />
                  {isGeneratingProof ? 'Proving...' : 'Generate Land ZK Proof'}
                </button>
              </div>
            </div>

            {zkProofGenerated && (
              <div className="bg-slate-950/95 p-5 rounded-2xl border border-teal-500/40 space-y-4 font-mono text-[11px] shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-teal-300 font-bold flex items-center gap-2">
                    <Sparkle size={16} />
                    {zkProofGenerated.type}
                  </span>
                  <span className="text-amber-300 font-bold">Design preview only</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">What a proof would attest</span>
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                    {Object.entries(zkProofGenerated.publicInputs).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[11px]">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-white font-bold">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Proof payload</span>
                  <p className="text-teal-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800 break-all text-[10px]">
                    {zkProofGenerated.proof}
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleDownloadVP}
                    className="py-2.5 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20"
                  >
                    <Download size={16} weight="bold" /> Download Verifiable Presentation (.json)
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(zkProofGenerated.proof);
                      addNotification({ type: 'success', message: 'Proof hex copied to clipboard!' });
                    }}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-700"
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
