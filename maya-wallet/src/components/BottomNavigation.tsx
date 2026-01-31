'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    label: 'Community',
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
    label: 'Messages',
    href: '/messages',
    Icon: ChatCircle,
  },
  {
    id: 'more',
    label: 'More',
    href: '/more',
    Icon: DotsThreeOutline,
  },
];

export function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-xl border-t border-white/10" />
      
      <div className="relative max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around h-20">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.Icon;
            
            // Center elevated Trade button
            if (item.isCenter) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex flex-col items-center -mt-8"
                >
                  <div className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all ${
                    active 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 scale-110' 
                      : 'bg-gradient-to-br from-jade-500 to-emerald-600 hover:scale-105'
                  }`}>
                    <Icon size={28} weight="fill" className="text-white" />
                  </div>
                  <span className={`text-xs font-semibold mt-1 ${
                    active ? 'text-emerald-400' : 'text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            }
            
            // Regular navigation items
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex flex-col items-center justify-center py-2 px-3 transition-all"
              >
                <div className={`mb-1 transition-all ${
                  active ? 'scale-110' : 'scale-100'
                }`}>
                  <Icon 
                    size={24} 
                    weight={active ? 'fill' : 'regular'} 
                    className={active ? 'text-emerald-400' : 'text-gray-400'}
                  />
                </div>
                <span className={`text-xs font-medium transition-colors ${
                  active ? 'text-emerald-400' : 'text-gray-400'
                }`}>
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
