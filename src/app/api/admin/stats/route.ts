import { NextRequest, NextResponse } from 'next/server';
import encroachmentStore from '@/lib/encroachmentStore';

export async function GET() {
  try {
    const todayStats = encroachmentStore.getStatsForToday();
    const monthStats = encroachmentStore.getStatsForMonth();
    const pendingCount = encroachmentStore.getPendingSubmissions().length;
    const allSubmissions = encroachmentStore.getAllSubmissions();
    
    // Calculate accuracy rate (approved / total processed)
    const processedSubmissions = allSubmissions.filter(sub => sub.status !== 'pending');
    const approvedSubmissions = allSubmissions.filter(sub => sub.status === 'approved');
    const accuracyRate = processedSubmissions.length > 0 
      ? Math.round((approvedSubmissions.length / processedSubmissions.length) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        pending: pendingCount,
        processedToday: todayStats.processed,
        totalThisMonth: monthStats.submitted,
        accuracyRate
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}