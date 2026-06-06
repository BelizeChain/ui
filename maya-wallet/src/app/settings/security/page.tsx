'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Fingerprint, Eye, PaperPlaneTilt, ChartBar, Clock, CaretRight, CheckCircle } from 'phosphor-react';
import { GlassCard } from '@/components/ui';
import {
  getSecuritySettings,
  saveSecuritySettings,
  type SecuritySettings,
} from '@/services/settings';

type BoolKey = 'biometric' | 'hideBalances' | 'requireConfirmationOnSend' | 'analytics';

const TOGGLES: { key: BoolKey; label: string; description: string; icon: React.ReactNode }[] = [
  { key: 'biometric', label: 'Biometric Unlock', description: 'Use fingerprint or face ID to unlock', icon: <Fingerprint size={20} weight="fill" className="text-white" /> },
  { key: 'hideBalances', label: 'Hide Balances', description: 'Blur amounts until you reveal them', icon: <Eye size={20} weight="fill" className="text-white" /> },
  { key: 'requireConfirmationOnSend', label: 'Confirm Before Sending', description: 'Require an extra confirmation on transfers', icon: <PaperPlaneTilt size={20} weight="fill" className="text-white" /> },
  { key: 'analytics', label: 'Usage Analytics', description: 'Share anonymous data to improve the app', icon: <ChartBar size={20} weight="fill" className="text-white" /> },
];

const AUTO_LOCK_OPTIONS = [1, 5, 15, 30, 60];

export default function SettingsSecurityPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getSecuritySettings());
  }, []);

  if (!settings) return null;

  const update = (partial: Partial<SecuritySettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSecuritySettings(next);
  };

  const handleSave = () => {
    saveSecuritySettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Security Settings</h1>
              <p className="text-xs text-gray-400">Protect your account</p>
            </div>
          </div>
          <ShieldCheck size={32} className="text-red-400" weight="duotone" />
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-4">
        {saved && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
            <p className="text-emerald-400 text-sm font-semibold text-center">Security settings saved.</p>
          </div>
        )}

        {/* Toggles */}
        <GlassCard variant="dark" blur="sm" className="divide-y divide-gray-700/40">
          {TOGGLES.map((toggle) => {
            const value = settings[toggle.key];
            return (
              <div key={toggle.key} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center">
                    {toggle.icon}
                  </div>
                  <div>
                    <p className="font-medium text-white">{toggle.label}</p>
                    <p className="text-xs text-gray-400">{toggle.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => update({ [toggle.key]: !value } as Partial<SecuritySettings>)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-gray-600'}`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            );
          })}
        </GlassCard>

        {/* Auto-lock */}
        <GlassCard variant="dark" blur="sm" className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Clock size={20} weight="fill" className="text-white" />
            </div>
            <div>
              <p className="font-medium text-white">Auto-Lock</p>
              <p className="text-xs text-gray-400">Lock the wallet after inactivity</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {AUTO_LOCK_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                onClick={() => update({ autoLockMinutes: minutes })}
                className={`py-2 rounded-lg text-sm font-semibold transition-colors ${
                  settings.autoLockMinutes === minutes
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60'
                }`}
              >
                {minutes}m
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Advanced link */}
        <Link href="/security">
          <GlassCard variant="dark" blur="sm" className="p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors">
            <div>
              <p className="font-medium text-white">Recovery &amp; Multi-sig</p>
              <p className="text-xs text-gray-400">Open the full Security Center</p>
            </div>
            <CaretRight size={18} className="text-gray-400" weight="bold" />
          </GlassCard>
        </Link>

        <button
          onClick={handleSave}
          className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <CheckCircle size={20} weight="fill" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
