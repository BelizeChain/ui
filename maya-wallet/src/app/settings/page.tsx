'use client';

import React, { useState } from 'react';
import { Card, Switch, Select, Button, Badge, Alert, useWallet, useI18n } from '@belizechain/shared';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import {
  ArrowLeft,
  Bell,
  Lock,
  Palette,
  Globe,
  Shield,
  Moon,
  ChartBar,
  Download,
  SignOut,
  UserCircle,
  Fingerprint,
} from 'phosphor-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { selectedAccount, disconnect } = useWallet();
  const { t, locale, setLocale } = useI18n();
  const account = selectedAccount as InjectedAccountWithMeta & { isVerified?: boolean };
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSaveSettings = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card>
          <p className="text-gray-400">Please connect your wallet to access settings.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4 z-10">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-white hover:text-gray-300 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400 text-sm">Manage your preferences</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto -mt-4">
        {showSuccess && (
          <Alert variant="success" title="Settings Saved" onClose={() => setShowSuccess(false)}>
            Your preferences have been updated successfully.
          </Alert>
        )}

        {/* Profile Section */}
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-maya-400 to-maya-600 flex items-center justify-center">
                <UserCircle size={32} weight="fill" className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sand-900">{account.meta.name || 'User'}</h3>
                <p className="text-sm text-sand-600 font-mono">{account.address.slice(0, 8)}...{account.address.slice(-6)}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {account.isVerified && (
                    <Badge variant="success" className="text-xs flex items-center">
                      ✓ Verified
                    </Badge>
                  )}
                  <Badge variant="info" className="text-xs">
                    Citizen
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <Link href="/profile">
            <Button variant="outline" className="w-full">
              Edit Profile
            </Button>
          </Link>
        </Card>

        {/* Notifications */}
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-caribbean-100 flex items-center justify-center">
              <Bell size={20} className="text-caribbean-600" />
            </div>
            <h2 className="text-lg font-semibold text-sand-900">Notifications</h2>
          </div>
          <div className="space-y-4">
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
              label="Push Notifications"
              description="Receive alerts for transactions and activities"
            />
            <div className="border-t border-sand-200 pt-4">
              <p className="text-sm font-medium text-sand-700 mb-2">Notification Types</p>
              <div className="space-y-3 pl-4">
                <Switch
                  checked={true}
                  onCheckedChange={() => {}}
                  label="Transaction Alerts"
                  description="When you send or receive funds"
                />
                <Switch
                  checked={true}
                  onCheckedChange={() => {}}
                  label="Tourism Rewards"
                  description="When you earn tourism incentives"
                />
                <Switch
                  checked={false}
                  onCheckedChange={() => {}}
                  label="Governance Updates"
                  description="District proposals and voting"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-jungle-100 flex items-center justify-center">
              <Shield size={20} className="text-jungle-600" />
            </div>
            <h2 className="text-lg font-semibold text-sand-900">Security</h2>
          </div>
          <div className="space-y-4">
            <Switch
              checked={biometric}
              onCheckedChange={setBiometric}
              label="Biometric Authentication"
              description="Use fingerprint or face ID to unlock"
            />
            <div className="border-t border-sand-200 pt-4">
              <Link href="/security">
                <button className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-700/30 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <Lock size={20} className="text-sand-600" />
                    <span className="text-sm font-medium text-sand-900">Change PIN</span>
                  </div>
                  <span className="text-sand-400">›</span>
                </button>
              </Link>
              <Link href="/backup">
                <button className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-700/30 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <Download size={20} className="text-sand-600" />
                    <span className="text-sm font-medium text-sand-900">Backup Wallet</span>
                  </div>
                  <span className="text-sand-400">›</span>
                </button>
              </Link>
              <Link href="/recovery">
                <button className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-700/30 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <Fingerprint size={20} className="text-sand-600" />
                    <span className="text-sm font-medium text-sand-900">Recovery Phrase</span>
                  </div>
                  <span className="text-sand-400">›</span>
                </button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-maya-100 flex items-center justify-center">
              <Palette size={20} className="text-maya-600" />
            </div>
            <h2 className="text-lg font-semibold text-sand-900">Appearance</h2>
          </div>
          <div className="space-y-4">
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
              label="Dark Mode"
              description="Use dark theme across the app"
            />
          </div>
        </Card>

        {/* Preferences */}
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-bluehole-100 flex items-center justify-center">
              <Globe size={20} className="text-bluehole-600" />
            </div>
            <h2 className="text-lg font-semibold text-sand-900">Preferences</h2>
          </div>
          <div className="space-y-4">
            <Select
              label="Display Currency"
              options={[
                { value: 'USD', label: '🇺🇸 US Dollar (USD)' },
                { value: 'BZD', label: '🇧🇿 Belize Dollar (BZD)' },
                { value: 'DALLA', label: '⛓️ DALLA (Native)' },
              ]}
              value={currency}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCurrency(e.target.value)}
            />
            <Select
              label={t.common.language}
              options={[
                { value: 'en', label: '🇬🇧 English' },
                { value: 'es', label: '🇪🇸 Español' },
                { value: 'kri', label: '🇧🇿 Kriol' },
                { value: 'qek', label: '🇬🇹 Q\'eqchi\' Maya' },
                { value: 'gar', label: '🇭🇳 Garífuna' },
                { value: 'mop', label: '🇧🇿 Mopan Maya' },
              ]}
              value={locale}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocale(e.target.value as any)}
            />
          </div>
        </Card>

        {/* Privacy */}
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <ChartBar size={20} className="text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-sand-900">Privacy</h2>
          </div>
          <div className="space-y-4">
            <Switch
              checked={analytics}
              onCheckedChange={setAnalytics}
              label="Usage Analytics"
              description="Help improve the app by sharing anonymous data"
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button
            variant="primary"
            className="w-full"
            onClick={handleSaveSettings}
          >
            Save Settings
          </Button>
          <Button
            variant="outline"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={disconnect}
          >
            <SignOut size={20} className="mr-2" />
            Sign Out
          </Button>
        </div>

        {/* App Info */}
        <Card className="bg-gray-800/50 border border-gray-700/30">
          <div className="text-center text-sm text-gray-400">
            <p className="font-semibold mb-1 text-white">Maya Wallet</p>
            <p>Version 1.0.0 • BelizeChain Network</p>
            <div className="flex items-center justify-center space-x-4 mt-3 text-xs">
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <span>•</span>
              <Link href="/help" className="hover:text-white">Help</Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
