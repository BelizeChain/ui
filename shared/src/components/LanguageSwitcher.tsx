'use client';

import { useState } from 'react';
import { useI18n, type Locale, localeInfo } from '../i18n';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  const locales: Locale[] = ['en', 'es', 'kri', 'qek', 'gar', 'mop'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label={t.common.language}
      >
        <span className="text-lg">{localeInfo[locale].flag}</span>
        <span>{localeInfo[locale].nativeName}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div
            className="py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="language-menu"
          >
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc)}
                className={`${
                  locale === loc
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                } group flex w-full items-center px-4 py-2 text-sm`}
                role="menuitem"
              >
                <span className="text-lg mr-3">{localeInfo[loc].flag}</span>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{localeInfo[loc].nativeName}</span>
                  <span className="text-xs text-gray-500">{localeInfo[loc].name}</span>
                </div>
                {locale === loc && (
                  <svg
                    className="ml-auto w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// Compact version for mobile/header
export function LanguageSwitcherCompact() {
  const { locale, setLocale } = useI18n();

  const locales: Locale[] = ['en', 'es', 'kri', 'qek', 'gar', 'mop'];
  const currentIndex = locales.indexOf(locale);

  const cycleLanguage = () => {
    const nextIndex = (currentIndex + 1) % locales.length;
    setLocale(locales[nextIndex]);
  };

  return (
    <button
      onClick={cycleLanguage}
      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      aria-label="Change language"
      title={`Current: ${localeInfo[locale].nativeName} - Click to switch`}
    >
      <span className="text-lg">{localeInfo[locale].flag}</span>
      <span className="hidden sm:inline">{locale.toUpperCase()}</span>
    </button>
  );
}
