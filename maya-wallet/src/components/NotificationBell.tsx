'use client';

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { GlassCard } from './ui';
import { Bell, X, Check } from 'phosphor-react';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { notifications, unreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    const iconClass = cn(
      'w-10 h-10 rounded-lg flex items-center justify-center',
      type === 'success' && 'bg-emerald-100',
      type === 'info' && 'bg-blue-100',
      type === 'warning' && 'bg-amber-100',
      type === 'error' && 'bg-red-100'
    );

    return <div className={iconClass}>{/* Icon based on type */}</div>;
  };

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell size={24} weight={unreadNotifications > 0 ? 'fill' : 'regular'} className="text-gray-700" />
        {unreadNotifications > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)]">
            <GlassCard variant="medium" blur="lg" className="max-h-[500px] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadNotifications > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-forest-600 hover:text-forest-700 font-semibold flex items-center space-x-1"
                    >
                      <Check size={14} />
                      <span>Mark all read</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={48} weight="thin" className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markNotificationAsRead(notification.id)}
                        className={cn(
                          'p-4 cursor-pointer hover:bg-gray-50 transition-colors',
                          !notification.read && 'bg-forest-50/30'
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={cn(
                            'w-2 h-2 rounded-full mt-2',
                            !notification.read && 'bg-forest-500',
                            notification.read && 'bg-transparent'
                          )} />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className={cn(
                                'text-sm',
                                !notification.read && 'font-semibold text-gray-900',
                                notification.read && 'font-medium text-gray-700'
                              )}>
                                {notification.title}
                              </h4>
                              <span className="text-xs text-gray-400 ml-2">
                                {formatTime(notification.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
