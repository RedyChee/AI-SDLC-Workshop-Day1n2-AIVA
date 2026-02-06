import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB, Priority, RecurrencePattern } from '@/lib/db';

// GET /api/templates - Get all templates for user
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const templates = templateDB.getAll(session.userId);
  return NextResponse.json(templates);
}

// POST /api/templates - Create new template
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();

  // Validation
  if (!body.name || body.name.trim() === '') {
    return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
  }
  if (!body.title_template || body.title_template.trim() === '') {
    return NextResponse.json({ error: 'Title template is required' }, { status: 400 });
  }

  // Validate subtasks_json if provided
  if (body.subtasks_json) {
    try {
      const parsed = JSON.parse(body.subtasks_json);
      if (!Array.isArray(parsed)) {
        return NextResponse.json({ error: 'subtasks_json must be a JSON array' }, { status: 400 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid subtasks_json format' }, { status: 400 });
    }
  }

  const template = templateDB.create({
    user_id: session.userId,
    name: body.name,
    description: body.description || null,
    category: body.category || null,
    title_template: body.title_template,
    priority: body.priority || 'medium',
    is_recurring: body.is_recurring || false,
    recurrence_pattern: body.recurrence_pattern || null,
    reminder_minutes: body.reminder_minutes ?? null,
    subtasks_json: body.subtasks_json || null,
    due_date_offset_days: body.due_date_offset_days ?? null,
  });

  return NextResponse.json(template, { status: 201 });
}
