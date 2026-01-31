'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
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
  X,
} from 'phosphor-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: any;
  category: string;
  keywords: string[];
}

const commandItems: CommandItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'View national overview & metrics',
    href: '/',
    icon: House,
    category: 'Pages',
    keywords: ['home', 'overview', 'metrics', 'stats'],
  },
  {
    id: 'proposals',
    name: 'Governance Proposals',
    description: 'View and create proposals',
    href: '/governance/proposals',
    icon: FileText,
    category: 'Pages',
    keywords: ['vote', 'voting', 'democracy', 'governance'],
  },
  {
    id: 'treasury',
    name: 'Treasury',
    description: 'DALLA & bBZD management',
    href: '/treasury',
    icon: Coin,
    category: 'Pages',
    keywords: ['money', 'funds', 'spending', 'dalla', 'bbzd'],
  },
  {
    id: 'validators',
    name: 'Validators',
    description: 'Staking & validator management',
    href: '/validators',
    icon: Users,
    category: 'Pages',
    keywords: ['staking', 'stake', 'pouw', 'pqw', 'validators'],
  },
  {
    id: 'compliance',
    name: 'Compliance',
    description: 'KYC/AML monitoring',
    href: '/compliance',
    icon: ShieldCheck,
    category: 'Pages',
    keywords: ['kyc', 'aml', 'fsc', 'verification'],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'National economic metrics',
    href: '/analytics',
    icon: ChartLine,
    category: 'Pages',
    keywords: ['charts', 'data', 'reports', 'metrics'],
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Block explorer & search',
    href: '/explorer',
    icon: MagnifyingGlass,
    category: 'Pages',
    keywords: ['blocks', 'transactions', 'search', 'chain'],
  },
  {
    id: 'developer',
    name: 'Developer Tools',
    description: 'Chain state & extrinsics',
    href: '/developer',
    icon: Code,
    category: 'Pages',
    keywords: ['dev', 'rpc', 'extrinsic', 'storage', 'api'],
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Portal preferences',
    href: '/settings',
    icon: Gear,
    category: 'Pages',
    keywords: ['config', 'preferences', 'options'],
  },
  // Quick Actions
  {
    id: 'create-proposal',
    name: 'Create Proposal',
    description: 'Submit a new governance proposal',
    href: '/governance/proposals/new',
    icon: FileText,
    category: 'Actions',
    keywords: ['new', 'submit', 'proposal'],
  },
  {
    id: 'treasury-spend',
    name: 'Treasury Spend',
    description: 'Create treasury spend proposal',
    href: '/treasury/spend',
    icon: Coin,
    category: 'Actions',
    keywords: ['spend', 'payment', 'transfer'],
  },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Toggle command palette with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Close on Escape
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', down);
      return () => document.removeEventListener('keydown', down);
    }
  }, [open]);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      setOpen(false);
      setSearch('');
      router.push(item.href);
    },
    [router]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command Palette */}
      <div className="fixed left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
        <Command
          className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
          label="Command Menu"
        >
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
            <MagnifyingGlass size={20} className="text-gray-400" weight="bold" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search pages, actions..."
              className="flex-1 bg-transparent text-white placeholder:text-gray-400 outline-none text-sm"
            />
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={16} className="text-gray-400" weight="bold" />
            </button>
          </div>

          {/* Results */}
          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-gray-400">
              No results found.
            </Command.Empty>

            {/* Pages */}
            <Command.Group
              heading="Pages"
              className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase"
            >
              {commandItems
                .filter((item) => item.category === 'Pages')
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.id}
                      value={item.name + ' ' + item.keywords.join(' ')}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer data-[selected=true]:bg-blue-500/20 transition-colors mb-1"
                    >
                      <div className="p-2 bg-gray-700 rounded-lg">
                        <Icon size={18} className="text-gray-300" weight="duotone" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.description}</p>
                      </div>
                      <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-xs text-gray-400">
                        ↵
                      </kbd>
                    </Command.Item>
                  );
                })}
            </Command.Group>

            {/* Actions */}
            <Command.Group
              heading="Actions"
              className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase mt-2"
            >
              {commandItems
                .filter((item) => item.category === 'Actions')
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.id}
                      value={item.name + ' ' + item.keywords.join(' ')}
                      onSelect={() => handleSelect(item)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer data-[selected=true]:bg-blue-500/20 transition-colors mb-1"
                    >
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Icon size={18} className="text-blue-400" weight="duotone" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.description}</p>
                      </div>
                      <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-xs text-gray-400">
                        ↵
                      </kbd>
                    </Command.Item>
                  );
                })}
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700 bg-gray-900/50">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">↵</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
