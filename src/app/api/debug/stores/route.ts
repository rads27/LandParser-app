import { NextResponse } from 'next/server';
import encroachmentStore from '@/lib/encroachmentStore';
import notificationStore from '@/lib/notificationStore';

export async function GET() {
  try {
    const submissions = encroachmentStore.getAllSubmissions();
    const notifications = notificationStore.getNotifications();
    
    return NextResponse.json({
      success: true,
      data: {
        submissions: {
          total: submissions.length,
          pending: submissions.filter(s => s.status === 'pending').length,
          approved: submissions.filter(s => s.status === 'approved').length,
          rejected: submissions.filter(s => s.status === 'rejected').length,
          items: submissions
        },
        notifications: {
          total: notifications.length,
          unread: notificationStore.getUnreadCount(),
          items: notifications
        }
      }
    });
  } catch (error) {
    console.error('Debug stores error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
