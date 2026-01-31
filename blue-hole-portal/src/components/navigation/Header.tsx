'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  MagnifyingGlass,
  List,
  SignOut,
  CaretDown,
  Wallet,
  CheckCircle,
  Warning,
  Activity,
  Cube,
  CircleNotch,
} from 'phosphor-react';
import { cn } from '@/lib/utils';
import { useWalletStore } from '@/store/wallet';
import { useBlockchain } from '@/lib/blockchain/hooks';
import { useSystem } from '@/hooks/useSystem';
import { useGovernance } from '@/hooks/useGovernance';
import { useOptimisticVoting } from '@/hooks/useOptimisticVoting';
import { useOptimisticApprovals } from '@/hooks/useOptimisticApprovals';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMobileMenuOpen: () => void;
  sidebarCollapsed?: boolean;
}

export function Header({ onMobileMenuOpen, sidebarCollapsed = false }: HeaderProps) {
  const router = useRouter();
  const { selectedAccount, accounts, selectAccount, disconnectWallet } = useWalletStore();
  const { status, isReady, error } = useBlockchain();
  const { systemInfo } = useSystem();
  const { proposals } = useGovernance();
  const { optimisticVotes } = useOptimisticVoting();
  const { optimisticApprovals } = useOptimisticApprovals();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Calculate pending transactions
  const pendingTransactions = [
    ...optimisticVotes.filter(v => v.status === 'pending'),
    ...optimisticApprovals.filter(a => a.status === 'pending'),
  ];

  // Calculate active proposals
  const activeProposalsCount = proposals.filter(p => p.status === 'Active').length;

  const getStatusBadge = () => {
    if (isReady && systemInfo) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
          <CheckCircle size={16} className="text-emerald-400" weight="fill" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-emerald-400">Connected</span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400/70">
              <Cube size={12} weight="duotone" />
              <span>#{systemInfo.blockNumber.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    } else if (status === 'connecting') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg">
          <Activity size={16} className="text-amber-400 animate-pulse" weight="duotone" />
          <span className="text-xs font-medium text-amber-400">Connecting</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg">
          <Warning size={16} className="text-red-400" weight="fill" />
          <span className="text-xs font-medium text-red-400">Disconnected</span>
        </div>
      );
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 z-30 transition-all duration-300',
        sidebarCollapsed ? 'left-20' : 'left-0 lg:left-64'
      )}
    >
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        {/* Left Section - Mobile Menu + Search */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <List size={24} className="text-gray-400" weight="bold" />
          </button>

          {/* Search / Command Palette Trigger */}
          <button
            onClick={() => {
              // Will trigger command palette (Cmd+K)
              const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
              document.dispatchEvent(event);
            }}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors group"
          >
            <MagnifyingGlass size={18} className="text-gray-400 group-hover:text-white" weight="bold" />
            <span className="text-sm text-gray-400 group-hover:text-white">Search...</span>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right Section - Status + Notifications + Account */}
        <div className="flex items-center gap-3">
          {/* Pending Transactions Badge */}
          {pendingTransactions.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg">
              <CircleNotch size={16} className="text-amber-400 animate-spin" weight="bold" />
              <span className="text-xs font-medium text-amber-400">
                {pendingTransactions.length} Pending
              </span>
            </div>
          )}

          {/* Connection Status */}
          <div className="hidden sm:block">
            {getStatusBadge()}
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Bell size={20} className="text-gray-400" weight="duotone" />
            {activeProposalsCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                {activeProposalsCount > 9 ? '9+' : activeProposalsCount}
              </span>
            )}
          </button>

          {/* Account Dropdown */}
          {selectedAccount && (
            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {selectedAccount.meta.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-white">
                    {selectedAccount.meta.name || 'Account'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedAccount.address.slice(0, 6)}...{selectedAccount.address.slice(-4)}
                  </p>
                </div>
                <CaretDown
                  size={16}
                  className={cn(
                    'text-gray-400 transition-transform',
                    accountMenuOpen && 'rotate-180'
                  )}
                  weight="bold"
                />
              </button>

              {/* Account Dropdown Menu */}
              {accountMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAccountMenuOpen(false)}
                  />

                  {/* Menu */}
                  <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50">
                    {/* Current Account */}
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {selectedAccount.meta.name?.charAt(0)?.toUpperCase() || 'A'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {selectedAccount.meta.name || 'Account'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {selectedAccount.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex-1 px-3 py-2 bg-gray-700/50 rounded-lg">
                          <p className="text-xs text-gray-400">DALLA Balance</p>
                          <p className="text-sm font-bold text-white">0.00</p>
                        </div>
                        <div className="flex-1 px-3 py-2 bg-gray-700/50 rounded-lg">
                          <p className="text-xs text-gray-400">bBZD Balance</p>
                          <p className="text-sm font-bold text-white">0.00</p>
                        </div>
                      </div>
                    </div>

                    {/* Account Switcher */}
                    {accounts.length > 1 && (
                      <div className="p-2 border-b border-gray-700">
                        <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">
                          Switch Account
                        </p>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {accounts.map((account) => (
                            <button
                              key={account.address}
                              onClick={() => {
                                selectAccount(account);
                                setAccountMenuOpen(false);
                              }}
                              disabled={account.address === selectedAccount.address}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left',
                                account.address === selectedAccount.address
                                  ? 'bg-blue-500/20 cursor-not-allowed'
                                  : 'hover:bg-gray-700'
                              )}
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  {account.meta.name?.charAt(0)?.toUpperCase() || 'A'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {account.meta.name || 'Account'}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                  {account.address}
                                </p>
                              </div>
                              {account.address === selectedAccount.address && (
                                <CheckCircle size={16} className="text-blue-400" weight="fill" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          router.push('/settings');
                          setAccountMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors text-left"
                      >
                        <Wallet size={18} className="text-gray-400" weight="duotone" />
                        <span className="text-sm text-white">Manage Wallets</span>
                      </button>
                      <button
                        onClick={() => {
                          disconnectWallet();
                          setAccountMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                      >
                        <SignOut size={18} className="text-red-400" weight="duotone" />
                        <span className="text-sm text-red-400">Disconnect Wallet</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Connect Wallet Button (if not connected) */}
          {!selectedAccount && (
            <Button
              onClick={() => useWalletStore.getState().connectWallet()}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
