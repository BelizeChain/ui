'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  ArrowLeft,
  CheckCircle,
  CircleNotch,
  Clock,
  GraduationCap,
  Info,
  Sparkle,
  Trophy,
  X,
} from 'phosphor-react';
import {
  completeEducationModule,
  getEducationModules,
  getUserEducationProgress,
  type EducationModule,
} from '@/services/pallets/community';

/** An on-chain module joined with the connected account's completion state. */
interface ModuleView extends EducationModule {
  completed: boolean;
  completedAtBlock?: number;
}

/** Cap long on-chain strings so they cannot break the layout. */
function clip(value: string, max = 240): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export default function EducationModulesPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [modules, setModules] = useState<ModuleView[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'unreachable'>('loading');
  const [submittingModuleId, setSubmittingModuleId] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<{ moduleId: number; title: string; amount: string } | null>(
    null,
  );

  const address = selectedAccount?.address;

  const loadModules = useCallback(async () => {
    const [modulesResult, progressResult] = await Promise.allSettled([
      getEducationModules(),
      address ? getUserEducationProgress(address) : Promise.resolve([]),
    ]);

    if (modulesResult.status === 'rejected') {
      setLoadState('unreachable');
      return;
    }

    const progress = progressResult.status === 'fulfilled' ? progressResult.value : [];
    const progressByModule = new Map(progress.map((entry) => [entry.moduleId, entry]));

    setModules(
      modulesResult.value.map((module) => {
        const completion = progressByModule.get(module.moduleId);
        return {
          ...module,
          completed: Boolean(completion),
          completedAtBlock: completion?.completedAt,
        };
      }),
    );
    setLoadState('ready');
  }, [address]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await loadModules();
    };
    void run();
    const interval = setInterval(run, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadModules]);

  const handleComplete = useCallback(
    async (module: ModuleView) => {
      if (!address) return;
      setSubmittingModuleId(module.moduleId);
      try {
        // `complete_education_module` records this payload without verifying it,
        // so completion is self-attested. Include enough context to be auditable
        // off-chain; the pallet rejects an empty proof.
        const proof = JSON.stringify({
          v: 1,
          kind: 'maya-academy-module-completion',
          moduleId: module.moduleId,
          account: address,
          submittedAt: new Date().toISOString(),
        });

        const { rewardAmount } = await completeEducationModule(address, module.moduleId, proof);
        setReceipt({ moduleId: module.moduleId, title: module.title, amount: rewardAmount });
        addNotification({
          type: 'success',
          message: `“${module.title}” recorded on chain. Reward: +${rewardAmount} DALLA.`,
        });
        await loadModules();
      } catch (error) {
        addNotification({
          type: 'error',
          message: `Could not submit module completion: ${(error as Error).message}`,
        });
      } finally {
        setSubmittingModuleId(null);
      }
    },
    [address, addNotification, loadModules],
  );

  const completedCount = modules.filter((module) => module.completed).length;
  const earnedTotal = modules
    .filter((module) => module.completed)
    .reduce((sum, module) => sum + (Number.parseFloat(module.rewardAmount) || 0), 0);
  const openCount = modules.filter((module) => module.active && !module.completed).length;
  const chainCompletions = modules.reduce((sum, module) => sum + module.totalCompletions, 0);

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to view on-chain education modules and claim learn-to-earn rewards."
        fullScreen
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col font-sans pb-24">
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
                On-chain education modules • Rewards paid in DALLA by the community pallet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold font-mono flex items-center gap-1.5">
              <Sparkle size={14} weight="bold" />
              On-chain
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Honest disclosure */}
        <div
          role="note"
          className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4"
        >
          <Info size={20} weight="fill" className="mt-0.5 flex-shrink-0 text-amber-400" />
          <div className="text-sm text-amber-200">
            <p className="font-semibold mb-1">Completion is self-attested</p>
            <p className="text-amber-200/90">
              Modules and reward amounts below are read from the chain&apos;s community pallet. The
              pallet records the proof you submit but does not verify it, so the completion is an
              attestation you make. Rewards are minted automatically and are limited by the
              module&apos;s capacity and the network supply cap.
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Completed Modules
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white">
                {completedCount} / {modules.length}
              </span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full"
                style={{
                  width: `${modules.length > 0 ? (completedCount / modules.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Rewards Earned
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                +{earnedTotal.toFixed(2)}
              </span>
              <span className="text-xs text-emerald-300 font-bold">Ɗ</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Minted to your account</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Modules Available
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-cyan-300">{openCount}</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Active and not yet completed</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-md space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Network Completions
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white">{chainCompletions}</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Across all accounts</span>
          </div>
        </div>

        {/* Modules */}
        {loadState === 'loading' && modules.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <CircleNotch size={20} className="animate-spin" />
            <span className="text-sm">Loading modules from the chain…</span>
          </div>
        ) : loadState === 'unreachable' ? (
          <div className="text-center py-16 border border-rose-500/30 bg-rose-500/5 rounded-3xl">
            <p className="text-rose-300 font-semibold">Could not reach the chain</p>
            <p className="text-sm text-slate-400 mt-1">
              The module list is unavailable. Your progress is not affected.
            </p>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-16 border border-slate-800 bg-slate-900/60 rounded-3xl">
            <GraduationCap size={56} className="text-slate-600 mx-auto mb-4" weight="duotone" />
            <p className="text-slate-300 font-semibold">No education modules registered</p>
            <p className="text-sm text-slate-500 mt-1">
              The community pallet has no modules yet. Check back once they are added on chain.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((module) => {
              const capReached =
                module.maxCompletions !== null && module.totalCompletions >= module.maxCompletions;
              const isSubmitting = submittingModuleId === module.moduleId;
              const disabled = module.completed || !module.active || capReached || isSubmitting;

              return (
                <div
                  key={module.moduleId}
                  className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-[10px] font-bold font-mono">
                        Module #{module.moduleId}
                      </span>
                      <span className="text-slate-400 text-xs flex items-center gap-1 font-mono">
                        <Clock size={14} />
                        {module.totalCompletions}
                        {module.maxCompletions !== null ? ` / ${module.maxCompletions}` : ''}{' '}
                        completed
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-wide">{module.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {clip(module.description) || 'No description provided on chain.'}
                    </p>
                  </div>

                  <div className="border-t border-slate-800 pt-4 flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-slate-400 text-xs">Reward:</span>
                      <span className="text-base font-bold font-mono text-emerald-400">
                        +{module.rewardAmount} Ɗ
                      </span>
                    </div>

                    {module.completed ? (
                      <span className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5">
                        <CheckCircle size={16} weight="fill" />
                        Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleComplete(module)}
                        disabled={disabled}
                        className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-500/20"
                      >
                        {isSubmitting ? (
                          <>
                            <CircleNotch size={16} className="animate-spin" />
                            Submitting…
                          </>
                        ) : !module.active ? (
                          'Inactive'
                        ) : capReached ? (
                          'Capacity reached'
                        ) : (
                          <>
                            <Sparkle size={16} weight="bold" />
                            Complete &amp; Claim
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reward Receipt Modal */}
      <AnimatePresence>
        {receipt && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative text-xs"
            >
              <button
                onClick={() => setReceipt(null)}
                className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-2 border-b border-slate-800 pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Trophy size={32} className="text-white" weight="fill" />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">Module Completion Recorded</h3>
                <p className="text-xs text-purple-300 font-mono">Module #{receipt.moduleId}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between gap-4 text-slate-400">
                  <span className="flex-shrink-0">Module:</span>
                  <span className="text-white font-bold text-right">{receipt.title}</span>
                </div>
                <div className="flex justify-between gap-4 text-slate-400">
                  <span className="flex-shrink-0">Account:</span>
                  <span className="text-cyan-300">{address?.slice(0, 12)}…</span>
                </div>
                <div className="flex justify-between gap-4 text-slate-400">
                  <span className="flex-shrink-0">Reward Minted:</span>
                  <span className="text-emerald-400 font-bold">+{receipt.amount} DALLA</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                This records a self-attested completion on chain. It is not a verified
                qualification and no verifiable credential has been issued.
              </p>

              <button
                onClick={() => setReceipt(null)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-md"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
