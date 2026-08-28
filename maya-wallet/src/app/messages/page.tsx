'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  MagnifyingGlass,
  PaperPlaneTilt,
  Phone,
  PlusCircle,
  DotsThreeVertical,
  CheckCircle,
  Clock,
  CloudArrowUp,
  Warning,
  Users,
  WifiHigh,
  User,
  Broadcast,
  ArrowLeft,
  LockKey,
  Coins,
  ShieldCheck,
  Sparkle,
} from 'phosphor-react';

interface ChatMessage {
  id: string;
  sender: 'me' | 'peer';
  text: string;
  timestamp: string;
  isEncrypted: boolean;
  channel: 'libp2p-internet' | 'lora-mesh-915mhz';
  transferAmount?: string;
}

interface PeerConversation {
  address: string;
  bnsName: string;
  avatar: string;
  lastMessage: string;
  unread: number;
  channel: 'libp2p-internet' | 'lora-mesh-915mhz';
}

export default function MessagesPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  const [activePeer, setActivePeer] = useState<string>('5FHneW...94ty');
  const [messageText, setMessageText] = useState('');
  const [transferAmountInput, setTransferAmountInput] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [conversations, setConversations] = useState<PeerConversation[]>([
    {
      address: '5FHneW...94ty',
      bnsName: 'ceiba-tech.bz',
      avatar: 'CT',
      lastMessage: 'Verified the OpenQASM 2.0 quantum gate execution on Ceiba testbed.',
      unread: 0,
      channel: 'libp2p-internet',
    },
    {
      address: '5FLSig...59Y',
      bnsName: 'ambergris-mesh.caye',
      avatar: 'AM',
      lastMessage: 'LoRa 915MHz solar beacon node live on San Pedro North Tower.',
      unread: 1,
      channel: 'lora-mesh-915mhz',
    },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'peer',
      text: 'Good morning! Sent the telemetry data for the Caye Caulker coral reef sensors.',
      timestamp: '10:24 AM',
      isEncrypted: true,
      channel: 'libp2p-internet',
    },
    {
      id: 'm2',
      sender: 'me',
      text: 'Received and verified on Pakit IPFS! Pushing the grant tranche now.',
      timestamp: '10:26 AM',
      isEncrypted: true,
      channel: 'libp2p-internet',
      transferAmount: '25.00 Ɗ',
    },
    {
      id: 'm3',
      sender: 'peer',
      text: 'Verified the OpenQASM 2.0 quantum gate execution on Ceiba testbed.',
      timestamp: '10:28 AM',
      isEncrypted: true,
      channel: 'libp2p-internet',
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'me',
      text: messageText,
      timestamp: 'Just now',
      isEncrypted: true,
      channel: 'libp2p-internet',
    };

    setMessages([...messages, newMsg]);
    setMessageText('');
    addNotification({ type: 'success', message: 'Message encrypted (Signal E2EE) & transmitted over BelizeChain libp2p!' });
  };

  const handleSendMicroTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmountInput) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'me',
      text: `Sent on-chain micro-transfer`,
      timestamp: 'Just now',
      isEncrypted: true,
      channel: 'libp2p-internet',
      transferAmount: `${transferAmountInput} Ɗ`,
    };

    setMessages([...messages, newMsg]);
    setShowTransferModal(false);
    setTransferAmountInput('');
    addNotification({
      type: 'success',
      message: `Transferred ${transferAmountInput} Ɗ directly inside E2EE chat!`,
    });
  };

  if (!isConnected || !selectedAccount) {
    return <ConnectWalletPrompt message="Connect your Maya Wallet to access sovereign E2EE citizen messaging." fullScreen />;
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
              <h1 className="text-xl font-bold">Encrypted Citizen Messaging</h1>
              <p className="text-xs text-slate-400">Signal-Protocol E2EE • LoRa Mesh Failover • Inline Micro-Pay</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
              <LockKey size={16} weight="bold" />
              E2EE Active
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-3 h-[600px] flex flex-col text-xs shadow-xl">
          <div className="flex items-center justify-between px-2">
            <span className="font-bold text-white text-sm">Direct Messages</span>
            <span className="px-2 py-0.5 bg-slate-800 rounded-lg text-slate-400 text-[10px]">2 Contacts</span>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1">
            {conversations.map((c) => (
              <div
                key={c.address}
                onClick={() => setActivePeer(c.address)}
                className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                  activePeer === c.address
                    ? 'bg-slate-800/90 border-cyan-500/50 shadow-md'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-slate-950 font-mono">
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white truncate">{c.bnsName}</span>
                      <span className="text-[10px] text-slate-500">10:28 AM</span>
                    </div>
                    <p className="text-slate-400 text-[11px] truncate mt-0.5">{c.lastMessage}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded-md font-mono flex items-center gap-1">
                        {c.channel === 'lora-mesh-915mhz' ? <Broadcast size={10} className="text-amber-400" /> : <WifiHigh size={10} className="text-emerald-400" />}
                        {c.channel === 'lora-mesh-915mhz' ? 'LoRa 915MHz' : 'libp2p'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 h-[600px] flex flex-col justify-between shadow-xl text-xs">
          {/* Active Contact Header */}
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-slate-950 font-mono text-xs">
                CT
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">ceiba-tech.bz</h3>
                <span className="text-slate-400 text-[10px] flex items-center gap-1">
                  <LockKey size={12} className="text-emerald-400" /> End-to-End Encrypted (Noise Protocol)
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowTransferModal(true)}
              className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Coins size={14} weight="bold" /> Send Ɗ
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl space-y-1.5 ${
                    m.sender === 'me'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="text-xs leading-relaxed">{m.text}</p>

                  {m.transferAmount && (
                    <div className="bg-slate-900/90 p-2.5 rounded-xl border border-emerald-500/40 flex items-center justify-between gap-3 text-xs font-mono">
                      <span className="text-slate-300">P2P Transfer:</span>
                      <span className="text-emerald-400 font-bold">{m.transferAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[9px] text-slate-300/70 pt-0.5">
                    <span>{m.timestamp}</span>
                    <span className="flex items-center gap-0.5">
                      <ShieldCheck size={10} /> E2EE
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-800/80 pt-3">
            <input
              type="text"
              placeholder="Type encrypted message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl flex items-center justify-center transition-all"
            >
              <PaperPlaneTilt size={16} weight="bold" />
            </button>
          </form>
        </div>
      </div>

      {/* Micro-Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-base flex items-center gap-2">
                <Coins size={20} className="text-emerald-400" />
                Send In-Chat Micro-Pay
              </span>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMicroTransfer} className="space-y-4">
              <div>
                <label className="text-slate-400 uppercase font-bold block mb-1">Amount (DALLA Ɗ)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={transferAmountInput}
                  onChange={(e) => setTransferAmountInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <PaperPlaneTilt size={14} weight="bold" /> Transfer Inside Chat
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
