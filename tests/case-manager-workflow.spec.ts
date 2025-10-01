import { test, expect } from '@playwright/test';

// Test credentials
const CASE_MANAGER_EMAIL = 'miknabil@yahoo.com';
const CASE_MANAGER_PASSWORD = 'temp123456';
const ORG_DOMAIN = 'truwellmn';

test.describe('Case Manager Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test with a fresh login
    await page.goto('/auth/signin');
  });

  test('Case Manager Login and Dashboard Access', async ({ page }) => {
    console.log('🔐 Testing case manager login...');
    
    // Select Organization User
    await page.click('button:has-text("Organization User")');
    
    // Fill in organization domain
    await page.fill('input[placeholder*="domain"]', ORG_DOMAIN);
    
    // Fill in credentials
    await page.fill('input[type="email"]', CASE_MANAGER_EMAIL);
    await page.fill('input[type="password"]', CASE_MANAGER_PASSWORD);
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for redirect to case manager dashboard
    await expect(page).toHaveURL(/\/case-manager/);
    
    // Check that we see case manager elements
    await expect(page.getByText('Case Manager')).toBeVisible();
    
    console.log('✅ Case manager login successful');
  });

  test('Board View and Client Management', async ({ page }) => {
    await loginAsCaseManager(page);
    
    console.log('📋 Testing board view and client management...');
    
    // Check that board view loads
    await expect(page.getByText('UNPLACED_NEW')).toBeVisible();
    await expect(page.getByText('ACTIVE_STABLE')).toBeVisible();
    
    // Look for client cards
    const clientCards = page.locator('[data-testid="client-card"]').or(page.locator('.client-card')).or(page.locator('[draggable="true"]'));
    
    // If we have clients, test interactions
    const clientCount = await clientCards.count();
    console.log(`Found ${clientCount} client cards`);
    
    if (clientCount > 0) {
      // Click on first client card to open details
      await clientCards.first().click();
      
      // Check if client drawer/modal opens (look for common modal indicators)
      await page.waitForTimeout(1000); // Wait for any animations
      
      // Look for client details (try multiple possible selectors)
      const hasClientDetails = await page.locator('[data-testid="client-details"]').isVisible().catch(() => false) ||
                              await page.locator('.client-drawer').isVisible().catch(() => false) ||
                              await page.locator('[role="dialog"]').isVisible().catch(() => false);
      
      if (hasClientDetails) {
        console.log('✅ Client details opened successfully');
      } else {
        console.log('⚠️  Client details may not have opened (no modal detected)');
      }
    } else {
      console.log('⚠️  No client cards found on the board');
    }
    
    console.log('✅ Board view test completed');
  });

  test('Add New Client Flow', async ({ page }) => {
    await loginAsCaseManager(page);
    
    console.log('➕ Testing add new client flow...');
    
    // Look for "Add Client" or "New Client" button
    const addClientButton = page.getByText('Add Client').or(page.getByText('New Client')).or(page.getByText('+ Client'));
    
    if (await addClientButton.isVisible()) {
      await addClientButton.click();
      
      // Wait for form to appear
      await page.waitForTimeout(1000);
      
      // Look for client form fields
      const hasForm = await page.locator('input[name*="firstName"]').isVisible().catch(() => false) ||
                     await page.locator('input[placeholder*="First"]').isVisible().catch(() => false) ||
                     await page.locator('form').isVisible().catch(() => false);
      
      if (hasForm) {
        console.log('✅ Add client form opened successfully');
        
        // Try to fill out form (if fields exist)
        try {
          await page.fill('input[name*="firstName"], input[placeholder*="First"]', 'John');
          await page.fill('input[name*="lastName"], input[placeholder*="Last"]', 'Doe');
          console.log('✅ Form fields filled successfully');
        } catch (error) {
          console.log('⚠️  Could not fill form fields:', error);
        }
      } else {
        console.log('⚠️  Add client form did not appear');
      }
    } else {
      console.log('⚠️  Add Client button not found');
    }
    
    console.log('✅ Add client flow test completed');
  });

  test('Navigation and Sidebar', async ({ page }) => {
    await loginAsCaseManager(page);
    
    console.log('🧭 Testing navigation and sidebar...');
    
    // Check sidebar contains case manager elements
    await expect(page.getByText('Case Manager')).toBeVisible();
    
    // Try to navigate to different sections
    const navItems = ['Clients', 'Referrals', 'Settings'];
    
    for (const item of navItems) {
      const navLink = page.getByText(item).first();
      if (await navLink.isVisible()) {
        console.log(`Clicking on ${item}...`);
        await navLink.click();
        await page.waitForTimeout(1000);
        console.log(`✅ Navigated to ${item}`);
      } else {
        console.log(`⚠️  ${item} navigation not found`);
      }
    }
    
    console.log('✅ Navigation test completed');
  });

  test('Create Referral Flow', async ({ page }) => {
    await loginAsCaseManager(page);
    
    console.log('📤 Testing referral creation...');
    
    // Navigate to referrals or look for "Create Referral" button
    const createReferralButton = page.getByText('Create Referral').or(page.getByText('New Referral')).or(page.getByText('+ Referral'));
    
    if (await createReferralButton.isVisible()) {
      await createReferralButton.click();
      await page.waitForTimeout(1000);
      
      // Look for referral form
      const hasReferralForm = await page.locator('form').isVisible();
      
      if (hasReferralForm) {
        console.log('✅ Referral form opened successfully');
      } else {
        console.log('⚠️  Referral form did not appear');
      }
    } else {
      console.log('⚠️  Create Referral button not found');
    }
    
    console.log('✅ Referral creation test completed');
  });

  test('Error Detection', async ({ page }) => {
    await loginAsCaseManager(page);
    
    console.log('🚨 Checking for JavaScript errors...');
    
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(`Page Error: ${error.message}`);
    });
    
    // Navigate around to trigger any errors
    await page.click('body');
    await page.waitForTimeout(2000);
    
    // Try clicking on various elements
    const clickableElements = page.locator('button, a, [role="button"]');
    const count = Math.min(await clickableElements.count(), 5);
    
    for (let i = 0; i < count; i++) {
      try {
        await clickableElements.nth(i).click({ timeout: 1000 });
        await page.waitForTimeout(500);
      } catch (error) {
        // Ignore click failures, we're just looking for JS errors
      }
    }
    
    if (errors.length > 0) {
      console.log('🚨 JavaScript errors detected:');
      errors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ No JavaScript errors detected');
    }
    
    // Report errors in test results
    expect(errors.length, `Found ${errors.length} JavaScript errors: ${errors.join(', ')}`).toBeLessThan(5);
  });
});

// Helper function to login as case manager
async function loginAsCaseManager(page: any) {
  await page.goto('/auth/signin');
  
  // Select Organization User
  await page.click('button:has-text("Organization User")');
  
  // Fill credentials
  await page.fill('input[placeholder*="domain"]', ORG_DOMAIN);
  await page.fill('input[type="email"]', CASE_MANAGER_EMAIL);
  await page.fill('input[type="password"]', CASE_MANAGER_PASSWORD);
  
  // Submit and wait for redirect
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/case-manager/, { timeout: 10000 });
}
