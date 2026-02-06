/**
 * E2E Test: Search and Filtering
 * Tests search functionality and filtering capabilities
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

test.describe('Search & Filtering', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.setupVirtualAuthenticator();
    await helpers.registerUser(`searchuser_${Date.now()}`);
    
    // Create sample todos for testing
    await helpers.createTodo({ title: 'Buy groceries', priority: 'high' });
    await helpers.createTodo({ title: 'Write report', priority: 'medium' });
    await helpers.createTodo({ title: 'Call dentist', priority: 'low' });
    await helpers.createTodo({ title: 'Buy tickets', priority: 'high' });
  });

  test('should search todos by title', async ({ page }) => {
    // Search for "Buy"
    await helpers.searchTodos('Buy');
    
    // Should show two todos with "Buy" in title
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    await expect(page.locator('text=Buy tickets')).toBeVisible();
    
    // Should not show others
    await expect(page.locator('text=Write report')).not.toBeVisible();
    await expect(page.locator('text=Call dentist')).not.toBeVisible();
  });

  test('should search case-insensitively', async ({ page }) => {
    // Search with different case
    await helpers.searchTodos('buy');
    
    // Should still find "Buy" todos
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    await expect(page.locator('text=Buy tickets')).toBeVisible();
  });

  test('should filter by priority', async ({ page }) => {
    // Filter by high priority
    await helpers.filterByPriority('high');
    
    // Should show only high priority todos
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    await expect(page.locator('text=Buy tickets')).toBeVisible();
    
    // Should not show others
    await expect(page.locator('text=Write report')).not.toBeVisible();
    await expect(page.locator('text=Call dentist')).not.toBeVisible();
  });

  test('should combine search and filter', async ({ page }) => {
    // Search for "Buy" and filter by high priority
    await helpers.searchTodos('Buy');
    await helpers.filterByPriority('high');
    
    // Should show only high priority todos with "Buy" in title
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    await expect(page.locator('text=Buy tickets')).toBeVisible();
  });

  test('should clear all filters', async ({ page }) => {
    // Apply search and filter
    await helpers.searchTodos('Buy');
    await helpers.filterByPriority('high');
    
    // Clear filters
    await page.click('button:has-text("Clear")');
    
    // All todos should be visible again
    await expect(page.locator('text=Buy groceries')).toBeVisible();
    await expect(page.locator('text=Write report')).toBeVisible();
    await expect(page.locator('text=Call dentist')).toBeVisible();
    await expect(page.locator('text=Buy tickets')).toBeVisible();
  });

  test('should show empty state when no results', async ({ page }) => {
    // Search for something that doesn't exist
    await helpers.searchTodos('nonexistent');
    
    // Should show "No todos found" or similar message
    await expect(page.locator('text=No todos found')).toBeVisible();
  });
});
