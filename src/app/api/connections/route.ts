import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { getSecureClientsForCaseManager, getSecureClientsForProvider } from '@/lib/clients/secure';
import { decryptPHI } from '@/lib/shared/encryption';

function normalizeKey(firstName?: string, lastName?: string, dob?: string) {
  const f = (firstName || '').trim().toLowerCase();
  const l = (lastName || '').trim().toLowerCase();
  const d = (dob || '').trim();
  return [f, l, d].filter(Boolean).join('|');
}

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin', 'provider'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = user.role;
    const client = await clientPromise;
    const db = client.db('referradb');

    // Fetch relevant clients for current user using secure client access
    let myClients: any[] = [];
    if (role === 'case_manager') {
      myClients = await getSecureClientsForCaseManager(
        user.id,
        user.id,
        user.role
      );
    } else if (role === 'provider') {
      myClients = await getSecureClientsForProvider(
        user.id,
        user.id,
        user.role
      );
    }

    // Build quick lookup by match key
    const keyToMine = new Map<string, any>();
    for (const c of myClients) {
      const key = normalizeKey(c.firstName, c.lastName, c.dateOfBirth);
      keyToMine.set(key, c);
    }

    // Fetch counterpart clients (other side) – minimal scan with projection
    let counterpartFilter: any = {};
    if (role === 'case_manager') counterpartFilter = { currentProvider: { $exists: true, $ne: null } };
    if (role === 'provider') counterpartFilter = { caseManagerId: { $exists: true } };

    // Get counterpart clients (the "other side" - providers if case manager, case managers if provider)
    const allCounterpartClients = await db
      .collection('clients')
      .find(counterpartFilter)
      .toArray();
    
    // Decrypt counterpart clients for matching
    const counterpart: any[] = [];
    for (const client of allCounterpartClients) {
      try {
        const decryptedClient: any = { ...client };
        
        // Handle both encrypted and non-encrypted clients
        if (client.encryptedPHI) {
          // Decrypt PHI for name matching
          for (const [field, encryptedData] of Object.entries(client.encryptedPHI)) {
            try {
              if (typeof encryptedData === 'string') {
                decryptedClient[field] = Buffer.from(encryptedData, 'base64').toString('utf8');
              } else if ((encryptedData as any).encryptedContent) {
                decryptedClient[field] = Buffer.from((encryptedData as any).encryptedContent, 'base64').toString('utf8');
              }
            } catch (decryptError) {
              console.error(`Error decrypting field ${field} for client ${client._id}:`, decryptError);
              decryptedClient[field] = '[DECRYPT_ERROR]';
            }
          }
        } else {
          // Client has plain text fields (like CSV imports)
          decryptedClient.firstName = client.firstName;
          decryptedClient.lastName = client.lastName;
          decryptedClient.dateOfBirth = client.dateOfBirth;
        }
        
        counterpart.push(decryptedClient);
      } catch (error) {
        console.error('Error processing counterpart client:', error);
      }
    }
      


    const items = [] as any[];
    for (const other of counterpart) {
      const key = normalizeKey(other.firstName, other.lastName, other.dateOfBirth);
      const mine = keyToMine.get(key);
      if (!mine) continue;

      // Fixed: Ensure we get the right IDs from the right clients
      const caseManagerId = role === 'case_manager' ? user.id : (other.caseManagerId || mine.caseManagerId);
      const providerId = role === 'provider' ? user.id : (other.currentProvider || mine.currentProvider);

      const connectionItem = {
        clientName: `${other.firstName} ${other.lastName}`.trim(),
        matchKey: key,
        county: other.county || mine.county,
        caseManagerId,
        providerId,
      };
      
      items.push(connectionItem);
    }

    // Simplified referral lookup - just check by case manager and provider IDs
    // Don't rely on clientMatchKey since existing referrals don't have it
    // Only query if we have items (MongoDB doesn't allow empty $or arrays)
    const referrals = items.length > 0 ? await db.collection('referrals').find({
      $or: items.map(item => ({
        caseManagerId: item.caseManagerId,
        $or: [{ providerId: item.providerId }, { assignedProvider: item.providerId }]
      }))
    }).project({
      caseManagerId: 1,
      providerId: 1,
      assignedProvider: 1,
      'clientInfo.firstName': 1,
      'clientInfo.lastName': 1,
      'clientInfo.dateOfBirth': 1,
      status: 1,
      updatedAt: 1,
      _id: 1
    }).toArray() : [];

    // Get pending connections for these client matches
    // Only query if we have items (MongoDB doesn't allow empty $or arrays)
    const pendingConnections = items.length > 0 ? await db.collection('pending_connections').find({
      status: 'pending',
      $or: items.map(item => ({
        clientMatchKey: item.matchKey,
        caseManagerId: item.caseManagerId,
        providerId: item.providerId
      }))
    }).toArray() : [];

    // Get recent comments for last activity
    const referralIds = referrals.map(r => r._id);
    const recentComments = await db.collection('comments').find({
      referralId: { $in: referralIds }
    }).project({
      referralId: 1,
      createdAt: 1,
      authorType: 1
    }).sort({ createdAt: -1 }).limit(50).toArray();

    // Enrich items with activation status and last activity
    const enrichedItems = items.map(item => {
      // Find matching referral by CM+Provider combination and client name match
      const referral = referrals.find(r => {
        const matchesCMProvider = r.caseManagerId === item.caseManagerId && 
          (r.providerId === item.providerId || r.assignedProvider === item.providerId);
        
        if (!matchesCMProvider) return false;
        
        // Try to match by client name if clientInfo exists
        if (r.clientInfo?.firstName && r.clientInfo?.lastName) {
          const referralKey = normalizeKey(r.clientInfo.firstName, r.clientInfo.lastName, r.clientInfo.dateOfBirth);
          return referralKey === item.matchKey;
        }
        
        // If no detailed client info, just match by CM+Provider (fallback)
        return true;
      });

      let lastActivity = null;
      let needsAttention = false;
      
      if (referral) {
        const lastComment = recentComments.find(c => c.referralId.toString() === referral._id.toString());
        if (lastComment) {
          lastActivity = {
            date: lastComment.createdAt,
            fromRole: lastComment.authorType
          };
          
          // Needs attention if last message was from the other party
          if (role === 'case_manager' && lastComment.authorType === 'provider') needsAttention = true;
          if (role === 'provider' && lastComment.authorType === 'case_manager') needsAttention = true;
        }
      }

      // Check for pending connection
      const pendingConnection = pendingConnections.find(pc => 
        pc.clientMatchKey === item.matchKey &&
        pc.caseManagerId === item.caseManagerId &&
        pc.providerId === item.providerId
      );

      // Determine status - prioritize pending connections over existing referrals
      let status = null;
      let initiatedByCurrentUser = false;
      
      if (pendingConnection) {
        status = 'pending';
        initiatedByCurrentUser = pendingConnection.initiatedBy === user.id;
      } else if (referral) {
        // Only use referral status if it's truly an active service
        // 'existing_service' is fine, but 'confirmed' should not block new connections
        if (referral.status === 'existing_service') {
          status = referral.status;
        }
        // For other statuses, we don't set status (allows new connections)
      }

      // Decrypt client name from pending connection if available
      let clientName = item.clientName;
      if (pendingConnection?.encryptedClientName) {
        try {
          clientName = decryptPHI(pendingConnection.encryptedClientName);
        } catch (error) {
          console.error('Error decrypting client name from pending connection:', error);
          // Fallback to reconstructing from match key
          const [firstName, lastName] = item.matchKey.split('|');
          clientName = `${firstName} ${lastName}`.trim();
        }
      }

      return {
        ...item,
        clientName, // Use decrypted name or fallback
        isActivated: !!referral,
        referralId: referral?._id?.toString(),
        status,
        initiatedByCurrentUser,
        lastActivity,
        needsAttention
      };
    });

    console.log('📋 Final connections response:', {
      role,
      userId: user.id,
      connectionCount: enrichedItems.length,
      connections: enrichedItems.map(item => ({
        matchKey: '[REDACTED]', // HIPAA compliant
        status: item.status,
        isActivated: item.isActivated,
        initiatedByCurrentUser: item.initiatedByCurrentUser
      }))
    });
    
    return NextResponse.json({ connections: enrichedItems });
  } catch (error: any) {
    console.error('Error fetching connections:', error);
    // Return empty connections array instead of error to prevent UI failures
    return NextResponse.json({ connections: [] });
  }
}


