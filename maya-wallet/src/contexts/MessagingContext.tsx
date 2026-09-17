'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { blake2AsHex } from '@polkadot/util-crypto';
import type { ApiPromise } from '@polkadot/api';
import { bluetoothMeshService, type MeshMessage } from '@/services/bluetooth-mesh.service';
import { pakitBridgeService } from '@/services/pakit-bridge.service';
import { blockchainProofService, type EmergencyBroadcast } from '@/services/blockchain-proof.service';
import { getGatewayStatus, settleMeshTransaction, type MeshGatewayStatus, type MeshSettlementRequest } from '@/services/pallets/mesh';
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
  /** Whether the selected account owns an active gateway node */
  gatewayStatus: MeshGatewayStatus | null;

  // Actions
  setMode: (mode: MessageMode) => void;
  sendMessage: (to: string, content: string) => Promise<boolean>;
  getConversation: (peerAddress: string) => Conversation | undefined;
  initializeMesh: () => Promise<boolean>;
  syncToPakit: () => Promise<boolean>;
  submitEmergencyBroadcast: (broadcast: Omit<EmergencyBroadcast, 'id' | 'ts'>) => Promise<string>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

const CONVERSATIONS_STORAGE_KEY = 'belizemesh_conversations';
const MAX_CONVERSATION_MESSAGES = 200;

/**
 * Deterministic 32-byte settlement anchor for a mesh message:
 * blake2b-256 of "sender|recipient|content", encoded via Substrate blake2AsHex.
 */
function toSettlementHash(content: string, sender: string, recipient: string): `0x${string}` {
  const encoder = new TextEncoder();
  const payload = encoder.encode(`${sender}|${recipient}|${content}`);
  // blake2b-256 from @polkadot/util-crypto (already a dependency of the
  // extension stack)
  return blake2AsHex(payload, 256) as `0x${string}`;
}

/**
 * Derive a deterministic [u8;4] mesh node id from an SS58 address (first 4
 * bytes of the blake2b-256 hash). Consistent per-account, collision risk
 * acceptable for v1; registerMeshNode reuses the same derivation.
 */
function toNodeIdBytes(address: string): string {
  const encoder = new TextEncoder();
  const hashed = blake2AsHex(encoder.encode(address), 256);
  return hashed.slice(0, 10); // "0x" + 4 bytes hex
}


function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (stored) {
      return (JSON.parse(stored) as Conversation[]).map(c => ({
        ...c,
        messages: c.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
        lastMessage: c.lastMessage
          ? { ...c.lastMessage, timestamp: new Date(c.lastMessage.timestamp) }
          : undefined,
      }));
    }
  } catch {
    // Ignore corrupt storage and start fresh
  }
  return [];
}

function saveConversations(conversations: Conversation[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Bound storage: keep only the latest messages per conversation
    const trimmed: Conversation[] = conversations.map(c => ({
      ...c,
      messages: c.messages.slice(-MAX_CONVERSATION_MESSAGES),
    }));
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable — non-fatal
  }
}

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { selectedAccount } = useWallet();
  const [mode, setMode] = useState<MessageMode>('auto');
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyBroadcast[]>([]);
  const [isMeshAvailable, setIsMeshAvailable] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [gatewayStatus, setGatewayStatus] = useState<MeshGatewayStatus | null>(null);

  // Polkadot API connection for blockchain proof / emergency broadcasts.
  // Connects lazily on mount; stays null until ready so dependent actions guard on it.
  const [api, setApi] = useState<ApiPromise | null>(null);

  // Persist conversations whenever they change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

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
      let viaMethod: Message['via'] = 'mesh';

      try {
        // BelizeMesh v1 transport routing:
        // - online mode with a registered gateway node -> settle on-chain via
        //   pallet_belize_mesh (identityPing receipt; financial txs settle
        //   separately). The pallet requires the signer to own an ACTIVE
        //   GATEWAY node (verified against spec 105) — fail fast with an
        //   actionable hint otherwise.
        // - otherwise: Bluetooth mesh + Pakit/IPFS store-and-forward.
        const wantsChainSettlement =
          mode === 'online' ||
          (mode === 'auto' && navigator.onLine && gatewayStatus?.hasGateway === true);

        if (wantsChainSettlement && api && selectedAccount && gatewayStatus?.hasGateway) {
          const settlement: MeshSettlementRequest = {
            txType: 'identityPing',
            signatureHash: toSettlementHash(content, selectedAccount.address, to),
            senderNodeId: toNodeIdBytes(selectedAccount.address),
            recipientNodeId: toNodeIdBytes(to),
            gatewayNodeId: toNodeIdBytes(gatewayStatus.gatewayNodeId ?? ''),
            nonce: Math.floor(Date.now() / 1000) % 0xffffffff,
            relayPath: [],
            hopCount: 0,
            rssi: -75,
            snr: 10,
          };

          const receipt = await settleMeshTransaction(selectedAccount.address, settlement);
          success = receipt.hash.startsWith('0x');
          viaMethod = 'chain';
          setConversations(prev => {
            const convIndex = prev.findIndex(c => c.peerAddress === to);
            const newMessage: Message = {
              id: `msg_${Date.now()}`,
              content: content,
              sender: selectedAccount?.address || '',
              recipient: to,
              timestamp: new Date(),
              status: 'delivered',
              via: 'chain',
              proofHash: receipt.hash,
            };
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
          return success;
        }

        // BLE mesh + Pakit backup
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
      // Refresh gateway node status (ownerOf?) from chain
      getGatewayStatus(selectedAccount.address)
        .then(setGatewayStatus)
        .catch((err) => console.warn('[BelizeMesh] gateway status fetch failed:', err));
    } else {
      setGatewayStatus(null);
    }
  }, [selectedAccount]);  // initializeMesh is stable (no deps)

  const value: MessagingContextType = {
    mode,
    conversations,
    emergencyAlerts,
    isMeshAvailable,
    pendingSyncCount,
    gatewayStatus,
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
