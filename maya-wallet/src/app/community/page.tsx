'use client';

import React, { useState } from 'react';
import { GlassCard, PostCard, ProposalCard, BadgeDisplay, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { useGovernanceProposalsSubscription } from '@/hooks/useBlockchainEvents';
import { CreatePostModal } from '@/components/CreatePostModal';
import { CommentsModal } from '@/components/CommentsModal';
import { useToast } from '@/contexts/ToastContext';
import {
  PencilSimple,
  ImageSquare,
  ChartBar,
  Medal,
  TrendUp,
  Fire
} from 'phosphor-react';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('feed');
  const liveProposals = useGovernanceProposalsSubscription();
  const { showToast } = useToast();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [commentsModalData, setCommentsModalData] = useState<{
    isOpen: boolean;
    postId: string;
    postAuthor: string;
    postContent: string;
  }>({
    isOpen: false,
    postId: '',
    postAuthor: '',
    postContent: '',
  });

  // Posts state
  const [posts, setPosts] = useState([
    {
      id: '1',
      author: {
        name: 'Maria Garcia',
        avatar: '👩🏽',
        district: 'Belize City'
      },
      content: 'Just completed my first PoUW cycle! Earned 50 DALLA for contributing to the federated learning network. This is amazing! 🎉',
      timestamp: '2h ago',
      likes: 24,
      comments: 8,
      shares: 3,
      type: 'community' as const
    },
    {
      id: '2',
      author: {
        name: 'John Martinez',
        avatar: '👨🏾',
        district: 'Orange Walk'
      },
      content: 'Proposal #42 for the new community center passed! Voting power: 1,250 DALLA. Democracy in action! 🗳️',
      timestamp: '5h ago',
      likes: 67,
      comments: 15,
      shares: 12,
      type: 'governance' as const
    },
    {
      id: '3',
      author: {
        name: 'Sarah Williams',
        avatar: '👩🏻',
        district: 'Cayo'
      },
      content: 'Planted 50 trees at the coastal restoration site today. Belize natural beauty is worth protecting! 🌴',
      timestamp: '1d ago',
      likes: 143,
      comments: 32,
      shares: 28,
      type: 'environment' as const
    }
  ]);

  // Handlers
  const handleCreatePost = (newPost: {
    content: string;
    type: 'community' | 'governance' | 'environment';
    district?: string;
  }) => {
    const post = {
      id: Date.now().toString(),
      author: {
        name: 'You',
        avatar: '😊',
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
      message: 'Post created successfully! 🎉',
    });
    setPosts([post, ...posts]);
  };

  const handleOpenComments = (postId: string, postAuthor: string, postContent: string) => {
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

  // Mock data - will be replaced with real blockchain queries
  const proposals = [
    {
      id: 42,
      title: 'Build Community Center in Orange Walk',
      district: 'Orange Walk',
      value: 50000,
      status: 'passed' as const,
      votesFor: 1250,
      votesAgainst: 340,
      deadline: 'Ended 2 days ago',
      href: '/proposal/42'
    },
    {
      id: 43,
      title: 'Increase Tourism Cashback to 10%',
      district: 'Belize City',
      value: 0,
      status: 'voting' as const,
      votesFor: 890,
      votesAgainst: 560,
      deadline: '3 days left',
      href: '/proposal/43'
    },
    {
      id: 44,
      title: 'Solar Panel Installation in Schools',
      district: 'Cayo',
      value: 75000,
      status: 'voting' as const,
      votesFor: 2100,
      votesAgainst: 450,
      deadline: '5 days left',
      href: '/proposal/44'
    }
  ];

  const badges = [
    {
      id: 'early-adopter',
      name: 'Early Adopter',
      icon: '🚀',
      description: 'Joined BelizeChain in the first month',
      rarity: 'legendary' as const,
      earned: true
    },
    {
      id: 'community-champion',
      name: 'Community Champion',
      icon: '👥',
      description: 'Participated in 50+ governance votes',
      rarity: 'epic' as const,
      earned: true
    },
    {
      id: 'eco-warrior',
      name: 'Eco Warrior',
      icon: '🌿',
      description: 'Planted 100 trees',
      rarity: 'rare' as const,
      earned: false
    },
    {
      id: 'validator',
      name: 'Validator',
      icon: '🛡️',
      description: 'Ran a validator node for 30 days',
      rarity: 'epic' as const,
      earned: false
    },
    {
      id: 'first-vote',
      name: 'First Vote',
      icon: '🗳️',
      description: 'Cast your first governance vote',
      rarity: 'common' as const,
      earned: true
    },
    {
      id: 'master-trader',
      name: 'Master Trader',
      icon: '💹',
      description: 'Complete 1000 trades on BelizeX',
      rarity: 'legendary' as const,
      earned: false
    }
  ];

  const rankings = [
    { rank: 1, name: 'Sarah Williams', avatar: '👩🏻', level: 42, xp: 12500, badge: '🏆' },
    { rank: 2, name: 'John Martinez', avatar: '👨🏾', level: 38, xp: 11200, badge: '🥈' },
    { rank: 3, name: 'Maria Garcia', avatar: '👩🏽', level: 35, xp: 10100, badge: '🥉' },
    { rank: 4, name: 'You', avatar: '😊', level: 28, xp: 7850, badge: '⭐' },
    { rank: 5, name: 'David Chen', avatar: '👨🏻', level: 24, xp: 6500, badge: '🌟' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24 font-sans">
      {/* Header */}
      <div className="relative overflow-hidden px-4 pt-6 pb-4">
        <div className="relative">
          <GlassCard variant="dark-medium" blur="lg" className="p-6 bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-emerald-800/40 border-emerald-700/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1 text-white">Community</h1>
                <p className="text-sm text-gray-400">Connect, Vote, Grow Together</p>
              </div>
              <button 
                onClick={() => setIsCreatePostOpen(true)}
                className="bg-emerald-600/20 hover:bg-emerald-600/30 px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 border border-emerald-500/30 text-white"
              >
                <PencilSimple size={20} weight="fill" />
                <span>New Post</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-3 border border-gray-700/30">
                <p className="text-xs mb-1 text-gray-400">Posts Today</p>
                <p className="text-lg font-bold text-white">247</p>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-3 border border-gray-700/30">
                <p className="text-xs mb-1 text-gray-400">Active Votes</p>
                <p className="text-lg font-bold text-white">12</p>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-3 border border-gray-700/30">
                <p className="text-xs mb-1 text-gray-400">Your Rank</p>
                <p className="text-lg font-bold text-white">#4</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6">
        <GlassCard variant="dark-medium" blur="lg" className="p-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-gray-800/50 rounded-xl p-1">
              <TabsTrigger 
                value="feed"
                className="flex-1 data-[state=active]:bg-emerald-500/100 data-[state=active]:text-white text-gray-400"
              >
                Feed
              </TabsTrigger>
              <TabsTrigger 
                value="governance"
                className="flex-1 data-[state=active]:bg-emerald-500/100 data-[state=active]:text-white text-gray-400"
              >
                Governance
              </TabsTrigger>
              <TabsTrigger 
                value="rankings"
                className="flex-1 data-[state=active]:bg-emerald-500/100 data-[state=active]:text-white text-gray-400"
              >
                Rankings
              </TabsTrigger>
            </TabsList>

            {/* Feed Tab */}
            <TabsContent value="feed" className="mt-4">
              <div className="space-y-3">
                {posts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post}
                    onComment={() => handleOpenComments(post.id, post.author.name, post.content)}
                    onShare={() => {
                      // TODO: Implement share functionality
                      console.log('Sharing post:', post.id);
                    }}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Governance Tab */}
            <TabsContent value="governance" className="mt-4">
              <div className="space-y-3">
                <GlassCard variant="dark-medium" blur="lg" className="p-4 bg-emerald-900/20 border-emerald-700/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <ChartBar size={20} className="text-emerald-400" weight="fill" />
                    <h3 className="font-semibold text-white">Your Voting Power</h3>
                  </div>
                  <p className="text-3xl font-bold text-emerald-400 mb-1">1,250 DALLA</p>
                  <p className="text-sm text-gray-400">District: Belize City</p>
                </GlassCard>

                {/* Live Proposals */}
                {liveProposals.length > 0 && (
                  <>
                    <div className="flex items-center space-x-2 mt-4 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500/100 animate-pulse" />
                      <p className="text-xs font-semibold text-gray-400">Live Proposals</p>
                    </div>
                    {liveProposals.map((proposal) => (
                      <ProposalCard
                        key={`live-${proposal.proposalIndex}`}
                        id={proposal.proposalIndex}
                        title={proposal.title}
                        district="On-Chain"
                        value={parseFloat(proposal.value)}
                        status="voting"
                        votesFor={0}
                        votesAgainst={0}
                        deadline="Live"
                      />
                    ))}
                  </>
                )}

                {/* Mock Proposals */}
                {proposals.map(proposal => (
                  <ProposalCard key={proposal.id} {...proposal} />
                ))}
              </div>
            </TabsContent>

            {/* Rankings Tab */}
            <TabsContent value="rankings" className="mt-4">
              {/* Badges Showcase */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Medal size={24} className="text-amber-500 mr-2" weight="fill" />
                  Your Badges
                </h3>
                <BadgeDisplay badges={badges} />
              </div>

              {/* Leaderboard */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Fire size={24} className="text-orange-500 mr-2" weight="fill" />
                  Top Citizens
                </h3>
                <div className="space-y-2">
                  {rankings.map(user => (
                    <GlassCard
                      key={user.rank}
                      variant="dark-medium"
                      blur="lg"
                      className={`p-4 ${
                        user.name === 'You' ? 'border-emerald-500/50 border-2 bg-emerald-900/10' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl font-bold text-gray-400 w-8">{user.badge}</div>
                          <div className="text-3xl">{user.avatar}</div>
                          <div>
                            <p className={`font-semibold ${user.name === 'You' ? 'text-emerald-400' : 'text-white'}`}>
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-400">Level {user.level}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">XP</p>
                          <p className="text-lg font-bold text-emerald-400">{user.xp.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {user.name === 'You' && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Level Progress</span>
                            <span>850/1000 XP to Level 29</span>
                          </div>
                          <div className="w-full bg-gray-700/50 rounded-full h-2">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full" style={{ width: '85%' }} />
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </GlassCard>
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
