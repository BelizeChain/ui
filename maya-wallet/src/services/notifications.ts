// Notification Service
import { walletLogger } from '@belizechain/shared';

export type NotificationType = 'payment' | 'document' | 'reward' | 'security' | 'system' | 'message';

export interface WalletNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

const NOTIFICATIONS_STORAGE_KEY = 'maya-notifications';
const MAX_NOTIFICATIONS = 100; // Keep last 100 notifications

// Get all notifications
export function getNotifications(): WalletNotification[] {
  try {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!stored) return [];
    
    const notifications = JSON.parse(stored);
    return notifications.map((n: any) => ({
      ...n,
      timestamp: new Date(n.timestamp),
    }));
  } catch (error) {
    walletLogger.error('Failed to load notifications', error);
    return [];
  }
}

// Add new notification
export function addNotification(
  notification: Omit<WalletNotification, 'id' | 'timestamp' | 'read'>
): WalletNotification {
  const notifications = getNotifications();
  
  const newNotification: WalletNotification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    read: false,
  };
  
  // Add to beginning
  notifications.unshift(newNotification);
  
  // Keep only last MAX_NOTIFICATIONS
  if (notifications.length > MAX_NOTIFICATIONS) {
    notifications.splice(MAX_NOTIFICATIONS);
  }
  
  saveNotifications(notifications);
  
  // Trigger browser notification if permitted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(newNotification.title, {
      body: newNotification.message,
      icon: '/maya-logo.png',
      tag: newNotification.id,
    });
  }
  
  walletLogger.info('Notification added', { type: newNotification.type });
  return newNotification;
}

// Mark notification as read
export function markAsRead(id: string): void {
  const notifications = getNotifications();
  const notification = notifications.find(n => n.id === id);
  
  if (notification) {
    notification.read = true;
    saveNotifications(notifications);
  }
}

// Mark all as read
export function markAllAsRead(): void {
  const notifications = getNotifications();
  notifications.forEach(n => n.read = true);
  saveNotifications(notifications);
}

// Delete notification
export function deleteNotification(id: string): void {
  const notifications = getNotifications();
  const filtered = notifications.filter(n => n.id !== id);
  saveNotifications(filtered);
}

// Clear all notifications
export function clearAllNotifications(): void {
  saveNotifications([]);
}

// Get unread count
export function getUnreadCount(): number {
  const notifications = getNotifications();
  return notifications.filter(n => !n.read).length;
}

// Get notifications by type
export function getNotificationsByType(type: WalletNotification['type']): WalletNotification[] {
  const notifications = getNotifications();
  return notifications.filter(n => n.type === type);
}

// Save notifications to localStorage
function saveNotifications(notifications: WalletNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    walletLogger.error('Failed to save notifications', error);
  }
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

// Helper functions to create specific notification types

export function notifyPaymentReceived(amount: string, currency: string, from?: string): void {
  addNotification({
    type: 'payment',
    title: 'Payment Received',
    message: `You received ${amount} ${currency}${from ? ` from ${from}` : ''}`,
    actionUrl: '/history',
  });
}

export function notifyPaymentSent(amount: string, currency: string, to?: string): void {
  addNotification({
    type: 'payment',
    title: 'Payment Sent',
    message: `You sent ${amount} ${currency}${to ? ` to ${to}` : ''}`,
    actionUrl: '/history',
  });
}

export function notifyDocumentShared(documentName: string, sharedBy: string): void {
  addNotification({
    type: 'document',
    title: 'Document Shared',
    message: `${sharedBy} shared "${documentName}" with you`,
    actionUrl: '/documents',
  });
}

export function notifyRewardEarned(amount: string, merchant: string): void {
  addNotification({
    type: 'reward',
    title: 'Tourism Reward Earned',
    message: `You earned ${amount} DALLA cashback from ${merchant}`,
    actionUrl: '/rewards',
  });
}

export function notifySecurityAlert(message: string): void {
  addNotification({
    type: 'security',
    title: 'Security Alert',
    message,
    actionUrl: '/settings',
  });
}

export function notifyNewMessage(senderName: string, preview: string): void {
  addNotification({
    type: 'message',
    title: `Message from ${senderName}`,
    message: preview,
    actionUrl: '/messages',
  });
}

/**
 * Subscribe to blockchain events and generate notifications
 */
export async function subscribeToBlockchainEvents(
  address: string
): Promise<() => void> {
  const { subscribeToTransactions, subscribeToBalance } = await import('./blockchain');
  const unsubscribers: (() => void)[] = [];
  
  try {
    // Subscribe to incoming transactions
    const txUnsub = await subscribeToTransactions(address, (tx) => {
      if (tx.type === 'receive') {
        addNotification({
          type: 'payment',
          title: 'Payment Received',
          message: `You received ${tx.amount} ${tx.currency} from ${tx.from.substring(0, 8)}...`,
          actionUrl: '/history',
        });
      }
    });
    unsubscribers.push(txUnsub);
    
    // Subscribe to balance changes (for staking rewards, governance payouts)
    const balanceUnsub = await subscribeToBalance(address, (balance) => {
      walletLogger.debug('Balance updated', { dalla: balance.dalla, bBZD: balance.bBZD });
    });
    unsubscribers.push(balanceUnsub);
    
    walletLogger.info('Subscribed to blockchain events');
    
    // Return cleanup function
    return () => {
      unsubscribers.forEach(unsub => unsub());
      walletLogger.info('Unsubscribed from blockchain events');
    };
  } catch (error) {
    walletLogger.error('Failed to subscribe to blockchain events', {
      error: error instanceof Error ? error.message : String(error)
    });
    return () => {}; // Return no-op cleanup
  }
}
