'use client';

import React, { useState } from 'react';
import { Badge, useWallet, useBalance, useI18n } from '@belizechain/shared';
import { GlassCard } from '@/components/ui';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { 
  PaperPlaneTilt, 
  QrCode, 
  FileText, 
  CreditCard,
  Gift,
  Eye,
  EyeSlash,
  User,
  SignOut,
  CaretRight,
  Gear,
  UserCircle
} from 'phosphor-react';
import Link from 'next/link';

export function HomeScreen() {
  const { selectedAccount, disconnect, isConnected } = useWallet();
  const { balance, isLoading: balanceLoading } = useBalance((selectedAccount as InjectedAccountWithMeta | null)?.address ?? null);
  const { t } = useI18n();
  const [balanceVisible, setBalanceVisible] = useState(true);

  if (!isConnected || !selectedAccount) return null;

  const transactions = [
    {
      id: '1',
      type: 'received',
      from: 'Maria Garcia',
      amount: '50.00',
      currency: 'DALLA',
      timestamp: Date.now() - 3600000,
    },
    {
      id: '2',
      type: 'sent',
      to: 'Tourist Board',
      amount: '15.00',
      currency: 'bBZD',
      timestamp: Date.now() - 7200000,
    },
    {
      id: '3',
      type: 'received',
      from: 'Tourism Reward',
      amount: '8.50',
      currency: 'DALLA',
      timestamp: Date.now() - 86400000,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-4 pt-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
              <User size={20} weight="fill" className="text-white" />
            </div>
            <div>
              <p className="text-gray-300 text-sm">{t.wallet.welcomeBack}</p>
              <p className="text-white font-semibold">
                {(selectedAccount as InjectedAccountWithMeta)?.meta?.name || t.wallet.unnamedAccount}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/profile" className="text-gray-300 hover:text-white transition-colors">
              <UserCircle size={24} />
            </Link>
            <Link href="/settings" className="text-gray-300 hover:text-white transition-colors">
              <Gear size={24} />
            </Link>
            <button
              onClick={disconnect}
              className="text-gray-300 hover:text-white transition-colors"
              title={t.wallet.disconnect}
            >
              <SignOut size={24} />
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <GlassCard variant="dark-medium" blur="lg" className="bg-gray-800/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-300 text-sm font-medium">{t.wallet.totalBalance}</h2>
            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {balanceVisible ? <Eye size={20} /> : <EyeSlash size={20} />}
            </button>
          </div>

          {balanceVisible ? (
            <div>
              <p className="text-4xl font-bold text-white mb-4">
                {(balance as any)?.free || '0'} <span className="text-xl">DALLA</span>
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="info" className="bg-gray-700/50 text-gray-300 border border-gray-600">
                  {(balance as any)?.reserved || '0'} {t.currency.bBZD}
                </Badge>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-4xl font-bold text-white mb-4">••••••</p>
              <p className="text-gray-300 text-sm">{t.wallet.balanceHidden}</p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-16 mb-6">
        <div className="grid grid-cols-4 gap-3">
          <QuickAction
            icon={<PaperPlaneTilt size={24} weight="fill" />}
            label={t.wallet.send}
            href="/send"
          />
          <QuickAction
            icon={<QrCode size={24} weight="fill" />}
            label={t.wallet.receive}
            href="/receive"
          />
          <QuickAction
            icon={<FileText size={24} weight="fill" />}
            label={t.identity.documents}
            href="/documents"
          />
          <QuickAction
            icon={<CreditCard size={24} weight="fill" />}
            label={t.nav.services}
            href="/services"
          />
        </div>
      </div>

      {/* Tourism Rewards Banner */}
      <div className="px-4 mb-6">
        <Link href="/rewards">
          <GlassCard variant="dark-medium" blur="lg" className="bg-emerald-900/20 cursor-pointer hover:bg-emerald-900/30 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Gift size={32} weight="duotone" className="text-emerald-400" />
                <div>
                  <h3 className="font-semibold text-white">{t.currency.tourismRewards}</h3>
                  <p className="text-sm text-gray-300">{t.currency.earnCashback}</p>
                </div>
              </div>
              <CaretRight size={20} weight="bold" className="text-emerald-400" />
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{t.wallet.recentActivity}</h2>
          <Link href="/history" className="text-emerald-400 text-sm font-medium">
            {t.common.viewAll}
          </Link>
        </div>

        <div className="space-y-3">
          {transactions.map((tx) => (
            <TransactionItem key={tx.id} transaction={tx} />
          ))}
        </div>

        {transactions.length === 0 && (
          <GlassCard variant="dark-medium" blur="lg" className="text-center py-8">
            <p className="text-gray-300">{t.wallet.noTransactions}</p>
            <p className="text-sm text-gray-400 mt-1">
              {t.wallet.activityWillAppear}
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  href: string;
}

function QuickAction({ icon, label, href }: QuickActionProps) {
  return (
    <Link href={href}>
      <GlassCard variant="dark-medium" blur="lg" className="flex flex-col items-center space-y-2 p-3 hover:bg-gray-800/50 transition-all cursor-pointer">
        <div className="h-12 w-12 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400">
          {icon}
        </div>
        <span className="text-xs font-medium text-white text-center">{label}</span>
      </GlassCard>
    </Link>
  );
}

interface TransactionItemProps {
  transaction: any;
}

function TransactionItem({ transaction }: TransactionItemProps) {
  const isReceived = transaction.type === 'received';
  const timeAgo = formatTimeAgo(transaction.timestamp);

  return (
    <GlassCard variant="dark-medium" blur="lg" className="p-4 hover:bg-gray-800/50 transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center ${
              isReceived ? 'bg-emerald-900/30 text-emerald-400' : 'bg-blue-900/30 text-blue-400'
            }`}
          >
            {isReceived ? '↓' : '↑'}
          </div>
          <div>
            <p className="font-medium text-white">
              {isReceived ? transaction.from : transaction.to}
            </p>
            <p className="text-sm text-gray-400">{timeAgo}</p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`font-semibold ${
              isReceived ? 'text-emerald-400' : 'text-white'
            }`}
          >
            {isReceived ? '+' : '-'}${transaction.amount}
          </p>
          <p className="text-sm text-gray-400">{transaction.currency}</p>
        </div>
      </div>
    </GlassCard>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
