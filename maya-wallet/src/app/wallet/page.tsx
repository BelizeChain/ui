'use client';

import React from 'react';
import { Card } from '@belizechain/shared';
import Link from 'next/link';
import { 
  PaperPlaneTilt, 
  QrCode, 
  ClockCounterClockwise,
  AddressBook,
  Calculator,
  ChartPie,
  ArrowsLeftRight,
  CaretRight
} from 'phosphor-react';

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-caribbean-500 to-caribbean-700 px-4 pt-6 pb-8">
        <h1 className="text-2xl font-bold text-white">Wallet</h1>
        <p className="text-caribbean-100 text-sm mt-1">Manage your DALLA and bBZD</p>
      </div>

      {/* Main Actions */}
      <div className="px-4 -mt-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <ActionCard
            title="Send Money"
            description="Transfer DALLA or bBZD"
            icon={<PaperPlaneTilt size={32} weight="fill" />}
            href="/send"
            color="caribbean"
          />
          <ActionCard
            title="Receive"
            description="Show QR code"
            icon={<QrCode size={32} weight="fill" />}
            href="/receive"
            color="jungle"
          />
        </div>
      </div>

      {/* Wallet Features */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-bluehole-900 mb-3">Features</h2>
        <div className="space-y-3">
          <FeatureLink
            title="Transaction History"
            description="View all your transactions"
            icon={<ClockCounterClockwise size={24} weight="fill" />}
            href="/history"
          />
          <FeatureLink
            title="Contacts"
            description="Manage frequent recipients"
            icon={<AddressBook size={24} weight="fill" />}
            href="/wallet/contacts"
          />
          <FeatureLink
            title="Recurring Payments"
            description="Set up automatic payments"
            icon={<ArrowsLeftRight size={24} weight="fill" />}
            href="/wallet/recurring"
          />
          <FeatureLink
            title="Budget Tracker"
            description="Track spending by category"
            icon={<ChartPie size={24} weight="fill" />}
            href="/wallet/budget"
          />
          <FeatureLink
            title="Currency Calculator"
            description="Convert DALLA ↔ bBZD ↔ USD"
            icon={<Calculator size={24} weight="fill" />}
            href="/wallet/calculator"
          />
        </div>
      </div>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: 'caribbean' | 'jungle';
}

function ActionCard({ title, description, icon, href, color }: ActionCardProps) {
  const colorClasses = {
    caribbean: 'bg-gradient-to-br from-caribbean-500 to-caribbean-600 hover:from-caribbean-600 hover:to-caribbean-700',
    jungle: 'bg-gradient-to-br from-jungle-500 to-jungle-600 hover:from-jungle-600 hover:to-jungle-700',
  };

  return (
    <Link href={href}>
      <Card className={`${colorClasses[color]} border-none shadow-lg hover:shadow-xl transition-all cursor-pointer h-full`}>
        <div className="flex flex-col items-center text-center space-y-2 py-2">
          <div className="text-white">
            {icon}
          </div>
          <div>
            <p className="font-semibold text-white">{title}</p>
            <p className="text-xs text-white/80">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

interface FeatureLinkProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function FeatureLink({ title, description, icon, href }: FeatureLinkProps) {
  return (
    <Link href={href}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-caribbean-50 flex items-center justify-center text-caribbean-500">
              {icon}
            </div>
            <div>
              <p className="font-medium text-bluehole-900">{title}</p>
              <p className="text-sm text-bluehole-600">{description}</p>
            </div>
          </div>
          <CaretRight size={20} className="text-bluehole-400" />
        </div>
      </Card>
    </Link>
  );
}
