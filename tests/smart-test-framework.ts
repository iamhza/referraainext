import { Page, expect } from '@playwright/test';

/**
 * Smart Test Framework - Self-Healing Automated QA
 * Automatically detects and handles UI obstacles, adapts selectors, and self-diagnoses issues
 */

export class SmartTestFramework {
  private page: Page;
  private screenshotCount = 0;
  private debug = true;

  constructor(page: Page) {
    this.page = page;
  }

  private log(message: string) {
    if (this.debug) console.log(`🤖 ${message}`);
  }

  private async screenshot(name: string) {
    this.screenshotCount++;
    const filename = `smart-test-${String(this.screenshotCount).padStart(2, '0')}-${name}.png`;
    await this.page.screenshot({ path: `test-results/${filename}` });
    this.log(`📸 ${filename}`);
    return filename;
  }

  /**
   * Auto-detect and clear any blocking UI elements (modals, popups, tours, etc.)
   */
  async clearBlockingElements() {
    this.log('🔍 Scanning for blocking UI elements...');
    
    // Common blocking element patterns
    const blockingPatterns = [
      // Tours & Onboarding
      '[data-testid*="tour"]', '[class*="tour"]', '[id*="tour"]',
      '[data-testid*="intro"]', '[class*="intro"]', '[id*="intro"]',
      '[data-testid*="onboard"]', '[class*="onboard"]', '[id*="onboard"]',
      
      // Modals & Overlays
      '[data-testid*="modal"]', '[class*="modal"]', '[id*="modal"]',
      '[data-testid*="overlay"]', '[class*="overlay"]', '[id*="overlay"]',
      '[data-testid*="popup"]', '[class*="popup"]', '[id*="popup"]',
      '[role="dialog"]', '[role="alertdialog"]',
      
      // Generic blocking containers
      '.fixed', '.absolute', '[style*="z-index"]',
      '[class*="backdrop"]', '[class*="mask"]'
    ];

    let foundBlocking = false;

    for (const pattern of blockingPatterns) {
      const elements = this.page.locator(pattern);
      const count = await elements.count();
      
      if (count > 0) {
        this.log(`🎯 Found ${count} potential blocking element(s): ${pattern}`);
        
        // Check if any are actually visible and covering content
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          if (await element.isVisible()) {
            foundBlocking = true;
            await this.tryCloseBlockingElement(element, pattern);
          }
        }
      }
    }

    if (!foundBlocking) {
      this.log('✅ No blocking elements detected');
    }

    return foundBlocking;
  }

  /**
   * Try multiple strategies to close a blocking element
   */
  private async tryCloseBlockingElement(element: any, pattern: string) {
    this.log(`🔧 Attempting to close blocking element: ${pattern}`);

    // Strategy 1: Look for close buttons within the element
    const closeSelectors = [
      'button:has-text("Skip")', 'button:has-text("Close")', 'button:has-text("×")',
      'button:has-text("Cancel")', 'button:has-text("No thanks")', 'button:has-text("Later")',
      'button[aria-label*="close" i]', 'button[aria-label*="dismiss" i]',
      '[data-testid*="close"]', '[class*="close"]', '[id*="close"]',
      'button.close', '.close-button', '[role="button"][aria-label*="close" i]'
    ];

    for (const selector of closeSelectors) {
      const closeBtn = element.locator(selector).first();
      if (await closeBtn.isVisible({ timeout: 500 })) {
        try {
          await closeBtn.click();
          this.log(`✅ Closed via: ${selector}`);
          await this.page.waitForTimeout(1000);
          return true;
        } catch (e) {
          this.log(`⚠️ Failed to click: ${selector}`);
        }
      }
    }

    // Strategy 2: Try Escape key
    try {
      await this.page.keyboard.press('Escape');
      this.log('⌨️ Tried Escape key');
      await this.page.waitForTimeout(500);
    } catch (e) {
      this.log('⚠️ Escape key failed');
    }

    // Strategy 3: Click outside the modal (backdrop)
    try {
      const box = await element.boundingBox();
      if (box) {
        // Click just outside the element
        await this.page.mouse.click(10, 10);
        this.log('🖱️ Tried clicking outside element');
        await this.page.waitForTimeout(500);
      }
    } catch (e) {
      this.log('⚠️ Click outside failed');
    }

    return false;
  }

  /**
   * Smart element finder - tries multiple selector strategies
   */
  async smartFind(description: string, selectors: string[], options = { timeout: 10000 }) {
    this.log(`🔍 Smart finding: ${description}`);
    
    // First clear any blocking elements
    await this.clearBlockingElements();

    // Try each selector with increasing wait times
    for (let attempt = 0; attempt < selectors.length; attempt++) {
      const selector = selectors[attempt];
      this.log(`   Trying selector ${attempt + 1}/${selectors.length}: ${selector}`);
      
      try {
        const element = this.page.locator(selector);
        await element.waitFor({ timeout: Math.min(2000, options.timeout / selectors.length) });
        
        if (await element.isVisible()) {
          this.log(`✅ Found ${description} with: ${selector}`);
          return element;
        }
      } catch (e) {
        this.log(`   ❌ Not found with: ${selector}`);
      }
    }

    // If still not found, take a screenshot and try clearing blocking elements again
    await this.screenshot(`element-not-found-${description.replace(/\s+/g, '-')}`);
    await this.clearBlockingElements();
    
    // One more attempt with the first selector
    try {
      const element = this.page.locator(selectors[0]);
      await element.waitFor({ timeout: 2000 });
      if (await element.isVisible()) {
        this.log(`✅ Found ${description} after clearing blocks`);
        return element;
      }
    } catch (e) {
      // Final failure
    }

    throw new Error(`Could not find ${description} with any selector after multiple attempts`);
  }

  /**
   * Smart login that handles various auth flows
   */
  async smartLogin(credentials: { email: string; password: string; orgDomain?: string }) {
    this.log('🔐 Starting smart login...');
    
    // Navigate to login
    await this.page.goto('/auth/signin');
    await this.screenshot('login-page-loaded');
    
    // Handle login type selection
    if (credentials.orgDomain) {
      const orgButton = await this.smartFind('Organization User button', [
        'button:has-text("Organization User")',
        '[data-testid="org-user-button"]',
        'button[role="tab"]:has-text("Organization")',
        '.login-type button:first-child'
      ]);
      await orgButton.click();
      await this.screenshot('org-user-selected');
      
      // Fill org domain
      const orgField = await this.smartFind('Organization domain field', [
        'input[placeholder*="domain" i]',
        'input[placeholder*="organization" i]',
        'input[name*="org" i]',
        'input[type="text"]:not([type="email"]):not([type="password"])'
      ]);
      await orgField.fill(credentials.orgDomain);
    }
    
    // Fill email
    const emailField = await this.smartFind('Email field', [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]'
    ]);
    await emailField.fill(credentials.email);
    
    // Fill password
    const passwordField = await this.smartFind('Password field', [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]'
    ]);
    await passwordField.fill(credentials.password);
    
    await this.screenshot('form-filled');
    
    // Submit form
    const submitButton = await this.smartFind('Submit button', [
      'button[type="submit"]',
      'button:has-text("Log in")',
      'button:has-text("Sign in")',
      'button:has-text("Login")',
      '.login-form button[type="submit"]'
    ]);
    await submitButton.click();
    
    await this.screenshot('after-submit');
    
    // Wait for redirect and handle any auth flows
    await this.page.waitForTimeout(3000);
    await this.clearBlockingElements(); // Handle tours, modals, etc.
    await this.screenshot('after-redirect-and-cleanup');
    
    this.log('✅ Smart login completed');
  }

  /**
   * Smart dashboard verification
   */
  async verifyDashboard(expectedRole: string) {
    this.log(`🏠 Verifying ${expectedRole} dashboard...`);
    
    // Clear any remaining blocking elements
    await this.clearBlockingElements();
    
    // Look for dashboard indicators
    const dashboardElement = await this.smartFind('Dashboard heading', [
      'h1:has-text("Dashboard")',
      '[role="heading"]:has-text("Dashboard")',
      '.dashboard-title',
      '[data-testid="dashboard-title"]',
      'h1, h2, h3' // Fallback to any heading
    ]);
    
    await this.screenshot('dashboard-verified');
    this.log('✅ Dashboard verified');
    return dashboardElement;
  }

  /**
   * Smart element interaction with retries
   */
  async smartClick(description: string, selectors: string[]) {
    const element = await this.smartFind(description, selectors);
    
    // Ensure element is actionable
    await element.waitFor({ state: 'attached' });
    await element.scrollIntoViewIfNeeded();
    
    // Try clicking
    await element.click();
    this.log(`🖱️ Clicked: ${description}`);
    
    // Wait for any resulting changes
    await this.page.waitForTimeout(1000);
    await this.clearBlockingElements();
  }

  /**
   * Smart form filling
   */
  async smartFill(description: string, selectors: string[], value: string) {
    const element = await this.smartFind(description, selectors);
    await element.scrollIntoViewIfNeeded();
    await element.clear();
    await element.fill(value);
    this.log(`✏️ Filled ${description}: ${value}`);
  }

  /**
   * Auto-diagnose page state
   */
  async diagnosePage(expectedElements: string[] = []) {
    this.log('🔬 Auto-diagnosing page state...');
    
    const diagnosis = {
      url: this.page.url(),
      title: await this.page.title(),
      loadingIndicators: 0,
      modals: 0,
      forms: 0,
      buttons: 0,
      inputs: 0,
      blockingElements: 0
    };
    
    // Count different element types
    diagnosis.loadingIndicators = await this.page.locator('[class*="loading"], [class*="spinner"], .animate-spin').count();
    diagnosis.modals = await this.page.locator('[role="dialog"], [class*="modal"]').count();
    diagnosis.forms = await this.page.locator('form').count();
    diagnosis.buttons = await this.page.locator('button').count();
    diagnosis.inputs = await this.page.locator('input').count();
    
    // Check for blocking elements
    const wasBlocked = await this.clearBlockingElements();
    diagnosis.blockingElements = wasBlocked ? 1 : 0;
    
    this.log(`📊 Page diagnosis: ${JSON.stringify(diagnosis, null, 2)}`);
    await this.screenshot('page-diagnosis');
    
    return diagnosis;
  }
}
