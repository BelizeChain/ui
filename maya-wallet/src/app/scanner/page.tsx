'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  ArrowLeft,
  Scan,
  CheckCircle,
  XCircle,
  Coins,
  Storefront,
  QrCode,
  Sparkle,
  Copy,
  Receipt,
  Lightning,
  TreeEvergreen,
  Broadcast,
  Check,
} from 'phosphor-react';

export default function ScannerPage() {
  const router = useRouter();
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activeMode, setActiveMode] = useState<'scanner' | 'merchant-pos'>('merchant-pos');
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // POS State
  const [posCurrency, setPosCurrency] = useState<'bBZD' | 'DALLA'>('bBZD');
  const [chargeAmount, setChargeAmount] = useState('25.00');
  const [tipPct, setTipPct] = useState<number>(15);
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [paymentReceived, setPaymentReceived] = useState(false);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (err) {
      addNotification({
        type: 'error',
        message: 'Camera permission denied or camera not found on this device.',
      });
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  const handleSimulateScan = (value: string) => {
    setScannedResult(value);
    addNotification({
      type: 'success',
      message: `Scanned QR: ${value}`,
    });
  };

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `INV-BZ-${Date.now().toString(36).toUpperCase()}`;
    setInvoiceId(id);
    setInvoiceCreated(true);
    setPaymentReceived(false);

    // Simulate customer scan & instant settlement after 3.5s
    setTimeout(() => {
      setPaymentReceived(true);
      addNotification({
        type: 'success',
        message: `Payment received! ${totalDue} ${posCurrency} settled instantly with 2.5% Eco-Tourism cashback issued.`,
      });
    }, 3500);
  };

  const rawNum = parseFloat(chargeAmount) || 0;
  const tipNum = (rawNum * tipPct) / 100;
  const totalDue = (rawNum + tipNum).toFixed(2);
  const ecoCashback = (rawNum * 0.025).toFixed(2);

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to access the Merchant POS Terminal and Quick-Pay Scanner." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors">
                <ArrowLeft size={24} weight="bold" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Merchant POS & Quick-Pay Scanner</h1>
              <p className="text-xs text-slate-400">Cashier Terminal • Dynamic QR Invoices • Eco-Tourism 2.5% Cashback</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <TreeEvergreen size={14} weight="bold" />
              Eco-Verified Merchant
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Mode Selector */}
        <div className="flex bg-slate-900/80 border border-slate-800 rounded-2xl p-1">
          <button
            onClick={() => {
              setActiveMode('merchant-pos');
              stopScanner();
            }}
            className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeMode === 'merchant-pos'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Storefront size={18} weight="bold" />
            Merchant POS Cashier Terminal
          </button>

          <button
            onClick={() => setActiveMode('scanner')}
            className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeMode === 'scanner'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scan size={18} weight="bold" />
            Camera & NFC QR Scanner
          </button>
        </div>

        {/* Mode 1: Merchant POS Terminal */}
        {activeMode === 'merchant-pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Charge Form */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl text-xs">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt size={20} className="text-emerald-400" />
                  Create Customer Invoice
                </h3>
                <p className="text-slate-400 mt-1">Accept statutory Belize Dollars (bBZD) or native DALLA (Ɗ).</p>
              </div>

              <form onSubmit={handleGenerateInvoice} className="space-y-4">
                {/* Currency Switcher */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPosCurrency('bBZD')}
                    className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                      posCurrency === 'bBZD'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Statutory bBZD (BZ$)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosCurrency('DALLA')}
                    className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                      posCurrency === 'DALLA'
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Native DALLA (Ɗ)
                  </button>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block">Bill Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={chargeAmount}
                      onChange={(e) => setChargeAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xl font-bold text-white font-mono focus:border-emerald-400 focus:outline-none"
                    />
                    <span className="absolute right-4 top-4 text-xs font-bold text-slate-400">
                      {posCurrency}
                    </span>
                  </div>
                </div>

                {/* Tip Presets */}
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1.5 block">Customer Tip Preset</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 10, 15, 20].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTipPct(t)}
                        className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                          tipPct === t
                            ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t === 0 ? 'No Tip' : `${t}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Table */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="text-white font-bold">{chargeAmount} {posCurrency}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tip ({tipPct}%):</span>
                    <span className="text-slate-200">{tipNum.toFixed(2)} {posCurrency}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-2 text-xs">
                    <span className="text-white font-bold">Total Due:</span>
                    <span className="text-emerald-400 font-bold">{totalDue} {posCurrency}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400/90 text-[10px] pt-1">
                    <span>Eco-Tourism 2.5% Rebate to Customer:</span>
                    <span>+{ecoCashback} {posCurrency}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.99] text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <QrCode size={18} weight="bold" />
                  Generate Customer QR Bill
                </button>
              </form>
            </div>

            {/* Live QR Bill Display */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <QrCode size={20} className="text-cyan-400" />
                  Customer Payment Display
                </h3>
                <p className="text-slate-400 mt-1">Present this screen to customer for 1-tap Maya Wallet scanning.</p>
              </div>

              {invoiceCreated ? (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 text-center">
                  <div className="space-y-1">
                    <span className="font-mono text-xs text-slate-500 uppercase">{invoiceId}</span>
                    <div className="text-2xl font-bold text-emerald-400 font-mono">
                      {totalDue} {posCurrency}
                    </div>
                  </div>

                  {/* QR Box */}
                  <div className="mx-auto w-48 h-48 bg-white p-3 rounded-2xl flex items-center justify-center shadow-2xl relative">
                    <div className="w-full h-full border-4 border-slate-900 border-dashed rounded-xl flex flex-col items-center justify-center p-2 text-center text-slate-900 font-mono">
                      <QrCode size={96} className="text-slate-900 mb-1" weight="bold" />
                      <span className="text-[9px] font-bold">belizechain://pay?inv={invoiceId}</span>
                    </div>

                    {paymentReceived && (
                      <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white p-4 space-y-2 animate-in fade-in duration-300">
                        <CheckCircle size={56} weight="fill" className="text-white" />
                        <span className="font-bold text-sm">PAYMENT RECEIVED</span>
                        <span className="text-[10px] text-emerald-100 font-mono">Settled on Consensus</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-slate-400 text-[11px]">
                    <Broadcast size={14} className={paymentReceived ? 'text-emerald-400' : 'text-amber-400 animate-pulse'} />
                    <span>{paymentReceived ? 'Payment Confirmed' : 'Listening for on-chain block confirmation...'}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/60 p-12 rounded-2xl border border-slate-800 text-center text-slate-500 my-auto">
                  Enter an amount and click "Generate Customer QR Bill" to open the live payment window.
                </div>
              )}

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-[11px] flex items-center gap-2">
                <TreeEvergreen size={18} weight="bold" />
                <span>Eco-Tourism Certified: 2.5% green rebate automatically distributed by oracle to customer.</span>
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: Camera & NFC Scanner */}
        {activeMode === 'scanner' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scan size={22} className="text-emerald-400" />
                Maya Multi-Format QR & NFC Camera Scanner
              </h3>
              <p className="text-slate-400 mt-1">Scan Maya addresses, BNS `.bz` handles, merchant invoices, or offline LoRa vouchers.</p>
            </div>

            <div className="relative aspect-video max-w-lg mx-auto bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center">
              {!scanning ? (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <Scan size={48} className="text-slate-600" />
                  <p className="text-slate-400">Click below to activate device camera.</p>
                  <button
                    onClick={startScanner}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all shadow-md"
                  >
                    Start Camera
                  </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-emerald-400 rounded-2xl relative animate-pulse">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-300" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-300" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-300" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-300" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Test Links */}
            <div className="space-y-2">
              <span className="text-slate-500 uppercase font-bold text-[10px] block">Test Quick-Scan Samples</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSimulateScan('r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24')}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 font-mono text-[11px]"
                >
                  Founder Maya Address
                </button>
                <button
                  onClick={() => handleSimulateScan('sanpedro.bz')}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 font-mono text-[11px]"
                >
                  sanpedro.bz (BNS)
                </button>
                <button
                  onClick={() => handleSimulateScan('LORA-VOUCH-BZ-984')}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 font-mono text-[11px]"
                >
                  Offline LoRa Mesh Voucher
                </button>
              </div>
            </div>

            {scannedResult && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Scanned Target</span>
                  <span className="font-mono text-cyan-300 font-bold">{scannedResult}</span>
                </div>
                <button
                  onClick={() => router.push(`/send?to=${encodeURIComponent(scannedResult)}`)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Pay Recipient ➔
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
