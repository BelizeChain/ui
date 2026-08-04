'use client';

import React, { useEffect } from 'react';
import { useUIStore } from '@/store/ui';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useI18n } from '@belizechain/shared';
import { WalletProvider } from '@/contexts/WalletContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { MessagingProvider } from '@/contexts/MessagingContext';

if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && (args[0].includes('VEC:') || args[0].includes('RPC-CORE:'))) {
      return;
    }
    originalError.apply(console, args);
  };
}

function I18nHydration({ children }: { children: React.ReactNode }) {
  const { locale, setLocale } = useI18n();

  useEffect(() => {
    // Force rehydration from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('belizechain-locale');
      if (stored) {
        try {
          const { state } = JSON.parse(stored);
          if (state?.locale && state.locale !== locale) {
            console.log('Rehydrating locale from localStorage:', state.locale);
            setLocale(state.locale);
          }
        } catch (error) {
          console.error('Failed to hydrate i18n:', error);
        }
      }
    }
  }, [locale, setLocale]);

  return <>{children}</>;
}

function ThemeHydration({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyTheme = () => {
      const raw = localStorage.getItem('maya-appearance-settings');
      let theme = 'light';
      let accent = 'forest';
      let glass = true;
      let anim = true;

      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          theme = parsed.theme ?? theme;
          accent = parsed.accentColor ?? accent;
          glass = parsed.glassEffect ?? glass;
          anim = parsed.animations ?? anim;
        } catch (e) {
          // fallback
        }
      }

      const root = document.documentElement;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const effectiveDark = theme === 'dark' || (theme === 'auto' && prefersDark);
      
      root.classList.toggle('dark', effectiveDark);
      root.dataset.mayaAccent = accent;
      root.classList.toggle('maya-no-glass', !glass);
      root.classList.toggle('maya-reduced-motion', !anim);
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme();
    mediaQuery.addEventListener('change', handleChange);
    
    // Also listen to local storage changes from appearance page
    window.addEventListener('storage', (e) => {
      if (e.key === 'maya-appearance-settings') applyTheme();
    });

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Future: Add ToastContainer when shared package exports compatible types
  // const { notifications, removeNotification } = useUIStore();

  return (
    <ErrorBoundary>
      <WalletProvider>
        <ToastProvider>
          <MessagingProvider>
            <ThemeHydration>
              <I18nHydration>
                {children}
              </I18nHydration>
            </ThemeHydration>
          </MessagingProvider>
        </ToastProvider>
      </WalletProvider>
      {/* <ToastContainer notifications={notifications} onClose={removeNotification} /> */}
    </ErrorBoundary>
  );
}
