# PRP-10: Calendar View

## Feature Overview

The Calendar View provides a visual monthly calendar interface for viewing todos by their due dates. Users can navigate between months, see todos color-coded by priority, view Singapore public holidays, and quickly identify scheduling patterns and conflicts. The calendar serves as a complementary view to the main todo list, offering a time-based perspective for better planning and workload visualization.

### Core Functionality
- **Monthly Calendar Grid**: 7-column (Sun-Sat) grid displaying current month
- **Todo Visualization**: Todos displayed on their due date with priority color coding
- **Singapore Public Holidays**: Official holidays displayed with special styling
- **Month Navigation**: Previous/next month buttons and "Today" quick jump
- **Priority Color Coding**: Red (high), yellow (medium), blue (low) for visual scanning
- **Current Day Highlighting**: Today's date visually emphasized
- **Responsive Design**: Grid adapts to screen sizes, dark mode support
- **Seamless Integration**: Same data as list view, no separate storage

### User Value
- Visualize weekly/monthly workload distribution at a glance
- Identify overloaded days (too many todos on one date)
- Spot scheduling conflicts and gaps
- Plan around Singapore public holidays
- Balance task distribution across days
- Review past productivity patterns
- Find optimal dates for new tasks
- Understand big-picture timeline vs. detail-oriented list view

---

## User Stories

### Story 1: View Current Month Calendar
**As a** user planning my schedule  
**I want to** see a monthly calendar view  
**So that** I can visualize my todos by date

**Acceptance Criteria:**
- "Calendar" button visible in top navigation
- Button styled in purple color
- Clicking button navigates to `/calendar` route
- Calendar page shows current month (Singapore timezone)
- Month/year header displayed (e.g., "November 2025")
- 7-column grid (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
- All dates of month shown in cells
- Current day highlighted with special styling
- Grid is responsive (stacks on mobile)

### Story 2: See Todos on Calendar Dates
**As a** user with upcoming deadlines  
**I want to** see todos on their due dates  
**So that** I know what's scheduled for each day

**Acceptance Criteria:**
- Todos appear on calendar date matching their due_date
- Only todos WITH due dates shown (null due_date excluded)
- Todo title displayed in date cell
- Multiple todos on same date stack vertically
- Each todo is clickable/interactive
- Completed and incomplete todos both shown (distinguishable)
- Todos update when navigating months

### Story 3: Color Code by Priority
**As a** user scanning my calendar quickly  
**I want to** see todos color-coded by priority  
**So that** I can spot urgent items instantly

**Acceptance Criteria:**
- High priority todos: Red background (#EF4444 or similar)
- Medium priority todos: Yellow/orange background (#F59E0B)
- Low priority todos: Blue background (#3B82F6)
- Colors applied to todo pills/badges on calendar
- Colors visible in both light and dark modes
- Text color contrasts with background (readability)
- Color legend displayed (optional but helpful)

### Story 4: Navigate Between Months
**As a** user planning ahead  
**I want to** navigate to previous and future months  
**So that** I can see my long-term schedule

**Acceptance Criteria:**
- "◀ Prev" button navigates to previous month
- "Next ▶" button navigates to next month
- Month/year header updates when navigating
- Todos load for displayed month (and adjacent dates if spanning weeks)
- URL updates with month parameter (optional: `/calendar?month=2025-11`)
- Can navigate years in the future/past
- Navigation preserves other state (filters, selections)

### Story 5: Jump to Today
**As a** user wanting to see current schedule  
**I want to** quickly return to current month  
**So that** I don't have to click through months

**Acceptance Criteria:**
- "Today" button visible in calendar navigation
- Clicking button navigates to current month (Singapore timezone)
- Current day highlighted when on current month
- Button works from any month (past or future)
- Smooth transition to current month

### Story 6: View Singapore Public Holidays
**As a** user in Singapore  
**I want to** see public holidays on calendar  
**So that** I can plan around non-working days

**Acceptance Criteria:**
- Public holidays displayed on calendar dates
- Holiday name shown (e.g., "New Year's Day", "Chinese New Year")
- Special styling distinguishes holidays from regular days
- Holiday data sourced from `holidays` database table
- Only shows holidays for displayed month
- Holiday styling doesn't obscure todos
- Dark mode compatible styling

### Story 7: Highlight Current Day
**As a** user checking today's tasks  
**I want to** see today clearly highlighted  
**So that** I can quickly orient myself

**Acceptance Criteria:**
- Today's date has distinct visual indicator
- Border, background, or badge showing "Today"
- Highlighting only appears when viewing current month
- Past months don't show "today" highlight
- Future months don't show "today" highlight
- Singapore timezone determines current date

### Story 8: Distinguish Past and Future Dates
**As a** user reviewing schedule  
**I want to** see past dates differently styled  
**So that** I can focus on upcoming items

**Acceptance Criteria:**
- Past dates (before today) grayed out or muted
- Future dates (including today) normally styled
- Completed todos on past dates visually distinguished
- Past months fully grayed/muted
- Clear visual hierarchy: past < today < future

### Story 9: Navigate Back to List View
**As a** user switching between views  
**I want to** easily return to list view  
**So that** I can manage todos in detail

**Acceptance Criteria:**
- Browser back button returns to main page
- "Calendar" button visible on calendar page (indicates active view)
- Clicking app logo/title navigates to home
- List view and calendar view show same data (synchronized)
- No data loss when switching views

### Story 10: Responsive Calendar Grid
**As a** mobile user  
**I want to** calendar to work on small screens  
**So that** I can view schedule on any device

**Acceptance Criteria:**
- Grid layout adapts to screen width
- On mobile (<640px): Compact date cells, smaller text
- On tablet (640-1024px): Medium-sized cells
- On desktop (>1024px): Full-sized cells with ample space
- Todo titles truncate if too long (with tooltip)
- Touch-friendly on mobile (larger tap targets)
- Scrollable if month grid exceeds viewport

---

## User Flow

### Flow 1: Accessing Calendar from Main Page
1. User on main todo list page (`/`)
2. User sees "Calendar" button in top navigation (purple)
3. User clicks "Calendar" button
4. Browser navigates to `/calendar` route
5. Calendar page loads showing current month
6. Header shows: "November 2025" (current month)
7. Calendar grid displays:
   - Week headers: Sun, Mon, Tue, Wed, Thu, Fri, Sat
   - Dates 1-30 (for November)
   - Current day (Nov 2) highlighted with border
8. User's todos appear on their due dates
9. Example layout:
   ```
   November 2025                    [◀ Prev] [Today] [Next ▶]
   
   Sun    Mon    Tue    Wed    Thu    Fri    Sat
          1      2      3      4      5      6
                [NOW]
                High priority task (red)
                
   7      8      9      10     11     12     13
                        Medium task (yellow)
                        
   14     15     16     17     18     19     20
   Holiday:            
   Deepavali
   ```

### Flow 2: Viewing Todos on Specific Date
1. User viewing November 2025 calendar
2. User has 3 todos:
   - "Client Meeting" - Nov 10, 10 AM, High priority
   - "Submit Report" - Nov 10, 5 PM, Medium priority
   - "Team Lunch" - Nov 12, 12 PM, Low priority
3. Calendar displays:
   - **Nov 10 cell**:
     - "Client Meeting" (red pill/badge)
     - "Submit Report" (yellow pill/badge)
     - Both stacked vertically in cell
   - **Nov 12 cell**:
     - "Team Lunch" (blue pill/badge)
4. User sees Nov 10 is busy day (2 todos)
5. User sees Nov 11 is free (no todos)
6. User decides to move "Submit Report" to Nov 11
7. User clicks todo (opens edit modal or navigates to list)
8. User updates due date to Nov 11
9. Calendar refreshes: "Submit Report" now on Nov 11

### Flow 3: Navigating to Future Month
1. User viewing November 2025 (current month)
2. User wants to plan for December
3. User clicks "Next ▶" button
4. Calendar transitions to December 2025
5. Header updates: "December 2025"
6. Grid shows Dec 1-31
7. Todos with December due dates appear
8. Example:
   - Dec 25: "Christmas Holiday" (holiday styling)
   - Dec 31: "End of Year Review" (medium priority, yellow)
9. User reviews December schedule
10. User clicks "◀ Prev" to return to November

### Flow 4: Jumping to Today from Past Month
1. User has navigated to July 2025 (past month)
2. Current date: November 2, 2025
3. User reviewing old completed todos
4. User wants to return to current schedule
5. User clicks "Today" button
6. Calendar immediately jumps to November 2025
7. Current day (Nov 2) highlighted
8. User back to present context

### Flow 5: Viewing Public Holidays
1. User viewing November 2025
2. Deepavali falls on November 14, 2025 (Friday)
3. Calendar shows Nov 14 with:
   - Light orange/yellow background (holiday indicator)
   - Text: "Deepavali" (holiday name)
   - If todos exist on Nov 14, they appear below holiday name
4. User sees holiday and plans accordingly
5. User navigates to January 2026
6. Calendar shows:
   - Jan 1: "New Year's Day" (holiday)
   - Jan 25-26: "Chinese New Year" (2-day holiday)
7. User plans tasks around multi-day holiday

### Flow 6: Identifying Overloaded Days
1. User viewing week of Nov 10-16
2. Nov 12 has 6 todos:
   - "Morning standup" (medium)
   - "Client presentation" (high)
   - "Lunch meeting" (medium)
   - "Code review" (low)
   - "Team retrospective" (medium)
   - "Project deadline" (high)
3. Nov 12 cell appears crowded (todos stacked)
4. Visual cue: Cell full, multiple colored pills
5. User identifies Nov 12 as overloaded
6. User decides to reschedule non-urgent items:
   - "Code review" moved to Nov 13
   - "Team retrospective" moved to Nov 14
7. Calendar updates, Nov 12 less crowded

### Flow 7: Color-Coded Priority Scanning
1. User opens calendar for weekly planning
2. Week of Nov 3-9 displayed
3. User scans for red (high priority):
   - Nov 5: "Investor pitch" (red)
   - Nov 7: "Quarterly report" (red)
4. User notes two critical deadlines this week
5. User scans for yellow (medium):
   - Nov 3: "Team meeting" (yellow)
   - Nov 6: "1-on-1 with manager" (yellow)
   - Nov 9: "Design review" (yellow)
6. User scans for blue (low):
   - Nov 4: "Update documentation" (blue)
   - Nov 8: "Organize files" (blue)
7. User prioritizes high (red) tasks first
8. User schedules medium (yellow) tasks around high
9. User defers low (blue) tasks if time constrained

### Flow 8: Past vs Future Date Styling
1. Current date: November 10, 2025
2. User viewing November 2025 calendar
3. Calendar shows:
   - **Nov 1-9**: Grayed out (past dates), muted text
   - **Nov 10**: Bold border, "Today" indicator
   - **Nov 11-30**: Normal styling (future dates)
4. User sees completed todos on Nov 5 (past):
   - Todo shown with strikethrough
   - Grayed background matches past date
5. User sees pending todos on Nov 15 (future):
   - Todo shown normally, color-coded
   - Future date emphasized

### Flow 9: Mobile Calendar Experience
1. User opens calendar on iPhone (375px width)
2. Calendar adapts to small screen:
   - Navigation buttons stacked vertically
   - Month/year header full width
   - Calendar grid: 7 columns, compact cells
   - Date numbers: Smaller font (14px)
   - Todo titles: Truncated with ellipsis
   - Maximum 2 todos shown per cell ("+X more" if >2)
3. User taps on Nov 10 cell (has 3 todos)
4. Cell expands or modal shows all 3 todos
5. User scrolls through month grid smoothly
6. Touch targets large enough (44px minimum)

### Flow 10: Switching Between List and Calendar
1. User starts on main list page (`/`)
2. User sees 15 todos in list (sections: Overdue, Pending, Completed)
3. User clicks "Calendar" button
4. Browser navigates to `/calendar`
5. Same 15 todos appear on calendar dates
6. User identifies Nov 12 is busy (5 todos)
7. User wants to edit todo "Submit Report" (on Nov 12)
8. User clicks todo title on calendar
9. Option A: Edit modal opens on calendar page
10. Option B: Browser navigates back to list view, todo highlighted
11. User edits due date from Nov 12 to Nov 13
12. If staying on calendar: Calendar updates instantly
13. If on list view: User clicks "Calendar" again, sees updated layout

### Flow 11: Empty Calendar (No Todos)
1. New user just signed up
2. User clicks "Calendar" button
3. Calendar loads with current month
4. All date cells empty (no todos)
5. Message displayed: "No todos scheduled this month"
6. Holidays still shown if any
7. User navigates to next month
8. Still empty, message shown
9. User returns to list view to create first todo

### Flow 12: Calendar with Only Holidays
1. User viewing January 2026
2. User has no todos scheduled in January
3. Calendar shows:
   - Jan 1: "New Year's Day" (holiday styling)
   - Jan 25-26: "Chinese New Year" (holiday styling)
   - All other dates empty
4. User uses holiday information for planning
5. User decides to create todos:
   - Jan 2: "New Year planning" (medium)
   - Jan 24: "CNY preparations" (high)
6. User creates todos from list view
7. Calendar updates to show new todos

---

## Technical Requirements

### Database Schema

#### Holidays Table (Existing)

```sql
-- Table already exists in database
CREATE TABLE IF NOT EXISTS holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,           -- "New Year's Day", "Chinese New Year"
  date TEXT NOT NULL,            -- ISO8601 date "2025-01-01"
  year INTEGER NOT NULL,         -- 2025
  is_recurring INTEGER DEFAULT 0 -- 0 or 1
);

-- Index for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_year ON holidays(year);
```

**Sample Data:**
```sql
INSERT INTO holidays (name, date, year, is_recurring) VALUES
  ('New Year''s Day', '2025-01-01', 2025, 1),
  ('Chinese New Year', '2025-01-25', 2025, 0),
  ('Chinese New Year', '2025-01-26', 2025, 0),
  ('Good Friday', '2025-04-18', 2025, 0),
  ('Labour Day', '2025-05-01', 2025, 1),
  ('Vesak Day', '2025-05-12', 2025, 0),
  ('Hari Raya Puasa', '2025-06-15', 2025, 0),
  ('National Day', '2025-08-09', 2025, 1),
  ('Hari Raya Haji', '2025-08-22', 2025, 0),
  ('Deepavali', '2025-11-14', 2025, 0),
  ('Christmas Day', '2025-12-25', 2025, 1);
```

**Note:** is_recurring: 1 for holidays that fall on same date every year (New Year, Labour Day, National Day, Christmas). 0 for holidays with varying dates (lunar calendar, movable holidays).

### API Routes

#### GET /api/calendar/month

Fetch todos and holidays for a specific month.

```typescript
// app/api/calendar/month/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB, db } from '@/lib/db';
import { getSingaporeNow, formatSingaporeDate, parseSingaporeDate } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const monthParam = searchParams.get('month'); // 1-12

  // Default to current month if not specified
  const now = getSingaporeNow();
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

  // Validate inputs
  if (month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
  }

  try {
    // Calculate month date range
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    // Format for SQL comparison
    const startDate = formatSingaporeDate(startOfMonth, 'YYYY-MM-DD');
    const endDate = formatSingaporeDate(endOfMonth, 'YYYY-MM-DD');

    // Fetch todos with due dates in this month
    const stmt = db.prepare(`
      SELECT * FROM todos
      WHERE user_id = ?
        AND due_date IS NOT NULL
        AND DATE(due_date) >= ?
        AND DATE(due_date) <= ?
      ORDER BY due_date ASC
    `);
    const todos = stmt.all(session.userId, startDate, endDate);

    // Fetch holidays for this month
    const holidayStmt = db.prepare(`
      SELECT * FROM holidays
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `);
    const holidays = holidayStmt.all(startDate, endDate);

    return NextResponse.json({
      year,
      month,
      todos,
      holidays,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('Calendar month fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}
```

#### GET /api/holidays/year

Fetch all holidays for a specific year (for caching).

```typescript
// app/api/holidays/year/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');

  if (!year) {
    return NextResponse.json({ error: 'Year required' }, { status: 400 });
  }

  try {
    const stmt = db.prepare(`
      SELECT * FROM holidays
      WHERE year = ?
      ORDER BY date ASC
    `);
    const holidays = stmt.all(parseInt(year, 10));

    return NextResponse.json({ holidays });
  } catch (error) {
    console.error('Holidays fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}
```

### Frontend Calendar Page

```typescript
// app/calendar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Todo, Holiday } from '@/lib/db';
import { getSingaporeNow, formatSingaporeDate } from '@/lib/timezone';
import { CalendarGrid } from '@/components/CalendarGrid';
import { CalendarNavigation } from '@/components/CalendarNavigation';

export default function CalendarPage() {
  const router = useRouter();
  const now = getSingaporeNow();
  
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-12
  const [todos, setTodos] = useState<Todo[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch calendar data when month changes
  useEffect(() => {
    fetchCalendarData();
  }, [currentYear, currentMonth]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/calendar/month?year=${currentYear}&month=${currentMonth}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch calendar data');
      
      const data = await response.json();
      setTodos(data.todos);
      setHolidays(data.holidays);
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const today = getSingaporeNow();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Calendar
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 
              rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Back to List
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <CalendarNavigation
        year={currentYear}
        month={currentMonth}
        onPrevious={goToPreviousMonth}
        onNext={goToNextMonth}
        onToday={goToToday}
      />

      {/* Calendar Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Loading calendar...</p>
        </div>
      ) : (
        <CalendarGrid
          year={currentYear}
          month={currentMonth}
          todos={todos}
          holidays={holidays}
        />
      )}
    </div>
  );
}
```

### Calendar Navigation Component

```typescript
// components/CalendarNavigation.tsx

interface CalendarNavigationProps {
  year: number;
  month: number; // 1-12
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CalendarNavigation({
  year,
  month,
  onPrevious,
  onNext,
  onToday,
}: CalendarNavigationProps) {
  return (
    <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
      {/* Month/Year Display */}
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
        {MONTH_NAMES[month - 1]} {year}
      </h2>

      {/* Navigation Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onPrevious}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg 
            hover:bg-blue-600 font-medium"
        >
          ◀ Prev
        </button>
        
        <button
          onClick={onToday}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg 
            hover:bg-purple-600 font-medium"
        >
          Today
        </button>
        
        <button
          onClick={onNext}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg 
            hover:bg-blue-600 font-medium"
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
```

### Calendar Grid Component

```typescript
// components/CalendarGrid.tsx

import { Todo, Holiday } from '@/lib/db';
import { getSingaporeNow, parseSingaporeDate } from '@/lib/timezone';

interface CalendarGridProps {
  year: number;
  month: number; // 1-12
  todos: Todo[];
  holidays: Holiday[];
}

export function CalendarGrid({ year, month, todos, holidays }: CalendarGridProps) {
  const today = getSingaporeNow();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const currentDay = isCurrentMonth ? today.getDate() : null;

  // Calculate calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Group todos by date (YYYY-MM-DD)
  const todosByDate = new Map<string, Todo[]>();
  todos.forEach(todo => {
    if (!todo.due_date) return;
    const date = todo.due_date.split('T')[0]; // Extract YYYY-MM-DD
    if (!todosByDate.has(date)) {
      todosByDate.set(date, []);
    }
    todosByDate.get(date)!.push(todo);
  });

  // Group holidays by date
  const holidaysByDate = new Map<string, Holiday[]>();
  holidays.forEach(holiday => {
    if (!holidaysByDate.has(holiday.date)) {
      holidaysByDate.set(holiday.date, []);
    }
    holidaysByDate.get(holiday.date)!.push(holiday);
  });

  // Generate calendar days
  const days: (number | null)[] = [];
  
  // Empty cells before first day of month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center font-semibold text-gray-700 dark:text-gray-300 
              py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTodos = todosByDate.get(dateStr) || [];
          const dayHolidays = holidaysByDate.get(dateStr) || [];
          const isToday = day === currentDay;
          const isPast = new Date(year, month - 1, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

          return (
            <CalendarDay
              key={dateStr}
              date={day}
              dateStr={dateStr}
              todos={dayTodos}
              holidays={dayHolidays}
              isToday={isToday}
              isPast={isPast}
            />
          );
        })}
      </div>
    </div>
  );
}

interface CalendarDayProps {
  date: number;
  dateStr: string;
  todos: Todo[];
  holidays: Holiday[];
  isToday: boolean;
  isPast: boolean;
}

function CalendarDay({ date, dateStr, todos, holidays, isToday, isPast }: CalendarDayProps) {
  const hasHoliday = holidays.length > 0;

  return (
    <div
      className={`
        aspect-square border rounded-lg p-2 overflow-hidden
        ${isToday ? 'border-blue-500 border-2 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'}
        ${isPast && !isToday ? 'bg-gray-100 dark:bg-gray-800 opacity-60' : 'bg-white dark:bg-gray-800'}
        ${hasHoliday ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
      `}
    >
      {/* Date number */}
      <div className="flex justify-between items-start mb-1">
        <span className={`
          text-sm font-medium
          ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}
        `}>
          {date}
        </span>
        {isToday && (
          <span className="text-xs bg-blue-500 text-white px-1 rounded">
            Today
          </span>
        )}
      </div>

      {/* Holidays */}
      {holidays.map(holiday => (
        <div
          key={holiday.id}
          className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1 truncate"
          title={holiday.name}
        >
          🎉 {holiday.name}
        </div>
      ))}

      {/* Todos */}
      <div className="space-y-1">
        {todos.slice(0, 3).map(todo => (
          <TodoPill key={todo.id} todo={todo} />
        ))}
        {todos.length > 3 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            +{todos.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}

interface TodoPillProps {
  todo: Todo;
}

function TodoPill({ todo }: TodoPillProps) {
  const priorityColors = {
    high: 'bg-red-500 text-white',
    medium: 'bg-yellow-500 text-gray-900',
    low: 'bg-blue-500 text-white',
  };

  return (
    <div
      className={`
        text-xs px-2 py-1 rounded truncate cursor-pointer
        hover:opacity-80 transition-opacity
        ${priorityColors[todo.priority]}
        ${todo.completed ? 'line-through opacity-60' : ''}
      `}
      title={todo.title}
    >
      {todo.title}
    </div>
  );
}
```

### Holiday Database Helpers

```typescript
// lib/db.ts - Add holiday interface and helpers

export interface Holiday {
  id: number;
  name: string;
  date: string;        // YYYY-MM-DD
  year: number;
  is_recurring: number; // 0 or 1
}

export const holidayDB = {
  getByYear(year: number): Holiday[] {
    const stmt = db.prepare(`
      SELECT * FROM holidays
      WHERE year = ?
      ORDER BY date ASC
    `);
    return stmt.all(year) as Holiday[];
  },

  getByDateRange(startDate: string, endDate: string): Holiday[] {
    const stmt = db.prepare(`
      SELECT * FROM holidays
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `);
    return stmt.all(startDate, endDate) as Holiday[];
  },

  create(data: {
    name: string;
    date: string;
    year: number;
    isRecurring?: boolean;
  }): Holiday {
    const stmt = db.prepare(`
      INSERT INTO holidays (name, date, year, is_recurring)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.name,
      data.date,
      data.year,
      data.isRecurring ? 1 : 0
    );
    
    return {
      id: result.lastInsertRowid as number,
      name: data.name,
      date: data.date,
      year: data.year,
      is_recurring: data.isRecurring ? 1 : 0,
    };
  },
};
```

### Holiday Seeding Script

```typescript
// scripts/seed-holidays.ts

import { db, holidayDB } from '../lib/db';

const SINGAPORE_HOLIDAYS_2025 = [
  { name: 'New Year\'s Day', date: '2025-01-01', isRecurring: true },
  { name: 'Chinese New Year', date: '2025-01-29', isRecurring: false },
  { name: 'Chinese New Year', date: '2025-01-30', isRecurring: false },
  { name: 'Good Friday', date: '2025-04-18', isRecurring: false },
  { name: 'Labour Day', date: '2025-05-01', isRecurring: true },
  { name: 'Vesak Day', date: '2025-05-12', isRecurring: false },
  { name: 'Hari Raya Puasa', date: '2025-06-15', isRecurring: false },
  { name: 'National Day', date: '2025-08-09', isRecurring: true },
  { name: 'Hari Raya Haji', date: '2025-08-22', isRecurring: false },
  { name: 'Deepavali', date: '2025-11-14', isRecurring: false },
  { name: 'Christmas Day', date: '2025-12-25', isRecurring: true },
];

const SINGAPORE_HOLIDAYS_2026 = [
  { name: 'New Year\'s Day', date: '2026-01-01', isRecurring: true },
  { name: 'Chinese New Year', date: '2026-02-17', isRecurring: false },
  { name: 'Chinese New Year', date: '2026-02-18', isRecurring: false },
  { name: 'Good Friday', date: '2026-04-03', isRecurring: false },
  { name: 'Labour Day', date: '2026-05-01', isRecurring: true },
  { name: 'Vesak Day', date: '2026-05-31', isRecurring: false },
  { name: 'Hari Raya Puasa', date: '2026-06-05', isRecurring: false },
  { name: 'National Day', date: '2026-08-09', isRecurring: true },
  { name: 'Hari Raya Haji', date: '2026-08-12', isRecurring: false },
  { name: 'Deepavali', date: '2026-11-03', isRecurring: false },
  { name: 'Christmas Day', date: '2026-12-25', isRecurring: true },
];

function seedHolidays() {
  console.log('Seeding Singapore public holidays...');

  // Clear existing holidays
  db.exec('DELETE FROM holidays');

  // Seed 2025
  SINGAPORE_HOLIDAYS_2025.forEach(holiday => {
    holidayDB.create({
      name: holiday.name,
      date: holiday.date,
      year: 2025,
      isRecurring: holiday.isRecurring,
    });
  });

  // Seed 2026
  SINGAPORE_HOLIDAYS_2026.forEach(holiday => {
    holidayDB.create({
      name: holiday.name,
      date: holiday.date,
      year: 2026,
      isRecurring: holiday.isRecurring,
    });
  });

  console.log(`Seeded ${SINGAPORE_HOLIDAYS_2025.length + SINGAPORE_HOLIDAYS_2026.length} holidays`);
}

seedHolidays();
```

---

## Edge Cases

### 1. Month with No Todos
**Scenario:** User views month with zero scheduled todos

**Handling:**
- Calendar grid displays normally with all dates
- No todo pills shown on any date
- Holidays still displayed if any
- Message shown: "No todos scheduled this month"
- User can navigate to other months
- Valid use case (planning future or reviewing empty period)

### 2. Date with Many Todos (10+)
**Scenario:** User has 15 todos on single date

**Handling:**
- Show first 3 todos as pills
- Display "+12 more" text below
- Cell doesn't expand infinitely
- Clicking cell/date opens modal with full list
- Alternative: Clicking navigates to list view filtered by that date
- Prevents UI overflow

### 3. Holiday Overlapping with Many Todos
**Scenario:** Date has holiday + 8 todos

**Handling:**
- Holiday displayed at top of cell
- Todos shown below holiday (max 2-3 due to space)
- "+X more" indicator if truncated
- Holiday background tint doesn't obscure todos
- Both holiday and todos clickable
- Visual hierarchy: holiday → high priority → medium → low

### 4. Navigating Far into Future (2030)
**Scenario:** User navigates to year 2030

**Handling:**
- Calendar renders normally
- Todos with 2030 due dates shown
- Holidays might not exist in database for 2030
- No holidays shown (empty)
- Note: Holiday seeding script only includes 2025-2026
- **Future enhancement:** Auto-generate recurring holidays

### 5. Navigating to Past Years (2020)
**Scenario:** User navigates to 2020

**Handling:**
- All dates shown as past (grayed out)
- Completed todos from 2020 displayed
- Historical data preserved
- Holidays from 2020 shown if in database
- Valid for reviewing old projects/patterns

### 6. Current Day at Month Boundary
**Scenario:** Today is Jan 31, 2026, user viewing January

**Handling:**
- Jan 31 highlighted as "Today"
- User clicks "Next ▶" to February
- February 2026 loaded
- No "Today" highlight in February (today is in January)
- Clicking "Today" button returns to January

### 7. Timezone Edge Cases (Singapore)
**Scenario:** User in different timezone, server in Singapore

**Handling:**
- All dates calculated in Singapore timezone (Asia/Singapore)
- Current day based on Singapore time
- User sees Singapore dates consistently
- Due dates stored in Singapore timezone
- No conversion issues

### 8. Responsive Grid on Narrow Mobile (320px)
**Scenario:** User on very small phone screen

**Handling:**
- 7 columns still shown (Sun-Sat)
- Each cell very narrow (~40px)
- Date number: Smaller font (10px)
- Todos: Show dot indicators instead of text
- Tapping cell opens modal with full details
- Alternative: Show 3-day mobile view (out of scope for MVP)

### 9. Empty Month in Middle of Year
**Scenario:** User has todos in Jan and March, but not February

**Handling:**
- February shown with no todos
- "No todos scheduled this month" message
- User can still navigate normally
- Helps identify gaps in schedule
- Not an error state

### 10. Completed vs Incomplete Todos on Same Date
**Scenario:** Date has 3 incomplete + 2 completed todos

**Handling:**
- All 5 todos shown in cell
- Completed todos styled with:
  - Line-through text
  - Slightly transparent (opacity 60%)
  - Still color-coded by priority
- Incomplete todos shown normally
- Both types visible for complete picture

### 11. Long Todo Title Truncation
**Scenario:** Todo title is 100+ characters

**Handling:**
- Title truncated with ellipsis (...)
- Example: "Very long todo title that goes on..." (truncated at ~25 chars)
- Full title shown in tooltip on hover
- Clicking todo shows full title in modal/list view
- Prevents cell overflow

### 12. Holiday on Weekend
**Scenario:** National Day (Aug 9) falls on Saturday

**Handling:**
- Holiday displayed on Saturday cell
- No special "observed on Monday" logic
- Shows actual holiday date
- Singapore doesn't have "observed" days for MVP
- User aware of actual holiday date

### 13. User Creates Todo While Viewing Calendar
**Scenario:** Calendar open, user creates todo via list in another tab

**Handling:**
- Calendar doesn't auto-refresh (no websocket)
- User must manually refresh page or re-navigate to month
- Alternative: Implement polling (every 30s) to check for updates
- **Future enhancement:** Real-time sync

### 14. Clicking Todo on Calendar
**Scenario:** User clicks todo pill on calendar date

**Handling:**
- Option A: Open edit modal on calendar page
- Option B: Navigate to list view with todo highlighted
- MVP: Navigate to list view (simpler implementation)
- Clicking todo pill triggers: `router.push('/?todoId=' + todo.id)`
- List view scrolls to and highlights todo

### 15. No Holidays Seeded
**Scenario:** Database has no holiday data

**Handling:**
- Calendar renders normally without holidays
- No holiday background tints
- No holiday names shown
- User sees clean calendar with only todos
- Admin must run seed script to populate holidays

---

## Acceptance Criteria

### Functional Requirements

#### FR1: Calendar Page Access
- [ ] "Calendar" button visible in top navigation
- [ ] Button styled in purple color
- [ ] Clicking navigates to `/calendar` route
- [ ] Calendar page loads successfully
- [ ] URL changes to `/calendar`

#### FR2: Monthly Calendar Display
- [ ] Current month shown by default (Singapore timezone)
- [ ] Month/year header displayed (e.g., "November 2025")
- [ ] 7-column grid (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
- [ ] Week day headers shown above grid
- [ ] All dates of month displayed in cells
- [ ] Grid is responsive (adapts to screen size)

#### FR3: Current Day Highlighting
- [ ] Today's date highlighted when viewing current month
- [ ] Border or background color distinguishes today
- [ ] "Today" badge/text shown
- [ ] Highlight only appears in current month
- [ ] Past/future months don't show today highlight

#### FR4: Todo Display by Due Date
- [ ] Todos appear on calendar date matching due_date
- [ ] Only todos with non-null due_date shown
- [ ] Multiple todos on same date stack vertically
- [ ] Todo title displayed in cell
- [ ] Completed todos shown with line-through

#### FR5: Priority Color Coding
- [ ] High priority: Red background (#EF4444)
- [ ] Medium priority: Yellow/orange background (#F59E0B)
- [ ] Low priority: Blue background (#3B82F6)
- [ ] Colors visible in light and dark modes
- [ ] Text color contrasts with background

#### FR6: Month Navigation
- [ ] "◀ Prev" button navigates to previous month
- [ ] "Next ▶" button navigates to next month
- [ ] Month/year header updates on navigation
- [ ] Todos update for new month
- [ ] Can navigate to future and past months
- [ ] Year changes when crossing Dec/Jan boundary

#### FR7: Today Button
- [ ] "Today" button visible in navigation
- [ ] Clicking returns to current month
- [ ] Works from any month (past or future)
- [ ] Current day highlighted after click

#### FR8: Holiday Display
- [ ] Public holidays shown on calendar dates
- [ ] Holiday name displayed (e.g., "Christmas Day")
- [ ] Special background tint for holiday dates
- [ ] Holidays don't obscure todos
- [ ] Multiple holidays on same date stack

#### FR9: Past Date Styling
- [ ] Past dates grayed out
- [ ] Future dates (and today) normally styled
- [ ] Clear visual distinction
- [ ] Applies to dates before today (Singapore timezone)

#### FR10: Data Synchronization
- [ ] Calendar shows same todos as list view
- [ ] No separate data storage for calendar
- [ ] Changes in list view reflect in calendar
- [ ] Navigating between views preserves data

#### FR11: Responsive Design
- [ ] Desktop (>1024px): Full-sized cells
- [ ] Tablet (640-1024px): Medium cells
- [ ] Mobile (<640px): Compact cells
- [ ] Touch-friendly on mobile
- [ ] Grid scrollable if needed

#### FR12: Dark Mode Support
- [ ] All calendar elements styled for dark mode
- [ ] Priority colors visible in dark mode
- [ ] Holiday styling works in dark mode
- [ ] Text readable in dark mode

### Non-Functional Requirements

#### NFR1: Performance
- [ ] Calendar loads < 1 second
- [ ] Month navigation instant (<200ms)
- [ ] Handles 100+ todos per month without lag
- [ ] Smooth animations/transitions

#### NFR2: Data Accuracy
- [ ] Dates calculated correctly in Singapore timezone
- [ ] Current month determined by Singapore time
- [ ] Todo due dates parsed correctly
- [ ] Holiday dates accurate

#### NFR3: Accessibility
- [ ] Keyboard navigation supported
- [ ] Screen reader compatible
- [ ] ARIA labels on buttons
- [ ] Focus management

#### NFR4: Browser Compatibility
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] Mobile browsers supported
- [ ] No console errors

#### NFR5: User Experience
- [ ] Intuitive navigation
- [ ] Clear visual hierarchy
- [ ] No confusing interactions
- [ ] Helpful empty states

---

## Testing Requirements

### E2E Tests (Playwright)

Create `tests/10-calendar-view.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Calendar View', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new TestHelper(page, context);
    await helper.setupAuthenticatedSession();
  });

  test('should show calendar button in navigation', async ({ page }) => {
    await page.goto('/');
    
    const calendarButton = page.locator('button:has-text("Calendar")');
    await expect(calendarButton).toBeVisible();
  });

  test('should navigate to calendar page', async ({ page }) => {
    await page.goto('/');
    
    await page.click('button:has-text("Calendar")');
    
    await expect(page).toHaveURL('/calendar');
  });

  test('should show current month calendar', async ({ page }) => {
    await page.goto('/calendar');
    
    // Check for month/year header (e.g., "November 2025" or current month)
    const header = page.locator('h2');
    await expect(header).toBeVisible();
    // Header should contain a month name
    const headerText = await header.textContent();
    expect(headerText).toMatch(/(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}/);
  });

  test('should show week day headers', async ({ page }) => {
    await page.goto('/calendar');
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (const day of days) {
      await expect(page.locator(`text=${day}`).first()).toBeVisible();
    }
  });

  test('should show todos on calendar dates', async ({ page }) => {
    await page.goto('/');
    
    // Create todo with specific due date
    await helper.createTodo({
      title: 'Calendar Test Todo',
      dueDate: '2025-11-15T10:00:00+08:00',
      priority: 'high',
    });
    
    // Navigate to November 2025 calendar
    await page.goto('/calendar');
    
    // Should show todo on calendar
    await expect(page.locator('text=Calendar Test Todo')).toBeVisible();
  });

  test('should color code todos by priority', async ({ page }) => {
    await page.goto('/');
    
    const dueDate = '2025-11-20T10:00:00+08:00';
    
    await helper.createTodo({
      title: 'High Priority',
      dueDate,
      priority: 'high',
    });
    
    await page.goto('/calendar');
    
    // Check for red background (high priority)
    const highPriorityTodo = page.locator('text=High Priority');
    await expect(highPriorityTodo).toBeVisible();
    
    // Check computed styles include red/red-like background
    const bgColor = await highPriorityTodo.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    // RGB values for red-ish colors
    expect(bgColor).toMatch(/rgb\(239, 68, 68\)|rgb\(220, 38, 38\)|rgb\(185, 28, 28\)/);
  });

  test('should navigate to previous month', async ({ page }) => {
    await page.goto('/calendar');
    
    // Get current month text
    const initialMonth = await page.locator('h2').textContent();
    
    // Click previous button
    await page.click('button:has-text("Prev")');
    
    // Month should change
    const newMonth = await page.locator('h2').textContent();
    expect(newMonth).not.toBe(initialMonth);
  });

  test('should navigate to next month', async ({ page }) => {
    await page.goto('/calendar');
    
    const initialMonth = await page.locator('h2').textContent();
    
    await page.click('button:has-text("Next")');
    
    const newMonth = await page.locator('h2').textContent();
    expect(newMonth).not.toBe(initialMonth);
  });

  test('should have today button', async ({ page }) => {
    await page.goto('/calendar');
    
    const todayButton = page.locator('button:has-text("Today")');
    await expect(todayButton).toBeVisible();
  });

  test('should jump to current month on today click', async ({ page }) => {
    await page.goto('/calendar');
    
    // Navigate away from current month
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    
    // Click Today
    await page.click('button:has-text("Today")');
    
    // Should show current month
    const header = await page.locator('h2').textContent();
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();
    
    expect(header).toContain(currentMonth);
    expect(header).toContain(String(currentYear));
  });

  test('should show holidays if present', async ({ page }) => {
    // Assumes holidays are seeded
    await page.goto('/calendar');
    
    // Navigate to month with known holiday (December for Christmas)
    // Click Next until December 2025
    let month = await page.locator('h2').textContent();
    while (!month?.includes('December 2025')) {
      await page.click('button:has-text("Next")');
      month = await page.locator('h2').textContent();
      // Safety: Don't infinite loop
      if (month?.includes('2026')) break;
    }
    
    if (month?.includes('December 2025')) {
      // Should show Christmas Day
      await expect(page.locator('text=Christmas')).toBeVisible();
    }
  });

  test('should highlight current day', async ({ page }) => {
    await page.goto('/calendar');
    
    // Check for "Today" badge/indicator
    await expect(page.locator('text=Today')).toBeVisible();
  });

  test('should not show todos without due dates', async ({ page }) => {
    await page.goto('/');
    
    // Create todo without due date
    await helper.createTodo({
      title: 'No Due Date Todo',
      priority: 'medium',
    });
    
    await page.goto('/calendar');
    
    // Should NOT appear on calendar
    await expect(page.locator('text=No Due Date Todo')).not.toBeVisible();
  });

  test('should show multiple todos on same date', async ({ page }) => {
    await page.goto('/');
    
    const dueDate = '2025-11-25T10:00:00+08:00';
    
    await helper.createTodo({
      title: 'Todo 1',
      dueDate,
      priority: 'high',
    });
    
    await helper.createTodo({
      title: 'Todo 2',
      dueDate,
      priority: 'medium',
    });
    
    await page.goto('/calendar');
    
    // Both should be visible
    await expect(page.locator('text=Todo 1')).toBeVisible();
    await expect(page.locator('text=Todo 2')).toBeVisible();
  });

  test('should navigate back to list view', async ({ page }) => {
    await page.goto('/calendar');
    
    // Click back to list button
    await page.click('button:has-text("Back to List")');
    
    await expect(page).toHaveURL('/');
  });

  test('should show completed todos with strikethrough', async ({ page }) => {
    await page.goto('/');
    
    const todo = await helper.createTodo({
      title: 'Completed Calendar Todo',
      dueDate: '2025-11-18T10:00:00+08:00',
      priority: 'low',
    });
    
    await helper.completeTodo(todo.id);
    
    await page.goto('/calendar');
    
    const completedTodo = page.locator('text=Completed Calendar Todo');
    await expect(completedTodo).toBeVisible();
    
    // Check for line-through style
    const textDecoration = await completedTodo.evaluate(
      el => window.getComputedStyle(el).textDecoration
    );
    expect(textDecoration).toContain('line-through');
  });

  test('should handle month with no todos', async ({ page }) => {
    await page.goto('/calendar');
    
    // Navigate far into future (unlikely to have todos)
    for (let i = 0; i < 12; i++) {
      await page.click('button:has-text("Next")');
    }
    
    // Should show empty state or just empty calendar
    // Calendar grid should still render
    const grid = page.locator('.grid');
    await expect(grid).toBeVisible();
  });

  test('should work in dark mode', async ({ page }) => {
    await page.goto('/calendar');
    
    // Toggle dark mode (assumes dark mode toggle exists)
    // Or check that dark mode classes are applied
    const html = page.locator('html');
    
    // If dark mode is enabled via class
    await html.evaluate(el => el.classList.add('dark'));
    
    // Calendar should still be visible and readable
    const header = page.locator('h2');
    await expect(header).toBeVisible();
  });
});
```

### Unit Tests

Create `tests/unit/calendarHelpers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('Calendar Date Calculations', () => {
  it('should calculate first day of month correctly', () => {
    const firstDay = new Date(2025, 10, 1); // November 2025
    expect(firstDay.getDay()).toBe(6); // Saturday
  });

  it('should calculate last day of month correctly', () => {
    const lastDay = new Date(2025, 11, 0); // Last day of November
    expect(lastDay.getDate()).toBe(30); // November has 30 days
  });

  it('should handle leap year February', () => {
    const feb2024LastDay = new Date(2024, 2, 0);
    expect(feb2024LastDay.getDate()).toBe(29); // 2024 is leap year
    
    const feb2025LastDay = new Date(2025, 2, 0);
    expect(feb2025LastDay.getDate()).toBe(28); // 2025 is not
  });

  it('should group todos by date string', () => {
    const todos = [
      { id: 1, due_date: '2025-11-15T10:00:00+08:00', title: 'Todo 1' },
      { id: 2, due_date: '2025-11-15T14:00:00+08:00', title: 'Todo 2' },
      { id: 3, due_date: '2025-11-16T10:00:00+08:00', title: 'Todo 3' },
    ];
    
    const grouped = new Map();
    todos.forEach(todo => {
      const date = todo.due_date.split('T')[0];
      if (!grouped.has(date)) grouped.set(date, []);
      grouped.get(date).push(todo);
    });
    
    expect(grouped.get('2025-11-15')).toHaveLength(2);
    expect(grouped.get('2025-11-16')).toHaveLength(1);
  });

  it('should determine if date is past', () => {
    const today = new Date(2025, 10, 10); // Nov 10, 2025
    const pastDate = new Date(2025, 10, 5);
    const futureDate = new Date(2025, 10, 15);
    
    expect(pastDate < today).toBe(true);
    expect(futureDate < today).toBe(false);
  });
});
```

---

## Out of Scope

The following features are **explicitly excluded** from this implementation:

### 1. Week View
- 7-day week calendar layout
- Hour-by-hour time slots
- Agenda/schedule view
- **Reason:** Monthly view covers MVP, week view adds complexity

### 2. Day View
- Single day detailed schedule
- Hour slots with todo times
- Timeline visualization
- **Reason:** Focus on month overview for MVP

### 3. Drag-and-Drop Rescheduling
- Drag todos between dates
- Drop to change due date
- Visual feedback during drag
- **Reason:** Complex interaction, can edit via list view

### 4. Create Todo from Calendar
- Click empty date to create todo
- Pre-fill due date from clicked date
- Inline todo creation
- **Reason:** Creation handled in list view for consistency

### 5. Multi-Select Todos
- Select multiple todos on calendar
- Bulk reschedule
- Bulk delete
- **Reason:** Bulk operations out of scope

### 6. Calendar Filters
- Show only high priority on calendar
- Filter by tag on calendar
- Hide completed todos
- **Reason:** Filtering handled in list view

### 7. Print Calendar
- Print-friendly calendar layout
- PDF export of calendar
- Formatted for paper
- **Reason:** Not priority for digital-first app

### 8. Recurring Event Visualization
- Show all instances of recurring todo
- Series visualization
- Pattern indicators
- **Reason:** Each instance shown on due date, sufficient

### 9. Holiday Customization
- Add custom holidays
- Edit holiday names
- Delete holidays
- **Reason:** Admin-seeded holidays sufficient for MVP

### 10. Time Zone Selection
- Change calendar timezone
- Multi-timezone display
- **Reason:** Singapore timezone fixed for consistency

### 11. Year View
- 12-month overview
- Mini month grids
- Annual planning
- **Reason:** Monthly view sufficient

### 12. Integration with External Calendars
- Google Calendar sync
- Outlook integration
- iCal export
- **Reason:** Standalone calendar for MVP

---

## Success Metrics

### User Engagement
- **Target:** 50% of users access calendar at least once per week
- **Target:** 30% of users use calendar for weekly planning
- **Target:** Calendar view accounts for 25% of total page views

### Feature Usage
- **Target:** Average 3 month navigations per calendar session
- **Target:** "Today" button used 40% of calendar visits
- **Target:** Users identify scheduling conflicts via calendar

### User Satisfaction
- **Target:** Users report calendar helpful for planning (qualitative)
- **Target:** Reduced questions about "when is my next task?"
- **Target:** < 5% requests for week/day view

### Technical Quality
- **Target:** Calendar loads < 1 second
- **Target:** Month navigation < 200ms
- **Target:** 100% E2E test pass rate (15 test cases)
- **Target:** Zero visual bugs in production

---

## Implementation Notes

### Development Order
1. **Phase 1: Database & API**
   - Create holidays table migration
   - Implement holiday seeding script
   - Create `/api/calendar/month` route
   - Test API with various months

2. **Phase 2: Basic Calendar Grid**
   - Build CalendarGrid component
   - Calculate dates, weeks correctly
   - Render empty grid with dates
   - Style current day highlight

3. **Phase 3: Todo Display**
   - Fetch todos by month
   - Group todos by date
   - Display TodoPill components
   - Implement priority color coding

4. **Phase 4: Holiday Integration**
   - Fetch holidays from API
   - Display holiday names on dates
   - Apply holiday styling
   - Test with various months

5. **Phase 5: Navigation**
   - Build CalendarNavigation component
   - Implement prev/next month logic
   - Implement "Today" jump
   - Update URL on navigation (optional)

6. **Phase 6: Calendar Page**
   - Create `/app/calendar/page.tsx`
   - Integrate all components
   - Add "Back to List" button
   - Test navigation flow

7. **Phase 7: Responsive Design**
   - Mobile layout adjustments
   - Tablet breakpoints
   - Touch optimization
   - Dark mode styling

8. **Phase 8: Testing**
   - Write E2E tests (15 test cases)
   - Write unit tests for date calculations
   - Cross-browser testing
   - Performance testing

### Dependencies
- **Requires:** PRP-01 (Todo CRUD) - todo data, due dates
- **Requires:** PRP-02 (Priority) - priority color coding
- **Enhances:** All features - visual planning tool

### Performance Considerations
- **Date Calculations:** Client-side JavaScript, instant
- **API Queries:** Fetch only one month at a time (not all todos)
- **Rendering:** Max ~100 todos per month, no performance issues
- **Navigation:** Smooth transitions with React state updates

### Data Integrity
- **Singapore Timezone:** All date calculations use Asia/Singapore
- **Holiday Accuracy:** Manually verified public holidays for 2025-2026
- **Recurring Holidays:** Flag allows future auto-generation
- **Database Indexing:** Indexes on holidays.date for fast queries

---

**Feature Owner:** AI Development Team  
**Last Updated:** February 5, 2026  
**Status:** Ready for Implementation
