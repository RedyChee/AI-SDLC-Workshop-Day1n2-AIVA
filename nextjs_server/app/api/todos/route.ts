import { NextResponse, NextRequest } from 'next/server'
import { CreateTodoSchema } from '@/lib/validation'
import { todoDB } from '@/lib/db'
import { formatSingaporeDate, getSingaporeNow } from '@/lib/timezone'

export async function GET() {
  try {
    const todos = await todoDB.getAll('user-1')
    return NextResponse.json({
      success: true,
      data: todos,
    })
  } catch (error) {
    console.error('GET /api/todos error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('POST /api/todos body:', body)
    
    const validated = CreateTodoSchema.parse(body)
    console.log('POST /api/todos validated:', validated)

    // Allow due dates from today onwards (not past dates)
    const today = formatSingaporeDate(getSingaporeNow())
    if (validated.due_date && validated.due_date < today) {
      return NextResponse.json({ error: 'Due date cannot be in the past' }, { status: 400 })
    }
    if (validated.is_recurring && !validated.due_date) {
      return NextResponse.json({ error: 'Recurring todos require a due date' }, { status: 400 })
    }
    if (validated.reminder_minutes && !validated.due_date) {
      return NextResponse.json({ error: 'Reminders require a due date' }, { status: 400 })
    }

    const todo = await todoDB.create({
      title: validated.title,
      description: validated.description,
      priority: validated.priority,
      due_date: validated.due_date,
      is_recurring: validated.is_recurring,
      recurrence_pattern: validated.recurrence_pattern,
      tag_ids: validated.tag_ids,
      reminder_minutes: validated.reminder_minutes,
    })

    return NextResponse.json(
      { success: true, data: todo },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/todos error:', error)
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Failed to create todo'
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    )
  }
}
