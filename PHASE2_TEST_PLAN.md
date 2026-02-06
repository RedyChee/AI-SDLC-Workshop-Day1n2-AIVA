# Phase 2 Manual Testing Guide

## Prerequisites
1. Server running: `npm run dev`
2. Browser open: http://localhost:3000
3. Authenticated user (register/login with passkey)

## Test Suite 1: Recurring Todos

### Test 1.1: Create Daily Recurring Todo
**Steps:**
1. Fill title: "Daily standup"
2. Set due date: Tomorrow 9:00 AM
3. Select priority: High
4. Check "Repeat" checkbox
5. Select "Daily" from dropdown
6. Click "Add"

**Expected:**
- Todo appears in Pending section
- Shows badges: `[high] [🔄 daily]`
- Due date shows correct time difference

### Test 1.2: Complete Recurring Todo
**Steps:**
1. Check the checkbox on "Daily standup" todo
2. Wait for page to refresh

**Expected:**
- Original todo moves to Completed section
- New instance appears in Pending section
- New instance has:
  - Same title and priority
  - Due date: Tomorrow + 1 day (same time)
  - Same recurring pattern (🔄 daily)
  - Unchecked checkbox

### Test 1.3: Edit Recurring Pattern
**Steps:**
1. Click "Edit" on recurring todo
2. Change recurrence pattern to "Weekly"
3. Click "Update"

**Expected:**
- Badge updates to `[🔄 weekly]`
- Next completion creates instance +1 week

### Test 1.4: Disable Recurring
**Steps:**
1. Click "Edit" on recurring todo
2. Uncheck "Repeat" checkbox
3. Click "Update"

**Expected:**
- Recurring badge removed
- Completing todo does NOT create new instance

## Test Suite 2: Reminders & Notifications

### Test 2.1: Enable Browser Notifications
**Steps:**
1. Click "🔔 Enable notifications" button
2. Allow permission in browser prompt

**Expected:**
- Button disappears
- No errors in console

### Test 2.2: Create Todo with Reminder
**Steps:**
1. Fill title: "Important meeting"
2. Set due date: 2 hours from now
3. Select reminder: "1 hour before"
4. Click "Add"

**Expected:**
- Todo appears with badge: `[🔔 1h]`
- Database has reminder_minutes: 60

### Test 2.3: Receive Notification
**Steps:**
1. Create todo with due date: 5 minutes from now
2. Set reminder: "30 minutes before" (will trigger immediately)
3. Wait up to 60 seconds (polling interval)

**Expected:**
- Browser notification appears with:
  - Title: "🔔 Todo Reminder"
  - Body: Todo title + due time
- Notification only appears once (no duplicates)

### Test 2.4: Reminder Without Due Date
**Steps:**
1. Create todo without due date
2. Try to select reminder

**Expected:**
- Reminder dropdown is disabled
- Cannot select reminder option

### Test 2.5: Clear Reminder
**Steps:**
1. Edit todo with reminder
2. Select "No reminder" from dropdown
3. Click "Update"

**Expected:**
- Reminder badge removed
- No notification triggered

## Test Suite 3: Subtasks & Progress

### Test 3.1: Add First Subtask
**Steps:**
1. Click "+ Add subtasks" on any todo
2. Panel expands
3. Type: "First subtask"
4. Click "Add"

**Expected:**
- Subtask appears in list
- Progress shows: `0/1` (unchecked)
- Progress bar: 0% filled
- Button changes to "▼ Hide subtasks"

### Test 3.2: Add Multiple Subtasks
**Steps:**
1. Add subtask: "Second subtask"
2. Add subtask: "Third subtask"
3. Add subtask: "Fourth subtask"

**Expected:**
- All subtasks appear in order
- Progress shows: `0/4`
- Progress bar: 0% filled

### Test 3.3: Complete Subtasks
**Steps:**
1. Check first subtask
2. Check second subtask

**Expected:**
- Checked subtasks have line-through
- Progress updates: `2/4`
- Progress bar: 50% filled (green)

### Test 3.4: Delete Subtask
**Steps:**
1. Click "✕" on third subtask
2. Confirm deletion (if prompted)

**Expected:**
- Subtask removed from list
- Progress updates: `2/3`
- Progress bar: ~66% filled

### Test 3.5: Collapse/Expand
**Steps:**
1. Click "▼ Hide subtasks"
2. Click "▶ Show subtasks"

**Expected:**
- First click: List collapses, only progress bar visible
- Second click: List expands again

### Test 3.6: Complete Parent Todo
**Steps:**
1. Check parent todo checkbox
2. Uncheck parent todo

**Expected:**
- Subtasks persist (not deleted)
- Progress maintains correct state

### Test 3.7: Recurring Todo with Subtasks
**Steps:**
1. Create recurring todo (daily)
2. Add 3 subtasks
3. Complete 2 subtasks
4. Complete parent todo

**Expected:**
- New instance created
- New instance has 3 subtasks (copied)
- All subtasks unchecked (fresh start)
- Progress shows: `0/3`

## Test Suite 4: Combined Features

### Test 4.1: Full-Featured Todo
**Steps:**
1. Create todo:
   - Title: "Weekly project review"
   - Due date: Next Friday 2:00 PM
   - Priority: High
   - Repeat: Weekly
   - Reminder: 1 day before
2. Add subtasks:
   - "Prepare slides"
   - "Review metrics"
   - "Send agenda"

**Expected:**
- Shows all badges: `[high] [🔄 weekly] [🔔 1d]`
- Progress bar visible: `0/3`
- Can expand/collapse subtasks
- Reminder triggers 1 day before
- Completing creates next weekly instance with same setup

### Test 4.2: Edit All Properties
**Steps:**
1. Click "Edit" on full-featured todo
2. Change:
   - Priority: Medium
   - Pattern: Monthly
   - Reminder: 2 hours before
3. Click "Update"

**Expected:**
- Badges update: `[medium] [🔄 monthly] [🔔 2h]`
- Next instance uses new pattern
- Reminder time updated

### Test 4.3: Mobile Responsive
**Steps:**
1. Resize browser to mobile width (< 640px)
2. Test all features

**Expected:**
- Form inputs stack vertically
- Badges wrap to multiple lines
- Subtasks remain readable
- All buttons accessible

### Test 4.4: Dark Mode
**Steps:**
1. Toggle system dark mode
2. Check all Phase 2 elements

**Expected:**
- All text readable (light colors)
- Badges have dark variants
- Progress bar visible
- Inputs have dark backgrounds

## Test Suite 5: Edge Cases

### Test 5.1: Empty Subtask Title
**Steps:**
1. Expand subtask panel
2. Leave input empty
3. Click "Add"

**Expected:**
- Alert: "Subtask title cannot be empty"
- No subtask created

### Test 5.2: Recurring Without Due Date
**Steps:**
1. Create todo without due date
2. Try to check "Repeat"

**Expected:**
- Repeat checkbox disabled
- Tooltip/disabled state visible

### Test 5.3: Long Todo Title
**Steps:**
1. Create todo with very long title (200+ chars)
2. Add badges and subtasks

**Expected:**
- Title wraps properly
- Badges remain visible
- No layout break

### Test 5.4: Many Subtasks
**Steps:**
1. Add 20 subtasks to one todo
2. Test scrolling and interaction

**Expected:**
- All subtasks visible
- Scrolling smooth
- Performance acceptable

### Test 5.5: Notification Permission Denied
**Steps:**
1. Click "Enable notifications"
2. Deny permission
3. Try to use reminders

**Expected:**
- Button remains visible
- Reminders still saved to database
- No notifications shown (graceful degradation)

## Test Suite 6: Data Persistence

### Test 6.1: Refresh Page
**Steps:**
1. Create todos with all Phase 2 features
2. Refresh browser (F5)

**Expected:**
- All todos persist
- Badges show correct values
- Subtasks and progress intact
- Expanded/collapsed state may reset (OK)

### Test 6.2: Logout/Login
**Steps:**
1. Create full-featured todos
2. Logout
3. Login again

**Expected:**
- All data still present
- Functionality intact

### Test 6.3: Multiple Browser Tabs
**Steps:**
1. Open two tabs
2. Create todo in tab 1
3. Switch to tab 2

**Expected:**
- Tab 2 needs manual refresh (no real-time sync)
- Data consistent after refresh

## Regression Testing

### Test 7.1: Phase 1 Features Still Work
**Steps:**
1. Test basic CRUD (create, read, update, delete)
2. Test priority filtering
3. Test search functionality
4. Test show/hide completed

**Expected:**
- All Phase 1 features functional
- No breaking changes

### Test 7.2: Authentication Still Works
**Steps:**
1. Logout
2. Login with passkey
3. Register new user

**Expected:**
- Auth flow unchanged
- Session persists

## Performance Testing

### Test 8.1: Notification Polling
**Steps:**
1. Open browser console
2. Watch network tab for 5 minutes

**Expected:**
- `/api/notifications/check` called every 60 seconds
- No errors in console
- No memory leaks

### Test 8.2: Large Data Set
**Steps:**
1. Create 50 todos with:
   - Various recurring patterns
   - Multiple subtasks each
   - Different reminders
2. Test all operations

**Expected:**
- UI remains responsive
- No lag when toggling/expanding
- Filters work quickly

## Bug Report Template

If you find issues, report using:

```
**Bug Title:** [Short description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Environment:**
- Browser: 
- OS: 
- Server running: Yes/No

**Screenshots/Console Errors:**


**Severity:** Critical / High / Medium / Low
```

## Test Coverage Summary

After completing all tests, verify:
- [ ] All 8 test suites completed
- [ ] No critical bugs found
- [ ] Phase 1 features still working (regression)
- [ ] Mobile responsive working
- [ ] Dark mode working
- [ ] Data persistence working
- [ ] Notifications working (if permission granted)
- [ ] Performance acceptable

Ready for Phase 3 development! 🎉
