import { NextRequest, NextResponse } from 'next/server';
import encroachmentStore from '@/lib/encroachmentStore';
import notificationStore from '@/lib/notificationStore';
import jwt from 'jsonwebtoken';

// Helper function to get user from token
function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userEmail = formData.get('userEmail') as string;
    const complaintDetailsStr = formData.get('complaintDetails') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Parse complaint details
    let complaintDetails = {};
    if (complaintDetailsStr) {
      try {
        complaintDetails = JSON.parse(complaintDetailsStr);
      } catch (error) {
        console.error('Error parsing complaint details:', error);
      }
    }

    // Convert file to base64 for storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileData = buffer.toString('base64');

    // Store the submission
    const submission = encroachmentStore.addSubmission({
      userEmail,
      fileName: file.name,
      fileData,
      fileType: file.type,
      status: 'pending',
      complaintDetails,
    });

    console.log('Encroachment API: New submission created:', { id: submission.id, userEmail, fileName: file.name, status: submission.status });
    console.log('Encroachment API: Total submissions now:', encroachmentStore.getAllSubmissions().length);

    // Add notification for admin
    notificationStore.addSubmissionNotification(userEmail, file.name);
    console.log('Encroachment API: Notification added for admin');

    return NextResponse.json({
      success: true,
      message: 'File submitted for review successfully',
      submissionId: submission.id
    });
  } catch (error) {
    console.error('Encroachment submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const submissions = encroachmentStore.getUserSubmissions(userEmail);
    
    // Format submissions for frontend
    const formattedSubmissions = submissions.map(sub => ({
      id: sub.id,
      fileName: sub.fileName,
      status: sub.status === 'approved' ? 'Approved' : 
              sub.status === 'rejected' ? 'Rejected' : 'Pending',
      submittedAt: sub.submittedAt,
      processedAt: sub.processedAt
    }));

    return NextResponse.json({
      success: true,
      data: formattedSubmissions
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}