# PRP-07: Template System

## Feature Overview

The Template System enables users to save frequently used todo patterns as reusable templates for instant task creation. Templates preserve todo settings (title, priority, recurrence, reminders, subtasks) while allowing flexible due date calculation through offset-based scheduling. This feature eliminates repetitive data entry for common tasks like weekly reports, monthly reviews, or recurring meetings.

### Core Functionality
- **Save Todo Patterns**: Convert current todo form state into reusable template
- **Instant Creation**: One-click todo generation from template with preserved settings
- **Subtasks Serialization**: JSON storage of subtask lists for template reuse
- **Due Date Offset**: Calculate due dates relative to creation time (e.g., "3 days from now")
- **Template Categories**: Organize templates by context (Work, Personal, Finance, etc.)
- **Template Management**: CRUD operations via dedicated modal interface
- **Quick Access**: Dropdown selector in todo form for fast template use

### User Value
- Eliminate repetitive typing for common tasks
- Ensure consistent task structure across recurring patterns
- Speed up todo creation (3 seconds vs. 30 seconds manually)
- Maintain standardized workflows (e.g., onboarding checklists)
- Organize templates by category for quick discovery
- Preserve complex subtask lists for reuse

---

## User Stories

### Story 1: Save Todo as Template
**As a** user with repetitive tasks  
**I want to** save my current todo form as a reusable template  
**So that** I can quickly create similar tasks in the future

**Acceptance Criteria:**
- "💾 Save as Template" button visible when title filled
- Button opens template save modal
- Modal captures template name (required)
- Modal captures description (optional)
- Modal captures category (optional, dropdown with suggestions)
- Template preserves: title, priority, recurrence, reminder, subtasks
- Template appears in template library immediately
- Original form remains unchanged after saving

### Story 2: Create Todo from Template (Dropdown)
**As a** user wanting quick task creation  
**I want to** select a template from dropdown in todo form  
**So that** a todo is created instantly without manual entry

**Acceptance Criteria:**
- "Use Template" dropdown visible in todo form
- Dropdown lists all user's templates
- Templates show category in parentheses if set (e.g., "Weekly Review (Work)")
- Selecting template creates todo immediately
- Todo inherits all template settings
- Due date calculated from offset (if template has one)
- Form resets after template use
- No modal interaction required

### Story 3: Browse and Use Templates (Manager Modal)
**As a** user managing multiple templates  
**I want to** view all templates in organized list  
**So that** I can see details and use templates selectively

**Acceptance Criteria:**
- "📋 Templates" button visible in navigation
- Button opens template manager modal
- Modal shows all templates in list format
- Each template displays: name, description, category badge, priority badge, recurrence badge, reminder badge
- "Use" button on each template creates todo
- Modal closes after using template
- Templates sorted by category, then name

### Story 4: Categorize Templates
**As a** user with many templates  
**I want to** organize templates by category  
**So that** I can find relevant templates quickly

**Acceptance Criteria:**
- Category dropdown in template save modal
- Suggested categories: Work, Personal, Finance, Health, Education
- Can type custom category name
- Category appears as colored badge on template
- Templates grouped by category in manager
- Can filter/sort by category in manager

### Story 5: Edit Template Details
**As a** user refining my workflow  
**I want to** update template name, description, and category  
**So that** templates remain relevant and well-organized

**Acceptance Criteria:**
- "Edit" button on each template in manager
- Edit modal pre-fills current values
- Can update name, description, category
- Cannot edit template settings (priority, recurrence) - must create new template
- "Update" button saves changes
- Changes reflect immediately in list
- Validation prevents empty name

### Story 6: Delete Unused Templates
**As a** user cleaning up my workspace  
**I want to** delete templates I no longer need  
**So that** my template library stays relevant

**Acceptance Criteria:**
- "Delete" button on each template in manager
- Confirmation dialog before deletion
- Deleting template does NOT affect existing todos
- Template disappears from library immediately
- Template removed from dropdown selector

### Story 7: Templates with Subtasks
**As a** user creating structured workflows  
**I want to** templates to preserve subtask lists  
**So that** I can reuse complex checklists

**Acceptance Criteria:**
- Subtasks in todo form saved with template (JSON serialization)
- Using template creates todo with all subtasks
- Subtasks maintain position/order
- All subtasks start uncompleted
- Template shows subtask count in manager (e.g., "3 subtasks")

### Story 8: Due Date Offset Calculation
**As a** user scheduling tasks from templates  
**I want to** templates to calculate due dates relative to now  
**So that** recurring workflows have appropriate deadlines

**Acceptance Criteria:**
- Template save modal has "Due in" offset field
- Offset options: 1 day, 3 days, 1 week, 2 weeks, 1 month, Custom (number of days)
- Using template calculates due_date = now + offset (Singapore timezone)
- If no offset, todo created without due date
- Offset preserved in template for future use
- Custom offset allows 1-365 days

---

## User Flow

### Flow 1: Saving First Template from Todo Form
1. User fills todo form: "Write weekly status report"
2. Sets priority: High
3. Sets reminder: 1 day before
4. Adds subtask: "Collect metrics"
5. Adds subtask: "Write summary"
6. Adds subtask: "Get manager review"
7. User clicks "💾 Save as Template" button
8. Template save modal opens
9. User enters name: "Weekly Status Report"
10. User enters description: "Friday deliverable for team"
11. User selects category: "Work" from dropdown
12. User sets due offset: "1 week" from dropdown
13. User clicks "Save Template"
14. POST request to `/api/templates`
15. Template created with:
    - `title_template` = "Write weekly status report"
    - `priority` = "high"
    - `reminder_minutes` = 1440
    - `subtasks_json` = `[{"title":"Collect metrics","position":0},{"title":"Write summary","position":1},{"title":"Get manager review","position":2}]`
    - `category` = "Work"
    - `due_offset_days` = 7
16. Modal closes, success message shows
17. Original todo form still filled (not cleared)
18. User can still create todo or clear form

### Flow 2: Creating Todo from Template (Dropdown)
1. User visits todo page
2. User sees "Use Template" dropdown in form
3. Dropdown shows: "Weekly Status Report (Work)", "Monthly Review (Work)", "Grocery Run (Personal)"
4. User selects "Weekly Status Report (Work)"
5. POST request to `/api/templates/[id]/use`
6. Backend:
   - Fetches template
   - Calculates due_date = getSingaporeNow() + 7 days
   - Creates todo with template settings
   - Deserializes subtasks_json
   - Creates subtasks linked to new todo
7. Response returns new todo with ID
8. Todo appears in list:
   - Title: "Write weekly status report"
   - Priority: High badge (red)
   - Due date: 7 days from now
   - Reminder: 1 day before due
   - 3 uncompleted subtasks
   - Progress bar at 0%
9. Todo form clears
10. User can immediately create another todo or use another template

### Flow 3: Opening Template Manager
1. User clicks "📋 Templates" button in navigation
2. Template manager modal opens
3. Modal shows header: "Template Library"
4. User sees 5 templates organized by category:

**Work Category:**
- **Weekly Status Report**
  - Description: "Friday deliverable for team"
  - Badges: 🎯 High, 🔔 1 day, 📝 3 subtasks
  - Due offset: 1 week
  - [Use] [Edit] [Delete] buttons

- **Monthly Review**
  - Description: "End of month performance analysis"
  - Badges: 🎯 Medium, 🔄 Monthly
  - Due offset: 1 month
  - [Use] [Edit] [Delete] buttons

**Personal Category:**
- **Grocery Run**
  - No description
  - Badges: 🎯 Low, 📝 5 subtasks
  - Due offset: 3 days
  - [Use] [Edit] [Delete] buttons

5. User can scroll through templates
6. Each template shows complete details at a glance

### Flow 4: Using Template from Manager
1. User in template manager modal
2. User sees "Monthly Review" template
3. User clicks "Use" button
4. POST request to `/api/templates/[id]/use`
5. Todo created with monthly offset (30 days from now)
6. Modal closes automatically
7. User returns to main page
8. New todo visible in list with calculated due date

### Flow 5: Creating Template with Custom Category
1. User fills todo form: "Review quarterly budget"
2. Sets priority: Medium
3. Clicks "💾 Save as Template"
4. Modal opens
5. User enters name: "Quarterly Budget Review"
6. User clicks category dropdown
7. Dropdown shows: Work, Personal, Finance, Health, Education, [Custom...]
8. User types custom category: "Leadership"
9. User sets due offset: Custom → enters "90" (days)
10. Clicks "Save Template"
11. Template saved with category = "Leadership"
12. Template manager now shows "Leadership" category section

### Flow 6: Editing Template
1. User opens template manager
2. User clicks "Edit" on "Weekly Status Report"
3. Edit modal opens with current values:
   - Name: "Weekly Status Report"
   - Description: "Friday deliverable for team"
   - Category: "Work"
4. User changes name to "Weekly Team Update"
5. User updates description to "Weekly progress report for standup"
6. Category remains "Work"
7. User clicks "Update"
8. PUT request to `/api/templates/[id]`
9. Template updated
10. Modal closes
11. Template list refreshes showing new name
12. Note: Cannot edit priority/recurrence/subtasks - those are fixed in template

### Flow 7: Deleting Template
1. User opens template manager
2. User has old template "Daily Standup Notes" no longer used
3. User clicks "Delete" button
4. Confirmation dialog: "Delete 'Daily Standup Notes' template? This will not affect existing todos."
5. User clicks "Confirm"
6. DELETE request to `/api/templates/[id]`
7. Template removed from database
8. Template disappears from list
9. Template no longer appears in dropdown selector
10. Existing todos created from this template remain unchanged

### Flow 8: Template with No Due Offset
1. User creates template: "Quick note to self"
2. Priority: Low
3. No due date set, no offset set
4. Saves template with offset = null
5. Later, user selects template from dropdown
6. Todo created without due_date
7. Todo appears in "No Due Date" section
8. All other settings (priority, title) still applied

### Flow 9: Template with Complex Subtasks
1. User creates todo: "Monthly blog post"
2. Adds 6 subtasks:
   - "Research topic ideas"
   - "Outline structure"
   - "Write first draft"
   - "Add images and code samples"
   - "Proofread and edit"
   - "Publish and share"
3. Saves as template with category "Content"
4. Subtasks serialized to JSON: `[{"title":"Research topic ideas","position":0}, ...]`
5. Later, user uses template
6. Todo created with all 6 subtasks in correct order
7. All subtasks unchecked (completed: false)
8. Progress bar shows 0% (0/6 completed)

### Flow 10: Multiple Templates for Same Workflow
1. User has 3 similar templates:
   - "Client Meeting Prep (Work)" - High priority, 3 days offset, 5 subtasks
   - "Internal Meeting Prep (Work)" - Medium priority, 1 day offset, 3 subtasks
   - "Executive Meeting Prep (Work)" - High priority, 1 week offset, 8 subtasks
2. All in "Work" category
3. User picks appropriate one based on meeting type
4. Each creates todo with different urgency and detail level
5. Demonstrates template flexibility for variations on same theme

### Flow 11: Template with Recurrence Settings
1. User creates template: "Monthly expense report"
2. Sets recurrence: Monthly
3. Sets priority: Medium
4. Sets reminder: 2 days before
5. Saves template with category: "Finance"
6. Using template creates recurring todo
7. Completing todo creates next instance automatically
8. Template enables quick setup of complex recurring patterns

---

## Technical Requirements

### Database Schema

#### `templates` Table Updates

```sql
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0 AND length(name) <= 100),
  description TEXT DEFAULT NULL CHECK(description IS NULL OR length(description) <= 500),
  category TEXT DEFAULT NULL CHECK(category IS NULL OR length(category) <= 50),
  title_template TEXT NOT NULL CHECK(length(trim(title_template)) > 0),
  priority TEXT NOT NULL CHECK(priority IN ('high', 'medium', 'low')),
  recurrence_enabled INTEGER NOT NULL DEFAULT 0 CHECK(recurrence_enabled IN (0, 1)),
  recurrence_pattern TEXT DEFAULT NULL CHECK(
    recurrence_pattern IS NULL OR 
    recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly')
  ),
  reminder_minutes INTEGER DEFAULT NULL CHECK(
    reminder_minutes IS NULL OR 
    reminder_minutes IN (15, 30, 60, 120, 1440, 2880, 10080)
  ),
  due_offset_days INTEGER DEFAULT NULL CHECK(
    due_offset_days IS NULL OR 
    (due_offset_days >= 1 AND due_offset_days <= 365)
  ),
  subtasks_json TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name COLLATE NOCASE)
);

-- Index for user's templates lookup
CREATE INDEX idx_templates_user_id ON templates(user_id);

-- Index for category filtering
CREATE INDEX idx_templates_category ON templates(user_id, category);
```

**Column Details:**
- `id`: Primary key, auto-increment
- `user_id`: Foreign key to users.id with CASCADE delete
- `name`: Template identifier, 1-100 characters, unique per user (case-insensitive)
- `description`: Optional details, max 500 characters
- `category`: Optional grouping label, max 50 characters
- `title_template`: The todo title to use, required
- `priority`: Must be 'high', 'medium', or 'low'
- `recurrence_enabled`: Boolean (0/1) for recurring todos
- `recurrence_pattern`: If enabled, one of: daily, weekly, monthly, yearly
- `reminder_minutes`: Standard reminder intervals (same as todos)
- `due_offset_days`: Days from creation to due date (1-365), null = no due date
- `subtasks_json`: JSON array of subtasks: `[{"title":"...", "position":0}, ...]`
- `created_at`: ISO8601 timestamp (Singapore timezone)
- `updated_at`: ISO8601 timestamp (Singapore timezone)

**Constraints:**
- `CHECK` on name: Non-empty, max 100 chars
- `CHECK` on description: Max 500 chars or null
- `CHECK` on category: Max 50 chars or null
- `CHECK` on priority: Valid enum value
- `CHECK` on recurrence_enabled: Boolean 0 or 1
- `CHECK` on recurrence_pattern: Valid enum or null
- `CHECK` on reminder_minutes: Valid interval or null
- `CHECK` on due_offset_days: 1-365 or null
- `UNIQUE` on (user_id, name): Case-insensitive unique names per user

### TypeScript Types

#### `lib/db.ts` Updates

```typescript
// Template interface
export interface Template {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  category: string | null;
  title_template: string;
  priority: Priority;
  recurrence_enabled: 0 | 1;
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  due_offset_days: number | null;
  subtasks_json: string | null;
  created_at: string;
  updated_at: string;
}

// Template creation input
export interface CreateTemplateInput {
  user_id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  title_template: string;
  priority: Priority;
  recurrence_enabled?: 0 | 1;
  recurrence_pattern?: RecurrencePattern | null;
  reminder_minutes?: number | null;
  due_offset_days?: number | null;
  subtasks?: SubtaskInput[];
}

// Template update input (name, description, category only)
export interface UpdateTemplateInput {
  name?: string;
  description?: string | null;
  category?: string | null;
}

// Subtask input for template serialization
export interface SubtaskInput {
  title: string;
  position: number;
}

// Template with parsed subtasks (for display)
export interface TemplateWithSubtasks extends Template {
  subtasks: SubtaskInput[];
}

// Suggested categories
export const SUGGESTED_CATEGORIES = [
  'Work',
  'Personal',
  'Finance',
  'Health',
  'Education',
] as const;

// Due offset presets (in days)
export const DUE_OFFSET_PRESETS = [
  { label: '1 day', value: 1 },
  { label: '3 days', value: 3 },
  { label: '1 week', value: 7 },
  { label: '2 weeks', value: 14 },
  { label: '1 month', value: 30 },
  { label: 'Custom', value: null },
] as const;
```

#### Validation Functions

```typescript
// Validate template name
export function validateTemplateName(name: any): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 100) return null;
  return trimmed;
}

// Validate template description
export function validateTemplateDescription(description: any): string | null {
  if (description === null || description === undefined) return null;
  if (typeof description !== 'string') return null;
  const trimmed = description.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 500) return null;
  return trimmed;
}

// Validate category
export function validateCategory(category: any): string | null {
  if (category === null || category === undefined) return null;
  if (typeof category !== 'string') return null;
  const trimmed = category.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 50) return null;
  return trimmed;
}

// Validate due offset days
export function validateDueOffsetDays(days: any): number | null {
  if (days === null || days === undefined) return null;
  const num = typeof days === 'string' ? parseInt(days, 10) : days;
  if (isNaN(num)) return null;
  if (num < 1 || num > 365) return null;
  return num;
}

// Serialize subtasks to JSON
export function serializeSubtasks(subtasks: SubtaskInput[]): string | null {
  if (!subtasks || subtasks.length === 0) return null;
  return JSON.stringify(subtasks);
}

// Deserialize subtasks from JSON
export function deserializeSubtasks(json: string | null): SubtaskInput[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SubtaskInput =>
        typeof item === 'object' &&
        typeof item.title === 'string' &&
        typeof item.position === 'number'
    );
  } catch {
    return [];
  }
}

// Check if template name is unique for user
export function isTemplateNameUnique(
  userId: number,
  name: string,
  excludeTemplateId?: number
): boolean {
  const query = excludeTemplateId
    ? `SELECT COUNT(*) as count FROM templates WHERE user_id = ? AND LOWER(name) = LOWER(?) AND id != ?`
    : `SELECT COUNT(*) as count FROM templates WHERE user_id = ? AND LOWER(name) = LOWER(?)`;
  
  const params = excludeTemplateId ? [userId, name, excludeTemplateId] : [userId, name];
  const result = db.prepare(query).get(...params) as { count: number };
  return result.count === 0;
}

// Calculate due date from offset
export function calculateDueDateFromOffset(offsetDays: number | null): string | null {
  if (offsetDays === null) return null;
  
  const { getSingaporeNow, toSingaporeISO } = require('./timezone');
  const now = getSingaporeNow();
  now.setDate(now.getDate() + offsetDays);
  return toSingaporeISO(now);
}
```

#### Database Interface

```typescript
export const templateDB = {
  // Create template
  create(input: CreateTemplateInput): Template {
    const { getSingaporeNow, toSingaporeISO } = require('./timezone');
    const now = toSingaporeISO(getSingaporeNow());
    
    const name = validateTemplateName(input.name);
    if (!name) {
      throw new Error('Invalid template name');
    }
    
    // Check uniqueness
    if (!isTemplateNameUnique(input.user_id, name)) {
      throw new Error('Template name already exists');
    }
    
    const description = validateTemplateDescription(input.description);
    const category = validateCategory(input.category);
    const subtasksJson = input.subtasks 
      ? serializeSubtasks(input.subtasks) 
      : null;
    const dueOffset = validateDueOffsetDays(input.due_offset_days);
    
    const query = `
      INSERT INTO templates (
        user_id, name, description, category, title_template,
        priority, recurrence_enabled, recurrence_pattern,
        reminder_minutes, due_offset_days, subtasks_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = db.prepare(query).run(
      input.user_id,
      name,
      description,
      category,
      input.title_template,
      input.priority,
      input.recurrence_enabled ?? 0,
      input.recurrence_pattern ?? null,
      input.reminder_minutes ?? null,
      dueOffset,
      subtasksJson,
      now,
      now
    );
    
    return this.getById(Number(result.lastInsertRowid));
  },
  
  // Get template by ID
  getById(id: number): Template {
    const query = 'SELECT * FROM templates WHERE id = ?';
    const template = db.prepare(query).get(id) as Template | undefined;
    if (!template) {
      throw new Error('Template not found');
    }
    return template;
  },
  
  // Get all templates for user
  getAllByUser(userId: number): Template[] {
    const query = `
      SELECT * FROM templates 
      WHERE user_id = ? 
      ORDER BY category NULLS LAST, name COLLATE NOCASE ASC
    `;
    return db.prepare(query).all(userId) as Template[];
  },
  
  // Get templates by category
  getByCategory(userId: number, category: string): Template[] {
    const query = `
      SELECT * FROM templates 
      WHERE user_id = ? AND category = ?
      ORDER BY name COLLATE NOCASE ASC
    `;
    return db.prepare(query).all(userId, category) as Template[];
  },
  
  // Update template (name, description, category only)
  update(id: number, userId: number, updates: UpdateTemplateInput): Template {
    const { getSingaporeNow, toSingaporeISO } = require('./timezone');
    const now = toSingaporeISO(getSingaporeNow());
    
    const existing = this.getById(id);
    
    // Verify ownership
    if (existing.user_id !== userId) {
      throw new Error('Template not found');
    }
    
    // Validate and update name if provided
    let name = existing.name;
    if (updates.name !== undefined) {
      const validated = validateTemplateName(updates.name);
      if (!validated) {
        throw new Error('Invalid template name');
      }
      // Check uniqueness (excluding current template)
      if (!isTemplateNameUnique(userId, validated, id)) {
        throw new Error('Template name already exists');
      }
      name = validated;
    }
    
    // Validate and update description if provided
    let description = existing.description;
    if ('description' in updates) {
      description = validateTemplateDescription(updates.description);
    }
    
    // Validate and update category if provided
    let category = existing.category;
    if ('category' in updates) {
      category = validateCategory(updates.category);
    }
    
    const query = `
      UPDATE templates 
      SET name = ?, description = ?, category = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `;
    
    db.prepare(query).run(name, description, category, now, id, userId);
    return this.getById(id);
  },
  
  // Delete template
  delete(id: number, userId: number): void {
    // Verify ownership
    const template = this.getById(id);
    if (template.user_id !== userId) {
      throw new Error('Template not found');
    }
    
    const query = 'DELETE FROM templates WHERE id = ? AND user_id = ?';
    db.prepare(query).run(id, userId);
  },
  
  // Use template to create todo
  use(id: number, userId: number): Todo {
    const template = this.getById(id);
    
    // Verify ownership
    if (template.user_id !== userId) {
      throw new Error('Template not found');
    }
    
    // Calculate due date from offset
    const dueDate = calculateDueDateFromOffset(template.due_offset_days);
    
    // Determine recurrence pattern
    const recurrencePattern = template.recurrence_enabled === 1 && template.recurrence_pattern
      ? template.recurrence_pattern
      : 'none';
    
    // Create todo
    const todo = todoDB.create({
      user_id: userId,
      title: template.title_template,
      priority: template.priority,
      due_date: dueDate,
      recurrence_pattern: recurrencePattern,
      reminder_minutes: template.reminder_minutes,
      last_notification_sent: null,
    });
    
    // Create subtasks if template has them
    const subtasks = deserializeSubtasks(template.subtasks_json);
    for (const subtaskInput of subtasks) {
      subtaskDB.create({
        todo_id: todo.id,
        title: subtaskInput.title,
        position: subtaskInput.position,
      });
    }
    
    return todo;
  },
  
  // Get template with parsed subtasks
  getWithSubtasks(id: number): TemplateWithSubtasks {
    const template = this.getById(id);
    const subtasks = deserializeSubtasks(template.subtasks_json);
    return { ...template, subtasks };
  },
  
  // Get all templates with parsed subtasks
  getAllWithSubtasks(userId: number): TemplateWithSubtasks[] {
    const templates = this.getAllByUser(userId);
    return templates.map(template => {
      const subtasks = deserializeSubtasks(template.subtasks_json);
      return { ...template, subtasks };
    });
  },
};
```

### API Endpoints

#### `POST /api/templates`
Create a new template.

**Request:**
```typescript
{
  name: string;
  description?: string;
  category?: string;
  title_template: string;
  priority: 'high' | 'medium' | 'low';
  recurrence_enabled?: 0 | 1;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  reminder_minutes?: number | null;
  due_offset_days?: number | null;
  subtasks?: Array<{ title: string; position: number }>;
}
```

**Response:**
```typescript
{
  template: Template;
}
```

**Implementation:**
```typescript
// app/api/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    const template = templateDB.create({
      user_id: session.userId,
      name: body.name,
      description: body.description,
      category: body.category,
      title_template: body.title_template,
      priority: body.priority,
      recurrence_enabled: body.recurrence_enabled,
      recurrence_pattern: body.recurrence_pattern,
      reminder_minutes: body.reminder_minutes,
      due_offset_days: body.due_offset_days,
      subtasks: body.subtasks,
    });
    
    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error('Create template error:', error);
    
    if (error.message === 'Template name already exists') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const templates = templateDB.getAllWithSubtasks(session.userId);
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
```

#### `PUT /api/templates/[id]`
Update template metadata (name, description, category).

**Request:**
```typescript
{
  name?: string;
  description?: string | null;
  category?: string | null;
}
```

**Response:**
```typescript
{
  template: Template;
}
```

**Implementation:**
```typescript
// app/api/templates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const { id } = await context.params;
  const templateId = parseInt(id, 10);
  
  try {
    const body = await request.json();
    
    const template = templateDB.update(templateId, session.userId, {
      name: body.name,
      description: body.description,
      category: body.category,
    });
    
    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Update template error:', error);
    
    if (error.message === 'Template not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message === 'Template name already exists') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const { id } = await context.params;
  const templateId = parseInt(id, 10);
  
  try {
    templateDB.delete(templateId, session.userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete template error:', error);
    
    if (error.message === 'Template not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
```

#### `POST /api/templates/[id]/use`
Create todo from template.

**Request:** None (POST body empty)

**Response:**
```typescript
{
  todo: TodoWithSubtasks;
}
```

**Implementation:**
```typescript
// app/api/templates/[id]/use/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { templateDB, subtaskDB, calculateProgress } from '@/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const { id } = await context.params;
  const templateId = parseInt(id, 10);
  
  try {
    // Use template to create todo (includes subtasks)
    const todo = templateDB.use(templateId, session.userId);
    
    // Fetch subtasks and progress for response
    const subtasks = subtaskDB.getByTodoId(todo.id);
    const progress = calculateProgress(subtasks);
    
    return NextResponse.json({ 
      todo: { ...todo, subtasks, progress } 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Use template error:', error);
    
    if (error.message === 'Template not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to create todo from template' },
      { status: 500 }
    );
  }
}
```

### Frontend Implementation

#### Template Save Modal Component

```typescript
// components/TemplateSaveModal.tsx
import { useState } from 'react';
import { Priority, RecurrencePattern, SUGGESTED_CATEGORIES, DUE_OFFSET_PRESETS } from '@/lib/db';

interface TemplateSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateData: TemplateSaveData) => Promise<void>;
  currentTodo: {
    title: string;
    priority: Priority;
    recurrenceEnabled: boolean;
    recurrencePattern: RecurrencePattern | null;
    reminderMinutes: number | null;
    subtasks: Array<{ title: string; position: number }>;
  };
}

export interface TemplateSaveData {
  name: string;
  description?: string;
  category?: string;
  dueOffsetDays?: number | null;
}

export function TemplateSaveModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentTodo 
}: TemplateSaveModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState(false);
  const [dueOffsetPreset, setDueOffsetPreset] = useState<string>('');
  const [customDays, setCustomDays] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSave = async () => {
    if (!name.trim() || isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      let dueOffsetDays: number | null = null;
      
      if (dueOffsetPreset && dueOffsetPreset !== 'custom') {
        dueOffsetDays = parseInt(dueOffsetPreset, 10);
      } else if (dueOffsetPreset === 'custom' && customDays) {
        dueOffsetDays = parseInt(customDays, 10);
      }
      
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        dueOffsetDays,
      });
      
      // Reset form
      setName('');
      setDescription('');
      setCategory('');
      setCustomCategory(false);
      setDueOffsetPreset('');
      setCustomDays('');
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Save as Template</h2>
        
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekly Status Report"
              maxLength={100}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
                dark:border-gray-600 dark:text-white"
              autoFocus
            />
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Weekly deliverable for team..."
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
                dark:border-gray-600 dark:text-white resize-none"
            />
          </div>
          
          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">
              Category (optional)
            </label>
            {customCategory ? (
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter custom category..."
                maxLength={50}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
                  dark:border-gray-600 dark:text-white"
              />
            ) : (
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setCustomCategory(true);
                    setCategory('');
                  } else {
                    setCategory(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
                  dark:border-gray-600 dark:text-white"
              >
                <option value="">No category</option>
                {SUGGESTED_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="custom">Custom...</option>
              </select>
            )}
          </div>
          
          {/* Due Offset */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">
              Due Date Offset (optional)
            </label>
            <select
              value={dueOffsetPreset}
              onChange={(e) => setDueOffsetPreset(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
                dark:border-gray-600 dark:text-white"
            >
              <option value="">No due date</option>
              {DUE_OFFSET_PRESETS.map(preset => (
                <option 
                  key={preset.label} 
                  value={preset.value ?? 'custom'}
                >
                  {preset.label}
                </option>
              ))}
            </select>
            
            {dueOffsetPreset === 'custom' && (
              <input
                type="number"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="Enter days (1-365)"
                min={1}
                max={365}
                className="w-full mt-2 px-3 py-2 border rounded-lg dark:bg-gray-700 
                  dark:border-gray-600 dark:text-white"
              />
            )}
          </div>
          
          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Template will save:
            </p>
            <ul className="text-sm space-y-1 dark:text-gray-300">
              <li>📝 Title: "{currentTodo.title}"</li>
              <li>🎯 Priority: {currentTodo.priority}</li>
              {currentTodo.recurrenceEnabled && (
                <li>🔄 Recurrence: {currentTodo.recurrencePattern}</li>
              )}
              {currentTodo.reminderMinutes && (
                <li>🔔 Reminder: {currentTodo.reminderMinutes} minutes</li>
              )}
              {currentTodo.subtasks.length > 0 && (
                <li>✓ {currentTodo.subtasks.length} subtasks</li>
              )}
            </ul>
          </div>
          
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!name.trim() || isLoading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg 
                hover:bg-blue-600 disabled:opacity-50"
            >
              Save Template
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg 
                hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Template Manager Modal Component

```typescript
// components/TemplateManagerModal.tsx
import { useState, useEffect } from 'react';
import { TemplateWithSubtasks } from '@/lib/db';

interface TemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (templateId: number) => void;
  onEditTemplate: (template: TemplateWithSubtasks) => void;
  onDeleteTemplate: (templateId: number) => void;
}

export function TemplateManagerModal({
  isOpen,
  onClose,
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
}: TemplateManagerModalProps) {
  const [templates, setTemplates] = useState<TemplateWithSubtasks[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);
  
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Fetch templates error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUse = async (templateId: number) => {
    onUseTemplate(templateId);
    onClose();
  };
  
  const handleDelete = async (template: TemplateWithSubtasks) => {
    const confirmed = confirm(
      `Delete "${template.name}" template? This will not affect existing todos.`
    );
    if (confirmed) {
      onDeleteTemplate(template.id);
      await fetchTemplates();
    }
  };
  
  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const cat = template.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(template);
    return acc;
  }, {} as Record<string, TemplateWithSubtasks[]>);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Template Library</h2>
        
        {isLoading ? (
          <p className="text-center py-8 text-gray-500">Loading templates...</p>
        ) : templates.length === 0 ? (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">
            No templates yet. Save your first template from the todo form!
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 dark:text-white">
                  {category}
                </h3>
                
                <div className="space-y-3">
                  {categoryTemplates.map(template => (
                    <div
                      key={template.id}
                      className="border dark:border-gray-700 rounded-lg p-4 
                        hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg dark:text-white mb-1">
                            {template.name}
                          </h4>
                          
                          {template.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {template.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            {/* Priority badge */}
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              template.priority === 'high' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : template.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              🎯 {template.priority}
                            </span>
                            
                            {/* Recurrence badge */}
                            {template.recurrence_enabled === 1 && template.recurrence_pattern && (
                              <span className="px-2 py-1 rounded text-xs font-medium 
                                bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                🔄 {template.recurrence_pattern}
                              </span>
                            )}
                            
                            {/* Reminder badge */}
                            {template.reminder_minutes && (
                              <span className="px-2 py-1 rounded text-xs font-medium 
                                bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                🔔 {template.reminder_minutes}m
                              </span>
                            )}
                            
                            {/* Subtasks badge */}
                            {template.subtasks.length > 0 && (
                              <span className="px-2 py-1 rounded text-xs font-medium 
                                bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                📝 {template.subtasks.length} subtasks
                              </span>
                            )}
                            
                            {/* Due offset badge */}
                            {template.due_offset_days && (
                              <span className="px-2 py-1 rounded text-xs font-medium 
                                bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                📅 {template.due_offset_days}d offset
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Title: "{template.title_template}"
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleUse(template.id)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded 
                              hover:bg-blue-600"
                          >
                            Use
                          </button>
                          <button
                            onClick={() => onEditTemplate(template)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 
                              dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(template)}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 
                              dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg 
            hover:bg-gray-400 dark:hover:bg-gray-500"
        >
          Close
        </button>
      </div>
    </div>
  );
}
```

#### Template Selector Component (Dropdown)

```typescript
// components/TemplateSelector.tsx
import { useEffect, useState } from 'react';
import { TemplateWithSubtasks } from '@/lib/db';

interface TemplateSelectorProps {
  onSelect: (templateId: number) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateWithSubtasks[]>([]);
  
  useEffect(() => {
    fetchTemplates();
  }, []);
  
  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Fetch templates error:', error);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = parseInt(e.target.value, 10);
    if (templateId) {
      onSelect(templateId);
      e.target.value = ''; // Reset dropdown
    }
  };
  
  if (templates.length === 0) return null;
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium dark:text-gray-300">
        Use Template
      </label>
      
      <select
        onChange={handleChange}
        defaultValue=""
        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
          dark:border-gray-600 dark:text-white"
      >
        <option value="">Select a template...</option>
        {templates.map(template => (
          <option key={template.id} value={template.id}>
            {template.name}
            {template.category && ` (${template.category})`}
          </option>
        ))}
      </select>
    </div>
  );
}
```

---

## Edge Cases

### 1. Duplicate Template Names (Case-Insensitive)
**Scenario:** User tries to create "Weekly Report" when "weekly report" exists

**Handling:**
- Database UNIQUE constraint uses `COLLATE NOCASE`
- Backend validation checks case-insensitively
- API returns 409 Conflict error
- Frontend displays: "Template name already exists"
- Template not created

### 2. Very Long Template Name/Description
**Scenario:** User enters 200-character name or 1000-character description

**Handling:**
- Frontend input maxLength={100} for name, maxLength={500} for description
- Backend validates lengths
- API returns 400 error if exceeds
- Database CHECK constraints enforce limits
- Template rejected or truncated

### 3. Invalid Due Offset Days
**Scenario:** User enters 0, -5, or 500 days

**Handling:**
- Frontend input min={1} max={365}
- Backend validates 1-365 range
- Invalid values converted to null (no due date)
- API returns 400 error if out of range
- Template created with null offset

### 4. Template with No Subtasks
**Scenario:** User saves template without adding any subtasks

**Handling:**
- `subtasks_json` stored as null
- Using template creates todo without subtasks
- Template manager shows no subtask badge
- Valid state, no errors

### 5. Malformed Subtasks JSON
**Scenario:** Database corruption or manual edit creates invalid JSON

**Handling:**
- `deserializeSubtasks()` wraps JSON.parse in try-catch
- Returns empty array [] on parse error
- Using template creates todo with no subtasks
- No crash, graceful degradation
- Log warning for debugging

### 6. Using Template with Large Offset (365 days)
**Scenario:** User has template with 1-year offset

**Handling:**
- Due date calculated: now + 365 days (Singapore timezone)
- Future date validated (year 2027)
- Todo created successfully
- Calendar view may not show far-future dates
- Valid use case for annual reviews

### 7. Deleting Template Used for Many Todos
**Scenario:** User deletes template that created 100 todos

**Handling:**
- Confirmation: "This will not affect existing todos"
- Template deleted from database
- Existing 100 todos remain unchanged
- No CASCADE on todos (only on user deletion)
- Template just a blueprint, not a relationship

### 8. Editing Template Name to Existing Name
**Scenario:** User edits "Report" to "Weekly Report" (which exists)

**Handling:**
- Backend checks uniqueness excluding current template ID
- API returns 409 Conflict error
- Frontend shows: "Template name already exists"
- Template not updated, keeps original name
- No data corruption

### 9. Template with Recurrence but No Offset
**Scenario:** User creates recurring template without due date offset

**Handling:**
- Template saved with `recurrence_enabled=1`, `due_offset_days=null`
- Using template creates recurring todo with no due date
- Completing todo creates next instance without due date
- Valid use case (e.g., daily journal entry)
- No errors

### 10. Concurrent Template Edits (Race Condition)
**Scenario:** User edits template description in two browser tabs

**Handling:**
- Each PUT request is independent
- SQLite serializes writes
- Last write wins
- Both tabs show updated description after refresh
- `updated_at` timestamp reflects last update
- No data corruption

### 11. Creating Todo from Template While Offline
**Scenario:** User selects template from dropdown, network fails

**Handling:**
- POST request to `/api/templates/[id]/use` fails
- Frontend shows error: "Failed to create todo"
- Todo not created
- Template remains in library
- User can retry when online

### 12. Template with Many Subtasks (50+)
**Scenario:** User creates template with 50 subtasks (large checklist)

**Handling:**
- All 50 subtasks serialized to JSON string
- String length ~3000 characters (well under TEXT limit)
- Using template creates 50 subtask rows (50 INSERT queries)
- Performance acceptable (<500ms on SQLite)
- All subtasks created successfully
- Valid use case for onboarding checklists

### 13. Empty Category String
**Scenario:** User selects category dropdown but types nothing

**Handling:**
- `validateCategory()` returns null for empty string
- Category stored as null (no category)
- Template appears in "Uncategorized" section
- Valid state

### 14. Custom Category with Special Characters
**Scenario:** User creates category "Work/Projects" or "Personal🎯"

**Handling:**
- Special characters allowed (no sanitization)
- Emoji supported (UTF-8)
- Category stored and displayed as-is
- Sorting works alphabetically
- No security risk (no HTML rendering of category names)

### 15. Template Title Mismatch
**Scenario:** Template "Weekly Report" has title_template "Write monthly summary"

**Handling:**
- Template name is just identifier for user
- `title_template` is what's used for todo creation
- Intentional design: template name ≠ todo title
- User might template "Quick Task" but title varies
- No validation enforcing match

---

## Acceptance Criteria

### Functional Requirements

#### FR1: Create Template from Todo Form
- [ ] "💾 Save as Template" button visible when title filled
- [ ] Button opens template save modal
- [ ] Modal has name input (required, max 100 chars)
- [ ] Modal has description textarea (optional, max 500 chars)
- [ ] Modal has category dropdown (suggested + custom)
- [ ] Modal has due offset selector (presets + custom days)
- [ ] "Save Template" button creates template
- [ ] Template preserves: title, priority, recurrence, reminder, subtasks
- [ ] Template appears in library immediately
- [ ] Original form unchanged after save
- [ ] Validation prevents duplicate names (case-insensitive)
- [ ] Validation prevents empty name

#### FR2: Use Template from Dropdown
- [ ] "Use Template" dropdown visible in todo form (if templates exist)
- [ ] Dropdown lists all user's templates
- [ ] Templates show category in parentheses (if set)
- [ ] Selecting template creates todo instantly
- [ ] Todo inherits all template settings
- [ ] Due date calculated from offset (Singapore timezone)
- [ ] Subtasks created and linked
- [ ] Form resets after template use
- [ ] No modal interaction required

#### FR3: Browse Templates in Manager
- [ ] "📋 Templates" button visible in navigation
- [ ] Button opens template manager modal
- [ ] Modal shows all templates grouped by category
- [ ] Each template displays: name, description, badges (priority, recurrence, reminder, subtasks, offset)
- [ ] Templates sorted by category, then name
- [ ] "Use" button creates todo and closes modal
- [ ] Empty state shown when no templates

#### FR4: Edit Template Metadata
- [ ] "Edit" button on each template
- [ ] Edit modal pre-fills current values
- [ ] Can update name, description, category
- [ ] Cannot edit template settings (priority, recurrence, subtasks)
- [ ] "Update" button saves changes
- [ ] Changes reflect immediately
- [ ] Validation prevents duplicate names
- [ ] Validation prevents empty name

#### FR5: Delete Template
- [ ] "Delete" button on each template
- [ ] Confirmation dialog before deletion
- [ ] Confirmation states: "will not affect existing todos"
- [ ] Template deleted from database
- [ ] Template disappears from manager
- [ ] Template removed from dropdown
- [ ] Existing todos unchanged

#### FR6: Template Categories
- [ ] Category dropdown in save modal
- [ ] Suggested categories: Work, Personal, Finance, Health, Education
- [ ] Can type custom category
- [ ] Category appears as badge on template
- [ ] Templates grouped by category in manager
- [ ] Uncategorized templates in separate section

#### FR7: Due Date Offset Calculation
- [ ] Offset presets: 1 day, 3 days, 1 week, 2 weeks, 1 month, Custom
- [ ] Custom allows 1-365 days
- [ ] Using template calculates due_date = now + offset
- [ ] Calculation uses Singapore timezone
- [ ] If no offset, todo has no due date
- [ ] Offset preserved in template

#### FR8: Subtasks Serialization
- [ ] Subtasks in form serialized to JSON when saving template
- [ ] JSON format: `[{"title":"...","position":0}, ...]`
- [ ] Using template deserializes JSON
- [ ] Subtasks created in correct order
- [ ] All subtasks start uncompleted
- [ ] Template shows subtask count badge

#### FR9: Template Name Uniqueness
- [ ] Cannot create duplicate template names
- [ ] Case-insensitive uniqueness (Report = report)
- [ ] API returns 409 error for duplicates
- [ ] Error message displays in modal
- [ ] Database UNIQUE constraint enforces

#### FR10: Recurrence Settings Preserved
- [ ] Template saves recurrence_enabled flag
- [ ] Template saves recurrence_pattern if enabled
- [ ] Using template creates recurring todo if enabled
- [ ] Using template creates non-recurring todo if disabled
- [ ] Recurrence badge shown in manager

### Non-Functional Requirements

#### NFR1: Performance
- [ ] Template CRUD operations complete in < 200ms
- [ ] Using template creates todo in < 300ms (including subtasks)
- [ ] Loading templates on mount < 150ms for 50 templates
- [ ] JSON serialization handles 50+ subtasks
- [ ] Dropdown selector loads instantly

#### NFR2: Data Integrity
- [ ] Foreign key constraint on user_id enforced
- [ ] UNIQUE constraint on (user_id, name) enforced
- [ ] CHECK constraints on all fields enforced
- [ ] JSON serialization reversible (serialize → deserialize = original)
- [ ] Due date calculation timezone-safe

#### NFR3: Usability
- [ ] Template creation max 5 clicks
- [ ] Using template max 2 clicks (dropdown → select)
- [ ] Template manager scannable (badges, grouping)
- [ ] Preview shows what will be saved
- [ ] Confirmation dialogs clear and informative

#### NFR4: Dark Mode
- [ ] All modals styled for dark mode
- [ ] Badges readable in dark mode
- [ ] Input fields visible in dark mode
- [ ] Buttons have proper dark mode styling
- [ ] Category sections distinguishable

#### NFR5: Mobile Responsiveness
- [ ] Modals scroll on small screens
- [ ] Buttons sized for touch (min 44x44px)
- [ ] Dropdowns usable on mobile
- [ ] Template cards stack vertically
- [ ] Text inputs full-width on mobile

---

## Testing Requirements

### E2E Tests (Playwright)

Create `tests/07-template-system.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Template System', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new TestHelper(page, context);
    await helper.setupAuthenticatedSession();
  });

  test('should show save as template button when title filled', async ({ page }) => {
    await page.goto('/');
    
    // Initially hidden
    await expect(page.locator('button:has-text("Save as Template")')).not.toBeVisible();
    
    // Visible after typing title
    await page.fill('input[placeholder*="todo"]', 'Test todo');
    await expect(page.locator('button:has-text("Save as Template")')).toBeVisible();
  });

  test('should save todo as template with minimal data', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[placeholder*="todo"]', 'Weekly status report');
    await page.click('button:has-text("Save as Template")');
    
    // Modal appears
    await expect(page.locator('text=Save as Template').first()).toBeVisible();
    
    // Fill name
    await page.fill('input[placeholder*="Template Name"]', 'Weekly Report');
    await page.click('button:has-text("Save Template")');
    
    // Modal closes
    await expect(page.locator('text=Save as Template').first()).not.toBeVisible();
  });

  test('should save template with all fields', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[placeholder*="todo"]', 'Monthly review');
    await page.selectOption('select[name="priority"]', 'high');
    await page.click('button:has-text("Save as Template")');
    
    await page.fill('input[placeholder*="Template Name"]', 'Monthly Review');
    await page.fill('textarea[placeholder*="Description"]', 'End of month analysis');
    await page.selectOption('select', 'Work');
    await page.selectOption('select[aria-label="Due offset"]', '30'); // 1 month
    
    await page.click('button:has-text("Save Template")');
    
    // Template created
    const response = await fetch('/api/templates');
    const data = await response.json();
    const template = data.templates.find((t: any) => t.name === 'Monthly Review');
    
    expect(template).toBeDefined();
    expect(template.description).toBe('End of month analysis');
    expect(template.category).toBe('Work');
    expect(template.due_offset_days).toBe(30);
  });

  test('should prevent duplicate template names', async ({ page }) => {
    await page.goto('/');
    const template = await helper.createTemplate({ 
      name: 'Weekly Report',
      title_template: 'Write report'
    });
    
    // Try to create duplicate
    await page.fill('input[placeholder*="todo"]', 'Another report');
    await page.click('button:has-text("Save as Template")');
    await page.fill('input[placeholder*="Template Name"]', 'Weekly Report');
    await page.click('button:has-text("Save Template")');
    
    // Error message
    await expect(page.locator('text=Template name already exists')).toBeVisible();
  });

  test('should use template from dropdown', async ({ page }) => {
    await page.goto('/');
    const template = await helper.createTemplate({
      name: 'Quick Task',
      title_template: 'Do something',
      priority: 'high',
      due_offset_days: 3,
    });
    
    await page.reload();
    
    // Select template
    await page.selectOption('select:has-text("Use Template")', template.id.toString());
    
    // Wait for todo to appear
    await expect(page.locator('text=Do something')).toBeVisible();
    
    // Check badges
    const todoItem = page.locator('text=Do something').locator('..');
    await expect(todoItem.locator('text=High')).toBeVisible();
  });

  test('should calculate due date from offset', async ({ page }) => {
    await page.goto('/');
    const template = await helper.createTemplate({
      name: 'Future Task',
      title_template: 'Due in a week',
      priority: 'medium',
      due_offset_days: 7,
    });
    
    await page.reload();
    await page.selectOption('select:has-text("Use Template")', template.id.toString());
    
    // Check due date (approximately 7 days from now)
    const todoItem = page.locator('text=Due in a week').locator('..');
    const dueDateText = await todoItem.locator('[data-testid="due-date"]').textContent();
    
    // Due date should be ~7 days from now
    expect(dueDateText).toBeTruthy();
  });

  test('should show template manager modal', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button:has-text("📋 Templates")');
    
    await expect(page.locator('text=Template Library').first()).toBeVisible();
  });

  test('should display templates grouped by category', async ({ page }) => {
    await page.goto('/');
    
    await helper.createTemplate({ 
      name: 'Work Report', 
      category: 'Work',
      title_template: 'Work task'
    });
    await helper.createTemplate({ 
      name: 'Grocery List', 
      category: 'Personal',
      title_template: 'Personal task'
    });
    
    await page.reload();
    await page.click('button:has-text("📋 Templates")');
    
    // Check category headers
    await expect(page.locator('text=Work').first()).toBeVisible();
    await expect(page.locator('text=Personal').first()).toBeVisible();
  });

  test('should use template from manager modal', async ({ page }) => {
    await page.goto('/');
    const template = await helper.createTemplate({
      name: 'Quick Task',
      title_template: 'Fast todo',
      priority: 'low',
    });
    
    await page.reload();
    await page.click('button:has-text("📋 Templates")');
    
    // Click Use button
    await page.click('button:has-text("Use")');
    
    // Modal closes, todo created
    await expect(page.locator('text=Template Library').first()).not.toBeVisible();
    await expect(page.locator('text=Fast todo')).toBeVisible();
  });

  test('should edit template metadata', async ({ page }) => {
    await page.goto('/');
    const template = await helper.createTemplate({
      name: 'Old Name',
      description: 'Old description',
      category: 'Work',
      title_template: 'Task'
    });
    
    await page.reload();
    await page.click('button:has-text("📋 Templates")');
    await page.click('button:has-text("Edit")');
    
    // Edit modal appears
    await page.fill('input[value="Old Name"]', 'New Name');
    await page.fill('textarea[value="Old description"]', 'New description');
    await page.selectOption('select', 'Personal');
    await page.click('button:has-text("Update")');
    
    // Changes reflected
    await expect(page.locator('text=New Name')).toBeVisible();
    await expect(page.locator('text=New description')).toBeVisible();
    await expect(page.locator('text=Personal')).toBeVisible();
  });

  test('should delete template with confirmation', async ({ page }) => {
    await page.goto('/');
    const template = await helper.createTemplate({
      name: 'Temporary',
      title_template: 'Temp task'
    });
    
    await page.reload();
    await page.click('button:has-text("📋 Templates")');
    
    // Setup dialog handler
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Delete');
      expect(dialog.message()).toContain('Temporary');
      expect(dialog.message()).toContain('will not affect existing todos');
      await dialog.accept();
    });
    
    await page.click('button:has-text("Delete")');
    
    // Template removed
    await expect(page.locator('text=Temporary')).not.toBeVisible();
  });

  test('should save template with subtasks', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[placeholder*="todo"]', 'Blog post');
    await helper.addSubtask(page, 'Research topic');
    await helper.addSubtask(page, 'Write draft');
    await helper.addSubtask(page, 'Publish');
    
    await page.click('button:has-text("Save as Template")');
    await page.fill('input[placeholder*="Template Name"]', 'Blog Post Template');
    await page.click('button:has-text("Save Template")');
    
    // Verify subtasks saved
    const response = await fetch('/api/templates');
    const data = await response.json();
    const template = data.templates.find((t: any) => t.name === 'Blog Post Template');
    
    expect(template.subtasks).toHaveLength(3);
    expect(template.subtasks[0].title).toBe('Research topic');
  });

  test('should create todo with subtasks from template', async ({ page }) => {
    await page.goto('/');
    const template = await helper.createTemplate({
      name: 'Checklist Template',
      title_template: 'Complete checklist',
      priority: 'medium',
      subtasks: [
        { title: 'Step 1', position: 0 },
        { title: 'Step 2', position: 1 },
        { title: 'Step 3', position: 2 },
      ],
    });
    
    await page.reload();
    await page.selectOption('select:has-text("Use Template")', template.id.toString());
    
    // Todo created with subtasks
    const todoItem = page.locator('text=Complete checklist').locator('..');
    await expect(todoItem.locator('text=Step 1')).toBeVisible();
    await expect(todoItem.locator('text=Step 2')).toBeVisible();
    await expect(todoItem.locator('text=Step 3')).toBeVisible();
    
    // Progress bar shows 0%
    await expect(todoItem.locator('text=0%')).toBeVisible();
  });

  test('should handle template with no due offset', async ({ page }) => {
    await page.goto('/');
    const template = await helper.createTemplate({
      name: 'No Due Date',
      title_template: 'Whenever task',
      priority: 'low',
      due_offset_days: null,
    });
    
    await page.reload();
    await page.selectOption('select:has-text("Use Template")', template.id.toString());
    
    // Todo created without due date
    const todoItem = page.locator('text=Whenever task').locator('..');
    await expect(todoItem.locator('[data-testid="due-date"]')).not.toBeVisible();
  });

  test('should preserve recurrence settings in template', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[placeholder*="todo"]', 'Daily standup');
    await page.check('input[type="checkbox"][name="recurrence"]');
    await page.selectOption('select[name="recurrence-pattern"]', 'daily');
    
    await page.click('button:has-text("Save as Template")');
    await page.fill('input[placeholder*="Template Name"]', 'Daily Standup');
    await page.click('button:has-text("Save Template")');
    
    // Use template
    await page.reload();
    await page.selectOption('select:has-text("Use Template")', 'Daily Standup');
    
    // Todo is recurring
    const todoItem = page.locator('text=Daily standup').locator('..');
    await expect(todoItem.locator('text=🔄 daily')).toBeVisible();
  });

  test('should show template badges in manager', async ({ page }) => {
    await page.goto('/');
    const template = await helper.createTemplate({
      name: 'Feature Complete',
      title_template: 'Task',
      priority: 'high',
      recurrence_enabled: 1,
      recurrence_pattern: 'weekly',
      reminder_minutes: 1440,
      due_offset_days: 7,
      subtasks: [
        { title: 'Subtask 1', position: 0 },
        { title: 'Subtask 2', position: 1 },
      ],
    });
    
    await page.reload();
    await page.click('button:has-text("📋 Templates")');
    
    const templateCard = page.locator('text=Feature Complete').locator('..');
    
    // Check all badges
    await expect(templateCard.locator('text=🎯 high')).toBeVisible();
    await expect(templateCard.locator('text=🔄 weekly')).toBeVisible();
    await expect(templateCard.locator('text=🔔 1440m')).toBeVisible();
    await expect(templateCard.locator('text=📝 2 subtasks')).toBeVisible();
    await expect(templateCard.locator('text=📅 7d offset')).toBeVisible();
  });

  test('should allow custom category', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[placeholder*="todo"]', 'Leadership task');
    await page.click('button:has-text("Save as Template")');
    
    await page.fill('input[placeholder*="Template Name"]', 'Leader Template');
    await page.selectOption('select', 'custom');
    await page.fill('input[placeholder*="custom category"]', 'Leadership');
    await page.click('button:has-text("Save Template")');
    
    // Open manager, check custom category
    await page.reload();
    await page.click('button:has-text("📋 Templates")');
    
    await expect(page.locator('text=Leadership').first()).toBeVisible();
  });

  test('should not affect existing todos when deleting template', async ({ page }) => {
    await page.goto('/');
    const template = await helper.createTemplate({
      name: 'Temp',
      title_template: 'Task from template',
      priority: 'medium',
    });
    
    // Create todo from template
    const todo = await helper.useTemplate(template.id);
    
    await page.reload();
    
    // Todo exists
    await expect(page.locator('text=Task from template')).toBeVisible();
    
    // Delete template
    await page.click('button:has-text("📋 Templates")');
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Delete")');
    await page.click('button:has-text("Close")');
    
    // Todo still exists
    await expect(page.locator('text=Task from template')).toBeVisible();
  });
});
```

### Unit Tests

Create `tests/unit/templates.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  templateDB,
  validateTemplateName,
  validateTemplateDescription,
  validateCategory,
  validateDueOffsetDays,
  serializeSubtasks,
  deserializeSubtasks,
  isTemplateNameUnique,
  calculateDueDateFromOffset,
  userDB,
  todoDB,
  SubtaskInput,
} from '@/lib/db';

describe('Template Validation', () => {
  it('should validate correct template names', () => {
    expect(validateTemplateName('Weekly Report')).toBe('Weekly Report');
    expect(validateTemplateName('  Padded  ')).toBe('Padded');
    expect(validateTemplateName('A')).toBe('A');
  });

  it('should reject invalid template names', () => {
    expect(validateTemplateName('')).toBe(null);
    expect(validateTemplateName('   ')).toBe(null);
    expect(validateTemplateName(null)).toBe(null);
    expect(validateTemplateName('A'.repeat(101))).toBe(null);
  });

  it('should validate descriptions', () => {
    expect(validateTemplateDescription('Valid description')).toBe('Valid description');
    expect(validateTemplateDescription(null)).toBe(null);
    expect(validateTemplateDescription(undefined)).toBe(null);
    expect(validateTemplateDescription('   ')).toBe(null);
  });

  it('should reject long descriptions', () => {
    const longDesc = 'A'.repeat(501);
    expect(validateTemplateDescription(longDesc)).toBe(null);
    
    const maxDesc = 'A'.repeat(500);
    expect(validateTemplateDescription(maxDesc)).toBe(maxDesc);
  });

  it('should validate categories', () => {
    expect(validateCategory('Work')).toBe('Work');
    expect(validateCategory(null)).toBe(null);
    expect(validateCategory('   ')).toBe(null);
  });

  it('should validate due offset days', () => {
    expect(validateDueOffsetDays(1)).toBe(1);
    expect(validateDueOffsetDays(365)).toBe(365);
    expect(validateDueOffsetDays('7')).toBe(7);
    expect(validateDueOffsetDays(null)).toBe(null);
    expect(validateDueOffsetDays(0)).toBe(null);
    expect(validateDueOffsetDays(366)).toBe(null);
    expect(validateDueOffsetDays(-5)).toBe(null);
  });

  it('should serialize subtasks to JSON', () => {
    const subtasks: SubtaskInput[] = [
      { title: 'Task 1', position: 0 },
      { title: 'Task 2', position: 1 },
    ];
    
    const json = serializeSubtasks(subtasks);
    expect(json).toBe('[{"title":"Task 1","position":0},{"title":"Task 2","position":1}]');
  });

  it('should serialize empty subtasks to null', () => {
    expect(serializeSubtasks([])).toBe(null);
  });

  it('should deserialize subtasks from JSON', () => {
    const json = '[{"title":"Task 1","position":0},{"title":"Task 2","position":1}]';
    const subtasks = deserializeSubtasks(json);
    
    expect(subtasks).toHaveLength(2);
    expect(subtasks[0].title).toBe('Task 1');
    expect(subtasks[1].position).toBe(1);
  });

  it('should handle invalid JSON gracefully', () => {
    expect(deserializeSubtasks(null)).toEqual([]);
    expect(deserializeSubtasks('invalid json')).toEqual([]);
    expect(deserializeSubtasks('[{malformed}]')).toEqual([]);
  });

  it('should calculate due date from offset', () => {
    const dueDate = calculateDueDateFromOffset(7);
    expect(dueDate).toBeTruthy();
    
    // Should be ISO8601 format
    expect(dueDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should return null for null offset', () => {
    expect(calculateDueDateFromOffset(null)).toBe(null);
  });
});

describe('Template Database Operations', () => {
  let userId: number;

  beforeEach(() => {
    userId = userDB.create({ username: 'test-template-user' });
  });

  it('should create template with minimal data', () => {
    const template = templateDB.create({
      user_id: userId,
      name: 'Simple Template',
      title_template: 'Do task',
      priority: 'medium',
    });
    
    expect(template.name).toBe('Simple Template');
    expect(template.title_template).toBe('Do task');
    expect(template.priority).toBe('medium');
    expect(template.description).toBe(null);
    expect(template.category).toBe(null);
  });

  it('should create template with all fields', () => {
    const template = templateDB.create({
      user_id: userId,
      name: 'Full Template',
      description: 'Detailed description',
      category: 'Work',
      title_template: 'Complete project',
      priority: 'high',
      recurrence_enabled: 1,
      recurrence_pattern: 'weekly',
      reminder_minutes: 1440,
      due_offset_days: 7,
      subtasks: [
        { title: 'Step 1', position: 0 },
        { title: 'Step 2', position: 1 },
      ],
    });
    
    expect(template.description).toBe('Detailed description');
    expect(template.category).toBe('Work');
    expect(template.recurrence_enabled).toBe(1);
    expect(template.recurrence_pattern).toBe('weekly');
    expect(template.due_offset_days).toBe(7);
    expect(template.subtasks_json).toBeTruthy();
  });

  it('should prevent duplicate template names', () => {
    templateDB.create({
      user_id: userId,
      name: 'Weekly Report',
      title_template: 'Report',
      priority: 'medium',
    });
    
    expect(() => {
      templateDB.create({
        user_id: userId,
        name: 'Weekly Report',
        title_template: 'Report 2',
        priority: 'low',
      });
    }).toThrow('Template name already exists');
  });

  it('should prevent duplicate names case-insensitive', () => {
    templateDB.create({
      user_id: userId,
      name: 'Report',
      title_template: 'Task',
      priority: 'medium',
    });
    
    expect(() => {
      templateDB.create({
        user_id: userId,
        name: 'REPORT',
        title_template: 'Task',
        priority: 'low',
      });
    }).toThrow('Template name already exists');
  });

  it('should get all templates for user sorted by category', () => {
    templateDB.create({ 
      user_id: userId, 
      name: 'Personal Task',
      category: 'Personal',
      title_template: 'Task',
      priority: 'low'
    });
    templateDB.create({ 
      user_id: userId, 
      name: 'Work Task',
      category: 'Work',
      title_template: 'Task',
      priority: 'medium'
    });
    templateDB.create({ 
      user_id: userId, 
      name: 'No Category',
      title_template: 'Task',
      priority: 'high'
    });
    
    const templates = templateDB.getAllByUser(userId);
    expect(templates).toHaveLength(3);
    
    // Categorized first, then uncategorized
    expect(templates[2].category).toBe(null);
  });

  it('should update template name', () => {
    const template = templateDB.create({
      user_id: userId,
      name: 'Old Name',
      title_template: 'Task',
      priority: 'medium',
    });
    
    const updated = templateDB.update(template.id, userId, { 
      name: 'New Name' 
    });
    
    expect(updated.name).toBe('New Name');
    expect(updated.title_template).toBe('Task'); // Unchanged
  });

  it('should update description and category', () => {
    const template = templateDB.create({
      user_id: userId,
      name: 'Template',
      title_template: 'Task',
      priority: 'low',
    });
    
    const updated = templateDB.update(template.id, userId, {
      description: 'New description',
      category: 'Work',
    });
    
    expect(updated.description).toBe('New description');
    expect(updated.category).toBe('Work');
  });

  it('should delete template', () => {
    const template = templateDB.create({
      user_id: userId,
      name: 'Temporary',
      title_template: 'Task',
      priority: 'medium',
    });
    
    templateDB.delete(template.id, userId);
    
    expect(() => templateDB.getById(template.id)).toThrow('Template not found');
  });

  it('should use template to create todo', () => {
    const template = templateDB.create({
      user_id: userId,
      name: 'Quick Task',
      title_template: 'Do something',
      priority: 'high',
      due_offset_days: 3,
    });
    
    const todo = templateDB.use(template.id, userId);
    
    expect(todo.title).toBe('Do something');
    expect(todo.priority).toBe('high');
    expect(todo.due_date).toBeTruthy(); // Due in 3 days
  });

  it('should use template with subtasks', () => {
    const template = templateDB.create({
      user_id: userId,
      name: 'Checklist',
      title_template: 'Complete checklist',
      priority: 'medium',
      subtasks: [
        { title: 'Step 1', position: 0 },
        { title: 'Step 2', position: 1 },
      ],
    });
    
    const todo = templateDB.use(template.id, userId);
    
    // Check subtasks created
    const subtasks = require('@/lib/db').subtaskDB.getByTodoId(todo.id);
    expect(subtasks).toHaveLength(2);
    expect(subtasks[0].title).toBe('Step 1');
  });

  it('should get template with parsed subtasks', () => {
    const template = templateDB.create({
      user_id: userId,
      name: 'With Subtasks',
      title_template: 'Task',
      priority: 'low',
      subtasks: [
        { title: 'Sub 1', position: 0 },
        { title: 'Sub 2', position: 1 },
      ],
    });
    
    const withSubtasks = templateDB.getWithSubtasks(template.id);
    
    expect(withSubtasks.subtasks).toHaveLength(2);
    expect(withSubtasks.subtasks[0].title).toBe('Sub 1');
  });

  it('should check template name uniqueness', () => {
    templateDB.create({
      user_id: userId,
      name: 'Existing',
      title_template: 'Task',
      priority: 'medium',
    });
    
    expect(isTemplateNameUnique(userId, 'Existing')).toBe(false);
    expect(isTemplateNameUnique(userId, 'New Name')).toBe(true);
  });

  it('should exclude template ID when checking uniqueness', () => {
    const template = templateDB.create({
      user_id: userId,
      name: 'Report',
      title_template: 'Task',
      priority: 'medium',
    });
    
    // Should be unique when excluding itself
    expect(isTemplateNameUnique(userId, 'Report', template.id)).toBe(true);
  });
});
```

---

## Out of Scope

The following features are **explicitly excluded** from this implementation:

### 1. Template Sharing Between Users
- Share templates with team members
- Public template library
- Template marketplace
- **Reason:** Single-user app design

### 2. Template Versioning
- Track template edit history
- Rollback to previous version
- Version comparison
- **Reason:** Adds unnecessary complexity

### 3. Template Preview Before Use
- Modal showing what todo will look like
- "Test" mode to see result without creating
- **Reason:** Quick use is priority, preview slows workflow

### 4. Template Scheduling
- Auto-create todos from template on schedule
- "Create todo every Monday from this template"
- **Reason:** Use recurring todos instead

### 5. Template Variables/Placeholders
- `{{client_name}}` in template title
- Fill-in-the-blanks on template use
- **Reason:** Over-engineering for task app

### 6. Template Tags
- Assign tags to templates (separate from todo tags)
- Filter templates by tag
- **Reason:** Category sufficient

### 7. Template Import/Export (Standalone)
- Export templates to JSON file
- Import templates from other users
- **Reason:** General export/import (PRP-09) sufficient

### 8. Template Analytics
- "Most used templates" report
- Template usage over time
- **Reason:** Analytics out of scope

### 9. Smart Template Suggestions
- AI-suggested templates based on patterns
- "You might like this template"
- **Reason:** Over-engineering

### 10. Template Modification After Use
- "Update all todos created from this template"
- Retroactive changes
- **Reason:** Templates are blueprints, not live links

---

## Success Metrics

### User Engagement
- **Target:** 60% of users create at least 1 template
- **Target:** Average 3-7 templates per active user
- **Target:** 40% of new todos created from templates

### Feature Usage
- **Target:** Template used 2+ times per week per user
- **Target:** < 15% template deletion rate (templates remain useful)
- **Target:** Average 2.5 subtasks per template

### Performance
- **Target:** Template creation < 200ms (p95)
- **Target:** Template use < 300ms including subtasks (p95)
- **Target:** Loading 50 templates < 150ms

### User Satisfaction
- **Target:** Template creation max 5 clicks
- **Target:** Template use max 2 clicks
- **Target:** Zero data loss in JSON serialization

### Technical Quality
- **Target:** 100% E2E test pass rate (18 test cases)
- **Target:** 100% unit test coverage for template logic
- **Target:** All acceptance criteria validated

---

## Implementation Notes

### Development Order
1. **Phase 1: Database & Backend**
   - Create `templates` table with constraints
   - Implement validation functions
   - Add `templateDB` interface with CRUD
   - Test JSON serialization/deserialization

2. **Phase 2: Template Creation**
   - Build TemplateSaveModal component
   - Implement POST /api/templates endpoint
   - Add "Save as Template" button to form
   - Test template creation flow

3. **Phase 3: Template Usage**
   - Build TemplateSelector dropdown component
   - Implement POST /api/templates/[id]/use endpoint
   - Add due date offset calculation
   - Test instant todo creation

4. **Phase 4: Template Management**
   - Build TemplateManagerModal component
   - Implement PUT/DELETE endpoints
   - Add category grouping and badges
   - Test edit/delete operations

5. **Phase 5: Integration**
   - Integrate with subtasks (PRP-05)
   - Handle recurring todos (PRP-03)
   - Add to main page workflow
   - Dark mode styling

6. **Phase 6: Testing**
   - Write E2E tests (18 test cases)
   - Write unit tests (validation, database, JSON)
   - Manual testing across browsers
   - Performance testing

### Dependencies
- **Requires:** PRP-01 (Todo CRUD) - database, API patterns, todo model
- **Requires:** PRP-05 (Subtasks) - subtask creation, JSON serialization
- **Enhances:** PRP-02 (Priority) - priority badges in templates
- **Enhances:** PRP-03 (Recurring) - recurrence settings preserved
- **Enhances:** PRP-04 (Reminders) - reminder settings preserved
- **Enhances:** PRP-08 (Search) - search templates by name/category

### Maintenance Considerations
- Monitor JSON deserialization errors (log for debugging)
- Track template table size growth (expect 3-10 templates per user)
- Review category usage patterns (suggest popular ones)
- Consider template merge if users create duplicates

---

**Feature Owner:** AI Development Team  
**Last Updated:** February 5, 2026  
**Status:** Ready for Implementation
