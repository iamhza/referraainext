import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { encryptMessage as encryptPHI, decryptMessage as decryptPHI, EncryptedData } from './encryption';
import { createAuditLog } from './hipaa-audit';
import { getAuthenticatedUser } from './nextauth-helpers';

const CLIENTS_COLLECTION = 'clients';
const CLIENT_RETENTION_YEARS = 7; // HIPAA requirement for client data retention

// PHI fields that need encryption
const PHI_FIELDS = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'email', 
  'phone',
  'address',
  'city',
  'state',
  'zipCode',
  'county',
  'insuranceProvider',
  'insuranceNumber',
  'pmiNumber',
  'waiverType',
  'primaryLanguage',
  'primaryDiagnosis',
  'culturalConsiderations',
  'additionalNotes'
];

interface SecureClient {
  _id?: ObjectId;
  // Encrypted PHI fields
  encryptedPHI: {
    [key: string]: EncryptedData;
  };
  // Non-PHI fields (remain unencrypted for performance)
  sex?: string;
  preferredContactMethod?: string;
  needsTranslator?: boolean;
  historyOfViolence?: boolean;
  mobilityStatus?: string;
  livingSituation?: string;
  status?: string;
  profileComplete?: boolean;
  serviceTypes?: string[]; // Array of service types for the client
  currentProvider?: string;
  linkedProviderId?: string;
  providerOnboarded?: boolean;
  providerInfo?: any;
  tasks?: any[];
  createdAt: Date;
  updatedAt: Date;
  caseManagerId?: string;
  caseManager?: any;
  source?: string;
  referralDate?: string;
  retentionDate: Date; // Date after which this client record can be purged
  createdBy?: string; // Who created this client
  orgId?: string; // Organization ID for multi-tenant isolation
}

interface CreateClientParams {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  sex?: string;
  preferredContactMethod?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  pmiNumber?: string;
  waiverType?: string;
  primaryLanguage?: string;
  needsTranslator?: boolean;
  historyOfViolence?: boolean;
  mobilityStatus?: string;
  livingSituation?: string;
  primaryDiagnosis?: string;
  culturalConsiderations?: string;
  additionalNotes?: string;
  status?: string;
  caseManagerId?: string;
  caseManager?: any;
  source?: string;
}

export async function createSecureClient(params: CreateClientParams, accessorId: string, accessorRole: string) {
  try {
    console.log('🔐 createSecureClient called with accessorId:', accessorId, 'role:', accessorRole);
    
    const client = await clientPromise;
    const db = client.db('referradb');
    console.log('🔐 Database connection established');

    const now = new Date();
    const retentionDate = new Date();
    retentionDate.setFullYear(now.getFullYear() + CLIENT_RETENTION_YEARS);

    // Encrypt all PHI fields
    console.log('🔐 Starting PHI encryption...');
    const encryptedPHI: { [key: string]: EncryptedData } = {};
    for (const field of PHI_FIELDS) {
      const value = (params as any)[field];
      if (value && typeof value === 'string' && value.trim().length > 0) {
        try {
          encryptedPHI[field] = encryptPHI(value);
          console.log(`🔐 Encrypted field: ${field}`);
        } catch (encryptError: unknown) {
          console.error(`❌ Failed to encrypt field ${field}:`, encryptError);
          throw new Error(`Encryption failed for field ${field}: ${encryptError instanceof Error ? encryptError.message : 'Unknown error'}`);
        }
      }
    }
    console.log('🔐 PHI encryption completed');

    const secureClient: SecureClient = {
      encryptedPHI,
      // Non-PHI fields
      sex: params.sex,
      preferredContactMethod: params.preferredContactMethod || 'email',
      needsTranslator: params.needsTranslator || false,
      historyOfViolence: params.historyOfViolence || false,
      mobilityStatus: params.mobilityStatus,
      livingSituation: params.livingSituation,
      status: params.status || 'UNPLACED_NEW',
      profileComplete: false,
      caseManagerId: params.caseManagerId,
      caseManager: params.caseManager,
      source: params.source || 'secure_create',
      serviceTypes: (params as any).serviceTypes || [],
      createdAt: now,
      updatedAt: now,
      retentionDate,
      // Set the creator of the client
      createdBy: accessorId,
      // Add organization context if available
      orgId: (params as any).org_id || undefined
    };

    // Add provider-specific fields if the accessor is a provider
    if (accessorRole === 'provider') {
      secureClient.currentProvider = accessorId;
      secureClient.linkedProviderId = accessorId;
      secureClient.providerOnboarded = true;
    }

    console.log('🔐 Inserting client into database...');
    const result = await db.collection(CLIENTS_COLLECTION).insertOne(secureClient);
    console.log('🔐 Client inserted with ID:', result.insertedId);

    // Audit log the client creation
    console.log('🔐 Creating audit log...');
    try {
      await createAuditLog({
        userId: accessorId,
        userRole: accessorRole,
        action: 'client_created',
        resourceType: 'client',
        resourceId: result.insertedId.toString(),
        success: true,
        details: { source: params.source }
      });
      console.log('🔐 Audit log created successfully');
    } catch (auditError) {
      console.error('❌ Audit log creation failed:', auditError);
      // Don't fail the whole operation for audit log issues
    }

    return { success: true, clientId: result.insertedId };
  } catch (error) {
    console.error('Error creating secure client:', error);
    return { success: false, error: 'Failed to create secure client' };
  }
}

export async function getSecureClient(clientId: string, accessorId: string, accessorRole: string) {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    const secureClient = await db.collection(CLIENTS_COLLECTION)
      .findOne({ _id: new ObjectId(clientId) });

    if (!secureClient) {
      return null;
    }

    // Audit log the client access
    await createAuditLog({
      userId: accessorId,
      userRole: accessorRole,
      action: 'client_accessed',
      resourceType: 'client',
      resourceId: clientId,
      success: true,
      details: { accessType: 'view' }
    });

    // Decrypt PHI fields
    const decryptedClient: any = {
      ...secureClient,
      _id: secureClient._id.toString(),
    };

    // Decrypt all PHI fields
    if (secureClient.encryptedPHI) {
      for (const [field, encryptedData] of Object.entries(secureClient.encryptedPHI)) {
        try {
          // Handle both encrypted messages and simple base64 encoded data
          if (typeof encryptedData === 'string') {
            // Simple base64 decode for migrated data
            decryptedClient[field] = Buffer.from(encryptedData, 'base64').toString('utf8');
          } else if (encryptedData && typeof encryptedData === 'object' && 'encryptedContent' in encryptedData) {
            // Try normal decryption first
            try {
              decryptedClient[field] = decryptPHI(encryptedData as EncryptedData);
            } catch {
              // Fallback to base64 decode
              decryptedClient[field] = Buffer.from((encryptedData as any).encryptedContent, 'base64').toString('utf8');
            }
          } else {
            decryptedClient[field] = '[Invalid encryption format]';
          }
        } catch (decryptError: unknown) {
          console.error(`Error decrypting field ${field} for client ${clientId}:`, decryptError);
          decryptedClient[field] = '[Encrypted data unreadable]';
        }
      }
    }

    // Remove the encrypted PHI from the response
    delete decryptedClient.encryptedPHI;

    return decryptedClient;
  } catch (error) {
    console.error('Error fetching secure client:', error);
    return null;
  }
}

export async function updateSecureClient(clientId: string, updates: Partial<CreateClientParams>, accessorId: string, accessorRole: string) {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    const now = new Date();
    
    // Prepare update object
    const updateDoc: any = {
      updatedAt: now
    };

    // Encrypt any PHI fields that are being updated
    const encryptedPHIUpdates: { [key: string]: EncryptedData } = {};
    console.log('🔐 Processing PHI field updates:', Object.keys(updates));
    
    for (const field of PHI_FIELDS) {
      const value = (updates as any)[field];
      if (value !== undefined) {
        console.log(`🔐 Processing field "${field}":`, { value, type: typeof value });
        
        if (value && typeof value === 'string' && value.trim().length > 0) {
          const encrypted = encryptPHI(value);
          encryptedPHIUpdates[`encryptedPHI.${field}`] = encrypted;
          console.log(`✅ Encrypted field "${field}" for update`);
        } else {
          // If the value is empty/null, remove the field
          updateDoc[`$unset`] = updateDoc[`$unset`] || {};
          updateDoc[`$unset`][`encryptedPHI.${field}`] = '';
          console.log(`🗑️ Unsetting field "${field}"`);
        }
      }
    }

    // Add encrypted PHI updates to the update document
    Object.assign(updateDoc, encryptedPHIUpdates);

    // Add non-PHI field updates
    const nonPHIFields = ['sex', 'preferredContactMethod', 'needsTranslator', 'historyOfViolence', 
                          'mobilityStatus', 'livingSituation', 'status', 'profileComplete', 'serviceTypes'];
    for (const field of nonPHIFields) {
      const value = (updates as any)[field];
      if (value !== undefined) {
        updateDoc[field] = value;
      }
    }

    // Auto-assign case manager if missing and user is case manager
    if (accessorRole === 'case_manager') {
      updateDoc.caseManagerId = accessorId;
      console.log('🔧 Auto-assigning case manager:', accessorId);
    }

    // Build the update operation properly
    const updateOperation: any = {};
    
    // Separate $set and $unset operations
    const { $unset, ...setFields } = updateDoc;
    
    if (Object.keys(setFields).length > 0) {
      updateOperation.$set = setFields;
    }
    
    if ($unset && Object.keys($unset).length > 0) {
      updateOperation.$unset = $unset;
    }

    console.log('🔄 MongoDB updateOne operation:', {
      clientId,
      updateOperation,
      operationKeys: Object.keys(updateOperation)
    });

    const result = await db.collection(CLIENTS_COLLECTION).updateOne(
      { _id: new ObjectId(clientId) },
      updateOperation
    );

    console.log('📊 MongoDB updateOne result:', {
      clientId,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      acknowledged: result.acknowledged
    });

    if (result.matchedCount === 0) {
      console.error('❌ No client matched for update:', clientId);
      return { success: false, error: 'Client not found' };
    }
    
    if (result.modifiedCount === 0) {
      console.warn('⚠️ Client found but no changes made:', clientId);
      // This might be okay if the values are the same
    }

    // Audit log the client update
    await createAuditLog({
      userId: accessorId,
      userRole: accessorRole,
      action: 'client_updated',
      resourceType: 'client',
      resourceId: clientId,
      success: true,
      details: { fieldsUpdated: Object.keys(updates) }
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating secure client:', error);
    return { success: false, error: 'Failed to update secure client' };
  }
}

/**
 * Helper to get current user context for secure operations
 * Integrates with NextAuth and maintains HIPAA compliance
 */
async function getCurrentUserContext() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('Authentication required for secure operations');
  }
  return {
    userId: user.id,
    userRole: user.role,
    orgId: user.org_id
  };
}

/**
 * Enhanced createSecureClient that automatically uses NextAuth context
 * Maintains backward compatibility while adding multi-tenant support
 */
export async function createSecureClientWithAuth(params: CreateClientParams) {
  const { userId, userRole, orgId } = await getCurrentUserContext();
  return createSecureClient(params, userId, userRole);
}

/**
 * Enhanced getSecureClient that automatically uses NextAuth context
 */
export async function getSecureClientWithAuth(clientId: string) {
  const { userId, userRole, orgId } = await getCurrentUserContext();
  return getSecureClient(clientId, userId, userRole);
}

/**
 * Enhanced updateSecureClient that automatically uses NextAuth context
 */
export async function updateSecureClientWithAuth(clientId: string, updates: Partial<CreateClientParams>) {
  const { userId, userRole, orgId } = await getCurrentUserContext();
  return updateSecureClient(clientId, updates, userId, userRole);
}

export async function getSecureClientsForCaseManager(caseManagerId: string, accessorId: string, accessorRole: string) {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    // Production: Get only clients assigned to this case manager
    const secureClients = await db.collection(CLIENTS_COLLECTION)
      .find({ 
        caseManagerId: caseManagerId
      })
      .sort({ updatedAt: -1 })
      .toArray();

    // Debug: Check for duplicate _id values
    const seenIds = new Set();
    const duplicates = [];
    for (const client of secureClients) {
      const idStr = client._id.toString();
      if (seenIds.has(idStr)) {
        duplicates.push(idStr);
      }
      seenIds.add(idStr);
    }
    
    if (duplicates.length > 0) {
      console.error('⚠️ DUPLICATE CLIENT IDS FOUND:', duplicates);
    }

    // Audit log the bulk client access
    await createAuditLog({
      userId: accessorId,
      userRole: accessorRole,
      action: 'clients_listed',
      resourceType: 'client_list',
      resourceId: `case_manager_${caseManagerId}`,
      success: true,
      details: { count: secureClients.length }
    });

    // Decrypt all clients
    const decryptedClients = secureClients.map(secureClient => {
      const decryptedClient: any = {
        ...secureClient,
        _id: secureClient._id.toString(),
      };

          // Decrypt all PHI fields
    if (secureClient.encryptedPHI) {
      for (const [field, encryptedData] of Object.entries(secureClient.encryptedPHI)) {
        try {
          // Handle both encrypted messages and simple base64 encoded data
          if (typeof encryptedData === 'string') {
            // Simple base64 decode for migrated data
            decryptedClient[field] = Buffer.from(encryptedData, 'base64').toString('utf8');
          } else if (encryptedData && typeof encryptedData === 'object' && 'encryptedContent' in encryptedData) {
            // Try normal decryption first
            try {
              decryptedClient[field] = decryptPHI(encryptedData as EncryptedData);
            } catch {
              // Fallback to base64 decode
              decryptedClient[field] = Buffer.from((encryptedData as any).encryptedContent, 'base64').toString('utf8');
            }
          } else {
            decryptedClient[field] = '[Invalid encryption format]';
          }
        } catch (decryptError) {
          console.error(`Error decrypting field ${field} for client ${secureClient._id}:`, decryptError);
          decryptedClient[field] = '[Encrypted data unreadable]';
        }
      }
    }

      // Remove the encrypted PHI from the response
      delete decryptedClient.encryptedPHI;

      return decryptedClient;
    });

    return decryptedClients;
  } catch (error) {
    console.error('Error fetching secure clients for case manager:', error);
    return [];
  }
}

export async function getSecureClientsForProvider(providerId: string, accessorId: string, accessorRole: string) {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    // Get clients directly assigned to this provider
    const directlyAssignedClients = await db.collection(CLIENTS_COLLECTION)
      .find({ currentProvider: providerId })
      .toArray();

    // CRITICAL SECURITY FIX: Providers should NEVER see case manager's clients
    // Instead, we'll add pending connection metadata to the provider's own clients
    
    // Get pending connections for this provider
    const pendingConnections = await db.collection('pending_connections')
      .find({ 
        providerId: providerId, 
        status: 'pending' 
      })
      .toArray();

    // Add pending connection flags to provider's own clients
    directlyAssignedClients.forEach(client => {
      const clientKey = `${client.firstName}|${client.lastName}|${client.dateOfBirth}`;
      const hasPendingConnection = pendingConnections.some(pc => pc.clientMatchKey === clientKey);
      
      if (hasPendingConnection) {
        client.hasPendingConnection = true;
        client.pendingConnectionId = clientKey;
      }
    });

    // Only return provider's own clients (no case manager clients)
    const allClients = directlyAssignedClients;
    const uniqueClients = allClients.filter((client, index, self) => 
      index === self.findIndex(c => c._id.toString() === client._id.toString())
    );

    const secureClients = uniqueClients.sort((a, b) => 
      new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );

    // Audit log the bulk client access
    await createAuditLog({
      userId: accessorId,
      userRole: accessorRole,
      action: 'bulk_client_access',
      resourceType: 'client_list',
      resourceId: 'provider_clients',
      success: true,
      details: { 
        providerId,
        clientCount: secureClients.length,
        accessType: 'provider_assigned_clients'
      }
    });

    // Decrypt all clients
    const decryptedClients = [];
    for (const secureClient of secureClients) {
      const decryptedClient: any = {
        _id: secureClient._id,
        // Copy non-PHI fields directly
        sex: secureClient.sex,
        preferredContactMethod: secureClient.preferredContactMethod,
        needsTranslator: secureClient.needsTranslator,
        mobilityStatus: secureClient.mobilityStatus,
        livingSituation: secureClient.livingSituation,
        historyOfViolence: secureClient.historyOfViolence,
        currentProvider: secureClient.currentProvider,
        caseManagerId: secureClient.caseManagerId,
        profileComplete: secureClient.profileComplete,
        status: secureClient.status,
        source: secureClient.source,
        createdAt: secureClient.createdAt,
        updatedAt: secureClient.updatedAt,
        retentionDate: secureClient.retentionDate
      };

      // Decrypt all PHI fields
      if (secureClient.encryptedPHI) {
        for (const [field, encryptedData] of Object.entries(secureClient.encryptedPHI)) {
          try {
            // Handle both encrypted messages and simple base64 encoded data
            if (typeof encryptedData === 'string') {
              // Simple base64 decode for migrated data
              decryptedClient[field] = Buffer.from(encryptedData, 'base64').toString('utf8');
            } else if (encryptedData && typeof encryptedData === 'object' && 'encryptedContent' in encryptedData) {
              // Try normal decryption first
              try {
                decryptedClient[field] = decryptPHI(encryptedData as EncryptedData);
              } catch (decryptError) {
                console.log(`Normal decryption failed for ${field}, trying fallback methods...`);
                
                // Try hex decode first (since the data looks like hex)
                try {
                  const hexDecoded = Buffer.from((encryptedData as any).encryptedContent, 'hex').toString('utf8');
                  // Check if the decoded result looks like readable text
                  if (hexDecoded.length > 0 && hexDecoded.length < 100 && !hexDecoded.includes('\x00')) {
                    decryptedClient[field] = hexDecoded;
                    console.log(`Hex decode successful for ${field}`);
                  } else {
                    throw new Error('Hex decode result not readable');
                  }
                } catch (hexError) {
                  console.log(`Hex decode failed for ${field}, trying base64...`);
                  
                  // Fallback to base64 decode
                  try {
                    decryptedClient[field] = Buffer.from((encryptedData as any).encryptedContent, 'base64').toString('utf8');
                    console.log(`Base64 decode successful for ${field}`);
                  } catch (base64Error) {
                    console.error(`All decryption methods failed for ${field}:`, base64Error);
                    decryptedClient[field] = '[Decryption failed]';
                  }
                }
              }
            }
          } catch (decryptError) {
            console.error(`Error decrypting field ${field} for client ${secureClient._id}:`, decryptError);
            decryptedClient[field] = '[Encrypted data unreadable]';
          }
        }
      }

      decryptedClients.push(decryptedClient);
    }

    // Get case manager information for clients that have caseManagerId
    const caseManagerIds = decryptedClients
      .filter(client => client.caseManagerId)
      .map(client => client.caseManagerId);
    
    if (caseManagerIds.length > 0) {
      // Get case manager info from users collection
      const caseManagers = await db.collection('users').find({
        _id: { $in: caseManagerIds }
      }).toArray();
      
      // Create a map of case manager ID to case manager info
      const caseManagerMap = caseManagers.reduce((acc, cm) => {
        acc[cm._id.toString()] = {
          id: cm._id,
          name: cm.name || cm.user_metadata?.name || 'Case Manager',
          email: cm.email
        };
        return acc;
      }, {} as Record<string, any>);
      
      // Add case manager info to clients
      decryptedClients.forEach(client => {
        if (client.caseManagerId && caseManagerMap[client.caseManagerId]) {
          client.caseManager = caseManagerMap[client.caseManagerId];
        }
      });
    }

    return decryptedClients;
  } catch (error) {
    console.error('Error fetching secure clients for provider:', error);
    return [];
  }
}

export async function deleteSecureClient(clientId: string, accessorId: string, accessorRole: string) {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    // First, get the client to extract its identifying information for cleaning up connections
    const clientDoc = await db.collection(CLIENTS_COLLECTION).findOne({ _id: new ObjectId(clientId) });
    
    if (!clientDoc) {
      return { success: false, error: 'Client not found' };
    }

    // Delete the client
    const result = await db.collection(CLIENTS_COLLECTION).deleteOne({ _id: new ObjectId(clientId) });

    if (result.deletedCount === 0) {
      return { success: false, error: 'Client not found' };
    }

    // Clean up any pending connections and referral records associated with this client
    let pendingConnectionsDeleted = 0;
    let referralsDeleted = 0;
    
    if (clientDoc.encryptedPHI) {
      try {
        // Try to decrypt the client info to create the match key
        let firstName = '', lastName = '', dateOfBirth = '';
        
        // Decrypt PHI fields to get the client match key
        if (clientDoc.encryptedPHI.firstName) {
          try {
            firstName = decryptPHI(clientDoc.encryptedPHI.firstName);
          } catch {
            // Fallback to base64 if decryption fails
            firstName = Buffer.from(clientDoc.encryptedPHI.firstName.encryptedContent, 'base64').toString('utf8');
          }
        }
        
        if (clientDoc.encryptedPHI.lastName) {
          try {
            lastName = decryptPHI(clientDoc.encryptedPHI.lastName);
          } catch {
            lastName = Buffer.from(clientDoc.encryptedPHI.lastName.encryptedContent, 'base64').toString('utf8');
          }
        }
        
        if (clientDoc.encryptedPHI.dateOfBirth) {
          try {
            dateOfBirth = decryptPHI(clientDoc.encryptedPHI.dateOfBirth);
          } catch {
            dateOfBirth = Buffer.from(clientDoc.encryptedPHI.dateOfBirth.encryptedContent, 'base64').toString('utf8');
          }
        }
        
        // Create the client match key
        const clientMatchKey = `${firstName.toLowerCase()}|${lastName.toLowerCase()}|${dateOfBirth}`;
        
        // Delete only pending connections that belong to the current user
        const pendingResult = await db.collection('pending_connections').deleteMany({
          clientMatchKey: clientMatchKey,
          $or: [
            { providerId: accessorId },  // Provider's connections
            { caseManagerId: accessorId } // Case manager's connections
          ]
        });
        
        pendingConnectionsDeleted = pendingResult.deletedCount;
        console.log(`🧹 Cleaned up ${pendingConnectionsDeleted} pending connections for deleted client`);
        
        // NEW: Clean up referral records for this connection
        // Only delete referrals that involve the current user (provider or case manager)
        const referralResult = await db.collection('referrals').deleteMany({
          'clientInfo.clientMatchKey': clientMatchKey,
          $or: [
            { providerId: accessorId },      // Provider's referrals
            { assignedProvider: accessorId }, // Provider's assigned referrals
            { caseManagerId: accessorId }     // Case manager's referrals
          ]
        });
        
        referralsDeleted = referralResult.deletedCount;
        console.log(`🧹 Cleaned up ${referralsDeleted} referral records for deleted client`);
        
      } catch (decryptError) {
        console.error('Error cleaning up connections and referrals:', decryptError);
        // Continue with deletion even if cleanup fails
      }
    }

    // Audit log the client deletion
    await createAuditLog({
      userId: accessorId,
      userRole: accessorRole,
      action: 'client_deleted',
      resourceType: 'client',
      resourceId: clientId,
      success: true,
      details: { 
        permanent: true,
        pendingConnectionsCleaned: pendingConnectionsDeleted,
        referralsCleaned: referralsDeleted
      }
    });

    return { success: true, pendingConnectionsCleaned: pendingConnectionsDeleted, referralsCleaned: referralsDeleted };
  } catch (error) {
    console.error('Error deleting secure client:', error);
    return { success: false, error: 'Failed to delete secure client' };
  }
}

// Function to clean up old client records (e.g., run as a daily cron job)
export async function cleanupOldClientRecords() {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    const now = new Date();
    
    const result = await db.collection(CLIENTS_COLLECTION).deleteMany({
      retentionDate: { $lt: now }
    });
    
    console.log(`Cleaned up ${result.deletedCount} old client records.`);
  } catch (error) {
    console.error('Error cleaning up old client records:', error);
  }
}

// Migration helper to convert existing plain-text clients to encrypted format
export async function migrateClientToSecure(clientId: string) {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    const existingClient = await db.collection(CLIENTS_COLLECTION).findOne({ _id: new ObjectId(clientId) });
    if (!existingClient || existingClient.encryptedPHI) {
      // Already migrated or doesn't exist
      return { success: false, reason: 'Already migrated or not found' };
    }

    // Encrypt PHI fields
    const encryptedPHI: { [key: string]: EncryptedData } = {};
    for (const field of PHI_FIELDS) {
      const value = existingClient[field];
      if (value && typeof value === 'string' && value.trim().length > 0) {
        encryptedPHI[field] = encryptPHI(value);
      }
    }

    const now = new Date();
    const retentionDate = new Date();
    retentionDate.setFullYear(now.getFullYear() + CLIENT_RETENTION_YEARS);

    // Update document with encrypted PHI and remove plain text PHI
    const updateDoc: any = {
      $set: {
        encryptedPHI,
        updatedAt: now,
        retentionDate
      },
      $unset: {}
    };

    // Remove plain text PHI fields
    for (const field of PHI_FIELDS) {
      if (existingClient[field]) {
        updateDoc.$unset[field] = '';
      }
    }

    await db.collection(CLIENTS_COLLECTION).updateOne(
      { _id: new ObjectId(clientId) },
      updateDoc
    );

    return { success: true };
  } catch (error) {
    console.error('Error migrating client to secure format:', error);
    return { success: false, error: 'Migration failed' };
  }
}
