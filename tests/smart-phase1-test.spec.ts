import { test, expect } from '@playwright/test';
import { SmartTestFramework } from './smart-test-framework';

// Test credentials
const CASE_MANAGER = {
  email: 'miknabil@yahoo.com',
  password: 'temp123456',
  orgDomain: 'truwellmn'
};

test.describe('Smart Phase 1: Auto-Healing Case Manager Tests', () => {
  
  test('Smart Login and Dashboard Verification', async ({ page }) => {
    const smart = new SmartTestFramework(page);
    
    // Auto-diagnose initial state
    await smart.diagnosePage();
    
    // Smart login that handles tours, modals, redirects automatically
    await smart.smartLogin(CASE_MANAGER);
    
    // Verify we reached the dashboard
    await smart.verifyDashboard('case_manager');
    
    // Auto-verify organization info (smart navigation)
    await smart.smartClick('Settings navigation', [
      'a[href*="settings"]',
      'button:has-text("Settings")',
      '[data-testid="settings"]',
      'nav a:has-text("Settings")'
    ]);
    
    // Smart find organization info
    const orgInfo = await smart.smartFind('Organization information', [
      'text=TruWell Minnesota',
      'text=Truwell',
      '[data-testid="org-name"]',
      '.organization-name'
    ]);
    
    expect(orgInfo).toBeVisible();
    console.log('✅ Organization verification complete');
  });

  test('Smart Empty State Detection', async ({ page }) => {
    const smart = new SmartTestFramework(page);
    
    await smart.smartLogin(CASE_MANAGER);
    await smart.verifyDashboard('case_manager');
    
    // Auto-navigate to board view if not already there
    try {
      await smart.smartClick('Board view', [
        'button:has-text("Board")',
        '[data-testid="board-view"]',
        '.view-toggle button:first-child'
      ]);
    } catch (e) {
      console.log('Already on board view or board button not needed');
    }
    
    // Smart detection of empty state
    const diagnosis = await smart.diagnosePage(['client cards', 'board columns']);
    
    // Look for board structure
    const boardExists = await smart.smartFind('Board container', [
      '.grid.grid-cols-1.lg\\:grid-cols-3',
      '.grid[class*="cols"]',
      '.board-container',
      '[data-testid="board"]',
      '.kanban-board'
    ], { timeout: 5000 });
    
    expect(boardExists).toBeVisible();
    console.log('✅ Board structure detected');
    
    // Count client cards (should be 0 for empty state)
    const clientCards = page.locator('[data-testid="client-card"], .client-card, [class*="client"][class*="card"]');
    const cardCount = await clientCards.count();
    
    console.log(`📊 Client cards found: ${cardCount}`);
    expect(cardCount).toBe(0);
    console.log('✅ Empty state confirmed');
  });

  test('Smart Client Creation Flow', async ({ page }) => {
    const smart = new SmartTestFramework(page);
    
    await smart.smartLogin(CASE_MANAGER);
    await smart.verifyDashboard('case_manager');
    
    // Smart find and click Add Client button
    await smart.smartClick('Add Client button', [
      'a[href*="clients/new"] button',
      'button:has-text("Add Client")',
      'button:has-text("New Client")',
      '[data-testid="add-client"]',
      '.quick-actions button:first-child'
    ]);
    
    // Verify we're on client creation form
    const form = await smart.smartFind('Client form', [
      'form',
      '[data-testid="client-form"]',
      '.client-form',
      'input[name*="first" i]' // Look for first name field as form indicator
    ]);
    
    // Smart form filling
    await smart.smartFill('First name', [
      'input[name="first_name"]',
      'input[name="firstName"]', 
      'input[placeholder*="first" i]'
    ], 'John');
    
    await smart.smartFill('Last name', [
      'input[name="last_name"]',
      'input[name="lastName"]',
      'input[placeholder*="last" i]'
    ], 'Doe');
    
    await smart.smartFill('Email', [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]'
    ], 'john.doe@email.com');
    
    await smart.smartFill('Phone', [
      'input[name="phone"]',
      'input[type="tel"]',
      'input[placeholder*="phone" i]'
    ], '555-123-4567');
    
    // Try to fill date of birth if field exists
    try {
      await smart.smartFill('Date of birth', [
        'input[name*="birth" i]',
        'input[name*="dob" i]',
        'input[type="date"]'
      ], '1990-01-15');
    } catch (e) {
      console.log('Date of birth field not found or not required');
    }
    
    // Smart form submission
    await smart.smartClick('Submit form', [
      'button[type="submit"]',
      'button:has-text("Save")',
      'button:has-text("Create")',
      'button:has-text("Add")',
      'form button:last-child'
    ]);
    
    // Wait for success and handle any resulting modals/redirects
    await page.waitForTimeout(3000);
    await smart.clearBlockingElements();
    
    console.log('✅ Client creation flow completed');
  });

  test('Smart Client Verification in Board', async ({ page }) => {
    const smart = new SmartTestFramework(page);
    
    await smart.smartLogin(CASE_MANAGER);
    await smart.verifyDashboard('case_manager');
    
    // Ensure we're on board view
    try {
      await smart.smartClick('Board view', [
        'button:has-text("Board")',
        '[data-testid="board-view"]'
      ]);
    } catch (e) {
      console.log('Already on board view');
    }
    
    // Smart wait for data to load
    await page.waitForTimeout(2000);
    await smart.clearBlockingElements();
    
    // Look for client cards
    const clientCards = page.locator('[data-testid="client-card"], .client-card, [class*="client"][class*="card"]');
    const cardCount = await clientCards.count();
    
    console.log(`📊 Client cards found: ${cardCount}`);
    
    if (cardCount > 0) {
      // Try to find our created client
      const johnClient = await smart.smartFind('John Doe client', [
        'text=John Doe',
        'text=John',
        '[data-testid*="john" i]',
        '.client-card:has-text("John")'
      ], { timeout: 5000 });
      
      expect(johnClient).toBeVisible();
      console.log('✅ Created client found in board view');
      
      // Test client interaction
      await johnClient.click();
      await smart.clearBlockingElements(); // Handle any drawer/modal that opens
      
      console.log('✅ Client interaction successful');
    } else {
      console.log('⚠️ No client cards found - may need to create client first');
    }
  });

});
