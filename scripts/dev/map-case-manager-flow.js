#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🗺️  MAPPING CASE MANAGER FLOW SYSTEMATICALLY');
console.log('='.repeat(60));

/**
 * Step 1: Find all case manager pages
 * Step 2: Extract navigation from each page
 * Step 3: Map the complete user journey
 */

function mapCaseManagerFlow() {
  console.log('\n📄 STEP 1: FIND ALL CASE MANAGER PAGES');
  console.log('='.repeat(40));
  
  const caseManagerPages = findAllPages();
  caseManagerPages.forEach(page => {
    console.log(`✅ ${page.route}`);
    console.log(`   File: ${page.file}`);
    console.log(`   Purpose: ${page.purpose}`);
  });

  console.log('\n🔗 STEP 2: EXTRACT NAVIGATION FROM EACH PAGE');
  console.log('='.repeat(50));
  
  const navigationMap = {};
  caseManagerPages.forEach(page => {
    console.log(`\n📍 Analyzing: ${page.route}`);
    const navigation = extractNavigation(page.file);
    navigationMap[page.route] = navigation;
    
    navigation.buttons.forEach(btn => {
      console.log(`   🔘 Button: "${btn.text}" → ${btn.action}`);
    });
    
    navigation.links.forEach(link => {
      console.log(`   🔗 Link: "${link.text}" → ${link.href}`);
    });
    
    navigation.components.forEach(comp => {
      console.log(`   🧩 Component: ${comp.name} (${comp.interactions.join(', ')})`);
    });
  });

  console.log('\n🎯 STEP 3: MAP THE USER JOURNEY');
  console.log('='.repeat(40));
  
  const userJourney = buildUserJourney(caseManagerPages, navigationMap);
  userJourney.forEach((step, index) => {
    console.log(`\n${index + 1}. ${step.action}`);
    console.log(`   📍 Page: ${step.page}`);
    console.log(`   🎯 Goal: ${step.goal}`);
    console.log(`   🔄 Next: ${step.nextActions.join(' OR ')}`);
  });

  return { caseManagerPages, navigationMap, userJourney };
}

function findAllPages() {
  const pages = [];
  const caseManagerDir = 'src/app/case-manager';
  
  function scanDirectory(dir, routeBase = '/case-manager') {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('[')) {
        // Scan subdirectory
        scanDirectory(fullPath, `${routeBase}/${item}`);
      } else if (item === 'page.tsx') {
        // Found a page
        const content = fs.readFileSync(fullPath, 'utf8');
        pages.push({
          route: routeBase === '/case-manager' && dir.endsWith('case-manager') ? '/case-manager' : routeBase,
          file: fullPath,
          purpose: extractPagePurpose(content),
          content: content
        });
      }
    }
  }
  
  scanDirectory(caseManagerDir);
  return pages;
}

function extractPagePurpose(content) {
  // Look for component name and common patterns
  const functionMatch = content.match(/export default function (\w+)/);
  if (functionMatch) {
    const name = functionMatch[1];
    
    // Determine purpose from name and content
    if (name.includes('Board') || content.includes('BoardView')) {
      return 'Main dashboard with board view for managing clients';
    } else if (name.includes('Client') && (content.includes('new') || content.includes('form'))) {
      return 'Create new client form';
    } else if (name.includes('Client') && content.includes('table')) {
      return 'Client list/table view for searching and managing clients';
    } else if (name.includes('Referral')) {
      return 'Manage referrals and provider connections';
    } else if (name.includes('Workspace')) {
      return 'Communication workspace with providers';
    } else if (name.includes('Settings')) {
      return 'User settings and preferences';
    } else {
      return `${name} page`;
    }
  }
  
  return 'Case manager page';
}

function extractNavigation(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  const navigation = {
    buttons: [],
    links: [],
    components: []
  };
  
  // Extract buttons
  const buttonMatches = content.matchAll(/<button[^>]*>(.*?)<\/button>/gs);
  for (const match of buttonMatches) {
    const buttonText = match[1].replace(/<[^>]*>/g, '').trim();
    if (buttonText && !buttonText.includes('{') && buttonText.length < 50) {
      navigation.buttons.push({
        text: buttonText,
        action: extractButtonAction(content, buttonText)
      });
    }
  }
  
  // Extract Link components
  const linkMatches = content.matchAll(/<Link\s+href=["']([^"']+)["'][^>]*>(.*?)<\/Link>/gs);
  for (const match of linkMatches) {
    const href = match[1];
    const linkText = match[2].replace(/<[^>]*>/g, '').trim();
    if (linkText && !linkText.includes('{') && linkText.length < 50) {
      navigation.links.push({
        text: linkText,
        href: href
      });
    }
  }
  
  // Extract major components and their interactions
  const componentPatterns = [
    { name: 'BoardView', interactions: ['drag-drop', 'click-cards'] },
    { name: 'ClientSideDrawer', interactions: ['tabs', 'edit', 'close'] },
    { name: 'QuickActionsBar', interactions: ['add-client', 'new-referral', 'refresh'] },
    { name: 'ClientsTable', interactions: ['search', 'filter', 'edit'] },
    { name: 'ReferralForm', interactions: ['create', 'submit'] }
  ];
  
  componentPatterns.forEach(pattern => {
    if (content.includes(pattern.name)) {
      navigation.components.push(pattern);
    }
  });
  
  return navigation;
}

function extractButtonAction(content, buttonText) {
  // Look for onClick handlers near the button
  const lines = content.split('\n');
  const buttonLine = lines.find(line => line.includes(buttonText));
  
  if (buttonLine) {
    if (buttonLine.includes('onClick')) {
      const onClickMatch = buttonLine.match(/onClick=\{([^}]+)\}/);
      if (onClickMatch) {
        return `calls ${onClickMatch[1]}`;
      }
    }
  }
  
  // Common button action patterns
  if (buttonText.toLowerCase().includes('add')) return 'opens add form';
  if (buttonText.toLowerCase().includes('edit')) return 'opens edit form';
  if (buttonText.toLowerCase().includes('delete')) return 'deletes item';
  if (buttonText.toLowerCase().includes('save')) return 'saves changes';
  if (buttonText.toLowerCase().includes('cancel')) return 'cancels action';
  if (buttonText.toLowerCase().includes('search')) return 'performs search';
  
  return 'unknown action';
}

function buildUserJourney(pages, navigationMap) {
  const journey = [];
  
  // Start with main dashboard
  const dashboardPage = pages.find(p => p.route === '/case-manager');
  if (dashboardPage) {
    journey.push({
      action: 'Login and view dashboard',
      page: '/case-manager',
      goal: 'See overview of all clients in board view',
      nextActions: ['Click client card', 'Add new client', 'Switch to table view', 'Create referral']
    });
    
    // Add client card interaction
    journey.push({
      action: 'Click on client card',
      page: '/case-manager (drawer opens)',
      goal: 'View detailed client information in side drawer',
      nextActions: ['Navigate drawer tabs', 'Edit client', 'Request update', 'Close drawer']
    });
    
    // Add client form
    const newClientPage = pages.find(p => p.route.includes('/clients/new'));
    if (newClientPage) {
      journey.push({
        action: 'Add new client',
        page: '/case-manager/clients/new',
        goal: 'Create a new client record',
        nextActions: ['Fill form', 'Save client', 'Cancel']
      });
    }
    
    // Table view
    const clientsPage = pages.find(p => p.route.includes('/clients') && !p.route.includes('/new'));
    if (clientsPage) {
      journey.push({
        action: 'Switch to table view',
        page: '/case-manager/clients',
        goal: 'Search and manage clients in table format',
        nextActions: ['Search clients', 'Edit client', 'View details']
      });
    }
    
    // Referrals
    const referralsPage = pages.find(p => p.route.includes('referral'));
    if (referralsPage) {
      journey.push({
        action: 'Manage referrals',
        page: referralsPage.route,
        goal: 'Create and track referrals to providers',
        nextActions: ['Create new referral', 'Track existing', 'Communicate with provider']
      });
    }
    
    // Workspace
    const workspacePage = pages.find(p => p.route.includes('workspace'));
    if (workspacePage) {
      journey.push({
        action: 'Access workspace',
        page: workspacePage.route,
        goal: 'Communicate with providers and track conversations',
        nextActions: ['Send message', 'View conversations', 'Track progress']
      });
    }
  }
  
  return journey;
}

// Run the mapping
const result = mapCaseManagerFlow();

console.log('\n🎯 TESTING STRATEGY');
console.log('='.repeat(30));
console.log('Based on this analysis, we should test:');

result.userJourney.forEach((step, index) => {
  console.log(`\n${index + 1}. ${step.action}`);
  console.log(`   🧪 Test: Navigate to ${step.page} and verify ${step.goal}`);
  console.log(`   ✅ Success criteria: ${step.nextActions.join(', ')} should be available`);
});

console.log('\n📋 NEXT STEPS');
console.log('='.repeat(20));
console.log('1. Create targeted tests for each journey step');
console.log('2. Test actual navigation between pages');
console.log('3. Verify all interactive elements work');
console.log('4. Identify what\'s missing vs what exists');

// Export for potential use
console.log('\n✅ Flow mapping complete!');
