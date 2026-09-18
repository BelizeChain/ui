'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  getTreasuryBalance,
  getTreasurySpendProposals,
  type TreasurySpendProposalView,
} from '@/services/pallets/treasury';
import {
  Vault,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ChartLineUp,
  ShieldCheck,
  Coins,
  Sparkle,
  Check,
  Warning,
  Scales,
  ArrowLeft,
  Receipt,
  Plus,
  FileText,
  X,
} from 'phosphor-react';

interface MultiSigSigner {
  name: string;
  address: string;
  role: string;
  hasApproved: boolean;
  signedTimestamp?: string;
}

interface TreasuryDisbursement {
  id: string;
  title: string;
  recipient: string;
  amount: string;
  category: 'Disaster Telecom' | 'PQC Cryptography' | 'Blue Carbon Ecology' | 'Solar Infrastructure' | 'Civic Education';
  status: 'Approved' | 'Pending Signatures' | 'Executed';
  approvals: number;
  requiredApprovals: number;
  signers: string[];
  executionTxHash?: string;
  description: string;
}

export default function TreasuryPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'disbursements' | 'multisig' | 'liquidity'>('overview');

  const [signers, setSigners] = useState<MultiSigSigner[]>([
    {
      name: 'Wicked (Founder & Lead Architect)',
      address: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      role: 'Core Protocol Engineering Node',
      hasApproved: true,
      signedTimestamp: 'Block #1,492,100 (2h ago)',
    },
    {
      name: 'Ceiba Foundation Technical Directorate',
      address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      role: 'Consensus & Runtime Security Council',
      hasApproved: true,
      signedTimestamp: 'Block #1,492,140 (1h ago)',
    },
    {
      name: 'Belize Blue Economy & Ecological Auditor',
      address: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
      role: 'Barrier Reef Carbon & Grants Oversight',
      hasApproved: false,
    },
    {
      name: 'Municipal District Council Trustee',
      address: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
      role: 'San Pedro / Belmopan Civic Representation',
      hasApproved: false,
    },
  ]);

  // CONFIG-002: real treasury spend proposals from the governance pallet.
  const [disbursements, setDisbursements] = useState<TreasurySpendProposalView[]>([]);
  const [treasuryLoading, setTreasuryLoading] = useState(true);
  const [treasuryError, setTreasuryError] = useState('');
  const [treasuryBalance, setTreasuryBalance] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setTreasuryLoading(true);
      try {
        const [proposals, balance] = await Promise.all([
          getTreasurySpendProposals(),
          getTreasuryBalance(),
        ]);
        if (cancelled) return;
        setDisbursements(proposals);
        setTreasuryBalance(balance.freeDalla);
        setTreasuryError('');
      } catch (err) {
        if (!cancelled) {
          setTreasuryError(err instanceof Error ? err.message : String(err));
          setDisbursements([]);
        }
      } finally {
        if (!cancelled) setTreasuryLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // CONFIG-002: approve/execute are multi-sig governance extrinsics not yet
  // exposed from this page. Show honest gates instead of fake approval flows.
  const handleApproveDisbursement = (id: number) => {
    addNotification({
      type: 'info',
      message: `Proposal #${id} voting happens through the governance flow (castVote). Open the proposal to vote — this page is currently read-only.`,
    });
  };

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to view BelizeChain Sovereign Treasury reserves and multi-sig operations."
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
                <Vault size={22} className="text-amber-400" />
                BelizeChain Sovereign Treasury & Multi-Sig Vault
              </h1>
              <p className="text-xs text-slate-400">
                National Reserve Assets • 3-of-4 Cryptographic Governance • Civic & Ecological Grant Tranches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold font-mono flex items-center gap-1.5">
              <ShieldCheck size={14} weight="fill" />
              3-of-4 Multi-Sig Protected
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: DALLA Vault */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">DALLA Native Reserve</span>
              <Coins size={18} className="text-emerald-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-emerald-400">1,850,000.00 Ɗ</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Backing Ratio:</span>
              <span className="text-emerald-300 font-bold">100% On-Chain</span>
            </div>
          </div>

          {/* Card 2: bBZD Stable Reserve */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Statutory bBZD Reserve</span>
              <Wallet size={18} className="text-cyan-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-cyan-300">BZ$ 4,750,000.00</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Audited Fiat Backing:</span>
              <span className="text-cyan-300 font-bold">Central Bank Attested</span>
            </div>
          </div>

          {/* Card 3: Multi-Sig Quorum */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Governance Quorum</span>
              <Users size={18} className="text-purple-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-purple-300">3 of 4 Keys</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Security Standard:</span>
              <span className="text-slate-300">Substrate Native Multi-Sig</span>
            </div>
          </div>

          {/* Card 4: Active Public Grants */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Active Civic Grants</span>
              <Scales size={18} className="text-amber-400" />
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-amber-300">3 Verified Projects</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Committed Capital:</span>
              <span className="text-emerald-400 font-bold">165,000 bBZD / Ɗ</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-2xl p-1 overflow-x-auto text-xs font-bold gap-1">
          {(['overview', 'disbursements', 'multisig', 'liquidity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 rounded-xl capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'overview'
                ? 'Reserve Vault Structure'
                : tab === 'disbursements'
                ? 'Grant Tranches & Disbursements'
                : tab === 'multisig'
                ? 'Multi-Sig Key Custodians'
                : 'Sovereign AMM Liquidity'}
            </button>
          ))}
        </div>

        {/* Tab 1: Reserve Vault Structure */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Vault size={22} className="text-amber-400" />
                  National Treasury Asset Reserves & Inflow Telemetry
                </h3>
                <p className="text-slate-400 mt-1">
                  On-chain sovereign reserve continuously capitalized via 10% block reward allocation, statutory land title registry fees, and carbon credit issuance royalties.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-400">Consensus Reserve</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md font-mono text-[10px] font-bold">
                      Native Ɗ
                    </span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-emerald-400 block">1,850,000.00 Ɗ</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Ecosystem reserve pool dedicated for validator incentives, zero-knowledge verification bounties, and Kinich quantum computing compiler development.
                  </p>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-400">Statutory Stable Reserve</span>
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-md font-mono text-[10px] font-bold">
                      bBZD Pegged
                    </span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-cyan-300 block">BZ$ 4,750,000.00</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Statutory reserves dedicated for municipal infrastructure disbursements, disaster recovery lines, and public health micro-grants across Belize.
                  </p>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-400">Cross-Chain Collateral</span>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-md font-mono text-[10px] font-bold">
                      Polkadot / Bridge
                    </span>
                  </div>
                  <span className="text-2xl font-bold font-mono text-purple-300 block">250,000.00 wDOT</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Sovereign inter-chain liquidity bridge reserve backing Snowbridge foreign exchange settlement and multi-network interoperability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Grant Tranches & Disbursements */}
        {activeTab === 'disbursements' && (
          <div className="space-y-4">
            {disbursements.map((d) => (
              <div
                key={d.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl backdrop-blur-md text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold">
                        {d.beneficiary ? 'Treasury Spend' : 'Proposal'}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px] font-bold">#{d.id}</span>
                    </div>
                    <h3 className="font-bold text-white text-base">{d.title}</h3>
                    <span className="text-slate-400 text-xs font-mono">Beneficiary: {d.beneficiary || "none"}</span>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-bold text-emerald-400 text-lg block">{d.amountDalla} DALLA</span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold inline-block mt-1 ${
                        d.status === 'Executed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : d.status === 'Approved'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {d.status} ({d.voteCount.ayes} ayes / {d.voteCount.nays} nays)
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 leading-relaxed text-xs">{d.description}</p>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Proposer:</span>
                    <span className="text-slate-300">{d.proposer}</span>
                  </div>

                  {d.voteEnd > 0 && (
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Voting Ends:</span>
                      <span className="text-cyan-400 font-bold">{new Date(d.voteEnd).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleApproveDisbursement(d.id)}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
                  >
                    <ShieldCheck size={16} weight="bold" />
                    {d.status === 'Pending' || d.status === 'Active' ? 'Vote on Proposal' : 'View Status'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Multi-Sig Key Custodians */}
        {activeTab === 'multisig' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={22} className="text-purple-400" />
                BelizeChain Sovereign Multi-Signature Custodians (3-of-4 Quorum)
              </h3>
              <p className="text-slate-400 mt-1">
                Any movement of sovereign national reserves or protocol upgrade authorization strictly requires at least 3 valid cryptographic signatures.
              </p>
            </div>

            <div className="space-y-3">
              {signers.map((s) => (
                <div
                  key={s.address}
                  className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm block">{s.name}</span>
                    <span className="text-slate-400 text-xs">{s.role}</span>
                    <span className="text-slate-500 font-mono text-[10px] block">{s.address}</span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono inline-block ${
                        s.hasApproved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {s.hasApproved ? 'Signed (Epoch #248)' : 'Pending Quorum'}
                    </span>
                    {s.signedTimestamp && (
                      <span className="text-slate-500 text-[10px] block mt-1 font-mono">{s.signedTimestamp}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Sovereign AMM Liquidity */}
        {activeTab === 'liquidity' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ChartLineUp size={22} className="text-cyan-400" />
                Sovereign Automated Market Maker (AMM) Liquidity Reserves
              </h3>
              <p className="text-slate-400 mt-1">
                Constant-product market maker pools stabilizing the statutory bBZD exchange peg and ensuring zero-slippage trade execution.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="font-bold text-white text-base font-mono">DALLA / bBZD Sovereign Pool</span>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono rounded-full">
                    12.4% APY
                  </span>
                </div>
                <div className="space-y-2 font-mono text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Pool Reserve (DALLA):</span>
                    <span className="text-white font-bold">500,000.00 Ɗ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pool Reserve (bBZD):</span>
                    <span className="text-white font-bold">2,500,000.00 bBZD</span>
                  </div>
                  <div className="flex justify-between text-cyan-300 font-bold pt-1 border-t border-slate-800">
                    <span>Implied Target Exchange Rate:</span>
                    <span>1 Ɗ = 5.00 bBZD</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="font-bold text-white text-base font-mono">bBZD / USD Treasury FX Pool</span>
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-bold font-mono rounded-full">
                    Fixed Peg
                  </span>
                </div>
                <div className="space-y-2 font-mono text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Pool Reserve (bBZD):</span>
                    <span className="text-white font-bold">2,000,000.00 bBZD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pool Reserve (USD Reserves):</span>
                    <span className="text-white font-bold">$1,000,000.00 USD</span>
                  </div>
                  <div className="flex justify-between text-emerald-300 font-bold pt-1 border-t border-slate-800">
                    <span>Statutory Peg Ratio:</span>
                    <span>2.00 bBZD = 1.00 USD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
