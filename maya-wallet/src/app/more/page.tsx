'use client';

import React from 'react';
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
  ChartLineUp,
  Coins,
  TrendUp,
  Buildings,
  QrCode,
  Broadcast,
  GraduationCap,
  Calculator,
  ArrowsClockwise,
  Wallet,
  Scales,
  Megaphone,
  ShieldWarning,
  Users,
  ShieldCheck,
} from 'phosphor-react';

export default function MorePage() {
  const menuSections = [
    {
      title: 'DeFi & Asset Management',
      description: 'Trading floor, lending, vaults & tokenized real estate',
      items: [
        {
          icon: <ChartLineUp size={20} weight="fill" />,
          label: 'BelizeX DEX Pro',
          description: 'Order Book V1 & AMM swaps',
          href: '/trade',
          color: 'from-cyan-500 to-blue-600',
          badge: 'Mainnet V1',
        },
        {
          icon: <Coins size={20} weight="fill" />,
          label: 'Collateral Lending',
          description: '50-80% LTV micro-loans',
          href: '/lending',
          color: 'from-emerald-500 to-teal-600',
          badge: 'Health Factor',
        },
        {
          icon: <TrendUp size={20} weight="fill" />,
          label: 'Yield Aggregator',
          description: 'Multi-strategy auto-compounder',
          href: '/yield',
          color: 'from-purple-500 to-indigo-600',
          badge: '18.4% APY',
        },
        {
          icon: <Buildings size={20} weight="fill" />,
          label: 'Tokenized RWA Studio',
          description: 'LandLedger deeds & green bonds',
          href: '/rwa',
          color: 'from-amber-500 to-orange-600',
          badge: 'FSC Compliant',
        },
        {
          icon: <Coins size={20} weight="fill" />,
          label: 'Staking & Consensus Hub',
          description: 'Live 4-node Substrate validators & PoUW claims',
          href: '/staking',
          color: 'from-teal-500 to-emerald-600',
          badge: '15.5% APR',
        },
        {
          icon: <LockKey size={20} weight="fill" />,
          label: 'Institutional Custody',
          description: 'M-of-N multi-sig vaults (48h delay)',
          href: '/custody',
          color: 'from-red-500 to-pink-600',
          badge: 'Enterprise',
        },
      ],
    },
    {
      title: 'BelizeChain Core Platforms',
      description: 'National sovereign infrastructure services',
      items: [
        {
          icon: <IdentificationCard size={20} weight="fill" />,
          label: 'BelizeID',
          description: 'Digital identity & KYC credentials',
          href: '/belizeid',
          color: 'from-blue-500 to-cyan-600',
          badge: 'L2 Verified',
        },
        {
          icon: <Database size={20} weight="fill" />,
          label: 'Pakit Storage',
          description: 'Quantum compression & IPFS',
          href: '/pakit',
          color: 'from-cyan-500 to-blue-600',
          badge: 'Hot/Cold',
        },
        {
          icon: <Atom size={20} weight="fill" />,
          label: 'Kinich Quantum Hub',
          description: '10x compression & Xanadu photonic',
          href: '/kinich',
          color: 'from-purple-500 to-pink-600',
          badge: 'Photonic GKP',
        },
        {
          icon: <Brain size={20} weight="fill" />,
          label: 'Nawal AI',
          description: 'Federated learning & rewards',
          href: '/nawal',
          color: 'from-indigo-500 to-purple-600',
          badge: 'PoUW',
        },
        {
          icon: <FileCode size={20} weight="fill" />,
          label: 'The Gem',
          description: 'Smart contracts marketplace',
          href: '/gem',
          color: 'from-pink-500 to-red-600',
          badge: 'ink! v5',
        },
        {
          icon: <House size={20} weight="fill" />,
          label: 'LandLedger',
          description: 'Cadastral property titles',
          href: '/landledger',
          color: 'from-orange-500 to-red-600',
          badge: 'GIS Sealed',
        },
        {
          icon: <GlobeHemisphereWest size={20} weight="fill" />,
          label: 'BNS Domains',
          description: '.bz, .caye sovereign domains',
          href: '/bns',
          color: 'from-blue-500 to-indigo-600',
          badge: 'IPFS Ready',
        },
      ],
    },
    {
      title: 'Ethical Safeguards & Civic Governance',
      description: 'Restorative justice, democracy, whistleblower protection & community safety',
      items: [
        {
          icon: <Scales size={20} weight="fill" />,
          label: 'Justice Court',
          description: 'Restorative dispute resolution & cooling-off',
          href: '/justice',
          color: 'from-amber-500 to-orange-600',
          badge: 'Pallet 35',
        },
        {
          icon: <Megaphone size={20} weight="fill" />,
          label: 'Whistleblower Shield',
          description: 'Zero-knowledge anonymous disclosures & bounties',
          href: '/whistleblower',
          color: 'from-cyan-500 to-blue-600',
          badge: 'Pallet 36',
        },
        {
          icon: <ShieldWarning size={20} weight="fill" />,
          label: 'Community Content Safety',
          description: 'Decentralized flags & Nawal AI risk telemetry',
          href: '/moderation',
          color: 'from-rose-500 to-purple-600',
          badge: 'Pallet 37',
        },
        {
          icon: <Users size={20} weight="fill" />,
          label: 'Sovereign Governance',
          description: 'Democracy referenda, council motions & voting',
          href: '/governance',
          color: 'from-purple-500 to-indigo-600',
          badge: 'Democracy',
        },
        {
          icon: <Coins size={20} weight="fill" />,
          label: 'National Treasury',
          description: 'M-of-N multi-sig disbursements & civic grants',
          href: '/treasury',
          color: 'from-emerald-500 to-teal-600',
          badge: 'Multi-Sig',
        },
        {
          icon: <ShieldCheck size={20} weight="fill" />,
          label: 'Central Bank Compliance',
          description: 'Statutory Proof-of-Reserve (100.2%) & FIU limits',
          href: '/compliance',
          color: 'from-blue-500 to-cyan-600',
          badge: '100.2% Reserve',
        },
      ],
    },
    {
      title: 'Citizen Utilities & Education',
      description: 'Budgeting, off-grid mesh, and academy',
      items: [
        {
          icon: <GraduationCap size={20} weight="fill" />,
          label: 'Maya Academy',
          description: 'Learn-to-Earn Web3 curriculum',
          href: '/community/education',
          color: 'from-purple-500 to-indigo-600',
          badge: 'Grants',
        },
        {
          icon: <Broadcast size={20} weight="fill" />,
          label: 'LoRa 915MHz Mesh',
          description: 'Off-grid Meshtastic payments',
          href: '/mesh',
          color: 'from-emerald-500 to-teal-600',
          badge: 'NEMO Alert',
        },
        {
          icon: <QrCode size={20} weight="fill" />,
          label: 'Offline Signing Studio',
          description: 'Air-gapped QR & LoRa frames',
          href: '/offline',
          color: 'from-cyan-500 to-blue-600',
          badge: 'Air-Gap',
        },
        {
          icon: <Wallet size={20} weight="fill" />,
          label: 'Citizen Budget Envelopes',
          description: 'bBZD spending allocation',
          href: '/wallet/budget',
          color: 'from-emerald-500 to-cyan-600',
        },
        {
          icon: <ArrowsClockwise size={20} weight="fill" />,
          label: 'Utility Auto-Pay',
          description: 'BEL, BWS & DigiNet subscriptions',
          href: '/wallet/recurring',
          color: 'from-amber-500 to-orange-600',
        },
        {
          icon: <Calculator size={20} weight="fill" />,
          label: 'Tax & FX Calculators',
          description: 'SSB 9% & staking compounding',
          href: '/wallet/calculator',
          color: 'from-blue-500 to-purple-600',
        },
      ],
    },
    {
      title: 'Developer & Bridges',
      description: 'SDKs, live faucet and cross-chain relayers',
      items: [
        {
          icon: <Code size={20} weight="fill" />,
          label: 'Developer Hub & Faucet',
          description: '1,000 DALLA faucet & multi-lang SDKs',
          href: '/developer',
          color: 'from-cyan-500 to-blue-600',
          badge: 'Live Faucet',
        },
        {
          icon: <GitBranch size={20} weight="fill" />,
          label: 'Snowbridge Hub',
          description: 'Ethereum & Polkadot XCM v3',
          href: '/bridge',
          color: 'from-purple-500 to-indigo-600',
          badge: '5-of-7 Relayers',
        },
        {
          icon: <Briefcase size={20} weight="fill" />,
          label: 'Ministry Payroll',
          description: 'Statutory batch disbursements',
          href: '/payroll',
          color: 'from-emerald-500 to-teal-600',
        },
        {
          icon: <Shield size={20} weight="fill" />,
          label: 'Security & Recovery',
          description: 'Biometrics & hardware signers',
          href: '/security',
          color: 'from-red-500 to-pink-600',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-28">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 z-10">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">Ecosystem Explorer</h1>
            <p className="text-xs text-slate-400">All Sovereign BelizeChain Apps, Services & Financial Protocols</p>
          </div>
          <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-xs font-bold">
            30 Live Modules
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-3">
            <div>
              <h2 className="text-base font-bold text-white">{section.title}</h2>
              <p className="text-xs text-slate-400">{section.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.items.map((item, iIdx) => (
                <Link key={iIdx} href={item.href}>
                  <div className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all flex items-center justify-between group shadow-md hover:shadow-cyan-500/5">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md`}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {item.label}
                          </h3>
                          {item.badge && (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-semibold rounded-md border border-slate-700">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{item.description}</p>
                      </div>
                    </div>
                    <CaretRight
                      size={18}
                      className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
