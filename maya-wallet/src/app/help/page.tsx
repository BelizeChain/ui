'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Question,
  MagnifyingGlass,
  Book,
  VideoCamera,
  ChatCircleDots,
  Envelope,
  CaretRight,
  Lightbulb
} from 'phosphor-react';

export default function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      title: 'Getting Started',
      icon: <Lightbulb size={20} weight="fill" />,
      color: 'from-amber-500 to-orange-400',
      articles: [
        'How to create your first wallet',
        'Understanding DALLA and bBZD',
        'Securing your account with 2FA',
        'Making your first transaction'
      ]
    },
    {
      title: 'BelizeChain Features',
      icon: <Book size={20} weight="fill" />,
      color: 'from-blue-500 to-cyan-400',
      articles: [
        'Using the Pakit Storage system',
        'How Nawal AI federated learning works',
        'Kinich Quantum computing guide',
        'BNS domain registration'
      ]
    },
    {
      title: 'Transactions & Payments',
      icon: <ChatCircleDots size={20} weight="fill" />,
      color: 'from-emerald-500 to-teal-400',
      articles: [
        'Sending and receiving payments',
        'Understanding transaction fees',
        'Tourism cashback rewards program',
        'Multi-signature treasury operations'
      ]
    },
    {
      title: 'Staking & Governance',
      icon: <VideoCamera size={20} weight="fill" />,
      color: 'from-purple-500 to-pink-400',
      articles: [
        'How to stake DALLA tokens',
        'Proof of Useful Work explained',
        'Participating in governance',
        'Creating and voting on proposals'
      ]
    }
  ];

  const quickLinks = [
    { title: 'Contact Support', icon: <Envelope size={20} weight="fill" />, href: 'mailto:support@belizechain.bz' },
    { title: 'Video Tutorials', icon: <VideoCamera size={20} weight="fill" />, href: '/tutorials' },
    { title: 'Community Forum', icon: <ChatCircleDots size={20} weight="fill" />, href: 'https://forum.belizechain.bz' },
    { title: 'Developer Docs', icon: <Book size={20} weight="fill" />, href: 'https://docs.belizechain.bz' }
  ];

  const faqs = [
    {
      question: 'What is the difference between DALLA and bBZD?',
      answer: 'DALLA is the native utility token used for fees, staking, and governance. bBZD is a stablecoin pegged 1:1 to the Belize Dollar for everyday transactions.'
    },
    {
      question: 'How do I earn tourism cashback rewards?',
      answer: 'Spend DALLA at verified tourism merchants and automatically receive 5-8% cashback in DALLA, redeemable for bBZD.'
    },
    {
      question: 'Is my wallet data secure?',
      answer: 'Yes! BelizeChain uses end-to-end encryption, multi-signature protection, and your private keys never leave your device.'
    },
    {
      question: 'How long do transactions take?',
      answer: 'Most transactions are confirmed within 6-12 seconds on the BelizeChain network with very low fees.'
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
              <h1 className="text-xl font-bold text-white">Help Center</h1>
              <p className="text-xs text-gray-400">FAQs & Support</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-400 flex items-center justify-center">
            <Question size={20} className="text-white" weight="fill" />
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" weight="bold" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 backdrop-blur-sm border border-gray-700/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500"
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((link, index) => (
            <GlassCard key={index} variant="dark" blur="sm" className="p-4 text-center hover:scale-105 transition-transform cursor-pointer">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-forest-500 to-emerald-400 flex items-center justify-center text-white">
                {link.icon}
              </div>
              <p className="text-sm font-medium text-white">{link.title}</p>
            </GlassCard>
          ))}
        </div>

        {/* Categories */}
        {categories.map((category, catIndex) => (
          <div key={catIndex}>
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-white`}>
                {category.icon}
              </div>
              <h2 className="text-sm font-semibold text-gray-300">{category.title}</h2>
            </div>
            <GlassCard variant="dark" blur="sm" className="divide-y divide-gray-100">
              {category.articles.map((article, artIndex) => (
                <button
                  key={artIndex}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors text-left"
                >
                  <span className="text-white font-medium">{article}</span>
                  <CaretRight size={18} className="text-gray-400" weight="bold" />
                </button>
              ))}
            </GlassCard>
          </div>
        ))}

        {/* FAQs */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3 px-2">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                <h3 className="font-bold text-white mb-2">{faq.question}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <GlassCard variant="gradient" blur="lg" className="p-6 text-center">
          <h3 className="text-white font-bold text-lg mb-2">Still need help?</h3>
          <p className="text-white/80 text-sm mb-4">Our support team is here to assist you</p>
          <button className="px-6 py-3 bg-gray-200 hover:bg-gray-800 text-forest-700 font-bold rounded-xl transition-all">
            Contact Support
          </button>
        </GlassCard>
      </div>
    </div>
  );
}
