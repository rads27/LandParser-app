import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test Supabase connection
    const { data, error } = await supabase
      .from('encroachment_requests')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      database: 'Supabase (PostgreSQL)',
      testResult: { connected: true, records: data?.length || 0 }
    });
  } catch (error) {
    console.error('Supabase connection failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Supabase connection failed - using fallback storage',
      error: (error as Error).message,
      database: 'Fallback (In-Memory)',
      hint: 'Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly'
    });
  }
}