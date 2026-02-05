# PRP-09: Export & Import

## Feature Overview

The Export & Import system provides comprehensive data portability, enabling users to backup their todos, transfer data between devices, analyze tasks in spreadsheets, and share todo lists. The feature supports two export formats (JSON for complete backup/restore, CSV for analysis) and a robust import mechanism with ID remapping and relationship preservation.

### Core Functionality
- **JSON Export**: Complete data backup with all fields, relationships, and metadata
- **CSV Export**: Spreadsheet-friendly format for analysis and reporting
- **JSON Import**: Restore from backup with automatic ID remapping
- **Data Validation**: Comprehensive validation before import
- **Relationship Preservation**: Maintains subtask associations and tag relationships
- **Conflict Handling**: Creates new todos (no merging) with fresh IDs
- **Error Recovery**: Graceful handling of corrupted or invalid files

### User Value
- Backup todos regularly to prevent data loss
- Transfer todos between devices or browsers
- Analyze productivity in Excel/Google Sheets
- Share todo lists with team members or family
- Migrate data when switching browsers
- Archive completed projects for reference
- Test workflows without affecting production data

---

## User Stories

### Story 1: Export All Todos as JSON
**As a** user wanting to backup my data  
**I want to** export all todos to a JSON file  
**So that** I can restore them later if needed

**Acceptance Criteria:**
- "Export JSON" button visible at top of page
- Button styled in green color
- Clicking button downloads JSON file immediately
- Filename format: `todos-YYYY-MM-DD.json`
- File contains all todos with complete data
- Includes: id, title, completed, due_date, priority, recurrence, reminder, created_at
- Includes nested subtasks array
- Includes nested tags array
- JSON properly formatted (indented, valid syntax)
- File downloads via browser download mechanism

### Story 2: Export All Todos as CSV
**As a** user analyzing productivity  
**I want to** export todos to CSV format  
**So that** I can analyze data in spreadsheets

**Acceptance Criteria:**
- "Export CSV" button visible at top of page
- Button styled in dark green color
- Clicking button downloads CSV file immediately
- Filename format: `todos-YYYY-MM-DD.csv`
- CSV header row with column names
- Columns: ID, Title, Completed, Due Date, Priority, Recurring, Pattern, Reminder, Tags, Subtasks
- Boolean values as "true"/"false" strings
- Dates in ISO8601 format
- Arrays (tags, subtasks) as comma-separated strings
- Quoted strings for proper CSV escaping
- Opens correctly in Excel, Google Sheets, Numbers

### Story 3: Import Todos from JSON
**As a** user restoring from backup  
**I want to** import todos from JSON file  
**So that** I can restore my data after device change

**Acceptance Criteria:**
- "Import" button visible at top of page
- Button styled in blue color
- Clicking button opens file picker
- File picker filters for JSON files
- Selecting file triggers validation
- Valid file creates todos in database
- Success message: "Successfully imported X todos"
- Todo list refreshes automatically
- New todos appear with all properties preserved
- Original IDs replaced with new sequential IDs
- Imported todos linked to current user

### Story 4: Import with Subtasks
**As a** user importing complex todos  
**I want to** preserve subtask relationships  
**So that** my checklists remain intact

**Acceptance Criteria:**
- JSON export includes subtasks array per todo
- Each subtask has: id, todo_id, title, completed, position
- Import creates parent todo first
- Import creates subtasks with new IDs
- Subtasks linked to new parent todo ID (remapped)
- Subtask order preserved (position field)
- Subtask completion status preserved
- Subtask titles preserved exactly

### Story 5: Import with Tags
**As a** user organizing by tags  
**I want to** preserve tag associations on import  
**So that** my categorization is maintained

**Acceptance Criteria:**
- JSON export includes tags array per todo
- Each tag has: id, name, color
- Import matches tags by name (case-insensitive)
- Existing tags reused (by name match)
- New tags created if name doesn't exist
- Tag colors preserved from export
- Todo-tag relationships recreated with new IDs
- Multiple tags per todo supported

### Story 6: Validate Import Data
**As a** user importing unknown JSON  
**I want to** validation to prevent corrupt data  
**So that** invalid files don't break my todo list

**Acceptance Criteria:**
- File must be valid JSON syntax
- Root must be object with "todos" array
- Each todo must have required fields: title
- Optional fields validated if present:
  - priority: "high" | "medium" | "low"
  - recurrence_pattern: "daily" | "weekly" | "monthly" | "yearly"
  - reminder_minutes: number or null
  - completed: 0 or 1
- Invalid files show error: "Invalid JSON format"
- Import aborts on validation failure
- No partial imports (all-or-nothing)
- Helpful error messages for common issues

### Story 7: Handle Import Errors
**As a** user encountering import issues  
**I want to** clear error messages  
**So that** I know what went wrong

**Acceptance Criteria:**
- Corrupted JSON shows: "Invalid JSON format"
- Missing required fields shows: "Missing required field: title"
- Network errors show: "Failed to import todos"
- Invalid priority shows: "Invalid priority value"
- Empty file shows: "No todos found in file"
- Errors displayed in red alert
- Error dismisses automatically after 5 seconds
- User can retry import after fixing file

### Story 8: Export with Current Filters
**As a** user with filtered view  
**I want to** export ALL todos (not just visible)  
**So that** I don't lose hidden data

**Acceptance Criteria:**
- Export always includes ALL user's todos
- Ignores current search/filter state
- Includes completed and incomplete todos
- Includes todos from all date ranges
- Includes todos with all priorities
- Includes todos with all tags
- Export count matches total todos in database

### Story 9: Import Creates New Todos
**As a** user importing into existing list  
**I want to** understand import creates duplicates  
**So that** I don't accidentally duplicate data

**Acceptance Criteria:**
- Import ALWAYS creates new todos (never updates)
- Todos get new database IDs
- Importing same file twice creates duplicates
- No merge logic with existing todos
- User manually deletes duplicates if needed
- Documentation clearly states "creates new todos"
- Confirmation prompt warns about duplication

### Story 10: Export Filename with Date
**As a** user organizing backups  
**I want to** export filenames to include date  
**So that** I can track when backup was created

**Acceptance Criteria:**
- JSON filename: `todos-2025-11-02.json`
- CSV filename: `todos-2025-11-02.csv`
- Date uses Singapore timezone (Asia/Singapore)
- Date format: YYYY-MM-DD
- Uses current date at export time
- Browser saves with suggested filename
- User can rename before saving if desired

---

## User Flow

### Flow 1: Export JSON Backup
1. User has 25 todos (mix of priorities, tags, subtasks)
2. User wants weekly backup
3. User clicks "Export JSON" button (green, top-right)
4. Browser shows download dialog
5. File suggested name: `todos-2025-11-02.json`
6. User clicks "Save" in browser dialog
7. File downloads to default downloads folder
8. User opens file in text editor to verify
9. JSON contains all 25 todos with complete data:
   ```json
   {
     "version": "1.0",
     "exportedAt": "2025-11-02T14:30:00+08:00",
     "totalTodos": 25,
     "todos": [
       {
         "id": 1,
         "title": "Weekly Report",
         "completed": 0,
         "due_date": "2025-11-05T17:00:00+08:00",
         "priority": "high",
         "recurrence_enabled": 1,
         "recurrence_pattern": "weekly",
         "reminder_minutes": 60,
         "created_at": "2025-10-28T09:00:00+08:00",
         "subtasks": [
           {
             "id": 10,
             "todo_id": 1,
             "title": "Gather data",
             "completed": 1,
             "position": 0
           },
           {
             "id": 11,
             "todo_id": 1,
             "title": "Write summary",
             "completed": 0,
             "position": 1
           }
         ],
         "tags": [
           {
             "id": 3,
             "name": "Work",
             "color": "#3B82F6"
           }
         ]
       }
       // ... 24 more todos
     ]
   }
   ```
10. User stores file in cloud drive for safekeeping

### Flow 2: Export CSV for Analysis
1. User wants to analyze productivity trends
2. User clicks "Export CSV" button (dark green, top-right)
3. Browser downloads: `todos-2025-11-02.csv`
4. User opens file in Google Sheets
5. CSV loads with headers:
   ```csv
   ID,Title,Completed,Due Date,Priority,Recurring,Pattern,Reminder,Tags,Subtasks,Created At
   1,"Weekly Report",false,"2025-11-05T17:00:00+08:00","high",true,"weekly",60,"Work","Gather data, Write summary","2025-10-28T09:00:00+08:00"
   2,"Team Meeting",false,"2025-11-03T10:00:00+08:00","medium",false,,,,"","2025-11-01T14:00:00+08:00"
   ```
6. User creates pivot table
7. User analyzes completion rate by priority
8. User creates chart of weekly trends
9. User shares spreadsheet with manager

### Flow 3: Import JSON Backup (New Device)
1. User switches from laptop to new computer
2. User installs app on new computer
3. User logs in (creates new account or same passkey)
4. User sees empty todo list (new browser)
5. User retrieves backup file: `todos-2025-11-02.json`
6. User clicks "Import" button (blue, top-right)
7. File picker dialog opens
8. User navigates to Downloads folder
9. User selects `todos-2025-11-02.json`
10. User clicks "Open"
11. File uploads and validates (takes 2 seconds)
12. Success message appears: "Successfully imported 25 todos"
13. Page refreshes automatically
14. All 25 todos appear in list with:
    - New IDs (1-25 instead of original IDs)
    - All titles preserved
    - All due dates preserved
    - All priorities preserved
    - All recurrence settings preserved
    - All subtasks preserved (with new IDs, linked to new parent IDs)
    - All tags preserved (matched by name, new IDs)
15. User verifies data matches original

### Flow 4: Import with ID Remapping (Subtasks)
1. Export file contains:
   ```json
   {
     "todos": [
       {
         "id": 42,
         "title": "Project Plan",
         "subtasks": [
           {"id": 100, "todo_id": 42, "title": "Step 1"},
           {"id": 101, "todo_id": 42, "title": "Step 2"}
         ]
       }
     ]
   }
   ```
2. User imports file
3. Backend processes import:
   - Creates todo with new ID: 5
   - Creates subtask 1 with new ID: 20, todo_id: 5
   - Creates subtask 2 with new ID: 21, todo_id: 5
4. Result in database:
   ```
   todos: {id: 5, title: "Project Plan"}
   subtasks: [
     {id: 20, todo_id: 5, title: "Step 1"},
     {id: 21, todo_id: 5, title: "Step 2"}
   ]
   ```
5. User sees todo with both subtasks correctly linked
6. Checking/unchecking subtasks works correctly

### Flow 5: Import with Tag Matching
1. User already has tag "Work" (id: 3, color: #3B82F6)
2. Export file contains:
   ```json
   {
     "todos": [
       {
         "id": 10,
         "title": "Task 1",
         "tags": [
           {"id": 99, "name": "Work", "color": "#3B82F6"},
           {"id": 100, "name": "Urgent", "color": "#EF4444"}
         ]
       }
     ]
   }
   ```
3. User imports file
4. Backend processing:
   - Finds existing "Work" tag (case-insensitive match) → reuses id: 3
   - Doesn't find "Urgent" tag → creates new tag (id: 10, color: #EF4444)
   - Creates todo with new id: 8
   - Creates todo_tags relationships: (8, 3), (8, 10)
5. Result:
   - Todo "Task 1" shown with tags: "Work" (existing), "Urgent" (new)
   - No duplicate "Work" tag created
   - Both tags clickable for filtering

### Flow 6: Import Validation Failure
1. User receives JSON file from external source
2. File has corrupted data:
   ```json
   {
     "todos": [
       {
         "title": "Task 1",
         "priority": "super-urgent",  // Invalid priority
         "completed": "yes"            // Wrong type (should be 0/1)
       }
     ]
   }
   ```
3. User clicks "Import" button
4. User selects corrupted file
5. Backend validates data
6. Detects errors:
   - Invalid priority value: "super-urgent"
   - Invalid completed value: "yes" (expects 0 or 1)
7. Import aborts before creating any todos
8. Error message displays: "Invalid priority value. Must be: high, medium, or low"
9. No todos created (all-or-nothing import)
10. User can fix file and retry

### Flow 7: Import Empty File
1. User accidentally selects empty JSON file: `{}`
2. User clicks "Import"
3. Backend validates file
4. Detects missing "todos" array
5. Error message: "No todos found in file"
6. No database changes
7. User selects correct file

### Flow 8: Import with Missing Optional Fields
1. Export file has minimal data:
   ```json
   {
     "todos": [
       {
         "title": "Simple Task"
         // No due_date, priority, tags, subtasks
       }
     ]
   }
   ```
2. User imports file
3. Backend applies defaults:
   - completed: 0 (incomplete)
   - due_date: null
   - priority: "medium" (default)
   - recurrence_enabled: 0
   - recurrence_pattern: null
   - reminder_minutes: null
   - tags: []
   - subtasks: []
4. Todo created successfully with defaults
5. User sees "Simple Task" with medium priority, no due date

### Flow 9: Export Ignores Filters
1. User has 50 todos total
2. User searches for "report" → 5 results displayed
3. User filters by "High Priority" → 2 results displayed
4. User clicks "Export JSON"
5. File downloads
6. User opens file
7. File contains all 50 todos (not just the 2 filtered)
8. Export ignores current view filters
9. Complete backup preserved

### Flow 10: Import Creates Duplicates (Expected)
1. User has 10 todos
2. User exports JSON → `todos-2025-11-02.json`
3. User accidentally clicks "Import"
4. User selects same file: `todos-2025-11-02.json`
5. Import succeeds
6. User now has 20 todos (10 originals + 10 duplicates)
7. All todos have different IDs but same content
8. User realizes mistake
9. User manually deletes duplicate todos
10. User notes to be careful with imports

### Flow 11: Transfer Between Users (Collaboration)
1. User A exports todos: `todos-2025-11-02.json`
2. User A emails file to User B
3. User B receives email
4. User B logs into own account
5. User B downloads attachment
6. User B clicks "Import"
7. User B selects file
8. Todos imported into User B's account
9. All todos now have user_id = User B's ID
10. User A and User B have separate copies
11. No shared synchronization (independent lists)

### Flow 12: Backup Strategy Workflow
1. Monday: User exports JSON → `todos-2025-11-02.json`
2. User uploads to Google Drive: `/TodoBackups/2025/November/`
3. Tuesday-Sunday: User works normally
4. Next Monday: User exports again → `todos-2025-11-09.json`
5. User uploads to same folder
6. User now has weekly snapshots
7. User accidentally deletes important todo on Nov 10
8. User downloads `todos-2025-11-09.json`
9. User checks file for deleted todo
10. User manually re-creates missing todo from backup
11. Weekly backups saved user's data

---

## Technical Requirements

### Database Schema (No Changes)

No new database tables required. Export/import uses existing schema:
- `todos` table with all columns
- `subtasks` table with todo_id foreign key
- `tags` table
- `todo_tags` junction table

### Export Data Structure (JSON)

```typescript
// lib/export.ts

interface ExportData {
  version: string;           // "1.0"
  exportedAt: string;        // ISO8601 timestamp
  totalTodos: number;        // Count of todos
  todos: ExportedTodo[];     // Array of todos
}

interface ExportedTodo {
  id: number;
  title: string;
  completed: number;         // 0 or 1
  due_date: string | null;   // ISO8601 or null
  priority: Priority;        // "high" | "medium" | "low"
  recurrence_enabled: number; // 0 or 1
  recurrence_pattern: RecurrencePattern | null;
  reminder_minutes: number | null;
  created_at: string;        // ISO8601
  subtasks: ExportedSubtask[];
  tags: ExportedTag[];
}

interface ExportedSubtask {
  id: number;
  todo_id: number;
  title: string;
  completed: number;         // 0 or 1
  position: number;
}

interface ExportedTag {
  id: number;
  name: string;
  color: string;             // Hex color
}
```

### Export Implementation (JSON)

```typescript
// app/api/todos/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, subtaskDB, tagDB } from '@/lib/db';
import { getSingaporeNow, formatSingaporeDate } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';

  try {
    // Fetch all user's todos
    const todos = todoDB.getByUserId(session.userId);

    if (format === 'csv') {
      return exportCSV(todos, session.userId);
    }

    // Default: JSON export
    const exportData: ExportData = {
      version: '1.0',
      exportedAt: getSingaporeNow().toISOString(),
      totalTodos: todos.length,
      todos: todos.map(todo => {
        const subtasks = subtaskDB.getByTodoId(todo.id);
        const tags = tagDB.getByTodoId(todo.id);

        return {
          id: todo.id,
          title: todo.title,
          completed: todo.completed,
          due_date: todo.due_date,
          priority: todo.priority,
          recurrence_enabled: todo.recurrence_enabled,
          recurrence_pattern: todo.recurrence_pattern,
          reminder_minutes: todo.reminder_minutes,
          created_at: todo.created_at,
          subtasks: subtasks.map(s => ({
            id: s.id,
            todo_id: s.todo_id,
            title: s.title,
            completed: s.completed,
            position: s.position,
          })),
          tags: tags.map(t => ({
            id: t.id,
            name: t.name,
            color: t.color,
          })),
        };
      }),
    };

    // Format filename with current date
    const now = getSingaporeNow();
    const dateStr = formatSingaporeDate(now, 'YYYY-MM-DD');
    const filename = `todos-${dateStr}.json`;

    // Return JSON file download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export todos' },
      { status: 500 }
    );
  }
}

function exportCSV(todos: TodoWithTags[], userId: number): NextResponse {
  // CSV header
  const header = [
    'ID',
    'Title',
    'Completed',
    'Due Date',
    'Priority',
    'Recurring',
    'Pattern',
    'Reminder',
    'Tags',
    'Subtasks',
    'Created At',
  ];

  // CSV rows
  const rows = todos.map(todo => {
    const subtasks = subtaskDB.getByTodoId(todo.id);
    const tags = tagDB.getByTodoId(todo.id);

    return [
      todo.id,
      `"${todo.title.replace(/"/g, '""')}"`, // Escape quotes
      todo.completed === 1 ? 'true' : 'false',
      todo.due_date || '',
      todo.priority,
      todo.recurrence_enabled === 1 ? 'true' : 'false',
      todo.recurrence_pattern || '',
      todo.reminder_minutes ?? '',
      tags.map(t => t.name).join(', '),
      subtasks.map(s => s.title).join(', '),
      todo.created_at,
    ];
  });

  // Combine header and rows
  const csv = [header, ...rows]
    .map(row => row.join(','))
    .join('\n');

  // Filename with date
  const now = getSingaporeNow();
  const dateStr = formatSingaporeDate(now, 'YYYY-MM-DD');
  const filename = `todos-${dateStr}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
```

### Import Implementation with ID Remapping

```typescript
// app/api/todos/import/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, subtaskDB, tagDB, db } from '@/lib/db';
import { validateImportData, ImportValidationError } from '@/lib/importValidation';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate import data structure
    const validation = validateImportData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const importData: ExportData = body;
    const todos = importData.todos;

    // ID mapping: oldId -> newId
    const todoIdMap = new Map<number, number>();
    const tagIdMap = new Map<string, number>(); // tagName -> tagId

    // Start transaction for atomic import
    const transaction = db.transaction(() => {
      // Phase 1: Import tags (match by name, create if missing)
      const allTags = new Set<string>();
      todos.forEach(todo => {
        todo.tags.forEach(tag => allTags.add(tag.name));
      });

      allTags.forEach(tagName => {
        // Check if tag exists (case-insensitive)
        const existing = tagDB.findByName(tagName, session.userId);
        if (existing) {
          tagIdMap.set(tagName, existing.id);
        } else {
          // Create new tag (use color from first occurrence)
          const tagData = todos
            .flatMap(t => t.tags)
            .find(t => t.name === tagName);
          const newTag = tagDB.create({
            name: tagName,
            color: tagData?.color || '#6B7280', // Default gray
            userId: session.userId,
          });
          tagIdMap.set(tagName, newTag.id);
        }
      });

      // Phase 2: Import todos (with ID remapping)
      todos.forEach(todoData => {
        // Create todo
        const newTodo = todoDB.create({
          title: todoData.title,
          userId: session.userId,
          priority: todoData.priority,
          dueDate: todoData.due_date,
          recurrenceEnabled: todoData.recurrence_enabled === 1,
          recurrencePattern: todoData.recurrence_pattern,
          reminderMinutes: todoData.reminder_minutes,
        });

        // Map old ID -> new ID
        todoIdMap.set(todoData.id, newTodo.id);

        // Import subtasks (with remapped todo_id)
        todoData.subtasks.forEach(subtaskData => {
          subtaskDB.create({
            todoId: newTodo.id, // Use NEW todo ID
            title: subtaskData.title,
            completed: subtaskData.completed === 1,
            position: subtaskData.position,
          });
        });

        // Import tag relationships
        todoData.tags.forEach(tagData => {
          const tagId = tagIdMap.get(tagData.name);
          if (tagId) {
            tagDB.addToTodo(newTodo.id, tagId);
          }
        });

        // If todo was completed, mark as completed
        if (todoData.completed === 1) {
          todoDB.update(newTodo.id, { completed: 1 });
        }
      });
    });

    // Execute transaction
    transaction();

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${todos.length} todos`,
      count: todos.length,
    });
  } catch (error) {
    console.error('Import error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to import todos' },
      { status: 500 }
    );
  }
}
```

### Import Validation

```typescript
// lib/importValidation.ts

import { Priority, RecurrencePattern } from './db';

export class ImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportValidationError';
  }
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImportData(data: any): ValidationResult {
  // Check root structure
  if (typeof data !== 'object' || data === null) {
    return { valid: false, error: 'Invalid data format' };
  }

  if (!Array.isArray(data.todos)) {
    return { valid: false, error: 'Missing todos array' };
  }

  // Validate each todo
  for (let i = 0; i < data.todos.length; i++) {
    const todo = data.todos[i];
    const result = validateTodo(todo, i);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

function validateTodo(todo: any, index: number): ValidationResult {
  const prefix = `Todo ${index + 1}:`;

  // Required fields
  if (typeof todo.title !== 'string' || todo.title.trim() === '') {
    return { valid: false, error: `${prefix} Missing or invalid title` };
  }

  // Optional fields validation
  if (todo.priority !== undefined) {
    const validPriorities: Priority[] = ['high', 'medium', 'low'];
    if (!validPriorities.includes(todo.priority)) {
      return {
        valid: false,
        error: `${prefix} Invalid priority. Must be: high, medium, or low`,
      };
    }
  }

  if (todo.completed !== undefined) {
    if (todo.completed !== 0 && todo.completed !== 1) {
      return {
        valid: false,
        error: `${prefix} Invalid completed value. Must be 0 or 1`,
      };
    }
  }

  if (todo.recurrence_pattern !== undefined && todo.recurrence_pattern !== null) {
    const validPatterns: RecurrencePattern[] = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!validPatterns.includes(todo.recurrence_pattern)) {
      return {
        valid: false,
        error: `${prefix} Invalid recurrence pattern`,
      };
    }
  }

  if (todo.reminder_minutes !== undefined && todo.reminder_minutes !== null) {
    if (typeof todo.reminder_minutes !== 'number') {
      return {
        valid: false,
        error: `${prefix} Invalid reminder_minutes. Must be number or null`,
      };
    }
  }

  // Validate subtasks array
  if (todo.subtasks !== undefined) {
    if (!Array.isArray(todo.subtasks)) {
      return { valid: false, error: `${prefix} Invalid subtasks. Must be array` };
    }

    for (let j = 0; j < todo.subtasks.length; j++) {
      const subtask = todo.subtasks[j];
      if (typeof subtask.title !== 'string' || subtask.title.trim() === '') {
        return {
          valid: false,
          error: `${prefix} Subtask ${j + 1}: Missing or invalid title`,
        };
      }
    }
  }

  // Validate tags array
  if (todo.tags !== undefined) {
    if (!Array.isArray(todo.tags)) {
      return { valid: false, error: `${prefix} Invalid tags. Must be array` };
    }

    for (let k = 0; k < todo.tags.length; k++) {
      const tag = todo.tags[k];
      if (typeof tag.name !== 'string' || tag.name.trim() === '') {
        return {
          valid: false,
          error: `${prefix} Tag ${k + 1}: Missing or invalid name`,
        };
      }
      if (typeof tag.color !== 'string' || !tag.color.match(/^#[0-9A-Fa-f]{6}$/)) {
        return {
          valid: false,
          error: `${prefix} Tag ${k + 1}: Invalid color. Must be hex format`,
        };
      }
    }
  }

  return { valid: true };
}

// Apply defaults for optional fields
export function applyDefaults(todo: any): any {
  return {
    ...todo,
    completed: todo.completed ?? 0,
    priority: todo.priority ?? 'medium',
    recurrence_enabled: todo.recurrence_enabled ?? 0,
    recurrence_pattern: todo.recurrence_pattern ?? null,
    reminder_minutes: todo.reminder_minutes ?? null,
    due_date: todo.due_date ?? null,
    subtasks: todo.subtasks ?? [],
    tags: todo.tags ?? [],
  };
}
```

### Frontend Components

#### Export/Import Buttons

```typescript
// components/ExportImportButtons.tsx

import { useState, useRef } from 'react';

interface ExportImportButtonsProps {
  onImportSuccess: () => void;
}

export function ExportImportButtons({ onImportSuccess }: ExportImportButtonsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = async () => {
    try {
      const response = await fetch('/api/todos/export?format=json');
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('content-disposition')
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || 'todos.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export todos');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/todos/export?format=csv');
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('content-disposition')
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || 'todos.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export todos');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input for re-selection
    event.target.value = '';

    setIsImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch('/api/todos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setSuccess(result.message);
      onImportSuccess();

      // Auto-dismiss success message
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error('Import error:', error);
      if (error instanceof SyntaxError) {
        setError('Invalid JSON format');
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to import todos');
      }

      // Auto-dismiss error message
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Export JSON Button */}
      <button
        onClick={handleExportJSON}
        className="px-4 py-2 bg-green-500 text-white rounded-lg 
          hover:bg-green-600 font-medium"
      >
        Export JSON
      </button>

      {/* Export CSV Button */}
      <button
        onClick={handleExportCSV}
        className="px-4 py-2 bg-green-700 text-white rounded-lg 
          hover:bg-green-800 font-medium"
      >
        Export CSV
      </button>

      {/* Import Button */}
      <button
        onClick={handleImportClick}
        disabled={isImporting}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg 
          hover:bg-blue-600 font-medium disabled:opacity-50"
      >
        {isImporting ? 'Importing...' : 'Import'}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 
          text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 
          text-green-700 px-4 py-3 rounded-lg shadow-lg z-50">
          {success}
        </div>
      )}
    </div>
  );
}
```

### Database Helper Extensions

```typescript
// lib/db.ts - Add tag helper methods

export const tagDB = {
  // ... existing methods

  // Find tag by name (case-insensitive)
  findByName(name: string, userId: number): Tag | null {
    const stmt = db.prepare(`
      SELECT * FROM tags 
      WHERE LOWER(name) = LOWER(?) AND user_id = ?
    `);
    return stmt.get(name, userId) as Tag | null;
  },

  // Add tag to todo (many-to-many)
  addToTodo(todoId: number, tagId: number): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO todo_tags (todo_id, tag_id)
      VALUES (?, ?)
    `);
    stmt.run(todoId, tagId);
  },

  // Get all tags for a todo
  getByTodoId(todoId: number): Tag[] {
    const stmt = db.prepare(`
      SELECT t.* FROM tags t
      JOIN todo_tags tt ON t.id = tt.tag_id
      WHERE tt.todo_id = ?
    `);
    return stmt.all(todoId) as Tag[];
  },
};
```

---

## Edge Cases

### 1. Empty Todo List Export
**Scenario:** User has zero todos and clicks export

**Handling:**
- Export succeeds with empty array
- JSON structure:
  ```json
  {
    "version": "1.0",
    "exportedAt": "2025-11-02T14:30:00+08:00",
    "totalTodos": 0,
    "todos": []
  }
  ```
- CSV has header row only
- Valid file, can be imported (creates no todos)

### 2. Import Same File Twice
**Scenario:** User accidentally imports backup file twice

**Handling:**
- Both imports succeed
- Creates duplicate todos (expected behavior)
- Each todo gets unique new ID
- User has 2x todos with identical content
- User manually deletes duplicates
- No automatic deduplication (out of scope)

### 3. Import with Unknown Fields
**Scenario:** Export file has extra fields not in schema

**Handling:**
- Validation ignores unknown fields
- Only known fields imported
- Example: `{"title": "Task", "custom_field": "value"}` → custom_field ignored
- No errors thrown
- Graceful degradation

### 4. Import with Missing Optional Fields
**Scenario:** Minimal JSON with only title

**Handling:**
- Defaults applied:
  - completed: 0
  - priority: "medium"
  - due_date: null
  - recurrence_enabled: 0
  - reminder_minutes: null
  - tags: []
  - subtasks: []
- Todo created successfully
- No errors

### 5. Tag Name Collision (Case Sensitivity)
**Scenario:** Import has tag "Work", user has tag "WORK"

**Handling:**
- Case-insensitive matching: `LOWER(name) = LOWER(?)`
- "Work" and "WORK" treated as same tag
- Existing tag reused
- No duplicate tag created
- Color from existing tag used (import color ignored)

### 6. Tag Color Mismatch
**Scenario:** Import tag "Work" (#3B82F6), existing "Work" (#22C55E)

**Handling:**
- Existing tag reused by name match
- Existing color preserved (#22C55E)
- Import color ignored
- No color update
- Tags matched by name only, not color

### 7. Subtask Order Preservation
**Scenario:** Export has subtasks with position: 2, 0, 1 (out of order)

**Handling:**
- Position values imported exactly
- Subtasks created with same position values
- Display order follows position field
- No automatic reordering
- Maintains export order

### 8. Very Large Export (1000+ Todos)
**Scenario:** User exports 2000 todos with subtasks/tags

**Handling:**
- JSON file size: ~5-10 MB
- Browser handles download without issues
- No pagination (all todos in one file)
- Import processes all in single transaction
- May take 5-10 seconds for import
- User sees "Importing..." loading state
- Success after completion

### 9. Import During Active Session
**Scenario:** User imports while editing a todo

**Handling:**
- Import creates new todos immediately
- No conflict with editing
- Edit continues on original todo
- After import completes, page refreshes
- Edit lost (user should save first)
- **Enhancement:** Show confirmation before import

### 10. Invalid JSON Syntax
**Scenario:** File has syntax error (missing comma, bracket)

**Handling:**
- `JSON.parse()` throws SyntaxError
- Caught in try-catch
- Error message: "Invalid JSON format"
- No database changes
- User can fix file and retry
- No partial import

### 11. Network Error During Import
**Scenario:** Connection drops while uploading file

**Handling:**
- Fetch throws network error
- Caught in try-catch
- Error message: "Failed to import todos"
- No todos created (fetch failed before backend)
- User retries when connection restored

### 12. Database Transaction Failure
**Scenario:** Database locked or constraint violation during import

**Handling:**
- Transaction rolls back automatically
- No partial data created
- Error returned to frontend
- Generic error message: "Failed to import todos"
- User can retry
- All-or-nothing guarantee maintained

### 13. Export with Active Filters
**Scenario:** User has search "work" active, only 5 todos visible

**Handling:**
- Export ignores filters
- Exports ALL user's todos (e.g., 50 total)
- Backend queries: `WHERE user_id = ?` (no filter conditions)
- User gets complete backup
- Prevents accidental partial backup

### 14. CSV Import Attempt
**Scenario:** User tries to import CSV file

**Handling:**
- File picker accepts `.json` only
- CSV file won't show in picker
- If user changes filter to "All Files":
  - CSV selected
  - JSON.parse() fails
  - Error: "Invalid JSON format"
- CSV import not supported (out of scope)

### 15. Unicode Characters in Titles
**Scenario:** Export contains todos with emoji, Chinese, Arabic

**Handling:**
- JSON supports UTF-8 encoding
- All characters preserved exactly
- Example: "📝 会议记录"
- Import recreates with same characters
- No encoding issues
- Works across browsers/platforms

---

## Acceptance Criteria

### Functional Requirements

#### FR1: Export JSON
- [ ] "Export JSON" button visible at top of page
- [ ] Button styled in green color
- [ ] Clicking triggers immediate download
- [ ] Filename: `todos-YYYY-MM-DD.json`
- [ ] Date uses Singapore timezone
- [ ] File contains valid JSON
- [ ] JSON properly indented (pretty-printed)
- [ ] Includes all todos for current user
- [ ] Each todo includes: id, title, completed, due_date, priority, recurrence, reminder, created_at
- [ ] Each todo includes nested subtasks array
- [ ] Each todo includes nested tags array
- [ ] Export metadata: version, exportedAt, totalTodos
- [ ] Ignores current filter state (exports all)

#### FR2: Export CSV
- [ ] "Export CSV" button visible at top of page
- [ ] Button styled in dark green color
- [ ] Clicking triggers immediate download
- [ ] Filename: `todos-YYYY-MM-DD.csv`
- [ ] First row contains column headers
- [ ] Columns: ID, Title, Completed, Due Date, Priority, Recurring, Pattern, Reminder, Tags, Subtasks, Created At
- [ ] Boolean values as "true"/"false" strings
- [ ] Dates in ISO8601 format
- [ ] Tags as comma-separated names
- [ ] Subtasks as comma-separated titles
- [ ] String values properly quoted
- [ ] Opens correctly in Excel/Google Sheets

#### FR3: Import JSON
- [ ] "Import" button visible at top of page
- [ ] Button styled in blue color
- [ ] Clicking opens file picker
- [ ] File picker filters for `.json` files
- [ ] Selecting file uploads immediately
- [ ] Loading state shown during import
- [ ] Success message after completion
- [ ] Message format: "Successfully imported X todos"
- [ ] Page refreshes automatically
- [ ] New todos appear in list

#### FR4: ID Remapping
- [ ] Imported todos get new sequential IDs
- [ ] Original IDs from export discarded
- [ ] Subtasks remapped to new parent IDs
- [ ] Example: Export todo id:42 → Import todo id:5
- [ ] Example: Export subtask todo_id:42 → Import subtask todo_id:5
- [ ] All relationships maintained correctly
- [ ] No orphaned subtasks

#### FR5: Tag Import with Matching
- [ ] Tags matched by name (case-insensitive)
- [ ] Existing tags reused (no duplicates)
- [ ] New tags created if name not found
- [ ] Tag color preserved from export (for new tags)
- [ ] Todo-tag relationships recreated
- [ ] Multiple tags per todo supported
- [ ] Tag IDs remapped correctly

#### FR6: Subtask Import
- [ ] Subtasks imported with parent todos
- [ ] Subtask titles preserved
- [ ] Subtask completion status preserved
- [ ] Subtask position order preserved
- [ ] Subtasks get new IDs
- [ ] Subtasks linked to new parent todo IDs

#### FR7: Data Validation
- [ ] Valid JSON syntax required
- [ ] Root object must have "todos" array
- [ ] Each todo must have "title" field
- [ ] Priority validated (high/medium/low)
- [ ] Recurrence pattern validated (daily/weekly/monthly/yearly)
- [ ] Reminder minutes validated (number or null)
- [ ] Completed validated (0 or 1)
- [ ] Invalid files rejected with error
- [ ] No partial imports on validation failure

#### FR8: Error Handling
- [ ] Syntax errors: "Invalid JSON format"
- [ ] Missing title: "Missing or invalid title"
- [ ] Invalid priority: "Invalid priority. Must be: high, medium, or low"
- [ ] Invalid recurrence: "Invalid recurrence pattern"
- [ ] Empty file: "No todos found in file"
- [ ] Network errors: "Failed to import todos"
- [ ] Errors displayed in red alert
- [ ] Errors auto-dismiss after 5 seconds

#### FR9: Transaction Safety
- [ ] Import uses database transaction
- [ ] All-or-nothing guarantee
- [ ] Validation failure = no todos created
- [ ] Database error = rollback
- [ ] No partial data on failure

#### FR10: User Feedback
- [ ] Success toast notification
- [ ] Error toast notification
- [ ] Loading spinner during import
- [ ] Button disabled during import
- [ ] Clear success/error indication

### Non-Functional Requirements

#### NFR1: Performance
- [ ] Export 100 todos < 500ms
- [ ] Export 1000 todos < 3 seconds
- [ ] Import 100 todos < 1 second
- [ ] Import 1000 todos < 10 seconds
- [ ] No browser freezing during export/import

#### NFR2: Data Integrity
- [ ] All todos exported completely
- [ ] No data loss on export/import cycle
- [ ] Relationships preserved (subtasks, tags)
- [ ] Unicode characters handled correctly
- [ ] Timezone conversions accurate

#### NFR3: File Compatibility
- [ ] JSON opens in text editors
- [ ] JSON valid according to spec
- [ ] CSV opens in Excel without errors
- [ ] CSV opens in Google Sheets without errors
- [ ] CSV opens in Apple Numbers without errors

#### NFR4: Security
- [ ] Export only user's own todos
- [ ] Import links to importing user
- [ ] No cross-user data leakage
- [ ] File size reasonable (no DoS)
- [ ] Input validation prevents injection

#### NFR5: Usability
- [ ] Filename includes date for organization
- [ ] Buttons clearly labeled
- [ ] Error messages helpful
- [ ] Success messages confirm action
- [ ] No confusing UX

---

## Testing Requirements

### E2E Tests (Playwright)

Create `tests/09-export-import.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Export & Import', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new TestHelper(page, context);
    await helper.setupAuthenticatedSession();
  });

  test('should show export and import buttons', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('button:has-text("Export JSON")')).toBeVisible();
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Import")')).toBeVisible();
  });

  test('should export JSON with correct filename', async ({ page }) => {
    await page.goto('/');
    
    // Create a todo
    await helper.createTodo({ title: 'Test Export' });
    
    // Start waiting for download
    const downloadPromise = page.waitForEvent('download');
    
    // Click export
    await page.click('button:has-text("Export JSON")');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Check filename format (todos-YYYY-MM-DD.json)
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^todos-\d{4}-\d{2}-\d{2}\.json$/);
  });

  test('should export JSON with valid content', async ({ page }) => {
    await page.goto('/');
    
    // Create todos with various properties
    await helper.createTodo({
      title: 'High Priority Task',
      priority: 'high',
      dueDate: '2025-11-10T14:00:00+08:00',
    });
    
    await helper.createTodo({
      title: 'Recurring Task',
      recurrenceEnabled: true,
      recurrencePattern: 'weekly',
    });
    
    // Export JSON
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export JSON")');
    const download = await downloadPromise;
    
    // Save and parse JSON
    const downloadPath = await download.path();
    const content = fs.readFileSync(downloadPath!, 'utf-8');
    const data = JSON.parse(content);
    
    // Validate structure
    expect(data).toHaveProperty('version', '1.0');
    expect(data).toHaveProperty('exportedAt');
    expect(data).toHaveProperty('totalTodos', 2);
    expect(data).toHaveProperty('todos');
    expect(data.todos).toHaveLength(2);
    
    // Validate first todo
    const todo1 = data.todos.find((t: any) => t.title === 'High Priority Task');
    expect(todo1).toBeDefined();
    expect(todo1.priority).toBe('high');
    expect(todo1.due_date).toContain('2025-11-10');
    
    // Validate second todo
    const todo2 = data.todos.find((t: any) => t.title === 'Recurring Task');
    expect(todo2).toBeDefined();
    expect(todo2.recurrence_enabled).toBe(1);
    expect(todo2.recurrence_pattern).toBe('weekly');
  });

  test('should export CSV with correct filename', async ({ page }) => {
    await page.goto('/');
    
    await helper.createTodo({ title: 'Test Export' });
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export CSV")');
    const download = await downloadPromise;
    
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^todos-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  test('should export CSV with valid content', async ({ page }) => {
    await page.goto('/');
    
    await helper.createTodo({
      title: 'CSV Task',
      priority: 'medium',
      completed: false,
    });
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export CSV")');
    const download = await downloadPromise;
    
    const downloadPath = await download.path();
    const content = fs.readFileSync(downloadPath!, 'utf-8');
    const lines = content.split('\n');
    
    // Header row
    expect(lines[0]).toContain('ID,Title,Completed,Due Date,Priority');
    
    // Data row
    expect(lines[1]).toContain('"CSV Task"');
    expect(lines[1]).toContain('false');
    expect(lines[1]).toContain('medium');
  });

  test('should import JSON file successfully', async ({ page }) => {
    await page.goto('/');
    
    // Create export data
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalTodos: 1,
      todos: [
        {
          id: 999, // Will be remapped
          title: 'Imported Task',
          completed: 0,
          due_date: null,
          priority: 'high',
          recurrence_enabled: 0,
          recurrence_pattern: null,
          reminder_minutes: null,
          created_at: new Date().toISOString(),
          subtasks: [],
          tags: [],
        },
      ],
    };
    
    // Write to temp file
    const tempFile = path.join(require('os').tmpdir(), 'test-import.json');
    fs.writeFileSync(tempFile, JSON.stringify(exportData));
    
    // Setup file chooser handler
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(tempFile);
    
    // Wait for success message
    await expect(page.locator('text=Successfully imported 1 todos')).toBeVisible();
    
    // Verify todo appears
    await page.reload();
    await expect(page.locator('text=Imported Task')).toBeVisible();
    
    // Cleanup
    fs.unlinkSync(tempFile);
  });

  test('should import with ID remapping', async ({ page }) => {
    await page.goto('/');
    
    // Export has original ID 42
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalTodos: 1,
      todos: [
        {
          id: 42,
          title: 'ID Remap Test',
          completed: 0,
          due_date: null,
          priority: 'medium',
          recurrence_enabled: 0,
          recurrence_pattern: null,
          reminder_minutes: null,
          created_at: new Date().toISOString(),
          subtasks: [],
          tags: [],
        },
      ],
    };
    
    const tempFile = path.join(require('os').tmpdir(), 'test-remap.json');
    fs.writeFileSync(tempFile, JSON.stringify(exportData));
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(tempFile);
    
    await expect(page.locator('text=Successfully imported')).toBeVisible();
    await page.reload();
    
    // Todo exists but with new ID (not 42)
    await expect(page.locator('text=ID Remap Test')).toBeVisible();
    
    // Verify in database it's not ID 42 (would need API call or DB check)
    // For E2E, we verify it exists and functions correctly
    
    fs.unlinkSync(tempFile);
  });

  test('should import with subtasks', async ({ page }) => {
    await page.goto('/');
    
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalTodos: 1,
      todos: [
        {
          id: 1,
          title: 'Parent Task',
          completed: 0,
          due_date: null,
          priority: 'medium',
          recurrence_enabled: 0,
          recurrence_pattern: null,
          reminder_minutes: null,
          created_at: new Date().toISOString(),
          subtasks: [
            { id: 10, todo_id: 1, title: 'Subtask 1', completed: 0, position: 0 },
            { id: 11, todo_id: 1, title: 'Subtask 2', completed: 1, position: 1 },
          ],
          tags: [],
        },
      ],
    };
    
    const tempFile = path.join(require('os').tmpdir(), 'test-subtasks.json');
    fs.writeFileSync(tempFile, JSON.stringify(exportData));
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(tempFile);
    
    await expect(page.locator('text=Successfully imported')).toBeVisible();
    await page.reload();
    
    // Expand todo to see subtasks
    await page.click('text=Parent Task');
    
    // Both subtasks appear
    await expect(page.locator('text=Subtask 1')).toBeVisible();
    await expect(page.locator('text=Subtask 2')).toBeVisible();
    
    // Subtask 2 is checked
    const subtask2Checkbox = page.locator('text=Subtask 2').locator('..').locator('input[type="checkbox"]');
    await expect(subtask2Checkbox).toBeChecked();
    
    fs.unlinkSync(tempFile);
  });

  test('should import with tag matching', async ({ page }) => {
    await page.goto('/');
    
    // Create existing tag
    const existingTag = await helper.createTag({ name: 'Work', color: '#3B82F6' });
    
    // Import with same tag name (should reuse)
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalTodos: 1,
      todos: [
        {
          id: 1,
          title: 'Tagged Task',
          completed: 0,
          due_date: null,
          priority: 'medium',
          recurrence_enabled: 0,
          recurrence_pattern: null,
          reminder_minutes: null,
          created_at: new Date().toISOString(),
          subtasks: [],
          tags: [
            { id: 999, name: 'Work', color: '#22C55E' }, // Different color, should use existing
            { id: 1000, name: 'Urgent', color: '#EF4444' }, // New tag
          ],
        },
      ],
    };
    
    const tempFile = path.join(require('os').tmpdir(), 'test-tags.json');
    fs.writeFileSync(tempFile, JSON.stringify(exportData));
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(tempFile);
    
    await expect(page.locator('text=Successfully imported')).toBeVisible();
    await page.reload();
    
    // Todo has both tags
    await expect(page.locator('text=Tagged Task')).toBeVisible();
    await expect(page.locator('text=Work')).toBeVisible();
    await expect(page.locator('text=Urgent')).toBeVisible();
    
    fs.unlinkSync(tempFile);
  });

  test('should reject invalid JSON', async ({ page }) => {
    await page.goto('/');
    
    // Create invalid JSON file
    const tempFile = path.join(require('os').tmpdir(), 'invalid.json');
    fs.writeFileSync(tempFile, '{ invalid json }');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(tempFile);
    
    // Error message
    await expect(page.locator('text=Invalid JSON format')).toBeVisible();
    
    // No todos created
    await page.reload();
    // Check no unexpected todos (count should be initial state)
    
    fs.unlinkSync(tempFile);
  });

  test('should reject missing title', async ({ page }) => {
    await page.goto('/');
    
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalTodos: 1,
      todos: [
        {
          id: 1,
          // Missing title!
          completed: 0,
          priority: 'medium',
        },
      ],
    };
    
    const tempFile = path.join(require('os').tmpdir(), 'missing-title.json');
    fs.writeFileSync(tempFile, JSON.stringify(exportData));
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(tempFile);
    
    await expect(page.locator('text=Missing or invalid title')).toBeVisible();
    
    fs.unlinkSync(tempFile);
  });

  test('should reject invalid priority', async ({ page }) => {
    await page.goto('/');
    
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalTodos: 1,
      todos: [
        {
          id: 1,
          title: 'Task',
          priority: 'super-urgent', // Invalid!
        },
      ],
    };
    
    const tempFile = path.join(require('os').tmpdir(), 'invalid-priority.json');
    fs.writeFileSync(tempFile, JSON.stringify(exportData));
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(tempFile);
    
    await expect(page.locator('text=Invalid priority')).toBeVisible();
    
    fs.unlinkSync(tempFile);
  });

  test('should export all todos ignoring filters', async ({ page }) => {
    await page.goto('/');
    
    // Create multiple todos
    await helper.createTodo({ title: 'High Priority', priority: 'high' });
    await helper.createTodo({ title: 'Low Priority', priority: 'low' });
    await page.reload();
    
    // Filter to show only high priority
    await page.selectOption('select:has-text("All Priorities")', 'high');
    
    // Only 1 visible
    await expect(page.locator('text=High Priority')).toBeVisible();
    await expect(page.locator('text=Low Priority')).not.toBeVisible();
    
    // Export JSON
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export JSON")');
    const download = await downloadPromise;
    
    const downloadPath = await download.path();
    const content = fs.readFileSync(downloadPath!, 'utf-8');
    const data = JSON.parse(content);
    
    // Both todos in export (filter ignored)
    expect(data.totalTodos).toBe(2);
    expect(data.todos).toHaveLength(2);
  });

  test('should handle import of large file', async ({ page }) => {
    await page.goto('/');
    
    // Create export with 100 todos
    const todos = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      title: `Task ${i + 1}`,
      completed: 0,
      due_date: null,
      priority: 'medium' as const,
      recurrence_enabled: 0,
      recurrence_pattern: null,
      reminder_minutes: null,
      created_at: new Date().toISOString(),
      subtasks: [],
      tags: [],
    }));
    
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalTodos: 100,
      todos,
    };
    
    const tempFile = path.join(require('os').tmpdir(), 'large-import.json');
    fs.writeFileSync(tempFile, JSON.stringify(exportData));
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("Import")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(tempFile);
    
    // Success message
    await expect(page.locator('text=Successfully imported 100 todos')).toBeVisible();
    
    await page.reload();
    
    // Verify count (at least some todos visible)
    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 100')).toBeVisible();
    
    fs.unlinkSync(tempFile);
  });
});
```

### Unit Tests

Create `tests/unit/importValidation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateImportData, applyDefaults } from '@/lib/importValidation';

describe('Import Validation', () => {
  it('should accept valid minimal todo', () => {
    const data = {
      todos: [
        {
          title: 'Valid Task',
        },
      ],
    };
    
    const result = validateImportData(data);
    expect(result.valid).toBe(true);
  });

  it('should accept valid complete todo', () => {
    const data = {
      todos: [
        {
          title: 'Complete Task',
          completed: 0,
          priority: 'high',
          due_date: '2025-11-10T14:00:00+08:00',
          recurrence_enabled: 1,
          recurrence_pattern: 'weekly',
          reminder_minutes: 60,
          subtasks: [
            { title: 'Subtask 1', completed: 0, position: 0 },
          ],
          tags: [
            { name: 'Work', color: '#3B82F6' },
          ],
        },
      ],
    };
    
    const result = validateImportData(data);
    expect(result.valid).toBe(true);
  });

  it('should reject missing todos array', () => {
    const data = {};
    
    const result = validateImportData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing todos array');
  });

  it('should reject missing title', () => {
    const data = {
      todos: [
        {
          priority: 'high',
        },
      ],
    };
    
    const result = validateImportData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing or invalid title');
  });

  it('should reject empty title', () => {
    const data = {
      todos: [
        {
          title: '   ',
        },
      ],
    };
    
    const result = validateImportData(data);
    expect(result.valid).toBe(false);
  });

  it('should reject invalid priority', () => {
    const data = {
      todos: [
        {
          title: 'Task',
          priority: 'super-urgent',
        },
      ],
    };
    
    const result = validateImportData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid priority');
  });

  it('should reject invalid recurrence pattern', () => {
    const data = {
      todos: [
        {
          title: 'Task',
          recurrence_pattern: 'sometimes',
        },
      ],
    };
    
    const result = validateImportData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid recurrence pattern');
  });

  it('should accept valid priorities', () => {
    ['high', 'medium', 'low'].forEach(priority => {
      const data = {
        todos: [{ title: 'Task', priority }],
      };
      const result = validateImportData(data);
      expect(result.valid).toBe(true);
    });
  });

  it('should accept valid recurrence patterns', () => {
    ['daily', 'weekly', 'monthly', 'yearly'].forEach(pattern => {
      const data = {
        todos: [{ title: 'Task', recurrence_pattern: pattern }],
      };
      const result = validateImportData(data);
      expect(result.valid).toBe(true);
    });
  });

  it('should apply defaults for missing fields', () => {
    const todo = {
      title: 'Minimal Task',
    };
    
    const result = applyDefaults(todo);
    
    expect(result.completed).toBe(0);
    expect(result.priority).toBe('medium');
    expect(result.recurrence_enabled).toBe(0);
    expect(result.recurrence_pattern).toBe(null);
    expect(result.reminder_minutes).toBe(null);
    expect(result.subtasks).toEqual([]);
    expect(result.tags).toEqual([]);
  });

  it('should preserve provided fields', () => {
    const todo = {
      title: 'Task',
      completed: 1,
      priority: 'high',
    };
    
    const result = applyDefaults(todo);
    
    expect(result.completed).toBe(1);
    expect(result.priority).toBe('high');
  });

  it('should reject invalid tag structure', () => {
    const data = {
      todos: [
        {
          title: 'Task',
          tags: [
            { name: 'Valid', color: '#3B82F6' },
            { name: 'Invalid', color: 'blue' }, // Invalid hex
          ],
        },
      ],
    };
    
    const result = validateImportData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid color');
  });

  it('should reject invalid subtask structure', () => {
    const data = {
      todos: [
        {
          title: 'Task',
          subtasks: [
            { title: '' }, // Empty title
          ],
        },
      ],
    };
    
    const result = validateImportData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing or invalid title');
  });
});
```

---

## Out of Scope

The following features are **explicitly excluded** from this implementation:

### 1. CSV Import
- Importing todos from CSV files
- CSV-to-JSON conversion
- **Reason:** CSV lacks nested structures (subtasks, tags), complex to parse reliably

### 2. Merge/Update on Import
- Detecting duplicate todos
- Updating existing todos based on ID or title
- Merge conflict resolution
- **Reason:** Complexity high, clear "creates new" behavior simpler

### 3. Selective Import
- UI to preview todos before import
- Checkboxes to select which todos to import
- Partial import of file
- **Reason:** MVP uses all-or-nothing import

### 4. Import from Other Apps
- Todoist import
- Google Tasks import
- Microsoft To Do import
- **Reason:** Requires format converters, out of scope

### 5. Cloud Backup Integration
- Automatic backup to Google Drive
- Dropbox integration
- iCloud sync
- **Reason:** Manual export sufficient for MVP

### 6. Scheduled Auto-Export
- Daily/weekly automatic backups
- Background export jobs
- Email backup files
- **Reason:** User can manually export regularly

### 7. Export Filtering
- Export only completed todos
- Export date range
- Export by tag
- **Reason:** Export all is simpler, user can filter after

### 8. Import Preview
- Show todo count before import
- Preview data in modal
- Validate before confirmation
- **Reason:** Validation happens automatically, preview adds complexity

### 9. Incremental Import
- Import only new todos (skip duplicates)
- Smart duplicate detection
- Timestamp-based sync
- **Reason:** Simple create-new behavior clearer

### 10. Multi-Format Export
- PDF export
- Markdown export
- HTML export
- **Reason:** JSON and CSV cover primary use cases

---

## Success Metrics

### User Engagement
- **Target:** 40% of users export at least once per month
- **Target:** 80% of users export before major changes
- **Target:** 15% of users use import for device transfer

### Feature Usage
- **Target:** JSON export 3x more popular than CSV
- **Target:** Average 2 exports per active user per month
- **Target:** Import success rate > 95%

### Data Integrity
- **Target:** Zero data loss reports in export/import cycle
- **Target:** 100% relationship preservation (subtasks, tags)
- **Target:** All validation errors provide actionable messages

### Technical Quality
- **Target:** Export 1000 todos < 3 seconds
- **Target:** Import 1000 todos < 10 seconds
- **Target:** 100% E2E test pass rate (25 test cases)
- **Target:** All acceptance criteria validated

---

## Implementation Notes

### Development Order
1. **Phase 1: Export JSON Backend**
   - Create `/api/todos/export` route
   - Implement JSON generation with nested data
   - Add Singapore timezone handling
   - Test with various data sizes

2. **Phase 2: Export CSV Backend**
   - Add CSV format to export route
   - Implement CSV escaping (quotes, commas)
   - Test in Excel, Google Sheets, Numbers

3. **Phase 3: Export Frontend**
   - Build ExportImportButtons component
   - Implement download triggers
   - Test browser download behavior

4. **Phase 4: Import Validation**
   - Create `lib/importValidation.ts`
   - Implement all validation rules
   - Write comprehensive unit tests

5. **Phase 5: Import Backend**
   - Create `/api/todos/import` route
   - Implement transaction logic
   - Add ID remapping for todos, subtasks
   - Implement tag matching by name

6. **Phase 6: Import Frontend**
   - Add file picker integration
   - Implement loading states
   - Add success/error toast notifications

7. **Phase 7: Testing**
   - Write E2E tests (25 test cases)
   - Test large file imports (1000+ todos)
   - Cross-browser testing
   - File format compatibility testing

8. **Phase 8: Documentation**
   - Update USER_GUIDE.md with examples
   - Add troubleshooting section
   - Document backup strategies

### Dependencies
- **Requires:** PRP-01 (Todo CRUD) - todo database operations
- **Requires:** PRP-05 (Subtasks) - subtask relationships
- **Requires:** PRP-06 (Tags) - tag relationships
- **Enhances:** All features - provides data portability

### Security Considerations
- **File size limits:** Consider adding max file size (10MB) to prevent DoS
- **Rate limiting:** Limit export requests to prevent abuse
- **Input validation:** Comprehensive validation prevents injection
- **User isolation:** Export/import respects user_id boundaries

### Performance Considerations
- **Transaction usage:** Atomic import prevents partial data
- **Batch inserts:** Consider batch operations for large imports
- **Memory usage:** Stream large exports instead of loading all in memory
- **Database indexes:** Ensure queries are indexed for performance

---

**Feature Owner:** AI Development Team  
**Last Updated:** February 5, 2026  
**Status:** Ready for Implementation
