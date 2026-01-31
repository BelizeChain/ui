'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Leaf, TrendUp, Users, CalendarBlank, CheckCircle } from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { 
  getGreenProjects, 
  contributeToGreenProject,
  getProjectContributors,
  type GreenProject
} from '@/services/pallets/community';
import { useWallet } from '@/contexts/WalletContext';

export default function SustainabilityPage() {
  const router = useRouter();
  const { selectedAccount } = useWallet();
  const [projects, setProjects] = useState<GreenProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<GreenProject | null>(null);
  const [contributors, setContributors] = useState<Array<{ address: string; amount: string; timestamp: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [contributing, setContributing] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const projectsData = await getGreenProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load green projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContributors = async (projectId: number) => {
    try {
      const contributorsData = await getProjectContributors(projectId);
      setContributors(contributorsData);
    } catch (error) {
      console.error('Failed to load contributors:', error);
    }
  };

  const handleViewProject = async (project: GreenProject) => {
    setSelectedProject(project);
    await loadContributors(project.projectId);
  };

  const handleContribute = async () => {
    if (!selectedAccount || !selectedProject || !contributionAmount) return;
    
    setContributing(true);
    try {
      const result = await contributeToGreenProject(
        selectedAccount.address,
        selectedProject.projectId,
        contributionAmount
      );
      
      alert(`Contribution successful! New total: ${result.newTotal} DALLA`);
      setContributionAmount('');
      await loadProjects();
      await loadContributors(selectedProject.projectId);
    } catch (error) {
      console.error('Contribution failed:', error);
      alert('Contribution failed. Please try again.');
    } finally {
      setContributing(false);
    }
  };

  const getProgressPercentage = (project: GreenProject): number => {
    const current = parseFloat(project.currentFunding);
    const target = parseFloat(project.targetFunding);
    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Conservation': 'text-blue-400',
      'Renewable Energy': 'text-yellow-400',
      'Waste Management': 'text-green-400',
      'Reforestation': 'text-emerald-400',
      'Water Conservation': 'text-cyan-400',
    };
    return colors[category] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
        <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <h1 className="text-xl font-bold text-white">Green Projects</h1>
          </div>
        </div>
        <div className="p-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading green projects...</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{selectedProject.name}</h1>
              <p className="text-xs text-gray-400">{selectedProject.category}</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Project Details */}
          <GlassCard variant="dark-medium" blur="lg" className="p-6">
            <p className="text-gray-300 mb-6">{selectedProject.description}</p>
            
            {/* Funding Progress */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Funding Progress</span>
                <span className="text-sm font-semibold text-white">
                  {selectedProject.currentFunding} / {selectedProject.targetFunding} DALLA
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-3 rounded-full transition-all"
                  style={{ width: `${getProgressPercentage(selectedProject)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {getProgressPercentage(selectedProject).toFixed(1)}% funded
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-purple-400" />
                <div>
                  <div className="text-sm text-gray-400">Contributors</div>
                  <div className="text-lg font-bold text-white">{selectedProject.contributorCount}</div>
                </div>
              </div>
              {selectedProject.deadline && (
                <div className="flex items-center gap-2">
                  <CalendarBlank size={20} className="text-blue-400" />
                  <div>
                    <div className="text-sm text-gray-400">Deadline</div>
                    <div className="text-sm font-semibold text-white">
                      {new Date(selectedProject.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Milestones */}
            {selectedProject.milestones && selectedProject.milestones.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-3">Milestones</h3>
                <div className="space-y-2">
                  {selectedProject.milestones.map((milestone, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <CheckCircle 
                        size={20} 
                        className={milestone.achieved ? 'text-green-400' : 'text-gray-600'} 
                        weight={milestone.achieved ? 'fill' : 'regular'}
                      />
                      <div className="flex-1">
                        <div className="text-sm text-white">{milestone.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Target: {milestone.targetAmount} DALLA
                          {milestone.achievedAt && ` • Achieved ${new Date(milestone.achievedAt).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Contribution Form */}
          {selectedProject.isActive && selectedAccount && (
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Make a Contribution</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Amount (DALLA)</label>
                  <input
                    type="number"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                <button
                  onClick={handleContribute}
                  disabled={contributing || !contributionAmount || parseFloat(contributionAmount) <= 0}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {contributing ? 'Contributing...' : 'Contribute Now'}
                </button>
              </div>
            </GlassCard>
          )}

          {/* Top Contributors */}
          <GlassCard variant="dark-medium" blur="lg" className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Top Contributors</h3>
            {contributors.length === 0 ? (
              <p className="text-gray-400 text-sm">No contributors yet. Be the first!</p>
            ) : (
              <div className="space-y-3">
                {contributors.slice(0, 10).map((contributor, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-sm text-white font-mono">
                          {contributor.address.slice(0, 8)}...{contributor.address.slice(-6)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(contributor.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-green-400">
                      {contributor.amount} DALLA
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Green Projects</h1>
              <p className="text-xs text-gray-400">Support Belize's Sustainability</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Leaf size={32} className="text-green-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Impact Stats */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Total Impact</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {projects.length}
              </div>
              <div className="text-xs text-gray-400 mt-1">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {projects.reduce((sum, p) => sum + parseFloat(p.currentFunding), 0).toFixed(0)}
              </div>
              <div className="text-xs text-gray-400 mt-1">DALLA Raised</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {projects.reduce((sum, p) => sum + p.contributorCount, 0)}
              </div>
              <div className="text-xs text-gray-400 mt-1">Contributors</div>
            </div>
          </div>
        </GlassCard>

        {/* Projects List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white px-2">Active Projects</h2>
          
          {projects.length === 0 ? (
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <div className="text-center py-8">
                <Leaf size={48} className="text-gray-600 mx-auto mb-3" weight="duotone" />
                <p className="text-gray-400">No green projects available yet</p>
              </div>
            </GlassCard>
          ) : (
            projects.map(project => {
              const progress = getProgressPercentage(project);
              
              return (
                <GlassCard 
                  key={project.projectId} 
                  variant="dark-medium" 
                  blur="lg" 
                  className="p-5 cursor-pointer hover:bg-gray-800/60 transition-colors"
                  onClick={() => handleViewProject(project)}
                >
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{project.name}</h3>
                      <p className={`text-sm font-semibold ${getCategoryColor(project.category)}`}>
                        {project.category}
                      </p>
                    </div>
                    <TrendUp size={24} className="text-green-400 ml-3" weight="duotone" />
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-gray-400">Progress</span>
                      <span className="text-xs font-semibold text-white">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-purple-400" />
                      <span className="text-gray-300">{project.contributorCount} contributors</span>
                    </div>
                    <div className="text-green-400 font-bold">
                      {project.currentFunding} / {project.targetFunding} DALLA
                    </div>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
