'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Moon, Sun } from 'phosphor-react';
import { useState, useEffect } from 'react';

export default function SettingsAppearancePage() {
  const router = useRouter();
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage
    const stored = localStorage.getItem('maya-theme');
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored);
    }
  }, []);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('maya-theme', newTheme);
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!mounted) {
    return null; // Avoid SSR hydration mismatch
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-caribbean-50 to-blue-50 pb-20">
      <div className="bg-gradient-to-r from-caribbean-600 to-caribbean-500 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-700/20 rounded-lg transition-colors">
            <ArrowLeft size={24} weight="bold" />
          </button>
          <h1 className="text-2xl font-bold">Appearance</h1>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Theme Selection */}
        <div className="bg-gray-800 rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-bluehole-900 mb-4">Theme</h2>
          
          <div className="space-y-3">
            {/* Light Mode */}
            <button
              onClick={() => setTheme('light')}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                theme === 'light'
                  ? 'border-caribbean-500 bg-caribbean-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Sun size={24} weight="fill" className="text-yellow-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-bluehole-900">Light</p>
                  <p className="text-sm text-gray-400">Bright and clean</p>
                </div>
              </div>
              {theme === 'light' && (
                <div className="h-6 w-6 rounded-full bg-caribbean-500 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-gray-800"></div>
                </div>
              )}
            </button>

            {/* Dark Mode */}
            <button
              onClick={() => setTheme('dark')}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                theme === 'dark'
                  ? 'border-caribbean-500 bg-caribbean-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Moon size={24} weight="fill" className="text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-bluehole-900">Dark</p>
                  <p className="text-sm text-gray-400">Easy on the eyes</p>
                </div>
              </div>
              {theme === 'dark' && (
                <div className="h-6 w-6 rounded-full bg-caribbean-500 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-gray-800"></div>
                </div>
              )}
            </button>

            {/* System Mode - Coming Soon */}
            <div className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 bg-gray-50 opacity-60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <div className="flex">
                    <Sun size={12} className="text-yellow-600" />
                    <Moon size={12} className="text-indigo-600" />
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-bluehole-900">System</p>
                  <p className="text-sm text-gray-400">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-800 rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-bluehole-900 mb-4">Preview</h2>
          <div className="bg-gradient-to-br from-caribbean-600 to-caribbean-500 rounded-xl p-4 text-white">
            <p className="font-semibold mb-1">Maya Wallet</p>
            <p className="text-sm text-white/80">Your digital gateway to Belize</p>
          </div>
        </div>
      </div>
    </div>
  );
}
