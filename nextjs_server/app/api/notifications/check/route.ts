import { NextResponse } from 'next/server'
import { getSingaporeNow } from '@/lib/timezone'
import { reminderDB } from '@/lib/db'

export async function GET() {
  try {
    const now = getSingaporeNow()
    const due = await reminderDB.getDueReminders(now) as any[]

    const payload = due.map((item: any) => {
      reminderDB.markSent(item.id, now.toISOString())
      return {
        id: item.id,
        title: item.title,
        due_date: item.due_date || '',
        minutes_before: item.reminder_minutes,
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


