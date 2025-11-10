import { NextResponse } from 'next/server';
import * as db from '@/lib/database';
import { isDatabaseConfigured, getConfigWarnings } from '@/lib/config';

export async function GET() {
  try {
    const warnings = getConfigWarnings();
    
    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'Database not configured',
        warnings,
        hint: 'Set DB_USER, DB_HOST, DB_NAME, and DB_PASSWORD in .env.local'
      });
    }

    // Test database connection
    const isConnected = await db.testConnection();

    if (isConnected) {
      return NextResponse.json({
        success: true,
        configured: true,
        connected: true,
        message: 'Database connection successful',
        warnings: warnings.length > 0 ? warnings : undefined
      });
    } else {
      return NextResponse.json({
        success: false,
        configured: true,
        connected: false,
        message: 'Database configured but connection failed',
        warnings,
        hint: 'Check if PostgreSQL is running and credentials are correct'
      });
    }
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      hint: 'Check server logs for details'
    }, { status: 500 });
  }
}
