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
    
    // Check for existing providers and prepare provider linking
    const providersCollection = db.collection('providers');
    const existingProviders = await providersCollection.find({}).toArray();
    
    // Prepare clients for insertion with enhanced fields
    const clientsToInsert = validClients.map(clientData => {
      // Try to link to existing provider
      let linkedProvider = null;
      if (clientData.currentProvider) {
        linkedProvider = existingProviders.find(provider => 
          provider.name?.toLowerCase().includes(clientData.currentProvider.toLowerCase()) ||
          provider.organizationName?.toLowerCase().includes(clientData.currentProvider.toLowerCase())
        );
      }

      return {
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        status: clientData.status || 'UNPLACED_NEW',
        phone: clientData.phone || null,
        email: clientData.email || null,
        address: clientData.address || null,
        city: clientData.city || null,
        state: clientData.state || null,
        zipCode: clientData.zipCode || null,
        county: clientData.county || null,
        notes: clientData.notes || null,
        
        // Provider information
        currentProvider: clientData.currentProvider || null,
        linkedProviderId: linkedProvider?._id || null,
        providerOnboarded: !!linkedProvider,
        
        // Profile completion tracking - comprehensive check for essential fields
        profileComplete: !!(
          clientData.firstName && 
          clientData.lastName &&
          clientData.phone && 
          clientData.email && 
          clientData.address && 
          clientData.city &&
          clientData.state &&
          clientData.county
        ),
        
        // Metadata
        createdAt: now,
        updatedAt: now,
        createdBy: session.user.id,
        
        // Legacy fields for backward compatibility
        providerName: clientData.currentProvider || clientData.providerName || null,
        placementDate: clientData.placementDate || null
      };
    });
    
    // Insert clients in bulk
    const result = await db.collection(COLLECTION).insertMany(clientsToInsert);
    
    // Calculate comprehensive statistics
    const stats = {
      imported: result.insertedCount,
      withProviders: clientsToInsert.filter(c => c.currentProvider).length,
      linkedProviders: clientsToInsert.filter(c => c.linkedProviderId).length,
      pendingProviders: clientsToInsert.filter(c => c.currentProvider && !c.linkedProviderId).length,
      profileComplete: clientsToInsert.filter(c => c.profileComplete).length,
      statusCounts: {
        ACTIVE_STABLE: clientsToInsert.filter(c => c.status === 'ACTIVE_STABLE').length,
        ACTIVE_FRUSTRATED: clientsToInsert.filter(c => c.status === 'ACTIVE_FRUSTRATED').length,
        UNPLACED_NEW: clientsToInsert.filter(c => c.status === 'UNPLACED_NEW').length
      }
    };

    return NextResponse.json({
      success: true,
      ...stats,
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