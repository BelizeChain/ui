'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  ShieldCheck,
  ArrowLeft,
  LockKey,
  Users,
  Clock,
  Warning,
  CheckCircle,
  FileText,
  DownloadSimple,
  Check,
  X,
  Buildings,
  Plus,
  Coins,
  Sparkle,
  Eye,
} from 'phosphor-react';

interface VaultTransaction {
  id: string;
  vaultName: string;
  recipient: string;
  amount: string;
  currency: 'bBZD' | 'DALLA';
  purpose: string;
  requiredSignatures: number;
  currentSignatures: number;
  signers: { name: string; address: string; signed: boolean }[];
  timelockRemaining: string;
  status: 'PENDING_APPROVAL' | 'TIMELOCK_ACTIVE' | 'EXECUTABLE' | 'EXECUTED' | 'FROZEN';
}

export default function CustodyPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeVault, setActiveVault] = useState<'sovereign-treasury' | 'ministry-finance' | 'fsc-escrow'>('sovereign-treasury');

  const [transactions, setTransactions] = useState<VaultTransaction[]>([
    {
      id: 'tx-v1',
      vaultName: 'Ministry of Infrastructure CapEx Vault (7-of-10)',
      recipient: 'r1Sa...9sj24 (Placencia Road Contractor)',
      amount: '250,000.00',
      currency: 'bBZD',
      purpose: 'Highway Culvert & Coastal Sea Wall Maintenance Phase 2',
      requiredSignatures: 7,
      currentSignatures: 5,
      signers: [
        { name: 'Financial Secretary', address: '5Cg3...SKt', signed: true },
        { name: 'Chief Engineer', address: '5FHn...4ty', signed: true },
        { name: 'Auditor General', address: '5DAA...9pq', signed: true },
        { name: 'Belize City District Rep', address: '5EBB...21x', signed: true },
        { name: 'Stann Creek District Rep', address: '5FCC...88a', signed: true },
        { name: 'FSC Compliance Officer', address: '5HDD...33m', signed: false },
        { name: 'Central Bank Custodian', address: '5KEE...77z', signed: false },
      ],
      timelockRemaining: '36h 15m',
      status: 'PENDING_APPROVAL',
    },
    {
      id: 'tx-02',
      vaultName: 'SSB Statutory Reserve Fund (10-of-15)',
      recipient: 'ssb-pension-tranche-sep2026.bz',
      amount: '1,200,000.00',
      currency: 'bBZD',
      purpose: 'Statutory Pension & Disability Payout Tranche Disbursement',
      requiredSignatures: 10,
      currentSignatures: 10,
      signers: [],
      timelockRemaining: 'Ready to Execute',
      status: 'EXECUTABLE',
    },
  ]);

  const handleSignTransaction = (txId: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === txId) {
          const newSigs = tx.currentSignatures + 1;
          const nextStatus = newSigs >= tx.requiredSignatures ? 'EXECUTABLE' : 'PENDING_APPROVAL';
          addNotification({
            type: 'success',
            message: `Cryptographically signed transaction ${txId}. Threshold progress: ${newSigs}/${tx.requiredSignatures}!`,
          });
          return {
            ...tx,
            currentSignatures: newSigs,
            status: nextStatus,
          };
        }
        return tx;
      })
    );
  };

  const handleEmergencyFreeze = (txId: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === txId) {
          addNotification({
            type: 'warning',
            message: `EMERGENCY VETO TRIGGERED: Transaction ${txId} frozen for 14 days pending FSC review!`,
          });
          return { ...tx, status: 'FROZEN' };
        }
        return tx;
      })
    );
  };

  const handleExportAudit = () => {
    addNotification({
      type: 'success',
      message: 'Generated FSC-Compliant Cryptographic Audit Log (JSON-LD & PDF Package).',
    });
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to access institutional multi-sig custody vaults." fullScreen />;
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
              <h1 className="text-xl font-bold">Institutional Custody & Vaults</h1>
              <p className="text-xs text-slate-400">Enterprise M-of-N Multi-Sig • 48-Hour Timelock • FSC Compliance Trail</p>
            </div>
          </div>
          <button
            onClick={handleExportAudit}
            className="px-3.5 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <DownloadSimple size={16} weight="bold" />
            FSC Audit Log
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Enterprise Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Sovereign Vaults</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">3 Vaults</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">100% Cryptographic Security</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Custodied Assets</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300 font-mono">BZ$ 8,450,000</span>
            </div>
            <span className="text-[11px] text-slate-400 block">bBZD & DALLA Reserves</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Timelock Protection</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400 font-mono">48 Hours</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Mandatory veto window</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">FSC Regulatory Grade</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400">Class 1 Sovereign</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Compliant with FSC Act</span>
          </div>
        </div>

        {/* Multi-Sig Pending Tranches */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
            Pending Multi-Sig Authorizations & Timelocks ({transactions.length})
          </h2>

          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-purple-400">
                      <Buildings size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{tx.vaultName}</h3>
                      <span className="text-slate-400 text-xs">{tx.purpose}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-cyan-300 text-lg font-mono block">
                      {tx.currency === 'bBZD' ? `BZ$ ${tx.amount}` : `${tx.amount} Ɗ`}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-1 ${
                      tx.status === 'EXECUTABLE'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : tx.status === 'FROZEN'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {tx.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[11px] text-slate-400">
                    <span>Threshold: {tx.currentSignatures} of {tx.requiredSignatures} Signatures Collected</span>
                    <span>Timelock: {tx.timelockRemaining}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2.5 transition-all duration-500"
                      style={{ width: `${(tx.currentSignatures / tx.requiredSignatures) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Signers Matrix */}
                {tx.signers.length > 0 && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Signatory Roll</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tx.signers.map((s) => (
                        <div key={s.name} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300">{s.name}</span>
                          <span className={`flex items-center gap-1 font-mono font-semibold ${s.signed ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {s.signed ? <Check size={14} weight="bold" /> : <Clock size={14} />}
                            {s.signed ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleEmergencyFreeze(tx.id)}
                    className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <LockKey size={16} weight="bold" />
                    Emergency Freeze Veto
                  </button>

                  <button
                    onClick={() => handleSignTransaction(tx.id)}
                    disabled={tx.status === 'FROZEN'}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg"
                  >
                    <ShieldCheck size={16} weight="bold" />
                    Sign with BelizeID Key
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
