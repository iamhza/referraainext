/**
 * Master Migration Script
 * 
 * Runs all migrations in sequence to transform data model to v1.1
 */

const { execSync } = require('child_process');

const migrations = [
  '01-create-org-members',
  '02-migrate-client-structure',
  '03-enhance-service-relationships',
  '04-create-authorizations',
  '05-simplify-actions',
];

console.log('🚀 REFERRA DATA MODEL MIGRATION TO v1.1');
console.log('='.repeat(70));
console.log('');
console.log('This will transform your data model to the v1.1 architecture:');
console.log('  ✅ Create org_members junction table');
console.log('  ✅ Migrate clients to nested PHI structure');
console.log('  ✅ Enhance service relationships');
console.log('  ✅ Create authorizations collection');
console.log('  ✅ Simplify actions to 4 core types');
console.log('');
console.log('='.repeat(70));
console.log('');

const startTime = Date.now();

for (let i = 0; i < migrations.length; i++) {
  const migration = migrations[i];
  console.log(`\n📦 Running migration ${i + 1}/${migrations.length}: ${migration}`);
  console.log('-'.repeat(70));
  
  try {
    execSync(`node scripts/migration-${migration}.js`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\n❌ Migration ${migration} failed!`);
    console.error('Stopping migration process.');
    process.exit(1);
  }
}

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

console.log('\n' + '='.repeat(70));
console.log('✨ ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
console.log('='.repeat(70));
console.log('');
console.log(`⏱️  Total time: ${duration}s`);
console.log('');
console.log('📊 Summary of changes:');
console.log('  ✅ Users separated from organizations (org_members junction)');
console.log('  ✅ Clients restructured with nested PHI (identity, contact, clinical)');
console.log('  ✅ Service relationships enhanced with flags and reasons');
console.log('  ✅ Authorizations collection created and populated');
console.log('  ✅ Actions simplified to 4 core types (v1.1 model)');
console.log('');
console.log('🎯 Your platform is now on v1.1 data architecture!');
console.log('');
console.log('Next steps:');
console.log('  1. Update API routes to use new org_members model');
console.log('  2. Update frontend to read nested client structure');
console.log('  3. Test authorization workflows');
console.log('  4. Update action UI to use simplified types');
console.log('');

