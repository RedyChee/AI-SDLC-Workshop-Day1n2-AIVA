/**
 * Unit Tests: Timezone Functions
 * Tests Singapore timezone calculations and date formatting
 */

import { test, expect } from '@playwright/test';
import {
  getSingaporeNow,
  formatSingaporeDate,
  isOverdue,
  getMinimumDueDate,
  addDays,
  addMonths,
  addYears,
} from '../../lib/timezone';

test.describe('Timezone Functions', () => {
  test('getSingaporeNow should return current time in Singapore timezone', () => {
    const now = getSingaporeNow();
    
    // Should be a valid Date object
    expect(now instanceof Date).toBe(true);
    expect(isNaN(now.getTime())).toBe(false);
  });

  test('formatSingaporeDate should format date correctly', () => {
    const testDate = new Date('2026-02-07T10:30:00+08:00'); // Singapore time
    const formatted = formatSingaporeDate(testDate);
    
    // Should include date and time
    expect(formatted).toMatch(/Feb/);
    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/10:30/);
  });

  test('isOverdue should correctly identify overdue dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    
    expect(isOverdue(pastDate.toISOString())).toBe(true);
    expect(isOverdue(futureDate.toISOString())).toBe(false);
  });

  test('getMinimumDueDate should return future date', () => {
    const minDate = getMinimumDueDate();
    const now = getSingaporeNow();
    
    // Minimum date should be in the future
    expect(new Date(minDate) > now).toBe(true);
  });

  test('addDays should add correct number of days', () => {
    const baseDate = new Date('2026-02-07T10:00:00+08:00');
    const result = addDays(baseDate, 5);
    
    // Should be 5 days later
    const expected = new Date('2026-02-12T10:00:00+08:00');
    expect(result.toISOString()).toBe(expected.toISOString());
  });

  test('addMonths should add correct number of months', () => {
    const baseDate = new Date('2026-02-07T10:00:00+08:00');
    const result = addMonths(baseDate, 2);
    
    // Should be 2 months later (April 7)
    expect(result.getMonth()).toBe(3); // April is month 3 (0-indexed)
    expect(result.getDate()).toBe(7);
  });

  test('addYears should add correct number of years', () => {
    const baseDate = new Date('2026-02-07T10:00:00+08:00');
    const result = addYears(baseDate, 1);
    
    // Should be 1 year later
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(7);
  });
});
