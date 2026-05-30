'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { getSocket } from '@/lib/socket';
import Link from 'next/link';

export default function NotificationBell() {
  const { accessToken: token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { notifications, unreadCount, setNotifications, setUnreadCount, addNotification, markAllRead } =
    useNotificationStore();

  const { data, isLoading } = useQuery<any>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    enabled: !!token,
    staleTime: 30000,
  });

  useEffect(() => {
    if (data) {
      setNotifications(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    }
  }, [data, setNotifications, setUnreadCount]);

  // Socket listener for real-time notifications
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);

    const handler = (notification: any) => {
      addNotification(notification);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('new_notification', handler);
    return () => { socket.off('new_notification', handler); };
  }, [token, addNotification, queryClient]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/mark-all-read').then((r) => r.data),
    onSuccess: () => {
      markAllRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="الإشعارات"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white border border-border rounded-2xl shadow-lg z-50 overflow-hidden" dir="rtl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markReadMutation.mutate()}
                disabled={markReadMutation.isPending}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                تعليم الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-muted">جارٍ التحميل...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted">لا توجد إشعارات</div>
            ) : (
              notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-border last:border-0 transition-colors ${
                    !n.isRead ? 'bg-primary/5' : 'hover:bg-gray-50'
                  }`}
                >
                  {n.khatmaId ? (
                    <Link
                      href={`/khatma/${n.khatmaId}`}
                      onClick={() => setOpen(false)}
                      className="block"
                    >
                      <NotifItem n={n} />
                    </Link>
                  ) : (
                    <NotifItem n={n} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifItem({ n }: { n: any }) {
  return (
    <>
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">{typeIcon(n.type)}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${!n.isRead ? 'text-foreground' : 'text-gray-700'}`}>{n.title}</p>
          <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.body}</p>
        </div>
        {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
      </div>
      <p className="text-[11px] text-muted mt-1 text-left">{formatAge(n.createdAt)}</p>
    </>
  );
}

function typeIcon(type: string) {
  const icons: Record<string, string> = {
    PART_RESERVED: '📖',
    PART_COMPLETED: '✅',
    KHATMA_COMPLETED: '🎉',
    DEADLINE_REMINDER: '⏰',
    INVITATION_SENT: '✉️',
    KHATMA_JOINED: '👤',
    JOIN_APPROVED: '✔️',
    JOIN_REJECTED: '❌',
    PART_RELEASED: '🔄',
  };
  return icons[type] ?? '🔔';
}

function formatAge(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  return `منذ ${Math.floor(h / 24)} ي`;
}
