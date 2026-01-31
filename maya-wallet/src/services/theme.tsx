// Dark Mode Theme Service
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'maya-theme';

// Theme Provider Component
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme from localStorage or system preference
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    
    // Check localStorage first
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    
    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setThemeState((prevTheme: Theme) => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// Utility function to get current theme without React context
export function getCurrentTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

// Tailwind CSS theme configuration
// Add this to your tailwind.config.js:
/*
module.exports = {
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Light mode colors
        background: {
          light: '#ffffff',
          dark: '#1a1a1a',
        },
        surface: {
          light: '#f3f4f6',
          dark: '#2d2d2d',
        },
        border: {
          light: '#e5e7eb',
          dark: '#404040',
        },
        text: {
          primary: {
            light: '#111827',
            dark: '#f9fafb',
          },
          secondary: {
            light: '#6b7280',
            dark: '#9ca3af',
          },
        },
        // BelizeChain brand colors (work in both modes)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Main brand blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // DALLA token color (gold)
        dalla: {
          light: '#fbbf24',
          dark: '#f59e0b',
        },
        // bBZD token color (green - BZD peg)
        bbzd: {
          light: '#10b981',
          dark: '#059669',
        },
      },
    },
  },
};
*/

// Example CSS classes for dark mode
/*
.bg-background {
  @apply bg-white dark:bg-[#1a1a1a];
}

.bg-surface {
  @apply bg-gray-100 dark:bg-[#2d2d2d];
}

.border-border {
  @apply border-gray-200 dark:border-[#404040];
}

.text-primary {
  @apply text-gray-900 dark:text-gray-50;
}

.text-secondary {
  @apply text-gray-600 dark:text-gray-400;
}
*/

// Example usage in components:
/*
import { useTheme } from './services/theme';

function Header() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="bg-background border-b border-border">
      <button 
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-surface hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>
  );
}
*/
