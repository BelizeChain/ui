'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  DownloadSimple,
  X,
  CaretRight,
  Lightning,
  Fingerprint,
} from 'phosphor-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface CourseModule {
  id: number;
  title: string;
  category: 'Smart Contracts' | 'Substrate Architecture' | 'LoRa Mesh Networking' | 'Quantum Cryptography' | 'BelizeID & ZK Proofs';
  duration: string;
  rewardDalla: number;
  completed: boolean;
  certificateId?: string;
  lessons: string[];
  quiz: QuizQuestion[];
}

export default function EducationModulesPage() {
  const { selectedAccount, isConnected, balance } = useWallet();
  const { addNotification } = useUIStore();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Interactive Quest Modal State
  const [activeQuest, setActiveQuest] = useState<CourseModule | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isClaimingReward, setIsClaimingReward] = useState(false);

  // Certificate Modal State
  const [inspectedCertificate, setInspectedCertificate] = useState<{
    moduleTitle: string;
    certId: string;
    recipient: string;
    reward: number;
    issueDate: string;
  } | null>(null);

  const [modules, setModules] = useState<CourseModule[]>([
    {
      id: 1,
      title: 'ink! Smart Contract Engineering on GEM Hub',
      category: 'Smart Contracts',
      duration: '45 mins',
      rewardDalla: 50,
      completed: true,
      certificateId: 'CERT-GEM-2026-081',
      lessons: ['Environment Setup & cargo-contract', 'PSP22/PSP34 Token Standards', 'Gas Limits & RefTime'],
      quiz: [
        {
          question: 'What is the native smart contract language for BelizeChain GEM Hub?',
          options: ['Solidity', 'ink! (Rust eDSL)', 'Move', 'Vyper'],
          correctIndex: 1,
          explanation: 'ink! is a Rust-based embedded domain-specific language designed specifically for Substrate contract execution.',
        },
        {
          question: 'Which token standard corresponds to fungible digital currencies in ink! contracts?',
          options: ['ERC-20', 'PSP22', 'PSP34', 'NEP-141'],
          correctIndex: 1,
          explanation: 'PSP22 is the Polkadot standard for fungible tokens, fully supported by the GEM contract studio.',
        },
      ],
    },
    {
      id: 2,
      title: 'LoRa 915MHz Meshtastic Disaster Telecom Protocols',
      category: 'LoRa Mesh Networking',
      duration: '30 mins',
      rewardDalla: 35,
      completed: false,
      lessons: ['Web Bluetooth Radio Pairing', '87-Byte Compressed LoRa Frames', 'Relay Mining Diagnostics'],
      quiz: [
        {
          question: 'What is the maximum payload size for BelizeChain air-gapped LoRa transactions?',
          options: ['256 bytes', '87 bytes', '512 bytes', '1024 bytes'],
          correctIndex: 1,
          explanation: 'Transactions are compressed into an 87-byte binary LoRa frame to maximize transmission range over long-range radio.',
        },
        {
          question: 'What agency utilizes the BelizeChain emergency broadcast system during hurricanes?',
          options: ['FSC', 'NEMO (National Emergency Management Organization)', 'BTB', 'SSB'],
          correctIndex: 1,
          explanation: 'NEMO utilizes the 915MHz LoRa mesh network for resilient emergency warnings during power/telecom outages.',
        },
      ],
    },
    {
      id: 3,
      title: 'Post-Quantum Cryptography & NIST FIPS 204 Integration',
      category: 'Quantum Cryptography',
      duration: '60 mins',
      rewardDalla: 75,
      completed: false,
      lessons: ['CRYSTALS-Dilithium5 Primary Signature', 'Falcon-512 & SPHINCS+ Fallbacks', 'OpenQASM 2.0 State Compression'],
      quiz: [
        {
          question: 'Which lattice-based signature scheme is standardized under NIST FIPS 204 in Kinich Quantum?',
          options: ['RSA-4096', 'ML-DSA (CRYSTALS-Dilithium)', 'ECDSA secp256k1', 'Ed25519'],
          correctIndex: 1,
          explanation: 'ML-DSA (CRYSTALS-Dilithium) is the primary NIST FIPS 204 post-quantum signature algorithm.',
        },
        {
          question: 'What is the surface code lattice distance used in Kinich quantum syndrome decoding?',
          options: ['d=1', 'd=3 and d=5', 'd=10', 'd=100'],
          correctIndex: 1,
          explanation: 'Kinich uses rotated 2D surface code error correction lattices at code distances d=3 and d=5.',
        },
      ],
    },
    {
      id: 4,
      title: 'Substrate Pallet Architecture & FRAME Development',
      category: 'Substrate Architecture',
      duration: '90 mins',
      rewardDalla: 100,
      completed: false,
      lessons: ['Custom Pallet Hooks & On-Initialize', 'Weight Calculation & Benchmarking', 'Forkless Runtime Upgrades'],
      quiz: [
        {
          question: 'How are runtime upgrades deployed on BelizeChain without hard forks?',
          options: ['Manual node restarts', 'On-chain Wasm blob governance proposals', 'Re-compiling genesis', 'PoW miner votes'],
          correctIndex: 1,
          explanation: 'Substrate executes forkless runtime upgrades by voting on and applying compiled Wasm bytecode on-chain.',
        },
        {
          question: 'What database engine is tuned for 2,500 TPS sustained throughput on Ceiba validators?',
          options: ['SQLite', 'RocksDB', 'MongoDB', 'MySQL'],
          correctIndex: 1,
          explanation: 'RocksDB column families and memory buffers are tuned on Ceiba nodes for high-throughput state access.',
        },
      ],
    },
    {
      id: 5,
      title: 'BelizeID Sovereign DID & Zero-Knowledge Snarks',
      category: 'BelizeID & ZK Proofs',
      duration: '40 mins',
      rewardDalla: 60,
      completed: false,
      lessons: ['W3C DID Document Resolution', 'Groth16 Snark Prover', 'Selective Disclosure Credentials'],
      quiz: [
        {
          question: 'What allows a citizen to prove they are 18+ without revealing their date of birth?',
          options: ['Public identity registry', 'Zero-Knowledge Selective Disclosure Proof', 'Manual passport photocopy', 'Centralized API'],
          correctIndex: 1,
          explanation: 'Groth16 ZK-Snark proofs verify that birthYear <= 2008 mathematically without disclosing the exact birth timestamp.',
        },
        {
          question: 'What is the format of Belize sovereign decentralized identifiers?',
          options: ['id:belize:123', 'did:belize:<ss58_address>', 'urn:belize:did', 'did:eth:<address>'],
          correctIndex: 1,
          explanation: 'BelizeID follows the W3C DID standard with method did:belize anchored to the citizen SS58 address.',
        },
      ],
    },
  ]);

  // Start Quest Runner
  const handleStartQuest = (module: CourseModule) => {
    setActiveQuest(module);
    setCurrentQuestionIdx(0);
    setSelectedAnswerIdx(null);
    setIsAnswerSubmitted(false);
    setCorrectAnswersCount(0);
  };

  // Submit Answer in Quest
  const handleSubmitAnswer = () => {
    if (selectedAnswerIdx === null || !activeQuest) return;

    const currentQ = activeQuest.quiz[currentQuestionIdx];
    const isCorrect = selectedAnswerIdx === currentQ.correctIndex;

    if (isCorrect) {
      setCorrectAnswersCount((prev) => prev + 1);
    }
    setIsAnswerSubmitted(true);
  };

  // Next Question or Finish
  const handleNextQuestion = () => {
    if (!activeQuest) return;

    if (currentQuestionIdx + 1 < activeQuest.quiz.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedAnswerIdx(null);
      setIsAnswerSubmitted(false);
    } else {
      // Finished all questions!
      setIsClaimingReward(true);
      setTimeout(() => {
        const certId = `CERT-${activeQuest.category.substring(0, 3).toUpperCase()}-2026-${Math.floor(100 + Math.random() * 900)}`;

        setModules((prev) =>
          prev.map((m) => (m.id === activeQuest.id ? { ...m, completed: true, certificateId: certId } : m))
        );

        setIsClaimingReward(false);
        setActiveQuest(null);

        addNotification({
          type: 'success',
          message: `Passed with score ${correctAnswersCount + (selectedAnswerIdx === activeQuest.quiz[currentQuestionIdx].correctIndex ? 1 : 0)}/${activeQuest.quiz.length}! Earned +${activeQuest.rewardDalla} Ɗ and minted ${certId}!`,
        });
      }, 1200);
    }
  };

  // Filtered Modules
  const filteredModules = modules.filter(
    (m) => activeCategory === 'ALL' || m.category === activeCategory
  );

  const completedCount = modules.filter((m) => m.completed).length;
  const totalEarnedDalla = modules.filter((m) => m.completed).reduce((acc, m) => acc + m.rewardDalla, 0);
  const remainingBountyDalla = modules.filter((m) => !m.completed).reduce((acc, m) => acc + m.rewardDalla, 0);

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to access Maya Academy learn-to-earn developer quests and verifiable credentials."
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
                <GraduationCap size={22} className="text-purple-400" />
                Maya Academy (Learn-to-Earn)
              </h1>
              <p className="text-xs text-slate-400">
                Interactive Developer Quests • Substrate & ink! Tutorials • BelizeID Verifiable Credentials
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold font-mono flex items-center gap-1.5">
              <Sparkle size={14} weight="bold" />
              Mainnet Study Grants
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Completed Quests</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white">
                {completedCount} / {modules.length}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                style={{ width: `${(completedCount / modules.length) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-purple-300 font-semibold block">{completedCount} Verifiable Badges</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Earned Study Grants</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-emerald-400">+{totalEarnedDalla}</span>
              <span className="text-xs text-emerald-300 font-bold">Ɗ</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Deposited to sovereign account</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Available Bounty Pool</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-cyan-300">+{remainingBountyDalla}</span>
              <span className="text-xs text-cyan-200 font-bold">Ɗ</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Ready to unlock via quizzes</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">DID Verification</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-purple-300">did:belize</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck size={14} weight="fill" /> W3C Standard Proofs
            </span>
          </div>
        </div>

        {/* Category Selector Pills */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-2xl p-1 overflow-x-auto text-xs font-bold gap-1">
          {['ALL', 'Smart Contracts', 'LoRa Mesh Networking', 'Quantum Cryptography', 'Substrate Architecture', 'BelizeID & ZK Proofs'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'ALL' ? 'All Academy Quests' : cat}
              </button>
            )
          )}
        </div>

        {/* Quests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModules.map((module) => (
            <div
              key={module.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[10px] font-bold font-mono">
                    {module.category}
                  </span>
                  <span className="text-slate-400 text-xs flex items-center gap-1 font-mono">
                    <Clock size={14} /> {module.duration}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white tracking-wide">{module.title}</h3>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Curriculum Syllabus</span>
                  {module.lessons.map((lesson, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-300 text-[11px]">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[9px] font-bold">
                        {idx + 1}
                      </span>
                      <span>{lesson}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-slate-400 text-xs">Reward:</span>
                  <span className="text-base font-bold font-mono text-emerald-400">+{module.rewardDalla} Ɗ</span>
                </div>

                {module.completed ? (
                  <button
                    onClick={() =>
                      setInspectedCertificate({
                        moduleTitle: module.title,
                        certId: module.certificateId || 'CERT-BELIZE-2026',
                        recipient: selectedAccount.address,
                        reward: module.rewardDalla,
                        issueDate: 'August 28, 2026',
                      })
                    }
                    className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Trophy size={16} weight="fill" />
                    View Certificate
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartQuest(module)}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-500/20"
                  >
                    <Sparkle size={16} weight="bold" />
                    Start Quest & Earn
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Interactive Quest Modal */}
      <AnimatePresence>
        {activeQuest && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative text-xs"
            >
              <button
                onClick={() => setActiveQuest(null)}
                className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="space-y-1">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[10px] font-bold font-mono">
                  Question {currentQuestionIdx + 1} of {activeQuest.quiz.length}
                </span>
                <h3 className="text-base font-bold text-white pt-2">{activeQuest.title}</h3>
              </div>

              {/* Question Text */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-sm font-semibold text-white leading-relaxed">
                  {activeQuest.quiz[currentQuestionIdx].question}
                </p>

                {/* Multiple Choice Options */}
                <div className="space-y-2 pt-2">
                  {activeQuest.quiz[currentQuestionIdx].options.map((opt, idx) => {
                    const isSelected = selectedAnswerIdx === idx;
                    const isCorrect = idx === activeQuest.quiz[currentQuestionIdx].correctIndex;
                    let optionStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-purple-500/40';

                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        optionStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-300';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'bg-rose-950/40 border-rose-500 text-rose-300';
                      }
                    } else if (isSelected) {
                      optionStyle = 'bg-purple-950/40 border-purple-500 text-purple-200';
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswerSubmitted}
                        onClick={() => setSelectedAnswerIdx(idx)}
                        className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${optionStyle}`}
                      >
                        <span className="font-mono text-xs">{opt}</span>
                        {isAnswerSubmitted && isCorrect && <CheckCircle size={18} className="text-emerald-400" weight="fill" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation Banner */}
              {isAnswerSubmitted && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="font-bold text-purple-300 text-xs block">Engineering Explanation:</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {activeQuest.quiz[currentQuestionIdx].explanation}
                  </p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400 font-mono text-[11px]">
                  Reward Bounty: <span className="text-emerald-400 font-bold">+{activeQuest.rewardDalla} Ɗ</span>
                </span>

                {!isAnswerSubmitted ? (
                  <button
                    disabled={selectedAnswerIdx === null}
                    onClick={handleSubmitAnswer}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    disabled={isClaimingReward}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center gap-1.5"
                  >
                    {isClaimingReward ? (
                      'Minting Credential...'
                    ) : currentQuestionIdx + 1 < activeQuest.quiz.length ? (
                      'Next Question ➔'
                    ) : (
                      'Claim +50 Ɗ Grant & Mint Badge'
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Verifiable Certificate Modal */}
      <AnimatePresence>
        {inspectedCertificate && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative text-xs"
            >
              <button
                onClick={() => setInspectedCertificate(null)}
                className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-2 border-b border-slate-800 pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Trophy size={32} className="text-white" weight="fill" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">BelizeID Verifiable Credential</h3>
                <p className="text-xs text-purple-300 font-mono">{inspectedCertificate.certId}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Certified Course:</span>
                  <span className="text-white font-bold text-right">{inspectedCertificate.moduleTitle}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Recipient DID:</span>
                  <span className="text-cyan-300">did:belize:{inspectedCertificate.recipient.slice(0, 10)}...</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Issuer:</span>
                  <span className="text-purple-300">Maya Academy Sovereign Foundation</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Grant Paid:</span>
                  <span className="text-emerald-400 font-bold">+{inspectedCertificate.reward} DALLA</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Date Issued:</span>
                  <span className="text-slate-200">{inspectedCertificate.issueDate}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(inspectedCertificate, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', dataStr);
                    downloadAnchor.setAttribute('download', `${inspectedCertificate.certId}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    addNotification({ type: 'success', message: 'Downloaded verifiable credential JSON presentation!' });
                  }}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <DownloadSimple size={16} weight="bold" />
                  Download Credential (.json)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
