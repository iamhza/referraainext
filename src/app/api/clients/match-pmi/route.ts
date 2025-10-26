import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { createAuditLog } from '@/lib/audit/hipaa';

/**
 * PMI-Based Client Matching for ServiceConnection
 * 
 * This endpoint finds clients with matching PMI (Personal Medical Identifier)
 * and optional service type filtering for connection discovery.
 * 
 * Flow:
 * 1. Validate PMI format (9 digits)
 * 2. Find clients by PMI
 * 3. Filter by role-based access control
 * 4. Return match confidence and connection opportunities
 */
export async function GET(request: Request) {
  try {
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

    const { data: { session } } = await supabase.auth.getAuthenticatedUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const pmi = url.searchParams.get('pmi');
    const serviceType = url.searchParams.get('serviceType');
    const userRole = user.role;

    // PMI Validation
    if (!pmi || !/^\d{9}$/.test(pmi)) {
      return NextResponse.json({
        error: 'Invalid PMI format. PMI must be exactly 9 digits.',
        matches: [],
        total: 0
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    console.log(`🔍 PMI Search: ${pmi}, Service: ${serviceType}, Role: ${userRole}`);

    // Find clients by PMI - exact match only
    const pmiMatches = await db.collection('clients').find({
      pmi: pmi
    }).toArray();

    console.log(`📊 Found ${pmiMatches.length} clients with PMI ${pmi}`);

    // Role-based filtering and connection opportunities
    let accessibleClients: any[] = [];
    
    if (userRole === 'case_manager') {
      // Case managers can see:
      // 1. Their own clients (for verification)
      // 2. Clients with providers that have this PMI (potential connections)
      accessibleClients = pmiMatches.filter(client => {
        // Their own clients
        if (client.caseManagerId === user.id) return true;
        
        // Clients with providers that could be connected
        if (client.currentProvider || client.providerOrgName) return true;
        
        return false;
      });
    } else if (userRole === 'provider') {
      // Providers can see:
      // 1. Their own clients (for verification)  
      // 2. Clients with case managers that have this PMI (potential connections)
      accessibleClients = pmiMatches.filter(client => {
        // Their own clients
        if (client.currentProvider === user.id) return true;
        
        // Clients with case managers that could be connected
        if (client.caseManagerId) return true;
        
        return false;
      });
    }

    // Service type filtering (if provided)
    if (serviceType && serviceType.trim()) {
      accessibleClients = accessibleClients.filter(client => {
        return client.serviceType === serviceType || 
               client.serviceType1 === serviceType ||
               client.serviceType2 === serviceType ||
               client.serviceType3 === serviceType;
      });
    }

    // Generate connection opportunities
    const connectionOpportunities = accessibleClients.map(client => {
      const isOwnClient = (userRole === 'case_manager' && client.caseManagerId === user.id) ||
                         (userRole === 'provider' && client.currentProvider === user.id);
      
      return {
        clientId: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        dateOfBirth: client.dateOfBirth,
        pmi: client.pmi,
        serviceType: client.serviceType || client.serviceType1,
        isOwnClient,
        matchConfidence: 'high', // PMI is exact match
        connectionType: isOwnClient ? 'verification' : 'potential_connection',
        
        // Connection partner info
        caseManagerId: client.caseManagerId,
        providerId: client.currentProvider,
        providerName: client.providerOrgName || client.currentProvider,
        providerEmail: client.providerContactEmail,
      };
    });

    // Audit log
    await createAuditLog({
      userId: user.id,
      userRole: user.role,
      action: 'pmi_search',
      resourceType: 'client_search',
      resourceId: `pmi_${pmi}`,
      success: accessibleClients.length > 0,
      details: {
        pmi,
        serviceType,
        matchesFound: accessibleClients.length
      }
    });

    const response = {
      matches: connectionOpportunities,
      total: connectionOpportunities.length,
      message: connectionOpportunities.length > 0 
        ? `Found ${connectionOpportunities.length} potential connection(s) with PMI ${pmi}`
        : `No accessible clients found with PMI ${pmi}`,
      searchCriteria: {
        pmi,
        serviceType,
        userRole
      }
    };

    console.log(`✅ PMI search complete:`, response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ PMI match error:', error);
    
    // Audit log the error
    try {
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
      const { data: { session } } = await supabase.auth.getAuthenticatedUser();
      
      if (session) {
        await createAuditLog({
          userId: user.id,
          userRole: user.role,
          action: 'pmi_search_error',
          resourceType: 'client_search',
          resourceId: 'error',
          success: false,
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    } catch (auditError) {
      console.error('Failed to log audit error:', auditError);
    }

    return NextResponse.json({
      error: 'Internal server error during PMI matching',
      matches: [],
      total: 0
    }, { status: 500 });
  }
}
