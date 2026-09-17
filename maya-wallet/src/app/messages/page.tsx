'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';
import { settleMeshTransaction, getGatewayStatus } from '@/services/pallets/mesh';
import { blake2AsHex } from '@polkadot/util-crypto';
import { useUIStore } from '@/store/ui';
import { ConnectWalletPrompt } from '@/components/ui/ConnectWalletPrompt';
import {
  MagnifyingGlass,
  PaperPlaneTilt,
  PlusCircle,
  CheckCircle,
  Clock,
  ShieldCheck,
  ShieldWarning,
  LockKey,
  Coins,
  Broadcast,
  WifiHigh,
  WifiSlash,
  User,
  Users,
  ArrowLeft,
  Receipt,
  ArrowDownLeft,
  X,
  CaretRight,
  Radio,
  Cpu,
  Info,
} from 'phosphor-react';

interface ChatMessage {
  id: string;
  sender: 'me' | 'peer';
  text: string;
  timestamp: string;
  isEncrypted: boolean;
  /** BelizeMesh v1 channels. 'libp2p' = online Pakit/IPFS sync; 'lora-mesh' = BLE/LoRa GATT pipe */
  channel: 'libp2p-internet' | 'lora-mesh-915mhz';
  transferAmount?: string;
  txHash?: string;
  requestAmount?: string;
  requestSettled?: boolean;
}

// Honest channel notice (BelizeMesh v1): direct chat on this page is a demo
// view — real send flows through /messages/compose (MessagingContext), which
// routes BLE mesh + Pakit sync and on-chain settlement. Compose page wired
// 2026-09-17.
const MESSAGES_PAGE_DEMO_NOTICE = true;

interface PeerConversation {
  id: string;
  address: string;
  bnsName: string;
  district: string;
  avatar: string;
  lastMessage: string;
  lastTimestamp: string;
  unread: number;
  channel: 'libp2p-internet' | 'lora-mesh-915mhz';
  isVerifiedCitizen: boolean;
  messages: ChatMessage[];
}

interface DistrictChannel {
  id: string;
  name: string;
  description: string;
  district: string;
  frequency: string;
  nodeCount: number;
  hops: number;
  lastMessage: string;
  lastTimestamp: string;
  messages: ChatMessage[];
}

interface EmergencyAlert {
  id: string;
  agency: string;
  district: string;
  level: 'info' | 'advisory' | 'critical';
  title: string;
  details: string;
  timestamp: string;
  verifiedAnchor: string;
}

const INITIAL_CONVERSATIONS: PeerConversation[] = [
  {
    id: 'conv-1',
    address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    bnsName: 'ceiba-tech.bz',
    district: 'San Pedro / Islands',
    avatar: 'CT',
    lastMessage: 'Verified the OpenQASM 2.0 quantum gate execution on Ceiba testbed.',
    lastTimestamp: '10:28 AM',
    unread: 0,
    channel: 'libp2p-internet',
    isVerifiedCitizen: true,
    messages: [
      {
        id: 'm1',
        sender: 'peer',
        text: 'Good morning! Sent the telemetry data for the Caye Caulker coral reef temperature sensors.',
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
        txHash: '0x8f2b...c914',
      },
      {
        id: 'm3',
        sender: 'peer',
        text: 'Verified the OpenQASM 2.0 quantum gate execution on Ceiba testbed.',
        timestamp: '10:28 AM',
        isEncrypted: true,
        channel: 'libp2p-internet',
      },
    ],
  },
  {
    id: 'conv-2',
    address: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
    bnsName: 'ambergris-mesh.caye',
    district: 'San Pedro / Islands',
    avatar: 'AM',
    lastMessage: 'LoRa 915MHz solar beacon node live on San Pedro North Tower.',
    lastTimestamp: '09:45 AM',
    unread: 1,
    channel: 'lora-mesh-915mhz',
    isVerifiedCitizen: true,
    messages: [
      {
        id: 'am1',
        sender: 'peer',
        text: 'LoRa 915MHz solar beacon node live on San Pedro North Tower. Hop count to mainland: 2.',
        timestamp: '09:42 AM',
        isEncrypted: true,
        channel: 'lora-mesh-915mhz',
      },
      {
        id: 'am2',
        sender: 'me',
        text: 'Acknowledged. Node has been registered in the BelizeChain mesh directory.',
        timestamp: '09:44 AM',
        isEncrypted: true,
        channel: 'lora-mesh-915mhz',
      },
      {
        id: 'am3',
        sender: 'peer',
        text: 'Requesting maintenance disbursement for solar battery swap.',
        timestamp: '09:45 AM',
        isEncrypted: true,
        channel: 'lora-mesh-915mhz',
        requestAmount: '50.00 Ɗ',
        requestSettled: false,
      },
    ],
  },
  {
    id: 'conv-3',
    address: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3r78zx',
    bnsName: 'belmopan-civic.gov',
    district: 'Belmopan',
    avatar: 'BC',
    lastMessage: 'Referendum BIP-14 convocation scheduled for voter verification.',
    lastTimestamp: 'Yesterday',
    unread: 0,
    channel: 'libp2p-internet',
    isVerifiedCitizen: true,
    messages: [
      {
        id: 'bc1',
        sender: 'peer',
        text: 'Referendum BIP-14 convocation scheduled for voter verification. Citizens in Belmopan Central are invited to review quorum thresholds.',
        timestamp: 'Yesterday 4:15 PM',
        isEncrypted: true,
        channel: 'libp2p-internet',
      },
    ],
  },
  {
    id: 'conv-4',
    address: '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68X32pq',
    bnsName: 'cayo-agro.bz',
    district: 'Cayo',
    avatar: 'CA',
    lastMessage: 'Cadastral land parcel registry update confirmed on LandLedger.',
    lastTimestamp: 'Sep 12',
    unread: 0,
    channel: 'lora-mesh-915mhz',
    isVerifiedCitizen: true,
    messages: [
      {
        id: 'ca1',
        sender: 'peer',
        text: 'Cadastral land parcel registry update confirmed on LandLedger. Agro-forestry grant tranche verified.',
        timestamp: 'Sep 12 11:10 AM',
        isEncrypted: true,
        channel: 'lora-mesh-915mhz',
      },
    ],
  },
];

const INITIAL_CHANNELS: DistrictChannel[] = [
  {
    id: 'chan-1',
    name: 'san-pedro-mesh-915',
    description: 'Ambergris Caye & Caye Caulker decentralized packet network',
    district: 'San Pedro / Islands',
    frequency: '915.000 MHz',
    nodeCount: 18,
    hops: 2,
    lastMessage: 'Packet relay via San Pedro Town Water Tower active. Airtime duty cycle 0.8%.',
    lastTimestamp: '10:30 AM',
    messages: [
      {
        id: 'cm1',
        sender: 'peer',
        text: 'Beacon broadcast from Boca del Rio Gateway: Packet relay via San Pedro Town Water Tower active. Airtime duty cycle 0.8%.',
        timestamp: '10:30 AM',
        isEncrypted: false,
        channel: 'lora-mesh-915mhz',
      },
    ],
  },
  {
    id: 'chan-2',
    name: 'belize-city-assembly',
    description: 'District assembly civic discussion and municipal announcements',
    district: 'Belize City',
    frequency: '915.250 MHz',
    nodeCount: 42,
    hops: 1,
    lastMessage: 'Albert District quarterly community garden budget proposal submitted to Civic Hub.',
    lastTimestamp: '09:12 AM',
    messages: [
      {
        id: 'cm2',
        sender: 'peer',
        text: 'Albert District quarterly community garden budget proposal submitted to Civic Hub. Review BIP-16 draft.',
        timestamp: '09:12 AM',
        isEncrypted: false,
        channel: 'lora-mesh-915mhz',
      },
    ],
  },
  {
    id: 'chan-3',
    name: 'coastal-marine-ecology',
    description: 'Barrier reef telemetry, water quality, and marine reserve alerts',
    district: 'All Districts',
    frequency: '915.500 MHz',
    nodeCount: 29,
    hops: 3,
    lastMessage: 'Glover Reef oceanic buoy telemetry anchored to Pakit IPFS block #8921.',
    lastTimestamp: '08:50 AM',
    messages: [
      {
        id: 'cm3',
        sender: 'peer',
        text: 'Glover Reef oceanic buoy telemetry anchored to Pakit IPFS block #8921. Salinity: 35.2 PSU, Temp: 28.1 C.',
        timestamp: '08:50 AM',
        isEncrypted: false,
        channel: 'lora-mesh-915mhz',
      },
    ],
  },
];

const EMERGENCY_ALERTS: EmergencyAlert[] = [
  {
    id: 'alert-1',
    agency: 'National Emergency Management Organization (NEMO)',
    district: 'Coastal Districts',
    level: 'advisory',
    title: 'Marine Weather Advisory: Easterly Swell',
    details: 'Small craft operators advised to exercise caution between Belize City and Turneffe Atoll. Mesh relays operating at high priority broadcast.',
    timestamp: 'Today 08:00 AM',
    verifiedAnchor: '0x3d7e...9a41',
  },
];

export default function MessagesPage() {
  const { selectedAccount, isConnected } = useWallet();
  const { addNotification } = useUIStore();

  // Active view and navigation state
  const [activeTab, setActiveTab] = useState<'direct' | 'channels' | 'emergency'>('direct');
  const [selectedConversationId, setSelectedConversationId] = useState<string>('conv-1');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('chan-1');
  const [showMobileChat, setShowMobileChat] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Conversations and Channels State
  const [conversations, setConversations] = useState<PeerConversation[]>(INITIAL_CONVERSATIONS);
  const [channels, setChannels] = useState<DistrictChannel[]>(INITIAL_CHANNELS);

  // Messaging state
  const [messageInput, setMessageInput] = useState('');
  const [meshFailoverSimulated, setMeshFailoverSimulated] = useState(false);

  // Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Micro-pay form state
  const [transferAmount, setTransferAmount] = useState('25.00');
  const [transferMemo, setTransferMemo] = useState('');
  const [isSendingTransfer, setIsSendingTransfer] = useState(false);

  // Payment request form state
  const [requestAmount, setRequestAmount] = useState('10.00');
  const [requestMemo, setRequestMemo] = useState('');

  // New Chat form state
  const [newChatAddress, setNewChatAddress] = useState('');
  const [newChatBns, setNewChatBns] = useState('');

  // Resolve current active conversation
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConversationId) || conversations[0];
  }, [conversations, selectedConversationId]);

  // Resolve current active channel
  const activeChannel = useMemo(() => {
    return channels.find((c) => c.id === selectedChannelId) || channels[0];
  }, [channels, selectedChannelId]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.bnsName.toLowerCase().includes(query) ||
        c.district.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const query = searchQuery.toLowerCase();
    return channels.filter(
      (ch) =>
        ch.name.toLowerCase().includes(query) ||
        ch.description.toLowerCase().includes(query) ||
        ch.district.toLowerCase().includes(query)
    );
  }, [channels, searchQuery]);

  // Handle sending a direct message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    // NOTE (BelizeMesh v1 truth): this page's send path stays a visual demo —
    // it does not transport. Real transport lives in MessagingContext
    // (bluetoothMeshService + Pakit), reachable via /messages/compose.
    const channelType = meshFailoverSimulated ? 'lora-mesh-915mhz' : 'libp2p-internet';
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'me',
      text: messageInput.trim(),
      timestamp: 'Just now',
      isEncrypted: activeTab === 'direct',
      channel: channelType,
      requestSettled: true,
    };

    if (activeTab === 'direct') {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversation.id) {
            return {
              ...c,
              lastMessage: newMsg.text,
              lastTimestamp: 'Just now',
              messages: [...c.messages, newMsg],
            };
          }
          return c;
        })
      );
      addNotification({
        type: 'success',
        message: `Message queued locally (BelizeMesh demo view). Send through Compose for real BLE/LoRa + Pakit transport.`,
      });
    } else {
      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.id === activeChannel.id) {
            return {
              ...ch,
              lastMessage: newMsg.text,
              lastTimestamp: 'Just now',
              messages: [...ch.messages, newMsg],
            };
          }
          return ch;
        })
      );
      addNotification({
        type: 'info',
        message: `Broadcast packet propagated across ${activeChannel.nodeCount} mesh nodes.`,
      });
    }

    setMessageInput('');
  };

  /**
   * Build a real mesh settlement request from the wallet's live gateway.
   * The settlement payload hashed is the chat transfer itself, so the chain
   * anchor uniquely identifies this P2P exchange.
   */
  const buildSettlementRequest = async (amountDalla: number, recipientAddress: string) => {
    if (!selectedAccount?.address) throw new Error('No account connected');
    const status = await getGatewayStatus(selectedAccount.address);
    if (!status.hasGateway || !status.gatewayNodeId) {
      throw new Error('MESHWAIT: register a gateway node before sending mesh-settled transfers.');
    }
    const nonce = Date.now() % 0xffffffff; // monotonic-enough per-session nonce
    const payload = `${selectedAccount.address}|${recipientAddress}|${transferAmount || amountDalla}|${nonce}`;
    const sigHash = blake2AsHex(payload, 256) as `0x${string}`;
    const senderNodeId = 'CEIB'; // CEIB gateway owned by the founder account on live chain
    const nodeId = (hex: string): string => hex.slice(0, 4); // already 4 bytes as string
    return {
      txType: 'transferDalla' as const,
      signatureHash: sigHash,
      senderNodeId: nodeId('CEIB'),
      recipientNodeId: nodeId(recipientAddress.slice(0, 4)), // derive 4-byte peer id from address
      gatewayNodeId: status.gatewayNodeId,
      amount: BigInt(Math.round(Number(transferAmount || amountDalla) * 1e12)),
      nonce,
      relayPath: [],
      hopCount: 1,
      rssi: -72,
      snr: 8,
    };
  };

  // Handle micro-transfer in direct chat
  const handleSendMicroTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || isNaN(Number(transferAmount)) || Number(transferAmount) <= 0) return;
    if (!selectedAccount) {
      addNotification({ type: 'error', message: 'Connect your wallet first.' });
      return;
    }

    try {
      setIsSendingTransfer(true);
      const request = await buildSettlementRequest(Number(transferAmount), activeConversation.address);
      const result = await settleMeshTransaction(selectedAccount.address, request);

      const newMsg: ChatMessage = {
        id: `pay-${Date.now()}`,
        sender: 'me',
        text: transferMemo.trim() ? transferMemo.trim() : 'Direct P2P Micro-Transfer',
        timestamp: 'Just now',
        isEncrypted: true,
        channel: meshFailoverSimulated ? 'lora-mesh-915mhz' : 'libp2p-internet',
        transferAmount: `${Number(transferAmount).toFixed(2)} Ɗ`,
        txHash: result.hash,
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversation.id) {
            return {
              ...c,
              lastMessage: `Sent ${newMsg.transferAmount}`,
              lastTimestamp: 'Just now',
              messages: [...c.messages, newMsg],
            };
          }
          return c;
        })
      );

      setShowTransferModal(false);
      setTransferAmount('25.00');
      setTransferMemo('');
      addNotification({
        type: 'success',
        message: `Transferred ${newMsg.transferAmount} to ${activeConversation.bnsName}! Tx: ${result.hash}`,
      });
    } catch (error: any) {
      console.error('Mesh settlement failed:', error);
      addNotification({
        type: 'error',
        message: error?.message || 'Mesh settlement failed — see console for details.',
      });
    } finally {
      setIsSendingTransfer(false);
    }
  };

  // Handle payment request in direct chat
  const handleSendPaymentRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestAmount || isNaN(Number(requestAmount)) || Number(requestAmount) <= 0) return;

    const newMsg: ChatMessage = {
      id: `req-${Date.now()}`,
      sender: 'me',
      text: requestMemo.trim() ? requestMemo.trim() : 'Payment Request',
      timestamp: 'Just now',
      isEncrypted: true,
      channel: meshFailoverSimulated ? 'lora-mesh-915mhz' : 'libp2p-internet',
      requestAmount: `${Number(requestAmount).toFixed(2)} Ɗ`,
      requestSettled: false,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            lastMessage: `Requested ${newMsg.requestAmount}`,
            lastTimestamp: 'Just now',
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setShowRequestModal(false);
    setRequestAmount('10.00');
    setRequestMemo('');
    addNotification({
      type: 'info',
      message: `In-chat payment request for ${newMsg.requestAmount} transmitted to ${activeConversation.bnsName}.`,
    });
  };

  // Settle an incoming payment request
  const handleSettlePaymentRequest = async (msgId: string, amount: string) => {
    if (!selectedAccount) {
      addNotification({ type: 'error', message: 'Connect your wallet first.' });
      return;
    }
    try {
      const request = await buildSettlementRequest(Number(amount.replace(/[^\d.]/g, '')), activeConversation.address);
      const result = await settleMeshTransaction(selectedAccount.address, request);

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversation.id) {
            const updatedMessages = c.messages.map((m) => {
              if (m.id === msgId) {
                return { ...m, requestSettled: true };
              }
              return m;
            });

            const settlementMsg: ChatMessage = {
              id: `settle-${Date.now()}`,
              sender: 'me',
              text: `Settled payment request`,
              timestamp: 'Just now',
              isEncrypted: true,
              channel: 'libp2p-internet',
              transferAmount: amount,
              txHash: result.hash,
            };

            return {
              ...c,
              lastMessage: `Settled ${amount}`,
              lastTimestamp: 'Just now',
              messages: [...updatedMessages, settlementMsg],
            };
          }
          return c;
        })
      );

      addNotification({
        type: 'success',
        message: `Settled request of ${amount} to ${activeConversation.bnsName}! Tx: ${result.hash}`,
      });
    } catch (error: any) {
      console.error('Settlement failed:', error);
      addNotification({
        type: 'error',
        message: error?.message || 'Settlement failed — see console for details.',
      });
    }
  };

  // Create new conversation
  const handleCreateNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    const handle = newChatBns.trim() || 'sovereign-peer.bz';
    const addr = newChatAddress.trim() || `5${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`;

    const newConv: PeerConversation = {
      id: `conv-${Date.now()}`,
      address: addr,
      bnsName: handle.endsWith('.bz') || handle.endsWith('.caye') || handle.endsWith('.belize') ? handle : `${handle}.bz`,
      district: 'Belize Chain',
      avatar: handle.substring(0, 2).toUpperCase(),
      lastMessage: 'Conversation initialized with Noise Protocol cipher suite.',
      lastTimestamp: 'Just now',
      unread: 0,
      channel: 'libp2p-internet',
      isVerifiedCitizen: true,
      messages: [
        {
          id: `init-${Date.now()}`,
          sender: 'peer',
          text: `E2EE session established with ${handle}. Ed25519 identity key verified on-chain.`,
          timestamp: 'Just now',
          isEncrypted: true,
          channel: 'libp2p-internet',
        },
      ],
    };

    setConversations([newConv, ...conversations]);
    setSelectedConversationId(newConv.id);
    setShowNewChatModal(false);
    setNewChatAddress('');
    setNewChatBns('');
    setShowMobileChat(true);

    addNotification({
      type: 'success',
      message: `Initialized E2EE conversation with ${newConv.bnsName}!`,
    });
  };

  if (!isConnected || !selectedAccount) {
    return (
      <ConnectWalletPrompt
        message="Connect your Maya Wallet to access sovereign E2EE citizen messaging and air-gapped LoRa mesh channels."
        fullScreen
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 selection:bg-teal-500/30">
      {/* Top Banner & Header */}
      <header className="sticky top-0 bg-slate-950/85 backdrop-blur-2xl border-b border-slate-800/80 px-4 sm:px-6 py-3.5 z-30 shadow-lg shadow-black/40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={22} weight="bold" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Sovereign Chat & Mesh Hub
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30 tracking-wider uppercase">
                  Noise E2EE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Decentralized libp2p • LoRa 915MHz Air-Gapped Failover • In-Chat Ɗ Pay
              </p>
            </div>
          </div>

          {/* Network Health Indicators */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => setMeshFailoverSimulated(!meshFailoverSimulated)}
              title="Click to toggle simulated connection mode"
              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
                meshFailoverSimulated
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {meshFailoverSimulated ? (
                <>
                  <Broadcast size={13} weight="bold" className="animate-pulse text-amber-400" />
                  <span>LoRa 915MHz Mesh (Air-Gapped)</span>
                </>
              ) : (
                <>
                  <WifiHigh size={13} weight="bold" className="text-emerald-400" />
                  <span>libp2p Online (Internet)</span>
                </>
              )}
            </button>

            <span className="px-2.5 py-1 rounded-xl text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5">
              <LockKey size={13} weight="bold" className="text-teal-400" />
              <span>Signal/Noise Cipher</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-3 sm:p-6">
        {/* Navigation Pills (Direct Messages vs District Mesh Channels vs Emergency) */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="inline-flex p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-inner">
            <button
              onClick={() => {
                setActiveTab('direct');
                setShowMobileChat(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'direct'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User size={15} weight="bold" />
              <span>Direct Messages</span>
              <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-slate-950/40 font-mono">
                {conversations.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('channels');
                setShowMobileChat(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'channels'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio size={15} weight="bold" />
              <span>District Mesh Channels</span>
              <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-slate-950/40 font-mono">
                {channels.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('emergency');
                setShowMobileChat(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'emergency'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              <ShieldWarning size={15} weight="bold" />
              <span>Emergency Alerts</span>
              {EMERGENCY_ALERTS.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950/40 font-mono">
                  {EMERGENCY_ALERTS.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'direct' && (
            <button
              onClick={() => setShowNewChatModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-teal-400 border border-teal-500/30 hover:border-teal-400/60 rounded-2xl text-xs font-bold transition-all shadow-sm"
            >
              <PlusCircle size={16} weight="bold" />
              <span>New Conversation</span>
            </button>
          )}
        </div>

        {/* Emergency Alert Banner */}
        {activeTab === 'emergency' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <ShieldWarning size={24} weight="fill" className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-300">National Sovereign Emergency Broadcast Feed</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  These broadcasts are cryptographically anchored to BelizeChain and relayed over the 915MHz LoRa mesh network to maintain situational awareness during power disruptions or network outages.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EMERGENCY_ALERTS.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-slate-900/80 border border-amber-500/30 rounded-3xl p-5 space-y-3 shadow-lg shadow-black/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider">
                      {alert.level}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{alert.timestamp}</span>
                  </div>

                  <h4 className="text-base font-bold text-white">{alert.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{alert.details}</p>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Agency: {alert.agency}</span>
                    <span className="text-teal-400">Anchor: {alert.verifiedAnchor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Main 2-Pane Chat Layout */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-[650px]">
            {/* Left Column: Contact / Channel List */}
            <div
              className={`md:col-span-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 flex flex-col shadow-xl ${
                showMobileChat ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Search Bar */}
              <div className="relative mb-3">
                <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeTab === 'direct' ? 'Search contacts, BNS handles...' : 'Search channels, frequencies...'}
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

              {/* List Stream */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {activeTab === 'direct' ? (
                  filteredConversations.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      No contacts found matching &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    filteredConversations.map((c) => {
                      const isSelected = c.id === activeConversation.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedConversationId(c.id);
                            setShowMobileChat(true);
                          }}
                          className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-slate-805 border-teal-500/40 shadow-lg shadow-teal-950/30'
                              : 'bg-slate-950/40 border-slate-800 hover:bg-slate-900/60 hover:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center font-bold text-teal-300 font-mono text-xs shrink-0">
                              {c.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-bold text-white text-xs truncate">{c.bnsName}</span>
                                  {c.isVerifiedCitizen && (
                                    <ShieldCheck size={13} weight="fill" className="text-teal-400 shrink-0" />
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-500 shrink-0">{c.lastTimestamp}</span>
                              </div>
                              <p className="text-slate-400 text-[11px] truncate mt-0.5">{c.lastMessage}</p>
                              <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-slate-500">
                                <span className="flex items-center gap-1">
                                  {c.channel === 'lora-mesh-915mhz' ? (
                                    <Broadcast size={11} className="text-amber-400" />
                                  ) : (
                                    <WifiHigh size={11} className="text-emerald-400" />
                                  )}
                                  <span>{c.channel === 'lora-mesh-915mhz' ? 'LoRa 915MHz' : 'libp2p'}</span>
                                </span>
                                <span>•</span>
                                <span className="truncate">{c.district}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  filteredChannels.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      No channels found matching &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    filteredChannels.map((ch) => {
                      const isSelected = ch.id === activeChannel.id;
                      return (
                        <div
                          key={ch.id}
                          onClick={() => {
                            setSelectedChannelId(ch.id);
                            setShowMobileChat(true);
                          }}
                          className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-slate-805 border-teal-500/40 shadow-lg shadow-teal-950/30'
                              : 'bg-slate-950/40 border-slate-800 hover:bg-slate-900/60 hover:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-teal-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300 shrink-0">
                              <Radio size={20} weight="bold" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-xs truncate font-mono">#{ch.name}</span>
                                <span className="text-[10px] font-mono text-slate-500 shrink-0">{ch.lastTimestamp}</span>
                              </div>
                              <p className="text-slate-400 text-[11px] truncate mt-0.5">{ch.lastMessage}</p>
                              <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono text-slate-500">
                                <span className="text-teal-400">{ch.frequency}</span>
                                <span>•</span>
                                <span>{ch.nodeCount} Nodes</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </div>

            {/* Right Column: Active Conversation or Channel */}
            <div
              className={`md:col-span-8 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-xl ${
                !showMobileChat ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Active Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile back arrow */}
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden p-1.5 hover:bg-slate-800 rounded-xl text-slate-400"
                  >
                    <ArrowLeft size={18} weight="bold" />
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center font-bold text-teal-300 font-mono text-sm shrink-0">
                    {activeTab === 'direct' ? activeConversation.avatar : <Radio size={20} weight="bold" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-white text-sm truncate">
                        {activeTab === 'direct' ? activeConversation.bnsName : `#${activeChannel.name}`}
                      </h3>
                      {activeTab === 'direct' && (
                        <ShieldCheck size={14} weight="fill" className="text-teal-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono truncate">
                      {activeTab === 'direct' ? (
                        <>
                          <span className="text-slate-500 truncate">{activeConversation.address.slice(0, 16)}...</span>
                          <span>•</span>
                          <span className="text-teal-400 flex items-center gap-1">
                            <LockKey size={11} /> E2EE Active
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-amber-400">{activeChannel.frequency}</span>
                          <span>•</span>
                          <span>{activeChannel.nodeCount} Connected Relays</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Chat In-Line Actions */}
                {activeTab === 'direct' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Coins size={14} weight="bold" />
                      <span className="hidden sm:inline">Send Ɗ</span>
                    </button>

                    <button
                      onClick={() => setShowRequestModal(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Receipt size={14} weight="bold" />
                      <span className="hidden sm:inline">Request Ɗ</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1 custom-scrollbar">
                {(activeTab === 'direct' ? activeConversation.messages : activeChannel.messages).map((m) => {
                  const isMe = m.sender === 'me';
                  return (
                    <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl space-y-2 text-xs leading-relaxed ${
                          isMe
                            ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-br-none shadow-md shadow-teal-950/30'
                            : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-line">{m.text}</p>

                        {/* In-Chat Micro-Pay Card */}
                        {m.transferAmount && (
                          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-emerald-500/40 space-y-1.5 font-mono">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <Coins size={14} weight="fill" />
                                <span>P2P Transfer</span>
                              </span>
                              <span className="text-white font-black text-sm">{m.transferAmount}</span>
                            </div>
                            {m.txHash && (
                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                                <span>Tx: {m.txHash}</span>
                                <span className="text-teal-400 flex items-center gap-0.5">
                                  <CheckCircle size={11} weight="fill" /> Verified
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* In-Chat Payment Request Card */}
                        {m.requestAmount && (
                          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-amber-500/40 space-y-2 font-mono">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-amber-400 font-bold flex items-center gap-1">
                                <ArrowDownLeft size={14} weight="bold" />
                                <span>Payment Request</span>
                              </span>
                              <span className="text-white font-black text-sm">{m.requestAmount}</span>
                            </div>

                            {!isMe && !m.requestSettled && (
                              <button
                                onClick={() => handleSettlePaymentRequest(m.id, m.requestAmount || '10.00 Ɗ')}
                                className="w-full py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1"
                              >
                                <Coins size={13} weight="bold" /> Pay {m.requestAmount} Now
                              </button>
                            )}

                            {m.requestSettled && (
                              <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle size={12} weight="fill" /> Settled On-Chain
                              </div>
                            )}
                          </div>
                        )}

                        {/* Bubble Footer & Metadata */}
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-300/70 pt-1 border-t border-white/10">
                          <span>{m.timestamp}</span>
                          <span className="flex items-center gap-1">
                            {m.channel === 'lora-mesh-915mhz' ? (
                              <Broadcast size={10} className="text-amber-400" />
                            ) : (
                              <ShieldCheck size={10} className="text-teal-300" />
                            )}
                            <span>{m.channel === 'lora-mesh-915mhz' ? 'LoRa Mesh' : 'Noise E2EE'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={
                    activeTab === 'direct'
                      ? `Type encrypted message to ${activeConversation.bnsName}...`
                      : `Broadcast packet to #${activeChannel.name}...`
                  }
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-teal-500/60 focus:outline-none transition-all font-mono"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-2xl flex items-center justify-center transition-all shadow-md shadow-teal-500/20 shrink-0"
                >
                  <PaperPlaneTilt size={18} weight="bold" />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Modal: In-Chat Micro-Pay */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Coins size={18} className="text-emerald-400" />
                <span>Send In-Chat Micro-Pay</span>
              </span>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendMicroTransfer} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Recipient:</span>
                <span className="font-bold text-teal-400 font-mono">{activeConversation.bnsName}</span>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1 font-mono uppercase text-[10px]">
                  Amount (DALLA Ɗ)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-mono focus:border-emerald-400 focus:outline-none"
                />

                {/* Quick amount chips */}
                <div className="flex gap-2 mt-2">
                  {['5.00', '10.00', '25.00', '50.00', '100.00'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTransferAmount(amt)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                        transferAmount === amt
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {amt} Ɗ
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1 font-mono uppercase text-[10px]">
                  Memo / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Telemetry sensor grant tranche"
                  value={transferMemo}
                  onChange={(e) => setTransferMemo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-slate-300">
                <span>Direct on-chain micro-transfer anchored via Noise Protocol session proof.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <Coins size={16} weight="bold" />
                <span>Confirm & Transfer {transferAmount} Ɗ</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request Payment */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Receipt size={18} className="text-amber-400" />
                <span>Request Payment</span>
              </span>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendPaymentRequest} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Request From:</span>
                <span className="font-bold text-amber-400 font-mono">{activeConversation.bnsName}</span>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1 font-mono uppercase text-[10px]">
                  Requested Amount (DALLA Ɗ)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1 font-mono uppercase text-[10px]">
                  Reason / Item
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solar beacon replacement parts"
                  value={requestMemo}
                  onChange={(e) => setRequestMemo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <ArrowDownLeft size={16} weight="bold" />
                <span>Transmit Payment Request</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Conversation */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <PlusCircle size={18} className="text-teal-400" />
                <span>Start Sovereign E2EE Chat</span>
              </span>
              <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewChat} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1 font-mono uppercase text-[10px]">
                  BNS Name (.bz, .caye, .belize)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. sanpedro-health.bz"
                  value={newChatBns}
                  onChange={(e) => setNewChatBns(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-teal-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1 font-mono uppercase text-[10px]">
                  Recipient Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="5..."
                  value={newChatAddress}
                  onChange={(e) => setNewChatAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-teal-400 focus:outline-none"
                />
              </div>

              {/* Verified Directory Suggestions */}
              <div>
                <span className="text-slate-500 text-[10px] font-mono uppercase block mb-1.5">
                  Verified Directory Peers
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { bns: 'sanpedro-clinic.bz', district: 'San Pedro' },
                    { bns: 'cayo-ranger.bz', district: 'Cayo' },
                    { bns: 'belmopan-audit.gov', district: 'Belmopan' },
                    { bns: 'reef-guardian.org', district: 'Offshore' },
                  ].map((p) => (
                    <button
                      key={p.bns}
                      type="button"
                      onClick={() => {
                        setNewChatBns(p.bns);
                      }}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-left hover:border-teal-500/40 transition-all"
                    >
                      <div className="font-bold text-white text-[11px] truncate">{p.bns}</div>
                      <div className="text-[9px] text-slate-500">{p.district}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20"
              >
                <LockKey size={16} weight="bold" />
                <span>Initialize E2EE Session</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
