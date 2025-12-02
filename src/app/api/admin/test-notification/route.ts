import { NextRequest, NextResponse } from 'next/server';
import encroachmentStore from '@/lib/encroachmentStore';
import notificationStore from '@/lib/notificationStore';
import jwt from 'jsonwebtoken';

function getTokenFromReq(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.substring(7);
  const url = new URL(req.url);
  return url.searchParams.get('token');
}

function verifyToken(token?: string) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Admin-only test endpoint to create a fake submission + notification for debugging
  const token = getTokenFromReq(req);
  const user = verifyToken(token);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({} as any));
    const createSubmission = body.createSubmission !== false; // default true
    const userEmail = body.userEmail || 'reporter@example.com';
    const fileName = body.fileName || `test-${Date.now()}.png`;

    let submission = null;
    if (createSubmission) {
      submission = encroachmentStore.addSubmission({
        userEmail,
        fileName,
        fileData: '',
        fileType: 'image/png',
        status: 'pending',
        complaintDetails: { test: true },
      });
    }

    // Add notification for admin
    notificationStore.addSubmissionNotification(userEmail, fileName);

    return NextResponse.json({ success: true, data: { submission, notificationCount: notificationStore.getNotifications().length } });
  } catch (err) {
    console.error('Test notification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Admin-only: return current notifications snapshot
  const token = getTokenFromReq(req);
  const user = verifyToken(token);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notifications = notificationStore.getNotifications();
    return NextResponse.json({ success: true, data: { notifications } });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
