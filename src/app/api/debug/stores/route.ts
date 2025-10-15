import { NextResponse } from 'next/server';
import encroachmentStore from '@/lib/encroachmentStore';
import notificationStore from '@/lib/notificationStore';

export async function GET() {
  try {
    const allSubmissions = await encroachmentStore.getAllSubmissions();
    const pendingSubmissions = await encroachmentStore.getPendingSubmissions();
    const notifications = await notificationStore.getNotifications();
    const unreadCount = await notificationStore.getUnreadCount();

    console.log('DEBUG API: All submissions:', allSubmissions.length);
    console.log('DEBUG API: Pending submissions:', pendingSubmissions.length);
    console.log('DEBUG API: All notifications:', notifications.length);
    console.log('DEBUG API: Unread notifications:', unreadCount);

    return NextResponse.json({
      success: true,
      data: {
        totalSubmissions: allSubmissions.length,
        pendingSubmissions: pendingSubmissions.length,
        totalNotifications: notifications.length,
        unreadNotifications: unreadCount,
        submissions: allSubmissions.map(s => ({ 
          id: s.id, 
          userEmail: s.userEmail, 
          status: s.status, 
          fileName: s.fileName 
        })),
        notifications: notifications.map(n => ({ 
          id: n.id, 
          message: n.message, 
          read: n.read,
          timestamp: n.timestamp
        }))
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}