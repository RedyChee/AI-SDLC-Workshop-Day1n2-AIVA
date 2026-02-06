/**
 * E2E Test: Todo CRUD Operations
 * Tests creating, reading, updating, and deleting todos
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

test.describe('Todo CRUD Operations', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.setupVirtualAuthenticator();
    await helpers.registerUser(`todouser_${Date.now()}`);
  });

  test('should create a simple todo', async ({ page }) => {
    const todoTitle = 'Buy groceries';
    
    await helpers.createTodo({ title: todoTitle });
    
    // Verify todo appears in the list
    await expect(page.locator(`text=${todoTitle}`)).toBeVisible();
  });

  test('should create todo with all metadata', async ({ page }) => {
    const todoTitle = 'Complete project report';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDateStr = tomorrow.toISOString().slice(0, 16);
    
    await helpers.createTodo({
      title: todoTitle,
      priority: 'high',
      dueDate: dueDateStr,
      recurring: 'weekly',
      reminder: 60,
    });
    
    // Verify todo appears
    await expect(page.locator(`text=${todoTitle}`)).toBeVisible();
    
    // Verify priority badge
    await expect(page.locator('text=HIGH')).toBeVisible();
    
    // Verify recurring badge
    await expect(page.locator('text=🔄')).toBeVisible();
    
    // Verify reminder badge
    await expect(page.locator('text=🔔')).toBeVisible();
  });

  test('should toggle todo completion', async ({ page }) => {
    const todoTitle = 'Test completion toggle';
    
    await helpers.createTodo({ title: todoTitle });
    
    // Toggle completion
    await helpers.toggleTodo(todoTitle);
    
    // Wait a moment for the update
    await page.waitForTimeout(500);
    
    // Todo should move to Completed section
    const completedSection = page.locator('h2:has-text("Completed")').locator('..').locator('..');
    await expect(completedSection.locator(`text=${todoTitle}`)).toBeVisible();
  });

  test('should delete a todo', async ({ page }) => {
    const todoTitle = 'Todo to delete';
    
    await helpers.createTodo({ title: todoTitle });
    
    // Delete the todo
    await helpers.deleteTodo(todoTitle);
    
    // Verify todo is gone
    await expect(page.locator(`text=${todoTitle}`)).not.toBeVisible();
  });

  test('should edit todo title', async ({ page }) => {
    const originalTitle = 'Original title';
    const newTitle = 'Updated title';
    
    await helpers.createTodo({ title: originalTitle });
    
    // Click edit button
    const todoRow = page.locator(`text=${originalTitle}`).locator('..').locator('..');
    await todoRow.locator('button:has-text("Edit")').click();
    
    // Edit title
    await page.fill('input[value*="Original"]', newTitle);
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Verify new title appears
    await expect(page.locator(`text=${newTitle}`)).toBeVisible();
    await expect(page.locator(`text=${originalTitle}`)).not.toBeVisible();
  });

  test('should validate empty todo title', async ({ page }) => {
    // Try to create todo with empty title
    await page.fill('input[placeholder*="Add a new todo"]', '   ');
    await page.click('button:has-text("Add Todo")');
    
    // Should show error or not create todo
    // Wait a moment
    await page.waitForTimeout(500);
    
    // Check no empty todo was created
    const todoCount = await page.locator('[data-testid="todo-item"]').count();
    expect(todoCount).toBe(0);
  });

  test('should sort todos by priority', async ({ page }) => {
    // Create todos with different priorities
    await helpers.createTodo({ title: 'Low priority task', priority: 'low' });
    await helpers.createTodo({ title: 'High priority task', priority: 'high' });
    await helpers.createTodo({ title: 'Medium priority task', priority: 'medium' });
    
    // Get all todo titles in order
    const todos = await page.locator('[data-testid="todo-item"]').allTextContents();
    
    // High priority should come first, then medium, then low
    const highIndex = todos.findIndex(t => t.includes('High priority'));
    const mediumIndex = todos.findIndex(t => t.includes('Medium priority'));
    const lowIndex = todos.findIndex(t => t.includes('Low priority'));
    
    expect(highIndex).toBeLessThan(mediumIndex);
    expect(mediumIndex).toBeLessThan(lowIndex);
  });
});
