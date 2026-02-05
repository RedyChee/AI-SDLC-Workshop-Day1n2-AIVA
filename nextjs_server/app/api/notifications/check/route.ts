import { NextResponse } from 'next/server'
import { getSingaporeNow } from '@/lib/timezone'
import { reminderDB } from '@/lib/db'

export async function GET() {
  try {
    const now = getSingaporeNow()
    const due = await reminderDB.getDueReminders(now)

    const payload = due.map(({ reminder, todo }) => {
      reminderDB.markSent(reminder.id, now.toISOString())
      return {
        id: reminder.id,
        title: todo.title,
        due_date: todo.due_date || '',
        minutes_before: reminder.reminder_minutes,
      }
    })

    return NextResponse.json({
      success: true,
      data: payload,
    })
  } catch (error) {
    console.error('GET /api/notifications/check error:', error)
    return NextResponse.json({ error: 'Failed to check reminders' }, { status: 500 })
  }
}


