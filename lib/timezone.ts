import { DateTime } from 'luxon';

const SINGAPORE_TIMEZONE = 'Asia/Singapore';

/**
 * Get current date/time in Singapore timezone
 * ALWAYS use this instead of new Date()
 */
export function getSingaporeNow(): DateTime {
  return DateTime.now().setZone(SINGAPORE_TIMEZONE);
}

/**
 * Parse ISO date string and convert to Singapore timezone
 */
export function parseToSingapore(isoString: string): DateTime {
  return DateTime.fromISO(isoString, { zone: SINGAPORE_TIMEZONE });
}

/**
 * Format a date for display (Singapore timezone)
 */
export function formatSingaporeDate(
  date: string | DateTime,
  format: string = 'MMM d, yyyy h:mm a'
): string {
  const dt = typeof date === 'string' ? parseToSingapore(date) : date;
  return dt.toFormat(format);
}

/**
 * Get ISO string in Singapore timezone
 */
export function toSingaporeISO(date: DateTime): string {
  return date.setZone(SINGAPORE_TIMEZONE).toISO()!;
}

/**
 * Check if a date is in the past (Singapore timezone)
 */
export function isPast(date: string | DateTime): boolean {
  const dt = typeof date === 'string' ? parseToSingapore(date) : date;
  return dt < getSingaporeNow();
}

/**
 * Check if a date is today (Singapore timezone)
 */
export function isToday(date: string | DateTime): boolean {
  const dt = typeof date === 'string' ? parseToSingapore(date) : date;
  const now = getSingaporeNow();
  return dt.hasSame(now, 'day');
}

/**
 * Add minutes to current Singapore time
 */
export function addMinutes(minutes: number): DateTime {
  return getSingaporeNow().plus({ minutes });
}

/**
 * Get time difference in human-readable format
 */
export function getTimeDifference(targetDate: string | DateTime): {
  isPast: boolean;
  diff: string;
  color: 'red' | 'orange' | 'yellow' | 'blue';
} {
  const target = typeof targetDate === 'string' ? parseToSingapore(targetDate) : targetDate;
  const now = getSingaporeNow();
  
  const diffMs = target.diff(now).milliseconds;
  const absDiffMs = Math.abs(diffMs);
  const isOverdue = diffMs < 0;

  if (isOverdue) {
    // Overdue
    if (absDiffMs < 60 * 60 * 1000) {
      return { isPast: true, diff: `${Math.floor(absDiffMs / 60000)} minutes overdue`, color: 'red' };
    } else if (absDiffMs < 24 * 60 * 60 * 1000) {
      return { isPast: true, diff: `${Math.floor(absDiffMs / 3600000)} hours overdue`, color: 'red' };
    } else {
      return { isPast: true, diff: `${Math.floor(absDiffMs / 86400000)} days overdue`, color: 'red' };
    }
  } else {
    // Future
    if (diffMs < 60 * 60 * 1000) {
      return { isPast: false, diff: `Due in ${Math.floor(diffMs / 60000)} minutes`, color: 'red' };
    } else if (diffMs < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diffMs / 3600000);
      return { isPast: false, diff: `Due in ${hours} hours (${formatSingaporeDate(target)})`, color: 'orange' };
    } else if (diffMs < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diffMs / 86400000);
      return { isPast: false, diff: `Due in ${days} days (${formatSingaporeDate(target)})`, color: 'yellow' };
    } else {
      return { isPast: false, diff: formatSingaporeDate(target), color: 'blue' };
    }
  }
}

/**
 * Calculate next recurring date based on pattern
 */
export function calculateNextRecurrence(
  currentDate: string | DateTime,
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly'
): DateTime {
  const current = typeof currentDate === 'string' ? parseToSingapore(currentDate) : currentDate;

  switch (pattern) {
    case 'daily':
      return current.plus({ days: 1 });
    case 'weekly':
      return current.plus({ weeks: 1 });
    case 'monthly':
      return current.plus({ months: 1 });
    case 'yearly':
      return current.plus({ years: 1 });
    default:
      return current;
  }
}
