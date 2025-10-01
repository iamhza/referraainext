import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import { ObjectId } from 'mongodb';
import type { ClientStatus } from '@/types';

const COLLECTION = 'clients';



export async function PATCH(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clientId, status } = await req.json();
    
    // Validate required fields
    if (!clientId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate status value
    const validStatuses: ClientStatus[] = ['ACTIVE_STABLE', 'ACTIVE_FRUSTRATED', 'UNPLACED_NEW'];
    if (!validStatuses.includes(status as ClientStatus)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db('referradb');
    const now = new Date().toISOString();
    
    try {
      // Use ObjectId constructor to validate ID format first
      const objectId = new ObjectId(clientId);
      
      // First check if the client exists
      const clientExists = await db.collection(COLLECTION).findOne({ _id: objectId });
      
      if (!clientExists) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      
      // Update client status
      const updateResult = await db.collection(COLLECTION).updateOne(
        { _id: objectId },
        { 
          $set: { 
            status,
            updatedAt: now
          }
        }
      );

      if (updateResult.matchedCount === 0) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }

      // Fetch the updated client to return
      const updatedClient = await db.collection(COLLECTION).findOne({ _id: objectId });
      
      return NextResponse.json({ 
        success: true,
        client: updatedClient
      });
    } catch (idError) {
      console.error('Invalid client ID format:', idError);
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating client status:', error);
    return NextResponse.json({ error: 'Failed to update client status' }, { status: 500 });
  }
} 