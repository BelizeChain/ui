'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';

/**
 * Skeleton Loading Components
 * 
 * Provides skeleton screens with shimmer effects for different layouts
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Base Skeleton component with shimmer animation
 */
export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '100%'),
  };

  return (
    <div
      className={`
        bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%]
        ${animate ? 'animate-shimmer' : ''}
        ${variantClasses[variant]}
        ${className}
      `}
      style={style}
    />
  );
}

/**
 * Metric Card Skeleton (for Dashboard)
 */
export function MetricCardSkeleton() {
  return (
    <GlassCard variant="dark-medium" blur="md" className="p-6">
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="50%" height={14} />
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-700/50">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" height={20} className="flex-1" />
      ))}
    </div>
  );
}

/**
 * Proposal Card Skeleton
 */
export function ProposalCardSkeleton() {
  return (
    <GlassCard variant="dark-medium" blur="md" className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" height={20} />
            <Skeleton variant="text" width="90%" height={16} />
          </div>
          <Skeleton variant="rectangular" width={80} height={28} className="rounded-full" />
        </div>
        <div className="flex items-center gap-4 pt-4 border-t border-gray-700/50">
          <Skeleton variant="text" width="30%" height={14} />
          <Skeleton variant="text" width="25%" height={14} />
          <Skeleton variant="text" width="20%" height={14} />
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Validator Card Skeleton
 */
export function ValidatorCardSkeleton() {
  return (
    <GlassCard variant="dark-medium" blur="md" className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="50%" height={18} />
            <Skeleton variant="text" width="70%" height={14} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Skeleton variant="text" width="100%" height={12} />
            <Skeleton variant="text" width="60%" height={16} />
          </div>
          <div className="space-y-1">
            <Skeleton variant="text" width="100%" height={12} />
            <Skeleton variant="text" width="60%" height={16} />
          </div>
          <div className="space-y-1">
            <Skeleton variant="text" width="100%" height={12} />
            <Skeleton variant="text" width="60%" height={16} />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Chart Skeleton
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <GlassCard variant="dark-medium" blur="lg" className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="rectangular" width={120} height={32} className="rounded-xl" />
        </div>
        <Skeleton variant="rectangular" width="100%" height={height} className="rounded-xl" />
      </div>
    </GlassCard>
  );
}

/**
 * Form Skeleton
 */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" width="25%" height={14} />
          <Skeleton variant="rectangular" width="100%" height={44} className="rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/**
 * Dashboard Loading State
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Network Health & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="space-y-4">
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="30%" height={32} />
            <div className="space-y-3 pt-4">
              <Skeleton variant="rectangular" height={8} className="rounded-full" />
              <Skeleton variant="rectangular" height={8} className="rounded-full" />
              <Skeleton variant="rectangular" height={8} className="rounded-full" />
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="space-y-4">
            <Skeleton variant="text" width="40%" height={20} />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="70%" height={14} />
                  <Skeleton variant="text" width="50%" height={12} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/**
 * Proposals List Loading State
 */
export function ProposalsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProposalCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Validators List Loading State
 */
export function ValidatorsListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ValidatorCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Loading Overlay (for in-place loading)
 */
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-sm text-gray-400">{message}</p>
      </div>
    </div>
  );
}

/**
 * Progressive Loading Container
 * Loads children progressively with staggered delays
 */
interface ProgressiveLoadingProps {
  children: React.ReactNode;
  isLoading: boolean;
  skeleton: React.ReactNode;
  delay?: number;
}

export function ProgressiveLoading({
  children,
  isLoading,
  skeleton,
  delay = 300,
}: ProgressiveLoadingProps) {
  const [showSkeleton, setShowSkeleton] = React.useState(isLoading);

  React.useEffect(() => {
    if (isLoading) {
      setShowSkeleton(true);
    } else {
      const timer = setTimeout(() => setShowSkeleton(false), delay);
      return () => clearTimeout(timer);
    }
  }, [isLoading, delay]);

  if (showSkeleton) {
    return <>{skeleton}</>;
  }

  return <>{children}</>;
}
