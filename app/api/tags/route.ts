import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';

// GET /api/tags - Get all tags for current user
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const tags = tagDB.getAllByUser(session.userId);
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

// POST /api/tags - Create new tag
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, color } = body;

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    if (name.length === 0 || name.length > 50) {
      return NextResponse.json({ error: 'Tag name must be 1-50 characters' }, { status: 400 });
    }

    // Check for duplicate tag names (case-insensitive)
    const existingTags = tagDB.getAllByUser(session.userId);
    const duplicate = existingTags.find(
      (tag) => tag.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json({ error: 'Tag name already exists' }, { status: 400 });
    }

    // Validate color format (hex color)
    const colorPattern = /^#[0-9A-F]{6}$/i;
    if (color && !colorPattern.test(color)) {
      return NextResponse.json({ error: 'Invalid color format. Use hex color (e.g., #3B82F6)' }, { status: 400 });
    }

    // Create tag
    const tag = tagDB.create({
      user_id: session.userId,
      name: name.trim(),
      color: color || '#3B82F6', // Default blue
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
