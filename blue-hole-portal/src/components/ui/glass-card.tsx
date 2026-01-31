import * as React from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'medium' | 'heavy' | 'gradient' | 'forest' | 'amber' | 'blue' | 'purple' | 'dark' | 'dark-light' | 'dark-medium';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'medium', blur = 'xl', children, ...props }, ref) => {
    const variants: Record<string, string> = {
      light: 'bg-white/60 border border-white/20',
      medium: 'bg-white/80 border border-white/30',
      heavy: 'bg-white/95 border border-white/40',
      gradient: 'bg-gradient-to-br from-emerald-600 to-teal-700 border border-white/30 text-white',
      forest: 'bg-emerald-900/80 border border-emerald-500/30 text-white',
      amber: 'bg-amber-900/80 border border-amber-500/30 text-white',
      blue: 'bg-blue-900/80 border border-blue-500/30 text-white',
      purple: 'bg-purple-900/80 border border-purple-500/30 text-white',
      dark: 'bg-gray-800/60 border border-gray-700/30',
      'dark-light': 'bg-gray-800/40 border border-gray-700/20',
      'dark-medium': 'bg-gray-800/70 border border-gray-700/40',
    };

    const blurs = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl',
          variants[variant],
          blurs[blur],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard };
