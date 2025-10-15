// PostgreSQL-based notification system for admin alerts
import { query } from './database';

export interface AdminNotification {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

class NotificationStore {
  private listeners: (() => void)[] = [];

  async addNotification(message: string, type: AdminNotification['type'] = 'info'): Promise<AdminNotification> {
    console.log('NotificationStore: Adding notification:', { message, type });
    
    const result = await query(`
      INSERT INTO admin_notifications (message, type, read_status)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [message, type, false]);

    const notification = this.mapDbRowToNotification(result.rows[0]);
    console.log('NotificationStore: Added notification:', { id: notification.id, message, type });
    
    // Notify listeners
    this.notifyListeners();
    
    return notification;
  }

  async getNotifications(): Promise<AdminNotification[]> {
    console.log('NotificationStore: getNotifications called');
    
    const result = await query(`
      SELECT * FROM admin_notifications 
      ORDER BY created_at DESC 
      LIMIT 50
    `);
    
    const notifications = result.rows.map(row => this.mapDbRowToNotification(row));
    console.log('NotificationStore: getNotifications returning:', notifications.length);
    
    return notifications;
  }

  async getUnreadCount(): Promise<number> {
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM admin_notifications 
      WHERE read_status = false
    `);
    
    return parseInt(result.rows[0].count);
  }

  async markAsRead(id: number): Promise<boolean> {
    console.log('NotificationStore: Marking as read:', id);
    
    const result = await query(`
      UPDATE admin_notifications 
      SET read_status = true 
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length > 0) {
      this.notifyListeners();
      return true;
    }
    
    return false;
  }

  async markAllAsRead(): Promise<void> {
    console.log('NotificationStore: Marking all as read');
    
    await query(`
      UPDATE admin_notifications 
      SET read_status = true 
      WHERE read_status = false
    `);
    
    this.notifyListeners();
  }

  async clearAll(): Promise<void> {
    console.log('NotificationStore: Clearing all notifications');
    
    await query(`DELETE FROM admin_notifications`);
    
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
  async addSubmissionNotification(userEmail: string, fileName: string): Promise<void> {
    await this.addNotification(
      `New encroachment submission from ${userEmail}: ${fileName}`,
      'info'
    );
  }

  private mapDbRowToNotification(row: any): AdminNotification {
    return {
      id: row.id,
      message: row.message,
      type: row.type,
      timestamp: new Date(row.created_at),
      read: row.read_status
    };
  }
}

// Global instance
const notificationStore = new NotificationStore();

export default notificationStore;