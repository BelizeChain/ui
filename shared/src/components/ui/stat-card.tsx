import * as React from 'react';
import { GlassCard } from './glass-card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ label, value, change, icon, trend, className }: StatCardProps) {
  const getTrendColor = () => {
    if (!trend || trend === 'neutral') return 'text-gray-600';
    return trend === 'up' ? 'text-emerald-600' : 'text-red-600';
  };

  const getTrendIcon = () => {
    if (!change) return null;
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '';
  };

  return (
    <GlassCard variant="medium" className={cn('p-4', className)}>
      <div className="flex items-center justify-between">
        {icon && (
          <div className="bg-forest-50 p-3 rounded-xl text-forest-600">
            {icon}
          </div>
        )}
        <div className={cn('flex-1', icon && 'ml-4')}>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <span className={cn('text-sm font-medium', getTrendColor())}>
                {getTrendIcon()} {Math.abs(change)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
