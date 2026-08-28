'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  GraduationCap,
  Trophy,
  Clock,
  Users,
  CheckCircle,
  ArrowLeft,
  BookOpen,
  Code,
  Broadcast,
  Atom,
  Sparkle,
  Coins,
  ShieldCheck,
  Check,
} from 'phosphor-react';

interface CourseModule {
  id: number;
  title: string;
  category: 'Smart Contracts' | 'Substrate Architecture' | 'LoRa Mesh Networking' | 'Quantum Cryptography';
  duration: string;
  rewardDalla: number;
  completed: boolean;
  lessons: string[];
}

export default function EducationModulesPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [modules, setModules] = useState<CourseModule[]>([
    {
      id: 1,
      title: 'ink! v5 Smart Contract Engineering on GEM',
      category: 'Smart Contracts',
      duration: '45 mins',
      rewardDalla: 50,
      completed: true,
      lessons: ['Environment Setup & cargo-contract', 'PSP22/PSP34 Token Standards', 'Gas Limits & RefTime'],
    },
    {
      id: 2,
      title: 'LoRa 915MHz Meshtastic Disaster Telecom Protocols',
      category: 'LoRa Mesh Networking',
      duration: '30 mins',
      rewardDalla: 35,
      completed: false,
      lessons: ['Web Bluetooth Radio Pairing', '87-Byte Compressed Frames', 'Relay Mining Diagnostics'],
    },
    {
      id: 3,
      title: 'Post-Quantum Cryptography & NIST FIPS 204',
      category: 'Quantum Cryptography',
      duration: '60 mins',
      rewardDalla: 75,
      completed: false,
      lessons: ['CRYSTALS-Dilithium5 Keys', 'Falcon-512 & SPHINCS+', 'OpenQASM 2.0 Quantum Circuits'],
    },
    {
      id: 4,
      title: 'Substrate Pallet Architecture & FRAME Development',
      category: 'Substrate Architecture',
      duration: '90 mins',
      rewardDalla: 100,
      completed: false,
      lessons: ['Custom Pallet Hooks', 'Weight Calculation & Benchmarking', 'Runtime Upgrade Migrations'],
    },
  ]);

  const [completingId, setCompletingId] = useState<number | null>(null);

  const handleCompleteModule = (id: number) => {
    setCompletingId(id);
    setTimeout(() => {
      setModules((prev) =>
        prev.map((m) => (m.id === id ? { ...m, completed: true } : m))
      );
      const mod = modules.find((m) => m.id === id);
      setCompletingId(null);
      addNotification({
        type: 'success',
        message: `Completed "${mod?.title}"! Earned ${mod?.rewardDalla} Ɗ and minted BelizeID Verifiable Knowledge Credential!`,
      });
    }, 1300);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to participate in Maya Academy learn-to-earn courses." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/community">
              <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors">
                <ArrowLeft size={24} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Maya Academy (Learn-to-Earn)</h1>
              <p className="text-xs text-slate-400">Web3 & Substrate Engineering • PQC Cryptography • DALLA Grants</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <GraduationCap size={16} weight="bold" />
              Learn-to-Earn Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Completed Modules</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white font-mono">{modules.filter((m) => m.completed).length} / {modules.length}</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">1 Verifiable Certificate</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Earned Study Grants</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {modules.filter((m) => m.completed).reduce((sum, m) => sum + m.rewardDalla, 0)} Ɗ
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">Deposited to wallet</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Available Bounty Pool</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-cyan-300 font-mono">
                {modules.filter((m) => !m.completed).reduce((sum, m) => sum + m.rewardDalla, 0)} Ɗ
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">Ready to unlock</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Credential Storage</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-purple-400">BelizeID</span>
            </div>
            <span className="text-[11px] text-slate-400 block">W3C Verifiable Credential</span>
          </div>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
            Academy Curriculum & Developer Quests
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((m) => (
              <div
                key={m.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-5 space-y-4 shadow-xl text-xs flex flex-col justify-between transition-all"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 font-bold rounded-full text-[10px]">
                      {m.category}
                    </span>
                    <span className="text-slate-400 text-[10px] flex items-center gap-1 font-mono">
                      <Clock size={12} /> {m.duration}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm">{m.title}</h3>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Syllabus Lessons</span>
                    {m.lessons.map((l, idx) => (
                      <div key={l} className="flex items-center gap-2 text-slate-300 text-[10px]">
                        <span className="text-slate-500">{idx + 1}.</span>
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center">
                  <div className="flex items-baseline gap-1">
                    <span className="text-slate-400 text-[11px]">Grant Reward:</span>
                    <span className="font-bold text-emerald-400 text-sm font-mono">+{m.rewardDalla} Ɗ</span>
                  </div>

                  {m.completed ? (
                    <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-xl font-bold text-xs flex items-center gap-1">
                      <Check size={14} weight="bold" /> Completed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCompleteModule(m.id)}
                      disabled={completingId === m.id}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md"
                    >
                      <Sparkle size={14} weight="bold" />
                      {completingId === m.id ? 'Evaluating Quiz...' : 'Start Quest & Earn'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
