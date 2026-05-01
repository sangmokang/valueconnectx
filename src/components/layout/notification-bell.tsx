'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import useSWR, { mutate } from 'swr';

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
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useSWR<NotificationsResponse>('/api/notifications', fetcher, {
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
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notification.id] }),
      });
      mutate('/api/notifications');
    }
    setOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  }

  async function handleMarkAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    mutate('/api/notifications');
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-10 h-10 bg-transparent border border-[#3d3a39] cursor-pointer"
        aria-label="알림"
      >
        <Bell size={20} color="#b8b3b0" className="transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#fb565b] text-white text-[12px] font-bold flex items-center justify-center px-[3px] leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[#101010] border border-[#3d3a39] shadow-[0_20px_60px_rgba(0,0,0,0.7)] z-[300] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#3d3a39]">
            <span className="text-[15px] font-semibold text-[#f2f2f2] font-[system-ui,sans-serif]">
              알림
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[14px] text-[#2fd6a1] font-medium bg-transparent border-0 cursor-pointer font-[system-ui,sans-serif] hover:underline"
              >
                모두 읽음
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[15px] text-[#8b949e] font-[system-ui,sans-serif]">
                새로운 알림이 없습니다
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-[#3d3a39] last:border-b-0 hover:bg-[#171717] transition-colors cursor-pointer bg-transparent ${
                    !n.is_read ? 'border-l-2 border-l-[#00d992]' : ''
                  }`}
                >
                  <p
                    className={`text-[15px] font-[system-ui,sans-serif] text-[#f2f2f2] leading-snug ${
                      !n.is_read ? 'font-semibold' : 'font-normal'
                    }`}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-[14px] text-[#b8b3b0] font-[system-ui,sans-serif] mt-1 line-clamp-2 leading-snug">
                      {n.body}
                    </p>
                  )}
                  <p className="text-[13px] text-[#8b949e] font-[system-ui,sans-serif] mt-1">
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
