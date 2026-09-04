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
  const [addressFormat, setAddressFormat] = useState<'belize' | 'generic' | 'did'>('belize');

  useEffect(() => {
    if (!selectedAccount) {
      router.replace('/');
    }
  }, [router, selectedAccount]);

  const formattedAddress = useMemo(() => {
    if (!selectedAccount?.address) return '';
    try {
      const { decodeAddress, encodeAddress } = require('@polkadot/util-crypto');
      const bzAddr = encodeAddress(decodeAddress(selectedAccount.address), 105);
      if (addressFormat === 'did') {
        return `did:belize:${bzAddr}`;
      }
      if (addressFormat === 'generic') {
        return encodeAddress(decodeAddress(selectedAccount.address), 42);
      }
      return bzAddr;
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
    <div className="min-h-screen bg-[#030914] text-white pb-20 selection:bg-cyan-500/30">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-2xl border-b border-teal-500/20 p-5 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors border border-teal-500/20"
          >
            <ArrowLeft size={22} weight="bold" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Receive Assets
              <span className="px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/30 rounded-full text-[10px] font-mono font-bold">
                SS58 / DID
              </span>
            </h1>
            <p className="text-xs text-slate-400">Scan QR or copy sovereign cryptographic address</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 sm:p-6 space-y-6">
        {/* QR Code Card */}
        <div className="bg-slate-900/80 border border-teal-500/30 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl text-center space-y-5 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Format Toggle Pill */}
          <div className="flex justify-center">
            <div className="inline-flex bg-slate-950/90 p-1 rounded-2xl border border-teal-500/20 text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => setAddressFormat('belize')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  addressFormat === 'belize'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Belize (`r1...`)
              </button>
              <button
                type="button"
                onClick={() => setAddressFormat('did')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  addressFormat === 'did'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                W3C DID
              </button>
              <button
                type="button"
                onClick={() => setAddressFormat('generic')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  addressFormat === 'generic'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Generic (`5...`)
              </button>
            </div>
          </div>

          {/* QR Container */}
          <div className="bg-white p-5 rounded-3xl inline-block shadow-[0_0_30px_rgba(20,184,166,0.15)] border-4 border-slate-800 mx-auto">
            <QRCode
              value={qrValue}
              size={210}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Formatted Address Display */}
          <div className="bg-slate-950/90 rounded-2xl p-4 border border-teal-500/20 text-left">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                {addressFormat === 'did' ? 'Decentralized Identifier (DID)' : addressFormat === 'belize' ? 'Belize SS58 Prefix (105)' : 'Substrate SS58 Prefix (42)'}
              </span>
              <span className="text-[10px] text-teal-400 font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
                {selectedAccount.name || 'Account'}
              </span>
            </div>
            <p className="text-xs font-mono text-cyan-200 break-all select-all font-medium leading-relaxed">
              {formattedAddress}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleCopyAddress}
              className="py-3.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-slate-700"
            >
              {copied ? <Check size={18} weight="bold" className="text-teal-400" /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>
            <button
              onClick={handleShare}
              className="py-3.5 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 active:scale-[0.99] text-slate-950 rounded-2xl font-black text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
            >
              <ShareNetwork size={18} weight="bold" />
              Share Request
            </button>
          </div>
        </div>

        {/* Optional Payment Request Generator */}
        <div className="bg-slate-900/80 border border-teal-500/25 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
          <div>
            <h3 className="font-bold text-white text-base">Payment Request Invoice (Optional)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Embed amount and memo directly into the dynamic QR code.</p>
          </div>

          {/* Quick Amount Presets */}
          <div className="flex gap-2">
            {['10', '50', '100', '250', '500'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRequestAmount(preset)}
                className="flex-1 py-1.5 bg-slate-800/80 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 rounded-xl text-xs font-mono font-bold border border-slate-700 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  className="w-full bg-slate-950/90 border border-teal-500/30 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-400 font-mono font-semibold"
                />
              </div>
              <select
                value={requestCurrency}
                onChange={(e) => setRequestCurrency(e.target.value as any)}
                className="bg-slate-800 text-teal-300 font-mono px-3 py-3 rounded-2xl font-bold border border-teal-500/30 focus:outline-none text-xs"
              >
                <option value="DALLA">Ɗ DALLA</option>
                <option value="bBZD">BZ$ bBZD</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Add memo/note (e.g. Ambergris Caye land tax or coffee)"
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-400"
            />
          </div>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-teal-400/80">
            <Lightbulb size={16} className="text-teal-400 shrink-0" weight="fill" />
            <span>Adding amount recalculates the QR code live for instant payer point-of-sale scanning.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
