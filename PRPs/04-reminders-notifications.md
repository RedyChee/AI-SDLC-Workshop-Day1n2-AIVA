# PRP 04: Reminders & Notifications

## Feature Overview

A browser notification system that alerts users before their todos are due. Users configure a reminder timing (15 minutes to 1 week before due date) per todo. The system polls for pending reminders every minute, triggers browser notifications, and prevents duplicate alerts. Requires browser notification permission and a due date on the todo.

---

## User Stories

1. **As a user**, I want to enable browser notifications so that I receive alerts for upcoming deadlines.
2. **As a user**, I want to set a reminder on a todo to be notified before it's due (e.g., 1 hour before).
3. **As a user**, I want to choose from preset reminder timings so that I get notified at the right time.
4. **As a user**, I want to see a visual indicator on todos with reminders so that I know which tasks will notify me.
5. **As a user**, I want each reminder to fire only once so that I'm not bombarded with duplicate notifications.

---

## User Flow

### Enabling Notifications
1. User sees **"🔔 Enable Notifications"** button (orange, top-right)
2. User clicks the button
3. Browser prompts for notification permission
4. If granted: button changes to **"🔔 Notifications On"** (green badge)
5. If denied: notifications won't work — user must update browser settings

### Setting a Reminder
1. User creates or edits a todo that has a **due date**
2. User selects a timing from the **"Reminder"** dropdown:
   - 15 minutes before
   - 30 minutes before
   - 1 hour before
   - 2 hours before
   - 1 day before
   - 2 days before
   - 1 week before
   - None (default / remove reminder)
3. Reminder dropdown is **disabled** if no due date is set
4. User saves the todo
5. 🔔 badge appears on the todo (e.g., "🔔 1h")

### Receiving a Notification
1. System polls `/api/notifications/check` every 60 seconds
2. When reminder time arrives (e.g., 1 hour before due), notification fires
3. Browser displays notification with todo title and time until due
4. `last_notification_sent` is updated to prevent re-firing
5. Notification persists until user acknowledges it

---

## Technical Requirements

### Database Schema

Reminder fields on the `todos` table:

```sql
reminder_minutes INTEGER,       -- minutes before due date (15, 30, 60, 120, 1440, 2880, 10080)
last_notification_sent TEXT      -- ISO timestamp of when notification was last sent
```

### TypeScript Types

```typescript
interface Todo {
  // ...other fields
  reminder_minutes: number | null;       // null = no reminder
  last_notification_sent: string | null; // null = never sent
}

// Preset reminder options
const REMINDER_OPTIONS = [
  { value: null, label: 'None' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 2880, label: '2 days before' },
  { value: 10080, label: '1 week before' },
];
```

### API Endpoints

#### `GET /api/notifications/check`
- **Auth**: Required
- **Response**: `200 OK` → `{ notifications: PendingNotification[] }`
- **Logic**:
  1. Get all incomplete todos for user with `reminder_minutes` set and `due_date` set
  2. Calculate reminder trigger time: `due_date - reminder_minutes`
  3. Check if current Singapore time ≥ trigger time
  4. Check if `last_notification_sent` is null (not yet sent)
  5. Return todos that should trigger notifications
  6. Update `last_notification_sent` for each returned todo

```typescript
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const now = getSingaporeNow();
  const todos = todoDB.getAll(session.userId);

  const pending = todos.filter(todo => {
    if (todo.completed || !todo.due_date || !todo.reminder_minutes) return false;
    if (todo.last_notification_sent) return false; // Already sent

    const dueDate = new Date(todo.due_date);
    const reminderTime = new Date(dueDate.getTime() - todo.reminder_minutes * 60 * 1000);

    return now >= reminderTime;
  });

  // Mark as sent
  for (const todo of pending) {
    todoDB.update(todo.id, session.userId, {
      last_notification_sent: now.toISOString(),
    });
  }

  return NextResponse.json({ notifications: pending });
}
```

### Reminder Display Labels

```typescript
function getReminderLabel(minutes: number | null): string {
  switch (minutes) {
    case 15: return '15m';
    case 30: return '30m';
    case 60: return '1h';
    case 120: return '2h';
    case 1440: return '1d';
    case 2880: return '2d';
    case 10080: return '1w';
    default: return '';
  }
}
```

### Client-Side Notification Hook

```typescript
// lib/hooks/useNotifications.ts

function useNotifications() {
  const [permission, setPermission] = useState(Notification.permission);

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const checkNotifications = async () => {
    if (permission !== 'granted') return;

    const res = await fetch('/api/notifications/check');
    const data = await res.json();

    for (const todo of data.notifications) {
      new Notification(`Todo Reminder: ${todo.title}`, {
        body: `Due: ${formatSingaporeDate(todo.due_date)}`,
        icon: '/favicon.ico',
      });
    }
  };

  // Poll every 60 seconds
  useEffect(() => {
    if (permission !== 'granted') return;
    const interval = setInterval(checkNotifications, 60000);
    checkNotifications(); // Initial check
    return () => clearInterval(interval);
  }, [permission]);

  return { permission, requestPermission };
}
```

### Polling Mechanism

- **Interval**: Every 60 seconds (60000ms)
- **Initial check**: Runs immediately on mount
- **Cleanup**: Interval cleared on unmount
- **Background**: Works even when tab is in background (browser-dependent)
- **Deduplication**: `last_notification_sent` prevents re-firing

---

## UI Components

### Enable Notifications Button

```tsx
{permission === 'default' && (
  <button onClick={requestPermission} className="bg-orange-500 text-white px-4 py-2 rounded">
    🔔 Enable Notifications
  </button>
)}
{permission === 'granted' && (
  <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
    🔔 Notifications On
  </span>
)}
```

### Reminder Dropdown (Todo Form / Edit Modal)

```tsx
<select
  value={reminderMinutes ?? ''}
  onChange={(e) => setReminderMinutes(e.target.value ? Number(e.target.value) : null)}
  disabled={!dueDate} // Disabled when no due date
>
  <option value="">None</option>
  <option value="15">15 minutes before</option>
  <option value="30">30 minutes before</option>
  <option value="60">1 hour before</option>
  <option value="120">2 hours before</option>
  <option value="1440">1 day before</option>
  <option value="2880">2 days before</option>
  <option value="10080">1 week before</option>
</select>
```

### Reminder Badge (On Todo Item)

```tsx
{todo.reminder_minutes && (
  <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
    🔔 {getReminderLabel(todo.reminder_minutes)}
  </span>
)}
```

Badge abbreviations:
- `🔔 15m` / `🔔 30m` / `🔔 1h` / `🔔 2h` / `🔔 1d` / `🔔 2d` / `🔔 1w`

---

## Edge Cases

1. **No due date**: Reminder dropdown is disabled; `reminder_minutes` should be `null`
2. **Removing due date**: If user removes due date on edit, clear `reminder_minutes` to `null`
3. **Reminder time already passed**: If a user sets a reminder whose trigger time has already passed (e.g., 1 day before but due in 30 mins), the notification fires on the next poll
4. **Browser permission denied**: Show informational message; don't error
5. **Null coalescing**: Always use `todo.reminder_minutes ?? null` when passing to functions
6. **Duplicate prevention**: `last_notification_sent` ensures each reminder fires exactly once
7. **Completing a todo**: If completed before reminder fires, it won't fire (filter checks `todo.completed`)
8. **Recurring todo reminder**: Next instance gets the same `reminder_minutes` but `last_notification_sent` is reset to `null`
9. **Multiple tabs**: Polling runs per tab — may result in duplicate notifications if multiple tabs are open
10. **Singapore timezone**: All reminder time calculations must use Singapore timezone functions

---

## Acceptance Criteria

- [ ] "🔔 Enable Notifications" button appears when permission is not yet granted
- [ ] Clicking the button triggers browser permission prompt
- [ ] After granting, button shows "🔔 Notifications On" (green)
- [ ] Reminder dropdown shows 7 preset timings plus "None"
- [ ] Reminder dropdown is disabled when no due date is set
- [ ] Setting a reminder shows 🔔 badge with abbreviated timing on the todo
- [ ] Browser notification fires at the correct time (due_date - reminder_minutes)
- [ ] Each reminder fires only once (tracked by `last_notification_sent`)
- [ ] Notification includes todo title and due date
- [ ] Completed todos do not trigger notifications
- [ ] Recurring todo next instance inherits `reminder_minutes` with `last_notification_sent` reset
- [ ] Removing due date clears the reminder setting
- [ ] System polls every 60 seconds for pending notifications
- [ ] All time calculations use Singapore timezone

---

## Testing Requirements

### E2E Tests (Playwright)

```typescript
// tests/04-reminders.spec.ts

test('should enable notifications button', async ({ page }) => {
  // Grant notification permission, verify button state changes
});

test('should set reminder on todo with due date', async ({ page }) => {
  // Create todo with due date, set 1h reminder, verify 🔔 badge
});

test('should disable reminder dropdown without due date', async ({ page }) => {
  // Open create form without due date, verify reminder dropdown is disabled
});

test('should display correct reminder badge text', async ({ page }) => {
  // Set each reminder option, verify badge text (15m, 30m, 1h, etc.)
});

test('should clear reminder when due date is removed', async ({ page }) => {
  // Create todo with reminder, edit to remove due date, verify reminder cleared
});

test('should preserve reminder on recurring todo completion', async ({ page }) => {
  // Create recurring todo with reminder, complete, verify new instance has same reminder
});

test('should fire notification via polling API', async ({ page }) => {
  // Create todo with reminder trigger time in the past
  // Call /api/notifications/check
  // Verify notification returned and last_notification_sent updated
});

test('should not re-fire after notification sent', async ({ page }) => {
  // Call check endpoint twice, verify second call returns empty
});
```

### Note on Browser Notification Testing
- Playwright can't fully test browser Notification API
- Test the API endpoint (`/api/notifications/check`) directly for notification logic
- Test UI elements (button state, badges, dropdown) via Playwright

---

## Out of Scope

- Push notifications (requires service worker / push subscription)
- Email or SMS notifications
- Custom notification sounds
- Notification history / log
- Snooze functionality
- Multiple reminders per todo
- Notification preferences per device
- In-app notification center

---

## Success Metrics

- Notifications fire within 60 seconds of the trigger time
- Zero duplicate notifications per reminder (deduplication works)
- 100% of reminders on completed todos are suppressed
- Reminder badges correctly display for all 7 timing options
- Reminder settings correctly persist through todo edits
- Recurring todo next instances correctly inherit reminder offset
