'use client';

import { CheckCircle, CircleNotch, WarningCircle } from 'phosphor-react';
import { cn } from '../lib/utils';

export type ShellReadinessState = 'ready' | 'pending' | 'warning';

export interface ShellReadinessItem {
  id: string;
  label: string;
  state: ShellReadinessState;
  value: string;
  detail: string;
}

interface ShellReadinessPanelProps {
  title?: string;
  summary?: string;
  items: ShellReadinessItem[];
  className?: string;
}

const stateStyles: Record<ShellReadinessState, string> = {
  ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  pending: 'border-blue-500/30 bg-blue-500/10 text-blue-100',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
};

const stateLabels: Record<ShellReadinessState, string> = {
  ready: 'Ready',
  pending: 'Pending',
  warning: 'Attention',
};

function StateIcon({ state }: { state: ShellReadinessState }) {
  if (state === 'ready') {
    return <CheckCircle size={18} weight="fill" className="text-emerald-300" />;
  }

  if (state === 'pending') {
    return <CircleNotch size={18} weight="bold" className="text-blue-300 animate-spin" />;
  }

  return <WarningCircle size={18} weight="fill" className="text-amber-300" />;
}

export function ShellReadinessPanel({
  title = 'Shell readiness',
  summary,
  items,
  className,
}: ShellReadinessPanelProps) {
  return (
    <section
      data-testid="shell-readiness-panel"
      className={cn(
        'rounded-3xl border border-white/10 bg-gray-900/50 p-5 shadow-xl backdrop-blur-xl',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-300">
            {summary || 'Confirm wallet, chain, and service routes before building deeper flows.'}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
          <p className="text-xs text-gray-400">Checks</p>
          <p className="text-lg font-semibold text-white">{items.length}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.id}
            className={cn(
              'rounded-2xl border p-4 transition-colors',
              stateStyles[item.state]
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
                {item.label}
              </span>
              <StateIcon state={item.state} />
            </div>

            <p className="text-sm font-semibold text-white">{item.value}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-300">{item.detail}</p>
            <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] opacity-75">
              {stateLabels[item.state]}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}