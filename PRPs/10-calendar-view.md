# PRP 10: Calendar View

## Feature Overview

A monthly calendar view that visualizes todos by their due dates, providing a bird's-eye view of upcoming tasks and scheduling. The calendar displays a grid of days with color-coded todo indicators based on priority, integrates Singapore public holidays, and supports month-by-month navigation. Accessible via a dedicated `/calendar` route.

---

## User Stories

1. **As a user**, I want to see my todos on a monthly calendar so that I can visualize my schedule and workload at a glance.
2. **As a user**, I want todos displayed on their due dates so that I can see what's coming up each day.
3. **As a user**, I want todos color-coded by priority on the calendar so that I can quickly identify urgent tasks.
4. **As a user**, I want to navigate between months so that I can plan ahead or review past tasks.
5. **As a user**, I want to see Singapore public holidays on the calendar so that I can plan around non-working days.
6. **As a user**, I want a quick way to switch between list view and calendar view so that I can use the best view for my current need.

---

## User Flow

### Accessing Calendar View
1. User clicks **"Calendar"** button (purple, in top navigation area) from the main page
2. Browser navigates to `/calendar`
3. Calendar displays the current month with todos on their due dates

### Viewing Todos on Calendar
1. Calendar shows a grid of days for the current month
2. Each day cell shows:
   - Day number
   - Todo titles for that date (truncated if many)
   - Color-coded by priority (🔴 High = red, 🟡 Medium = yellow, 🔵 Low = blue)
3. Multiple todos on the same date stack vertically in the cell
4. Today's date is visually highlighted

### Navigating Months
1. **Previous month**: Click **◀** button
2. **Next month**: Click **▶** button
3. **Current month/year**: Displayed between navigation buttons (e.g., "November 2025")
4. **Today**: Optional button to jump back to the current month

### Viewing Public Holidays
1. Singapore public holidays are pre-seeded in the `holidays` table
2. Holiday dates display with special styling (e.g., different background color, holiday name)
3. Helps users plan around non-working days

### Returning to List View
1. User clicks browser back button, or
2. User navigates to home page (`/`) via navigation link
3. Returns to the full todo list view

---

## Technical Requirements

### Database Schema (Holidays)

```sql
CREATE TABLE holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date TEXT NOT NULL,          -- 'YYYY-MM-DD' format
  country TEXT DEFAULT 'SG',   -- Country code
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Key points:**
- Holidays are seeded via `scripts/seed-holidays.ts`
- Pre-populated with Singapore public holidays
- Date stored as `YYYY-MM-DD` string in Singapore timezone

### TypeScript Interfaces

```typescript
interface Holiday {
  id: number;
  name: string;
  date: string;      // 'YYYY-MM-DD'
  country: string;
  created_at: string;
}

interface CalendarDay {
  date: string;            // 'YYYY-MM-DD'
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  todos: Todo[];
  holiday: Holiday | null;
}
```

### API Endpoints

#### `GET /api/calendar?month=YYYY-MM`
- **Auth**: Required (session cookie)
- **Query Params**: `month` — format `YYYY-MM` (e.g., `2025-11`)
- **Response**: `200 OK` →
  ```json
  {
    "todos": [/* todos with due dates in this month */],
    "holidays": [/* holidays in this month */]
  }
  ```
- **Behavior**:
  - Returns all todos for `session.userId` with `due_date` in the specified month
  - Returns all holidays with `date` in the specified month
  - If no `month` param, defaults to current month (Singapore timezone)

#### `GET /api/holidays`
- **Auth**: Required
- **Query Params**: `month` (optional, `YYYY-MM`)
- **Response**: `200 OK` → `Holiday[]`
- **Behavior**: Returns holidays for the specified month or all holidays

### Database Operations (lib/db.ts)

```typescript
// All operations are SYNCHRONOUS (better-sqlite3)
const holidayDB = {
  getByMonth(month: string): Holiday[],  // month format: 'YYYY-MM'
  getAll(): Holiday[],
  create(name: string, date: string, country: string): Holiday,
};

// Todo query for calendar
const todoDB = {
  // Existing method, but filter by month:
  getByMonth(userId: number, month: string): Todo[],
  // Uses: WHERE due_date LIKE 'YYYY-MM%' AND user_id = ?
};
```

### Page Component

```typescript
// app/calendar/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSingaporeNow } from '@/lib/timezone';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = getSingaporeNow();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [todos, setTodos] = useState<Todo[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    fetchCalendarData(currentMonth);
  }, [currentMonth]);

  // ... calendar grid rendering
}
```

### Calendar Grid Generation

```typescript
function generateCalendarDays(month: string, todos: Todo[], holidays: Holiday[]): CalendarDay[] {
  const [year, monthNum] = month.split('-').map(Number);
  const firstDay = new Date(year, monthNum - 1, 1);
  const lastDay = new Date(year, monthNum, 0);
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

  const days: CalendarDay[] = [];

  // Fill leading days from previous month
  for (let i = 0; i < startDayOfWeek; i++) {
    const date = new Date(year, monthNum - 1, -startDayOfWeek + i + 1);
    days.push({
      date: formatDate(date),
      dayNumber: date.getDate(),
      isCurrentMonth: false,
      isToday: false,
      todos: [],
      holiday: null,
    });
  }

  // Fill current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const todayStr = formatDate(getSingaporeNow());
    days.push({
      date: dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      todos: todos.filter(t => t.due_date?.startsWith(dateStr)),
      holiday: holidays.find(h => h.date === dateStr) || null,
    });
  }

  // Fill trailing days from next month
  const remainingCells = 42 - days.length; // 6 rows × 7 days
  for (let i = 1; i <= remainingCells; i++) {
    const date = new Date(year, monthNum, i);
    days.push({
      date: formatDate(date),
      dayNumber: i,
      isCurrentMonth: false,
      isToday: false,
      todos: [],
      holiday: null,
    });
  }

  return days;
}
```

### Timezone Handling

```typescript
import { getSingaporeNow, formatSingaporeDate } from '@/lib/timezone';

// Default to current month in Singapore timezone
const now = getSingaporeNow();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

// Holiday dates stored in Singapore timezone
// Todo due_date comparisons use Singapore date portion
```

### Route Protection

The `/calendar` route is protected by middleware (`middleware.ts`), same as the main `/` page. Unauthenticated users are redirected to the login page.

---

## UI Components

### Calendar Navigation Header
- **Previous month button**: ◀ (left arrow)
- **Month/Year display**: e.g., "November 2025" (centered, bold)
- **Next month button**: ▶ (right arrow)
- Optional **"Today"** button to jump to current month

### Day-of-Week Header Row
- 7 columns: Sun | Mon | Tue | Wed | Thu | Fri | Sat
- Fixed header above the calendar grid

### Calendar Grid
- 6 rows × 7 columns = 42 cells
- Each cell contains:
  - **Day number** (top-left, bold for current month, dimmed for adjacent months)
  - **Holiday name** (if applicable, special styling)
  - **Todo items** (color-coded by priority, truncated titles)
- **Today**: Highlighted with special border or background color
- **Adjacent month days**: Dimmed/grayed out

### Todo Display in Cells
- Small colored indicators or pills:
  - 🔴 Red background for High priority
  - 🟡 Yellow background for Medium priority
  - 🔵 Blue background for Low priority
- Truncated title text (e.g., "Weekly team..." for narrow cells)
- Multiple todos stack vertically

### Holiday Display
- Holiday name shown in the cell
- Special background color (e.g., light green or light red)
- Positioned below or above todo items

### Navigation Link
- **"Calendar"** button (purple) on main page links to `/calendar`
- **Back to list**: Standard browser navigation or link back to `/`

### Responsive Design
- Grid adapts to screen width
- Cell content truncates on small screens
- Mobile-friendly touch targets for navigation

---

## Edge Cases

1. **Month with no todos**: Calendar shows empty grid (no todo indicators)
2. **Day with many todos**: Stack vertically; consider overflow handling (scroll or "+X more")
3. **Todo without due date**: Not shown on calendar (only due-dated todos appear)
4. **Holiday on same day as todos**: Both displayed in the cell
5. **February leap year**: Calendar grid correctly handles 28/29 days
6. **Month boundary**: Leading/trailing days from adjacent months shown dimmed
7. **Timezone edge cases**: Todos created near midnight may appear on adjacent days — use Singapore timezone consistently
8. **No holidays seeded**: Calendar works without holidays; holiday display simply empty
9. **Large number of months navigated**: No limits on navigation; fetches data per month
10. **Session expiry on calendar page**: Middleware redirects to login; calendar route is protected
11. **Completed todos on calendar**: Still displayed (showing what was due, regardless of completion)

---

## Acceptance Criteria

- [ ] Calendar page accessible at `/calendar` route
- [ ] `/calendar` route protected by authentication middleware
- [ ] Calendar displays current month by default (Singapore timezone)
- [ ] Month/year header shows correct month name and year
- [ ] Previous (◀) and Next (▶) buttons navigate months correctly
- [ ] Calendar grid shows 6 rows × 7 columns with correct day numbers
- [ ] Today's date is visually highlighted
- [ ] Adjacent month days are dimmed/grayed out
- [ ] Todos appear on their due date cells
- [ ] Todos color-coded by priority (red/yellow/blue)
- [ ] Multiple todos on same date stack vertically
- [ ] Only todos with due dates appear on calendar
- [ ] Singapore public holidays displayed with special styling
- [ ] Holiday names shown in date cells
- [ ] Navigation from main page to calendar works
- [ ] Navigation back to main page works
- [ ] Calendar data refreshes when month changes
- [ ] Dark mode supported for calendar view
- [ ] All calendar data operations require authentication

---

## Testing Requirements

### E2E Tests (Playwright)

```typescript
// tests/10-calendar.spec.ts

test('should navigate to calendar view', async ({ page }) => {
  // Click Calendar button, verify /calendar URL and calendar grid
});

test('should display current month', async ({ page }) => {
  // Navigate to calendar, verify month/year header matches today
});

test('should navigate to previous month', async ({ page }) => {
  // Click ◀, verify month changes correctly
});

test('should navigate to next month', async ({ page }) => {
  // Click ▶, verify month changes correctly
});

test('should display todos on due dates', async ({ page }) => {
  // Create todo with due date, navigate to calendar, verify todo on correct date
});

test('should color-code todos by priority', async ({ page }) => {
  // Create high/medium/low priority todos, verify colors on calendar
});

test('should highlight today', async ({ page }) => {
  // Navigate to current month, verify today has special styling
});

test('should display holidays', async ({ page }) => {
  // Seed holidays, navigate to month with holiday, verify display
});

test('should show multiple todos on same date', async ({ page }) => {
  // Create multiple todos with same due date, verify all shown
});

test('should navigate back to list view', async ({ page }) => {
  // From calendar, navigate back, verify list view loads
});

test('should require authentication', async ({ page }) => {
  // Access /calendar without login, verify redirect to login
});
```

### Holiday Seeding for Tests

```bash
# Seed Singapore public holidays before running calendar tests
npx tsx scripts/seed-holidays.ts
```

---

## Out of Scope

- Weekly or daily calendar views (monthly only)
- Drag-and-drop to reschedule todos on calendar
- Creating todos directly from calendar cells
- Calendar events sync with Google Calendar or iCal
- Multi-month or year views
- Week number display
- Customizable week start day (fixed to Sunday)
- Calendar printing or PDF export
- Recurring todo instance display across multiple months
- Calendar sharing between users
- Todo detail popup on calendar click

---

## Success Metrics

- Calendar page loads in < 1 second with up to 100 todos in a month
- Month navigation is instant (no visible loading delay)
- Todos correctly placed on their due date cells
- Priority color coding matches list view colors
- Holiday display is accurate for Singapore public holidays
- Calendar grid renders correctly for all months (including February edge cases)
- Navigation between calendar and list view is seamless
- Dark mode renders calendar with proper contrast and readability
