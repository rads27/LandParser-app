import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';

export async function POST() {
  try {
    console.log('API: Starting database initialization...');
    await initializeDatabase();
    console.log('API: Database initialization completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('API: Database initialization failed:', error);
    return NextResponse.json(
      { error: 'Database initialization failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}