# PRP-02: Priority System

## Feature Overview

The Priority System enables users to categorize todos by importance using three distinct priority levels: High, Medium, and Low. Each priority level is visually distinguished with color-coded badges, and todos are automatically sorted with high-priority items appearing first. The system integrates with filtering capabilities to help users focus on urgent tasks and manage their workload effectively.

**Key Capabilities:**
- Three-level priority hierarchy (High, Medium, Low)
- Color-coded visual indicators (Red, Yellow, Blue)
- Automatic sorting by priority within each section
- Priority filtering for focused task views
- Default priority assignment (Medium) for quick task creation
- Dark mode support with adaptive colors
- Consistent priority display across all views (overdue, pending, completed)

---

## User Stories

### Primary User Persona: Priority-Driven Professional
> "As a professional managing multiple projects, I need to distinguish urgent tasks from routine ones, so I can allocate my time and energy effectively."

**User Story 1: Visual Priority Identification**
```
As a user,
I want to see color-coded badges on my todos,
So that I can quickly identify task urgency at a glance.
```

**User Story 2: Priority-Based Organization**
```
As a user,
I want high-priority todos to appear at the top of my list,
So that I focus on the most important tasks first.
```

**User Story 3: Priority Filtering**
```
As a user,
I want to filter todos by priority level,
So that I can view only urgent tasks when I'm under time pressure.
```

**User Story 4: Priority Assignment**
```
As a user,
I want to assign priority when creating a todo,
So that tasks are properly categorized from the start.
```

**User Story 5: Priority Modification**
```
As a user,
I want to change a todo's priority after creation,
So that I can adapt to changing circumstances.
```

**User Story 6: Default Priority**
```
As a user,
I want todos to default to medium priority,
So that I can quickly add tasks without making priority decisions for standard items.
```

---

## User Flow

### Flow 1: Creating a Todo with Priority Selection
```
1. User enters todo title in main input field
2. User clicks priority dropdown
3. User sees three options: "High Priority", "Medium Priority", "Low Priority"
4. User selects desired priority (or leaves as "Medium Priority" default)
5. User clicks "Add" button
6. Todo appears with color-coded priority badge
7. Todo positioned according to priority in sorted list
```

### Flow 2: Viewing Priority Badges
```
1. User views todo list
2. Each todo displays priority badge next to title:
   - High: Red badge with "HIGH" text
   - Medium: Yellow badge with "MEDIUM" text
   - Low: Blue badge with "LOW" text
3. Badges visible in all sections (Overdue, Pending, Completed)
4. Colors adapt in dark mode for visibility
```

### Flow 3: Filtering by Priority
```
1. User locates priority filter dropdown (in filter section)
2. User clicks dropdown showing: "All Priorities", "High", "Medium", "Low"
3. User selects "High" to view only high-priority todos
4. Todo list filters to show only high-priority items
5. Section counters update: "Pending (X)" shows filtered count
6. User can combine with other filters (search, tags, dates)
7. User selects "All Priorities" to clear filter
```

### Flow 4: Changing Todo Priority
```
1. User clicks "Edit" button on existing todo
2. Edit modal opens with current priority pre-selected
3. User changes priority dropdown to different level
4. User clicks "Update" button
5. Modal closes
6. Todo badge updates to new priority color
7. Todo repositions in list based on new priority
```

### Flow 5: Automatic Priority Sorting
```
1. User creates multiple todos with different priorities:
   - Todo A: Low priority
   - Todo B: High priority
   - Todo C: Medium priority
2. System automatically sorts within "Pending" section:
   - Position 1: Todo B (High)
   - Position 2: Todo C (Medium)
   - Position 3: Todo A (Low)
3. When user completes Todo B, it moves to "Completed" section
4. Pending section re-orders:
   - Position 1: Todo C (Medium)
   - Position 2: Todo A (Low)
```

### Flow 6: Combined Priority + Due Date Sorting
```
1. User has todos with same priority but different due dates:
   - Todo A: High priority, due tomorrow
   - Todo B: High priority, due next week
   - Todo C: Medium priority, due tomorrow
2. System sorts by priority first, then due date:
   - Position 1: Todo A (High, tomorrow)
   - Position 2: Todo B (High, next week)
   - Position 3: Todo C (Medium, tomorrow)
```

---

## Technical Requirements

### Database Schema

The Priority System leverages the existing `todos` table schema from PRP-01 with a focus on the `priority` field:

```sql
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT 0,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  due_date TEXT,
  recurrence_pattern TEXT CHECK(recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
  reminder_minutes INTEGER,
  last_notification_sent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for priority-based queries (combined with user_id)
CREATE INDEX idx_todos_user_priority ON todos(user_id, priority);
```

**Priority Field Specifications:**
- **Type**: TEXT with CHECK constraint
- **Allowed Values**: 'low', 'medium', 'high' (lowercase in DB)
- **Default**: 'medium'
- **Required**: Always has a value (default prevents NULL)
- **Constraint**: CHECK enforces enum-like behavior

### TypeScript Types

```typescript
// lib/db.ts
export type Priority = 'low' | 'medium' | 'high';

export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  priority: Priority;  // Always defined, never null
  due_date: string | null;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
  created_at: string;
  updated_at: string;
}

// Helper type for priority display
export interface PriorityConfig {
  value: Priority;
  label: string;
  color: {
    light: string;  // Tailwind classes for light mode
    dark: string;   // Tailwind classes for dark mode
  };
  sortOrder: number;  // 1 = highest priority
}

export const PRIORITY_CONFIGS: Record<Priority, PriorityConfig> = {
  high: {
    value: 'high',
    label: 'HIGH',
    color: {
      light: 'bg-red-100 text-red-800 border-red-300',
      dark: 'dark:bg-red-900 dark:text-red-200 dark:border-red-700'
    },
    sortOrder: 1
  },
  medium: {
    value: 'medium',
    label: 'MEDIUM',
    color: {
      light: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      dark: 'dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700'
    },
    sortOrder: 2
  },
  low: {
    value: 'low',
    label: 'LOW',
    color: {
      light: 'bg-blue-100 text-blue-800 border-blue-300',
      dark: 'dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
    },
    sortOrder: 3
  }
};
```

### Database Operations (lib/db.ts)

The Priority System uses existing CRUD operations from PRP-01 with enhanced sorting:

```typescript
export const todoDB = {
  // ... existing create, getById, update, delete methods from PRP-01

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
        CASE 
          WHEN due_date IS NULL THEN 1
          ELSE 0
        END ASC,
        due_date ASC,
        created_at DESC
    `);
    return stmt.all(userId) as Todo[];
  },

  getByUserAndPriority: (userId: number, priority: Priority): Todo[] => {
    const stmt = db.prepare(`
      SELECT * FROM todos 
      WHERE user_id = ? AND priority = ?
      ORDER BY 
        completed ASC,
        CASE 
          WHEN due_date IS NULL THEN 1
          ELSE 0
        END ASC,
        due_date ASC,
        created_at DESC
    `);
    return stmt.all(userId, priority) as Todo[];
  },

  countByPriority: (userId: number): Record<Priority, number> => {
    const stmt = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM todos
      WHERE user_id = ? AND completed = 0
      GROUP BY priority
    `);
    const results = stmt.all(userId) as Array<{ priority: Priority; count: number }>;
    
    return {
      high: results.find(r => r.priority === 'high')?.count || 0,
      medium: results.find(r => r.priority === 'medium')?.count || 0,
      low: results.find(r => r.priority === 'low')?.count || 0,
    };
  },
};
```

### API Endpoints

The Priority System doesn't require new API endpoints but uses existing ones from PRP-01 with priority support:

#### Create Todo with Priority: `POST /api/todos`
```typescript
// Request body includes priority
{
  title: "Urgent meeting",
  priority: "high",  // Optional, defaults to 'medium'
  due_date: "2025-11-10T14:00:00"
}

// Response includes priority in todo object
{
  id: 1,
  title: "Urgent meeting",
  priority: "high",
  // ... other fields
}
```

#### Update Todo Priority: `PUT /api/todos/[id]`
```typescript
// Request body to change priority only
{
  priority: "low"
}

// Full todo returned with updated priority
```

#### Get Todos with Priority Filtering: `GET /api/todos?priority=high`
```typescript
// Query parameter for filtering (client-side in this implementation)
// Server returns all todos, client filters

// Future enhancement: Add server-side filtering
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const priorityFilter = searchParams.get('priority') as Priority | null;

  let todos: Todo[];
  if (priorityFilter && ['low', 'medium', 'high'].includes(priorityFilter)) {
    todos = todoDB.getByUserAndPriority(session.userId, priorityFilter);
  } else {
    todos = todoDB.getAllByUser(session.userId);
  }

  return NextResponse.json({ todos }, { status: 200 });
}
```

### Validation Rules

```typescript
// lib/validation.ts
export function validatePriority(priority: unknown): Priority {
  if (typeof priority !== 'string') {
    return 'medium';  // Default fallback
  }

  const normalized = priority.toLowerCase();
  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized as Priority;
  }

  return 'medium';  // Invalid values default to medium
}

// Usage in API routes
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const priority = validatePriority(body.priority);
  
  const todo = todoDB.create({
    user_id: session.userId,
    title: body.title.trim(),
    priority,  // Guaranteed valid
    // ... other fields
  });
}
```

---

## UI Components

### Priority Badge Component

```typescript
// components/PriorityBadge.tsx
'use client';

import { Priority, PRIORITY_CONFIGS } from '@/lib/db';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIGS[priority];
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span 
      className={`
        inline-flex items-center font-semibold rounded-full
        ${sizeClasses[size]}
        ${config.color.light}
        ${config.color.dark}
      `}
    >
      {config.label}
    </span>
  );
}
```

### Priority Selector Component

```typescript
// components/PrioritySelector.tsx
'use client';

import { Priority, PRIORITY_CONFIGS } from '@/lib/db';

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  disabled?: boolean;
  label?: string;
}

export function PrioritySelector({ 
  value, 
  onChange, 
  disabled = false,
  label = 'Priority'
}: PrioritySelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Priority)}
        disabled={disabled}
        className="
          px-4 py-2 border rounded-lg
          bg-white dark:bg-gray-800
          border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-gray-100
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <option value="high">🔴 High Priority</option>
        <option value="medium">🟡 Medium Priority</option>
        <option value="low">🔵 Low Priority</option>
      </select>
    </div>
  );
}
```

### Priority Filter Component

```typescript
// components/PriorityFilter.tsx
'use client';

import { Priority } from '@/lib/db';

interface PriorityFilterProps {
  selectedPriority: Priority | 'all';
  onChange: (priority: Priority | 'all') => void;
}

export function PriorityFilter({ selectedPriority, onChange }: PriorityFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Priority:
      </label>
      <select
        value={selectedPriority}
        onChange={(e) => onChange(e.target.value as Priority | 'all')}
        className="
          px-3 py-1.5 border rounded-lg text-sm
          bg-white dark:bg-gray-800
          border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-gray-100
          focus:ring-2 focus:ring-blue-500
        "
      >
        <option value="all">All Priorities</option>
        <option value="high">🔴 High</option>
        <option value="medium">🟡 Medium</option>
        <option value="low">🔵 Low</option>
      </select>
    </div>
  );
}
```

### Todo List with Priority Integration

```typescript
// app/page.tsx (Main Todo Page)
'use client';

import { useState, useEffect } from 'react';
import { Todo, Priority } from '@/lib/db';
import { PriorityBadge } from '@/components/PriorityBadge';
import { PrioritySelector } from '@/components/PrioritySelector';
import { PriorityFilter } from '@/components/PriorityFilter';

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const response = await fetch('/api/todos');
    const data = await response.json();
    setTodos(data.todos);
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        priority,
      }),
    });

    if (response.ok) {
      const newTodo = await response.json();
      setTodos(prev => [...prev, newTodo]);
      setTitle('');
      setPriority('medium');  // Reset to default
    }
  };

  // Client-side filtering by priority
  const filteredTodos = priorityFilter === 'all' 
    ? todos 
    : todos.filter(todo => todo.priority === priorityFilter);

  // Organize by section
  const overdueTodos = filteredTodos.filter(todo => 
    !todo.completed && todo.due_date && new Date(todo.due_date) < new Date()
  );
  const pendingTodos = filteredTodos.filter(todo => 
    !todo.completed && (!todo.due_date || new Date(todo.due_date) >= new Date())
  );
  const completedTodos = filteredTodos.filter(todo => todo.completed);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Todos</h1>

      {/* Create Todo Form */}
      <form onSubmit={handleCreateTodo} className="mb-8 space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full px-4 py-2 border rounded-lg"
        />
        
        <div className="flex gap-4">
          <PrioritySelector 
            value={priority} 
            onChange={setPriority}
          />
          
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="mb-6">
        <PriorityFilter 
          selectedPriority={priorityFilter}
          onChange={setPriorityFilter}
        />
      </div>

      {/* Overdue Section */}
      {overdueTodos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-red-600 mb-4">
            ⚠️ Overdue ({overdueTodos.length})
          </h2>
          <div className="space-y-2">
            {overdueTodos.map(todo => (
              <TodoItem key={todo.id} todo={todo} onUpdate={fetchTodos} />
            ))}
          </div>
        </section>
      )}

      {/* Pending Section */}
      {pendingTodos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">
            Pending ({pendingTodos.length})
          </h2>
          <div className="space-y-2">
            {pendingTodos.map(todo => (
              <TodoItem key={todo.id} todo={todo} onUpdate={fetchTodos} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Section */}
      {completedTodos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">
            Completed ({completedTodos.length})
          </h2>
          <div className="space-y-2">
            {completedTodos.map(todo => (
              <TodoItem key={todo.id} todo={todo} onUpdate={fetchTodos} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

interface TodoItemProps {
  todo: Todo;
  onUpdate: () => void;
}

function TodoItem({ todo, onUpdate }: TodoItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => {/* Toggle completion */}}
        className="w-5 h-5"
      />
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : ''}`}>
            {todo.title}
          </h3>
          <PriorityBadge priority={todo.priority} size="sm" />
        </div>
        
        {todo.due_date && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Due: {new Date(todo.due_date).toLocaleString()}
          </p>
        )}
      </div>

      <button className="text-blue-600 hover:text-blue-800">Edit</button>
      <button className="text-red-600 hover:text-red-800">Delete</button>
    </div>
  );
}
```

---

## Edge Cases

### 1. Priority Validation
- **Invalid priority value**: `"urgent"` (not in enum) → Defaults to `'medium'`
- **Null priority**: Never occurs due to database DEFAULT constraint
- **Case sensitivity**: Frontend sends `"High"`, backend normalizes to `"high"`
- **Empty string priority**: Validation function returns `'medium'`

### 2. Sorting Edge Cases
- **Same priority, same due date**: Sort by `created_at DESC` (newest first)
- **Same priority, no due date**: Appears after todos with due dates
- **All same priority**: Effectively sorts by due date only
- **Changing priority during edit**: Todo re-positions in list, may jump sections

### 3. Filtering Edge Cases
- **Filter "High" with no high-priority todos**: Shows "No results" state
- **Filter applied to empty list**: All sections hidden
- **Combined filters (priority + search)**: AND logic, must match both
- **Clear filter while no todos match**: Returns to full list view

### 4. Display Edge Cases
- **Very long priority text in badge**: Handled by fixed labels ("HIGH", "MEDIUM", "LOW")
- **Dark mode color contrast**: WCAG AA compliant colors for all priorities
- **Priority badge in completed todo**: Shows with reduced opacity/muted colors
- **Mobile viewport badge wrapping**: Badges use `inline-flex` to prevent breaking

### 5. Database Edge Cases
- **Migration from no priority field**: ALTER TABLE adds DEFAULT 'medium' to existing rows
- **Direct database edit with invalid priority**: CHECK constraint prevents insertion
- **Bulk import with mixed priority formats**: Validation normalizes all values
- **Priority field deleted in malformed request**: Database DEFAULT fills in 'medium'

### 6. Performance Edge Cases
- **1000+ todos with priority sorting**: Indexed query performs well (< 50ms)
- **Rapid priority filter changes**: Debouncing not needed, instant client-side filter
- **Priority change causing re-sort of 100+ todos**: Client-side sort is fast, no flicker
- **Concurrent priority updates**: Last write wins, optimistic UI handles gracefully

### 7. User Experience Edge Cases
- **User creates 50 high-priority todos**: All appear at top, may need education on priority usage
- **User filters by priority, then completes last item**: Section auto-hides, clear "No results"
- **Priority badge too small on mobile**: Responsive sizing with `text-xs` on small screens
- **Color-blind users**: Icons/emojis supplement colors (🔴🟡🔵)

---

## Acceptance Criteria

### ✅ Priority Assignment
- [ ] Can create todo with High priority
- [ ] Can create todo with Medium priority (default)
- [ ] Can create todo with Low priority
- [ ] Creating todo without selecting priority defaults to Medium
- [ ] Priority dropdown shows all three options with clear labels
- [ ] Priority dropdown includes emoji indicators (🔴🟡🔵)
- [ ] Invalid priority values default to Medium

### ✅ Visual Display
- [ ] High priority shows red badge with "HIGH" text
- [ ] Medium priority shows yellow badge with "MEDIUM" text
- [ ] Low priority shows blue badge with "LOW" text
- [ ] Priority badges visible in Overdue section
- [ ] Priority badges visible in Pending section
- [ ] Priority badges visible in Completed section
- [ ] Badges positioned consistently (next to title)
- [ ] Badge colors adapt correctly in dark mode
- [ ] Badge size appropriate and readable
- [ ] Badges use rounded-full shape for visual appeal

### ✅ Sorting Behavior
- [ ] High priority todos appear before Medium within same section
- [ ] Medium priority todos appear before Low within same section
- [ ] Todos with same priority sorted by due date (earliest first)
- [ ] Todos with same priority and no due date appear last
- [ ] Todos with same priority and same due date sorted by creation time (newest first)
- [ ] Sorting applies to Overdue section
- [ ] Sorting applies to Pending section
- [ ] Sorting applies to Completed section
- [ ] Changing priority causes immediate re-sort and repositioning

### ✅ Priority Filtering
- [ ] Priority filter dropdown shows "All Priorities", "High", "Medium", "Low"
- [ ] Selecting "High" shows only high-priority todos
- [ ] Selecting "Medium" shows only medium-priority todos
- [ ] Selecting "Low" shows only low-priority todos
- [ ] Selecting "All Priorities" shows all todos
- [ ] Filter applies to all sections (Overdue, Pending, Completed)
- [ ] Section counters update based on filter: "Pending (X)"
- [ ] Empty filtered result shows "No results" state
- [ ] Priority filter combines with search filter (AND logic)
- [ ] Priority filter combines with tag filter (AND logic)
- [ ] Filter state persists during page interactions

### ✅ Editing Priority
- [ ] Edit modal shows current priority pre-selected
- [ ] Can change priority to different level
- [ ] Updated priority saves correctly to database
- [ ] Priority badge updates after saving
- [ ] Todo repositions in list after priority change
- [ ] Cancel button preserves original priority
- [ ] No visual glitches during priority update

### ✅ Database Integrity
- [ ] Priority field always has a value (never NULL)
- [ ] Only valid priorities ('low', 'medium', 'high') stored
- [ ] Priority defaults to 'medium' if not specified
- [ ] CHECK constraint prevents invalid values
- [ ] Priority field indexed for query performance
- [ ] Migration adds priority to existing todos as 'medium'

### ✅ API Behavior
- [ ] POST /api/todos accepts priority in request body
- [ ] POST /api/todos defaults to 'medium' if priority omitted
- [ ] PUT /api/todos/[id] allows priority update
- [ ] GET /api/todos returns todos with priority sorted correctly
- [ ] Invalid priority in request normalized to 'medium'
- [ ] Priority included in all todo response objects

### ✅ Dark Mode Support
- [ ] High priority badge readable in dark mode
- [ ] Medium priority badge readable in dark mode
- [ ] Low priority badge readable in dark mode
- [ ] Priority dropdown styled correctly in dark mode
- [ ] Filter dropdown styled correctly in dark mode
- [ ] All priority colors meet WCAG AA contrast requirements

### ✅ Accessibility
- [ ] Priority selector has proper label
- [ ] Priority badges use semantic HTML
- [ ] Screen readers announce priority level
- [ ] Keyboard navigation works for priority selector
- [ ] Color is not the only indicator (text labels present)
- [ ] Emoji indicators supplement color for color-blind users

---

## Testing Requirements

### E2E Tests (Playwright)

#### Test File: `tests/02-priority-system.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { registerUser, createTodo } from './helpers';

test.describe('Priority System', () => {
  test.beforeEach(async ({ page }) => {
    await registerUser(page, `user-${Date.now()}`);
  });

  test('should create todo with default medium priority', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[placeholder*="What needs to be done"]', 'Default priority task');
    // Don't change priority dropdown (should default to medium)
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Default priority task')).toBeVisible();
    await expect(page.locator('text=MEDIUM')).toBeVisible();
  });

  test('should create todo with high priority', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[placeholder*="What needs to be done"]', 'Urgent task');
    await page.selectOption('select[name="priority"]', 'high');
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Urgent task')).toBeVisible();
    const highBadge = page.locator('text=HIGH');
    await expect(highBadge).toBeVisible();
    
    // Check red color (bg-red-100 in light mode)
    await expect(highBadge).toHaveClass(/bg-red-100/);
  });

  test('should create todo with low priority', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[placeholder*="What needs to be done"]', 'Low priority task');
    await page.selectOption('select[name="priority"]', 'low');
    await page.click('button:has-text("Add")');

    await expect(page.locator('text=Low priority task')).toBeVisible();
    const lowBadge = page.locator('text=LOW');
    await expect(lowBadge).toBeVisible();
    await expect(lowBadge).toHaveClass(/bg-blue-100/);
  });

  test('should sort todos by priority', async ({ page }) => {
    await page.goto('/');
    
    // Create in reverse priority order
    await createTodo(page, 'Low priority task', { priority: 'low' });
    await createTodo(page, 'High priority task', { priority: 'high' });
    await createTodo(page, 'Medium priority task', { priority: 'medium' });

    // Get all todo titles in order
    const todos = page.locator('.todo-item h3');
    
    // Should be sorted: High, Medium, Low
    await expect(todos.nth(0)).toHaveText('High priority task');
    await expect(todos.nth(1)).toHaveText('Medium priority task');
    await expect(todos.nth(2)).toHaveText('Low priority task');
  });

  test('should filter todos by high priority', async ({ page }) => {
    await page.goto('/');
    
    await createTodo(page, 'High task', { priority: 'high' });
    await createTodo(page, 'Medium task', { priority: 'medium' });
    await createTodo(page, 'Low task', { priority: 'low' });

    // Apply priority filter
    await page.selectOption('select[name="priority-filter"]', 'high');

    // Only high priority todo visible
    await expect(page.locator('text=High task')).toBeVisible();
    await expect(page.locator('text=Medium task')).not.toBeVisible();
    await expect(page.locator('text=Low task')).not.toBeVisible();
  });

  test('should filter todos by medium priority', async ({ page }) => {
    await page.goto('/');
    
    await createTodo(page, 'High task', { priority: 'high' });
    await createTodo(page, 'Medium task', { priority: 'medium' });
    await createTodo(page, 'Low task', { priority: 'low' });

    await page.selectOption('select[name="priority-filter"]', 'medium');

    await expect(page.locator('text=High task')).not.toBeVisible();
    await expect(page.locator('text=Medium task')).toBeVisible();
    await expect(page.locator('text=Low task')).not.toBeVisible();
  });

  test('should clear priority filter', async ({ page }) => {
    await page.goto('/');
    
    await createTodo(page, 'High task', { priority: 'high' });
    await createTodo(page, 'Low task', { priority: 'low' });

    // Apply filter
    await page.selectOption('select[name="priority-filter"]', 'high');
    await expect(page.locator('text=Low task')).not.toBeVisible();

    // Clear filter
    await page.selectOption('select[name="priority-filter"]', 'all');
    
    // All todos visible again
    await expect(page.locator('text=High task')).toBeVisible();
    await expect(page.locator('text=Low task')).toBeVisible();
  });

  test('should change todo priority via edit', async ({ page }) => {
    await page.goto('/');
    
    await createTodo(page, 'Task to edit', { priority: 'low' });
    await expect(page.locator('text=LOW')).toBeVisible();

    // Edit and change priority
    await page.click('button:has-text("Edit")');
    await page.selectOption('select[name="priority"]', 'high');
    await page.click('button:has-text("Update")');

    // Priority badge updated
    await expect(page.locator('text=LOW')).not.toBeVisible();
    await expect(page.locator('text=HIGH')).toBeVisible();
  });

  test('should sort by priority then due date', async ({ page }) => {
    await page.goto('/');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Create with same priority, different due dates
    await createTodo(page, 'High next week', { 
      priority: 'high', 
      dueDate: nextWeek 
    });
    await createTodo(page, 'High tomorrow', { 
      priority: 'high', 
      dueDate: tomorrow 
    });
    await createTodo(page, 'Medium tomorrow', { 
      priority: 'medium', 
      dueDate: tomorrow 
    });

    const todos = page.locator('.todo-item h3');
    
    // High priority with earliest date first
    await expect(todos.nth(0)).toHaveText('High tomorrow');
    await expect(todos.nth(1)).toHaveText('High next week');
    await expect(todos.nth(2)).toHaveText('Medium tomorrow');
  });

  test('should display priority badges in all sections', async ({ page }) => {
    await page.goto('/');
    
    // Create and complete high priority todo
    await createTodo(page, 'Completed high', { priority: 'high' });
    await page.click('input[type="checkbox"]');

    // Check badge in completed section
    const completedSection = page.locator('text=Completed').locator('..');
    await expect(completedSection.locator('text=HIGH')).toBeVisible();
  });

  test('should combine priority filter with search', async ({ page }) => {
    await page.goto('/');
    
    await createTodo(page, 'High meeting task', { priority: 'high' });
    await createTodo(page, 'High report task', { priority: 'high' });
    await createTodo(page, 'Low meeting task', { priority: 'low' });

    // Apply both filters
    await page.fill('input[placeholder*="Search"]', 'meeting');
    await page.selectOption('select[name="priority-filter"]', 'high');

    // Only "High meeting task" should be visible
    await expect(page.locator('text=High meeting task')).toBeVisible();
    await expect(page.locator('text=High report task')).not.toBeVisible();
    await expect(page.locator('text=Low meeting task')).not.toBeVisible();
  });

  test('should update section counters when filtering by priority', async ({ page }) => {
    await page.goto('/');
    
    await createTodo(page, 'High 1', { priority: 'high' });
    await createTodo(page, 'High 2', { priority: 'high' });
    await createTodo(page, 'Low 1', { priority: 'low' });

    // Initial count
    await expect(page.locator('text=Pending (3)')).toBeVisible();

    // Filter by high
    await page.selectOption('select[name="priority-filter"]', 'high');
    await expect(page.locator('text=Pending (2)')).toBeVisible();
  });
});
```

#### Updated Helper Functions: `tests/helpers.ts`

```typescript
import { Page } from '@playwright/test';
import { Priority } from '@/lib/db';

export async function createTodo(page: Page, title: string, options?: {
  priority?: Priority;
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

#### Priority Validation: `lib/__tests__/validation.test.ts`

```typescript
import { validatePriority } from '../validation';

describe('Priority Validation', () => {
  test('should accept valid lowercase priorities', () => {
    expect(validatePriority('high')).toBe('high');
    expect(validatePriority('medium')).toBe('medium');
    expect(validatePriority('low')).toBe('low');
  });

  test('should normalize uppercase priorities', () => {
    expect(validatePriority('HIGH')).toBe('high');
    expect(validatePriority('MEDIUM')).toBe('medium');
    expect(validatePriority('LOW')).toBe('low');
  });

  test('should normalize mixed case priorities', () => {
    expect(validatePriority('High')).toBe('high');
    expect(validatePriority('MeDiUm')).toBe('medium');
  });

  test('should default invalid strings to medium', () => {
    expect(validatePriority('urgent')).toBe('medium');
    expect(validatePriority('critical')).toBe('medium');
    expect(validatePriority('')).toBe('medium');
  });

  test('should default non-string types to medium', () => {
    expect(validatePriority(123)).toBe('medium');
    expect(validatePriority(null)).toBe('medium');
    expect(validatePriority(undefined)).toBe('medium');
    expect(validatePriority({})).toBe('medium');
  });
});
```

#### Priority Sorting: `lib/__tests__/sorting.test.ts`

```typescript
import { Todo } from '../db';

function sortTodos(todos: Todo[]): Todo[] {
  return todos.sort((a, b) => {
    // Completed status
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Priority
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    // Due date
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;
    if (a.due_date && b.due_date) {
      const dateA = new Date(a.due_date).getTime();
      const dateB = new Date(b.due_date).getTime();
      if (dateA !== dateB) return dateA - dateB;
    }

    // Created date
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

describe('Todo Sorting with Priority', () => {
  const baseTodo: Partial<Todo> = {
    user_id: 1,
    title: 'Test',
    completed: false,
    due_date: null,
    recurrence_pattern: null,
    reminder_minutes: null,
    last_notification_sent: null,
    created_at: '2025-11-01T10:00:00',
    updated_at: '2025-11-01T10:00:00'
  };

  test('should sort by priority (high > medium > low)', () => {
    const todos: Todo[] = [
      { ...baseTodo, id: 1, priority: 'low' } as Todo,
      { ...baseTodo, id: 2, priority: 'high' } as Todo,
      { ...baseTodo, id: 3, priority: 'medium' } as Todo,
    ];

    const sorted = sortTodos([...todos]);
    
    expect(sorted[0].priority).toBe('high');
    expect(sorted[1].priority).toBe('medium');
    expect(sorted[2].priority).toBe('low');
  });

  test('should sort by due date within same priority', () => {
    const todos: Todo[] = [
      { ...baseTodo, id: 1, priority: 'high', due_date: '2025-11-10T10:00:00' } as Todo,
      { ...baseTodo, id: 2, priority: 'high', due_date: '2025-11-05T10:00:00' } as Todo,
      { ...baseTodo, id: 3, priority: 'high', due_date: '2025-11-15T10:00:00' } as Todo,
    ];

    const sorted = sortTodos([...todos]);
    
    expect(sorted[0].id).toBe(2);  // Nov 5
    expect(sorted[1].id).toBe(1);  // Nov 10
    expect(sorted[2].id).toBe(3);  // Nov 15
  });

  test('should place todos with due dates before those without', () => {
    const todos: Todo[] = [
      { ...baseTodo, id: 1, priority: 'high', due_date: null } as Todo,
      { ...baseTodo, id: 2, priority: 'high', due_date: '2025-11-10T10:00:00' } as Todo,
    ];

    const sorted = sortTodos([...todos]);
    
    expect(sorted[0].id).toBe(2);  // With due date
    expect(sorted[1].id).toBe(1);  // Without due date
  });

  test('should place incomplete before completed regardless of priority', () => {
    const todos: Todo[] = [
      { ...baseTodo, id: 1, priority: 'low', completed: false } as Todo,
      { ...baseTodo, id: 2, priority: 'high', completed: true } as Todo,
    ];

    const sorted = sortTodos([...todos]);
    
    expect(sorted[0].completed).toBe(false);
    expect(sorted[1].completed).toBe(true);
  });
});
```

---

## Out of Scope

The following features are **NOT** included in this PRP and will be covered in separate PRPs or future enhancements:

- **Custom Priority Levels** → Users cannot define their own priority levels (fixed to 3)
- **Priority-Based Reminders** → Different reminder times based on priority (future enhancement)
- **Priority Statistics** → Analytics on priority distribution (future enhancement)
- **Automatic Priority Suggestion** → AI-suggested priorities based on keywords (future enhancement)
- **Priority Color Customization** → Users cannot change priority colors (future enhancement)
- **Recurring Todo Priority Inheritance** → Covered in PRP-03
- **Template Priority Settings** → Covered in PRP-07
- **Priority in Calendar View** → Covered in PRP-10
- **Priority-Based Notifications** → Different notification styles per priority (future enhancement)
- **Sub-priorities** → 1A, 1B, 2A, etc. (not supported)
- **Server-Side Priority Filtering** → Client-side filtering sufficient for current scale

---

## Success Metrics

### Functional Metrics
- [ ] 100% of todos have a valid priority (high/medium/low)
- [ ] Priority badges display correctly in all views
- [ ] Sorting by priority works consistently
- [ ] Priority filtering shows accurate results
- [ ] 0 priority-related bugs in production

### Performance Metrics
- [ ] Priority sorting adds < 10ms to query time
- [ ] Client-side priority filtering < 5ms for 1000 todos
- [ ] Priority badge rendering adds < 2KB to page weight
- [ ] No layout shift when priority badges render

### User Experience Metrics
- [ ] Priority indicators visible and recognizable at a glance
- [ ] Color contrast meets WCAG AA (4.5:1) in both modes
- [ ] Default to medium reduces friction for quick adds
- [ ] Filter transitions smooth without flicker
- [ ] Priority changes immediate and obvious

### Adoption Metrics
- [ ] Users actively use all three priority levels
- [ ] Priority filter used regularly (tracked via analytics)
- [ ] Priority distribution: ~20% high, ~50% medium, ~30% low (healthy mix)
- [ ] Priority changes indicate adaptive task management

---

**Implementation Priority:** 🟡 **HIGH** - Core organizational feature, depends on PRP-01

**Dependencies:** 
- PRP-01: Todo CRUD Operations (database schema, API routes)

**Blocks:**
- None (can be implemented independently after PRP-01)
- Enhances: PRP-08 (Search & Filtering), PRP-10 (Calendar View)

---

**Last Updated:** February 5, 2026  
**Document Version:** 1.0  
**Status:** ✅ Complete and Ready for Implementation
