import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, subtaskDB, calculateProgress, validateSubtaskTitle } from '@/lib/db';

/**
 * PUT /api/todos/[id]/subtasks/[subtaskId]
 * Update a subtask (toggle completion or edit title)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id, subtaskId } = await params;
    const todoId = parseInt(id, 10);
    const subtaskIdNum = parseInt(subtaskId, 10);

    // Verify todo exists and belongs to user
    const todo = todoDB.getById(todoId);
    if (!todo || todo.user_id !== session.userId) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Verify subtask exists and belongs to this todo
    const subtask = subtaskDB.getById(subtaskIdNum);
    if (!subtask || subtask.todo_id !== todoId) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const updateData: { title?: string; completed?: boolean } = {};

    // Validate title if provided
    if (body.title !== undefined) {
      const title = validateSubtaskTitle(body.title);
      if (!title) {
        return NextResponse.json(
          { error: 'Subtask title must be non-empty' },
          { status: 400 }
        );
      }
      updateData.title = title;
    }

    // Handle completed toggle
    if (body.completed !== undefined) {
      updateData.completed = Boolean(body.completed);
    }

    // Update subtask
    const updated = subtaskDB.update(subtaskIdNum, updateData);

    // Get all subtasks and calculate progress
    const subtasks = subtaskDB.getByTodoId(todoId);
    const progress = calculateProgress(subtasks);

    return NextResponse.json({ subtask: updated, progress });
  } catch (error) {
    console.error('Error updating subtask:', error);
    return NextResponse.json(
      { error: 'Failed to update subtask' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/todos/[id]/subtasks/[subtaskId]
 * Delete a subtask
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id, subtaskId } = await params;
    const todoId = parseInt(id, 10);
    const subtaskIdNum = parseInt(subtaskId, 10);

    // Verify todo exists and belongs to user
    const todo = todoDB.getById(todoId);
    if (!todo || todo.user_id !== session.userId) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Verify subtask exists and belongs to this todo
    const subtask = subtaskDB.getById(subtaskIdNum);
    if (!subtask || subtask.todo_id !== todoId) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    // Delete subtask
    subtaskDB.delete(subtaskIdNum);

    // Get remaining subtasks and calculate progress
    const subtasks = subtaskDB.getByTodoId(todoId);
    const progress = calculateProgress(subtasks);

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    return NextResponse.json(
      { error: 'Failed to delete subtask' },
      { status: 500 }
    );
  }
}
