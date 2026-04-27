'use client';

import {
  ShellReadinessPanel,
  getRuntimeConfig,
  isLocalRuntimeConfig,
  useServiceProbes,
} from '@belizechain/shared';
import { useWalletStore } from '@/store/wallet';
import { useBlockchain } from '@/lib/blockchain/hooks';
import { useSystem } from '@/hooks/useSystem';

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function PortalShellReadinessPanel({ className }: { className?: string }) {
  const runtimeConfig = getRuntimeConfig();
  const usesLocalRuntime = isLocalRuntimeConfig(runtimeConfig);
  const { probes, isLoading: probesLoading, onlineCount, summary } = useServiceProbes();
  const { status, error } = useBlockchain();
  const { systemInfo } = useSystem();
  const { selectedAccount, isConnecting, error: walletError } = useWalletStore();

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
      state: status === 'ready' || status === 'connected' ? 'ready' : status === 'error' ? 'warning' : 'pending',
      value: systemInfo
        ? `${systemInfo.chainName} #${systemInfo.blockNumber.toLocaleString()}`
        : runtimeConfig.networkName,
      detail: systemInfo
        ? `${systemInfo.health} with ${systemInfo.peersCount} peers on ${runtimeConfig.blockchainWsUrl}`
        : error || `Waiting for chain connection via ${runtimeConfig.blockchainWsUrl}`,
    },
    {
      id: 'wallet',
      label: 'Operator Wallet',
      state: walletError ? 'warning' : selectedAccount ? 'ready' : isConnecting ? 'pending' : 'pending',
      value: selectedAccount
        ? selectedAccount.meta.name || truncateAddress(selectedAccount.address)
        : isConnecting
          ? 'Connecting wallet'
          : 'Wallet not connected',
      detail: walletError || (selectedAccount
        ? 'Admin actions can be signed from the selected account'
        : 'Connect an extension account before treasury or governance actions'),
    },
    {
      id: 'services',
      label: 'Ops APIs',
      state: serviceState,
      value: serviceValue,
      detail: serviceDetail,
    },
    {
      id: 'storage',
      label: 'Gateway',
      state: usesLocalRuntime ? 'warning' : 'ready',
      value: runtimeConfig.ipfsGatewayUrl,
      detail: usesLocalRuntime
        ? 'Portal is still pointing at local gateway defaults'
        : 'IPFS assets are routed through the public Ceiba proxy',
    },
  ] as const;

  return (
    <ShellReadinessPanel
      className={className}
      title="Portal shell readiness"
      summary="Confirm network connectivity, operator wallet access, and service route configuration before using government workflows."
      items={[...items]}
    />
  );
}