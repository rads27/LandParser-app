import { NextRequest, NextResponse } from 'next/server';
import encroachmentStore from '@/lib/encroachmentStore';

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

    // Get user-specific stats
    const userSubmissions = await encroachmentStore.getUserSubmissions(userEmail);
    const pendingSubmissions = userSubmissions.filter(sub => sub.status === 'pending');
    const approvedSubmissions = userSubmissions.filter(sub => sub.status === 'approved');
    const rejectedSubmissions = userSubmissions.filter(sub => sub.status === 'rejected');

    // Calculate user-specific metrics
    const totalSubmissions = userSubmissions.length;
    const pendingCount = pendingSubmissions.length;
    const processedCount = approvedSubmissions.length + rejectedSubmissions.length;
    const approvalRate = processedCount > 0 
      ? Math.round((approvedSubmissions.length / processedCount) * 100)
      : 0;

    // Calculate estimated value based on submissions (example calculation)
    const estimatedValue = totalSubmissions * 20000000; // 2Cr per submission as example

    return NextResponse.json({
      success: true,
      data: {
        totalSubmissions,
        pendingCount,
        approvedCount: approvedSubmissions.length,
        rejectedCount: rejectedSubmissions.length,
        approvalRate,
        estimatedValue
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}