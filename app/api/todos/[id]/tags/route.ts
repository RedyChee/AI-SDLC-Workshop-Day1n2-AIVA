import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, todoTagDB } from '@/lib/db';

/**
 * POST /api/todos/[id]/tags
 * Replace all tag associations for a todo
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
    const { tagIds } = body;

    // Verify todo belongs to user
    const todo = todoDB.getById(todoId, session.userId);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    // Validate tagIds is an array
    if (!Array.isArray(tagIds)) {
      return NextResponse.json({ error: 'tagIds must be an array' }, { status: 400 });
    }

    // Replace all tag associations
    todoTagDB.removeAllForTodo(todoId);
    tagIds.forEach((tagId: number) => {
      todoTagDB.add(todoId, tagId);
    });

    // Return updated tags
    const tags = todoTagDB.getTagsForTodo(todoId);
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error setting todo tags:', error);
    return NextResponse.json({ error: 'Failed to set tags' }, { status: 500 });
  }
}
