import { NextRequest, NextResponse } from 'next/server';
import encroachmentStore from '@/lib/encroachmentStore';
import * as db from '@/lib/database';
import { shouldUseDatabase } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Get user submissions (database or in-memory)
    let submissions;
    const useDB = shouldUseDatabase();
    
    try {
      if (useDB) {
        submissions = await db.getUserSubmissions(userEmail);
      } else {
        submissions = encroachmentStore.getUserSubmissions(userEmail);
      }
    } catch (dbError) {
      console.error('Database error, falling back to in-memory:', dbError);
      submissions = encroachmentStore.getUserSubmissions(userEmail);
    }

    // Calculate user-specific statistics
    const stats = {
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      approved: submissions.filter(s => s.status === 'approved').length,
      rejected: submissions.filter(s => s.status === 'rejected').length,
    };

    return NextResponse.json({
      success: true,
      data: stats,
      storage: useDB ? 'database' : 'memory'
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
