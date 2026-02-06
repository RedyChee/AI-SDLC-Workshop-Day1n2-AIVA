/**
 * Unit Tests: Database Validation Functions
 * Tests validation functions from lib/db.ts
 */

import { test, expect } from '@playwright/test';
import {
  validateTemplateName,
  validateTemplateDescription,
  validateCategory,
  validateDueOffsetDays,
} from '../../lib/db';

test.describe('Template Name Validation', () => {
  test('should accept valid template names', () => {
    expect(validateTemplateName('Weekly Review')).toBe('Weekly Review');
    expect(validateTemplateName('  Trimmed  ')).toBe('Trimmed');
  });

  test('should reject invalid template names', () => {
    expect(validateTemplateName('')).toBe(null);
    expect(validateTemplateName('   ')).toBe(null);
    expect(validateTemplateName(null)).toBe(null);
    expect(validateTemplateName(undefined)).toBe(null);
    expect(validateTemplateName(123)).toBe(null);
  });

  test('should enforce max length of 100', () => {
    const longName = 'a'.repeat(101);
    expect(validateTemplateName(longName)).toBe(null);
    
    const maxName = 'a'.repeat(100);
    expect(validateTemplateName(maxName)).toBe(maxName);
  });
});

test.describe('Template Description Validation', () => {
  test('should accept valid descriptions', () => {
    expect(validateTemplateDescription('This is a description')).toBe('This is a description');
    expect(validateTemplateDescription('  Trimmed  ')).toBe('Trimmed');
    expect(validateTemplateDescription(null)).toBe(null);
    expect(validateTemplateDescription(undefined)).toBe(null);
  });

  test('should reject invalid descriptions', () => {
    expect(validateTemplateDescription('')).toBe(null);
    expect(validateTemplateDescription('   ')).toBe(null);
    expect(validateTemplateDescription(123)).toBe(null);
  });

  test('should enforce max length of 500', () => {
    const longDesc = 'a'.repeat(501);
    expect(validateTemplateDescription(longDesc)).toBe(null);
    
    const maxDesc = 'a'.repeat(500);
    expect(validateTemplateDescription(maxDesc)).toBe(maxDesc);
  });
});

test.describe('Category Validation', () => {
  test('should accept valid categories', () => {
    expect(validateCategory('Work')).toBe('Work');
    expect(validateCategory('  Personal  ')).toBe('Personal');
    expect(validateCategory(null)).toBe(null);
  });

  test('should reject invalid categories', () => {
    expect(validateCategory('')).toBe(null);
    expect(validateCategory('   ')).toBe(null);
    expect(validateCategory(123)).toBe(null);
  });

  test('should enforce max length of 50', () => {
    const longCat = 'a'.repeat(51);
    expect(validateCategory(longCat)).toBe(null);
    
    const maxCat = 'a'.repeat(50);
    expect(validateCategory(maxCat)).toBe(maxCat);
  });
});

test.describe('Due Offset Days Validation', () => {
  test('should accept valid offset days', () => {
    expect(validateDueOffsetDays(1)).toBe(1);
    expect(validateDueOffsetDays(7)).toBe(7);
    expect(validateDueOffsetDays(30)).toBe(30);
    expect(validateDueOffsetDays(365)).toBe(365);
    expect(validateDueOffsetDays(null)).toBe(null);
  });

  test('should accept string numbers', () => {
    expect(validateDueOffsetDays('7')).toBe(7);
    expect(validateDueOffsetDays('30')).toBe(30);
  });

  test('should reject invalid values', () => {
    expect(validateDueOffsetDays(0)).toBe(null);
    expect(validateDueOffsetDays(-1)).toBe(null);
    expect(validateDueOffsetDays(366)).toBe(null);
    expect(validateDueOffsetDays('invalid')).toBe(null);
  });

  test('should enforce range 1-365', () => {
    expect(validateDueOffsetDays(1)).toBe(1);
    expect(validateDueOffsetDays(365)).toBe(365);
    expect(validateDueOffsetDays(0)).toBe(null);
    expect(validateDueOffsetDays(366)).toBe(null);
  });
});
