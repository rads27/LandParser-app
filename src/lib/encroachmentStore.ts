// Simple in-memory storage for demo purposes
// In a real application, this would be replaced with a database

export interface EncroachmentSubmission {
  id: number;
  userEmail: string;
  fileName: string;
  fileData: string; // base64 encoded file data
  fileType: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  processedAt?: Date;
  adminNotes?: string;
  complaintDetails?: any; // Additional complaint form data
}

class EncroachmentStore {
  private submissions: EncroachmentSubmission[] = [];
  private nextId = 1;

  addSubmission(submission: Omit<EncroachmentSubmission, 'id' | 'submittedAt'>): EncroachmentSubmission {
    const newSubmission: EncroachmentSubmission = {
      ...submission,
      id: this.nextId++,
      submittedAt: new Date(),
    };
    this.submissions.push(newSubmission);
    return newSubmission;
  }

  getUserSubmissions(userEmail: string): EncroachmentSubmission[] {
    return this.submissions.filter(sub => sub.userEmail === userEmail);
  }

  getPendingSubmissions(): EncroachmentSubmission[] {
    return this.submissions.filter(sub => sub.status === 'pending');
  }

  getProcessedSubmissions(): EncroachmentSubmission[] {
    return this.submissions.filter(sub => sub.status === 'approved' || sub.status === 'rejected');
  }

  getAllSubmissions(): EncroachmentSubmission[] {
    return this.submissions;
  }

  updateSubmissionStatus(
    id: number, 
    status: 'approved' | 'rejected', 
    adminNotes?: string
  ): EncroachmentSubmission | null {
    const submission = this.submissions.find(sub => sub.id === id);
    if (submission) {
      submission.status = status;
      submission.processedAt = new Date();
      if (adminNotes) {
        submission.adminNotes = adminNotes;
      }
      return submission;
    }
    return null;
  }

  getSubmissionById(id: number): EncroachmentSubmission | null {
    return this.submissions.find(sub => sub.id === id) || null;
  }

  // Statistics methods
  getStatsForToday(): { submitted: number; processed: number } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const submittedToday = this.submissions.filter(
      sub => sub.submittedAt >= today && sub.submittedAt < tomorrow
    ).length;

    const processedToday = this.submissions.filter(
      sub => sub.processedAt && sub.processedAt >= today && sub.processedAt < tomorrow
    ).length;

    return { submitted: submittedToday, processed: processedToday };
  }

  getStatsForMonth(): { submitted: number; processed: number } {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const submittedThisMonth = this.submissions.filter(
      sub => sub.submittedAt >= startOfMonth && sub.submittedAt < startOfNextMonth
    ).length;

    const processedThisMonth = this.submissions.filter(
      sub => sub.processedAt && sub.processedAt >= startOfMonth && sub.processedAt < startOfNextMonth
    ).length;

    return { submitted: submittedThisMonth, processed: processedThisMonth };
  }
}

// Global instance
const encroachmentStore = new EncroachmentStore();

export default encroachmentStore;