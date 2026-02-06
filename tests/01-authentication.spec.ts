/**
 * E2E Test: Authentication (WebAuthn)
 * Tests user registration and login with passkeys
 */

import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';

test.describe('Authentication', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.setupVirtualAuthenticator();
  });

  test('should register a new user with passkey', async ({ page }) => {
    const username = `testuser_${Date.now()}`;
    
    await page.goto('/auth');
    
    // Switch to register mode (page defaults to login mode)
    await page.click('button:has-text("Don\'t have an account? Register")');
    
    // Fill username
    await page.fill('input[type="text"]', username);
    
    // Click register button
    await page.click('button:has-text("Register with Passkey")');
    
    // Wait for redirect to home page
    await page.waitForURL('/');
    
    // Verify we're authenticated (should see todo list)
    await expect(page.locator('h1')).toContainText('Todo List');
    
    // Verify username is displayed
    await expect(page.locator(`text=${username}`)).toBeVisible();
  });

  test('should login existing user with passkey', async ({ page }) => {
    const username = `loginuser_${Date.now()}`;
    
    // First, register
    await helpers.registerUser(username);
    
    // Logout
    await helpers.logout();
    
    // Now login
    await helpers.loginUser(username);
    
    // Verify we're back on home page
    await expect(page.locator('h1')).toContainText('Todo List');
  });

  test('should logout successfully', async ({ page }) => {
    const username = `logoutuser_${Date.now()}`;
    
    // Register and login
    await helpers.registerUser(username);
    
    // Logout
    await page.click('button:has-text("Logout")');
    
    // Should redirect to auth page
    await page.waitForURL('/auth');
    
    // Verify we're on auth page
    await expect(page.locator('h1')).toContainText(['Login', 'Register', 'Authentication']);
  });

  test('should protect routes when not authenticated', async ({ page }) => {
    // Try to access home page without authentication
    await page.goto('/');
    
    // Should redirect to auth page
    await page.waitForURL(/\/auth/);
    
    // Try to access calendar page
    await page.goto('/calendar');
    
    // Should redirect to auth page
    await page.waitForURL(/\/auth/);
  });
});
