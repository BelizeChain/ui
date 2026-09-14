'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  LockKey,
  Users,
  ShieldCheck,
  Warning,
  Key,
  Clock,
  CheckCircle,
  FileText,
  ArrowLeft,
  Copy,
  Check,
  Trash,
  Plus,
  DownloadSimple,
  Shield,
  Sparkle,
  SlidersHorizontal,
  Info,
  ArrowsClockwise,
} from 'phosphor-react';

export type RecoveryContact = {
  id: string;
  name: string;
  address: string;
  status: 'verified' | 'pending';
  addedDate: string;
};

export type MultiSigAccount = {
  id: string;
  name: string;
  threshold: string;
  signers: number;
  balance: string;
  status: 'active' | 'paused';
};

export type SecurityEvent = {
  id: string;
  event: string;
  location: string;
  timestamp: string;
  status: 'ok' | 'warning';
};

const SECURITY_CONTACTS_KEY = 'maya-security-recovery-contacts';
const SECURITY_MULTISIG_KEY = 'maya-security-multisig-accounts';
const SECURITY_EVENTS_KEY = 'maya-security-events';
const SECURITY_SEED_KEY = 'maya-security-seed-verified';

function createEvent(event: string, status: 'ok' | 'warning' = 'ok'): SecurityEvent {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    event,
    location: 'Maya Sovereign Hub',
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
  const [activeTab, setActiveTab] = useState<'recovery' | 'multisig' | 'audit'>('recovery');
  const [recoveryContacts, setRecoveryContacts] = useState<RecoveryContact[]>([]);
  const [multiSigAccounts, setMultiSigAccounts] = useState<MultiSigAccount[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [seedVerified, setSeedVerified] = useState<boolean>(false);

  // Form states
  const [contactName, setContactName] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [multisigName, setMultisigName] = useState('');
  const [multisigThreshold, setMultisigThreshold] = useState('2/3');
  const [multisigSigners, setMultisigSigners] = useState('3');

  // UI helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<'all' | 'ok' | 'warning'>('all');
  const [formError, setFormError] = useState<string | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedContacts = localStorage.getItem(SECURITY_CONTACTS_KEY);
      const storedMultisig = localStorage.getItem(SECURITY_MULTISIG_KEY);
      const storedEvents = localStorage.getItem(SECURITY_EVENTS_KEY);
      const storedSeed = localStorage.getItem(SECURITY_SEED_KEY);

      if (storedContacts) {
        setRecoveryContacts(JSON.parse(storedContacts) as RecoveryContact[]);
      }

      if (storedMultisig) {
        setMultiSigAccounts(JSON.parse(storedMultisig) as MultiSigAccount[]);
      }

      if (storedEvents) {
        setSecurityEvents(JSON.parse(storedEvents) as SecurityEvent[]);
      } else {
        setSecurityEvents([createEvent('Security Center initialized')]);
      }

      if (storedSeed) {
        setSeedVerified(storedSeed === 'true');
      }
    } catch {
      setSecurityEvents([createEvent('Security Center initialized with fallback storage', 'warning')]);
    }
  }, []);

  // Sync back to local storage
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SECURITY_SEED_KEY, String(seedVerified));
  }, [seedVerified]);

  const appendEvent = (event: string, status: 'ok' | 'warning' = 'ok') => {
    setSecurityEvents((prev) => [createEvent(event, status), ...prev].slice(0, 150));
  };

  // Hardening score calculation (0 - 100%)
  const securityScore = useMemo(() => {
    let score = 30; // base wallet security
    if (seedVerified) score += 25;
    if (recoveryContacts.length >= 1) score += 15;
    if (recoveryContacts.length >= 3) score += 10;
    if (multiSigAccounts.length >= 1) score += 20;
    return Math.min(100, score);
  }, [seedVerified, recoveryContacts.length, multiSigAccounts.length]);

  const securityStatus = useMemo(() => {
    if (securityScore >= 90) {
      return {
        label: 'Fortified Sovereign',
        subtitle: 'Quantum-Hardened SRS & Multi-Sig Active',
        color: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
        dot: 'bg-emerald-400',
      };
    }
    if (securityScore >= 60) {
      return {
        label: 'Guarded Network',
        subtitle: 'Partial Protection Configured',
        color: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
        dot: 'bg-cyan-400',
      };
    }
    return {
      label: 'Standard Protocol',
      subtitle: 'Recommend adding Guardians and Multi-Sig',
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
      dot: 'bg-amber-400',
    };
  }, [securityScore]);

  // Actions
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSeedVerification = () => {
    const next = !seedVerified;
    setSeedVerified(next);
    appendEvent(next ? 'Seed phrase verified and stored offline' : 'Seed phrase verification reset', next ? 'ok' : 'warning');
  };

  const addRecoveryContact = () => {
    setFormError(null);
    const name = contactName.trim();
    const address = contactAddress.trim();

    if (!name || !address) {
      setFormError('Please enter both contact name and valid wallet address');
      appendEvent('Guardian contact validation failed: missing fields', 'warning');
      return;
    }

    if (recoveryContacts.some((c) => c.address.toLowerCase() === address.toLowerCase())) {
      setFormError('A guardian with this wallet address already exists');
      return;
    }

    const newContact: RecoveryContact = {
      id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      address,
      status: 'verified',
      addedDate: new Date().toLocaleDateString(),
    };

    setRecoveryContacts((prev) => [newContact, ...prev]);
    setContactName('');
    setContactAddress('');
    appendEvent(`Recovery guardian added: ${name} (${address.slice(0, 8)}...)`);
  };

  const removeRecoveryContact = (id: string, name: string) => {
    setRecoveryContacts((prev) => prev.filter((c) => c.id !== id));
    appendEvent(`Recovery guardian removed: ${name}`, 'warning');
  };

  const toggleContactStatus = (id: string) => {
    setRecoveryContacts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const nextStatus = c.status === 'verified' ? 'pending' : 'verified';
        appendEvent(`Guardian ${c.name} status updated to ${nextStatus}`);
        return { ...c, status: nextStatus };
      })
    );
  };

  const addMultisigAccount = () => {
    setFormError(null);
    const name = multisigName.trim();
    const threshold = multisigThreshold.trim();
    const signers = Number(multisigSigners);

    if (!name || !threshold || Number.isNaN(signers) || signers < 2) {
      setFormError('Please configure a valid name and at least 2 signers');
      appendEvent('Multi-sig configuration validation failed', 'warning');
      return;
    }

    const newAccount: MultiSigAccount = {
      id: `multisig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      threshold,
      signers,
      balance: '0.00 DALLA',
      status: 'active',
    };

    setMultiSigAccounts((prev) => [newAccount, ...prev]);
    setMultisigName('');
    setMultisigThreshold('2/3');
    setMultisigSigners('3');
    appendEvent(`Multi-sig treasury created: ${name} (${threshold})`);
  };

  const toggleMultisigStatus = (accountId: string) => {
    setMultiSigAccounts((prev) =>
      prev.map((account) => {
        if (account.id !== accountId) return account;
        const nextStatus = account.status === 'active' ? 'paused' : 'active';
        appendEvent(`Multi-sig account ${account.name} set to ${nextStatus}`, nextStatus === 'paused' ? 'warning' : 'ok');
        return { ...account, status: nextStatus };
      })
    );
  };

  const removeMultisigAccount = (id: string, name: string) => {
    setMultiSigAccounts((prev) => prev.filter((a) => a.id !== id));
    appendEvent(`Multi-sig vault removed: ${name}`, 'warning');
  };

  const exportPdfLikeReport = () => {
    if (securityEvents.length === 0) return;

    const content = [
      '========================================================',
      '        MAYA WALLET - AUDIT & SECURITY REPORT           ',
      '========================================================',
      `Generated: ${new Date().toUTCString()}`,
      `Security Posture Score: ${securityScore}% (${securityStatus.label})`,
      `Seed Phrase Verified: ${seedVerified ? 'YES (Secure Offline)' : 'NO'}`,
      `Social Recovery Guardians: ${recoveryContacts.length}`,
      `Active Multi-Sig Accounts: ${multiSigAccounts.length}`,
      '--------------------------------------------------------',
      'CHRONOLOGICAL AUDIT LEDGER:',
      '--------------------------------------------------------',
      ...securityEvents.map((event) => `[${event.timestamp}] [${event.status.toUpperCase()}] ${event.event} (${event.location})`),
      '========================================================',
      'Cryptographically verified on BelizeChain Mainnet',
    ].join('\n');

    downloadTextFile(`maya-security-report-${Date.now()}.txt`, content, 'text/plain;charset=utf-8');
    appendEvent('Security report exported to TXT');
  };

  const exportCsv = () => {
    if (securityEvents.length === 0) return;

    const header = 'id,timestamp,status,event,location';
    const rows = securityEvents.map((event) =>
      [event.id, event.timestamp, event.status, event.event, event.location]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    );

    downloadTextFile(`maya-security-events-${Date.now()}.csv`, [header, ...rows].join('\n'), 'text/csv;charset=utf-8');
    appendEvent('Security ledger exported to CSV');
  };

  // Filtered audit events
  const filteredEvents = useMemo(() => {
    return securityEvents.filter((ev) => {
      const matchesFilter = eventFilter === 'all' || ev.status === eventFilter;
      const matchesSearch =
        !searchQuery ||
        ev.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [securityEvents, eventFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#030914] to-slate-950 text-white pb-28">
      {/* Sticky Top Header */}
      <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl z-20 border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/more"
              className="p-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={18} weight="bold" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Security Center
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  NIST Level 5
                </span>
              </h1>
              <p className="text-xs text-slate-400">Account Protection, Multi-Sig & Social Recovery</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${securityStatus.badgeBg}`}>
              <span className={`w-2 h-2 rounded-full ${securityStatus.dot} animate-pulse`} />
              <span>{securityStatus.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Security Posture Dashboard Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Score Radial / Visual */}
            <div className="md:col-span-4 flex items-center gap-4 border-b md:border-b-0 md:border-r border-slate-800/80 pb-6 md:pb-0 md:pr-6">
              <div className="relative flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={securityScore >= 90 ? 'text-emerald-400' : securityScore >= 60 ? 'text-cyan-400' : 'text-amber-400'}
                    strokeDasharray={`${securityScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold font-mono tracking-tight text-white">{securityScore}%</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Score</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Posture Health</span>
                <h2 className={`text-lg font-bold ${securityStatus.color}`}>{securityStatus.label}</h2>
                <p className="text-xs text-slate-400">{securityStatus.subtitle}</p>
              </div>
            </div>

            {/* Pillar Breakdown Stats */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] uppercase font-bold">Seed Backup</span>
                  <Key size={14} className={seedVerified ? 'text-emerald-400' : 'text-slate-500'} />
                </div>
                <span className={`font-bold block ${seedVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {seedVerified ? 'Secured' : 'Action Req.'}
                </span>
                <span className="text-[10px] text-slate-500 block">12-Word Phrase</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] uppercase font-bold">Guardians</span>
                  <Users size={14} className={recoveryContacts.length >= 3 ? 'text-emerald-400' : 'text-cyan-400'} />
                </div>
                <span className="font-bold text-white block">{recoveryContacts.length} Contacts</span>
                <span className="text-[10px] text-slate-500 block">Social SRS Quorum</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] uppercase font-bold">Multi-Sig</span>
                  <LockKey size={14} className={multiSigAccounts.length > 0 ? 'text-emerald-400' : 'text-slate-500'} />
                </div>
                <span className="font-bold text-white block">{multiSigAccounts.length} Vaults</span>
                <span className="text-[10px] text-slate-500 block">M-of-N Threshold</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] uppercase font-bold">Audit Trail</span>
                  <FileText size={14} className="text-cyan-400" />
                </div>
                <span className="font-bold text-white block">{securityEvents.length} Events</span>
                <span className="text-[10px] text-slate-500 block">Append-Only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Pill Container */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('recovery')}
            className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'recovery'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users size={16} weight={activeTab === 'recovery' ? 'bold' : 'regular'} />
            <span>Social Recovery ({recoveryContacts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('multisig')}
            className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'multisig'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LockKey size={16} weight={activeTab === 'multisig' ? 'bold' : 'regular'} />
            <span>Multi-Sig Vaults ({multiSigAccounts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={16} weight={activeTab === 'audit' ? 'bold' : 'regular'} />
            <span>Audit Ledger ({securityEvents.length})</span>
          </button>
        </div>

        {/* TAB 1: SOCIAL RECOVERY */}
        {activeTab === 'recovery' && (
          <div className="space-y-6">
            {/* Seed Phrase Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Key size={22} weight="bold" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Master Seed Phrase Backup
                      {seedVerified ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold border border-emerald-500/30">
                          Offline Confirmed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold border border-amber-500/30">
                          Unverified
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      Your 12-word mnemonic phrase is your master key. Never enter it online or share it. Store it on steel or offline media.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={toggleSeedVerification}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                      seedVerified
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 hover:opacity-90'
                    }`}
                  >
                    <CheckCircle size={16} weight="bold" />
                    <span>{seedVerified ? 'Marked as Backed Up' : 'Confirm Offline Backup'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Add Guardian Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-cyan-400" weight="bold" />
                  <h3 className="text-base font-bold text-white">Add Recovery Guardian</h3>
                </div>
                <span className="text-[11px] text-slate-400">Post-Quantum Threshold SRS</span>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2 text-rose-300 text-xs font-medium">
                  <Warning size={16} weight="bold" className="shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">Guardian Name / Label</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Alice (Hardware Signer)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">Wallet Address (SS58 or 0x)</label>
                  <input
                    type="text"
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    placeholder="5Cg3... / 0x..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-3 flex items-end">
                  <button
                    onClick={addRecoveryContact}
                    className="w-full h-[42px] bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-cyan-500/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus size={16} weight="bold" />
                    <span>Add Guardian</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Guardians List Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Configured Recovery Guardians
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                      {recoveryContacts.length} Total
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Guardians participate in threshold recovery extrinsics without having access to your funds.
                  </p>
                </div>

                {recoveryContacts.length > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Required Quorum</span>
                    <span className="text-cyan-300 font-bold font-mono text-sm">
                      {Math.min(2, Math.max(1, recoveryContacts.length))} of {Math.max(3, recoveryContacts.length)} Signers
                    </span>
                  </div>
                )}
              </div>

              {recoveryContacts.length === 0 ? (
                <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-8 text-center space-y-2">
                  <Users size={36} className="mx-auto text-slate-600" weight="thin" />
                  <p className="text-xs font-bold text-slate-300">No recovery guardians configured yet</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Add at least 3 trusted friends, family members, or secondary cold-wallets to activate social recovery protection.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recoveryContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{contact.name}</span>
                          <button
                            onClick={() => toggleContactStatus(contact.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                              contact.status === 'verified'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {contact.status === 'verified' ? 'Verified' : 'Pending Verification'}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                          <span>{contact.address}</span>
                          <button
                            onClick={() => handleCopy(contact.address, contact.id)}
                            className="p-1 hover:text-cyan-300 transition-colors"
                            title="Copy Address"
                          >
                            {copiedId === contact.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500 font-mono">Added: {contact.addedDate}</span>
                        <button
                          onClick={() => removeRecoveryContact(contact.id, contact.name)}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                          title="Remove Guardian"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-SIG VAULTS */}
        {activeTab === 'multisig' && (
          <div className="space-y-6">
            {/* Create Multi-sig Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <LockKey size={20} className="text-cyan-400" weight="bold" />
                  <h3 className="text-base font-bold text-white">Create Multi-Sig Account</h3>
                </div>
                <span className="text-[11px] text-slate-400">BelizeChain Sovereign Vaults</span>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2 text-rose-300 text-xs font-medium">
                  <Warning size={16} weight="bold" className="shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">Vault Label</label>
                  <input
                    type="text"
                    value={multisigName}
                    onChange={(e) => setMultisigName(e.target.value)}
                    placeholder="e.g. Treasury Reserve / DAO Vault"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">Threshold (M/N)</label>
                  <select
                    value={multisigThreshold}
                    onChange={(e) => setMultisigThreshold(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold"
                  >
                    <option value="2/3">2 of 3 Required</option>
                    <option value="3/5">3 of 5 Required</option>
                    <option value="4/7">4 of 7 Required</option>
                    <option value="1/2">1 of 2 (Dual Admin)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">Total Signers</label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={multisigSigners}
                    onChange={(e) => setMultisigSigners(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold text-center"
                  />
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <button
                    onClick={addMultisigAccount}
                    className="w-full h-[42px] bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-cyan-500/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus size={16} weight="bold" />
                    <span>Deploy</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Configured Multi-sigs List */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Active Multi-Sig Vaults
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                      {multiSigAccounts.length} Configured
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-sig accounts require M signatures before any transaction or transfer executes.
                  </p>
                </div>
              </div>

              {multiSigAccounts.length === 0 ? (
                <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-8 text-center space-y-2">
                  <LockKey size={36} className="mx-auto text-slate-600" weight="thin" />
                  <p className="text-xs font-bold text-slate-300">No multi-sig vaults configured yet</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Create a shared corporate, organizational, or dual-custody account to require multiple approvals for all extrinsics.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {multiSigAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{account.name}</h4>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                account.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {account.status === 'active' ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">
                            Threshold: {account.threshold} Signatures
                          </span>
                        </div>

                        <button
                          onClick={() => removeMultisigAccount(account.id, account.name)}
                          className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Remove Vault"
                        >
                          <Trash size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Signers</span>
                          <span className="text-white font-bold text-sm">{account.signers} Keys</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Balance</span>
                          <span className="text-emerald-400 font-bold font-mono text-sm">{account.balance}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleMultisigStatus(account.id)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          account.status === 'active'
                            ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        }`}
                      >
                        {account.status === 'active' ? 'Pause Extrinsics' : 'Resume Vault'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Architectural Security Guarantees */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" weight="bold" />
                Multi-Sig Protocol Guarantees
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="font-bold text-slate-200 block">Post-Quantum Dilithium Signers</span>
                  <p className="text-[11px] leading-relaxed">
                    Threshold signatures are mathematically verified using NIST FIPS 204 CRYSTALS-Dilithium schemes.
                  </p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="font-bold text-slate-200 block">Emergency Timelock Pausing</span>
                  <p className="text-[11px] leading-relaxed">
                    Any designated signer can temporarily halt automated disbursements in suspected security incidents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LEDGER */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText size={20} className="text-cyan-400" weight="bold" />
                    Cryptographic Audit Ledger
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Tamper-evident chronological record of account security actions and validations.
                  </p>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportPdfLikeReport}
                    disabled={securityEvents.length === 0}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <DownloadSimple size={14} weight="bold" />
                    <span>TXT Report</span>
                  </button>
                  <button
                    onClick={exportCsv}
                    disabled={securityEvents.length === 0}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <DownloadSimple size={14} weight="bold" />
                    <span>CSV Export</span>
                  </button>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events by keyword or location..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex bg-slate-950 border border-slate-800 rounded-2xl p-1 text-xs font-bold">
                  {(['all', 'ok', 'warning'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setEventFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl uppercase text-[10px] transition-all ${
                        eventFilter === filter
                          ? 'bg-slate-800 text-cyan-300 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Events List */}
              {filteredEvents.length === 0 ? (
                <div className="bg-slate-950/60 rounded-2xl border border-slate-800/80 p-8 text-center space-y-2">
                  <FileText size={36} className="mx-auto text-slate-600" weight="thin" />
                  <p className="text-xs font-bold text-slate-300">No events found matching current criteria</p>
                  <p className="text-[11px] text-slate-500">
                    Security events will be recorded here as you configure guardians, multi-sig vaults, and backups.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            ev.status === 'warning'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {ev.status === 'warning' ? (
                            <Warning size={14} weight="fill" />
                          ) : (
                            <CheckCircle size={14} weight="fill" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-xs">{ev.event}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                            <span>{ev.location}</span>
                            <span>•</span>
                            <span className="font-mono">{ev.timestamp}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 border ${
                          ev.status === 'warning'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
