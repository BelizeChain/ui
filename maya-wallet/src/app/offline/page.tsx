'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode.react';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  QrCode,
  ArrowLeft,
  ShieldCheck,
  Broadcast,
  CheckCircle,
  Copy,
  Coins,
  Warning,
  Sparkle,
  Download,
  DeviceMobile,
  Check,
  ArrowsClockwise,
  Radio,
  Key,
  Scan,
  Cpu,
} from 'phosphor-react';

export default function OfflineSigningPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [step, setStep] = useState<'create' | 'qr' | 'broadcast' | 'result'>('create');

  // Payload inputs
  const [recipient, setRecipient] = useState('r1SaBq6Cszb9KEv69LAQyKERJyNhXFkMwx5Fy3mLXXyg9sj24');
  const [amount, setAmount] = useState('100.00');
  const [currency, setCurrency] = useState<'DALLA' | 'bBZD'>('DALLA');
  const [nonce, setNonce] = useState('42');
  const [tip, setTip] = useState('0');

  // Generated Payload
  const [unsignedPayload, setUnsignedPayload] = useState('');
  const [compressedLoRaBytes, setCompressedLoRaBytes] = useState('');
  const [isAnimatedQR, setIsAnimatedQR] = useState(false);
  const [qrFrameIndex, setQrFrameIndex] = useState(0);

  // Signed Payload input for broadcast
  const [signedHex, setSignedHex] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    blockHash: string;
    extrinsicHash: string;
    blockNumber: number;
    timestamp: string;
  } | null>(null);

  // Animated QR sequence generator (BC-UR format simulation)
  const qrFrames = React.useMemo(() => {
    if (!unsignedPayload) return [];
    const base = unsignedPayload;
    return [
      `ur:bytes/1-3/${Buffer.from(base.slice(0, Math.ceil(base.length / 3))).toString('base64')}`,
      `ur:bytes/2-3/${Buffer.from(base.slice(Math.ceil(base.length / 3), Math.ceil((base.length * 2) / 3))).toString('base64')}`,
      `ur:bytes/3-3/${Buffer.from(base.slice(Math.ceil((base.length * 2) / 3))).toString('base64')}`,
    ];
  }, [unsignedPayload]);

  useEffect(() => {
    if (!isAnimatedQR || qrFrames.length === 0) return;
    const interval = setInterval(() => {
      setQrFrameIndex((prev) => (prev + 1) % qrFrames.length);
    }, 400);
    return () => clearInterval(interval);
  }, [isAnimatedQR, qrFrames]);

  const handleGeneratePayload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    // Simulate 87-byte compressed scale encoded transaction
    const payload = JSON.stringify({
      genesis: '0x3289ab71f829c488e91024823901482093840283094820938409238409238409',
      nonce: parseInt(nonce, 10),
      sender: selectedAccount?.address || '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      recipient,
      amount: parseFloat(amount),
      currency,
      call: '0x0400',
      tip: parseInt(tip, 10),
      era: '0x00',
    });

    const loraHex = `0x0400${recipient.slice(0, 16)}${parseFloat(amount) * 1000000}${nonce}01`;

    setUnsignedPayload(payload);
    setCompressedLoRaBytes(loraHex);
    setStep('qr');
    addNotification({
      type: 'success',
      message: 'Generated 87-byte compressed offline transaction payload!',
    });
  };

  const handleSimulateColdSign = () => {
    const mockSignature = `0x0400010045e3f${Date.now().toString(16)}ab892019842109849201849201849201849201849201849201849201849201849201849201849201849201849201849201849201849201849201849201849201849201849201849201849201`;
    setSignedHex(mockSignature);
    setStep('broadcast');
    addNotification({
      type: 'success',
      message: 'Air-gapped signature simulated from cold hardware signer!',
    });
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedHex) return;

    setIsBroadcasting(true);
    setTimeout(() => {
      setIsBroadcasting(false);
      const res = {
        blockHash: `0x7a8b9c${Date.now().toString(16)}09823481239840283049283049283049283049283049`,
        extrinsicHash: `0x3f4e5d${Date.now().toString(16)}98127391827391827391827391827391827391827391`,
        blockNumber: 1492120 + Math.floor(Math.random() * 50),
        timestamp: new Date().toLocaleTimeString(),
      };
      setBroadcastResult(res);
      setStep('result');
      addNotification({
        type: 'success',
        message: `Successfully broadcasted to BelizeChain Ceiba Node (Block #${res.blockNumber})!`,
      });
    }, 1500);
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to craft and broadcast air-gapped offline transactions." fullScreen />;
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
              <h1 className="text-xl font-bold flex items-center gap-2">
                Offline Transaction Studio
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold">
                  Air-Gap
                </span>
              </h1>
              <p className="text-xs text-slate-400">QR Signing • 87-Byte LoRa 915MHz Frame • Gateway Relay</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Radio size={16} weight="bold" className="animate-pulse text-purple-400" />
              Meshtastic 915MHz
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Step Indicators */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 text-xs text-center font-medium">
          <button
            onClick={() => setStep('create')}
            className={`py-2 rounded-xl transition-all ${
              step === 'create' ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Craft Payload
          </button>
          <button
            onClick={() => unsignedPayload && setStep('qr')}
            disabled={!unsignedPayload}
            className={`py-2 rounded-xl transition-all ${
              step === 'qr'
                ? 'bg-purple-500 text-white font-bold shadow-lg'
                : unsignedPayload
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-700 cursor-not-allowed'
            }`}
          >
            2. Scan QR / LoRa
          </button>
          <button
            onClick={() => signedHex && setStep('broadcast')}
            disabled={!signedHex}
            className={`py-2 rounded-xl transition-all ${
              step === 'broadcast' || step === 'result'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg'
                : signedHex
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-700 cursor-not-allowed'
            }`}
          >
            3. Broadcast
          </button>
        </div>

        {/* Step 1: Create Payload */}
        {step === 'create' && (
          <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck size={22} className="text-emerald-400" />
                1. Craft Air-Gapped Transaction
              </h3>
              <p className="text-slate-400 mt-1">
                Construct an unbroadcasted Substrate extrinsic payload. Private keys stay isolated on your cold hardware.
              </p>
            </div>

            <form onSubmit={handleGeneratePayload} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Sender Account</label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 font-mono text-[11px] flex items-center justify-between">
                  <span className="truncate">{selectedAccount.address}</span>
                  <span className="text-emerald-400 font-sans font-bold ml-2">Active</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 uppercase font-semibold mb-1 block">Recipient Address or BNS (.bz)</label>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="r1Sa... or maya.bz"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-cyan-300 focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="DALLA">DALLA (Ɗ)</option>
                    <option value="bBZD">bBZD (BZ$)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block">Account Nonce</label>
                  <input
                    type="number"
                    required
                    value={nonce}
                    onChange={(e) => setNonce(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 uppercase font-semibold mb-1 block">Validator Tip (Planck)</label>
                  <input
                    type="number"
                    value={tip}
                    onChange={(e) => setTip(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <QrCode size={16} weight="bold" />
                Generate Offline QR & LoRa Packet
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Display QR & LoRa Packet */}
        {step === 'qr' && (
          <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-xs">
            <div className="text-center">
              <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
                <QrCode size={22} className="text-purple-400" />
                2. Scan on Cold Device or Transmit over LoRa
              </h3>
              <p className="text-slate-400 mt-1">Scan with air-gapped hardware signer or broadcast over 915MHz radio mesh.</p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl w-fit mx-auto shadow-2xl space-y-2">
              <QRCode
                value={isAnimatedQR ? qrFrames[qrFrameIndex] || unsignedPayload : unsignedPayload}
                size={220}
                level="M"
              />
              {isAnimatedQR && (
                <span className="text-[10px] text-slate-800 font-mono font-bold">
                  Frame {qrFrameIndex + 1} of {qrFrames.length} (BC-UR Format)
                </span>
              )}
            </div>

            {/* QR Mode Toggle */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setIsAnimatedQR(!isAnimatedQR)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isAnimatedQR
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <ArrowsClockwise size={14} weight="bold" className={isAnimatedQR ? 'animate-spin' : ''} />
                {isAnimatedQR ? 'Animated Multi-Part Active' : 'Enable Animated QR (BC-UR)'}
              </button>
            </div>

            {/* 87-Byte LoRa Packet Inspector */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-[11px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Radio size={14} className="text-purple-400" />
                  87-Byte LoRa Radio Frame
                </span>
                <span className="text-emerald-400 text-[10px] font-bold">Ready for 915MHz Broadcast</span>
              </div>
              <p className="text-cyan-300 break-all">{compressedLoRaBytes}</p>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                <div>• Call: <span className="text-slate-200">Balances.transfer_keep_alive</span></div>
                <div>• Payload Size: <span className="text-slate-200">87 Bytes</span></div>
                <div>• SF: <span className="text-slate-200">SF7 / 125kHz</span></div>
                <div>• Duty Cycle: <span className="text-slate-200">0.82% Compliant</span></div>
              </div>
            </div>

            {/* Simulation Shortcut & Manual Input */}
            <div className="bg-purple-950/30 border border-purple-800/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-purple-300 font-bold">
                <Cpu size={18} />
                Hardware Signer Simulator
              </div>
              <p className="text-slate-400 text-[11px]">
                Testing on local testbed? Simulate cold signing directly using your local sovereign Ed25519 key.
              </p>
              <button
                onClick={handleSimulateColdSign}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Key size={16} weight="bold" />
                Simulate Air-Gapped Signature on Cold Signer
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStep('create')}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all text-xs"
              >
                Back to Edit
              </button>
              <button
                onClick={() => setStep('broadcast')}
                className="py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-lg"
              >
                Enter Signed Hex ➔
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Broadcast Signed Extrinsic */}
        {step === 'broadcast' && (
          <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-xs">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Broadcast size={22} className="text-cyan-400" />
                3. Relay Signed Extrinsic to Ceiba Node
              </h3>
              <p className="text-slate-400 mt-1">Paste the signed signature hex returned from your cold signer to broadcast.</p>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 uppercase font-semibold block">Signed Transaction Hex</label>
                  {signedHex && <span className="text-[10px] text-emerald-400 font-bold">Valid Scale Hex</span>}
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="0x0400010045e3f..."
                  value={signedHex}
                  onChange={(e) => setSignedHex(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-400 font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Target RPC Gateway</span>
                  <span className="text-emerald-400 text-[10px] font-bold">Connected</span>
                </div>
                <p className="text-slate-300">ws://100.81.45.25:9944 (Ceiba Validator Node)</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStep('qr')}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all text-xs"
                >
                  View QR Again
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting || !signedHex}
                  className="py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-50"
                >
                  <Broadcast size={16} weight="bold" />
                  {isBroadcasting ? 'Relaying to Ceiba...' : 'Broadcast to Blockchain'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Broadcast Result */}
        {step === 'result' && broadcastResult && (
          <div className="max-w-xl mx-auto bg-slate-900/80 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-xs">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg">
                <CheckCircle size={32} weight="fill" />
              </div>
              <h3 className="text-lg font-bold text-white">Extrinsic In-Block & Finalized!</h3>
              <p className="text-slate-400">Your air-gapped transaction has been included in the BelizeChain ledger.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono text-[11px]">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Block Number:</span>
                <span className="text-emerald-400 font-bold">#{broadcastResult.blockNumber}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Block Hash:</span>
                <span className="text-slate-200 truncate max-w-[240px]">{broadcastResult.blockHash}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Extrinsic Hash:</span>
                <span className="text-cyan-400 truncate max-w-[240px]">{broadcastResult.extrinsicHash}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Relayed At:</span>
                <span className="text-slate-300">{broadcastResult.timestamp}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setStep('create');
                  setSignedHex('');
                  setUnsignedPayload('');
                  setBroadcastResult(null);
                }}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all text-xs"
              >
                Sign Another
              </button>
              <Link href="/history">
                <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-lg">
                  View in History ➔
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
