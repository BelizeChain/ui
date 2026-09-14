'use client';

import Link from 'next/link';
import { ArrowLeft, Moon, Sun, Sparkle, CheckCircle } from 'phosphor-react';
import { useState, useEffect } from 'react';

export default function SettingsAppearancePage() {
  const [theme, setThemeState] = useState<'dark' | 'midnight' | 'cyberpunk'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('maya-theme');
    if (stored === 'dark' || stored === 'midnight' || stored === 'cyberpunk') {
      setThemeState(stored as any);
    }
  }, []);

  const setTheme = (newTheme: 'dark' | 'midnight' | 'cyberpunk') => {
    setThemeState(newTheme);
    localStorage.setItem('maya-theme', newTheme);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#030914] to-slate-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/settings">
            <button className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 text-slate-300 hover:text-white transition-colors">
              <ArrowLeft size={20} weight="bold" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Appearance</h1>
            <p className="text-xs text-slate-400">Customize theme and visual aesthetics</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6 mt-2">
        {/* Theme Selection */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Visual Themes</h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-medium">
              Dark Mode Active
            </span>
          </div>

          <div className="space-y-3">
            {/* Dark Slate (Default) */}
            <button
              onClick={() => setTheme('dark')}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                theme === 'dark'
                  ? 'border-cyan-500/60 bg-cyan-500/10 shadow-lg shadow-cyan-500/5'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-cyan-400">
                  <Moon size={20} weight="fill" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Maya Deep Cyan (Default)</p>
                  <p className="text-xs text-slate-400">Sovereign glassmorphism with cyan and emerald accents</p>
                </div>
              </div>
              {theme === 'dark' && (
                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950">
                  <CheckCircle size={18} weight="fill" />
                </div>
              )}
            </button>

            {/* Midnight Obsidian */}
            <button
              onClick={() => setTheme('midnight')}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                theme === 'midnight'
                  ? 'border-cyan-500/60 bg-cyan-500/10 shadow-lg shadow-cyan-500/5'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-indigo-400">
                  <Sparkle size={20} weight="fill" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Midnight Obsidian</p>
                  <p className="text-xs text-slate-400">OLED pure black backdrop with high-contrast borders</p>
                </div>
              </div>
              {theme === 'midnight' && (
                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950">
                  <CheckCircle size={18} weight="fill" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-3">
          <h2 className="text-sm font-bold text-white">Theme Preview</h2>
          <div className="rounded-xl p-5 bg-gradient-to-r from-slate-900 via-[#04101e] to-slate-900 border border-cyan-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-cyan-400 font-mono tracking-wider">MAYA WALLET Ɗ</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
                CONNECTED
              </span>
            </div>
            <p className="text-xl font-bold text-white tracking-tight">1,250.00 Ɗ</p>
            <p className="text-xs text-slate-400 mt-1">Sovereign Web3 Gateway to Belize</p>
          </div>
        </div>
      </div>
    </div>
  );
}
