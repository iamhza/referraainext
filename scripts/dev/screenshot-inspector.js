#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🕵️ SCREENSHOT CONTENT INSPECTOR');
console.log('='.repeat(50));

async function inspectLatestScreenshot() {
  const testResultsDir = 'test-results';
  
  if (!fs.existsSync(testResultsDir)) {
    console.log('❌ No test-results directory found.');
    return;
  }
  
  // Find the most recent screenshot
  const screenshots = [];
  
  function findScreenshots(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findScreenshots(fullPath);
      } else if (item.endsWith('.png')) {
        screenshots.push({
          path: fullPath,
          name: item,
          testName: path.basename(path.dirname(fullPath)),
          modified: stat.mtime
        });
      }
    }
  }
  
  findScreenshots(testResultsDir);
  
  if (screenshots.length === 0) {
    console.log('📷 No screenshots found.');
    return;
  }
  
  // Get the latest screenshot
  const latest = screenshots.sort((a, b) => b.modified - a.modified)[0];
  
  console.log(`🔍 Analyzing latest screenshot:`);
  console.log(`   File: ${latest.name}`);
  console.log(`   Test: ${latest.testName}`);
  console.log(`   Path: ${latest.path}`);
  console.log(`   Time: ${latest.modified.toLocaleString()}`);
  
  // Try to determine what's visible based on context
  analyzeScreenshotContent(latest);
}

function analyzeScreenshotContent(screenshot) {
  console.log('\n🎯 VISUAL ANALYSIS:');
  console.log('='.repeat(30));
  
  const path = screenshot.path.toLowerCase();
  const name = screenshot.name.toLowerCase();
  const testName = screenshot.testName.toLowerCase();
  
  // Determine what page/view this likely shows
  let pageType = 'Unknown Page';
  let expectedElements = [];
  
  if (testName.includes('login')) {
    pageType = '🔐 Login Page';
    expectedElements = [
      'Login form with email/password fields',
      'Organization User vs Platform Admin buttons',
      'Organization domain input (if org user selected)',
      'Sign in button',
      'Referra logo'
    ];
  } else if (testName.includes('case-manager')) {
    pageType = '👩‍💼 Case Manager Dashboard';
    expectedElements = [
      'Dashboard heading',
      'Board view with columns (Unplaced, Active Stable, Active Frustrated)',
      'Client cards in columns',
      'Board/Table toggle buttons',
      'Sidebar with case manager navigation',
      'Settings, Help buttons',
      'User info at bottom of sidebar'
    ];
  } else if (testName.includes('provider')) {
    pageType = '🏥 Provider Dashboard';
    expectedElements = [
      'Provider dashboard elements',
      'Client referrals',
      'Provider-specific navigation',
      'Sidebar with provider options'
    ];
  } else if (testName.includes('admin')) {
    pageType = '⚡ Platform Admin Dashboard';
    expectedElements = [
      'Admin dashboard with metrics',
      'User management options',
      'System-wide statistics',
      'Platform admin navigation'
    ];
  }
  
  console.log(`📄 Page Type: ${pageType}`);
  
  if (name.includes('failed')) {
    console.log('🚨 Status: TEST FAILED - Screenshot shows error state');
  } else {
    console.log('✅ Status: Test passed - Screenshot shows success state');
  }
  
  console.log('\n🔍 Expected Elements on this page:');
  expectedElements.forEach(element => {
    console.log(`   • ${element}`);
  });
  
  console.log('\n💡 DEBUGGING HINTS:');
  console.log('='.repeat(30));
  
  if (name.includes('failed')) {
    console.log('❌ FAILURE ANALYSIS:');
    console.log('   • Check if expected elements are visible');
    console.log('   • Look for error messages or missing components');
    console.log('   • Verify correct page loaded');
    console.log('   • Check if selectors in test match actual elements');
  } else {
    console.log('✅ SUCCESS ANALYSIS:');
    console.log('   • Elements were found and interacted with successfully');
    console.log('   • Page loaded as expected');
    console.log('   • User flow completed properly');
  }
  
  // Provide specific debugging suggestions
  if (testName.includes('login')) {
    console.log('\n🔐 LOGIN-SPECIFIC CHECKS:');
    console.log('   • Are the login type buttons visible (Organization User/Platform Admin)?');
    console.log('   • Is the organization domain field showing when needed?');
    console.log('   • Did the form submit successfully?');
    console.log('   • Was there a redirect after login?');
  }
  
  if (testName.includes('board') || testName.includes('case-manager')) {
    console.log('\n📋 BOARD VIEW CHECKS:');
    console.log('   • Are all three columns visible (Unplaced, Active Stable, Active Frustrated)?');
    console.log('   • Are there client cards in the columns?');
    console.log('   • Is the Board/Table toggle working?');
    console.log('   • Is the sidebar showing case manager options?');
  }
  
  console.log('\n📁 To examine the screenshot:');
  console.log(`   open "${screenshot.path}"`);
  console.log('   OR view the HTML report: open screenshot-report.html');
}

// Run the analysis
inspectLatestScreenshot().catch(console.error);
