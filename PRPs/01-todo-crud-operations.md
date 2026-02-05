# PRP-01: Todo CRUD Operations

## Feature Overview

This feature provides the foundational Create, Read, Update, Delete (CRUD) operations for todo items in the application. It enables users to manage their tasks with comprehensive metadata including title, due dates, priority levels, and completion status. All operations enforce Singapore timezone (`Asia/Singapore`) and include robust validation, error handling, and optimistic UI updates for a responsive user experience.

**Key Capabilities:**
- Create todos with title, priority, and optional due date
- Read/fetch todos organized by status (overdue, pending, completed)
- Update todo properties including title, priority, due date, and completion status
- Delete todos with cascade removal of related data (subtasks, tags)
- Singapore timezone enforcement for all date/time operations
- Client-side validation with server-side verification
- Optimistic UI updates for instant feedback

---

## User Stories

### Primary User Persona: Task Manager
> "As a busy professional, I need to quickly create, organize, and manage my daily tasks with priorities and deadlines, so I can stay productive and meet my commitments."

**User Story 1: Quick Task Creation**
```
As a user,
I want to create a todo with just a title,
So that I can quickly capture tasks without requiring additional metadata.
```

**User Story 2: Deadline Management**
```
As a user,
I want to set due dates for my todos,
So that I can track when tasks need to be completed.
```

**User Story 3: Priority Organization**
```
As a user,
I want to assign priority levels (High/Medium/Low) to my todos,
So that I can focus on what's most important.
```

**User Story 4: Task Completion**
```
As a user,
I want to mark todos as complete with a single click,
So that I can track my progress without interrupting my workflow.
```

**User Story 5: Task Modification**
```
As a user,
I want to edit todo details after creation,
So that I can update tasks as requirements change.
```

**User Story 6: Task Removal**
```
As a user,
I want to delete todos that are no longer relevant,
So that my task list stays clean and manageable.
```

---

## User Flow

### Flow 1: Creating a Todo (Basic)
```
1. User enters todo title in main input field
2. User selects priority from dropdown (defaults to "Medium")
3. User clicks "Add" button
4. System validates title (non-empty, trimmed)
5. System creates todo with Singapore timestamp
6. Todo appears instantly in "Pending" section
7. Input form clears for next entry
```

### Flow 2: Creating a Todo (With Due Date)
```
1. User enters todo title
2. User selects priority
3. User clicks date-time picker
4. User selects future date and time
5. System validates date is in future (Singapore timezone)
6. User clicks "Add" button
7. System creates todo with validated due date
8. Todo appears in appropriate section (Pending or Overdue)
9. Due date displays with color-coded urgency indicator
```

### Flow 3: Editing a Todo
```
1. User locates todo in any section
2. User clicks "Edit" button
3. Modal opens with current values pre-filled
4. User modifies desired fields (title, priority, due date)
5. User clicks "Update" button
6. System validates changes
7. Modal closes
8. Todo updates in place with new values
9. Todo moves to correct section if due date changed
```

### Flow 4: Completing a Todo
```
1. User locates incomplete todo
2. User clicks checkbox
3. Checkbox marks as checked
4. Todo animates/transitions to "Completed" section
5. Todo displays with strike-through or completion styling
```

### Flow 5: Uncompleting a Todo
```
1. User locates completed todo in "Completed" section
2. User clicks checked checkbox
3. Checkbox unchecks
4. Todo moves back to "Pending" or "Overdue" section based on due date
5. Normal styling restored
```

### Flow 6: Deleting a Todo
```
1. User locates todo in any section
2. User clicks "Delete" button
3. Todo immediately removed from UI (optimistic delete)
4. System deletes from database (CASCADE to subtasks, tags)
5. Success confirmation (optional)
```

---

## Technical Requirements

### Database Schema

#### Todos Table (`todos`)
```sql
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT 0,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  due_date TEXT,  -- ISO 8601 format in Singapore timezone
  recurrence_pattern TEXT CHECK(recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
  reminder_minutes INTEGER,
  last_notification_sent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_completed ON todos(completed);
```

**Field Specifications:**
- `id`: Auto-incrementing primary key
- `user_id`: Foreign key to users table
- `title`: Required, trimmed, non-empty string
- `completed`: Boolean flag (0 = incomplete, 1 = complete)
- `priority`: Enum ('low', 'medium', 'high'), defaults to 'medium'
- `due_date`: ISO 8601 string in Singapore timezone, nullable
- `recurrence_pattern`: Enum for recurring todos, nullable
- `reminder_minutes`: Minutes before due date to notify, nullable
- `last_notification_sent`: ISO 8601 timestamp, nullable
- `created_at`: Timestamp of creation (UTC stored, displayed as Singapore)
- `updated_at`: Timestamp of last update (UTC stored, displayed as Singapore)

### TypeScript Types

```typescript
// lib/db.ts
export type Priority = 'low' | 'medium' | 'high';
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoInput {
  title: string;
  priority?: Priority;
  due_date?: string | null;
  recurrence_pattern?: RecurrencePattern | null;
  reminder_minutes?: number | null;
}

export interface UpdateTodoInput {
  title?: string;
  priority?: Priority;
  due_date?: string | null;
  completed?: boolean;
  recurrence_pattern?: RecurrencePattern | null;
  reminder_minutes?: number | null;
}
```

### API Endpoints

#### 1. Create Todo: `POST /api/todos`

**Request Body:**
```typescript
{
  title: string;              // Required, trimmed, non-empty
  priority?: 'low' | 'medium' | 'high';  // Optional, defaults to 'medium'
  due_date?: string | null;   // Optional, ISO 8601 in Singapore timezone
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  reminder_minutes?: number | null;  // Optional (15, 30, 60, 120, 1440, 2880, 10080)
}
```

**Response (201 Created):**
```typescript
{
  id: number;
  user_id: number;
  title: string;
  completed: false;
  priority: Priority;
  due_date: string | null;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  last_notification_sent: null;
  created_at: string;
  updated_at: string;
}
```

**Validation Rules:**
- `title`: Must be non-empty after trimming
- `due_date`: If provided, must be at least 1 minute in the future (Singapore time)
- `priority`: Must be 'low', 'medium', or 'high'
- `recurrence_pattern`: If provided, `due_date` is required
- `reminder_minutes`: If provided, `due_date` is required

**Error Responses:**
```typescript
// 401 Unauthorized
{ error: 'Not authenticated' }

// 400 Bad Request
{ error: 'Title is required' }
{ error: 'Due date must be in the future' }
{ error: 'Recurring todos require a due date' }
{ error: 'Reminders require a due date' }
```

**Implementation Pattern:**
```typescript
// app/api/todos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';
import { getSingaporeNow } from '@/lib/timezone';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  
  // Validation
  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (body.due_date) {
    const dueDate = new Date(body.due_date);
    const now = getSingaporeNow();
    if (dueDate <= now) {
      return NextResponse.json({ error: 'Due date must be in the future' }, { status: 400 });
    }
  }

  if (body.recurrence_pattern && !body.due_date) {
    return NextResponse.json({ error: 'Recurring todos require a due date' }, { status: 400 });
  }

  if (body.reminder_minutes && !body.due_date) {
    return NextResponse.json({ error: 'Reminders require a due date' }, { status: 400 });
  }

  // Create todo (synchronous - better-sqlite3)
  const todo = todoDB.create({
    user_id: session.userId,
    title,
    priority: body.priority || 'medium',
    due_date: body.due_date || null,
    recurrence_pattern: body.recurrence_pattern || null,
    reminder_minutes: body.reminder_minutes || null,
  });

  return NextResponse.json(todo, { status: 201 });
}
```

#### 2. Get All Todos: `GET /api/todos`

**Response (200 OK):**
```typescript
{
  todos: Todo[];  // Array of all todos for authenticated user
}
```

**Sorting Order:**
1. Completed status (incomplete first)
2. Priority (high → medium → low)
3. Due date (earliest first, nulls last)
4. Created date (newest first)

**Implementation Pattern:**
```typescript
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const todos = todoDB.getAllByUser(session.userId);
  
  return NextResponse.json({ todos }, { status: 200 });
}
```

#### 3. Get Single Todo: `GET /api/todos/[id]`

**URL Parameters:**
- `id`: Todo ID (number)

**Response (200 OK):**
```typescript
{
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string;
}
```

**Error Responses:**
```typescript
// 404 Not Found
{ error: 'Todo not found' }
```

**Implementation Pattern:**
```typescript
// app/api/todos/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;  // params is async in Next.js 16
  const todo = todoDB.getById(parseInt(id));

  if (!todo || todo.user_id !== session.userId) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  return NextResponse.json(todo, { status: 200 });
}
```

#### 4. Update Todo: `PUT /api/todos/[id]`

**Request Body:**
```typescript
{
  title?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
  completed?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  reminder_minutes?: number | null;
}
```

**Response (200 OK):**
```typescript
{
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string;
}
```

**Validation Rules:**
- Same as create, plus:
- At least one field must be updated
- Cannot change `user_id` or `created_at`

**Special Behavior:**
- When `completed` changes from `false` to `true` on a recurring todo:
  - Create next instance with same metadata
  - Calculate next due date based on pattern
  - Clear `last_notification_sent` for new instance

**Implementation Pattern:**
```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const todo = todoDB.getById(parseInt(id));
  if (!todo || todo.user_id !== session.userId) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  // Validation (similar to POST)
  if (body.title !== undefined) {
    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
  }

  if (body.due_date) {
    const dueDate = new Date(body.due_date);
    const now = getSingaporeNow();
    if (dueDate <= now) {
      return NextResponse.json({ error: 'Due date must be in the future' }, { status: 400 });
    }
  }

  // Handle recurring todo completion
  if (body.completed === true && !todo.completed && todo.recurrence_pattern) {
    // Create next instance (see PRP-03 for full logic)
    createNextRecurringInstance(todo);
  }

  const updated = todoDB.update(parseInt(id), body);
  return NextResponse.json(updated, { status: 200 });
}
```

#### 5. Delete Todo: `DELETE /api/todos/[id]`

**Response (204 No Content):**
```
(Empty body)
```

**Cascade Behavior:**
- Deletes all subtasks (`ON DELETE CASCADE`)
- Removes all tag associations in `todo_tags` table
- Removes reminder settings
- Cannot be undone

**Error Responses:**
```typescript
// 404 Not Found
{ error: 'Todo not found' }
```

**Implementation Pattern:**
```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const todo = todoDB.getById(parseInt(id));

  if (!todo || todo.user_id !== session.userId) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  todoDB.delete(parseInt(id));
  return new NextResponse(null, { status: 204 });
}
```

### Database Interface (lib/db.ts)

```typescript
// Database CRUD operations (synchronous - better-sqlite3)
export const todoDB = {
  create: (data: {
    user_id: number;
    title: string;
    priority?: Priority;
    due_date?: string | null;
    recurrence_pattern?: RecurrencePattern | null;
    reminder_minutes?: number | null;
  }): Todo => {
    const stmt = db.prepare(`
      INSERT INTO todos (user_id, title, priority, due_date, recurrence_pattern, reminder_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      data.user_id,
      data.title,
      data.priority || 'medium',
      data.due_date || null,
      data.recurrence_pattern || null,
      data.reminder_minutes || null
    );

    return todoDB.getById(info.lastInsertRowid as number)!;
  },

  getById: (id: number): Todo | null => {
    const stmt = db.prepare('SELECT * FROM todos WHERE id = ?');
    return stmt.get(id) as Todo | null;
  },

  getAllByUser: (userId: number): Todo[] => {
    const stmt = db.prepare(`
      SELECT * FROM todos 
      WHERE user_id = ? 
      ORDER BY 
        completed ASC,
        CASE priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END ASC,
        due_date ASC NULLS LAST,
        created_at DESC
    `);
    return stmt.all(userId) as Todo[];
  },

  update: (id: number, data: UpdateTodoInput): Todo => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.priority !== undefined) {
      fields.push('priority = ?');
      values.push(data.priority);
    }
    if (data.due_date !== undefined) {
      fields.push('due_date = ?');
      values.push(data.due_date);
    }
    if (data.completed !== undefined) {
      fields.push('completed = ?');
      values.push(data.completed ? 1 : 0);
    }
    if (data.recurrence_pattern !== undefined) {
      fields.push('recurrence_pattern = ?');
      values.push(data.recurrence_pattern);
    }
    if (data.reminder_minutes !== undefined) {
      fields.push('reminder_minutes = ?');
      values.push(data.reminder_minutes);
    }

    fields.push('updated_at = datetime("now")');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE todos SET ${fields.join(', ')} WHERE id = ?
    `);
    stmt.run(...values);

    return todoDB.getById(id)!;
  },

  delete: (id: number): void => {
    const stmt = db.prepare('DELETE FROM todos WHERE id = ?');
    stmt.run(id);
  },
};
```

### Singapore Timezone Utilities (lib/timezone.ts)

```typescript
export const SINGAPORE_TIMEZONE = 'Asia/Singapore';

export function getSingaporeNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: SINGAPORE_TIMEZONE }));
}

export function formatSingaporeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', { 
    timeZone: SINGAPORE_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function isOverdue(dueDate: string): boolean {
  const now = getSingaporeNow();
  const due = new Date(dueDate);
  return due < now;
}

export function getMinimumDueDate(): string {
  const now = getSingaporeNow();
  now.setMinutes(now.getMinutes() + 1);
  return now.toISOString();
}
```

---

## UI Components

### Todo Form Component (app/page.tsx - Client Component)

```typescript
'use client';

import { useState } from 'react';
import { Priority } from '@/lib/db';
import { getMinimumDueDate } from '@/lib/timezone';

export default function TodoPage() {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          priority,
          due_date: dueDate || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to create todo');
        return;
      }

      const newTodo = await response.json();
      
      // Optimistic UI update
      setTodos(prev => [...prev, newTodo]);
      
      // Clear form
      setTitle('');
      setPriority('medium');
      setDueDate('');
    } catch (error) {
      console.error('Failed to create todo:', error);
      alert('Failed to create todo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full px-4 py-2 border rounded-lg"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-4">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="px-4 py-2 border rounded-lg"
          disabled={isSubmitting}
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          min={getMinimumDueDate().slice(0, 16)}
          className="px-4 py-2 border rounded-lg"
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Adding...' : 'Add'}
      </button>
    </form>
  );
}
```

### Todo List Component

```typescript
interface TodoItemProps {
  todo: Todo;
  onUpdate: (id: number, data: UpdateTodoInput) => void;
  onDelete: (id: number) => void;
}

function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleToggleComplete = async () => {
    // Optimistic update
    onUpdate(todo.id, { completed: !todo.completed });

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });

      if (!response.ok) {
        // Revert on failure
        onUpdate(todo.id, { completed: todo.completed });
        alert('Failed to update todo');
      }
    } catch (error) {
      onUpdate(todo.id, { completed: todo.completed });
      alert('Failed to update todo');
    }
  };

  const handleDelete = async () => {
    // Optimistic delete
    onDelete(todo.id);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Could implement undo functionality here
        alert('Failed to delete todo');
      }
    } catch (error) {
      alert('Failed to delete todo');
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggleComplete}
        className="w-5 h-5"
      />

      <div className="flex-1">
        <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : ''}`}>
          {todo.title}
        </h3>
        
        <div className="flex gap-2 mt-2">
          {/* Priority badge */}
          <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(todo.priority)}`}>
            {todo.priority.toUpperCase()}
          </span>

          {/* Due date */}
          {todo.due_date && (
            <span className={`text-sm ${getDueDateColor(todo.due_date, todo.completed)}`}>
              {formatDueDate(todo.due_date)}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => setIsEditing(true)}
        className="text-blue-600 hover:text-blue-800"
      >
        Edit
      </button>

      <button
        onClick={handleDelete}
        className="text-red-600 hover:text-red-800"
      >
        Delete
      </button>
    </div>
  );
}

function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-blue-100 text-blue-800';
  }
}

function getDueDateColor(dueDate: string, completed: boolean): string {
  if (completed) return 'text-gray-500';
  
  const now = getSingaporeNow();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) return 'text-red-600';  // Overdue
  if (diffHours < 1) return 'text-red-600';  // < 1 hour
  if (diffHours < 24) return 'text-orange-600';  // < 24 hours
  if (diffHours < 168) return 'text-yellow-600';  // < 7 days
  return 'text-blue-600';  // 7+ days
}
```

### Edit Todo Modal Component

```typescript
interface EditTodoModalProps {
  todo: Todo;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: UpdateTodoInput) => void;
}

function EditTodoModal({ todo, isOpen, onClose, onUpdate }: EditTodoModalProps) {
  const [title, setTitle] = useState(todo.title);
  const [priority, setPriority] = useState(todo.priority);
  const [dueDate, setDueDate] = useState(todo.due_date || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          priority,
          due_date: dueDate || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to update todo');
        return;
      }

      const updated = await response.json();
      onUpdate(todo.id, updated);
      onClose();
    } catch (error) {
      console.error('Failed to update todo:', error);
      alert('Failed to update todo');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Todo</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-4 py-2 border rounded-lg"
              disabled={isSubmitting}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="datetime-local"
              value={dueDate ? new Date(dueDate).toISOString().slice(0, 16) : ''}
              onChange={(e) => setDueDate(e.target.value)}
              min={getMinimumDueDate().slice(0, 16)}
              className="w-full px-4 py-2 border rounded-lg"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## Edge Cases

### 1. Timezone Edge Cases
- **User creates todo at 11:59 PM Singapore time**: System must validate against Singapore midnight, not server's local time
- **Due date crosses DST boundary**: Singapore doesn't observe DST, so no special handling needed
- **Server in different timezone**: All validations use `getSingaporeNow()` to ensure consistency

### 2. Validation Edge Cases
- **Empty title**: `"   "` (whitespace only) → Rejected with error
- **Past due date**: Due date 1 second in the past → Rejected with error
- **Exactly current time**: Due date === current Singapore time → Rejected (must be > 1 minute future)
- **Invalid priority**: `"urgent"` (not in enum) → Rejected or defaults to 'medium'

### 3. Concurrent Updates
- **Two users update same todo simultaneously**: Last write wins (standard for SQLite)
- **User deletes while another edits**: Edit returns 404 error
- **Optimistic UI update fails**: UI reverts to previous state, error message displayed

### 4. Cascade Deletion Edge Cases
- **Delete todo with 50 subtasks**: All subtasks deleted via CASCADE
- **Delete todo with tags**: Tag associations removed, tags themselves remain
- **Delete recurring todo**: Only current instance deleted, not future instances

### 5. Completion Edge Cases
- **Complete todo that's already completed**: No-op, idempotent
- **Complete recurring todo without due date**: Should not happen (validation prevents), but gracefully handle by not creating next instance
- **Complete overdue recurring todo**: Creates next instance from original due date + pattern, not from current time

### 6. Date Formatting Edge Cases
- **Due date with seconds**: Frontend uses `datetime-local` which doesn't include seconds → seconds always `:00`
- **Invalid ISO 8601 string**: Database rejects, validation catches before storage
- **Null due date**: Allowed, displays as "No due date" in UI

### 7. Network Failure Edge Cases
- **Create fails after optimistic update**: Revert UI, show error message
- **Update fails during completion toggle**: Revert checkbox state
- **Delete fails after UI removal**: Could implement "undo" or reload from server

### 8. Large Data Sets
- **User has 1000+ todos**: Pagination not implemented in this PRP (future enhancement), all loaded at once
- **Query performance**: Indexed on `user_id`, `due_date`, `completed` for fast sorting
- **Client-side sorting**: Done on initial load, state management handles updates

---

## Acceptance Criteria

### ✅ Create Todo
- [ ] Can create todo with only title (minimum required field)
- [ ] Can create todo with title + priority + due date
- [ ] Empty/whitespace-only title is rejected with clear error message
- [ ] Past due date is rejected with error message
- [ ] Due date must be at least 1 minute in future (Singapore time)
- [ ] Created todo appears in UI immediately (optimistic update)
- [ ] Created todo appears in correct section (Pending if no due date or future, Overdue if somehow past)
- [ ] Form clears after successful creation
- [ ] Priority defaults to "medium" if not specified
- [ ] Create button disabled during submission
- [ ] Error messages display for validation failures

### ✅ Read Todos
- [ ] All user's todos fetched on page load
- [ ] Todos organized into sections: Overdue, Pending, Completed
- [ ] Overdue section only shows incomplete todos with past due dates
- [ ] Pending section shows incomplete todos with future/no due dates
- [ ] Completed section shows all completed todos regardless of due date
- [ ] Todos sorted by: Priority (H→M→L) → Due Date (earliest→latest) → Created Date (newest→oldest)
- [ ] Section counters display correct counts: "Overdue (X)", "Pending (Y)", "Completed (Z)"
- [ ] Loading state shown while fetching
- [ ] Error state shown if fetch fails

### ✅ Update Todo
- [ ] Edit button opens modal with current values pre-filled
- [ ] Can update title, priority, and due date independently
- [ ] Title validation applies (non-empty)
- [ ] Due date validation applies (future only)
- [ ] Updated todo moves to correct section if due date changed
- [ ] Optimistic update shows changes immediately
- [ ] Update reverts if API call fails
- [ ] Cancel button closes modal without saving
- [ ] Click outside modal closes modal without saving
- [ ] Update button disabled during submission

### ✅ Complete/Uncomplete Todo
- [ ] Clicking checkbox toggles completion status
- [ ] Completed todo moves to "Completed" section
- [ ] Uncompleted todo moves to "Pending" or "Overdue" based on due date
- [ ] Checkbox state updates immediately (optimistic)
- [ ] Checkbox reverts if API call fails
- [ ] Completed todos show strike-through styling
- [ ] Recurrence logic triggers on completion (if applicable - see PRP-03)

### ✅ Delete Todo
- [ ] Delete button removes todo immediately from UI
- [ ] Delete cascades to subtasks (all subtasks removed)
- [ ] Delete removes tag associations
- [ ] Delete is permanent (no undo)
- [ ] 404 error if todo doesn't exist
- [ ] 401 error if not authenticated
- [ ] Cannot delete another user's todo

### ✅ Singapore Timezone
- [ ] All due date validations use Singapore timezone
- [ ] "Overdue" calculation uses Singapore current time
- [ ] Due date display formats in Singapore timezone
- [ ] Minimum due date picker enforces Singapore time + 1 minute

### ✅ Error Handling
- [ ] Network errors show user-friendly messages
- [ ] Validation errors show specific messages (e.g., "Title is required")
- [ ] 401 errors redirect to login
- [ ] 404 errors show "Todo not found"
- [ ] Server errors show generic error message
- [ ] Failed operations revert optimistic updates

### ✅ UI/UX
- [ ] Loading states prevent duplicate submissions
- [ ] Disabled buttons show opacity reduction
- [ ] Forms use appropriate input types (text, datetime-local, select)
- [ ] Color-coded priority badges (red/yellow/blue)
- [ ] Color-coded due date urgency (red for overdue/<1h, orange for <24h, yellow for <7d, blue for 7+d)
- [ ] Responsive layout works on mobile and desktop
- [ ] Dark mode supported (if implemented)

---

## Testing Requirements

### E2E Tests (Playwright)

#### Test File: `tests/01-todo-crud.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { registerUser, loginUser } from './helpers';

test.describe('Todo CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page, `user-${Date.now()}`);
  });

  test('should create todo with title only', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[placeholder*="What needs to be done"]', 'Buy groceries');
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Buy groceries')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
  });

  test('should create todo with title, priority, and due date', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[placeholder*="What needs to be done"]', 'Team meeting');
    await page.selectOption('select[name="priority"]', 'high');
    
    // Set due date to tomorrow at 2 PM Singapore time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const dueDateString = tomorrow.toISOString().slice(0, 16);
    await page.fill('input[type="datetime-local"]', dueDateString);
    
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Team meeting')).toBeVisible();
    await expect(page.locator('text=HIGH')).toBeVisible();
    await expect(page.locator('text=Due in')).toBeVisible();
  });

  test('should reject empty title', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[placeholder*="What needs to be done"]', '   ');
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Title is required')).toBeVisible();
  });

  test('should reject past due date', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[placeholder*="What needs to be done"]', 'Past task');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDateString = yesterday.toISOString().slice(0, 16);
    await page.fill('input[type="datetime-local"]', pastDateString);
    
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Due date must be in the future')).toBeVisible();
  });

  test('should edit todo title', async ({ page }) => {
    await page.goto('/');
    
    // Create todo
    await page.fill('input[placeholder*="What needs to be done"]', 'Original title');
    await page.click('button:has-text("Add")');

    // Edit todo
    await page.click('button:has-text("Edit")');
    await page.fill('input[value="Original title"]', 'Updated title');
    await page.click('button:has-text("Update")');

    await expect(page.locator('text=Updated title')).toBeVisible();
    await expect(page.locator('text=Original title')).not.toBeVisible();
  });

  test('should toggle todo completion', async ({ page }) => {
    await page.goto('/');
    
    // Create todo
    await page.fill('input[placeholder*="What needs to be done"]', 'Task to complete');
    await page.click('button:has-text("Add")');

    // Complete
    await page.click('input[type="checkbox"]');
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('.line-through:has-text("Task to complete")')).toBeVisible();

    // Uncomplete
    await page.click('input[type="checkbox"]');
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('.line-through:has-text("Task to complete")')).not.toBeVisible();
  });

  test('should delete todo', async ({ page }) => {
    await page.goto('/');
    
    // Create todo
    await page.fill('input[placeholder*="What needs to be done"]', 'Task to delete');
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Task to delete')).toBeVisible();

    // Delete
    await page.click('button:has-text("Delete")');
    await expect(page.locator('text=Task to delete')).not.toBeVisible();
  });

  test('should show todos in correct sections', async ({ page }) => {
    await page.goto('/');
    
    // Create overdue todo (if possible in test environment)
    // Create pending todo
    await page.fill('input[placeholder*="What needs to be done"]', 'Pending task');
    await page.click('button:has-text("Add")');

    // Create completed todo
    await page.fill('input[placeholder*="What needs to be done"]', 'Completed task');
    await page.click('button:has-text("Add")');
    await page.click('input[type="checkbox"]:near(:text("Completed task"))');

    await expect(page.locator('text=Pending (1)')).toBeVisible();
    await expect(page.locator('text=Completed (1)')).toBeVisible();
  });

  test('should sort todos by priority', async ({ page }) => {
    await page.goto('/');
    
    // Create low priority
    await page.fill('input[placeholder*="What needs to be done"]', 'Low priority task');
    await page.selectOption('select[name="priority"]', 'low');
    await page.click('button:has-text("Add")');

    // Create high priority
    await page.fill('input[placeholder*="What needs to be done"]', 'High priority task');
    await page.selectOption('select[name="priority"]', 'high');
    await page.click('button:has-text("Add")');

    // Create medium priority
    await page.fill('input[placeholder*="What needs to be done"]', 'Medium priority task');
    await page.selectOption('select[name="priority"]', 'medium');
    await page.click('button:has-text("Add")');

    const todos = page.locator('.todo-item h3');
    await expect(todos.nth(0)).toHaveText('High priority task');
    await expect(todos.nth(1)).toHaveText('Medium priority task');
    await expect(todos.nth(2)).toHaveText('Low priority task');
  });
});
```

#### Test Helpers: `tests/helpers.ts`

```typescript
import { Page } from '@playwright/test';

export async function registerUser(page: Page, username: string) {
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.click('button:has-text("Register")');
  
  // Virtual authenticator handles WebAuthn
  await page.waitForURL('/');
}

export async function loginUser(page: Page, username: string) {
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.click('button:has-text("Login")');
  await page.waitForURL('/');
}

export async function createTodo(page: Page, title: string, options?: {
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
}) {
  await page.fill('input[placeholder*="What needs to be done"]', title);
  
  if (options?.priority) {
    await page.selectOption('select[name="priority"]', options.priority);
  }
  
  if (options?.dueDate) {
    const dueDateString = options.dueDate.toISOString().slice(0, 16);
    await page.fill('input[type="datetime-local"]', dueDateString);
  }
  
  await page.click('button:has-text("Add")');
  await page.waitForSelector(`text=${title}`);
}
```

### Unit Tests

#### Database Operations: `lib/__tests__/db.test.ts`

```typescript
import { todoDB, Priority } from '../db';
import { getSingaporeNow } from '../timezone';

describe('Todo Database Operations', () => {
  const mockUserId = 1;

  afterEach(() => {
    // Clean up test data
    const todos = todoDB.getAllByUser(mockUserId);
    todos.forEach(todo => todoDB.delete(todo.id));
  });

  test('should create todo with required fields', () => {
    const todo = todoDB.create({
      user_id: mockUserId,
      title: 'Test todo',
    });

    expect(todo.id).toBeDefined();
    expect(todo.title).toBe('Test todo');
    expect(todo.completed).toBe(false);
    expect(todo.priority).toBe('medium');
    expect(todo.user_id).toBe(mockUserId);
  });

  test('should create todo with all fields', () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);

    const todo = todoDB.create({
      user_id: mockUserId,
      title: 'Full todo',
      priority: 'high',
      due_date: dueDate.toISOString(),
      recurrence_pattern: 'weekly',
      reminder_minutes: 60,
    });

    expect(todo.priority).toBe('high');
    expect(todo.due_date).toBe(dueDate.toISOString());
    expect(todo.recurrence_pattern).toBe('weekly');
    expect(todo.reminder_minutes).toBe(60);
  });

  test('should get todo by id', () => {
    const created = todoDB.create({
      user_id: mockUserId,
      title: 'Findable todo',
    });

    const found = todoDB.getById(created.id);
    expect(found).toEqual(created);
  });

  test('should return null for non-existent todo', () => {
    const found = todoDB.getById(999999);
    expect(found).toBeNull();
  });

  test('should get all todos for user', () => {
    todoDB.create({ user_id: mockUserId, title: 'Todo 1' });
    todoDB.create({ user_id: mockUserId, title: 'Todo 2' });
    todoDB.create({ user_id: 2, title: 'Other user todo' });

    const todos = todoDB.getAllByUser(mockUserId);
    expect(todos).toHaveLength(2);
    expect(todos.every(t => t.user_id === mockUserId)).toBe(true);
  });

  test('should update todo fields', () => {
    const todo = todoDB.create({
      user_id: mockUserId,
      title: 'Original',
    });

    const updated = todoDB.update(todo.id, {
      title: 'Updated',
      priority: 'high',
      completed: true,
    });

    expect(updated.title).toBe('Updated');
    expect(updated.priority).toBe('high');
    expect(updated.completed).toBe(true);
  });

  test('should delete todo', () => {
    const todo = todoDB.create({
      user_id: mockUserId,
      title: 'To delete',
    });

    todoDB.delete(todo.id);
    const found = todoDB.getById(todo.id);
    expect(found).toBeNull();
  });

  test('should sort todos correctly', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Create in random order
    todoDB.create({ user_id: mockUserId, title: 'Low no date', priority: 'low' });
    todoDB.create({ user_id: mockUserId, title: 'High next week', priority: 'high', due_date: nextWeek.toISOString() });
    todoDB.create({ user_id: mockUserId, title: 'Medium tomorrow', priority: 'medium', due_date: tomorrow.toISOString() });
    todoDB.create({ user_id: mockUserId, title: 'High tomorrow', priority: 'high', due_date: tomorrow.toISOString() });

    const todos = todoDB.getAllByUser(mockUserId);

    // Should be sorted: High tomorrow, High next week, Medium tomorrow, Low no date
    expect(todos[0].title).toBe('High tomorrow');
    expect(todos[1].title).toBe('High next week');
    expect(todos[2].title).toBe('Medium tomorrow');
    expect(todos[3].title).toBe('Low no date');
  });
});
```

#### Timezone Utilities: `lib/__tests__/timezone.test.ts`

```typescript
import { getSingaporeNow, isOverdue, getMinimumDueDate } from '../timezone';

describe('Timezone Utilities', () => {
  test('getSingaporeNow returns Singapore time', () => {
    const sgNow = getSingaporeNow();
    expect(sgNow).toBeInstanceOf(Date);
  });

  test('isOverdue returns true for past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    expect(isOverdue(pastDate.toISOString())).toBe(true);
  });

  test('isOverdue returns false for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    expect(isOverdue(futureDate.toISOString())).toBe(false);
  });

  test('getMinimumDueDate returns time at least 1 minute in future', () => {
    const now = getSingaporeNow();
    const minDate = new Date(getMinimumDueDate());
    const diffMs = minDate.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    expect(diffMinutes).toBeGreaterThanOrEqual(1);
    expect(diffMinutes).toBeLessThanOrEqual(2);  // Should be ~1 minute
  });
});
```

---

## Out of Scope

The following features are **NOT** included in this PRP and will be covered in separate PRPs:

- **Subtasks & Progress Tracking** → See PRP-05
- **Tag System** → See PRP-06
- **Recurring Todo Logic** (next instance creation) → See PRP-03
- **Reminder/Notification System** → See PRP-04
- **Template System** → See PRP-07
- **Search & Filtering** → See PRP-08
- **Export & Import** → See PRP-09
- **Calendar View** → See PRP-10
- **Authentication Implementation** → See PRP-11 (assume session exists)
- **Pagination** → Future enhancement for large datasets
- **Undo/Redo** → Future enhancement
- **Drag-and-Drop Reordering** → Future enhancement
- **Bulk Operations** → Future enhancement

---

## Success Metrics

### Functional Metrics
- [ ] 100% of CRUD operations work correctly
- [ ] 0 timezone-related bugs in production
- [ ] All validation rules enforced consistently
- [ ] Optimistic updates provide instant feedback

### Performance Metrics
- [ ] Todo creation completes in < 200ms (API + DB)
- [ ] Todo list load time < 500ms for 100 todos
- [ ] Update operations complete in < 150ms
- [ ] Delete operations complete in < 100ms

### Quality Metrics
- [ ] All E2E tests pass consistently (3+ consecutive runs)
- [ ] All unit tests pass with 100% coverage for DB operations
- [ ] ESLint shows 0 errors
- [ ] TypeScript compiles with 0 errors
- [ ] No console.error in production builds

### User Experience Metrics
- [ ] Optimistic updates prevent perceived latency
- [ ] Error messages are clear and actionable
- [ ] Loading states prevent duplicate submissions
- [ ] UI remains responsive during operations
- [ ] No visual glitches during section transitions

---

**Implementation Priority:** 🔴 **CRITICAL** - This is the foundation for all other features

**Dependencies:** 
- Database schema initialized
- Authentication system (session management)
- Singapore timezone utilities

**Blocks:**
- All other todo-related features (priority, recurring, reminders, subtasks, tags)

---

**Last Updated:** February 5, 2026  
**Document Version:** 1.0  
**Status:** ✅ Complete and Ready for Implementation
