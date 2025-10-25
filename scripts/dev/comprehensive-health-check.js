#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 REFERRA PLATFORM HEALTH CHECK & AUTO-REPAIR');
console.log('='.repeat(60));

class HealthChecker {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.warnings = [];
  }

  log(category, message, data = null) {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, category, message, data };
    
    if (category === 'ERROR') this.issues.push(entry);
    else if (category === 'FIX') this.fixes.push(entry);
    else if (category === 'WARN') this.warnings.push(entry);
    
    console.log(`[${category}] ${message}`);
    if (data) console.log('  ', JSON.stringify(data, null, 2));
  }

  // 1. Check for compilation errors
  async checkCompilation() {
    this.log('INFO', 'Checking TypeScript compilation...');
    
    try {
      execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
      this.log('SUCCESS', 'TypeScript compilation passed');
    } catch (error) {
      this.log('ERROR', 'TypeScript compilation failed', {
        error: error.stdout?.toString() || error.message
      });
    }
  }

  // 2. Scan for syntax errors in API routes
  async scanApiRoutes() {
    this.log('INFO', 'Scanning API routes for syntax errors...');
    
    const apiDir = 'src/app/api';
    const routes = this.getAllFiles(apiDir, '.ts');
    
    let corruptedFiles = [];
    
    for (const route of routes) {
      try {
        const content = fs.readFileSync(route, 'utf8');
        
        // Check for common corruption patterns
        const issues = [];
        
        if (content.includes('const { data: { session } }')) {
          issues.push('Corrupted Supabase auth pattern');
        }
        
        if (content.match(/^import.*;\n\n,/m)) {
          issues.push('Stray comma after imports');
        }
        
        if (content.includes('getSession()') && !content.includes('getAuthenticatedUser()')) {
          issues.push('Using old Supabase auth instead of NextAuth');
        }
        
        if (content.includes('session.user.user_metadata?.role')) {
          issues.push('Using old role pattern instead of user.role');
        }
        
        if (issues.length > 0) {
          corruptedFiles.push({ file: route, issues });
        }
        
      } catch (error) {
        this.log('ERROR', `Failed to read ${route}`, { error: error.message });
      }
    }
    
    if (corruptedFiles.length > 0) {
      this.log('ERROR', `Found ${corruptedFiles.length} corrupted API routes`, corruptedFiles);
      return corruptedFiles;
    } else {
      this.log('SUCCESS', 'All API routes appear clean');
      return [];
    }
  }

  // 3. Check authentication configuration
  async checkAuth() {
    this.log('INFO', 'Checking authentication configuration...');
    
    const issues = [];
    
    // Check NextAuth config
    if (!fs.existsSync('src/lib/auth-minimal.ts')) {
      issues.push('Missing NextAuth configuration');
    }
    
    // Check environment variables
    try {
      const envContent = fs.readFileSync('.env.local', 'utf8');
      const requiredVars = ['NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'MONGODB_URI'];
      
      for (const varName of requiredVars) {
        if (!envContent.includes(varName)) {
          issues.push(`Missing environment variable: ${varName}`);
        }
      }
    } catch (error) {
      issues.push('Cannot read .env.local file');
    }
    
    if (issues.length > 0) {
      this.log('ERROR', 'Authentication configuration issues', issues);
    } else {
      this.log('SUCCESS', 'Authentication configuration looks good');
    }
    
    return issues;
  }

  // 4. Check database connectivity
  async checkDatabase() {
    this.log('INFO', 'Checking database connectivity...');
    
    try {
      // Test MongoDB connection
      const { MongoClient } = require('mongodb');
      require('dotenv').config({ path: '.env.local' });
      
      if (!process.env.MONGODB_URI) {
        this.log('ERROR', 'MONGODB_URI not found in environment');
        return false;
      }
      
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      
      const db = client.db('referradb');
      const collections = await db.listCollections().toArray();
      
      this.log('SUCCESS', `MongoDB connected. Found ${collections.length} collections`);
      
      // Check for required collections
      const requiredCollections = ['users', 'organizations', 'clients', 'referrals'];
      const existingCollections = collections.map(c => c.name);
      
      for (const required of requiredCollections) {
        if (!existingCollections.includes(required)) {
          this.log('WARN', `Missing collection: ${required}`);
        }
      }
      
      await client.close();
      return true;
      
    } catch (error) {
      this.log('ERROR', 'Database connection failed', { error: error.message });
      return false;
    }
  }

  // 5. Check for missing dependencies
  async checkDependencies() {
    this.log('INFO', 'Checking dependencies...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const requiredDeps = [
        'next-auth',
        'mongodb',
        'bcryptjs',
        '@supabase/ssr'
      ];
      
      const missing = [];
      for (const dep of requiredDeps) {
        if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
          missing.push(dep);
        }
      }
      
      if (missing.length > 0) {
        this.log('ERROR', 'Missing dependencies', missing);
        return missing;
      } else {
        this.log('SUCCESS', 'All required dependencies present');
        return [];
      }
      
    } catch (error) {
      this.log('ERROR', 'Failed to check dependencies', { error: error.message });
      return [];
    }
  }

  // Auto-fix corrupted API routes
  async autoFixApiRoutes(corruptedFiles) {
    if (corruptedFiles.length === 0) return;
    
    this.log('INFO', `Auto-fixing ${corruptedFiles.length} corrupted API routes...`);
    
    for (const { file, issues } of corruptedFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;
        
        // Fix corrupted Supabase auth patterns
        if (content.includes('const { data: { session } }')) {
          content = content.replace(
            /,\s*\},\s*\}\s*\);\s*const \{ data: \{ session \} \} = await supabase\.auth\.getAuthenticatedUser\(\);\s*return session;\s*\}/g,
            ''
          );
          modified = true;
        }
        
        // Fix stray commas
        content = content.replace(/^(import.*;\n)\n,$/m, '$1');
        
        // Replace old auth patterns
        content = content.replace(/getSession\(\)/g, 'getAuthenticatedUser()');
        content = content.replace(/session\.user\.user_metadata\?\.role/g, 'user.role');
        content = content.replace(/session\.user\.user_metadata\?\.email/g, 'user.email');
        
        if (modified) {
          fs.writeFileSync(file, content, 'utf8');
          this.log('FIX', `Fixed ${file}`, issues);
        }
        
      } catch (error) {
        this.log('ERROR', `Failed to fix ${file}`, { error: error.message });
      }
    }
  }

  // Utility: Get all files recursively
  getAllFiles(dir, ext) {
    const files = [];
    
    function scan(currentDir) {
      try {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            scan(fullPath);
          } else if (item.endsWith(ext)) {
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

  // Generate comprehensive report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 HEALTH CHECK SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`✅ Fixes Applied: ${this.fixes.length}`);
    console.log(`❌ Issues Found: ${this.issues.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    
    if (this.issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES TO ADDRESS:');
      this.issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.message}`);
      });
    }
    
    if (this.fixes.length > 0) {
      console.log('\n✅ AUTO-FIXES APPLIED:');
      this.fixes.forEach((fix, i) => {
        console.log(`${i + 1}. ${fix.message}`);
      });
    }
    
    console.log('\n📝 NEXT STEPS:');
    if (this.issues.length === 0) {
      console.log('🎉 Platform appears healthy! Ready for testing.');
    } else {
      console.log('🔧 Address the critical issues above, then re-run this check.');
    }
  }

  // Main execution
  async run() {
    try {
      // 1. Check compilation
      await this.checkCompilation();
      
      // 2. Scan and fix API routes
      const corruptedFiles = await this.scanApiRoutes();
      await this.autoFixApiRoutes(corruptedFiles);
      
      // 3. Check auth configuration
      await this.checkAuth();
      
      // 4. Check database
      await this.checkDatabase();
      
      // 5. Check dependencies
      await this.checkDependencies();
      
      // 6. Generate report
      this.generateReport();
      
    } catch (error) {
      this.log('ERROR', 'Health check failed', { error: error.message });
    }
  }
}

// Run the health check
if (require.main === module) {
  const checker = new HealthChecker();
  checker.run().then(() => {
    process.exit(checker.issues.length === 0 ? 0 : 1);
  });
}

module.exports = HealthChecker;
