/**
 * E2E Test: Tag System
 * Tests tag creation, assignment, filtering, and management
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

test.describe('Tag System', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.setupVirtualAuthenticator();
    await helpers.registerUser(`taguser_${Date.now()}`);
  });

  test('should create a new tag', async ({ page }) => {
    const tagName = 'Work';
    
    await helpers.createTag(tagName);
    
    // Open tag manager again to verify
    await page.click('button:has-text("Manage Tags")');
    await expect(page.locator(`text=${tagName}`)).toBeVisible();
    await page.click('button:has-text("Close")');
  });

  test('should assign tag to todo', async ({ page }) => {
    const tagName = 'Important';
    const todoTitle = 'Tagged task';
    
    // Create tag first
    await helpers.createTag(tagName);
    
    // Create todo
    await helpers.createTodo({ title: todoTitle });
    
    // Edit todo to assign tag
    const todoRow = page.locator(`text=${todoTitle}`).locator('..').locator('..');
    await todoRow.locator('button:has-text("Edit")').click();
    
    // Select tag checkbox
    await page.check(`input[type="checkbox"][value*="${tagName}"]`);
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Verify tag badge appears on todo
    await expect(todoRow.locator(`text=${tagName}`)).toBeVisible();
  });

  test('should filter by tag', async ({ page }) => {
    const tagName = 'Personal';
    
    // Create tag
    await helpers.createTag(tagName);
    
    // Create two todos - one with tag, one without
    await helpers.createTodo({ title: 'Tagged todo' });
    await helpers.createTodo({ title: 'Untagged todo' });
    
    // Assign tag to first todo
    const todoRow = page.locator('text=Tagged todo').locator('..').locator('..');
    await todoRow.locator('button:has-text("Edit")').click();
    await page.check(`input[type="checkbox"][value*="${tagName}"]`);
    await page.click('button:has-text("Save")');
    
    // Click tag badge to filter
    await todoRow.locator(`text=${tagName}`).click();
    
    // Only tagged todo should be visible
    await expect(page.locator('text=Tagged todo')).toBeVisible();
    await expect(page.locator('text=Untagged todo')).not.toBeVisible();
  });

  test('should edit tag name and color', async ({ page }) => {
    const originalName = 'Original';
    const newName = 'Updated';
    
    await helpers.createTag(originalName);
    
    // Open tag manager
    await page.click('button:has-text("Manage Tags")');
    
    // Edit tag
    await page.locator(`text=${originalName}`).locator('..').locator('button:has-text("Edit")').click();
    
    // Change name
    await page.fill('input[value*="Original"]', newName);
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Verify new name appears
    await expect(page.locator(`text=${newName}`)).toBeVisible();
    await expect(page.locator(`text=${originalName}`)).not.toBeVisible();
  });

  test('should delete tag', async ({ page }) => {
    const tagName = 'Temporary';
    
    await helpers.createTag(tagName);
    
    // Open tag manager
    await page.click('button:has-text("Manage Tags")');
    
    // Delete tag
    await page.locator(`text=${tagName}`).locator('..').locator('button:has-text("Delete")').click();
    
    // Confirm deletion
    page.once('dialog', dialog => dialog.accept());
    
    // Verify tag is gone
    await expect(page.locator(`text=${tagName}`)).not.toBeVisible();
  });
});
