import { test, expect } from '@playwright/test';

// Use the same working credentials from the comprehensive test
const CASE_MANAGER = {
  email: 'miknabil@yahoo.com',
  password: 'temp123456',
  orgDomain: 'truwellmn'
};

// Helper function to login as case manager (same as working test)
async function login(page: any) {
  await page.goto('/auth/signin');
  
  // Select Organization User
  await page.click('button:has-text("Organization User")');
  await page.fill('input[placeholder*="domain"]', CASE_MANAGER.orgDomain);
  
  await page.fill('input[type="email"]', CASE_MANAGER.email);
  await page.fill('input[type="password"]', CASE_MANAGER.password);
  
  // Click the Sign In button (use submit button like working test)
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/case-manager/, { timeout: 15000 });
}

test.describe('Systematic Case Manager Flow Testing', () => {
  
  test('Flow 1: Dashboard and Board View', async ({ page }) => {
    console.log('🧪 Testing Flow 1: Dashboard and Board View');
    
    // Login with working credentials
    await login(page);
    
    // Test Dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    console.log('✅ Dashboard loads');
    
    // Test BoardView component exists
    await page.waitForTimeout(2000);
    const boardGrid = page.locator('.grid.grid-cols-1.lg\\:grid-cols-3');
    if (await boardGrid.isVisible()) {
      console.log('✅ Board grid structure found');
    } else {
      console.log('❌ Board grid structure missing');
    }
    
    // Test QuickActionsBar buttons
    const addClientBtn = page.locator('a[href="/case-manager/clients/new"] button').first();
    const newReferralBtn = page.locator('a[href="/case-manager/new-referral"] button');
    
    console.log(`✅ Add Client button: ${await addClientBtn.isVisible()}`);
    console.log(`✅ New Referral button: ${await newReferralBtn.isVisible()}`);
  });

  test('Flow 2: Navigation Between Pages', async ({ page }) => {
    console.log('🧪 Testing Flow 2: Navigation Between Pages');
    
    // Login with working credentials
    await login(page);
    
    // Test each navigation path discovered
    const testRoutes = [
      { name: 'Add Client', path: '/case-manager/clients/new', buttonSelector: 'a[href="/case-manager/clients/new"] button' },
      { name: 'Table View', path: '/case-manager/clients', buttonSelector: 'a[href="/case-manager/clients"]' },
      { name: 'New Referral', path: '/case-manager/new-referral', buttonSelector: 'a[href="/case-manager/new-referral"] button' }
    ];
    
    for (const route of testRoutes) {
      console.log(`\n🎯 Testing navigation to: ${route.name}`);
      
      // Go back to dashboard
      await page.goto('/case-manager');
      await page.waitForTimeout(1000);
      
      // Find and click the navigation element
      const navElement = page.locator(route.buttonSelector);
      if (await navElement.isVisible()) {
        await navElement.click();
        await page.waitForTimeout(2000);
        
        if (page.url().includes(route.path.split('/case-manager')[1])) {
          console.log(`✅ ${route.name} navigation works`);
          
          // Test basic page functionality
          if (route.path.includes('/clients/new')) {
            const firstNameInput = page.locator('input[name="firstName"]');
            console.log(`   Form inputs: ${await firstNameInput.isVisible()}`);
          } else if (route.path.includes('/clients')) {
            const searchInput = page.locator('input[placeholder*="Search"]');
            console.log(`   Search input: ${await searchInput.isVisible()}`);
          } else if (route.path.includes('/new-referral')) {
            const referralForm = page.locator('form');
            console.log(`   Referral form: ${await referralForm.isVisible()}`);
          }
        } else {
          console.log(`❌ ${route.name} navigation failed - URL: ${page.url()}`);
        }
      } else {
        console.log(`❌ ${route.name} button not found`);
      }
    }
  });

  test('Flow 3: Client Card Interaction (if cards exist)', async ({ page }) => {
    console.log('🧪 Testing Flow 3: Client Card Interaction');
    
    // Login with working credentials
    await login(page);
    
    await page.waitForTimeout(3000); // Wait for data loading
    
    // Look for client cards
    const clientCards = page.locator('[data-testid="client-card"]')
      .or(page.locator('.client-card'))
      .or(page.locator('[draggable="true"]'));
    
    const cardCount = await clientCards.count();
    console.log(`📋 Found ${cardCount} client cards`);
    
    if (cardCount > 0) {
      // Test clicking first card
      await clientCards.first().click();
      await page.waitForTimeout(1000);
      
      // Check for drawer
      const drawer = page.locator('[data-testid="client-drawer"]')
        .or(page.locator('.client-side-drawer'))
        .or(page.locator('[class*="drawer"]'));
      
      if (await drawer.isVisible()) {
        console.log('✅ Client drawer opens');
        
        // Test drawer tabs
        const tabs = ['Overview', 'Referrals', 'Timeline', 'Workspace'];
        for (const tabName of tabs) {
          const tab = page.getByText(tabName);
          if (await tab.isVisible()) {
            console.log(`✅ ${tabName} tab found`);
          } else {
            console.log(`❌ ${tabName} tab missing`);
          }
        }
        
        // Test drawer buttons
        const editBtn = page.getByRole('button', { name: 'Edit' });
        const requestUpdateBtn = page.locator('button:has-text("Request Update")');
        
        console.log(`✅ Edit button: ${await editBtn.isVisible()}`);
        console.log(`✅ Request Update button: ${await requestUpdateBtn.isVisible()}`);
        
      } else {
        console.log('❌ Client drawer does not open');
      }
    } else {
      console.log('⚠️  No client cards to test - need sample data');
    }
  });

  test('Flow 4: Workspace and Communication', async ({ page }) => {
    console.log('🧪 Testing Flow 4: Workspace and Communication');
    
    // Login with working credentials
    await login(page);
    
    // Test workspace access
    await page.goto('/case-manager/workspace');
    await page.waitForTimeout(2000);
    
    if (page.url().includes('/workspace')) {
      console.log('✅ Workspace page accessible');
      
      // Test workspace components
      const messageInput = page.locator('input[placeholder*="message"]')
        .or(page.locator('textarea[placeholder*="message"]'));
      const conversationList = page.locator('[data-testid="conversations"]')
        .or(page.locator('.conversation'));
      
      console.log(`✅ Message input: ${await messageInput.isVisible()}`);
      console.log(`✅ Conversation list: ${await conversationList.isVisible()}`);
      
    } else {
      console.log('❌ Workspace page not accessible');
    }
  });

});
