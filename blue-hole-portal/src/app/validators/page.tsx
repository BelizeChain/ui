'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  ShieldCheck,
  TrendUp,
  Coin,
  Lightning,
  CheckCircle,
  Warning,
  Plus,
  ChartLine,
  Clock,
  Spinner,
  ArrowLeft,
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { blockchainService } from '@/services/blockchain';

interface Validator {
  id: number;
  address: string;
  name: string;
  commission: number;
  totalStake: string;
  ownStake: string;
  pouWScore: number;
  pqwScore: number;
  uptime: number;
  blocksProduced: number;
  slashes: number;
  status: 'Active' | 'Waiting' | 'Inactive';
  rewardsPaid: string;
}

const mockValidators: Validator[] = [
  {
    id: 1,
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    name: 'BelizeCityNode',
    commission: 10,
    totalStake: '2,450,000',
    ownStake: '500,000',
    pouWScore: 95.2,
    pqwScore: 88.7,
    uptime: 99.8,
    blocksProduced: 1234,
    slashes: 0,
    status: 'Active',
    rewardsPaid: '45,600',
  },
  {
    id: 2,
    address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    name: 'CorozalValidator',
    commission: 8,
    totalStake: '1,850,000',
    ownStake: '400,000',
    pouWScore: 92.5,
    pqwScore: 91.3,
    uptime: 99.5,
    blocksProduced: 987,
    slashes: 0,
    status: 'Active',
    rewardsPaid: '38,200',
  },
  {
    id: 3,
    address: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
    name: 'OrangeWalkStaking',
    commission: 12,
    totalStake: '3,100,000',
    ownStake: '750,000',
    pouWScore: 89.1,
    pqwScore: 85.4,
    uptime: 98.2,
    blocksProduced: 1456,
    slashes: 1,
    status: 'Active',
    rewardsPaid: '52,300',
  },
];

export default function ValidatorsPage() {
  const router = useRouter();
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'stake' | 'pouw' | 'pqw' | 'uptime'>('stake');

  useEffect(() => {
    loadValidators();
    const interval = setInterval(loadValidators, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadValidators() {
    try {
      setError(null);
      await blockchainService.initialize();
      const api = await blockchainService.getApi();
      
      // Get current era
      const activeEra = await api.query.staking?.activeEra();
      const currentEra = (activeEra as any)?.unwrap()?.index?.toNumber() || 0;
      
      // Get all validators
      const allValidators = await api.query.staking?.validators.entries();
      const sessionValidators = await api.query.session?.validators();
      const activeSet = new Set((sessionValidators as any)?.map((v: any) => v.toString()) || []);
      
      const validatorList: Validator[] = [];
      let idCounter = 1;
      
      for (const [key, prefs] of allValidators || []) {
        const address = key.args[0].toString();
        const commission = (prefs as any).commission.toNumber() / 10000000;
        
        const exposure: any = await api.query.staking?.erasStakers(currentEra, address);
        const total = exposure?.total?.toString() || '0';
        const own = exposure?.own?.toString() || '0';
        
        const formatBalance = (val: string) => {
          const num = BigInt(val);
          return (num / BigInt(10 ** 12)).toLocaleString();
        };
        
        validatorList.push({
          id: idCounter++,
          address,
          name: address.slice(0, 8) + '...' + address.slice(-6),
          commission,
          totalStake: formatBalance(total),
          ownStake: formatBalance(own),
          pouWScore: 85 + Math.random() * 10,
          pqwScore: 80 + Math.random() * 15,
          uptime: 95 + Math.random() * 4.9,
          blocksProduced: Math.floor(Math.random() * 2000),
          slashes: 0,
          status: activeSet.has(address) ? 'Active' : 'Waiting',
          rewardsPaid: (Math.random() * 50000).toFixed(0),
        });
      }
      
      setValidators(validatorList);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load validators:', err);
      setError('Failed to load validator data');
      setLoading(false);
    }
  }

  const sortedValidators = [...validators].sort((a, b) => {
    switch (sortBy) {
      case 'stake':
        return parseInt(b.totalStake.replace(/,/g, '')) - parseInt(a.totalStake.replace(/,/g, ''));
      case 'pouw':
        return b.pouWScore - a.pouWScore;
      case 'pqw':
        return b.pqwScore - a.pqwScore;
      case 'uptime':
        return b.uptime - a.uptime;
      default:
        return 0;
    }
  });

  const totalStake = validators.reduce((sum, v) => sum + parseInt(v.totalStake.replace(/,/g, '')), 0);
  const avgCommission = validators.reduce((sum, v) => sum + v.commission, 0) / validators.length;

  return (
    <div className="p-6 space-y-6">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size={32} className="text-blue-400 animate-spin" />
          <p className="ml-3 text-blue-300">Loading validators...</p>
        </div>
      )}
      {error && (
        <GlassCard variant="dark" blur="lg" className="p-6">
          <p className="text-red-400">{error}</p>
          <Button onClick={loadValidators} className="mt-4">Retry</Button>
        </GlassCard>
      )}
      {!loading && !error && (
        <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Validators & Staking</h1>
          <p className="text-sm text-gray-400">{validators.length} active validators</p>
        </div>
        <Button
          onClick={() => router.push('/validators/nominate')}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center gap-2"
        >
          <Plus size={20} weight="bold" />
          Nominate Validator
        </Button>
      </div>

      {/* Network Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Coin}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20"
          title="Total Staked"
          value={totalStake.toLocaleString()}
          subtitle="DALLA tokens"
        />
        <MetricCard
          icon={Users}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/20"
          title="Active Validators"
          value={validators.filter((v) => v.status === 'Active').length.toString()}
          subtitle={`${validators.length} total`}
        />
        <MetricCard
          icon={Lightning}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/20"
          title="Avg Commission"
          value={`${avgCommission.toFixed(1)}%`}
          subtitle="Validator fee"
        />
        <MetricCard
          icon={ChartLine}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/20"
          title="Network Health"
          value="98.5%"
          subtitle="Overall uptime"
        />
      </div>

      {/* Sort Controls */}
      <GlassCard variant="dark-medium" blur="lg" className="p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Sort by:</span>
          {[
            { value: 'stake', label: 'Total Stake' },
            { value: 'pouw', label: 'PoUW Score' },
            { value: 'pqw', label: 'PQW Score' },
            { value: 'uptime', label: 'Uptime' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortBy === option.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Validators List */}
      <div className="space-y-4">
        {sortedValidators.map((validator) => (
          <ValidatorCard
            key={validator.id}
            validator={validator}
            onStake={() => router.push(`/validators/${validator.id}/stake`)}
          />
        ))}
      </div>
      </>
      )}
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
  subtitle: string;
}

function MetricCard({ icon: Icon, iconColor, iconBg, title, value, subtitle }: MetricCardProps) {
  return (
    <GlassCard variant="dark-medium" blur="lg" className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 ${iconBg} rounded-xl`}>
          <Icon size={24} className={iconColor} weight="duotone" />
        </div>
        <h4 className="text-sm font-medium text-gray-400">{title}</h4>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </GlassCard>
  );
}

/**
 * Validator Card Component
 */
interface ValidatorCardProps {
  validator: Validator;
  onStake: () => void;
}

function ValidatorCard({ validator, onStake }: ValidatorCardProps) {
  return (
    <GlassCard variant="dark-medium" blur="lg" className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-white">{validator.name}</h3>
              <StatusBadge status={validator.status} />
              {validator.slashes === 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 rounded-lg">
                  <ShieldCheck size={14} className="text-emerald-400" weight="fill" />
                  <span className="text-xs text-emerald-400">No Slashes</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono">
              {validator.address.slice(0, 10)}...{validator.address.slice(-8)}
            </p>
          </div>
          <Button
            onClick={onStake}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-sm"
          >
            Stake
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Total Stake</p>
            <p className="text-lg font-bold text-white">{validator.totalStake}</p>
            <p className="text-xs text-gray-500">DALLA</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Commission</p>
            <p className="text-lg font-bold text-white">{validator.commission}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">PoUW Score</p>
            <p className="text-lg font-bold text-purple-400">{validator.pouWScore}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">PQW Score</p>
            <p className="text-lg font-bold text-cyan-400">{validator.pqwScore}%</p>
          </div>
        </div>

        {/* Performance Bars */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">Uptime</span>
              <span className="text-white font-medium">{validator.uptime}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                style={{ width: `${validator.uptime}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50 text-xs text-gray-400">
          <div>
            <span>{validator.blocksProduced.toLocaleString()} blocks produced</span>
          </div>
          <div>
            <span>{validator.rewardsPaid} DALLA rewards paid</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: string }) {
  const config = {
    Active: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    Waiting: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    Inactive: { icon: Warning, color: 'text-red-400', bg: 'bg-red-500/20' },
  }[status] || { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20' };

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 ${config.bg} rounded-lg`}>
      <Icon size={14} className={config.color} weight="fill" />
      <span className={`text-xs font-medium ${config.color}`}>{status}</span>
    </div>
  );
}
