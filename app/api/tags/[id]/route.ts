import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';

/**
 * PUT /api/tags/[id]
 * Update a tag's name and/or color
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await context.params;
  const tagId = parseInt(id, 10);

  try {
    const body = await request.json();
    const { name, color } = body;

    // Verify tag belongs to user
    const existingTag = tagDB.getById(tagId, session.userId);
    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    const updates: any = {};

    // Validate name if provided
    if (name !== undefined) {
      if (name.trim().length === 0) {
        return NextResponse.json({ error: 'Tag name cannot be empty' }, { status: 400 });
      }

      // Check for duplicate tag name (excluding current tag)
      const existingTags = tagDB.getAll(session.userId);
      if (existingTags.some(t => t.id !== tagId && t.name === name.trim())) {
        return NextResponse.json({ error: 'Tag name already exists' }, { status: 400 });
      }

      updates.name = name.trim();
    }

    // Validate color if provided
    if (color !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return NextResponse.json({ error: 'Invalid color format. Use hex format like #3B82F6' }, { status: 400 });
      }
      updates.color = color;
    }

    const updatedTag = tagDB.update(tagId, session.userId, updates);
    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

/**
 * DELETE /api/tags/[id]
 * Delete a tag (CASCADE removes all todo_tags associations)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await context.params;
  const tagId = parseInt(id, 10);

  try {
    // Verify tag belongs to user
    const existingTag = tagDB.getById(tagId, session.userId);
    if (!existingTag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    tagDB.delete(tagId, session.userId);
    return NextResponse.json({ message: 'Tag deleted' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
