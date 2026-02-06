import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, subtaskDB, calculateProgress, validateSubtaskTitle } from '@/lib/db';

/**
 * POST /api/todos/[id]/subtasks
 * Create a new subtask for a todo
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const todoId = parseInt(id, 10);

    // Verify todo exists and belongs to user
    const todo = todoDB.getById(todoId);
    if (!todo || todo.user_id !== session.userId) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const title = validateSubtaskTitle(body.title);
    
    if (!title) {
      return NextResponse.json(
        { error: 'Subtask title is required and must be non-empty' },
        { status: 400 }
      );
    }

    // Get next position for this todo
    const position = subtaskDB.getNextPosition(todoId);

    // Create subtask
    const subtask = subtaskDB.create({
      todo_id: todoId,
      title,
      position,
    });

    // Get all subtasks and calculate progress
    const subtasks = subtaskDB.getByTodoId(todoId);
    const progress = calculateProgress(subtasks);

    return NextResponse.json({ subtask, progress }, { status: 201 });
  } catch (error) {
    console.error('Error creating subtask:', error);
    return NextResponse.json(
      { error: 'Failed to create subtask' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/todos/[id]/subtasks
 * Get all subtasks for a todo
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
    const todoId = parseInt(id, 10);

    // Verify todo exists and belongs to user
    const todo = todoDB.getById(todoId);
    if (!todo || todo.user_id !== session.userId) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Get all subtasks
    const subtasks = subtaskDB.getByTodoId(todoId);
    const progress = calculateProgress(subtasks);

    return NextResponse.json({ subtasks, progress });
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subtasks' },
      { status: 500 }
    );
  }
}
