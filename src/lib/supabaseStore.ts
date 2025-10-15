// Supabase-based storage for encroachment requests
import { supabase } from './supabase';

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

class SupabaseEncroachmentStore {
  async addSubmission(submission: Omit<EncroachmentSubmission, 'id' | 'submittedAt'>): Promise<EncroachmentSubmission> {
    console.log('SupabaseStore: Adding submission for:', submission.userEmail, submission.fileName);
    
    const { data, error } = await supabase
      .from('encroachment_requests')
      .insert([
        {
          user_email: submission.userEmail,
          file_name: submission.fileName,
          file_data: submission.fileData,
          status: submission.status,
          admin_feedback: submission.adminNotes || null,
          area_name: submission.complaintDetails?.areaName || null,
          plot_name: submission.complaintDetails?.plotName || null,
          comments: submission.complaintDetails?.comments || null,
          coordinates: submission.complaintDetails?.coordinates || null,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('SupabaseStore: Error adding submission:', error);
      throw error;
    }

    const newSubmission = this.mapSupabaseToSubmission(data);
    console.log('SupabaseStore: Added submission:', { id: newSubmission.id, userEmail: submission.userEmail });
    
    return newSubmission;
  }

  async getUserSubmissions(userEmail: string): Promise<EncroachmentSubmission[]> {
    console.log('SupabaseStore: Getting user submissions for:', userEmail);
    
    const { data, error } = await supabase
      .from('encroachment_requests')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('SupabaseStore: Error getting user submissions:', error);
      throw error;
    }
    
    const submissions = data.map(row => this.mapSupabaseToSubmission(row));
    console.log('SupabaseStore: Found user submissions:', submissions.length);
    
    return submissions;
  }

  async getPendingSubmissions(): Promise<EncroachmentSubmission[]> {
    console.log('SupabaseStore: getPendingSubmissions called');
    
    const { data, error } = await supabase
      .from('encroachment_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('SupabaseStore: Error getting pending submissions:', error);
      throw error;
    }
    
    const pending = data.map(row => this.mapSupabaseToSubmission(row));
    console.log('SupabaseStore: getPendingSubmissions found:', pending.length);
    
    return pending;
  }

  async getAllSubmissions(): Promise<EncroachmentSubmission[]> {
    console.log('SupabaseStore: getAllSubmissions called');
    
    const { data, error } = await supabase
      .from('encroachment_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('SupabaseStore: Error getting all submissions:', error);
      throw error;
    }
    
    const submissions = data.map(row => this.mapSupabaseToSubmission(row));
    console.log('SupabaseStore: getAllSubmissions returning:', submissions.length);
    
    return submissions;
  }

  async updateSubmissionStatus(
    id: number, 
    status: 'approved' | 'rejected', 
    adminNotes?: string
  ): Promise<EncroachmentSubmission | null> {
    console.log('SupabaseStore: Updating submission status:', { id, status, adminNotes });
    
    const { data, error } = await supabase
      .from('encroachment_requests')
      .update({
        status: status,
        admin_reason: adminNotes || '',
        admin_feedback: adminNotes || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('SupabaseStore: Error updating submission status:', error);
      throw error;
    }

    if (data) {
      const updatedSubmission = this.mapSupabaseToSubmission(data);
      console.log('SupabaseStore: Updated submission status successfully');
      return updatedSubmission;
    }
    
    return null;
  }

  async getSubmissionById(id: number): Promise<EncroachmentSubmission | null> {
    const { data, error } = await supabase
      .from('encroachment_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('SupabaseStore: Error getting submission by ID:', error);
      return null;
    }

    return data ? this.mapSupabaseToSubmission(data) : null;
  }

  async getStatsForToday(): Promise<{ submitted: number; processed: number }> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('encroachment_requests')
      .select('status, created_at, updated_at')
      .gte('created_at', today);

    if (error) {
      console.error('SupabaseStore: Error getting today stats:', error);
      return { submitted: 0, processed: 0 };
    }

    const submitted = data.length;
    const processed = data.filter(item => 
      item.updated_at && 
      item.updated_at.startsWith(today) && 
      item.status !== 'pending'
    ).length;

    return { submitted, processed };
  }

  async getStatsForMonth(): Promise<{ submitted: number; processed: number }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const { data, error } = await supabase
      .from('encroachment_requests')
      .select('status, created_at, updated_at')
      .gte('created_at', startOfMonth);

    if (error) {
      console.error('SupabaseStore: Error getting month stats:', error);
      return { submitted: 0, processed: 0 };
    }

    const submitted = data.length;
    const processed = data.filter(item => 
      item.updated_at && 
      new Date(item.updated_at) >= new Date(startOfMonth) && 
      item.status !== 'pending'
    ).length;

    return { submitted, processed };
  }

  private mapSupabaseToSubmission(row: any): EncroachmentSubmission {
    return {
      id: row.id,
      userEmail: row.user_email,
      fileName: row.file_name,
      fileData: row.file_data,
      fileType: 'image/jpeg', // Default, could be enhanced
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

const supabaseEncroachmentStore = new SupabaseEncroachmentStore();
export default supabaseEncroachmentStore;