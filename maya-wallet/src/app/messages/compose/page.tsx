'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  PaperPlaneTilt,
  At,
  ShieldCheck,
  LockKey,
  Broadcast,
} from 'phosphor-react';
import { useMessaging } from '@/contexts/MessagingContext';
import { useUIStore } from '@/store/ui';


export default function ComposeMessagePage() {
  const router = useRouter();
  const { sendMessage } = useMessaging();
  const { addNotification } = useUIStore();

  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!recipient.trim() || !message.trim()) return;

    setSending(true);
    try {
      const sent = await sendMessage(recipient.trim(), message.trim());
      if (!sent) {
        addNotification({
          type: 'error',
          message: 'The message was not transported. Check mesh availability or register a gateway node.',
        });
        return;
      }
      router.push('/messages');
    } catch (error) {
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send message.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-teal-500/30">
      {/* Header */}
      <header className="sticky top-0 bg-slate-950/85 backdrop-blur-2xl border-b border-slate-800/80 px-4 sm:px-6 py-4 z-20 shadow-lg shadow-black/40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/messages" className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={22} weight="bold" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                New Sovereign Message
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Signed SR25519 • Mesh / gateway transport
              </p>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!recipient.trim() || !message.trim() || sending}
            className="px-5 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-teal-500/25 transition-all flex items-center gap-2"
          >
            <PaperPlaneTilt size={16} weight="bold" />
            <span>{sending ? 'Transmitting…' : 'Transmit'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Recipient Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <label className="text-slate-300 text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
              <At size={16} className="text-teal-400" />
              <span>Recipient Address or BNS Handle</span>
            </label>
            <span className="text-[11px] font-mono text-teal-400 flex items-center gap-1">
              <LockKey size={13} /> Signature required
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. ceiba-tech.bz or r1…"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-teal-500/60 transition-all"
            />
          </div>

          {/* The wallet has no verified-contacts registry, so no quick-pick list
              is offered. An earlier version suggested four invented BNS handles. */}
        </motion.div>

        {/* Message Input Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4"
        >
          <label className="text-slate-300 text-xs font-bold uppercase tracking-wider font-mono block">
            Message Body
          </label>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Compose confidential message, peer-to-peer inquiry, or district assembly note..."
            rows={7}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/60 transition-all resize-none font-sans leading-relaxed"
          />

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
            <span className="flex items-center gap-1.5 text-teal-400">
              <ShieldCheck size={14} /> Signed with your wallet key — the transport does not encrypt
            </span>
            <span>{message.length} / 5000</span>
          </div>
        </motion.div>

        {/* Security & Protocol Notice */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-teal-500/20 p-5 space-y-2 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl shrink-0 mt-0.5 border border-teal-500/20">
              <Broadcast size={20} weight="bold" />
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <h4 className="font-bold text-white">Transport Architecture</h4>
              <p className="text-slate-400 leading-relaxed">
                When the account owns an active gateway node, a message settles on chain through
                pallet mesh. Otherwise it is queued over the Bluetooth LE / 915MHz LoRa GATT pipe
                with a TTL hop count and a Pakit store-and-forward backup. Payloads are signed; they
                are not encrypted.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
