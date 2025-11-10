import { NextRequest, NextResponse } from 'next/server';
import encroachmentStore from '@/lib/encroachmentStore';
import * as db from '@/lib/database';
import { shouldUseDatabase } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending' or 'processed'
    
    // Get requests (database or in-memory)
    let allRequests;
    const useDB = shouldUseDatabase();
    
    try {
      if (useDB) {
        if (status === 'processed') {
          // Get all processed submissions (approved or rejected)
          allRequests = await db.getProcessedSubmissions();
        } else {
          // Get pending submissions (default)
          allRequests = await db.getPendingSubmissions();
        }
      } else {
        if (status === 'processed') {
          allRequests = encroachmentStore.getProcessedSubmissions();
        } else {
          allRequests = encroachmentStore.getPendingSubmissions();
        }
      }
    } catch (dbError) {
      console.error('Database error, falling back to in-memory:', dbError);
      if (status === 'processed') {
        allRequests = encroachmentStore.getProcessedSubmissions();
      } else {
        allRequests = encroachmentStore.getPendingSubmissions();
      }
    }
    
    console.log(`Admin API: ${status === 'processed' ? 'Processed' : 'Pending'} requests count:`, allRequests.length);
    console.log('Admin API: Storage:', useDB ? 'database' : 'memory');
    console.log('Admin API: Requests:', allRequests.map(r => ({ id: r.id, userEmail: r.userEmail, status: r.status })));
    
    // Format for admin dashboard
    const formattedRequests = allRequests.map(req => ({
      id: req.id,
      userEmail: req.userEmail,
      fileName: req.fileName,
      imageUrl: `data:${req.fileType};base64,${req.fileData}`,
      status: req.status,
      submittedAt: req.submittedAt,
      processedAt: req.processedAt,
      adminNotes: req.adminNotes,
      complaintDetails: req.complaintDetails
    }));

    return NextResponse.json({
      success: true,
      data: formattedRequests,
      storage: shouldUseDatabase() ? 'database' : 'memory'
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

    // Convert action to proper status format for database
    // 'approve' -> 'approved', 'reject' -> 'rejected'
    const status = action === 'approve' ? 'approved' : 'rejected';

    // Update submission status (database or in-memory)
    let updatedSubmission;
    const useDB = shouldUseDatabase();
    
    try {
      if (useDB) {
        updatedSubmission = await db.updateSubmissionStatus(requestId, status, notes);
      } else {
        updatedSubmission = encroachmentStore.updateSubmissionStatus(requestId, action, notes);
      }
    } catch (dbError) {
      console.error('Database error, falling back to in-memory:', dbError);
      updatedSubmission = encroachmentStore.updateSubmissionStatus(requestId, action, notes);
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
      data: updatedSubmission,
      storage: useDB ? 'database' : 'memory'
    });
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}