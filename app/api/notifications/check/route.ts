import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';
import { getSingaporeNow } from '@/lib/timezone';

/**
 * GET /api/notifications/check
 * Check for pending notifications and return todos that should trigger notifications
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const now = getSingaporeNow().toJSDate();
    const todos = todoDB.getAll(session.userId);

    const pending = todos.filter(todo => {
      // Skip completed todos
      if (todo.completed) return false;
      
      // Must have due date and reminder set
      if (!todo.due_date || !todo.reminder_minutes) return false;
      
      // Skip if already sent
      if (todo.last_notification_sent) return false;

      // Calculate reminder trigger time
      const dueDate = new Date(todo.due_date);
      const reminderTime = new Date(dueDate.getTime() - todo.reminder_minutes * 60 * 1000);

      // Check if it's time to send notification
      return now >= reminderTime;
    });

    // Mark notifications as sent
    for (const todo of pending) {
      todoDB.update(todo.id, session.userId, {
        last_notification_sent: now.toISOString(),
      });
    }

    return NextResponse.json({ notifications: pending });
  } catch (error) {
    console.error('Error checking notifications:', error);
    return NextResponse.json({ error: 'Failed to check notifications' }, { status: 500 });
  }
}
