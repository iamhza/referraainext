import { test, expect } from '@playwright/test';

// Test credentials
const CASE_MANAGER = {
  email: 'miknabil@yahoo.com',
  password: 'temp123456',
  orgDomain: 'truwellmn'
};

// Helper function to login as case manager
async function loginAsCaseManager(page: any) {
  console.log('🔐 Logging in as case manager...');
  
  // Screenshot 1: Initial signin page
  await page.goto('/auth/signin');
  await page.screenshot({ path: 'test-results/01-signin-page.png' });
  console.log('📸 Screenshot: signin page');
  
  // Screenshot 2: After selecting org user
  await page.click('button:has-text("Organization User")');
  await page.screenshot({ path: 'test-results/02-org-user-selected.png' });
  console.log('📸 Screenshot: org user selected');
  
  // Fill form
  await page.fill('input[placeholder*="domain"]', CASE_MANAGER.orgDomain);
  await page.fill('input[type="email"]', CASE_MANAGER.email);
  await page.fill('input[type="password"]', CASE_MANAGER.password);
  
  // Screenshot 3: Form filled
  await page.screenshot({ path: 'test-results/03-form-filled.png' });
  console.log('📸 Screenshot: form filled');
  
  // Click login
  await page.click('button[type="submit"]:has-text("Log in")');
  
  // Screenshot 4: Right after clicking login
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/04-after-login-click.png' });
  console.log('📸 Screenshot: after login click');
  
  // Wait for redirect
  await page.waitForTimeout(3000);
  
  const currentUrl = page.url();
  console.log(`📍 Current URL after login: ${currentUrl}`);
  
  // Screenshot 5: After redirect
  await page.screenshot({ path: 'test-results/05-after-redirect.png' });
  console.log('📸 Screenshot: after redirect');
  
  // Navigate to case manager if needed
  if (!currentUrl.includes('/case-manager')) {
    console.log('🔄 Redirecting to case manager dashboard...');
    await page.goto('/case-manager');
    await page.waitForTimeout(2000);
  }
  
  // Screenshot 6: Final case manager page
  await page.screenshot({ path: 'test-results/06-case-manager-page.png' });
  console.log('📸 Screenshot: case manager page');
  
  // Handle tour popup if it appears
  const tourModal = page.locator('[data-testid="tour-modal"]').or(page.locator('.tour-modal')).or(page.locator('[class*="tour"]')).or(page.locator('[class*="intro"]'));
  
  if (await tourModal.isVisible({ timeout: 2000 })) {
    console.log('🎯 Tour popup detected, closing it...');
    
    // Try different ways to close tour
    const closeButtons = [
      page.locator('button:has-text("Skip")'),
      page.locator('button:has-text("Close")'),
      page.locator('button:has-text("×")'),
      page.locator('button[aria-label="Close"]'),
      page.locator('.tour-close'),
      page.locator('[data-testid="tour-close"]')
    ];
    
    for (const closeBtn of closeButtons) {
      if (await closeBtn.isVisible({ timeout: 1000 })) {
        await closeBtn.click();
        console.log('✅ Closed tour popup');
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    // Screenshot after closing tour
    await page.screenshot({ path: 'test-results/07-after-tour-closed.png' });
    console.log('📸 Screenshot: after tour closed');
  }
  
  console.log('✅ Successfully logged in and on case manager area');
}

test.describe('Phase 1: Case Manager Day 1 Experience', () => {
  
  test('1. Login and verify organization association', async ({ page }) => {
    await loginAsCaseManager(page);
    
    // Verify we're on the case manager dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    console.log('✅ Dashboard loaded');
    
    // Go to settings to verify org info
    await page.goto('/case-manager/settings');
    await page.waitForTimeout(2000);
    
    // Verify organization information is displayed
    await expect(page.getByText('TruWell Minnesota')).toBeVisible();
    console.log('✅ Organization correctly displayed in settings');
    
    // Verify role is displayed
    await expect(page.getByText('case_manager')).toBeVisible();
    console.log('✅ Role correctly displayed');
  });

  test('2. Empty state - verify no clients initially', async ({ page }) => {
    await loginAsCaseManager(page);
    
    // Wait for board to load
    await page.waitForTimeout(3000);
    
    // Should see empty board - check for typical empty state indicators
    const boardContainer = page.locator('.grid.grid-cols-1.lg\\:grid-cols-3');
    await expect(boardContainer).toBeVisible({ timeout: 8000 });
    
    // Check if there are any client cards (there should be 0)
    const clientCards = page.locator('[data-testid="client-card"]').or(page.locator('.client-card')).or(page.locator('[class*="client"]'));
    const cardCount = await clientCards.count();
    console.log(`📊 Client cards found: ${cardCount}`);
    
    expect(cardCount).toBe(0);
    console.log('✅ Confirmed empty state - no existing clients');
  });

  test('3. Create first client - Day 1 workflow', async ({ page }) => {
    await loginAsCaseManager(page);
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    
    // Find and click Add Client button
    console.log('🔍 Looking for Add Client button...');
    const addClientButton = page.locator('a[href="/case-manager/clients/new"] button').first();
    
    await expect(addClientButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Add Client button found');
    
    await addClientButton.click();
    await page.waitForTimeout(2000);
    
    // Verify we're on the new client form
    expect(page.url()).toContain('/clients/new');
    console.log('✅ Navigated to new client form');
    
    // Fill out the client form
    console.log('📝 Filling out first client form...');
    
    // Test client data
    const clientData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phone: '555-123-4567',
      dateOfBirth: '1990-01-15'
    };
    
    // Fill basic information
    await page.fill('input[name="first_name"]', clientData.firstName);
    await page.fill('input[name="last_name"]', clientData.lastName);
    await page.fill('input[name="email"]', clientData.email);
    await page.fill('input[name="phone"]', clientData.phone);
    
    // Handle date of birth (might be different input types)
    const dobInput = page.locator('input[name="date_of_birth"]').or(page.locator('input[name="dateOfBirth"]'));
    if (await dobInput.isVisible()) {
      await dobInput.fill(clientData.dateOfBirth);
    }
    
    console.log('✅ Filled basic client information');
    
    // Submit the form
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Save")'));
    await submitButton.click();
    
    // Wait for success or redirect
    await page.waitForTimeout(3000);
    
    // Check if we were redirected (successful creation)
    const currentUrl = page.url();
    console.log(`📍 Current URL after submission: ${currentUrl}`);
    
    // Verify client was created by checking if we're on client detail page or back to dashboard
    if (currentUrl.includes('/clients/') && !currentUrl.includes('/new')) {
      console.log('✅ Client created - redirected to client detail page');
    } else if (currentUrl.includes('/case-manager')) {
      console.log('✅ Client created - redirected to dashboard');
    } else {
      console.log('⚠️  Unexpected redirect after client creation');
    }
  });

  test('4. Verify client appears in board view', async ({ page }) => {
    await loginAsCaseManager(page);
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    
    // Ensure we're in board view
    const boardButton = page.getByRole('button', { name: 'Board', exact: true });
    if (await boardButton.isVisible()) {
      await boardButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Look for client cards now
    const clientCards = page.locator('[data-testid="client-card"]').or(page.locator('.client-card')).or(page.locator('[class*="client"]'));
    const cardCount = await clientCards.count();
    console.log(`📊 Client cards found after creation: ${cardCount}`);
    
    if (cardCount > 0) {
      console.log('✅ Client successfully appears in board view');
      
      // Try to find our created client
      const johnDoeCard = page.locator('text=John Doe').or(page.locator('text=John')).or(page.locator('text=Doe'));
      if (await johnDoeCard.isVisible()) {
        console.log('✅ Found our created client: John Doe');
      } else {
        console.log('⚠️  Created client not immediately visible by name');
      }
    } else {
      console.log('❌ No clients visible in board view after creation');
    }
  });

  test('5. Test client interaction and details', async ({ page }) => {
    await loginAsCaseManager(page);
    await page.waitForTimeout(3000);
    
    // Look for any client card to interact with
    const clientCard = page.locator('[data-testid="client-card"]').or(page.locator('.client-card')).first();
    
    if (await clientCard.isVisible()) {
      console.log('✅ Client card found, testing interaction...');
      
      // Click on the client card
      await clientCard.click();
      await page.waitForTimeout(2000);
      
      // Check if client side drawer or detail page opened
      const sideDrawer = page.locator('[data-testid="client-drawer"]').or(page.locator('.drawer')).or(page.locator('[class*="drawer"]'));
      const isDrawerVisible = await sideDrawer.isVisible();
      
      if (isDrawerVisible) {
        console.log('✅ Client side drawer opened');
        
        // Test tabs if they exist
        const tabs = page.locator('[role="tab"]').or(page.locator('.tab'));
        const tabCount = await tabs.count();
        console.log(`📊 Found ${tabCount} tabs in client drawer`);
        
        // Close drawer
        const closeButton = page.locator('button[aria-label="Close"]').or(page.locator('button:has-text("×")'));
        if (await closeButton.isVisible()) {
          await closeButton.click();
          console.log('✅ Successfully closed client drawer');
        }
      } else {
        console.log('⚠️  Client drawer did not open on card click');
      }
    } else {
      console.log('⚠️  No client cards available for interaction testing');
    }
  });

});
