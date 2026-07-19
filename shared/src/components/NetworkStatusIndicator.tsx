'use client';

import { useEffect, useState } from 'react';

/**
 * Connection status for the blockchain node.
 */
export type NetworkConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface NetworkStatusIndicatorProps {
  /** Current connection status. */
  status: NetworkConnectionStatus;
  /** Optional block number to display when connected. */
  blockNumber?: number;
  /** Optional chain name (e.g. "BelizeChain Testnet"). */
  chainName?: string;
  /** Whether to show the label text or just the dot. */
  compact?: boolean;
  /** Additional CSS class. */
  className?: string;
  /** Callback when clicked (e.g. to trigger reconnect). */
  onClick?: () => void;
}

const STATUS_CONFIG: Record<
  NetworkConnectionStatus,
  { color: string; pulseColor: string; label: string; animate: boolean }
> = {
  connected: {
    color: 'bg-emerald-400',
    pulseColor: 'bg-emerald-400/50',
    label: 'Connected',
    animate: false,
  },
  connecting: {
    color: 'bg-amber-400',
    pulseColor: 'bg-amber-400/50',
    label: 'Connecting…',
    animate: true,
  },
  disconnected: {
    color: 'bg-gray-400',
    pulseColor: 'bg-gray-400/50',
    label: 'Disconnected',
    animate: false,
  },
  error: {
    color: 'bg-red-400',
    pulseColor: 'bg-red-400/50',
    label: 'Connection Error',
    animate: true,
  },
};

/**
 * Network status indicator showing the blockchain connection state.
 *
 * Displays a colored dot with optional label and block number.
 * Designed to be placed in navigation bars / headers.
 *
 * @example
 * ```tsx
 * <NetworkStatusIndicator
 *   status={isConnected ? 'connected' : 'disconnected'}
 *   blockNumber={latestBlock}
 *   chainName="BelizeChain"
 * />
 * ```
 */
export function NetworkStatusIndicator({
  status,
  blockNumber,
  chainName,
  compact = false,
  className = '',
  onClick,
}: NetworkStatusIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const [displayBlock, setDisplayBlock] = useState(blockNumber);

  // Smooth block number transition
  useEffect(() => {
    if (blockNumber !== undefined) {
      setDisplayBlock(blockNumber);
    }
  }, [blockNumber]);

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full 
        bg-gray-800/60 backdrop-blur-sm border border-gray-700/50
        ${onClick ? 'cursor-pointer hover:bg-gray-700/60 transition-colors' : ''}
        ${className}`}
      onClick={onClick}
      title={`${config.label}${chainName ? ` — ${chainName}` : ''}${displayBlock ? ` • Block #${displayBlock.toLocaleString()}` : ''}`}
    >
      {/* Status dot */}
      <span className="relative flex h-2.5 w-2.5">
        {config.animate && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${config.pulseColor} animate-ping`}
          />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.color}`} />
      </span>

      {!compact && (
        <>
          <span className="text-xs font-medium text-gray-300">{config.label}</span>
          {status === 'connected' && displayBlock !== undefined && (
            <span className="text-xs text-gray-500 font-mono">
              #{displayBlock.toLocaleString()}
            </span>
          )}
        </>
      )}
    </Wrapper>
  );
}
