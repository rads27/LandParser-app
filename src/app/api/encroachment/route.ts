import { NextRequest, NextResponse } from 'next/server';
import supabaseEncroachmentStore from '@/lib/supabaseStore';
import supabaseNotificationStore from '@/lib/supabaseNotificationStore';
import fallbackStorage from '@/lib/fallbackStorage';
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

    // Store the submission in database with fallback to in-memory storage
    console.log('Encroachment API: About to store submission...');
    let submission;
    let usingFallback = false;
    
    try {
      submission = await supabaseEncroachmentStore.addSubmission({
        userEmail,
        fileName: file.name,
        fileData,
        fileType: file.type,
        status: 'pending',
        complaintDetails,
      });
      console.log('Encroachment API: New submission created in Supabase:', { id: submission.id, userEmail, fileName: file.name });
    } catch (dbError) {
      console.error('Encroachment API: Supabase error, falling back to in-memory storage:', dbError);
      usingFallback = true;
      
      try {
        submission = await fallbackStorage.addSubmission({
          userEmail,
          fileName: file.name,
          fileData,
          fileType: file.type,
          status: 'pending',
          complaintDetails,
        });
        console.log('Encroachment API: New submission created in fallback storage:', { id: submission.id, userEmail, fileName: file.name });
      } catch (fallbackError) {
        console.error('Encroachment API: Both database and fallback failed:', fallbackError);
        return NextResponse.json(
          { error: 'Storage system failed. Please try again later.' },
          { status: 500 }
        );
      }
    }

    // Add notification for admin
    try {
      if (usingFallback) {
        await fallbackStorage.addSubmissionNotification(userEmail, file.name);
        console.log('Encroachment API: Notification added to fallback storage');
      } else {
        await supabaseNotificationStore.addSubmissionNotification(userEmail, file.name);
        console.log('Encroachment API: Notification added to Supabase');
      }
    } catch (notifError) {
      console.error('Encroachment API: Notification error:', notifError);
      // Don't fail the request if notification fails
    }

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

    let submissions;
    try {
      submissions = await supabaseEncroachmentStore.getUserSubmissions(userEmail);
    } catch (error) {
      console.log('Encroachment API GET: Supabase failed, using fallback storage');
      submissions = await fallbackStorage.getUserSubmissions(userEmail);
    }
    
    // Format submissions for frontend with full details
    const formattedSubmissions = submissions.map((sub: any) => ({
      id: sub.id,
      fileName: sub.fileName,
      status: sub.status === 'approved' ? 'Approved' : 
              sub.status === 'rejected' ? 'Rejected' : 'Pending',
      submittedAt: sub.submittedAt,
      processedAt: sub.processedAt,
      adminNotes: sub.adminNotes,
      complaintDetails: sub.complaintDetails,
      fileData: sub.fileData,
      fileType: sub.fileType
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