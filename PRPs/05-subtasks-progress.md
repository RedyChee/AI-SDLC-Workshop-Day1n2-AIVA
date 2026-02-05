# PRP-05: Subtasks & Progress Tracking

## Feature Overview

The Subtasks & Progress Tracking feature enables users to break down complex todos into smaller, manageable checklist items with real-time visual progress indicators. Each todo can have unlimited subtasks that maintain their order, show completion status, and automatically calculate progress percentages with visual progress bars.

### Core Functionality
- **Checklist Functionality**: Create, complete, uncomplete, and delete subtasks
- **Visual Progress Bars**: Real-time blue progress bar showing 0-100% completion
- **Position Management**: Subtasks maintain creation order via position field
- **Cascade Delete Behavior**: All subtasks automatically deleted when parent todo deleted
- **Expand/Collapse UI**: Toggle subtask visibility while preserving progress indicators
- **Independent Completion**: Subtask completion doesn't automatically mark parent complete
- **Text Indicators**: "X/Y subtasks" format showing completed/total counts

### User Value
- Break large projects into actionable steps
- Track progress visually at a glance
- Maintain focus with ordered checklists
- Monitor multi-step task completion
- Organize complex workflows efficiently

---

## User Stories

### Story 1: Create Subtasks for Complex Todo
**As a** project manager  
**I want to** add subtasks to a complex todo  
**So that** I can break it down into manageable steps

**Acceptance Criteria:**
- "▶ Subtasks" button visible on every todo item
- Clicking button expands subtask section
- Input field and "Add" button appear
- Can press Enter or click "Add" to create subtask
- Subtask appears immediately in list below input
- Can add unlimited subtasks to single todo
- Button changes to "▼ Subtasks" when expanded

### Story 2: Mark Subtasks Complete
**As a** user working through a checklist  
**I want to** mark subtasks as complete  
**So that** I can track my progress

**Acceptance Criteria:**
- Each subtask has checkbox on left side
- Clicking checkbox marks subtask complete
- Completed subtasks show with strikethrough text
- Progress bar updates immediately
- Text indicator updates (e.g., "2/5 subtasks")
- Can click again to uncomplete subtask
- Parent todo remains incomplete even if all subtasks complete

### Story 3: View Progress at a Glance
**As a** user scanning my todo list  
**I want to** see progress bars for todos with subtasks  
**So that** I know how far along I am without expanding

**Acceptance Criteria:**
- Progress bar visible below todo title
- Bar shows blue fill from 0% to 100%
- Percentage calculated as (completed / total) * 100
- Bar visible even when subtasks collapsed
- Text shows "X/Y subtasks" format
- 0 subtasks shows no progress bar
- All subtasks complete shows 100% fill

### Story 4: Reorder Subtasks Logically
**As a** user creating a sequential checklist  
**I want to** have subtasks appear in creation order  
**So that** I can follow steps logically

**Acceptance Criteria:**
- Subtasks maintain creation order (position field)
- First created subtask has position 0
- Each new subtask increments position
- Display order matches position ascending
- No manual drag-and-drop needed (future enhancement)
- Position persists across sessions

### Story 5: Delete Individual Subtasks
**As a** user refining my checklist  
**I want to** delete individual subtasks  
**So that** I can remove irrelevant or completed steps

**Acceptance Criteria:**
- Each subtask has "✕" delete button on right side
- Clicking "✕" immediately removes subtask
- Progress bar updates after deletion
- Text indicator updates count
- No confirmation prompt (can undo via re-creation)
- Deleted subtask doesn't affect other positions

### Story 6: Collapse Subtasks to Reduce Clutter
**As a** user with many todos  
**I want to** collapse subtask sections  
**So that** I can reduce visual clutter

**Acceptance Criteria:**
- Clicking "▼ Subtasks" collapses section
- Subtask list hidden when collapsed
- Progress bar and text indicator remain visible
- Button changes to "▶ Subtasks" when collapsed
- State persists per todo (via local component state)
- Can expand again to view/edit subtasks

### Story 7: Auto-Delete Subtasks with Parent Todo
**As a** user deleting completed projects  
**I want to** have subtasks automatically deleted with parent  
**So that** I don't have orphaned data

**Acceptance Criteria:**
- Deleting todo triggers CASCADE delete in database
- All associated subtasks removed automatically
- No orphaned subtasks in database
- No manual cleanup required
- Progress indicators disappear with todo
- Database foreign key constraint enforces cascade

### Story 8: Search Within Subtask Titles
**As a** user with many todos  
**I want to** search within subtask titles  
**So that** I can find todos containing specific checklist items

**Acceptance Criteria:**
- Search query matches subtask titles (future enhancement via PRP-08)
- Parent todo appears in results if subtask matches
- Subtask section auto-expands to show matching subtask
- Highlight matching text within subtask title
- Works with existing text search functionality

---

## User Flow

### Flow 1: Creating First Subtask
1. User has todo "Launch marketing campaign"
2. User clicks "▶ Subtasks" button on todo item
3. Subtask section expands below todo
4. Input field with placeholder "Add a subtask..." appears
5. User types "Design landing page"
6. User presses Enter (or clicks "Add")
7. POST request to `/api/todos/[id]/subtasks`
8. Subtask created with position=0
9. Subtask appears in list with checkbox and delete button
10. Progress bar appears showing "0/1 subtasks" (0%)
11. Input field clears, ready for next subtask

### Flow 2: Adding Multiple Subtasks
1. User continues from Flow 1
2. User types "Write ad copy" and presses Enter
3. Subtask created with position=1
4. User types "Set up email sequence" and presses Enter
5. Subtask created with position=2
6. Subtask list now shows 3 items in order:
   - ☐ Design landing page
   - ☐ Write ad copy
   - ☐ Set up email sequence
7. Progress bar shows "0/3 subtasks" (0%)

### Flow 3: Completing Subtasks and Watching Progress
1. User completes first subtask "Design landing page"
2. User clicks checkbox next to first subtask
3. PUT request to `/api/todos/[todoId]/subtasks/[subtaskId]`
4. Checkbox fills, text shows strikethrough
5. Progress bar updates to "1/3 subtasks" (33%)
6. Blue fill animates to 33% width
7. User completes second subtask
8. Progress updates to "2/3 subtasks" (67%)
9. User completes third subtask
10. Progress shows "3/3 subtasks" (100%)
11. Parent todo still shows as incomplete (user must explicitly complete)

### Flow 4: Uncompleting a Subtask
1. User realizes "Write ad copy" needs revision
2. User clicks filled checkbox next to that subtask
3. PUT request updates completed=false
4. Checkbox empties, strikethrough removed
5. Progress updates to "2/3 subtasks" (67%)
6. Blue fill animates back to 67% width

### Flow 5: Deleting a Subtask
1. User decides "Set up email sequence" is no longer needed
2. User hovers over subtask, "✕" button visible
3. User clicks "✕" button
4. DELETE request to `/api/todos/[todoId]/subtasks/[subtaskId]`
5. Subtask immediately removed from list
6. Remaining subtasks stay in same position:
   - ☑ Design landing page (position=0)
   - ☐ Write ad copy (position=1)
7. Progress updates to "1/2 subtasks" (50%)

### Flow 6: Collapsing Subtasks
1. User has completed checklist review
2. User clicks "▼ Subtasks" button
3. Subtask list smoothly collapses (CSS transition)
4. Only progress bar and "▶ Subtasks" button remain visible
5. Progress shows "1/2 subtasks" (50%)
6. Component state updates: `isExpanded = false`
7. User can re-expand anytime by clicking "▶ Subtasks"

### Flow 7: Deleting Parent Todo (Cascade Delete)
1. User completes all work on "Launch marketing campaign"
2. User marks parent todo as complete
3. Later, user decides to delete completed todo
4. User clicks "Delete" on parent todo
5. DELETE request to `/api/todos/[id]`
6. Database CASCADE constraint triggers
7. All 2 subtasks automatically deleted
8. Parent todo removed from UI
9. No orphaned subtasks remain in database

### Flow 8: Viewing Progress Without Expanding
1. User scrolls through todo list
2. User sees "Quarterly planning" todo with collapsed subtasks
3. Progress bar visible: "7/10 subtasks" (70%)
4. Blue fill shows 70% width visually
5. User understands progress without expanding
6. User decides to come back later (most work done)

### Flow 9: Creating Todo from Template with Subtasks
1. User creates template "Weekly review" with 5 subtask patterns (PRP-07)
2. User instantiates template
3. New todo created with 5 subtasks (positions 0-4)
4. All subtasks start uncompleted
5. Progress shows "0/5 subtasks" (0%)
6. User works through checklist week after week

---

## Technical Requirements

### Database Schema

#### New `subtasks` Table

```sql
CREATE TABLE IF NOT EXISTS subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  todo_id INTEGER NOT NULL,
  title TEXT NOT NULL CHECK(length(trim(title)) > 0),
  completed BOOLEAN NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);

-- Index for efficient queries by todo
CREATE INDEX idx_subtasks_todo_id ON subtasks(todo_id, position);
```

**Column Details:**
- `id`: Primary key, auto-increment
- `todo_id`: Foreign key to `todos.id` with CASCADE delete
- `title`: Subtask text, required, must be non-empty trimmed
- `completed`: Boolean, default false (0)
- `position`: Integer for ordering, default 0
- `created_at`: ISO8601 timestamp (Singapore timezone)
- `updated_at`: ISO8601 timestamp (Singapore timezone)

**Foreign Key Cascade:**
- `ON DELETE CASCADE` ensures all subtasks deleted when parent todo deleted
- Enforced at database level, no application logic needed

**Index:**
- Composite index on (todo_id, position) for efficient queries
- Supports filtering by todo_id and sorting by position

### TypeScript Types

#### `lib/db.ts` Updates

```typescript
// Subtask interface
export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

// Subtask creation input
export interface CreateSubtaskInput {
  todo_id: number;
  title: string;
  position: number;
}

// Subtask update input
export interface UpdateSubtaskInput {
  title?: string;
  completed?: boolean;
}

// Progress calculation result
export interface SubtaskProgress {
  total: number;
  completed: number;
  percentage: number;
}

// Todo extended with subtasks (for GET responses)
export interface TodoWithSubtasks extends Todo {
  subtasks: Subtask[];
  progress: SubtaskProgress;
}
```

#### Database Interface (`lib/db.ts`)

```typescript
// Validation
export function validateSubtaskTitle(title: any): string | null {
  if (typeof title !== 'string') return null;
  const trimmed = title.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 500) return null; // Max length
  return trimmed;
}

// Calculate progress for a todo's subtasks
export function calculateProgress(subtasks: Subtask[]): SubtaskProgress {
  const total = subtasks.length;
  const completed = subtasks.filter(st => st.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  return { total, completed, percentage };
}

// Subtask database interface
export const subtaskDB = {
  // Create subtask
  create(input: CreateSubtaskInput): Subtask {
    const { getSingaporeNow, toSingaporeISO } = require('./timezone');
    const now = toSingaporeISO(getSingaporeNow());
    
    const title = validateSubtaskTitle(input.title);
    if (!title) {
      throw new Error('Invalid subtask title');
    }
    
    const query = `
      INSERT INTO subtasks (todo_id, title, completed, position, created_at, updated_at)
      VALUES (?, ?, 0, ?, ?, ?)
    `;
    
    const result = db.prepare(query).run(
      input.todo_id,
      title,
      input.position,
      now,
      now
    );
    
    return this.getById(Number(result.lastInsertRowid));
  },
  
  // Get subtask by ID
  getById(id: number): Subtask {
    const query = 'SELECT * FROM subtasks WHERE id = ?';
    const subtask = db.prepare(query).get(id) as Subtask | undefined;
    if (!subtask) {
      throw new Error('Subtask not found');
    }
    return subtask;
  },
  
  // Get all subtasks for a todo
  getByTodoId(todoId: number): Subtask[] {
    const query = `
      SELECT * FROM subtasks 
      WHERE todo_id = ? 
      ORDER BY position ASC, created_at ASC
    `;
    return db.prepare(query).all(todoId) as Subtask[];
  },
  
  // Update subtask
  update(id: number, updates: UpdateSubtaskInput): Subtask {
    const { getSingaporeNow, toSingaporeISO } = require('./timezone');
    const now = toSingaporeISO(getSingaporeNow());
    
    const existing = this.getById(id);
    
    // Validate title if provided
    let title = existing.title;
    if (updates.title !== undefined) {
      const validated = validateSubtaskTitle(updates.title);
      if (!validated) {
        throw new Error('Invalid subtask title');
      }
      title = validated;
    }
    
    const completed = updates.completed !== undefined 
      ? updates.completed 
      : existing.completed;
    
    const query = `
      UPDATE subtasks 
      SET title = ?, completed = ?, updated_at = ?
      WHERE id = ?
    `;
    
    db.prepare(query).run(title, completed ? 1 : 0, now, id);
    
    return this.getById(id);
  },
  
  // Delete subtask
  delete(id: number): void {
    const query = 'DELETE FROM subtasks WHERE id = ?';
    db.prepare(query).run(id);
  },
  
  // Delete all subtasks for a todo (called manually or via CASCADE)
  deleteByTodoId(todoId: number): void {
    const query = 'DELETE FROM subtasks WHERE todo_id = ?';
    db.prepare(query).run(todoId);
  },
  
  // Get next position for new subtask
  getNextPosition(todoId: number): number {
    const query = `
      SELECT COALESCE(MAX(position), -1) + 1 as next_position 
      FROM subtasks 
      WHERE todo_id = ?
    `;
    const result = db.prepare(query).get(todoId) as { next_position: number };
    return result.next_position;
  },
  
  // Count subtasks for a todo
  countByTodoId(todoId: number): number {
    const query = 'SELECT COUNT(*) as count FROM subtasks WHERE todo_id = ?';
    const result = db.prepare(query).get(todoId) as { count: number };
    return result.count;
  },
};
```

### API Endpoints

#### `POST /api/todos/[id]/subtasks`
Create a new subtask for a todo.

**Request:**
```typescript
{
  title: string;
}
```

**Response:**
```typescript
{
  subtask: Subtask;
  progress: SubtaskProgress;
}
```

**Implementation:**
```typescript
// app/api/todos/[id]/subtasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, subtaskDB, calculateProgress } from '@/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const { id } = await context.params;
  const todoId = parseInt(id, 10);
  
  try {
    // Verify todo exists and belongs to user
    const todo = todoDB.getById(todoId, session.userId);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Get next position
    const position = subtaskDB.getNextPosition(todoId);
    
    // Create subtask
    const subtask = subtaskDB.create({
      todo_id: todoId,
      title: body.title,
      position,
    });
    
    // Calculate updated progress
    const allSubtasks = subtaskDB.getByTodoId(todoId);
    const progress = calculateProgress(allSubtasks);
    
    return NextResponse.json({ subtask, progress }, { status: 201 });
  } catch (error: any) {
    console.error('Create subtask error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subtask' },
      { status: 400 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const { id } = await context.params;
  const todoId = parseInt(id, 10);
  
  try {
    // Verify todo exists and belongs to user
    const todo = todoDB.getById(todoId, session.userId);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    
    // Get all subtasks
    const subtasks = subtaskDB.getByTodoId(todoId);
    const progress = calculateProgress(subtasks);
    
    return NextResponse.json({ subtasks, progress });
  } catch (error) {
    console.error('Get subtasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subtasks' },
      { status: 500 }
    );
  }
}
```

#### `PUT /api/todos/[id]/subtasks/[subtaskId]`
Update a subtask (title or completed status).

**Request:**
```typescript
{
  title?: string;
  completed?: boolean;
}
```

**Response:**
```typescript
{
  subtask: Subtask;
  progress: SubtaskProgress;
}
```

**Implementation:**
```typescript
// app/api/todos/[id]/subtasks/[subtaskId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, subtaskDB, calculateProgress } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const { id, subtaskId } = await context.params;
  const todoId = parseInt(id, 10);
  const subtaskIdNum = parseInt(subtaskId, 10);
  
  try {
    // Verify todo exists and belongs to user
    const todo = todoDB.getById(todoId, session.userId);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    
    // Verify subtask exists and belongs to this todo
    const existingSubtask = subtaskDB.getById(subtaskIdNum);
    if (existingSubtask.todo_id !== todoId) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Update subtask
    const subtask = subtaskDB.update(subtaskIdNum, {
      title: body.title,
      completed: body.completed,
    });
    
    // Calculate updated progress
    const allSubtasks = subtaskDB.getByTodoId(todoId);
    const progress = calculateProgress(allSubtasks);
    
    return NextResponse.json({ subtask, progress });
  } catch (error: any) {
    console.error('Update subtask error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update subtask' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const { id, subtaskId } = await context.params;
  const todoId = parseInt(id, 10);
  const subtaskIdNum = parseInt(subtaskId, 10);
  
  try {
    // Verify todo exists and belongs to user
    const todo = todoDB.getById(todoId, session.userId);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    
    // Verify subtask exists and belongs to this todo
    const existingSubtask = subtaskDB.getById(subtaskIdNum);
    if (existingSubtask.todo_id !== todoId) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }
    
    // Delete subtask
    subtaskDB.delete(subtaskIdNum);
    
    // Calculate updated progress
    const allSubtasks = subtaskDB.getByTodoId(todoId);
    const progress = calculateProgress(allSubtasks);
    
    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Delete subtask error:', error);
    return NextResponse.json(
      { error: 'Failed to delete subtask' },
      { status: 500 }
    );
  }
}
```

#### Update `GET /api/todos`
Include subtasks and progress in todo list response.

**Response:**
```typescript
{
  todos: TodoWithSubtasks[];
}
```

**Implementation:**
```typescript
// Modify existing GET /api/todos to include subtasks
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const todos = todoDB.getAllByUser(session.userId);
    
    // Attach subtasks and progress to each todo
    const todosWithSubtasks = todos.map(todo => {
      const subtasks = subtaskDB.getByTodoId(todo.id);
      const progress = calculateProgress(subtasks);
      return { ...todo, subtasks, progress };
    });
    
    return NextResponse.json({ todos: todosWithSubtasks });
  } catch (error) {
    console.error('Get todos error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}
```

### Frontend Implementation

#### Subtask Section Component

```typescript
// components/SubtaskSection.tsx
import { useState } from 'react';
import { Subtask, SubtaskProgress } from '@/lib/db';
import { SubtaskItem } from './SubtaskItem';
import { ProgressBar } from './ProgressBar';

interface SubtaskSectionProps {
  todoId: number;
  subtasks: Subtask[];
  progress: SubtaskProgress;
  onUpdate: () => void;
}

export function SubtaskSection({ 
  todoId, 
  subtasks, 
  progress, 
  onUpdate 
}: SubtaskSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreate = async () => {
    if (!newSubtaskTitle.trim() || isCreating) return;
    
    setIsCreating(true);
    try {
      const response = await fetch(`/api/todos/${todoId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtaskTitle }),
      });
      
      if (!response.ok) throw new Error('Failed to create subtask');
      
      setNewSubtaskTitle('');
      onUpdate(); // Refresh parent todo list
    } catch (error) {
      console.error('Create subtask error:', error);
      alert('Failed to create subtask');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };
  
  return (
    <div className="mt-2">
      {/* Progress bar (always visible) */}
      {progress.total > 0 && (
        <ProgressBar progress={progress} />
      )}
      
      {/* Expand/Collapse button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 
          dark:hover:text-blue-300 font-medium mt-2"
      >
        {isExpanded ? '▼' : '▶'} Subtasks 
        {progress.total > 0 && (
          <span className="ml-2 text-gray-500 dark:text-gray-400">
            ({progress.completed}/{progress.total})
          </span>
        )}
      </button>
      
      {/* Expanded subtask list */}
      {isExpanded && (
        <div className="mt-3 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
          {/* Subtask list */}
          <div className="space-y-2">
            {subtasks.map(subtask => (
              <SubtaskItem
                key={subtask.id}
                todoId={todoId}
                subtask={subtask}
                onUpdate={onUpdate}
              />
            ))}
          </div>
          
          {/* Add subtask input */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a subtask..."
              disabled={isCreating}
              className="flex-1 px-3 py-2 border rounded-lg text-sm
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                dark:bg-gray-700 dark:border-gray-600 dark:text-white
                disabled:opacity-50"
            />
            <button
              onClick={handleCreate}
              disabled={!newSubtaskTitle.trim() || isCreating}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm
                hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Subtask Item Component

```typescript
// components/SubtaskItem.tsx
import { useState } from 'react';
import { Subtask } from '@/lib/db';

interface SubtaskItemProps {
  todoId: number;
  subtask: Subtask;
  onUpdate: () => void;
}

export function SubtaskItem({ todoId, subtask, onUpdate }: SubtaskItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleToggleComplete = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(
        `/api/todos/${todoId}/subtasks/${subtask.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: !subtask.completed }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to update subtask');
      
      onUpdate();
    } catch (error) {
      console.error('Update subtask error:', error);
      alert('Failed to update subtask');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDelete = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(
        `/api/todos/${todoId}/subtasks/${subtask.id}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) throw new Error('Failed to delete subtask');
      
      onUpdate();
    } catch (error) {
      console.error('Delete subtask error:', error);
      alert('Failed to delete subtask');
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="flex items-center gap-2 group">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={handleToggleComplete}
        disabled={isUpdating}
        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500
          disabled:opacity-50 cursor-pointer"
      />
      
      {/* Title */}
      <span
        className={`flex-1 text-sm ${
          subtask.completed
            ? 'line-through text-gray-400 dark:text-gray-500'
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {subtask.title}
      </span>
      
      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={isUpdating}
        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700
          dark:text-red-400 dark:hover:text-red-300 transition-opacity
          disabled:opacity-50"
        aria-label="Delete subtask"
      >
        ✕
      </button>
    </div>
  );
}
```

#### Progress Bar Component

```typescript
// components/ProgressBar.tsx
import { SubtaskProgress } from '@/lib/db';

interface ProgressBarProps {
  progress: SubtaskProgress;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const { total, completed, percentage } = progress;
  
  if (total === 0) return null;
  
  return (
    <div className="mt-2">
      {/* Text indicator */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {completed}/{total} subtasks
        </span>
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
          {percentage}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 dark:bg-blue-600 transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

#### Integration into TodoItem

```typescript
// In TodoItem component (app/page.tsx or components/TodoItem.tsx):
import { SubtaskSection } from '@/components/SubtaskSection';

function TodoItem({ todo }: { todo: TodoWithSubtasks }) {
  return (
    <div className="todo-item border rounded-lg p-4">
      {/* Checkbox, title, badges, etc. */}
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={todo.completed} />
        <span className="flex-1">{todo.title}</span>
        {/* Priority, recurrence, reminder badges */}
      </div>
      
      {/* Subtask section */}
      <SubtaskSection
        todoId={todo.id}
        subtasks={todo.subtasks}
        progress={todo.progress}
        onUpdate={refreshTodos} // Function to refresh todo list
      />
      
      {/* Edit, delete buttons */}
    </div>
  );
}
```

---

## Edge Cases

### 1. Empty Subtask Title
**Scenario:** User tries to create subtask with empty or whitespace-only title

**Handling:**
- Frontend: "Add" button disabled when input empty
- Backend: `validateSubtaskTitle()` returns null for empty strings
- API returns 400 error: "Invalid subtask title"
- Input field remains with previous value
- No database insertion

**Implementation:**
```typescript
const trimmed = title.trim();
if (trimmed.length === 0) return null;
```

### 2. Very Long Subtask Title
**Scenario:** User pastes 1000-character text into subtask input

**Handling:**
- Backend validation: Max 500 characters
- API returns 400 error if exceeds limit
- Frontend shows error message
- Truncate or reject based on UX preference

**Implementation:**
```typescript
if (trimmed.length > 500) return null;
```

### 3. Deleting Todo with Many Subtasks
**Scenario:** User deletes todo with 50 subtasks

**Handling:**
- Single DELETE request to `/api/todos/[id]`
- Database CASCADE constraint triggers automatically
- All 50 subtasks deleted in one transaction
- No orphaned subtasks remain
- Frontend removes todo and all subtasks from UI

**Database:**
```sql
FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
```

### 4. Completing All Subtasks
**Scenario:** User completes last remaining subtask (5/5)

**Handling:**
- Progress updates to 100%
- Blue progress bar fills completely
- Parent todo remains incomplete (not auto-completed)
- User must explicitly check parent todo checkbox
- Design choice: Give user control over parent completion

### 5. Deleting Subtask Mid-List
**Scenario:** User has subtasks at positions [0, 1, 2, 3], deletes position 1

**Handling:**
- Deleted subtask removed from database
- Remaining subtasks keep original positions: [0, 2, 3]
- Display order still correct (ORDER BY position ASC)
- No position reindexing needed
- Gaps in position sequence are acceptable

**Query:**
```sql
ORDER BY position ASC, created_at ASC
```

### 6. Creating Subtask on Completed Todo
**Scenario:** User expands completed todo and adds subtask

**Handling:**
- Subtask created normally with completed=false
- Progress calculation includes new subtask
- Progress changes from N/A (no subtasks) to 0/1 (0%)
- Parent todo remains marked complete
- Valid use case: User realizes more work needed

### 7. Simultaneous Subtask Updates (Race Condition)
**Scenario:** User rapidly clicks checkboxes in two browser tabs

**Handling:**
- Each PUT request is independent
- Database handles concurrent writes (SQLite serializes)
- Last write wins for each subtask
- No data corruption
- Progress calculation based on final state

### 8. Zero Subtasks (Fresh Todo)
**Scenario:** Todo has no subtasks yet

**Handling:**
- No progress bar rendered (`if (total === 0) return null`)
- "▶ Subtasks" button shows without count
- Clicking button reveals input field
- Creating first subtask shows "0/1 subtasks" (0%)

### 9. All Subtasks Deleted
**Scenario:** User deletes all 5 subtasks one by one

**Handling:**
- Progress bar disappears after last deletion
- "▶ Subtasks" button remains (to add new ones)
- No "(X/Y)" count shown
- Subtask section empty when expanded
- Valid state, no errors

### 10. Rapid Subtask Creation
**Scenario:** User presses Enter 10 times in 2 seconds

**Handling:**
- `isCreating` flag prevents duplicate submissions
- Each request waits for previous to complete
- Positions increment correctly: 0, 1, 2, ..., 9
- All subtasks appear in order
- No race conditions due to sequential requests

### 11. Parent Todo in Recurring Pattern
**Scenario:** User completes recurring weekly todo with 3 subtasks (2 completed)

**Handling:**
- Next instance created with same parent todo properties
- Subtasks NOT copied to next instance (design choice)
- Next instance starts with 0 subtasks
- Template system (PRP-07) handles subtask patterns
- User must use templates for repeating checklists

**Future Enhancement:** Add "copy subtasks to next instance" option

### 12. Export/Import with Subtasks
**Scenario:** User exports todos, including one with subtasks

**Handling:**
- Export includes subtasks array for each todo
- JSON structure preserves position, completed status
- Import remaps todo IDs and subtask IDs
- Foreign key relationships maintained
- Subtask positions preserved

**Export Format:**
```json
{
  "todos": [
    {
      "id": 5,
      "title": "Project",
      "subtasks": [
        { "id": 12, "title": "Step 1", "position": 0, "completed": true },
        { "id": 13, "title": "Step 2", "position": 1, "completed": false }
      ]
    }
  ]
}
```

### 13. Searching Subtask Titles
**Scenario:** User searches for "landing page", which only exists in subtask title

**Handling:**
- Search query matches subtask titles (via PRP-08)
- Parent todo "Launch campaign" appears in results
- Subtask section auto-expands to show matching subtask
- Matching text highlighted
- Useful for finding todos by checklist content

### 14. Long Todo with Many Subtasks
**Scenario:** Todo has 100 subtasks

**Handling:**
- All subtasks load in single GET request
- Rendering performance acceptable (React virtualization not needed until 1000+)
- Progress calculation fast (simple array filter)
- Scroll within expanded subtask section
- No pagination needed for typical use cases

---

## Acceptance Criteria

### Functional Requirements

#### FR1: Create Subtasks
- [ ] "▶ Subtasks" button visible on every todo item
- [ ] Clicking button expands subtask section below todo
- [ ] Input field with placeholder "Add a subtask..." appears
- [ ] Can type title and press Enter to create
- [ ] Can click "Add" button to create
- [ ] Subtask appears immediately in list
- [ ] Input field clears after creation
- [ ] Button changes to "▼ Subtasks" when expanded
- [ ] Can create unlimited subtasks per todo
- [ ] Validation: Cannot create empty title

#### FR2: Display Subtasks in Order
- [ ] Subtasks display in creation order (position ASC)
- [ ] First subtask has position=0
- [ ] Each new subtask increments position automatically
- [ ] Order persists across page reloads
- [ ] Deleting subtask doesn't affect other positions
- [ ] Gaps in position sequence are acceptable

#### FR3: Complete/Uncomplete Subtasks
- [ ] Each subtask has checkbox on left side
- [ ] Clicking checkbox marks as complete
- [ ] Completed subtasks show strikethrough text
- [ ] Completed subtasks use gray color
- [ ] Clicking again uncompletes subtask
- [ ] Checkbox fills when completed
- [ ] Parent todo completion independent of subtasks

#### FR4: Delete Subtasks
- [ ] Each subtask has "✕" delete button on right
- [ ] Delete button visible on hover (desktop) or always (mobile)
- [ ] Clicking "✕" immediately removes subtask
- [ ] No confirmation prompt
- [ ] Deleted subtask disappears from list
- [ ] Progress updates after deletion
- [ ] Other subtasks remain unaffected

#### FR5: Progress Bar Display
- [ ] Progress bar visible below todo title
- [ ] Text shows "X/Y subtasks" format
- [ ] Percentage shown on right side
- [ ] Blue fill bar shows 0-100% visually
- [ ] Calculation: (completed / total) * 100, rounded
- [ ] Bar visible even when subtasks collapsed
- [ ] No bar shown when total=0
- [ ] 100% fill when all subtasks complete

#### FR6: Progress Updates in Real-Time
- [ ] Progress updates immediately on subtask complete
- [ ] Progress updates immediately on subtask uncomplete
- [ ] Progress updates immediately on subtask delete
- [ ] Progress updates immediately on subtask create
- [ ] Blue fill animates smoothly (CSS transition)
- [ ] No page reload required
- [ ] Percentage text updates synchronously

#### FR7: Expand/Collapse Subtasks
- [ ] Clicking "▼ Subtasks" collapses section
- [ ] Subtask list hidden when collapsed
- [ ] Progress bar remains visible when collapsed
- [ ] Button text changes to "▶ Subtasks" when collapsed
- [ ] Clicking "▶ Subtasks" expands section again
- [ ] Expand state per todo (not global)
- [ ] State resets on page reload (acceptable)

#### FR8: Cascade Delete
- [ ] Deleting parent todo removes all subtasks
- [ ] Foreign key constraint ON DELETE CASCADE enforced
- [ ] No orphaned subtasks in database
- [ ] No manual cleanup required
- [ ] Works for todos with 0, 1, or 100+ subtasks

#### FR9: API Responses Include Progress
- [ ] GET /api/todos returns todos with subtasks array
- [ ] GET /api/todos returns progress object per todo
- [ ] POST /api/todos/[id]/subtasks returns updated progress
- [ ] PUT /api/todos/[id]/subtasks/[subtaskId] returns updated progress
- [ ] DELETE /api/todos/[id]/subtasks/[subtaskId] returns updated progress

### Non-Functional Requirements

#### NFR1: Performance
- [ ] Subtask creation response < 200ms
- [ ] Progress calculation < 10ms for 100 subtasks
- [ ] Database query uses index on (todo_id, position)
- [ ] No N+1 query problem when fetching todos with subtasks
- [ ] Frontend renders 100 subtasks without lag

#### NFR2: Data Integrity
- [ ] Foreign key constraint prevents orphaned subtasks
- [ ] CHECK constraint ensures title non-empty
- [ ] Position field always integer >= 0
- [ ] Completed field always 0 or 1 (boolean)
- [ ] Singapore timezone for created_at and updated_at

#### NFR3: Accessibility
- [ ] Checkboxes keyboard navigable (Tab key)
- [ ] Enter key creates subtask (in addition to button)
- [ ] Delete buttons have aria-label="Delete subtask"
- [ ] Progress bar has descriptive text for screen readers
- [ ] Sufficient color contrast for strikethrough text

#### NFR4: Dark Mode
- [ ] Progress bar styled for dark mode (dark:bg-gray-700)
- [ ] Strikethrough text readable in dark mode
- [ ] Input field borders visible in dark mode
- [ ] "Add" button contrasts in dark mode
- [ ] Blue fill color appropriate for dark backgrounds

#### NFR5: Mobile Responsiveness
- [ ] Subtask section renders correctly on small screens
- [ ] Delete button always visible (not hover-only) on touch devices
- [ ] Input field full-width on mobile
- [ ] "Add" button sized for touch (min 44x44px)
- [ ] Progress bar readable on narrow screens

---

## Testing Requirements

### E2E Tests (Playwright)

Create `tests/05-subtasks-progress.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Subtasks & Progress Tracking', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new TestHelper(page, context);
    await helper.setupAuthenticatedSession();
  });

  test('should show expand subtasks button on todos', async ({ page }) => {
    await page.goto('/');
    
    // Create a todo
    const title = 'Test todo';
    await helper.createTodo({ title });
    
    // Expand button visible
    const expandButton = page.locator(`text="${title}"`).locator('..').locator('button:has-text("Subtasks")');
    await expect(expandButton).toBeVisible();
    await expect(expandButton).toContainText('▶');
  });

  test('should expand and show subtask input', async ({ page }) => {
    await page.goto('/');
    
    const title = 'Project planning';
    await helper.createTodo({ title });
    
    // Click expand
    await page.click('button:has-text("▶ Subtasks")');
    
    // Input field appears
    const input = page.locator('input[placeholder="Add a subtask..."]');
    await expect(input).toBeVisible();
    
    // Add button appears
    const addButton = page.locator('button:has-text("Add")').last();
    await expect(addButton).toBeVisible();
    
    // Button text changes
    await expect(page.locator('button:has-text("▼ Subtasks")')).toBeVisible();
  });

  test('should create subtask and show in list', async ({ page }) => {
    await page.goto('/');
    
    const title = 'Marketing campaign';
    await helper.createTodo({ title });
    
    // Expand subtasks
    await page.click('button:has-text("▶ Subtasks")');
    
    // Add subtask
    const subtaskTitle = 'Design landing page';
    await page.fill('input[placeholder="Add a subtask..."]', subtaskTitle);
    await page.press('input[placeholder="Add a subtask..."]', 'Enter');
    
    // Subtask appears
    await expect(page.locator(`text="${subtaskTitle}"`)).toBeVisible();
    
    // Has checkbox
    const checkbox = page.locator(`text="${subtaskTitle}"`).locator('..').locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
  });

  test('should create multiple subtasks in order', async ({ page }) => {
    await page.goto('/');
    
    const title = 'Website redesign';
    await helper.createTodo({ title });
    
    await page.click('button:has-text("▶ Subtasks")');
    
    // Add 3 subtasks
    const subtasks = ['Wireframes', 'Mockups', 'Development'];
    for (const subtask of subtasks) {
      await page.fill('input[placeholder="Add a subtask..."]', subtask);
      await page.press('input[placeholder="Add a subtask..."]', 'Enter');
    }
    
    // All visible in order
    const subtaskElements = await page.locator('.subtask-item, [class*="subtask"]').allTextContents();
    for (const subtask of subtasks) {
      expect(subtaskElements.some(text => text.includes(subtask))).toBe(true);
    }
  });

  test('should show progress bar after creating subtask', async ({ page }) => {
    await page.goto('/');
    
    const title = 'Task with subtasks';
    await helper.createTodo({ title });
    
    await page.click('button:has-text("▶ Subtasks")');
    await page.fill('input[placeholder="Add a subtask..."]', 'First subtask');
    await page.press('input[placeholder="Add a subtask..."]', 'Enter');
    
    // Progress bar appears
    await expect(page.locator('text=0/1 subtasks')).toBeVisible();
    await expect(page.locator('text=0%')).toBeVisible();
    
    // Blue progress bar (0% width)
    const progressBar = page.locator('.bg-blue-500, [class*="bg-blue"]').first();
    await expect(progressBar).toBeVisible();
  });

  test('should update progress when completing subtask', async ({ page }) => {
    await page.goto('/');
    
    const title = 'Progress test';
    const todo = await helper.createTodo({ title });
    
    // Create 3 subtasks
    await page.click('button:has-text("▶ Subtasks")');
    for (let i = 1; i <= 3; i++) {
      await page.fill('input[placeholder="Add a subtask..."]', `Subtask ${i}`);
      await page.press('input[placeholder="Add a subtask..."]', 'Enter');
    }
    
    // Initially 0/3
    await expect(page.locator('text=0/3 subtasks')).toBeVisible();
    await expect(page.locator('text=0%')).toBeVisible();
    
    // Complete first subtask
    const firstCheckbox = page.locator('text=Subtask 1').locator('..').locator('input[type="checkbox"]');
    await firstCheckbox.click();
    
    // Progress updates to 1/3 (33%)
    await expect(page.locator('text=1/3 subtasks')).toBeVisible();
    await expect(page.locator('text=33%')).toBeVisible();
    
    // Complete second
    const secondCheckbox = page.locator('text=Subtask 2').locator('..').locator('input[type="checkbox"]');
    await secondCheckbox.click();
    
    // Progress updates to 2/3 (67%)
    await expect(page.locator('text=2/3 subtasks')).toBeVisible();
    await expect(page.locator('text=67%')).toBeVisible();
    
    // Complete third
    const thirdCheckbox = page.locator('text=Subtask 3').locator('..').locator('input[type="checkbox"]');
    await thirdCheckbox.click();
    
    // Progress updates to 3/3 (100%)
    await expect(page.locator('text=3/3 subtasks')).toBeVisible();
    await expect(page.locator('text=100%')).toBeVisible();
  });

  test('should show strikethrough on completed subtask', async ({ page }) => {
    await page.goto('/');
    
    const title = 'Styling test';
    await helper.createTodo({ title });
    
    await page.click('button:has-text("▶ Subtasks")');
    await page.fill('input[placeholder="Add a subtask..."]', 'Complete me');
    await page.press('input[placeholder="Add a subtask..."]', 'Enter');
    
    const subtaskText = page.locator('text=Complete me');
    
    // Initially no strikethrough
    await expect(subtaskText).not.toHaveClass(/line-through/);
    
    // Complete
    const checkbox = subtaskText.locator('..').locator('input[type="checkbox"]');
    await checkbox.click();
    
    // Strikethrough applied
    await expect(subtaskText).toHaveClass(/line-through/);
  });

  test('should uncomplete subtask and update progress', async ({ page }) => {
    await page.goto('/');
    
    const title = 'Uncomplete test';
    await helper.createTodo({ title });
    
    await page.click('button:has-text("▶ Subtasks")');
    await page.fill('input[placeholder="Add a subtask..."]', 'Toggle me');
    await page.press('input[placeholder="Add a subtask..."]', 'Enter');
    
    const checkbox = page.locator('text=Toggle me').locator('..').locator('input[type="checkbox"]');
    
    // Complete
    await checkbox.click();
    await expect(page.locator('text=1/1 subtasks')).toBeVisible();
    await expect(page.locator('text=100%')).toBeVisible();
    
    // Uncomplete
    await checkbox.click();
    await expect(page.locator('text=0/1 subtasks')).toBeVisible();
    await expect(page.locator('text=0%')).toBeVisible();
  });

  test('should delete subtask and update progress', async ({ page }) => {
    await page.goto('/');
    
    const title = 'Delete test';
    await helper.createTodo({ title });
    
    await page.click('button:has-text("▶ Subtasks")');
    await page.fill('input[placeholder="Add a subtask..."]', 'Will be deleted');
    await page.press('input[placeholder="Add a subtask..."]', 'Enter');
    await page.fill('input[placeholder="Add a subtask..."]', 'Will remain');
    await page.press('input[placeholder="Add a subtask..."]', 'Enter');
    
    // Initially 2 subtasks
    await expect(page.locator('text=0/2 subtasks')).toBeVisible();
    
    // Delete first subtask
    const deleteButton = page.locator('text=Will be deleted').locator('..').locator('button[aria-label="Delete subtask"], button:has-text("✕")');
    await deleteButton.click();
    
    // Subtask removed
    await expect(page.locator('text=Will be deleted')).not.toBeVisible();
    await expect(page.locator('text=Will remain')).toBeVisible();
    
    // Progress updates
    await expect(page.locator('text=0/1 subtasks')).toBeVisible();
  });

  test('should collapse subtasks and keep progress visible', async ({ page }) => {
    await page.goto('/');
    
    const title = 'Collapse test';
    await helper.createTodo({ title });
    
    await page.click('button:has-text("▶ Subtasks")');
    await page.fill('input[placeholder="Add a subtask..."]', 'Hidden when collapsed');
    await page.press('input[placeholder="Add a subtask..."]', 'Enter');
    
    // Progress visible
    await expect(page.locator('text=0/1 subtasks')).toBeVisible();
    
    // Collapse
    await page.click('button:has-text("▼ Subtasks")');
    
    // Subtask hidden
    await expect(page.locator('text=Hidden when collapsed')).not.toBeVisible();
    
    // Progress still visible
    await expect(page.locator('text=0/1 subtasks')).toBeVisible();
    
    // Button shows expand icon
    await expect(page.locator('button:has-text("▶ Subtasks")')).toBeVisible();
  });

  test('should cascade delete subtasks when parent deleted', async ({ page }) => {
    await page.goto('/');
    
    const title = 'Parent todo';
    const todo = await helper.createTodo({ title });
    
    // Add subtasks
    await page.click('button:has-text("▶ Subtasks")');
    for (let i = 1; i <= 3; i++) {
      await page.fill('input[placeholder="Add a subtask..."]', `Subtask ${i}`);
      await page.press('input[placeholder="Add a subtask..."]', 'Enter');
    }
    
    // Verify subtasks exist
    await expect(page.locator('text=Subtask 1')).toBeVisible();
    
    // Delete parent todo
    await page.click(`text="${title}"`).locator('..').locator('button:has-text("Delete")');
    
    // Parent and subtasks gone
    await expect(page.locator(`text="${title}"`)).not.toBeVisible();
    await expect(page.locator('text=Subtask 1')).not.toBeVisible();
  });

  test('should not auto-complete parent when all subtasks complete', async ({ page }) => {
    await page.goto('/');
    
    const title = 'Parent completion test';
    await helper.createTodo({ title });
    
    // Add and complete subtask
    await page.click('button:has-text("▶ Subtasks")');
    await page.fill('input[placeholder="Add a subtask..."]', 'Only subtask');
    await page.press('input[placeholder="Add a subtask..."]', 'Enter');
    
    const subtaskCheckbox = page.locator('text=Only subtask').locator('..').locator('input[type="checkbox"]');
    await subtaskCheckbox.click();
    
    // Parent todo still incomplete
    const parentCheckbox = page.locator(`text="${title}"`).locator('..').locator('input[type="checkbox"]').first();
    await expect(parentCheckbox).not.toBeChecked();
  });

  test('should prevent creating empty subtask', async ({ page }) => {
    await page.goto('/');
    
    const title = 'Empty validation test';
    await helper.createTodo({ title });
    
    await page.click('button:has-text("▶ Subtasks")');
    
    // Try to create with empty title
    const addButton = page.locator('button:has-text("Add")').last();
    await expect(addButton).toBeDisabled();
    
    // Type spaces only
    await page.fill('input[placeholder="Add a subtask..."]', '   ');
    await expect(addButton).toBeDisabled();
    
    // Type actual text
    await page.fill('input[placeholder="Add a subtask..."]', 'Valid subtask');
    await expect(addButton).toBeEnabled();
  });

  test('should maintain subtask order across page reload', async ({ page }) => {
    await page.goto('/');
    
    const title = 'Order persistence test';
    await helper.createTodo({ title });
    
    await page.click('button:has-text("▶ Subtasks")');
    
    // Create subtasks in specific order
    const subtasks = ['First', 'Second', 'Third'];
    for (const subtask of subtasks) {
      await page.fill('input[placeholder="Add a subtask..."]', subtask);
      await page.press('input[placeholder="Add a subtask..."]', 'Enter');
    }
    
    // Reload page
    await page.reload();
    
    // Expand again
    await page.click('button:has-text("▶ Subtasks")');
    
    // Order preserved
    const elements = await page.locator('.subtask-item, text=First, text=Second, text=Third').allTextContents();
    expect(elements.join('')).toContain('First');
    expect(elements.join('')).toContain('Second');
    expect(elements.join('')).toContain('Third');
  });
});
```

### Unit Tests

Create `tests/unit/subtasks.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  subtaskDB, 
  validateSubtaskTitle, 
  calculateProgress,
  userDB,
  todoDB
} from '@/lib/db';

describe('Subtask Validation', () => {
  it('should validate correct subtask titles', () => {
    expect(validateSubtaskTitle('Design homepage')).toBe('Design homepage');
    expect(validateSubtaskTitle('  Trimmed  ')).toBe('Trimmed');
    expect(validateSubtaskTitle('A')).toBe('A'); // Single character valid
  });

  it('should reject invalid subtask titles', () => {
    expect(validateSubtaskTitle('')).toBe(null);
    expect(validateSubtaskTitle('   ')).toBe(null); // Whitespace only
    expect(validateSubtaskTitle(null)).toBe(null);
    expect(validateSubtaskTitle(undefined)).toBe(null);
    expect(validateSubtaskTitle(123)).toBe(null); // Wrong type
  });

  it('should reject very long titles', () => {
    const longTitle = 'A'.repeat(501);
    expect(validateSubtaskTitle(longTitle)).toBe(null);
  });

  it('should accept max length titles', () => {
    const maxTitle = 'A'.repeat(500);
    expect(validateSubtaskTitle(maxTitle)).toBe(maxTitle);
  });
});

describe('Progress Calculation', () => {
  it('should calculate 0% for no subtasks', () => {
    const progress = calculateProgress([]);
    expect(progress.total).toBe(0);
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  it('should calculate 0% for all incomplete', () => {
    const subtasks = [
      { id: 1, completed: false } as any,
      { id: 2, completed: false } as any,
    ];
    const progress = calculateProgress(subtasks);
    expect(progress.total).toBe(2);
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  it('should calculate 100% for all complete', () => {
    const subtasks = [
      { id: 1, completed: true } as any,
      { id: 2, completed: true } as any,
      { id: 3, completed: true } as any,
    ];
    const progress = calculateProgress(subtasks);
    expect(progress.total).toBe(3);
    expect(progress.completed).toBe(3);
    expect(progress.percentage).toBe(100);
  });

  it('should calculate partial progress correctly', () => {
    const subtasks = [
      { id: 1, completed: true } as any,
      { id: 2, completed: false } as any,
      { id: 3, completed: true } as any,
    ];
    const progress = calculateProgress(subtasks);
    expect(progress.total).toBe(3);
    expect(progress.completed).toBe(2);
    expect(progress.percentage).toBe(67); // Rounded from 66.666...
  });

  it('should round percentages correctly', () => {
    // 1/3 = 33.333... should round to 33
    const subtasks1 = [
      { id: 1, completed: true } as any,
      { id: 2, completed: false } as any,
      { id: 3, completed: false } as any,
    ];
    expect(calculateProgress(subtasks1).percentage).toBe(33);
    
    // 2/3 = 66.666... should round to 67
    const subtasks2 = [
      { id: 1, completed: true } as any,
      { id: 2, completed: true } as any,
      { id: 3, completed: false } as any,
    ];
    expect(calculateProgress(subtasks2).percentage).toBe(67);
  });
});

describe('Database Operations', () => {
  let userId: number;
  let todoId: number;

  beforeEach(() => {
    userId = userDB.create({ username: 'test-subtask-user' });
    const todo = todoDB.create({
      user_id: userId,
      title: 'Test todo',
      priority: 'medium',
      due_date: null,
      recurrence_pattern: 'none',
      reminder_minutes: null,
      last_notification_sent: null,
    });
    todoId = todo.id;
  });

  it('should create subtask with auto-position', () => {
    const subtask = subtaskDB.create({
      todo_id: todoId,
      title: 'First subtask',
      position: 0,
    });
    
    expect(subtask.title).toBe('First subtask');
    expect(subtask.position).toBe(0);
    expect(subtask.completed).toBe(false);
  });

  it('should get subtasks by todo ID in order', () => {
    // Create 3 subtasks
    subtaskDB.create({ todo_id: todoId, title: 'Third', position: 2 });
    subtaskDB.create({ todo_id: todoId, title: 'First', position: 0 });
    subtaskDB.create({ todo_id: todoId, title: 'Second', position: 1 });
    
    const subtasks = subtaskDB.getByTodoId(todoId);
    expect(subtasks.length).toBe(3);
    expect(subtasks[0].title).toBe('First');
    expect(subtasks[1].title).toBe('Second');
    expect(subtasks[2].title).toBe('Third');
  });

  it('should update subtask title', () => {
    const subtask = subtaskDB.create({
      todo_id: todoId,
      title: 'Original',
      position: 0,
    });
    
    const updated = subtaskDB.update(subtask.id, { title: 'Updated' });
    expect(updated.title).toBe('Updated');
    expect(updated.completed).toBe(false); // Unchanged
  });

  it('should toggle subtask completion', () => {
    const subtask = subtaskDB.create({
      todo_id: todoId,
      title: 'Toggle test',
      position: 0,
    });
    
    // Complete
    const completed = subtaskDB.update(subtask.id, { completed: true });
    expect(completed.completed).toBe(true);
    
    // Uncomplete
    const uncompleted = subtaskDB.update(completed.id, { completed: false });
    expect(uncompleted.completed).toBe(false);
  });

  it('should delete subtask', () => {
    const subtask = subtaskDB.create({
      todo_id: todoId,
      title: 'To delete',
      position: 0,
    });
    
    subtaskDB.delete(subtask.id);
    
    expect(() => subtaskDB.getById(subtask.id)).toThrow('Subtask not found');
  });

  it('should cascade delete subtasks when todo deleted', () => {
    // Create subtasks
    subtaskDB.create({ todo_id: todoId, title: 'Sub 1', position: 0 });
    subtaskDB.create({ todo_id: todoId, title: 'Sub 2', position: 1 });
    
    // Verify they exist
    expect(subtaskDB.getByTodoId(todoId).length).toBe(2);
    
    // Delete parent todo
    todoDB.delete(todoId, userId);
    
    // Subtasks also deleted (CASCADE)
    expect(subtaskDB.getByTodoId(todoId).length).toBe(0);
  });

  it('should get next position correctly', () => {
    expect(subtaskDB.getNextPosition(todoId)).toBe(0);
    
    subtaskDB.create({ todo_id: todoId, title: 'First', position: 0 });
    expect(subtaskDB.getNextPosition(todoId)).toBe(1);
    
    subtaskDB.create({ todo_id: todoId, title: 'Second', position: 1 });
    expect(subtaskDB.getNextPosition(todoId)).toBe(2);
  });

  it('should count subtasks', () => {
    expect(subtaskDB.countByTodoId(todoId)).toBe(0);
    
    subtaskDB.create({ todo_id: todoId, title: 'One', position: 0 });
    expect(subtaskDB.countByTodoId(todoId)).toBe(1);
    
    subtaskDB.create({ todo_id: todoId, title: 'Two', position: 1 });
    expect(subtaskDB.countByTodoId(todoId)).toBe(2);
  });
});
```

---

## Out of Scope

The following features are **explicitly excluded** from this implementation:

### 1. Drag-and-Drop Reordering
- Manual reordering of subtasks via drag-and-drop
- Visual drag handles or indicators
- Touch-based reordering on mobile
- **Reason:** Position-based ordering sufficient for MVP

### 2. Subtask Due Dates
- Individual due dates per subtask
- Subtask deadline tracking separate from parent
- Overdue indicators on subtasks
- **Reason:** Adds complexity, parent due date typically sufficient

### 3. Subtask Priorities
- Priority levels (high/medium/low) on subtasks
- Color-coded subtask priorities
- Priority-based subtask sorting
- **Reason:** Subtasks are implementation details of parent

### 4. Subtask Assignments
- Assign subtasks to different users/team members
- Collaboration features on subtasks
- Notification for subtask assignments
- **Reason:** Single-user app design

### 5. Subtask Dependencies
- "Subtask B blocked by Subtask A" relationships
- Dependency visualization
- Automatic reordering based on dependencies
- **Reason:** Over-engineering for task management app

### 6. Nested Subtasks (Sub-subtasks)
- Multiple levels of nesting
- Subtasks within subtasks
- Hierarchical checklist structure
- **Reason:** Complexity vs. value tradeoff, causes UI/UX issues

### 7. Subtask Templates
- Save subtask patterns for reuse (handled by PRP-07 Template System)
- Quick-add from template library
- **Reason:** Covered by Todo Templates feature

### 8. Subtask Time Tracking
- Time estimates per subtask
- Time spent tracking
- Burndown charts for subtasks
- **Reason:** Not a time-tracking app

### 9. Subtask Comments/Notes
- Detailed notes per subtask
- Comment threads on subtasks
- Rich text formatting in subtask descriptions
- **Reason:** Title field sufficient for checklist items

### 10. Subtask Attachments
- File uploads per subtask
- Image/document attachments
- File preview in subtask list
- **Reason:** Scope creep, not core functionality

---

## Success Metrics

### User Engagement
- **Target:** 50% of todos have at least 1 subtask
- **Target:** Average 3.5 subtasks per todo with subtasks
- **Target:** 70% of users create subtask within first week

### Feature Usage
- **Target:** Subtask completion rate 80% (completed / created)
- **Target:** 40% of subtasks created via Enter key (vs. button)
- **Target:** < 10% subtask deletion rate (well-planned checklists)

### Performance
- **Target:** Subtask CRUD operations complete in < 200ms (p95)
- **Target:** Progress calculation < 10ms for 100 subtasks
- **Target:** Zero cascade delete failures

### User Satisfaction
- **Target:** < 5% of users request manual reordering
- **Target:** Zero complaints about progress calculation accuracy
- **Target:** Progress bar animations smooth (60fps)

### Technical Quality
- **Target:** 100% E2E test pass rate (15 test cases)
- **Target:** 100% unit test coverage for validation and progress logic
- **Target:** All acceptance criteria validated

---

## Implementation Notes

### Development Order
1. **Phase 1: Database & Backend**
   - Create `subtasks` table with CASCADE constraint
   - Implement `subtaskDB` interface in `lib/db.ts`
   - Add validation functions
   - Create API routes: POST, GET, PUT, DELETE

2. **Phase 2: Basic UI**
   - Build SubtaskSection component (expand/collapse)
   - Build SubtaskItem component (checkbox, delete)
   - Build ProgressBar component
   - Integrate into TodoItem

3. **Phase 3: Progress & Interactions**
   - Implement real-time progress updates
   - Add CSS transitions for progress bar
   - Handle optimistic UI updates
   - Add error handling and loading states

4. **Phase 4: Polish & Edge Cases**
   - Dark mode styling
   - Mobile responsiveness
   - Keyboard navigation
   - Empty states and validation

5. **Phase 5: Testing**
   - Write E2E tests (15 test cases)
   - Write unit tests (validation, calculation, database)
   - Manual testing across browsers
   - Performance testing

### Dependencies
- **Requires:** PRP-01 (Todo CRUD) - database, API patterns
- **Enhances:** PRP-07 (Template System) - templates with subtasks
- **Enhances:** PRP-08 (Search & Filtering) - search subtask titles
- **Enhances:** PRP-09 (Export & Import) - include subtasks in export

### Maintenance Considerations
- Monitor database query performance as subtask count grows
- Consider pagination if users create 1000+ subtasks per todo
- Track position field gaps and compact if necessary (future optimization)
- Add drag-and-drop if highly requested by users

---

**Feature Owner:** AI Development Team  
**Last Updated:** February 5, 2026  
**Status:** Ready for Implementation
