// Supabase-based notification system for admin alerts
import { supabase } from './supabase';

export interface AdminNotification {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

class SupabaseNotificationStore {
  private listeners: (() => void)[] = [];

  async addNotification(message: string, type: AdminNotification['type'] = 'info'): Promise<AdminNotification> {
    console.log('SupabaseNotificationStore: Adding notification:', { message, type });
    
    const { data, error } = await supabase
      .from('admin_notifications')
      .insert([
        {
          message: message,
          type: type,
          read_status: false
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('SupabaseNotificationStore: Error adding notification:', error);
      throw error;
    }

    const notification = this.mapSupabaseToNotification(data);
    console.log('SupabaseNotificationStore: Added notification:', { id: notification.id, message, type });
    
    // Notify listeners
    this.notifyListeners();
    
    return notification;
  }

  async getNotifications(): Promise<AdminNotification[]> {
    console.log('SupabaseNotificationStore: getNotifications called');
    
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('SupabaseNotificationStore: Error getting notifications:', error);
      throw error;
    }
    
    const notifications = data.map(row => this.mapSupabaseToNotification(row));
    console.log('SupabaseNotificationStore: getNotifications returning:', notifications.length);
    
    return notifications;
  }

  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read_status', false);

    if (error) {
      console.error('SupabaseNotificationStore: Error getting unread count:', error);
      return 0;
    }
    
    return count || 0;
  }

  async markAsRead(id: number): Promise<boolean> {
    console.log('SupabaseNotificationStore: Marking as read:', id);
    
    const { error } = await supabase
      .from('admin_notifications')
      .update({ read_status: true })
      .eq('id', id);

    if (error) {
      console.error('SupabaseNotificationStore: Error marking as read:', error);
      return false;
    }
    
    this.notifyListeners();
    return true;
  }

  async markAllAsRead(): Promise<void> {
    console.log('SupabaseNotificationStore: Marking all as read');
    
    const { error } = await supabase
      .from('admin_notifications')
      .update({ read_status: true })
      .eq('read_status', false);

    if (error) {
      console.error('SupabaseNotificationStore: Error marking all as read:', error);
      throw error;
    }
    
    this.notifyListeners();
  }

  async clearAll(): Promise<void> {
    console.log('SupabaseNotificationStore: Clearing all notifications');
    
    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .neq('id', 0); // Delete all records

    if (error) {
      console.error('SupabaseNotificationStore: Error clearing all:', error);
      throw error;
    }
    
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

  private mapSupabaseToNotification(row: any): AdminNotification {
    return {
      id: row.id,
      message: row.message,
      type: row.type,
      timestamp: new Date(row.created_at),
      read: row.read_status
    };
  }
}

const supabaseNotificationStore = new SupabaseNotificationStore();
export default supabaseNotificationStore;