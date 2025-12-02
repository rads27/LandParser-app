import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import notificationStore from '@/lib/notificationStore';

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

export async function GET(req: NextRequest) {
  // User notifications endpoint; requires JWT
  const token = getTokenFromReq(req);
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accept = req.headers.get('accept') || '';
  if (accept.includes('text/event-stream')) {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = (data: string) => {
      try { writer.write(encoder.encode(`data: ${data}\n\n`)); } catch (_) {}
    };

    // initial snapshot filtered by user
    try {
      const initial = notificationStore.getNotifications().filter(n => n.target === 'admin' || n.target === user.email);
      sendEvent(JSON.stringify({ type: 'initial', notifications: initial }));
    } catch (_) {}

    const unsubscribe = notificationStore.subscribe((list) => {
      try {
        const filtered = list.filter(n => n.target === 'admin' || n.target === user.email);
        sendEvent(JSON.stringify({ type: 'update', notifications: filtered }));
      } catch (_) {}
    });

    const pingInterval = setInterval(() => { try { writer.write(encoder.encode(': ping\n\n')); } catch (_) {} }, 20000);
    req.signal.addEventListener('abort', () => {
      clearInterval(pingInterval);
      try { unsubscribe(); } catch (_) {}
      try { writer.close(); } catch (_) {}
    });

    return new Response(readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }

  // JSON fallback: return notifications for this user
  try {
    const list = notificationStore.getNotifications().filter(n => n.target === 'admin' || n.target === user.email);
    const unread = list.filter(n => !n.read).length;
    return NextResponse.json({ success: true, data: { notifications: list, unreadCount: unread } });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Allow marking read/clear actions for authenticated user
  const token = getTokenFromReq(req);
  const user = verifyToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { action, notificationId } = await req.json();
    switch (action) {
      case 'markRead':
        if (notificationId) notificationStore.markAsRead(notificationId);
        break;
      case 'markAllRead':
        notificationStore.markAllAsRead();
        break;
      case 'clearAll':
        notificationStore.clearAll();
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
