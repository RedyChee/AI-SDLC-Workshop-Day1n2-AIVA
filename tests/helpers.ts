/**
 * Test helper utilities for E2E tests
 * Provides reusable methods for common testing operations
 */

import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(public page: Page) {}

  /**
   * Setup virtual authenticator for WebAuthn testing
   * Must be called before authentication tests
   */
  async setupVirtualAuthenticator() {
    const client = await this.page.context().newCDPSession(this.page);
    await client.send('WebAuthn.enable');
    await client.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
      },
    });
  }

  /**
   * Register a new user with WebAuthn
   */
  async registerUser(username: string) {
    await this.page.goto('/auth');
    
    // Switch to register mode first (page defaults to login mode)
    await this.page.click('button:has-text("Don\'t have an account? Register")');
    
    // Fill username
    await this.page.fill('input[type="text"]', username);
    
    // Click register button
    await this.page.click('button:has-text("Register with Passkey")');
    
    // Wait for registration to complete (redirect to home)
    await this.page.waitForURL('/');
    
    // Verify we're on the home page
    await expect(this.page.locator('h1')).toContainText('Todo List');
  }

  /**
   * Login with existing user
   */
  async loginUser(username: string) {
    await this.page.goto('/auth');
    
    // Fill username
    await this.page.fill('input[type="text"]', username);
    
    // Click login button
    await this.page.click('button:has-text("Login with Passkey")');
    
    // Wait for login to complete
    await this.page.waitForURL('/');
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.page.click('button:has-text("Logout")');
    await this.page.waitForURL('/auth');
  }

  /**
   * Create a new todo
   */
  async createTodo(options: {
    title: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    recurring?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    reminder?: number;
  }) {
    // Fill title
    await this.page.fill('input[placeholder*="Add a new todo"]', options.title);
    
    // Set priority if provided
    if (options.priority) {
      await this.page.selectOption('select[name="priority"]', options.priority);
    }
    
    // Set due date if provided
    if (options.dueDate) {
      await this.page.fill('input[type="datetime-local"]', options.dueDate);
      
      // Set reminder if provided (requires due date)
      if (options.reminder) {
        await this.page.selectOption('select[name="reminder"]', options.reminder.toString());
      }
      
      // Enable recurring if provided (requires due date)
      if (options.recurring) {
        await this.page.check('input[type="checkbox"][name="recurring"]');
        await this.page.selectOption('select[name="recurrence-pattern"]', options.recurring);
      }
    }
    
    // Submit form
    await this.page.click('button:has-text("Add Todo")');
    
    // Wait for todo to appear in list
    await expect(this.page.locator(`text=${options.title}`)).toBeVisible();
  }

  /**
   * Toggle todo completion
   */
  async toggleTodo(title: string) {
    const todoRow = this.page.locator(`text=${title}`).locator('..').locator('..');
    await todoRow.locator('input[type="checkbox"]').first().click();
  }

  /**
   * Delete a todo
   */
  async deleteTodo(title: string) {
    const todoRow = this.page.locator(`text=${title}`).locator('..').locator('..');
    await todoRow.locator('button:has-text("Delete")').click();
    
    // Confirm deletion
    this.page.once('dialog', dialog => dialog.accept());
    
    // Wait for todo to disappear
    await expect(this.page.locator(`text=${title}`)).not.toBeVisible();
  }

  /**
   * Add a subtask to a todo
   */
  async addSubtask(todoTitle: string, subtaskTitle: string) {
    const todoRow = this.page.locator(`text=${todoTitle}`).locator('..').locator('..');
    
    // Expand subtasks section
    await todoRow.locator('button:has-text("Subtasks")').click();
    
    // Fill subtask title
    await todoRow.locator('input[placeholder*="Add subtask"]').fill(subtaskTitle);
    
    // Add subtask
    await todoRow.locator('button:has-text("Add")').click();
    
    // Verify subtask appears
    await expect(todoRow.locator(`text=${subtaskTitle}`)).toBeVisible();
  }

  /**
   * Create a new tag
   */
  async createTag(name: string, color: string = '#3B82F6') {
    // Open tag manager
    await this.page.click('button:has-text("Manage Tags")');
    
    // Fill tag name
    await this.page.fill('input[placeholder*="Tag name"]', name);
    
    // Set color if not default
    if (color !== '#3B82F6') {
      await this.page.fill('input[type="color"]', color);
    }
    
    // Create tag
    await this.page.click('button:has-text("Create Tag")');
    
    // Verify tag appears
    await expect(this.page.locator(`text=${name}`)).toBeVisible();
    
    // Close modal
    await this.page.click('button:has-text("Close")');
  }

  /**
   * Filter todos by priority
   */
  async filterByPriority(priority: 'all' | 'high' | 'medium' | 'low') {
    await this.page.selectOption('select[aria-label*="Filter by priority"]', priority);
  }

  /**
   * Search todos
   */
  async searchTodos(query: string) {
    await this.page.fill('input[placeholder*="Search todos"]', query);
  }

  /**
   * Export todos
   */
  async exportTodos() {
    await this.page.click('button:has-text("Export JSON")');
    
    // Wait for download
    const download = await this.page.waitForEvent('download');
    return download;
  }

  /**
   * Wait for element to be visible
   */
  async waitForText(text: string, timeout = 5000) {
    await expect(this.page.locator(`text=${text}`)).toBeVisible({ timeout });
  }

  /**
   * Get todo count in a section
   */
  async getTodoCount(section: 'Active' | 'Overdue' | 'Completed'): Promise<number> {
    const sectionLocator = this.page.locator(`h2:has-text("${section}")`).locator('..').locator('..');
    const todos = await sectionLocator.locator('[data-testid="todo-item"]').count();
    return todos;
  }
}
