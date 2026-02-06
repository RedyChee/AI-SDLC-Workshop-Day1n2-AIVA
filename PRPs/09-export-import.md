# PRP 09: Export & Import

## Feature Overview

Backup and restore todo data through JSON and CSV export/import functionality. JSON export captures complete todo data including all fields and can be re-imported. CSV export provides a spreadsheet-friendly format for analysis and reporting. Import accepts JSON files from previous exports, creates new todos with remapped IDs, and preserves all todo properties while linking to the importing user.

---

## User Stories

1. **As a user**, I want to export my todos as JSON so that I can create a complete backup of my data.
2. **As a user**, I want to export my todos as CSV so that I can analyze them in spreadsheet applications.
3. **As a user**, I want to import a previously exported JSON file so that I can restore my todos on a new device or after data loss.
4. **As a user**, I want imported todos to receive new IDs so that they don't conflict with existing data.
5. **As a user**, I want to see a confirmation of how many todos were imported so that I know the import succeeded.
6. **As a user**, I want clear error messages if import fails so that I can troubleshoot issues.

---

## User Flow

### Exporting as JSON
1. User clicks **"Export JSON"** button (green, top-right area of the page)
2. Browser initiates a file download
3. File is named `todos-YYYY-MM-DD.json` (Singapore date)
4. File contains an array of todo objects with all fields

### Exporting as CSV
1. User clicks **"Export CSV"** button (dark green, top-right area)
2. Browser initiates a file download
3. File is named `todos-YYYY-MM-DD.csv` (Singapore date)
4. File contains header row + one row per todo

### Importing from JSON
1. User clicks **"Import"** button (blue, top-right area)
2. Browser file picker opens
3. User selects a `.json` file (from a previous export)
4. File is validated:
   - Must be valid JSON
   - Must contain the expected data structure
   - Required fields must be present
5. On success: New todos are created, success message displayed: `"Successfully imported X todos"`
6. On failure: Error message displayed: `"Failed to import todos. Please check the file format."`
7. Todo list refreshes to show imported items

---

## Technical Requirements

### API Endpoints

#### `GET /api/todos/export?format=json`
- **Auth**: Required (session cookie)
- **Query Params**: `format` — `json` or `csv`
- **Response (JSON)**: `200 OK` → file download
  - Content-Type: `application/json`
  - Content-Disposition: `attachment; filename="todos-YYYY-MM-DD.json"`
  - Body: Array of todo objects
- **Response (CSV)**: `200 OK` → file download
  - Content-Type: `text/csv`
  - Content-Disposition: `attachment; filename="todos-YYYY-MM-DD.csv"`
  - Body: CSV text with header row

#### `POST /api/todos/import`
- **Auth**: Required
- **Content-Type**: `application/json`
- **Body**: Array of todo objects (from previous JSON export)
- **Response (Success)**: `200 OK` → `{ message: 'Successfully imported X todos', count: X }`
- **Response (Error)**: `400 Bad Request` → `{ error: 'Failed to import todos' }`
- **Behavior**:
  1. Validate incoming JSON structure
  2. For each todo object:
     - Assign new ID (auto-increment)
     - Set `user_id` to `session.userId`
     - Preserve: title, completed, due_date, priority, is_recurring, recurrence_pattern, reminder_minutes, created_at
  3. Return count of imported todos

### JSON Export Format

```json
[
  {
    "id": 1,
    "title": "Sample Todo",
    "completed": false,
    "due_date": "2025-11-10T14:00",
    "priority": "high",
    "is_recurring": true,
    "recurrence_pattern": "weekly",
    "reminder_minutes": 60,
    "created_at": "2025-11-02T10:30:00"
  }
]
```

### CSV Export Format

```csv
ID,Title,Completed,Due Date,Priority,Recurring,Pattern,Reminder
1,"Sample Todo",false,"2025-11-10T14:00","high",true,"weekly",60
2,"Another Todo",true,,"medium",false,,
```

**CSV rules:**
- Comma-separated values
- Header row as first line
- Strings quoted with double quotes
- Empty values represented as empty fields
- Boolean values as `true`/`false`

### Import Processing

```typescript
// Import flow in API route
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const todos = await request.json();

  if (!Array.isArray(todos)) {
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  }

  let importedCount = 0;
  for (const todo of todos) {
    if (!todo.title) continue; // Skip invalid entries

    todoDB.create({
      user_id: session.userId,
      title: todo.title,
      completed: todo.completed || false,
      due_date: todo.due_date || null,
      priority: todo.priority || 'medium',
      is_recurring: todo.is_recurring || false,
      recurrence_pattern: todo.recurrence_pattern || null,
      reminder_minutes: todo.reminder_minutes ?? null,
      last_notification_sent: null, // Reset notification state
    });
    importedCount++;
  }

  return NextResponse.json({
    message: `Successfully imported ${importedCount} todos`,
    count: importedCount,
  });
}
```

### Client-Side Export Trigger

```typescript
// JSON export
const handleExportJSON = async () => {
  const response = await fetch('/api/todos/export?format=json');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `todos-${formatSingaporeDate(getSingaporeNow())}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// CSV export
const handleExportCSV = async () => {
  const response = await fetch('/api/todos/export?format=csv');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `todos-${formatSingaporeDate(getSingaporeNow())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
```

### Client-Side Import Trigger

```typescript
const handleImport = async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const todos = JSON.parse(text);
      const response = await fetch('/api/todos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todos),
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message); // or UI notification
        fetchTodos(); // Refresh the list
      } else {
        alert(result.error);
      }
    } catch {
      alert('Invalid JSON format');
    }
  };
  input.click();
};
```

### Timezone Handling

```typescript
import { getSingaporeNow, formatSingaporeDate } from '@/lib/timezone';

// File naming uses Singapore date
const filename = `todos-${formatSingaporeDate(getSingaporeNow())}.json`;
```

---

## UI Components

### Export Buttons
- **"Export JSON"** button: Green background, positioned in top-right action area
- **"Export CSV"** button: Dark green background, next to JSON export button
- Both trigger immediate file download

### Import Button
- **"Import"** button: Blue background, in top-right action area
- Opens browser file picker (accept `.json` only)
- Shows success/error message after processing

### Success/Error Messages
- **Success**: `"Successfully imported X todos"` — green text or alert
- **Error**: `"Failed to import todos. Please check the file format."` — red text or alert

---

## Edge Cases

1. **Empty todo list export**: Export valid JSON (`[]`) or CSV with only header row
2. **Large export**: No file size limit enforced; may be slow for 500+ todos
3. **Invalid JSON import**: Show error message `"Invalid JSON format"`
4. **Missing required fields in import**: Skip invalid entries, import valid ones
5. **Import creates duplicates**: Importing the same file twice creates duplicate todos (by design — no merge logic)
6. **CSV cannot be re-imported**: CSV is export-only; import only accepts JSON
7. **Import from different user**: Todo `user_id` overwritten with importing user's ID
8. **Import with invalid priority values**: Default to `'medium'`
9. **Import with invalid recurrence patterns**: Default to `null`
10. **Tags not imported**: Tags and tag associations are NOT included in import (must be reassigned manually)
11. **Subtasks not imported**: Subtask data may not be in export format; only top-level todo fields imported
12. **Network error during import**: Show generic error message
13. **Browser file picker cancelled**: No action taken
14. **`reminder_minutes` can be null/undefined**: Use `?? null` when importing

---

## Acceptance Criteria

- [ ] User can export todos as JSON file
- [ ] JSON file named `todos-YYYY-MM-DD.json` with Singapore date
- [ ] JSON export contains all todo fields
- [ ] User can export todos as CSV file
- [ ] CSV file named `todos-YYYY-MM-DD.csv` with Singapore date
- [ ] CSV has header row and correct column format
- [ ] User can import a JSON file via file picker
- [ ] Import creates new todos with new IDs
- [ ] Import links todos to the importing user
- [ ] Import preserves: title, completed, due_date, priority, recurrence, reminder
- [ ] Success message shows count of imported todos
- [ ] Error message shown for invalid JSON format
- [ ] Import skips entries with missing required fields
- [ ] Empty export produces valid file (empty array / header-only CSV)
- [ ] All export/import operations require authentication
- [ ] File downloads trigger correctly in browser

---

## Testing Requirements

### E2E Tests (Playwright)

```typescript
// tests/09-export-import.spec.ts

test('should export todos as JSON', async ({ page }) => {
  // Create todos, click Export JSON, verify download triggered
});

test('should export todos as CSV', async ({ page }) => {
  // Create todos, click Export CSV, verify download triggered
});

test('should import todos from JSON file', async ({ page }) => {
  // Export todos, import the file, verify todos appear
});

test('should show success message after import', async ({ page }) => {
  // Import valid file, verify success message with count
});

test('should show error for invalid JSON', async ({ page }) => {
  // Try importing invalid file, verify error message
});

test('should assign new IDs to imported todos', async ({ page }) => {
  // Import file, verify todos have new IDs (no conflicts)
});

test('should link imported todos to current user', async ({ page }) => {
  // Import file, verify todos belong to importing user
});

test('should handle empty export', async ({ page }) => {
  // Export with no todos, verify valid empty file
});

test('should preserve todo properties on import', async ({ page }) => {
  // Create todo with all fields, export, import, verify all fields preserved
});
```

---

## Out of Scope

- CSV import (CSV is export-only)
- Selective export (export specific todos only)
- Incremental/differential export
- Cloud backup integration (Dropbox, Google Drive)
- Export scheduling (automatic periodic exports)
- Tag export/import
- Subtask export/import
- Export encryption or password protection
- Import merge/deduplication logic
- Export to other formats (XML, PDF, etc.)

---

## Success Metrics

- Export produces valid, correctly formatted files every time
- JSON round-trip (export → import) preserves all supported fields
- Import correctly handles edge cases (missing fields, invalid values)
- File downloads complete in < 2 seconds for lists up to 500 todos
- Import of 100+ todos completes in < 5 seconds
- Error messages clearly indicate the nature of import failures
- Users can successfully backup and restore their todos across devices
