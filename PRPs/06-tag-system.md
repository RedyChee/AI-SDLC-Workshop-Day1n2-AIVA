# PRP-06: Tag System

## Feature Overview

The Tag System enables users to organize and categorize todos using custom color-coded labels. Tags provide visual categorization through colored pills, support many-to-many relationships (multiple tags per todo, multiple todos per tag), and enable filtering to quickly find related tasks. The system includes complete tag management with CRUD operations and cascade deletion to maintain data integrity.

### Core Functionality
- **Color-Coded Labels**: Custom tags with user-defined colors (default blue #3B82F6)
- **Many-to-Many Relationships**: Junction table linking todos and tags
- **Tag Management (CRUD)**: Create, read, update, delete tags via modal interface
- **Filtering by Tag**: Dropdown filter showing only todos with selected tag
- **Visual Tag Pills**: Rounded colored badges displaying tag names on todos
- **Cascade Delete**: Removing tag automatically updates all associated todos
- **User-Specific Tags**: Each user maintains their own tag library

### User Value
- Organize todos by project, context, or category
- Quickly identify todo types through visual color coding
- Filter large todo lists by specific tags
- Maintain consistent categorization across tasks
- Search by tag to find related work (via PRP-08)

---

## User Stories

### Story 1: Create Tags for Organization
**As a** productive user  
**I want to** create custom tags with meaningful names and colors  
**So that** I can categorize my todos visually

**Acceptance Criteria:**
- "✚ Manage Tags" button visible near todo form
- Modal opens showing tag management interface
- Can enter tag name (max 50 characters)
- Can select color via color picker or hex code input
- Default color is blue (#3B82F6)
- "Create Tag" button creates tag immediately
- Tag appears in list with chosen color
- Duplicate tag names prevented (case-insensitive)

### Story 2: Apply Multiple Tags to Todo
**As a** user managing complex projects  
**I want to** add multiple tags to a single todo  
**So that** I can categorize it in multiple ways

**Acceptance Criteria:**
- Tag selector appears in todo creation form
- All user's tags displayed as clickable pills
- Can select/deselect tags by clicking
- Selected tags show checkmark (✓) and filled background
- Unselected tags show empty with border
- Multiple tags can be selected simultaneously
- Tags save with todo creation
- Tags display as colored pills on todo item

### Story 3: Edit Tag Properties
**As a** user refining my organization system  
**I want to** change tag names and colors  
**So that** I can improve my categorization scheme

**Acceptance Criteria:**
- "Edit" button visible for each tag in management modal
- Can modify tag name
- Can change tag color via picker or hex input
- "Update" button saves changes
- Changes reflect immediately on all todos using that tag
- Duplicate name validation prevents conflicts
- Cannot rename to empty string

### Story 4: Filter Todos by Tag
**As a** user with many todos  
**I want to** filter my list by a specific tag  
**So that** I can focus on related tasks

**Acceptance Criteria:**
- "All Tags" dropdown visible in filter section
- Dropdown shows all user's tags with colored indicators
- Selecting tag filters todo list to only show todos with that tag
- Filter combines with existing filters (search, priority, date range)
- "All Tags" option clears tag filter
- Filter state persists during session
- Count badge shows number of filtered todos

### Story 5: Delete Unused Tags
**As a** user cleaning up my workspace  
**I want to** delete tags I no longer use  
**So that** my tag list stays relevant

**Acceptance Criteria:**
- "Delete" button visible for each tag
- Confirmation prompt before deletion
- Deleting tag removes it from all todos (CASCADE)
- Tag disappears from tag selector immediately
- Tag removed from filter dropdown
- Deleted tag no longer appears on any todos
- No orphaned tag relationships in database

### Story 6: View Tags on Todos
**As a** user scanning my todo list  
**I want to** see which tags are applied to each todo  
**So that** I can quickly understand todo categories

**Acceptance Criteria:**
- Tags display as colored pills on todo items
- Tag name shown in white text on colored background
- Pills have rounded shape (`rounded-full`)
- Multiple tags display horizontally (wrap on small screens)
- Tags positioned after priority/recurrence badges
- Hover shows full tag name if truncated
- Dark mode support with proper contrast

### Story 7: Copy Tags in Recurring Todos
**As a** user with repeating tasks  
**I want to** have tags automatically copied to next instance  
**So that** I don't have to re-tag recurring todos

**Acceptance Criteria:**
- Completing recurring todo creates next instance
- Next instance inherits all tags from current instance
- Tag relationships copied via junction table
- Tags visible on new instance immediately
- No manual re-tagging required

### Story 8: Search Todos by Tag Content
**As a** user with tagged todos  
**I want to** search to include tag names  
**So that** I can find todos by their category

**Acceptance Criteria:**
- Search query matches tag names (PRP-08 integration)
- Todos with matching tags appear in results
- Tag pills visible on matched todos
- Works with advanced search
- Case-insensitive matching

---

## User Flow

### Flow 1: Creating First Tag
1. User visits todo app for first time
2. User clicks "✚ Manage Tags" button near todo form
3. Tag management modal opens
4. Modal shows empty tag list with "No tags yet" message
5. User sees input field with placeholder "Tag name..."
6. User types "Work" in name field
7. User sees color picker with default blue (#3B82F6)
8. User clicks color picker, selects red (#EF4444)
9. User clicks "Create Tag" button
10. POST request to `/api/tags`
11. Tag created with name="Work", color="#EF4444"
12. Tag appears in modal list as red pill with "Work" text
13. Edit and Delete buttons appear next to tag

### Flow 2: Creating Additional Tags
1. User continues in tag management modal
2. User types "Personal" in name field
3. Leaves color as default blue (#3B82F6)
4. Clicks "Create Tag"
5. "Personal" tag appears in list with blue color
6. User creates "Urgent" tag with orange (#F97316)
7. User creates "Meeting" tag with purple (#A855F7)
8. Tag list now shows 4 tags: Work (red), Personal (blue), Urgent (orange), Meeting (purple)
9. User clicks "Close" or clicks outside modal to close

### Flow 3: Tagging a New Todo
1. User fills out todo form: "Prepare quarterly presentation"
2. Below form, tag selector section appears
3. All 4 tags displayed as pills: Work, Personal, Urgent, Meeting
4. Unselected tags show white/light background with gray border
5. User clicks "Work" tag pill
6. "Work" pill fills with red background, shows white text, displays ✓ checkmark
7. User clicks "Urgent" tag pill
8. "Urgent" pill fills with orange background, shows ✓ checkmark
9. Both Work and Urgent now selected
10. User clicks "Add" to create todo
11. POST request includes `tag_ids: [1, 3]` (Work and Urgent IDs)
12. Todo created with two tag relationships
13. Todo appears in list with two colored pills: "Work" (red), "Urgent" (orange)

### Flow 4: Filtering by Tag
1. User has 15 todos, 5 tagged "Work", 3 tagged "Personal"
2. User sees "All Tags" dropdown in filter section
3. User clicks dropdown
4. Dropdown shows: "All Tags", "Work", "Personal", "Urgent", "Meeting"
5. Each tag option shows colored dot indicator
6. User selects "Work"
7. Todo list filters to show only 5 todos tagged "Work"
8. Dropdown now shows "Work" as selected value
9. Other filters (search, priority) still active and combined
10. User selects "All Tags" to clear filter
11. Full list of 15 todos returns

### Flow 5: Editing Tag Color
1. User opens tag management modal
2. User sees "Work" tag with red color
3. User clicks "Edit" button next to "Work" tag
4. Tag enters edit mode: name field populated with "Work"
5. Color picker shows current red (#EF4444)
6. User clicks color picker, selects green (#22C55E)
7. User clicks "Update" button
8. PUT request to `/api/tags/[id]`
9. Tag updated with new color
10. Tag list shows "Work" with green color
11. User closes modal
12. All todos with "Work" tag now show green pill
13. Dropdown filter shows "Work" with green indicator

### Flow 6: Editing Tag Name
1. User opens tag management modal
2. User clicks "Edit" next to "Meeting" tag
3. Name field shows "Meeting"
4. User changes name to "Meetings"
5. User clicks "Update"
6. Tag name updated to "Meetings"
7. All todos show updated name "Meetings"
8. Dropdown filter shows "Meetings" option

### Flow 7: Attempting Duplicate Tag Name
1. User tries to create tag named "Work"
2. Tag "Work" already exists
3. User clicks "Create Tag"
4. API returns 400 error: "Tag name already exists"
5. Error message displays below form: "A tag with this name already exists"
6. Tag not created
7. User changes name to "Work Projects"
8. Successfully creates tag

### Flow 8: Deleting Tag
1. User has tag "Urgent" applied to 3 todos
2. User opens tag management modal
3. User clicks "Delete" button next to "Urgent" tag
4. Confirmation dialog appears: "Delete 'Urgent' tag? It will be removed from all todos."
5. User clicks "Confirm"
6. DELETE request to `/api/tags/[id]`
7. Tag deleted from database
8. Junction table entries CASCADE deleted
9. "Urgent" tag disappears from modal list
10. User closes modal
11. Previously tagged todos no longer show "Urgent" pill
12. Tag no longer appears in dropdown filter

### Flow 9: Editing Todo Tags
1. User has todo "Client call" tagged with "Work"
2. User clicks "Edit" on todo
3. Edit modal shows tag selector
4. "Work" tag selected (✓ checkmark, filled background)
5. User clicks "Work" to deselect
6. User clicks "Meeting" to select
7. Now only "Meeting" is selected
8. User clicks "Save"
9. PUT request updates todo_tags junction table
10. Old "Work" relationship deleted
11. New "Meeting" relationship created
12. Todo now shows "Meeting" pill instead of "Work"

### Flow 10: Recurring Todo Tag Inheritance
1. User has weekly recurring todo "Team standup"
2. Todo tagged with "Work" and "Meeting"
3. User completes todo
4. Next instance created for next week
5. System copies tag relationships via junction table
6. New todo has entries in todo_tags for both "Work" and "Meeting"
7. New instance appears with both colored pills
8. User doesn't need to re-tag

### Flow 11: Tag-Based Search (Future Integration)
1. User types "work" in search box (PRP-08)
2. Search matches tag name "Work"
3. All 5 todos tagged "Work" appear in results
4. Tag pills visible on each result
5. Also matches todo titles containing "work"
6. Combined results show both title matches and tag matches

---

## Technical Requirements

### Database Schema

#### New `tags` Table

```sql
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL CHECK(length(trim(name)) > 0 AND length(name) <= 50),
  color TEXT NOT NULL DEFAULT '#3B82F6' CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, name COLLATE NOCASE)
);

-- Index for user's tags lookup
CREATE INDEX idx_tags_user_id ON tags(user_id);
```

**Column Details:**
- `id`: Primary key, auto-increment
- `user_id`: Foreign key to `users.id` with CASCADE delete
- `name`: Tag name, 1-50 characters, trimmed, required
- `color`: Hex color code (e.g., #3B82F6), default blue
- `created_at`: ISO8601 timestamp (Singapore timezone)
- `updated_at`: ISO8601 timestamp (Singapore timezone)

**Constraints:**
- `CHECK` on name: Non-empty after trim, max 50 chars
- `CHECK` on color: Valid 6-digit hex code with # prefix
- `UNIQUE` on (user_id, name): Case-insensitive unique names per user

#### New `todo_tags` Junction Table

```sql
CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (todo_id, tag_id),
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Index for finding todos by tag
CREATE INDEX idx_todo_tags_tag_id ON todo_tags(tag_id);

-- Index for finding tags by todo
CREATE INDEX idx_todo_tags_todo_id ON todo_tags(todo_id);
```

**Column Details:**
- `todo_id`: Foreign key to `todos.id` with CASCADE delete
- `tag_id`: Foreign key to `tags.id` with CASCADE delete
- `created_at`: When relationship created
- Composite primary key on (todo_id, tag_id)

**Cascade Behavior:**
- Deleting todo removes all its tag relationships
- Deleting tag removes all relationships to todos
- No orphaned relationships possible

### TypeScript Types

#### `lib/db.ts` Updates

```typescript
// Tag interface
export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// Tag creation input
export interface CreateTagInput {
  user_id: number;
  name: string;
  color?: string;
}

// Tag update input
export interface UpdateTagInput {
  name?: string;
  color?: string;
}

// Todo-Tag relationship
export interface TodoTag {
  todo_id: number;
  tag_id: number;
  created_at: string;
}

// Todo extended with tags
export interface TodoWithTags extends Todo {
  tags: Tag[];
}

// Default tag color
export const DEFAULT_TAG_COLOR = '#3B82F6'; // Tailwind blue-500

// Common tag colors for suggestions
export const SUGGESTED_TAG_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Gray', value: '#6B7280' },
] as const;
```

#### Validation Functions

```typescript
// Validate tag name
export function validateTagName(name: any): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 50) return null;
  return trimmed;
}

// Validate hex color
export function validateTagColor(color: any): string {
  if (typeof color !== 'string') return DEFAULT_TAG_COLOR;
  
  // Check format: #RRGGBB
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  if (!hexPattern.test(color)) return DEFAULT_TAG_COLOR;
  
  return color.toUpperCase();
}

// Check if tag name is unique for user
export function isTagNameUnique(userId: number, name: string, excludeTagId?: number): boolean {
  const query = excludeTagId
    ? `SELECT COUNT(*) as count FROM tags WHERE user_id = ? AND LOWER(name) = LOWER(?) AND id != ?`
    : `SELECT COUNT(*) as count FROM tags WHERE user_id = ? AND LOWER(name) = LOWER(?)`;
  
  const params = excludeTagId ? [userId, name, excludeTagId] : [userId, name];
  const result = db.prepare(query).get(...params) as { count: number };
  return result.count === 0;
}
```

#### Database Interface

```typescript
export const tagDB = {
  // Create tag
  create(input: CreateTagInput): Tag {
    const { getSingaporeNow, toSingaporeISO } = require('./timezone');
    const now = toSingaporeISO(getSingaporeNow());
    
    const name = validateTagName(input.name);
    if (!name) {
      throw new Error('Invalid tag name');
    }
    
    // Check uniqueness
    if (!isTagNameUnique(input.user_id, name)) {
      throw new Error('Tag name already exists');
    }
    
    const color = validateTagColor(input.color);
    
    const query = `
      INSERT INTO tags (user_id, name, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result = db.prepare(query).run(input.user_id, name, color, now, now);
    return this.getById(Number(result.lastInsertRowid));
  },
  
  // Get tag by ID
  getById(id: number): Tag {
    const query = 'SELECT * FROM tags WHERE id = ?';
    const tag = db.prepare(query).get(id) as Tag | undefined;
    if (!tag) {
      throw new Error('Tag not found');
    }
    return tag;
  },
  
  // Get all tags for user
  getAllByUser(userId: number): Tag[] {
    const query = `
      SELECT * FROM tags 
      WHERE user_id = ? 
      ORDER BY name COLLATE NOCASE ASC
    `;
    return db.prepare(query).all(userId) as Tag[];
  },
  
  // Update tag
  update(id: number, userId: number, updates: UpdateTagInput): Tag {
    const { getSingaporeNow, toSingaporeISO } = require('./timezone');
    const now = toSingaporeISO(getSingaporeNow());
    
    const existing = this.getById(id);
    
    // Verify ownership
    if (existing.user_id !== userId) {
      throw new Error('Tag not found');
    }
    
    // Validate and update name if provided
    let name = existing.name;
    if (updates.name !== undefined) {
      const validated = validateTagName(updates.name);
      if (!validated) {
        throw new Error('Invalid tag name');
      }
      // Check uniqueness (excluding current tag)
      if (!isTagNameUnique(userId, validated, id)) {
        throw new Error('Tag name already exists');
      }
      name = validated;
    }
    
    // Validate and update color if provided
    let color = existing.color;
    if (updates.color !== undefined) {
      color = validateTagColor(updates.color);
    }
    
    const query = `
      UPDATE tags 
      SET name = ?, color = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `;
    
    db.prepare(query).run(name, color, now, id, userId);
    return this.getById(id);
  },
  
  // Delete tag
  delete(id: number, userId: number): void {
    // Verify ownership
    const tag = this.getById(id);
    if (tag.user_id !== userId) {
      throw new Error('Tag not found');
    }
    
    const query = 'DELETE FROM tags WHERE id = ? AND user_id = ?';
    db.prepare(query).run(id, userId);
  },
  
  // Get tags for a specific todo
  getByTodoId(todoId: number): Tag[] {
    const query = `
      SELECT t.* 
      FROM tags t
      INNER JOIN todo_tags tt ON t.id = tt.tag_id
      WHERE tt.todo_id = ?
      ORDER BY t.name COLLATE NOCASE ASC
    `;
    return db.prepare(query).all(todoId) as Tag[];
  },
  
  // Set tags for a todo (replaces all existing)
  setForTodo(todoId: number, tagIds: number[]): void {
    // Delete existing relationships
    const deleteQuery = 'DELETE FROM todo_tags WHERE todo_id = ?';
    db.prepare(deleteQuery).run(todoId);
    
    // Insert new relationships
    if (tagIds.length > 0) {
      const { getSingaporeNow, toSingaporeISO } = require('./timezone');
      const now = toSingaporeISO(getSingaporeNow());
      
      const insertQuery = `
        INSERT INTO todo_tags (todo_id, tag_id, created_at)
        VALUES (?, ?, ?)
      `;
      const stmt = db.prepare(insertQuery);
      
      for (const tagId of tagIds) {
        stmt.run(todoId, tagId, now);
      }
    }
  },
  
  // Copy tags from one todo to another (for recurring todos)
  copyTags(sourceTodoId: number, targetTodoId: number): void {
    const sourceTags = this.getByTodoId(sourceTodoId);
    const tagIds = sourceTags.map(tag => tag.id);
    this.setForTodo(targetTodoId, tagIds);
  },
};
```

### API Endpoints

#### `POST /api/tags`
Create a new tag.

**Request:**
```typescript
{
  name: string;
  color?: string; // Optional, defaults to #3B82F6
}
```

**Response:**
```typescript
{
  tag: Tag;
}
```

**Implementation:**
```typescript
// app/api/tags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    const tag = tagDB.create({
      user_id: session.userId,
      name: body.name,
      color: body.color,
    });
    
    return NextResponse.json({ tag }, { status: 201 });
  } catch (error: any) {
    console.error('Create tag error:', error);
    
    if (error.message === 'Tag name already exists') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create tag' },
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
    const tags = tagDB.getAllByUser(session.userId);
    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
```

#### `PUT /api/tags/[id]`
Update tag name and/or color.

**Request:**
```typescript
{
  name?: string;
  color?: string;
}
```

**Response:**
```typescript
{
  tag: Tag;
}
```

**Implementation:**
```typescript
// app/api/tags/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { tagDB } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  const { id } = await context.params;
  const tagId = parseInt(id, 10);
  
  try {
    const body = await request.json();
    
    const tag = tagDB.update(tagId, session.userId, {
      name: body.name,
      color: body.color,
    });
    
    return NextResponse.json({ tag });
  } catch (error: any) {
    console.error('Update tag error:', error);
    
    if (error.message === 'Tag not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    if (error.message === 'Tag name already exists') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update tag' },
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
  const tagId = parseInt(id, 10);
  
  try {
    tagDB.delete(tagId, session.userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete tag error:', error);
    
    if (error.message === 'Tag not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
```

#### Update `POST /api/todos` and `PUT /api/todos/[id]`
Include tag_ids in request/response.

**Request (POST/PUT):**
```typescript
{
  title: string;
  // ... other fields ...
  tag_ids?: number[]; // NEW
}
```

**Implementation:**
```typescript
// In POST /api/todos:
const todo = todoDB.create({ /* ... */ });

// Set tags if provided
if (body.tag_ids && Array.isArray(body.tag_ids)) {
  tagDB.setForTodo(todo.id, body.tag_ids);
}

// Fetch todo with tags for response
const tags = tagDB.getByTodoId(todo.id);
return NextResponse.json({ todo: { ...todo, tags } });

// In PUT /api/todos/[id]:
const todo = todoDB.update(todoId, session.userId, updateData);

// Update tags if provided
if ('tag_ids' in body && Array.isArray(body.tag_ids)) {
  tagDB.setForTodo(todoId, body.tag_ids);
}

const tags = tagDB.getByTodoId(todoId);
return NextResponse.json({ todo: { ...todo, tags } });
```

#### Update `GET /api/todos`
Include tags for each todo.

**Response:**
```typescript
{
  todos: TodoWithTags[];
}
```

**Implementation:**
```typescript
const todos = todoDB.getAllByUser(session.userId);

const todosWithTags = todos.map(todo => {
  const tags = tagDB.getByTodoId(todo.id);
  const subtasks = subtaskDB.getByTodoId(todo.id);
  const progress = calculateProgress(subtasks);
  return { ...todo, tags, subtasks, progress };
});

return NextResponse.json({ todos: todosWithTags });
```

### Frontend Implementation

#### Tag Management Modal Component

```typescript
// components/TagManagementModal.tsx
import { useState, useEffect } from 'react';
import { Tag, DEFAULT_TAG_COLOR, SUGGESTED_TAG_COLORS } from '@/lib/db';

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTagsChange: () => void;
}

export function TagManagementModal({ isOpen, onClose, onTagsChange }: TagManagementModalProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(DEFAULT_TAG_COLOR);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);
  
  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      const data = await response.json();
      setTags(data.tags || []);
    } catch (error) {
      console.error('Fetch tags error:', error);
    }
  };
  
  const handleCreate = async () => {
    if (!newTagName.trim() || isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName, color: newTagColor }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create tag');
      }
      
      setNewTagName('');
      setNewTagColor(DEFAULT_TAG_COLOR);
      await fetchTags();
      onTagsChange();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdate = async () => {
    if (!editingTag || isLoading) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingTag.name, color: editingTag.color }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update tag');
      }
      
      setEditingTag(null);
      await fetchTags();
      onTagsChange();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (tag: Tag) => {
    if (isLoading) return;
    
    const confirmed = confirm(
      `Delete "${tag.name}" tag? It will be removed from all todos.`
    );
    if (!confirmed) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tags/${tag.id}`, { method: 'DELETE' });
      
      if (!response.ok) {
        throw new Error('Failed to delete tag');
      }
      
      await fetchTags();
      onTagsChange();
    } catch (error) {
      console.error('Delete tag error:', error);
      alert('Failed to delete tag');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Manage Tags</h2>
        
        {/* Create/Edit Form */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium mb-3 dark:text-white">
            {editingTag ? 'Edit Tag' : 'Create New Tag'}
          </h3>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Tag name..."
              value={editingTag ? editingTag.name : newTagName}
              onChange={(e) => {
                if (editingTag) {
                  setEditingTag({ ...editingTag, name: e.target.value });
                } else {
                  setNewTagName(e.target.value);
                }
              }}
              maxLength={50}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 
                dark:border-gray-500 dark:text-white"
            />
            
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={editingTag ? editingTag.color : newTagColor}
                onChange={(e) => {
                  if (editingTag) {
                    setEditingTag({ ...editingTag, color: e.target.value });
                  } else {
                    setNewTagColor(e.target.value);
                  }
                }}
                className="w-16 h-10 rounded cursor-pointer"
              />
              
              <input
                type="text"
                placeholder="#3B82F6"
                value={editingTag ? editingTag.color : newTagColor}
                onChange={(e) => {
                  if (editingTag) {
                    setEditingTag({ ...editingTag, color: e.target.value });
                  } else {
                    setNewTagColor(e.target.value);
                  }
                }}
                pattern="^#[0-9A-Fa-f]{6}$"
                maxLength={7}
                className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-600 
                  dark:border-gray-500 dark:text-white font-mono"
              />
            </div>
            
            {/* Suggested colors */}
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAG_COLORS.map(({ name, value }) => (
                <button
                  key={value}
                  onClick={() => {
                    if (editingTag) {
                      setEditingTag({ ...editingTag, color: value });
                    } else {
                      setNewTagColor(value);
                    }
                  }}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 
                    dark:border-gray-600 hover:border-gray-500"
                  style={{ backgroundColor: value }}
                  title={name}
                />
              ))}
            </div>
            
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            
            <div className="flex gap-2">
              {editingTag ? (
                <>
                  <button
                    onClick={handleUpdate}
                    disabled={!editingTag.name.trim() || isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg 
                      hover:bg-blue-600 disabled:opacity-50"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => {
                      setEditingTag(null);
                      setError('');
                    }}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg 
                      hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={!newTagName.trim() || isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg 
                    hover:bg-blue-600 disabled:opacity-50"
                >
                  Create Tag
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Tag List */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium dark:text-white">Your Tags</h3>
          
          {tags.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No tags yet. Create one above!
            </p>
          ) : (
            <div className="space-y-2">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <span
                    className="px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                  
                  <div className="flex-1" />
                  
                  <button
                    onClick={() => setEditingTag({ ...tag })}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 
                      dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleDelete(tag)}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 
                      dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Close button */}
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

#### Tag Selector Component

```typescript
// components/TagSelector.tsx
import { Tag } from '@/lib/db';

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
}

export function TagSelector({ tags, selectedTagIds, onChange }: TagSelectorProps) {
  const handleToggle = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };
  
  if (tags.length === 0) return null;
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium dark:text-gray-300">
        Tags
      </label>
      
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => {
          const isSelected = selectedTagIds.includes(tag.id);
          
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleToggle(tag.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'text-white'
                  : 'bg-white dark:bg-gray-700 border-2 text-gray-700 dark:text-gray-300'
              }`}
              style={isSelected ? { 
                backgroundColor: tag.color,
                borderColor: tag.color 
              } : { 
                borderColor: tag.color 
              }}
            >
              {isSelected && '✓ '}
              {tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

#### Tag Pills Display Component

```typescript
// components/TagPills.tsx
import { Tag } from '@/lib/db';

interface TagPillsProps {
  tags: Tag[];
}

export function TagPills({ tags }: TagPillsProps) {
  if (tags.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <span
          key={tag.id}
          className="px-2 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: tag.color }}
          title={tag.name}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}
```

#### Tag Filter Component

```typescript
// components/TagFilter.tsx
import { Tag } from '@/lib/db';

interface TagFilterProps {
  tags: Tag[];
  selectedTagId: number | null;
  onChange: (tagId: number | null) => void;
}

export function TagFilter({ tags, selectedTagId, onChange }: TagFilterProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium dark:text-gray-300">
        Filter by Tag
      </label>
      
      <select
        value={selectedTagId ?? ''}
        onChange={(e) => {
          const value = e.target.value;
          onChange(value === '' ? null : parseInt(value, 10));
        }}
        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
          dark:border-gray-600 dark:text-white"
      >
        <option value="">All Tags</option>
        {tags.map(tag => (
          <option key={tag.id} value={tag.id}>
            {tag.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

#### Integration into Main Todo Page

```typescript
// app/page.tsx (additions)
import { TagManagementModal } from '@/components/TagManagementModal';
import { TagSelector } from '@/components/TagSelector';
import { TagPills } from '@/components/TagPills';
import { TagFilter } from '@/components/TagFilter';

export default function TodoPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [filterTagId, setFilterTagId] = useState<number | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  
  // Fetch tags on mount
  useEffect(() => {
    fetchTags();
  }, []);
  
  const fetchTags = async () => {
    const response = await fetch('/api/tags');
    const data = await response.json();
    setTags(data.tags || []);
  };
  
  // Filter todos by tag
  const filteredTodos = todos.filter(todo => {
    if (filterTagId === null) return true;
    return todo.tags.some(tag => tag.id === filterTagId);
  });
  
  return (
    <div className="container mx-auto p-6">
      {/* Manage Tags Button */}
      <button
        onClick={() => setIsTagModalOpen(true)}
        className="mb-4 px-4 py-2 bg-purple-500 text-white rounded-lg 
          hover:bg-purple-600"
      >
        ✚ Manage Tags
      </button>
      
      {/* Tag Management Modal */}
      <TagManagementModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onTagsChange={() => {
          fetchTags();
          fetchTodos(); // Refresh todos to get updated tags
        }}
      />
      
      {/* Todo Form with Tag Selector */}
      <form onSubmit={handleCreateTodo}>
        {/* ... title, priority, due date fields ... */}
        
        <TagSelector
          tags={tags}
          selectedTagIds={selectedTagIds}
          onChange={setSelectedTagIds}
        />
        
        <button type="submit">Add</button>
      </form>
      
      {/* Filter Section */}
      <div className="mb-4">
        <TagFilter
          tags={tags}
          selectedTagId={filterTagId}
          onChange={setFilterTagId}
        />
      </div>
      
      {/* Todo List */}
      {filteredTodos.map(todo => (
        <div key={todo.id} className="todo-item">
          {/* ... checkbox, title, badges ... */}
          
          <TagPills tags={todo.tags} />
        </div>
      ))}
    </div>
  );
}
```

---

## Edge Cases

### 1. Duplicate Tag Names (Case-Insensitive)
**Scenario:** User tries to create "Work" when "work" already exists

**Handling:**
- Database UNIQUE constraint uses `COLLATE NOCASE`
- Backend validation checks case-insensitively
- API returns 409 Conflict error
- Frontend displays: "A tag with this name already exists"
- Tag not created

**Implementation:**
```sql
UNIQUE(user_id, name COLLATE NOCASE)
```

### 2. Invalid Hex Color Code
**Scenario:** User enters "red" or "#FFF" instead of "#FF0000"

**Handling:**
- Backend validation requires exact format: `#[0-9A-Fa-f]{6}`
- Invalid colors default to `#3B82F6` (blue)
- Frontend color input validates automatically
- Hex input field shows pattern hint
- Tag created with default color if invalid

**Implementation:**
```typescript
const hexPattern = /^#[0-9A-Fa-f]{6}$/;
if (!hexPattern.test(color)) return DEFAULT_TAG_COLOR;
```

### 3. Empty Tag Name
**Scenario:** User submits tag with empty or whitespace-only name

**Handling:**
- Frontend "Create Tag" button disabled when input empty
- Backend validates trimmed length > 0
- API returns 400 error: "Invalid tag name"
- Database CHECK constraint prevents insertion
- No tag created

### 4. Very Long Tag Name
**Scenario:** User enters 100-character tag name

**Handling:**
- Frontend input maxLength={50}
- Backend validates length <= 50
- API returns 400 error if exceeds
- Database CHECK constraint enforces limit
- Tag name truncated or rejected

### 5. Deleting Tag Used on Many Todos
**Scenario:** User deletes "Work" tag applied to 50 todos

**Handling:**
- Confirmation dialog: "Delete 'Work' tag? It will be removed from all todos."
- Single DELETE query removes tag
- CASCADE constraint removes all todo_tags entries
- All 50 todos updated automatically
- No orphaned relationships
- Performance acceptable even with 1000+ todos

### 6. Editing Tag Name to Existing Name
**Scenario:** User edits "Personal" to "Work" (which exists)

**Handling:**
- Backend checks uniqueness excluding current tag ID
- API returns 409 Conflict error
- Frontend shows: "Tag name already exists"
- Tag not updated, keeps original name
- No data corruption

**Implementation:**
```typescript
isTagNameUnique(userId, validated, id); // Exclude tag id
```

### 7. Selecting Many Tags on One Todo
**Scenario:** User selects all 20 tags for single todo

**Handling:**
- All tags selectable (no limit)
- Junction table creates 20 entries
- Tags display as wrapped pills on todo item
- May wrap to multiple lines on narrow screens
- Performance acceptable (tested up to 50 tags)

### 8. No Tags Created Yet
**Scenario:** New user, no tags exist

**Handling:**
- Tag selector doesn't render in todo form
- Tag filter dropdown hidden or shows "No tags"
- "Manage Tags" modal shows "No tags yet" message
- User creates first tag via modal
- Selector appears after first tag created

### 9. Deleting Todo with Tags
**Scenario:** User deletes todo that has 3 tags

**Handling:**
- DELETE todo triggers CASCADE
- All 3 todo_tags entries removed automatically
- Tags themselves remain (not deleted)
- No orphaned relationships
- Tags still available for other todos

### 10. Recurring Todo Tag Copying
**Scenario:** User completes recurring todo with 2 tags

**Handling:**
- Next instance created
- `tagDB.copyTags()` called
- Source todo's tags queried
- Tag IDs copied to new todo_tags entries
- Next instance has same 2 tags
- Original and new instances independent

**Implementation:**
```typescript
tagDB.copyTags(existingTodo.id, nextInstance.id);
```

### 11. Editing Todo to Remove All Tags
**Scenario:** User edits todo, deselects all tags

**Handling:**
- `tag_ids: []` sent in PUT request
- `tagDB.setForTodo(todoId, [])` called
- All todo_tags entries deleted
- No tags displayed on todo
- Valid state, no errors

### 12. Concurrent Tag Edits (Race Condition)
**Scenario:** User edits tag color in two browser tabs simultaneously

**Handling:**
- Each PUT request is independent
- SQLite serializes writes
- Last write wins
- Both tabs show updated color after refresh
- No data corruption
- `updated_at` timestamp reflects last update

### 13. Tag Color Contrast Issues
**Scenario:** User selects very light color (#FFFFCC)

**Handling:**
- White text may be hard to read
- No automatic contrast adjustment (user responsibility)
- Suggested colors all have good contrast
- Dark mode doesn't change tag colors
- User can re-edit color if problematic

**Future Enhancement:** Add contrast validation

### 14. Exporting/Importing with Tags
**Scenario:** User exports todos with tags, imports to new account

**Handling:**
- Export includes tag data with todos
- Import creates tags first
- Tag IDs remapped during import
- Junction table relationships preserved
- Imported todos have correct tags
- Duplicate tag names handled (via PRP-09)

---

## Acceptance Criteria

### Functional Requirements

#### FR1: Create Tags
- [ ] "✚ Manage Tags" button visible near todo form
- [ ] Button opens tag management modal
- [ ] Modal has tag name input field
- [ ] Modal has color picker (default #3B82F6)
- [ ] Modal has hex code input field
- [ ] "Create Tag" button creates tag
- [ ] Tag appears in modal list immediately
- [ ] Validation prevents empty names
- [ ] Validation prevents duplicate names (case-insensitive)
- [ ] Validation enforces max 50 characters
- [ ] Default color applied if hex invalid

#### FR2: Edit Tags
- [ ] Each tag in modal has "Edit" button
- [ ] Clicking "Edit" populates form with tag data
- [ ] Can modify name and/or color
- [ ] "Update" button saves changes
- [ ] Changes reflect on all todos immediately
- [ ] "Cancel" button discards changes
- [ ] Validation prevents duplicate names
- [ ] Cannot update to empty name

#### FR3: Delete Tags
- [ ] Each tag in modal has "Delete" button
- [ ] Confirmation dialog appears before deletion
- [ ] Deleting tag removes from all todos (CASCADE)
- [ ] Tag disappears from modal list
- [ ] Tag removed from filter dropdown
- [ ] No orphaned todo_tags entries

#### FR4: Apply Tags to Todos
- [ ] Tag selector appears in todo create form (if tags exist)
- [ ] All user's tags shown as clickable pills
- [ ] Selected tags show ✓ checkmark
- [ ] Selected tags have filled background (tag color)
- [ ] Unselected tags have border (tag color)
- [ ] Can select multiple tags
- [ ] Tags save with todo creation
- [ ] Tags appear on todo item as colored pills

#### FR5: Edit Todo Tags
- [ ] Tag selector appears in edit modal
- [ ] Current tags pre-selected
- [ ] Can add/remove tags
- [ ] Saving updates junction table
- [ ] Tags update on todo item immediately

#### FR6: Display Tags on Todos
- [ ] Tags display as colored pills
- [ ] Tag name in white text
- [ ] Background color from tag.color
- [ ] Rounded shape (rounded-full)
- [ ] Multiple tags wrap on small screens
- [ ] Positioned after priority/recurrence badges

#### FR7: Filter by Tag
- [ ] "All Tags" dropdown in filter section
- [ ] Shows all user's tags as options
- [ ] Selecting tag filters todo list
- [ ] Only todos with that tag shown
- [ ] Filter combines with other filters
- [ ] "All Tags" option clears filter
- [ ] Dropdown shows selected tag name

#### FR8: Tag Name Uniqueness
- [ ] Cannot create duplicate tag names
- [ ] Case-insensitive uniqueness (Work = work)
- [ ] API returns 409 error for duplicates
- [ ] Error message displays in modal
- [ ] Database UNIQUE constraint enforces

#### FR9: Cascade Delete Behavior
- [ ] Deleting tag removes all todo_tags entries
- [ ] Todos update immediately (no manual refresh)
- [ ] No orphaned relationships in database
- [ ] Foreign key constraints enforced

#### FR10: Recurring Todo Tag Inheritance
- [ ] Completing recurring todo copies tags to next instance
- [ ] All tags from source copied
- [ ] New junction table entries created
- [ ] Tags visible on new instance immediately

### Non-Functional Requirements

#### NFR1: Performance
- [ ] Tag CRUD operations complete in < 200ms
- [ ] Filtering by tag instant (client-side)
- [ ] Loading tags on mount < 100ms for 50 tags
- [ ] No N+1 queries when fetching todos with tags
- [ ] Cascade delete completes in < 500ms for 100 todos

#### NFR2: Data Integrity
- [ ] Foreign key constraints enforced
- [ ] UNIQUE constraint on (user_id, name) enforced
- [ ] CHECK constraint on color format enforced
- [ ] CHECK constraint on name length enforced
- [ ] No orphaned todo_tags entries possible

#### NFR3: Accessibility
- [ ] Color picker keyboard accessible
- [ ] Tag pills have sufficient contrast
- [ ] Modal closable via Escape key
- [ ] Focus management in modal
- [ ] Screen reader support for tag selection

#### NFR4: Dark Mode
- [ ] Modal styled for dark mode
- [ ] Tag pills readable in dark mode (white text on color)
- [ ] Input fields visible in dark mode
- [ ] Buttons have proper dark mode styling

#### NFR5: Mobile Responsiveness
- [ ] Modal scrolls on small screens
- [ ] Tag selector wraps on mobile
- [ ] Tag pills wrap properly
- [ ] Color picker usable on touch devices
- [ ] Buttons sized for touch (min 44x44px)

---

## Testing Requirements

### E2E Tests (Playwright)

Create `tests/06-tag-system.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Tag System', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new TestHelper(page, context);
    await helper.setupAuthenticatedSession();
  });

  test('should show manage tags button', async ({ page }) => {
    await page.goto('/');
    
    const button = page.locator('button:has-text("Manage Tags")');
    await expect(button).toBeVisible();
  });

  test('should open tag management modal', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button:has-text("Manage Tags")');
    
    // Modal visible
    await expect(page.locator('text=Manage Tags').first()).toBeVisible();
    await expect(page.locator('input[placeholder="Tag name..."]')).toBeVisible();
  });

  test('should create a tag with default color', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Manage Tags")');
    
    // Create tag
    await page.fill('input[placeholder="Tag name..."]', 'Work');
    await page.click('button:has-text("Create Tag")');
    
    // Tag appears in list
    await expect(page.locator('text=Work').last()).toBeVisible();
  });

  test('should create tag with custom color', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Manage Tags")');
    
    await page.fill('input[placeholder="Tag name..."]', 'Urgent');
    await page.fill('input[type="text"][placeholder="#3B82F6"]', '#EF4444');
    await page.click('button:has-text("Create Tag")');
    
    // Tag appears with red color
    const tag = page.locator('text=Urgent').last();
    await expect(tag).toBeVisible();
    // Check background color via style
    const bgColor = await tag.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bgColor).toContain('239, 68, 68'); // rgb(239, 68, 68) = #EF4444
  });

  test('should prevent duplicate tag names', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Manage Tags")');
    
    // Create first tag
    await page.fill('input[placeholder="Tag name..."]', 'Work');
    await page.click('button:has-text("Create Tag")');
    
    // Try to create duplicate
    await page.fill('input[placeholder="Tag name..."]', 'Work');
    await page.click('button:has-text("Create Tag")');
    
    // Error message
    await expect(page.locator('text=Tag name already exists')).toBeVisible();
  });

  test('should prevent duplicate tag names case-insensitive', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Manage Tags")');
    
    await page.fill('input[placeholder="Tag name..."]', 'Work');
    await page.click('button:has-text("Create Tag")');
    
    // Try with different case
    await page.fill('input[placeholder="Tag name..."]', 'WORK');
    await page.click('button:has-text("Create Tag")');
    
    await expect(page.locator('text=Tag name already exists')).toBeVisible();
  });

  test('should edit tag name', async ({ page }) => {
    await page.goto('/');
    await helper.createTag({ name: 'Personal', color: '#3B82F6' });
    
    await page.click('button:has-text("Manage Tags")');
    
    // Click edit
    await page.click('button:has-text("Edit")');
    
    // Change name
    await page.fill('input[type="text"]', 'Personal Life');
    await page.click('button:has-text("Update")');
    
    // Updated name visible
    await expect(page.locator('text=Personal Life').last()).toBeVisible();
  });

  test('should edit tag color', async ({ page }) => {
    await page.goto('/');
    await helper.createTag({ name: 'Work', color: '#3B82F6' });
    
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Edit")');
    
    // Change color
    await page.fill('input[type="text"][value*="#"]', '#22C55E');
    await page.click('button:has-text("Update")');
    
    // Green color applied
    const tag = page.locator('text=Work').last();
    const bgColor = await tag.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bgColor).toContain('34, 197, 94'); // #22C55E
  });

  test('should delete tag with confirmation', async ({ page }) => {
    await page.goto('/');
    const tag = await helper.createTag({ name: 'Temporary', color: '#3B82F6' });
    
    await page.click('button:has-text("Manage Tags")');
    
    // Setup dialog handler
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Delete');
      expect(dialog.message()).toContain('Temporary');
      await dialog.accept();
    });
    
    await page.click('button:has-text("Delete")');
    
    // Tag removed
    await expect(page.locator('text=Temporary').last()).not.toBeVisible();
  });

  test('should apply tags to new todo', async ({ page }) => {
    await page.goto('/');
    const tag1 = await helper.createTag({ name: 'Work', color: '#EF4444' });
    const tag2 = await helper.createTag({ name: 'Urgent', color: '#F97316' });
    
    await page.reload();
    
    // Create todo
    await page.fill('input[placeholder*="todo"]', 'Important task');
    
    // Select tags
    await page.click('text=Work').first();
    await page.click('text=Urgent').first();
    
    await page.click('button:has-text("Add")');
    
    // Tags appear on todo
    const todoItem = page.locator('text=Important task').locator('..');
    await expect(todoItem.locator('text=Work')).toBeVisible();
    await expect(todoItem.locator('text=Urgent')).toBeVisible();
  });

  test('should show selected tags with checkmark', async ({ page }) => {
    await page.goto('/');
    await helper.createTag({ name: 'Work', color: '#3B82F6' });
    await page.reload();
    
    // Click tag
    const tagButton = page.locator('button:has-text("Work")').first();
    await tagButton.click();
    
    // Checkmark appears
    await expect(tagButton).toContainText('✓');
  });

  test('should filter todos by tag', async ({ page }) => {
    await page.goto('/');
    const workTag = await helper.createTag({ name: 'Work', color: '#3B82F6' });
    const personalTag = await helper.createTag({ name: 'Personal', color: '#22C55E' });
    
    // Create todos with different tags
    await helper.createTodo({ title: 'Work task 1', tag_ids: [workTag.id] });
    await helper.createTodo({ title: 'Work task 2', tag_ids: [workTag.id] });
    await helper.createTodo({ title: 'Personal task', tag_ids: [personalTag.id] });
    
    await page.reload();
    
    // Filter by Work
    await page.selectOption('select', workTag.id.toString());
    
    // Only work tasks visible
    await expect(page.locator('text=Work task 1')).toBeVisible();
    await expect(page.locator('text=Work task 2')).toBeVisible();
    await expect(page.locator('text=Personal task')).not.toBeVisible();
  });

  test('should clear tag filter', async ({ page }) => {
    await page.goto('/');
    const tag = await helper.createTag({ name: 'Work', color: '#3B82F6' });
    await helper.createTodo({ title: 'Work task', tag_ids: [tag.id] });
    await helper.createTodo({ title: 'Other task', tag_ids: [] });
    
    await page.reload();
    
    // Filter
    await page.selectOption('select', tag.id.toString());
    await expect(page.locator('text=Other task')).not.toBeVisible();
    
    // Clear filter
    await page.selectOption('select', '');
    
    // All tasks visible
    await expect(page.locator('text=Work task')).toBeVisible();
    await expect(page.locator('text=Other task')).toBeVisible();
  });

  test('should edit todo tags', async ({ page }) => {
    await page.goto('/');
    const tag1 = await helper.createTag({ name: 'Work', color: '#3B82F6' });
    const tag2 = await helper.createTag({ name: 'Urgent', color: '#EF4444' });
    
    await helper.createTodo({ title: 'Task', tag_ids: [tag1.id] });
    await page.reload();
    
    // Edit todo
    await page.click('button:has-text("Edit")');
    
    // Change tags
    await page.click('button:has-text("Work")'); // Deselect
    await page.click('button:has-text("Urgent")'); // Select
    await page.click('button:has-text("Save")');
    
    // Tags updated
    const todoItem = page.locator('text=Task').locator('..');
    await expect(todoItem.locator('text=Urgent')).toBeVisible();
    await expect(todoItem.locator('text=Work')).not.toBeVisible();
  });

  test('should remove all tags from todo', async ({ page }) => {
    await page.goto('/');
    const tag = await helper.createTag({ name: 'Work', color: '#3B82F6' });
    await helper.createTodo({ title: 'Task', tag_ids: [tag.id] });
    await page.reload();
    
    await page.click('button:has-text("Edit")');
    await page.click('button:has-text("Work")'); // Deselect
    await page.click('button:has-text("Save")');
    
    // No tags on todo
    const todoItem = page.locator('text=Task').locator('..');
    await expect(todoItem.locator('text=Work')).not.toBeVisible();
  });

  test('should update tag color on all todos', async ({ page }) => {
    await page.goto('/');
    const tag = await helper.createTag({ name: 'Work', color: '#3B82F6' });
    await helper.createTodo({ title: 'Task 1', tag_ids: [tag.id] });
    await helper.createTodo({ title: 'Task 2', tag_ids: [tag.id] });
    
    await page.reload();
    
    // Edit tag color
    await page.click('button:has-text("Manage Tags")');
    await page.click('button:has-text("Edit")');
    await page.fill('input[type="text"][value*="#"]', '#EF4444');
    await page.click('button:has-text("Update")');
    await page.click('button:has-text("Close")');
    
    // Both todos show red color
    const tag1 = page.locator('text=Task 1').locator('..').locator('text=Work').last();
    const tag2 = page.locator('text=Task 2').locator('..').locator('text=Work').last();
    
    const color1 = await tag1.evaluate(el => getComputedStyle(el).backgroundColor);
    const color2 = await tag2.evaluate(el => getComputedStyle(el).backgroundColor);
    
    expect(color1).toContain('239, 68, 68');
    expect(color2).toContain('239, 68, 68');
  });

  test('should cascade delete tag from todos', async ({ page }) => {
    await page.goto('/');
    const tag = await helper.createTag({ name: 'Work', color: '#3B82F6' });
    await helper.createTodo({ title: 'Task 1', tag_ids: [tag.id] });
    await helper.createTodo({ title: 'Task 2', tag_ids: [tag.id] });
    
    await page.reload();
    
    // Delete tag
    await page.click('button:has-text("Manage Tags")');
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Delete")');
    await page.click('button:has-text("Close")');
    
    // Tags removed from todos
    await expect(page.locator('text=Task 1').locator('..').locator('text=Work')).not.toBeVisible();
    await expect(page.locator('text=Task 2').locator('..').locator('text=Work')).not.toBeVisible();
  });

  test('should inherit tags in recurring todo', async ({ page }) => {
    await page.goto('/');
    const tag = await helper.createTag({ name: 'Weekly', color: '#3B82F6' });
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await helper.createTodo({
      title: 'Team standup',
      dueDate: tomorrow.toISOString(),
      recurrencePattern: 'weekly',
      tag_ids: [tag.id],
    });
    
    await page.reload();
    
    // Complete todo
    await page.click('input[type="checkbox"]').first();
    
    // Next instance has tag
    const instances = page.locator('text=Team standup');
    await expect(instances.first().locator('..').locator('text=Weekly')).toBeVisible();
  });
});
```

### Unit Tests

Create `tests/unit/tags.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  tagDB, 
  validateTagName, 
  validateTagColor,
  isTagNameUnique,
  userDB,
  todoDB,
  DEFAULT_TAG_COLOR
} from '@/lib/db';

describe('Tag Validation', () => {
  it('should validate correct tag names', () => {
    expect(validateTagName('Work')).toBe('Work');
    expect(validateTagName('  Personal  ')).toBe('Personal'); // Trimmed
    expect(validateTagName('A')).toBe('A');
  });

  it('should reject invalid tag names', () => {
    expect(validateTagName('')).toBe(null);
    expect(validateTagName('   ')).toBe(null);
    expect(validateTagName(null)).toBe(null);
    expect(validateTagName(123)).toBe(null);
  });

  it('should reject names over 50 characters', () => {
    const longName = 'A'.repeat(51);
    expect(validateTagName(longName)).toBe(null);
    
    const maxName = 'A'.repeat(50);
    expect(validateTagName(maxName)).toBe(maxName);
  });

  it('should validate hex color codes', () => {
    expect(validateTagColor('#3B82F6')).toBe('#3B82F6');
    expect(validateTagColor('#ef4444')).toBe('#EF4444'); // Uppercase
    expect(validateTagColor('#000000')).toBe('#000000');
    expect(validateTagColor('#FFFFFF')).toBe('#FFFFFF');
  });

  it('should reject invalid color codes', () => {
    expect(validateTagColor('red')).toBe(DEFAULT_TAG_COLOR);
    expect(validateTagColor('#FFF')).toBe(DEFAULT_TAG_COLOR); // Too short
    expect(validateTagColor('#GGGGGG')).toBe(DEFAULT_TAG_COLOR); // Invalid chars
    expect(validateTagColor('3B82F6')).toBe(DEFAULT_TAG_COLOR); // Missing #
  });

  it('should use default color for invalid input', () => {
    expect(validateTagColor(null)).toBe(DEFAULT_TAG_COLOR);
    expect(validateTagColor(undefined)).toBe(DEFAULT_TAG_COLOR);
    expect(validateTagColor(123)).toBe(DEFAULT_TAG_COLOR);
  });
});

describe('Tag Database Operations', () => {
  let userId: number;

  beforeEach(() => {
    userId = userDB.create({ username: 'test-tag-user' });
  });

  it('should create tag with default color', () => {
    const tag = tagDB.create({
      user_id: userId,
      name: 'Work',
    });
    
    expect(tag.name).toBe('Work');
    expect(tag.color).toBe(DEFAULT_TAG_COLOR);
    expect(tag.user_id).toBe(userId);
  });

  it('should create tag with custom color', () => {
    const tag = tagDB.create({
      user_id: userId,
      name: 'Urgent',
      color: '#EF4444',
    });
    
    expect(tag.color).toBe('#EF4444');
  });

  it('should prevent duplicate tag names', () => {
    tagDB.create({ user_id: userId, name: 'Work' });
    
    expect(() => {
      tagDB.create({ user_id: userId, name: 'Work' });
    }).toThrow('Tag name already exists');
  });

  it('should prevent duplicate tag names case-insensitive', () => {
    tagDB.create({ user_id: userId, name: 'Work' });
    
    expect(() => {
      tagDB.create({ user_id: userId, name: 'WORK' });
    }).toThrow('Tag name already exists');
  });

  it('should allow same tag name for different users', () => {
    const user2Id = userDB.create({ username: 'user2' });
    
    tagDB.create({ user_id: userId, name: 'Work' });
    
    expect(() => {
      tagDB.create({ user_id: user2Id, name: 'Work' });
    }).not.toThrow();
  });

  it('should get all tags for user sorted by name', () => {
    tagDB.create({ user_id: userId, name: 'Zebra' });
    tagDB.create({ user_id: userId, name: 'Apple' });
    tagDB.create({ user_id: userId, name: 'Middle' });
    
    const tags = tagDB.getAllByUser(userId);
    expect(tags.length).toBe(3);
    expect(tags[0].name).toBe('Apple');
    expect(tags[1].name).toBe('Middle');
    expect(tags[2].name).toBe('Zebra');
  });

  it('should update tag name', () => {
    const tag = tagDB.create({ user_id: userId, name: 'Old Name' });
    
    const updated = tagDB.update(tag.id, userId, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
    expect(updated.color).toBe(tag.color); // Unchanged
  });

  it('should update tag color', () => {
    const tag = tagDB.create({ user_id: userId, name: 'Work' });
    
    const updated = tagDB.update(tag.id, userId, { color: '#22C55E' });
    expect(updated.color).toBe('#22C55E');
    expect(updated.name).toBe('Work'); // Unchanged
  });

  it('should prevent updating to duplicate name', () => {
    tagDB.create({ user_id: userId, name: 'Work' });
    const tag2 = tagDB.create({ user_id: userId, name: 'Personal' });
    
    expect(() => {
      tagDB.update(tag2.id, userId, { name: 'Work' });
    }).toThrow('Tag name already exists');
  });

  it('should allow updating to same name (case change)', () => {
    const tag = tagDB.create({ user_id: userId, name: 'work' });
    
    expect(() => {
      tagDB.update(tag.id, userId, { name: 'Work' });
    }).not.toThrow();
  });

  it('should delete tag', () => {
    const tag = tagDB.create({ user_id: userId, name: 'Temporary' });
    
    tagDB.delete(tag.id, userId);
    
    expect(() => tagDB.getById(tag.id)).toThrow('Tag not found');
  });

  it('should set tags for todo', () => {
    const tag1 = tagDB.create({ user_id: userId, name: 'Work' });
    const tag2 = tagDB.create({ user_id: userId, name: 'Urgent' });
    
    const todo = todoDB.create({
      user_id: userId,
      title: 'Task',
      priority: 'medium',
      due_date: null,
      recurrence_pattern: 'none',
      reminder_minutes: null,
      last_notification_sent: null,
    });
    
    tagDB.setForTodo(todo.id, [tag1.id, tag2.id]);
    
    const tags = tagDB.getByTodoId(todo.id);
    expect(tags.length).toBe(2);
    expect(tags.map(t => t.name)).toContain('Work');
    expect(tags.map(t => t.name)).toContain('Urgent');
  });

  it('should replace existing tags when setting', () => {
    const tag1 = tagDB.create({ user_id: userId, name: 'Work' });
    const tag2 = tagDB.create({ user_id: userId, name: 'Urgent' });
    const tag3 = tagDB.create({ user_id: userId, name: 'Personal' });
    
    const todo = todoDB.create({
      user_id: userId,
      title: 'Task',
      priority: 'medium',
      due_date: null,
      recurrence_pattern: 'none',
      reminder_minutes: null,
      last_notification_sent: null,
    });
    
    tagDB.setForTodo(todo.id, [tag1.id, tag2.id]);
    tagDB.setForTodo(todo.id, [tag3.id]);
    
    const tags = tagDB.getByTodoId(todo.id);
    expect(tags.length).toBe(1);
    expect(tags[0].name).toBe('Personal');
  });

  it('should copy tags from one todo to another', () => {
    const tag1 = tagDB.create({ user_id: userId, name: 'Work' });
    const tag2 = tagDB.create({ user_id: userId, name: 'Urgent' });
    
    const todo1 = todoDB.create({
      user_id: userId,
      title: 'Original',
      priority: 'medium',
      due_date: null,
      recurrence_pattern: 'none',
      reminder_minutes: null,
      last_notification_sent: null,
    });
    
    const todo2 = todoDB.create({
      user_id: userId,
      title: 'Copy',
      priority: 'medium',
      due_date: null,
      recurrence_pattern: 'none',
      reminder_minutes: null,
      last_notification_sent: null,
    });
    
    tagDB.setForTodo(todo1.id, [tag1.id, tag2.id]);
    tagDB.copyTags(todo1.id, todo2.id);
    
    const tags1 = tagDB.getByTodoId(todo1.id);
    const tags2 = tagDB.getByTodoId(todo2.id);
    
    expect(tags2.length).toBe(2);
    expect(tags2.map(t => t.id)).toEqual(tags1.map(t => t.id));
  });

  it('should cascade delete tag relationships when tag deleted', () => {
    const tag = tagDB.create({ user_id: userId, name: 'Work' });
    const todo = todoDB.create({
      user_id: userId,
      title: 'Task',
      priority: 'medium',
      due_date: null,
      recurrence_pattern: 'none',
      reminder_minutes: null,
      last_notification_sent: null,
    });
    
    tagDB.setForTodo(todo.id, [tag.id]);
    
    // Delete tag
    tagDB.delete(tag.id, userId);
    
    // Relationships also deleted
    const tags = tagDB.getByTodoId(todo.id);
    expect(tags.length).toBe(0);
  });

  it('should cascade delete tag relationships when todo deleted', () => {
    const tag = tagDB.create({ user_id: userId, name: 'Work' });
    const todo = todoDB.create({
      user_id: userId,
      title: 'Task',
      priority: 'medium',
      due_date: null,
      recurrence_pattern: 'none',
      reminder_minutes: null,
      last_notification_sent: null,
    });
    
    tagDB.setForTodo(todo.id, [tag.id]);
    
    // Delete todo
    todoDB.delete(todo.id, userId);
    
    // Tag still exists
    expect(() => tagDB.getById(tag.id)).not.toThrow();
  });
});

describe('Tag Name Uniqueness Check', () => {
  let userId: number;

  beforeEach(() => {
    userId = userDB.create({ username: 'test-user' });
  });

  it('should return true for unique name', () => {
    expect(isTagNameUnique(userId, 'Unique Name')).toBe(true);
  });

  it('should return false for duplicate name', () => {
    tagDB.create({ user_id: userId, name: 'Work' });
    expect(isTagNameUnique(userId, 'Work')).toBe(false);
  });

  it('should return false for duplicate name case-insensitive', () => {
    tagDB.create({ user_id: userId, name: 'Work' });
    expect(isTagNameUnique(userId, 'WORK')).toBe(false);
    expect(isTagNameUnique(userId, 'work')).toBe(false);
  });

  it('should exclude specific tag ID when checking', () => {
    const tag = tagDB.create({ user_id: userId, name: 'Work' });
    
    // Should return true when excluding the tag itself
    expect(isTagNameUnique(userId, 'Work', tag.id)).toBe(true);
  });
});
```

---

## Out of Scope

The following features are **explicitly excluded** from this implementation:

### 1. Tag Hierarchies/Nesting
- Parent-child tag relationships
- Tag categories or groups
- Nested tag filtering
- **Reason:** Flat structure simpler for MVP

### 2. Tag Suggestions/Autocomplete
- Auto-suggest existing tags while typing
- Fuzzy tag matching
- Recently used tags
- **Reason:** Can add later if user requests

### 3. Tag Icons
- Custom icons per tag
- Emoji support in tag names
- Icon library integration
- **Reason:** Color coding sufficient

### 4. Tag Sharing
- Share tags between users
- Public tag libraries
- Tag templates
- **Reason:** Single-user app design

### 5. Tag Analytics
- Most-used tags report
- Tag usage over time
- Tag-based productivity metrics
- **Reason:** Analytics out of scope

### 6. Bulk Tag Operations
- "Add tag to all selected todos"
- "Remove tag from all todos"
- Batch tag editing
- **Reason:** Can implement if requested

### 7. Tag Permissions
- Read-only tags
- Protected tags (can't delete)
- Tag access control
- **Reason:** Single-user, no permissions needed

### 8. Tag Merge
- Merge two tags into one
- Find and replace tags
- **Reason:** Low priority for MVP

### 9. Tag Import/Export (Standalone)
- Export tags separately from todos
- Import tags from other apps
- **Reason:** Handled by general export/import (PRP-09)

### 10. Smart Tags
- Auto-tagging based on keywords
- Rule-based tag assignment
- AI-suggested tags
- **Reason:** Over-engineering for task app

---

## Success Metrics

### User Engagement
- **Target:** 70% of users create at least 1 tag
- **Target:** Average 5-8 tags per active user
- **Target:** 60% of todos have at least 1 tag

### Feature Usage
- **Target:** Tag filter used 30% of sessions
- **Target:** Average 1.8 tags per tagged todo
- **Target:** < 10% tag deletion rate (stable categorization)

### Performance
- **Target:** Tag CRUD operations < 200ms (p95)
- **Target:** Filtering by tag instant (< 50ms client-side)
- **Target:** Loading 100 tags with 1000 todos < 500ms

### User Satisfaction
- **Target:** < 5% requests for tag hierarchy
- **Target:** Zero data corruption from cascade deletes
- **Target:** Color contrast meets WCAG AA standards

### Technical Quality
- **Target:** 100% E2E test pass rate (17 test cases)
- **Target:** 100% unit test coverage for tag logic
- **Target:** All acceptance criteria validated

---

## Implementation Notes

### Development Order
1. **Phase 1: Database & Backend**
   - Create `tags` and `todo_tags` tables
   - Implement `tagDB` interface
   - Add validation functions
   - Create API routes: POST/GET /api/tags, PUT/DELETE /api/tags/[id]

2. **Phase 2: Tag Management UI**
   - Build TagManagementModal component
   - Implement CRUD operations
   - Add color picker and validation
   - Test modal interactions

3. **Phase 3: Tag Selection & Display**
   - Build TagSelector component
   - Build TagPills component
   - Integrate into todo form
   - Display tags on todo items

4. **Phase 4: Filtering**
   - Build TagFilter component
   - Implement client-side filtering
   - Combine with existing filters
   - Add to filter section

5. **Phase 5: Integration**
   - Update todo API routes to handle tag_ids
   - Implement recurring todo tag copying
   - Test cascade delete behavior
   - Dark mode styling

6. **Phase 6: Testing**
   - Write E2E tests (17 test cases)
   - Write unit tests (validation, database)
   - Manual testing across browsers
   - Performance testing

### Dependencies
- **Requires:** PRP-01 (Todo CRUD) - database, API patterns, todo model
- **Enhances:** PRP-03 (Recurring Todos) - tag inheritance in next instance
- **Enhances:** PRP-08 (Search & Filtering) - search by tag names
- **Enhances:** PRP-09 (Export & Import) - include tags in export

### Maintenance Considerations
- Monitor tag table size growth (expect 5-20 tags per user)
- Track junction table performance (index on both columns)
- Review color contrast based on user feedback
- Consider tag merge feature if users create many similar tags

---

**Feature Owner:** AI Development Team  
**Last Updated:** February 5, 2026  
**Status:** Ready for Implementation
