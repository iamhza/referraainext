import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

import { getAuthenticatedUser } from '@/lib/nextauth-helpers';


export async function DELETE(request: Request) {
  try {
    const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin'].includes(user.role || session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Delete test clients
    const clientResult = await db.collection('clients').deleteMany({
      firstName: 'John',
      lastName: 'TestConnection'
    });

    // Delete related referrals
    const referralResult = await db.collection('referrals').deleteMany({
      'clientInfo.firstName': 'John',
      'clientInfo.lastName': 'TestConnection'
    });

    return NextResponse.json({
      success: true,
      message: 'Test clients and referrals cleaned up',
      deletedClients: clientResult.deletedCount,
      deletedReferrals: referralResult.deletedCount
    });

  } catch (error: any) {
    console.error('Error cleaning up test clients:', error);
    return NextResponse.json({ error: 'Failed to cleanup test clients' }, { status: 500 });
  }
}
