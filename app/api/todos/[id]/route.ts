import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, RecurrencePattern, subtaskDB, todoTagDB, calculateProgress } from '@/lib/db';
import { validateReminderMinutes } from '@/lib/types';
import { getSingaporeNow, addDays, addMonths, addYears } from '@/lib/timezone';

/**
 * GET /api/todos/[id]
 * Fetch a specific todo by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const todo = todoDB.getById(parseInt(id));

    if (!todo || todo.user_id !== session.userId) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json(todo, { status: 200 });
  } catch (error) {
    console.error('Error fetching todo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todo' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/todos/[id]
 * Update a specific todo
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Check if todo exists and belongs to user
    const todo = todoDB.getById(parseInt(id));
    if (!todo || todo.user_id !== session.userId) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Validate title if provided
    if (body.title !== undefined) {
      const title = body.title?.trim();
      if (!title) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
    }

    // Validate due date if provided
    if (body.due_date) {
      const dueDate = new Date(body.due_date);
      const now = getSingaporeNow();
      
      // Due date must be at least 1 minute in the future
      const minDate = new Date(now);
      minDate.setMinutes(minDate.getMinutes() + 1);
      
      if (dueDate <= minDate) {
        return NextResponse.json(
          { error: 'Due date must be at least 1 minute in the future' },
          { status: 400 }
        );
      }
    }

    // Validate recurrence pattern requires due date
    if (body.recurrence_pattern && !body.due_date && !todo.due_date) {
      return NextResponse.json(
        { error: 'Recurring todos require a due date' },
        { status: 400 }
      );
    }

    // Validate and sanitize reminder
    const reminder_minutes = body.reminder_minutes !== undefined 
      ? validateReminderMinutes(body.reminder_minutes)
      : undefined;
    
    if (reminder_minutes && !body.due_date && !todo.due_date) {
      return NextResponse.json(
        { error: 'Reminders require a due date' },
        { status: 400 }
      );
    }

    // Validate priority
    if (body.priority && !['low', 'medium', 'high'].includes(body.priority)) {
      return NextResponse.json(
        { error: 'Priority must be low, medium, or high' },
        { status: 400 }
      );
    }

    // Build update data object
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;
    if (body.completed !== undefined) updateData.completed = body.completed;
    if (body.recurrence_pattern !== undefined) updateData.recurrence_pattern = body.recurrence_pattern;
    
    // Handle reminder updates - reset last_notification_sent when reminder changes
    if (reminder_minutes !== undefined) {
      updateData.reminder_minutes = reminder_minutes;
      updateData.last_notification_sent = null; // Reset to allow new notification
    }
    
    // If removing due_date, also remove reminder
    if (body.due_date === null) {
      updateData.reminder_minutes = null;
      updateData.last_notification_sent = null;
    }

    // Handle recurring todo completion
    if (body.completed === true && !todo.completed && todo.recurrence_pattern && todo.due_date) {
      // Create next instance of recurring todo
      const currentDueDate = new Date(todo.due_date);
      let nextDueDate: Date;

      switch (todo.recurrence_pattern) {
        case 'daily':
          nextDueDate = addDays(currentDueDate, 1);
          break;
        case 'weekly':
          nextDueDate = addDays(currentDueDate, 7);
          break;
        case 'monthly':
          nextDueDate = addMonths(currentDueDate, 1);
          break;
        case 'yearly':
          nextDueDate = addYears(currentDueDate, 1);
          break;
        default:
          nextDueDate = currentDueDate;
      }

      // Create next instance with same metadata (including reminder)
      const nextTodo = todoDB.create({
        user_id: session.userId,
        title: todo.title,
        priority: todo.priority,
        due_date: nextDueDate.toISOString(),
        recurrence_pattern: todo.recurrence_pattern,
        reminder_minutes: todo.reminder_minutes ?? null,
      });
      
      // Copy tags to the next instance
      const currentTags = todoTagDB.getTagsByTodo(todo.id);
      for (const tag of currentTags) {
        todoTagDB.add(nextTodo.id, tag.id);
      }
    }

    // Update the current todo
    const updated = todoDB.update(parseInt(id), updateData);

    // Get subtasks, tags, and progress for the response
    const subtasks = subtaskDB.getByTodoId(updated.id);
    const tags = todoTagDB.getTagsByTodo(updated.id);
    const progress = calculateProgress(subtasks);

    return NextResponse.json({ ...updated, subtasks, tags, progress }, { status: 200 });
  } catch (error) {
    console.error('Error updating todo:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to update todo', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/todos/[id]
 * Delete a specific todo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const todo = todoDB.getById(parseInt(id));

    if (!todo || todo.user_id !== session.userId) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Delete will cascade to subtasks and remove tag associations
    todoDB.delete(parseInt(id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    );
  }
}
