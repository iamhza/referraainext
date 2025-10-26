#!/usr/bin/env node

/**
 * Comprehensive Import Migration Script
 * Systematically updates all imports after lib/ reorganization
 * 
 * Usage: node scripts/migrations/fix-all-lib-imports.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Starting comprehensive lib/ import migration...\n');

// Import mappings: OLD → NEW
const IMPORT_MAPPINGS = {
  // Auth imports
  "@/lib/api-auth": "@/lib/auth/api-auth",
  "@/lib/auth-middleware": "@/lib/auth/auth-middleware",
  "@/lib/auth-minimal": "@/lib/auth/auth-minimal",
  "@/lib/custom-auth": "@/lib/auth/custom",
  "@/lib/nextauth-helpers": "@/lib/auth/helpers",
  "'@/lib/auth'": "'@/lib/auth/auth'",
  '"@/lib/auth"': '"@/lib/auth/auth"',
  
  // Client imports
  "@/lib/client-data-enhancer": "@/lib/clients/enhancer",
  "@/lib/client-matching": "@/lib/clients/matching",
  "@/lib/client-v1.1-adapter": "@/lib/clients/adapter",
  "@/lib/secure-client": "@/lib/clients/secure",
  
  // Service imports
  "@/lib/smart-status-computer": "@/lib/services/status-computer",
  "@/lib/secure-messaging": "@/lib/services/messaging",
  "@/lib/secure-actions": "@/lib/services/actions",
  "@/lib/secure-action-comments": "@/lib/services/action-comments",
  
  // Audit imports
  "@/lib/audit-logger": "@/lib/audit/logger",
  "@/lib/hipaa-audit": "@/lib/audit/hipaa",
  "'@/lib/audit'": "'@/lib/audit/utils'",
  '"@/lib/audit"': '"@/lib/audit/utils"',
  
  // MongoDB imports
  "'@/lib/mongodb'": "'@/lib/mongodb/client'",
  '"@/lib/mongodb"': '"@/lib/mongodb/client"',
  "@/lib/init-mongodb": "@/lib/mongodb/init",
  "@/lib/mongodb-nextauth-adapter": "@/lib/mongodb/nextauth-adapter",
  
  // Organization & Invitation imports
  "@/lib/organization": "@/lib/organizations/utils",
  "@/lib/invitations": "@/lib/invitations/utils",
  
  // Shared utility imports
  "@/lib/date-utils": "@/lib/shared/date-utils",
  "@/lib/encryption": "@/lib/shared/encryption",
  "@/lib/formatting": "@/lib/shared/formatting",
  "@/lib/logger": "@/lib/shared/logger",
  "@/lib/rate-limit": "@/lib/shared/rate-limit",
  "@/lib/scoring": "@/lib/shared/scoring",
  "@/lib/server-utils": "@/lib/shared/server-utils",
  "@/lib/themes": "@/lib/shared/themes",
  "@/lib/brand-colors": "@/lib/shared/brand-colors",
  "@/lib/validation": "@/lib/shared/validation",
  "@/lib/email": "@/lib/shared/email",
  "@/lib/supabase-quota": "@/lib/shared/quota",
  "'@/lib/utils'": "'@/lib/shared/utils'",
  '"@/lib/utils"': '"@/lib/shared/utils"',
};

// Relative imports within lib/ folders
const RELATIVE_MAPPINGS = {
  "./mongodb": "../mongodb/client",
  "./organization": "../organizations/utils",
  "./hipaa-audit": "../audit/hipaa",
  "./encryption": "../shared/encryption",
  "./date-utils": "../shared/date-utils",
  "./formatting": "../shared/formatting",
  "./logger": "../shared/logger",
  "./validation": "../shared/validation",
  "./scoring": "../shared/scoring",
  "./server-utils": "../shared/server-utils",
  "./nextauth-helpers": "../auth/helpers",
};

function findAllTypeScriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        findAllTypeScriptFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function updateImportsInFile(filePath, isInLibFolder) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Apply mappings
  const mappings = isInLibFolder 
    ? { ...IMPORT_MAPPINGS, ...RELATIVE_MAPPINGS }
    : IMPORT_MAPPINGS;
  
  for (const [oldImport, newImport] of Object.entries(mappings)) {
    if (content.includes(oldImport)) {
      const regex = new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, newImport);
      modified = true;
    }
  }
  
  // Special case: remove broken Supabase imports
  if (content.includes("from '@/lib/supabase'")) {
    content = content.replace(/import .* from '@\/lib\/supabase';?\n?/g, '');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

function updateTailwindConfig() {
  const tailwindPath = path.join(process.cwd(), 'tailwind.config.ts');
  if (fs.existsSync(tailwindPath)) {
    let content = fs.readFileSync(tailwindPath, 'utf8');
    if (content.includes("'./src/lib/themes'")) {
      content = content.replace("'./src/lib/themes'", "'./src/lib/shared/themes'");
      fs.writeFileSync(tailwindPath, content, 'utf8');
      console.log('✅ Updated tailwind.config.ts');
      return true;
    }
  }
  return false;
}

// Main execution
async function migrate() {
  const startTime = Date.now();
  
  // 1. Update all TypeScript files in src/
  console.log('📁 Scanning src/ directory...');
  const srcFiles = findAllTypeScriptFiles(path.join(process.cwd(), 'src'));
  let srcUpdated = 0;
  
  srcFiles.forEach(file => {
    const isInLibFolder = file.includes('/src/lib/');
    if (updateImportsInFile(file, isInLibFolder)) {
      srcUpdated++;
    }
  });
  
  console.log(`✅ Updated ${srcUpdated} files in src/`);
  
  // 2. Update Tailwind config
  console.log('\n📁 Updating configuration files...');
  updateTailwindConfig();
  
  // 3. Update scripts if they use lib imports
  console.log('\n📁 Scanning scripts/ directory...');
  const scriptsPath = path.join(process.cwd(), 'scripts');
  if (fs.existsSync(scriptsPath)) {
    const scriptFiles = findAllTypeScriptFiles(scriptsPath);
    let scriptsUpdated = 0;
    
    scriptFiles.forEach(file => {
      if (updateImportsInFile(file, false)) {
        scriptsUpdated++;
      }
    });
    
    console.log(`✅ Updated ${scriptsUpdated} files in scripts/`);
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ MIGRATION COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   • Files updated: ${srcUpdated}`);
  console.log(`   • Time elapsed: ${elapsed}s`);
  console.log('\n🔍 Next steps:');
  console.log('   1. Run: npm run build');
  console.log('   2. Fix any remaining TypeScript errors manually');
  console.log('   3. Test: npm run dev');
  console.log('   4. Commit: git add . && git commit -m "refactor: organize lib/ by domain"');
  console.log('');
}

// Run migration
migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

