'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import {
  ArrowLeft,
  QrCode as QrCodeIcon,
  Copy,
  ShareNetwork,
  Check,
  Lightbulb,
  ShieldCheck,
  CurrencyDollar,
} from 'phosphor-react';
import QRCode from 'qrcode.react';

export default function ReceivePage() {
  const router = useRouter();
  const { selectedAccount } = useWallet();
  const { addNotification } = useUIStore();
  const [copied, setCopied] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestCurrency, setRequestCurrency] = useState<'DALLA' | 'bBZD'>('DALLA');
  const [requestNote, setRequestNote] = useState('');
  const [addressFormat, setAddressFormat] = useState<'belize' | 'generic'>('belize');

  useEffect(() => {
    if (!selectedAccount) {
      router.replace('/');
    }
  }, [router, selectedAccount]);

  const formattedAddress = useMemo(() => {
    if (!selectedAccount?.address) return '';
    try {
      const { decodeAddress, encodeAddress } = require('@polkadot/util-crypto');
      return encodeAddress(decodeAddress(selectedAccount.address), addressFormat === 'belize' ? 105 : 42);
    } catch {
      return selectedAccount.address;
    }
  }, [selectedAccount?.address, addressFormat]);

  if (!selectedAccount) {
    return null;
  }

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(formattedAddress);
      setCopied(true);
      addNotification({
        type: 'success',
        message: 'Address copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to copy address',
      });
    }
  };

  const handleShare = async () => {
    const accountName = selectedAccount.name || 'My Maya Account';
    const amountParam = requestAmount ? `&amount=${requestAmount}&currency=${requestCurrency}` : '';
    const noteParam = requestNote ? `&note=${encodeURIComponent(requestNote)}` : '';
    const shareData = {
      title: 'Receive payment on BelizeChain',
      text: `Send ${requestAmount ? `${requestAmount} ${requestCurrency} ` : ''}to ${accountName} on BelizeChain: ${formattedAddress}`,
      url: `belizechain://send?to=${formattedAddress}${amountParam}${noteParam}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Share dismissed:', error);
      }
    } else {
      const text = `Send me ${requestAmount ? `${requestAmount} ${requestCurrency}` : 'money'} on Maya Wallet: ${formattedAddress}`;
      await navigator.clipboard.writeText(text);
      addNotification({
        type: 'success',
        message: 'Payment request link copied to clipboard',
      });
    }
  };

  const qrValue = requestAmount || requestNote
    ? `belizechain://send?to=${formattedAddress}&amount=${requestAmount}&currency=${requestCurrency}&note=${encodeURIComponent(requestNote)}`
    : formattedAddress;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-6 sticky top-0 z-10">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} weight="bold" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Receive Money</h1>
            <p className="text-xs text-slate-400">Share QR code or copy your BelizeChain address</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        {/* QR Code Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-5">
          {/* Format Toggle Pill */}
          <div className="flex justify-center">
            <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAddressFormat('belize')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  addressFormat === 'belize'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Belize Prefix (`r1...`)
              </button>
              <button
                type="button"
                onClick={() => setAddressFormat('generic')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  addressFormat === 'generic'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Generic Substrate (`5...`)
              </button>
            </div>
          </div>

          {/* QR Container */}
          <div className="bg-white p-5 rounded-3xl inline-block shadow-xl border-4 border-slate-800 mx-auto">
            <QRCode
              value={qrValue}
              size={210}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Formatted Address Display */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 text-left">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Your Receiving Address ({addressFormat === 'belize' ? 'SS58 Prefix 105' : 'Generic SS58'})
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">{selectedAccount.name || 'Account'}</span>
            </div>
            <p className="text-xs font-mono text-slate-200 break-all select-all font-medium leading-relaxed">
              {formattedAddress}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleCopyAddress}
              className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              {copied ? <Check size={18} weight="bold" className="text-emerald-400" /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>
            <button
              onClick={handleShare}
              className="py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <ShareNetwork size={18} weight="bold" />
              Share Request
            </button>
          </div>
        </div>

        {/* Optional Payment Request Generator */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">Request Specific Amount (Optional)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Embed amount and memo directly into your QR code.</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-semibold"
                />
              </div>
              <select
                value={requestCurrency}
                onChange={(e) => setRequestCurrency(e.target.value as any)}
                className="bg-slate-800 text-white px-3 py-3 rounded-2xl font-semibold border border-slate-700 focus:outline-none text-xs"
              >
                <option value="DALLA">Ɗ DALLA</option>
                <option value="bBZD">BZ$ bBZD</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Add memo/note (e.g. Invoice #1042)"
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
            <Lightbulb size={16} className="text-emerald-400 shrink-0" weight="fill" />
            <span>Adding amount updates the QR code live for instant payer scanning.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
