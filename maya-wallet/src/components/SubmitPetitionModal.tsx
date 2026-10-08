'use client';

import React, { useState } from 'react';
import { X, PaperPlaneTilt } from 'phosphor-react';
import { useToast } from '@/contexts/ToastContext';
import { useWallet } from '@/contexts/WalletContext';
import {
  COMMUNITY_PROPOSAL_TYPES,
  submitCommunityProposal,
} from '@/services/pallets/community';

interface SubmitPetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a petition is accepted into a block. */
  onSubmitted: () => void | Promise<void>;
}

/**
 * Submit a citizen petition as a real `community.submitCommunityProposal`.
 *
 * The pallet accepts a proposal-type code, a beneficiary, an amount and
 * title/description — there is no group, milestone or district field on chain,
 * so this form collects exactly what the extrinsic consumes. The pallet requires
 * the proposer to hold a verified BelizeID.
 */
export function SubmitPetitionModal({ isOpen, onClose, onSubmitted }: SubmitPetitionModalProps) {
  const { selectedAccount } = useWallet();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [proposalTypeCode, setProposalTypeCode] = useState(0);
  const [beneficiary, setBeneficiary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setTitle('');
    setDescription('');
    setAmount('');
    setProposalTypeCode(0);
    setBeneficiary('');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = selectedAccount?.address;
    if (!address) {
      showToast({ type: 'error', message: 'Connect a wallet to submit a petition.' });
      return;
    }
    if (!title.trim() || !description.trim()) {
      showToast({ type: 'error', message: 'Title and description are required.' });
      return;
    }
    if (!amount || Number.isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showToast({ type: 'error', message: 'Enter a valid requested amount in DALLA.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCommunityProposal(address, {
        proposalTypeCode,
        beneficiary: beneficiary.trim() || address,
        amount,
        title: title.trim(),
        description: description.trim(),
      });
      showToast({ type: 'success', message: 'Citizen petition submitted on chain.' });
      reset();
      await onSubmitted();
    } catch (error) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit petition.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">Submit Citizen Petition</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="petition-type" className="block text-xs font-mono text-slate-300 mb-1.5">
              Proposal Type
            </label>
            <select
              id="petition-type"
              value={proposalTypeCode}
              onChange={(e) => setProposalTypeCode(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
            >
              {COMMUNITY_PROPOSAL_TYPES.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="petition-title" className="block text-xs font-mono text-slate-300 mb-1.5">
              Title <span className="text-slate-400">(max 128 bytes)</span>
            </label>
            <input
              id="petition-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={128}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              placeholder="e.g. Village water filtration upgrade"
            />
          </div>

          <div>
            <label htmlFor="petition-description" className="block text-xs font-mono text-slate-300 mb-1.5">
              Description <span className="text-slate-400">(max 1024 bytes)</span>
            </label>
            <textarea
              id="petition-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1024}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none resize-none"
              placeholder="Describe the initiative and its expected impact."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="petition-amount" className="block text-xs font-mono text-slate-300 mb-1.5">
                Requested Amount (DALLA)
              </label>
              <input
                id="petition-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="petition-beneficiary" className="block text-xs font-mono text-slate-300 mb-1.5">
                Beneficiary
              </label>
              <input
                id="petition-beneficiary"
                type="text"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                placeholder="Defaults to your address"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
            A verified BelizeID is required by the community pallet. New proposals enter
            ethics review before voting opens.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            <PaperPlaneTilt size={16} weight="bold" />
            {isSubmitting ? 'Submitting…' : 'Submit Petition'}
          </button>
        </form>
      </div>
    </div>
  );
}
