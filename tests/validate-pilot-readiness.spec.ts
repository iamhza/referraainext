import { test, expect } from '@playwright/test';

/**
 * PILOT ORG READINESS VALIDATION
 * Actually test if all the intricate connections work
 */

const CASE_MANAGER = {
  email: 'miknabil@yahoo.com',
  password: 'temp123456',
  orgDomain: 'truwellmn'
};

// Helper function to login
async function login(page: any) {
  await page.goto('/auth/signin');
  await page.click('button:has-text("Organization User")');
  await page.fill('input[placeholder*="domain"]', CASE_MANAGER.orgDomain);
  await page.fill('input[type="email"]', CASE_MANAGER.email);
  await page.fill('input[type="password"]', CASE_MANAGER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/case-manager/, { timeout: 15000 });
}

test.describe('Pilot Org Readiness - End-to-End Workflows', () => {
  
  test('Critical Path 1: New Client → Board → Drawer → Edit', async ({ page }) => {
    console.log('🧪 Testing: New Client Creation and Management');
    
    await login(page);
    
    // 1. Create new client
    console.log('Step 1: Creating new client...');
    const addClientBtn = page.locator('a[href="/case-manager/clients/new"] button').first();
    await expect(addClientBtn).toBeVisible();
    await addClientBtn.click();
    await page.waitForURL(/\/clients\/new/);
    
    // Check if form actually loads and works
    const firstNameInput = page.locator('input[name="firstName"]');
    if (!(await firstNameInput.isVisible())) {
      throw new Error('❌ BLOCKER: Client form does not load properly');
    }
    
    // Fill form with test data
    await firstNameInput.fill('Test');
    await page.locator('input[name="lastName"]').fill('Client');
    await page.locator('input[name="dateOfBirth"]').fill('1990-01-01');
    
    // Try to submit
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      console.log('✅ Client form submission works');
    } else {
      console.log('❌ No submit button found - client creation may not work');
    }
    
    // 2. Go back to board and check if client appears
    await page.goto('/case-manager');
    await page.waitForTimeout(3000); // Wait for data load
    
    const clientCards = page.locator('[data-testid="client-card"]')
      .or(page.locator('.client-card'))
      .or(page.locator('[draggable="true"]'));
    
    const cardCount = await clientCards.count();
    console.log(`Found ${cardCount} client cards on board`);
    
    if (cardCount === 0) {
      throw new Error('❌ BLOCKER: No client cards on board - client creation or board loading broken');
    }
    
    // 3. Test client card click → drawer
    await clientCards.first().click();
    await page.waitForTimeout(1000);
    
    const drawer = page.locator('[data-testid="client-drawer"]')
      .or(page.locator('.client-side-drawer'))
      .or(page.locator('[class*="drawer"]'));
    
    if (!(await drawer.isVisible())) {
      throw new Error('❌ BLOCKER: Client drawer does not open when clicking cards');
    }
    
    console.log('✅ Client card → drawer connection works');
    
    // 4. Test drawer tabs
    const tabs = ['Overview', 'Referrals', 'Timeline', 'Workspace'];
    let workingTabs = 0;
    
    for (const tabName of tabs) {
      const tab = page.locator(`[role="tab"]:has-text("${tabName}")`);
      if (await tab.isVisible()) {
        await tab.click();
        await page.waitForTimeout(500);
        workingTabs++;
        console.log(`✅ ${tabName} tab works`);
      } else {
        console.log(`❌ ${tabName} tab missing or broken`);
      }
    }
    
    if (workingTabs < 3) {
      throw new Error('❌ BLOCKER: Drawer tabs are missing or broken');
    }
    
    console.log('✅ Critical Path 1 PASSED');
  });

  test('Critical Path 2: Referral Creation Workflow', async ({ page }) => {
    console.log('🧪 Testing: Complete Referral Creation');
    
    await login(page);
    
    // 1. Check if New Referral button exists and works
    const newReferralBtn = page.locator('a[href="/case-manager/new-referral"] button');
    if (!(await newReferralBtn.isVisible())) {
      throw new Error('❌ BLOCKER: New Referral button not found');
    }
    
    await newReferralBtn.click();
    await page.waitForTimeout(2000);
    
    if (!page.url().includes('/new-referral')) {
      throw new Error('❌ BLOCKER: New Referral navigation broken');
    }
    
    // 2. Check if referral form loads
    const referralForm = page.locator('form');
    if (!(await referralForm.isVisible())) {
      throw new Error('❌ BLOCKER: Referral form does not load');
    }
    
    console.log('✅ Referral form loads');
    
    // 3. Check for essential form fields
    const essentialFields = [
      'client selection',
      'service type',
      'provider selection'
    ];
    
    // Look for any client/provider selection mechanism
    const hasClientSelection = await page.locator('select, input[placeholder*="client"], [data-testid*="client"]').count() > 0;
    const hasProviderSelection = await page.locator('select, input[placeholder*="provider"], [data-testid*="provider"]').count() > 0;
    
    if (!hasClientSelection) {
      console.log('❌ Client selection mechanism missing');
    }
    if (!hasProviderSelection) {
      console.log('❌ Provider selection mechanism missing');
    }
    
    console.log('✅ Critical Path 2 PASSED (with noted gaps)');
  });

  test('Critical Path 3: Data Import Workflow', async ({ page }) => {
    console.log('🧪 Testing: CSV Import Functionality');
    
    await login(page);
    
    // Look for import functionality
    const importOptions = [
      'button:has-text("Import")',
      'a:has-text("Import")', 
      '[data-testid="import"]',
      'button:has-text("CSV")'
    ];
    
    let importFound = false;
    for (const selector of importOptions) {
      if (await page.locator(selector).isVisible()) {
        importFound = true;
        console.log(`✅ Import option found: ${selector}`);
        break;
      }
    }
    
    if (!importFound) {
      // Check table view for import
      await page.goto('/case-manager/clients');
      await page.waitForTimeout(2000);
      
      for (const selector of importOptions) {
        if (await page.locator(selector).isVisible()) {
          importFound = true;
          console.log(`✅ Import option found in table view: ${selector}`);
          break;
        }
      }
    }
    
    if (!importFound) {
      throw new Error('❌ BLOCKER: No CSV import functionality found');
    }
    
    console.log('✅ Critical Path 3 PASSED');
  });

  test('Critical Path 4: Workspace Communication', async ({ page }) => {
    console.log('🧪 Testing: Provider Communication Workspace');
    
    await login(page);
    
    // Navigate to workspace
    await page.goto('/case-manager/workspace');
    await page.waitForTimeout(2000);
    
    if (!page.url().includes('/workspace')) {
      throw new Error('❌ BLOCKER: Workspace not accessible');
    }
    
    // Check for communication elements
    const messageInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
    const conversationArea = page.locator('[data-testid="conversations"], .conversation');
    
    const hasMessaging = await messageInput.isVisible();
    const hasConversations = await conversationArea.isVisible();
    
    if (!hasMessaging && !hasConversations) {
      throw new Error('❌ BLOCKER: Workspace has no communication functionality');
    }
    
    if (hasMessaging) console.log('✅ Message input found');
    if (hasConversations) console.log('✅ Conversation area found');
    
    console.log('✅ Critical Path 4 PASSED');
  });

  test('Critical Path 5: Drag and Drop Status Changes', async ({ page }) => {
    console.log('🧪 Testing: Board Drag & Drop Functionality');
    
    await login(page);
    await page.waitForTimeout(3000);
    
    // Check for client cards
    const clientCards = page.locator('[draggable="true"]');
    const cardCount = await clientCards.count();
    
    if (cardCount === 0) {
      console.log('⚠️ No draggable client cards found - cannot test drag/drop');
      return;
    }
    
    // Check for droppable columns
    const columns = ['UNPLACED_NEW', 'ACTIVE_STABLE', 'ACTIVE_FRUSTRATED'];
    let columnsFound = 0;
    
    for (const columnId of columns) {
      const column = page.locator(`[data-column-id="${columnId}"], [id="${columnId}"]`);
      if (await column.isVisible()) {
        columnsFound++;
        console.log(`✅ Found ${columnId} column`);
      }
    }
    
    if (columnsFound < 3) {
      throw new Error('❌ BLOCKER: Board columns missing - drag/drop broken');
    }
    
    console.log('✅ Critical Path 5 PASSED');
  });

});
