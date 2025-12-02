// Simple notification system for admin alerts
export interface AdminNotification {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string; // ISO string for serialization
  read: boolean;
  // target: 'admin' or user email
  target?: string;
  data?: any;
}

class NotificationStore {
  private notifications: AdminNotification[] = [];
  private nextId = 1;
  private listeners: ((n: AdminNotification[]) => void)[] = [];

  addNotification(message: string, type: AdminNotification['type'] = 'info', target: string = 'admin', data?: any): AdminNotification {
    const notification: AdminNotification = {
      id: this.nextId++,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      target,
      data: data || null,
    };

    this.notifications.unshift(notification);

    if (this.notifications.length > 50) this.notifications = this.notifications.slice(0, 50);

    // Publish to Redis if available (dynamically imported to avoid hard dependency)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { enabled, pub } = require('./redisClient');
      if (enabled && pub) {
        pub.publish('notifications', JSON.stringify(notification));
      }
    } catch (_) {
      // ignore
    }

    this.notifyListeners();

    return notification;
  }

  getNotifications(): AdminNotification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(id: number): boolean {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  clearAll(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  // Event system for real-time updates
  subscribe(listener: (n: AdminNotification[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const snapshot = this.getNotifications();
    this.listeners.forEach(listener => {
      try { listener(snapshot); } catch (_) {}
    });
  }

  // Helper method to add submission notification targeted to admins
  addSubmissionNotification(userEmail: string, fileName: string): void {
    this.addNotification(`New encroachment submission from ${userEmail}: ${fileName}`, 'info', 'admin', { userEmail, fileName });
  }

  // Receive a notification published from another instance (via Redis)
  receiveExternalNotification(raw: any): void {
    try {
      // Raw is expected to be the serialized notification object
      const n = raw;
      // Avoid double-publishing to Redis
      const notification: AdminNotification = {
        id: this.nextId++,
        message: n.message || String(n),
        type: n.type || 'info',
        timestamp: (n.timestamp) || new Date().toISOString(),
        read: n.read || false,
        target: n.target || 'admin',
        data: n.data || null,
      };

      this.notifications.unshift(notification);
      if (this.notifications.length > 50) this.notifications = this.notifications.slice(0, 50);
      this.notifyListeners();
    } catch (_) {
      // ignore parse errors
    }
  }
}

// Global instance
const notificationStore = new NotificationStore();
// If Redis is available, subscribe to the notifications channel and apply external messages
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { enabled, sub } = require('./redisClient');
  if (enabled && sub) {
    sub.subscribe('notifications', (err: any) => {
      if (!err) {
        sub.on('message', (channel: string, message: string) => {
          try {
            const parsed = JSON.parse(message);
            notificationStore.receiveExternalNotification(parsed);
          } catch (_) {}
        });
      }
    });
  }
} catch (_) {
  // ignore
}

export default notificationStore;