'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@belizechain/shared';
import { 
  ArrowLeft, 
  Bell, 
  Check, 
  Money,
  FileText,
  Gift,
  ShieldCheck,
  Info,
  ChatCircle,
  Trash
} from 'phosphor-react';
import { getNotifications, markAsRead, clearAllNotifications, type WalletNotification } from '@/services/notifications';

const iconMap = {
  payment: Money,
  document: FileText,
  reward: Gift,
  security: ShieldCheck,
  system: Info,
  message: ChatCircle,
};

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<WalletNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const allNotifications = getNotifications();
    setNotifications(allNotifications);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    loadNotifications();
  };

  const handleClearAll = () => {
    if (confirm('Clear all notifications?')) {
      clearAllNotifications();
      loadNotifications();
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 px-6 py-4 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-700/20 rounded-lg transition-colors">
              <ArrowLeft size={24} weight="bold" className="text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <div className="bg-red-500/100 px-3 py-1 rounded-full text-sm font-bold">
              {unreadCount}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 bg-gray-800/50 p-1 rounded-xl shadow-sm border border-gray-700/30">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-emerald-500/100 text-white'
                : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-emerald-500/100 text-white'
                : 'text-gray-400 hover:bg-gray-700/30'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Clear All Button */}
        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800/50 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/100/100/10 transition-colors"
          >
            <Trash size={20} weight="bold" />
            <span className="font-medium">Clear All</span>
          </button>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-gray-800/50 rounded-xl shadow-sm p-12 text-center border border-gray-700/30">
              <Bell size={64} className="mx-auto text-gray-600 mb-4" weight="thin" />
              <p className="text-gray-400 font-medium">No notifications</p>
              <p className="text-gray-500 text-sm mt-1">
                {filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = iconMap[notification.type];
              return (
                <div
                  key={notification.id}
                  className={`bg-gray-800/50 rounded-xl shadow-sm p-4 hover:bg-gray-800/70 transition-all border border-gray-700/30 ${
                    !notification.read ? 'border-l-4 border-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      notification.type === 'payment' ? 'bg-green-500/100/20 text-green-400' :
                      notification.type === 'document' ? 'bg-blue-500/100/20 text-blue-400' :
                      notification.type === 'reward' ? 'bg-yellow-500/20 text-yellow-400' :
                      notification.type === 'security' ? 'bg-red-500/100/20 text-red-400' :
                      notification.type === 'message' ? 'bg-purple-500/100/20 text-purple-400' :
                      'bg-gray-700/30 text-gray-400'
                    }`}>
                      <Icon size={24} weight="bold" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-white">{notification.title}</h3>
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 text-emerald-500 hover:bg-emerald-500/100/10 rounded-lg transition-colors flex-shrink-0"
                            title="Mark as read"
                          >
                            <Check size={20} weight="bold" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{notification.message}</p>
                      <p className="text-gray-500 text-xs mt-2">{notification.timestamp.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
