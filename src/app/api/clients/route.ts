import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import { getSecureClientsForCaseManager, getSecureClientsForProvider, createSecureClient } from '@/lib/secure-client';

const COLLECTION = 'clients';

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin', 'provider', 'supervisor', 'org_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db('referradb');
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const assignedToProvider = searchParams.get('assignedToProvider') === 'true';
  
  if (id) {
    try {
      console.log('📖 GET with ID param - Fetching client:', id);
      
      // Validate ObjectId format
      const objectId = new ObjectId(id);
      let query = { _id: objectId };
      
      // If provider is requesting and assignedToProvider is true, filter by current provider
      if (assignedToProvider && user.role === 'provider') {
        query = { 
          _id: objectId,
          currentProvider: user.id 
        } as any;
      }
      
      const clientDoc = await db.collection(COLLECTION).findOne(query);
      if (!clientDoc) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      
      // If provider is requesting and client has caseManagerId, populate case manager info
      if (assignedToProvider && user.role === 'provider' && clientDoc.caseManagerId) {
        const usersCollection = db.collection('users');
        const caseManager = await usersCollection.findOne({ _id: clientDoc.caseManagerId });
        
        if (caseManager) {
          clientDoc.caseManager = {
            id: caseManager._id,
            name: caseManager.name || caseManager.user_metadata?.name,
            email: caseManager.email
          };
        }
      }
      
      return NextResponse.json({ client: clientDoc });
    } catch (error) {
      console.error('Invalid client ID format:', error);
      return NextResponse.json({ error: 'Invalid client ID format' }, { status: 400 });
    }
  }
  
      // Build query for listing clients
    let query = {};
    
    // If provider is requesting and assignedToProvider is true, filter by current provider
    if (assignedToProvider && user.role === 'provider') {
      query = { currentProvider: user.id };
    }
    
          // Use secure client access for HIPAA compliance
      let secureClients = []; // Initialize to empty array for security
      
      if (user.role === 'case_manager') {
        secureClients = await getSecureClientsForCaseManager(
          user.id,
          user.id,
          user.role
        );
      } else if (user.role === 'provider') {
        // CRITICAL: Providers should ALWAYS get filtered results, regardless of assignedToProvider parameter
        secureClients = await getSecureClientsForProvider(
          user.id,
          user.id,
          user.role
        );
        console.log(`🔒 Provider ${user.id} filtered clients:`, secureClients.length);
      } else if (user.role === 'supervisor' || user.role === 'org_admin') {
        // For org roles, get all clients in their organization
        const orgQuery = { org_id: user.org_id };
        const clients = await db.collection(COLLECTION).find(orgQuery).sort({ createdAt: -1 }).toArray();
        
        console.log(`🏢 Org admin/supervisor ${user.id} fetching clients for org ${user.org_id}`);
        console.log(`📋 Found ${clients.length} clients in organization`);
        
        // Manually decrypt each client for org admin/supervisor
        secureClients = [];
        for (const client of clients) {
          try {
            if (client.encryptedPHI) {
              // Get decrypted version by calling the secure client function for each client's case manager
              const caseManagerClients = await getSecureClientsForCaseManager(
                client.caseManagerId, 
                user.id, 
                user.role
              );
              const decryptedClient = caseManagerClients.find(c => c._id.toString() === client._id.toString());
              if (decryptedClient) {
                secureClients.push(decryptedClient);
              } else {
                // Client exists but couldn't be decrypted, add with placeholder data
                secureClients.push({
                  ...client,
                  firstName: 'Encrypted',
                  lastName: 'Client',
                  email: 'encrypted@example.com',
                  name: 'Encrypted Client'
                });
              }
            } else {
              // Client is not encrypted, add as-is
              secureClients.push(client);
            }
          } catch (error) {
            console.error(`Failed to decrypt client ${client._id}:`, error);
            // Add client with placeholder data on error
            secureClients.push({
              ...client,
              firstName: 'Encrypted',
              lastName: 'Client', 
              email: 'encrypted@example.com',
              name: 'Encrypted Client'
            });
          }
        }
        console.log(`🔓 Processed ${secureClients.length} clients for org admin`);
      } else if (user.role === 'platform_admin') {
        // For platform admin, get all clients
        const clients = await db.collection(COLLECTION).find(query).sort({ createdAt: -1 }).toArray();
        secureClients = []; // Need to create admin-specific secure client function
        // For now, return empty array for admin to prevent PHI exposure
      } else {
        // Unknown role - return empty for security
        console.warn(`⚠️ Unknown role attempting to access clients: ${user.role}`);
        secureClients = [];
      }
      
      return NextResponse.json({ clients: secureClients || [] });
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin', 'provider', 'supervisor', 'org_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const data = await req.json();
  console.log('🆕 POST - Creating NEW client:', {
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    source: data.source || 'manual_create',
    userRole: user.role,
    userId: user.id,
    willSetCaseManagerId: user.role === 'case_manager'
  });
  if (!data.firstName || !data.lastName || !data.dateOfBirth) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Calculate profile completion
  const profileComplete = !!(
    data.firstName && 
    data.lastName &&
    data.phone && 
    data.email && 
    data.address && 
    data.city &&
    data.state &&
    data.county
  );

  // Determine role-specific field assignments
  const userRole = user.role;
  const clientData = {
    ...data,
    profileComplete,
    source: 'manual_create',
    // Add organizational context
    org_id: user.org_id, // Connect client to organization
    created_by: user.id,
    created_by_role: user.role
  };

  // Set role-specific fields
  if (userRole === 'provider') {
    clientData.currentProvider = user.id;
    clientData.linkedProviderId = user.id;
    clientData.providerOnboarded = true;
  } else if (userRole === 'case_manager') {
    // Case manager creates client for themselves
    clientData.caseManagerId = user.id;
    
    // For case managers doing connection discovery, preserve provider fields if provided
    // BUT don't set currentProvider (which would trigger false connections)
    if (data.providerContactEmail) {
      clientData.providerContactEmail = data.providerContactEmail;
    }
    // Store provider org name separately for discovery (not in currentProvider field)
    if (data.currentProvider) {
      clientData.providerOrgName = data.currentProvider; // Different field name
    }
  } else if (userRole === 'supervisor' || userRole === 'org_admin') {
    // Supervisors/org admins can create unassigned clients or assign to specific case managers
    if (data.assignedCaseManagerId) {
      clientData.caseManagerId = data.assignedCaseManagerId;
    }
    // Store who created/assigned the client
    clientData.assignedBy = user.id;
    clientData.assignedAt = new Date().toISOString();
  } else {
    // Admin or other roles - generic assignment
    clientData.caseManagerId = user.id;
  }

  // Filter clientData to only include fields expected by createSecureClient
  // Provide defaults for required fields that might be missing
  const secureClientData = {
    firstName: clientData.firstName,
    lastName: clientData.lastName,
    dateOfBirth: clientData.dateOfBirth,
    email: clientData.email || '',
    phone: clientData.phone || '', // Provide empty string default for phone
    address: clientData.address || '',
    city: clientData.city || '',
    state: clientData.state || '',
    zipCode: clientData.zipCode || '',
    county: clientData.county || '',
    sex: clientData.sex,
    preferredContactMethod: clientData.preferredContactMethod || 'email',
    insuranceProvider: clientData.insuranceProvider,
    insuranceNumber: clientData.insuranceNumber,
    pmiNumber: clientData.pmiNumber,
    waiverType: clientData.waiverType,
    serviceTypes: clientData.serviceTypes || [],
    primaryLanguage: clientData.primaryLanguage,
    needsTranslator: clientData.needsTranslator || false,
    historyOfViolence: clientData.historyOfViolence || false,
    mobilityStatus: clientData.mobilityStatus,
    livingSituation: clientData.livingSituation,
    primaryDiagnosis: clientData.primaryDiagnosis,
    culturalConsiderations: clientData.culturalConsiderations,
    additionalNotes: clientData.additionalNotes,
    status: clientData.status || 'UNPLACED_NEW',
    caseManagerId: clientData.caseManagerId,
    caseManager: clientData.caseManager,
    source: clientData.source || 'connection_check',
    org_id: user.org_id // ✅ CRITICAL: Ensure org_id is always set from authenticated user
  };

  // Use secure client creation with HIPAA compliance
  console.log('🔐 Creating secure client with data:', {
    ...secureClientData,
    // Don't log PHI, just structure
    firstName: '[REDACTED]',
    lastName: '[REDACTED]',
    email: '[REDACTED]',
    phone: '[REDACTED]'
  });
  
  const result = await createSecureClient(secureClientData, user.id, userRole);
  console.log('🔐 Secure client creation result:', result);

  if (!result.success) {
    console.error('❌ Secure client creation failed:', result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Add non-PHI fields to the client record (like provider info for connection discovery)
  const client = await clientPromise;
  const db = client.db('referradb');
  
  const additionalFields: any = {};
  
  // For providers, set actual provider fields
  if (userRole === 'provider') {
    if (clientData.currentProvider) additionalFields.currentProvider = clientData.currentProvider;
    if (clientData.linkedProviderId) additionalFields.linkedProviderId = clientData.linkedProviderId;
    if (clientData.providerOnboarded) additionalFields.providerOnboarded = clientData.providerOnboarded;
  }
  
  // For connection discovery info (don't set currentProvider for case managers)
  if (clientData.providerContactEmail) additionalFields.providerContactEmail = clientData.providerContactEmail;
  if (clientData.providerOrgName) additionalFields.providerOrgName = clientData.providerOrgName;
  if (clientData.caseManagerName) additionalFields.caseManagerName = clientData.caseManagerName;
  if (clientData.caseManagerEmail) additionalFields.caseManagerEmail = clientData.caseManagerEmail;
  if (clientData.profileComplete !== undefined) additionalFields.profileComplete = clientData.profileComplete;
  
  // NEW: Store service information for ServiceConnection system
  if (clientData.pmiNumber) additionalFields.pmi = clientData.pmiNumber; // Map pmiNumber to pmi for display
  if (clientData.pmi) additionalFields.pmi = clientData.pmi; // Legacy field support
  if (clientData.serviceType) additionalFields.serviceType = clientData.serviceType;
  if (clientData.serviceType1) additionalFields.serviceType1 = clientData.serviceType1;

  // Update the client with additional fields if any exist
  if (Object.keys(additionalFields).length > 0) {
    await db.collection('clients').updateOne(
      { _id: result.clientId },
      { 
        $set: {
          ...additionalFields,
          updatedAt: new Date()
        }
      }
    );
  }

  return NextResponse.json({ 
    client: { 
      _id: result.clientId, 
      ...clientData,
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    } 
  }, { status: 201 });
}

export async function PATCH(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin', 'provider'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, ...update } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing client id' }, { status: 400 });
  const client = await clientPromise;
  const db = client.db('referradb');
  update.updatedAt = new Date().toISOString();
  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: 'after' }
  );
  if (!result || !result.value) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  return NextResponse.json({ client: result.value });
}

// DELETE method removed - use /api/clients/[id] for individual deletes and /api/clients/bulk-delete for bulk deletes 