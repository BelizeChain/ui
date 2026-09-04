'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitTransfer, estimateFee } from '@/services/blockchain';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { getContacts, type Contact } from '@/services/contacts';
import {
  ArrowLeft,
  User,
  Users,
  Check,
  ClipboardText,
  Confetti,
  Warning,
  PaperPlaneTilt,
  QrCode,
  ShieldCheck,
} from 'phosphor-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const sendMoneySchema = z.object({
  recipient: z.string().min(5, 'Recipient address is required'),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Amount must be greater than 0'
  ),
  currency: z.enum(['DALLA', 'bBZD']),
  note: z.string().max(100, 'Note must be less than 100 characters').optional(),
});

type SendMoneyForm = z.infer<typeof sendMoneySchema>;

const SOVEREIGN_DIRECTORY = [
  {
    id: 'sov-1',
    name: 'BelizeChain Sovereign Reserve Treasury',
    category: 'Sovereign Protocol',
    badge: 'Official Reserve',
    address: 'r1UWtr25o6VbvDcfqU5o8P2t2g7R3J2C4v9A5M1T8X7K6Q4B',
  },
  {
    id: 'sov-2',
    name: 'Ceiba Consensus Authority Node 01',
    category: 'Validator Network',
    badge: 'Consensus Node',
    address: 'r1CeibaAuthorityNode01MainnetBabeConsensusKey99',
  },
  {
    id: 'sov-3',
    name: 'Restorative Justice Citizen Court Pool',
    category: 'Civic Restitution',
    badge: 'Judicial Escrow',
    address: 'r1Vb8Kq3P4d9Z1m8N2x7C5v4B3n2M1l9K8j7H6g5F4d3S',
  },
  {
    id: 'sov-4',
    name: 'Maya Biosphere Carbon Conservation DAO',
    category: 'Environmental RWA',
    badge: 'Verified DAO',
    address: 'r1XGB7p4K9d2L1n8M3x6C4v5B2n1M9l8K7j6H5g4F3d2S',
  },
];

export default function SendPage() {
  const router = useRouter();
  const { selectedAccount, balance } = useWallet();
  const { addNotification } = useUIStore();
  const [step, setStep] = useState<'select' | 'amount' | 'confirm' | 'success'>('select');
  const [selectedContact, setSelectedContact] = useState<{ name: string; address: string; badge?: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<string>('0.0010 Ɗ');
  const [txPriority, setTxPriority] = useState<'standard' | 'express'>('standard');
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [contactsList, setContactsList] = useState<Contact[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<SendMoneyForm>({
    resolver: zodResolver(sendMoneySchema),
    defaultValues: {
      currency: 'DALLA',
      amount: '',
      recipient: '',
    },
  });

  const watchAmount = watch('amount');
  const watchCurrency = watch('currency');
  const watchRecipient = watch('recipient');

  useEffect(() => {
    try {
      const stored = getContacts();
      setContactsList(stored);
    } catch {
      // ignore
    }
  }, []);

  // Clean recipient if DID was pasted (e.g. did:belize:r1... -> r1...)
  const resolveAddress = (raw: string) => {
    if (!raw) return '';
    if (raw.startsWith('did:belize:')) {
      return raw.replace('did:belize:', '');
    }
    return raw.trim();
  };

  const handleSelectContact = (contact: { name: string; address: string; badge?: string }) => {
    setSelectedContact(contact);
    setValue('recipient', resolveAddress(contact.address));
    setStep('amount');
  };

  const handleManualAddress = () => {
    setSelectedContact({ name: 'Custom Recipient', address: '' });
    setValue('recipient', '');
    setStep('amount');
  };

  const handleReview = async (data: SendMoneyForm) => {
    try {
      if (!selectedAccount?.address) throw new Error('No account connected');
      
      const targetAddress = resolveAddress(selectedContact?.address || data.recipient);
      if (!targetAddress) throw new Error('Recipient address is required');

      setEstimatedFee('Calculating...');
      setShowConfirmModal(true);

      const fee = await estimateFee(
        selectedAccount.address,
        targetAddress,
        data.amount,
        data.currency.toLowerCase() as 'dalla' | 'bBZD'
      );

      const baseFee = fee === 'Unknown' ? 0.001 : parseFloat(fee);
      const finalFee = txPriority === 'express' ? (baseFee * 2.5).toFixed(4) : baseFee.toFixed(4);
      setEstimatedFee(`${finalFee} Ɗ`);
    } catch (error: any) {
      console.error(error);
      addNotification({
        type: 'error',
        message: error?.message || 'Failed to estimate transaction fee',
      });
      setShowConfirmModal(false);
    }
  };

  const handleConfirmSend = async () => {
    setIsSending(true);

    try {
      if (!selectedAccount?.address) {
        throw new Error('No account connected');
      }

      const recipientAddress = resolveAddress(selectedContact?.address || watchRecipient);
      if (!recipientAddress) {
        throw new Error('No recipient address provided');
      }

      const result = await submitTransfer(
        selectedAccount.address,
        recipientAddress,
        watchAmount || '0',
        watchCurrency?.toLowerCase() as 'dalla' | 'bBZD'
      );

      setTxHash(result.hash);
      setShowConfirmModal(false);
      setStep('success');

      addNotification({
        type: 'success',
        message: `Extrinsic finalized! Sent ${watchAmount} ${watchCurrency} to ${selectedContact?.name || recipientAddress.slice(0, 8)}...`,
      });
    } catch (error: any) {
      console.error('Transaction error:', error);
      addNotification({
        type: 'error',
        message: error?.message || 'Transaction failed. Please ensure wallet has sufficient balance and is unlocked.',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!selectedAccount) {
    return (
      <div className="min-h-screen bg-[#030914] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-6 bg-slate-900/80 border border-teal-500/30 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl backdrop-blur-xl">
          <ShieldCheck size={48} className="mx-auto text-teal-400" />
          <h2 className="text-xl font-bold">Connect Wallet First</h2>
          <p className="text-xs text-slate-400">Please connect or unlock your Maya Wallet account to transfer tokens.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold rounded-2xl hover:opacity-90 transition-opacity shadow-lg"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Success Screen
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#030914] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-slate-900/90 border border-teal-500/30 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="mx-auto h-20 w-20 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.4)]">
            <Check size={40} weight="bold" className="text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Transfer Confirmed!</h1>
            <p className="text-sm text-slate-400 mt-2">
              Sent <span className="font-semibold text-teal-300">{watchAmount} {watchCurrency}</span> to{' '}
              <span className="font-semibold text-white">{selectedContact?.name || 'recipient'}</span>
            </p>
          </div>

          {txHash && (
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-teal-500/20 text-left space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Ceiba Extrinsic Hash</span>
              <p className="font-mono text-xs text-cyan-300 break-all">{txHash}</p>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              onClick={() => {
                reset();
                setStep('select');
              }}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-2xl font-semibold text-sm transition-colors border border-slate-700"
            >
              Send Another
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 rounded-2xl font-black text-sm shadow-lg shadow-teal-500/20 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030914] text-white pb-20 selection:bg-cyan-500/30">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-2xl border-b border-teal-500/20 p-5 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          <button
            onClick={() => (step === 'select' ? router.push('/') : setStep('select'))}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors border border-teal-500/20"
          >
            <ArrowLeft size={22} weight="bold" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Send Money
              <span className="px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/30 rounded-full text-[10px] font-mono font-bold">
                Instant Extrinsic
              </span>
            </h1>
            <p className="text-xs text-slate-400">Transfer DALLA or bBZD across BelizeChain sovereign accounts</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        {/* Step 1: Select Recipient */}
        {step === 'select' && (
          <div className="space-y-6">
            {/* Direct Address Input Card */}
            <div
              onClick={handleManualAddress}
              className="bg-slate-900/80 border border-teal-500/30 hover:border-teal-400/60 p-5 rounded-3xl cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] group backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform shadow-inner">
                  <ClipboardText size={26} weight="duotone" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Enter Address, DID, or Scan</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Send to `r1...`, `did:belize:...`, or generic SS58 `5...`</p>
                </div>
              </div>
            </div>

            {/* Sovereign Ecosystem Verified Directory */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={16} weight="bold" />
                  Verified Sovereign Institutions & DAOs
                </h3>
              </div>

              <div className="space-y-2">
                {SOVEREIGN_DIRECTORY.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectContact(item)}
                    className="bg-slate-900/70 border border-teal-500/20 hover:border-teal-500/50 p-3.5 rounded-2xl cursor-pointer transition-all hover:bg-slate-800/60 flex items-center justify-between group backdrop-blur-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center font-bold text-teal-300 text-xs shadow-inner">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white group-hover:text-teal-300 transition-colors">{item.name}</p>
                          <span className="px-1.5 py-0.2 bg-teal-500/15 text-teal-300 rounded text-[9px] font-mono font-bold">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {item.address.slice(0, 12)}...{item.address.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <span className="text-teal-400 text-sm font-bold group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved / Frequent Contacts */}
            {contactsList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} className="text-teal-400" />
                    Saved Address Book ({contactsList.length})
                  </h3>
                </div>

                <div className="space-y-2">
                  {contactsList.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className="bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 p-3.5 rounded-2xl cursor-pointer transition-all hover:bg-slate-800/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-teal-400 text-xs">
                          {contact.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-white">{contact.name}</p>
                          <p className="text-xs font-mono text-slate-400">
                            {contact.address.slice(0, 10)}...{contact.address.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <span className="text-slate-500 text-sm">→</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Amount & Details */}
        {step === 'amount' && (
          <form onSubmit={handleSubmit(handleReview)} className="space-y-6">
            {/* Recipient Banner */}
            <div className="bg-slate-900/80 border border-teal-500/30 rounded-3xl p-5 flex items-center justify-between backdrop-blur-xl shadow-lg">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sending To</span>
                <h3 className="font-bold text-white text-base mt-0.5 flex items-center gap-2">
                  {selectedContact?.name}
                  {selectedContact?.badge && (
                    <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-full text-[10px] font-mono font-bold">
                      {selectedContact.badge}
                    </span>
                  )}
                </h3>
                {selectedContact?.address && (
                  <p className="text-xs font-mono text-cyan-300/80 mt-0.5 break-all">{selectedContact.address}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStep('select')}
                className="text-xs text-teal-300 hover:text-white font-bold px-3 py-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 transition-colors"
              >
                Change
              </button>
            </div>

            {/* Custom address input if manual */}
            {selectedContact?.name === 'Custom Recipient' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Recipient Address or W3C DID
                </label>
                <input
                  type="text"
                  placeholder="r1... or did:belize:r1... or 5..."
                  {...register('recipient')}
                  className="w-full bg-slate-900/90 border border-teal-500/30 rounded-2xl px-4 py-3.5 text-sm font-mono text-white focus:outline-none focus:border-teal-400 transition-colors"
                />
                {errors.recipient && <p className="text-xs text-rose-400 mt-1.5">{errors.recipient.message}</p>}
              </div>
            )}

            {/* Currency Choice */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Sovereign Asset</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('currency', 'DALLA')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    watchCurrency === 'DALLA'
                      ? 'border-teal-400 bg-teal-500/15 text-white shadow-[0_0_20px_rgba(20,184,166,0.2)]'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-white text-base">Ɗ DALLA</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">Native</span>
                  </div>
                  <p className="text-xs text-cyan-300/80 font-mono">
                    Avail: {balance?.dalla || '0.00'} Ɗ
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('currency', 'bBZD')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    watchCurrency === 'bBZD'
                      ? 'border-teal-400 bg-teal-500/15 text-white shadow-[0_0_20px_rgba(20,184,166,0.2)]'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-white text-base">BZ$ bBZD</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">Pegged</span>
                  </div>
                  <p className="text-xs text-cyan-300/80 font-mono">
                    Avail: {balance?.bBZD || '0.00'} BZ$
                  </p>
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</label>
                <div className="flex gap-1.5">
                  {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        const raw = (watchCurrency === 'DALLA' ? balance?.dalla : balance?.bBZD)?.replace(/,/g, '') || '0';
                        const total = parseFloat(raw);
                        if (total <= 0) return;
                        const buffer = watchCurrency === 'DALLA' && pct === 1.0 ? 0.05 : 0;
                        const calc = Math.max(0, total * pct - buffer);
                        setValue('amount', calc.toFixed(4).replace(/\.?0+$/, ''));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 text-[11px] font-mono font-bold border border-slate-700 transition-colors"
                    >
                      {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  {...register('amount')}
                  className="w-full bg-slate-900/90 border border-teal-500/25 rounded-2xl px-4 py-4 text-2xl font-bold font-mono text-white focus:outline-none focus:border-teal-400 transition-colors pr-28 shadow-inner"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm font-mono">
                  {watchCurrency === 'DALLA' ? 'Ɗ DALLA' : 'BZ$ bBZD'}
                </span>
              </div>
              {errors.amount && <p className="text-xs text-rose-400 mt-1.5">{errors.amount.message}</p>}
            </div>

            {/* Speed Priority Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Block Priority & Speed</label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setTxPriority('standard')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    txPriority === 'standard'
                      ? 'border-teal-400 bg-teal-500/15 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <span className="font-bold block text-white">Standard (BABE)</span>
                  <span className="text-[11px] text-slate-400">~6s Block • 0.0010 Ɗ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTxPriority('express')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    txPriority === 'express'
                      ? 'border-teal-400 bg-teal-500/15 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <span className="font-bold block text-white">Sovereign Express</span>
                  <span className="text-[11px] text-teal-300">Next Slot Priority • 0.0025 Ɗ</span>
                </button>
              </div>
            </div>

            {/* Note Input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Note (Optional On-Chain Memo)</label>
              <input
                type="text"
                placeholder="e.g. Ambergris Caye land tax or invoice #1042"
                {...register('note')}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 active:scale-[0.99] text-slate-950 rounded-2xl font-black shadow-[0_0_25px_rgba(20,184,166,0.35)] transition-all text-base flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <PaperPlaneTilt size={22} weight="bold" />
              Review Extrinsic Details
            </button>
          </form>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-teal-500/30 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="h-10 w-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300">
                <PaperPlaneTilt size={20} weight="bold" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Authorize Transfer</h3>
                <p className="text-xs text-slate-400">Ceiba Substrate Consensus Dispatch</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/90 p-4 rounded-2xl border border-teal-500/20 text-sm">
              <div className="flex justify-between items-center text-slate-400">
                <span>Recipient</span>
                <span className="font-bold text-white font-mono text-xs">
                  {selectedContact?.name || (watchRecipient ? watchRecipient.slice(0, 12) + '...' : '')}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Transfer Amount</span>
                <span className="font-black text-teal-300 text-lg font-mono">
                  {watchAmount} {watchCurrency}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Priority</span>
                <span className="font-semibold text-white capitalize">{txPriority} Priority</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Estimated Network Gas</span>
                <span className="font-mono text-xs text-cyan-300">{estimatedFee}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSending}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-semibold text-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                disabled={isSending}
                className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 active:scale-[0.99] text-slate-950 rounded-2xl font-black text-sm shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSending ? 'Signing & Dispatching...' : 'Authorize Extrinsic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
