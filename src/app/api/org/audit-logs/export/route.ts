/**
 * Organization audit logs export API
 * Handles exporting audit logs as CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { withOrgAuth } from '@/lib/auth/api-auth';
import clientPromise from '@/lib/mongodb/client';

// GET /api/org/audit-logs/export - Export audit logs as CSV
export const GET = withOrgAuth(async (user, request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const userFilter = searchParams.get('user') || '';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const format = searchParams.get('format') || 'csv';

    const client = await clientPromise;
    const db = client.db('referradb');

    // Build query filter
    const query: any = {
      orgId: user.orgContext.orgId
    };

    if (search) {
      query.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { entityType: { $regex: search, $options: 'i' } }
      ];
    }

    if (action && action !== 'all') {
      query.action = action;
    }

    if (userFilter && userFilter !== 'all') {
      query.userRole = userFilter;
    }

    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    // Get all matching logs (limit to 10000 for performance)
    const logs = await db.collection('audit_logs')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(10000)
      .toArray();

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = [
        'Timestamp',
        'User Email',
        'User Role', 
        'Action',
        'Entity Type',
        'Entity ID',
        'Success',
        'IP Address',
        'User Agent'
      ];

      const csvRows = logs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.userEmail || '',
        log.userRole || '',
        log.action || '',
        log.entityType || '',
        log.entityId || '',
        log.success ? 'Success' : 'Failed',
        log.ipAddress || '',
        log.userAgent || ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json(
      { error: 'Unsupported format' }, 
      { status: 400 }
    );

  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' }, 
      { status: 500 }
    );
  }
});
