# PRP-08: Search & Filtering

## Feature Overview

The Search & Filtering system provides powerful, real-time capabilities to find and organize todos using multiple criteria. Users can instantly search across todo titles and subtask content, apply multi-criteria filters (priority, tags, dates, completion status), and save frequently used filter combinations as reusable presets. All filtering operations execute client-side for instant results without server requests.

### Core Functionality
- **Real-Time Text Search**: Instant search across todo titles and subtask content as user types
- **Advanced Search**: Searches both todo titles AND subtask titles simultaneously
- **Multi-Criteria Filtering**: Combine search, priority, tags, date range, and completion status
- **Client-Side Performance**: All filtering operations run in browser for instant feedback
- **Saved Filter Presets**: Store and reuse common filter combinations via localStorage
- **Filter Combination Logic**: AND logic - todos must match ALL active filters
- **Visual Feedback**: Clear indicators for active filters, result counts, empty states

### User Value
- Find specific todos in large lists (1000+ items) instantly
- Apply complex queries without multiple page refreshes
- Save time with preset filters for common workflows (e.g., "This week's work tasks")
- Review completed tasks by tag or date range
- Focus on urgent items via priority + date filtering
- Search within subtasks to find detailed action items

---

## User Stories

### Story 1: Search Todos by Text
**As a** user with many todos  
**I want to** search by typing keywords  
**So that** I can quickly find specific tasks

**Acceptance Criteria:**
- Search input visible at top of todo list
- Search icon (🔍) displayed in input
- Placeholder text: "Search todos and subtasks..."
- Results update in real-time as user types
- Case-insensitive matching
- Partial word matching ("proj" finds "project")
- Clear button (✕) appears when text entered
- Searches both todo titles AND subtask titles
- No server requests - client-side only

### Story 2: Filter by Priority
**As a** user managing urgent work  
**I want to** filter todos by priority level  
**So that** I can focus on high-priority items

**Acceptance Criteria:**
- "All Priorities" dropdown visible in quick filters
- Options: All Priorities, High Priority, Medium Priority, Low Priority
- Selecting priority filters todo list immediately
- Filter combines with search and other filters
- "All Priorities" option clears priority filter
- Filtered count updates in sections

### Story 3: Filter by Tag
**As a** user organizing by category  
**I want to** filter todos by tag  
**So that** I can see all tasks for a specific context

**Acceptance Criteria:**
- "All Tags" dropdown visible if tags exist
- Dropdown lists all user's tags
- Selecting tag shows only todos with that tag
- Filter combines with search and other filters
- "All Tags" option clears tag filter
- Tag filter integrates with PRP-06 tag system

### Story 4: Apply Advanced Filters
**As a** user needing precise results  
**I want to** access additional filter options  
**So that** I can combine multiple criteria

**Acceptance Criteria:**
- "▶ Advanced" toggle button visible below quick filters
- Clicking button expands advanced filter panel
- Button changes to "▼ Advanced" when expanded
- Panel shows: Completion status dropdown, Date range inputs, Saved presets section
- Panel collapses when clicking button again
- Blue background when filters active

### Story 5: Filter by Completion Status
**As a** user reviewing progress  
**I want to** filter by completed/incomplete status  
**So that** I can review what's done or pending

**Acceptance Criteria:**
- Completion dropdown in advanced panel
- Options: All Todos, Incomplete Only, Completed Only
- "Incomplete Only" shows unchecked todos
- "Completed Only" shows checked todos
- "All Todos" shows both
- Filter combines with other criteria

### Story 6: Filter by Date Range
**As a** user planning my week  
**I want to** filter todos by due date range  
**So that** I can see what's due in a specific timeframe

**Acceptance Criteria:**
- Two date inputs in advanced panel: "Due Date From", "Due Date To"
- Date format: YYYY-MM-DD (HTML5 date input)
- Can use both inputs for specific range
- Can use "From" only (all todos after date)
- Can use "To" only (all todos before date)
- Only shows todos WITH due dates (excludes null)
- Filter combines with other criteria
- Respects Singapore timezone for date comparison

### Story 7: Save Filter Preset
**As a** user with recurring queries  
**I want to** save my current filter combination  
**So that** I can reuse it quickly later

**Acceptance Criteria:**
- "💾 Save Filter" button appears when any filter active
- Button opens save filter modal
- Modal shows preview of current filters (search, priority, tag, dates, completion)
- Name input field (required, max 50 chars)
- "Save" button stores preset to localStorage
- Modal closes after save
- Preset appears in advanced panel "Saved Filter Presets" section

### Story 8: Apply Saved Preset
**As a** user accessing saved filters  
**I want to** apply preset with one click  
**So that** I can quickly switch to common filter combinations

**Acceptance Criteria:**
- Saved presets displayed in advanced panel (if any exist)
- Each preset shows as clickable pill with name
- Clicking preset name applies all saved filters
- All dropdowns/inputs update to match preset
- Current filters overwritten by preset filters
- Results update immediately

### Story 9: Delete Filter Preset
**As a** user cleaning up presets  
**I want to** remove presets I no longer need  
**So that** my preset list stays relevant

**Acceptance Criteria:**
- ✕ button next to each preset name
- Clicking ✕ prompts confirmation
- Confirming removes preset from localStorage
- Preset disappears from list
- Does not affect current active filters

### Story 10: Clear All Filters
**As a** user resetting my view  
**I want to** clear all active filters at once  
**So that** I can quickly see all todos again

**Acceptance Criteria:**
- "Clear All" button appears when any filter active
- Button styled in red/danger color
- Clicking button removes ALL filters:
  - Search text cleared
  - Priority reset to "All Priorities"
  - Tag reset to "All Tags"
  - Completion reset to "All Todos"
  - Date inputs cleared
- All todos visible after clear
- Button disappears when no filters active

---

## User Flow

### Flow 1: Basic Text Search
1. User has 50 todos in list
2. User wants to find todos about "report"
3. User clicks search input
4. User types "r"
5. List updates instantly - 20 todos match "r"
6. User types "e" (now "re")
7. List updates - 15 todos match "re"
8. User types "p" (now "rep")
9. List updates - 8 todos match "rep"
10. User types "ort" (now "report")
11. List shows 3 todos:
    - "Monthly Report" (title match)
    - "Client Meeting" with subtask "Send report to manager" (subtask match)
    - "Project Alpha" with subtask "Quarterly reporting analysis" (subtask match)
12. All sections (Overdue, Pending, Completed) update counts
13. User sees highlighted search term in results

### Flow 2: Search with Clear Button
1. User has searched for "meeting"
2. 5 results displayed
3. Clear button (✕) visible in search input
4. User clicks ✕ button
5. Search text cleared instantly
6. All 50 todos return to list
7. Clear button disappears
8. Search input returns to placeholder text

### Flow 3: Combining Search and Priority Filter
1. User types "project" in search
2. 12 todos match "project"
3. User opens priority dropdown
4. User selects "High Priority"
5. List filters to 4 todos (project + high priority)
6. Search text remains: "project"
7. Priority dropdown shows: "High Priority"
8. "Clear All" button appears (red)
9. Both filters indicated as active

### Flow 4: Opening Advanced Filters
1. User sees quick filters (search, priority, tag)
2. User clicks "▶ Advanced" button
3. Panel expands below quick filters
4. Panel shows:
   - Completion Status dropdown (default: "All Todos")
   - Due Date From input (empty)
   - Due Date To input (empty)
   - Saved Filter Presets heading (empty if none)
5. Button text changes to "▼ Advanced"
6. Panel remains open until user clicks button again

### Flow 5: Filtering by Date Range
1. User opens advanced panel
2. User wants todos due this week (Nov 1-7, 2025)
3. User clicks "Due Date From" input
4. Date picker appears
5. User selects November 1, 2025
6. Input shows: 2025-11-01
7. User clicks "Due Date To" input
8. Date picker appears
9. User selects November 7, 2025
10. Input shows: 2025-11-07
11. List filters immediately to 8 todos with due dates in range
12. Todos without due dates excluded
13. "Clear All" button appears

### Flow 6: Multi-Criteria Filtering (Complex Query)
1. User wants: "High priority incomplete work reports due this week"
2. User types "report" in search → 10 results
3. User selects "High Priority" → 6 results
4. User selects "Work" tag → 4 results
5. User opens advanced panel
6. User selects "Incomplete Only" → 3 results
7. User sets date range: 2025-11-01 to 2025-11-07 → 2 results
8. Final list shows 2 todos matching ALL criteria:
   - "Weekly Status Report" (due Nov 3, high, Work tag, incomplete)
   - "Quarterly Report Draft" (due Nov 5, high, Work tag, incomplete)
9. All filter indicators active
10. "Clear All" and "💾 Save Filter" buttons visible

### Flow 7: Saving Filter Preset
1. User has applied complex filter (above scenario)
2. 2 todos displayed
3. User clicks "💾 Save Filter" button (green)
4. Save filter modal opens
5. Modal shows "Current Filters" preview:
   ```
   • Search: "report"
   • Priority: High
   • Tag: Work
   • Completion: Incomplete
   • Date Range: 2025-11-01 to 2025-11-07
   ```
6. User enters name: "This Week's Work Reports"
7. User clicks "Save" button
8. Preset saved to localStorage as JSON:
   ```json
   {
     "name": "This Week's Work Reports",
     "filters": {
       "search": "report",
       "priority": "high",
       "tag": "Work",
       "completion": "incomplete",
       "dateFrom": "2025-11-01",
       "dateTo": "2025-11-07"
     }
   }
   ```
9. Modal closes
10. Preset appears in advanced panel under "Saved Filter Presets"
11. Shows as pill: "[This Week's Work Reports] [✕]"

### Flow 8: Applying Saved Preset
1. User returns to page next day
2. All todos visible (no filters)
3. User opens advanced panel
4. User sees saved preset: "This Week's Work Reports"
5. User clicks preset name
6. All filters applied instantly:
   - Search input: "report"
   - Priority dropdown: "High Priority"
   - Tag dropdown: "Work"
   - Completion dropdown: "Incomplete Only"
   - Date From: 2025-11-01
   - Date To: 2025-11-07
7. List shows 2 matching todos
8. All filter controls reflect applied values
9. One-click workflow complete

### Flow 9: Deleting Filter Preset
1. User has 3 saved presets:
   - "This Week's Work Reports"
   - "Personal Tasks"
   - "Urgent Items"
2. User decides "Personal Tasks" preset no longer needed
3. User opens advanced panel
4. User sees preset pill: "[Personal Tasks] [✕]"
5. User clicks ✕ button
6. Confirmation dialog: "Delete preset 'Personal Tasks'?"
7. User clicks "Confirm"
8. Preset removed from localStorage
9. Preset pill disappears from panel
10. Only 2 presets remain
11. Current active filters (if any) unchanged

### Flow 10: Clearing All Filters
1. User has applied:
   - Search: "meeting"
   - Priority: High
   - Tag: Work
   - Date range: This week
2. 3 todos match all criteria
3. "Clear All" button visible (red)
4. User clicks "Clear All"
5. All filters reset instantly:
   - Search input cleared (placeholder visible)
   - Priority: "All Priorities"
   - Tag: "All Tags"
   - Completion: "All Todos"
   - Date inputs cleared
6. All 50 todos return to list
7. "Clear All" and "💾 Save Filter" buttons disappear
8. User sees full unfiltered view

### Flow 11: Filter by Completion Status
1. User wants to review completed tasks
2. User opens advanced panel
3. User clicks "Completion Status" dropdown
4. User selects "Completed Only"
5. List shows only checked todos (15 completed)
6. Uncompleted todos hidden
7. "Completed (15)" section shows all
8. "Overdue (0)" and "Pending (0)" sections empty/hidden
9. User can scroll through completed history

### Flow 12: Searching Subtask Content
1. User has todo: "Client Meeting" with subtask "Send quarterly report"
2. Todo title doesn't contain "report"
3. User searches for "report"
4. "Client Meeting" appears in results (subtask match)
5. Subtask "Send quarterly report" visible in expanded view
6. Match highlighting shows "report" in subtask
7. Demonstrates advanced search across nested content

### Flow 13: Date Range - From Only
1. User wants all todos due after November 10
2. User opens advanced panel
3. User sets "Due Date From": 2025-11-10
4. User leaves "Due Date To" empty
5. List shows all todos with due_date >= 2025-11-10
6. Includes todos due November 10, 11, 12, ... December, next year
7. Excludes todos due before November 10
8. Excludes todos with no due date

### Flow 14: Empty Search Results
1. User searches for "xyzabc" (nonsense term)
2. No todos match
3. List shows empty state:
   - "No todos found matching your filters"
   - Suggestion: "Try adjusting your search or filters"
4. "Clear All" button visible
5. User clicks "Clear All"
6. All todos return

---

## Technical Requirements

### Client-Side Filtering Architecture

#### State Management

```typescript
// Filter state interface
interface FilterState {
  searchQuery: string;
  priority: Priority | 'all';
  tagId: number | null;
  completionStatus: 'all' | 'incomplete' | 'completed';
  dateFrom: string | null; // ISO8601 date
  dateTo: string | null;   // ISO8601 date
}

// Initial filter state
const initialFilterState: FilterState = {
  searchQuery: '',
  priority: 'all',
  tagId: null,
  completionStatus: 'all',
  dateFrom: null,
  dateTo: null,
};

// Saved preset interface
interface FilterPreset {
  id: string; // UUID
  name: string;
  filters: FilterState;
  createdAt: string;
}
```

#### Filtering Functions

```typescript
// lib/filtering.ts

import { TodoWithTags, Subtask } from './db';
import { getSingaporeNow, parseSingaporeDate } from './timezone';

// Main filter function - applies all criteria
export function filterTodos(
  todos: TodoWithTags[],
  filters: FilterState
): TodoWithTags[] {
  let filtered = todos;
  
  // 1. Search filter (title + subtasks)
  if (filters.searchQuery.trim()) {
    filtered = filterBySearch(filtered, filters.searchQuery);
  }
  
  // 2. Priority filter
  if (filters.priority !== 'all') {
    filtered = filtered.filter(todo => todo.priority === filters.priority);
  }
  
  // 3. Tag filter
  if (filters.tagId !== null) {
    filtered = filtered.filter(todo => 
      todo.tags.some(tag => tag.id === filters.tagId)
    );
  }
  
  // 4. Completion filter
  if (filters.completionStatus === 'incomplete') {
    filtered = filtered.filter(todo => todo.completed === 0);
  } else if (filters.completionStatus === 'completed') {
    filtered = filtered.filter(todo => todo.completed === 1);
  }
  
  // 5. Date range filter
  filtered = filterByDateRange(filtered, filters.dateFrom, filters.dateTo);
  
  return filtered;
}

// Search in title and subtasks
export function filterBySearch(
  todos: TodoWithTags[],
  query: string
): TodoWithTags[] {
  const lowerQuery = query.toLowerCase().trim();
  
  return todos.filter(todo => {
    // Check title
    if (todo.title.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Check subtasks
    if (todo.subtasks && todo.subtasks.length > 0) {
      return todo.subtasks.some(subtask =>
        subtask.title.toLowerCase().includes(lowerQuery)
      );
    }
    
    return false;
  });
}

// Date range filtering (Singapore timezone)
export function filterByDateRange(
  todos: TodoWithTags[],
  dateFrom: string | null,
  dateTo: string | null
): TodoWithTags[] {
  if (!dateFrom && !dateTo) return todos;
  
  return todos.filter(todo => {
    if (!todo.due_date) return false; // Exclude todos without due date
    
    const dueDate = parseSingaporeDate(todo.due_date);
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (dueDateOnly < fromDate) return false;
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      if (dueDateOnly > toDate) return false;
    }
    
    return true;
  });
}

// Check if any filters are active
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.searchQuery.trim() !== '' ||
    filters.priority !== 'all' ||
    filters.tagId !== null ||
    filters.completionStatus !== 'all' ||
    filters.dateFrom !== null ||
    filters.dateTo !== null
  );
}

// Clear all filters
export function clearFilters(): FilterState {
  return { ...initialFilterState };
}
```

#### Performance Optimizations

```typescript
// Memoization for expensive operations
import { useMemo } from 'react';

// In component:
const filteredTodos = useMemo(() => {
  return filterTodos(todos, filterState);
}, [todos, filterState]);

// Debounce search input
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

// Usage in search:
const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebounce(searchInput, 150); // 150ms delay

// Update filter state with debounced value
useEffect(() => {
  setFilterState(prev => ({ ...prev, searchQuery: debouncedSearch }));
}, [debouncedSearch]);
```

### LocalStorage for Presets

```typescript
// lib/filterPresets.ts

const PRESETS_KEY = 'todo_filter_presets';

// Load presets from localStorage
export function loadPresets(): FilterPreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    if (!stored) return [];
    
    const presets = JSON.parse(stored);
    if (!Array.isArray(presets)) return [];
    
    return presets;
  } catch (error) {
    console.error('Load presets error:', error);
    return [];
  }
}

// Save presets to localStorage
export function savePresets(presets: FilterPreset[]): void {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch (error) {
    console.error('Save presets error:', error);
  }
}

// Add new preset
export function addPreset(name: string, filters: FilterState): FilterPreset {
  const preset: FilterPreset = {
    id: crypto.randomUUID(),
    name: name.trim(),
    filters: { ...filters },
    createdAt: new Date().toISOString(),
  };
  
  const presets = loadPresets();
  presets.push(preset);
  savePresets(presets);
  
  return preset;
}

// Delete preset by ID
export function deletePreset(id: string): void {
  const presets = loadPresets();
  const filtered = presets.filter(p => p.id !== id);
  savePresets(filtered);
}

// Validate preset name
export function validatePresetName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 50) return null;
  return trimmed;
}
```

### Frontend Components

#### Search Bar Component

```typescript
// components/SearchBar.tsx
import { useState } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const handleClear = () => {
    onChange('');
  };
  
  return (
    <div className="relative w-full mb-4">
      {/* Search icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        🔍
      </div>
      
      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search todos and subtasks..."
        className="w-full pl-10 pr-10 py-3 border rounded-lg text-lg
          dark:bg-gray-700 dark:border-gray-600 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 
            text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
            w-6 h-6 flex items-center justify-center"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
```

#### Quick Filters Component

```typescript
// components/QuickFilters.tsx
import { Priority, Tag } from '@/lib/db';

interface QuickFiltersProps {
  priority: Priority | 'all';
  onPriorityChange: (priority: Priority | 'all') => void;
  tagId: number | null;
  onTagChange: (tagId: number | null) => void;
  tags: Tag[];
}

export function QuickFilters({
  priority,
  onPriorityChange,
  tagId,
  onTagChange,
  tags,
}: QuickFiltersProps) {
  return (
    <div className="flex gap-3 mb-4">
      {/* Priority filter */}
      <select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value as Priority | 'all')}
        className="px-3 py-2 border rounded-lg dark:bg-gray-700 
          dark:border-gray-600 dark:text-white"
      >
        <option value="all">All Priorities</option>
        <option value="high">High Priority</option>
        <option value="medium">Medium Priority</option>
        <option value="low">Low Priority</option>
      </select>
      
      {/* Tag filter (only if tags exist) */}
      {tags.length > 0 && (
        <select
          value={tagId ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            onTagChange(value === '' ? null : parseInt(value, 10));
          }}
          className="px-3 py-2 border rounded-lg dark:bg-gray-700 
            dark:border-gray-600 dark:text-white"
        >
          <option value="">All Tags</option>
          {tags.map(tag => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
```

#### Advanced Filters Panel Component

```typescript
// components/AdvancedFiltersPanel.tsx
import { FilterState, FilterPreset } from '@/lib/filtering';

interface AdvancedFiltersPanelProps {
  isOpen: boolean;
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  presets: FilterPreset[];
  onApplyPreset: (preset: FilterPreset) => void;
  onDeletePreset: (id: string) => void;
}

export function AdvancedFiltersPanel({
  isOpen,
  filters,
  onFiltersChange,
  presets,
  onApplyPreset,
  onDeletePreset,
}: AdvancedFiltersPanelProps) {
  if (!isOpen) return null;
  
  return (
    <div className="border dark:border-gray-700 rounded-lg p-4 mb-4 space-y-4
      bg-gray-50 dark:bg-gray-800">
      {/* Completion Status */}
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-300">
          Completion Status
        </label>
        <select
          value={filters.completionStatus}
          onChange={(e) => onFiltersChange({ 
            completionStatus: e.target.value as 'all' | 'incomplete' | 'completed' 
          })}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
            dark:border-gray-600 dark:text-white"
        >
          <option value="all">All Todos</option>
          <option value="incomplete">Incomplete Only</option>
          <option value="completed">Completed Only</option>
        </select>
      </div>
      
      {/* Date Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Due Date From
          </label>
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) => onFiltersChange({ 
              dateFrom: e.target.value || null 
            })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
              dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Due Date To
          </label>
          <input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) => onFiltersChange({ 
              dateTo: e.target.value || null 
            })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
              dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>
      
      {/* Saved Presets */}
      {presets.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 dark:text-gray-300">
            Saved Filter Presets
          </h4>
          <div className="flex flex-wrap gap-2">
            {presets.map(preset => (
              <div
                key={preset.id}
                className="inline-flex items-center gap-2 px-3 py-1 
                  bg-blue-100 dark:bg-blue-900 rounded-full"
              >
                <button
                  onClick={() => onApplyPreset(preset)}
                  className="text-sm font-medium text-blue-800 
                    dark:text-blue-200 hover:underline"
                >
                  {preset.name}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete preset "${preset.name}"?`)) {
                      onDeletePreset(preset.id);
                    }
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 
                    dark:hover:text-blue-200"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Filter Action Buttons Component

```typescript
// components/FilterActionButtons.tsx
import { FilterState } from '@/lib/filtering';

interface FilterActionButtonsProps {
  hasActiveFilters: boolean;
  onClearAll: () => void;
  onSaveFilter: () => void;
}

export function FilterActionButtons({
  hasActiveFilters,
  onClearAll,
  onSaveFilter,
}: FilterActionButtonsProps) {
  if (!hasActiveFilters) return null;
  
  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={onClearAll}
        className="px-4 py-2 bg-red-500 text-white rounded-lg 
          hover:bg-red-600 font-medium"
      >
        Clear All
      </button>
      
      <button
        onClick={onSaveFilter}
        className="px-4 py-2 bg-green-500 text-white rounded-lg 
          hover:bg-green-600 font-medium"
      >
        💾 Save Filter
      </button>
    </div>
  );
}
```

#### Save Filter Modal Component

```typescript
// components/SaveFilterModal.tsx
import { useState } from 'react';
import { FilterState } from '@/lib/filtering';

interface SaveFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  currentFilters: FilterState;
}

export function SaveFilterModal({
  isOpen,
  onClose,
  onSave,
  currentFilters,
}: SaveFilterModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a preset name');
      return;
    }
    if (trimmed.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }
    
    onSave(trimmed);
    setName('');
    setError('');
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center 
      justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">
          Save Filter Preset
        </h2>
        
        {/* Current filters preview */}
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
          <p className="text-sm font-medium mb-2 dark:text-gray-300">
            Current Filters:
          </p>
          <ul className="text-sm space-y-1 dark:text-gray-400">
            {currentFilters.searchQuery && (
              <li>• Search: "{currentFilters.searchQuery}"</li>
            )}
            {currentFilters.priority !== 'all' && (
              <li>• Priority: {currentFilters.priority}</li>
            )}
            {currentFilters.tagId !== null && (
              <li>• Tag: Selected</li>
            )}
            {currentFilters.completionStatus !== 'all' && (
              <li>• Completion: {currentFilters.completionStatus}</li>
            )}
            {(currentFilters.dateFrom || currentFilters.dateTo) && (
              <li>
                • Date Range: {currentFilters.dateFrom ?? '...'} to {currentFilters.dateTo ?? '...'}
              </li>
            )}
          </ul>
        </div>
        
        {/* Name input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">
            Preset Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., This Week's Work Tasks"
            maxLength={50}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 
              dark:border-gray-600 dark:text-white"
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg 
              hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={() => {
              setName('');
              setError('');
              onClose();
            }}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg 
              hover:bg-gray-400 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Edge Cases

### 1. Search with Special Characters
**Scenario:** User searches for "client's meeting"

**Handling:**
- Apostrophes and punctuation included in search
- Exact string matching (case-insensitive)
- No regex interpretation of special chars
- Query: "client's" finds "client's" but not "clients"

### 2. Empty Search Query (Whitespace Only)
**Scenario:** User types only spaces "   "

**Handling:**
- `query.trim()` removes whitespace
- Empty string after trim = no filter applied
- All todos shown (search effectively cleared)
- No error message needed

### 3. Search with No Results
**Scenario:** User searches "xyzabc123" (nonsense)

**Handling:**
- No todos match
- Empty state displayed: "No todos found matching your filters"
- Suggestion: "Try adjusting your search or filters"
- "Clear All" button remains visible
- Clicking "Clear All" restores full list

### 4. Date Range - From > To (Invalid Range)
**Scenario:** User sets From: 2025-11-10, To: 2025-11-01

**Handling:**
- No validation preventing invalid range
- Filter logic: `dueDate >= From AND dueDate <= To`
- Result: Zero todos match (impossible condition)
- Empty state shown
- User must correct dates manually
- **Future enhancement:** Show warning when From > To

### 5. Date Range with Null Due Dates
**Scenario:** User sets date range, some todos have null due_date

**Handling:**
- Filter explicitly checks `if (!todo.due_date) return false`
- Todos without due dates excluded from results
- Only todos WITH due dates shown
- Expected behavior - undated todos not "due" in range

### 6. Multiple Tags on Todo (Filter Shows Any Match)
**Scenario:** Todo has tags [Work, Urgent], user filters by "Work"

**Handling:**
- Tag filter uses `todo.tags.some(tag => tag.id === filters.tagId)`
- Todo shown if ANY tag matches
- Expected behavior - inclusive filtering
- User sees all todos tagged "Work" regardless of other tags

### 7. Saving Preset with Empty Search
**Scenario:** User has filters: Priority=High, Search=""

**Handling:**
- Preset saves all filter state including empty search
- `filters.searchQuery = ""`
- Applying preset clears search input
- Valid state - priority-only preset

### 8. LocalStorage Full (Quota Exceeded)
**Scenario:** User tries to save preset, localStorage full

**Handling:**
- `localStorage.setItem()` throws QuotaExceededError
- Caught in try-catch block
- Error logged to console
- User sees error message: "Failed to save preset (storage full)"
- Preset not saved
- User must delete old presets or clear storage

### 9. LocalStorage Corrupted JSON
**Scenario:** Manual edit or corruption breaks preset JSON

**Handling:**
- `JSON.parse()` throws error
- Caught in try-catch in `loadPresets()`
- Returns empty array `[]`
- No presets shown
- App doesn't crash
- User can create new presets (overwrites corrupted data)

### 10. Debounced Search with Rapid Typing
**Scenario:** User types "meeting" very quickly

**Handling:**
- Each keystroke updates `searchInput` state
- Debounce delays filter application by 150ms
- Only final value "meeting" triggers filter
- Prevents 7 filter operations (m, me, mee, mee, meet, meeti, meetin, meeting)
- Optimizes performance for large lists
- User sees instant input feedback, brief delay before filter

### 11. Applying Preset Overwrites Current Filters
**Scenario:** User has Search="report", applies preset with Search="meeting"

**Handling:**
- Preset application calls `setFilterState(preset.filters)`
- Completely replaces current state
- Search changes from "report" to "meeting"
- All other filters also overwritten
- Expected behavior - preset is complete filter snapshot
- User can manually adjust after applying

### 12. Filtering Large Todo List (1000+ Items)
**Scenario:** User has 1000 todos, applies filter

**Handling:**
- All filtering is client-side JavaScript
- `filterTodos()` runs synchronously
- With memoization, only recalculates when dependencies change
- Modern browsers handle 1000 array operations instantly (<50ms)
- No pagination needed for filtering
- Performance acceptable up to 5000 todos
- Beyond 5000, consider virtualization (out of scope)

### 13. Date Input Browser Compatibility
**Scenario:** Older browser doesn't support `<input type="date">`

**Handling:**
- Fallback to text input with placeholder "YYYY-MM-DD"
- User must manually type date in correct format
- Validation via regex: `/^\d{4}-\d{2}-\d{2}$/`
- Invalid dates ignored (null)
- Modern browsers (2020+) all support date input
- No polyfill needed for MVP

### 14. Completion Filter with Mixed States
**Scenario:** User filters "Completed Only", edits filter to "All Todos"

**Handling:**
- Dropdown change triggers `onFiltersChange({ completionStatus: 'all' })`
- State updates to 'all'
- Filter re-runs with new state
- Both completed and incomplete todos shown
- Smooth transition, no flash

### 15. Clear All with Preset Still Saved
**Scenario:** User applies preset, clicks "Clear All"

**Handling:**
- "Clear All" resets filterState to initial values
- Preset remains in localStorage (not deleted)
- Preset still available for future application
- Only active filters cleared, not saved presets
- User can re-apply preset anytime

---

## Acceptance Criteria

### Functional Requirements

#### FR1: Real-Time Text Search
- [ ] Search input visible at top of todo list
- [ ] Placeholder: "Search todos and subtasks..."
- [ ] Search icon (🔍) displayed
- [ ] Results update as user types (debounced 150ms)
- [ ] Case-insensitive matching
- [ ] Partial word matching works
- [ ] Searches both todo titles AND subtask titles
- [ ] Clear button (✕) appears when text entered
- [ ] Clicking clear button removes search text
- [ ] All filtering is client-side (no API calls)

#### FR2: Priority Filtering
- [ ] "All Priorities" dropdown visible
- [ ] Options: All Priorities, High, Medium, Low
- [ ] Selecting priority filters list immediately
- [ ] Filter combines with search and other filters
- [ ] "All Priorities" option clears priority filter
- [ ] Selected value persists during session

#### FR3: Tag Filtering
- [ ] "All Tags" dropdown visible if tags exist
- [ ] Dropdown hidden if no tags
- [ ] Lists all user's tags
- [ ] Selecting tag shows only matching todos
- [ ] Filter combines with other criteria
- [ ] "All Tags" option clears tag filter

#### FR4: Advanced Filters Panel
- [ ] "▶ Advanced" toggle button visible
- [ ] Clicking expands panel below quick filters
- [ ] Button text changes to "▼ Advanced"
- [ ] Panel shows: Completion dropdown, Date inputs, Saved presets
- [ ] Clicking again collapses panel
- [ ] Panel state persists during session

#### FR5: Completion Status Filter
- [ ] Dropdown in advanced panel
- [ ] Options: All Todos, Incomplete Only, Completed Only
- [ ] "Incomplete Only" shows unchecked todos
- [ ] "Completed Only" shows checked todos
- [ ] Filter combines with other criteria

#### FR6: Date Range Filtering
- [ ] Two date inputs: "Due Date From", "Due Date To"
- [ ] HTML5 date input (calendar picker)
- [ ] Can use both for range
- [ ] Can use From only (after date)
- [ ] Can use To only (before date)
- [ ] Only shows todos WITH due dates
- [ ] Respects Singapore timezone
- [ ] Filter combines with other criteria

#### FR7: Filter Combination (AND Logic)
- [ ] All active filters use AND logic
- [ ] Todos must match ALL criteria to appear
- [ ] Search + Priority + Tag + Date + Completion all combinable
- [ ] Order doesn't matter (commutative)

#### FR8: Save Filter Preset
- [ ] "💾 Save Filter" button appears when filters active
- [ ] Button opens save modal
- [ ] Modal shows current filter preview
- [ ] Name input required (max 50 chars)
- [ ] "Save" stores to localStorage
- [ ] Preset appears in advanced panel immediately

#### FR9: Apply Saved Preset
- [ ] Presets shown in advanced panel
- [ ] Each preset clickable pill with name
- [ ] Clicking applies all saved filters
- [ ] All controls update to match preset
- [ ] Results update immediately
- [ ] Overwrites current filters

#### FR10: Delete Preset
- [ ] ✕ button next to each preset
- [ ] Clicking prompts confirmation
- [ ] Confirming removes from localStorage
- [ ] Preset disappears from panel
- [ ] Current filters unchanged

#### FR11: Clear All Filters
- [ ] "Clear All" button appears when filters active
- [ ] Red/danger styling
- [ ] Clicking clears ALL filters:
  - Search text
  - Priority to "All"
  - Tag to "All"
  - Completion to "All"
  - Date inputs cleared
- [ ] All todos visible after clear
- [ ] Button disappears when no filters

#### FR12: Visual Feedback
- [ ] Active filter indicators in controls
- [ ] "Clear All" and "Save Filter" buttons only when filters active
- [ ] Empty state when no results
- [ ] Section counts update with filtering
- [ ] Empty sections hidden

### Non-Functional Requirements

#### NFR1: Performance
- [ ] Search debounced 150ms
- [ ] Filtering 1000 todos < 100ms (p95)
- [ ] No server requests for filtering
- [ ] Memoization prevents unnecessary recalculations
- [ ] UI remains responsive during filtering

#### NFR2: Data Persistence
- [ ] Presets persist in localStorage
- [ ] Presets survive page refresh
- [ ] Corrupted localStorage handled gracefully
- [ ] Quota exceeded error handled

#### NFR3: Accessibility
- [ ] Search input keyboard accessible
- [ ] All dropdowns keyboard navigable
- [ ] Clear button has aria-label
- [ ] Date inputs accessible
- [ ] Focus management in modals

#### NFR4: Dark Mode
- [ ] All filter controls styled for dark mode
- [ ] Modals readable in dark mode
- [ ] Buttons have proper dark mode styling
- [ ] Inputs visible in dark mode

#### NFR5: Mobile Responsiveness
- [ ] Search input full-width
- [ ] Quick filters stack on mobile
- [ ] Advanced panel scrolls on small screens
- [ ] Date inputs usable on mobile
- [ ] Buttons sized for touch

---

## Testing Requirements

### E2E Tests (Playwright)

Create `tests/08-search-filtering.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Search & Filtering', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new TestHelper(page, context);
    await helper.setupAuthenticatedSession();
  });

  test('should show search input', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('input[placeholder*="Search todos"]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', 'Search todos and subtasks...');
  });

  test('should search todos by title', async ({ page }) => {
    await page.goto('/');
    
    await helper.createTodo({ title: 'Write report' });
    await helper.createTodo({ title: 'Team meeting' });
    await helper.createTodo({ title: 'Code review' });
    
    await page.reload();
    
    // Search for "report"
    await page.fill('input[placeholder*="Search todos"]', 'report');
    
    // Only "Write report" visible
    await expect(page.locator('text=Write report')).toBeVisible();
    await expect(page.locator('text=Team meeting')).not.toBeVisible();
    await expect(page.locator('text=Code review')).not.toBeVisible();
  });

  test('should search case-insensitively', async ({ page }) => {
    await page.goto('/');
    
    await helper.createTodo({ title: 'MEETING Notes' });
    await page.reload();
    
    // Search lowercase
    await page.fill('input[placeholder*="Search todos"]', 'meeting');
    await expect(page.locator('text=MEETING Notes')).toBeVisible();
    
    // Clear and search uppercase
    await page.fill('input[placeholder*="Search todos"]', '');
    await page.fill('input[placeholder*="Search todos"]', 'NOTES');
    await expect(page.locator('text=MEETING Notes')).toBeVisible();
  });

  test('should search partial matches', async ({ page }) => {
    await page.goto('/');
    
    await helper.createTodo({ title: 'Project Alpha' });
    await page.reload();
    
    await page.fill('input[placeholder*="Search todos"]', 'proj');
    await expect(page.locator('text=Project Alpha')).toBeVisible();
  });

  test('should show clear button when searching', async ({ page }) => {
    await page.goto('/');
    
    const clearButton = page.locator('button[aria-label="Clear search"]');
    
    // Not visible initially
    await expect(clearButton).not.toBeVisible();
    
    // Type in search
    await page.fill('input[placeholder*="Search todos"]', 'test');
    
    // Clear button appears
    await expect(clearButton).toBeVisible();
    
    // Click clear
    await clearButton.click();
    
    // Search cleared
    await expect(page.locator('input[placeholder*="Search todos"]')).toHaveValue('');
    await expect(clearButton).not.toBeVisible();
  });

  test('should search in subtask titles', async ({ page }) => {
    await page.goto('/');
    
    const todo = await helper.createTodo({ title: 'Client Meeting' });
    await helper.createSubtask(todo.id, 'Send quarterly report');
    
    await page.reload();
    
    // Search for "report" (not in todo title)
    await page.fill('input[placeholder*="Search todos"]', 'report');
    
    // Todo appears because subtask matches
    await expect(page.locator('text=Client Meeting')).toBeVisible();
  });

  test('should filter by priority', async ({ page }) => {
    await page.goto('/');
    
    await helper.createTodo({ title: 'High priority task', priority: 'high' });
    await helper.createTodo({ title: 'Medium priority task', priority: 'medium' });
    await helper.createTodo({ title: 'Low priority task', priority: 'low' });
    
    await page.reload();
    
    // Filter by high priority
    await page.selectOption('select:has-text("All Priorities")', 'high');
    
    await expect(page.locator('text=High priority task')).toBeVisible();
    await expect(page.locator('text=Medium priority task')).not.toBeVisible();
    await expect(page.locator('text=Low priority task')).not.toBeVisible();
  });

  test('should filter by tag', async ({ page }) => {
    await page.goto('/');
    
    const workTag = await helper.createTag({ name: 'Work', color: '#3B82F6' });
    const personalTag = await helper.createTag({ name: 'Personal', color: '#22C55E' });
    
    await helper.createTodo({ title: 'Work task', tag_ids: [workTag.id] });
    await helper.createTodo({ title: 'Personal task', tag_ids: [personalTag.id] });
    
    await page.reload();
    
    // Filter by Work tag
    await page.selectOption('select:has-text("All Tags")', workTag.id.toString());
    
    await expect(page.locator('text=Work task')).toBeVisible();
    await expect(page.locator('text=Personal task')).not.toBeVisible();
  });

  test('should combine search and priority filter', async ({ page }) => {
    await page.goto('/');
    
    await helper.createTodo({ title: 'High priority report', priority: 'high' });
    await helper.createTodo({ title: 'Low priority report', priority: 'low' });
    await helper.createTodo({ title: 'High priority meeting', priority: 'high' });
    
    await page.reload();
    
    // Search + priority
    await page.fill('input[placeholder*="Search todos"]', 'report');
    await page.selectOption('select:has-text("All Priorities")', 'high');
    
    // Only high priority reports
    await expect(page.locator('text=High priority report')).toBeVisible();
    await expect(page.locator('text=Low priority report')).not.toBeVisible();
    await expect(page.locator('text=High priority meeting')).not.toBeVisible();
  });

  test('should show Clear All button when filters active', async ({ page }) => {
    await page.goto('/');
    
    const clearAllButton = page.locator('button:has-text("Clear All")');
    
    // Not visible initially
    await expect(clearAllButton).not.toBeVisible();
    
    // Apply filter
    await page.fill('input[placeholder*="Search todos"]', 'test');
    
    // Clear All appears
    await expect(clearAllButton).toBeVisible();
  });

  test('should clear all filters', async ({ page }) => {
    await page.goto('/');
    
    await helper.createTodo({ title: 'Test task', priority: 'high' });
    await page.reload();
    
    // Apply multiple filters
    await page.fill('input[placeholder*="Search todos"]', 'test');
    await page.selectOption('select:has-text("All Priorities")', 'high');
    
    // Click Clear All
    await page.click('button:has-text("Clear All")');
    
    // All filters cleared
    await expect(page.locator('input[placeholder*="Search todos"]')).toHaveValue('');
    await expect(page.locator('select:has-text("All Priorities")')).toHaveValue('all');
    await expect(page.locator('button:has-text("Clear All")')).not.toBeVisible();
  });

  test('should expand advanced filters panel', async ({ page }) => {
    await page.goto('/');
    
    const advancedButton = page.locator('button:has-text("Advanced")');
    
    // Initially shows ▶
    await expect(advancedButton).toContainText('▶');
    
    // Click to expand
    await advancedButton.click();
    
    // Shows ▼ and panel visible
    await expect(advancedButton).toContainText('▼');
    await expect(page.locator('text=Completion Status')).toBeVisible();
    await expect(page.locator('text=Due Date From')).toBeVisible();
  });

  test('should filter by completion status', async ({ page }) => {
    await page.goto('/');
    
    const todo1 = await helper.createTodo({ title: 'Incomplete task' });
    const todo2 = await helper.createTodo({ title: 'Completed task' });
    await helper.completeTodo(todo2.id);
    
    await page.reload();
    
    // Open advanced
    await page.click('button:has-text("Advanced")');
    
    // Filter incomplete only
    await page.selectOption('select >> text=All Todos', 'incomplete');
    
    await expect(page.locator('text=Incomplete task')).toBeVisible();
    await expect(page.locator('text=Completed task')).not.toBeVisible();
  });

  test('should filter by date range', async ({ page }) => {
    await page.goto('/');
    
    await helper.createTodo({ 
      title: 'Task 1', 
      dueDate: '2025-11-01T10:00:00+08:00' 
    });
    await helper.createTodo({ 
      title: 'Task 2', 
      dueDate: '2025-11-05T10:00:00+08:00' 
    });
    await helper.createTodo({ 
      title: 'Task 3', 
      dueDate: '2025-11-10T10:00:00+08:00' 
    });
    
    await page.reload();
    await page.click('button:has-text("Advanced")');
    
    // Set date range
    await page.fill('input[type="date"]', '2025-11-01');
    await page.fill('input[type="date"] >> nth=1', '2025-11-07');
    
    // Only tasks 1 and 2 in range
    await expect(page.locator('text=Task 1')).toBeVisible();
    await expect(page.locator('text=Task 2')).toBeVisible();
    await expect(page.locator('text=Task 3')).not.toBeVisible();
  });

  test('should save filter preset', async ({ page }) => {
    await page.goto('/');
    
    await helper.createTodo({ title: 'Test task', priority: 'high' });
    await page.reload();
    
    // Apply filters
    await page.fill('input[placeholder*="Search todos"]', 'test');
    await page.selectOption('select:has-text("All Priorities")', 'high');
    
    // Click Save Filter
    await page.click('button:has-text("💾 Save Filter")');
    
    // Modal appears
    await expect(page.locator('text=Save Filter Preset')).toBeVisible();
    await expect(page.locator('text=Search: "test"')).toBeVisible();
    
    // Enter name and save
    await page.fill('input[placeholder*="Preset Name"]', 'My Preset');
    await page.click('button:has-text("Save")');
    
    // Modal closes
    await expect(page.locator('text=Save Filter Preset')).not.toBeVisible();
  });

  test('should apply saved preset', async ({ page }) => {
    await page.goto('/');
    
    await helper.createTodo({ title: 'High priority task', priority: 'high' });
    await helper.createTodo({ title: 'Low priority task', priority: 'low' });
    await page.reload();
    
    // Create and save preset
    await page.selectOption('select:has-text("All Priorities")', 'high');
    await page.click('button:has-text("💾 Save Filter")');
    await page.fill('input[placeholder*="Preset Name"]', 'High Priority');
    await page.click('button:has-text("Save")');
    
    // Clear filters
    await page.click('button:has-text("Clear All")');
    
    // All tasks visible
    await expect(page.locator('text=High priority task')).toBeVisible();
    await expect(page.locator('text=Low priority task')).toBeVisible();
    
    // Open advanced and apply preset
    await page.click('button:has-text("Advanced")');
    await page.click('text=High Priority');
    
    // Filter applied
    await expect(page.locator('text=High priority task')).toBeVisible();
    await expect(page.locator('text=Low priority task')).not.toBeVisible();
    await expect(page.locator('select:has-text("All Priorities")')).toHaveValue('high');
  });

  test('should delete filter preset', async ({ page }) => {
    await page.goto('/');
    
    // Save a preset
    await page.fill('input[placeholder*="Search todos"]', 'test');
    await page.click('button:has-text("💾 Save Filter")');
    await page.fill('input[placeholder*="Preset Name"]', 'Test Preset');
    await page.click('button:has-text("Save")');
    
    // Open advanced
    await page.click('button:has-text("Advanced")');
    
    // Preset visible
    await expect(page.locator('text=Test Preset')).toBeVisible();
    
    // Setup dialog handler
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Delete preset');
      await dialog.accept();
    });
    
    // Delete preset
    const deleteButton = page.locator('text=Test Preset').locator('..').locator('button:has-text("✕")');
    await deleteButton.click();
    
    // Preset removed
    await expect(page.locator('text=Test Preset')).not.toBeVisible();
  });

  test('should show empty state when no results', async ({ page }) => {
    await page.goto('/');
    
    await helper.createTodo({ title: 'Test task' });
    await page.reload();
    
    // Search for nonsense
    await page.fill('input[placeholder*="Search todos"]', 'xyzabc123');
    
    // Empty state
    await expect(page.locator('text=No todos found')).toBeVisible();
    await expect(page.locator('text=Test task')).not.toBeVisible();
  });

  test('should persist search during session', async ({ page }) => {
    await page.goto('/');
    
    await helper.createTodo({ title: 'Test task' });
    await page.reload();
    
    // Search
    await page.fill('input[placeholder*="Search todos"]', 'test');
    await expect(page.locator('text=Test task')).toBeVisible();
    
    // Reload page (session continues)
    await page.reload();
    
    // Search cleared (state not persisted across reloads for MVP)
    await expect(page.locator('input[placeholder*="Search todos"]')).toHaveValue('');
  });
});
```

### Unit Tests

Create `tests/unit/filtering.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  filterTodos,
  filterBySearch,
  filterByDateRange,
  hasActiveFilters,
  clearFilters,
  FilterState,
  initialFilterState,
} from '@/lib/filtering';
import { TodoWithTags } from '@/lib/db';

describe('Search Filtering', () => {
  const mockTodos: TodoWithTags[] = [
    {
      id: 1,
      title: 'Write monthly report',
      completed: 0,
      priority: 'high',
      tags: [],
      subtasks: [],
    },
    {
      id: 2,
      title: 'Team meeting',
      completed: 0,
      priority: 'medium',
      tags: [],
      subtasks: [{ id: 10, title: 'Prepare report slides', completed: 0 }],
    },
    {
      id: 3,
      title: 'Code review',
      completed: 1,
      priority: 'low',
      tags: [],
      subtasks: [],
    },
  ] as TodoWithTags[];

  it('should filter by title search', () => {
    const results = filterBySearch(mockTodos, 'report');
    
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('Write monthly report');
    expect(results[1].title).toBe('Team meeting'); // Subtask match
  });

  it('should filter case-insensitively', () => {
    const results = filterBySearch(mockTodos, 'REPORT');
    expect(results).toHaveLength(2);
  });

  it('should filter partial matches', () => {
    const results = filterBySearch(mockTodos, 'meet');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Team meeting');
  });

  it('should filter in subtask titles', () => {
    const results = filterBySearch(mockTodos, 'slides');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Team meeting');
  });

  it('should return all todos for empty search', () => {
    const results = filterBySearch(mockTodos, '');
    expect(results).toHaveLength(3);
  });

  it('should return empty for no matches', () => {
    const results = filterBySearch(mockTodos, 'xyzabc');
    expect(results).toHaveLength(0);
  });
});

describe('Priority Filtering', () => {
  const mockTodos: TodoWithTags[] = [
    { id: 1, title: 'Task 1', priority: 'high', tags: [] },
    { id: 2, title: 'Task 2', priority: 'medium', tags: [] },
    { id: 3, title: 'Task 3', priority: 'low', tags: [] },
  ] as TodoWithTags[];

  it('should filter by priority', () => {
    const filters: FilterState = {
      ...initialFilterState,
      priority: 'high',
    };
    
    const results = filterTodos(mockTodos, filters);
    expect(results).toHaveLength(1);
    expect(results[0].priority).toBe('high');
  });

  it('should show all for priority=all', () => {
    const filters: FilterState = {
      ...initialFilterState,
      priority: 'all',
    };
    
    const results = filterTodos(mockTodos, filters);
    expect(results).toHaveLength(3);
  });
});

describe('Date Range Filtering', () => {
  const mockTodos: TodoWithTags[] = [
    { id: 1, title: 'Task 1', due_date: '2025-11-01T10:00:00+08:00', tags: [] },
    { id: 2, title: 'Task 2', due_date: '2025-11-05T10:00:00+08:00', tags: [] },
    { id: 3, title: 'Task 3', due_date: '2025-11-10T10:00:00+08:00', tags: [] },
    { id: 4, title: 'Task 4', due_date: null, tags: [] },
  ] as TodoWithTags[];

  it('should filter by date range', () => {
    const results = filterByDateRange(mockTodos, '2025-11-01', '2025-11-07');
    
    expect(results).toHaveLength(2);
    expect(results.map(t => t.id)).toEqual([1, 2]);
  });

  it('should filter from date only', () => {
    const results = filterByDateRange(mockTodos, '2025-11-05', null);
    expect(results).toHaveLength(2);
    expect(results.map(t => t.id)).toEqual([2, 3]);
  });

  it('should filter to date only', () => {
    const results = filterByDateRange(mockTodos, null, '2025-11-05');
    expect(results).toHaveLength(2);
    expect(results.map(t => t.id)).toEqual([1, 2]);
  });

  it('should exclude null due dates', () => {
    const results = filterByDateRange(mockTodos, '2025-11-01', '2025-11-30');
    expect(results).toHaveLength(3);
    expect(results.every(t => t.due_date !== null)).toBe(true);
  });

  it('should return all if no date filters', () => {
    const results = filterByDateRange(mockTodos, null, null);
    expect(results).toHaveLength(4);
  });
});

describe('Combined Filtering', () => {
  const mockTodos: TodoWithTags[] = [
    {
      id: 1,
      title: 'High priority report',
      priority: 'high',
      completed: 0,
      due_date: '2025-11-05T10:00:00+08:00',
      tags: [{ id: 1, name: 'Work', color: '#3B82F6' }],
      subtasks: [],
    },
    {
      id: 2,
      title: 'Low priority report',
      priority: 'low',
      completed: 0,
      due_date: '2025-11-05T10:00:00+08:00',
      tags: [{ id: 1, name: 'Work', color: '#3B82F6' }],
      subtasks: [],
    },
    {
      id: 3,
      title: 'High priority meeting',
      priority: 'high',
      completed: 1,
      due_date: '2025-11-05T10:00:00+08:00',
      tags: [{ id: 2, name: 'Personal', color: '#22C55E' }],
      subtasks: [],
    },
  ] as TodoWithTags[];

  it('should combine search and priority', () => {
    const filters: FilterState = {
      ...initialFilterState,
      searchQuery: 'report',
      priority: 'high',
    };
    
    const results = filterTodos(mockTodos, filters);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(1);
  });

  it('should combine all filters (AND logic)', () => {
    const filters: FilterState = {
      searchQuery: 'report',
      priority: 'high',
      tagId: 1,
      completionStatus: 'incomplete',
      dateFrom: '2025-11-01',
      dateTo: '2025-11-07',
    };
    
    const results = filterTodos(mockTodos, filters);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(1);
  });

  it('should return empty if no matches all criteria', () => {
    const filters: FilterState = {
      ...initialFilterState,
      searchQuery: 'meeting',
      priority: 'low',
    };
    
    const results = filterTodos(mockTodos, filters);
    expect(results).toHaveLength(0);
  });
});

describe('Filter State Helpers', () => {
  it('should detect active filters', () => {
    expect(hasActiveFilters(initialFilterState)).toBe(false);
    
    expect(hasActiveFilters({
      ...initialFilterState,
      searchQuery: 'test',
    })).toBe(true);
    
    expect(hasActiveFilters({
      ...initialFilterState,
      priority: 'high',
    })).toBe(true);
  });

  it('should clear all filters', () => {
    const activeFilters: FilterState = {
      searchQuery: 'test',
      priority: 'high',
      tagId: 1,
      completionStatus: 'completed',
      dateFrom: '2025-11-01',
      dateTo: '2025-11-07',
    };
    
    const cleared = clearFilters();
    expect(cleared).toEqual(initialFilterState);
  });
});
```

---

## Out of Scope

The following features are **explicitly excluded** from this implementation:

### 1. Server-Side Filtering/Pagination
- Backend API filtering endpoints
- Database query filtering
- Paginated results from server
- **Reason:** Client-side filtering sufficient for MVP, simpler architecture

### 2. Full-Text Search with Ranking
- Relevance scoring
- TF-IDF or BM25 algorithms
- Search result ranking
- **Reason:** Simple substring matching adequate for todo lists

### 3. Search Syntax (Advanced Queries)
- Boolean operators (AND, OR, NOT)
- Field-specific search (`title:report`)
- Wildcards and regex patterns
- **Reason:** Over-engineering for task management

### 4. Fuzzy Search
- Typo tolerance
- Phonetic matching
- Edit distance algorithms
- **Reason:** Exact substring matching sufficient

### 5. Filter History
- Recent filter combinations
- Undo/redo filter changes
- Filter state stack
- **Reason:** Saved presets cover this use case

### 6. Global Saved Presets (Cloud Sync)
- Server-stored filter presets
- Sync across devices
- Share presets with users
- **Reason:** LocalStorage sufficient for single-user app

### 7. Smart Filters
- Auto-generated filters (e.g., "Due soon")
- Recommended filter combinations
- AI-suggested searches
- **Reason:** Out of scope for MVP

### 8. Filter Analytics
- Most-used filters report
- Search query analytics
- Filter performance metrics
- **Reason:** Analytics not required

### 9. Advanced Date Filtering
- Relative dates ("Next 7 days", "This month")
- Natural language dates ("tomorrow", "next week")
- Calendar widget for range selection
- **Reason:** HTML5 date input sufficient

### 10. Export Filtered Results
- Export current filtered view to CSV
- Print filtered todos
- Share filtered view URL
- **Reason:** General export (PRP-09) covers full export

---

## Success Metrics

### User Engagement
- **Target:** 70% of users use search at least once per week
- **Target:** 40% of users save at least 1 filter preset
- **Target:** Average 2-3 saved presets per active user

### Feature Usage
- **Target:** Search used 5+ times per session for power users
- **Target:** Advanced filters used 30% of sessions
- **Target:** Multi-criteria filtering (3+ filters) used 15% of time

### Performance
- **Target:** Search response time < 100ms for 1000 todos (p95)
- **Target:** Filter application < 50ms (client-side)
- **Target:** No perceived lag during typing (150ms debounce)
- **Target:** Zero server requests for filtering operations

### User Satisfaction
- **Target:** < 5% requests for server-side pagination
- **Target:** Zero complaints about search performance
- **Target:** Saved presets reduce repetitive filtering by 60%

### Technical Quality
- **Target:** 100% E2E test pass rate (20 test cases)
- **Target:** 100% unit test coverage for filtering logic
- **Target:** All acceptance criteria validated
- **Target:** Supports 5000+ todos without performance degradation

---

## Implementation Notes

### Development Order
1. **Phase 1: Core Filtering Logic**
   - Create `lib/filtering.ts` with filter functions
   - Implement `filterBySearch()`, `filterByDateRange()`
   - Write unit tests for all filter functions
   - Test with large datasets (1000+ items)

2. **Phase 2: Search UI**
   - Build SearchBar component
   - Add debounce hook
   - Implement clear button
   - Test real-time search

3. **Phase 3: Quick Filters**
   - Build QuickFilters component
   - Add priority dropdown
   - Add tag dropdown (integrate PRP-06)
   - Test filter combination

4. **Phase 4: Advanced Filters**
   - Build AdvancedFiltersPanel component
   - Add completion status dropdown
   - Add date range inputs
   - Implement toggle expand/collapse

5. **Phase 5: Filter Presets**
   - Create localStorage helpers
   - Build SaveFilterModal component
   - Implement preset apply/delete
   - Test persistence

6. **Phase 6: Filter Actions**
   - Build FilterActionButtons component
   - Implement "Clear All" functionality
   - Implement "Save Filter" workflow
   - Add visual indicators

7. **Phase 7: Integration**
   - Integrate all components in main page
   - Connect to todo state
   - Test memoization performance
   - Dark mode styling

8. **Phase 8: Testing**
   - Write E2E tests (20 test cases)
   - Performance testing with large datasets
   - Cross-browser testing
   - Mobile responsiveness testing

### Dependencies
- **Requires:** PRP-01 (Todo CRUD) - todo data, todo list display
- **Requires:** PRP-02 (Priority) - priority field for filtering
- **Requires:** PRP-05 (Subtasks) - subtask search functionality
- **Requires:** PRP-06 (Tags) - tag filtering integration
- **Enhances:** All features - makes finding todos easier

### Performance Considerations
- **Debounce search:** 150ms delay prevents excessive filtering
- **Memoization:** `useMemo` prevents recalculation unless dependencies change
- **Client-side only:** Zero network requests for filtering
- **Efficient algorithms:** O(n) filtering, acceptable for 5000+ todos
- **Virtual scrolling:** Not needed for MVP, consider if >5000 todos

### Browser Compatibility
- **Modern browsers (2020+):** Full support (Chrome, Firefox, Safari, Edge)
- **HTML5 date input:** Supported in all modern browsers
- **LocalStorage:** Supported universally (5-10MB quota)
- **No polyfills needed:** ES6+ features widely supported

---

**Feature Owner:** AI Development Team  
**Last Updated:** February 5, 2026  
**Status:** Ready for Implementation
