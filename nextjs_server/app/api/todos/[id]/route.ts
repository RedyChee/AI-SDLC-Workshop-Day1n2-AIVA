import { NextResponse, NextRequest } from 'next/server'
import { UpdateTodoSchema } from '@/lib/validation'
import { setReminderForTodo, tagDB, todoDB } from '@/lib/db'
import { formatSingaporeDate, getSingaporeNow } from '@/lib/timezone'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const todo = await todoDB.getById(id)

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: todo,
    })
  } catch (error) {
    console.error('GET /api/todos/[id] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleUpdate(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = UpdateTodoSchema.parse(body)

    const todo = await todoDB.getById(id)
    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    const today = formatSingaporeDate(getSingaporeNow())
    const nextDueDate =
      validated.due_date === undefined
        ? todo.due_date
        : validated.due_date === null
          ? null
          : validated.due_date

    if (nextDueDate && nextDueDate < today) {
      return NextResponse.json({ error: 'Due date must be in the future' }, { status: 400 })
    }

    if (validated.is_recurring && !nextDueDate) {
      return NextResponse.json({ error: 'Recurring todos require a due date' }, { status: 400 })
    }

    if (validated.reminder_minutes && !nextDueDate) {
      return NextResponse.json({ error: 'Reminders require a due date' }, { status: 400 })
    }

    const tags = validated.tag_ids
      ? (await Promise.all(validated.tag_ids.map(id => tagDB.getById(id)))).filter(Boolean)
      : todo.tags

    const reminders =
      validated.reminder_minutes === undefined
        ? todo.reminders
        : await setReminderForTodo(id, validated.reminder_minutes === null ? null : validated.reminder_minutes)

    const updated = await todoDB.update(id, {
      title: validated.title ?? todo.title,
      description: validated.description ?? todo.description,
      priority: validated.priority ?? todo.priority,
      due_date: nextDueDate === null ? (null as any) : nextDueDate,
      is_completed: validated.is_completed ?? todo.is_completed,
      is_recurring: validated.is_recurring ?? todo.is_recurring,
      recurrence_pattern: validated.recurrence_pattern ?? todo.recurrence_pattern,
      recurrence_end_date: validated.recurrence_end_date ?? todo.recurrence_end_date,
      subtasks: todo.subtasks,
      tags: tags as any,
      reminders: reminders as any,
    } as any)

    // Handle recurring todo auto-creation
    if (
      validated.is_completed === true &&
      todo.is_recurring &&
      todo.recurrence_pattern &&
      todo.due_date
    ) {
      todoDB.createNextRecurring(updated)
    }

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('PUT /api/todos/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 400 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, context)
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, context)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const todo = await todoDB.getById(id)
    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    todoDB.delete(id)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('DELETE /api/todos/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    )
  }
}
