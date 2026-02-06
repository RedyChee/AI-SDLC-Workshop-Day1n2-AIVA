import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, subtaskDB } from '@/lib/db';

/**
 * GET /api/todos/[id]/subtasks
 * Get all subtasks for a todo
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await context.params;
  const todoId = parseInt(id, 10);

  try {
    // Verify todo belongs to user
    const todo = todoDB.getById(todoId, session.userId);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const subtasks = subtaskDB.getByTodoId(todoId);
    return NextResponse.json(subtasks);
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    return NextResponse.json({ error: 'Failed to fetch subtasks' }, { status: 500 });
  }
}

/**
 * POST /api/todos/[id]/subtasks
 * Create a new subtask
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await context.params;
  const todoId = parseInt(id, 10);

  try {
    const body = await request.json();
    const { title } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Subtask title cannot be empty' }, { status: 400 });
    }

    // Verify todo belongs to user
    const todo = todoDB.getById(todoId, session.userId);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Get max position for ordering
    const existingSubtasks = subtaskDB.getByTodoId(todoId);
    const maxPosition = existingSubtasks.length > 0
      ? Math.max(...existingSubtasks.map(s => s.position))
      : -1;

    const subtask = subtaskDB.create({
      todo_id: todoId,
      title: title.trim(),
      completed: false,
      position: maxPosition + 1,
    });

    return NextResponse.json(subtask, { status: 201 });
  } catch (error) {
    console.error('Error creating subtask:', error);
    return NextResponse.json({ error: 'Failed to create subtask' }, { status: 500 });
  }
}
