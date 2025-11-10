import { NextResponse } from 'next/server';
import * as db from '@/lib/database';
import { isDatabaseConfigured } from '@/lib/config';

export async function POST() {
  try {
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured. Please set DB_USER, DB_HOST, DB_NAME, and DB_PASSWORD environment variables.'
      }, { status: 400 });
    }

    // Test connection first
    const isConnected = await db.testConnection();
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'Could not connect to database. Please check your database configuration.'
      }, { status: 500 });
    }

    // Initialize tables
    await db.initializeTables();

    return NextResponse.json({
      success: true,
      message: 'Database tables initialized successfully'
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to initialize database tables',
    configured: isDatabaseConfigured()
  });
}
