'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, GraduationCap, Trophy, Clock, Users, CheckCircle } from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { 
  getEducationModules, 
  getUserEducationProgress, 
  completeEducationModule,
  type EducationModule,
  type UserEducationProgress
} from '@/services/pallets/community';
import { useWallet } from '@/contexts/WalletContext';

export default function EducationModulesPage() {
  const router = useRouter();
  const { selectedAccount } = useWallet();
  const [modules, setModules] = useState<EducationModule[]>([]);
  const [userProgress, setUserProgress] = useState<UserEducationProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedAccount]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modulesData, progressData] = await Promise.all([
        getEducationModules(),
        selectedAccount ? getUserEducationProgress(selectedAccount.address) : Promise.resolve([])
      ]);
      
      setModules(modulesData);
      setUserProgress(progressData);
    } catch (error) {
      console.error('Failed to load education data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteModule = async (moduleId: number) => {
    if (!selectedAccount) return;
    
    setCompleting(moduleId);
    try {
      const result = await completeEducationModule(selectedAccount.address, moduleId);
      alert(`Module completed! Earned ${result.rewardAmount} DALLA`);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to complete module:', error);
      alert('Failed to complete module. Please try again.');
    } finally {
      setCompleting(null);
    }
  };

  const getModuleProgress = (moduleId: number): UserEducationProgress | undefined => {
    return userProgress.find(p => p.moduleId === moduleId);
  };

  const getModuleStatus = (module: EducationModule) => {
    const progress = getModuleProgress(module.moduleId);
    
    if (!progress) return { status: 'Not Started', color: 'text-gray-400' };
    if (progress.completedAt) return { status: 'Completed', color: 'text-green-400' };
    if (progress.progress > 0) return { status: `${progress.progress}% Complete`, color: 'text-blue-400' };
    return { status: 'In Progress', color: 'text-yellow-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
        <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <h1 className="text-xl font-bold text-white">Education Modules</h1>
          </div>
        </div>
        <div className="p-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading education modules...</p>
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-white">Education Modules</h1>
              <p className="text-xs text-gray-400">Learn & Earn DALLA Rewards</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GraduationCap size={32} className="text-blue-400" weight="duotone" />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Your Progress</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {userProgress.filter(p => p.completedAt).length}
              </div>
              <div className="text-xs text-gray-400 mt-1">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {userProgress.filter(p => !p.completedAt && p.progress > 0).length}
              </div>
              <div className="text-xs text-gray-400 mt-1">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {userProgress.filter(p => p.rewardClaimed).reduce((sum, p) => {
                  const module = modules.find(m => m.moduleId === p.moduleId);
                  return sum + (module ? parseFloat(module.rewardAmount) : 0);
                }, 0).toFixed(0)}
              </div>
              <div className="text-xs text-gray-400 mt-1">DALLA Earned</div>
            </div>
          </div>
        </GlassCard>

        {/* Education Modules List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white px-2">Available Modules</h2>
          
          {modules.length === 0 ? (
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <div className="text-center py-8">
                <GraduationCap size={48} className="text-gray-600 mx-auto mb-3" weight="duotone" />
                <p className="text-gray-400">No education modules available yet</p>
              </div>
            </GlassCard>
          ) : (
            modules.map(module => {
              const progress = getModuleProgress(module.moduleId);
              const { status, color } = getModuleStatus(module);
              const isCompleted = progress?.completedAt !== undefined;
              const canComplete = progress && progress.progress === 100 && !isCompleted;

              return (
                <GlassCard key={module.moduleId} variant="dark-medium" blur="lg" className="p-5">
                  {/* Module Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{module.title}</h3>
                      <p className="text-sm text-gray-400">{module.description}</p>
                    </div>
                    {isCompleted && (
                      <CheckCircle size={24} className="text-green-400 ml-3" weight="fill" />
                    )}
                  </div>

                  {/* Module Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-yellow-400" />
                      <span className="text-sm text-gray-300">{module.rewardAmount} DALLA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-400" />
                      <span className="text-sm text-gray-300">{module.estimatedDuration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-purple-400" />
                      <span className="text-sm text-gray-300">
                        {module.currentParticipants}/{module.maxParticipants} enrolled
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-semibold ${color}`}>{status}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {progress && !isCompleted && (
                    <div className="mb-4">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {!progress && module.isActive && (
                      <button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        onClick={() => alert('Module enrollment coming soon!')}
                      >
                        Start Module
                      </button>
                    )}
                    
                    {canComplete && (
                      <button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        onClick={() => handleCompleteModule(module.moduleId)}
                        disabled={completing === module.moduleId}
                      >
                        {completing === module.moduleId ? 'Claiming...' : 'Claim Reward'}
                      </button>
                    )}

                    {progress && !canComplete && !isCompleted && (
                      <button
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        onClick={() => alert('Continue module functionality coming soon!')}
                      >
                        Continue
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        className="flex-1 bg-gray-700 text-gray-400 font-semibold py-2 px-4 rounded-lg cursor-not-allowed"
                        disabled
                      >
                        Completed
                      </button>
                    )}
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
