'use client';

import {
  ShellReadinessPanel,
  getRuntimeConfig,
  isLocalRuntimeConfig,
  useNewBlocks,
  useServiceProbes,
} from '@belizechain/shared';
import { useWallet } from '@/contexts/WalletContext';

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function MayaShellReadinessPanel({ className }: { className?: string }) {
  const runtimeConfig = getRuntimeConfig();
  const usesLocalRuntime = isLocalRuntimeConfig(runtimeConfig);
  const { blockNumber } = useNewBlocks();
  const { probes, isLoading: probesLoading, onlineCount, summary } = useServiceProbes();
  const { isConnected, isConnecting, error, selectedAccount } = useWallet();

  const serviceState = probesLoading
    ? 'pending'
    : summary === 'online'
      ? 'ready'
      : 'warning';
  const serviceValue = probesLoading
    ? 'Checking service routes'
    : `${onlineCount}/${probes.length} routes reachable`;
  const serviceDetail = probesLoading
    ? 'Probing Pakit, Nawal, and Kinich through the configured public routes'
    : probes.map((probe) => `${probe.label} ${probe.state}`).join(' · ');

  const items = [
    {
      id: 'network',
      label: 'Network',
      state: blockNumber ? 'ready' : usesLocalRuntime ? 'warning' : 'pending',
      value: blockNumber
        ? `${runtimeConfig.networkName} #${blockNumber.toLocaleString()}`
        : runtimeConfig.networkName,
      detail: blockNumber
        ? `Receiving blocks through ${runtimeConfig.blockchainWsUrl}`
        : usesLocalRuntime
          ? `Waiting on local websocket ${runtimeConfig.blockchainWsUrl}`
          : `Configured for ${runtimeConfig.endpointSource} route ${runtimeConfig.blockchainWsUrl}`,
    },
    {
      id: 'wallet',
      label: 'Wallet',
      state: error ? 'warning' : isConnected ? 'ready' : isConnecting ? 'pending' : 'pending',
      value: isConnected
        ? selectedAccount?.name || truncateAddress(selectedAccount?.address || '')
        : isConnecting
          ? 'Connecting extension'
          : 'Wallet required',
      detail: error
        ? error
        : isConnected
          ? 'Account is available for balances and signing'
          : 'Connect a Polkadot extension account to unlock transactions',
    },
    {
      id: 'services',
      label: 'Service Routes',
      state: serviceState,
      value: serviceValue,
      detail: serviceDetail,
    },
    {
      id: 'storage',
      label: 'IPFS Gateway',
      state: usesLocalRuntime ? 'warning' : 'ready',
      value: runtimeConfig.ipfsGatewayUrl,
      detail: usesLocalRuntime
        ? 'Local gateway fallback is configured for development only'
        : 'Public proxy route is ready for document and asset flows',
    },
  ] as const;

  return (
    <ShellReadinessPanel
      className={className}
      title="Maya shell readiness"
      summary="Use this panel to confirm the wallet shell is pointed at the intended BelizeChain environment before building deeper flows."
      items={[...items]}
    />
  );
}