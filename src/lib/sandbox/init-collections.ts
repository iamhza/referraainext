/**
 * Initialize Sandbox MongoDB Collections and Indexes
 * 
 * Run this script to set up all required collections and indexes
 * for the sandbox system. Can be run safely multiple times (idempotent).
 * 
 * Usage:
 *   npx tsx src/lib/sandbox/init-collections.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import clientPromise from '@/lib/mongodb/client';
import { SANDBOX_INDEXES } from './schemas';

export async function initSandboxCollections() {
  try {
    console.log('🚀 Initializing sandbox collections...\n');
    
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // ========================================================================
    // 1. CREATE COLLECTIONS (if they don't exist)
    // ========================================================================
    
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);
    
    const requiredCollections = [
      'sandbox_organizations',
      'sandbox_tour_progress',
      'sandbox_challenges',
      'sandbox_analytics_events',
    ];
    
    for (const collectionName of requiredCollections) {
      if (!existingNames.includes(collectionName)) {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } else {
        console.log(`ℹ️  Collection already exists: ${collectionName}`);
      }
    }
    
    console.log('');
    
    // ========================================================================
    // 2. CREATE INDEXES
    // ========================================================================
    
    console.log('📇 Creating indexes...\n');
    
    for (const [collectionName, indexes] of Object.entries(SANDBOX_INDEXES)) {
      const collection = db.collection(collectionName);
      
      for (const indexSpec of indexes) {
        try {
          const indexName = await collection.createIndex(indexSpec.key, {
            unique: (indexSpec as any).unique || false,
            background: true, // Non-blocking index creation
          });
          console.log(`  ✅ ${collectionName}: Created index ${indexName}`);
        } catch (error: any) {
          // Index might already exist, that's okay
          if (error.code === 85 || error.code === 86) {
            console.log(`  ℹ️  ${collectionName}: Index already exists`);
          } else {
            console.error(`  ❌ ${collectionName}: Error creating index`, error.message);
          }
        }
      }
    }
    
    console.log('');
    
    // ========================================================================
    // 3. UPDATE EXISTING COLLECTIONS (organizations and users)
    // ========================================================================
    
    console.log('🔄 Updating existing collections with sandbox fields...\n');
    
    // Add sandbox fields to organizations (won't overwrite existing documents)
    const orgResult = await db.collection('organizations').updateMany(
      { isSandbox: { $exists: false } },
      { 
        $set: { 
          isSandbox: false 
        } 
      }
    );
    console.log(`  ✅ Updated ${orgResult.modifiedCount} organizations with isSandbox field`);
    
    // Add sandbox fields to users (won't overwrite existing documents)
    const userResult = await db.collection('users').updateMany(
      { 
        $or: [
          { tourCompleted: { $exists: false } },
          { lastTourStepCompleted: { $exists: false } }
        ]
      },
      { 
        $set: { 
          tourCompleted: false,
          lastTourStepCompleted: 0
        } 
      }
    );
    console.log(`  ✅ Updated ${userResult.modifiedCount} users with tour tracking fields`);
    
    console.log('');
    
    // ========================================================================
    // 4. CREATE INDEXES ON UPDATED COLLECTIONS
    // ========================================================================
    
    console.log('📇 Creating indexes on updated collections...\n');
    
    try {
      await db.collection('organizations').createIndex({ isSandbox: 1 }, { background: true });
      console.log('  ✅ organizations: Created isSandbox index');
    } catch (error: any) {
      if (error.code === 85 || error.code === 86) {
        console.log('  ℹ️  organizations: isSandbox index already exists');
      }
    }
    
    try {
      await db.collection('organizations').createIndex(
        { isSandbox: 1, sandboxTier: 1 },
        { background: true, sparse: true }
      );
      console.log('  ✅ organizations: Created composite sandbox index');
    } catch (error: any) {
      if (error.code === 85 || error.code === 86) {
        console.log('  ℹ️  organizations: Composite sandbox index already exists');
      }
    }
    
    try {
      await db.collection('users').createIndex({ sandboxOrgId: 1 }, { background: true, sparse: true });
      console.log('  ✅ users: Created sandboxOrgId index');
    } catch (error: any) {
      if (error.code === 85 || error.code === 86) {
        console.log('  ℹ️  users: sandboxOrgId index already exists');
      }
    }
    
    console.log('');
    
    // ========================================================================
    // 5. VERIFICATION
    // ========================================================================
    
    console.log('✅ Sandbox collections initialized successfully!\n');
    console.log('📊 Summary:');
    console.log(`  - Collections: ${requiredCollections.length}`);
    console.log(`  - Indexes: ${Object.values(SANDBOX_INDEXES).reduce((sum, arr) => sum + arr.length, 0)}`);
    console.log('');
    
    return {
      success: true,
      collections: requiredCollections,
    };
    
  } catch (error) {
    console.error('❌ Error initializing sandbox collections:', error);
    throw error;
  }
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (require.main === module) {
  initSandboxCollections()
    .then(() => {
      console.log('✨ All done! Sandbox system is ready to use.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Initialization failed:', error);
      process.exit(1);
    });
}

