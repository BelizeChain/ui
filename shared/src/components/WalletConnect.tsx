/**
 * Shared WalletConnect Component
 * Reusable wallet connection modal for all BelizeChain portals
 * 
 * Features:
 * - Polkadot.js extension detection
 * - Multiple account selection
 * - Auto-reconnect from localStorage
 * - Beautiful Belizean-themed UI
 */

'use client';

import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Modal, Button, Badge, Alert } from './ui';
import { useI18n } from '../i18n';

// Extend Window interface for Polkadot.js
declare global {
  interface Window {
    injectedWeb3?: {
      'polkadot-js'?: any;
    };
  }
}

export interface WalletConnectProps {
  /** Custom button text when wallet is disconnected */
  connectText?: string;
  /** Show full address or shortened version */
  showFullAddress?: boolean;
  /** Custom className for the button */
  className?: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Portal name for logging */
  portalName?: string;
}

export function WalletConnect({
  connectText,
  showFullAddress = false,
  className,
  variant = 'primary',
  size = 'md',
  portalName = 'BelizeChain'
}: WalletConnectProps) {
  const { 
    isConnected, 
    selectedAccount, 
    accounts, 
    isLoading, 
    error,
    connect, 
    disconnect,
    selectAccount 
  } = useWallet();
  
  const i18n = useI18n();
  const t = i18n.t; // Get translations object
  const [showModal, setShowModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Format address for display
  const formatAddress = (address: string, full: boolean = false): string => {
    if (full) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  // Handle wallet connection
  const handleConnect = async () => {
    try {
      await connect();
      setShowModal(false);
    } catch (err) {
      console.error(`[${portalName}] Wallet connection failed:`, err);
    }
  };

  // Handle account selection
  const handleAccountSelect = (address: string) => {
    selectAccount(address);
    setShowAccountModal(false);
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (selectedAccount?.address) {
      await navigator.clipboard.writeText(selectedAccount.address);
      // Could add a toast notification here
    }
  };

  return (
    <>
      {/* Main Wallet Button */}
      {isConnected && selectedAccount ? (
        <div className="flex items-center gap-2">
          {/* Account info button */}
          <Button
            variant={variant}
            size={size}
            className={className}
            onClick={() => setShowAccountModal(true)}
          >
            <div className="flex items-center gap-2">
              {/* Identicon placeholder */}
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-caribbean-400 to-bluehole-500" />
              <span className="font-mono">
                {formatAddress(selectedAccount.address, showFullAddress)}
              </span>
            </div>
          </Button>

          {/* Disconnect button */}
          <Button
            variant="ghost"
            size={size}
            onClick={disconnect}
            title={t.wallet.disconnect}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </Button>
        </div>
      ) : (
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => setShowModal(true)}
          isLoading={isLoading}
        >
          {connectText || t.wallet.connect}
        </Button>
      )}

      {/* Connection Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={t.wallet.connect}
      >
        <div className="space-y-4">
          {error && (
            <Alert variant="error">
              {error || t.wallet.connectionError}
            </Alert>
          )}

          {!window.injectedWeb3?.['polkadot-js'] ? (
            <div className="text-center py-6">
              <Alert variant="warning">
                {t.wallet.extensionNotFound}
              </Alert>
              <p className="text-sand-600 mb-4 mt-4">
                {t.wallet.pleaseInstallExtension}
              </p>
              <Button
                variant="primary"
                onClick={() => window.open('https://polkadot.js.org/extension/', '_blank')}
              >
                {t.wallet.installExtension}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sand-700">
                {t.wallet.selectProvider}
              </p>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleConnect}
                isLoading={isLoading}
              >
                <img 
                  src="/icons/polkadot-js.svg" 
                  alt="Polkadot.js" 
                  className="w-6 h-6 mr-3"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="flex-1 text-left">
                  <div className="font-semibold">Polkadot.js Extension</div>
                  <div className="text-sm text-sand-500">
                    {t.wallet.browserExtension}
                  </div>
                </div>
              </Button>

              <div className="text-xs text-sand-500 text-center pt-2">
                {t.wallet.secureConnection}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Account Selection Modal */}
      <Modal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title={t.wallet.selectAccount}
      >
        <div className="space-y-3">
          {/* Current account */}
          {selectedAccount && (
            <div className="bg-caribbean-50 border-2 border-caribbean-500 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-caribbean-900">
                  {t.wallet.currentAccount}
                </span>
                <Badge variant="success" dot>
                  {t.wallet.connected}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-caribbean-400 to-bluehole-500" />
                <div className="flex-1">
                  <div className="font-semibold text-sand-900">
                    {selectedAccount.meta.name || t.wallet.unnamedAccount}
                  </div>
                  <div className="font-mono text-sm text-sand-600">
                    {formatAddress(selectedAccount.address)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  title={t.wallet.copyAddress}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </Button>
              </div>
            </div>
          )}

          {/* Other accounts */}
          {accounts.filter(acc => acc.address !== selectedAccount?.address).length > 0 && (
            <>
              <div className="text-sm font-semibold text-sand-700 pt-2">
                {t.wallet.switchAccount}
              </div>
              {accounts
                .filter(acc => acc.address !== selectedAccount?.address)
                .map((acc) => (
                  <button
                    key={acc.address}
                    onClick={() => handleAccountSelect(acc.address)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-sand-200 hover:border-caribbean-300 hover:bg-caribbean-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-jungle-400 to-maya-500" />
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sand-900">
                        {acc.meta.name || t.wallet.unnamedAccount}
                      </div>
                      <div className="font-mono text-sm text-sand-600">
                        {formatAddress(acc.address)}
                      </div>
                    </div>
                  </button>
                ))}
            </>
          )}

          <div className="pt-4 border-t border-sand-200">
            <Button
              variant="danger"
              className="w-full"
              onClick={() => {
                disconnect();
                setShowAccountModal(false);
              }}
            >
              {t.wallet.disconnect}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default WalletConnect;
