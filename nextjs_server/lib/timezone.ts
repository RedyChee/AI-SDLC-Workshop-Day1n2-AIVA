import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'
import { format, parse } from 'date-fns'

const TIMEZONE = 'Asia/Singapore'

/**
 * Convert a Date to Singapore timezone string (YYYY-MM-DD)
 */
export function toSingaporeDateString(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd')
}

/**
 * Convert a Date to Singapore timezone datetime string (YYYY-MM-DD HH:mm:ss)
 */
export function toSingaporeDateTimeString(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd HH:mm:ss')
}

export function formatSingaporeDate(date: Date): string {
  return toSingaporeDateString(date)
}

export function formatSingaporeDateTime(date: Date): string {
  return toSingaporeDateTimeString(date)
}

/**
 * Get current Singapore date
 */
export function getNowSingapore(): Date {
  return utcToZonedTime(new Date(), TIMEZONE)
}

export function getSingaporeNow(): Date {
  return getNowSingapore()
}

/**
 * Get current Singapore date string (YYYY-MM-DD)
 */
export function getNowSingaporeDateString(): string {
  return toSingaporeDateString(new Date())
}

/**
 * Parse a date string from Singapore timezone
 */
export function parseSingaporeDate(dateString: string): Date {
  const date = parse(dateString, 'yyyy-MM-dd', new Date())
  return zonedTimeToUtc(date, TIMEZONE)
}

/**
 * Parse a datetime string from Singapore timezone
 */
export function parseSingaporeDateTime(dateString: string): Date {
  const date = parse(dateString, 'yyyy-MM-dd HH:mm:ss', new Date())
  return zonedTimeToUtc(date, TIMEZONE)
}

/**
 * Check if a date is overdue (in Singapore timezone)
 */
export function isOverdue(dueDate: string): boolean {
  const now = getNowSingapore()
  const due = parseSingaporeDate(dueDate)
  return now > due && !isSameDay(now, due)
}

/**
 * Check if two dates are the same day (in Singapore timezone)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return toSingaporeDateString(date1) === toSingaporeDateString(date2)
}

/**
 * Check if a date is today (in Singapore timezone)
 */
export function isToday(dueDate: string): boolean {
  return isSameDay(getNowSingapore(), parseSingaporeDate(dueDate))
}

/**
 * Check if a date is tomorrow (in Singapore timezone)
 */
export function isTomorrow(dueDate: string): boolean {
  const now = getNowSingapore()
  const due = parseSingaporeDate(dueDate)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return isSameDay(tomorrow, due)
}

/**
 * Get days until due date (in Singapore timezone)
 */
export function daysUntilDue(dueDate: string): number {
  const now = getNowSingapore()
  const due = parseSingaporeDate(dueDate)
  const diffTime = Math.abs(due.getTime() - now.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Calculate next occurrence date for recurring todos
 */
export function getNextRecurrenceDate(
  lastDueDate: string,
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly'
): string {
  const date = parseSingaporeDate(lastDueDate)

  switch (pattern) {
    case 'daily':
      date.setDate(date.getDate() + 1)
      break
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
  }

  return toSingaporeDateString(date)
}

/**
 * Singapore public holidays 2025-2026
 */
export const SINGAPORE_HOLIDAYS: Record<string, string> = {
  '2025-01-01': 'New Year\'s Day',
  '2025-01-29': 'Chinese New Year',
  '2025-01-30': 'Chinese New Year (observed)',
  '2025-04-10': 'Good Friday',
  '2025-05-01': 'Labour Day',
  '2025-05-22': 'Vesak Day',
  '2025-08-09': 'National Day',
  '2025-10-01': 'Deepavali',
  '2025-12-25': 'Christmas Day',
  '2026-01-01': 'New Year\'s Day',
  '2026-02-17': 'Chinese New Year',
  '2026-02-18': 'Chinese New Year (observed)',
  '2026-03-29': 'Good Friday',
  '2026-05-01': 'Labour Day',
  '2026-05-24': 'Vesak Day',
  '2026-08-09': 'National Day',
}

export function isPublicHoliday(dateString: string): boolean {
  return dateString in SINGAPORE_HOLIDAYS
}

export function getPublicHolidayName(dateString: string): string | null {
  return SINGAPORE_HOLIDAYS[dateString] || null
}

/**
 * Check if a date is in the past (in Singapore timezone)
 */
export function isDateInPast(dateString: string): boolean {
  const now = getNowSingapore()
  const date = parseSingaporeDate(dateString)
  return toSingaporeDateString(date) < toSingaporeDateString(now)
}

/**
 * Add days to a Singapore date string
 */
export function addDaysToSingaporeDate(dateString: string, days: number): string {
  const date = parseSingaporeDate(dateString)
  date.setDate(date.getDate() + days)
  return toSingaporeDateString(date)
}

/**
 * Alias for getNextRecurrenceDate
 */
export function calculateNextRecurrence(
  lastDueDate: string,
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly'
): string {
  return getNextRecurrenceDate(lastDueDate, pattern)
}
