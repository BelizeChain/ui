'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  ArrowLeft,
  Vault,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  CurrencyDollar,
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
} from 'phosphor-react';

interface MultiSigSigner {
  name: string;
  address: string;
  role: string;
  hasApproved: boolean;
}

interface TreasuryDisbursement {
  id: string;
  title: string;
  recipient: string;
  amount: string;
  category: string;
  status: 'Approved' | 'Pending Signatures' | 'Executed';
  approvals: number;
  requiredApprovals: number;
}

export default function TreasuryPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'disbursements' | 'multisig' | 'amm-liquidity'>('overview');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [signers, setSigners] = useState<MultiSigSigner[]>([
    {
      name: 'Wicked (Founder / Core Protocol)',
      address: 'r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24',
      role: 'Core Engineering Node',
      hasApproved: true,
    },
    {
      name: 'Ceiba Foundation Technical Lead',
      address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      role: 'Technical Committee',
      hasApproved: true,
    },
    {
      name: 'Ecology & Blue Economy Auditor',
      address: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
      role: 'Environmental Grant Oversight',
      hasApproved: false,
    },
    {
      name: 'Municipal District Representative',
      address: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
      role: 'San Pedro / Caye Council',
      hasApproved: false,
    },
  ]);

  const [disbursements, setDisbursements] = useState<TreasuryDisbursement[]>([
    {
      id: 'TR-108',
      title: 'Placencia Marine LoRaWAN Mesh Repeater Array',
      recipient: '5FLSig...59Y (Belize Marine Foundation)',
      amount: '35,000 bBZD',
      category: 'Disaster Telecom',
      status: 'Pending Signatures',
      approvals: 2,
      requiredApprovals: 3,
    },
    {
      id: 'TR-107',
      title: 'Kinich Quantum Circuit OpenQASM 2.0 Studio Grants',
      recipient: 'r1Sa...9sj24 (Ceiba Quantum Research)',
      amount: '50,000 Ɗ',
      category: 'PQC Development',
      status: 'Executed',
      approvals: 3,
      requiredApprovals: 3,
    },
  ]);

  const handleApproveDisbursement = (id: string) => {
    setApprovingId(id);
    setTimeout(() => {
      setDisbursements((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, approvals: d.approvals + 1, status: d.approvals + 1 >= d.requiredApprovals ? 'Approved' : d.status } : d
        )
      );
      setApprovingId(null);
      addNotification({
        type: 'success',
        message: `Cryptographically signed Treasury Disbursement ${id} (3-of-4 Multi-Sig)!`,
      });
    }, 1200);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to view BelizeChain Sovereign Treasury reserves and multi-sig operations." fullScreen />;
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
              <h1 className="text-xl font-bold">BelizeChain Sovereign Treasury</h1>
              <p className="text-xs text-slate-400">National Reserve Vault • 3-of-4 Multi-Sig Governance • Grant Disbursements</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Vault size={16} weight="bold" />
              Multi-Sig Protected
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Sandbox Notice Banner */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-xs">
          <Warning size={20} className="text-amber-400 shrink-0" weight="bold" />
          <p className="text-slate-300 leading-relaxed">
            <strong className="text-amber-300">Testnet Protocol Sandbox:</strong> All treasury balances and stablecoin units reflect simulated testbed protocol parameters. Fiat reserves and Central Bank attestations will activate upon mainnet genesis.
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">DALLA Treasury Vault</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">1,850,000</span>
              <span className="text-[10px] text-emerald-300">Ɗ</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Unpegged native utility coin</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Testnet bBZD Pool</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300 font-mono">450,000</span>
              <span className="text-[10px] text-cyan-200">bBZD</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Testbed stablecoin asset</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Multi-Sig Policy</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400 font-mono">3 of 4</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Consensus Enforced</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Grants</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">2 Projects</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Milestone verified</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto">
          {(['overview', 'disbursements', 'multisig', 'amm-liquidity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[130px] py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'overview'
                ? 'Vault Overview'
                : tab === 'disbursements'
                ? 'Grant Tranches'
                : tab === 'multisig'
                ? 'Multi-Sig Signers'
                : 'AMM Pools'}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Vault size={22} className="text-amber-400" />
                Sovereign Treasury Reserve Structure
              </h3>
              <p className="text-slate-400 mt-1">
                Decentralized on-chain vault funded via block reward inflation (10% allocation) and municipal transaction fee sharing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-bold text-xs uppercase block">Native Ecosystem Reserve (DALLA)</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono block">1,850,000.00 Ɗ</span>
                <p className="text-slate-400 text-[11px]">Allocated for developer grants, validator security bounties, and PQC cryptographic audits.</p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-bold text-xs uppercase block">Testnet Statutory bBZD Reserve</span>
                <span className="text-2xl font-bold text-cyan-300 font-mono block">450,000.00 bBZD</span>
                <p className="text-slate-400 text-[11px]">Simulated sandbox pool for testing municipal public goods funding and emergency relief tranches.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Disbursements */}
        {activeTab === 'disbursements' && (
          <div className="space-y-4">
            {disbursements.map((d) => (
              <div key={d.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold">
                      {d.category}
                    </span>
                    <h3 className="font-bold text-white text-sm mt-1">{d.title}</h3>
                    <span className="text-slate-500 text-[10px] font-mono">Recipient: {d.recipient}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-emerald-400 text-base font-mono block">{d.amount}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        d.status === 'Executed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {d.status} ({d.approvals}/{d.requiredApprovals})
                    </span>
                  </div>
                </div>

                {d.status === 'Pending Signatures' && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleApproveDisbursement(d.id)}
                      disabled={approvingId === d.id}
                      className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <ShieldCheck size={16} weight="bold" />
                      {approvingId === d.id ? 'Signing...' : 'Sign with Multi-Sig Key'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Multi-Sig Signers */}
        {activeTab === 'multisig' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={22} className="text-purple-400" />
                Treasury Multi-Signature Custodians (3-of-4)
              </h3>
              <p className="text-slate-400 mt-1">Requires 3 independent cryptographic signatures for any tranche release.</p>
            </div>

            <div className="space-y-3">
              {signers.map((s) => (
                <div key={s.address} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-sm block">{s.name}</span>
                    <span className="text-slate-400 text-[11px] block">{s.role}</span>
                    <span className="text-slate-500 font-mono text-[10px] block">{s.address}</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      s.hasApproved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.hasApproved ? 'Signed (Epoch #248)' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: AMM Liquidity */}
        {activeTab === 'amm-liquidity' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ChartLineUp size={22} className="text-cyan-400" />
                Automated Market Maker (AMM) Sandbox Pools
              </h3>
              <p className="text-slate-400 mt-1">Constant-product swap liquidity curves on testbed.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm font-mono">DALLA / bBZD Pool</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full">12.4% APY</span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Pool Resv (DALLA):</span>
                    <span className="text-white font-bold">500,000 Ɗ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pool Resv (bBZD):</span>
                    <span className="text-white font-bold">250,000 bBZD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Implied Price:</span>
                    <span className="text-cyan-300 font-bold">1 Ɗ = 0.50 bBZD</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm font-mono">DALLA / DOT Bridge Pool</span>
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold rounded-full">18.2% APY</span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Pool Resv (DALLA):</span>
                    <span className="text-white font-bold">300,000 Ɗ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pool Resv (DOT):</span>
                    <span className="text-white font-bold">12,500 DOT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cross-Chain Route:</span>
                    <span className="text-purple-300 font-bold">Snowbridge Relay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
