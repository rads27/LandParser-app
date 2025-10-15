import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/landparser',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let isInitialized = false;

export default pool;

// Helper function to execute queries with auto-initialization
export async function query(text: string, params?: any[]) {
  // Initialize database on first query if not already done
  if (!isInitialized) {
    try {
      await initializeDatabase();
      isInitialized = true;
    } catch (error) {
      console.error('Auto-initialization failed:', error);
      // Continue anyway - might be connection issue, not missing tables
    }
  }

  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Database query executed:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Database query error:', { text, duration, error });
    throw error;
  }
}

// Initialize database tables if they don't exist
export async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create encroachment_requests table
    await query(`
      CREATE TABLE IF NOT EXISTS encroachment_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        user_email VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_data TEXT NOT NULL,
        area_name VARCHAR(255),
        plot_name VARCHAR(255),
        comments TEXT,
        coordinates VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        admin_action VARCHAR(50),
        admin_reason TEXT,
        admin_feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create admin_notifications table
    await query(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        read_status BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default admin user if not exists
    await query(`
      INSERT INTO users (email, password, role) 
      VALUES ('admin@landparser.com', '$2b$10$rGIqzpHKMiC/xKfHYGn0j.VQf5xKbL8qLfL6MzE1xQxQKzYzLJz9K', 'admin')
      ON CONFLICT (email) DO NOTHING
    `);

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}