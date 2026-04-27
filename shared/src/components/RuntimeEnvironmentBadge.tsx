'use client';

import { GlobeHemisphereWest, WarningCircle } from 'phosphor-react';
import { cn } from '../lib/utils';
import { getRuntimeConfig, isLocalRuntimeConfig } from '../lib/runtime-config';

interface RuntimeEnvironmentBadgeProps {
  className?: string;
  compact?: boolean;
}

export function RuntimeEnvironmentBadge({ className, compact = false }: RuntimeEnvironmentBadgeProps) {
  const config = getRuntimeConfig();
  const isLocalRuntime = isLocalRuntimeConfig(config);
  const Icon = isLocalRuntime ? WarningCircle : GlobeHemisphereWest;

  const title = isLocalRuntime ? 'Local Development' : config.networkName;
  const detail = isLocalRuntime
    ? 'Local node fallback'
    : config.endpointSource === 'proxy'
      ? 'Ceiba proxy routes'
      : 'Configured public endpoints';

  return (
    <div
      data-testid="runtime-environment-badge"
      data-runtime-source={config.endpointSource}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border px-3 py-2',
        isLocalRuntime
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
        className
      )}
    >
      <Icon
        size={compact ? 16 : 18}
        weight="duotone"
        className={isLocalRuntime ? 'text-amber-300' : 'text-emerald-300'}
      />
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-semibold">{title}</span>
        <span className={cn('text-[11px] opacity-80', compact && 'hidden sm:inline')}>
          {detail}
        </span>
      </div>
    </div>
  );
}