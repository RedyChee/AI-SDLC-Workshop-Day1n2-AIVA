/**
 * Singapore Timezone Utilities
 * All date/time operations in the app MUST use these functions
 * to ensure consistency with Asia/Singapore timezone
 */

export const SINGAPORE_TIMEZONE = 'Asia/Singapore';

/**
 * Get current date/time in Singapore timezone
 * Always use this instead of new Date()
 */
export function getSingaporeNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: SINGAPORE_TIMEZONE }));
}

/**
 * Format a date for display in Singapore timezone
 */
export function formatSingaporeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', { 
    timeZone: SINGAPORE_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format date for display without time
 */
export function formatSingaporeDateOnly(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    timeZone: SINGAPORE_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format time only
 */
export function formatSingaporeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { 
    timeZone: SINGAPORE_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if a due date is overdue (past current Singapore time)
 */
export function isOverdue(dueDate: string): boolean {
  const now = getSingaporeNow();
  const due = new Date(dueDate);
  return due < now;
}

/**
 * Get minimum due date (current Singapore time + 1 minute)
 * Used for validation to ensure due dates are in the future
 */
export function getMinimumDueDate(): string {
  const now = getSingaporeNow();
  now.setMinutes(now.getMinutes() + 1);
  return now.toISOString();
}

/**
 * Convert date to ISO string in Singapore timezone
 */
export function toSingaporeISO(date: Date): string {
  return new Date(date.toLocaleString('en-US', { timeZone: SINGAPORE_TIMEZONE })).toISOString();
}

/**
 * Get start of day in Singapore timezone
 */
export function getSingaporeStartOfDay(date?: Date): Date {
  const d = date || getSingaporeNow();
  const dateStr = d.toLocaleDateString('en-US', { timeZone: SINGAPORE_TIMEZONE });
  const startOfDay = new Date(dateStr + ' 00:00:00');
  return new Date(startOfDay.toLocaleString('en-US', { timeZone: SINGAPORE_TIMEZONE }));
}

/**
 * Get end of day in Singapore timezone
 */
export function getSingaporeEndOfDay(date?: Date): Date {
  const d = date || getSingaporeNow();
  const dateStr = d.toLocaleDateString('en-US', { timeZone: SINGAPORE_TIMEZONE });
  const endOfDay = new Date(dateStr + ' 23:59:59');
  return new Date(endOfDay.toLocaleString('en-US', { timeZone: SINGAPORE_TIMEZONE }));
}

/**
 * Calculate time difference in a human-readable format
 */
export function getTimeUntil(futureDate: string | Date): string {
  const now = getSingaporeNow();
  const future = typeof futureDate === 'string' ? new Date(futureDate) : futureDate;
  
  const diffMs = future.getTime() - now.getTime();
  
  if (diffMs < 0) {
    return 'Overdue';
  }
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }
}

/**
 * Get color class based on urgency
 */
export function getUrgencyColor(dueDate: string | null, completed: boolean): string {
  if (!dueDate || completed) return 'text-gray-500';
  
  const now = getSingaporeNow();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffMs < 0) return 'text-red-600';  // Overdue
  if (diffHours < 1) return 'text-red-600';  // < 1 hour
  if (diffHours < 24) return 'text-orange-600';  // < 24 hours
  if (diffHours < 168) return 'text-yellow-600';  // < 7 days
  return 'text-blue-600';  // 7+ days
}

/**
 * Add days to a date in Singapore timezone
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return new Date(result.toLocaleString('en-US', { timeZone: SINGAPORE_TIMEZONE }));
}

/**
 * Add months to a date in Singapore timezone
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return new Date(result.toLocaleString('en-US', { timeZone: SINGAPORE_TIMEZONE }));
}

/**
 * Add years to a date in Singapore timezone
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return new Date(result.toLocaleString('en-US', { timeZone: SINGAPORE_TIMEZONE }));
}

/**
 * Format date for datetime-local input
 */
export function formatForDateTimeLocal(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const sgDate = new Date(d.toLocaleString('en-US', { timeZone: SINGAPORE_TIMEZONE }));
  
  const year = sgDate.getFullYear();
  const month = String(sgDate.getMonth() + 1).padStart(2, '0');
  const day = String(sgDate.getDate()).padStart(2, '0');
  const hours = String(sgDate.getHours()).padStart(2, '0');
  const minutes = String(sgDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
