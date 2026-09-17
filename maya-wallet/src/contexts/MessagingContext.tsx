'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ApiPromise } from '@polkadot/api';
import { bluetoothMeshService, type MeshMessage } from '@/services/bluetooth-mesh.service';
import { pakitBridgeService } from '@/services/pakit-bridge.service';
import { blockchainProofService, type EmergencyBroadcast } from '@/services/blockchain-proof.service';
import { getDisplayName } from '@/services/pallets/identity';
import { initializeApi } from '@/services/blockchain';
import { useWallet } from '@/contexts/WalletContext';

// Lazy load mesh services to avoid SSR issues
let bluetoothMeshReady = false;

type MessageMode = 'online' | 'mesh' | 'auto';

interface Message {
  id: string;
  content: string;
  sender: string;
  recipient: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  via: 'mesh' | 'chain';
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
  isMeshAvailable: boolean;
  pendingSyncCount: number;

  // Actions
  setMode: (mode: MessageMode) => void;
  sendMessage: (to: string, content: string) => Promise<boolean>;
  getConversation: (peerAddress: string) => Conversation | undefined;
  initializeMesh: () => Promise<boolean>;
  syncToPakit: () => Promise<boolean>;
  submitEmergencyBroadcast: (broadcast: Omit<EmergencyBroadcast, 'id' | 'ts'>) => Promise<string>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { selectedAccount } = useWallet();
  const [mode, setMode] = useState<MessageMode>('auto');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyBroadcast[]>([]);
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

  // Initialize Bluetooth Mesh
  const initializeMesh = useCallback(async () => {
    try {
      const success = await bluetoothMeshService.initialize();
      setIsMeshAvailable(success);

      if (success) {
        // Listen for mesh messages
        window.addEventListener('mesh-message', handleIncomingMeshMessage);

        // Start Pakit bridge
        await pakitBridgeService.initialize(null);
      }

      return success;
    } catch (error) {
      console.error('Mesh initialization failed:', error);
      return false;
    }
  }, []);

  // Handle incoming mesh message
  const handleIncomingMeshMessage = async (event: Event) => {
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
    setPendingSyncCount(await pakitBridgeService.getPendingCount());

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
      const viaMethod: Message['via'] = 'mesh';

      try {
        // BelizeMesh v1 transport: Bluetooth mesh (with Pakit/IPFS sync for
        // store-and-forward). Chain-settlement path lands with the Mesh pallet
        // wiring in the next slice.
        success = await bluetoothMeshService.sendMessage(to, content);

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
      } catch (transportError) {
        console.error('[BelizeMesh] Mesh send failed:', transportError);
        return false;
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
    setPendingSyncCount(await pakitBridgeService.getPendingCount());
    return success;
  };

  // Submit emergency broadcast (requires authority)
  const submitEmergencyBroadcast = async (
    broadcast: Omit<EmergencyBroadcast, 'id' | 'ts'>
  ): Promise<string> => {
    if (!api || !selectedAccount) {
      throw new Error('Not connected to blockchain');
    }

    return blockchainProofService.submitEmergencyBroadcast(
      { ...broadcast, durationMinutes: 60 },
      selectedAccount
    );
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
          new Notification('Emergency Broadcast Alert', {
            body: broadcast.message,
            tag: broadcast.id
          });
        }
      });

      return () => unsubscribe?.();
    }
  }, [api]);

  // Auto-initialize mesh on mount
  useEffect(() => {
    if (selectedAccount) {
      initializeMesh();
    }
  }, [selectedAccount]);  // initializeMesh is stable (no deps)

  const value: MessagingContextType = {
    mode,
    conversations,
    emergencyAlerts,
    isMeshAvailable,
    pendingSyncCount,
    setMode,
    sendMessage,
    getConversation,
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
