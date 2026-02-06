import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, subtaskDB } from '@/lib/db';

/**
 * PUT /api/todos/[id]/subtasks/[subtaskId]
 * Update a subtask (toggle completion)
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id, subtaskId } = await context.params;
  const todoId = parseInt(id, 10);
  const subtaskIdNum = parseInt(subtaskId, 10);

  try {
    // Verify todo belongs to user
    const todo = todoDB.getById(todoId, session.userId);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    const body = await request.json();
    const { completed } = body;

    const updatedSubtask = subtaskDB.update(subtaskIdNum, { completed });

    return NextResponse.json(updatedSubtask);
  } catch (error) {
    console.error('Error updating subtask:', error);
    return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
  }
}

/**
 * DELETE /api/todos/[id]/subtasks/[subtaskId]
 * Delete a subtask
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id, subtaskId } = await context.params;
  const todoId = parseInt(id, 10);
  const subtaskIdNum = parseInt(subtaskId, 10);

  try {
    // Verify todo belongs to user
    const todo = todoDB.getById(todoId, session.userId);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    subtaskDB.delete(subtaskIdNum);

    return NextResponse.json({ message: 'Subtask deleted' });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
  }
}
