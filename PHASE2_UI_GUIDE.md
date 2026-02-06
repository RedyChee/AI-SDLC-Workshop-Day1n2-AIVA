# Phase 2 UI Guide

## Visual Overview of New Features

This guide shows the UI elements added in Phase 2.

## 1. Add Todo Form (Enhanced)

```
┌─────────────────────────────────────────────────────────────┐
│ What needs to be done?                                      │
│ [_____________________________________________________]     │
│                                                             │
│ Due Date: [2024-01-15 14:30] Priority: [Medium ▼]         │
│                                                             │
│ ☑ Repeat [Weekly ▼]    Reminder: [1 hour before ▼]       │
│                                                             │
│ 🔔 Enable notifications                          [Add]      │
└─────────────────────────────────────────────────────────────┘
```

### New Controls:
- **Repeat checkbox**: Enable recurring (disabled without due date)
- **Recurrence dropdown**: Daily/Weekly/Monthly/Yearly (appears when Repeat checked)
- **Reminder dropdown**: 15m/30m/1h/2h/1d/2d/1w before (disabled without due date)
- **Enable notifications button**: Request browser permission

## 2. Todo Item with Phase 2 Features

```
┌─────────────────────────────────────────────────────────────┐
│ ☐ Complete project documentation                            │
│    [high] [🔄 weekly] [🔔 1h]                               │
│    Due in 2 hours (text-yellow-600)                         │
│                                                             │
│    ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░ 3/5                                │
│    ▼ Hide subtasks                                          │
│                                                             │
│    ☑ Write user guide                                       │
│    ☑ Create API documentation                               │
│    ☐ Add code comments                                      │
│    ☐ Review and proofread                                   │
│    ☐ Get team feedback                                      │
│                                                             │
│    [Add a subtask...____________] [Add]                     │
│                                                             │
│                                          [Edit] [Delete]    │
└─────────────────────────────────────────────────────────────┘
```

### Badge System:
- **Priority badge**: `high` (red) / `medium` (yellow) / `low` (blue)
- **Recurring badge**: `🔄 daily|weekly|monthly|yearly` (purple)
- **Reminder badge**: `🔔 15m|30m|1h|2h|1d|2d|1w` (blue)

### Subtask UI:
- **Progress bar**: Green fill showing completion percentage
- **Progress text**: "3/5" (completed/total)
- **Expand/collapse**: Toggle subtask list visibility
- **Subtask list**: Checkboxes, titles, delete buttons
- **Add form**: Input + Add button (appears when expanded)

## 3. Todo Item (Collapsed, No Subtasks)

```
┌─────────────────────────────────────────────────────────────┐
│ ☐ Buy groceries                                             │
│    [medium] [🔄 weekly] [🔔 1d]                             │
│    Due in 3 days (text-green-600)                          │
│                                                             │
│    + Add subtasks                                           │
│                                                             │
│                                          [Edit] [Delete]    │
└─────────────────────────────────────────────────────────────┘
```

### Add Subtasks Button:
- Appears when todo has no subtasks
- Clicking expands panel with add form

## 4. Edit Modal (Enhanced)

```
┌───────────────────────────────────┐
│ Edit Todo                    [✕]  │
├───────────────────────────────────┤
│                                   │
│ Title:                            │
│ [Complete documentation_____]     │
│                                   │
│ Due Date:                         │
│ [2024-01-15T14:30___________]     │
│                                   │
│ Priority:                         │
│ [High ▼]                          │
│                                   │
│ ☑ Repeat                          │
│                                   │
│ Recurrence Pattern:               │
│ [Weekly ▼]                        │
│                                   │
│ Reminder:                         │
│ [1 hour before ▼]                 │
│                                   │
│         [Cancel]  [Update]        │
└───────────────────────────────────┘
```

### New Modal Controls:
- **Repeat checkbox**: Toggle recurring (disabled without due date)
- **Recurrence Pattern dropdown**: Appears when Repeat checked
- **Reminder dropdown**: All time options (disabled without due date)

## 5. Badge Color Scheme

```css
Priority Badges:
- High:   bg-red-100 text-red-800 (dark: bg-red-900 text-red-200)
- Medium: bg-yellow-100 text-yellow-800 (dark: bg-yellow-900 text-yellow-200)
- Low:    bg-blue-100 text-blue-800 (dark: bg-blue-900 text-blue-200)

Recurring Badge:
- All:    bg-purple-100 text-purple-800 (dark: bg-purple-900 text-purple-200)

Reminder Badge:
- All:    bg-blue-100 text-blue-800 (dark: bg-blue-900 text-blue-200)
```

## 6. Progress Bar States

```
Empty (0%):     [░░░░░░░░░░░░░░░░░░░░] 0/5

Partial (40%):  [▓▓▓▓▓▓▓▓░░░░░░░░░░░░] 2/5

Majority (80%): [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░] 4/5

Complete (100%):[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 5/5
```

Color: `bg-green-500` (bright green fill)

## 7. Notification Example

```
┌─────────────────────────────────────┐
│ 🔔 Todo Reminder                    │
├─────────────────────────────────────┤
│ Complete project documentation      │
│                                     │
│ Due in 1 hour                       │
└─────────────────────────────────────┘
```

Browser notification appears:
- **Title**: "🔔 Todo Reminder"
- **Body**: Todo title + due time text
- **Icon**: Bell emoji
- **Permission**: Granted via "Enable notifications" button

## 8. Responsive Layout

### Desktop (Wide Screen):
- Add form: Side-by-side inputs with controls
- Todo items: Full width with badges in single row
- Subtasks: Indented with left border

### Mobile (Narrow Screen):
- Add form: Stacked inputs (flex-wrap)
- Todo items: Badges wrap to new lines
- Subtasks: Full width with smaller font

## 9. Dark Mode Support

All Phase 2 features include dark mode:
- **Background**: `dark:bg-gray-800` (cards), `dark:bg-gray-700` (inputs)
- **Text**: `dark:text-white` (primary), `dark:text-gray-300` (secondary)
- **Borders**: `dark:border-gray-600`
- **Badges**: Dark variants for all colors

## 10. Interactive States

### Buttons:
- **Hover**: Darker shade (e.g., `hover:bg-blue-700`)
- **Disabled**: `disabled:opacity-50` + cursor-not-allowed

### Checkboxes:
- **Default**: Rounded with border
- **Checked**: Filled with checkmark
- **Hover**: Subtle highlight

### Inputs:
- **Focus**: Blue ring (`focus:ring-2 focus:ring-blue-500`)
- **Disabled**: Grayed out with reduced opacity

## Usage Examples

### Create Recurring Todo with Reminder:
1. Enter title: "Weekly team meeting"
2. Set due date: Next Monday 10:00 AM
3. Select priority: High
4. Check "Repeat" → Select "Weekly"
5. Select reminder: "1 day before"
6. Click "Add"

Result:
```
☐ Weekly team meeting
   [high] [🔄 weekly] [🔔 1d]
   Due in 3 days
```

### Add Subtasks:
1. Click "+ Add subtasks" on existing todo
2. Panel expands with input field
3. Type subtask title: "Prepare agenda"
4. Click "Add"
5. Repeat for more subtasks
6. Check subtasks as completed

Result:
```
▓▓▓▓▓▓▓▓░░░░░░░░░░ 2/5
▼ Hide subtasks

☑ Prepare agenda
☑ Book conference room
☐ Send calendar invites
☐ Print handouts
☐ Set up video call
```

### Complete Recurring Todo:
1. Check the checkbox on recurring todo
2. Todo moves to "Completed" section
3. New instance automatically created with:
   - Same title, priority, pattern, reminder
   - Next due date calculated (e.g., +1 week)
   - Subtasks copied (unchecked)
   - Tags copied (if any)
