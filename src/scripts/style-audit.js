/**
 * Style Audit Script
 * Checks for consistent styling across all pages
 */

const fs = require('fs');
const path = require('path');

class StyleAuditor {
  constructor() {
    this.issues = [];
    this.checks = 0;
  }

  checkFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.relative(process.cwd(), filePath);
      
      console.log(`🔍 Checking ${fileName}...`);
      this.checks++;

      // Check for dialog components
      if (content.includes('Dialog') && content.includes('DialogContent')) {
        if (!content.includes('EnhancedDialog')) {
          this.issues.push(`${fileName}: Using standard Dialog instead of EnhancedDialog`);
        }
      }

      // Check for label components
      if (content.includes('<Label') && !content.includes('EnhancedLabel')) {
        this.issues.push(`${fileName}: Using standard Label instead of EnhancedLabel`);
      }

      // Check for hardcoded styling
      if (content.includes('className="sm:max-w-md bg-white border shadow-lg"')) {
        this.issues.push(`${fileName}: Contains hardcoded dialog styling`);
      }

      // Check for consistent background classes
      if (content.includes('bg-[#fafbfc]')) {
        console.log(`✅ ${fileName}: Uses consistent background`);
      }

      // Check for empty SelectItem values
      if (content.includes('<SelectItem value="">')) {
        this.issues.push(`${fileName}: Contains empty SelectItem values (will cause Radix UI error)`);
      }

      // Check for form visibility issues
      if (content.includes('text-gray-400') && content.includes('Label')) {
        this.issues.push(`${fileName}: Labels may be too light (text-gray-400)`);
      }

    } catch (error) {
      this.issues.push(`${fileName}: Error reading file - ${error.message}`);
    }
  }

  checkDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          this.checkDirectory(fullPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          this.checkFile(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error.message);
    }
  }

  audit() {
    console.log('🎨 Starting Style Audit...\n');
    
    // Check org-admin pages
    console.log('📋 Checking org-admin pages...');
    this.checkDirectory('src/app/org-admin');
    
    // Check supervisor pages  
    console.log('\n👥 Checking supervisor pages...');
    this.checkDirectory('src/app/supervisor');
    
    // Check shared components
    console.log('\n🧩 Checking shared components...');
    this.checkDirectory('src/components');
    
    this.printResults();
  }

  printResults() {
    console.log('\n📊 STYLE AUDIT RESULTS');
    console.log('======================');
    console.log(`🔍 Files checked: ${this.checks}`);
    console.log(`⚠️  Issues found: ${this.issues.length}`);
    
    if (this.issues.length > 0) {
      console.log('\n⚠️  STYLING ISSUES:');
      this.issues.forEach(issue => console.log(`  • ${issue}`));
      
      console.log('\n🔧 RECOMMENDED FIXES:');
      console.log('  1. Replace Dialog with EnhancedDialog components');
      console.log('  2. Replace Label with EnhancedLabel components');
      console.log('  3. Remove hardcoded dialog styling');
      console.log('  4. Ensure consistent background colors');
      console.log('  5. Use darker text colors for better visibility');
    } else {
      console.log('\n✅ All styling checks passed!');
      console.log('🎉 Your pages have consistent, visible styling!');
    }
    
    console.log(`\n🎯 Overall Status: ${this.issues.length === 0 ? '✅ PASSED' : '⚠️  NEEDS ATTENTION'}`);
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new StyleAuditor();
  auditor.audit();
}

module.exports = StyleAuditor;
