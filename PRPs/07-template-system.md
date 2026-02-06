# PRP 07: Template System

## Feature Overview

Save frequently used todo configurations as reusable templates for instant task creation. Templates store todo patterns including title, priority, recurrence settings, and reminder timing. Users can organize templates by category, browse them in a template manager modal, and create todos from templates with one click. Subtasks can optionally be serialized as JSON within the template.

---

## User Stories

1. **As a user**, I want to save a todo configuration as a template so that I can quickly recreate common tasks without re-entering all details.
2. **As a user**, I want to create a todo from a template with one click so that I save time on repetitive task setup.
3. **As a user**, I want to organize templates by category (Work, Personal, etc.) so that I can find the right template quickly.
4. **As a user**, I want to see template details (priority, recurrence, reminders) before using one so that I know what will be created.
5. **As a user**, I want to delete templates I no longer need so that my template library stays manageable.
6. **As a user**, I want to browse all my templates in a dedicated modal so that I have an overview of my saved patterns.

---

## User Flow

### Saving a Template from Todo Form
1. User fills out the todo form (title, priority, recurrence, reminder)
2. **"💾 Save as Template"** button appears when title field is non-empty
3. User clicks the button
4. A modal opens with:
   - **Name** input (required) — pre-filled with todo title
   - **Description** input (optional)
   - **Category** input (optional) — e.g., "Work", "Personal", "Finance"
5. User fills in details and clicks **"Save Template"**
6. Template is saved to the user's library
7. Modal closes, confirmation shown

### Using a Template (Quick Dropdown)
1. In the todo form area, user finds **"Use Template"** dropdown
2. Dropdown lists all saved templates, showing name and category (if set)
   - Example: `"Weekly Review (Work)"`
3. User selects a template
4. A new todo is created instantly with the template's settings
5. Todo appears in the appropriate section (Pending or Overdue)

### Using a Template (Template Manager)
1. User clicks **"📋 Templates"** button in top navigation
2. Template manager modal opens showing all templates
3. Each template displays: name, description, category badge, priority badge, recurrence badge, reminder badge
4. User clicks **"Use"** button on a template
5. Todo is created immediately from the template
6. Modal closes automatically

### Deleting a Template
1. User opens template manager modal
2. User clicks **"Delete"** on any template
3. Template is removed from the library
4. Existing todos created from this template are NOT affected

---

## Technical Requirements

### Database Schema

```sql
CREATE TABLE templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  title_template TEXT NOT NULL,        -- Todo title pattern
  priority TEXT DEFAULT 'medium',      -- 'high' | 'medium' | 'low'
  is_recurring BOOLEAN DEFAULT 0,
  recurrence_pattern TEXT,             -- 'daily' | 'weekly' | 'monthly' | 'yearly'
  reminder_minutes INTEGER,            -- minutes before due date
  subtasks_json TEXT,                  -- JSON array: [{ title, position }]
  due_date_offset_days INTEGER,        -- days from creation to due date
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Key points:**
- `title_template` stores the default todo title when template is used
- `subtasks_json` is a JSON-serialized array of subtask definitions: `[{ "title": "Step 1", "position": 0 }, ...]`
- `due_date_offset_days` allows calculating a due date relative to when the template is used (e.g., 7 = due in 7 days)
- No unique constraint on name — users can have similarly named templates

### TypeScript Interfaces

```typescript
interface Template {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  category: string | null;
  title_template: string;
  priority: Priority;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  reminder_minutes: number | null;
  subtasks_json: string | null;
  due_date_offset_days: number | null;
  created_at: string;
}

// Parsed subtask structure from JSON
interface TemplateSubtask {
  title: string;
  position: number;
}
```

### API Endpoints

#### `GET /api/templates`
- **Auth**: Required (session cookie)
- **Response**: `200 OK` → `Template[]`
- **Behavior**: Returns all templates for `session.userId`

#### `POST /api/templates`
- **Auth**: Required
- **Body**:
  ```json
  {
    "name": "string (required)",
    "description": "string | null",
    "category": "string | null",
    "title_template": "string (required)",
    "priority": "'high' | 'medium' | 'low'",
    "is_recurring": "boolean",
    "recurrence_pattern": "'daily' | 'weekly' | 'monthly' | 'yearly' | null",
    "reminder_minutes": "number | null",
    "subtasks_json": "string | null (JSON array)",
    "due_date_offset_days": "number | null"
  }
  ```
- **Response**: `201 Created` → `Template`
- **Validation**: `name` and `title_template` must not be empty

#### `DELETE /api/templates/[id]`
- **Auth**: Required
- **Params**: `id` (template ID) — `const { id } = await params;` (Next.js 16 async params)
- **Response**: `200 OK` → `{ message: 'Template deleted' }`
- **Behavior**: Verifies template belongs to `session.userId`

#### `POST /api/templates/[id]/use`
- **Auth**: Required
- **Params**: `id` (template ID) — async params
- **Response**: `201 Created` → `Todo` (the newly created todo)
- **Behavior**:
  1. Fetch template by ID, verify ownership
  2. Create new todo with template's `title_template`, `priority`, `is_recurring`, `recurrence_pattern`, `reminder_minutes`
  3. If `due_date_offset_days` is set, calculate due date: `getSingaporeNow() + offset days`
  4. If `subtasks_json` is set, parse JSON and create subtasks for the new todo
  5. Return the created todo

### Database Operations (lib/db.ts)

```typescript
// All operations are SYNCHRONOUS (better-sqlite3)
const templateDB = {
  getAll(userId: number): Template[],
  getById(id: number, userId: number): Template | undefined,
  create(template: Omit<Template, 'id' | 'created_at'>): Template,
  delete(id: number, userId: number): void,
};
```

### Timezone Handling

```typescript
import { getSingaporeNow } from '@/lib/timezone';

// When using a template with due_date_offset_days:
if (template.due_date_offset_days) {
  const now = getSingaporeNow();
  now.setDate(now.getDate() + template.due_date_offset_days);
  // Use this as the new todo's due_date
}
```

---

## UI Components

### "Save as Template" Button
- Appears on the todo form when title input is non-empty
- Label: **"💾 Save as Template"**
- Opens the save template modal

### Save Template Modal
- **Name** input (required, pre-filled with current todo title)
- **Description** textarea (optional)
- **Category** input (optional, text field)
- Preview of settings being saved (priority, recurrence, reminder)
- **"Save Template"** button and **"Cancel"** button

### "Use Template" Dropdown
- Located in the todo form area
- Lists all user templates
- Format: `"Template Name"` or `"Template Name (Category)"` if category exists
- Selecting a template immediately creates a todo

### Template Manager Modal
- **Trigger**: "📋 Templates" button in top navigation
- **Content**: List of all templates, each showing:
  - **Name** (bold)
  - **Description** (if set, smaller text)
  - **Category** badge (if set, color-coded)
  - **Priority** badge (color-coded: red/yellow/blue)
  - **Recurrence** badge (🔄 pattern, if recurring)
  - **Reminder** badge (🔔 timing, if set)
  - **"Use"** button — creates todo from template
  - **"Delete"** button — removes template

### Template Information Display

```
┌─────────────────────────────────────────────────┐
│ Weekly Team Meeting                    [Use] [Del]│
│ Review agenda and prepare notes                  │
│ [Work] [🟡 Medium] [🔄 weekly] [🔔 1h]         │
└─────────────────────────────────────────────────┘
```

---

## Edge Cases

1. **Empty template name**: Reject — name is required
2. **Empty title_template**: Reject — title_template is required
3. **Invalid subtasks_json**: Validate JSON structure before saving; reject malformed JSON
4. **Template with offset but no due date enforced**: Due date calculated from offset; if offset is null, no due date set
5. **Deleting a template**: Does NOT affect existing todos created from it
6. **Using a template with recurring settings**: New todo gets recurrence; due date required for recurring (calculated from offset or current time)
7. **Category display**: Categories are free-text; no predefined list
8. **No templates exist**: "Use Template" dropdown shows empty state or is hidden
9. **Subtask JSON serialization**: Always serialize as `JSON.stringify([{ title, position }])` and parse with `JSON.parse()`
10. **Large number of templates**: Scrollable list in modal; no pagination needed for typical usage

---

## Acceptance Criteria

- [ ] User can save current todo form settings as a template
- [ ] Template name is required and cannot be empty
- [ ] Template title_template is required
- [ ] User can add optional description and category
- [ ] Templates appear in the "Use Template" dropdown
- [ ] Templates show category in parentheses in dropdown (if set)
- [ ] Selecting a template from dropdown creates a todo instantly
- [ ] Template manager modal shows all user templates
- [ ] Template details (priority, recurrence, reminder, category) display correctly
- [ ] User can create a todo from template via "Use" button in modal
- [ ] Created todo inherits template's priority, recurrence, and reminder settings
- [ ] Due date calculated from offset when template is used
- [ ] Subtasks created from subtasks_json when template is used
- [ ] User can delete a template
- [ ] Deleting a template does NOT affect existing todos
- [ ] All template operations require authentication
- [ ] Templates are user-scoped (users only see their own templates)

---

## Testing Requirements

### E2E Tests (Playwright)

```typescript
// tests/07-templates.spec.ts

test('should save a template from todo form', async ({ page }) => {
  // Fill todo form, click Save as Template, enter name, save, verify in list
});

test('should create todo from template via dropdown', async ({ page }) => {
  // Save template, select from dropdown, verify todo created with correct settings
});

test('should create todo from template via modal', async ({ page }) => {
  // Save template, open modal, click Use, verify todo created
});

test('should display template details in modal', async ({ page }) => {
  // Save template with all settings, open modal, verify badges and info
});

test('should delete a template', async ({ page }) => {
  // Save template, open modal, delete, verify removed from list
});

test('should reject empty template name', async ({ page }) => {
  // Try saving template without name, verify rejection
});

test('should show category in dropdown', async ({ page }) => {
  // Save template with category, verify dropdown shows "Name (Category)"
});

test('should create subtasks from template', async ({ page }) => {
  // Save template with subtasks, use template, verify subtasks created
});

test('should calculate due date from offset', async ({ page }) => {
  // Save template with offset, use template, verify due date
});
```

---

## Out of Scope

- Template sharing between users
- Template versioning or history
- Template scheduling (auto-create at specific times)
- Template import/export as standalone feature
- Template editing (must delete and recreate)
- Template tags (tags are assigned when creating from template, not stored in template)
- Nested templates or template composition
- Template usage statistics or analytics
- Template ordering or sorting preferences

---

## Success Metrics

- Users can save and use templates without errors
- Todo created from template correctly inherits all settings
- Subtask JSON serialization/deserialization works reliably
- Due date offset calculation produces correct Singapore timezone dates
- Template operations complete in < 500ms (API response time)
- Template manager provides clear overview of all available templates
- Templates are correctly scoped to the authenticated user
