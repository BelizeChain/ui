'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

type RecoveryContact = {
  id: string;
  name: string;
  address: string;
  status: 'verified' | 'pending';
  addedDate: string;
};

type MultiSigAccount = {
  id: string;
  name: string;
  threshold: string;
  signers: number;
  balance: string;
  status: 'active' | 'paused';
};

type SecurityEvent = {
  id: string;
  event: string;
  location: string;
  timestamp: string;
  status: 'ok' | 'warning';
};

const SECURITY_CONTACTS_KEY = 'maya-security-recovery-contacts';
const SECURITY_MULTISIG_KEY = 'maya-security-multisig-accounts';
const SECURITY_EVENTS_KEY = 'maya-security-events';

function createEvent(event: string, status: 'ok' | 'warning' = 'ok'): SecurityEvent {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    event,
    location: 'Maya Wallet',
    timestamp: new Date().toLocaleString(),
    status,
  };
}

function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function SecurityPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'recovery' | 'multisig' | 'audit'>('recovery');
  const [recoveryContacts, setRecoveryContacts] = useState<RecoveryContact[]>([]);
  const [multiSigAccounts, setMultiSigAccounts] = useState<MultiSigAccount[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [contactName, setContactName] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [multisigName, setMultisigName] = useState('');
  const [multisigThreshold, setMultisigThreshold] = useState('2/3');
  const [multisigSigners, setMultisigSigners] = useState('3');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedContacts = localStorage.getItem(SECURITY_CONTACTS_KEY);
      const storedMultisig = localStorage.getItem(SECURITY_MULTISIG_KEY);
      const storedEvents = localStorage.getItem(SECURITY_EVENTS_KEY);

      if (storedContacts) {
        setRecoveryContacts(JSON.parse(storedContacts) as RecoveryContact[]);
      }

      if (storedMultisig) {
        setMultiSigAccounts(JSON.parse(storedMultisig) as MultiSigAccount[]);
      }

      if (storedEvents) {
        setSecurityEvents(JSON.parse(storedEvents) as SecurityEvent[]);
      } else {
        setSecurityEvents([createEvent('Security Center opened')]);
      }
    } catch {
      setSecurityEvents([createEvent('Security Center initialized with defaults', 'warning')]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SECURITY_CONTACTS_KEY, JSON.stringify(recoveryContacts));
  }, [recoveryContacts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SECURITY_MULTISIG_KEY, JSON.stringify(multiSigAccounts));
  }, [multiSigAccounts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SECURITY_EVENTS_KEY, JSON.stringify(securityEvents));
  }, [securityEvents]);

  const securityStatus = useMemo(() => {
    if (recoveryContacts.length > 0 && multiSigAccounts.length > 0) {
      return { label: 'Hardened', color: 'text-emerald-400', dot: 'bg-emerald-500' };
    }
    if (recoveryContacts.length > 0 || multiSigAccounts.length > 0) {
      return { label: 'Partially Protected', color: 'text-amber-400', dot: 'bg-amber-500' };
    }
    return { label: 'Basic Protection', color: 'text-blue-400', dot: 'bg-blue-500' };
  }, [multiSigAccounts.length, recoveryContacts.length]);

  const appendEvent = (event: string, status: 'ok' | 'warning' = 'ok') => {
    setSecurityEvents((prev) => [createEvent(event, status), ...prev].slice(0, 100));
  };

  const addRecoveryContact = () => {
    const name = contactName.trim();
    const address = contactAddress.trim();

    if (!name || !address) {
      appendEvent('Recovery contact validation failed', 'warning');
      return;
    }

    const newContact: RecoveryContact = {
      id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      address,
      status: 'pending',
      addedDate: new Date().toLocaleDateString(),
    };

    setRecoveryContacts((prev) => [newContact, ...prev]);
    setContactName('');
    setContactAddress('');
    appendEvent(`Recovery contact added: ${name}`);
  };

  const addMultisigAccount = () => {
    const name = multisigName.trim();
    const threshold = multisigThreshold.trim();
    const signers = Number(multisigSigners);

    if (!name || !threshold || Number.isNaN(signers) || signers < 2) {
      appendEvent('Multi-sig configuration validation failed', 'warning');
      return;
    }

    const newAccount: MultiSigAccount = {
      id: `multisig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      threshold,
      signers,
      balance: '0 DALLA',
      status: 'active',
    };

    setMultiSigAccounts((prev) => [newAccount, ...prev]);
    setMultisigName('');
    setMultisigThreshold('2/3');
    setMultisigSigners('3');
    appendEvent(`Multi-sig account created: ${name}`);
  };

  const toggleMultisigStatus = (accountId: string) => {
    setMultiSigAccounts((prev) =>
      prev.map((account) => {
        if (account.id !== accountId) return account;
        const nextStatus = account.status === 'active' ? 'paused' : 'active';
        appendEvent(`Multi-sig account ${account.name} set to ${nextStatus}`);
        return { ...account, status: nextStatus };
      })
    );
  };

  const exportPdfLikeReport = () => {
    if (securityEvents.length === 0) return;

    const content = [
      'Maya Wallet Security Report',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      ...securityEvents.map((event) => `${event.timestamp} | ${event.status.toUpperCase()} | ${event.event} | ${event.location}`),
    ].join('\n');

    downloadTextFile('maya-security-report.txt', content, 'text/plain;charset=utf-8');
    appendEvent('Security report exported');
  };

  const exportCsv = () => {
    if (securityEvents.length === 0) return;

    const header = 'timestamp,status,event,location';
    const rows = securityEvents.map((event) =>
      [event.timestamp, event.status, event.event, event.location]
        .map((value) => `"${value.replace(/"/g, '""')}"`)
        .join(',')
    );

    downloadTextFile('maya-security-events.csv', [header, ...rows].join('\n'), 'text/csv;charset=utf-8');
    appendEvent('Security events exported to CSV');
  };

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
              <p className={`text-2xl font-bold ${securityStatus.color}`}>{securityStatus.label}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 ${securityStatus.dot} rounded-full animate-pulse`} />
              <span className="text-sm text-gray-400">Contacts: {recoveryContacts.length} • Multi-sig: {multiSigAccounts.length}</span>
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
              <button
                title="Your seed phrase lives in your wallet extension and cannot be displayed here"
                className="flex items-center justify-center space-x-2 p-4 bg-gray-800/50 border border-gray-700/30 text-gray-400 rounded-xl shadow-sm"
              >
                <Key size={20} weight="fill" />
                <span className="font-semibold">View in Wallet</span>
              </button>
              <button
                onClick={addRecoveryContact}
                className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-red-500 to-rose-400 border border-red-500/30 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <Users size={20} weight="fill" className="text-white" />
                <span className="font-semibold text-white">Add Contact</span>
              </button>
            </div>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-3">New Recovery Contact</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Contact name"
                  className="w-full bg-gray-800/60 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 placeholder-gray-500"
                />
                <input
                  type="text"
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                  placeholder="Wallet address"
                  className="w-full bg-gray-800/60 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 placeholder-gray-500"
                />
              </div>
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-4">Recovery Contacts</h3>
              {recoveryContacts.length === 0 ? (
                <div className="py-8 text-center">
                  <Users size={40} className="mx-auto mb-3 text-gray-500" weight="thin" />
                  <p className="text-sm text-gray-400">No recovery contacts added yet.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Add at least 3 trusted contacts for stronger recovery options.
                  </p>
                </div>
              ) : (
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
              )}
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-3">Social Recovery Settings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-800/50 border border-gray-700/30 rounded-lg">
                  <span className="text-gray-400">Recovery quorum</span>
                  <span className="font-semibold text-white">{Math.min(2, Math.max(1, recoveryContacts.length))}/{Math.max(3, recoveryContacts.length)}</span>
                </div>
              </div>
            </GlassCard>
          </>
        )}

        {activeTab === 'multisig' && (
          <>
            <button
              onClick={addMultisigAccount}
              className="w-full flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-red-500 to-rose-400 text-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <Users size={20} weight="fill" />
              <span className="font-semibold">Create Multi-sig Account</span>
            </button>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-3">New Multi-sig Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={multisigName}
                  onChange={(e) => setMultisigName(e.target.value)}
                  placeholder="Treasury Vault"
                  className="bg-gray-800/60 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 placeholder-gray-500"
                />
                <input
                  type="text"
                  value={multisigThreshold}
                  onChange={(e) => setMultisigThreshold(e.target.value)}
                  placeholder="2/3"
                  className="bg-gray-800/60 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 placeholder-gray-500"
                />
                <input
                  type="number"
                  min={2}
                  value={multisigSigners}
                  onChange={(e) => setMultisigSigners(e.target.value)}
                  placeholder="3"
                  className="bg-gray-800/60 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 placeholder-gray-500"
                />
              </div>
            </GlassCard>

            {multiSigAccounts.length === 0 ? (
              <GlassCard variant="dark" blur="sm" className="p-4">
                <div className="py-8 text-center">
                  <Users size={40} className="mx-auto mb-3 text-gray-500" weight="thin" />
                  <p className="text-sm text-gray-400">No multi-sig accounts configured.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Create a shared account to require multiple signers for approvals.
                  </p>
                </div>
              </GlassCard>
            ) : (
              multiSigAccounts.map((account, index) => (
              <GlassCard key={index} variant="dark" blur="sm" className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white mb-1">{account.name}</h3>
                    <p className="text-xs text-gray-400">Threshold: {account.threshold}</p>
                  </div>
                  <span className={`px-2 py-0.5 ${account.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'} text-xs rounded-full font-semibold`}>
                    {account.status === 'active' ? 'Active' : 'Paused'}
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

                <button
                  onClick={() => toggleMultisigStatus(account.id)}
                  className="w-full p-2 bg-gray-700 text-white rounded-lg font-semibold text-sm hover:bg-gray-600 transition-colors"
                >
                  {account.status === 'active' ? 'Pause account' : 'Resume account'}
                </button>
              </GlassCard>
              ))
            )}

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
              {securityEvents.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText size={40} className="mx-auto mb-3 text-gray-500" weight="thin" />
                  <p className="text-sm text-gray-400">No security events recorded yet.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Events appear when you configure recovery and multi-sig features.
                  </p>
                </div>
              ) : (
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
              )}
            </GlassCard>

            <GlassCard variant="dark" blur="sm" className="p-4">
              <h3 className="font-bold text-white mb-3">Export Options</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={securityEvents.length === 0}
                  onClick={exportPdfLikeReport}
                  className="flex items-center justify-center space-x-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
                >
                  <FileText size={16} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-300">TXT Report</span>
                </button>
                <button
                  disabled={securityEvents.length === 0}
                  onClick={exportCsv}
                  className="flex items-center justify-center space-x-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
                >
                  <FileText size={16} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-300">CSV Export</span>
                </button>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}
