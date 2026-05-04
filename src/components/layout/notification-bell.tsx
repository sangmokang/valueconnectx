'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  data: Notification[];
  unreadCount: number;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return '방금 전';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}일 전`;
  return date.toLocaleDateString('ko-KR');
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  });

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, error, isLoading } = useSWR<NotificationsResponse>('/api/notifications', fetcher, {
    refreshInterval: 30000,
  });

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  async function handleNotificationClick(notification: Notification) {
    if (!notification.is_read) {
      setActionError(null);
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notification.id] }),
      });
      if (res.ok) {
        mutate('/api/notifications');
      } else {
        setActionError('알림을 읽음 처리하지 못했습니다');
        return;
      }
    }
    setOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  }

  async function handleMarkAllRead() {
    setUpdating(true);
    setActionError(null);
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        mutate('/api/notifications');
      } else {
        setActionError('알림을 모두 읽음 처리하지 못했습니다');
      }
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-8 h-8 bg-transparent border-0 cursor-pointer text-vcx-sub-2 hover:text-vcx-dark transition-colors"
        aria-label={unreadCount > 0 ? `알림 ${unreadCount}개 읽지 않음` : '알림'}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[16px] h-[16px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-[3px] leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          data-testid="notification-dropdown"
          className="absolute right-0 top-full mt-2 w-80 bg-white border border-vcx-dark shadow-lg z-[300] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-vcx-beige-dark">
            <span className="text-[13px] font-semibold text-vcx-dark font-vcx-sans">
              알림
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={updating}
                className="text-[12px] text-vcx-gold font-medium bg-transparent border-0 cursor-pointer font-vcx-sans hover:underline disabled:cursor-not-allowed disabled:text-vcx-sub-5"
              >
                모두 읽음
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-[13px] text-vcx-sub-4 font-vcx-sans">
                알림을 불러오고 있습니다
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center text-[13px] text-red-600 font-vcx-sans">
                알림을 불러오지 못했습니다
              </div>
            ) : actionError ? (
              <div className="px-4 py-3 text-[13px] text-red-600 font-vcx-sans border-b border-vcx-beige-dark">
                {actionError}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-vcx-sub-4 font-vcx-sans">
                새로운 알림이 없습니다
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  data-testid="notification-item"
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-vcx-beige-dark last:border-b-0 hover:bg-vcx-beige-light transition-colors cursor-pointer bg-transparent',
                    !n.is_read && 'border-l-2 border-l-vcx-gold'
                  )}
                >
                  <p
                    className={cn(
                      'text-[13px] font-vcx-sans text-vcx-dark leading-snug',
                      !n.is_read ? 'font-semibold' : 'font-normal'
                    )}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-[12px] text-vcx-sub-2 font-vcx-sans mt-0.5 line-clamp-2 leading-snug">
                      {n.body}
                    </p>
                  )}
                  <p className="text-[11px] text-vcx-sub-5 font-vcx-sans mt-1">
                    {timeAgo(n.created_at)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
