import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';

/**
 * GET /api/notifications/check
 * Check for pending notifications and mark them as sent
 * This endpoint is polled by the frontend every minute
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Get pending notifications (reminders that should be sent)
    const notifications = todoDB.getPendingNotifications(session.userId);

    // Mark each as sent to prevent duplicates
    notifications.forEach(notification => {
      todoDB.markNotificationSent(notification.id, session.userId);
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Notification check error:', error);
    return NextResponse.json(
      { error: 'Failed to check notifications' },
      { status: 500 }
    );
  }
}
