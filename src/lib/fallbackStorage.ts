// Fallback in-memory storage when database is not available
import { EncroachmentSubmission } from './encroachmentStore';
import { AdminNotification } from './notificationStore';

class FallbackStorage {
  private submissions: EncroachmentSubmission[] = [];
  private notifications: AdminNotification[] = [];
  private nextSubmissionId = 1;
  private nextNotificationId = 1;

  // Encroachment methods
  async addSubmission(submission: Omit<EncroachmentSubmission, 'id' | 'submittedAt'>): Promise<EncroachmentSubmission> {
    const newSubmission: EncroachmentSubmission = {
      ...submission,
      id: this.nextSubmissionId++,
      submittedAt: new Date(),
    };
    
    this.submissions.unshift(newSubmission);
    console.log('FallbackStorage: Added submission:', { id: newSubmission.id, userEmail: submission.userEmail });
    
    return newSubmission;
  }

  async getUserSubmissions(userEmail: string): Promise<EncroachmentSubmission[]> {
    return this.submissions.filter(sub => sub.userEmail === userEmail);
  }

  async getPendingSubmissions(): Promise<EncroachmentSubmission[]> {
    return this.submissions.filter(sub => sub.status === 'pending');
  }

  async getAllSubmissions(): Promise<EncroachmentSubmission[]> {
    return [...this.submissions];
  }

  async updateSubmissionStatus(id: number, status: 'approved' | 'rejected', adminNotes?: string): Promise<EncroachmentSubmission | null> {
    const submission = this.submissions.find(sub => sub.id === id);
    if (submission) {
      submission.status = status;
      submission.processedAt = new Date();
      submission.adminNotes = adminNotes;
      return submission;
    }
    return null;
  }

  // Notification methods
  async addNotification(message: string, type: AdminNotification['type'] = 'info'): Promise<AdminNotification> {
    const notification: AdminNotification = {
      id: this.nextNotificationId++,
      message,
      type,
      timestamp: new Date(),
      read: false,
    };
    
    this.notifications.unshift(notification);
    return notification;
  }

  async getNotifications(): Promise<AdminNotification[]> {
    return [...this.notifications];
  }

  async getUnreadCount(): Promise<number> {
    return this.notifications.filter(n => !n.read).length;
  }

  async addSubmissionNotification(userEmail: string, fileName: string): Promise<void> {
    await this.addNotification(`New encroachment submission from ${userEmail}: ${fileName}`, 'info');
  }
}

const fallbackStorage = new FallbackStorage();
export default fallbackStorage;