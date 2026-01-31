// P2P Messaging Service
import { walletLogger, getPakitClient, type PakitClient } from '@belizechain/shared';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  recipientName?: string;
  content: string;
  encrypted: boolean;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'payment-request' | 'payment-confirmation' | 'split-bill';
  metadata?: {
    amount?: number;
    currency?: 'DALLA' | 'bBZD';
    txHash?: string;
    splitParticipants?: string[];
  };
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName?: string;
  lastMessage: string;
  lastMessageTimestamp: Date;
  unreadCount: number;
  messages: Message[];
}

const CONVERSATIONS_KEY = 'maya-conversations';
const MAX_MESSAGES_PER_CONVERSATION = 500;

// Pakit client for encrypted message storage
let pakitClient: ReturnType<typeof getPakitClient> | null = null;

export function initializeMessaging(apiUrl?: string): void {
  // ✅ REAL PAKIT CLIENT - Initialize for encrypted message backups
  pakitClient = getPakitClient();
  walletLogger.info('Messaging initialized with Pakit backup', { apiUrl });
}

// Get all conversations
export function getConversations(): Conversation[] {
  try {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(CONVERSATIONS_KEY);
    if (!stored) return [];
    
    const conversations = JSON.parse(stored);
    return conversations.map((c: any) => ({
      ...c,
      lastMessageTimestamp: new Date(c.lastMessageTimestamp),
      messages: c.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch (error) {
    walletLogger.error('Failed to load conversations', error);
    return [];
  }
}

// Get conversation with specific participant
export function getConversation(participantId: string): Conversation | null {
  const conversations = getConversations();
  return conversations.find(c => c.participantId === participantId) || null;
}

// Create new conversation
export function createConversation(participantId: string, participantName?: string): Conversation {
  const conversations = getConversations();
  
  // Check if conversation already exists
  const existing = conversations.find(c => c.participantId === participantId);
  if (existing) return existing;
  
  const newConversation: Conversation = {
    id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    participantId,
    participantName,
    lastMessage: '',
    lastMessageTimestamp: new Date(),
    unreadCount: 0,
    messages: [],
  };
  
  conversations.push(newConversation);
  saveConversations(conversations);
  
  walletLogger.info('Conversation created', { participantId });
  return newConversation;
}

// Send message
export async function sendMessage(
  recipientId: string,
  recipientName: string | undefined,
  content: string,
  type: Message['type'] = 'text',
  metadata?: Message['metadata']
): Promise<Message> {
  const conversations = getConversations();
  
  // Get or create conversation
  let conversation = conversations.find(c => c.participantId === recipientId);
  if (!conversation) {
    conversation = createConversation(recipientId, recipientName);
  }
  
  // Create message
  const message: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    conversationId: conversation.id,
    senderId: 'self', // Current user
    recipientId,
    recipientName,
    content,
    encrypted: true,
    timestamp: new Date(),
    read: false,
    type,
    metadata,
  };
  
  // Add to conversation
  conversation.messages.push(message);
  conversation.lastMessage = type === 'text' ? content : getMessagePreview(type, metadata);
  conversation.lastMessageTimestamp = message.timestamp;
  
  // Trim old messages if limit exceeded
  if (conversation.messages.length > MAX_MESSAGES_PER_CONVERSATION) {
    conversation.messages = conversation.messages.slice(-MAX_MESSAGES_PER_CONVERSATION);
  }
  
  saveConversations(conversations);
  
  // ✅ REAL PAKIT BACKUP - Store encrypted message on IPFS for backup/sync
  if (pakitClient) {
    try {
      const messageBlob = new Blob([JSON.stringify(message)], { type: 'application/json' });
      const messageFile = new File([messageBlob], `message-${message.id}.json`, { type: 'application/json' });
      
      await pakitClient.upload(messageFile, {
        compress: true,
        deduplicate: true,
        storage: 'ipfs',
        encrypt: true, // Encrypt messages for privacy
        tags: {
          type: 'message-backup',
          conversationId: conversation.id,
          timestamp: message.timestamp.toISOString(),
          owner: 'self',
        },
      });
      walletLogger.info('Message backed up to Pakit', { messageId: message.id });
    } catch (error) {
      walletLogger.warn('Failed to backup message to Pakit', { error });
    }
  }
  
  walletLogger.info('Message sent', { recipientId, type });
  return message;
}

// Receive message (called when message arrives from blockchain event or peer)
export function receiveMessage(message: Omit<Message, 'id' | 'timestamp' | 'read'>): Message {
  const conversations = getConversations();
  
  // Get or create conversation
  let conversation = conversations.find(c => c.participantId === message.senderId);
  if (!conversation) {
    conversation = createConversation(message.senderId, message.senderName);
  }
  
  const receivedMessage: Message = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    read: false,
  };
  
  conversation.messages.push(receivedMessage);
  conversation.lastMessage = message.type === 'text' ? message.content : getMessagePreview(message.type, message.metadata);
  conversation.lastMessageTimestamp = receivedMessage.timestamp;
  conversation.unreadCount += 1;
  
  saveConversations(conversations);
  
  walletLogger.info('Message received', { senderId: message.senderId, type: message.type });
  return receivedMessage;
}

// Mark conversation as read
export function markConversationAsRead(conversationId: string): void {
  const conversations = getConversations();
  const conversation = conversations.find(c => c.id === conversationId);
  
  if (!conversation) return;
  
  conversation.messages.forEach(m => m.read = true);
  conversation.unreadCount = 0;
  
  saveConversations(conversations);
  walletLogger.info('Conversation marked as read', { conversationId });
}

// Get total unread messages count
export function getTotalUnreadCount(): number {
  const conversations = getConversations();
  return conversations.reduce((total, c) => total + c.unreadCount, 0);
}

// Delete conversation
export function deleteConversation(conversationId: string): void {
  const conversations = getConversations();
  const filtered = conversations.filter(c => c.id !== conversationId);
  
  saveConversations(filtered);
  walletLogger.info('Conversation deleted', { conversationId });
}

// Delete message
export function deleteMessage(conversationId: string, messageId: string): void {
  const conversations = getConversations();
  const conversation = conversations.find(c => c.id === conversationId);
  
  if (!conversation) return;
  
  conversation.messages = conversation.messages.filter(m => m.id !== messageId);
  
  // Update last message
  if (conversation.messages.length > 0) {
    const last = conversation.messages[conversation.messages.length - 1];
    conversation.lastMessage = last.type === 'text' ? last.content : getMessagePreview(last.type, last.metadata);
    conversation.lastMessageTimestamp = last.timestamp;
  } else {
    conversation.lastMessage = '';
  }
  
  saveConversations(conversations);
  walletLogger.info('Message deleted', { conversationId, messageId });
}

// Send payment request
export async function sendPaymentRequest(
  recipientId: string,
  recipientName: string | undefined,
  amount: number,
  currency: 'DALLA' | 'bBZD',
  reason?: string
): Promise<Message> {
  const content = reason || `Requesting ${amount} ${currency}`;
  
  return sendMessage(recipientId, recipientName, content, 'payment-request', {
    amount,
    currency,
  });
}

// Send split bill request
export async function sendSplitBillRequest(
  participants: string[],
  totalAmount: number,
  currency: 'DALLA' | 'bBZD',
  description?: string
): Promise<Message[]> {
  const amountPerPerson = totalAmount / (participants.length + 1); // +1 for sender
  const content = description || `Split bill: ${amountPerPerson} ${currency} per person`;
  
  const messages: Message[] = [];
  
  for (const participantId of participants) {
    const message = await sendMessage(participantId, undefined, content, 'split-bill', {
      amount: amountPerPerson,
      currency,
      splitParticipants: participants,
    });
    messages.push(message);
  }
  
  return messages;
}

// Confirm payment in chat
export async function sendPaymentConfirmation(
  recipientId: string,
  recipientName: string | undefined,
  amount: number,
  currency: 'DALLA' | 'bBZD',
  txHash: string
): Promise<Message> {
  const content = `Sent you ${amount} ${currency}`;
  
  return sendMessage(recipientId, recipientName, content, 'payment-confirmation', {
    amount,
    currency,
    txHash,
  });
}

// Get message preview for non-text messages
function getMessagePreview(type: Message['type'], metadata?: Message['metadata']): string {
  switch (type) {
    case 'payment-request':
      return `💰 Payment request: ${metadata?.amount} ${metadata?.currency}`;
    case 'payment-confirmation':
      return `✅ Payment sent: ${metadata?.amount} ${metadata?.currency}`;
    case 'split-bill':
      return `🧾 Split bill: ${metadata?.amount} ${metadata?.currency}`;
    default:
      return 'Message';
  }
}

// Save conversations to localStorage
function saveConversations(conversations: Conversation[]): void {
  try {
    // Sort by last message timestamp (most recent first)
    const sorted = conversations.sort((a, b) => 
      b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime()
    );
    
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(sorted));
  } catch (error) {
    walletLogger.error('Failed to save conversations', error);
    throw new Error('Failed to save conversations');
  }
}
