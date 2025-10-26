import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import type { ClientStatus } from '@/types';

const COLLECTION = 'clients';



export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin', 'provider'].includes(user.role)) {
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
    // First check MongoDB (legacy)
    const providersCollection = db.collection('providers');
    const mongoProviders = await providersCollection.find({}).toArray();
    
    // Then check Supabase provider_profiles table (current system)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined; }
        }
      }
    );
    
    const { data: supabaseProviders } = await supabase
      .from('provider_profiles')
      .select('user_id, full_name, organization_name, email');
    
    // Combine both sources
    const existingProviders = [
      ...mongoProviders,
      ...(supabaseProviders?.map(p => ({
        _id: p.user_id,
        name: p.full_name,
        organizationName: p.organization_name,
        email: p.email
      })) || [])
    ];
    
    // Prepare clients for insertion with enhanced fields
    const clientsToInsert = validClients.map(clientData => {
      // For providers, automatically assign to current provider
      let currentProvider = clientData.currentProvider || clientData['Current Provider Name'];
      let linkedProvider = null;
      
      if (user.role === 'provider') {
        // When provider is importing, automatically assign to themselves
        currentProvider = user.id;
        linkedProvider = { _id: user.id }; // Provider is already onboarded
      }
      // For case managers, don't try to link providers - this causes false connections

      return {
        firstName: clientData.firstName || clientData['First Name'],
        lastName: clientData.lastName || clientData['Last Name'],
        dateOfBirth: clientData.dateOfBirth || clientData['Date of Birth'] || null,
        status: clientData.status || 'UNPLACED_NEW',
        phone: clientData.phone || clientData['Phone'] || null,
        email: clientData.email || clientData['Email'] || null,
        address: clientData.address || clientData['Address'] || null,
        city: clientData.city || null,
        state: clientData.state || null,
        zipCode: clientData.zipCode || null,
        county: clientData.county || clientData['County'] || null,
        notes: clientData.notes || clientData['Notes'] || null,
        
        // Provider information - only set for providers
        currentProvider: user.role === 'provider' ? (linkedProvider?._id || currentProvider) : null,
        linkedProviderId: user.role === 'provider' ? (linkedProvider?._id || null) : null,
        providerOnboarded: user.role === 'provider' ? !!linkedProvider : false,
        
        // Store provider org name for case managers (for display/contact purposes only)
        providerOrgName: user.role === 'case_manager' ? currentProvider : null,
        
        // Connection partner information for matching
        caseManagerEmail: clientData.caseManagerEmail || clientData['Case Manager Email'] || null,
        caseManagerName: clientData.caseManagerName || clientData['Case Manager Name'] || null,
        providerContactEmail: clientData.providerContactEmail || clientData['Provider Contact Email'] || null,
        providerName: clientData.providerName || clientData['Current Provider Name'] || currentProvider,
        
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
        
        // Role-specific assignment
        caseManagerId: user.role === 'case_manager' ? user.id : null,
        
        // NEW: ServiceConnection fields
        pmi: clientData.pmi || null,
        serviceType: clientData.serviceType || null,
        serviceType1: clientData.serviceType1 || null,
        
        // Pending connection fields for ServiceConnection flow
        hasPendingConnection: clientData.hasPendingConnection || false,
        pendingConnectionId: clientData.pendingConnectionId || null,
        
        // Metadata
        createdAt: now,
        updatedAt: now,
        createdBy: user.id,
        source: 'csv_import',
        
        // Legacy fields for backward compatibility
        placementDate: clientData.placementDate || null
      };
    });
    
    // Debug logging for provider client creation
    console.log('📝 Creating clients for role:', user.role);
    console.log('📝 Clients to insert:', clientsToInsert.map(c => ({
      firstName: c.firstName,
      lastName: c.lastName, 
      currentProvider: c.currentProvider,
      createdBy: c.createdBy,
      source: c.source
    })));
    
    // Insert clients in bulk
    const result = await db.collection(COLLECTION).insertMany(clientsToInsert);
    
    console.log('✅ Clients inserted:', result.insertedCount, 'IDs:', Object.values(result.insertedIds));
    
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