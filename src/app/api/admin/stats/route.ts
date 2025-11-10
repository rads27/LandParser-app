import { NextRequest, NextResponse } from 'next/server';
import encroachmentStore from '@/lib/encroachmentStore';
import * as db from '@/lib/database';
import { shouldUseDatabase } from '@/lib/config';

export async function GET() {
  try {
    const useDB = shouldUseDatabase();
    
    let todayStats, monthStats, pendingCount, accuracyRate;
    
    try {
      if (useDB) {
        // Use database
        todayStats = await db.getStatsForToday();
        monthStats = await db.getStatsForMonth();
        const pendingSubmissions = await db.getPendingSubmissions();
        pendingCount = pendingSubmissions.length;
        accuracyRate = await db.getAccuracyRate();
      } else {
        // Use in-memory store
        todayStats = encroachmentStore.getStatsForToday();
        monthStats = encroachmentStore.getStatsForMonth();
        pendingCount = encroachmentStore.getPendingSubmissions().length;
        
        const allSubmissions = encroachmentStore.getAllSubmissions();
        const processedSubmissions = allSubmissions.filter(sub => sub.status !== 'pending');
        const approvedSubmissions = allSubmissions.filter(sub => sub.status === 'approved');
        accuracyRate = processedSubmissions.length > 0 
          ? Math.round((approvedSubmissions.length / processedSubmissions.length) * 100)
          : 0;
      }
    } catch (dbError) {
      console.error('Database error, falling back to in-memory:', dbError);
      // Fallback to in-memory
      todayStats = encroachmentStore.getStatsForToday();
      monthStats = encroachmentStore.getStatsForMonth();
      pendingCount = encroachmentStore.getPendingSubmissions().length;
      
      const allSubmissions = encroachmentStore.getAllSubmissions();
      const processedSubmissions = allSubmissions.filter(sub => sub.status !== 'pending');
      const approvedSubmissions = allSubmissions.filter(sub => sub.status === 'approved');
      accuracyRate = processedSubmissions.length > 0 
        ? Math.round((approvedSubmissions.length / processedSubmissions.length) * 100)
        : 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        pending: pendingCount,
        processedToday: todayStats.processed,
        totalThisMonth: monthStats.submitted,
        accuracyRate
      },
      storage: useDB ? 'database' : 'memory'
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}