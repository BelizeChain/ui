'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  House,
  Users,
  ArrowsLeftRight,
  ChatCircle,
  DotsThreeOutline
} from 'phosphor-react';

interface NavItem {
  id: string;
  label: string;
  href: string;
  Icon: typeof House;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    Icon: House,
  },
  {
    id: 'community',
    label: 'Civic',
    href: '/community',
    Icon: Users,
  },
  {
    id: 'trade',
    label: 'Trade',
    href: '/trade',
    Icon: ArrowsLeftRight,
    isCenter: true,
  },
  {
    id: 'messages',
    label: 'Chat',
    href: '/messages',
    Icon: ChatCircle,
  },
  {
    id: 'more',
    label: 'Menu',
    href: '/more',
    Icon: DotsThreeOutline,
  },
];

export function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    // Account for basePath /wallet if present in pathname
    const normalized = pathname.replace(/^\/wallet/, '') || '/';
    if (href === '/') return normalized === '/';
    return normalized.startsWith(href);
  };

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="relative max-w-md mx-auto pointer-events-auto">
        {/* Floating Capsule Dock */}
        <div className="relative flex items-center justify-around h-16 px-3 rounded-full bg-slate-950/85 backdrop-blur-2xl border border-teal-500/25 shadow-2xl shadow-teal-950/40">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.Icon;

            // Center elevated action button
            if (item.isCenter) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="relative -mt-6 group flex flex-col items-center"
                >
                  <div
                    className={`w-13 h-13 rounded-2xl flex items-center justify-center p-3 shadow-lg shadow-teal-500/30 transition-all duration-300 group-hover:scale-105 ${
                      active
                        ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 scale-105 ring-2 ring-teal-300/50'
                        : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white hover:shadow-teal-400/40'
                    }`}
                  >
                    <Icon size={26} weight="fill" />
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-1 transition-colors ${
                      active ? 'text-teal-300' : 'text-slate-400 group-hover:text-teal-200'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            }

            // Standard Navigation Pill
            return (
              <Link
                key={item.id}
                href={item.href}
                className="relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all group"
              >
                {active && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-teal-500/15 rounded-xl border border-teal-400/30"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <div
                  className={`relative z-10 transition-transform duration-200 ${
                    active ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                >
                  <Icon
                    size={22}
                    weight={active ? 'fill' : 'regular'}
                    className={active ? 'text-teal-300' : 'text-slate-400 group-hover:text-slate-200'}
                  />
                </div>
                <span
                  className={`relative z-10 text-[10px] font-semibold mt-0.5 transition-colors ${
                    active ? 'text-teal-300 font-bold' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
