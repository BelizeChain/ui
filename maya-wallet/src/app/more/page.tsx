'use client';

import React from 'react';
import { GlassCard } from '@/components/ui';
import Link from 'next/link';
import {
  User,
  Shield,
  Bell,
  Palette,
  Question,
  Info,
  SignOut,
  CaretRight,
  Key,
  FileText,
  Globe,
  UserList,
  ChartBar,
  GearSix,
  IdentificationCard,
  Briefcase,
  House,
  GlobeHemisphereWest,
  Database,
  Atom,
  Brain,
  FileCode,
  GitBranch,
  Code,
  LockKey,
  CurrencyDollar,
  ChartLineUp
} from 'phosphor-react';

export default function MorePage() {
  const menuSections = [
    {
      title: 'BelizeChain Platforms',
      description: 'Core infrastructure services',
      items: [
        { 
          icon: <IdentificationCard size={20} weight="fill" />, 
          label: 'BelizeID', 
          description: 'Digital identity & KYC',
          href: '/belizeid', 
          color: 'from-blue-500 to-cyan-600',
          badge: 'L2 Verified'
        },
        { 
          icon: <Database size={20} weight="fill" />, 
          label: 'Pakit Storage', 
          description: 'Quantum compression & IPFS',
          href: '/pakit', 
          color: 'from-cyan-500 to-blue-600',
          badge: '856 GB'
        },
        { 
          icon: <Atom size={20} weight="fill" />, 
          label: 'Kinich Quantum', 
          description: 'Quantum computing jobs',
          href: '/kinich', 
          color: 'from-purple-500 to-pink-600',
          badge: 'Azure Q'
        },
        { 
          icon: <Brain size={20} weight="fill" />, 
          label: 'Nawal AI', 
          description: 'Federated learning & rewards',
          href: '/nawal', 
          color: 'from-indigo-500 to-purple-600',
          badge: 'Training'
        },
        { 
          icon: <FileCode size={20} weight="fill" />, 
          label: 'The Gem', 
          description: 'Smart contracts (ink!)',
          href: '/gem', 
          color: 'from-pink-500 to-red-600',
          badge: 'PSP22/34'
        }
      ]
    },
    {
      title: 'Financial Services',
      description: 'Business & treasury management',
      items: [
        { 
          icon: <Briefcase size={20} weight="fill" />, 
          label: 'Payroll', 
          description: 'Employee & contractor payments',
          href: '/payroll', 
          color: 'from-emerald-500 to-teal-600',
          badge: 'Auto'
        },
        { 
          icon: <CurrencyDollar size={20} weight="fill" />, 
          label: 'Treasury', 
          description: 'Multi-sig & governance',
          href: '/treasury', 
          color: 'from-amber-500 to-orange-600',
          badge: '4-of-7'
        },
        { 
          icon: <ChartLineUp size={20} weight="fill" />, 
          label: 'Analytics', 
          description: 'Wallet insights & patterns',
          href: '/analytics', 
          color: 'from-forest-500 to-emerald-600',
          badge: 'Pro'
        }
      ]
    },
    {
      title: 'Asset Management',
      description: 'Property & domain registry',
      items: [
        { 
          icon: <House size={20} weight="fill" />, 
          label: 'LandLedger', 
          description: 'Property titles & transfers',
          href: '/landledger', 
          color: 'from-orange-500 to-red-600',
          badge: '3 Properties'
        },
        { 
          icon: <GlobeHemisphereWest size={20} weight="fill" />, 
          label: 'BNS Domains', 
          description: '.bz domains & hosting',
          href: '/bns', 
          color: 'from-blue-500 to-indigo-600',
          badge: '5 Domains'
        }
      ]
    },
    {
      title: 'Advanced Features',
      description: 'Developer & security tools',
      items: [
        { 
          icon: <GitBranch size={20} weight="fill" />, 
          label: 'Interoperability', 
          description: 'Cross-chain bridges',
          href: '/bridges', 
          color: 'from-violet-500 to-purple-600',
          badge: 'ETH/DOT'
        },
        { 
          icon: <Code size={20} weight="fill" />, 
          label: 'Developer Tools', 
          description: 'API & SDK access',
          href: '/developer', 
          color: 'from-slate-500 to-gray-600',
          badge: 'API Key'
        },
        { 
          icon: <LockKey size={20} weight="fill" />, 
          label: 'Security Center', 
          description: 'Recovery & multi-sig',
          href: '/security', 
          color: 'from-red-500 to-pink-600',
          badge: 'Protected'
        }
      ]
    },
    {
      title: 'Account',
      description: 'Personal settings',
      items: [
        { 
          icon: <User size={20} weight="fill" />, 
          label: 'Profile Settings', 
          description: 'Edit account details',
          href: '/profile', 
          color: 'from-blue-500 to-cyan-600' 
        },
        { 
          icon: <Shield size={20} weight="fill" />, 
          label: 'Security & Privacy', 
          description: 'Passwords & 2FA',
          href: '/security', 
          color: 'from-red-500 to-pink-600' 
        },
        { 
          icon: <Bell size={20} weight="fill" />, 
          label: 'Notifications', 
          description: 'Alerts & preferences',
          href: '/notifications', 
          color: 'from-amber-500 to-orange-600' 
        }
      ]
    },
    {
      title: 'Preferences',
      description: 'Customize your experience',
      items: [
        { 
          icon: <Palette size={20} weight="fill" />, 
          label: 'Appearance', 
          description: 'Theme & display',
          href: '/appearance', 
          color: 'from-purple-500 to-pink-600' 
        },
        { 
          icon: <Globe size={20} weight="fill" />, 
          label: 'Language & Region', 
          description: 'English, Spanish, Kriol',
          href: '/language', 
          color: 'from-emerald-500 to-teal-600',
          badge: 'EN'
        },
        { 
          icon: <GearSix size={20} weight="fill" />, 
          label: 'Advanced Settings', 
          description: 'Network & RPC',
          href: '/advanced', 
          color: 'from-gray-500 to-gray-700' 
        }
      ]
    },
    {
      title: 'Social',
      description: 'Community features',
      items: [
        { 
          icon: <UserList size={20} weight="fill" />, 
          label: 'Friends & Contacts', 
          description: 'Manage connections',
          href: '/contacts', 
          color: 'from-indigo-500 to-blue-600',
          badge: '24'
        },
        { 
          icon: <ChartBar size={20} weight="fill" />, 
          label: 'Activity History', 
          description: 'Transactions & posts',
          href: '/activity', 
          color: 'from-forest-500 to-emerald-600' 
        }
      ]
    },
    {
      title: 'Help & Info',
      description: 'Support & documentation',
      items: [
        { 
          icon: <Question size={20} weight="fill" />, 
          label: 'Help Center', 
          description: 'FAQs & guides',
          href: '/help', 
          color: 'from-orange-500 to-red-600' 
        },
        { 
          icon: <FileText size={20} weight="fill" />, 
          label: 'Terms & Policies', 
          description: 'Legal & compliance',
          href: '/terms', 
          color: 'from-slate-500 to-gray-600' 
        },
        { 
          icon: <Info size={20} weight="fill" />, 
          label: 'About BelizeChain', 
          description: 'Mission & roadmap',
          href: '/about', 
          color: 'from-cyan-500 to-blue-600' 
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Simple Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm px-6 py-4 border-b border-gray-700/50">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-white mb-1">More</h1>
          <p className="text-sm text-gray-400">Explore BelizeChain Features</p>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="px-4 mt-4 mb-6">
        <GlassCard variant="dark" blur="md" className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-forest-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
              JD
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">John Doe</h2>
              <p className="text-sm text-gray-400">john.doe@belizechain.bz</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="px-2 py-0.5 bg-emerald-500/20 rounded-full text-xs text-emerald-400 font-semibold">
                  Level 28
                </div>
                <div className="px-2 py-0.5 bg-amber-500/20 rounded-full text-xs text-amber-400 font-semibold">
                  L2 Verified
                </div>
              </div>
            </div>
            <Link href="/profile">
              <CaretRight size={20} className="text-gray-400" weight="bold" />
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700/30">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-400">5,234</p>
              <p className="text-xs text-gray-400">DALLA</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-purple-400">12</p>
              <p className="text-xs text-gray-400">Badges</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-400">#4</p>
              <p className="text-xs text-gray-400">Rank</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Menu Sections */}
      <div className="px-4 space-y-6">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <div className="mb-3 px-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </h3>
              {section.description && (
                <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
              )}
            </div>
            <GlassCard variant="dark" blur="sm" className="divide-y divide-gray-700/30">
              {section.items.map((item, itemIndex) => (
                <Link key={itemIndex} href={item.href}>
                  <div className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition-all cursor-pointer group">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform flex-shrink-0`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">{item.label}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 bg-forest-100 text-forest-700 text-xs rounded font-semibold">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <CaretRight size={18} className="text-gray-400 group-hover:text-forest-600 transition-colors flex-shrink-0 ml-2" weight="bold" />
                  </div>
                </Link>
              ))}
            </GlassCard>
          </div>
        ))}

        {/* Sign Out Button */}
        <GlassCard variant="dark" blur="sm" className="p-4">
          <button className="w-full flex items-center justify-center space-x-2 text-red-600 font-semibold hover:text-red-700 transition-colors">
            <SignOut size={20} weight="fill" />
            <span>Sign Out</span>
          </button>
        </GlassCard>

        {/* App Version */}
        <div className="text-center py-6">
          <p className="text-xs text-gray-400">BelizeChain Maya Wallet</p>
          <p className="text-xs text-gray-400">Version 1.0.0 (Beta)</p>
          <p className="text-xs text-gray-400 mt-2">Powered by Substrate • Polkadot SDK stable2512</p>
        </div>
      </div>
    </div>
  );
}
