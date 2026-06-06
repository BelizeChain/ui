// Wallet Settings Service
'use client';

import { walletLogger } from '@belizechain/shared';
import { requestNotificationPermission } from './notifications';

export interface NotificationPreferences {
  pushEnabled: boolean;
  transactionAlerts: boolean;
  tourismRewards: boolean;
  governanceUpdates: boolean;
  securityAlerts: boolean;
  messages: boolean;
  sound: boolean;
}

export interface SecuritySettings {
  biometric: boolean;
  autoLockMinutes: number;
  hideBalances: boolean;
  requireConfirmationOnSend: boolean;
  analytics: boolean;
}

export interface WalletPreferences {
  currency: string;
  pushNotifications: boolean;
}

const NOTIFICATION_PREFS_KEY = 'maya-notification-preferences';
const SECURITY_SETTINGS_KEY = 'maya-security-settings';
const WALLET_PREFS_KEY = 'maya-wallet-preferences';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  transactionAlerts: true,
  tourismRewards: true,
  governanceUpdates: false,
  securityAlerts: true,
  messages: true,
  sound: true,
};

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  biometric: false,
  autoLockMinutes: 5,
  hideBalances: false,
  requireConfirmationOnSend: true,
  analytics: true,
};

export const DEFAULT_WALLET_PREFERENCES: WalletPreferences = {
  currency: 'USD',
  pushNotifications: true,
};

function readJson<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    return { ...fallback, ...(JSON.parse(stored) as Partial<T>) };
  } catch (error) {
    walletLogger.error('Failed to load settings', { key, error });
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    walletLogger.error('Failed to save settings', { key, error });
  }
}

// Notification preferences
export function getNotificationPreferences(): NotificationPreferences {
  return readJson(NOTIFICATION_PREFS_KEY, DEFAULT_NOTIFICATION_PREFERENCES);
}

export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  writeJson(NOTIFICATION_PREFS_KEY, prefs);
}

export async function enablePushNotifications(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  const prefs = getNotificationPreferences();
  saveNotificationPreferences({ ...prefs, pushEnabled: granted });
  return granted;
}

// Security settings
export function getSecuritySettings(): SecuritySettings {
  return readJson(SECURITY_SETTINGS_KEY, DEFAULT_SECURITY_SETTINGS);
}

export function saveSecuritySettings(settings: SecuritySettings): void {
  writeJson(SECURITY_SETTINGS_KEY, settings);
}

// General wallet preferences
export function getWalletPreferences(): WalletPreferences {
  return readJson(WALLET_PREFS_KEY, DEFAULT_WALLET_PREFERENCES);
}

export function saveWalletPreferences(prefs: WalletPreferences): void {
  writeJson(WALLET_PREFS_KEY, prefs);
}
