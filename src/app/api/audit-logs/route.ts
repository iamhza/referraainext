import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAdminUser } from '@/lib/supabase';
import { AuditLog } from '@/types';

const COLLECTION = 'audit_logs';

/**
 * Fetches audit logs, accessible only by admins.
 * Supports pagination via query parameters.
 * @param request - The incoming Next.js request.
 */
export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db('referradb');
    
    const logs = await db.collection<AuditLog>(COLLECTION)
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