/**
 * Quick Style Fix Script
 * Automatically fixes common styling issues
 */

const fs = require('fs');
const path = require('path');

class StyleFixer {
  constructor() {
    this.fixes = 0;
    this.errors = 0;
  }

  fixFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      const fileName = path.relative(process.cwd(), filePath);
      
      // Skip if already using enhanced components
      if (content.includes('EnhancedDialog') && content.includes('EnhancedLabel')) {
        return;
      }

      let changes = false;

      // Fix Dialog imports (only if using Dialog)
      if (content.includes('from \'@/components/ui/dialog\'') && 
          !content.includes('EnhancedDialog')) {
        
        content = content.replace(
          /import { ([^}]*Dialog[^}]*) } from '@\/components\/ui\/dialog';/,
          `import { 
  EnhancedDialog as Dialog, 
  EnhancedDialogContent as DialogContent, 
  EnhancedDialogHeader as DialogHeader, 
  EnhancedDialogTitle as DialogTitle, 
  EnhancedDialogTrigger as DialogTrigger 
} from '@/components/ui/enhanced-dialog';`
        );
        changes = true;
      }

      // Fix Label imports (only if using Label)
      if (content.includes('from \'@/components/ui/label\'') && 
          !content.includes('EnhancedLabel')) {
        
        content = content.replace(
          /import { Label } from '@\/components\/ui\/label';/,
          `import { EnhancedLabel as Label } from '@/components/ui/enhanced-label';`
        );
        changes = true;
      }

      // Remove hardcoded dialog styling
      content = content.replace(
        /className="sm:max-w-md bg-white border shadow-lg"/g,
        'className="sm:max-w-md"'
      );

      content = content.replace(
        /className="sm:max-w-lg bg-white border shadow-lg"/g,
        'className="sm:max-w-lg"'
      );

      // Fix label styling
      content = content.replace(
        /className="text-sm font-medium text-gray-700"/g,
        ''
      );

      // Fix empty SelectItem values
      content = content.replace(
        /<SelectItem value="">No Team<\/SelectItem>/g,
        '<SelectItem value="no-team">No Team</SelectItem>'
      );

      content = content.replace(
        /<SelectItem value="">Unassigned<\/SelectItem>/g,
        '<SelectItem value="unassigned">Unassigned</SelectItem>'
      );

      // Add required prop to email and role labels
      content = content.replace(
        /<Label htmlFor="email">/g,
        '<Label htmlFor="email" required>'
      );

      content = content.replace(
        /<Label htmlFor="role">/g,
        '<Label htmlFor="role" required>'
      );

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed ${fileName}`);
        this.fixes++;
      }

    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
      this.errors++;
    }
  }

  fixDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          this.fixDirectory(fullPath);
        } else if (item.endsWith('.tsx')) {
          this.fixFile(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error.message);
      this.errors++;
    }
  }

  fix() {
    console.log('🔧 Starting Automatic Style Fixes...\n');
    
    // Fix critical pages
    const criticalPages = [
      'src/app/org-admin/settings/page.tsx',
      'src/app/org-admin/clients/new/page.tsx', 
      'src/app/supervisor/invite/page.tsx'
    ];

    console.log('🎯 Fixing critical pages...');
    criticalPages.forEach(page => {
      if (fs.existsSync(page)) {
        this.fixFile(page);
      }
    });
    
    console.log('\n📋 Fixing org-admin pages...');
    this.fixDirectory('src/app/org-admin');
    
    console.log('\n👥 Fixing supervisor pages...');
    this.fixDirectory('src/app/supervisor');
    
    this.printResults();
  }

  printResults() {
    console.log('\n📊 STYLE FIX RESULTS');
    console.log('====================');
    console.log(`✅ Files fixed: ${this.fixes}`);
    console.log(`❌ Errors: ${this.errors}`);
    
    if (this.fixes > 0) {
      console.log('\n🎉 Styling improvements applied!');
      console.log('📝 Changes made:');
      console.log('  • Updated Dialog components to EnhancedDialog');
      console.log('  • Updated Label components to EnhancedLabel');
      console.log('  • Removed hardcoded dialog styling');
      console.log('  • Added required indicators to form fields');
      console.log('  • Improved text visibility');
      
      console.log('\n🔄 Next steps:');
      console.log('  1. Test your dialogs - they should be more visible now');
      console.log('  2. Run "npm run audit:style" to verify fixes');
      console.log('  3. Check forms for better label visibility');
    }
    
    console.log(`\n🎯 Status: ${this.errors === 0 ? '✅ SUCCESS' : '⚠️  COMPLETED WITH ERRORS'}`);
  }
}

// Run fixes if called directly
if (require.main === module) {
  const fixer = new StyleFixer();
  fixer.fix();
}

module.exports = StyleFixer;
