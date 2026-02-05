# PRP-03: Recurring Todos

## Feature Overview

The Recurring Todos feature enables users to create tasks that automatically repeat on a schedule (daily, weekly, monthly, or yearly). When a recurring todo is completed, the system automatically creates the next instance with the same metadata (priority, tags, reminder settings, and recurrence pattern), calculating the new due date based on the pattern. This feature is essential for managing habits, routines, regular meetings, bill payments, and other repeating responsibilities.

**Key Capabilities:**
- Four recurrence patterns: Daily, Weekly, Monthly, Yearly
- Automatic next instance creation upon completion
- Due date calculation using Singapore timezone
- Metadata inheritance (priority, tags, reminder timing, recurrence pattern)
- Visual 🔄 badge indicating recurring status
- Required due date for recurring todos (validation)
- Completion of current instance only (next instance is separate todo)
- Compatible with all other todo features (priority, tags, subtasks, reminders)

---

## User Stories

### Primary User Persona: Routine-Oriented Professional
> "As someone managing recurring responsibilities, I need tasks that automatically repeat, so I don't have to manually recreate them every time."

**User Story 1: Daily Habit Tracking**
```
As a user,
I want to create a daily recurring todo,
So that I can maintain consistent habits like exercise or medication.
```

**User Story 2: Weekly Meeting Preparation**
```
As a user,
I want to create a weekly recurring todo,
So that I remember to prepare for my regular team meetings.
```

**User Story 3: Monthly Bill Payments**
```
As a user,
I want to create a monthly recurring todo,
So that I never miss my regular bill payment dates.
```

**User Story 4: Annual Reviews**
```
As a user,
I want to create a yearly recurring todo,
So that I remember important annual tasks like tax filing or subscription renewals.
```

**User Story 5: Automatic Next Instance**
```
As a user,
I want the next occurrence to be created automatically when I complete a recurring todo,
So that I don't have to manually set up the next instance.
```

**User Story 6: Metadata Persistence**
```
As a user,
I want the next instance to inherit priority, tags, and reminder settings,
So that all recurring instances maintain the same configuration.
```

**User Story 7: Visual Identification**
```
As a user,
I want to see a visual indicator on recurring todos,
So that I can quickly identify which tasks will repeat.
```

---

## User Flow

### Flow 1: Creating a Daily Recurring Todo
```
1. User enters todo title: "Take morning vitamins"
2. User selects priority: High
3. User sets due date: Tomorrow 8:00 AM
4. User checks "Repeat" checkbox
5. Recurrence pattern dropdown becomes enabled
6. User selects "Daily" from pattern dropdown
7. User optionally sets reminder: 15 minutes before
8. User clicks "Add" button
9. System validates due date is present
10. Todo created with 🔄 daily badge
11. Todo appears in Pending section with high priority
```

### Flow 2: Creating a Weekly Recurring Todo
```
1. User enters title: "Team standup preparation"
2. User sets due date: Next Monday 9:00 AM
3. User checks "Repeat" checkbox
4. User selects "Weekly" pattern
5. User adds tag: "Work"
6. User clicks "Add"
7. Todo created with 🔄 weekly badge and work tag
8. Every Monday at 9:00 AM, this task will recur
```

### Flow 3: Creating a Monthly Recurring Todo
```
1. User enters title: "Pay rent"
2. User sets priority: High
3. User sets due date: 1st of next month at 10:00 AM
4. User checks "Repeat" checkbox
5. User selects "Monthly" pattern
6. User sets reminder: 1 day before
7. User clicks "Add"
8. Todo created, will recur on the 1st of each month
```

### Flow 4: Creating a Yearly Recurring Todo
```
1. User enters title: "Renew domain registration"
2. User sets due date: December 15, 2026 12:00 PM
3. User checks "Repeat" checkbox
4. User selects "Yearly" pattern
5. User clicks "Add"
6. Todo created, will recur annually on December 15
```

### Flow 5: Completing a Recurring Todo (Automatic Next Instance)
```
1. User has recurring todo: "Daily exercise" (due today, daily pattern)
2. User clicks completion checkbox
3. System marks current instance as complete
4. Current instance moves to "Completed" section
5. System calculates next due date: tomorrow, same time
6. System creates new todo with:
   - Same title: "Daily exercise"
   - Same priority level
   - Same recurrence pattern: daily
   - Same reminder timing (if set)
   - Same tags (if any)
   - New due date: tomorrow
   - Completed: false (unchecked)
7. New instance appears in "Pending" section
8. User sees both: completed instance and new pending instance
```

### Flow 6: Completing a Weekly Recurring Todo
```
1. User completes "Weekly report" (due today, Friday 5:00 PM, weekly pattern)
2. System marks complete
3. System calculates: today + 7 days = next Friday 5:00 PM
4. New instance created for next Friday at same time
5. Metadata inherited (priority, tags, reminder, pattern)
```

### Flow 7: Completing a Monthly Recurring Todo
```
1. User completes "Pay utilities" (due Nov 1, monthly pattern)
2. System marks complete
3. System calculates: same date next month = Dec 1, same time
4. New instance created for Dec 1
5. If completing late (e.g., on Nov 5), next instance still Dec 1 (not Dec 5)
```

### Flow 8: Editing a Recurring Todo
```
1. User clicks "Edit" on recurring todo
2. Modal shows current values with "Repeat" checked
3. User can:
   - Change recurrence pattern (daily → weekly)
   - Disable recurrence (uncheck "Repeat")
   - Change priority/tags/reminder (affects current instance only)
4. Changing pattern affects only future instances created from this one
5. Existing next instances (if any) remain unchanged
```

### Flow 9: Deleting a Recurring Todo
```
1. User clicks "Delete" on recurring todo
2. Only current instance is deleted
3. No future instances automatically created
4. Other instances (completed or pending) remain separate
```

### Flow 10: Validation - Recurring Without Due Date
```
1. User enters title
2. User checks "Repeat" checkbox
3. User selects pattern: "Daily"
4. User does NOT set a due date
5. User clicks "Add"
6. System shows error: "Recurring todos require a due date"
7. User cannot create todo until due date is set
```

---

## Technical Requirements

### Database Schema

The Recurring Todos feature uses the existing `recurrence_pattern` field from the `todos` table:

```sql
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT 0,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  due_date TEXT,  -- REQUIRED for recurring todos
  recurrence_pattern TEXT CHECK(recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
  reminder_minutes INTEGER,
  last_notification_sent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for querying recurring todos
CREATE INDEX idx_todos_recurrence ON todos(user_id, recurrence_pattern);
```

**Recurrence Pattern Field:**
- **Type**: TEXT with CHECK constraint
- **Allowed Values**: 'daily', 'weekly', 'monthly', 'yearly', NULL
- **Default**: NULL (non-recurring)
- **Constraint**: CHECK enforces enum-like behavior
- **Business Rule**: If NOT NULL, `due_date` MUST also be NOT NULL

### TypeScript Types

```typescript
// lib/db.ts
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

// Helper type for recurrence configuration
export interface RecurrenceConfig {
  pattern: RecurrencePattern;
  label: string;
  shortLabel: string;
  description: string;
  badge: string;
}

export const RECURRENCE_CONFIGS: Record<RecurrencePattern, RecurrenceConfig> = {
  daily: {
    pattern: 'daily',
    label: 'Daily',
    shortLabel: 'daily',
    description: 'Repeats every day',
    badge: '🔄 daily'
  },
  weekly: {
    pattern: 'weekly',
    label: 'Weekly',
    shortLabel: 'weekly',
    description: 'Repeats every 7 days',
    badge: '🔄 weekly'
  },
  monthly: {
    pattern: 'monthly',
    label: 'Monthly',
    shortLabel: 'monthly',
    description: 'Repeats on the same date next month',
    badge: '🔄 monthly'
  },
  yearly: {
    pattern: 'yearly',
    label: 'Yearly',
    shortLabel: 'yearly',
    description: 'Repeats annually',
    badge: '🔄 yearly'
  }
};
```

### Due Date Calculation Logic

```typescript
// lib/recurrence.ts
import { getSingaporeNow } from './timezone';
import { RecurrencePattern } from './db';

/**
 * Calculate next due date based on recurrence pattern
 * Always uses the ORIGINAL due date as base, not completion date
 * All calculations in Singapore timezone
 */
export function calculateNextDueDate(
  currentDueDate: string,
  pattern: RecurrencePattern
): string {
  const baseDate = new Date(currentDueDate);
  const sgNow = getSingaporeNow();
  
  let nextDate = new Date(baseDate);

  switch (pattern) {
    case 'daily':
      // Add 1 day
      nextDate.setDate(nextDate.getDate() + 1);
      break;

    case 'weekly':
      // Add 7 days
      nextDate.setDate(nextDate.getDate() + 7);
      break;

    case 'monthly':
      // Add 1 month, handle month-end edge cases
      nextDate.setMonth(nextDate.getMonth() + 1);
      
      // Edge case: If original date was 31st but next month has 30 days,
      // JavaScript automatically rolls to next month
      // We want to stay in the intended month
      if (nextDate.getDate() !== baseDate.getDate()) {
        // Set to last day of intended month
        nextDate.setDate(0);
      }
      break;

    case 'yearly':
      // Add 1 year
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      
      // Edge case: Leap year Feb 29 → non-leap year
      if (nextDate.getDate() !== baseDate.getDate()) {
        nextDate.setDate(0);  // Feb 28
      }
      break;
  }

  return nextDate.toISOString();
}

/**
 * Validate that a due date is provided for recurring todos
 */
export function validateRecurringTodo(
  recurrencePattern: RecurrencePattern | null,
  dueDate: string | null
): { valid: boolean; error?: string } {
  if (recurrencePattern && !dueDate) {
    return {
      valid: false,
      error: 'Recurring todos require a due date'
    };
  }
  return { valid: true };
}

/**
 * Get human-readable next occurrence description
 */
export function getNextOccurrenceDescription(
  currentDueDate: string,
  pattern: RecurrencePattern
): string {
  const nextDate = calculateNextDueDate(currentDueDate, pattern);
  const formatted = new Date(nextDate).toLocaleDateString('en-US', {
    timeZone: 'Asia/Singapore',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `Next: ${formatted}`;
}
```

### Metadata Inheritance Logic

```typescript
// lib/recurrence.ts (continued)

/**
 * Create next instance of a recurring todo
 * Inherits: title, priority, reminder_minutes, recurrence_pattern, tags
 * Resets: completed (false), last_notification_sent (null)
 * Calculates: new due_date
 */
export interface CreateNextInstanceInput {
  currentTodo: Todo;
  tagIds?: number[];  // Tag IDs to copy to next instance
}

export function prepareNextInstanceData(
  input: CreateNextInstanceInput
): Omit<Todo, 'id' | 'created_at' | 'updated_at'> {
  const { currentTodo } = input;

  if (!currentTodo.recurrence_pattern || !currentTodo.due_date) {
    throw new Error('Cannot create next instance for non-recurring todo');
  }

  const nextDueDate = calculateNextDueDate(
    currentTodo.due_date,
    currentTodo.recurrence_pattern
  );

  return {
    user_id: currentTodo.user_id,
    title: currentTodo.title,
    completed: false,
    priority: currentTodo.priority,
    due_date: nextDueDate,
    recurrence_pattern: currentTodo.recurrence_pattern,
    reminder_minutes: currentTodo.reminder_minutes,
    last_notification_sent: null,  // Reset notification tracking
  };
}
```

### Database Operations

```typescript
// lib/db.ts (additions to todoDB)

export const todoDB = {
  // ... existing methods from PRP-01

  /**
   * Create next instance of recurring todo and copy tags
   */
  createNextRecurringInstance: (currentTodo: Todo, tagIds: number[] = []): Todo => {
    const nextInstanceData = prepareNextInstanceData({ currentTodo, tagIds });
    
    // Create new todo
    const stmt = db.prepare(`
      INSERT INTO todos (
        user_id, title, completed, priority, due_date,
        recurrence_pattern, reminder_minutes, last_notification_sent
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      nextInstanceData.user_id,
      nextInstanceData.title,
      nextInstanceData.completed ? 1 : 0,
      nextInstanceData.priority,
      nextInstanceData.due_date,
      nextInstanceData.recurrence_pattern,
      nextInstanceData.reminder_minutes,
      nextInstanceData.last_notification_sent
    );

    const nextTodo = todoDB.getById(info.lastInsertRowid as number)!;

    // Copy tags to next instance
    if (tagIds.length > 0) {
      const tagStmt = db.prepare(
        'INSERT INTO todo_tags (todo_id, tag_id) VALUES (?, ?)'
      );
      
      for (const tagId of tagIds) {
        tagStmt.run(nextTodo.id, tagId);
      }
    }

    return nextTodo;
  },

  /**
   * Get tag IDs for a todo (for inheritance)
   */
  getTodoTagIds: (todoId: number): number[] => {
    const stmt = db.prepare(
      'SELECT tag_id FROM todo_tags WHERE todo_id = ?'
    );
    const results = stmt.all(todoId) as Array<{ tag_id: number }>;
    return results.map(r => r.tag_id);
  },

  /**
   * Check if a todo is recurring
   */
  isRecurring: (todo: Todo): boolean => {
    return todo.recurrence_pattern !== null;
  },
};
```

### API Endpoint Enhancement

#### Update Todo (Handle Completion of Recurring Todos): `PUT /api/todos/[id]`

```typescript
// app/api/todos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';
import { validateRecurringTodo } from '@/lib/recurrence';

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
  const todoId = parseInt(id);

  const todo = todoDB.getById(todoId);
  if (!todo || todo.user_id !== session.userId) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  // Validate recurring todo requirements
  const newRecurrence = body.recurrence_pattern !== undefined 
    ? body.recurrence_pattern 
    : todo.recurrence_pattern;
  const newDueDate = body.due_date !== undefined 
    ? body.due_date 
    : todo.due_date;

  const validation = validateRecurringTodo(newRecurrence, newDueDate);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Special handling for completing a recurring todo
  if (
    body.completed === true &&
    !todo.completed &&
    todo.recurrence_pattern &&
    todo.due_date
  ) {
    // Get current tags for inheritance
    const tagIds = todoDB.getTodoTagIds(todoId);

    // Create next instance BEFORE completing current one
    const nextInstance = todoDB.createNextRecurringInstance(todo, tagIds);

    // Now complete the current instance
    const updated = todoDB.update(todoId, { completed: true });

    return NextResponse.json({
      completed: updated,
      nextInstance,
    }, { status: 200 });
  }

  // Regular update (not a recurring completion)
  const updated = todoDB.update(todoId, body);
  return NextResponse.json(updated, { status: 200 });
}
```

#### Create Todo with Recurrence Validation: `POST /api/todos`

```typescript
// app/api/todos/route.ts
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();

  // Existing validations (title, due date in future, etc.)
  // ...

  // Validate recurring todo requirements
  const validation = validateRecurringTodo(
    body.recurrence_pattern || null,
    body.due_date || null
  );
  
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Create todo
  const todo = todoDB.create({
    user_id: session.userId,
    title: body.title.trim(),
    priority: body.priority || 'medium',
    due_date: body.due_date || null,
    recurrence_pattern: body.recurrence_pattern || null,
    reminder_minutes: body.reminder_minutes || null,
  });

  return NextResponse.json(todo, { status: 201 });
}
```

---

## UI Components

### Recurrence Badge Component

```typescript
// components/RecurrenceBadge.tsx
'use client';

import { RecurrencePattern, RECURRENCE_CONFIGS } from '@/lib/db';

interface RecurrenceBadgeProps {
  pattern: RecurrencePattern;
  size?: 'sm' | 'md' | 'lg';
}

export function RecurrenceBadge({ pattern, size = 'md' }: RecurrenceBadgeProps) {
  const config = RECURRENCE_CONFIGS[pattern];
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full
        ${sizeClasses[size]}
        bg-purple-100 text-purple-800 border border-purple-300
        dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700
      `}
      title={config.description}
    >
      {config.badge}
    </span>
  );
}
```

### Recurrence Selector Component

```typescript
// components/RecurrenceSelector.tsx
'use client';

import { useState } from 'react';
import { RecurrencePattern, RECURRENCE_CONFIGS } from '@/lib/db';

interface RecurrenceSelectorProps {
  isRecurring: boolean;
  pattern: RecurrencePattern | null;
  onRecurringChange: (recurring: boolean) => void;
  onPatternChange: (pattern: RecurrencePattern | null) => void;
  disabled?: boolean;
  hasDueDate: boolean;  // For validation messaging
}

export function RecurrenceSelector({
  isRecurring,
  pattern,
  onRecurringChange,
  onPatternChange,
  disabled = false,
  hasDueDate
}: RecurrenceSelectorProps) {
  const [showWarning, setShowWarning] = useState(false);

  const handleRecurringToggle = (checked: boolean) => {
    if (checked && !hasDueDate) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    onRecurringChange(checked);
    
    if (!checked) {
      onPatternChange(null);
    } else if (!pattern) {
      onPatternChange('weekly');  // Default pattern
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="recurring"
          checked={isRecurring}
          onChange={(e) => handleRecurringToggle(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label 
          htmlFor="recurring" 
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Repeat
        </label>
      </div>

      {showWarning && (
        <p className="text-sm text-red-600 dark:text-red-400">
          ⚠️ Please set a due date before enabling recurrence
        </p>
      )}

      {isRecurring && (
        <select
          value={pattern || ''}
          onChange={(e) => onPatternChange(e.target.value as RecurrencePattern)}
          disabled={disabled}
          className="
            w-full px-3 py-2 border rounded-lg text-sm
            bg-white dark:bg-gray-800
            border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-purple-500
          "
        >
          <option value="">Select pattern...</option>
          {Object.values(RECURRENCE_CONFIGS).map(config => (
            <option key={config.pattern} value={config.pattern}>
              {config.label} - {config.description}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
```

### Todo Form with Recurrence Integration

```typescript
// app/page.tsx (excerpt)
'use client';

import { useState } from 'react';
import { Priority, RecurrencePattern } from '@/lib/db';
import { RecurrenceSelector } from '@/components/RecurrenceSelector';
import { RecurrenceBadge } from '@/components/RecurrenceBadge';

export default function TodoPage() {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | null>(null);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        priority,
        due_date: dueDate || null,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.error || 'Failed to create todo');
      return;
    }

    // Reset form
    setTitle('');
    setPriority('medium');
    setDueDate('');
    setIsRecurring(false);
    setRecurrencePattern(null);
    
    // Refresh todo list
    fetchTodos();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleCreateTodo} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full px-4 py-2 border rounded-lg"
        />

        <div className="flex gap-4">
          <PrioritySelector value={priority} onChange={setPriority} />
          
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
        </div>

        <RecurrenceSelector
          isRecurring={isRecurring}
          pattern={recurrencePattern}
          onRecurringChange={setIsRecurring}
          onPatternChange={setRecurrencePattern}
          hasDueDate={!!dueDate}
        />

        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add
        </button>
      </form>

      {/* Todo List */}
      {/* ... */}
    </div>
  );
}
```

### Todo Item with Recurrence Badge

```typescript
// components/TodoItem.tsx
function TodoItem({ todo, onUpdate }: TodoItemProps) {
  const handleToggleComplete = async () => {
    const response = await fetch(`/api/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // If recurring todo was completed, server returns nextInstance
      if (data.nextInstance) {
        console.log('Next instance created:', data.nextInstance);
      }
      
      onUpdate();  // Refresh todo list to show both completed and new instance
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
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : ''}`}>
            {todo.title}
          </h3>
          
          <PriorityBadge priority={todo.priority} size="sm" />
          
          {todo.recurrence_pattern && (
            <RecurrenceBadge pattern={todo.recurrence_pattern} size="sm" />
          )}
        </div>

        {todo.due_date && (
          <p className="text-sm text-gray-600 mt-1">
            Due: {formatDueDate(todo.due_date)}
          </p>
        )}
      </div>

      <button onClick={() => onEdit(todo)} className="text-blue-600">Edit</button>
      <button onClick={() => onDelete(todo.id)} className="text-red-600">Delete</button>
    </div>
  );
}
```

---

## Edge Cases

### 1. Date Calculation Edge Cases

**Monthly Recurrence - Month End Dates:**
- **Jan 31 → Feb**: Feb doesn't have 31 days → goes to Feb 28 (or 29 in leap year)
- **Jan 30 → Feb**: Goes to Feb 28/29
- **May 31 → Jun**: Jun has 30 days → goes to Jun 30
- **Solution**: Use `setDate(0)` to get last day of previous month

**Yearly Recurrence - Leap Year:**
- **Feb 29, 2024 (leap) → Feb 29, 2025 (non-leap)**: Goes to Feb 28, 2025
- **Solution**: Detect date mismatch and adjust to last day of month

**Daylight Saving Time:**
- Singapore doesn't observe DST, so no special handling needed
- Always use Singapore timezone for consistency

### 2. Completion Timing Edge Cases

**Complete Overdue Recurring Todo:**
- Todo due: Nov 1, completed: Nov 5 (4 days late)
- Next instance: Dec 1 (NOT Dec 5)
- **Rule**: Always calculate from original due date, not completion date

**Complete Before Due:**
- Todo due: Nov 10, completed: Nov 8 (2 days early)
- Next instance: Dec 10 (original pattern maintained)

**Multiple Rapid Completions:**
- User completes daily todo multiple times in succession
- Each completion creates next day's instance
- No throttling - user can plan ahead

### 3. Validation Edge Cases

**Enable Recurring Without Due Date:**
- User checks "Repeat" but has no due date set
- UI shows warning message
- Cannot save until due date added

**Remove Due Date from Recurring Todo:**
- User edits recurring todo and clears due date
- API rejects with error: "Recurring todos require a due date"

**Change to Recurring During Edit:**
- User edits non-recurring todo and enables recurrence
- Must have due date or validation fails

### 4. Metadata Inheritance Edge Cases

**Tags on Recurring Todo:**
- Current todo has tags: "work", "urgent"
- Upon completion, next instance gets both tags
- Tag associations copied to new todo_id

**Reminder Settings:**
- Current todo has reminder: 30 minutes before
- Next instance inherits: 30 minutes before (new due date)
- `last_notification_sent` reset to NULL

**Priority Changes:**
- User changes priority of current instance from medium to high
- Upon completion, next instance inherits: high
- Future instances always inherit from completed instance

### 5. Deletion Edge Cases

**Delete Recurring Todo:**
- Only deletes current instance
- Does NOT delete future or past instances
- Each instance is independent after creation

**Delete All Instances:**
- User must manually delete each instance
- No "delete all recurring" feature in this PRP

### 6. Edit Pattern Edge Cases

**Change Pattern on Recurring Todo:**
- Current: weekly, due every Monday
- User edits to: daily
- Current instance updated to daily
- Upon completion, creates tomorrow's instance (daily pattern)

**Disable Recurrence:**
- User unchecks "Repeat" on recurring todo
- `recurrence_pattern` set to NULL
- Upon completion, NO next instance created

### 7. Concurrent Completion Edge Cases

**Two Users Complete Same Recurring Todo:**
- Not applicable - todos are user-specific
- Each user has separate instances

**Same User Completes on Multiple Devices:**
- First completion creates next instance
- Second completion (if server hasn't synced) might create duplicate
- **Mitigation**: Use optimistic locking or check for existing next instance

### 8. Performance Edge Cases

**Long-Running Recurring Series:**
- 365 daily instances created over a year
- Each is separate database row
- Standard pagination/cleanup strategies apply

**Bulk Completion:**
- User completes 10 recurring todos at once
- Each triggers next instance creation
- Sequential processing, acceptable latency

---

## Acceptance Criteria

### ✅ Recurrence Pattern Selection

- [ ] Can create todo with "Daily" recurrence
- [ ] Can create todo with "Weekly" recurrence
- [ ] Can create todo with "Monthly" recurrence
- [ ] Can create todo with "Yearly" recurrence
- [ ] Pattern dropdown only enabled when "Repeat" checkbox is checked
- [ ] Pattern dropdown shows all four options with descriptions
- [ ] Default pattern is "Weekly" when "Repeat" first enabled

### ✅ Validation

- [ ] Cannot create recurring todo without due date
- [ ] Error message: "Recurring todos require a due date" displays
- [ ] Checking "Repeat" without due date shows warning
- [ ] Cannot enable "Repeat" checkbox until due date is set (or shows warning)
- [ ] Removing due date from recurring todo shows validation error
- [ ] Non-recurring todos can have null due dates (no restriction)

### ✅ Visual Indicators

- [ ] Recurring todos display 🔄 badge
- [ ] Badge shows pattern: "🔄 daily", "🔄 weekly", "🔄 monthly", "🔄 yearly"
- [ ] Badge styled with purple color scheme
- [ ] Badge visible in all sections (Overdue, Pending, Completed)
- [ ] Badge adapts to dark mode

### ✅ Next Instance Creation

- [ ] Completing daily todo creates tomorrow's instance
- [ ] Completing weekly todo creates next week's instance (same day/time)
- [ ] Completing monthly todo creates next month's instance (same date/time)
- [ ] Completing yearly todo creates next year's instance (same date/time)
- [ ] Next instance appears immediately after completion
- [ ] Current instance moves to Completed section
- [ ] Next instance appears in Pending section

### ✅ Metadata Inheritance

- [ ] Next instance has same title
- [ ] Next instance has same priority
- [ ] Next instance has same recurrence pattern
- [ ] Next instance has same reminder timing (minutes before)
- [ ] Next instance has same tags (all tag associations copied)
- [ ] Next instance has `completed: false`
- [ ] Next instance has `last_notification_sent: null` (reset)

### ✅ Due Date Calculation

- [ ] Daily: adds exactly 1 day
- [ ] Weekly: adds exactly 7 days
- [ ] Monthly: adds 1 month, handles month-end correctly (31→28/29/30)
- [ ] Yearly: adds 1 year, handles leap year (Feb 29→Feb 28)
- [ ] All calculations use Singapore timezone
- [ ] Late completion uses original due date as base (not completion date)
- [ ] Early completion uses original due date as base

### ✅ Editing Recurring Todos

- [ ] Edit modal shows "Repeat" checkbox checked
- [ ] Edit modal shows current pattern in dropdown
- [ ] Can change recurrence pattern (daily→weekly)
- [ ] Can disable recurrence (uncheck "Repeat")
- [ ] Can change other fields (title, priority, tags)
- [ ] Changes affect current instance only
- [ ] Future instances (if already created) remain unchanged

### ✅ Deleting Recurring Todos

- [ ] Delete button removes current instance only
- [ ] Delete does NOT remove future instances
- [ ] Delete does NOT remove past completed instances
- [ ] Each instance is independent

### ✅ API Behavior

- [ ] POST /api/todos validates recurrence_pattern + due_date requirement
- [ ] PUT /api/todos handles recurring completion
- [ ] PUT response includes `nextInstance` when recurring todo completed
- [ ] PUT validates recurrence changes
- [ ] GET /api/todos returns recurrence_pattern field

### ✅ Database Integrity

- [ ] `recurrence_pattern` stored as lowercase string
- [ ] CHECK constraint prevents invalid patterns
- [ ] NULL recurrence_pattern allowed (non-recurring)
- [ ] Recurring todos always have non-null `due_date`
- [ ] Tags properly copied via `todo_tags` junction table

### ✅ Performance

- [ ] Next instance creation completes in < 200ms
- [ ] Tag copying efficient (single transaction)
- [ ] No N+1 query issues when fetching todos with recurrence

---

## Testing Requirements

### E2E Tests (Playwright)

#### Test File: `tests/03-recurring-todos.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { registerUser, createTodo } from './helpers';

test.describe('Recurring Todos', () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page, `user-${Date.now()}`);
  });

  test('should create daily recurring todo', async ({ page }) => {
    await page.goto('/');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await page.fill('input[placeholder*="What needs to be done"]', 'Daily exercise');
    await page.fill('input[type="datetime-local"]', tomorrow.toISOString().slice(0, 16));
    await page.check('input[id="recurring"]');
    await page.selectOption('select[name="recurrence-pattern"]', 'daily');
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Daily exercise')).toBeVisible();
    await expect(page.locator('text=🔄 daily')).toBeVisible();
  });

  test('should show error when creating recurring todo without due date', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[placeholder*="What needs to be done"]', 'No date todo');
    await page.check('input[id="recurring"]');
    await page.selectOption('select[name="recurrence-pattern"]', 'weekly');
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Recurring todos require a due date')).toBeVisible();
  });

  test('should create weekly recurring todo', async ({ page }) => {
    await page.goto('/');

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await page.fill('input[placeholder*="What needs to be done"]', 'Team meeting');
    await page.fill('input[type="datetime-local"]', nextWeek.toISOString().slice(0, 16));
    await page.check('input[id="recurring"]');
    await page.selectOption('select[name="recurrence-pattern"]', 'weekly');
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=🔄 weekly')).toBeVisible();
  });

  test('should create monthly recurring todo', async ({ page }) => {
    await page.goto('/');

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await page.fill('input[placeholder*="What needs to be done"]', 'Pay rent');
    await page.fill('input[type="datetime-local"]', nextMonth.toISOString().slice(0, 16));
    await page.check('input[id="recurring"]');
    await page.selectOption('select[name="recurrence-pattern"]', 'monthly');
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=🔄 monthly')).toBeVisible();
  });

  test('should create yearly recurring todo', async ({ page }) => {
    await page.goto('/');

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    await page.fill('input[placeholder*="What needs to be done"]', 'Tax filing');
    await page.fill('input[type="datetime-local"]', nextYear.toISOString().slice(0, 16));
    await page.check('input[id="recurring"]');
    await page.selectOption('select[name="recurrence-pattern"]', 'yearly');
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=🔄 yearly')).toBeVisible();
  });

  test('should create next instance when completing daily recurring todo', async ({ page }) => {
    await page.goto('/');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create daily recurring todo
    await page.fill('input[placeholder*="What needs to be done"]', 'Morning routine');
    await page.fill('input[type="datetime-local"]', tomorrow.toISOString().slice(0, 16));
    await page.check('input[id="recurring"]');
    await page.selectOption('select[name="recurrence-pattern"]', 'daily');
    await page.click('button:has-text("Add")');

    // Complete it
    await page.click('input[type="checkbox"]:near(:text("Morning routine"))');

    // Should see completed instance
    await expect(page.locator('text=Completed').locator('..')).toContainText('Morning routine');

    // Should see new pending instance for tomorrow
    const pendingTodos = page.locator('text=Pending').locator('..').locator('text=Morning routine');
    await expect(pendingTodos).toBeVisible();
  });

  test('should inherit priority in next instance', async ({ page }) => {
    await page.goto('/');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await page.fill('input[placeholder*="What needs to be done"]', 'High priority task');
    await page.selectOption('select[name="priority"]', 'high');
    await page.fill('input[type="datetime-local"]', tomorrow.toISOString().slice(0, 16));
    await page.check('input[id="recurring"]');
    await page.selectOption('select[name="recurrence-pattern"]', 'daily');
    await page.click('button:has-text("Add")');

    // Complete
    await page.click('input[type="checkbox"]');

    // Next instance should also be high priority
    const nextInstance = page.locator('text=Pending').locator('..').locator('text=High priority task').locator('..');
    await expect(nextInstance.locator('text=HIGH')).toBeVisible();
  });

  test('should inherit tags in next instance', async ({ page }) => {
    await page.goto('/');

    // Create tag first
    await page.click('button:has-text("Manage Tags")');
    await page.fill('input[placeholder="Tag name"]', 'work');
    await page.click('button:has-text("Create Tag")');
    await page.click('button:has-text("Close")');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create recurring todo with tag
    await page.fill('input[placeholder*="What needs to be done"]', 'Tagged task');
    await page.fill('input[type="datetime-local"]', tomorrow.toISOString().slice(0, 16));
    await page.click('button:has-text("work")');  // Select tag
    await page.check('input[id="recurring"]');
    await page.selectOption('select[name="recurrence-pattern"]', 'daily');
    await page.click('button:has-text("Add")');

    // Complete
    await page.click('input[type="checkbox"]');

    // Next instance should have the tag
    const nextInstance = page.locator('text=Pending').locator('..').locator('text=Tagged task').locator('..');
    await expect(nextInstance.locator('text=work')).toBeVisible();
  });

  test('should disable recurrence pattern dropdown when repeat unchecked', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('select[name="recurrence-pattern"]')).toBeDisabled();

    await page.check('input[id="recurring"]');
    await expect(page.locator('select[name="recurrence-pattern"]')).toBeEnabled();

    await page.uncheck('input[id="recurring"]');
    await expect(page.locator('select[name="recurrence-pattern"]')).toBeDisabled();
  });

  test('should change recurrence pattern via edit', async ({ page }) => {
    await page.goto('/');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create daily recurring todo
    await page.fill('input[placeholder*="What needs to be done"]', 'Task to edit');
    await page.fill('input[type="datetime-local"]', tomorrow.toISOString().slice(0, 16));
    await page.check('input[id="recurring"]');
    await page.selectOption('select[name="recurrence-pattern"]', 'daily');
    await page.click('button:has-text("Add")');

    // Edit and change to weekly
    await page.click('button:has-text("Edit")');
    await page.selectOption('select[name="recurrence-pattern"]', 'weekly');
    await page.click('button:has-text("Update")');

    await expect(page.locator('text=🔄 weekly')).toBeVisible();
    await expect(page.locator('text=🔄 daily')).not.toBeVisible();
  });

  test('should disable recurrence via edit', async ({ page }) => {
    await page.goto('/');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create recurring todo
    await page.fill('input[placeholder*="What needs to be done"]', 'Stop recurring');
    await page.fill('input[type="datetime-local"]', tomorrow.toISOString().slice(0, 16));
    await page.check('input[id="recurring"]');
    await page.selectOption('select[name="recurrence-pattern"]', 'daily');
    await page.click('button:has-text("Add")');

    // Edit and disable recurrence
    await page.click('button:has-text("Edit")');
    await page.uncheck('input[id="recurring"]');
    await page.click('button:has-text("Update")');

    // Badge should be gone
    await expect(page.locator('text=🔄')).not.toBeVisible();

    // Completing should NOT create next instance
    await page.click('input[type="checkbox"]');
    
    // Should be only one instance (the completed one)
    const instances = page.locator('text=Stop recurring');
    await expect(instances).toHaveCount(1);
  });

  test('should handle monthly recurrence on month-end dates', async ({ page }) => {
    await page.goto('/');

    // Set to Jan 31 (if current month allows)
    const jan31 = new Date('2026-01-31T10:00:00');

    await page.fill('input[placeholder*="What needs to be done"]', 'Month end task');
    await page.fill('input[type="datetime-local"]', jan31.toISOString().slice(0, 16));
    await page.check('input[id="recurring"]');
    await page.selectOption('select[name="recurrence-pattern"]', 'monthly');
    await page.click('button:has-text("Add")');

    // Complete it
    await page.click('input[type="checkbox"]');

    // Next instance should be Feb 28 (since Feb doesn't have 31 days)
    // This is a visual check - the todo should exist for late February
    await expect(page.locator('text=Month end task')).toBeVisible();
  });

  test('should delete only current instance of recurring todo', async ({ page }) => {
    await page.goto('/');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Create recurring todo
    await page.fill('input[placeholder*="What needs to be done"]', 'Recurring delete test');
    await page.fill('input[type="datetime-local"]', tomorrow.toISOString().slice(0, 16));
    await page.check('input[id="recurring"]');
    await page.selectOption('select[name="recurrence-pattern"]', 'daily');
    await page.click('button:has-text("Add")');

    // Complete to create next instance
    await page.click('input[type="checkbox"]');

    // Now have 2 instances: completed + pending
    await expect(page.locator('text=Recurring delete test')).toHaveCount(2);

    // Delete the pending instance
    const pendingInstance = page.locator('text=Pending').locator('..').locator('text=Recurring delete test').locator('..');
    await pendingInstance.locator('button:has-text("Delete")').click();

    // Should still have completed instance
    await expect(page.locator('text=Recurring delete test')).toHaveCount(1);
    await expect(page.locator('text=Completed').locator('..').locator('text=Recurring delete test')).toBeVisible();
  });
});
```

### Unit Tests

#### Due Date Calculation: `lib/__tests__/recurrence.test.ts`

```typescript
import { calculateNextDueDate } from '../recurrence';

describe('Recurring Todo - Date Calculation', () => {
  test('daily: adds 1 day', () => {
    const current = '2025-11-10T10:00:00.000Z';
    const next = calculateNextDueDate(current, 'daily');
    expect(new Date(next).getDate()).toBe(11);
  });

  test('weekly: adds 7 days', () => {
    const current = '2025-11-10T10:00:00.000Z';  // Sunday
    const next = calculateNextDueDate(current, 'weekly');
    const nextDate = new Date(next);
    expect(nextDate.getDate()).toBe(17);  // Next Sunday
    expect(nextDate.getDay()).toBe(new Date(current).getDay());  // Same day of week
  });

  test('monthly: adds 1 month', () => {
    const current = '2025-11-10T10:00:00.000Z';
    const next = calculateNextDueDate(current, 'monthly');
    const nextDate = new Date(next);
    expect(nextDate.getMonth()).toBe(11);  // December (0-indexed)
    expect(nextDate.getDate()).toBe(10);  // Same date
  });

  test('monthly: handles month-end (31 -> 28)', () => {
    const jan31 = '2025-01-31T10:00:00.000Z';
    const next = calculateNextDueDate(jan31, 'monthly');
    const nextDate = new Date(next);
    expect(nextDate.getMonth()).toBe(1);  // February
    expect(nextDate.getDate()).toBe(28);  // Feb has only 28 days (2025 not leap)
  });

  test('monthly: handles month-end (31 -> 30)', () => {
    const may31 = '2025-05-31T10:00:00.000Z';
    const next = calculateNextDueDate(may31, 'monthly');
    const nextDate = new Date(next);
    expect(nextDate.getMonth()).toBe(5);  // June
    expect(nextDate.getDate()).toBe(30);  // June has only 30 days
  });

  test('yearly: adds 1 year', () => {
    const current = '2025-11-10T10:00:00.000Z';
    const next = calculateNextDueDate(current, 'yearly');
    const nextDate = new Date(next);
    expect(nextDate.getFullYear()).toBe(2026);
    expect(nextDate.getMonth()).toBe(10);  // November
    expect(nextDate.getDate()).toBe(10);
  });

  test('yearly: handles leap year (Feb 29 -> Feb 28)', () => {
    const feb29Leap = '2024-02-29T10:00:00.000Z';  // 2024 is leap year
    const next = calculateNextDueDate(feb29Leap, 'yearly');
    const nextDate = new Date(next);
    expect(nextDate.getFullYear()).toBe(2025);  // 2025 not leap year
    expect(nextDate.getMonth()).toBe(1);  // February
    expect(nextDate.getDate()).toBe(28);  // Falls back to Feb 28
  });

  test('preserves time of day across recurrence', () => {
    const current = '2025-11-10T14:30:00.000Z';
    const next = calculateNextDueDate(current, 'daily');
    const nextDate = new Date(next);
    expect(nextDate.getHours()).toBe(14);
    expect(nextDate.getMinutes()).toBe(30);
  });
});
```

#### Metadata Inheritance: `lib/__tests__/metadata-inheritance.test.ts`

```typescript
import { prepareNextInstanceData } from '../recurrence';
import { Todo } from '../db';

describe('Recurring Todo - Metadata Inheritance', () => {
  const baseTodo: Todo = {
    id: 1,
    user_id: 1,
    title: 'Test Todo',
    completed: false,
    priority: 'high',
    due_date: '2025-11-10T10:00:00.000Z',
    recurrence_pattern: 'daily',
    reminder_minutes: 60,
    last_notification_sent: '2025-11-09T10:00:00.000Z',
    created_at: '2025-11-01T10:00:00.000Z',
    updated_at: '2025-11-01T10:00:00.000Z'
  };

  test('inherits title', () => {
    const nextData = prepareNextInstanceData({ currentTodo: baseTodo });
    expect(nextData.title).toBe(baseTodo.title);
  });

  test('inherits priority', () => {
    const nextData = prepareNextInstanceData({ currentTodo: baseTodo });
    expect(nextData.priority).toBe('high');
  });

  test('inherits recurrence pattern', () => {
    const nextData = prepareNextInstanceData({ currentTodo: baseTodo });
    expect(nextData.recurrence_pattern).toBe('daily');
  });

  test('inherits reminder minutes', () => {
    const nextData = prepareNextInstanceData({ currentTodo: baseTodo });
    expect(nextData.reminder_minutes).toBe(60);
  });

  test('resets completed to false', () => {
    const completedTodo = { ...baseTodo, completed: true };
    const nextData = prepareNextInstanceData({ currentTodo: completedTodo });
    expect(nextData.completed).toBe(false);
  });

  test('resets last_notification_sent to null', () => {
    const nextData = prepareNextInstanceData({ currentTodo: baseTodo });
    expect(nextData.last_notification_sent).toBeNull();
  });

  test('calculates new due date', () => {
    const nextData = prepareNextInstanceData({ currentTodo: baseTodo });
    const originalDate = new Date(baseTodo.due_date!);
    const nextDate = new Date(nextData.due_date!);
    
    expect(nextDate.getDate()).toBe(originalDate.getDate() + 1);  // Daily = +1 day
  });

  test('throws error for non-recurring todo', () => {
    const nonRecurring = { ...baseTodo, recurrence_pattern: null };
    expect(() => {
      prepareNextInstanceData({ currentTodo: nonRecurring });
    }).toThrow('Cannot create next instance for non-recurring todo');
  });
});
```

---

## Out of Scope

The following features are **NOT** included in this PRP:

- **Custom Recurrence Patterns** → "Every 2 weeks", "Every 3 months" (future enhancement)
- **Day-of-Week Selection** → "Every Monday and Wednesday" (future enhancement)
- **Recurrence End Date** → "Repeat until Dec 31" (future enhancement)
- **Skip/Reschedule Instance** → Skip one occurrence without breaking pattern (future enhancement)
- **View All Future Instances** → See all upcoming occurrences (future enhancement)
- **Bulk Delete Recurring Series** → Delete all instances at once (future enhancement)
- **Recurring Subtasks** → Subtasks that persist across instances (covered in PRP-05, manually re-add)
- **Template Creation from Recurring** → Auto-save as template (covered in PRP-07)
- **Recurrence Statistics** → Completion rate tracking (future enhancement)
- **Timezone-Aware Recurrence** → Different timezones for recurrence (Singapore only)

---

## Success Metrics

### Functional Metrics
- [ ] 100% of recurrence patterns work correctly
- [ ] Next instances created within 200ms of completion
- [ ] 0 orphaned next instances (all have valid due dates)
- [ ] Metadata inheritance 100% accurate

### Date Calculation Metrics
- [ ] Daily recurrence: +1 day (100% accurate)
- [ ] Weekly recurrence: +7 days, same day of week (100% accurate)
- [ ] Monthly recurrence: handles month-end correctly (100% accurate)
- [ ] Yearly recurrence: handles leap year correctly (100% accurate)

### User Experience Metrics
- [ ] Recurrence badge immediately visible after creation
- [ ] Next instance appears within 1 second of completion
- [ ] No duplicate instances created
- [ ] Validation prevents invalid configurations

### Adoption Metrics
- [ ] Users create recurring todos regularly
- [ ] Recurring todos account for 15-30% of all todos
- [ ] High completion rate on recurring todos (healthy habit formation)

---

**Implementation Priority:** 🟡 **HIGH** - Core productivity feature, builds on PRP-01 and PRP-02

**Dependencies:** 
- PRP-01: Todo CRUD Operations (database, API)
- PRP-02: Priority System (priority inheritance)
- lib/timezone.ts: Singapore timezone functions

**Blocks/Enhances:**
- PRP-04: Reminders (reminder_minutes inheritance)
- PRP-06: Tags (tag inheritance via junction table)
- PRP-07: Templates (recurring templates)

---

**Last Updated:** February 5, 2026  
**Document Version:** 1.0  
**Status:** ✅ Complete and Ready for Implementation
