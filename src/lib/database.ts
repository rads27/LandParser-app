import pool from './db';
import { EncroachmentSubmission } from './encroachmentStore';

/**
 * Database utility functions for encroachment submissions
 */

export interface DBEncroachmentSubmission {
  id: number;
  user_email: string;
  file_name: string;
  file_data: string;
  file_type: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: Date;
  processed_at?: Date;
  admin_notes?: string;
  complaint_details?: any;
}

/**
 * Initialize database tables if they don't exist
 */
export async function initializeTables(): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Create encroachment_submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS encroachment_submissions (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_data TEXT NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        admin_notes TEXT,
        complaint_details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on user_email for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_submissions_user_email 
      ON encroachment_submissions(user_email);
    `);

    // Create index on status for faster filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_submissions_status 
      ON encroachment_submissions(status);
    `);

    // Create index on submitted_at for date filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at 
      ON encroachment_submissions(submitted_at);
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Add a new encroachment submission
 */
export async function addSubmission(
  submission: Omit<EncroachmentSubmission, 'id' | 'submittedAt'>
): Promise<EncroachmentSubmission> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `INSERT INTO encroachment_submissions 
       (user_email, file_name, file_data, file_type, status, complaint_details) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        submission.userEmail,
        submission.fileName,
        submission.fileData,
        submission.fileType,
        submission.status,
        JSON.stringify(submission.complaintDetails || {})
      ]
    );

    const row = result.rows[0];
    return mapDBToSubmission(row);
  } catch (error) {
    console.error('Error adding submission:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get submissions for a specific user
 */
export async function getUserSubmissions(userEmail: string): Promise<EncroachmentSubmission[]> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT * FROM encroachment_submissions 
       WHERE user_email = $1 
       ORDER BY submitted_at DESC`,
      [userEmail]
    );

    return result.rows.map(mapDBToSubmission);
  } catch (error) {
    console.error('Error getting user submissions:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all pending submissions
 */
export async function getPendingSubmissions(): Promise<EncroachmentSubmission[]> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT * FROM encroachment_submissions 
       WHERE status = 'pending' 
       ORDER BY submitted_at DESC`
    );

    return result.rows.map(mapDBToSubmission);
  } catch (error) {
    console.error('Error getting pending submissions:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all processed submissions (approved or rejected)
 */
export async function getProcessedSubmissions(): Promise<EncroachmentSubmission[]> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT * FROM encroachment_submissions 
       WHERE status IN ('approved', 'rejected') 
       ORDER BY processed_at DESC`
    );

    return result.rows.map(mapDBToSubmission);
  } catch (error) {
    console.error('Error getting processed submissions:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all submissions
 */
export async function getAllSubmissions(): Promise<EncroachmentSubmission[]> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT * FROM encroachment_submissions 
       ORDER BY submitted_at DESC`
    );

    return result.rows.map(mapDBToSubmission);
  } catch (error) {
    console.error('Error getting all submissions:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update submission status
 */
export async function updateSubmissionStatus(
  id: number,
  status: 'approved' | 'rejected',
  adminNotes?: string
): Promise<EncroachmentSubmission | null> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `UPDATE encroachment_submissions 
       SET status = $1, 
           processed_at = CURRENT_TIMESTAMP,
           admin_notes = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [status, adminNotes, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapDBToSubmission(result.rows[0]);
  } catch (error) {
    console.error('Error updating submission status:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get statistics for today
 */
export async function getStatsForToday(): Promise<{ submitted: number; processed: number }> {
  const client = await pool.connect();
  
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get submitted today
    const submittedResult = await client.query(
      `SELECT COUNT(*) as count 
       FROM encroachment_submissions 
       WHERE submitted_at >= $1`,
      [todayStart]
    );

    // Get processed today
    const processedResult = await client.query(
      `SELECT COUNT(*) as count 
       FROM encroachment_submissions 
       WHERE processed_at >= $1`,
      [todayStart]
    );

    return {
      submitted: parseInt(submittedResult.rows[0].count),
      processed: parseInt(processedResult.rows[0].count)
    };
  } catch (error) {
    console.error('Error getting today stats:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get statistics for current month
 */
export async function getStatsForMonth(): Promise<{ submitted: number; processed: number }> {
  const client = await pool.connect();
  
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get submitted this month
    const submittedResult = await client.query(
      `SELECT COUNT(*) as count 
       FROM encroachment_submissions 
       WHERE submitted_at >= $1`,
      [monthStart]
    );

    // Get processed this month
    const processedResult = await client.query(
      `SELECT COUNT(*) as count 
       FROM encroachment_submissions 
       WHERE processed_at >= $1`,
      [monthStart]
    );

    return {
      submitted: parseInt(submittedResult.rows[0].count),
      processed: parseInt(processedResult.rows[0].count)
    };
  } catch (error) {
    console.error('Error getting month stats:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get accuracy rate (approved / total processed)
 */
export async function getAccuracyRate(): Promise<number> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status != 'pending') as processed
      FROM encroachment_submissions
    `);

    const { approved, processed } = result.rows[0];
    const approvedCount = parseInt(approved);
    const processedCount = parseInt(processed);

    if (processedCount === 0) return 0;
    return Math.round((approvedCount / processedCount) * 100);
  } catch (error) {
    console.error('Error getting accuracy rate:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Helper function to map database row to EncroachmentSubmission
 */
function mapDBToSubmission(row: DBEncroachmentSubmission): EncroachmentSubmission {
  return {
    id: row.id,
    userEmail: row.user_email,
    fileName: row.file_name,
    fileData: row.file_data,
    fileType: row.file_type,
    status: row.status,
    submittedAt: row.submitted_at,
    processedAt: row.processed_at,
    adminNotes: row.admin_notes,
    complaintDetails: row.complaint_details
  };
}
