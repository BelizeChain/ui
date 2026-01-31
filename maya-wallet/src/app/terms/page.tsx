'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  Lock,
  Eye,
  Cookie,
  File,
  CaretRight
} from 'phosphor-react';

export default function TermsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const documents = [
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: <FileText size={20} weight="fill" />,
      color: 'from-blue-500 to-cyan-400',
      lastUpdated: 'January 1, 2026',
      sections: [
        'Acceptance of Terms',
        'User Responsibilities',
        'Account Security',
        'Prohibited Activities',
        'Liability Limitations',
        'Dispute Resolution'
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: <Lock size={20} weight="fill" />,
      color: 'from-purple-500 to-pink-400',
      lastUpdated: 'January 1, 2026',
      sections: [
        'Information We Collect',
        'How We Use Your Data',
        'Data Sharing & Disclosure',
        'Your Privacy Rights',
        'Data Security Measures',
        'International Transfers'
      ]
    },
    {
      id: 'cookies',
      title: 'Cookie Policy',
      icon: <Cookie size={20} weight="fill" />,
      color: 'from-amber-500 to-orange-400',
      lastUpdated: 'January 1, 2026',
      sections: [
        'What Are Cookies',
        'Types of Cookies We Use',
        'Managing Cookie Preferences',
        'Third-Party Cookies'
      ]
    },
    {
      id: 'compliance',
      title: 'Regulatory Compliance',
      icon: <ShieldCheck size={20} weight="fill" />,
      color: 'from-emerald-500 to-teal-400',
      lastUpdated: 'January 1, 2026',
      sections: [
        'KYC/AML Requirements',
        'Financial Services Commission Oversight',
        'Data Sovereignty Compliance',
        'Cross-Border Transaction Rules'
      ]
    },
    {
      id: 'smart-contracts',
      title: 'Smart Contract Terms',
      icon: <File size={20} weight="fill" />,
      color: 'from-red-500 to-pink-400',
      lastUpdated: 'January 1, 2026',
      sections: [
        'Contract Execution Rules',
        'Gas Fees & Transaction Costs',
        'Immutability Acknowledgment',
        'Dispute Mechanisms'
      ]
    }
  ];

  const highlights = [
    {
      icon: <ShieldCheck size={20} weight="fill" />,
      title: 'Your Data is Protected',
      description: 'End-to-end encryption with zero-knowledge architecture'
    },
    {
      icon: <Eye size={20} weight="fill" />,
      title: 'Transparent Operations',
      description: 'All blockchain activities are publicly auditable'
    },
    {
      icon: <Lock size={20} weight="fill" />,
      title: 'Self-Custody',
      description: 'You own your private keys - we never have access'
    }
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
              <h1 className="text-xl font-bold text-white">Terms & Policies</h1>
              <p className="text-xs text-gray-400">Legal & Compliance</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-500 to-gray-400 flex items-center justify-center">
            <FileText size={20} className="text-white" weight="fill" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Key Highlights */}
        <GlassCard variant="gradient" blur="lg" className="p-5">
          <h2 className="text-white font-bold text-lg mb-4">Our Commitments</h2>
          <div className="space-y-3">
            {highlights.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-700/20 flex items-center justify-center text-white flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{item.title}</h3>
                  <p className="text-white/80 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Legal Documents */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 px-2">Legal Documents</h2>
          <div className="space-y-3">
            {documents.map((doc) => (
              <GlassCard key={doc.id} variant="dark" blur="sm">
                <button
                  onClick={() => setActiveSection(activeSection === doc.id ? null : doc.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${doc.color} flex items-center justify-center text-white`}>
                      {doc.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-white">{doc.title}</h3>
                      <p className="text-xs text-gray-400">Updated {doc.lastUpdated}</p>
                    </div>
                  </div>
                  <CaretRight
                    size={20}
                    className={`text-gray-400 transition-transform ${activeSection === doc.id ? 'rotate-90' : ''}`}
                    weight="bold"
                  />
                </button>
                
                {activeSection === doc.id && (
                  <div className="px-4 pb-4 pt-2 space-y-2 border-t border-gray-700">
                    {doc.sections.map((section, index) => (
                      <button
                        key={index}
                        className="w-full text-left py-2 px-3 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <p className="text-sm text-gray-300">{index + 1}. {section}</p>
                      </button>
                    ))}
                    <button className="w-full mt-3 py-2 bg-forest-500 hover:bg-forest-400 text-white font-semibold rounded-lg transition-colors">
                      Read Full Document
                    </button>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Compliance Statement */}
        <GlassCard variant="dark" blur="sm" className="p-5">
          <h3 className="font-bold text-white mb-3">Regulatory Compliance</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>
              BelizeChain is compliant with the <strong>Financial Services Commission (FSC)</strong> of Belize and adheres to all local and international regulations.
            </p>
            <p>
              We follow strict <strong>KYC/AML</strong> procedures to ensure the security and legitimacy of all transactions on our platform.
            </p>
            <p>
              All user data is stored within Belize in accordance with <strong>data sovereignty requirements</strong>.
            </p>
          </div>
        </GlassCard>

        {/* Contact Legal */}
        <GlassCard variant="dark" blur="sm" className="p-5 border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <FileText size={24} className="text-blue-500 flex-shrink-0" weight="fill" />
            <div>
              <h3 className="font-bold text-white mb-1">Legal Questions?</h3>
              <p className="text-sm text-gray-300 mb-3">
                For legal inquiries or compliance questions, contact our legal team.
              </p>
              <a href="mailto:legal@belizechain.bz" className="text-blue-400 font-semibold text-sm hover:underline">
                legal@belizechain.bz
              </a>
            </div>
          </div>
        </GlassCard>

        {/* Last Updated */}
        <div className="text-center text-xs text-gray-400">
          <p>These terms were last updated on January 1, 2026</p>
          <p className="mt-1">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
