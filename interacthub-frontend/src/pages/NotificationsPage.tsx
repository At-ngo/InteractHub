import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications();
      if (res.success) setNotifications(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleMarkRead = async (id: number) => {
    await notificationService.markAsRead(id);
    const notif = notifications.find(n => n.id === id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    // navigate to related entity when possible
    if (notif) {
      if (notif.relatedEntityId) {
        // Heuristics: relatedEntityId can be postId, userId, conversationId
        if (notif.type === 'comment' || notif.type === 'like') {
          // go to post
          window.location.href = `/post/${notif.relatedEntityId}`;
        } else if (notif.type === 'friend_request' || notif.type === 'follow') {
          window.location.href = `/profile/${notif.relatedEntityId}`;
        } else if (notif.type === 'message') {
          window.location.href = `/messaging?convId=${notif.relatedEntityId}`;
        } else {
          // fallback to notifications page
        }
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return '👍';
      case 'comment': return '💬';
      case 'friend_request': return '👥';
      default: return '🔔';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-linkedin-text">Thông báo</h1>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-linkedin-blue hover:underline"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="bg-white rounded-lg border border-linkedin-border p-8 text-center text-linkedin-muted">
                Chưa có thông báo nào
              </div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className={`bg-white rounded-lg border border-linkedin-border p-4 flex items-start gap-3 cursor-pointer hover:bg-linkedin-gray transition-colors ${!n.isRead ? 'border-l-4 border-l-linkedin-blue' : ''}`}
              >
                <span className="text-2xl">{getIcon(n.type)}</span>
                <div className="flex-1">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold' : ''}`}>{n.message}</p>
                  <p className="text-xs text-linkedin-muted mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <div className="w-2 h-2 bg-linkedin-blue rounded-full mt-2 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
export default NotificationsPage;