import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NotificationItem } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const isPlaceholderUrl = (url?: string) =>
  !url || url.includes('your-project-id') || url.includes('placeholder');

// Resilient in-memory store for development & offline environments
let inMemoryNotifications: NotificationItem[] = [
  {
    id: 'notif-demo-1',
    recipient_id: '135a077d-43f4-4e02-a0b9-39d6480eb9f3',
    type: 'collaboration_invite',
    message: 'Dr. Elena Vance requested to collaborate on research topic: "Impact of AI on Healthcare Diagnostics".',
    related_research_id: 'a4a311b9-4284-4374-a856-f78217e022ea',
    read_status: false,
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'notif-demo-2',
    recipient_id: '135a077d-43f4-4e02-a0b9-39d6480eb9f3',
    type: 'collaboration_accepted',
    message: 'Marcus Chen accepted your partnership request on "Multi-Agent System Architectures & Consensus".',
    related_research_id: 'a4a311b9-4284-4374-a856-f78217e022ea',
    read_status: false,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || '135a077d-43f4-4e02-a0b9-39d6480eb9f3';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholderUrl(supabaseUrl)) {
      try {
        const { data: notifications, error } = await supabaseAdmin
          .from('notifications')
          .select('*')
          .eq('recipient_id', userId)
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && notifications) {
          const unreadCount = notifications.filter((n) => !n.read_status).length;
          return NextResponse.json({
            notifications,
            unreadCount,
          });
        }
      } catch (sbErr) {
        console.warn('Supabase notifications query fallback:', sbErr);
      }
    }

    // Fallback to in-memory store
    const userNotifs = inMemoryNotifications.filter(
      (n) => n.recipient_id === userId || !userId
    );
    const unreadCount = userNotifs.filter((n) => !n.read_status).length;

    return NextResponse.json({
      notifications: userNotifs,
      unreadCount,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error in GET notifications:', err);
    return NextResponse.json({ notifications: inMemoryNotifications, unreadCount: 1 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { notificationId, markAllRead, userId } = body;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isPlaceholderUrl(supabaseUrl)) {
      try {
        if (markAllRead && userId) {
          await supabaseAdmin
            .from('notifications')
            .update({ read_status: true })
            .eq('recipient_id', userId);
        } else if (notificationId) {
          await supabaseAdmin
            .from('notifications')
            .update({ read_status: true })
            .eq('id', notificationId);
        }
      } catch (sbErr) {
        console.warn('Supabase notifications update fallback:', sbErr);
      }
    }

    // Update in-memory store
    if (markAllRead) {
      inMemoryNotifications = inMemoryNotifications.map((n) => ({
        ...n,
        read_status: true,
      }));
    } else if (notificationId) {
      inMemoryNotifications = inMemoryNotifications.map((n) =>
        n.id === notificationId ? { ...n, read_status: true } : n
      );
    }

    return NextResponse.json({ success: true, message: 'Notification marked as read' });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error marking notifications as read:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { recipientId, type = 'collaboration_note', message, relatedResearchId } = body;

    if (!recipientId || !message) {
      return NextResponse.json({ error: 'recipientId and message are required' }, { status: 400 });
    }

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      recipient_id: recipientId,
      type,
      message,
      related_research_id: relatedResearchId || null,
      read_status: false,
      created_at: new Date().toISOString(),
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!isPlaceholderUrl(supabaseUrl)) {
      try {
        const { data: record, error } = await supabaseAdmin
          .from('notifications')
          .insert({
            recipient_id: recipientId,
            type,
            message,
            related_research_id: relatedResearchId || null,
            read_status: false,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (!error && record) {
          return NextResponse.json({ success: true, notification: record });
        }
      } catch (sbErr) {
        console.warn('Supabase notifications insert fallback:', sbErr);
      }
    }

    inMemoryNotifications.unshift(newNotif);
    return NextResponse.json({ success: true, notification: newNotif });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error creating notification:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
