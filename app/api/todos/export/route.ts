import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, subtaskDB, todoTagDB } from '@/lib/db';
import { getSingaporeNow, toSingaporeISO } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Get export format from query params (json or csv)
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Get all user's todos
    const todos = todoDB.getAllByUser(session.userId);

    // Get subtasks and tags for each todo
    const todosWithData = todos.map(todo => {
      const subtasks = subtaskDB.getByTodoId(todo.id);
      const tags = todoTagDB.getTagsByTodo(todo.id);
      
      return {
        id: todo.id,
        title: todo.title,
        completed: todo.completed ? 1 : 0,
        due_date: todo.due_date,
        priority: todo.priority,
        recurrence_enabled: todo.recurrence_pattern ? 1 : 0,
        recurrence_pattern: todo.recurrence_pattern,
        reminder_minutes: todo.reminder_minutes,
        created_at: todo.created_at,
        subtasks: subtasks.map(st => ({
          id: st.id,
          todo_id: st.todo_id,
          title: st.title,
          completed: st.completed ? 1 : 0,
          position: st.position
        })),
        tags: tags.map(t => ({
          id: t.id,
          name: t.name,
          color: t.color
        }))
      };
    });

    if (format === 'csv') {
      // Generate CSV format
      const csvRows: string[] = [];
      
      // Header row
      csvRows.push([
        'ID',
        'Title',
        'Completed',
        'Due Date',
        'Priority',
        'Recurring',
        'Pattern',
        'Reminder',
        'Tags',
        'Subtasks',
        'Created At'
      ].join(','));

      // Data rows
      for (const todo of todosWithData) {
        const row = [
          todo.id,
          `"${todo.title.replace(/"/g, '""')}"`, // Escape quotes
          todo.completed ? 'true' : 'false',
          todo.due_date ? `"${todo.due_date}"` : '',
          todo.priority,
          todo.recurrence_enabled ? 'true' : 'false',
          todo.recurrence_pattern || '',
          todo.reminder_minutes || '',
          `"${todo.tags.map(t => t.name).join(', ')}"`,
          `"${todo.subtasks.map(st => st.title).join(', ')}"`,
          `"${todo.created_at}"`
        ];
        csvRows.push(row.join(','));
      }

      const csvContent = csvRows.join('\n');
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="todos-${getSingaporeNow().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // Generate JSON format
      const exportData = {
        version: '1.0',
        exportedAt: toSingaporeISO(getSingaporeNow()),
        totalTodos: todosWithData.length,
        todos: todosWithData
      };

      return NextResponse.json(exportData, {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="todos-${getSingaporeNow().toISOString().split('T')[0]}.json"`
        }
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export todos' },
      { status: 500 }
    );
  }
}
