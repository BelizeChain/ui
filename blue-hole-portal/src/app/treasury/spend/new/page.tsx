'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, CheckCircle, Coin, Users, FileText, Warning, 
  Upload, X, Plus, CalendarBlank, ShieldCheck
} from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/store/wallet';

type StepType = 'details' | 'beneficiary' | 'approvers' | 'preview';

interface SpendProposal {
  title: string;
  description: string;
  amount: string;
  currency: 'DALLA' | 'bBZD';
  category: 'Infrastructure' | 'Social' | 'Economic' | 'Emergency';
  beneficiary: {
    name: string;
    address: string;
    type: 'Individual' | 'Organization' | 'Ministry';
  };
  approvers: string[];
  documents: File[];
  expiresIn: number; // days
}

const CATEGORIES = ['Infrastructure', 'Social', 'Economic', 'Emergency'] as const;
const BENEFICIARY_TYPES = ['Individual', 'Organization', 'Ministry'] as const;

// Mock Foundation Board members (7 total, 4/7 required for approval)
const BOARD_MEMBERS = [
  { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', name: 'Founder', role: 'Founder & CEO' },
  { address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', name: 'Tech Steward', role: 'CTO' },
  { address: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y', name: 'FSC Rep', role: 'FSC Representative' },
  { address: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy', name: 'BTB Rep', role: 'Tourism Board' },
  { address: '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw', name: 'Citizen Rep', role: 'Citizen Representative' },
  { address: '5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL', name: 'Auditor', role: 'National Auditor' },
  { address: '5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc', name: 'Culture Rep', role: 'Cultural Affairs' },
];

export default function NewSpendProposalPage() {
  const router = useRouter();
  const { selectedAccount } = useWalletStore();
  const [currentStep, setCurrentStep] = useState<StepType>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [proposal, setProposal] = useState<SpendProposal>({
    title: '',
    description: '',
    amount: '',
    currency: 'DALLA',
    category: 'Infrastructure',
    beneficiary: {
      name: '',
      address: '',
      type: 'Organization',
    },
    approvers: [],
    documents: [],
    expiresIn: 30,
  });

  const steps: { id: StepType; label: string; icon: any }[] = [
    { id: 'details', label: 'Proposal Details', icon: FileText },
    { id: 'beneficiary', label: 'Beneficiary Info', icon: Users },
    { id: 'approvers', label: 'Multi-Sig Approvers', icon: ShieldCheck },
    { id: 'preview', label: 'Review & Submit', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // TODO: Integrate with blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    router.push('/treasury?submitted=true');
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 'details':
        return proposal.title && proposal.description && proposal.amount && parseFloat(proposal.amount) > 0;
      case 'beneficiary':
        return proposal.beneficiary.name && proposal.beneficiary.address;
      case 'approvers':
        return proposal.approvers.length >= 4; // Minimum 4/7 required
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl px-6 py-4 z-10 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBack} 
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-300" weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">New Treasury Spend Proposal</h1>
              <p className="text-xs text-gray-400">Multi-step proposal creation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-blue-500/20 rounded-lg">
              <span className="text-xs font-medium text-blue-300">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive ? 'bg-blue-500' :
                      isCompleted ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}>
                      <Icon size={24} className="text-white" weight={isActive ? 'fill' : 'duotone'} />
                    </div>
                    <p className={`mt-2 text-xs font-medium ${
                      isActive ? 'text-blue-400' :
                      isCompleted ? 'text-emerald-400' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-gray-700'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <GlassCard variant="dark-medium" blur="lg" className="p-8">
          {currentStep === 'details' && (
            <DetailsStep proposal={proposal} setProposal={setProposal} />
          )}
          {currentStep === 'beneficiary' && (
            <BeneficiaryStep proposal={proposal} setProposal={setProposal} />
          )}
          {currentStep === 'approvers' && (
            <ApproversStep proposal={proposal} setProposal={setProposal} />
          )}
          {currentStep === 'preview' && (
            <PreviewStep proposal={proposal} />
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-700">
            <Button
              onClick={handleBack}
              variant="secondary"
            >
              {currentStepIndex === 0 ? 'Cancel' : 'Back'}
            </Button>
            
            {currentStep === 'preview' ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedAccount || isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
              >
                Next Step
              </Button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

/**
 * Step 1: Proposal Details
 */
function DetailsStep({ proposal, setProposal }: { 
  proposal: SpendProposal; 
  setProposal: React.Dispatch<React.SetStateAction<SpendProposal>> 
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Proposal Details</h2>
        <p className="text-sm text-gray-400">Provide basic information about the treasury spend proposal</p>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Proposal Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={proposal.title}
            onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
            placeholder="e.g., Road Infrastructure Upgrade Q1 2026"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Amount & Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={proposal.amount}
              onChange={(e) => setProposal({ ...proposal, amount: e.target.value })}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Currency <span className="text-red-400">*</span>
            </label>
            <select
              value={proposal.currency}
              onChange={(e) => setProposal({ ...proposal, currency: e.target.value as 'DALLA' | 'bBZD' })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="DALLA">DALLA (Native Token)</option>
              <option value="bBZD">bBZD (Belize Dollar)</option>
            </select>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Category <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setProposal({ ...proposal, category: cat })}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  proposal.category === cat
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                }`}
              >
                <span className="text-sm font-medium">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={proposal.description}
            onChange={(e) => setProposal({ ...proposal, description: e.target.value })}
            placeholder="Provide detailed justification for this spend proposal..."
            rows={6}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
          <p className="mt-2 text-xs text-gray-500">{proposal.description.length} characters</p>
        </div>

        {/* Expiration */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Voting Period (days)
          </label>
          <input
            type="number"
            value={proposal.expiresIn}
            onChange={(e) => setProposal({ ...proposal, expiresIn: parseInt(e.target.value) })}
            min="7"
            max="90"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
          <p className="mt-2 text-xs text-gray-500">Proposal will expire in {proposal.expiresIn} days</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Step 2: Beneficiary Information
 */
function BeneficiaryStep({ proposal, setProposal }: { 
  proposal: SpendProposal; 
  setProposal: React.Dispatch<React.SetStateAction<SpendProposal>> 
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Beneficiary Information</h2>
        <p className="text-sm text-gray-400">Who will receive the funds from this proposal?</p>
      </div>

      <div className="space-y-4">
        {/* Beneficiary Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Beneficiary Type <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {BENEFICIARY_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setProposal({ 
                  ...proposal, 
                  beneficiary: { ...proposal.beneficiary, type } 
                })}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  proposal.beneficiary.type === type
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                }`}
              >
                <span className="text-sm font-medium">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Beneficiary Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Beneficiary Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={proposal.beneficiary.name}
            onChange={(e) => setProposal({ 
              ...proposal, 
              beneficiary: { ...proposal.beneficiary, name: e.target.value } 
            })}
            placeholder="e.g., Ministry of Public Works"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Beneficiary Address */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Wallet Address <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={proposal.beneficiary.address}
            onChange={(e) => setProposal({ 
              ...proposal, 
              beneficiary: { ...proposal.beneficiary, address: e.target.value } 
            })}
            placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
          />
          <p className="mt-2 text-xs text-gray-500">The BelizeChain address that will receive the funds</p>
        </div>

        {/* Warning Box */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3">
          <Warning size={20} className="text-amber-400 flex-shrink-0 mt-0.5" weight="fill" />
          <div>
            <p className="text-sm font-medium text-amber-300 mb-1">Verify Address Carefully</p>
            <p className="text-xs text-amber-200/80">
              Ensure the wallet address is correct. Funds sent to an incorrect address cannot be recovered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Step 3: Multi-Sig Approvers Selection
 */
function ApproversStep({ proposal, setProposal }: { 
  proposal: SpendProposal; 
  setProposal: React.Dispatch<React.SetStateAction<SpendProposal>> 
}) {
  const toggleApprover = (address: string) => {
    if (proposal.approvers.includes(address)) {
      setProposal({ 
        ...proposal, 
        approvers: proposal.approvers.filter(a => a !== address) 
      });
    } else {
      setProposal({ 
        ...proposal, 
        approvers: [...proposal.approvers, address] 
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Multi-Signature Approvers</h2>
        <p className="text-sm text-gray-400">Select Foundation Board members to approve this proposal (minimum 4 of 7)</p>
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-400" weight="fill" />
            <span className="text-sm font-medium text-blue-300">
              {proposal.approvers.length} of 7 selected
            </span>
          </div>
          <span className={`text-xs font-semibold ${
            proposal.approvers.length >= 4 ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {proposal.approvers.length >= 4 ? '✓ Minimum met' : `Need ${4 - proposal.approvers.length} more`}
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-700/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${(proposal.approvers.length / 7) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {BOARD_MEMBERS.map((member) => {
          const isSelected = proposal.approvers.includes(member.address);
          
          return (
            <button
              key={member.address}
              onClick={() => toggleApprover(member.address)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/20'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-emerald-500' : 'bg-gray-700'
                  }`}>
                    <Users size={20} className="text-white" weight={isSelected ? 'fill' : 'duotone'} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{member.name}</p>
                    <p className="text-xs text-gray-400">{member.role}</p>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle size={24} className="text-emerald-400" weight="fill" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Step 4: Preview & Submit
 */
function PreviewStep({ proposal }: { proposal: SpendProposal }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Review Proposal</h2>
        <p className="text-sm text-gray-400">Please review all details before submitting</p>
      </div>

      {/* Proposal Summary */}
      <div className="space-y-4">
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Title</p>
          <p className="text-base font-semibold text-white">{proposal.title}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Amount</p>
            <p className="text-lg font-bold text-emerald-400">
              {parseFloat(proposal.amount).toLocaleString()} {proposal.currency}
            </p>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Category</p>
            <p className="text-base font-semibold text-white">{proposal.category}</p>
          </div>
        </div>

        <div className="p-4 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Description</p>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{proposal.description}</p>
        </div>

        <div className="p-4 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Beneficiary</p>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">{proposal.beneficiary.name}</p>
            <p className="text-xs text-gray-400">{proposal.beneficiary.type}</p>
            <p className="text-xs text-gray-500 font-mono">{proposal.beneficiary.address}</p>
          </div>
        </div>

        <div className="p-4 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Required Approvers ({proposal.approvers.length}/7)</p>
          <div className="flex flex-wrap gap-2">
            {BOARD_MEMBERS.filter(m => proposal.approvers.includes(m.address)).map((member) => (
              <div key={member.address} className="px-3 py-1.5 bg-emerald-500/20 rounded-lg">
                <span className="text-xs font-medium text-emerald-300">{member.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Voting Period</p>
          <p className="text-sm text-white">{proposal.expiresIn} days</p>
        </div>
      </div>

      {/* Final Warning */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
        <Warning size={20} className="text-blue-400 flex-shrink-0 mt-0.5" weight="fill" />
        <div>
          <p className="text-sm font-medium text-blue-300 mb-1">Ready to Submit?</p>
          <p className="text-xs text-blue-200/80">
            Once submitted, this proposal will require {proposal.approvers.length} multi-sig approvals from the Foundation Board before funds can be disbursed.
          </p>
        </div>
      </div>
    </div>
  );
}
