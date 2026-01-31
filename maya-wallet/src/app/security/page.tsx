'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import {
  LockKey,
  Users,
  ShieldCheck,
  Warning,
  Key,
  Clock,
  CheckCircle,
  FileText,
  ArrowLeft
} from 'phosphor-react';

export default function SecurityPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'recovery' | 'multisig' | 'audit'>('recovery');

  const recoveryContacts = [
    { name: 'Maria Garcia', address: '5FHneW46...8s9K3a', status: 'verified', addedDate: '2025-12-15' },
    { name: 'Carlos Martinez', address: '5DTestUP...mP8B4r', status: 'verified', addedDate: '2025-11-20' },
    { name: 'Ana Rodriguez', address: '5GNJqTPy...s9w3Hk', status: 'pending', addedDate: '2026-01-10' }
  ];

  const multiSigAccounts = [
    { name: 'Business Account', threshold: '2 of 3', signers: 3, balance: '45,200 DALLA', status: 'active' },
    { name: 'Treasury Account', threshold: '4 of 7', signers: 7, balance: '125,000 DALLA', status: 'active' }
  ];

  const securityEvents = [
    { event: 'Successful Login', location: 'Belize City, BZ', timestamp: '2026-01-15 14:32', status: 'normal' },
    { event: 'Failed Login Attempt', location: 'Unknown Location', timestamp: '2026-01-14 03:15', status: 'warning' },
    { event: 'Password Changed', location: 'Belmopan, BZ', timestamp: '2026-01-10 09:18', status: 'normal' },
    { event: 'New Device Added', location: 'San Pedro, BZ', timestamp: '2026-01-05 16:45', status: 'normal' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Security Center</h1>
              <p className="text-xs text-gray-400">Account Protection & Recovery</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={32} className="text-red-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Security Status</p>
              <p className="text-2xl font-bold text-emerald-400">Protected</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500/100 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">All systems secure</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="dark-medium" blur="lg" className="p-1">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('recovery')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'recovery'
                  ? 'bg-gradient-to-r from-red-500 to-rose-400 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-700/30'
              }`}
            >
              Recovery
            </button>
            <button
              onClick={() => setActiveTab('multisig')}
              className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'multisig'
                  ? 'bg-gradient-to-r from-red-500 to-rose-400 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-700/30'
              }`}
            >
              Multi-sig
            </button>
            <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'audit'
                ? 'bg-gradient-to-r from-red-500 to-rose-400 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            Audit Log
          </button>
          </div>
        </GlassCard>
      </div>

      <div className="px-4 space-y-4">
        {activeTab === 'recovery' && (
          <>
            <GlassCard variant="dark" blur="sm" className="p-4 bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start space-x-3">
                <Warning size={24} className="text-yellow-400 mt-0.5" weight="fill" />
                <div>
                  <h3 className="font-bold text-white mb-1">Backup Your Seed Phrase</h3>
                  <p className="text-sm text-gray-400">
                    Your 12-word seed phrase is the only way to recover your account if you lose access.
                    Store it securely offline and never share it with anyone.
                  </p>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-red-400 to-rose-400 text-white rounded-xl shadow-lg">
                <Key size={20} weight="fill" />
                <span className="font-semibold">View Seed</span>
              </button>
              <button className="flex items-center justify-center space-x-2 p-4 bg-gray-800/50 border border-gray-700/30 rounded-xl shadow-sm">
                <Users size={20} weight="fill" className="text-white" />
                <span className="font-semibold text-white">Add Contact</span>
              </button>
            </div>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Recovery Contacts ({recoveryContacts.length}/5)</h3>
              <div className="space-y-3">
                {recoveryContacts.map((contact, index) => (
                  <div key={index} className="p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{contact.name}</h4>
                      <span className={`px-2 py-0.5 ${contact.status === 'verified' ? 'bg-emerald-500/100/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'} text-xs rounded-full font-semibold`}>
                        {contact.status === 'verified' ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-gray-400 mb-1">{contact.address}</p>
                    <p className="text-xs text-gray-400">Added: {contact.addedDate}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-3">Social Recovery Settings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                  <span className="text-gray-400">Recovery Threshold</span>
                  <span className="font-semibold text-white">2 of 3 contacts</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                  <span className="text-gray-400">Cooldown Period</span>
                  <span className="font-semibold text-white">48 hours</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                  <span className="text-gray-400">Last Recovery Attempt</span>
                  <span className="font-semibold text-white">Never</span>
                </div>
              </div>
            </GlassCard>
          </>
        )}

        {activeTab === 'multisig' && (
          <>
            <button className="w-full flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-red-400 to-rose-400 text-white rounded-xl shadow-lg">
              <Users size={20} weight="fill" />
              <span className="font-semibold">Create Multi-sig Account</span>
            </button>

            {multiSigAccounts.map((account, index) => (
              <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white mb-1">{account.name}</h3>
                    <p className="text-xs text-gray-400">Threshold: {account.threshold}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/100/20 text-emerald-400 text-xs rounded-full font-semibold">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Total Signers</p>
                    <p className="text-lg font-bold text-white">{account.signers}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Balance</p>
                    <p className="text-lg font-bold text-emerald-400">{account.balance}</p>
                  </div>
                </div>

                <button className="w-full p-2 bg-gray-200 text-white rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors">
                  Manage Signers →
                </button>
              </GlassCard>
            ))}

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-3">Multi-sig Features</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-2 bg-emerald-500/10 rounded-lg">
                  <CheckCircle size={20} className="text-emerald-400" weight="fill" />
                  <span className="text-sm text-white">Threshold signature validation</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-emerald-500/10 rounded-lg">
                  <CheckCircle size={20} className="text-emerald-400" weight="fill" />
                  <span className="text-sm text-white">Emergency pause mechanism</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-emerald-500/10 rounded-lg">
                  <CheckCircle size={20} className="text-emerald-400" weight="fill" />
                  <span className="text-sm text-white">Signer rotation without downtime</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-emerald-500/10 rounded-lg">
                  <CheckCircle size={20} className="text-emerald-400" weight="fill" />
                  <span className="text-sm text-white">Transaction batching support</span>
                </div>
              </div>
            </GlassCard>
          </>
        )}

        {activeTab === 'audit' && (
          <>
            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Security Events</h3>
              <div className="space-y-3">
                {securityEvents.map((event, index) => (
                  <div key={index} className={`p-3 rounded-lg ${event.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-200'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {event.status === 'warning' ? (
                          <Warning size={20} className="text-yellow-400" weight="fill" />
                        ) : (
                          <CheckCircle size={20} className="text-emerald-400" weight="fill" />
                        )}
                        <h4 className="font-semibold text-white">{event.event}</h4>
                      </div>
                    </div>
                    <div className="ml-7 space-y-1">
                      <p className="text-xs text-gray-400">{event.location}</p>
                      <p className="text-xs text-gray-400">{event.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-3">Export Options</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center space-x-2 p-3 bg-gray-200 border border-gray-700 rounded-lg hover:border-gray-300 transition-colors">
                  <FileText size={16} className="text-gray-400" />
                  <span className="text-sm font-semibold text-white">PDF Report</span>
                </button>
                <button className="flex items-center justify-center space-x-2 p-3 bg-gray-200 border border-gray-700 rounded-lg hover:border-gray-300 transition-colors">
                  <FileText size={16} className="text-gray-400" />
                  <span className="text-sm font-semibold text-white">CSV Export</span>
                </button>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}
