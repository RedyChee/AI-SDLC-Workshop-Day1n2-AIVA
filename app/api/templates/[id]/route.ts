import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const { id } = await context.params;
  const templateId = parseInt(id, 10);
  
  try {
    const body = await request.json();
    
    const template = templateDB.update(templateId, session.userId, {
      name: body.name,
      description: body.description,
      category: body.category,
    });
    
    return NextResponse.json({ template });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Update template error:', error);
    
    if (err.message === 'Template not found') {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    
    if (err.message === 'Template name already exists') {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    
    return NextResponse.json(
      { error: err.message || 'Failed to update template' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const { id } = await context.params;
  const templateId = parseInt(id, 10);
  
  try {
    templateDB.delete(templateId, session.userId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Delete template error:', error);
    
    if (err.message === 'Template not found') {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
