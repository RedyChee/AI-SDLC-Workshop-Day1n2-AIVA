import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';

/**
 * GET /api/tags
 * Get all tags for the authenticated user
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const tags = tagDB.getAll(session.userId);
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

/**
 * POST /api/tags
 * Create a new tag
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, color } = body;

    // Validate name
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Tag name cannot be empty' }, { status: 400 });
    }

    // Default color if not provided
    const tagColor = color || '#3B82F6';

    // Validate hex color format
    if (!/^#[0-9A-Fa-f]{6}$/.test(tagColor)) {
      return NextResponse.json({ error: 'Invalid color format. Use hex format like #3B82F6' }, { status: 400 });
    }

    // Check for duplicate tag name (case-sensitive)
    const existingTags = tagDB.getAll(session.userId);
    if (existingTags.some(t => t.name === name.trim())) {
      return NextResponse.json({ error: 'Tag name already exists' }, { status: 400 });
    }

    const tag = tagDB.create({
      user_id: session.userId,
      name: name.trim(),
      color: tagColor,
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
