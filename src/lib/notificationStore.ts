// Simple notification system for admin alerts
export interface AdminNotification {

  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

class NotificationStore {
  private notifications: AdminNotification[] = [];
  private nextId = 1;
  private listeners: (() => void)[] = [];

  addNotification(message: string, type: AdminNotification['type'] = 'info'): AdminNotification {
    const notification: AdminNotification = {
      id: this.nextId++,
      message,
      type,
      timestamp: new Date(),
      read: false,
    };
    
    this.notifications.unshift(notification); // Add to beginning
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    
    // Notify listeners
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
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Helper method to add submission notification
  addSubmissionNotification(userEmail: string, fileName: string): void {
    this.addNotification(
      `New encroachment submission from ${userEmail}: ${fileName}`,
      'info'
    );
  }
}

// Global instance
const notificationStore = new NotificationStore();

export default notificationStore;