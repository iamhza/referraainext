import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import { ObjectId } from 'mongodb';
import { decryptPHI } from '@/lib/encryption';



export async function DELETE(request: Request) {
  try {
    const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin', 'provider'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientIds } = await request.json();
    
    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ error: 'Client IDs array is required' }, { status: 400 });
    }

    // Validate all IDs are valid ObjectIds
    const validObjectIds: ObjectId[] = [];
    for (const id of clientIds) {
      try {
        validObjectIds.push(new ObjectId(id));
      } catch {
        return NextResponse.json({ error: `Invalid client ID: ${id}` }, { status: 400 });
      }
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Build filter based on role
    const userRole = user.role;
    const filter: any = { _id: { $in: validObjectIds } };
    
    // For providers, add ownership and source restrictions
    if (userRole === 'provider') {
      filter.createdBy = user.id;
      // Handle legacy clients that might not have a source field
      filter.$or = [
        { source: { $exists: false } },
        { source: { $ne: 'created_from_referral' } }
      ];
      console.log('🗑️ Provider bulk delete filter:', JSON.stringify(filter, null, 2));
    }
    // Case managers and admins can delete any clients (existing behavior)

    // Check if any clients have active referrals
    const clientsWithReferrals = await db.collection('referrals').find({
      $or: [
        { 'clientInfo._id': { $in: clientIds } },
        { 'clientInfo.clientId': { $in: clientIds } },
        { clientId: { $in: clientIds } }
      ],
      status: { $in: ['pending', 'matched', 'confirmed', 'in_progress', 'active'] }
    }).toArray();

    if (clientsWithReferrals.length > 0) {
      const blockedClientIds = [...new Set(clientsWithReferrals.map(ref => 
        ref.clientInfo?.clientId || ref.clientInfo?._id || ref.clientId
      ))];
      
      return NextResponse.json({ 
        error: `Cannot delete ${blockedClientIds.length} client(s) with active referrals. Please complete or cancel existing referrals first.`,
        blockedClients: blockedClientIds
      }, { status: 400 });
    }

    // Verify all clients exist and belong to the current user
    const existingClients = await db.collection('clients').find(filter).toArray();
    
    if (existingClients.length !== clientIds.length) {
      const foundIds = existingClients.map(c => c._id.toString());
      const missingIds = clientIds.filter(id => !foundIds.includes(id));
      
      let errorMessage = `Some clients not found or cannot be deleted: ${missingIds.join(', ')}`;
      if (userRole === 'provider') {
        errorMessage += '. Providers can only delete clients they imported or added manually (not from referrals).';
      }
      
      return NextResponse.json({ 
        error: errorMessage
      }, { status: 404 });
    }

    // Perform bulk deletion
    const result = await db.collection('clients').deleteMany(filter);

    // Clean up pending connections and referrals for deleted clients
    let pendingConnectionsDeleted = 0;
    let referralsDeleted = 0;
    try {
      // Get the client match keys for deleted clients to clean up connections
      const deletedClients = await db.collection('clients').find(filter).toArray();
      
      for (const client of deletedClients) {
        if (client.encryptedPHI) {
          try {
            // Try to decrypt the client info to create the match key
            let firstName = '', lastName = '', dateOfBirth = '';
            
            // Decrypt PHI fields to get the client match key
            if (client.encryptedPHI.firstName) {
              try {
                firstName = decryptPHI(client.encryptedPHI.firstName);
              } catch {
                // Fallback to base64 if decryption fails
                firstName = Buffer.from(client.encryptedPHI.firstName.encryptedContent, 'base64').toString('utf8');
              }
            }
            
            if (client.encryptedPHI.lastName) {
              try {
                lastName = decryptPHI(client.encryptedPHI.lastName);
              } catch {
                lastName = Buffer.from(client.encryptedPHI.lastName.encryptedContent, 'base64').toString('utf8');
              }
            }
            
            if (client.encryptedPHI.dateOfBirth) {
              try {
                dateOfBirth = decryptPHI(client.encryptedPHI.dateOfBirth);
              } catch {
                dateOfBirth = Buffer.from(client.encryptedPHI.dateOfBirth.encryptedContent, 'base64').toString('utf8');
              }
            }
            
            // Create the client match key
            const clientMatchKey = `${firstName.toLowerCase()}|${lastName.toLowerCase()}|${dateOfBirth}`;
            
            // Delete only pending connections that belong to the current user
            const pendingResult = await db.collection('pending_connections').deleteMany({
              clientMatchKey: clientMatchKey,
              $or: [
                { providerId: user.id },  // Provider's connections
                { caseManagerId: user.id } // Case manager's connections
              ]
            });
            
            pendingConnectionsDeleted += pendingResult.deletedCount;
            
            // NEW: Also clean up referral records for this connection
            const referralResult = await db.collection('referrals').deleteMany({
              'clientInfo.clientMatchKey': clientMatchKey,
              $or: [
                { providerId: user.id },      // Provider's referrals
                { assignedProvider: user.id }, // Provider's assigned referrals
                { caseManagerId: user.id }     // Case manager's referrals
              ]
            });
            
            referralsDeleted += referralResult.deletedCount;
            
          } catch (decryptError) {
            console.error('Error cleaning up pending connections for client:', client._id, decryptError);
            // Continue with other clients even if one fails
          }
        }
      }
      
      console.log(`🧹 Cleaned up ${pendingConnectionsDeleted} pending connections and ${referralsDeleted} referrals for bulk deleted clients`);
      
    } catch (cleanupError) {
      console.error('Error during connection cleanup:', cleanupError);
      // Continue with deletion even if connection cleanup fails
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${result.deletedCount} client(s)`,
      deletedCount: result.deletedCount,
      requestedCount: clientIds.length,
      pendingConnectionsCleaned: pendingConnectionsDeleted,
      referralsCleaned: referralsDeleted
    });

  } catch (error: any) {
    console.error('Error bulk deleting clients:', error);
    return NextResponse.json({ error: 'Failed to delete clients' }, { status: 500 });
  }
}
