'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, BellSlash, CheckCircle } from 'phosphor-react';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  enablePushNotifications,
  type NotificationPreferences,
} from '@/services/settings';

type ToggleKey = keyof NotificationPreferences;

const TOGGLES: { key: ToggleKey; label: string; description: string }[] = [
  { key: 'transactionAlerts', label: 'Transaction Alerts', description: 'When you send or receive funds' },
  { key: 'tourismRewards', label: 'Tourism Rewards', description: 'When you earn tourism incentives' },
  { key: 'governanceUpdates', label: 'Governance Updates', description: 'District proposals and voting' },
  { key: 'securityAlerts', label: 'Security Alerts', description: 'Sign-ins and account changes' },
  { key: 'messages', label: 'Messages', description: 'New wallet-to-wallet messages' },
  { key: 'sound', label: 'Sound', description: 'Play a sound for new notifications' },
];

export default function SettingsNotificationsPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(getNotificationPreferences());
  }, []);

  if (!prefs) return null;

  const update = (key: ToggleKey, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    saveNotificationPreferences(next);
  };

  const handlePushToggle = async () => {
    if (!prefs.pushEnabled) {
      const granted = await enablePushNotifications();
      setPrefs(getNotificationPreferences());
      if (!granted) return;
    } else {
      update('pushEnabled', false);
    }
  };

  const handleSave = () => {
    saveNotificationPreferences(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <ArrowLeft size={24} weight="bold" className="text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Notification Settings</h1>
            <p className="text-xs text-gray-400">Choose what you want to be alerted about</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {saved && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
            <p className="text-emerald-400 text-sm font-semibold text-center">Notification preferences saved.</p>
          </div>
        )}

        {/* Push master toggle */}
        <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                {prefs.pushEnabled ? (
                  <Bell size={20} className="text-white" weight="fill" />
                ) : (
                  <BellSlash size={20} className="text-white" weight="fill" />
                )}
              </div>
              <div>
                <p className="font-medium text-white">Push Notifications</p>
                <p className="text-xs text-gray-400">Receive alerts on this device</p>
              </div>
            </div>
            <button
              onClick={handlePushToggle}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                prefs.pushEnabled ? 'bg-emerald-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  prefs.pushEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Category toggles */}
        <div className="bg-gray-800/60 border border-gray-700/40 rounded-2xl divide-y divide-gray-700/40">
          {TOGGLES.map((toggle) => {
            const value = prefs[toggle.key];
            const disabled = !prefs.pushEnabled && toggle.key !== 'sound';
            return (
              <div key={toggle.key} className={`p-4 flex items-center justify-between ${disabled ? 'opacity-50' : ''}`}>
                <div>
                  <p className="font-medium text-white">{toggle.label}</p>
                  <p className="text-xs text-gray-400">{toggle.description}</p>
                </div>
                <button
                  disabled={disabled}
                  onClick={() => update(toggle.key, !value)}
                  className={`relative w-14 h-8 rounded-full transition-colors disabled:cursor-not-allowed ${
                    value ? 'bg-emerald-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      value ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <CheckCircle size={20} weight="fill" />
          Save Preferences
        </button>
      </div>
    </div>
  );
}
