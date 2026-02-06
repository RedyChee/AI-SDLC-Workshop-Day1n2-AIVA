import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';

// GET /api/tags/[id] - Get specific tag
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
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 });
    }

    const tag = tagDB.getById(tagId);
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Verify ownership
    if (tag.user_id !== session.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error fetching tag:', error);
    return NextResponse.json({ error: 'Failed to fetch tag' }, { status: 500 });
  }
}

// PUT /api/tags/[id] - Update tag
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
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 });
    }

    const tag = tagDB.getById(tagId);
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Verify ownership
    if (tag.user_id !== session.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, color } = body;

    // Validation
    if (name !== undefined) {
      if (typeof name !== 'string' || name.length === 0 || name.length > 50) {
        return NextResponse.json({ error: 'Tag name must be 1-50 characters' }, { status: 400 });
      }

      // Check for duplicate tag names (case-insensitive), excluding current tag
      const existingTags = tagDB.getAllByUser(session.userId);
      const duplicate = existingTags.find(
        (t) => t.id !== tagId && t.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (duplicate) {
        return NextResponse.json({ error: 'Tag name already exists' }, { status: 400 });
      }
    }

    if (color !== undefined) {
      const colorPattern = /^#[0-9A-F]{6}$/i;
      if (!colorPattern.test(color)) {
        return NextResponse.json({ error: 'Invalid color format. Use hex color (e.g., #3B82F6)' }, { status: 400 });
      }
    }

    // Update tag
    const updateData: { name?: string; color?: string } = {};
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color;

    const updatedTag = tagDB.update(tagId, updateData);

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

// DELETE /api/tags/[id] - Delete tag
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
    const tagId = parseInt(id, 10);

    if (isNaN(tagId)) {
      return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 });
    }

    const tag = tagDB.getById(tagId);
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Verify ownership
    if (tag.user_id !== session.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Delete tag (CASCADE will remove todo_tags relationships)
    tagDB.delete(tagId);

    return NextResponse.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
