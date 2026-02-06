# PRP 08: Search & Filtering

## Feature Overview

A powerful client-side search and multi-criteria filtering system that helps users find exactly the todos they need. Features include real-time text search across todo titles and subtask titles, quick filters for priority and tags, advanced filters for completion status and date ranges, and saveable filter presets stored in browser localStorage. All active filters combine using AND logic.

---

## User Stories

1. **As a user**, I want to search my todos by text so that I can quickly find specific tasks.
2. **As a user**, I want search to include subtask titles so that I can find todos even if the search term is in a subtask.
3. **As a user**, I want to filter by priority level so that I can focus on high/medium/low priority tasks.
4. **As a user**, I want to filter by tag so that I can view tasks from a specific category.
5. **As a user**, I want to filter by completion status so that I can review done or pending tasks.
6. **As a user**, I want to filter by date range so that I can plan for a specific time period.
7. **As a user**, I want to save filter combinations as presets so that I can quickly apply my frequent filters.
8. **As a user**, I want to clear all filters at once so that I can return to the full view quickly.
9. **As a user**, I want filters to combine with AND logic so that I get precise, narrowed results.

---

## User Flow

### Text Search
1. User types in the search bar (located at top of todo list, below the todo form)
2. Results update in real-time as the user types
3. Search matches against todo titles AND subtask titles (case-insensitive, partial match)
4. A clear button (✕) appears when text is entered
5. Clicking ✕ or deleting all text clears the search

### Quick Filters
1. **Priority filter**: User selects from dropdown — "All Priorities", "High Priority", "Medium Priority", "Low Priority"
2. **Tag filter**: User selects from dropdown — "All Tags" + individual tag names (only shows if tags exist)
3. Filters apply immediately on selection
4. Combine with search and other filters via AND logic

### Advanced Filters
1. User clicks **"▶ Advanced"** button to expand the advanced filters panel
2. Panel reveals:
   - **Completion status** dropdown: "All Todos", "Incomplete Only", "Completed Only"
   - **Due Date From** date input
   - **Due Date To** date input
3. User sets any combination of advanced filters
4. Results update immediately
5. User clicks **"▼ Advanced"** to collapse (filters remain active)

### Saving Filter Presets
1. When any filter is active, **"💾 Save Filter"** button appears (green)
2. User clicks the button
3. Modal opens showing current active filters as preview:
   - Search query (if set)
   - Priority (if selected)
   - Tag (if selected)
   - Completion status (if not "all")
   - Date range (if set)
4. User enters a preset name
5. User clicks **"Save"**
6. Preset saved to browser localStorage

### Applying a Saved Preset
1. User opens advanced filters panel
2. **"Saved Filter Presets"** section shows all saved presets as pills
3. User clicks a preset name to apply all its filters at once
4. All current filters replaced by preset filters

### Deleting a Saved Preset
1. In the saved presets section, each preset has a **"✕"** delete button
2. User clicks ✕ to remove the preset
3. Preset removed from localStorage

### Clearing All Filters
1. When any filter is active, **"Clear All"** button appears (red)
2. User clicks **"Clear All"**
3. All filters reset: search cleared, dropdowns reset to defaults, date inputs cleared
4. Full todo list visible again

---

## Technical Requirements

### Filter State (Client-Side)

```typescript
interface FilterState {
  search: string;                          // Text search query
  priority: 'all' | 'high' | 'medium' | 'low';  // Priority filter
  tag: 'all' | number;                    // Tag filter (tag ID or 'all')
  completion: 'all' | 'incomplete' | 'completed'; // Completion status
  dateFrom: string | null;                // ISO date string (YYYY-MM-DD)
  dateTo: string | null;                  // ISO date string (YYYY-MM-DD)
}

interface SavedPreset {
  name: string;
  filters: FilterState;
}
```

### Filter Logic (Client-Side)

All filtering happens client-side using the full todo list fetched from the API. Filters are applied sequentially with AND logic:

```typescript
let filtered = todos;

// 1. Text search (title + subtask titles)
if (filters.search) {
  const query = filters.search.toLowerCase();
  filtered = filtered.filter(todo =>
    todo.title.toLowerCase().includes(query) ||
    todo.subtasks?.some(s => s.title.toLowerCase().includes(query))
  );
}

// 2. Priority filter
if (filters.priority !== 'all') {
  filtered = filtered.filter(todo => todo.priority === filters.priority);
}

// 3. Tag filter
if (filters.tag !== 'all') {
  filtered = filtered.filter(todo =>
    todo.tags?.some(t => t.id === filters.tag)
  );
}

// 4. Completion filter
if (filters.completion === 'incomplete') {
  filtered = filtered.filter(todo => !todo.completed);
} else if (filters.completion === 'completed') {
  filtered = filtered.filter(todo => todo.completed);
}

// 5. Date range filter (only todos WITH due dates)
if (filters.dateFrom) {
  filtered = filtered.filter(todo =>
    todo.due_date && todo.due_date >= filters.dateFrom
  );
}
if (filters.dateTo) {
  filtered = filtered.filter(todo =>
    todo.due_date && todo.due_date <= filters.dateTo
  );
}
```

### Preset Storage (localStorage)

```typescript
// Save preset
const presets = JSON.parse(localStorage.getItem('filterPresets') || '[]');
presets.push({ name: presetName, filters: currentFilters });
localStorage.setItem('filterPresets', JSON.stringify(presets));

// Load presets
const presets: SavedPreset[] = JSON.parse(localStorage.getItem('filterPresets') || '[]');

// Delete preset
const presets = JSON.parse(localStorage.getItem('filterPresets') || '[]');
const updated = presets.filter((p: SavedPreset) => p.name !== presetName);
localStorage.setItem('filterPresets', JSON.stringify(updated));
```

### No API Endpoints Needed
- All filtering is **client-side** — no server-side filter endpoints
- Full todo list (with subtasks and tags) fetched via `GET /api/todos`
- Presets stored in browser localStorage (per browser/device)

---

## UI Components

### Search Bar
- **Location**: Top of todo list, below the todo form
- **Style**: Full-width input with search icon (🔍) on left
- **Placeholder**: `"Search todos and subtasks..."`
- **Clear button**: ✕ appears on right when text is entered
- **Behavior**: Real-time filtering as user types

### Quick Filter Bar
- **Location**: Below search bar, horizontal row
- **Priority dropdown**: "All Priorities" / "High Priority" / "Medium Priority" / "Low Priority"
- **Tag dropdown**: "All Tags" / individual tag names (hidden if no tags exist)
- **Advanced toggle**: "▶ Advanced" / "▼ Advanced" button
  - Blue background when advanced panel is open
  - Gray background when closed

### Active Filter Actions
- Visible when ANY filter is active:
  - **"Clear All"** button (red) — removes all filters
  - **"💾 Save Filter"** button (green) — opens save modal

### Advanced Filters Panel
- **Expandable**: Hidden by default, toggled via "▶ Advanced" button
- **Completion dropdown**: "All Todos" / "Incomplete Only" / "Completed Only"
- **Date From**: `<input type="date">` with label "Due Date From"
- **Date To**: `<input type="date">` with label "Due Date To"
- **Saved Presets section**: Shows preset pills with name and ✕ delete button

### Save Filter Modal
- **Name input**: Required
- **Filter preview**: Lists all active filters
- **"Save"** button and **"Cancel"** button

### Filter Results Display
- Section counters update: "Overdue (X)", "Pending (X)", "Completed (X)"
- Sections auto-hide when empty after filtering
- No special "no results" state needed — sections simply show (0)

---

## Edge Cases

1. **Empty search**: Show all todos (no filter applied)
2. **Search with no results**: All sections show (0) count
3. **Special characters in search**: Treat as literal text (no regex)
4. **Search + filters combined**: AND logic — must match all active criteria
5. **Date range with only "From"**: All todos with due date >= from date
6. **Date range with only "To"**: All todos with due date <= to date
7. **Date range filtering**: Only applies to todos WITH due dates; todos without due dates are excluded
8. **Saving preset with no name**: Reject — name is required
9. **Duplicate preset names**: Allow — no uniqueness constraint
10. **localStorage unavailable**: Presets feature degrades gracefully; filters still work
11. **Large todo list filtering**: Client-side performance — consider debouncing search input (150-300ms)
12. **Tag filter with deleted tag**: If filtered tag was deleted, reset tag filter to "All Tags"
13. **Completion filter vs section display**: "Completed Only" shows only completed section; "Incomplete Only" shows overdue + pending

---

## Acceptance Criteria

- [ ] Search bar filters todos in real-time as user types
- [ ] Search matches todo titles (case-insensitive, partial match)
- [ ] Search matches subtask titles
- [ ] Clear button (✕) clears search and shows all todos
- [ ] Priority dropdown filters by priority level
- [ ] Tag dropdown filters by selected tag
- [ ] Tag dropdown hidden when no tags exist
- [ ] Advanced panel toggles open/closed
- [ ] Completion filter works: All / Incomplete / Completed
- [ ] Date From and Date To filter by due date range
- [ ] Date range only includes todos with due dates
- [ ] All filters combine with AND logic
- [ ] "Clear All" button resets all filters
- [ ] "Save Filter" button opens save modal when filters active
- [ ] Save modal shows preview of active filters
- [ ] Saved presets appear in advanced panel
- [ ] Clicking a preset applies all its filters
- [ ] Preset ✕ button deletes the preset
- [ ] Presets persist in localStorage across page refreshes
- [ ] Section counters update based on filtered results
- [ ] Empty sections auto-hide after filtering

---

## Testing Requirements

### E2E Tests (Playwright)

```typescript
// tests/08-search-filtering.spec.ts

test('should search todos by title', async ({ page }) => {
  // Create todos, search by partial title, verify correct results
});

test('should search subtask titles', async ({ page }) => {
  // Create todo with subtask, search by subtask title, verify parent todo shown
});

test('should be case-insensitive search', async ({ page }) => {
  // Create "Meeting Notes", search "meeting", verify found
});

test('should clear search with ✕ button', async ({ page }) => {
  // Search, click clear, verify all todos shown
});

test('should filter by priority', async ({ page }) => {
  // Create todos with different priorities, filter by High, verify
});

test('should filter by tag', async ({ page }) => {
  // Create tag, tag some todos, filter by tag, verify
});

test('should filter by completion status', async ({ page }) => {
  // Create and complete some todos, filter Completed Only, verify
});

test('should filter by date range', async ({ page }) => {
  // Create todos with different due dates, set range, verify
});

test('should combine multiple filters with AND logic', async ({ page }) => {
  // Apply search + priority + tag, verify only matching todos shown
});

test('should clear all filters', async ({ page }) => {
  // Apply multiple filters, click Clear All, verify all todos shown
});

test('should save and apply filter preset', async ({ page }) => {
  // Apply filters, save as preset, clear, apply preset, verify same results
});

test('should delete a filter preset', async ({ page }) => {
  // Save preset, delete it, verify removed from list
});
```

---

## Out of Scope

- Server-side search or filtering (all client-side)
- Full-text search indexing
- Fuzzy search or typo tolerance
- Search highlighting (highlighting matched text)
- Filter by recurrence pattern
- Filter by reminder status
- Sort order customization (sorting is always priority → due date → creation date)
- Search history
- Exported/shared filter presets
- Filter by subtask completion percentage

---

## Success Metrics

- Search returns results in < 100ms for lists up to 500 todos
- Filter combinations produce correct AND-logic results
- Saved presets reliably persist across page refreshes
- Users can find any todo by partial title or subtask title match
- Clear All reliably resets all filter criteria
- No performance degradation with multiple active filters
- Section counters accurately reflect filtered counts
