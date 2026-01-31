'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Globe,
  CheckCircle,
  MapPin,
  Clock
} from 'phosphor-react';

export default function LanguagePage() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedRegion, setSelectedRegion] = useState('BZ');
  const [selectedTimezone, setSelectedTimezone] = useState('America/Belize');

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', users: '1.5B' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', users: '559M' },
    { code: 'kr', name: 'Kriol', nativeName: 'Belize Kriol', flag: '🇧🇿', users: '100K' },
    { code: 'my', name: 'Mayan', nativeName: 'Maya', flag: '🇬🇹', users: '7M' },
    { code: 'ga', name: 'Garifuna', nativeName: 'Garífuna', flag: '🇧🇿', users: '200K' }
  ];

  const regions = [
    { code: 'BZ', name: 'Belize', currency: 'BZD' },
    { code: 'US', name: 'United States', currency: 'USD' },
    { code: 'MX', name: 'Mexico', currency: 'MXN' },
    { code: 'GT', name: 'Guatemala', currency: 'GTQ' },
    { code: 'HN', name: 'Honduras', currency: 'HNL' }
  ];

  const timezones = [
    { id: 'America/Belize', name: 'Belize Time (UTC-6)', offset: '-06:00' },
    { id: 'America/New_York', name: 'Eastern Time (UTC-5)', offset: '-05:00' },
    { id: 'America/Chicago', name: 'Central Time (UTC-6)', offset: '-06:00' },
    { id: 'America/Los_Angeles', name: 'Pacific Time (UTC-8)', offset: '-08:00' },
    { id: 'Europe/London', name: 'London Time (UTC+0)', offset: '+00:00' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Language & Region</h1>
              <p className="text-sm text-gray-400">Localization Settings</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
            <Globe size={20} className="text-white" weight="fill" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Language Selection */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 px-2">Display Language</h2>
          <GlassCard variant="dark" blur="sm" className="divide-y divide-gray-100">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{lang.flag}</span>
                  <div className="text-left">
                  <p className="font-medium text-white">{lang.name}</p>
                  <p className="text-xs text-gray-400">{lang.nativeName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{lang.users} speakers</span>
                  {selectedLanguage === lang.code && (
                    <CheckCircle size={24} className="text-forest-500" weight="fill" />
                  )}
                </div>
              </button>
            ))}
          </GlassCard>
        </div>

        {/* Region Selection */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 px-2">Region</h2>
          <GlassCard variant="dark" blur="sm" className="divide-y divide-gray-100">
            {regions.map((region) => (
              <button
                key={region.code}
                onClick={() => setSelectedRegion(region.code)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-400 flex items-center justify-center">
                    <MapPin size={20} className="text-white" weight="fill" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">{region.name}</p>
                    <p className="text-sm text-gray-400">Currency: {region.currency}</p>
                  </div>
                </div>
                {selectedRegion === region.code && (
                  <CheckCircle size={24} className="text-forest-500" weight="fill" />
                )}
              </button>
            ))}
          </GlassCard>
        </div>

        {/* Timezone Selection */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 px-2">Time Zone</h2>
          <GlassCard variant="dark" blur="sm" className="divide-y divide-gray-100">
            {timezones.map((tz) => (
              <button
                key={tz.id}
                onClick={() => setSelectedTimezone(tz.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                    <Clock size={20} className="text-white" weight="fill" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-white">{tz.name}</p>
                    <p className="text-sm text-gray-400">GMT {tz.offset}</p>
                  </div>
                </div>
                {selectedTimezone === tz.id && (
                  <CheckCircle size={24} className="text-forest-500" weight="fill" />
                )}
              </button>
            ))}
          </GlassCard>
        </div>

        {/* Date & Time Format */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 px-2">Format Preview</h2>
          <GlassCard variant="gradient" blur="lg" className="p-5">
            <div className="space-y-3">
              <div>
                <p className="text-white/80 text-xs mb-1">Date Format</p>
                <p className="text-white font-bold">January 24, 2026</p>
              </div>
              <div>
                <p className="text-white/80 text-xs mb-1">Time Format</p>
                <p className="text-white font-bold">6:23 PM (12-hour)</p>
              </div>
              <div>
                <p className="text-white/80 text-xs mb-1">Currency Format</p>
                <p className="text-white font-bold">BZ$ 1,234.56</p>
              </div>
              <div>
                <p className="text-white/80 text-xs mb-1">Number Format</p>
                <p className="text-white font-bold">1,234,567.89</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Save Button */}
        <button className="w-full py-4 bg-gradient-to-r from-forest-500 to-emerald-400 hover:from-forest-400 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl">
          Save Changes
        </button>
      </div>
    </div>
  );
}
