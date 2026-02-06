/**
 * Shared constants and types for todos
 * This file can be safely imported in both client and server code
 */

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

// Get abbreviated reminder text
export function getReminderAbbreviation(minutes: ReminderMinutes): string | null {
  if (!minutes) return null;
  const option = REMINDER_OPTIONS.find(opt => opt.value === minutes);
  return option?.abbr ?? null;
}

// Validate reminder_minutes value
export function validateReminderMinutes(minutes: any): ReminderMinutes {
  if (minutes === null || minutes === undefined) return null;
  const numMinutes = parseInt(String(minutes), 10);
  if ([15, 30, 60, 120, 1440, 2880, 10080].includes(numMinutes)) {
    return numMinutes as ReminderMinutes;
  }
  return null;
}
