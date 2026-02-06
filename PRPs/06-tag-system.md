# PRP 06: Tag System

## Feature Overview

Organize todos with custom, color-coded labels (tags) for better categorization and filtering. Tags use a many-to-many relationship with todos via a junction table. Each user has their own set of tags with unique names and customizable hex colors. Tags appear as colored pills on todo items and can be used as filter criteria.

---

## User Stories

1. **As a user**, I want to create custom tags with names and colors so that I can categorize my todos by context (Work, Personal, etc.).
2. **As a user**, I want to assign multiple tags to a single todo so that it can belong to multiple categories.
3. **As a user**, I want to see color-coded tag pills on my todos so that I can visually identify categories at a glance.
4. **As a user**, I want to filter todos by tag so that I can focus on tasks from a specific category.
5. **As a user**, I want to edit tag names and colors so that I can refine my organization system over time.
6. **As a user**, I want to delete tags I no longer need so that my tag list stays manageable.
7. **As a user**, I want to select/deselect tags when creating or editing a todo so that I can easily manage categorization.

---

## User Flow

### Creating a Tag
1. User clicks **"+ Manage Tags"** button (near todo form area)
2. Tag management modal opens
3. User enters tag name in text input field
4. User selects a color via color picker or enters a hex code (default: `#3B82F6` blue)
5. User clicks **"Create Tag"**
6. Tag appears in the tag list within the modal
7. Tag also becomes available for selection on todo forms

### Assigning Tags to a Todo (Creating)
1. Below the todo form, available tags display as pill buttons
2. User clicks a tag pill to select it (pill fills with tag color, shows ✓ checkmark, white text)
3. User can select multiple tags
4. Unselected tags show gray border, no checkmark
5. When user clicks **"Add"** to create the todo, selected tags are associated

### Assigning Tags to a Todo (Editing)
1. User clicks **"Edit"** on a todo
2. Edit modal shows tag selection area with all available tags
3. Currently assigned tags are pre-selected (filled color, ✓)
4. User toggles tags on/off by clicking pills
5. User clicks **"Update"** to save changes

### Editing a Tag
1. User opens tag management modal
2. User clicks **"Edit"** button next to a tag
3. Tag name and color fields become editable
4. User modifies name and/or color
5. User clicks **"Update"** to save
6. Changes reflect on all todos using that tag

### Deleting a Tag
1. User opens tag management modal
2. User clicks **"Delete"** button next to a tag
3. Tag is removed from the system
4. Tag associations CASCADE deleted from all todos (junction table rows removed)
5. Affected todos remain but without that tag

### Filtering by Tag
1. User uses **"All Tags"** dropdown in the filter section
2. User selects a specific tag
3. Only todos associated with that tag are displayed
4. User selects **"All Tags"** to clear the tag filter
5. Tag filter combines with other active filters (search, priority, date range) using AND logic

---

## Technical Requirements

### Database Schema

```sql
-- Tags table
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, name)  -- No duplicate tag names per user
);

-- Junction table for many-to-many relationship
CREATE TABLE todo_tags (
  todo_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (todo_id, tag_id),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

**Key points:**
- `UNIQUE(user_id, name)` prevents duplicate tag names per user
- `todo_tags` junction table enables many-to-many relationship
- Both foreign keys have `ON DELETE CASCADE` for automatic cleanup

### TypeScript Interfaces

```typescript
interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

// Extended Todo with tags for API responses
interface TodoWithTags extends Todo {
  tags: Tag[];
}
```

### API Endpoints

#### `GET /api/tags`
- **Auth**: Required (session cookie)
- **Response**: `200 OK` → `Tag[]`
- **Behavior**: Returns all tags for `session.userId`

#### `POST /api/tags`
- **Auth**: Required
- **Body**:
  ```json
  {
    "name": "string (required, non-empty)",
    "color": "string (hex color, default: '#3B82F6')"
  }
  ```
- **Response**: `201 Created` → `Tag`
- **Validation**:
  - Name must not be empty or whitespace-only
  - Name must be unique per user (case-sensitive)
  - Color must be valid hex format

#### `PUT /api/tags/[id]`
- **Auth**: Required
- **Params**: `id` (tag ID) — `const { id } = await params;` (Next.js 16 async params)
- **Body**:
  ```json
  {
    "name": "string (optional)",
    "color": "string (optional)"
  }
  ```
- **Response**: `200 OK` → `Tag`
- **Behavior**: Updates tag name and/or color; verifies tag belongs to `session.userId`

#### `DELETE /api/tags/[id]`
- **Auth**: Required
- **Params**: `id` (tag ID) — async params
- **Response**: `200 OK` → `{ message: 'Tag deleted' }`
- **Behavior**: Deletes tag and CASCADE removes all `todo_tags` associations

#### `POST /api/todos/[id]/tags`
- **Auth**: Required
- **Params**: `id` (todo ID) — async params
- **Body**:
  ```json
  {
    "tagIds": [1, 2, 3]
  }
  ```
- **Response**: `200 OK` → `Tag[]`
- **Behavior**: Replaces all tag associations for the todo (delete existing, insert new)

### Database Operations (lib/db.ts)

```typescript
// All operations are SYNCHRONOUS (better-sqlite3)
const tagDB = {
  getAll(userId: number): Tag[],
  getById(id: number, userId: number): Tag | undefined,
  create(userId: number, name: string, color: string): Tag,
  update(id: number, userId: number, updates: Partial<Tag>): Tag,
  delete(id: number, userId: number): void,
  getByTodoId(todoId: number): Tag[],
  setTodoTags(todoId: number, tagIds: number[]): void,
};
```

---

## UI Components

### Tag Management Modal
- **Trigger**: "+" Manage Tags" button near the todo form
- **Content**:
  - **Create section**: Tag name input, color picker, hex input, "Create Tag" button
  - **Tag list**: Each tag shows colored preview, name, "Edit" button, "Delete" button
- **Default color**: `#3B82F6` (blue)
- **Color picker**: Standard HTML `<input type="color">` with hex text input

### Tag Selection Pills (on Todo Form)
- Displayed below the todo creation form when tags exist
- Each tag rendered as a pill button:
  - **Selected**: Filled with tag color, white text, ✓ checkmark prefix
  - **Unselected**: White/gray background, gray border, tag color text
- Multiple selection supported (click to toggle)

### Tag Selection Pills (on Edit Modal)
- Same pill style as creation form
- Pre-selected tags based on current todo associations
- Toggle on/off by clicking

### Tag Pills on Todo Items
- Small rounded pills displayed inline after priority and recurrence badges
- Tag color as background, white text for name
- Rounded full shape (`rounded-full`)
- Multiple tags wrap to next line on narrow screens

### Tag Filter Dropdown
- Located in the filter bar alongside priority filter
- Options: "All Tags" (default) + one option per user tag
- Selecting a tag filters the todo list to only show tagged items

---

## Edge Cases

1. **Duplicate tag name**: Reject creation — UNIQUE constraint on `(user_id, name)`
2. **Empty tag name**: Reject — name must not be empty or whitespace-only
3. **Invalid hex color**: Default to `#3B82F6` or reject with validation error
4. **Deleting a tag used by many todos**: CASCADE removes associations; todos remain intact
5. **No tags exist**: Tag selection area hidden on forms; tag filter dropdown hidden
6. **Editing tag name to duplicate**: Reject — uniqueness constraint applies to updates too
7. **Tag color visibility**: White text on colored background — ensure contrast for readability
8. **Dark mode colors**: Tag pill colors adapt; ensure visibility in both light and dark modes
9. **Many tags on one todo**: Pills wrap to next line; no hard limit enforced
10. **Renaming a tag**: All todos with that tag reflect the new name immediately (single source of truth in `tags` table)
11. **Filtering by deleted tag**: If active filter references a deleted tag, clear the filter

---

## Acceptance Criteria

- [ ] User can create a tag with name and color
- [ ] Tag names must be unique per user
- [ ] Tag name cannot be empty or whitespace-only
- [ ] Default tag color is `#3B82F6` (blue)
- [ ] User can edit tag name and color
- [ ] User can delete a tag (CASCADE removes associations)
- [ ] User can assign multiple tags to a todo when creating
- [ ] User can modify tag assignments when editing a todo
- [ ] Selected tag pills show filled color, ✓, and white text
- [ ] Unselected tag pills show gray border and tag color text
- [ ] Tag pills display on todo items with correct colors
- [ ] Tag filter dropdown shows all user tags
- [ ] Filtering by tag shows only matching todos
- [ ] Tag filter combines with other filters (AND logic)
- [ ] Tags are user-specific (users only see their own tags)
- [ ] Tag management modal opens and closes correctly
- [ ] Dark mode: tag pills remain readable
- [ ] All tag operations require authentication

---

## Testing Requirements

### E2E Tests (Playwright)

```typescript
// tests/06-tags.spec.ts

test('should create a tag with name and color', async ({ page }) => {
  // Open tag modal, enter name, pick color, click Create, verify tag appears
});

test('should reject duplicate tag name', async ({ page }) => {
  // Create tag "Work", try creating another "Work", verify rejection
});

test('should reject empty tag name', async ({ page }) => {
  // Try creating tag with empty name, verify no tag created
});

test('should assign tags to a todo', async ({ page }) => {
  // Create tag, create todo with tag selected, verify tag pill on todo
});

test('should assign multiple tags to a todo', async ({ page }) => {
  // Create 2 tags, select both when creating todo, verify both pills
});

test('should edit a tag', async ({ page }) => {
  // Create tag, edit name/color, verify changes on modal and todo pills
});

test('should delete a tag', async ({ page }) => {
  // Create tag, assign to todo, delete tag, verify removed from todo
});

test('should filter todos by tag', async ({ page }) => {
  // Create tags, create tagged todos, filter by tag, verify correct results
});

test('should toggle tag selection in edit modal', async ({ page }) => {
  // Create todo with tag, edit, remove tag, update, verify tag removed
});

test('should show tag pills on todo items', async ({ page }) => {
  // Create tag and todo with tag, verify colored pill visible
});
```

### Test Helpers

```typescript
// tests/helpers.ts
async createTag(page: Page, name: string, color?: string) {
  // Open tag modal, create tag with name and optional color
}
```

---

## Out of Scope

- Tag hierarchies or nesting (parent/child tags)
- Tag icons or emojis (name + color only)
- Shared tags between users
- Tag usage statistics or analytics
- Auto-suggested tags based on todo content
- Tag merging (combining two tags into one)
- Tag ordering or sorting preferences
- Bulk tag assignment to multiple todos
- Tag import/export as standalone feature

---

## Success Metrics

- Users can create, edit, and delete tags without errors
- Tag associations correctly persist across todo create/edit operations
- Tag filter accurately shows only matching todos
- CASCADE delete reliably removes tag associations when tag or todo is deleted
- Tag pills render correctly with readable contrast in both light and dark modes
- Tag operations complete in < 300ms (API response time)
- Unique constraint prevents duplicate tag names per user
