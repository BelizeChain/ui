'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
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
  Check,
  CheckCircle,
  CaretRight,
} from 'phosphor-react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  getSecuritySettings,
  saveSecuritySettings,
  getWalletPreferences,
  saveWalletPreferences,
} from '@/services/settings';

export default function SettingsPage() {
  const { selectedAccount, disconnect } = useWallet();
  const account = selectedAccount as any;
  const [notifications, setNotifications] = useState(true);
  const [txAlerts, setTxAlerts] = useState(true);
  const [tourismRewards, setTourismRewards] = useState(true);
  const [governanceUpdates, setGovernanceUpdates] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [currency, setCurrency] = useState('DALLA');
  const [language, setLanguage] = useState('en');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    const notifPrefs = getNotificationPreferences();
    const securitySettings = getSecuritySettings();
    const walletPrefs = getWalletPreferences();
    const savedCurrencyPref = typeof window !== 'undefined' ? localStorage.getItem('maya-currency-pref') : null;
    setNotifications(notifPrefs.pushEnabled);
    setBiometric(securitySettings.biometric);
    setAnalytics(securitySettings.analytics);
    setCurrency(savedCurrencyPref || walletPrefs.currency || 'DALLA');
  }, []);

  const handleSaveSettings = () => {
    const notifPrefs = getNotificationPreferences();
    saveNotificationPreferences({ ...notifPrefs, pushEnabled: notifications });
    const securitySettings = getSecuritySettings();
    saveSecuritySettings({ ...securitySettings, biometric, analytics });
    saveWalletPreferences({ currency, pushNotifications: notifications });
    if (typeof window !== 'undefined') {
      localStorage.setItem('maya-currency-pref', currency);
    }
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#030914] to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl backdrop-blur-xl text-white">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-bold">Wallet Disconnected</h2>
          <p className="text-slate-400 text-xs">Please connect your wallet to access and manage settings.</p>
          <Link
            href="/"
            className="inline-block w-full bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold py-3 rounded-2xl shadow-lg shadow-cyan-500/20 text-xs"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#030914] to-slate-950 text-white pb-16">
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                aria-label="Back"
              >
                <ArrowLeft size={18} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Settings</h1>
              <p className="text-xs text-slate-400">Manage wallet preferences & security</p>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {showSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
            <span>Preferences saved successfully to local secure storage.</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
              <UserCircle size={36} weight="fill" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm truncate">{account?.meta?.name || 'Belizean Citizen'}</h3>
              <p className="text-xs text-slate-400 font-mono truncate">
                {account?.address?.slice(0, 8)}...{account?.address?.slice(-6)}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-1">
                  <Check size={10} weight="bold" /> Verified
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
                  Citizen
                </span>
              </div>
            </div>
          </div>

          <Link href="/profile" className="shrink-0">
            <button className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-white hover:border-cyan-500/40 hover:text-cyan-300 transition-all">
              Edit Profile
            </button>
          </Link>
        </div>

        {/* Notifications */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Bell size={18} />
            </div>
            <h2 className="text-sm font-bold text-white">Notifications</h2>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Push Notifications</p>
                <p className="text-[11px] text-slate-400">Receive alerts for transactions and activities</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  notifications ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    notifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-slate-800/80 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-300">Transaction Alerts</p>
                  <p className="text-[11px] text-slate-500">When you send or receive DALLA</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTxAlerts(!txAlerts)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    txAlerts ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                      txAlerts ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-300">Tourism & Staking Rewards</p>
                  <p className="text-[11px] text-slate-500">When you earn validator yield</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTourismRewards(!tourismRewards)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    tourismRewards ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                      tourismRewards ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-300">District Assembly Governance</p>
                  <p className="text-[11px] text-slate-500">District proposals and voting reminders</p>
                </div>
                <button
                  type="button"
                  onClick={() => setGovernanceUpdates(!governanceUpdates)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    governanceUpdates ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                      governanceUpdates ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Quick Links */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield size={18} />
            </div>
            <h2 className="text-sm font-bold text-white">Security & Passkeys</h2>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-xs font-semibold text-white">Biometric Authentication</p>
                <p className="text-[11px] text-slate-400">Unlock Maya Wallet with fingerprint or FaceID</p>
              </div>
              <button
                type="button"
                onClick={() => setBiometric(!biometric)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  biometric ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    biometric ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-slate-800/80 pt-2 space-y-1">
              <Link href="/security" className="block">
                <div className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Lock size={16} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">Security Center & Multi-Sig</span>
                  </div>
                  <CaretRight size={14} className="text-slate-500" />
                </div>
              </Link>
              <Link href="/backup" className="block">
                <div className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Download size={16} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">Backup Keystore File</span>
                  </div>
                  <CaretRight size={14} className="text-slate-500" />
                </div>
              </Link>
              <Link href="/recovery" className="block">
                <div className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Fingerprint size={16} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-200">Social Recovery Contacts</span>
                  </div>
                  <CaretRight size={14} className="text-slate-500" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Appearance Link */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Palette size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Appearance & Themes</h2>
                <p className="text-[11px] text-slate-400">Maya Deep Cyan Glassmorphism</p>
              </div>
            </div>
            <Link href="/settings/appearance">
              <button className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-white hover:border-cyan-500/40 transition-all flex items-center gap-1.5">
                <span>Manage</span>
                <CaretRight size={12} />
              </button>
            </Link>
          </div>
        </div>

        {/* Preferences */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Globe size={18} />
            </div>
            <h2 className="text-sm font-bold text-white">Currency & Language</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Display Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="DALLA">DALLA (Ɗ - Native)</option>
                <option value="BZD">Belize Dollar (BZD)</option>
                <option value="USD">US Dollar (USD)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="en">English (Official)</option>
                <option value="es">Español</option>
                <option value="kri">Kriol (Belizean)</option>
                <option value="qek">Qʼeqchiʼ Maya</option>
                <option value="gar">Garifuna</option>
                <option value="mop">Mopan Maya</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy & Telemetry */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ChartBar size={18} />
            </div>
            <h2 className="text-sm font-bold text-white">Privacy & Telemetry</h2>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs font-semibold text-white">Anonymous Crash Reporting</p>
              <p className="text-[11px] text-slate-400">Helps improve decentralized client stability</p>
            </div>
            <button
              type="button"
              onClick={() => setAnalytics(!analytics)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                analytics ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  analytics ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="pt-2">
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-xs font-bold flex items-center justify-center gap-2"
          >
            <SignOut size={16} />
            <span>Sign Out Sovereign Session</span>
          </button>
        </div>

        {/* App Info Footer */}
        <div className="text-center text-xs text-slate-500 pt-4 space-y-2">
          <p className="font-semibold text-slate-400">Maya Wallet v1.0.0 • BelizeChain Network</p>
          <div className="flex items-center justify-center gap-4 text-[11px]">
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Sovereignty</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Zero-Knowledge Privacy</Link>
            <span>•</span>
            <Link href="/help" className="hover:text-slate-300 transition-colors">Community Support</Link>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showSignOutConfirm}
        onOpenChange={setShowSignOutConfirm}
        title="Sign out of Maya Wallet?"
        description="You will be disconnected and will need to reconnect your Polkadot.js account to sign back in."
        confirmLabel="Sign Out"
        destructive
        onConfirm={() => {
          disconnect();
          setShowSignOutConfirm(false);
        }}
      />
    </div>
  );
}
