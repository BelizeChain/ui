'use client';

import React, { useState } from 'react';
import { Card, Badge, useI18n } from '@belizechain/shared';
import { useAccountStore } from '@/store/account';
import { 
  PaperPlaneTilt, 
  QrCode, 
  ArrowsLeftRight,
  Eye,
  EyeSlash,
  CheckCircle,
  Warning,
  TrendUp,
  Gift,
  ChartLine,
  Users,
  CaretRight,
  Bell,
  Scan
} from 'phosphor-react';
import Link from 'next/link';

export function DashboardHome() {
  const { t } = useI18n();
  const { account } = useAccountStore();
  const [balanceVisible, setBalanceVisible] = useState(true);

  if (!account) return null;

  // Mock data - will be replaced with real blockchain queries
  const stats = {
    compliance: { status: 'verified', level: 3 },
    activeProposals: 2,
    communityVotes: 5,
    pouwRewards: 125.50,
    monthlySpending: 450,
    budgetLimit: 1000,
  };

  const recentActivity = [
    { id: '1', type: 'payment', description: 'Sent to Maria Garcia', amount: -50, currency: 'DALLA', time: '2h ago' },
    { id: '2', type: 'reward', description: 'Tourism cashback', amount: 8.5, currency: 'DALLA', time: '1d ago' },
    { id: '3', type: 'governance', description: 'Voted on Proposal #45', amount: 0, currency: null, time: '2d ago' },
  ];

  return (
    <div className="min-h-screen bg-sand-50 pb-20">
      {/* Header with Balance */}
      <div className="bg-gradient-to-br from-caribbean-500 via-caribbean-600 to-bluehole-700 px-4 pt-6 pb-32">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-caribbean-100 text-sm">{t.wallet.welcomeBack},</p>
            <p className="text-white text-xl font-bold">{account.name || 'Citizen'}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/scanner" className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <Scan size={20} weight="bold" />
            </Link>
            <Link href="/notifications" className="relative h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <Bell size={20} weight="bold" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Link>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white/80 text-sm font-medium">{t.wallet.totalBalance}</h2>
            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="text-white/80 hover:text-white transition-colors"
            >
              {balanceVisible ? <Eye size={20} /> : <EyeSlash size={20} />}
            </button>
          </div>

          {balanceVisible ? (
            <>
              <p className="text-4xl font-bold text-white mb-4">
                Ɗ{account.balance.dalla.toLocaleString()}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="info" className="bg-white/20 text-white border-white/30">
                    ${account.balance.bBZD} bBZD
                  </Badge>
                  {account.isVerified && (
                    <Badge variant="success" className="bg-jungle-500/30 text-jungle-100 border-jungle-400/30">
                      <CheckCircle size={14} weight="fill" className="mr-1" />
                      KYC Verified
                    </Badge>
                  )}
                </div>
                <Link href="/wallet/exchange" className="text-white/90 hover:text-white text-sm font-medium">
                  Exchange →
                </Link>
              </div>
            </>
          ) : (
            <div>
              <p className="text-4xl font-bold text-white mb-4">••••••</p>
              <p className="text-white/70 text-sm">Balance hidden for privacy</p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
            {/* Quick Actions */}
      <div className="px-4 -mt-24 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <QuickActionCard
            icon={<PaperPlaneTilt size={28} weight="fill" />}
            label={t.wallet.send}
            href="/wallet/send"
            color="caribbean"
          />
          <QuickActionCard
            icon={<QrCode size={28} weight="fill" />}
            label={t.wallet.receive}
            href="/wallet/receive"
            color="maya"
          />
          <QuickActionCard
            icon={<ArrowsLeftRight size={28} weight="fill" />}
            label="Trade"
            href="/trade"
            color="jungle"
          />
        </div>
      </div>

      {/* Status Widgets Row */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {/* Compliance Status */}
          <Link href="/compliance">
            <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle size={24} weight="fill" className="text-jungle-500" />
                  <Badge variant="success" className="text-xs">Level {stats.compliance.level}</Badge>
                </div>
                <p className="text-sm text-bluehole-600 mb-1">Compliance</p>
                <p className="text-lg font-semibold text-bluehole-900 capitalize">{stats.compliance.status}</p>
              </div>
            </Card>
          </Link>

          {/* Budget Status */}
          <Link href="/wallet/budget">
            <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <TrendUp size={24} weight="fill" className="text-caribbean-500" />
                  <span className="text-xs text-bluehole-600">
                    {Math.round((stats.monthlySpending / stats.budgetLimit) * 100)}%
                  </span>
                </div>
                <p className="text-sm text-bluehole-600 mb-1">Budget</p>
                <p className="text-lg font-semibold text-bluehole-900">
                  Ɗ{stats.monthlySpending} / Ɗ{stats.budgetLimit}
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Active Engagement */}
      <div className="px-4 mb-6">
        <h3 className="text-lg font-semibold text-bluehole-900 mb-3">Participate</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Governance */}
          <Link href="/governance">
            <Card className="bg-gradient-to-br from-caribbean-50 to-caribbean-100 border-caribbean-200 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-caribbean-500 flex items-center justify-center">
                  <ChartLine size={20} weight="fill" className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-caribbean-700">{stats.activeProposals}</p>
                  <p className="text-xs text-caribbean-600">Active Proposals</p>
                </div>
              </div>
              <p className="text-sm text-caribbean-700 font-medium">Vote Now →</p>
            </Card>
          </Link>

          {/* Community */}
          <Link href="/community">
            <Card className="bg-gradient-to-br from-jungle-50 to-jungle-100 border-jungle-200 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-jungle-500 flex items-center justify-center">
                  <Users size={20} weight="fill" className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-jungle-700">{stats.communityVotes}</p>
                  <p className="text-xs text-jungle-600">Community Votes</p>
                </div>
              </div>
              <p className="text-sm text-jungle-700 font-medium">Participate →</p>
            </Card>
          </Link>
        </div>
      </div>

      {/* PoUW Rewards Banner */}
      <div className="px-4 mb-6">
        <Link href="/rewards">
          <Card className="bg-gradient-to-r from-maya-500 to-maya-600 border-maya-700 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Gift size={40} weight="duotone" className="text-bluehole-900" />
                <div>
                  <h3 className="text-lg font-bold text-bluehole-900">PoUW Rewards</h3>
                  <p className="text-sm text-bluehole-700">You've earned Ɗ{stats.pouwRewards} this month</p>
                </div>
              </div>
              <CaretRight size={24} weight="bold" className="text-bluehole-900" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-bluehole-900">Recent Activity</h3>
          <Link href="/history" className="text-caribbean-500 text-sm font-medium">
            View All
          </Link>
        </div>

        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: 'caribbean' | 'jungle' | 'maya';
}

function QuickActionCard({ icon, label, href, color }: QuickActionCardProps) {
  const colorClasses = {
    caribbean: 'bg-caribbean-500 hover:bg-caribbean-600',
    jungle: 'bg-jungle-500 hover:bg-jungle-600',
    maya: 'bg-maya-500 hover:bg-maya-600',
  };

  return (
    <Link href={href}>
      <div className={`${colorClasses[color]} rounded-2xl shadow-lg hover:shadow-xl transition-all p-4 cursor-pointer`}>
        <div className="flex flex-col items-center space-y-2">
          <div className="text-white">
            {icon}
          </div>
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
      </div>
    </Link>
  );
}

interface ActivityItemProps {
  activity: {
    id: string;
    type: string;
    description: string;
    amount: number;
    currency: string | null;
    time: string;
  };
}

function ActivityItem({ activity }: ActivityItemProps) {
  const getIcon = () => {
    switch (activity.type) {
      case 'payment':
        return <PaperPlaneTilt size={20} weight="fill" className="text-caribbean-500" />;
      case 'reward':
        return <Gift size={20} weight="fill" className="text-maya-500" />;
      case 'governance':
        return <ChartLine size={20} weight="fill" className="text-jungle-500" />;
      default:
        return <CheckCircle size={20} weight="fill" className="text-bluehole-500" />;
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-sand-100 flex items-center justify-center">
            {getIcon()}
          </div>
          <div>
            <p className="font-medium text-bluehole-900">{activity.description}</p>
            <p className="text-sm text-bluehole-600">{activity.time}</p>
          </div>
        </div>
        {activity.amount !== 0 && (
          <div className="text-right">
            <p className={`font-semibold ${activity.amount > 0 ? 'text-jungle-600' : 'text-bluehole-900'}`}>
              {activity.amount > 0 ? '+' : ''}Ɗ{Math.abs(activity.amount)}
            </p>
            {activity.currency && (
              <p className="text-xs text-bluehole-600">{activity.currency}</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
