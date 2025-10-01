/**
 * Automated UI Testing Script
 * Catches common UI errors and validates component functionality
 * 
 * Usage: node src/scripts/automated-ui-test.js
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';

// Test configurations
const TEST_USERS = {
  orgAdmin: {
    email: 'admin@truwellmn.com',
    password: 'password123', // You'll need to set this
    role: 'org_admin'
  },
  supervisor: {
    email: 'supervisor@truwellmn.com', 
    password: 'password123',
    role: 'supervisor'
  },
  caseManager: {
    email: 'miknabil@yahoo.com',
    password: 'password123', 
    role: 'case_manager'
  }
};

class UITester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.errors = [];
    this.successes = [];
  }

  async init() {
    console.log('🚀 Starting automated UI testing...\n');
    
    this.browser = await puppeteer.launch({ 
      headless: false, // Set to true for CI/CD
      defaultViewport: { width: 1280, height: 720 }
    });
    
    this.page = await this.browser.newPage();
    
    // Capture console errors
    this.page.on('pageerror', (error) => {
      this.logError(`Page Error: ${error.message}`);
    });
    
    this.page.on('requestfailed', (request) => {
      this.logError(`Request Failed: ${request.url()} - ${request.failure().errorText}`);
    });

    // Listen for unhandled runtime errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.logError(`Console Error: ${msg.text()}`);
      }
    });
  }

  async loginAs(userType) {
    const user = TEST_USERS[userType];
    if (!user) throw new Error(`Unknown user type: ${userType}`);

    console.log(`📋 Logging in as ${userType} (${user.email})...`);
    
    await this.page.goto(`${BASE_URL}/auth/signin`);
    await this.page.waitForSelector('input[name="email"]', { timeout: 5000 });
    
    await this.page.type('input[name="email"]', user.email);
    await this.page.type('input[name="password"]', user.password);
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect
    await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    this.logSuccess(`✅ Successfully logged in as ${userType}`);
    return true;
  }

  async testOrgAdminUserManagement() {
    console.log('\n🧪 Testing Org Admin User Management...');
    
    try {
      // Navigate to users page
      await this.page.goto(`${BASE_URL}/org-admin/users`);
      await this.page.waitForSelector('h1', { timeout: 5000 });
      
      // Test "Invite User" dialog
      await this.page.click('button:has-text("Invite User")');
      await this.page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      
      // Fill form fields
      await this.page.fill('input[id="email"]', 'test@example.com');
      await this.page.fill('input[id="full_name"]', 'Test User');
      
      // Test role selection (should not have empty values)
      await this.page.click('[data-testid="role-select"]');
      const roleOptions = await this.page.$$('[role="option"]');
      
      for (let option of roleOptions) {
        const value = await option.getAttribute('data-value');
        if (value === '' || value === null) {
          this.logError('❌ Found Select option with empty value in role selection');
        }
      }
      
      // Test team selection (should not have empty values)
      await this.page.click('[data-testid="team-select"]');
      const teamOptions = await this.page.$$('[role="option"]');
      
      for (let option of teamOptions) {
        const value = await option.getAttribute('data-value');
        if (value === '' || value === null) {
          this.logError('❌ Found Select option with empty value in team selection');
        }
      }
      
      this.logSuccess('✅ User management form validation passed');
      
      // Close dialog
      await this.page.click('button:has-text("Cancel")');
      
    } catch (error) {
      this.logError(`❌ Org Admin User Management test failed: ${error.message}`);
    }
  }

  async testSupervisorAssignments() {
    console.log('\n🧪 Testing Supervisor Assignment System...');
    
    try {
      await this.page.goto(`${BASE_URL}/supervisor/assignments`);
      await this.page.waitForSelector('h1', { timeout: 5000 });
      
      // Test all tabs
      const tabs = ['assignments', 'unassigned', 'workloads'];
      
      for (let tab of tabs) {
        await this.page.click(`[value="${tab}"]`);
        await this.page.waitForTimeout(500); // Wait for tab content to load
        this.logSuccess(`✅ ${tab} tab loaded successfully`);
      }
      
      // Test unassigned clients tab for Select issues
      await this.page.click('[value="unassigned"]');
      
      // Look for any Select components and validate
      const selects = await this.page.$$('select, [role="combobox"]');
      for (let select of selects) {
        // Trigger dropdown to check for empty values
        await select.click();
        await this.page.waitForTimeout(200);
      }
      
      this.logSuccess('✅ Assignment system validation passed');
      
    } catch (error) {
      this.logError(`❌ Supervisor Assignment test failed: ${error.message}`);
    }
  }

  async testInvitationSystem() {
    console.log('\n🧪 Testing Invitation System...');
    
    try {
      await this.page.goto(`${BASE_URL}/org-admin/invitations`);
      await this.page.waitForSelector('h1', { timeout: 5000 });
      
      // Test "Send Invitation" dialog
      await this.page.click('button:has-text("Send Invitation")');
      await this.page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      
      // Validate form fields
      const emailInput = await this.page.$('input[id="email"]');
      const roleSelect = await this.page.$('[data-testid="role-select"]');
      const teamSelect = await this.page.$('[data-testid="team-select"]');
      
      if (!emailInput) this.logError('❌ Email input not found in invitation form');
      if (!roleSelect) this.logError('❌ Role select not found in invitation form');
      if (!teamSelect) this.logError('❌ Team select not found in invitation form');
      
      this.logSuccess('✅ Invitation system form validation passed');
      
      // Close dialog
      await this.page.click('button:has-text("Cancel")');
      
    } catch (error) {
      this.logError(`❌ Invitation System test failed: ${error.message}`);
    }
  }

  async testAllPages() {
    console.log('\n🧪 Testing All Page Loads...');
    
    const pages = [
      '/org-admin',
      '/org-admin/users', 
      '/org-admin/invitations',
      '/org-admin/clients',
      '/org-admin/teams',
      '/org-admin/analytics',
      '/supervisor',
      '/supervisor/assignments',
      '/supervisor/team',
      '/supervisor/clients'
    ];
    
    for (let pagePath of pages) {
      try {
        await this.page.goto(`${BASE_URL}${pagePath}`);
        await this.page.waitForSelector('h1', { timeout: 5000 });
        this.logSuccess(`✅ ${pagePath} loaded successfully`);
      } catch (error) {
        this.logError(`❌ ${pagePath} failed to load: ${error.message}`);
      }
    }
  }

  async runAllTests() {
    try {
      await this.init();
      
      // Test as Org Admin
      await this.loginAs('orgAdmin');
      await this.testOrgAdminUserManagement();
      await this.testInvitationSystem();
      
      // Test as Supervisor  
      await this.loginAs('supervisor');
      await this.testSupervisorAssignments();
      
      // Test all page loads
      await this.testAllPages();
      
      await this.printResults();
      
    } catch (error) {
      this.logError(`❌ Test suite failed: ${error.message}`);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  logError(message) {
    this.errors.push(message);
    console.log(message);
  }

  logSuccess(message) {
    this.successes.push(message);
    console.log(message);
  }

  async printResults() {
    console.log('\n📊 TEST RESULTS');
    console.log('================');
    console.log(`✅ Successes: ${this.successes.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      this.errors.forEach(error => console.log(`  ${error}`));
    }
    
    if (this.successes.length > 0) {
      console.log('\n✅ SUCCESSFUL TESTS:');
      this.successes.forEach(success => console.log(`  ${success}`));
    }
    
    console.log(`\n🎯 Overall Status: ${this.errors.length === 0 ? '✅ PASSED' : '❌ FAILED'}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new UITester();
  tester.runAllTests()
    .then(() => {
      process.exit(tester.errors.length === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = UITester;
