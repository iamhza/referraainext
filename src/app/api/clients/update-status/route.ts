import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { ClientStatus } from '@/types';

const COLLECTION = 'clients';

async function getSession() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function POST(req: Request) {
  // Use POST instead of PATCH to avoid potential issues with CORS or middleware
  const session = await getSession();
  if (!session || !['case_manager', 'admin'].includes(session.user.user_metadata?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clientId, status } = await req.json();
    
    console.log('Received update request:', { clientId, status });
    
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
      
      console.log(`Looking for client with ID: ${objectId}`);
      
      // First check if the client exists
      const clientExists = await db.collection(COLLECTION).findOne({ _id: objectId });
      
      if (!clientExists) {
        console.log('Client not found in database');
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      
      console.log('Client found, updating status...');
      
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

      console.log('Update result:', updateResult);

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