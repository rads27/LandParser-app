// PostgreSQL-based store for encroachment requests
import { query } from './database';

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
  async addSubmission(submission: Omit<EncroachmentSubmission, 'id' | 'submittedAt'>): Promise<EncroachmentSubmission> {
    console.log('EncroachmentStore: Adding submission for:', submission.userEmail, submission.fileName);
    
    const result = await query(`
      INSERT INTO encroachment_requests 
      (user_email, file_name, file_data, status, admin_feedback, area_name, plot_name, comments, coordinates)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      submission.userEmail,
      submission.fileName,
      submission.fileData,
      submission.status,
      submission.adminNotes || null,
      submission.complaintDetails?.areaName || null,
      submission.complaintDetails?.plotName || null,
      submission.complaintDetails?.comments || null,
      submission.complaintDetails?.coordinates || null
    ]);

    const newSubmission = this.mapDbRowToSubmission(result.rows[0]);
    console.log('EncroachmentStore: Added submission:', { id: newSubmission.id, userEmail: submission.userEmail, status: submission.status });
    
    return newSubmission;
  }

  async getUserSubmissions(userEmail: string): Promise<EncroachmentSubmission[]> {
    console.log('EncroachmentStore: Getting user submissions for:', userEmail);
    
    const result = await query(`
      SELECT * FROM encroachment_requests 
      WHERE user_email = $1 
      ORDER BY created_at DESC
    `, [userEmail]);
    
    const submissions = result.rows.map(row => this.mapDbRowToSubmission(row));
    console.log('EncroachmentStore: Found user submissions:', submissions.length);
    
    return submissions;
  }

  async getPendingSubmissions(): Promise<EncroachmentSubmission[]> {
    console.log('EncroachmentStore: getPendingSubmissions called');
    
    const result = await query(`
      SELECT * FROM encroachment_requests 
      WHERE status = 'pending' 
      ORDER BY created_at DESC
    `);
    
    const pending = result.rows.map(row => this.mapDbRowToSubmission(row));
    console.log('EncroachmentStore: getPendingSubmissions found:', pending.length);
    
    return pending;
  }

  async getAllSubmissions(): Promise<EncroachmentSubmission[]> {
    console.log('EncroachmentStore: getAllSubmissions called');
    
    const result = await query(`
      SELECT * FROM encroachment_requests 
      ORDER BY created_at DESC
    `);
    
    return result.rows.map(row => this.mapDbRowToSubmission(row));
  }

  async updateSubmissionStatus(
    id: number, 
    status: 'approved' | 'rejected', 
    adminNotes?: string
  ): Promise<EncroachmentSubmission | null> {
    console.log('EncroachmentStore: Updating submission status:', { id, status, adminNotes });
    
    const result = await query(`
      UPDATE encroachment_requests 
      SET status = $1, admin_reason = $2, admin_feedback = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [status, adminNotes || '', adminNotes || '', id]);

    if (result.rows.length > 0) {
      return this.mapDbRowToSubmission(result.rows[0]);
    }
    
    return null;
  }

  async getSubmissionById(id: number): Promise<EncroachmentSubmission | null> {
    const result = await query(`
      SELECT * FROM encroachment_requests 
      WHERE id = $1
    `, [id]);

    if (result.rows.length > 0) {
      return this.mapDbRowToSubmission(result.rows[0]);
    }
    
    return null;
  }

  async getStatsForToday(): Promise<{ submitted: number; processed: number }> {
    const result = await query(`
      SELECT 
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as submitted,
        COUNT(CASE WHEN DATE(updated_at) = CURRENT_DATE AND status != 'pending' THEN 1 END) as processed
      FROM encroachment_requests
    `);

    return {
      submitted: parseInt(result.rows[0].submitted),
      processed: parseInt(result.rows[0].processed)
    };
  }

  async getStatsForMonth(): Promise<{ submitted: number; processed: number }> {
    const result = await query(`
      SELECT 
        COUNT(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as submitted,
        COUNT(CASE WHEN DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', CURRENT_DATE) AND status != 'pending' THEN 1 END) as processed
      FROM encroachment_requests
    `);

    return {
      submitted: parseInt(result.rows[0].submitted),
      processed: parseInt(result.rows[0].processed)
    };
  }

  private mapDbRowToSubmission(row: any): EncroachmentSubmission {
    return {
      id: row.id,
      userEmail: row.user_email,
      fileName: row.file_name,
      fileData: row.file_data,
      fileType: 'image/jpeg',
      status: row.status,
      submittedAt: new Date(row.created_at),
      processedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      adminNotes: row.admin_reason || row.admin_feedback,
      complaintDetails: {
        areaName: row.area_name,
        plotName: row.plot_name,
        comments: row.comments,
        coordinates: row.coordinates
      }
    };
  }
}

// Global instance
const encroachmentStore = new EncroachmentStore();

export default encroachmentStore;