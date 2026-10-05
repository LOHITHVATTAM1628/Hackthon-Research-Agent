'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  Users,
  Check,
  ExternalLink,
  Loader2,
  MessageSquare,
  Clock,
  XCircle,
} from 'lucide-react';
import { NotificationItem } from '@/lib/supabase/types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

export function NotificationBell() {
  const { user } = useAuth();
  const userId = user?.id || '135a077d-43f4-4e02-a0b9-39d6480eb9f3';

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // Supabase Realtime channel with proper cleanup on unmount
    const channelName = `notifs_${userId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationItem;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((c) => c + 1);
        }
      )
      .subscribe();

    // Relaxed polling fallback (every 30s)
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(interval);
      if (channel) {
        channel.unsubscribe().catch(() => {});
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [userId]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_status: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Error marking notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true, userId }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Error marking all notifications read:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read_status) {
      handleMarkAsRead(item.id);
    }
    setIsOpen(false);
    if (item.type.includes('collaboration')) {
      router.push('/collaborations');
    } else if (item.related_research_id) {
      router.push(`/research/${item.related_research_id}/report`);
    }
  };

  const getNotifDetails = (type: string) => {
    if (type.includes('accept')) {
      return {
        icon: <CheckCircle2 size={15} />,
        className: 'accepted',
      };
    }
    if (type.includes('decline')) {
      return {
        icon: <XCircle size={15} />,
        className: 'declined',
      };
    }
    if (type.includes('invite') || type.includes('request')) {
      return {
        icon: <Users size={15} />,
        className: 'invite',
      };
    }
    return {
      icon: <MessageSquare size={15} />,
      className: 'note',
    };
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        type="button"
        id="btn-notification-bell"
        className="bell-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-panel" role="menu">
          <div className="notif-dropdown-header">
            <span className="notif-header-title">
              <Bell size={15} className="text-orange" />
              Notifications
              {unreadCount > 0 && (
                <span className="score-mini-pill">{unreadCount}</span>
              )}
            </span>

            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="mark-all-read-btn"
                  onClick={handleMarkAllRead}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty-state">
                <Bell size={24} className="text-muted mb-2" />
                <p className="text-white text-sm mb-1 font-semibold">No notifications</p>
                <span className="text-xs text-muted">
                  Collaboration requests and updates will appear here in real time.
                </span>
              </div>
            ) : (
              notifications.map((item) => {
                const details = getNotifDetails(item.type);
                return (
                  <div
                    key={item.id}
                    className={`notif-item ${!item.read_status ? 'unread' : 'read'}`}
                    onClick={() => handleNotificationClick(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={`notif-icon-box ${details.className}`}>
                      {details.icon}
                    </div>

                    <div className="notif-content">
                      <p className="notif-message">{item.message}</p>
                      <div className="notif-meta-row">
                        <Clock size={11} />
                        <span>
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {!item.read_status && (
                      <button
                        type="button"
                        className="notif-check-btn"
                        title="Mark as read"
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="notif-dropdown-footer">
            <Link
              href="/collaborations"
              className="notif-view-all-link"
              onClick={() => setIsOpen(false)}
            >
              <span>Open Collaboration Hub</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

