import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeDisplayProps {
  badges: {
    id: string;
    name: string;
    icon: string | React.ReactNode;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    earned?: boolean;
  }[];
  maxDisplay?: number;
  className?: string;
}

export function BadgeDisplay({ badges, maxDisplay, className }: BadgeDisplayProps) {
  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;
  const remaining = maxDisplay && badges.length > maxDisplay ? badges.length - maxDisplay : 0;

  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-amber-400 to-amber-600',
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {displayBadges.map((badge) => (
        <div
          key={badge.id}
          aria-label={`${badge.name}${badge.rarity ? ` (${badge.rarity})` : ''}`}
          className={cn(
            'relative group',
            !badge.earned && 'opacity-40 grayscale'
          )}
        >
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg',
              badge.rarity && badge.earned
                ? `bg-gradient-to-br ${rarityColors[badge.rarity]}`
                : 'bg-gray-200'
            )}
          >
            {typeof badge.icon === 'string' ? badge.icon : badge.icon}
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            {badge.name}
            {badge.rarity && (
              <span className="ml-1 capitalize text-amber-300">({badge.rarity})</span>
            )}
          </div>
        </div>
      ))}
      
      {remaining > 0 && (
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
          +{remaining}
        </div>
      )}
    </div>
  );
}
