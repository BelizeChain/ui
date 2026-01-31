'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  PaperPlaneTilt,
  User,
  At,
  Scan
} from 'phosphor-react';
import { useMessaging } from '@/contexts/MessagingContext';

export default function ComposeMessagePage() {
  const router = useRouter();
  const { sendMessage } = useMessaging();
  
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!recipient.trim() || !message.trim()) return;
    
    setSending(true);
    try {
      const success = await sendMessage(recipient, message);
      if (success) {
        router.push('/messages');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            <h1 className="text-white text-2xl font-bold">New Message</h1>
          </div>
          <button
            onClick={handleSend}
            disabled={!recipient.trim() || !message.trim() || sending}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center gap-2"
          >
            <PaperPlaneTilt size={20} weight="fill" />
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Recipient */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6"
        >
          <label className="text-gray-400 text-sm font-medium mb-3 block">
            Recipient
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <At size={20} className="text-gray-500" />
            </div>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter wallet address or ENS name"
              className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl pl-12 pr-14 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
              <Scan size={24} className="text-emerald-400" />
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Supports Ethereum addresses, ENS names, or BelizeChain addresses
          </p>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6"
        >
          <label className="text-gray-400 text-sm font-medium mb-3 block">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={8}
            className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-gray-500 text-xs">
              Messages are end-to-end encrypted
            </p>
            <p className="text-gray-500 text-xs">
              {message.length} / 10000
            </p>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-emerald-500/10 to-teal-600/10 backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/100/20 rounded-xl">
              <User size={24} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">Secure Messaging</h3>
              <p className="text-gray-400 text-sm">
                Your messages are automatically routed through the best available channel - XMTP when online or mesh network when offline. All messages are encrypted and synced to IPFS for permanence.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
