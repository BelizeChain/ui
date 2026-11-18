'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  CircleNotch,
  Clock,
  GraduationCap,
  Info,
  Sparkle,
  Trophy,
  X,
  XCircle,
} from 'phosphor-react';
import {
  completeEducationModule,
  getEducationModules,
  getUserEducationProgress,
  type EducationModule,
} from '@/services/pallets/community';
import { fetchBalance } from '@/services/blockchain';
import {
  ASSESSMENT_DISCLOSURE,
  getAcademyModule,
  requiredCorrect,
  type AcademyModule,
} from '@/content/academy';

/** An on-chain module joined with the connected account's completion state. */
interface ModuleView extends EducationModule {
  completed: boolean;
  completedAtBlock?: number;
}

/** Cap long on-chain strings so they cannot break the layout. */
function clip(value: string, max = 240): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * Lesson reader and knowledge check for one module.
 *
 * Deliberately a separate component: the study flow has its own state machine
 * (lesson index → quiz → result) and keeping it out of the page component means
 * the page's own state stays about the module list, not about what page of a
 * lesson somebody is on.
 */
function StudyPanel({
  module,
  onClose,
  onPass,
  submitting,
}: {
  module: ModuleView;
  onClose: () => void;
  onPass: (module: ModuleView) => void;
  submitting: boolean;
}) {
  const content: AcademyModule | undefined = getAcademyModule(module.moduleId);
  const lessons = content?.lessons ?? [];
  const quiz = content?.quiz ?? [];

  const [lessonIndex, setLessonIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; required: number; passed: boolean } | null>(
    null,
  );

  // No content for this module id: say so rather than showing an empty reader.
  if (lessons.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
          <h3 className="text-lg font-bold text-white pr-10">{module.title}</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{clip(module.description, 600)}</p>
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
            <Info size={18} weight="fill" className="mt-0.5 flex-shrink-0 text-amber-400" />
            <p className="text-xs text-amber-200">
              This module has no written lesson or knowledge check yet, so the description above is
              the whole of the available material. You can still record completion, but you would be
              attesting to study the chain cannot show you.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
            >
              Back
            </button>
            <button
              onClick={() => onPass(module)}
              disabled={submitting}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs"
            >
              {submitting ? 'Submitting…' : 'Record completion'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const onQuizStep = lessonIndex >= lessons.length;
  const allAnswered = quiz.length > 0 && quiz.every((_, index) => answers[index] !== undefined);

  const submitQuiz = () => {
    const score = quiz.reduce(
      (total, question, index) => (answers[index] === question.correctIndex ? total + 1 : total),
      0,
    );
    const required = requiredCorrect(quiz.length);
    setResult({ score, required, passed: score >= required });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col relative">
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-purple-300 font-mono">
              Module #{module.moduleId} · {onQuizStep ? 'Knowledge check' : `Lesson ${lessonIndex + 1} of ${lessons.length}`}
            </p>
            <h3 className="text-base font-bold text-white truncate">
              {onQuizStep ? module.title : lessons[lessonIndex].title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {!onQuizStep &&
            lessons[lessonIndex].body.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="text-sm text-slate-300 leading-relaxed">
                {paragraph}
              </p>
            ))}

          {onQuizStep && (
            <>
              <p className="text-xs text-slate-400">
                {quiz.length} questions. {requiredCorrect(quiz.length)} correct answers needed to
                pass. You can retry as many times as you like.
              </p>

              {quiz.map((question, index) => {
                const chosen = answers[index];
                return (
                  <div key={question.question} className="space-y-2 pt-2">
                    <p className="text-sm font-semibold text-white">
                      {index + 1}. {question.question}
                    </p>
                    <div className="space-y-1.5">
                      {question.options.map((option, optionIndex) => {
                        const isChosen = chosen === optionIndex;
                        const showCorrect = result !== null && optionIndex === question.correctIndex;
                        const showWrong = result !== null && isChosen && !showCorrect;
                        return (
                          <button
                            key={option}
                            onClick={() =>
                              result === null &&
                              setAnswers((previous) => ({ ...previous, [index]: optionIndex }))
                            }
                            disabled={result !== null}
                            className={[
                              'w-full text-left px-3 py-2 rounded-xl text-xs border transition-all',
                              showCorrect
                                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                                : showWrong
                                  ? 'border-rose-500/50 bg-rose-500/10 text-rose-200'
                                  : isChosen
                                    ? 'border-purple-500/50 bg-purple-500/10 text-white'
                                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700',
                            ].join(' ')}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {result !== null && (
                      <p className="text-[11px] text-slate-400 leading-relaxed pl-1">
                        {question.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-800 space-y-3">
          {result !== null && (
            <div
              className={[
                'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold',
                result.passed
                  ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/40 text-rose-300',
              ].join(' ')}
            >
              {result.passed ? <CheckCircle size={16} weight="fill" /> : <XCircle size={16} weight="fill" />}
              {result.score} of {quiz.length} correct —{' '}
              {result.passed ? 'passed' : `need ${result.required} to pass`}
            </div>
          )}

          <p className="text-[10px] text-slate-500 leading-relaxed">{ASSESSMENT_DISCLOSURE}</p>

          <div className="flex gap-2">
            {!onQuizStep ? (
              <>
                <button
                  onClick={() => setLessonIndex((index) => Math.max(0, index - 1))}
                  disabled={lessonIndex === 0}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 font-bold rounded-xl text-xs"
                >
                  Back
                </button>
                <button
                  onClick={() => setLessonIndex((index) => index + 1)}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <BookOpen size={16} weight="bold" />
                  Continue
                </button>
              </>
            ) : result === null ? (
              <button
                onClick={submitQuiz}
                disabled={!allAnswered}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs"
              >
                {allAnswered ? 'Check answers' : `Answer all ${quiz.length} questions`}
              </button>
            ) : result.passed ? (
              <button
                onClick={() => onPass(module)}
                disabled={submitting}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                {submitting ? <CircleNotch size={16} className="animate-spin" /> : <Sparkle size={16} weight="bold" />}
                {submitting ? 'Submitting…' : `Claim +${module.rewardAmount} Ɗ`}
              </button>
            ) : (
              <button
                onClick={() => {
                  setAnswers({});
                  setResult(null);
                }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <ArrowRight size={16} weight="bold" />
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EducationModulesPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [modules, setModules] = useState<ModuleView[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'unreachable'>('loading');
  const [submittingModuleId, setSubmittingModuleId] = useState<number | null>(null);
  const [studyingModule, setStudyingModule] = useState<ModuleView | null>(null);
  const [receipt, setReceipt] = useState<{
    moduleId: number;
    title: string;
    amount: string;
    /** True when the credited amount came from a balance delta, not the event. */
    measured: boolean;
  } | null>(null);

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
        // The pallet caps the minted reward at `EducationRewardAmount` but emits
        // the module's *advertised* amount in the completion event, so the event
        // cannot be trusted to report what actually arrived. Read the free
        // balance before and after and report the measured delta instead.
        const balanceBefore = await fetchBalance(address).catch(() => null);
        const freeBefore = balanceBefore ? Number.parseFloat(balanceBefore.free) : null;

        // `complete_education_module` no longer pays out on a self-reported
        // completion: the chain requires a prior attestation from the configured
        // learning provider. This payload is the evidence that provider reviews,
        // so keep it specific enough to be checked off-chain.
        const proof = JSON.stringify({
          v: 1,
          kind: 'maya-academy-module-completion',
          moduleId: module.moduleId,
          account: address,
          submittedAt: new Date().toISOString(),
        });

        const { rewardAmount } = await completeEducationModule(address, module.moduleId, proof);

        let amount = rewardAmount;
        let measured = false;
        if (freeBefore !== null) {
          const balanceAfter = await fetchBalance(address).catch(() => null);
          if (balanceAfter) {
            const delta = Number.parseFloat(balanceAfter.free) - freeBefore;
            // The fee for the call comes out of the same balance, so the delta is
            // the reward minus a small fee. Only treat it as measured when it is
            // positive, otherwise fall back to the chain's reported figure.
            if (delta > 0) {
              amount = delta.toFixed(4).replace(/\.?0+$/, '');
              measured = true;
            }
          }
        }

        setReceipt({ moduleId: module.moduleId, title: module.title, amount, measured });
        setStudyingModule(null);
        addNotification({
          type: 'success',
          message: `“${module.title}” recorded on chain. Reward: +${amount} DALLA.`,
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
                        onClick={() => setStudyingModule(module)}
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
                            <BookOpen size={16} weight="bold" />
                            Study &amp; Claim
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

      {/* Lesson reader + knowledge check */}
      {studyingModule && (
        <StudyPanel
          module={studyingModule}
          onClose={() => setStudyingModule(null)}
          onPass={handleComplete}
          submitting={submittingModuleId === studyingModule.moduleId}
        />
      )}

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
                  <span className="flex-shrink-0">
                    {receipt.measured ? 'Credited to balance:' : 'Reward announced:'}
                  </span>
                  <span className="text-emerald-400 font-bold">+{receipt.amount} DALLA</span>
                </div>
              </div>

              {!receipt.measured && (
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  This figure is what the chain announced, not a balance reading. The pallet caps
                  the minted reward, so the amount that actually arrived may be lower.
                </p>
              )}

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
