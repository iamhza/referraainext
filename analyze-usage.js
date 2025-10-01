#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎯 ANALYZING ACTUAL USAGE VS. ERROR-CAUSING FILES');
console.log('='.repeat(60));

// Files that are definitely being used (core functionality)
const CORE_FEATURES = [
  // Authentication
  'src/lib/auth-minimal.ts',
  'src/lib/nextauth-helpers.ts',
  'src/contexts/AuthContext.tsx',
  
  // Core API routes
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/api/users/route.ts',
  'src/app/api/providers/route.ts',
  'src/app/api/referrals/route.ts',
  'src/app/api/clients/route.ts',
  
  // Core pages
  'src/app/admin/page.tsx',
  'src/app/case-manager/page.tsx',
  'src/app/provider/page.tsx',
  'src/app/auth/signin/page.tsx',
  
  // Core components
  'src/components/layout/Sidebar.tsx',
  'src/components/dashboard/BoardView.tsx',
];

// Files that are causing errors but might not be actively used
const PROBLEMATIC_FILES_FROM_ERRORS = [
  // Org-admin stuff (not launched yet)
  'src/app/org-admin/',
  
  // Custom adapter (not working, using JWT instead)
  'src/lib/mongodb-nextauth-adapter.ts',
  
  // Chart components (if not using analytics yet)
  'src/components/ui/chart.tsx',
  'src/components/ui/resizable.tsx',
  
  // Experimental/unused API routes
  'src/app/api/org/',
  'src/app/api/test/',
  'src/app/api/debug/',
  'src/app/api/admin/migrate-',
  'src/app/api/admin/cleanup-',
  'src/app/api/admin/fix-',
  'src/app/api/admin/standardize-',
  
  // Unused services
  'src/app/api/presence/',
  'src/app/api/workspace/conversations/',
  'src/app/api/phi/',
];

function analyzeFileUsage() {
  console.log('🔍 Checking which problematic files are actually imported/used...\n');
  
  // Get all TypeScript/TSX files
  const allFiles = getAllFiles('src', ['.ts', '.tsx']);
  
  const unusedFiles = [];
  const coreErrorFiles = [];
  
  for (const errorPattern of PROBLEMATIC_FILES_FROM_ERRORS) {
    const matchingFiles = allFiles.filter(file => file.includes(errorPattern));
    
    for (const file of matchingFiles) {
      const isImported = checkIfFileIsImported(file, allFiles);
      const isRouteFile = file.includes('/route.ts');
      
      if (!isImported && !isRouteFile) {
        unusedFiles.push(file);
      } else if (isRouteFile) {
        // Check if route is actually used by checking if any components call it
        const isRouteUsed = checkIfRouteIsUsed(file, allFiles);
        if (!isRouteUsed) {
          unusedFiles.push(file);
        } else {
          coreErrorFiles.push(file);
        }
      } else {
        coreErrorFiles.push(file);
      }
    }
  }
  
  console.log('❌ FILES CAUSING ERRORS THAT CAN BE SAFELY DISABLED:');
  unusedFiles.forEach(file => console.log(`  - ${file}`));
  
  console.log('\n🔧 FILES CAUSING ERRORS THAT NEED TO BE FIXED:');
  coreErrorFiles.forEach(file => console.log(`  - ${file}`));
  
  return { unusedFiles, coreErrorFiles };
}

function checkIfFileIsImported(targetFile, allFiles) {
  const relativePath = targetFile.replace('src/', '@/');
  const fileNameWithoutExt = path.basename(targetFile, path.extname(targetFile));
  
  for (const file of allFiles) {
    if (file === targetFile) continue;
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for imports
      if (content.includes(`from '${relativePath}'`) ||
          content.includes(`from "${relativePath}"`) ||
          content.includes(`import('${relativePath}')`) ||
          content.includes(`import("${relativePath}")`) ||
          content.includes(`from '${relativePath.replace('.ts', '')}'`) ||
          content.includes(`from "${relativePath.replace('.ts', '')}"`) ||
          content.includes(fileNameWithoutExt)) {
        return true;
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  return false;
}

function checkIfRouteIsUsed(routeFile, allFiles) {
  // Extract the API path from the file path
  const apiPath = routeFile
    .replace('src/app/api', '/api')
    .replace('/route.ts', '')
    .replace(/\[([^\]]+)\]/g, '${$1}'); // Convert [id] to ${id}
  
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Look for fetch calls to this API
      if (content.includes(apiPath) || 
          content.includes(`'${apiPath}'`) ||
          content.includes(`"${apiPath}"`) ||
          content.includes(`\`${apiPath}\``)) {
        return true;
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  return false;
}

function getAllFiles(dir, extensions) {
  const files = [];
  
  function scan(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scan(fullPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  scan(dir);
  return files;
}

function generateCleanupPlan(unusedFiles) {
  console.log('\n🧹 CLEANUP PLAN:');
  console.log('1. Move unused files to a /disabled folder');
  console.log('2. Fix only the core files that are actually being used');
  console.log('3. Get a working minimal platform');
  console.log('4. Add features back one by one as needed');
  
  return unusedFiles;
}

// Run analysis
const { unusedFiles, coreErrorFiles } = analyzeFileUsage();
generateCleanupPlan(unusedFiles);

console.log('\n📝 RECOMMENDATION:');
console.log('Focus on fixing only the core error files that are actually being used.');
console.log('Disable the unused files to eliminate noise from compilation errors.');
console.log('This will give you a clean, working platform for organizational demos.');
