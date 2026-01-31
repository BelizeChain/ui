import { create } from 'zustand';

// Simple notification for UI toasts
interface UINotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

interface UIState {
  theme: 'light' | 'dark';
  language: 'en' | 'es' | 'kriol';
  notifications: UINotification[];
  addNotification: (notification: Omit<UINotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  setLanguage: (language: 'en' | 'es' | 'kriol') => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  language: 'en',
  notifications: [],

  addNotification: (notification) => {
    const newNotification: UINotification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  setLanguage: (language) => {
    set({ language });
  },
}));
