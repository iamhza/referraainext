/**
 * Organization audit logs API
 * Handles fetching and managing audit logs for organization activities
 */

import { NextRequest, NextResponse } from 'next/server';
import { withOrgAuth } from '@/lib/auth/api-auth';
import clientPromise from '@/lib/mongodb/client';

// GET /api/org/audit-logs - Fetch organization audit logs
export const GET = withOrgAuth(async (user, request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const userFilter = searchParams.get('user') || '';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const client = await clientPromise;
    const db = client.db('referradb');

    // Build query filter
    const query: any = {
      orgId: user.orgContext.orgId
    };

    // Add search filter
    if (search) {
      query.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } }
      ];
    }

    // Add action filter
    if (action && action !== 'all') {
      query.action = action;
    }

    // Add user role filter
    if (userFilter && userFilter !== 'all') {
      query.userRole = userFilter;
    }

    // Add date range filter
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    // Get total count
    const total = await db.collection('audit_logs').countDocuments(query);

    // Get paginated logs
    const logs = await db.collection('audit_logs')
      .find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Transform logs for frontend
    const transformedLogs = logs.map(log => ({
      id: log._id.toString(),
      timestamp: log.timestamp,
      userId: log.userId,
      userEmail: log.userEmail,
      userRole: log.userRole,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValues: log.oldValues,
      newValues: log.newValues,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      success: log.success,
      metadata: log.metadata
    }));

    return NextResponse.json({ 
      success: true,
      logs: transformedLogs,
      total,
      page,
      limit,
      hasMore: (page * limit) < total
    });

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' }, 
      { status: 500 }
    );
  }
});

// Export functionality is handled by /api/org/audit-logs/export/route.ts
