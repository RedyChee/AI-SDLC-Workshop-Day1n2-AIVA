# PRP 02: Priority System

## Feature Overview

A three-level priority system (High, Medium, Low) that helps users organize todos by importance. Each priority level has distinct color-coded badges, automatic sorting places higher priority items first, and users can filter todos by priority level. Medium is the default priority for new todos.

---

## User Stories

1. **As a user**, I want to assign a priority level to each todo so that I can distinguish urgent tasks from less important ones.
2. **As a user**, I want to see color-coded priority badges so that I can visually scan for urgent items at a glance.
3. **As a user**, I want my todos automatically sorted by priority so that the most important tasks always appear first.
4. **As a user**, I want to filter my todo list by priority so that I can focus on a specific urgency level.
5. **As a user**, I want to change a todo's priority after creation so that I can adjust importance as circumstances change.

---

## User Flow

### Setting Priority on Creation
1. User fills in the todo title
2. User selects priority from dropdown: **High** / **Medium** (default) / **Low**
3. User clicks **"Add"**
4. Todo appears with the corresponding color-coded priority badge

### Changing Priority
1. User clicks **"Edit"** on an existing todo
2. Edit modal opens with current priority pre-selected in dropdown
3. User selects new priority level
4. User clicks **"Update"**
5. Badge color updates immediately
6. Todo re-sorts based on new priority

### Filtering by Priority
1. User locates the **"All Priorities"** dropdown in the filter section
2. User selects a priority level (High, Medium, or Low)
3. Todo list filters to show only matching todos
4. Section counters update to reflect filtered counts
5. User selects **"All Priorities"** to clear the filter

---

## Technical Requirements

### Database Schema

The `priority` field is stored as TEXT in the `todos` table:

```sql
priority TEXT DEFAULT 'medium'  -- 'high' | 'medium' | 'low'
```

### TypeScript Types

```typescript
type Priority = 'high' | 'medium' | 'low';

// Priority is a field on the Todo interface
interface Todo {
  // ...other fields
  priority: Priority;
}
```

### API Endpoints

Priority is handled as part of the Todo CRUD endpoints (see PRP 01):

#### `POST /api/todos` — Create with priority
```json
{
  "title": "Urgent report",
  "priority": "high"
}
```

#### `PUT /api/todos/[id]` — Update priority
```json
{
  "priority": "low"
}
```

#### `GET /api/todos` — Returns todos with priority field
Each todo in the response includes the `priority` field. Sorting is applied client-side.

### Sorting Logic (Client-Side)

```typescript
const priorityOrder: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// Sort within each section (Overdue, Pending, Completed)
todos.sort((a, b) => {
  // 1. Priority (high first)
  const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
  if (priorityDiff !== 0) return priorityDiff;

  // 2. Due date (earliest first)
  if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  if (a.due_date) return -1;
  if (b.due_date) return 1;

  // 3. Creation date (newest first)
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
});
```

### Filtering Logic (Client-Side)

```typescript
const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

const filteredTodos = todos.filter(todo => {
  if (priorityFilter !== 'all' && todo.priority !== priorityFilter) return false;
  // ...other filters
  return true;
});
```

---

## UI Components

### Priority Dropdown (Todo Form)

```tsx
<select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
  <option value="high">High</option>
  <option value="medium">Medium</option>
  <option value="low">Low</option>
</select>
```

### Priority Badge (On Todo Item)

| Priority | Light Mode | Dark Mode | Text |
|----------|-----------|-----------|------|
| **High** | Red background (`bg-red-100 text-red-800`) | `bg-red-900/50 text-red-300` | "high" |
| **Medium** | Yellow background (`bg-yellow-100 text-yellow-800`) | `bg-yellow-900/50 text-yellow-300` | "medium" |
| **Low** | Blue background (`bg-blue-100 text-blue-800`) | `bg-blue-900/50 text-blue-300` | "low" |

```tsx
<span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityClasses[todo.priority]}`}>
  {todo.priority}
</span>
```

### Priority Filter Dropdown

```tsx
<select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
  <option value="all">All Priorities</option>
  <option value="high">High Priority</option>
  <option value="medium">Medium Priority</option>
  <option value="low">Low Priority</option>
</select>
```

---

## Edge Cases

1. **No priority specified**: Default to `'medium'` on both client and server
2. **Invalid priority value**: API should validate and reject values outside `'high' | 'medium' | 'low'`
3. **Priority filter + other filters**: Priority filter combines with search, tag, date, and completion filters using AND logic
4. **Priority in recurring todos**: When a recurring todo completes and creates the next instance, the same priority carries over
5. **Priority in templates**: Templates preserve the priority setting
6. **Priority in export/import**: Priority value preserved during JSON export and restored on import
7. **Dark mode colors**: Priority badge colors must adapt for readability in dark mode
8. **Empty sections after filtering**: If filtering hides all todos in a section, the section should auto-hide

---

## Acceptance Criteria

- [ ] Default priority is Medium when creating a new todo
- [ ] User can select High, Medium, or Low priority from dropdown
- [ ] Priority badge displays with correct color coding (red/yellow/blue)
- [ ] Todos are sorted by priority within each section (High → Medium → Low)
- [ ] User can change priority via the edit modal
- [ ] Priority filter dropdown shows All / High / Medium / Low options
- [ ] Selecting a priority filter shows only matching todos
- [ ] Priority filter combines correctly with other active filters (AND logic)
- [ ] Priority badges adapt colors for dark mode
- [ ] Priority is preserved when completing recurring todos (next instance)
- [ ] Priority is included in JSON export and restored on import
- [ ] Section counters reflect filtered results

---

## Testing Requirements

### E2E Tests (Playwright)

```typescript
// tests/02-todo-crud.spec.ts (priority-related tests)

test('should create todo with default medium priority', async ({ page }) => {
  // Create todo without changing priority, verify "medium" badge
});

test('should create todo with high priority', async ({ page }) => {
  // Select high priority, create, verify red badge
});

test('should create todo with low priority', async ({ page }) => {
  // Select low priority, create, verify blue badge
});

test('should sort todos by priority', async ({ page }) => {
  // Create low, medium, high priority todos
  // Verify order: high first, then medium, then low
});

test('should change priority via edit', async ({ page }) => {
  // Create medium todo, edit to high, verify badge change and re-sort
});

test('should filter by priority', async ({ page }) => {
  // Create todos with different priorities
  // Apply high filter, verify only high priority visible
  // Clear filter, verify all visible
});

test('should combine priority filter with search', async ({ page }) => {
  // Create high "meeting" and low "meeting" todos
  // Search "meeting" + filter High, verify only high "meeting" shows
});
```

---

## Out of Scope

- Custom priority levels (only 3 fixed levels supported)
- Priority-based notifications or escalation
- Priority auto-adjustment based on due date proximity
- Custom priority colors/names
- Priority statistics or analytics dashboard
- Drag-and-drop priority reordering

---

## Success Metrics

- All todos display the correct priority badge color
- Sorting consistently places high priority items first within each section
- Priority filter correctly narrows results with zero false positives/negatives
- Priority transitions (edit) trigger correct re-sorting
- Dark mode badges are readable with sufficient contrast
