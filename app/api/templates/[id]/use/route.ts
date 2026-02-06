import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB, subtaskDB, calculateProgress } from '@/lib/db';

export async function POST(
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
    // Use template to create todo (includes subtasks)
    const todo = templateDB.use(templateId, session.userId);
    
    // Fetch subtasks and progress for response
    const subtasks = subtaskDB.getByTodoId(todo.id);
    const progress = calculateProgress(subtasks);
    
    return NextResponse.json({ 
      todo: { ...todo, subtasks, progress } 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Use template error:', error);
    
    if (error.message === 'Template not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to create todo from template' },
      { status: 500 }
    );
  }
}
