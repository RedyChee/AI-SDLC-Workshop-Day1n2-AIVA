# PRP 03: Recurring Todos

## Feature Overview

Recurring todos automatically create the next instance when the current one is completed. Users can set todos to repeat on four patterns: Daily, Weekly, Monthly, or Yearly. The new instance inherits all settings (priority, tags, reminders, recurrence pattern) and has its due date calculated based on the recurrence pattern. A due date is required for recurring todos.

---

## User Stories

1. **As a user**, I want to create a recurring todo so that repetitive tasks are automatically re-created when I complete them.
2. **As a user**, I want to choose a recurrence pattern (daily, weekly, monthly, yearly) so that the next instance appears at the right interval.
3. **As a user**, I want the next instance to keep all my settings (priority, tags, reminders) so that I don't have to reconfigure each time.
4. **As a user**, I want to see a visual indicator on recurring todos so that I can distinguish them from one-time tasks.
5. **As a user**, I want to stop a todo from recurring by editing and disabling the repeat setting.

---

## User Flow

### Creating a Recurring Todo
1. User enters a todo title
2. User checks the **"Repeat"** checkbox
3. Recurrence pattern dropdown appears: **Daily** / **Weekly** / **Monthly** / **Yearly**
4. User selects a pattern
5. User sets a **due date** (required for recurring todos)
6. User optionally sets priority and reminder
7. User clicks **"Add"**
8. Todo appears with a 🔄 recurrence badge (e.g., "🔄 weekly")

### Completing a Recurring Todo
1. User clicks the checkbox on a recurring todo
2. Current instance is marked as complete and moves to Completed section
3. **Automatically**, a new todo is created with:
   - Same title
   - Same priority
   - Same recurrence pattern and `is_recurring = true`
   - Same reminder timing (offset in minutes)
   - Same tags
   - Calculated next due date
4. New instance appears in Pending (or Overdue if already past)

### Stopping Recurrence
1. User clicks **"Edit"** on a recurring todo
2. User unchecks the **"Repeat"** checkbox
3. User clicks **"Update"**
4. 🔄 badge is removed
5. When completed, no next instance is created

---

## Technical Requirements

### Database Schema

Recurrence fields on the `todos` table:

```sql
is_recurring BOOLEAN DEFAULT 0,
recurrence_pattern TEXT  -- 'daily' | 'weekly' | 'monthly' | 'yearly' | NULL
```

### TypeScript Types

```typescript
type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface Todo {
  // ...other fields
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern | null;
}
```

### Due Date Calculation Logic

```typescript
import { getSingaporeNow } from '@/lib/timezone';

function calculateNextDueDate(currentDueDate: string, pattern: RecurrencePattern): string {
  const current = new Date(currentDueDate);

  switch (pattern) {
    case 'daily':
      current.setDate(current.getDate() + 1);
      break;
    case 'weekly':
      current.setDate(current.getDate() + 7);
      break;
    case 'monthly':
      current.setMonth(current.getMonth() + 1);
      break;
    case 'yearly':
      current.setFullYear(current.getFullYear() + 1);
      break;
  }

  return current.toISOString();
}
```

### API Endpoint — Completing a Recurring Todo

The `PUT /api/todos/[id]` handler must detect when a recurring todo is being completed and create the next instance:

```typescript
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Next.js 16 async params
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const existingTodo = todoDB.getById(Number(id), session.userId);

  // If completing a recurring todo, create next instance
  if (body.completed && existingTodo?.is_recurring && existingTodo?.recurrence_pattern) {
    const nextDueDate = calculateNextDueDate(
      existingTodo.due_date!,
      existingTodo.recurrence_pattern as RecurrencePattern
    );

    const newTodo = todoDB.create({
      user_id: session.userId,
      title: existingTodo.title,
      completed: false,
      due_date: nextDueDate,
      priority: existingTodo.priority,
      is_recurring: true,
      recurrence_pattern: existingTodo.recurrence_pattern,
      reminder_minutes: existingTodo.reminder_minutes ?? null,
      last_notification_sent: null,
    });

    // Copy tags from completed todo to new instance
    const tags = todoTagDB.getTagsForTodo(Number(id));
    for (const tag of tags) {
      todoTagDB.addTagToTodo(newTodo.id, tag.id);
    }
  }

  // Update the original todo (mark as completed)
  const updated = todoDB.update(Number(id), session.userId, body);
  return NextResponse.json(updated);
}
```

### What Gets Inherited by Next Instance

| Property | Inherited? | Notes |
|----------|-----------|-------|
| `title` | ✅ Yes | Same title |
| `priority` | ✅ Yes | Same priority level |
| `is_recurring` | ✅ Yes | Stays recurring |
| `recurrence_pattern` | ✅ Yes | Same pattern |
| `reminder_minutes` | ✅ Yes | Same offset (use `?? null`) |
| `tags` | ✅ Yes | Copied via `todoTagDB` |
| `due_date` | ✅ Calculated | Based on pattern |
| `completed` | ❌ No | Always `false` |
| `subtasks` | ❌ No | Not copied |
| `last_notification_sent` | ❌ No | Reset to `null` |

---

## UI Components

### Repeat Checkbox & Pattern Selector (Todo Form)

```tsx
<label>
  <input
    type="checkbox"
    checked={isRecurring}
    onChange={(e) => setIsRecurring(e.target.checked)}
  />
  Repeat
</label>

{isRecurring && (
  <select value={recurrencePattern} onChange={(e) => setRecurrencePattern(e.target.value)}>
    <option value="daily">Daily</option>
    <option value="weekly">Weekly</option>
    <option value="monthly">Monthly</option>
    <option value="yearly">Yearly</option>
  </select>
)}
```

### Recurrence Badge (On Todo Item)

- **Badge text**: "🔄 {pattern}" (e.g., "🔄 weekly")
- **Light mode**: Purple background with border (`bg-purple-100 text-purple-800 border-purple-300`)
- **Dark mode**: Adapted purple tones for visibility
- **Position**: After priority badge, before tag pills

```tsx
{todo.is_recurring && todo.recurrence_pattern && (
  <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
    🔄 {todo.recurrence_pattern}
  </span>
)}
```

### Edit Modal — Repeat Section

- Checkbox for enabling/disabling recurrence
- Pattern dropdown (visible when checked)
- Pre-filled with current values

---

## Edge Cases

1. **Recurring todo without due date**: Prevent creation — due date is required when `is_recurring` is true
2. **Monthly recurrence on 31st**: `setMonth()` handles rollover (e.g., Jan 31 → Feb 28/29)
3. **Yearly recurrence on Feb 29**: Leap year handling — rolls to Feb 28 in non-leap years
4. **Disabling recurrence on existing todo**: Simply uncheck Repeat — completing it won't create a new instance
5. **Enabling recurrence on existing todo**: Must also set a due date if none exists
6. **Recurring todo completion when already overdue**: Next due date is still calculated from the original due date, not from the completion time
7. **Multiple rapid completions**: Each completion creates exactly one next instance
8. **Null coalescing for reminder_minutes**: Always use `existingTodo.reminder_minutes ?? null` when creating next instance

---

## Acceptance Criteria

- [ ] User can enable recurrence via "Repeat" checkbox
- [ ] Recurrence pattern dropdown appears when Repeat is checked
- [ ] Four patterns available: Daily, Weekly, Monthly, Yearly
- [ ] Due date is required when Repeat is enabled
- [ ] 🔄 badge displays on recurring todos with the pattern name
- [ ] Completing a recurring todo creates a new instance
- [ ] New instance has the same title, priority, recurrence, and reminder settings
- [ ] New instance has the correctly calculated next due date
- [ ] Tags are copied to the new instance
- [ ] Subtasks are NOT copied to the new instance
- [ ] `last_notification_sent` is reset to null on the new instance
- [ ] User can disable recurrence by editing and unchecking Repeat
- [ ] Disabled recurrence does not create next instance on completion
- [ ] 🔄 badge adapts for dark mode

---

## Testing Requirements

### E2E Tests (Playwright)

```typescript
// tests/03-recurring-todos.spec.ts

test('should create a daily recurring todo', async ({ page }) => {
  // Enable Repeat, select Daily, set due date, verify badge
});

test('should require due date for recurring todos', async ({ page }) => {
  // Enable Repeat without due date, verify validation error
});

test('should create next instance on completion', async ({ page }) => {
  // Create recurring todo, complete it, verify new instance appears
});

test('should preserve priority on next instance', async ({ page }) => {
  // Create high priority recurring todo, complete, verify new instance is high priority
});

test('should calculate correct next due date for weekly', async ({ page }) => {
  // Create weekly todo due today, complete, verify next due is +7 days
});

test('should calculate correct next due date for monthly', async ({ page }) => {
  // Create monthly todo, complete, verify next month due date
});

test('should stop recurring when Repeat is disabled', async ({ page }) => {
  // Create recurring, edit to disable, complete, verify no new instance
});

test('should copy tags to next instance', async ({ page }) => {
  // Create recurring with tags, complete, verify tags on new instance
});
```

---

## Out of Scope

- Custom recurrence intervals (e.g., every 2 weeks, every 3 months)
- Day-of-week selection for weekly (e.g., Mon/Wed/Fri)
- End date for recurrence (infinite by default)
- Recurrence exception dates (skip holidays)
- "Complete all past instances" bulk action
- iCal/RRULE format support

---

## Success Metrics

- Recurring todos correctly create next instances 100% of the time on completion
- Due date calculation is accurate for all four patterns
- All inherited properties (priority, tags, reminder, pattern) carry over correctly
- No orphaned recurring chains (disabling recurrence cleanly stops the cycle)
- User can identify recurring todos instantly via the 🔄 badge
