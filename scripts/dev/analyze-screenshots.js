#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

/**
 * Screenshot Analysis Tool
 * Converts Playwright screenshots to text descriptions for debugging
 */

async function analyzeScreenshot(imagePath) {
  console.log(`\n🔍 Analyzing: ${path.basename(imagePath)}`);
  console.log('=' .repeat(50));
  
  try {
    // Get basic file info
    const stats = await fs.stat(imagePath);
    console.log(`📊 File size: ${Math.round(stats.size / 1024)}KB`);
    console.log(`📐 Image exists and is ${stats.size} bytes`);
    
    // Provide contextual analysis
    analyzeScreenshotContent(imagePath);
    
  } catch (error) {
    console.log(`❌ Error: ${imagePath} not found`);
  }
}

async function analyzeScreenshotContent(imagePath) {
  const filename = path.basename(imagePath);
  
  // Provide context-based analysis based on filename
  console.log('\n📋 Contextual Analysis:');
  
  switch(filename) {
    case '01-signin-page.png':
      console.log('- Should show login form with "Organization User" and "Platform Admin" buttons');
      console.log('- Should have email, password, and org domain fields');
      console.log('- Should have "Log in" button');
      break;
      
    case '02-org-user-selected.png':
      console.log('- Should show "Organization User" button highlighted/selected');
      console.log('- Should show org domain input field visible');
      break;
      
    case '03-form-filled.png':
      console.log('- Should show all form fields filled:');
      console.log('  * Org domain: truwellmn');
      console.log('  * Email: miknabil@yahoo.com');
      console.log('  * Password: (hidden dots)');
      break;
      
    case '04-after-login-click.png':
      console.log('- Should show loading state or redirect beginning');
      console.log('- May show button in loading state with spinner');
      break;
      
    case '05-after-redirect.png':
      console.log('- Critical: This shows where NextAuth redirected us');
      console.log('- If still on signin page: LOGIN FAILED');
      console.log('- If on different page: Shows actual redirect destination');
      break;
      
    case '06-case-manager-page.png':
      console.log('- Should show case manager dashboard with:');
      console.log('  * "Dashboard" heading');
      console.log('  * Board/Table toggle buttons');
      console.log('  * QuickActionsBar with "Add Client" button');
      console.log('  * Board grid with 3 columns (New, In Progress, Completed)');
      console.log('- If blank/loading: Authentication context issue');
      console.log('- If wrong page: Routing issue');
      break;
      
    default:
      if (filename.includes('test-failed')) {
        console.log('- This is a failure screenshot showing where test broke');
        console.log('- Compare with expected state to identify missing elements');
      }
  }
}

async function generateScreenshotReport() {
  console.log('🎯 PLAYWRIGHT SCREENSHOT ANALYSIS REPORT');
  console.log('=========================================\n');
  
  const testResultsDir = 'test-results';
  
  try {
    // Analyze our custom screenshots first
    const customScreenshots = [
      '01-signin-page.png',
      '02-org-user-selected.png', 
      '03-form-filled.png',
      '04-after-login-click.png',
      '05-after-redirect.png',
      '06-case-manager-page.png'
    ];
    
    console.log('📸 STEP-BY-STEP SCREENSHOTS:');
    for (const screenshot of customScreenshots) {
      const fullPath = path.join(testResultsDir, screenshot);
      try {
        await fs.access(fullPath);
        await analyzeScreenshot(fullPath);
      } catch {
        console.log(`\n⚠️  Missing: ${screenshot}`);
      }
    }
    
    // Also analyze failure screenshots
    console.log('\n\n🚨 FAILURE SCREENSHOTS:');
    const entries = await fs.readdir(testResultsDir, { withFileTypes: true });
    const failureDirs = entries.filter(entry => 
      entry.isDirectory() && entry.name.includes('chromium')
    );
    
    for (const dir of failureDirs) {
      const dirPath = path.join(testResultsDir, dir.name);
      const files = await fs.readdir(dirPath);
      const failureScreenshot = files.find(file => file.includes('test-failed') && file.endsWith('.png'));
      
      if (failureScreenshot) {
        console.log(`\n🔍 Failure: ${dir.name}`);
        await analyzeScreenshot(path.join(dirPath, failureScreenshot));
      }
    }
    
    console.log('\n\n🎯 DEBUGGING RECOMMENDATIONS:');
    console.log('1. Check 05-after-redirect.png - if still on signin, login failed');
    console.log('2. Check 06-case-manager-page.png - if blank, auth context issue');
    console.log('3. Compare failure screenshots with expected content above');
    console.log('4. Look for console errors in terminal output');
    
  } catch (error) {
    console.log('❌ Error generating report:', error.message);
  }
}

// Run the analysis
generateScreenshotReport();