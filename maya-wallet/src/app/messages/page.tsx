'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
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
  WifiHigh
} from 'phosphor-react';
import { useWallet } from '@/contexts/WalletContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { GlassCard } from '@/components/ui';

export default function MessagesPage() {
  const router = useRouter();
  const { selectedAccount } = useWallet();
  const {
    conversations,
    emergencyAlerts,
    pendingSyncCount,
    sendMessage: sendMessageViaContext,
    syncToPakit
  } = useMessaging();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    const success = await sendMessageViaContext(selectedConversation, messageInput);
    if (success) {
      setMessageInput('');
    }
  };

  const activeConversation = conversations.find(c => c.peerAddress === selectedConversation);
  const filteredConversations = conversations.filter(c => 
    (c.peerName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.peerAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-2xl font-bold">Messages</h1>
          <button 
            onClick={() => router.push('/messages/compose')}
            className="p-2 hover:bg-emerald-500/100/20 rounded-full transition-colors"
          >
            <PlusCircle size={28} className="text-emerald-400" weight="fill" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlass 
            size={20} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" 
            weight="bold" 
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4 h-[calc(100vh-280px)]">
        {/* Emergency Alerts Banner */}
        {emergencyAlerts.length > 0 && (
          <div className="col-span-full mb-4 px-6">
            <GlassCard variant="dark-medium" blur="lg" className="bg-red-900/20 p-4">
              <div className="flex items-start gap-3">
                <Warning size={24} className="text-red-400 flex-shrink-0 mt-0.5" weight="fill" />
                <div className="flex-1">
                  <p className="text-red-400 font-semibold mb-1">🚨 Emergency Alert</p>
                  <p className="text-white text-sm">{emergencyAlerts[0].message}</p>
                  <p className="text-red-300 text-xs mt-1">{emergencyAlerts[0].district}</p>
                </div>
              </div>
            </GlassCard>
          </div>
        )}  

        {/* Sync Status */}
        {pendingSyncCount > 0 && (
          <div className="col-span-full mb-4 px-6">
            <GlassCard variant="dark-medium" blur="lg" className="bg-purple-900/20">
              <button
                onClick={syncToPakit}
                className="w-full p-4 hover:bg-purple-500/10 transition-colors rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CloudArrowUp size={24} className="text-purple-400" weight="fill" />
                    <div className="text-left">
                      <p className="text-purple-400 font-semibold">{pendingSyncCount} messages pending sync</p>
                      <p className="text-purple-300 text-sm">Tap to upload to Pakit</p>
                    </div>
                  </div>
                  <div className="text-purple-400">→</div>
                </div>
              </button>
            </GlassCard>
          </div>
        )}

        {/* Conversation List */}
        <div className={`md:col-span-1 overflow-y-auto ${selectedConversation ? 'hidden md:block' : 'block'}`}>
          <div className="px-6 py-4 space-y-2">
            {filteredConversations.map((conversation) => (
              <motion.button
                key={conversation.peerAddress}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedConversation(conversation.peerAddress)}
                className="w-full"
              >
                <GlassCard 
                  variant="dark-medium" 
                  blur="lg" 
                  className={`p-4 transition-all ${
                    selectedConversation === conversation.peerAddress
                      ? 'ring-2 ring-emerald-500'
                      : 'hover:bg-gray-800/50'
                  }`}
                >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl">
                      {conversation.peerName?.[0] || '👤'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-white truncate">
                        {conversation.peerName || conversation.peerAddress.slice(0, 8)}
                      </h3>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {conversation.lastMessage?.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 font-mono truncate">
                      {conversation.peerAddress.slice(0, 8)}...{conversation.peerAddress.slice(-6)}
                    </p>
                  </div>

                  {/* Unread Badge */}
                  {conversation.unreadCount > 0 && (
                    <div className="w-6 h-6 bg-emerald-500/100 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{conversation.unreadCount}</span>
                    </div>
                  )}
                </div>
              </GlassCard>
              </motion.button>
            ))}

            {filteredConversations.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="text-gray-400 mx-auto mb-3" weight="fill" />
                <p className="text-gray-400 font-medium">No conversations found</p>
                <p className="text-gray-400 text-sm mt-1">Try a different search</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`md:col-span-2 ${selectedConversation ? 'block' : 'hidden md:block'}`}>
          {selectedConversation ? (
            <GlassCard variant="dark-medium" blur="lg" className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden text-gray-400 hover:text-white"
                  >
                    ←
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl">
                    {activeConversation?.peerName?.[0] || '👤'}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">
                      {activeConversation?.peerName || activeConversation?.peerAddress.slice(0, 12)}
                    </h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <WifiHigh size={12} weight="fill" /> Secure Messaging
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-700/50 rounded-full transition-colors">
                  <DotsThreeVertical size={24} className="text-gray-400" weight="bold" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {activeConversation?.messages.map((message) => {
                  const isSent = message.sender === selectedAccount?.address;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isSent ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            isSent
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                              : 'bg-gray-700 text-white'
                          }`}
                        >
                          <p>{message.content}</p>
                        </div>
                        <div className="flex items-center gap-2 px-2">
                          <span className="text-xs text-gray-400">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isSent && (
                            <span className="text-emerald-400">
                              {message.status === 'read' && <CheckCircle size={14} weight="fill" />}
                              {message.status === 'delivered' && <CheckCircle size={14} />}
                              {message.status === 'sent' && <Clock size={14} />}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {message.via === 'mesh' && '📻'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Message Input */}
              <div className="px-6 py-4 border-t border-gray-700/50">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
                  >
                    <PaperPlaneTilt size={24} className="text-white" weight="fill" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <div className="w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
                  <Phone size={48} className="text-gray-400" weight="fill" />
                </div>
                <h3 className="text-white text-xl font-bold mb-2">Select a conversation</h3>
                <p className="text-gray-400">Choose from your existing conversations or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
