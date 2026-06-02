'use client';

import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { TransactionIndexer, type Transaction } from '@belizechain/shared';
import { initializeApi, fetchBalance } from '@/services/blockchain';
import { getActiveProposals } from '@/services/pallets';
import { type Proposal } from '@/services/pallets/governance';
import { getDisplayName } from '@/services/pallets/identity';
import { getExchangeRate } from '@/services/oracle';
import {
  ArrowLeft,
  Vault,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  CurrencyDollar,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ChartLineUp,
  ShieldCheck
} from 'phosphor-react';

interface Signer {
  name: string;
  address: string;
  verified: boolean;
}

function shortenAddress(address: string): string {
  if (!address || address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function TreasuryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'signers'>('overview');
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ dalla: '0', bBZD: '0', totalUSD: '0' });
  const [multiSig, setMultiSig] = useState({ required: 0, total: 0, threshold: '—' });
  const [signers, setSigners] = useState<Signer[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [treasuryAddress, setTreasuryAddress] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const api = await initializeApi();

        // Treasury account is exposed by the economy pallet.
        const treasuryAccountRaw = await api.query.economy?.treasuryAccount?.();
        const treasuryAddress = treasuryAccountRaw ? treasuryAccountRaw.toString() : '';
        if (!cancelled) setTreasuryAddress(treasuryAddress);

        // Governance council members are the treasury multi-sig signers.
        let members: string[] = [];
        try {
          const membersRaw: any = await api.query.governanceCouncil?.members?.();
          if (membersRaw) members = membersRaw.map((m: any) => m.toString());
        } catch (err) {
          console.warn('Council members lookup failed:', err);
        }

        const [bal, rates, signerNames, allProposals, history] = await Promise.all([
          treasuryAddress ? fetchBalance(treasuryAddress) : Promise.resolve(null),
          Promise.all([
            getExchangeRate('DALLA', 'USD').catch(() => null),
            getExchangeRate('bBZD', 'USD').catch(() => null),
          ]),
          Promise.all(members.map((addr) => getDisplayName(addr).catch(() => undefined))),
          getActiveProposals().catch(() => [] as Proposal[]),
          treasuryAddress
            ? new TransactionIndexer(api)
                .getAccountHistory(treasuryAddress, { type: 'all', limit: 10 })
                .catch(() => [] as Transaction[])
            : Promise.resolve([] as Transaction[]),
        ]);

        if (cancelled) return;

        // Balance + USD valuation from real oracle rates.
        const dallaNum = bal ? parseFloat(bal.dalla) || 0 : 0;
        const bbzdNum = bal ? parseFloat(bal.bBZD) || 0 : 0;
        const [dallaRate, bbzdRate] = rates;
        const usd = dallaNum * (dallaRate?.rate ?? 0) + bbzdNum * (bbzdRate?.rate ?? 0);
        setBalance({
          dalla: dallaNum.toLocaleString(undefined, { maximumFractionDigits: 2 }),
          bBZD: bbzdNum.toLocaleString(undefined, { maximumFractionDigits: 2 }),
          totalUSD: usd.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        });

        // Multi-sig: signer count is real; required is the on-chain simple majority.
        const total = members.length;
        const required = total > 0 ? Math.floor(total / 2) + 1 : 0;
        setMultiSig({ required, total, threshold: total > 0 ? `${required}-of-${total}` : '—' });

        setSigners(
          members.map((address, i) => ({
            name: signerNames[i] || shortenAddress(address),
            address: shortenAddress(address),
            verified: Boolean(signerNames[i]),
          }))
        );

        // Only treasury-spend proposals belong on this screen.
        setProposals(allProposals.filter((p) => /treasury/i.test(p.category)));

        setRecentTransactions(history);
      } catch (err) {
        console.error('Failed to load treasury data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Treasury</h1>
              <p className="text-xs text-gray-400">Multi-sig & Governance</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center">
            <Vault size={20} className="text-white" weight="fill" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-2">
          {['overview', 'proposals', 'signers'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'overview' && (
          <>
            {/* Balance Card */}
            <GlassCard variant="gradient" blur="lg" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/80 text-sm mb-1">Total Treasury Balance</p>
                  <h2 className="text-3xl font-bold text-white">{loading ? '—' : `$${balance.totalUSD}`}</h2>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-700/20 flex items-center justify-center">
                  <Wallet size={24} className="text-white" weight="fill" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/20">
                <div>
                  <p className="text-white/60 text-xs">DALLA Holdings</p>
                  <p className="text-white font-bold text-lg">{balance.dalla}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">bBZD Holdings</p>
                  <p className="text-white font-bold text-lg">{balance.bBZD}</p>
                </div>
              </div>
            </GlassCard>

            {/* Multi-sig Info */}
            <GlassCard variant="dark" blur="md" className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-white" weight="fill" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Multi-Signature Protection</h3>
                  <p className="text-sm text-gray-400">{multiSig.threshold} signatures required</p>
                </div>
              </div>
              <div className="flex items-center justify-around pt-4 border-t border-gray-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{multiSig.required}</p>
                  <p className="text-xs text-gray-400">Required</p>
                </div>
                <div className="text-2xl text-gray-300">/</div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-400">{multiSig.total}</p>
                  <p className="text-xs text-gray-400">Total Signers</p>
                </div>
              </div>
            </GlassCard>

            {/* Recent Transactions */}
            <div>
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-sm font-semibold text-gray-300">Recent Transactions</h3>
                <ChartLineUp size={16} className="text-gray-400" weight="bold" />
              </div>
              <GlassCard variant="dark" blur="sm" className="divide-y divide-gray-100">
                {recentTransactions.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    {loading ? 'Loading treasury activity…' : 'No recent treasury transactions'}
                  </div>
                ) : (
                  recentTransactions.map((tx, i) => {
                    const incoming = treasuryAddress !== '' && tx.to === treasuryAddress;
                    const counterparty = incoming ? tx.from : tx.to;
                    return (
                      <div key={tx.hash || i} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            incoming ? 'bg-emerald-100' : 'bg-red-100'
                          }`}>
                            {incoming ? (
                              <ArrowDownLeft size={20} className="text-emerald-400" weight="bold" />
                            ) : (
                              <ArrowUpRight size={20} className="text-red-400" weight="bold" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{shortenAddress(counterparty || '')}</p>
                            <p className="text-xs text-gray-400">{relativeTime(tx.timestamp)}</p>
                          </div>
                        </div>
                        <p className={`font-bold ${incoming ? 'text-emerald-400' : 'text-red-400'}`}>
                          {incoming ? '+' : '-'}{tx.amount}
                        </p>
                      </div>
                    );
                  })
                )}
              </GlassCard>
            </div>
          </>
        )}

        {activeTab === 'proposals' && (
          <div className="space-y-3">
            {proposals.length === 0 ? (
              <GlassCard variant="dark" blur="md" className="p-8 text-center text-sm text-gray-400">
                {loading ? 'Loading treasury proposals…' : 'No active treasury proposals'}
              </GlassCard>
            ) : (
              proposals.map((proposal) => {
                const status = proposal.status.toLowerCase();
                return (
                  <GlassCard key={proposal.index} variant="dark" blur="md" className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-1">{proposal.title || `Proposal #${proposal.index}`}</h3>
                        <p className="text-sm text-gray-400">{proposal.description}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        status === 'approved' || status === 'executed' ? 'bg-emerald-500/100/20 text-emerald-400' :
                        status === 'rejected' || status === 'cancelled' ? 'bg-red-500/100/20 text-red-400' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {proposal.status}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                      <div>
                        <p className="text-xs text-gray-400">Amount</p>
                        <p className="font-bold text-white">{proposal.value} DALLA</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Ayes / Nays</p>
                        <p className="font-bold text-white">{proposal.voteCount.ayes} / {proposal.voteCount.nays}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Status</p>
                        <p className="font-bold text-white">{proposal.status}</p>
                      </div>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'signers' && (
          <div className="space-y-3">
            {signers.length === 0 ? (
              <GlassCard variant="dark" blur="sm" className="p-8 text-center text-sm text-gray-400">
                {loading ? 'Loading signers…' : 'No council signers found'}
              </GlassCard>
            ) : (
              signers.map((signer, i) => (
                <GlassCard key={i} variant="dark" blur="sm" className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-400 flex items-center justify-center text-white font-bold">
                        {signer.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{signer.name}</p>
                          {signer.verified && (
                            <CheckCircle size={16} className="text-emerald-500" weight="fill" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{signer.address}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <ShieldCheck size={20} className="text-forest-400" weight="fill" />
                      <p className="text-xs text-gray-400">signer</p>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
