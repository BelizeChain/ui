'use client';

import React from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { NotificationBell } from './NotificationBell';
import { User, CaretDown, SignOut } from 'phosphor-react';
import { GlassCard } from './ui';

export function AppHeader() {
  const { selectedAccount, accounts, selectAccount, disconnect, isConnected } = useWallet();
  const [showAccountMenu, setShowAccountMenu] = React.useState(false);

  if (!isConnected) {
    return null;
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-gray-900/40 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-white">Maya Wallet</span>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <NotificationBell />

          {/* Account Selector */}
          <div className="relative">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-emerald-900/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <User size={18} weight="fill" className="text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs text-gray-400">Account</p>
                <p className="text-sm font-semibold text-white">
                  {selectedAccount?.name || truncateAddress(selectedAccount?.address || '')}
                </p>
              </div>
              <CaretDown size={16} className="text-gray-400" />
            </button>

            {/* Account Menu Dropdown */}
            {showAccountMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowAccountMenu(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-72">
                  <GlassCard variant="medium" blur="lg">
                    <div className="p-3 border-b border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Your Accounts</p>
                      {accounts.map((account) => (
                        <button
                          key={account.address}
                          onClick={() => {
                            selectAccount(account.address);
                            setShowAccountMenu(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                            selectedAccount?.address === account.address
                              ? 'bg-forest-50 border border-forest-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-emerald-500 flex items-center justify-center">
                              <User size={20} weight="fill" className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {account.name || 'Account'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {truncateAddress(account.address)}
                              </p>
                            </div>
                            {selectedAccount?.address === account.address && (
                              <div className="w-2 h-2 rounded-full bg-forest-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="p-3">
                      <button
                        onClick={() => {
                          disconnect();
                          setShowAccountMenu(false);
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <SignOut size={18} weight="bold" />
                        <span className="font-semibold">Disconnect</span>
                      </button>
                    </div>
                  </GlassCard>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
