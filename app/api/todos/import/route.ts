import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, subtaskDB, tagDB, todoTagDB, Priority, RecurrencePattern } from '@/lib/db';

interface ImportTodo {
  title: string;
  completed?: number;
  due_date?: string | null;
  priority?: Priority;
  recurrence_enabled?: number;
  recurrence_pattern?: RecurrencePattern | null;
  reminder_minutes?: number | null;
  subtasks?: Array<{
    title: string;
    completed?: number;
    position: number;
  }>;
  tags?: Array<{
    name: string;
    color: string;
  }>;
}

interface ImportData {
  todos: ImportTodo[];
}

function validatePriority(priority: any): priority is Priority {
  return ['low', 'medium', 'high'].includes(priority);
}

function validateRecurrencePattern(pattern: any): pattern is RecurrencePattern {
  return ['daily', 'weekly', 'monthly', 'yearly'].includes(pattern);
}

function validateImportData(data: any): string | null {
  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return 'Invalid JSON format';
  }

  // Check if todos array exists
  if (!Array.isArray(data.todos)) {
    return 'No todos found in file';
  }

  // Validate each todo
  for (let i = 0; i < data.todos.length; i++) {
    const todo = data.todos[i];

    // Check required fields
    if (!todo.title || typeof todo.title !== 'string') {
      return `Missing or invalid required field: title (todo ${i + 1})`;
    }

    // Validate optional fields if present
    if (todo.priority !== undefined && !validatePriority(todo.priority)) {
      return `Invalid priority value. Must be: high, medium, or low (todo ${i + 1})`;
    }

    if (todo.completed !== undefined && ![0, 1].includes(todo.completed)) {
      return `Invalid completed value. Must be 0 or 1 (todo ${i + 1})`;
    }

    if (todo.recurrence_pattern !== undefined && todo.recurrence_pattern !== null) {
      if (!validateRecurrencePattern(todo.recurrence_pattern)) {
        return `Invalid recurrence pattern. Must be: daily, weekly, monthly, or yearly (todo ${i + 1})`;
      }
    }

    if (todo.reminder_minutes !== undefined && todo.reminder_minutes !== null) {
      if (typeof todo.reminder_minutes !== 'number' || todo.reminder_minutes < 0) {
        return `Invalid reminder_minutes value (todo ${i + 1})`;
      }
    }

    // Validate subtasks if present
    if (todo.subtasks !== undefined) {
      if (!Array.isArray(todo.subtasks)) {
        return `Subtasks must be an array (todo ${i + 1})`;
      }

      for (let j = 0; j < todo.subtasks.length; j++) {
        const subtask = todo.subtasks[j];
        if (!subtask.title || typeof subtask.title !== 'string') {
          return `Missing or invalid subtask title (todo ${i + 1}, subtask ${j + 1})`;
        }
        if (typeof subtask.position !== 'number') {
          return `Missing or invalid subtask position (todo ${i + 1}, subtask ${j + 1})`;
        }
      }
    }

    // Validate tags if present
    if (todo.tags !== undefined) {
      if (!Array.isArray(todo.tags)) {
        return `Tags must be an array (todo ${i + 1})`;
      }

      for (let j = 0; j < todo.tags.length; j++) {
        const tag = todo.tags[j];
        if (!tag.name || typeof tag.name !== 'string') {
          return `Missing or invalid tag name (todo ${i + 1}, tag ${j + 1})`;
        }
        if (!tag.color || typeof tag.color !== 'string') {
          return `Missing or invalid tag color (todo ${i + 1}, tag ${j + 1})`;
        }
      }
    }
  }

  return null; // Validation passed
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const data: ImportData = await request.json();

    // Validate import data
    const validationError = validateImportData(data);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    let importedCount = 0;

    // Process each todo
    for (const todoData of data.todos) {
      // Create todo with defaults for missing fields
      const newTodo = todoDB.create({
        user_id: session.userId,
        title: todoData.title,
        priority: todoData.priority || 'medium',
        due_date: todoData.due_date || null,
        recurrence_pattern: todoData.recurrence_pattern || null,
        reminder_minutes: todoData.reminder_minutes || null
      });

      // Update completion status if specified
      if (todoData.completed === 1) {
        todoDB.update(newTodo.id, { completed: true });
      }

      // Create subtasks if present
      if (todoData.subtasks && todoData.subtasks.length > 0) {
        for (const subtaskData of todoData.subtasks) {
          const newSubtask = subtaskDB.create({
            todo_id: newTodo.id,
            title: subtaskData.title,
            position: subtaskData.position
          });

          // Update completion status if specified
          if (subtaskData.completed === 1) {
            subtaskDB.update(newSubtask.id, { completed: true });
          }
        }
      }

      // Process tags if present
      if (todoData.tags && todoData.tags.length > 0) {
        for (const tagData of todoData.tags) {
          // Try to find existing tag by name (case-insensitive)
          let existingTag = tagDB.getAllByUser(session.userId).find(
            t => t.name.toLowerCase() === tagData.name.toLowerCase()
          );

          // Create tag if it doesn't exist
          if (!existingTag) {
            existingTag = tagDB.create({
              user_id: session.userId,
              name: tagData.name,
              color: tagData.color
            });
          }

          // Associate tag with todo
          todoTagDB.add(newTodo.id, existingTag.id);
        }
      }

      importedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedCount} todos`
    });
  } catch (error) {
    console.error('Import error:', error);
    
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to import todos' },
      { status: 500 }
    );
  }
}
