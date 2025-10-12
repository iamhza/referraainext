import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Find the user by email (miknabil@yahoo.com)
    const user = await db.collection('users').findOne({ 
      email: 'miknabil@yahoo.com' 
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Case manager user not found' },
        { status: 404 }
      );
    }

    const caseManagerId = user._id.toString();
    console.log(`Clearing data for case manager ID: ${caseManagerId}`);

    // Clear existing mock data for this case manager
    const clientsResult = await db.collection('clients').deleteMany({ 
      caseManagerId: caseManagerId 
    });
    
    const referralsResult = await db.collection('referrals').deleteMany({ 
      caseManagerId: caseManagerId 
    });
    
    const connectionsResult = await db.collection('connections').deleteMany({ 
      // Connections might not have caseManagerId, so we'll clear all for safety
      // In production, you'd want more specific filtering
    });

    return NextResponse.json({
      success: true,
      message: `Cleared ${clientsResult.deletedCount} clients, ${referralsResult.deletedCount} referrals, and ${connectionsResult.deletedCount} connections`,
      deletedCounts: {
        clients: clientsResult.deletedCount,
        referrals: referralsResult.deletedCount,
        connections: connectionsResult.deletedCount
      },
      caseManagerId
    });

  } catch (error) {
    console.error('Error clearing mock data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear mock data' },
      { status: 500 }
    );
  }
}





