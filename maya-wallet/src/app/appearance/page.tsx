'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Palette,
  Moon,
  Sun,
  MonitorPlay,
  CheckCircle,
  Circle,
  Sparkle,
  Image as ImageIcon
} from 'phosphor-react';

export default function AppearancePage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [accentColor, setAccentColor] = useState('forest');
  const [glassEffect, setGlassEffect] = useState(true);
  const [animations, setAnimations] = useState(true);

  const themes = [
    { id: 'light', name: 'Light', icon: <Sun size={20} weight="fill" />, gradient: 'from-yellow-400 to-orange-500' },
    { id: 'dark', name: 'Dark', icon: <Moon size={20} weight="fill" />, gradient: 'from-indigo-400 to-purple-700' },
    { id: 'auto', name: 'Auto', icon: <MonitorPlay size={20} weight="fill" />, gradient: 'from-blue-500 to-cyan-400' }
  ];

  const accentColors = [
    { id: 'forest', name: 'Forest Green', color: 'bg-forest-500', gradient: 'from-forest-500 to-emerald-400' },
    { id: 'ocean', name: 'Ocean Blue', color: 'bg-blue-500/100', gradient: 'from-blue-500 to-cyan-400' },
    { id: 'sunset', name: 'Sunset Orange', color: 'bg-orange-500', gradient: 'from-orange-500 to-red-400' },
    { id: 'purple', name: 'Royal Purple', color: 'bg-purple-500/100', gradient: 'from-purple-500 to-pink-400' },
    { id: 'amber', name: 'Amber Gold', color: 'bg-amber-500', gradient: 'from-amber-500 to-orange-400' },
    { id: 'teal', name: 'Teal Wave', color: 'bg-teal-500', gradient: 'from-teal-500 to-cyan-400' }
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
              <h1 className="text-xl font-bold text-white">Appearance</h1>
              <p className="text-xs text-gray-400">Theme & Display</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
            <Palette size={20} className="text-white" weight="fill" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Theme Selection */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 px-2">Theme Mode</h2>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className="relative"
              >
                <GlassCard 
                  variant="dark" 
                  blur="sm" 
                  className={`p-4 text-center transition-all ${
                    theme === t.id ? 'ring-2 ring-forest-500' : ''
                  }`}
                >
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white`}>
                    {t.icon}
                  </div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  {theme === t.id && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle size={20} className="text-forest-500" weight="fill" />
                    </div>
                  )}
                </GlassCard>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Colors */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 px-2">Accent Color</h2>
          <GlassCard variant="dark" blur="sm" className="p-4">
            <div className="grid grid-cols-3 gap-4">
              {accentColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setAccentColor(color.id)}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${color.gradient} transition-transform hover:scale-110`} />
                    {accentColor === color.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CheckCircle size={24} className="text-white drop-shadow-lg" weight="fill" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 text-center">{color.name}</p>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Visual Effects */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 px-2">Visual Effects</h2>
          <GlassCard variant="dark" blur="sm" className="divide-y divide-gray-100">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-400 flex items-center justify-center">
                  <Sparkle size={20} className="text-white" weight="fill" />
                </div>
                <div>
                  <p className="font-medium text-white">Glass Morphism</p>
                  <p className="text-xs text-gray-400">Frosted glass effect on cards</p>
                </div>
              </div>
              <button
                onClick={() => setGlassEffect(!glassEffect)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  glassEffect ? 'bg-forest-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-gray-200 rounded-full transition-transform ${
                  glassEffect ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                  <ImageIcon size={20} className="text-white" weight="fill" />
                </div>
                <div>
                  <p className="font-medium text-white">Smooth Animations</p>
                  <p className="text-xs text-gray-400">Enable transition effects</p>
                </div>
              </div>
              <button
                onClick={() => setAnimations(!animations)}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  animations ? 'bg-forest-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-gray-200 rounded-full transition-transform ${
                  animations ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Preview */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 px-2">Preview</h2>
          <GlassCard variant="gradient" blur="lg" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-lg">Sample Card</h3>
                <p className="text-white/80 text-sm">This is how cards will look</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-700/20 flex items-center justify-center">
                <Palette size={24} className="text-white" weight="fill" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/20">
              <div>
                <p className="text-white/60 text-xs">Balance</p>
                <p className="text-white font-bold">5,234 DALLA</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Status</p>
                <p className="text-white font-bold">Active</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Save Button */}
        <button className="w-full py-4 bg-gradient-to-r from-forest-500 to-emerald-400 hover:from-forest-400 hover:to-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl">
          Apply Changes
        </button>
      </div>
    </div>
  );
}
