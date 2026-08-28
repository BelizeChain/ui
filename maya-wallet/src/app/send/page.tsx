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

export default function SendPage() {
  const router = useRouter();
  const { selectedAccount, balance } = useWallet();
  const { addNotification } = useUIStore();
  const [step, setStep] = useState<'select' | 'amount' | 'confirm' | 'success'>('select');
  const [selectedContact, setSelectedContact] = useState<Contact | { name: string; address: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<string>('~0.001 Ɗ');
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

  const handleSelectContact = (contact: Contact | { name: string; address: string }) => {
    setSelectedContact(contact);
    setValue('recipient', contact.address);
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
      
      const targetAddress = selectedContact?.address || data.recipient;
      if (!targetAddress) throw new Error('Recipient address is required');

      setEstimatedFee('Calculating...');
      setShowConfirmModal(true);

      const fee = await estimateFee(
        selectedAccount.address,
        targetAddress,
        data.amount,
        data.currency.toLowerCase() as 'dalla' | 'bBZD'
      );

      setEstimatedFee(fee === 'Unknown' ? '~0.001 Ɗ' : `${fee} Ɗ`);
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

      const recipientAddress = selectedContact?.address || watchRecipient;
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
        message: `Successfully transferred ${watchAmount} ${watchCurrency}!`,
      });
    } catch (error: any) {
      console.error('Transaction error:', error);
      addNotification({
        type: 'error',
        message: error?.message || 'Transaction failed. Please ensure wallet is unlocked and has enough funds.',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!selectedAccount) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full space-y-4">
          <ShieldCheck size={48} className="mx-auto text-emerald-400" />
          <h2 className="text-xl font-bold">Connect Wallet First</h2>
          <p className="text-xs text-slate-400">Please connect or unlock your Maya Wallet account to transfer tokens.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-emerald-500 text-slate-950 font-bold rounded-2xl hover:bg-emerald-600 transition-colors"
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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center animate-bounce">
            <Check size={40} weight="bold" className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Transfer Successful!</h1>
            <p className="text-sm text-slate-400 mt-2">
              Sent <span className="font-semibold text-emerald-400">{watchAmount} {watchCurrency}</span> to{' '}
              <span className="font-semibold text-white">{selectedContact?.name || 'recipient'}</span>
            </p>
          </div>

          {txHash && (
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Transaction Hash</span>
              <p className="font-mono text-xs text-slate-300 break-all">{txHash}</p>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              onClick={() => {
                reset();
                setStep('select');
              }}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-semibold text-sm transition-colors"
            >
              Send Another
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-6 sticky top-0 z-10">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          <button
            onClick={() => (step === 'select' ? router.push('/') : setStep('select'))}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} weight="bold" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Send Money</h1>
            <p className="text-xs text-slate-400">Transfer DALLA or bBZD instantaneously</p>
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
              className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-3xl cursor-pointer transition-all hover:shadow-xl group"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <ClipboardText size={26} weight="duotone" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Enter Address or Scan</h3>
                  <p className="text-xs text-slate-400">Send to any BelizeChain `r1...` or `5...` address</p>
                </div>
              </div>
            </div>

            {/* Saved / Frequent Contacts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-emerald-400" />
                  Address Book ({contactsList.length})
                </h3>
              </div>

              {contactsList.length > 0 ? (
                <div className="space-y-2.5">
                  {contactsList.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 p-4 rounded-2xl cursor-pointer transition-all hover:bg-slate-800/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-emerald-400 text-sm">
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
              ) : (
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 text-center">
                  <User size={32} className="mx-auto text-slate-600 mb-2" weight="thin" />
                  <p className="text-xs text-slate-400">No saved contacts yet. Select "Enter Address" above to send.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Amount & Details */}
        {step === 'amount' && (
          <form onSubmit={handleSubmit(handleReview)} className="space-y-6">
            {/* Recipient Banner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sending To</span>
                <h3 className="font-semibold text-white text-base mt-0.5">{selectedContact?.name}</h3>
                {selectedContact?.address && (
                  <p className="text-xs font-mono text-slate-400 mt-0.5 break-all">{selectedContact.address}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStep('select')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
              >
                Change
              </button>
            </div>

            {/* Custom address input if manual */}
            {selectedContact?.name === 'Custom Recipient' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recipient Address</label>
                <input
                  type="text"
                  placeholder="r1... or 5..."
                  {...register('recipient')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
                {errors.recipient && <p className="text-xs text-red-400 mt-1.5">{errors.recipient.message}</p>}
              </div>
            )}

            {/* Currency Choice */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Asset</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('currency', 'DALLA')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    watchCurrency === 'DALLA'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-base">DALLA</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Native</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Avail: {balance?.dalla || '0.00'} Ɗ
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('currency', 'bBZD')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    watchCurrency === 'bBZD'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-base">bBZD</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Pegged</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Avail: {balance?.bBZD || '0.00'} BZ$
                  </p>
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</label>
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
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors"
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4 text-2xl font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors pr-28"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  {watchCurrency === 'DALLA' ? 'Ɗ DALLA' : 'BZ$ bBZD'}
                </span>
              </div>
              {errors.amount && <p className="text-xs text-red-400 mt-1.5">{errors.amount.message}</p>}
            </div>

            {/* Note Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Payment for lunch"
                {...register('note')}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all text-base flex items-center justify-center gap-2"
            >
              <PaperPlaneTilt size={22} weight="bold" />
              Review Transfer
            </button>
          </form>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <PaperPlaneTilt size={20} weight="bold" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Confirm Transfer</h3>
                <p className="text-xs text-slate-400">Please review the details below</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 text-sm">
              <div className="flex justify-between items-center text-slate-400">
                <span>To</span>
                <span className="font-semibold text-white font-mono text-xs">
                  {selectedContact?.name || (watchRecipient ? watchRecipient.slice(0, 10) + '...' : '')}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Transfer Amount</span>
                <span className="font-bold text-emerald-400 text-base">
                  {watchAmount} {watchCurrency}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Estimated Network Gas</span>
                <span className="font-mono text-xs text-slate-300">{estimatedFee}</span>
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
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSending ? 'Signing & Sending...' : 'Authorize & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
