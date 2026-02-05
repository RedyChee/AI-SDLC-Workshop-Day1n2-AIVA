# PRP-04: Reminders & Notifications

## Feature Overview

The Reminders & Notifications feature enables users to receive browser notifications before their todos are due, helping them stay on top of deadlines and never miss important tasks. The system provides configurable timing options from 15 minutes to 1 week before the due date, with automatic duplicate prevention and Singapore timezone-aware calculations.

### Core Functionality
- **Browser Notifications**: Native browser notifications with permission management
- **Configurable Timing**: Seven reminder intervals (15m, 30m, 1h, 2h, 1d, 2d, 1w)
- **Polling Mechanism**: Client-side polling every minute to check for pending reminders
- **Duplicate Prevention**: Track sent notifications via `last_notification_sent` timestamp
- **Singapore Timezone**: All calculations use Asia/Singapore timezone
- **Visual Indicators**: Bell badge (🔔) showing abbreviated reminder time
- **Permission Management**: Enable/disable notifications with visual status indicator

### User Value
- Never miss important deadlines with timely notifications
- Flexible reminder timing matches different task urgency levels
- Works in background tabs for uninterrupted notification delivery
- One-time notification guarantee prevents notification spam

---

## User Stories

### Story 1: Enable Browser Notifications
**As a** busy professional  
**I want to** enable browser notifications  
**So that** I can receive reminders even when the app tab is in the background

**Acceptance Criteria:**
- Visible "🔔 Enable Notifications" button in top-right (orange color)
- Click triggers browser permission request
- After granting permission, button shows "🔔 Notifications On" (green badge)
- Permission state persists across sessions via localStorage
- If permission denied, button remains orange with error message

### Story 2: Set Reminder When Creating Todo
**As a** todo creator  
**I want to** set a reminder when I create a new todo with a due date  
**So that** I get notified before the deadline

**Acceptance Criteria:**
- "Reminder" dropdown appears in todo form when due date is set
- Dropdown disabled (grayed out) when no due date selected
- Seven timing options available: 15m, 30m, 1h, 2h, 1d, 2d, 1w
- "None" option to disable reminder
- Selected reminder saves with todo creation
- Visual bell badge (🔔) appears on todo item showing abbreviated time

### Story 3: Edit Reminder on Existing Todo
**As a** todo manager  
**I want to** change or remove reminders on existing todos  
**So that** I can adjust notification timing as priorities change

**Acceptance Criteria:**
- Can change reminder timing from edit modal
- Can set reminder to "None" to disable notifications
- Changing reminder resets `last_notification_sent` to null
- Removing due date automatically removes reminder
- Changes save immediately with optimistic UI update

### Story 4: Receive Notification at Reminder Time
**As a** user with notifications enabled  
**I want to** receive a browser notification when reminder time arrives  
**So that** I'm alerted about upcoming deadlines

**Acceptance Criteria:**
- Notification appears at calculated reminder time (due_date - reminder_minutes)
- Notification shows todo title and formatted due date/time
- Notification persists until user acknowledges
- Only sent once per reminder (tracked via `last_notification_sent`)
- Works when browser tab is in background
- Uses Singapore timezone for all calculations

### Story 5: View Reminder Status on Todo
**As a** user scanning my todo list  
**I want to** see which todos have reminders set  
**So that** I know which tasks will send me notifications

**Acceptance Criteria:**
- Bell badge (🔔) visible on todos with reminders
- Badge shows abbreviated time: "15m", "30m", "1h", "2h", "1d", "2d", "1w"
- Badge positioned consistently on todo item
- Badge updates immediately when reminder changed
- No badge shown when reminder is "None"

### Story 6: Handle Overdue Reminders
**As a** user who missed a notification  
**I want to** not receive duplicate notifications for overdue reminders  
**So that** I'm not spammed with old notifications

**Acceptance Criteria:**
- Notification only sent once per reminder
- `last_notification_sent` timestamp prevents duplicates
- Overdue reminders (past notification time) still send notification once
- Completing todo clears reminder and prevents future notifications
- Deleting todo removes reminder from system

### Story 7: Recurring Todo Reminder Inheritance
**As a** user with recurring todos  
**I want to** have the same reminder timing on each recurrence  
**So that** I don't have to re-set reminders every time

**Acceptance Criteria:**
- Next recurring instance inherits `reminder_minutes` value
- `last_notification_sent` resets to null for new instance
- Reminder notification sent for each occurrence
- Changing reminder on one instance doesn't affect past/future instances
- Reminder badge appears on all recurring instances

---

## User Flow

### Flow 1: First-Time Notification Setup
1. User visits app for the first time
2. User sees "🔔 Enable Notifications" button (orange) in top-right
3. User clicks button
4. Browser prompts for notification permission
5. User clicks "Allow"
6. Button changes to "🔔 Notifications On" (green badge)
7. Permission state saved to localStorage
8. System begins polling for pending reminders

**Alternative Flow 1a: User Denies Permission**
4a. User clicks "Block" on permission prompt  
5a. Button remains orange  
6a. Toast notification shows "Notification permission denied"  
7a. Reminders still saveable but won't trigger notifications

### Flow 2: Creating Todo with Reminder
1. User enters todo title "Client presentation"
2. User selects priority "High"
3. User sets due date to tomorrow at 2:00 PM
4. "Reminder" dropdown becomes enabled
5. User selects "1 hour before"
6. User clicks "Add"
7. Todo created with `reminder_minutes = 60`
8. Todo appears in list with "🔔 1h" badge
9. Notification scheduled for tomorrow at 1:00 PM Singapore time

### Flow 3: Receiving a Notification
1. System polling checks for pending reminders every minute
2. Current time (Singapore) reaches reminder time (due_date - reminder_minutes)
3. System queries `GET /api/notifications/check`
4. Backend finds todo with matching reminder time
5. Backend updates `last_notification_sent` to current timestamp
6. Frontend receives todo data in response
7. Frontend triggers browser notification with title and due date
8. User sees native browser notification
9. User clicks notification (optional: can focus app tab)
10. Notification dismissed

**Alternative Flow 3a: Notifications Disabled**
7a. No notification triggered  
8a. Reminder logged but not displayed  
9a. User doesn't receive notification

### Flow 4: Editing Reminder Time
1. User clicks "Edit" on existing todo "Submit report"
2. Edit modal opens showing current reminder "2 days before"
3. User changes "Reminder" dropdown to "1 day before"
4. User clicks "Save"
5. PUT request updates `reminder_minutes = 1440`
6. PUT request sets `last_notification_sent = null`
7. Todo list updates with "🔔 1d" badge
8. New notification scheduled for 1 day before due date

### Flow 5: Removing Reminder
1. User edits todo with reminder
2. User selects "None" from "Reminder" dropdown
3. User saves changes
4. PUT request sets `reminder_minutes = null`
5. PUT request sets `last_notification_sent = null`
6. Bell badge (🔔) removed from todo item
7. No future notifications scheduled for this todo

### Flow 6: Completing Recurring Todo with Reminder
1. User has recurring weekly todo "Team standup" with "15 minutes before" reminder
2. User receives notification 15 minutes before due time
3. User marks todo as complete
4. System creates next instance with:
   - New due date (next week, same time)
   - Same `reminder_minutes = 15`
   - `last_notification_sent = null`
5. New instance appears in list with "🔔 15m" badge
6. Notification scheduled for next week's occurrence

### Flow 7: Handling Overdue Reminders
1. User has todo due yesterday at 5:00 PM with "1 hour before" reminder
2. Reminder time was yesterday at 4:00 PM
3. User opens app today for the first time since yesterday morning
4. Polling check finds reminder is overdue
5. `last_notification_sent` is null (never sent)
6. System sends notification immediately
7. System updates `last_notification_sent` to current timestamp
8. Subsequent polling checks skip this todo (notification already sent)

### Flow 8: Bulk Reminder Management (Future Enhancement)
1. User creates template "Weekly Review" with "1 day before" reminder
2. User instantiates template 5 times for next 5 weeks
3. Each instance inherits `reminder_minutes = 1440`
4. Each instance has unique `last_notification_sent = null`
5. Notifications sent for each occurrence independently

---

## Technical Requirements

### Database Schema

#### Extend `todos` Table
Add columns for reminder functionality:

```sql
-- Add reminder columns to todos table
ALTER TABLE todos ADD COLUMN reminder_minutes INTEGER DEFAULT NULL 
  CHECK (reminder_minutes IN (15, 30, 60, 120, 1440, 2880, 10080));
ALTER TABLE todos ADD COLUMN last_notification_sent TEXT DEFAULT NULL;

-- Index for efficient reminder queries
CREATE INDEX idx_todos_reminder ON todos(user_id, due_date, reminder_minutes, last_notification_sent) 
  WHERE reminder_minutes IS NOT NULL AND due_date IS NOT NULL;
```

**Column Details:**
- `reminder_minutes`: Integer representing minutes before due date (15, 30, 60, 120, 1440, 2880, 10080)
  - 15 = 15 minutes
  - 30 = 30 minutes
  - 60 = 1 hour
  - 120 = 2 hours
  - 1440 = 1 day
  - 2880 = 2 days
  - 10080 = 1 week
  - NULL = no reminder
- `last_notification_sent`: ISO8601 timestamp (Singapore timezone) when notification was last sent
  - NULL = notification never sent
  - Used for duplicate prevention

**Index Justification:**
- Composite index on (user_id, due_date, reminder_minutes, last_notification_sent) optimizes `GET /api/notifications/check` query
- WHERE clause creates partial index (only rows with reminders)
- Reduces index size and improves query performance

### TypeScript Types

#### `lib/db.ts` Updates

```typescript
// Reminder timing options (in minutes)
export type ReminderMinutes = 15 | 30 | 60 | 120 | 1440 | 2880 | 10080 | null;

// Reminder configuration for UI
export const REMINDER_OPTIONS = [
  { value: null, label: 'None', abbr: null },
  { value: 15, label: '15 minutes before', abbr: '15m' },
  { value: 30, label: '30 minutes before', abbr: '30m' },
  { value: 60, label: '1 hour before', abbr: '1h' },
  { value: 120, label: '2 hours before', abbr: '2h' },
  { value: 1440, label: '1 day before', abbr: '1d' },
  { value: 2880, label: '2 days before', abbr: '2d' },
  { value: 10080, label: '1 week before', abbr: '1w' },
] as const;

// Extend Todo interface
export interface Todo {
  id: number;
  user_id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  recurrence_pattern: RecurrencePattern;
  reminder_minutes: ReminderMinutes; // NEW
  last_notification_sent: string | null; // NEW
  created_at: string;
  updated_at: string;
}

// Notification check response
export interface PendingNotification {
  id: number;
  title: string;
  due_date: string;
  reminder_minutes: number;
}
```

#### Database Interface Updates (`lib/db.ts`)

Add validation and helper functions:

```typescript
// Validate reminder_minutes value
export function validateReminderMinutes(minutes: any): ReminderMinutes {
  if (minutes === null || minutes === undefined) return null;
  const numMinutes = parseInt(String(minutes), 10);
  if ([15, 30, 60, 120, 1440, 2880, 10080].includes(numMinutes)) {
    return numMinutes as ReminderMinutes;
  }
  return null;
}

// Calculate notification time (Singapore timezone)
export function calculateNotificationTime(
  dueDate: string,
  reminderMinutes: number
): Date {
  const { getSingaporeDate } = require('./timezone');
  const due = getSingaporeDate(dueDate);
  const notificationTime = new Date(due.getTime() - reminderMinutes * 60 * 1000);
  return notificationTime;
}

// Format reminder for display
export function formatReminderLabel(minutes: ReminderMinutes): string | null {
  if (!minutes) return null;
  const option = REMINDER_OPTIONS.find(opt => opt.value === minutes);
  return option?.label ?? null;
}

// Get abbreviated reminder text
export function getReminderAbbreviation(minutes: ReminderMinutes): string | null {
  if (!minutes) return null;
  const option = REMINDER_OPTIONS.find(opt => opt.value === minutes);
  return option?.abbr ?? null;
}

// Check if notification should be sent
export function shouldSendNotification(
  dueDate: string,
  reminderMinutes: number,
  lastNotificationSent: string | null
): boolean {
  const { getSingaporeNow } = require('./timezone');
  
  // Already sent
  if (lastNotificationSent !== null) return false;
  
  // Calculate notification time
  const notificationTime = calculateNotificationTime(dueDate, reminderMinutes);
  const now = getSingaporeNow();
  
  // Current time is at or past notification time
  return now >= notificationTime;
}
```

Update `todoDB` methods:

```typescript
export const todoDB = {
  // ... existing methods ...

  // Get pending notifications for user
  getPendingNotifications(userId: number): PendingNotification[] {
    const { getSingaporeNow, toSingaporeISO } = require('./timezone');
    const now = toSingaporeISO(getSingaporeNow());

    const query = `
      SELECT id, title, due_date, reminder_minutes
      FROM todos
      WHERE user_id = ?
        AND completed = 0
        AND due_date IS NOT NULL
        AND reminder_minutes IS NOT NULL
        AND last_notification_sent IS NULL
        AND datetime(due_date, '-' || reminder_minutes || ' minutes') <= datetime(?)
      ORDER BY due_date ASC
    `;

    return db.prepare(query).all(userId, now) as PendingNotification[];
  },

  // Mark notification as sent
  markNotificationSent(todoId: number, userId: number): void {
    const { getSingaporeNow, toSingaporeISO } = require('./timezone');
    const now = toSingaporeISO(getSingaporeNow());

    const query = `
      UPDATE todos
      SET last_notification_sent = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `;

    db.prepare(query).run(now, now, todoId, userId);
  },

  // Update reminder (resets last_notification_sent)
  updateReminder(todoId: number, userId: number, reminderMinutes: ReminderMinutes): void {
    const { getSingaporeNow, toSingaporeISO } = require('./timezone');
    const now = toSingaporeISO(getSingaporeNow());

    const query = `
      UPDATE todos
      SET reminder_minutes = ?, last_notification_sent = NULL, updated_at = ?
      WHERE id = ? AND user_id = ?
    `;

    db.prepare(query).run(reminderMinutes, now, todoId, userId);
  },
};
```

### API Endpoints

#### `GET /api/notifications/check`
Check for pending notifications and mark them as sent.

**Request:**
```typescript
// No body, uses session userId
```

**Response:**
```typescript
{
  notifications: PendingNotification[]
}
```

**Implementation:**
```typescript
// app/api/notifications/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { todoDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Get pending notifications
    const notifications = todoDB.getPendingNotifications(session.userId);

    // Mark each as sent (prevents duplicates)
    notifications.forEach(notification => {
      todoDB.markNotificationSent(notification.id, session.userId);
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Notification check error:', error);
    return NextResponse.json(
      { error: 'Failed to check notifications' },
      { status: 500 }
    );
  }
}
```

**Error Cases:**
- 401: User not authenticated
- 500: Database query failure

#### Update `POST /api/todos`
Add reminder validation when creating todos.

**Request:**
```typescript
{
  title: string;
  priority?: Priority;
  due_date?: string;
  recurrence_pattern?: RecurrencePattern;
  reminder_minutes?: ReminderMinutes; // NEW
}
```

**Validation:**
```typescript
import { validateReminderMinutes } from '@/lib/db';

// In POST handler:
const reminder_minutes = validateReminderMinutes(body.reminder_minutes);

// Validation: reminder requires due_date
if (reminder_minutes !== null && !due_date) {
  return NextResponse.json(
    { error: 'Reminder requires a due date' },
    { status: 400 }
  );
}

// Create todo with reminder
const todo = todoDB.create({
  user_id: session.userId,
  title,
  priority,
  due_date,
  recurrence_pattern,
  reminder_minutes, // NEW
  last_notification_sent: null, // NEW (explicitly set)
});
```

#### Update `PUT /api/todos/[id]`
Handle reminder updates and reset `last_notification_sent`.

**Request:**
```typescript
{
  title?: string;
  completed?: boolean;
  priority?: Priority;
  due_date?: string;
  recurrence_pattern?: RecurrencePattern;
  reminder_minutes?: ReminderMinutes; // NEW
}
```

**Implementation:**
```typescript
// In PUT handler:
const reminder_minutes = validateReminderMinutes(body.reminder_minutes);

// If removing due_date, also remove reminder
if (body.due_date === null) {
  updateData.reminder_minutes = null;
  updateData.last_notification_sent = null;
}

// If changing reminder, reset last_notification_sent
if ('reminder_minutes' in body) {
  updateData.reminder_minutes = reminder_minutes;
  updateData.last_notification_sent = null; // Reset for new reminder time
}

// Validate: reminder requires due_date
if (reminder_minutes !== null && !existingTodo.due_date && !updateData.due_date) {
  return NextResponse.json(
    { error: 'Reminder requires a due date' },
    { status: 400 }
  );
}

// Special handling for recurring todos (existing logic)
if (body.completed && existingTodo.recurrence_pattern !== 'none') {
  // Create next instance with same reminder_minutes
  const nextInstance = createNextRecurringInstance(existingTodo, session.userId);
  // nextInstance inherits reminder_minutes, last_notification_sent = null
}
```

### Frontend Implementation

#### Notification Permission Hook

Create `lib/hooks/useNotifications.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [enabled, setEnabled] = useState(false);

  // Check initial permission state
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setEnabled(Notification.permission === 'granted');
      
      // Check localStorage for explicit disable
      const savedState = localStorage.getItem('notifications-enabled');
      if (savedState === 'false') {
        setEnabled(false);
      }
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      setEnabled(true);
      localStorage.setItem('notifications-enabled', 'true');
      return true;
    } else {
      setEnabled(false);
      localStorage.setItem('notifications-enabled', 'false');
      return false;
    }
  }, []);

  // Show notification
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (enabled && permission === 'granted') {
      new Notification(title, options);
    }
  }, [enabled, permission]);

  // Disable notifications (user choice)
  const disableNotifications = useCallback(() => {
    setEnabled(false);
    localStorage.setItem('notifications-enabled', 'false');
  }, []);

  return {
    permission,
    enabled,
    requestPermission,
    showNotification,
    disableNotifications,
  };
}
```

#### Notification Polling Hook

Create `lib/hooks/useNotificationPolling.ts`:

```typescript
import { useEffect, useCallback } from 'react';
import { PendingNotification } from '@/lib/db';
import { formatSingaporeDateTime } from '@/lib/timezone';

interface UseNotificationPollingProps {
  enabled: boolean;
  showNotification: (title: string, options?: NotificationOptions) => void;
}

export function useNotificationPolling({ enabled, showNotification }: UseNotificationPollingProps) {
  const checkNotifications = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await fetch('/api/notifications/check');
      if (!response.ok) return;

      const data = await response.json();
      const notifications: PendingNotification[] = data.notifications || [];

      // Show browser notifications
      notifications.forEach(notification => {
        const dueDateTime = formatSingaporeDateTime(notification.due_date);
        showNotification(`📋 ${notification.title}`, {
          body: `Due: ${dueDateTime}`,
          icon: '/favicon.ico',
          tag: `todo-${notification.id}`, // Prevent duplicates
          requireInteraction: true, // Notification persists
        });
      });
    } catch (error) {
      console.error('Notification polling error:', error);
    }
  }, [enabled, showNotification]);

  // Poll every minute
  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkNotifications();

    // Set up interval (60 seconds)
    const intervalId = setInterval(checkNotifications, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [enabled, checkNotifications]);
}
```

#### UI Components

##### Enable Notifications Button

```typescript
// app/page.tsx (add to main todo page)
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useNotificationPolling } from '@/lib/hooks/useNotificationPolling';

export default function TodoPage() {
  const { permission, enabled, requestPermission, showNotification } = useNotifications();
  
  // Start polling when enabled
  useNotificationPolling({ enabled, showNotification });

  return (
    <div className="container mx-auto p-6">
      {/* Header with notification button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-white">My Todos</h1>
        
        <button
          onClick={requestPermission}
          disabled={enabled}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            enabled
              ? 'bg-green-500 text-white cursor-default'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {enabled ? '🔔 Notifications On' : '🔔 Enable Notifications'}
        </button>
      </div>

      {/* Rest of todo UI */}
    </div>
  );
}
```

##### Reminder Selector Component

```typescript
// components/ReminderSelector.tsx
import { ReminderMinutes, REMINDER_OPTIONS } from '@/lib/db';

interface ReminderSelectorProps {
  value: ReminderMinutes;
  onChange: (value: ReminderMinutes) => void;
  disabled?: boolean;
  className?: string;
}

export function ReminderSelector({ value, onChange, disabled, className = '' }: ReminderSelectorProps) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
        onChange(val as ReminderMinutes);
      }}
      disabled={disabled}
      className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
        dark:bg-gray-700 dark:border-gray-600 dark:text-white
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label="Reminder timing"
    >
      {REMINDER_OPTIONS.map(option => (
        <option key={option.label} value={option.value ?? ''}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
```

##### Reminder Badge Component

```typescript
// components/ReminderBadge.tsx
import { ReminderMinutes, getReminderAbbreviation } from '@/lib/db';

interface ReminderBadgeProps {
  reminderMinutes: ReminderMinutes;
}

export function ReminderBadge({ reminderMinutes }: ReminderBadgeProps) {
  const abbr = getReminderAbbreviation(reminderMinutes);
  
  if (!abbr) return null;

  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
      bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      title={`Reminder: ${abbr} before due`}
    >
      🔔 {abbr}
    </span>
  );
}
```

##### Todo Form Integration

```typescript
// In TodoForm component:
import { ReminderSelector } from '@/components/ReminderSelector';

function TodoForm() {
  const [dueDate, setDueDate] = useState<string>('');
  const [reminderMinutes, setReminderMinutes] = useState<ReminderMinutes>(null);

  // Disable reminder if no due date
  const reminderDisabled = !dueDate;

  // Reset reminder when due date removed
  useEffect(() => {
    if (!dueDate) {
      setReminderMinutes(null);
    }
  }, [dueDate]);

  return (
    <form onSubmit={handleSubmit}>
      {/* ... other fields ... */}
      
      <div className="space-y-2">
        <label className="block text-sm font-medium dark:text-gray-300">
          Due Date
        </label>
        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium dark:text-gray-300">
          Reminder {reminderDisabled && <span className="text-gray-400">(requires due date)</span>}
        </label>
        <ReminderSelector
          value={reminderMinutes}
          onChange={setReminderMinutes}
          disabled={reminderDisabled}
        />
      </div>

      {/* ... submit button ... */}
    </form>
  );
}
```

##### Todo Item Display

```typescript
// In TodoItem component:
import { ReminderBadge } from '@/components/ReminderBadge';

function TodoItem({ todo }: { todo: Todo }) {
  return (
    <div className="todo-item">
      {/* ... checkbox, title ... */}
      
      <div className="flex gap-2">
        <PriorityBadge priority={todo.priority} />
        {todo.recurrence_pattern !== 'none' && <RecurrenceBadge pattern={todo.recurrence_pattern} />}
        <ReminderBadge reminderMinutes={todo.reminder_minutes} />
        {/* ... other badges ... */}
      </div>

      {/* ... actions ... */}
    </div>
  );
}
```

### Timezone Integration

All reminder calculations must use Singapore timezone utilities from `lib/timezone.ts`:

```typescript
// lib/timezone.ts (extend existing utilities)
export function calculateReminderTime(dueDate: string, reminderMinutes: number): Date {
  const due = getSingaporeDate(dueDate);
  const reminderTime = new Date(due.getTime() - reminderMinutes * 60 * 1000);
  return reminderTime;
}

export function formatNotificationTime(dueDate: string): string {
  return formatSingaporeDateTime(dueDate); // "Feb 5, 2026, 2:00 PM"
}

export function isReminderDue(dueDate: string, reminderMinutes: number): boolean {
  const now = getSingaporeNow();
  const reminderTime = calculateReminderTime(dueDate, reminderMinutes);
  return now >= reminderTime;
}
```

---

## Edge Cases

### 1. Permission Denied
**Scenario:** User denies browser notification permission

**Handling:**
- Button remains orange "🔔 Enable Notifications"
- Show toast: "Notification permission denied. Check browser settings."
- Reminders still saveable to database
- No notifications triggered
- User can re-enable in browser settings and click button again

**Implementation:**
```typescript
const requestPermission = async () => {
  const result = await Notification.requestPermission();
  if (result === 'denied') {
    toast.error('Notification permission denied. Check browser settings.');
  }
};
```

### 2. Browser Doesn't Support Notifications
**Scenario:** User's browser lacks Notification API

**Handling:**
- Hide "Enable Notifications" button
- Reminders still saveable
- Show info banner: "Browser notifications not supported"
- Reminder badges still visible in UI

**Implementation:**
```typescript
if (!('Notification' in window)) {
  return null; // Don't render button
}
```

### 3. Reminder Time in the Past
**Scenario:** User sets due date tomorrow, reminder "1 week before" (impossible)

**Handling:**
- Allow saving (user may extend due date later)
- Notification won't trigger until due date is far enough in future
- No error shown to user
- Backend query filters out impossible reminders (`reminder_time <= now`)

**Database Query:**
```sql
-- Only matches if reminder time is now or past
datetime(due_date, '-' || reminder_minutes || ' minutes') <= datetime(?)
```

### 4. Overdue Reminder (Never Sent)
**Scenario:** Reminder time was yesterday, user just opened app

**Handling:**
- `last_notification_sent` is NULL
- Backend query includes this todo
- Notification sent immediately
- `last_notification_sent` updated to prevent re-sending
- User gets late notification for overdue task

**User Experience:**
- Helpful for catching missed tasks
- One-time notification per reminder

### 5. Overdue Reminder (Already Sent)
**Scenario:** Reminder sent yesterday, user opens app today

**Handling:**
- `last_notification_sent` has timestamp
- Backend query excludes this todo
- No duplicate notification
- User doesn't get spammed

### 6. Changing Reminder Time
**Scenario:** User changes reminder from "1 hour before" to "1 day before"

**Handling:**
- PUT request sets new `reminder_minutes`
- PUT request sets `last_notification_sent = NULL`
- Allows notification to be sent at new time
- Previous notification (if sent) is forgotten

**Implementation:**
```typescript
if ('reminder_minutes' in updateData) {
  updateData.last_notification_sent = null;
}
```

### 7. Removing Due Date
**Scenario:** User removes due date from todo with reminder

**Handling:**
- Automatically remove reminder (reminder requires due date)
- Set `reminder_minutes = NULL`
- Set `last_notification_sent = NULL`
- Remove bell badge from UI
- No validation error

**Implementation:**
```typescript
if (updateData.due_date === null) {
  updateData.reminder_minutes = null;
  updateData.last_notification_sent = null;
}
```

### 8. Completing Recurring Todo
**Scenario:** User completes recurring weekly todo with "15 minutes before" reminder

**Handling:**
- Mark current instance as complete
- Create next instance with:
  - New due date (next week)
  - Same `reminder_minutes = 15`
  - `last_notification_sent = NULL` (reset for new instance)
- Next instance gets its own notification

**Implementation:**
```typescript
const nextInstance = {
  ...existingTodo,
  completed: false,
  due_date: calculateNextDueDate(existingTodo.due_date, existingTodo.recurrence_pattern),
  reminder_minutes: existingTodo.reminder_minutes, // Inherit
  last_notification_sent: null, // Reset
};
```

### 9. Deleting Todo with Reminder
**Scenario:** User deletes todo that has pending reminder

**Handling:**
- Todo deleted from database
- No notification sent (todo doesn't exist)
- No orphaned notification data
- Polling query won't find deleted todo

### 10. Multiple Tabs Open
**Scenario:** User has app open in 3 browser tabs

**Handling:**
- Each tab polls independently
- Backend marks `last_notification_sent` on first tab's request
- Subsequent tab requests get empty array (notification already sent)
- Only one notification shown (browser deduplicates by tag)

**Browser Notification Tag:**
```typescript
showNotification('Title', {
  tag: `todo-${notification.id}`, // Deduplicates across tabs
});
```

### 11. Rapid Reminder Changes
**Scenario:** User changes reminder 3 times in 10 seconds

**Handling:**
- Each change resets `last_notification_sent = NULL`
- Optimistic UI updates immediately
- Final saved value determines notification time
- No race conditions (sequential PUT requests)

### 12. System Clock Skew
**Scenario:** User's device clock is wrong

**Handling:**
- Backend uses server time (Singapore timezone)
- Notifications based on server time, not client time
- Client polling triggers based on server response
- User may see unexpected notification timing if clock skewed

**Mitigation:**
- Use server-side timestamps for all calculations
- Display server time in UI (from API responses)

### 13. Notification While App Closed
**Scenario:** Reminder time arrives, all browser tabs closed

**Handling:**
- No notification sent (requires active tab polling)
- Next time user opens app, overdue notification sent (Edge Case #4)
- `last_notification_sent` updated on first open
- User gets notification, just delayed

**Future Enhancement:**
- Service worker for background notifications (out of scope)

### 14. Same Reminder Time for Multiple Todos
**Scenario:** User has 5 todos all due tomorrow at 2 PM with "1 hour before" reminder

**Handling:**
- Backend returns all 5 todos in single API response
- Frontend shows 5 separate notifications
- Each notification tagged separately (`todo-${id}`)
- All 5 marked as sent in same request

**User Experience:**
- May see notification burst
- Can disable notifications if annoying

---

## Acceptance Criteria

### Functional Requirements

#### FR1: Enable Notifications
- [ ] "🔔 Enable Notifications" button visible in top-right corner (orange background)
- [ ] Click triggers browser permission request
- [ ] After granting permission, button changes to "🔔 Notifications On" (green background)
- [ ] Permission state persists across sessions via localStorage
- [ ] If permission denied, button shows error message
- [ ] Button hidden if browser doesn't support Notification API

#### FR2: Set Reminder on New Todo
- [ ] "Reminder" dropdown appears in todo form
- [ ] Dropdown disabled when no due date is set
- [ ] Seven options available: 15m, 30m, 1h, 2h, 1d, 2d, 1w, None
- [ ] Selected reminder saves to database as `reminder_minutes`
- [ ] `last_notification_sent` initialized to NULL
- [ ] Validation: Cannot save reminder without due date (400 error)

#### FR3: Display Reminder Badge
- [ ] Bell badge (🔔) appears on todos with reminders
- [ ] Badge shows abbreviated time: "15m", "30m", "1h", "2h", "1d", "2d", "1w"
- [ ] Badge color: orange background, dark orange text
- [ ] Badge positioned consistently in todo item
- [ ] No badge shown when `reminder_minutes` is NULL

#### FR4: Edit Reminder
- [ ] Can change reminder timing from edit modal
- [ ] Can set reminder to "None" to remove
- [ ] Changing reminder resets `last_notification_sent` to NULL
- [ ] Removing due date automatically removes reminder
- [ ] Validation: Cannot save reminder without due date

#### FR5: Receive Notifications
- [ ] System polls `/api/notifications/check` every 60 seconds
- [ ] Backend query finds todos where reminder time <= current time
- [ ] Backend returns todo id, title, due_date, reminder_minutes
- [ ] Backend updates `last_notification_sent` to current timestamp (Singapore)
- [ ] Frontend shows browser notification with todo title and due date/time
- [ ] Notification uses tag `todo-${id}` to prevent duplicates
- [ ] Notification has `requireInteraction: true` to persist

#### FR6: Duplicate Prevention
- [ ] Notification only sent once per reminder (checked via `last_notification_sent`)
- [ ] Once sent, `last_notification_sent` has ISO8601 timestamp
- [ ] Subsequent polling queries exclude this todo
- [ ] Changing reminder resets `last_notification_sent` to NULL
- [ ] Overdue reminders (never sent) still send notification once

#### FR7: Recurring Todo Reminder Inheritance
- [ ] When completing recurring todo, next instance inherits `reminder_minutes`
- [ ] Next instance has `last_notification_sent = NULL`
- [ ] Notification sent for each occurrence independently
- [ ] Changing reminder on one instance doesn't affect others

#### FR8: Remove Reminder with Due Date
- [ ] Removing due date automatically sets `reminder_minutes = NULL`
- [ ] Removing due date sets `last_notification_sent = NULL`
- [ ] Bell badge removed from UI
- [ ] No validation error shown

### Non-Functional Requirements

#### NFR1: Performance
- [ ] Polling interval exactly 60 seconds
- [ ] Backend query uses indexed columns (user_id, due_date, reminder_minutes)
- [ ] Query returns results in < 100ms for 10,000 todos
- [ ] No memory leaks from polling interval

#### NFR2: Singapore Timezone
- [ ] All `last_notification_sent` timestamps use Singapore timezone
- [ ] Reminder time calculation uses Singapore timezone
- [ ] Due date display in notification uses Singapore timezone format
- [ ] Backend query compares Singapore timezone timestamps

#### NFR3: Accessibility
- [ ] "Reminder" dropdown has `aria-label="Reminder timing"`
- [ ] Disabled reminder dropdown shows "(requires due date)" hint
- [ ] Bell badge has title tooltip: "Reminder: {abbr} before due"
- [ ] Enable notifications button has clear text label

#### NFR4: Dark Mode
- [ ] Reminder selector styled for dark mode (dark:bg-gray-700)
- [ ] Bell badge readable in dark mode (dark:bg-orange-900)
- [ ] Enable notifications button contrasts in dark mode
- [ ] Notification icon visible in dark mode

#### NFR5: Browser Compatibility
- [ ] Works in Chrome, Firefox, Safari, Edge (latest versions)
- [ ] Gracefully degrades if Notification API unavailable
- [ ] localStorage fallback for permission state
- [ ] No console errors in unsupported browsers

---

## Testing Requirements

### E2E Tests (Playwright)

Create `tests/04-reminders-notifications.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers';

test.describe('Reminders & Notifications', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new TestHelper(page, context);
    await helper.setupAuthenticatedSession();
    
    // Grant notification permission automatically
    await context.grantPermissions(['notifications']);
  });

  test('should show enable notifications button', async ({ page }) => {
    await page.goto('/');
    
    const enableButton = page.locator('button:has-text("Enable Notifications")');
    await expect(enableButton).toBeVisible();
    await expect(enableButton).toHaveClass(/bg-orange-500/);
  });

  test('should enable notifications and show green badge', async ({ page }) => {
    await page.goto('/');
    
    const enableButton = page.locator('button:has-text("Enable Notifications")');
    await enableButton.click();
    
    // Button should change to "Notifications On" with green background
    await expect(enableButton).toContainText('Notifications On');
    await expect(enableButton).toHaveClass(/bg-green-500/);
    
    // Permission state saved to localStorage
    const enabled = await page.evaluate(() => localStorage.getItem('notifications-enabled'));
    expect(enabled).toBe('true');
  });

  test('should disable reminder dropdown when no due date', async ({ page }) => {
    await page.goto('/');
    
    const reminderSelect = page.locator('select[aria-label="Reminder timing"]');
    await expect(reminderSelect).toBeDisabled();
    
    // Hint text visible
    await expect(page.locator('text=requires due date')).toBeVisible();
  });

  test('should enable reminder dropdown when due date set', async ({ page }) => {
    await page.goto('/');
    
    // Set due date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDateInput = page.locator('input[type="datetime-local"]');
    await dueDateInput.fill(tomorrow.toISOString().slice(0, 16));
    
    // Reminder dropdown enabled
    const reminderSelect = page.locator('select[aria-label="Reminder timing"]');
    await expect(reminderSelect).toBeEnabled();
  });

  test('should create todo with reminder and show bell badge', async ({ page }) => {
    await page.goto('/');
    
    const title = 'Client presentation';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Fill form
    await helper.fillTodoForm({
      title,
      dueDate: tomorrow.toISOString().slice(0, 16),
    });
    
    // Set reminder
    await page.locator('select[aria-label="Reminder timing"]').selectOption('60'); // 1 hour
    await page.click('button:has-text("Add")');
    
    // Todo created
    const todoItem = page.locator(`text="${title}"`).locator('..');
    await expect(todoItem).toBeVisible();
    
    // Bell badge visible
    const badge = todoItem.locator('span:has-text("🔔 1h")');
    await expect(badge).toBeVisible();
  });

  test('should show all 7 reminder options', async ({ page }) => {
    await page.goto('/');
    
    // Set due date to enable dropdown
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.locator('input[type="datetime-local"]').fill(tomorrow.toISOString().slice(0, 16));
    
    const reminderSelect = page.locator('select[aria-label="Reminder timing"]');
    const options = await reminderSelect.locator('option').allTextContents();
    
    expect(options).toContain('None');
    expect(options).toContain('15 minutes before');
    expect(options).toContain('30 minutes before');
    expect(options).toContain('1 hour before');
    expect(options).toContain('2 hours before');
    expect(options).toContain('1 day before');
    expect(options).toContain('2 days before');
    expect(options).toContain('1 week before');
  });

  test('should edit reminder and update badge', async ({ page }) => {
    await page.goto('/');
    
    // Create todo with 1 hour reminder
    const title = 'Submit report';
    const todo = await helper.createTodo({
      title,
      dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      reminderMinutes: 60,
    });
    
    // Edit todo
    await page.click(`text="${title}"`);
    await page.click('button:has-text("Edit")');
    
    // Change reminder to 1 day
    await page.locator('select[aria-label="Reminder timing"]').selectOption('1440');
    await page.click('button:has-text("Save")');
    
    // Badge updated
    const badge = page.locator(`text="${title}"`).locator('..').locator('span:has-text("🔔 1d")');
    await expect(badge).toBeVisible();
  });

  test('should remove reminder when set to None', async ({ page }) => {
    await page.goto('/');
    
    // Create todo with reminder
    const title = 'Meeting prep';
    await helper.createTodo({
      title,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      reminderMinutes: 30,
    });
    
    // Edit and remove reminder
    await page.click(`text="${title}"`);
    await page.click('button:has-text("Edit")');
    await page.locator('select[aria-label="Reminder timing"]').selectOption(''); // None
    await page.click('button:has-text("Save")');
    
    // No bell badge
    const todoItem = page.locator(`text="${title}"`).locator('..');
    await expect(todoItem.locator('span:has-text("🔔")')).not.toBeVisible();
  });

  test('should remove reminder when due date removed', async ({ page }) => {
    await page.goto('/');
    
    // Create todo with reminder
    const title = 'Task with reminder';
    await helper.createTodo({
      title,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      reminderMinutes: 60,
    });
    
    // Edit and remove due date
    await page.click(`text="${title}"`);
    await page.click('button:has-text("Edit")');
    await page.locator('input[type="datetime-local"]').clear();
    await page.click('button:has-text("Save")');
    
    // No bell badge
    const todoItem = page.locator(`text="${title}"`).locator('..');
    await expect(todoItem.locator('span:has-text("🔔")')).not.toBeVisible();
  });

  test('should inherit reminder in recurring todo', async ({ page }) => {
    await page.goto('/');
    
    // Create recurring weekly todo with reminder
    const title = 'Team standup';
    const todo = await helper.createTodo({
      title,
      dueDate: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      recurrencePattern: 'weekly',
      reminderMinutes: 15,
    });
    
    // Complete todo
    await page.click(`text="${title}"`).locator('..').locator('input[type="checkbox"]');
    
    // Next instance should have reminder badge
    const instances = page.locator(`text="${title}"`);
    await expect(instances.first().locator('..').locator('span:has-text("🔔 15m")')).toBeVisible();
  });

  test('should poll for notifications every minute', async ({ page }) => {
    await page.goto('/');
    
    // Enable notifications
    const enableButton = page.locator('button:has-text("Enable Notifications")');
    await enableButton.click();
    
    // Listen for API calls
    let pollCount = 0;
    page.on('request', request => {
      if (request.url().includes('/api/notifications/check')) {
        pollCount++;
      }
    });
    
    // Wait 2 minutes
    await page.waitForTimeout(120000);
    
    // Should have polled at least twice
    expect(pollCount).toBeGreaterThanOrEqual(2);
  });

  test('should send notification when reminder time arrives', async ({ page, context }) => {
    await page.goto('/');
    
    // Enable notifications
    await page.locator('button:has-text("Enable Notifications")').click();
    
    // Create todo with reminder in 1 minute
    const dueDate = new Date(Date.now() + 120000); // 2 minutes from now
    await helper.createTodo({
      title: 'Urgent task',
      dueDate: dueDate.toISOString(),
      reminderMinutes: 1, // 1 minute before (so notification in ~1 minute)
    });
    
    // Wait for notification
    const notification = await context.waitForEvent('notification', { timeout: 90000 });
    
    expect(notification.title()).toContain('Urgent task');
    expect(notification.body()).toContain('Due:');
  });

  test('should not send duplicate notifications', async ({ page, context }) => {
    await page.goto('/');
    
    // Enable notifications
    await page.locator('button:has-text("Enable Notifications")').click();
    
    // Create todo with overdue reminder (notification should send immediately)
    const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
    await helper.createTodo({
      title: 'Overdue task',
      dueDate: pastDate.toISOString(),
      reminderMinutes: 120, // 2 hours before (so notification was 3 hours ago)
    });
    
    // Track notifications
    let notificationCount = 0;
    context.on('notification', () => {
      notificationCount++;
    });
    
    // Wait 2 minutes for polling
    await page.waitForTimeout(120000);
    
    // Should only receive 1 notification
    expect(notificationCount).toBe(1);
  });

  test('should display correct bell badge abbreviations', async ({ page }) => {
    const testCases = [
      { minutes: 15, abbr: '15m' },
      { minutes: 30, abbr: '30m' },
      { minutes: 60, abbr: '1h' },
      { minutes: 120, abbr: '2h' },
      { minutes: 1440, abbr: '1d' },
      { minutes: 2880, abbr: '2d' },
      { minutes: 10080, abbr: '1w' },
    ];
    
    for (const { minutes, abbr } of testCases) {
      await page.goto('/');
      
      const title = `Task ${abbr}`;
      await helper.createTodo({
        title,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        reminderMinutes: minutes,
      });
      
      const badge = page.locator(`text="${title}"`).locator('..').locator(`span:has-text("🔔 ${abbr}")`);
      await expect(badge).toBeVisible();
    }
  });
});
```

### Unit Tests

Create `tests/unit/reminders.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { todoDB, validateReminderMinutes, shouldSendNotification } from '@/lib/db';
import { getSingaporeNow, toSingaporeISO } from '@/lib/timezone';

describe('Reminder Validation', () => {
  it('should validate correct reminder values', () => {
    expect(validateReminderMinutes(15)).toBe(15);
    expect(validateReminderMinutes(30)).toBe(30);
    expect(validateReminderMinutes(60)).toBe(60);
    expect(validateReminderMinutes(120)).toBe(120);
    expect(validateReminderMinutes(1440)).toBe(1440);
    expect(validateReminderMinutes(2880)).toBe(2880);
    expect(validateReminderMinutes(10080)).toBe(10080);
    expect(validateReminderMinutes(null)).toBe(null);
  });

  it('should reject invalid reminder values', () => {
    expect(validateReminderMinutes(10)).toBe(null);
    expect(validateReminderMinutes(500)).toBe(null);
    expect(validateReminderMinutes(-15)).toBe(null);
    expect(validateReminderMinutes('invalid')).toBe(null);
  });

  it('should handle string inputs', () => {
    expect(validateReminderMinutes('15')).toBe(15);
    expect(validateReminderMinutes('60')).toBe(60);
    expect(validateReminderMinutes('100')).toBe(null);
  });
});

describe('Notification Timing', () => {
  it('should determine if notification should be sent (due)', () => {
    const now = getSingaporeNow();
    const dueDate = new Date(now.getTime() + 3600000); // 1 hour from now
    const reminderMinutes = 60; // 1 hour before
    
    // Reminder time is now, should send
    const result = shouldSendNotification(toSingaporeISO(dueDate), reminderMinutes, null);
    expect(result).toBe(true);
  });

  it('should determine if notification should be sent (not yet)', () => {
    const now = getSingaporeNow();
    const dueDate = new Date(now.getTime() + 7200000); // 2 hours from now
    const reminderMinutes = 60; // 1 hour before
    
    // Reminder time is 1 hour from now, should not send yet
    const result = shouldSendNotification(toSingaporeISO(dueDate), reminderMinutes, null);
    expect(result).toBe(false);
  });

  it('should not send if already sent', () => {
    const now = getSingaporeNow();
    const dueDate = new Date(now.getTime() + 3600000);
    const reminderMinutes = 60;
    const lastSent = toSingaporeISO(new Date(now.getTime() - 60000)); // Sent 1 minute ago
    
    const result = shouldSendNotification(toSingaporeISO(dueDate), reminderMinutes, lastSent);
    expect(result).toBe(false);
  });

  it('should send overdue notification if never sent', () => {
    const now = getSingaporeNow();
    const dueDate = new Date(now.getTime() - 3600000); // 1 hour ago
    const reminderMinutes = 120; // 2 hours before (so reminder was 3 hours ago)
    
    const result = shouldSendNotification(toSingaporeISO(dueDate), reminderMinutes, null);
    expect(result).toBe(true);
  });
});

describe('Database Operations', () => {
  let userId: number;

  beforeEach(() => {
    // Create test user
    userId = userDB.create({ username: 'test-reminder-user' });
  });

  it('should create todo with reminder', () => {
    const dueDate = toSingaporeISO(new Date(Date.now() + 86400000));
    
    const todo = todoDB.create({
      user_id: userId,
      title: 'Task with reminder',
      priority: 'medium',
      due_date: dueDate,
      recurrence_pattern: 'none',
      reminder_minutes: 60,
      last_notification_sent: null,
    });
    
    expect(todo.reminder_minutes).toBe(60);
    expect(todo.last_notification_sent).toBeNull();
  });

  it('should find pending notifications', () => {
    const now = getSingaporeNow();
    const dueDate = new Date(now.getTime() + 3600000); // 1 hour from now
    
    // Create todo with reminder due now
    todoDB.create({
      user_id: userId,
      title: 'Pending notification',
      due_date: toSingaporeISO(dueDate),
      reminder_minutes: 60, // 1 hour before = now
      last_notification_sent: null,
    });
    
    const pending = todoDB.getPendingNotifications(userId);
    expect(pending.length).toBe(1);
    expect(pending[0].title).toBe('Pending notification');
  });

  it('should not find already-sent notifications', () => {
    const now = getSingaporeNow();
    const dueDate = new Date(now.getTime() + 3600000);
    
    // Create todo with sent notification
    const todo = todoDB.create({
      user_id: userId,
      title: 'Already notified',
      due_date: toSingaporeISO(dueDate),
      reminder_minutes: 60,
      last_notification_sent: null,
    });
    
    // Mark as sent
    todoDB.markNotificationSent(todo.id, userId);
    
    const pending = todoDB.getPendingNotifications(userId);
    expect(pending.length).toBe(0);
  });

  it('should update reminder and reset last_notification_sent', () => {
    const dueDate = toSingaporeISO(new Date(Date.now() + 86400000));
    
    const todo = todoDB.create({
      user_id: userId,
      title: 'Task',
      due_date: dueDate,
      reminder_minutes: 60,
      last_notification_sent: toSingaporeISO(getSingaporeNow()),
    });
    
    // Update reminder
    todoDB.updateReminder(todo.id, userId, 1440);
    
    const updated = todoDB.getById(todo.id, userId);
    expect(updated?.reminder_minutes).toBe(1440);
    expect(updated?.last_notification_sent).toBeNull();
  });
});
```

---

## Out of Scope

The following features are **explicitly excluded** from this implementation:

### 1. Service Worker Notifications
- Background notifications when app is closed
- Push notifications from server
- Notification persistence across browser restarts
- **Reason:** Requires service worker setup, push API, additional complexity

### 2. Custom Reminder Times
- User-defined reminder intervals (e.g., "3 hours before")
- Minute-level granularity beyond preset options
- Multiple reminders per todo
- **Reason:** Seven preset options cover 95% of use cases

### 3. Notification Preferences
- Sound customization
- Notification vibration patterns
- Rich notification actions (snooze, complete)
- **Reason:** Browser API limitations, complexity

### 4. Email/SMS Notifications
- Email reminders as backup
- SMS notifications
- Third-party notification integrations
- **Reason:** Requires external services, authentication

### 5. Snooze Functionality
- "Remind me in 5 minutes" from notification
- Recurring snooze intervals
- Custom snooze times
- **Reason:** Adds UI complexity, use case overlap with editing reminder

### 6. Notification History
- Log of all sent notifications
- "View all notifications" page
- Notification read/unread status
- **Reason:** Browser handles notification history

### 7. Conditional Reminders
- "Only remind if not completed"
- "Remind only on weekdays"
- Location-based reminders
- **Reason:** Complexity, limited browser API support

### 8. Batch Notification Management
- "Disable all reminders"
- "Set default reminder for all new todos"
- Bulk edit reminders
- **Reason:** Can be added later if needed

### 9. Notification Analytics
- "Most effective reminder time" analysis
- Notification click-through rates
- Reminder completion correlation
- **Reason:** Privacy concerns, complexity

### 10. Cross-Device Sync
- Notification state sync across devices
- "Don't notify if completed on another device"
- Cloud-based notification delivery
- **Reason:** Requires backend sync infrastructure

---

## Success Metrics

### User Engagement
- **Target:** 60% of users enable notifications within first week
- **Target:** 40% of created todos have reminders set
- **Target:** Average 2.5 reminder options used per active user

### Notification Delivery
- **Target:** 99% of notifications sent within 1 minute of reminder time
- **Target:** < 0.1% duplicate notification rate
- **Target:** Zero notifications sent for completed/deleted todos

### Performance
- **Target:** Polling request completes in < 100ms (p95)
- **Target:** No memory leaks from polling interval (tested over 24 hours)
- **Target:** Database query uses index (verified with EXPLAIN QUERY PLAN)

### User Satisfaction
- **Target:** < 5% of users disable notifications after enabling
- **Target:** Average todo completion rate 15% higher for todos with reminders
- **Target:** Zero support tickets about duplicate notifications

### Technical Quality
- **Target:** 100% E2E test pass rate
- **Target:** 100% unit test coverage for reminder logic
- **Target:** All acceptance criteria validated

---

## Implementation Notes

### Development Order
1. **Phase 1: Database & Backend**
   - Add `reminder_minutes` and `last_notification_sent` columns
   - Implement validation and helper functions
   - Create `GET /api/notifications/check` endpoint
   - Update `POST /api/todos` and `PUT /api/todos/[id]`

2. **Phase 2: Frontend Components**
   - Create `useNotifications` hook
   - Build ReminderSelector component
   - Build ReminderBadge component
   - Integrate into TodoForm and TodoItem

3. **Phase 3: Polling & Notifications**
   - Create `useNotificationPolling` hook
   - Add "Enable Notifications" button
   - Test browser notification flow
   - Handle permission states

4. **Phase 4: Edge Cases & Polish**
   - Implement duplicate prevention
   - Handle overdue reminders
   - Test recurring todo inheritance
   - Add dark mode styling

5. **Phase 5: Testing**
   - Write E2E tests (14 test cases)
   - Write unit tests (validation, timing, database)
   - Manual testing across browsers
   - Performance testing

### Dependencies
- **Requires:** PRP-01 (Todo CRUD) - database schema, API routes
- **Requires:** PRP-02 (Priority System) - validation patterns
- **Requires:** PRP-03 (Recurring Todos) - metadata inheritance
- **Enhances:** PRP-05 (Subtasks) - can set reminders on parent todos
- **Enhances:** PRP-10 (Calendar View) - show reminders on calendar

### Maintenance Considerations
- Monitor notification permission denial rates
- Track browser compatibility issues
- Review polling frequency based on server load
- Consider rate limiting if abuse detected

---

**Feature Owner:** AI Development Team  
**Last Updated:** February 5, 2026  
**Status:** Ready for Implementation
