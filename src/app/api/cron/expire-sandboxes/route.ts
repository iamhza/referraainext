/**
 * GET /api/cron/expire-sandboxes
 * 
 * Cron job that runs daily to expire sandboxes and send notifications.
 * 
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/expire-sandboxes",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 * 
 * Runs at midnight UTC every day.
 */

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { expireSandbox } from '@/lib/sandbox/sandbox-manager';

export const dynamic = 'force-dynamic';

// ============================================================================
// GET HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // ========================================================================
    // 1. VERIFY CRON SECRET (Security)
    // ========================================================================
    
    const authHeader = request.headers.get('authorization');
    
    // In production, verify this is from Vercel Cron
    if (process.env.NODE_ENV === 'production') {
      const cronSecret = process.env.CRON_SECRET;
      
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    console.log('🕐 Running sandbox expiration cron job...');
    
    // ========================================================================
    // 2. FIND EXPIRED SANDBOXES
    // ========================================================================
    
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const now = new Date();
    
    const expiredSandboxes = await db.collection('sandbox_organizations')
      .find({
        status: 'active',
        expiresAt: { $lte: now },
      })
      .toArray();
    
    console.log(`Found ${expiredSandboxes.length} expired sandboxes`);
    
    // ========================================================================
    // 3. EXPIRE EACH SANDBOX
    // ========================================================================
    
    const results = {
      total: expiredSandboxes.length,
      expired: 0,
      failed: 0,
      errors: [] as string[],
    };
    
    for (const sandbox of expiredSandboxes) {
      try {
        const success = await expireSandbox(sandbox._id.toString());
        
        if (success) {
          results.expired++;
          
          // TODO: Send expiration email
          console.log(`✅ Expired sandbox: ${sandbox._id}`);
        } else {
          results.failed++;
          results.errors.push(`Failed to expire ${sandbox._id}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Error expiring ${sandbox._id}: ${error.message}`);
        console.error(`❌ Error expiring sandbox ${sandbox._id}:`, error);
      }
    }
    
    // ========================================================================
    // 4. SEND EXPIRATION WARNING EMAILS (2 days before)
    // ========================================================================
    
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    
    const expiringSoon = await db.collection('sandbox_organizations')
      .find({
        status: 'active',
        expiresAt: {
          $gte: now,
          $lte: twoDaysFromNow,
        },
      })
      .toArray();
    
    console.log(`Found ${expiringSoon.length} sandboxes expiring soon`);
    
    // TODO: Send warning emails for expiring sandboxes
    
    // ========================================================================
    // 5. ARCHIVE OLD CONVERTED/EXPIRED SANDBOXES (90 days)
    // ========================================================================
    
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const archiveResult = await db.collection('sandbox_organizations').updateMany(
      {
        status: { $in: ['expired', 'converted'] },
        expiresAt: { $lte: ninetyDaysAgo },
      },
      {
        $set: {
          status: 'archived',
          updatedAt: now,
        },
      }
    );
    
    console.log(`Archived ${archiveResult.modifiedCount} old sandboxes`);
    
    // ========================================================================
    // 6. RETURN RESULTS
    // ========================================================================
    
    const summary = {
      timestamp: now.toISOString(),
      expired: results.expired,
      failed: results.failed,
      expiringSoon: expiringSoon.length,
      archived: archiveResult.modifiedCount,
      errors: results.errors,
    };
    
    console.log('✅ Cron job completed:', summary);
    
    return NextResponse.json({
      success: true,
      summary,
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Cron job failed' 
      },
      { status: 500 }
    );
  }
}

