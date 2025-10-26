import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { AuditLogEntry } from '@/lib/audit/logger';

const COLLECTION = 'audit_logs';

// TODO: Implement admin auth check with NextAuth
// Legacy Supabase getAdminUser() removed - needs reimplementation

/**
 * Fetches audit logs, accessible only by admins.
 * Supports pagination via query parameters.
 * @param request - The incoming Next.js request.
 */
export async function GET(request: Request) {
  // TODO: Add admin authorization check
  // const user = await getAdminUser();
  // if (!user) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db('referradb');
    
    const logs = await db.collection<AuditLogEntry>(COLLECTION)
      .find({})
      .sort({ timestamp: -1 }) // Show most recent logs first
      .skip(skip)
      .limit(limit)
      .toArray();
      
    const totalLogs = await db.collection(COLLECTION).countDocuments();

    return NextResponse.json({
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalLogs / limit),
        totalLogs,
      },
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 