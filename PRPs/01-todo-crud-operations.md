# PRP 01: Todo CRUD Operations

## Feature Overview

The foundational feature of the Todo App — creating, reading, updating, and deleting todo items. All operations use **Singapore timezone** (`Asia/Singapore`) and are scoped to the authenticated user. Todos support titles, due dates, priorities, and automatic sorting across three sections: Overdue, Pending, and Completed.

---

## User Stories

1. **As a user**, I want to create a new todo with a title so that I can track tasks I need to complete.
2. **As a user**, I want to set a due date and time for my todo so that I know when it needs to be done.
3. **As a user**, I want to mark a todo as complete so that I can track my progress.
4. **As a user**, I want to edit a todo's title, due date, and other properties so that I can update tasks as requirements change.
5. **As a user**, I want to delete a todo I no longer need so that my list stays clean and relevant.
6. **As a user**, I want to see my todos organized into Overdue, Pending, and Completed sections so that I can quickly focus on what matters.
7. **As a user**, I want my todos automatically sorted by priority and due date so that the most urgent items appear first.

---

## User Flow

### Creating a Todo
1. User enters a title in the main input field (required, non-empty)
2. User optionally selects a priority level (defaults to Medium)
3. User optionally sets a due date and time (must be ≥ 1 minute in the future, Singapore time)
4. User clicks **"Add"** button
5. Todo appears in the Pending section (or Overdue if due date already passed)
6. Input form clears for next entry

### Viewing Todos
1. User sees three sections on the main page:
   - **Overdue**: Past due date AND not completed (red background, ⚠️ icon)
   - **Pending**: Future due date OR no due date, AND not completed
   - **Completed**: Marked as done
2. Each section shows a counter (e.g., "Pending (5)")
3. Within each section, todos are sorted: Priority (High → Medium → Low) → Due Date (earliest first) → Creation Date (newest first)

### Editing a Todo
1. User clicks **"Edit"** button on any todo
2. Modal opens with current values pre-filled
3. User modifies title, due date, priority, or other fields
4. User clicks **"Update"** to save or **"Cancel"** to discard
5. Todo moves to the correct section based on updated values

### Deleting a Todo
1. User clicks **"Delete"** button (red) on any todo
2. Todo is immediately and permanently deleted (no confirmation dialog)
3. All associated subtasks, tag associations, and reminder settings are CASCADE deleted

### Completing a Todo
1. User clicks the checkbox on a todo
2. Todo moves to the Completed section
3. User can uncheck to move it back to Overdue or Pending (based on due date)

---

## Technical Requirements

### Database Schema

```sql
CREATE TABLE todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT 0,
  due_date TEXT,                    -- ISO 8601 format, Singapore timezone
  priority TEXT DEFAULT 'medium',   -- 'high' | 'medium' | 'low'
  is_recurring BOOLEAN DEFAULT 0,
  recurrence_pattern TEXT,          -- 'daily' | 'weekly' | 'monthly' | 'yearly'
  reminder_minutes INTEGER,        -- minutes before due date
  last_notification_sent TEXT,     -- ISO timestamp of last notification
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### TypeScript Interfaces

```typescript
type Priority = 'high' | 'medium' | 'low';

interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  due_date: string | null;
  priority: Priority;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  reminder_minutes: number | null;
  last_notification_sent: string | null;
  created_at: string;
}
```

### API Endpoints

#### `GET /api/todos`
- **Auth**: Required (session cookie)
- **Query Params**: None (returns all todos for user)
- **Response**: `200 OK` → `Todo[]`
- **Behavior**: Returns all todos for `session.userId`, joined with subtasks and tags

#### `POST /api/todos`
- **Auth**: Required
- **Body**:
  ```json
  {
    "title": "string (required, non-empty)",
    "due_date": "string | null (ISO 8601)",
    "priority": "'high' | 'medium' | 'low' (default: 'medium')",
    "is_recurring": "boolean (default: false)",
    "recurrence_pattern": "'daily' | 'weekly' | 'monthly' | 'yearly' | null",
    "reminder_minutes": "number | null"
  }
  ```
- **Response**: `201 Created` → `Todo`
- **Validation**:
  - Title must not be empty or whitespace-only
  - Due date must be ≥ 1 minute in the future (Singapore time)
  - If `is_recurring` is true, `due_date` is required

#### `PUT /api/todos/[id]`
- **Auth**: Required
- **Params**: `id` (todo ID) — `const { id } = await params;` (Next.js 16 async params)
- **Body**: Same as POST (partial update supported)
- **Response**: `200 OK` → `Todo`
- **Behavior**:
  - Updates specified fields
  - If completing a recurring todo, creates next instance (see PRP 03)
  - Verifies todo belongs to `session.userId`

#### `DELETE /api/todos/[id]`
- **Auth**: Required
- **Params**: `id` (todo ID) — async params
- **Response**: `200 OK` → `{ message: 'Todo deleted' }`
- **Behavior**: CASCADE deletes subtasks, tag associations

### Database Operations (lib/db.ts)

```typescript
// All operations are SYNCHRONOUS (better-sqlite3)
const todoDB = {
  getAll(userId: number): Todo[],
  getById(id: number, userId: number): Todo | undefined,
  create(todo: Omit<Todo, 'id' | 'created_at'>): Todo,
  update(id: number, userId: number, updates: Partial<Todo>): Todo,
  delete(id: number, userId: number): void,
};
```

### Timezone Handling

```typescript
import { getSingaporeNow, formatSingaporeDate } from '@/lib/timezone';

// ALWAYS use getSingaporeNow() instead of new Date()
const now = getSingaporeNow();

// Format dates for display
const formatted = formatSingaporeDate(todo.due_date);
```

---

## UI Components

### Todo Form (Top of Main Page)
- Text input for title (placeholder: "What needs to be done?")
- Priority dropdown (High / Medium / Low, default: Medium)
- Date-time picker for due date (optional)
- **"Add"** button

### Todo Item Display
- **Left**: Checkbox (☐ unchecked / ☑ checked)
- **Center**:
  - Title text
  - Priority badge (color-coded)
  - Due date display (color-coded by urgency — see Smart Time Display below)
  - Progress bar (if subtasks exist)
- **Right**:
  - "▶ Subtasks" toggle button
  - "Edit" button (blue)
  - "Delete" button (red)

### Smart Time Display

| Time Until Due | Display Format | Color |
|----------------|----------------|-------|
| Overdue | "X days/hours/minutes overdue" | 🔴 Red |
| < 1 hour | "Due in X minutes" | 🔴 Red |
| < 24 hours | "Due in X hours (timestamp)" | 🟠 Orange |
| < 7 days | "Due in X days (timestamp)" | 🟡 Yellow |
| 7+ days | Full timestamp | 🔵 Blue |

### Section Headers
- **Overdue (X)** — red background, ⚠️ icon
- **Pending (X)** — gray background
- **Completed (X)** — standard background

### Edit Modal
- Pre-filled inputs for all editable fields
- "Update" button (blue) and "Cancel" button (gray)
- Closes on overlay click or Cancel

---

## Edge Cases

1. **Empty title**: Reject with validation error — title must not be empty or whitespace-only
2. **Past due date**: Reject creation if due date is less than 1 minute in the future (Singapore time)
3. **No due date**: Todo goes to Pending section, sorted after items with due dates
4. **Timezone mismatch**: All date comparisons must use Singapore timezone functions from `lib/timezone.ts`
5. **Concurrent edits**: Last write wins (no optimistic locking)
6. **Large todo lists**: Client-side rendering of potentially hundreds of items — filtering helps performance
7. **SQL injection**: Use prepared statements (`db.prepare()`) for all queries
8. **Unauthorized access**: Verify `todo.user_id === session.userId` on all operations
9. **Deleting a todo with subtasks**: CASCADE delete handles cleanup automatically
10. **Completing a recurring todo**: Must create next instance (handled in PRP 03)

---

## Acceptance Criteria

- [ ] User can create a todo with just a title
- [ ] User can create a todo with title, due date, and priority
- [ ] Todo title cannot be empty or whitespace-only
- [ ] Due date must be at least 1 minute in the future (Singapore time)
- [ ] Created todos appear in the correct section (Pending or Overdue)
- [ ] Todos are automatically sorted by priority → due date → creation date
- [ ] User can mark a todo as complete (moves to Completed section)
- [ ] User can unmark a completed todo (returns to Pending or Overdue)
- [ ] User can edit todo title, due date, and priority via modal
- [ ] Edit modal pre-fills with current values
- [ ] User can delete a todo permanently
- [ ] Deleting a todo CASCADE deletes subtasks and tag associations
- [ ] All operations require authentication
- [ ] Todos are user-scoped (users only see their own todos)
- [ ] All dates use Singapore timezone
- [ ] Section counters update in real-time
- [ ] Overdue section shows red background and ⚠️ icon
- [ ] Smart time display shows appropriate format and color based on urgency

---

## Testing Requirements

### E2E Tests (Playwright)

```typescript
// tests/02-todo-crud.spec.ts

test('should create a todo with title only', async ({ page }) => {
  // Enter title, click Add, verify appears in Pending
});

test('should create a todo with due date and priority', async ({ page }) => {
  // Fill all fields, verify correct section and badges
});

test('should reject empty title', async ({ page }) => {
  // Try adding empty title, verify error or no creation
});

test('should reject past due date', async ({ page }) => {
  // Set past date, verify rejection
});

test('should complete a todo', async ({ page }) => {
  // Create todo, click checkbox, verify moves to Completed
});

test('should uncomplete a todo', async ({ page }) => {
  // Complete then uncheck, verify returns to correct section
});

test('should edit a todo', async ({ page }) => {
  // Create, edit title/date/priority, verify updates
});

test('should delete a todo', async ({ page }) => {
  // Create, delete, verify removed from list
});

test('should sort todos by priority then due date', async ({ page }) => {
  // Create multiple todos with different priorities/dates, verify order
});

test('should show overdue section for past due todos', async ({ page }) => {
  // Create todo with past due date, verify Overdue section
});
```

### Test Configuration
- Use virtual WebAuthn authenticator (Playwright Chromium flags)
- Set `timezoneId: 'Asia/Singapore'` in Playwright config
- Use `tests/helpers.ts` for `createTodo()` utility

---

## Out of Scope

- Drag-and-drop reordering of todos
- Bulk operations (multi-select, bulk delete/complete)
- Undo/redo functionality
- Confirmation dialogs on delete
- Rich text or markdown in todo titles
- File attachments on todos
- Collaborative/shared todos between users
- Offline support / local-first storage

---

## Success Metrics

- Users can perform full CRUD lifecycle without errors
- Todo creation completes in < 500ms (API response time)
- Correct section assignment for all todos based on due date and completion status
- Zero timezone-related bugs (all operations use Singapore time)
- All todos correctly scoped to authenticated user
- CASCADE delete works correctly for subtasks and tag associations
