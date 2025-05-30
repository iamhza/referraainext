import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
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
  const session = await getSession();
  if (!session || !['case_manager', 'admin'].includes(session.user.user_metadata?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { clients } = await req.json();
    
    if (!Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json({ error: 'No clients provided for import' }, { status: 400 });
    }

    // Validate each client
    const validClients = clients.filter(client => {
      return (
        client.firstName && 
        client.lastName && 
        isValidStatus(client.status)
      );
    });

    if (validClients.length === 0) {
      return NextResponse.json({ error: 'No valid clients to import' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');
    const now = new Date().toISOString();
    
    // Prepare clients for insertion with timestamps and defaults
    const clientsToInsert = validClients.map(client => ({
      ...client,
      status: client.status || 'UNPLACED_NEW',
      createdAt: now,
      updatedAt: now
    }));
    
    // Insert clients in bulk
    const result = await db.collection(COLLECTION).insertMany(clientsToInsert);
    
    // Calculate status counts for reporting
    const statusCounts = {
      ACTIVE_STABLE: clientsToInsert.filter(c => c.status === 'ACTIVE_STABLE').length,
      ACTIVE_FRUSTRATED: clientsToInsert.filter(c => c.status === 'ACTIVE_FRUSTRATED').length,
      UNPLACED_NEW: clientsToInsert.filter(c => c.status === 'UNPLACED_NEW').length
    };

    return NextResponse.json({
      success: true,
      imported: result.insertedCount,
      statusCounts,
      insertedIds: result.insertedIds
    }, { status: 201 });
  } catch (error) {
    console.error('Error importing clients:', error);
    return NextResponse.json({ error: 'Failed to import clients' }, { status: 500 });
  }
}

// Helper function to validate status
function isValidStatus(status: any): boolean {
  const validStatuses: ClientStatus[] = ['ACTIVE_STABLE', 'ACTIVE_FRUSTRATED', 'UNPLACED_NEW'];
  return validStatuses.includes(status);
} 