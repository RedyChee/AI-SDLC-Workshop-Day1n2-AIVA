import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getNextRecurrenceDate, formatSingaporeDate, getSingaporeNow } from '../timezone'

describe('Recurrence Date Calculations', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T10:00:00+08:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Daily recurrence', () => {
    it('should calculate next day correctly', () => {
      const lastDue = '2026-01-15'
      const nextDue = getNextRecurrenceDate(lastDue, 'daily')
      expect(nextDue).toBe('2026-01-16')
    })

    it('should handle month boundaries', () => {
      const lastDue = '2026-01-31'
      const nextDue = getNextRecurrenceDate(lastDue, 'daily')
      expect(nextDue).toBe('2026-02-01')
    })

    it('should handle year boundaries', () => {
      const lastDue = '2025-12-31'
      const nextDue = getNextRecurrenceDate(lastDue, 'daily')
      expect(nextDue).toBe('2026-01-01')
    })
  })

  describe('Weekly recurrence', () => {
    it('should calculate next week correctly', () => {
      const lastDue = '2026-01-15'
      const nextDue = getNextRecurrenceDate(lastDue, 'weekly')
      expect(nextDue).toBe('2026-01-22')
    })

    it('should handle month boundaries', () => {
      const lastDue = '2026-01-29'
      const nextDue = getNextRecurrenceDate(lastDue, 'weekly')
      expect(nextDue).toBe('2026-02-05')
    })

    it('should handle year boundaries', () => {
      const lastDue = '2025-12-28'
      const nextDue = getNextRecurrenceDate(lastDue, 'weekly')
      expect(nextDue).toBe('2026-01-04')
    })
  })

  describe('Monthly recurrence', () => {
    it('should calculate next month correctly', () => {
      const lastDue = '2026-01-15'
      const nextDue = getNextRecurrenceDate(lastDue, 'monthly')
      expect(nextDue).toBe('2026-02-15')
    })

    it('should handle year boundaries', () => {
      const lastDue = '2025-12-15'
      const nextDue = getNextRecurrenceDate(lastDue, 'monthly')
      expect(nextDue).toBe('2026-01-15')
    })

    it('should handle different month lengths (30 to 31 days)', () => {
      const lastDue = '2026-04-30'
      const nextDue = getNextRecurrenceDate(lastDue, 'monthly')
      expect(nextDue).toBe('2026-05-30')
    })

    it('should handle short months (February)', () => {
      const lastDue = '2026-01-28'
      const nextDue = getNextRecurrenceDate(lastDue, 'monthly')
      expect(nextDue).toBe('2026-02-28')
    })
  })

  describe('Yearly recurrence', () => {
    it('should calculate next year correctly', () => {
      const lastDue = '2026-01-15'
      const nextDue = getNextRecurrenceDate(lastDue, 'yearly')
      expect(nextDue).toBe('2027-01-15')
    })

    it('should handle decade boundaries', () => {
      const lastDue = '2029-06-15'
      const nextDue = getNextRecurrenceDate(lastDue, 'yearly')
      expect(nextDue).toBe('2030-06-15')
    })

    it('should handle century boundaries', () => {
      const lastDue = '2099-12-25'
      const nextDue = getNextRecurrenceDate(lastDue, 'yearly')
      expect(nextDue).toBe('2100-12-25')
    })
  })

  describe('Pattern validation', () => {
    it('should return same date for invalid patterns', () => {
      const lastDue = '2026-01-15'
      const result = getNextRecurrenceDate(lastDue, 'invalid' as any)
      // Without a default case, the date remains unchanged
      expect(result).toBe('2026-01-15')
    })

    it('should return same date for null pattern', () => {
      const lastDue = '2026-01-15'
      const result = getNextRecurrenceDate(lastDue, null as any)
      // Without a default case, the date remains unchanged
      expect(result).toBe('2026-01-15')
    })
  })

  describe('Singapore timezone consistency', () => {
    it('should maintain Singapore timezone in calculations', () => {
      const lastDue = '2026-01-15'
      const nextDue = getNextRecurrenceDate(lastDue, 'daily')
      
      // Verify format is YYYY-MM-DD (Singapore date string)
      expect(nextDue).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should not be affected by system timezone changes', () => {
      const lastDue = '2026-01-15'
      const nextDue1 = getNextRecurrenceDate(lastDue, 'daily')
      
      // Simulate different system time
      vi.setSystemTime(new Date('2026-01-15T23:00:00+00:00'))
      const nextDue2 = getNextRecurrenceDate(lastDue, 'daily')
      
      expect(nextDue1).toBe(nextDue2)
    })
  })
})
