'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import EmergencyBroadcastPanel from '@/components/EmergencyBroadcastPanel';
import {
  getEmergencyAlerts,
  getDistrictAlertLoads,
  getMeshNetworkCoverage,
  type DistrictAlertLoad,
  type EmergencyAlert,
  type MeshNetworkCoverage,
} from '@/services/pallets/mesh';
import {
  MagnifyingGlass,
  PaperPlaneTilt,
  PlusCircle,
  ShieldCheck,
  ShieldWarning,
  LockKey,
  Broadcast,
  WifiHigh,
  User,
  ArrowLeft,
  X,
  Radio,
} from 'phosphor-react';

type Tab = 'direct' | 'districts' | 'emergency';

/**
 * Sovereign messaging hub.
 *
 * Every conversation shown here comes from `MessagingContext`, which persists
 * to local storage and routes through the BLE/LoRa mesh plus Pakit, or settles
 * on chain when the account owns an active gateway node. This page previously
 * seeded four invented conversations (with fabricated addresses, BNS handles
 * and transaction hashes), three invented district channels with invented node
 * counts, and a fabricated NEMO advisory — all of which have been removed.
 */
export default function MessagesPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { conversations, isMeshAvailable, pendingSyncCount, gatewayStatus, sendMessage, initializeMesh } =
    useMessaging();
  const { addNotification } = useUIStore();

  const [activeTab, setActiveTab] = useState<Tab>('direct');
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newPeerAddress, setNewPeerAddress] = useState('');

  // On-chain mesh data (districts + emergency feed).
  const [districtLoads, setDistrictLoads] = useState<DistrictAlertLoad[]>([]);
  const [coverage, setCoverage] = useState<MeshNetworkCoverage | null>(null);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [isLoadingChain, setIsLoadingChain] = useState(false);
  const [chainError, setChainError] = useState('');

  const loadChainData = useCallback(async () => {
    setIsLoadingChain(true);
    setChainError('');
    try {
      const [loads, networkCoverage, emergency] = await Promise.all([
        getDistrictAlertLoads(),
        getMeshNetworkCoverage(),
        getEmergencyAlerts(),
      ]);
      setDistrictLoads(loads);
      setCoverage(networkCoverage);
      setAlerts(emergency);
    } catch (err) {
      setChainError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoadingChain(false);
    }
  }, []);

  useEffect(() => {
    // Deferred so the initial load doesn't set state during the effect body
    // (react-hooks/set-state-in-effect).
    Promise.resolve().then(loadChainData);
  }, [loadChainData]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.peerAddress === selectedPeer) ?? null,
    [conversations, selectedPeer],
  );

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        (c.peerName ?? '').toLowerCase().includes(query) ||
        c.peerAddress.toLowerCase().includes(query),
    );
  }, [conversations, searchQuery]);

  const filteredDistricts = useMemo(() => {
    if (!searchQuery.trim()) return districtLoads;
    const query = searchQuery.toLowerCase();
    return districtLoads.filter((d) => d.district.toLowerCase().includes(query));
  }, [districtLoads, searchQuery]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation) return;

    setIsSending(true);
    try {
      const sent = await sendMessage(activeConversation.peerAddress, messageInput.trim());
      if (sent) {
        setMessageInput('');
      } else {
        addNotification({
          type: 'error',
          message: 'Message was not transported. Check mesh availability and try again.',
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    const peer = newPeerAddress.trim();
    if (!peer) return;

    // A conversation is created by actually sending through the transport, so
    // there is no fabricated "E2EE session established" handshake message.
    setIsSending(true);
    try {
      const sent = await sendMessage(peer, 'Hello — new conversation.');
      if (!sent) {
        addNotification({ type: 'error', message: 'Could not reach that peer. Nothing was queued.' });
        return;
      }
      addNotification({
        type: 'success',
        message: sent ? `Conversation opened with ${peer}.` : 'Not sent.',
      });
      setShowNewChat(false);
      setNewPeerAddress('');
      setSelectedPeer(peer);
      setActiveTab('direct');
      setShowMobileChat(true);
    } finally {
      setIsSending(false);
    }
  };

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to access sovereign citizen messaging and the LoRa mesh alert feed."
        fullScreen
      />
    );
  }

  const transportLabel = gatewayStatus?.hasGateway
    ? 'Chain-settled gateway'
    : isMeshAvailable
      ? 'BLE / LoRa mesh'
      : 'Offline — no transport';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 selection:bg-teal-500/30">
      {/* Header */}
      <header className="sticky top-0 bg-slate-950/85 backdrop-blur-2xl border-b border-slate-800/80 px-4 sm:px-6 py-3.5 z-30 shadow-lg shadow-black/40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={22} weight="bold" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Sovereign Messaging &amp; Mesh
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Transport: {transportLabel}
                {pendingSyncCount > 0 ? ` • ${pendingSyncCount} pending sync` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 ${
                isMeshAvailable
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              }`}
            >
              {isMeshAvailable ? (
                <WifiHigh size={13} weight="bold" />
              ) : (
                <Broadcast size={13} weight="bold" />
              )}
              {isMeshAvailable ? 'Mesh transport available' : 'Mesh transport unavailable'}
            </span>

            {!isMeshAvailable && (
              <button
                onClick={() => initializeMesh()}
                className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              >
                Try to initialise mesh
              </button>
            )}

            <Link
              href="/messages/compose"
              className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:text-white flex items-center gap-1.5"
            >
              <PaperPlaneTilt size={13} weight="bold" />
              Compose
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-6">
        {/* Tabs */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="inline-flex p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-inner">
            {(['direct', 'districts', 'emergency'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setShowMobileChat(false);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab
                    ? tab === 'emergency'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : tab === 'emergency'
                      ? 'text-amber-400/80 hover:text-amber-300'
                      : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'direct' ? (
                  <User size={15} weight="bold" />
                ) : tab === 'districts' ? (
                  <Radio size={15} weight="bold" />
                ) : (
                  <ShieldWarning size={15} weight="bold" />
                )}
                <span>
                  {tab === 'direct' ? 'Conversations' : tab === 'districts' ? 'District Mesh' : 'Emergency Alerts'}
                </span>
                {tab === 'direct' && (
                  <span className="px-1.5 rounded-md text-[10px] bg-slate-950/40 font-mono">
                    {conversations.length}
                  </span>
                )}
                {tab === 'emergency' && alerts.length > 0 && (
                  <span className="px-1.5 rounded-full text-[10px] bg-amber-950/40 font-mono">
                    {alerts.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadChainData}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-2xl text-xs font-bold"
            >
              Refresh on-chain data
            </button>
            {activeTab === 'direct' && (
              <button
                onClick={() => setShowNewChat(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-teal-400 border border-teal-500/30 hover:border-teal-400/60 rounded-2xl text-xs font-bold transition-all"
              >
                <PlusCircle size={16} weight="bold" />
                <span>New Conversation</span>
              </button>
            )}
          </div>
        </div>

        {chainError && (
          <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {chainError}
          </div>
        )}

        {/* Emergency tab */}
        {activeTab === 'emergency' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <ShieldWarning size={24} weight="fill" className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-300">Emergency Broadcast Feed</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Read from mesh.emergencyAlerts. Only accounts registered in
                  mesh.emergencyAuthorities (NEMO) can issue an alert; the issuance form
                  appears below when the connected account holds that role.
                </p>
              </div>
            </div>

            {selectedAccount && <EmergencyBroadcastPanel address={selectedAccount.address} />}

            {isLoadingChain && <div className="text-center py-8 text-slate-400 text-xs">Loading alerts…</div>}
            {!isLoadingChain && alerts.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs">
                No emergency alerts on chain.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-slate-900/80 border border-amber-500/30 rounded-3xl p-5 space-y-3 shadow-lg shadow-black/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider">
                      {alert.severity} · {alert.alertType}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {alert.createdAt ? new Date(alert.createdAt * 1000).toLocaleString() : '—'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">{alert.message}</p>

                  <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                    <span>District: {alert.district}</span>
                    <span>Issuer: {alert.issuer.slice(0, 12)}…</span>
                    <span>
                      Radius: {alert.radiusMeters} m @ {alert.latitude.toFixed(3)},{' '}
                      {alert.longitude.toFixed(3)}
                    </span>
                    <span>
                      Relays {alert.relayCount} · Confirmations {alert.confirmations}
                    </span>
                    <span className={alert.resolved ? 'text-emerald-400' : 'text-amber-300'}>
                      {alert.resolved ? 'Resolved' : 'Active'}
                    </span>
                    {alert.expiresAt > 0 && (
                      <span>Expires {new Date(alert.expiresAt * 1000).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Districts tab */}
        {activeTab === 'districts' && (
          <div className="space-y-5">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio size={20} className="text-teal-400" />
                Mesh Network Coverage
              </h3>
              {coverage ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Nodes</span>
                    <span className="text-white font-bold">{coverage.totalNodes}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Active</span>
                    <span className="text-emerald-400 font-bold">{coverage.activeNodes}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Gateways</span>
                    <span className="text-cyan-300 font-bold">{coverage.gatewayNodes}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Alerts Sent</span>
                    <span className="text-amber-300 font-bold">{coverage.emergencyAlertsSent}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Messages Relayed</span>
                    <span className="text-white font-bold">{coverage.messagesRelayed}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Tx Relayed</span>
                    <span className="text-white font-bold">{coverage.transactionsRelayed}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Last Seen Block</span>
                    <span className="text-slate-300 font-bold">{coverage.lastSeenBlock ?? '—'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Mesh network aggregates are unavailable — the pallet did not answer.
                </p>
              )}
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-base font-bold text-white">Active Alerts by District</h3>
              <p className="text-xs text-slate-400">
                From mesh.activeAlertCountPerDistrict. There is no per-district repeater count on
                chain — a node region is a LoRa frequency band, not a geographic district.
              </p>

              {isLoadingChain && <div className="text-center py-6 text-slate-400 text-xs">Loading…</div>}
              {!isLoadingChain && filteredDistricts.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">No district data available.</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredDistricts.map((district) => (
                  <div
                    key={district.district}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-slate-200">{district.district}</span>
                    <span
                      className={`text-sm font-mono font-bold ${
                        district.activeAlerts > 0 ? 'text-amber-300' : 'text-slate-500'
                      }`}
                    >
                      {district.activeAlerts}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Direct messages */}
        {activeTab === 'direct' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-[650px]">
            {/* Conversation list */}
            <div
              className={`md:col-span-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 flex flex-col shadow-xl ${
                showMobileChat ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="relative mb-3">
                <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search peer address or name…"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-all font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No conversations yet. Start one, or open Compose to send through the real
                    transport.
                  </div>
                ) : (
                  filteredConversations.map((c) => {
                    const isSelected = c.peerAddress === selectedPeer;
                    return (
                      <div
                        key={c.peerAddress}
                        onClick={() => {
                          setSelectedPeer(c.peerAddress);
                          setShowMobileChat(true);
                        }}
                        className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-slate-900 border-teal-500/40 shadow-lg shadow-teal-950/30'
                            : 'bg-slate-950/40 border-slate-800 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-xs truncate font-mono">
                            {c.peerName || c.peerAddress}
                          </span>
                          {c.unreadCount > 0 && (
                            <span className="px-1.5 rounded-full text-[10px] bg-teal-500/20 text-teal-300 font-mono">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-[11px] truncate mt-0.5">
                          {c.lastMessage?.content ?? 'No messages yet'}
                        </p>
                        {c.lastMessage?.via === 'chain' && c.lastMessage.proofHash && (
                          <span className="text-[9px] font-mono text-teal-400 mt-1 block truncate">
                            anchor {c.lastMessage.proofHash.slice(0, 18)}…
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Active conversation */}
            <div
              className={`md:col-span-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-xl ${
                !showMobileChat ? 'hidden md:flex' : 'flex'
              }`}
            >
              {activeConversation ? (
                <>
                  <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3.5">
                    <button
                      onClick={() => setShowMobileChat(false)}
                      className="md:hidden p-1.5 hover:bg-slate-800 rounded-xl text-slate-400"
                    >
                      <ArrowLeft size={18} weight="bold" />
                    </button>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shrink-0">
                      <User size={18} weight="bold" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-sm truncate font-mono">
                        {activeConversation.peerName || activeConversation.peerAddress}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <LockKey size={11} className="text-teal-400" />
                        {transportLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 py-4">
                    {activeConversation.messages.length === 0 && (
                      <p className="text-center text-slate-500 text-xs py-8">
                        No messages in this conversation yet.
                      </p>
                    )}
                    {activeConversation.messages.map((m) => {
                      const isMine = m.sender === selectedAccount.address;
                      return (
                        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs ${
                              isMine
                                ? 'bg-teal-600/30 border border-teal-500/40 text-slate-100'
                                : 'bg-slate-950 border border-slate-800 text-slate-200'
                            }`}
                          >
                            <p className="leading-relaxed break-words">{m.content}</p>
                            <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-slate-400">
                              <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                              <span>·</span>
                              <span>{m.via === 'chain' ? 'chain' : 'mesh'}</span>
                              <span>·</span>
                              <span>{m.status}</span>
                            </div>
                            {m.proofHash && (
                              <span className="text-[9px] font-mono text-teal-400 block truncate">
                                {m.proofHash}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Write a message…"
                      className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !messageInput.trim()}
                      className="px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5"
                    >
                      <PaperPlaneTilt size={16} weight="bold" />
                      {isSending ? 'Sending…' : 'Send'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="my-auto text-center space-y-3">
                  <ShieldCheck size={32} className="text-slate-600 mx-auto" weight="fill" />
                  <p className="text-sm font-bold text-slate-300">No conversation selected</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Pick a conversation on the left, start a new one, or use Compose to send through
                    the mesh / gateway transport.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* New conversation */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-teal-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 relative">
            <button
              onClick={() => setShowNewChat(false)}
              className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Start a conversation</h3>
              <p className="text-xs text-slate-400">
                Enter the peer&apos;s SS58 address. An opening message is sent through the real
                transport to create the conversation.
              </p>
            </div>

            <form onSubmit={handleStartConversation} className="space-y-4">
              <input
                type="text"
                required
                value={newPeerAddress}
                onChange={(e) => setNewPeerAddress(e.target.value)}
                placeholder="r1… or 5…"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white font-mono focus:border-teal-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <PaperPlaneTilt size={16} weight="bold" />
                {isSending ? 'Sending…' : 'Send and open'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
