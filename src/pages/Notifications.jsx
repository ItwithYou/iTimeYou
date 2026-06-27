import { useState, useEffect } from 'react';
import { useAppContext } from '../lib/AppContext';
import { base44 } from '@/api/base44Client';
import { formatTimestampDMY } from '../utils/dateUtils';

export default function Notifications() {
  const { currentUser, t, lang } = useAppContext();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const load = () => base44.entities.Notification.filter({ user_email: currentUser.email }, '-created_date', 30).then(setNotifications);
    load();
    const unsub = base44.entities.Notification.subscribe(() => {
      load();
    });
    return unsub;
  }, [currentUser]);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.notifications}</h1>
        <button
          onClick={markAllRead}
          className="border border-border px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
        >
          {t.markRead}
        </button>
      </div>

      <div className="space-y-2">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`flex gap-3 p-4 rounded-xl transition-colors ${
              n.is_read ? 'bg-card' : 'bg-primary/5 border-l-3 border-primary'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-lg flex-shrink-0">
              {n.type}
            </div>
            <div className="flex-1">
              <p className="text-sm">{lang === 'lo' && n.text_lao ? n.text_lao : n.text}</p>
              <span className="text-xs text-muted-foreground">{formatTimestampDMY(n.created_date)}</span>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🔔</p>
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}