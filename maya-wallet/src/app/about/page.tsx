'use client';

import React from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Info,
  Heart,
  Rocket,
  Users,
  Globe,
  Shield,
  Sparkle,
  GithubLogo,
  TwitterLogo,
  TelegramLogo,
  LinkedinLogo
} from 'phosphor-react';

export default function AboutPage() {
  const router = useRouter();

  const stats = [
    { value: '15+', label: 'Custom Pallets', icon: <Sparkle size={20} weight="fill" /> },
    { value: '500K+', label: 'Transactions', icon: <Rocket size={20} weight="fill" /> },
    { value: '24/7', label: 'Network Uptime', icon: <Shield size={20} weight="fill" /> },
    { value: '10K+', label: 'Active Users', icon: <Users size={20} weight="fill" /> }
  ];

  const features = [
    {
      title: 'Sovereign Infrastructure',
      description: 'Built for Belize, governed by Belizeans',
      icon: <Globe size={24} weight="fill" />,
      color: 'from-blue-500 to-cyan-400'
    },
    {
      title: 'Multi-Currency Support',
      description: 'DALLA (utility) + bBZD (stable) tokens',
      icon: <Sparkle size={24} weight="fill" />,
      color: 'from-amber-500 to-orange-400'
    },
    {
      title: 'Tourism Rewards',
      description: '5-8% cashback for DALLA spending',
      icon: <Heart size={24} weight="fill" />,
      color: 'from-rose-500 to-pink-400'
    },
    {
      title: 'AI & Quantum Integration',
      description: 'Nawal AI + Kinich Quantum computing',
      icon: <Rocket size={24} weight="fill" />,
      color: 'from-purple-500 to-indigo-400'
    }
  ];

  const team = [
    { role: 'Core Development', members: 'Substrate & Polkadot SDK' },
    { role: 'AI Research', members: 'Nawal Federated Learning' },
    { role: 'Quantum Computing', members: 'Kinich Azure Integration' },
    { role: 'Storage Layer', members: 'Pakit IPFS/Arweave' }
  ];

  const socials = [
    { name: 'GitHub', icon: <GithubLogo size={24} weight="fill" />, url: 'https://github.com/belizechain' },
    { name: 'Twitter', icon: <TwitterLogo size={24} weight="fill" />, url: 'https://twitter.com/belizechain' },
    { name: 'Telegram', icon: <TelegramLogo size={24} weight="fill" />, url: 'https://t.me/belizechain' },
    { name: 'LinkedIn', icon: <LinkedinLogo size={24} weight="fill" />, url: 'https://linkedin.com/company/belizechain' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">About BelizeChain</h1>
              <p className="text-xs text-gray-400">Mission & Roadmap</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-400 flex items-center justify-center">
            <Info size={20} className="text-white" weight="fill" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <GlassCard variant="gradient" blur="lg" className="p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-700/20 flex items-center justify-center">
            <span className="text-4xl">🇧🇿</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">BelizeChain</h2>
          <p className="text-white/90 text-sm mb-4">
            Sovereign Digital Infrastructure for the Nation of Belize
          </p>
          <div className="inline-block px-4 py-2 bg-gray-700/20 rounded-full">
            <p className="text-white font-semibold text-sm">Version 1.0.0 (Beta)</p>
          </div>
        </GlassCard>

        {/* Mission Statement */}
        <GlassCard variant="dark" blur="sm" className="p-5">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Heart size={20} className="text-red-500" weight="fill" />
            Our Mission
          </h3>
          <p className="text-gray-300 leading-relaxed">
            To empower Belize with a cutting-edge blockchain infrastructure that preserves sovereignty, promotes financial inclusion, and integrates advanced technologies like AI and quantum computing for the benefit of all Belizeans.
          </p>
        </GlassCard>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
            <GlassCard key={index} variant="dark" blur="sm" className="p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-forest-500 to-emerald-400 flex items-center justify-center text-white">
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Key Features */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 px-2">Key Features</h3>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-white flex-shrink-0`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <GlassCard variant="dark" blur="sm" className="p-5">
          <h3 className="font-bold text-white mb-4">Technology Stack</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-300">Blockchain Core</p>
              <p className="text-sm text-gray-400">Substrate Framework • Polkadot SDK stable2512</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-300">Consensus</p>
              <p className="text-sm text-gray-400">Proof of Useful Work (PoUW) • AURA + GRANDPA</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-300">Smart Contracts</p>
              <p className="text-sm text-gray-400">ink! 4.0 • WASM Runtime</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-300">AI & ML</p>
              <p className="text-sm text-gray-400">PyTorch • Flower Federated Learning</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-300">Quantum Computing</p>
              <p className="text-sm text-gray-400">Azure Quantum • Qiskit • Cirq</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-300">Storage</p>
              <p className="text-sm text-gray-400">IPFS • Arweave • Quantum Compression</p>
            </div>
          </div>
        </GlassCard>

        {/* Team */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 px-2">Development Teams</h3>
          <GlassCard variant="dark" blur="sm" className="divide-y divide-gray-100">
            {team.map((item, index) => (
              <div key={index} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{item.role}</p>
                  <p className="text-sm text-gray-400">{item.members}</p>
                </div>
              </div>
            ))}
          </GlassCard>
        </div>

        {/* Social Links */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 px-2">Connect With Us</h3>
          <div className="grid grid-cols-2 gap-3">
            {socials.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <GlassCard variant="dark" blur="sm" className="p-4 text-center hover:scale-105 transition-transform">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white">
                    {social.icon}
                  </div>
                  <p className="text-sm font-medium text-white">{social.name}</p>
                </GlassCard>
              </a>
            ))}
          </div>
        </div>

        {/* Roadmap */}
        <GlassCard variant="gradient" blur="lg" className="p-5">
          <h3 className="text-white font-bold text-lg mb-4">2026 Roadmap</h3>
          <div className="space-y-3">
            {[
              { quarter: 'Q1', item: 'Mainnet Launch & Maya Wallet v1.0' },
              { quarter: 'Q2', item: 'Cross-chain bridges (ETH, DOT)' },
              { quarter: 'Q3', item: 'Mobile apps (iOS, Android)' },
              { quarter: 'Q4', item: 'Enterprise partnerships & integrations' }
            ].map((milestone, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-700/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {milestone.quarter}
                </div>
                <p className="text-white/90 text-sm">{milestone.item}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Footer */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-sm text-gray-400">Made with ❤️ in Belize</p>
          <p className="text-xs text-gray-400">© 2026 BelizeChain. All rights reserved.</p>
          <p className="text-xs text-gray-400">Powered by Substrate • Polkadot SDK stable2512</p>
        </div>
      </div>
    </div>
  );
}
