import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';
import { validateReminderMinutes } from '@/lib/types';
import { getSingaporeNow } from '@/lib/timezone';

/**
 * GET /api/todos
 * Fetch all todos for the authenticated user
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const todos = todoDB.getAllByUser(session.userId);
    return NextResponse.json({ todos }, { status: 200 });
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/todos
 * Create a new todo
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate title
    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
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
    if (body.recurrence_pattern && !body.due_date) {
      return NextResponse.json(
        { error: 'Recurring todos require a due date' },
        { status: 400 }
      );
    }

    // Validate and sanitize reminder
    const reminder_minutes = validateReminderMinutes(body.reminder_minutes);
    if (reminder_minutes && !body.due_date) {
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

    // Create todo
    const todo = todoDB.create({
      user_id: session.userId,
      title,
      priority: body.priority || 'medium',
      due_date: body.due_date || null,
      recurrence_pattern: body.recurrence_pattern || null,
      reminder_minutes,
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}
