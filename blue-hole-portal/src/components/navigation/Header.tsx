'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RuntimeEnvironmentBadge, NetworkStatusIndicator } from '@belizechain/shared';
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
  Copy,
  Check,
  X,
  FileText,
  ArrowRight,
} from 'phosphor-react';
import { cn } from '@/lib/utils';
import { useWalletStore } from '@/store/wallet';
import { useBlockchain } from '@/lib/blockchain/hooks';
import { useSystem } from '@/hooks/useSystem';
import { useGovernance } from '@/hooks/useGovernance';
import { useOptimisticVoting } from '@/hooks/useOptimisticVoting';
import { useOptimisticApprovals } from '@/hooks/useOptimisticApprovals';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui';

interface HeaderProps {
  onMobileMenuOpen: () => void;
  sidebarCollapsed?: boolean;
}

export function Header({ onMobileMenuOpen, sidebarCollapsed = false }: HeaderProps) {
  const router = useRouter();
  const { selectedAccount, accounts, balances, selectAccount, disconnectWallet, fetchBalances } = useWalletStore();
  const { status, isReady, error } = useBlockchain();
  const { systemInfo } = useSystem();
  const { proposals } = useGovernance();
  const { optimisticVotes } = useOptimisticVoting();
  const { optimisticApprovals } = useOptimisticApprovals();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

  // Fetch live balances when selected account changes
  useEffect(() => {
    if (selectedAccount?.address) {
      void fetchBalances(selectedAccount.address);
    }
  }, [selectedAccount?.address, fetchBalances]);

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedAccount?.address) {
      navigator.clipboard.writeText(selectedAccount.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate pending transactions
  const pendingTransactions = [
    ...optimisticVotes.filter(v => v.status === 'pending'),
    ...optimisticApprovals.filter(a => a.status === 'pending'),
  ];

  // Derive notifications from live portal state
  const activeProposals = proposals.filter(p => p.status === 'Active');
  
  interface NotificationItem {
    id: string;
    type: 'proposal' | 'tx' | 'network';
    title: string;
    description: string;
    category?: string;
    time: string;
    href?: string;
    icon: React.ReactNode;
  }

  const notificationsList: NotificationItem[] = [
    ...activeProposals.map(p => ({
      id: `prop-${p.index}`,
      type: 'proposal' as const,
      title: `Referendum #${p.index}`,
      description: `${p.title || 'Proposal active for citizen voting'}`,
      category: p.category,
      time: 'Voting active',
      href: '/governance/proposals',
      icon: <FileText size={16} className="text-cyan-400" weight="bold" />,
    })),
    ...pendingTransactions.map((tx, i) => ({
      id: `tx-${i}`,
      type: 'tx' as const,
      title: 'Pending Extrinsic',
      description: 'Transaction submitted and awaiting block inclusion',
      time: 'In flight',
      icon: <CircleNotch size={16} className="text-amber-400 animate-spin" weight="bold" />,
    })),
    {
      id: 'net-status',
      type: 'network' as const,
      title: 'BelizeChain Testnet Synchronized',
      description: 'Connected with 4 sovereign validators (BABE/GRANDPA)',
      time: 'Live',
      icon: <CheckCircle size={16} className="text-emerald-400" weight="fill" />,
    },
  ].filter(n => !dismissedNotificationIds.includes(n.id));

  const unreadCount = notificationsList.filter(n => n.type !== 'network' || activeProposals.length > 0).length;

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
            aria-label="Open navigation menu"
          >
            <List size={24} className="text-gray-400" weight="bold" />
          </button>

          {/* Search / Command Palette Trigger */}
          <button
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
              document.dispatchEvent(event);
            }}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors group"
            aria-label="Search (Command+K)"
          >
            <MagnifyingGlass size={18} className="text-gray-400 group-hover:text-white" weight="bold" />
            <span className="text-sm text-gray-400 group-hover:text-white">Search...</span>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700/80 border border-gray-600/50 rounded text-[11px] font-mono text-gray-400">
              Cmd + K
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
            <NetworkStatusIndicator status={status === 'ready' ? 'connected' : status} />
          </div>

          <div className="hidden lg:block">
            <RuntimeEnvironmentBadge compact />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationMenuOpen(!notificationMenuOpen);
                if (accountMenuOpen) setAccountMenuOpen(false);
              }}
              className={cn(
                "relative p-2 rounded-xl transition-colors",
                notificationMenuOpen ? "bg-slate-800 text-white" : "hover:bg-slate-800 text-slate-400 hover:text-white"
              )}
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} active` : 'Notifications'}
              aria-haspopup="dialog"
              aria-expanded={notificationMenuOpen}
            >
              <Bell size={20} className={unreadCount > 0 ? "text-cyan-400" : "text-slate-400"} weight={unreadCount > 0 ? "fill" : "regular"} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 bg-cyan-500 text-slate-950 text-[10px] font-extrabold rounded-full animate-pulse shadow-md shadow-cyan-500/30">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Menu */}
            {notificationMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotificationMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col backdrop-blur-2xl">
                  {/* Header */}
                  <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Bell size={15} weight="bold" />
                      </div>
                      <h3 className="font-bold text-sm text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {unreadCount} active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {notificationsList.length > 0 && (
                        <button
                          onClick={() => setDismissedNotificationIds(notificationsList.map(n => n.id))}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1 rounded-lg hover:bg-cyan-500/10 transition-colors"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => setNotificationMenuOpen(false)}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                        aria-label="Close notifications"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
                    {notificationsList.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                          <Bell size={24} weight="thin" />
                        </div>
                        <p className="text-slate-200 text-xs font-bold">All caught up</p>
                        <p className="text-slate-500 text-[11px]">System events, proposals, and validator alerts will appear here</p>
                      </div>
                    ) : (
                      notificationsList.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => {
                            if (notification.href) {
                              router.push(notification.href);
                              setNotificationMenuOpen(false);
                            }
                          }}
                          className={cn(
                            'p-3.5 transition-colors flex items-start gap-3 text-left',
                            notification.href ? 'hover:bg-slate-800/50 cursor-pointer' : 'hover:bg-slate-800/30'
                          )}
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                            {notification.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <p className="text-xs font-semibold text-white truncate">
                                {notification.title}
                              </p>
                              <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                                {notification.time}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                              {notification.description}
                            </p>
                            {notification.href && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 font-semibold mt-1.5 hover:underline">
                                View details <ArrowRight size={10} weight="bold" />
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Account Dropdown */}
          {selectedAccount && (
            <div className="relative">
              <button
                onClick={() => {
                  setAccountMenuOpen(!accountMenuOpen);
                  if (notificationMenuOpen) setNotificationMenuOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl transition-colors",
                  accountMenuOpen ? "bg-slate-800" : "bg-slate-800/50 hover:bg-slate-800"
                )}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
              >
                <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-white">
                    {selectedAccount.meta.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="hidden lg:block text-left min-w-0 max-w-[140px]">
                  <p className="text-xs font-medium text-white truncate">
                    {selectedAccount.meta.name || 'Account'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {selectedAccount.address.slice(0, 6)}...{selectedAccount.address.slice(-4)}
                  </p>
                </div>
                <CaretDown
                  size={14}
                  className={cn(
                    'text-slate-400 transition-transform shrink-0',
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

                  {/* Menu Container */}
                  <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col backdrop-blur-xl">
                    {/* Current Account Card */}
                    <div className="p-4 border-b border-slate-800 bg-slate-950/60">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-sm font-bold text-white">
                            {selectedAccount.meta.name?.charAt(0)?.toUpperCase() || 'A'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {selectedAccount.meta.name || 'Account'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-slate-400 font-mono truncate" title={selectedAccount.address}>
                              {selectedAccount.address.slice(0, 8)}...{selectedAccount.address.slice(-6)}
                            </span>
                            <button
                              onClick={handleCopyAddress}
                              className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-cyan-300 transition-colors shrink-0"
                              title="Copy full SS58 address"
                              aria-label="Copy full SS58 address"
                            >
                              {copied ? (
                                <Check size={13} className="text-emerald-400" weight="bold" />
                              ) : (
                                <Copy size={13} weight="bold" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Balances Grid */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="px-3 py-2 bg-slate-800/70 border border-slate-700/50 rounded-xl">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">DALLA Balance</p>
                          <p className="text-sm font-bold text-white truncate mt-0.5" title={balances.dalla}>
                            {balances.dalla}
                          </p>
                        </div>
                        <div className="px-3 py-2 bg-slate-800/70 border border-slate-700/50 rounded-xl">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">bBZD Balance</p>
                          <p className="text-sm font-bold text-white truncate mt-0.5" title={balances.bBZD}>
                            {balances.bBZD}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Account Switcher */}
                    {accounts.length > 1 && (
                      <div className="p-2 border-b border-slate-800">
                        <p className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
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
                                'w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left',
                                account.address === selectedAccount.address
                                  ? 'bg-cyan-500/10 border border-cyan-500/30 text-white cursor-default'
                                  : 'hover:bg-slate-800/70 text-slate-300'
                              )}
                            >
                              <div className="w-8 h-8 shrink-0 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-slate-300">
                                  {account.meta.name?.charAt(0)?.toUpperCase() || 'A'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white truncate">
                                  {account.meta.name || 'Account'}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono truncate">
                                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                                </p>
                              </div>
                              {account.address === selectedAccount.address && (
                                <CheckCircle size={16} className="text-cyan-400 shrink-0" weight="fill" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="p-2 space-y-0.5">
                      <button
                        onClick={() => {
                          router.push('/settings');
                          setAccountMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-800 rounded-xl transition-colors text-left"
                      >
                        <Wallet size={16} className="text-slate-400" weight="duotone" />
                        <span className="text-xs font-medium text-slate-200">Manage Wallets</span>
                      </button>
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          setShowDisconnectConfirm(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                      >
                        <SignOut size={16} className="text-rose-400" weight="duotone" />
                        <span className="text-xs font-medium text-rose-400">Disconnect Wallet</span>
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

      <ConfirmDialog
        open={showDisconnectConfirm}
        onOpenChange={setShowDisconnectConfirm}
        title="Disconnect wallet?"
        description="You will be signed out of the Blue Hole Portal and need to reconnect your government-authorized wallet to continue."
        confirmLabel="Disconnect"
        destructive
        onConfirm={() => {
          disconnectWallet();
          setShowDisconnectConfirm(false);
        }}
      />
    </header>
  );
}
