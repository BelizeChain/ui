'use client';

import { useEffect } from 'react';
import { useI18n } from '@belizechain/shared';

/**
 * I18nProvider - Ensures i18n store is properly hydrated on client
 * Must be used in a Client Component to access localStorage
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { locale, setLocale } = useI18n();

  useEffect(() => {
    // Force rehydration from localStorage on mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('belizechain-locale');
      if (stored) {
        try {
          const { state } = JSON.parse(stored);
          if (state?.locale && state.locale !== locale) {
            setLocale(state.locale);
          }
        } catch (error) {
          console.error('Failed to hydrate i18n:', error);
        }
      }
    }
  }, []);

  return <>{children}</>;
}
