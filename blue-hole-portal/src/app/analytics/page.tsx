'use client';

import { useState, useMemo } from 'react';
import {
  ChartLine,
  TrendUp,
  TrendDown,
  Coin,
  Users,
  Globe,
  Lightning,
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { useBlockchain } from '@/lib/blockchain/hooks';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface AnalyticsMetrics {
  gdp: { value: string; change: number };
  tourism: { value: string; change: number };
  validators: { value: number; change: number };
  transactions: { value: string; change: number };
}

const mockMetrics: AnalyticsMetrics = {
  gdp: { value: '4.2B', change: 3.8 },
  tourism: { value: '890M', change: 15.2 },
  validators: { value: 42, change: 12.5 },
  transactions: { value: '1.2M', change: 8.3 },
};

// Generate chart data based on timeframe
const generateTreasuryData = (timeframe: string) => {
  const points = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
  return Array.from({ length: points }, (_, i) => ({
    date: new Date(Date.now() - (points - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    DALLA: 12000000 + Math.random() * 1000000,
    bBZD: 8000000 + Math.random() * 500000,
  }));
};

const generateNetworkData = (timeframe: string) => {
  const points = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
  return Array.from({ length: points }, (_, i) => ({
    date: new Date(Date.now() - (points - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    transactions: 25000 + Math.random() * 15000,
    blocks: 8000 + Math.random() * 2000,
  }));
};

const generateEconomicData = (timeframe: string) => {
  const points = timeframe === '7d' ? 7 : timeframe === '30d' ? 12 : timeframe === '90d' ? 12 : 12;
  return Array.from({ length: points }, (_, i) => ({
    month: new Date(Date.now() - (points - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
    gdp: 4.0 + Math.random() * 0.5,
    tourism: 800 + Math.random() * 150,
    tax: 120 + Math.random() * 30,
  }));
};

const generateValidatorData = () => {
  return [
    { range: '90-100%', pouw: 12, pqw: 8 },
    { range: '80-89%', pouw: 18, pqw: 15 },
    { range: '70-79%', pouw: 8, pqw: 12 },
    { range: '60-69%', pouw: 4, pqw: 7 },
  ];
};

export default function AnalyticsPage() {
  const { isReady } = useBlockchain();
  const [metrics] = useState(mockMetrics);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const treasuryData = useMemo(() => generateTreasuryData(timeframe), [timeframe]);
  const networkData = useMemo(() => generateNetworkData(timeframe), [timeframe]);
  const economicData = useMemo(() => generateEconomicData(timeframe), [timeframe]);
  const validatorData = useMemo(() => generateValidatorData(), []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">National Analytics</h1>
          <p className="text-sm text-gray-400">Economic metrics & network statistics</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timeframe === period
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={ChartLine}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20"
          title="GDP Growth"
          value={metrics.gdp.value}
          change={metrics.gdp.change}
          changeLabel="vs last quarter"
        />
        <MetricCard
          icon={Globe}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/20"
          title="Tourism Revenue"
          value={metrics.tourism.value}
          change={metrics.tourism.change}
          changeLabel="vs last quarter"
        />
        <MetricCard
          icon={Users}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/20"
          title="Active Validators"
          value={metrics.validators.value.toString()}
          change={metrics.validators.change}
          changeLabel="vs last month"
        />
        <MetricCard
          icon={Lightning}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/20"
          title="Transactions"
          value={metrics.transactions.value}
          change={metrics.transactions.change}
          changeLabel="vs last month"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Treasury Balance Trend */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <Coin size={24} className="text-emerald-400" weight="duotone" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Treasury Balance Trend</h3>
              <p className="text-xs text-gray-400">DALLA & bBZD over time</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={treasuryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickFormatter={(value) => timeframe === '1y' ? value.split(' ')[0] : value}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#F3F4F6' }}
                formatter={(value: number) => `${(value / 1000000).toFixed(2)}M`}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="DALLA" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={false}
                name="DALLA Balance"
              />
              <Line 
                type="monotone" 
                dataKey="bBZD" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
                name="bBZD Balance"
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Network Activity */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Lightning size={24} className="text-blue-400" weight="duotone" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Network Activity</h3>
              <p className="text-xs text-gray-400">Transactions & Block Production</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={networkData}>
              <defs>
                <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBlocks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF" 
                fontSize={12}
                tickFormatter={(value) => timeframe === '1y' ? value.split(' ')[0] : value}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#F3F4F6' }}
                formatter={(value: number) => value.toLocaleString()}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <Area 
                type="monotone" 
                dataKey="transactions" 
                stroke="#3B82F6" 
                fillOpacity={1}
                fill="url(#colorTx)"
                name="Daily Transactions"
              />
              <Area 
                type="monotone" 
                dataKey="blocks" 
                stroke="#8B5CF6" 
                fillOpacity={1}
                fill="url(#colorBlocks)"
                name="Blocks Produced"
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Economic Indicators */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <ChartLine size={24} className="text-amber-400" weight="duotone" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Economic Indicators</h3>
              <p className="text-xs text-gray-400">GDP, Tourism, Tax Revenue</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={economicData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                stroke="#9CA3AF" 
                fontSize={12}
              />
              <YAxis 
                yAxisId="left"
                stroke="#9CA3AF" 
                fontSize={12}
                tickFormatter={(value) => `${value}B`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#9CA3AF" 
                fontSize={12}
                tickFormatter={(value) => `${value}M`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#F3F4F6' }}
                formatter={(value: number, name: string) => {
                  if (name === 'GDP') return `$${value.toFixed(1)}B`;
                  return `$${value.toFixed(0)}M`;
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="gdp" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ r: 4 }}
                name="GDP"
              />
              <Bar 
                yAxisId="right"
                dataKey="tourism" 
                fill="#3B82F6"
                name="Tourism Revenue"
              />
              <Bar 
                yAxisId="right"
                dataKey="tax" 
                fill="#F59E0B"
                name="Tax Collection"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Validator Performance */}
        <GlassCard variant="dark-medium" blur="lg" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Users size={24} className="text-purple-400" weight="duotone" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Validator Performance</h3>
              <p className="text-xs text-gray-400">PoUW & PQW Score Distribution</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={validatorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="range" 
                stroke="#9CA3AF" 
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF" 
                fontSize={12}
                label={{ value: 'Validators', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#F3F4F6' }}
                formatter={(value: number) => `${value} validators`}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              <Bar 
                dataKey="pouw" 
                fill="#A855F7"
                radius={[4, 4, 0, 0]}
                name="PoUW Score"
              />
              <Bar 
                dataKey="pqw" 
                fill="#06B6D4"
                radius={[4, 4, 0, 0]}
                name="PQW Score"
              />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}

/**
 * Metric Card Component
 */
interface MetricCardProps {
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  value: string;
  change: number;
  changeLabel: string;
}

function MetricCard({ icon: Icon, iconColor, iconBg, title, value, change, changeLabel }: MetricCardProps) {
  return (
    <GlassCard variant="dark-medium" blur="lg" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 ${iconBg} rounded-xl`}>
          <Icon size={24} className={iconColor} weight="duotone" />
        </div>
        <h4 className="text-sm font-medium text-gray-400">{title}</h4>
      </div>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      <div className="flex items-center gap-2">
        {change >= 0 ? (
          <TrendUp size={16} className="text-emerald-400" weight="bold" />
        ) : (
          <TrendDown size={16} className="text-red-400" weight="bold" />
        )}
        <span className={`text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
        <span className="text-xs text-gray-500">{changeLabel}</span>
      </div>
    </GlassCard>
  );
}
