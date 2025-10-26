/**
 * POST /api/sandbox/analytics
 * 
 * Logs analytics events for sandbox users.
 * Called automatically by useSandbox hook and manually for important events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-minimal';
import { trackEvent } from '@/lib/analytics/sandbox-tracker';
import { z } from 'zod';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const trackEventSchema = z.object({
  sandboxOrgId: z.string(),
  eventType: z.string(),
  eventData: z.record(z.any()).optional(),
});

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // 1. AUTHENTICATION CHECK
    // ========================================================================
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // ========================================================================
    // 2. VALIDATE REQUEST
    // ========================================================================
    
    const body = await request.json();
    const validation = trackEventSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const { sandboxOrgId, eventType, eventData } = validation.data;
    
    // ========================================================================
    // 3. TRACK EVENT
    // ========================================================================
    
    await trackEvent({
      userId: session.user.id,
      sandboxOrgId,
      eventType,
      eventData,
      userAgent: request.headers.get('user-agent') || undefined,
    });
    
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Silent fail - don't break user experience
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

