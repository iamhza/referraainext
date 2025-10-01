import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get recent clients (last 10) with basic info
    const recentClients = await db.collection('clients')
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .project({
        createdAt: 1,
        updatedAt: 1,
        createdBy: 1,
        source: 1,
        caseManagerId: 1,
        currentProvider: 1,
        pmi: 1,
        serviceType: 1,
        serviceType1: 1,
        status: 1,
        // Don't show encrypted PHI
        encryptedPHI: 0
      })
      .toArray();

    return NextResponse.json({
      total: await db.collection('clients').countDocuments(),
      recent: recentClients.map(client => ({
        id: client._id.toString(),
        createdAt: client.createdAt,
        createdBy: client.createdBy,
        source: client.source || 'unknown',
        caseManagerId: client.caseManagerId,
        currentProvider: client.currentProvider,
        pmi: client.pmi,
        serviceType: client.serviceType,
        serviceType1: client.serviceType1,
        status: client.status,
        hasEncryptedData: !!client.encryptedPHI
      }))
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: 'Failed to fetch debug info' }, { status: 500 });
  }
}
