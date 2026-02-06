import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    const template = templateDB.create({
      user_id: session.userId,
      name: body.name,
      description: body.description,
      category: body.category,
      title_template: body.title_template,
      priority: body.priority,
      recurrence_enabled: body.recurrence_enabled,
      recurrence_pattern: body.recurrence_pattern,
      reminder_minutes: body.reminder_minutes,
      due_offset_days: body.due_offset_days,
      subtasks: body.subtasks,
    });
    
    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error('Create template error:', error);
    
    if (error.message === 'Template name already exists') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const templates = templateDB.getAllWithSubtasks(session.userId);
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
