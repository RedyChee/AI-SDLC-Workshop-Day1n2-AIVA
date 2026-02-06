/**
 * E2E Test: Subtasks and Progress Tracking
 * Tests subtask creation, completion, and progress calculation
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

test.describe('Subtasks & Progress', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.setupVirtualAuthenticator();
    await helpers.registerUser(`subtaskuser_${Date.now()}`);
  });

  test('should add subtask to todo', async ({ page }) => {
    const todoTitle = 'Project with subtasks';
    const subtaskTitle = 'Subtask 1';
    
    await helpers.createTodo({ title: todoTitle });
    await helpers.addSubtask(todoTitle, subtaskTitle);
    
    // Verify subtask appears
    const todoRow = page.locator(`text=${todoTitle}`).locator('..').locator('..');
    await expect(todoRow.locator(`text=${subtaskTitle}`)).toBeVisible();
  });

  test('should track progress with subtasks', async ({ page }) => {
    const todoTitle = 'Multi-step task';
    
    await helpers.createTodo({ title: todoTitle });
    
    // Add 3 subtasks
    await helpers.addSubtask(todoTitle, 'Step 1');
    await helpers.addSubtask(todoTitle, 'Step 2');
    await helpers.addSubtask(todoTitle, 'Step 3');
    
    const todoRow = page.locator(`text=${todoTitle}`).locator('..').locator('..');
    
    // Progress should show 0/3 (0%)
    await expect(todoRow.locator('text=0/3')).toBeVisible();
    
    // Complete first subtask
    await todoRow.locator('text=Step 1').locator('..').locator('input[type="checkbox"]').click();
    
    // Progress should update to 1/3 (33%)
    await expect(todoRow.locator('text=1/3')).toBeVisible();
    
    // Complete second subtask
    await todoRow.locator('text=Step 2').locator('..').locator('input[type="checkbox"]').click();
    
    // Progress should update to 2/3 (67%)
    await expect(todoRow.locator('text=2/3')).toBeVisible();
    
    // Complete third subtask
    await todoRow.locator('text=Step 3').locator('..').locator('input[type="checkbox"]').click();
    
    // Progress should update to 3/3 (100%)
    await expect(todoRow.locator('text=3/3')).toBeVisible();
  });

  test('should delete subtask', async ({ page }) => {
    const todoTitle = 'Task with removable subtask';
    const subtaskTitle = 'Temporary subtask';
    
    await helpers.createTodo({ title: todoTitle });
    await helpers.addSubtask(todoTitle, subtaskTitle);
    
    const todoRow = page.locator(`text=${todoTitle}`).locator('..').locator('..');
    
    // Delete subtask
    await todoRow.locator(`text=${subtaskTitle}`).locator('..').locator('button:has-text("×")').click();
    
    // Verify subtask is gone
    await expect(todoRow.locator(`text=${subtaskTitle}`)).not.toBeVisible();
  });

  test('should show progress bar', async ({ page }) => {
    const todoTitle = 'Task with progress bar';
    
    await helpers.createTodo({ title: todoTitle });
    await helpers.addSubtask(todoTitle, 'Subtask 1');
    
    const todoRow = page.locator(`text=${todoTitle}`).locator('..').locator('..');
    
    // Progress bar should be visible
    const progressBar = todoRow.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();
  });
});
