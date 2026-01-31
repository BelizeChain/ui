// BelizeChain Design System Styles

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Belizean Color Palette
export const colors = {
  caribbean: {
    primary: '#0066CC',
    light: '#3399FF',
    dark: '#003D7A',
  },
  jungle: {
    primary: '#00A86B',
    light: '#33CF87',
    dark: '#006541',
  },
  maya: {
    primary: '#FFD700',
    light: '#FFF799',
    dark: '#998100',
  },
  bluehole: {
    primary: '#003366',
    light: '#335C85',
    dark: '#001429',
  },
  sand: {
    primary: '#F5F5F5',
    light: '#FFFFFF',
    dark: '#A3A3A3',
  },
} as const;

// Common component styles
export const buttonStyles = {
  base: 'inline-flex items-center justify-center rounded-belize font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  sizes: {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-11 px-8 text-lg',
  },
  variants: {
    primary: 'bg-caribbean-500 text-white hover:bg-caribbean-600 focus:ring-caribbean-500',
    secondary: 'bg-jungle-500 text-white hover:bg-jungle-600 focus:ring-jungle-500',
    accent: 'bg-maya-500 text-bluehole-900 hover:bg-maya-600 focus:ring-maya-500',
    outline: 'border-2 border-caribbean-500 text-caribbean-500 hover:bg-caribbean-50 focus:ring-caribbean-500',
    ghost: 'text-caribbean-500 hover:bg-caribbean-50 focus:ring-caribbean-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
  },
} as const;

export const cardStyles = {
  base: 'rounded-belize border border-sand-300 bg-white shadow-sm',
  hover: 'transition-shadow hover:shadow-md',
  padding: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
} as const;

export const inputStyles = {
  base: 'flex h-10 w-full rounded-belize border border-sand-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-sand-500 focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  error: 'border-red-500 focus:ring-red-500',
} as const;

export const badgeStyles = {
  base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
  variants: {
    success: 'bg-jungle-100 text-jungle-700',
    warning: 'bg-maya-100 text-maya-800',
    error: 'bg-red-100 text-red-700',
    info: 'bg-caribbean-100 text-caribbean-700',
    neutral: 'bg-sand-200 text-sand-700',
  },
} as const;

// Animation presets
export const animations = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
} as const;

// Responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Common spacing
export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
} as const;

// Typography
export const typography = {
  heading: {
    h1: 'text-4xl font-bold tracking-tight text-bluehole-900',
    h2: 'text-3xl font-bold tracking-tight text-bluehole-900',
    h3: 'text-2xl font-semibold tracking-tight text-bluehole-900',
    h4: 'text-xl font-semibold tracking-tight text-bluehole-900',
    h5: 'text-lg font-semibold tracking-tight text-bluehole-900',
    h6: 'text-base font-semibold tracking-tight text-bluehole-900',
  },
  body: {
    large: 'text-lg text-bluehole-700',
    base: 'text-base text-bluehole-700',
    small: 'text-sm text-bluehole-600',
    tiny: 'text-xs text-bluehole-500',
  },
} as const;
