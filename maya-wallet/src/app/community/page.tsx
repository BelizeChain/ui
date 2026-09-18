'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GlassCard, PostCard, ProposalCard, BadgeDisplay, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { useGovernanceProposalsSubscription } from '@/hooks/useBlockchainEvents';
import { CreatePostModal } from '@/components/CreatePostModal';
import { CommentsModal } from '@/components/CommentsModal';
import { useToast } from '@/contexts/ToastContext';
import { useWallet } from '@/contexts/WalletContext';
import {
  getActiveReferenda,
  voteOnProposal,
  type Referendum as ChainReferendum,
} from '@/services/pallets/governance';
import {
  PencilSimple,
  ChartBar,
  Medal,
  TrendUp,
  User,
  ShieldCheck,
  ChartLineUp,
  Trophy,
  Star,
  RocketLaunch,
  UsersThree,
  Scales,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  ArrowRight,
  MapPin,
  Sparkle,
  TreeEvergreen,
  Coins,
  Shield,
  Clock,
  MagnifyingGlass,
} from 'phosphor-react';

interface ReferendumItem {
  id: number;
  title: string;
  category: 'District Infrastructure' | 'National Policy' | 'Treasury Grant' | 'Environmental Stewardship';
  district: string;
  requestedAmount: string;
  description: string;
  ayes: number;
  nays: number;
  endBlock: number;
  status: 'Active' | 'Passed';
  myVote?: 'Aye' | 'Nay';
}

export default function CommunityPage() {
  const { selectedAccount, balance } = useWallet();
  const [activeTab, setActiveTab] = useState('feed');
  const liveProposals = useGovernanceProposalsSubscription();
  const { showToast } = useToast();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [convictionMultiplier, setConvictionMultiplier] = useState<number>(1);
  const [votingReferendumId, setVotingReferendumId] = useState<number | null>(null);

  const [commentsModalData, setCommentsModalData] = useState<{
    isOpen: boolean;
    postId: string;
    postAuthor: string;
    postContent: React.ReactNode;
  }>({
    isOpen: false,
    postId: '',
    postAuthor: '',
    postContent: '',
  });

  // Citizen Petitions & District Assembly Posts (100% emoji-free)
  const [posts, setPosts] = useState<any[]>([
    {
      id: '1',
      author: {
        name: 'Maria Garcia',
        avatar: <User size={20} weight="fill" className="text-teal-400" />,
        district: 'Belize City',
      },
      content: 'Completed municipal PoUW federated learning node cycle #104. Verified 50 DALLA sovereign compute subsidy disbursed directly to local treasury escrow.',
      timestamp: '2h ago',
      likes: 24,
      comments: 8,
      shares: 3,
      type: 'community' as const,
    },
    {
      id: '2',
      author: {
        name: 'John Martinez',
        avatar: <User size={20} weight="fill" className="text-cyan-400" />,
        district: 'Orange Walk',
      },
      content: 'Municipal Assembly Resolution #42 passed for the Northern District agricultural cold-storage facility. Recorded 1,250 quadratic voting weight on-chain.',
      timestamp: '5h ago',
      likes: 67,
      comments: 15,
      shares: 12,
      type: 'governance' as const,
    },
    {
      id: '3',
      author: {
        name: 'Sarah Williams',
        avatar: <User size={20} weight="fill" className="text-emerald-400" />,
        district: 'Cayo',
      },
      content: 'Planted 250 native mahogany and mangrove saplings under the Belize Forestry Trust verified on-chain carbon registry.',
      timestamp: '1d ago',
      likes: 143,
      comments: 32,
      shares: 28,
      type: 'environment' as const,
    },
    {
      id: '4',
      author: {
        name: 'Elena Torres',
        avatar: <User size={20} weight="fill" className="text-teal-300" />,
        district: 'San Pedro / Islands',
      },
      content: 'Submitting civic petition for decentralized marine water-quality LoRaWAN sensor mesh along the barrier reef corridor.',
      timestamp: '1d ago',
      likes: 89,
      comments: 19,
      shares: 14,
      type: 'community' as const,
    },
  ]);

  // Active Civic Referendums
  // CONFIG-002: live referenda from the governance pallet (no fake BIP list).
  const [referendums, setReferendums] = useState<ChainReferendum[]>([]);
  const [communityGovLoading, setCommunityGovLoading] = useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const refe = await getActiveReferenda();
        if (!cancelled) setReferendums(refe);
      } catch (err) {
        console.warn('Referenda fetch failed:', err);
      } finally {
        if (!cancelled) setCommunityGovLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Sovereign Civic Merits (Badges)
  const badges = [
    {
      id: 'genesis-citizen',
      name: 'Genesis Citizen',
      icon: <ShieldCheck size={22} weight="fill" className="text-cyan-400" />,
      description: 'Authenticated with Verified BelizeID National Credential',
      rarity: 'legendary' as const,
      earned: true,
    },
    {
      id: 'council-elector',
      name: 'Council Elector',
      icon: <Scales size={22} weight="fill" className="text-teal-400" />,
      description: 'Participated in 50+ on-chain governance referendums',
      rarity: 'epic' as const,
      earned: true,
    },
    {
      id: 'reef-sentinel',
      name: 'Reef Sentinel',
      icon: <TreeEvergreen size={22} weight="fill" className="text-emerald-400" />,
      description: 'Verified participant in Blue Economy coastal restoration',
      rarity: 'rare' as const,
      earned: true,
    },
    {
      id: 'validator-steward',
      name: 'Validator Steward',
      icon: <Shield size={22} weight="fill" className="text-sky-400" />,
      description: 'Active nominator on BelizeChain validator consensus set',
      rarity: 'epic' as const,
      earned: false,
    },
    {
      id: 'justice-juror',
      name: 'Court Juror',
      icon: <Medal size={22} weight="fill" className="text-amber-400" />,
      description: 'Appointed juror on Restorative Justice citizen arbitration docket',
      rarity: 'common' as const,
      earned: true,
    },
    {
      id: 'pouw-contributor',
      name: 'PoUW Contributor',
      icon: <ChartLineUp size={22} weight="fill" className="text-purple-400" />,
      description: 'Contributed verifiable compute proofs to Nawal federated AI',
      rarity: 'legendary' as const,
      earned: false,
    },
  ];

  // Respected District Delegates & Civic Stewards
  const districtDelegates = [
    {
      rank: 1,
      name: 'Sarah Williams',
      district: 'Cayo District',
      srsScore: 98,
      standing: 'Exemplary Steward',
      badgeIcon: <Trophy size={18} weight="fill" className="text-amber-400" />,
    },
    {
      rank: 2,
      name: 'John Martinez',
      district: 'Orange Walk',
      srsScore: 94,
      standing: 'Senior Delegate',
      badgeIcon: <Medal size={18} weight="fill" className="text-slate-300" />,
    },
    {
      rank: 3,
      name: 'Maria Garcia',
      district: 'Belize City',
      srsScore: 91,
      standing: 'Municipal Elector',
      badgeIcon: <Medal size={18} weight="fill" className="text-amber-600" />,
    },
    {
      rank: 4,
      name: selectedAccount?.name || 'You',
      district: 'San Pedro / Islands',
      srsScore: 88,
      standing: 'Verified Elector',
      badgeIcon: <Star size={18} weight="fill" className="text-cyan-400" />,
      isUser: true,
    },
    {
      rank: 5,
      name: 'David Chen',
      district: 'Stann Creek',
      srsScore: 85,
      standing: 'District Delegate',
      badgeIcon: <Star size={18} weight="fill" className="text-cyan-400" />,
    },
  ];

  // Handlers
  const handleCreatePost = (newPost: {
    content: string;
    type: 'community' | 'governance' | 'environment';
    district?: string;
  }) => {
    const post = {
      id: Date.now().toString(),
      author: {
        name: selectedAccount?.name || 'Verified Citizen',
        avatar: <User size={20} weight="fill" className="text-teal-400" />,
        district: newPost.district ?? 'Belize City',
      },
      content: newPost.content,
      timestamp: 'Just now',
      likes: 0,
      comments: 0,
      shares: 0,
      type: newPost.type,
    };

    showToast({
      type: 'success',
      message: 'Citizen assembly petition published successfully.',
    });
    setPosts([post, ...posts]);
  };

  const handleOpenComments = (postId: string, postAuthor: string, postContent: React.ReactNode) => {
    setCommentsModalData({
      isOpen: true,
      postId,
      postAuthor,
      postContent,
    });
  };

  const handleCloseComments = () => {
    setCommentsModalData({
      isOpen: false,
      postId: '',
      postAuthor: '',
      postContent: '',
    });
  };

  const handleSharePost = async (postAuthor: string, postContent: any) => {
    const textContent = typeof postContent === 'string' ? postContent : 'BelizeChain Civic Initiative';
    const shareText = `${postAuthor} on BelizeChain Civic Assembly:\n\n${textContent}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'BelizeChain Civic Hub', text: shareText });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        showToast({
          type: 'success',
          message: 'Petition link copied to clipboard.',
        });
      }
    } catch (err) {
      console.debug('Share cancelled:', err);
    }
  };

  const handleVoteReferendum = async (id: number, vote: 'Aye' | 'Nay') => {
    setVotingReferendumId(id);
    try {
      await voteOnProposal(selectedAccount!.address, id, vote, 'None');
      showToast({ type: 'success', message: `Recorded ${vote} on referendum #${id}.` });
      const refe = await getActiveReferenda();
      setReferendums(refe);
    } catch (err) {
      showToast({ type: 'error', message: `Vote failed: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setVotingReferendumId(null);
    }
  };

  const filteredPosts = districtFilter === 'All'
    ? posts
    : posts.filter((p) => p.author?.district === districtFilter || p.author?.district?.includes(districtFilter));

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
                    8 Municipal Districts
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Civic Hub & Assemblies</h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Decentralized Democracy • Citizen Petitions • Quadratic Referendums
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsCreatePostOpen(true)}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-cyan-950/40"
                >
                  <PencilSimple size={18} weight="bold" />
                  <span>New Petition</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
                <p className="text-[11px] font-mono text-slate-400 mb-0.5">Verified Citizens</p>
                <p className="text-lg font-bold text-white font-mono">42,890</p>
                <span className="text-[10px] text-teal-400">BelizeID Authenticated</span>
              </div>
              <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
                <p className="text-[11px] font-mono text-slate-400 mb-0.5">Active Referendums</p>
                <p className="text-lg font-bold text-cyan-300 font-mono">3 Live</p>
                <span className="text-[10px] text-cyan-400">Quadratic Ballots</span>
              </div>
              <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
                <p className="text-[11px] font-mono text-slate-400 mb-0.5">Your Civic SRS</p>
                <p className="text-lg font-bold text-emerald-400 font-mono">88 / 100</p>
                <span className="text-[10px] text-emerald-400">Tier 1 Elector (-15% fee)</span>
              </div>
              <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80">
                <p className="text-[11px] font-mono text-slate-400 mb-0.5">Jurisdiction</p>
                <p className="text-sm font-bold text-slate-200 truncate mt-0.5">San Pedro / Islands</p>
                <span className="text-[10px] text-slate-500">District Assembly</span>
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
              Civic Standing & Delegates
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: District Assemblies & Petitions */}
          <TabsContent value="feed" className="space-y-4">
            {/* District Filter Pill Bar */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                {(['All', 'Belize City', 'Belmopan', 'Cayo', 'Orange Walk', 'San Pedro / Islands'] as const).map((dst) => (
                  <button
                    key={dst}
                    onClick={() => setDistrictFilter(dst)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      districtFilter === dst
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {dst}
                  </button>
                ))}
              </div>
              <span className="text-slate-500 text-xs font-mono hidden sm:inline">
                {filteredPosts.length} Active Petitions
              </span>
            </div>

            {/* Posts Stream */}
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onComment={() => handleOpenComments(post.id, post.author.name, post.content)}
                  onShare={() => handleSharePost(post.author.name, post.content)}
                />
              ))}
            </div>
          </TabsContent>

          {/* TAB 2: National Referendums & BIP Proposals */}
          <TabsContent value="governance" className="space-y-4">
            {/* Citizen Voting Power Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <ChartBar size={18} className="text-cyan-400" weight="fill" />
                    <h3 className="font-bold text-white text-sm">Your Sovereign Voting Power</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-cyan-300 font-mono">1,250 DALLA</span>
                    <span className="text-xs text-slate-400">• 2,500 bBZD Liquid Reserves</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Jurisdiction: <span className="text-slate-200 font-semibold">San Pedro / Islands</span> • SRS Weight: <span className="text-emerald-400 font-semibold">1.15x</span>
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
            {/* User Standing & SRS Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/40 flex items-center justify-center text-cyan-300 font-bold text-lg">
                    {selectedAccount?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <span>{selectedAccount?.name || 'Verified Citizen'}</span>
                      <CheckCircle size={16} weight="fill" className="text-teal-400" />
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      BelizeID #001 • Jurisdiction: San Pedro / Islands
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Social Reputation Score</span>
                  <span className="text-2xl font-bold text-emerald-400 font-mono">88 / 100</span>
                  <span className="text-[11px] text-teal-300 block font-semibold">Exemplary Standing</span>
                </div>
              </div>

              {/* SRS Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-800/80 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[11px] block">Network Fee Benefit</span>
                  <span className="font-bold text-teal-300 font-mono">-15% Substrate Tx Fee</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[11px] block">Quadratic Voting Weight</span>
                  <span className="font-bold text-cyan-300 font-mono">1.15x Elector Multiplier</span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[11px] block">Restorative Justice Juror</span>
                  <span className="font-bold text-amber-300 font-mono">Eligible on Docket</span>
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

            {/* District Delegates & Civic Stewards */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono mb-3 flex items-center gap-2">
                <UsersThree size={18} className="text-teal-400" weight="fill" />
                Respected District Delegates & Civic Stewards
              </h3>
              <div className="space-y-2">
                {districtDelegates.map((delegate) => (
                  <div
                    key={delegate.rank}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      delegate.isUser
                        ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                        : 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="flex items-center justify-center w-6 text-sm font-bold text-slate-500 font-mono">
                        #{delegate.rank}
                      </div>
                      <div className="flex items-center justify-center w-7">
                        {delegate.badgeIcon}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${delegate.isUser ? 'text-cyan-300' : 'text-white'}`}>
                          {delegate.name}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin size={11} className="text-teal-400" />
                          {delegate.district}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-mono block">Civic SRS</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">{delegate.srsScore} / 100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPost={handleCreatePost}
      />

      <CommentsModal
        isOpen={commentsModalData.isOpen}
        onClose={handleCloseComments}
        postId={commentsModalData.postId}
        postAuthor={commentsModalData.postAuthor}
        postContent={commentsModalData.postContent}
      />
    </div>
  );
}
