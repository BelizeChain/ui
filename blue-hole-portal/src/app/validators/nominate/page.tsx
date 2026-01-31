'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MagnifyingGlass, ShieldCheck, Coin, TrendUp, 
  Warning, CheckCircle, Clock, Lightning
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/store/wallet';

interface Validator {
  address: string;
  name: string;
  commission: number; // Percentage
  totalStake: number; // DALLA
  ownStake: number; // DALLA
  pouwScore: number; // Percentage
  pqwScore: number; // Percentage
  uptime: number; // Percentage
  nominators: number;
  status: 'Active' | 'Waiting' | 'Inactive';
  estimatedApy: number; // Percentage
}

// Mock validators (same as validators page)
const MOCK_VALIDATORS: Validator[] = [
  {
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    name: 'BelizeCityNode',
    commission: 10,
    totalStake: 2450000,
    ownStake: 450000,
    pouwScore: 95.2,
    pqwScore: 88.7,
    uptime: 99.8,
    nominators: 142,
    status: 'Active',
    estimatedApy: 18.5,
  },
  {
    address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    name: 'CorozalValidator',
    commission: 8,
    totalStake: 1850000,
    ownStake: 350000,
    pouwScore: 92.5,
    pqwScore: 91.3,
    uptime: 99.5,
    nominators: 98,
    status: 'Active',
    estimatedApy: 19.2,
  },
  {
    address: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
    name: 'OrangeWalkStaking',
    commission: 12,
    totalStake: 3100000,
    ownStake: 600000,
    pouwScore: 89.1,
    pqwScore: 85.4,
    uptime: 98.2,
    nominators: 175,
    status: 'Active',
    estimatedApy: 17.8,
  },
];

const MIN_NOMINATION = 100; // 100 DALLA minimum
const MAX_NOMINATION = 1000000; // 1M DALLA maximum
const BOND_PERIOD = 28; // 28 days unbonding period

export default function NominatePage() {
  const router = useRouter();
  const { selectedAccount, balances } = useWalletStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(null);
  const [nominationAmount, setNominationAmount] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isNominating, setIsNominating] = useState(false);

  const availableBalance = parseFloat(balances.dalla) || 0;

  const filteredValidators = useMemo(() => {
    return MOCK_VALIDATORS.filter(v => 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.address.toLowerCase().includes(searchQuery.toLowerCase())
    ).filter(v => v.status === 'Active'); // Only show active validators
  }, [searchQuery]);

  const parsedAmount = parseFloat(nominationAmount) || 0;
  const estimatedRewards = selectedValidator 
    ? (parsedAmount * (selectedValidator.estimatedApy / 100))
    : 0;

  const isValidAmount = parsedAmount >= MIN_NOMINATION && 
                        parsedAmount <= MAX_NOMINATION && 
                        parsedAmount <= availableBalance;

  const handleNominate = async () => {
    if (!selectedValidator || !isValidAmount) return;
    
    setIsNominating(true);
    // TODO: Integrate with blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    router.push('/validators?nominated=true');
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
              <h1 className="text-xl font-bold text-white">Nominate Validator</h1>
              <p className="text-xs text-gray-400">Stake DALLA and earn rewards</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-lg">
            <Coin size={16} className="text-emerald-400" weight="fill" />
            <span className="text-xs font-medium text-emerald-300">
              {availableBalance.toLocaleString()} DALLA available
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Validator Selection */}
          <div className="space-y-6">
            <GlassCard variant="dark-medium" blur="lg" className="p-6">
              <h2 className="text-lg font-bold text-white mb-4">Select Validator</h2>
              
              {/* Search */}
              <div className="relative mb-4">
                <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or address..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Validator List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredValidators.map((validator) => (
                  <button
                    key={validator.address}
                    onClick={() => setSelectedValidator(validator)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedValidator?.address === validator.address
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-white">{validator.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{validator.address.slice(0, 12)}...</p>
                      </div>
                      {selectedValidator?.address === validator.address && (
                        <CheckCircle size={20} className="text-blue-400" weight="fill" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Commission</p>
                        <p className="font-semibold text-white">{validator.commission}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">APY</p>
                        <p className="font-semibold text-emerald-400">{validator.estimatedApy}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Uptime</p>
                        <p className="font-semibold text-white">{validator.uptime}%</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Right: Nomination Form */}
          <div className="space-y-6">
            {selectedValidator ? (
              <>
                {/* Selected Validator Details */}
                <GlassCard variant="dark-medium" blur="lg" className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <ShieldCheck size={24} className="text-blue-400" weight="duotone" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{selectedValidator.name}</h3>
                      <p className="text-xs text-gray-400">Selected Validator</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Stake</p>
                      <p className="text-sm font-semibold text-white">
                        {(selectedValidator.totalStake / 1000000).toFixed(2)}M DALLA
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Nominators</p>
                      <p className="text-sm font-semibold text-white">{selectedValidator.nominators}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">PoUW Score</p>
                      <p className="text-sm font-semibold text-purple-400">{selectedValidator.pouwScore}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">PQW Score</p>
                      <p className="text-sm font-semibold text-cyan-400">{selectedValidator.pqwScore}%</p>
                    </div>
                  </div>
                </GlassCard>

                {/* Nomination Amount */}
                <GlassCard variant="dark-medium" blur="lg" className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Nomination Amount</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Amount (DALLA)
                      </label>
                      <input
                        type="number"
                        value={nominationAmount}
                        onChange={(e) => setNominationAmount(e.target.value)}
                        placeholder="0.00"
                        min={MIN_NOMINATION}
                        max={Math.min(MAX_NOMINATION, availableBalance)}
                        step="0.01"
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          Min: {MIN_NOMINATION.toLocaleString()} DALLA
                        </p>
                        <button
                          onClick={() => setNominationAmount(Math.min(availableBalance, MAX_NOMINATION).toString())}
                          className="text-xs font-medium text-blue-400 hover:text-blue-300"
                        >
                          Use Max
                        </button>
                      </div>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {[1000, 5000, 10000, 50000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setNominationAmount(amount.toString())}
                          disabled={amount > availableBalance}
                          className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs font-medium text-gray-300 hover:border-blue-500 hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {amount >= 1000 ? `${amount / 1000}K` : amount}
                        </button>
                      ))}
                    </div>

                    {/* Estimated Rewards */}
                    {parsedAmount > 0 && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendUp size={16} className="text-emerald-400" weight="bold" />
                          <span className="text-xs font-medium text-emerald-300">Estimated Annual Rewards</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-400">
                          {estimatedRewards.toLocaleString(undefined, { maximumFractionDigits: 2 })} DALLA
                        </p>
                        <p className="text-xs text-emerald-300/70 mt-1">
                          ~{selectedValidator.estimatedApy}% APY after {selectedValidator.commission}% commission
                        </p>
                      </div>
                    )}

                    {/* Validation Errors */}
                    {parsedAmount > 0 && !isValidAmount && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-2">
                        <Warning size={16} className="text-red-400 flex-shrink-0 mt-0.5" weight="fill" />
                        <div className="text-xs text-red-300">
                          {parsedAmount < MIN_NOMINATION && `Minimum nomination is ${MIN_NOMINATION} DALLA`}
                          {parsedAmount > MAX_NOMINATION && `Maximum nomination is ${MAX_NOMINATION.toLocaleString()} DALLA`}
                          {parsedAmount > availableBalance && 'Insufficient balance'}
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>

                {/* Important Information */}
                <GlassCard variant="dark-medium" blur="lg" className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={20} className="text-amber-400" weight="fill" />
                    <h4 className="text-sm font-bold text-white">Important Information</h4>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-400">
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      <span>Unbonding period: <strong className="text-white">{BOND_PERIOD} days</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      <span>Rewards are automatically compounded and paid every era (~24 hours)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      <span>You can nominate up to 16 validators simultaneously</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      <span>Slashing may occur if validator misbehaves (rare)</span>
                    </li>
                  </ul>
                </GlassCard>

                {/* Nominate Button */}
                <Button
                  onClick={() => setShowConfirmation(true)}
                  disabled={!selectedAccount || !isValidAmount || !parsedAmount}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 py-4"
                  size="lg"
                >
                  <Lightning size={20} weight="fill" />
                  Nominate {parsedAmount > 0 && `${parsedAmount.toLocaleString()} DALLA`}
                </Button>
              </>
            ) : (
              <GlassCard variant="dark-medium" blur="lg" className="p-12">
                <div className="text-center">
                  <ShieldCheck size={48} className="text-gray-600 mx-auto mb-3" weight="duotone" />
                  <p className="text-sm font-medium text-gray-500">Select a validator to continue</p>
                  <p className="text-xs text-gray-600 mt-1">Choose from {filteredValidators.length} active validators</p>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedValidator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassCard variant="dark-medium" blur="lg" className="max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Nomination</h3>
            
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Validator</p>
                <p className="text-sm font-semibold text-white">{selectedValidator.name}</p>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Nomination Amount</p>
                <p className="text-lg font-bold text-emerald-400">{parsedAmount.toLocaleString()} DALLA</p>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Estimated Annual Rewards</p>
                <p className="text-base font-semibold text-white">{estimatedRewards.toLocaleString(undefined, { maximumFractionDigits: 2 })} DALLA</p>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-6">
              <p className="text-xs text-amber-300">
                <strong>Note:</strong> Your DALLA will be locked for {BOND_PERIOD} days. Unbonding requires waiting period before funds can be withdrawn.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmation(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleNominate}
                disabled={isNominating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isNominating ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
