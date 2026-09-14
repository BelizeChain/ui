'use client';

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import {
  Bell,
  X,
  Check,
  CheckCircle,
  Info,
  Warning,
  WarningOctagon,
} from 'phosphor-react';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { notifications, unreadNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle size={16} weight="fill" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Warning size={16} weight="fill" />
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <WarningOctagon size={16} weight="fill" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Info size={16} weight="fill" />
          </div>
        );
    }
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
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        aria-label={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Bell
          size={22}
          weight={unreadNotifications > 0 ? 'fill' : 'regular'}
          className={unreadNotifications > 0 ? 'text-cyan-400' : 'text-slate-300'}
        />
        {unreadNotifications > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-cyan-500 text-slate-950 text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md shadow-cyan-500/30 animate-pulse">
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

          {/* Dropdown Container */}
          <div className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)] bg-slate-900/95 border border-slate-800/90 rounded-3xl shadow-2xl backdrop-blur-2xl max-h-[520px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Bell size={15} weight="bold" />
                </div>
                <h3 className="font-bold text-sm text-white">Notifications</h3>
                {unreadNotifications > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {unreadNotifications} new
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1">
                {unreadNotifications > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-cyan-500/10"
                  >
                    <Check size={14} weight="bold" />
                    <span>Mark read</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <Bell size={24} weight="thin" />
                  </div>
                  <p className="text-slate-300 text-xs font-bold">No notifications yet</p>
                  <p className="text-slate-500 text-[11px]">System events, transfers, and alerts will appear here</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markNotificationAsRead(notification.id)}
                    className={cn(
                      'p-4 cursor-pointer hover:bg-slate-800/50 transition-colors flex items-start gap-3',
                      !notification.read && 'bg-cyan-950/20'
                    )}
                  >
                    {getNotificationIcon(notification.type || 'info')}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h4
                          className={cn(
                            'text-xs truncate',
                            !notification.read ? 'font-bold text-white' : 'font-medium text-slate-300'
                          )}
                        >
                          {notification.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{notification.message}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2.5 bg-slate-950/60 border-t border-slate-800/80 text-center text-[10px] text-slate-500 font-mono">
                BelizeChain Real-Time Alerts
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
