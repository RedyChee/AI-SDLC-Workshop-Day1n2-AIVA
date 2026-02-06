# PRP 05: Subtasks & Progress Tracking

## Feature Overview

Break down complex todos into smaller, manageable subtasks with real-time visual progress tracking. Each todo can have unlimited subtasks with individual completion states. A progress bar and text indicator show completion percentage, visible even when subtasks are collapsed. Subtasks are CASCADE deleted when the parent todo is removed.

---

## User Stories

1. **As a user**, I want to add subtasks to a todo so that I can break down complex tasks into smaller, actionable steps.
2. **As a user**, I want to check off individual subtasks so that I can track incremental progress on a larger task.
3. **As a user**, I want to see a progress bar on my todo so that I can quickly gauge how much work remains.
4. **As a user**, I want to delete subtasks I no longer need so that my checklist stays relevant.
5. **As a user**, I want to expand and collapse the subtask list so that I can focus on the tasks that matter without visual clutter.
6. **As a user**, I want subtasks to maintain their order so that sequential steps appear in the correct sequence.
7. **As a user**, I want subtask progress to be visible even when the subtask list is collapsed so that I can scan overall progress quickly.

---

## User Flow

### Adding a Subtask
1. User clicks **"▶ Subtasks"** button on any todo to expand the subtask panel
2. An input field and **"Add"** button appear below the existing subtasks
3. User enters a subtask title in the input field
4. User presses **Enter** or clicks **"Add"** to create the subtask
5. Subtask appears in the list with an unchecked checkbox
6. Progress bar and text indicator update (e.g., "0/1 subtasks")
7. Input field clears for next entry

### Completing a Subtask
1. User clicks the checkbox next to a subtask
2. Checkbox shows checkmark (✓) and subtask text gets strikethrough styling
3. Progress bar updates in real-time (e.g., 50% → 75%)
4. Progress text updates (e.g., "3/4 subtasks")

### Uncompleting a Subtask
1. User clicks the checked checkbox on a completed subtask
2. Checkbox unchecks, strikethrough removed
3. Progress bar and text update accordingly

### Deleting a Subtask
1. User clicks the **"✕"** button on the right side of a subtask
2. Subtask is immediately and permanently removed
3. Progress bar and text recalculate

### Collapsing Subtasks
1. User clicks **"▼ Subtasks"** button to collapse
2. Subtask list and add form hide
3. Progress bar and text remain visible
4. Button text changes to **"▶ Subtasks"**

---

## Technical Requirements

### Database Schema

```sql
CREATE TABLE subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  todo_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT 0,
  position INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);
```

**Key points:**
- `position` field maintains subtask ordering within a todo
- `ON DELETE CASCADE` ensures subtasks are removed when parent todo is deleted
- No `user_id` column — authorization is inherited from the parent todo's `user_id`

### TypeScript Interfaces

```typescript
interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

// Extended Todo with subtasks for API responses
interface TodoWithSubtasks extends Todo {
  subtasks: Subtask[];
}
```

### API Endpoints

#### `GET /api/todos/[id]/subtasks`
- **Auth**: Required (session cookie)
- **Params**: `id` (todo ID) — `const { id } = await params;` (Next.js 16 async params)
- **Response**: `200 OK` → `Subtask[]`
- **Behavior**: Returns all subtasks for the todo, ordered by `position` ASC
- **Authorization**: Verifies parent todo belongs to `session.userId`

#### `POST /api/todos/[id]/subtasks`
- **Auth**: Required
- **Params**: `id` (todo ID) — async params
- **Body**:
  ```json
  {
    "title": "string (required, non-empty)"
  }
  ```
- **Response**: `201 Created` → `Subtask`
- **Behavior**:
  - Creates subtask with `position` = current max position + 1
  - Validates title is non-empty
  - Verifies parent todo belongs to `session.userId`

#### `PUT /api/todos/[id]/subtasks/[subtaskId]`
- **Auth**: Required
- **Params**: `id` (todo ID), `subtaskId` — async params
- **Body**:
  ```json
  {
    "completed": "boolean"
  }
  ```
- **Response**: `200 OK` → `Subtask`
- **Behavior**: Toggles subtask completion state

#### `DELETE /api/todos/[id]/subtasks/[subtaskId]`
- **Auth**: Required
- **Params**: `id` (todo ID), `subtaskId` — async params
- **Response**: `200 OK` → `{ message: 'Subtask deleted' }`
- **Behavior**: Permanently removes the subtask

### Database Operations (lib/db.ts)

```typescript
// All operations are SYNCHRONOUS (better-sqlite3)
const subtaskDB = {
  getByTodoId(todoId: number): Subtask[],
  create(todoId: number, title: string): Subtask,
  update(id: number, updates: Partial<Subtask>): Subtask,
  delete(id: number): void,
  getMaxPosition(todoId: number): number,
};
```

---

## UI Components

### Subtask Toggle Button
- **Collapsed**: `"▶ Subtasks"` (or `"▶ Subtasks (X/Y)"` showing progress)
- **Expanded**: `"▼ Subtasks"`
- Positioned on the right side of each todo item

### Progress Bar
- Horizontal bar below todo title
- Blue fill color proportional to completion percentage
- Width: 100% of todo card content area
- Height: ~8px with rounded corners
- Visible when subtasks exist, even when collapsed
- Shows `0%` if no subtasks are completed

### Progress Text
- Format: `"X/Y subtasks"` (e.g., "3/7 subtasks")
- Positioned near progress bar
- Updates in real-time on subtask completion changes

### Subtask List (Expanded)
- Each subtask displays:
  - **Left**: Checkbox (☐ unchecked / ☑ checked)
  - **Center**: Subtask title (strikethrough when completed)
  - **Right**: "✕" delete button
- Subtask add form at bottom:
  - Text input (placeholder: "Add a subtask...")
  - **"Add"** button

### Progress Calculation

```typescript
const completedCount = subtasks.filter(s => s.completed).length;
const totalCount = subtasks.length;
const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
// Display: `${completedCount}/${totalCount} subtasks` and `${percentage}%`
```

---

## Edge Cases

1. **Empty subtask title**: Reject creation — title must not be empty or whitespace-only
2. **No subtasks**: No progress bar or text displayed; toggle button still accessible
3. **All subtasks completed**: Progress bar shows 100%, full blue fill
4. **Deleting all subtasks**: Progress bar and text disappear
5. **Parent todo deleted**: All subtasks CASCADE deleted automatically via DB foreign key
6. **Subtask completion vs parent completion**: Completing all subtasks does NOT auto-complete the parent todo; they are independent
7. **Large number of subtasks**: Client-side rendering — no pagination needed for typical usage
8. **Subtask search**: Subtask titles are included in the search feature (see PRP 08)
9. **Position gaps**: If subtasks are deleted, positions may have gaps — this is acceptable; ordering still works via `ORDER BY position ASC`
10. **Concurrent subtask edits**: Last write wins (no optimistic locking)

---

## Acceptance Criteria

- [ ] User can expand/collapse subtask panel on any todo
- [ ] User can add a subtask with a non-empty title
- [ ] Subtask title cannot be empty or whitespace-only
- [ ] Subtasks appear in position order
- [ ] User can complete/uncomplete individual subtasks via checkbox
- [ ] Completed subtasks show strikethrough text
- [ ] Progress bar displays correct completion percentage
- [ ] Progress text shows "X/Y subtasks" format
- [ ] Progress bar is visible when subtasks are collapsed
- [ ] User can delete a subtask via ✕ button
- [ ] Deleting parent todo CASCADE deletes all subtasks
- [ ] Subtask completion does NOT auto-complete parent todo
- [ ] Adding a subtask assigns correct incremental position
- [ ] All subtask operations require authentication
- [ ] Subtask operations verify parent todo belongs to current user
- [ ] Progress bar updates in real-time without page refresh

---

## Testing Requirements

### E2E Tests (Playwright)

```typescript
// tests/05-subtasks.spec.ts

test('should expand subtask panel', async ({ page }) => {
  // Create todo, click "▶ Subtasks", verify panel opens
});

test('should add a subtask', async ({ page }) => {
  // Expand panel, enter title, click Add, verify subtask appears
});

test('should reject empty subtask title', async ({ page }) => {
  // Try adding empty title, verify no subtask created
});

test('should complete a subtask', async ({ page }) => {
  // Add subtask, click checkbox, verify strikethrough and progress update
});

test('should uncomplete a subtask', async ({ page }) => {
  // Complete then uncheck subtask, verify state reverts
});

test('should delete a subtask', async ({ page }) => {
  // Add subtask, click ✕, verify removed from list
});

test('should show correct progress bar', async ({ page }) => {
  // Add 4 subtasks, complete 2, verify 50% progress bar
});

test('should show progress when collapsed', async ({ page }) => {
  // Add and complete subtasks, collapse panel, verify bar still visible
});

test('should CASCADE delete subtasks with parent todo', async ({ page }) => {
  // Create todo with subtasks, delete todo, verify subtasks removed
});

test('should maintain subtask order', async ({ page }) => {
  // Add multiple subtasks, verify they appear in creation order
});
```

### Test Helpers

```typescript
// tests/helpers.ts
async addSubtask(page: Page, todoTitle: string, subtaskTitle: string) {
  // Find todo, expand subtasks, add subtask
}
```

---

## Out of Scope

- Drag-and-drop reordering of subtasks
- Nested subtasks (subtasks of subtasks)
- Subtask due dates or priorities
- Subtask assignment to different users
- Subtask comments or notes
- Auto-complete parent when all subtasks done
- Subtask templates (separate from todo templates)
- Inline editing of subtask titles
- Bulk subtask operations (complete all, delete all)

---

## Success Metrics

- Users can add, complete, and delete subtasks without errors
- Progress bar accurately reflects completion percentage at all times
- Subtask operations complete in < 300ms (API response time)
- CASCADE delete reliably removes all subtasks when parent is deleted
- Progress remains visible when subtask panel is collapsed
- Subtask search integration works correctly (titles found via search)
