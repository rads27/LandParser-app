import { NextRequest, NextResponse } from 'next/server';
import supabaseEncroachmentStore from '@/lib/supabaseStore';
import fallbackStorage from '@/lib/fallbackStorage';

export async function GET() {
  try {
    let pendingRequests;
    try {
      pendingRequests = await supabaseEncroachmentStore.getPendingSubmissions();
    } catch (error) {
      console.log('Admin API: Supabase failed, using fallback storage');
      pendingRequests = await fallbackStorage.getPendingSubmissions();
    }
    console.log('Admin API: Pending requests count:', pendingRequests.length);
    console.log('Admin API: Requests:', pendingRequests.map((r: any) => ({ id: r.id, userEmail: r.userEmail, status: r.status })));
    
    // Format for admin dashboard
    const formattedRequests = pendingRequests.map((req: any) => ({
      id: req.id,
      userEmail: req.userEmail,
      fileName: req.fileName,
      imageUrl: `data:${req.fileType};base64,${req.fileData}`,
      status: req.status,
      submittedAt: req.submittedAt,
      complaintDetails: req.complaintDetails
    }));

    return NextResponse.json({
      success: true,
      data: formattedRequests
    });
  } catch (error) {
    console.error('Get admin requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { requestId, action, notes } = await request.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    let updatedSubmission;
    try {
      updatedSubmission = await supabaseEncroachmentStore.updateSubmissionStatus(
        requestId, 
        action, 
        notes
      );
    } catch (error) {
      console.log('Admin API: Supabase failed, using fallback storage');
      updatedSubmission = await fallbackStorage.updateSubmissionStatus(
        requestId, 
        action, 
        notes
      );
    }

    if (!updatedSubmission) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Request ${action}d successfully`,
      data: updatedSubmission
    });
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}