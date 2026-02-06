/**
 * Unit Tests: Type Validation and Helper Functions
 * Tests validation and calculation functions from lib/types.ts
 */

import { test, expect } from '@playwright/test';
import {
  validateReminderMinutes,
  getReminderAbbreviation,
  calculateProgress,
  validateSubtaskTitle,
} from '../../lib/types';

test.describe('Reminder Functions', () => {
  test('validateReminderMinutes should accept valid values', () => {
    expect(validateReminderMinutes(15)).toBe(15);
    expect(validateReminderMinutes(30)).toBe(30);
    expect(validateReminderMinutes(60)).toBe(60);
    expect(validateReminderMinutes(120)).toBe(120);
    expect(validateReminderMinutes(1440)).toBe(1440);
    expect(validateReminderMinutes(2880)).toBe(2880);
    expect(validateReminderMinutes(10080)).toBe(10080);
    expect(validateReminderMinutes(null)).toBe(null);
  });

  test('validateReminderMinutes should reject invalid values', () => {
    expect(validateReminderMinutes(10)).toBe(null);
    expect(validateReminderMinutes(100)).toBe(null);
    expect(validateReminderMinutes(-15)).toBe(null);
    expect(validateReminderMinutes('invalid')).toBe(null);
  });

  test('getReminderAbbreviation should return correct abbreviations', () => {
    expect(getReminderAbbreviation(15)).toBe('15m');
    expect(getReminderAbbreviation(30)).toBe('30m');
    expect(getReminderAbbreviation(60)).toBe('1h');
    expect(getReminderAbbreviation(120)).toBe('2h');
    expect(getReminderAbbreviation(1440)).toBe('1d');
    expect(getReminderAbbreviation(2880)).toBe('2d');
    expect(getReminderAbbreviation(10080)).toBe('1w');
    expect(getReminderAbbreviation(null)).toBe(null);
  });
});

test.describe('Progress Calculation', () => {
  test('calculateProgress should handle no subtasks', () => {
    const progress = calculateProgress([]);
    
    expect(progress.total).toBe(0);
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  test('calculateProgress should handle all incomplete subtasks', () => {
    const subtasks = [
      { id: 1, todo_id: 1, title: 'Task 1', completed: false, position: 0, created_at: '' },
      { id: 2, todo_id: 1, title: 'Task 2', completed: false, position: 1, created_at: '' },
      { id: 3, todo_id: 1, title: 'Task 3', completed: false, position: 2, created_at: '' },
    ];
    
    const progress = calculateProgress(subtasks);
    
    expect(progress.total).toBe(3);
    expect(progress.completed).toBe(0);
    expect(progress.percentage).toBe(0);
  });

  test('calculateProgress should handle all complete subtasks', () => {
    const subtasks = [
      { id: 1, todo_id: 1, title: 'Task 1', completed: true, position: 0, created_at: '' },
      { id: 2, todo_id: 1, title: 'Task 2', completed: true, position: 1, created_at: '' },
      { id: 3, todo_id: 1, title: 'Task 3', completed: true, position: 2, created_at: '' },
    ];
    
    const progress = calculateProgress(subtasks);
    
    expect(progress.total).toBe(3);
    expect(progress.completed).toBe(3);
    expect(progress.percentage).toBe(100);
  });

  test('calculateProgress should handle partial completion', () => {
    const subtasks = [
      { id: 1, todo_id: 1, title: 'Task 1', completed: true, position: 0, created_at: '' },
      { id: 2, todo_id: 1, title: 'Task 2', completed: false, position: 1, created_at: '' },
      { id: 3, todo_id: 1, title: 'Task 3', completed: true, position: 2, created_at: '' },
    ];
    
    const progress = calculateProgress(subtasks);
    
    expect(progress.total).toBe(3);
    expect(progress.completed).toBe(2);
    expect(progress.percentage).toBe(67); // Rounded from 66.67
  });
});

test.describe('Subtask Validation', () => {
  test('validateSubtaskTitle should accept valid titles', () => {
    expect(validateSubtaskTitle('Valid title')).toBe('Valid title');
    expect(validateSubtaskTitle('  Trimmed title  ')).toBe('Trimmed title');
  });

  test('validateSubtaskTitle should reject invalid titles', () => {
    expect(validateSubtaskTitle('')).toBe(null);
    expect(validateSubtaskTitle('   ')).toBe(null);
    expect(validateSubtaskTitle(null)).toBe(null);
    expect(validateSubtaskTitle(undefined)).toBe(null);
    expect(validateSubtaskTitle(123)).toBe(null);
  });

  test('validateSubtaskTitle should enforce max length', () => {
    const longTitle = 'a'.repeat(501);
    expect(validateSubtaskTitle(longTitle)).toBe(null);
    
    const maxTitle = 'a'.repeat(500);
    expect(validateSubtaskTitle(maxTitle)).toBe(maxTitle);
  });
});
