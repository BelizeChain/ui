import * as React from 'react';
import { GlassCard } from './glass-card';
import { cn } from '@/lib/utils';
import { TrendUp, TrendDown } from 'phosphor-react';

export interface AssetCardProps {
  name?: string;
  symbol?: string;
  icon?: React.ReactNode | string;
  balance?: string | number;
  usdValue?: string | number;
  change24h?: number;
  // Allow passing a single asset object as used by pages
  asset?: {
    name: string;
    symbol: string;
    icon?: React.ReactNode | string;
    balance: string | number;
    // Some pages use `price` instead of `usdValue`
    price?: number;
    usdValue?: string | number;
    // Some pages use `change`
    change?: number;
    change24h?: number;
  };
  onClick?: () => void;
  className?: string;
}

export function AssetCard({
  name,
  symbol,
  icon,
  balance,
  usdValue,
  change24h,
  asset,
  onClick,
  className,
}: AssetCardProps) {
  // Normalize props from either explicit fields or the `asset` object
  const finalName = asset?.name ?? name ?? '';
  const finalSymbol = asset?.symbol ?? symbol ?? '';
  const finalIcon = asset?.icon ?? icon;
  const finalBalance = asset?.balance ?? balance ?? '0';
  const resolvedUsdValue =
    asset?.usdValue ?? usdValue ?? asset?.price ?? 0;
  const finalChange =
    asset?.change24h ?? asset?.change ?? change24h;

  const isPositive = finalChange !== undefined && finalChange >= 0;

  return (
    <GlassCard
      variant="medium"
      className={cn(
        'p-4 cursor-pointer hover:shadow-2xl transition-all',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {typeof finalIcon === 'string' ? (
            <div className="text-3xl">{finalIcon}</div>
          ) : (
            <div className="bg-gradient-to-br from-forest-500 to-emerald-600 p-3 rounded-xl text-white">
              {finalIcon}
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900">{finalName}</h3>
            <p className="text-sm text-gray-600">{finalSymbol}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="font-bold text-gray-900">{finalBalance}</p>
          <p className="text-sm text-gray-600">${resolvedUsdValue}</p>
          {finalChange !== undefined && (
            <div className={cn(
              'flex items-center justify-end space-x-1 text-xs font-medium mt-1',
              isPositive ? 'text-emerald-600' : 'text-red-600'
            )}>
              {isPositive ? <TrendUp size={12} weight="fill" /> : <TrendDown size={12} weight="fill" />}
              <span>{isPositive ? '+' : ''}{finalChange.toFixed(2)}%</span>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
