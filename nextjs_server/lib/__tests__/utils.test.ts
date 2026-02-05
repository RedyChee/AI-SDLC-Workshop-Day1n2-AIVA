import { describe, it, expect } from 'vitest'

// Progress calculation utility
function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

// Subtask progress
interface Subtask {
  id: string
  is_completed: boolean
}

function getSubtaskProgress(subtasks: Subtask[]): { completed: number; total: number; percentage: number } {
  const total = subtasks.length
  const completed = subtasks.filter(s => s.is_completed).length
  const percentage = calculateProgress(completed, total)
  return { completed, total, percentage }
}

describe('Progress Calculation', () => {
  describe('calculateProgress', () => {
    it('calculates percentage correctly', () => {
      expect(calculateProgress(0, 4)).toBe(0)
      expect(calculateProgress(1, 4)).toBe(25)
      expect(calculateProgress(2, 4)).toBe(50)
      expect(calculateProgress(3, 4)).toBe(75)
      expect(calculateProgress(4, 4)).toBe(100)
    })

    it('rounds to nearest integer', () => {
      expect(calculateProgress(1, 3)).toBe(33)
      expect(calculateProgress(2, 3)).toBe(67)
      expect(calculateProgress(1, 7)).toBe(14)
    })

    it('handles zero total', () => {
      expect(calculateProgress(0, 0)).toBe(0)
    })

    it('handles single item', () => {
      expect(calculateProgress(0, 1)).toBe(0)
      expect(calculateProgress(1, 1)).toBe(100)
    })
  })

  describe('getSubtaskProgress', () => {
    it('returns zero progress for empty list', () => {
      const result = getSubtaskProgress([])
      expect(result).toEqual({ completed: 0, total: 0, percentage: 0 })
    })

    it('calculates progress for all incomplete', () => {
      const subtasks: Subtask[] = [
        { id: '1', is_completed: false },
        { id: '2', is_completed: false },
        { id: '3', is_completed: false },
      ]
      const result = getSubtaskProgress(subtasks)
      expect(result).toEqual({ completed: 0, total: 3, percentage: 0 })
    })

    it('calculates progress for all complete', () => {
      const subtasks: Subtask[] = [
        { id: '1', is_completed: true },
        { id: '2', is_completed: true },
        { id: '3', is_completed: true },
      ]
      const result = getSubtaskProgress(subtasks)
      expect(result).toEqual({ completed: 3, total: 3, percentage: 100 })
    })

    it('calculates progress for mixed completion', () => {
      const subtasks: Subtask[] = [
        { id: '1', is_completed: true },
        { id: '2', is_completed: false },
        { id: '3', is_completed: true },
        { id: '4', is_completed: false },
      ]
      const result = getSubtaskProgress(subtasks)
      expect(result).toEqual({ completed: 2, total: 4, percentage: 50 })
    })

    it('calculates progress for single subtask', () => {
      const subtasks: Subtask[] = [
        { id: '1', is_completed: true },
      ]
      const result = getSubtaskProgress(subtasks)
      expect(result).toEqual({ completed: 1, total: 1, percentage: 100 })
    })
  })
})

describe('Validation Utilities', () => {
  describe('Todo title validation', () => {
    function validateTitle(title: string): { valid: boolean; error?: string } {
      if (!title || title.trim().length === 0) {
        return { valid: false, error: 'Title is required' }
      }
      if (title.trim().length > 200) {
        return { valid: false, error: 'Title must be 200 characters or less' }
      }
      return { valid: true }
    }

    it('accepts valid titles', () => {
      expect(validateTitle('Valid todo').valid).toBe(true)
      expect(validateTitle('A'.repeat(200)).valid).toBe(true)
    })

    it('rejects empty titles', () => {
      expect(validateTitle('').valid).toBe(false)
      expect(validateTitle('   ').valid).toBe(false)
    })

    it('rejects too long titles', () => {
      const result = validateTitle('A'.repeat(201))
      expect(result.valid).toBe(false)
      expect(result.error).toContain('200 characters')
    })
  })

  describe('Priority validation', () => {
    function isValidPriority(priority: string): boolean {
      return ['low', 'medium', 'high'].includes(priority)
    }

    it('accepts valid priorities', () => {
      expect(isValidPriority('low')).toBe(true)
      expect(isValidPriority('medium')).toBe(true)
      expect(isValidPriority('high')).toBe(true)
    })

    it('rejects invalid priorities', () => {
      expect(isValidPriority('urgent')).toBe(false)
      expect(isValidPriority('Low')).toBe(false)
      expect(isValidPriority('')).toBe(false)
    })
  })

  describe('Recurrence pattern validation', () => {
    function isValidRecurrence(pattern: string): boolean {
      return ['daily', 'weekly', 'monthly', 'yearly'].includes(pattern)
    }

    it('accepts valid patterns', () => {
      expect(isValidRecurrence('daily')).toBe(true)
      expect(isValidRecurrence('weekly')).toBe(true)
      expect(isValidRecurrence('monthly')).toBe(true)
      expect(isValidRecurrence('yearly')).toBe(true)
    })

    it('rejects invalid patterns', () => {
      expect(isValidRecurrence('hourly')).toBe(false)
      expect(isValidRecurrence('Daily')).toBe(false)
      expect(isValidRecurrence('')).toBe(false)
    })
  })

  describe('Reminder minutes validation', () => {
    function isValidReminderMinutes(minutes: number): boolean {
      const validOptions = [15, 30, 60, 120, 1440, 2880, 10080]
      return validOptions.includes(minutes)
    }

    it('accepts valid reminder options', () => {
      expect(isValidReminderMinutes(15)).toBe(true)   // 15 min
      expect(isValidReminderMinutes(30)).toBe(true)   // 30 min
      expect(isValidReminderMinutes(60)).toBe(true)   // 1 hour
      expect(isValidReminderMinutes(120)).toBe(true)  // 2 hours
      expect(isValidReminderMinutes(1440)).toBe(true) // 1 day
      expect(isValidReminderMinutes(2880)).toBe(true) // 2 days
      expect(isValidReminderMinutes(10080)).toBe(true) // 1 week
    })

    it('rejects invalid reminder minutes', () => {
      expect(isValidReminderMinutes(10)).toBe(false)
      expect(isValidReminderMinutes(100)).toBe(false)
      expect(isValidReminderMinutes(0)).toBe(false)
      expect(isValidReminderMinutes(-15)).toBe(false)
    })
  })
})
