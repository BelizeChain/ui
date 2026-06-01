'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ApiPromise } from '@polkadot/api';
import { bluetoothMeshService, type MeshMessage } from '@/services/bluetooth-mesh.service';
import { pakitBridgeService } from '@/services/pakit-bridge.service';
import { blockchainProofService, type EmergencyBroadcast } from '@/services/blockchain-proof.service';
import { getDisplayName } from '@/services/pallets/identity';
import { initializeApi } from '@/services/blockchain';
import { useWallet } from '@/contexts/WalletContext';

// Lazy load XMTP service to avoid SSR WASM issues
let xmtpService: any = null;
let xmtpServiceLoading = false;

if (typeof window !== 'undefined' && !xmtpServiceLoading) {
  xmtpServiceLoading = true;
  import('@/services/xmtp.service').then((mod) => {
    xmtpService = mod.xmtpService;
    console.log('✅ XMTP service loaded dynamically');
  }).catch((err) => {
    console.warn('⚠️ XMTP service failed to load:', err);
  });
}

type MessageMode = 'online' | 'mesh' | 'auto';

interface Message {
  id: string;
  content: string;
  sender: string;
  recipient: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  via: 'xmtp' | 'mesh';
  proofHash?: string;
}

interface Conversation {
  peerAddress: string;
  peerName?: string;
  lastMessage?: Message;
  unreadCount: number;
  messages: Message[];
}

interface MessagingContextType {
  // State
  mode: MessageMode;
  conversations: Conversation[];
  emergencyAlerts: EmergencyBroadcast[];
  isXMTPConnected: boolean;
  isMeshAvailable: boolean;
  pendingSyncCount: number;

  // Actions
  setMode: (mode: MessageMode) => void;
  sendMessage: (to: string, content: string) => Promise<boolean>;
  getConversation: (peerAddress: string) => Conversation | undefined;
  initializeXMTP: () => Promise<boolean>;
  initializeMesh: () => Promise<boolean>;
  syncToPakit: () => Promise<boolean>;
  submitEmergencyBroadcast: (broadcast: Omit<EmergencyBroadcast, 'id' | 'timestamp'>) => Promise<string>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { selectedAccount } = useWallet();
  const [mode, setMode] = useState<MessageMode>('auto');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyBroadcast[]>([]);
  const [isXMTPConnected, setIsXMTPConnected] = useState(false);
  const [isMeshAvailable, setIsMeshAvailable] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Polkadot API connection for blockchain proof / emergency broadcasts.
  // Connects lazily on mount; stays null until ready so dependent actions guard on it.
  const [api, setApi] = useState<ApiPromise | null>(null);

  useEffect(() => {
    let cancelled = false;
    initializeApi()
      .then((connected) => {
        if (!cancelled) setApi(connected);
      })
      .catch((err) => {
        console.warn('MessagingContext: blockchain API connection failed:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize XMTP
  const initializeXMTP = useCallback(async () => {
    try {
      if (!selectedAccount) {
        console.warn('No account selected');
        return false;
      }

      // XMTP requires an Ethereum-compatible private key (or EIP-191 signer) to
      // derive a per-user messaging identity. Polkadot browser-extension accounts
      // never expose raw private keys, and no key-derivation/signing bridge is
      // wired yet. Initializing with a placeholder key would give EVERY user the
      // same XMTP identity, so the feature is intentionally gated off until a real
      // per-account signer is available. Mesh messaging and emergency broadcasts
      // remain fully functional.
      console.warn(
        'XMTP messaging is unavailable: no secure per-account key derivation from the Polkadot signer yet.',
      );
      setIsXMTPConnected(false);
      return false;
    } catch (error) {
      console.error('XMTP initialization failed:', error);
      return false;
    }
  }, [selectedAccount]);

  // Initialize Bluetooth Mesh
  const initializeMesh = useCallback(async () => {
    try {
      const success = await bluetoothMeshService.initialize();
      setIsMeshAvailable(success);

      if (success) {
        // Listen for mesh messages
        window.addEventListener('mesh-message', handleIncomingMeshMessage);
        
        // Start Pakit bridge
        await pakitBridgeService.initialize();
      }

      return success;
    } catch (error) {
      console.error('Mesh initialization failed:', error);
      return false;
    }
  }, []);

  // Load XMTP conversations
  const loadXMTPConversations = async () => {
    try {
      const xmtpConvos = await xmtpService.getConversations();
      
      const mappedConvos: Conversation[] = await Promise.all(
        xmtpConvos.map(async (conv: any) => {
          const messages = await xmtpService.getMessages(conv.peerAddress, 50);

          // Resolve a human-readable name from the Identity pallet (falls back
          // to undefined -> UI shows shortened address).
          const peerName = await getDisplayName(conv.peerAddress);

          return {
            peerAddress: conv.peerAddress,
            peerName,
            lastMessage: messages.length > 0 ? {
              id: messages[0].id,
              content: typeof messages[0].content === 'string' 
                ? messages[0].content 
                : messages[0].content.text,
              sender: messages[0].senderAddress,
              recipient: conv.peerAddress,
              timestamp: messages[0].sent,
              status: 'delivered',
              via: 'xmtp'
            } : undefined,
            unreadCount: 0,
            messages: messages.map((m: any) => ({
              id: m.id,
              content: typeof m.content === 'string' ? m.content : m.content.text,
              sender: m.senderAddress,
              recipient: conv.peerAddress,
              timestamp: m.sent,
              status: 'delivered',
              via: 'xmtp'
            }))
          };
        })
      );

      setConversations(mappedConvos);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Handle incoming XMTP message
  const handleIncomingXMTPMessage = (message: any) => {
    const newMessage: Message = {
      id: message.id,
      content: typeof message.content === 'string' ? message.content : message.content.text,
      sender: message.senderAddress,
      recipient: xmtpService.getAddress() || '',
      timestamp: message.sent,
      status: 'delivered',
      via: 'xmtp'
    };

    // Update conversations
    setConversations(prev => {
      const convIndex = prev.findIndex(c => c.peerAddress === message.senderAddress);
      if (convIndex >= 0) {
        const updated = [...prev];
        updated[convIndex].messages.push(newMessage);
        updated[convIndex].lastMessage = newMessage;
        updated[convIndex].unreadCount++;
        return updated;
      } else {
        // New conversation
        return [...prev, {
          peerAddress: message.senderAddress,
          lastMessage: newMessage,
          unreadCount: 1,
          messages: [newMessage]
        }];
      }
    });
  };

  // Handle incoming mesh message
  const handleIncomingMeshMessage = (event: Event) => {
    const customEvent = event as CustomEvent<MeshMessage>;
    const meshMsg = customEvent.detail;

    const newMessage: Message = {
      id: meshMsg.id,
      content: meshMsg.content,
      sender: meshMsg.from,
      recipient: meshMsg.to,
      timestamp: meshMsg.timestamp,
      status: 'delivered',
      via: 'mesh'
    };

    // Queue for Pakit sync
    pakitBridgeService.queueMessage(meshMsg);
    setPendingSyncCount(pakitBridgeService.getPendingCount());

    // Update conversations
    setConversations(prev => {
      const convIndex = prev.findIndex(c => c.peerAddress === meshMsg.from);
      if (convIndex >= 0) {
        const updated = [...prev];
        updated[convIndex].messages.push(newMessage);
        updated[convIndex].lastMessage = newMessage;
        updated[convIndex].unreadCount++;
        return updated;
      } else {
        return [...prev, {
          peerAddress: meshMsg.from,
          lastMessage: newMessage,
          unreadCount: 1,
          messages: [newMessage]
        }];
      }
    });
  };

  // Send message (auto-selects best method)
  const sendMessage = async (to: string, content: string): Promise<boolean> => {
    try {
      let success = false;
      let viaMethod: 'xmtp' | 'mesh' = 'xmtp';

      if (mode === 'mesh' || (mode === 'auto' && !navigator.onLine)) {
        // Send via Bluetooth mesh
        success = await bluetoothMeshService.sendMessage(to, content);
        viaMethod = 'mesh';
        
        if (success) {
          pakitBridgeService.queueMessage({
            id: `mesh_${Date.now()}`,
            from: selectedAccount?.address || '',
            to,
            content,
            timestamp: new Date(),
            ttl: 5,
            signature: '',
            route: []
          });
        }
      } else {
        // Send via XMTP
        const message = await xmtpService.sendMessage(to, content);
        success = !!message;
        viaMethod = 'xmtp';
      }

      if (success) {
        // Update local state
        const newMessage: Message = {
          id: `msg_${Date.now()}`,
          content,
          sender: selectedAccount?.address || '',
          recipient: to,
          timestamp: new Date(),
          status: 'sent',
          via: viaMethod
        };

        setConversations(prev => {
          const convIndex = prev.findIndex(c => c.peerAddress === to);
          if (convIndex >= 0) {
            const updated = [...prev];
            updated[convIndex].messages.push(newMessage);
            updated[convIndex].lastMessage = newMessage;
            return updated;
          } else {
            return [...prev, {
              peerAddress: to,
              lastMessage: newMessage,
              unreadCount: 0,
              messages: [newMessage]
            }];
          }
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  };

  // Sync pending messages to Pakit
  const syncToPakit = async (): Promise<boolean> => {
    const success = await pakitBridgeService.syncNow();
    setPendingSyncCount(pakitBridgeService.getPendingCount());
    return success;
  };

  // Submit emergency broadcast (requires authority)
  const submitEmergencyBroadcast = async (
    broadcast: Omit<EmergencyBroadcast, 'id' | 'timestamp'>
  ): Promise<string> => {
    if (!api || !selectedAccount) {
      throw new Error('Not connected to blockchain');
    }

    const fullBroadcast: EmergencyBroadcast = {
      ...broadcast,
      id: `alert_${Date.now()}`,
      timestamp: Date.now()
    };

    const hash = await blockchainProofService.submitEmergencyBroadcast(
      fullBroadcast,
      selectedAccount
    );

    return hash;
  };

  // Get conversation by peer address
  const getConversation = (peerAddress: string): Conversation | undefined => {
    return conversations.find(c => c.peerAddress === peerAddress);
  };

  // Initialize blockchain proof service when API ready
  useEffect(() => {
    if (api) {
      blockchainProofService.initialize(api);

      // Subscribe to emergency broadcasts
      const unsubscribe = blockchainProofService.subscribeToEmergencyAlerts((broadcast) => {
        setEmergencyAlerts(prev => [...prev, broadcast]);
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🚨 Emergency Alert', {
            body: broadcast.message,
            tag: broadcast.id
          });
        }
      });

      return () => unsubscribe?.();
    }
  }, [api]);

  // Auto-initialize on mount
  useEffect(() => {
    if (selectedAccount) {
      initializeXMTP();
    }
  }, [selectedAccount, initializeXMTP]);

  const value: MessagingContextType = {
    mode,
    conversations,
    emergencyAlerts,
    isXMTPConnected,
    isMeshAvailable,
    pendingSyncCount,
    setMode,
    sendMessage,
    getConversation,
    initializeXMTP,
    initializeMesh,
    syncToPakit,
    submitEmergencyBroadcast
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within MessagingProvider');
  }
  return context;
}
