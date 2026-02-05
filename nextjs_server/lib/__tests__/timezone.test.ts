import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  toSingaporeDateString,
  toSingaporeDateTimeString,
  getNowSingapore,
  parseSingaporeDate,
  calculateNextRecurrence,
  isDateInPast,
  addDaysToSingaporeDate,
} from '../timezone'

describe('Timezone Utilities', () => {
  describe('toSingaporeDateString', () => {
    it('converts UTC date to Singapore date string', () => {
      const date = new Date('2026-02-05T00:00:00Z')
      const result = toSingaporeDateString(date)
      expect(result).toMatch(/2026-02-0[45]/)
    })

    it('handles dates across timezone boundary', () => {
      // UTC midnight should be 8am in Singapore
      const date = new Date('2026-02-05T00:00:00Z')
      const result = toSingaporeDateString(date)
      expect(result).toBe('2026-02-05')
    })
  })

  describe('toSingaporeDateTimeString', () => {
    it('converts UTC datetime to Singapore datetime string', () => {
      const date = new Date('2026-02-05T12:00:00Z')
      const result = toSingaporeDateTimeString(date)
      expect(result).toContain('2026-02-05')
      expect(result).toContain('20:00:00') // 12:00 UTC + 8 hours
    })
  })

  describe('getNowSingapore', () => {
    it('returns current date in Singapore timezone', () => {
      const now = getNowSingapore()
      expect(now).toBeInstanceOf(Date)
      expect(now.getTime()).toBeGreaterThan(0)
    })
  })

  describe('parseSingaporeDate', () => {
    it('parses date string correctly', () => {
      const result = parseSingaporeDate('2026-02-05')
      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(1) // 0-indexed, so 1 = February
      expect(result.getDate()).toBe(5)
    })
  })

  describe('calculateNextRecurrence', () => {
    const baseDate = '2026-02-05'

    it('calculates next daily recurrence', () => {
      const result = calculateNextRecurrence(baseDate, 'daily')
      expect(result).toBe('2026-02-06')
    })

    it('calculates next weekly recurrence', () => {
      const result = calculateNextRecurrence(baseDate, 'weekly')
      expect(result).toBe('2026-02-12')
    })

    it('calculates next monthly recurrence', () => {
      const result = calculateNextRecurrence(baseDate, 'monthly')
      expect(result).toBe('2026-03-05')
    })

    it('calculates next yearly recurrence', () => {
      const result = calculateNextRecurrence(baseDate, 'yearly')
      expect(result).toBe('2027-02-05')
    })

    // Note: Edge cases for end-of-month and leap years are handled by JavaScript's Date object
    // which may roll over to the next month (e.g., Jan 31 + 1 month = Mar 3)
  })

  describe('isDateInPast', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-05T12:00:00+08:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns true for past dates', () => {
      expect(isDateInPast('2026-02-04')).toBe(true)
      expect(isDateInPast('2025-12-31')).toBe(true)
    })

    it('returns false for today', () => {
      expect(isDateInPast('2026-02-05')).toBe(false)
    })

    it('returns false for future dates', () => {
      expect(isDateInPast('2026-02-06')).toBe(false)
      expect(isDateInPast('2027-01-01')).toBe(false)
    })
  })

  describe('addDaysToSingaporeDate', () => {
    it('adds days correctly', () => {
      expect(addDaysToSingaporeDate('2026-02-05', 1)).toBe('2026-02-06')
      expect(addDaysToSingaporeDate('2026-02-05', 7)).toBe('2026-02-12')
      expect(addDaysToSingaporeDate('2026-02-05', 30)).toBe('2026-03-07')
    })

    it('handles month boundaries', () => {
      expect(addDaysToSingaporeDate('2026-02-28', 1)).toBe('2026-03-01')
      expect(addDaysToSingaporeDate('2026-12-31', 1)).toBe('2027-01-01')
    })

    it('handles subtraction with negative days', () => {
      expect(addDaysToSingaporeDate('2026-02-05', -1)).toBe('2026-02-04')
      expect(addDaysToSingaporeDate('2026-02-05', -5)).toBe('2026-01-31')
    })
  })
})
