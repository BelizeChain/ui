'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Cube, TrendUp, Coins, Users, CheckCircle, Warning, Calendar, ChartBar } from 'phosphor-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GlassCard } from '@/components/ui/glass-card';
import { useStaking } from '@/hooks/useStaking';
import { useSystem } from '@/hooks/useSystem';
import { useState, useMemo } from 'react';

interface ValidatorDetailPageProps {
  params: { address: string };
}

export default function ValidatorDetailPage({ params }: ValidatorDetailPageProps) {
  const router = useRouter();
  const { validators, isLoading } = useStaking();
  const { systemInfo } = useSystem();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Find validator by address
  const validator = useMemo(() => 
    validators.find(v => v.address === params.address),
    [validators, params.address]
  );

  // Mock historical data for charts (in production, fetch from blockchain)
  const performanceData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      blocks: Math.floor(Math.random() * 50) + 100,
      uptime: 95 + Math.random() * 5,
      pouwScore: 70 + Math.random() * 30,
      pqwScore: 65 + Math.random() * 35,
    }));
  }, [timeRange]);

  const commissionHistory = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
      commission: validator ? validator.commission + (Math.random() - 0.5) * 2 : 10,
    }));
  }, [validator]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading validator details...</p>
        </div>
      </div>
    );
  }

  if (!validator) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <GlassCard variant="dark-medium" blur="lg" className="p-8 max-w-md">
          <Warning size={48} className="text-red-400 mx-auto mb-4" weight="duotone" />
          <h1 className="text-xl font-bold text-white text-center mb-2">Validator Not Found</h1>
          <p className="text-gray-400 text-center mb-6">
            The validator address could not be found on the network.
          </p>
          <button
            onClick={() => router.push('/validators')}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all"
          >
            Back to Validators
          </button>
        </GlassCard>
      </div>
    );
  }

  const formatDALLA = (amount: bigint): string => {
    const value = Number(amount) / 1e12;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Validator Details</h1>
              <p className="text-xs text-gray-400">{validator.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {validator.status === 'Active' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                <CheckCircle size={16} className="text-emerald-400" weight="fill" />
                <span className="text-xs font-medium text-emerald-400">Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-500/20 border border-gray-500/30 rounded-lg">
                <span className="text-xs font-medium text-gray-400">{validator.status}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Validator Overview */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Coins size={20} className="text-blue-400" weight="duotone" />
                <p className="text-xs text-gray-400">Total Stake</p>
              </div>
              <p className="text-2xl font-bold text-white">{formatDALLA(validator.totalStake)}</p>
              <p className="text-xs text-gray-400 mt-1">DALLA</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users size={20} className="text-emerald-400" weight="duotone" />
                <p className="text-xs text-gray-400">Nominators</p>
              </div>
              <p className="text-2xl font-bold text-white">{validator.nominatorsCount}</p>
              <p className="text-xs text-gray-400 mt-1">Active</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendUp size={20} className="text-purple-400" weight="duotone" />
                <p className="text-xs text-gray-400">Estimated APY</p>
              </div>
              <p className="text-2xl font-bold text-white">{validator.estimatedApy.toFixed(2)}%</p>
              <p className="text-xs text-gray-400 mt-1">Annual Return</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Cube size={20} className="text-amber-400" weight="duotone" />
                <p className="text-xs text-gray-400">Blocks Produced</p>
              </div>
              <p className="text-2xl font-bold text-white">{validator.blocksProduced.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">This Era</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Commission</p>
              <p className="text-xl font-bold text-white">{validator.commission.toFixed(2)}%</p>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">PoUW Score</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-white">{validator.pouwScore}</p>
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                    style={{ width: `${validator.pouwScore}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">PQW Score</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-white">{validator.pqwScore}</p>
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                    style={{ width: `${validator.pqwScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Performance Charts */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Performance History</h2>
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Blocks Produced */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Blocks Produced</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="blocksGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Area type="monotone" dataKey="blocks" stroke="#3b82f6" fillOpacity={1} fill="url(#blocksGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Uptime & Scores */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Uptime & Contribution Scores</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={2} name="Uptime %" />
                  <Line type="monotone" dataKey="pouwScore" stroke="#3b82f6" strokeWidth={2} name="PoUW Score" />
                  <Line type="monotone" dataKey="pqwScore" stroke="#a855f7" strokeWidth={2} name="PQW Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Commission History */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Commission History</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={commissionHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Bar dataKey="commission" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* Validator Information */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Validator Information</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
              <span className="text-sm text-gray-400">Address</span>
              <span className="text-sm text-white font-mono">{validator.address}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
              <span className="text-sm text-gray-400">Own Stake</span>
              <span className="text-sm text-white">{formatDALLA(validator.ownStake)} DALLA</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
              <span className="text-sm text-gray-400">Uptime</span>
              <span className="text-sm text-white">{validator.uptime.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
              <span className="text-sm text-gray-400">Slashes</span>
              <span className="text-sm text-white">{validator.slashes}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-400">Current Block</span>
              <span className="text-sm text-white">#{systemInfo?.blockNumber.toLocaleString()}</span>
            </div>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/validators/nominate?validator=${validator.address}`)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all"
          >
            Nominate Validator
          </button>
          <button
            onClick={() => router.push('/validators')}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
          >
            Back to Validators
          </button>
        </div>
      </div>
    </div>
  );
}
