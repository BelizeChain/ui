'use client';

import React, { useEffect } from 'react';
import { useUIStore } from '@/store/ui';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useI18n } from '@belizechain/shared';
import { WalletProvider } from '@/contexts/WalletContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { MessagingProvider } from '@/contexts/MessagingContext';

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

export function Providers({ children }: { children: React.ReactNode }) {
  // Future: Add ToastContainer when shared package exports compatible types
  // const { notifications, removeNotification } = useUIStore();

  return (
    <ErrorBoundary>
      <WalletProvider>
        <ToastProvider>
          <MessagingProvider>
            <I18nHydration>
              {children}
            </I18nHydration>
          </MessagingProvider>
        </ToastProvider>
      </WalletProvider>
      {/* <ToastContainer notifications={notifications} onClose={removeNotification} /> */}
    </ErrorBoundary>
  );
}
