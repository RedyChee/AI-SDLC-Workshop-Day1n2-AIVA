import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, subtaskDB, todoTagDB } from '@/lib/db';
import { formatSingaporeDate, getSingaporeNow } from '@/lib/timezone';

// GET /api/todos/export - Export todos as JSON or CSV
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';

  const todos = todoDB.getAll(session.userId);

  // Enrich todos with subtasks and tags
  const enrichedTodos = todos.map((todo) => ({
    ...todo,
    subtasks: subtaskDB.getByTodoId(todo.id),
    tags: todoTagDB.getTagsForTodo(todo.id),
  }));

  if (format === 'csv') {
    // Generate CSV
    const csvHeader = 'ID,Title,Completed,Due Date,Priority,Recurring,Pattern,Reminder,Subtasks Count,Tags\n';
    const csvRows = enrichedTodos.map((todo) => {
      const tags = todo.tags.map((t) => t.name).join(';');
      return [
        todo.id,
        `"${todo.title.replace(/"/g, '""')}"`, // Escape quotes
        todo.completed,
        todo.due_date || '',
        todo.priority,
        todo.is_recurring,
        todo.recurrence_pattern || '',
        todo.reminder_minutes ?? '',
        todo.subtasks.length,
        `"${tags}"`,
      ].join(',');
    });

    const csv = csvHeader + csvRows.join('\n');
    const filename = `todos-${formatSingaporeDate(getSingaporeNow())}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  // Default: JSON format
  const filename = `todos-${formatSingaporeDate(getSingaporeNow())}.json`;
  return NextResponse.json(enrichedTodos, {
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
