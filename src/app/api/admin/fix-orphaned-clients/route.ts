import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

import { getAuthenticatedUser } from '@/lib/nextauth-helpers';


export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
  if (!user || user.role !== 'platform_admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { targetCaseManagerId } = await req.json();
    
    if (!targetCaseManagerId) {
      return NextResponse.json({ error: 'Target case manager ID required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Find orphaned clients (no caseManagerId assigned)
    const orphanedClients = await db.collection('clients').find({
      $or: [
        { caseManagerId: { $exists: false } },
        { caseManagerId: null },
        { caseManagerId: '' }
      ]
    }).toArray();

    console.log(`Found ${orphanedClients.length} orphaned clients`);

    // Assign them to the specified case manager
    const result = await db.collection('clients').updateMany(
      {
        $or: [
          { caseManagerId: { $exists: false } },
          { caseManagerId: null },
          { caseManagerId: '' }
        ]
      },
      {
        $set: {
          caseManagerId: targetCaseManagerId,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Fixed ${result.modifiedCount} orphaned clients`,
      orphanedCount: orphanedClients.length,
      fixedCount: result.modifiedCount,
      targetCaseManager: targetCaseManagerId
    });

  } catch (error: any) {
    console.error('Error fixing orphaned clients:', error);
    return NextResponse.json({ error: 'Failed to fix orphaned clients' }, { status: 500 });
  }
}
