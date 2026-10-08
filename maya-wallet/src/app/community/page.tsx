'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeDisplay, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { SubmitPetitionModal } from '@/components/SubmitPetitionModal';
import { useToast } from '@/contexts/ToastContext';
import { useWallet } from '@/contexts/WalletContext';
import {
  getActiveReferenda,
  getCouncilMembers,
  voteOnProposal,
  type CouncilMember,
  type Referendum as ChainReferendum,
} from '@/services/pallets/governance';
import {
  getCommunityProposals,
  getEducationModules,
  getGreenProjects,
  getUserSRS,
  voteOnCommunityProposal,
  type CommunityProposal,
  type EducationModule,
  type GreenProject,
  type SRSInfo,
} from '@/services/pallets/community';
import { fetchBalance } from '@/services/blockchain';
import { BELIZE_DISTRICTS } from '@/lib/districts';
import {
  PencilSimple,
  ChartBar,
  Medal,
  User,
  ShieldCheck,
  ChartLineUp,
  Trophy,
  UsersThree,
  Scales,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  ArrowRight,
  MapPin,
  TreeEvergreen,
  Shield,
  Clock,
  GraduationCap,
  Coins,
} from 'phosphor-react';

/** Round a `Hash`/bytes value down to a short, displayable identifier. */
function shortHash(value: string, chars = 6): string {
  return value.length > chars * 2 ? `${value.slice(0, chars)}…${value.slice(-chars)}` : value;
}

const PETITION_STATUS_FILTERS = ['All', 'Active', 'EthicsReview', 'Approved', 'Rejected'] as const;

export default function CommunityPage() {
  const { selectedAccount } = useWallet();
  const [activeTab, setActiveTab] = useState('petitions');
  const { showToast } = useToast();
  const [isSubmitPetitionOpen, setIsSubmitPetitionOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [convictionMultiplier, setConvictionMultiplier] = useState<number>(1);
  const [votingReferendumId, setVotingReferendumId] = useState<number | null>(null);
  const [votingPetitionId, setVotingPetitionId] = useState<string | null>(null);

  // ---- Real chain state ---------------------------------------------------
  const [referendums, setReferendums] = useState<ChainReferendum[]>([]);
  const [petitions, setPetitions] = useState<CommunityProposal[]>([]);
  const [council, setCouncil] = useState<CouncilMember[]>([]);
  const [modules, setModules] = useState<EducationModule[]>([]);
  const [greenProjects, setGreenProjects] = useState<GreenProject[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChainData = useCallback(async () => {
    const results = await Promise.allSettled([
      getActiveReferenda(),
      getCommunityProposals(),
      getCouncilMembers(),
      getEducationModules(),
      getGreenProjects(),
    ]);

    const [refe, props, members, edu, green] = results;
    if (refe.status === 'fulfilled') setReferendums(refe.value);
    if (props.status === 'fulfilled') setPetitions(props.value);
    if (members.status === 'fulfilled') setCouncil(members.value);
    if (edu.status === 'fulfilled') setModules(edu.value);
    if (green.status === 'fulfilled') setGreenProjects(green.value);

    const rejected = results.filter((r) => r.status === 'rejected');
    if (rejected.length > 0) {
      console.warn('Some community data failed to load:', rejected);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cancelled) await loadChainData();
    };
    void run();
    const interval = setInterval(run, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadChainData]);

  // Per-account reads. These depend on the connected wallet, so they are kept out
  // of the polling loop above. Standing is stored keyed by address and derived
  // below, so disconnecting needs no synchronous state reset.
  const [standing, setStanding] = useState<{
    address: string;
    srs: SRSInfo | null;
    balance: { dalla: string; bBZD: string } | null;
  } | null>(null);

  useEffect(() => {
    const address = selectedAccount?.address;
    if (!address) return;

    let cancelled = false;
    Promise.allSettled([getUserSRS(address), fetchBalance(address)])
      .then(([srsRes, balanceRes]) => {
        if (cancelled) return;
        setStanding({
          address,
          srs: srsRes.status === 'fulfilled' ? srsRes.value : null,
          balance:
            balanceRes.status === 'fulfilled'
              ? { dalla: balanceRes.value.dalla, bBZD: balanceRes.value.bBZD }
              : null,
        });
      })
      .catch((error) => console.error('Failed to load civic standing:', error));

    return () => {
      cancelled = true;
    };
  }, [selectedAccount?.address]);

  // Only surface standing that belongs to the account currently connected.
  const belongsToConnectedAccount =
    standing !== null && standing.address === selectedAccount?.address;
  const srs = belongsToConnectedAccount ? standing.srs : null;
  const balance = belongsToConnectedAccount ? standing.balance : null;

  const filteredPetitions =
    statusFilter === 'All' ? petitions : petitions.filter((p) => p.status === statusFilter);

  // Sovereign Civic Merits (Badges)
  //
  // Every badge is derived from on-chain state on this chain. Nothing is granted
  // by default — an account with no council seat, no completed modules and no
  // green contributions correctly shows zero earned merits.
  const isCouncilMember = council.some(
    (m) => selectedAccount?.address && m.account === selectedAccount.address,
  );

  const badges = [
    {
      id: 'verified-citizen',
      name: 'Verified Citizen',
      icon: <ShieldCheck size={22} weight="fill" className="text-cyan-400" />,
      description: 'Holds a registered BelizeID identity on chain',
      rarity: 'legendary' as const,
      earned: Boolean(srs),
    },
    {
      id: 'council-steward',
      name: 'Council Steward',
      icon: <Scales size={22} weight="fill" className="text-teal-400" />,
      description: 'Holds a seat on the BelizeChain governors council',
      rarity: 'epic' as const,
      earned: isCouncilMember,
    },
    {
      id: 'civic-scholar',
      name: 'Civic Scholar',
      icon: <GraduationCap size={22} weight="fill" className="text-sky-400" />,
      description: 'Completed a BelizeChain civic education module',
      rarity: 'rare' as const,
      earned: (srs?.educationModulesCompleted ?? 0) > 0,
    },
    {
      id: 'reef-sentinel',
      name: 'Reef Sentinel',
      icon: <TreeEvergreen size={22} weight="fill" className="text-emerald-400" />,
      description: 'Contributed to a verified green project',
      rarity: 'rare' as const,
      earned: (srs?.greenProjectContributions ?? '0') !== '0.00' && Boolean(srs),
    },
    {
      id: 'civic-volunteer',
      name: 'Civic Volunteer',
      icon: <Medal size={22} weight="fill" className="text-amber-400" />,
      description: 'Logged verified volunteer hours toward civic standing',
      rarity: 'common' as const,
      earned: (srs?.volunteerHours ?? 0) > 0,
    },
    {
      id: 'pouw-contributor',
      name: 'PoUW Contributor',
      icon: <ChartLineUp size={22} weight="fill" className="text-purple-400" />,
      description: 'Contributed verifiable compute proofs to Nawal federated AI',
      rarity: 'legendary' as const,
      earned: council.some(
        (m) => selectedAccount?.address && m.account === selectedAccount.address && m.communityRank > 0,
      ),
    },
  ];

  const handleVoteReferendum = async (id: number, vote: 'Aye' | 'Nay') => {
    if (!selectedAccount?.address) return;
    setVotingReferendumId(id);
    try {
      await voteOnProposal(selectedAccount.address, id, vote, 'None');
      showToast({ type: 'success', message: `Recorded ${vote} on referendum #${id}.` });
      setReferendums(await getActiveReferenda());
    } catch (err) {
      showToast({ type: 'error', message: `Vote failed: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setVotingReferendumId(null);
    }
  };

  const handleVotePetition = async (proposalId: string, approve: boolean) => {
    if (!selectedAccount?.address) return;
    setVotingPetitionId(proposalId);
    try {
      await voteOnCommunityProposal(selectedAccount.address, proposalId, approve ? 'Yes' : 'No');
      showToast({
        type: 'success',
        message: `Recorded ${approve ? 'Aye' : 'Nay'} on petition #${proposalId}.`,
      });
      setPetitions(await getCommunityProposals());
    } catch (err) {
      showToast({ type: 'error', message: `Vote failed: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setVotingPetitionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 font-sans bg-gradient-to-b from-slate-950 via-[#030914] to-slate-950">
      {/* Top Header */}
      <div className="relative overflow-hidden px-4 pt-6 pb-3">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                    <ShieldCheck size={14} weight="bold" />
                    Sovereign Citizen Governance
                  </span>
                  <span className="px-2.5 py-0.5 bg-teal-500/15 text-teal-300 border border-teal-500/30 rounded-full text-[11px] font-bold">
                    {BELIZE_DISTRICTS.length} Municipal Districts
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Civic Hub & Assemblies</h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Decentralized Democracy • Citizen Petitions • Quadratic Referendums
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsSubmitPetitionOpen(true)}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-cyan-950/40"
                >
                  <PencilSimple size={18} weight="bold" />
                  <span>New Petition</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics — all read from chain */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
                <p className="text-[11px] font-mono text-slate-400 mb-0.5">Open Petitions</p>
                <p className="text-lg font-bold text-white font-mono">{petitions.length}</p>
                <span className="text-[10px] text-teal-400">On-chain proposals</span>
              </div>
              <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
                <p className="text-[11px] font-mono text-slate-400 mb-0.5">Active Referendums</p>
                <p className="text-lg font-bold text-cyan-300 font-mono">{referendums.length}</p>
                <span className="text-[10px] text-cyan-400">Quadratic Ballots</span>
              </div>
              <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
                <p className="text-[11px] font-mono text-slate-400 mb-0.5">Your Civic SRS</p>
                {srs ? (
                  <>
                    <p className="text-lg font-bold text-emerald-400 font-mono">
                      {srs.score.toLocaleString()} / 10,000
                    </p>
                    <span className="text-[10px] text-emerald-400">Tier {srs.tier}</span>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-slate-300 font-mono">—</p>
                    <span className="text-[10px] text-slate-400">Not established</span>
                  </>
                )}
              </div>
              <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
                <p className="text-[11px] font-mono text-slate-400 mb-0.5">Council Seats</p>
                <p className="text-lg font-bold text-amber-300 font-mono">{council.length}</p>
                <span className="text-[10px] text-slate-400">Governors council</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="px-4 max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Sleek Pill Tab Switcher */}
          <TabsList className="w-full bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl flex gap-1.5 shadow-xl mb-4">
            <TabsTrigger
              value="feed"
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-slate-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/40 data-[state=active]:shadow-sm"
            >
              District Assemblies & Petitions
            </TabsTrigger>
            <TabsTrigger
              value="governance"
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-slate-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/40 data-[state=active]:shadow-sm"
            >
              National Referendums ({referendums.length})
            </TabsTrigger>
            <TabsTrigger
              value="standing"
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-slate-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/40 data-[state=active]:shadow-sm"
            >
              Civic Standing
            </TabsTrigger>
            <TabsTrigger
              value="learn"
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-slate-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/40 data-[state=active]:shadow-sm"
            >
              Learn & Green ({modules.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: District Assemblies & Petitions */}
          <TabsContent value="petitions" className="space-y-4">
            {/* Status Filter Pill Bar. Community proposals carry no district field
                on chain, so filtering is by proposal status, which is real. */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                {PETITION_STATUS_FILTERS.map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      statusFilter === status
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {status === 'EthicsReview' ? 'Ethics Review' : status}
                  </button>
                ))}
              </div>
              <span className="text-slate-400 text-xs font-mono hidden sm:inline">
                {filteredPetitions.length} Petitions
              </span>
            </div>

            {loading && (
              <p className="text-center text-slate-400 text-xs font-mono py-8">Loading on-chain petitions…</p>
            )}

            {!loading && filteredPetitions.length === 0 && (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-2">
                <UsersThree size={30} className="mx-auto text-slate-600" />
                <p className="text-slate-200 text-sm font-bold">No citizen petitions yet</p>
                <p className="text-slate-400 text-xs font-mono">
                  {petitions.length === 0
                    ? 'No community proposals have been submitted to this chain.'
                    : 'No petitions match the selected status.'}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {filteredPetitions.map((petition) => {
                const total = petition.votesFor + petition.votesAgainst;
                const ayesPct = total > 0 ? (petition.votesFor / total) * 100 : 0;
                const isVoting = votingPetitionId === petition.proposalId;
                const canVote = petition.status === 'Active';

                return (
                  <div
                    key={petition.proposalId}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg transition-all"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2.5">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            Petition #{petition.proposalId}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                            {petition.proposalType}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-200 border border-teal-500/30">
                            {petition.status}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-white">{petition.title}</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{petition.description}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                        {petition.amount} DALLA
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-mono mb-3">
                      Proposer: {shortHash(petition.proposer, 8)} • Beneficiary: {shortHash(petition.beneficiary, 8)}
                    </p>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-teal-300 font-semibold">
                          Ayes: {petition.votesFor} ({ayesPct.toFixed(1)}%)
                        </span>
                        <span className="text-rose-300 font-semibold">
                          Nays: {petition.votesAgainst} ({(100 - ayesPct).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 flex">
                        <div className="bg-teal-500 h-full transition-all" style={{ width: `${ayesPct}%` }} />
                        <div className="bg-rose-500 h-full transition-all" style={{ width: `${100 - ayesPct}%` }} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                        <Clock size={13} />
                        Voting closes block #{petition.votingDeadline.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVotePetition(petition.proposalId, true)}
                          disabled={isVoting || !canVote}
                          className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 disabled:opacity-40 text-teal-200 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <ThumbsUp size={14} weight="bold" />
                          <span>Aye</span>
                        </button>
                        <button
                          onClick={() => handleVotePetition(petition.proposalId, false)}
                          disabled={isVoting || !canVote}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-40 text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <ThumbsDown size={14} weight="bold" />
                          <span>Nay</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 2: National Referendums */}
          <TabsContent value="governance" className="space-y-4">
            {/* Citizen Voting Power Card — balances read from chain */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <ChartBar size={18} className="text-cyan-400" weight="fill" />
                    <h3 className="font-bold text-white text-sm">Your Sovereign Voting Power</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-cyan-300 font-mono">
                      {balance ? `${Number(balance.dalla).toLocaleString()} DALLA` : '—'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {balance ? `• ${Number(balance.bBZD).toLocaleString()} bBZD` : 'Wallet not connected'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Civil standing:{' '}
                    <span className="text-emerald-400 font-semibold">
                      {srs ? `SRS ${srs.score.toLocaleString()} (Tier ${srs.tier})` : 'not established'}
                    </span>
                  </p>
                </div>

                {/* Conviction Multiplier Selector */}
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1.5 text-[11px] font-mono">Conviction Multiplier:</span>
                  <div className="flex gap-1 font-mono">
                    {[1, 2, 4, 6].map((m) => (
                      <button
                        key={m}
                        onClick={() => setConvictionMultiplier(m)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          convictionMultiplier === m
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {m}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Referendums List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Active National Referendums ({referendums.length})
                  </h3>
                </div>
                <Link
                  href="/governance"
                  className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <span>Full Governance Terminal</span>
                  <ArrowRight size={13} weight="bold" />
                </Link>
              </div>

              {referendums.map((ref) => {
                const ayes = parseFloat(ref.voteCount.ayes);
                const nays = parseFloat(ref.voteCount.nays);
                const totalVotes = ayes + nays;
                const ayesPct = totalVotes > 0 ? (ayes / totalVotes) * 100 : 0;

                return (
                  <div
                    key={ref.index}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg transition-all"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2.5">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            Referendum #{ref.index}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {ref.voteThreshold}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin size={12} className="text-teal-400" />
                            {ref.status}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-white">On-chain Referendum #{ref.index}</h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                        Turnout: {ref.voteCount.turnout} DALLA
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3 font-mono">Hash: {ref.proposalHash.slice(0, 20)}…</p>

                    {/* Voting Progress Bar */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-teal-400 font-semibold">
                          Ayes: {ref.voteCount.ayes} ({ayesPct.toFixed(1)}%)
                        </span>
                        <span className="text-rose-400 font-semibold">
                          Nays: {ref.voteCount.nays} ({(100 - ayesPct).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 flex">
                        <div className="bg-teal-500 h-full transition-all" style={{ width: `${ayesPct}%` }} />
                        <div className="bg-rose-500 h-full transition-all" style={{ width: `${100 - ayesPct}%` }} />
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                        <Clock size={13} />
                        Ballot ends block #{ref.voteEnd.toLocaleString()}
                      </span>

                      <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleVoteReferendum(ref.index, 'Aye')}
                              disabled={votingReferendumId === ref.index || ref.status !== 'Voting'}
                              className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <ThumbsUp size={14} weight="bold" />
                              <span>Vote Aye</span>
                            </button>
                            <button
                              onClick={() => handleVoteReferendum(ref.index, 'Nay')}
                              disabled={votingReferendumId === ref.index || ref.status !== 'Voting'}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <ThumbsDown size={14} weight="bold" />
                              <span>Vote Nay</span>
                            </button>
                        <Link
                          href={`/proposal/${ref.index}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 3: Civic Standing & District Delegates */}
          <TabsContent value="standing" className="space-y-5">
            {/* User Standing & SRS Card — read from community.socialResponsibilityScores */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/40 flex items-center justify-center text-cyan-300 font-bold text-lg">
                    {selectedAccount?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <span>{selectedAccount?.name || 'Not connected'}</span>
                      {srs && <CheckCircle size={16} weight="fill" className="text-teal-400" />}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {srs
                        ? `${srs.participationCount} participation events • ${srs.volunteerHours}h volunteered`
                        : 'No Social Reputation Score established'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Social Reputation Score</span>
                  {srs ? (
                    <span className="text-2xl font-bold text-emerald-400 font-mono">
                      {srs.score.toLocaleString()} / 10,000
                    </span>
                  ) : (
                    <span className="text-2xl font-bold text-slate-300 font-mono">—</span>
                  )}
                  <span className="text-[11px] text-teal-300 block font-semibold">
                    {srs ? `Tier ${srs.tier}` : 'Not established'}
                  </span>
                </div>
              </div>

              {/* SRS Benefits Grid — real SRS fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-800/80 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[11px] block">Monthly Fee Exemption</span>
                  <span className="font-bold text-teal-300 font-mono">
                    {srs ? `${srs.monthlyFeeExemption} DALLA` : '—'}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[11px] block">Education Modules Completed</span>
                  <span className="font-bold text-cyan-300 font-mono">
                    {srs ? srs.educationModulesCompleted : '—'}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[11px] block">Green Project Contributions</span>
                  <span className="font-bold text-amber-300 font-mono">
                    {srs ? `${srs.greenProjectContributions} DALLA` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sovereign Civic Merits (Badges) Showcase */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <Medal size={18} className="text-cyan-400" weight="fill" />
                  Sovereign Civic Merits ({badges.filter((b) => b.earned).length}/{badges.length})
                </h3>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
                <BadgeDisplay badges={badges} />
              </div>
            </div>

            {/* Governors Council — real governance.councilMembers */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono mb-3 flex items-center gap-2">
                <UsersThree size={18} className="text-teal-400" weight="fill" />
                Governors Council ({council.length})
              </h3>
              {council.length === 0 ? (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
                  <p className="text-slate-400 text-xs font-mono">No council members seated on this chain.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {council.map((member, index) => {
                    const isUser = Boolean(
                      selectedAccount?.address && member.account === selectedAccount.address,
                    );
                    return (
                      <div
                        key={member.account}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                          isUser
                            ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                            : 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5">
                          <div className="flex items-center justify-center w-6 text-sm font-bold text-slate-400 font-mono">
                            #{index + 1}
                          </div>
                          <div className="flex items-center justify-center w-7">
                            <Trophy size={18} weight="fill" className="text-amber-400" />
                          </div>
                          <div>
                            <p className={`font-bold text-sm ${isUser ? 'text-cyan-300' : 'text-white'}`}>
                              {shortHash(member.account, 6)}
                              {isUser && <span className="ml-2 text-[10px] text-cyan-400">YOU</span>}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <MapPin size={11} className="text-teal-400" />
                              {member.role} • term ends block {member.termEnd.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-mono block">Participation</span>
                          <span className="text-sm font-bold text-emerald-400 font-mono">
                            {member.participationRate}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 4: Civic Education & Green Projects — real chain content */}
          <TabsContent value="learn" className="space-y-5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono mb-3 flex items-center gap-2">
                <GraduationCap size={18} className="text-cyan-400" weight="fill" />
                Civic Education Modules ({modules.length})
              </h3>
              {modules.length === 0 ? (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
                  <p className="text-slate-400 text-xs font-mono">No education modules registered on this chain.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {modules.map((mod) => (
                    <div
                      key={mod.moduleId}
                      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-white">{mod.title}</h4>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            mod.active
                              ? 'bg-teal-500/15 text-teal-200 border-teal-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {mod.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{mod.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                        <span className="text-amber-300 font-bold">{mod.rewardAmount} DALLA</span>
                        <span className="text-slate-400">
                          {mod.totalCompletions}
                          {mod.maxCompletions !== null ? ` / ${mod.maxCompletions}` : ''} completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono mb-3 flex items-center gap-2">
                <TreeEvergreen size={18} className="text-emerald-400" weight="fill" />
                Green Projects ({greenProjects.length})
              </h3>
              {greenProjects.length === 0 ? (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
                  <p className="text-slate-400 text-xs font-mono">No green projects registered on this chain.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {greenProjects.map((project) => (
                    <div
                      key={project.projectId}
                      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                        <div>
                          <h4 className="text-sm font-bold text-white">{project.name}</h4>
                          <span className="text-[10px] font-mono text-teal-300 uppercase tracking-wide">
                            {project.category}
                          </span>
                        </div>
                        <div className="text-right font-mono text-[11px]">
                          <span className="text-emerald-300 font-bold block">
                            {project.currentFunding} / {project.targetFunding} DALLA
                          </span>
                          <span className="text-slate-400">{project.contributorCount} contributors</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{project.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <SubmitPetitionModal
        isOpen={isSubmitPetitionOpen}
        onClose={() => setIsSubmitPetitionOpen(false)}
        onSubmitted={async () => {
          setIsSubmitPetitionOpen(false);
          setPetitions(await getCommunityProposals());
        }}
      />
    </div>
  );
}
