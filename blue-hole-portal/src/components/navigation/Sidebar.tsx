'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  House,
  FileText,
  Coin,
  Users,
  ShieldCheck,
  ChartLine,
  MagnifyingGlass,
  Code,
  Gear,
  List,
  X,
  CaretLeft,
  CaretRight,
} from 'phosphor-react';
import { cn } from '@/lib/utils';
import { useGovernance } from '@/hooks/useGovernance';
import { useCompliance } from '@/hooks/useCompliance';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
  badgeKey?: 'proposals' | 'compliance'; // For dynamic badges
  description: string;
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Real-time data
  const { proposals } = useGovernance();
  const { stats: complianceStats } = useCompliance();

  // Calculate badge counts
  const badgeCounts = {
    proposals: proposals.filter(p => p.status === 'Active').length,
    compliance: complianceStats?.pendingReview || 0,
  };

  const navigationSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'Overview',
      items: [
        {
          name: 'Dashboard',
          href: '/',
          icon: House,
          description: 'National overview & metrics',
        },
      ],
    },
    {
      title: 'Governance',
      items: [
        {
          name: 'Proposals',
          href: '/governance/proposals',
          icon: FileText,
          badgeKey: 'proposals',
          description: 'View & create proposals',
        },
        {
          name: 'Treasury',
          href: '/treasury',
          icon: Coin,
          description: 'DALLA & bBZD management',
        },
      ],
    },
    {
      title: 'Network',
      items: [
        {
          name: 'Validators',
          href: '/validators',
          icon: Users,
          description: 'Staking & validator management',
        },
        {
          name: 'Compliance',
          href: '/compliance',
          icon: ShieldCheck,
          badgeKey: 'compliance',
          description: 'KYC/AML monitoring',
        },
      ],
    },
    {
      title: 'Analytics',
      items: [
        {
          name: 'Analytics',
          href: '/analytics',
          icon: ChartLine,
          description: 'National economic metrics',
        },
        {
          name: 'Explorer',
          href: '/explorer',
          icon: MagnifyingGlass,
          description: 'Block explorer & search',
        },
      ],
    },
    {
      title: 'Tools',
      items: [
        {
          name: 'Developer',
          href: '/developer',
          icon: Code,
          description: 'Chain state & extrinsics',
        },
        {
          name: 'Settings',
          href: '/settings',
          icon: Gear,
          description: 'Portal preferences',
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-gray-900 border-r border-gray-700/50 transition-all duration-300 z-40',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Logo & Collapse Button */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700/50">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BH</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Blue Hole</h2>
              <p className="text-xs text-gray-400">Portal</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors ml-auto"
        >
          {collapsed ? (
            <CaretRight size={20} className="text-gray-400" weight="bold" />
          ) : (
            <CaretLeft size={20} className="text-gray-400" weight="bold" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navigationSections.map((section, sectionIdx) => (
          <div key={section.title} className={cn(sectionIdx > 0 && 'mt-6')}>
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                // Get badge count from badgeKey or use static badge
                const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : item.badge;

                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative',
                      isActive
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon
                      size={20}
                      weight={isActive ? 'fill' : 'duotone'}
                      className={cn('flex-shrink-0', isActive && 'text-blue-400')}
                    />
                    {!collapsed && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left">
                          {item.name}
                        </span>
                        {badgeCount && badgeCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-full text-xs font-medium text-red-400">
                            {badgeCount}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && badgeCount && badgeCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="h-16 border-t border-gray-700/50 flex items-center justify-center px-4">
        {!collapsed ? (
          <p className="text-xs text-gray-500">BelizeChain © 2026</p>
        ) : (
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
        )}
      </div>
    </aside>
  );
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Real-time data
  const { proposals } = useGovernance();
  const { stats: complianceStats } = useCompliance();

  // Calculate badge counts
  const badgeCounts = {
    proposals: proposals.filter(p => p.status === 'Active').length,
    compliance: complianceStats?.pendingReview || 0,
  };

  const navigationSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'Overview',
      items: [
        {
          name: 'Dashboard',
          href: '/',
          icon: House,
          description: 'National overview & metrics',
        },
      ],
    },
    {
      title: 'Governance',
      items: [
        {
          name: 'Proposals',
          href: '/governance/proposals',
          icon: FileText,
          badgeKey: 'proposals',
          description: 'View & create proposals',
        },
        {
          name: 'Treasury',
          href: '/treasury',
          icon: Coin,
          description: 'DALLA & bBZD management',
        },
      ],
    },
    {
      title: 'Network',
      items: [
        {
          name: 'Validators',
          href: '/validators',
          icon: Users,
          description: 'Staking & validator management',
        },
        {
          name: 'Compliance',
          href: '/compliance',
          icon: ShieldCheck,
          badgeKey: 'compliance',
          description: 'KYC/AML monitoring',
        },
      ],
    },
    {
      title: 'Analytics',
      items: [
        {
          name: 'Analytics',
          href: '/analytics',
          icon: ChartLine,
          description: 'National economic metrics',
        },
        {
          name: 'Explorer',
          href: '/explorer',
          icon: MagnifyingGlass,
          description: 'Block explorer & search',
        },
      ],
    },
    {
      title: 'Tools',
      items: [
        {
          name: 'Developer',
          href: '/developer',
          icon: Code,
          description: 'Chain state & extrinsics',
        },
        {
          name: 'Settings',
          href: '/settings',
          icon: Gear,
          description: 'Portal preferences',
        },
      ],
    },
  ];

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-700/50 z-50 lg:hidden transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BH</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Blue Hole</h2>
              <p className="text-xs text-gray-400">Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" weight="bold" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navigationSections.map((section, sectionIdx) => (
            <div key={section.title} className={cn(sectionIdx > 0 && 'mt-6')}>
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  // Get badge count from badgeKey or use static badge
                  const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : item.badge;

                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavigate(item.href)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                        isActive
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <Icon
                        size={20}
                        weight={isActive ? 'fill' : 'duotone'}
                        className={cn('flex-shrink-0', isActive && 'text-blue-400')}
                      />
                      <span className="text-sm font-medium flex-1 text-left">
                        {item.name}
                      </span>
                      {badgeCount && badgeCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-full text-xs font-medium text-red-400">
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="h-16 border-t border-gray-700/50 flex items-center justify-center px-4">
          <p className="text-xs text-gray-500">BelizeChain © 2026</p>
        </div>
      </aside>
    </>
  );
}
