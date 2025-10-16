import { NextRequest, NextResponse } from 'next/server';
import notificationStore from '@/lib/notificationStore';

export async function GET() {
  try {
    const notifications = notificationStore.getNotifications();
    const unreadCount = notificationStore.getUnreadCount();

    console.log('Notifications API: Total notifications:', notifications.length);
    console.log('Notifications API: Unread count:', unreadCount);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, notificationId } = await request.json();

    switch (action) {
      case 'markRead':
        if (notificationId) {
          notificationStore.markAsRead(notificationId);
        }
        break;
      case 'markAllRead':
        notificationStore.markAllAsRead();
        break;
      case 'clearAll':
        notificationStore.clearAll();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Action completed successfully'
    });
  } catch (error) {
    console.error('Notification action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}