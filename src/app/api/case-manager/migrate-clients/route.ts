import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb/client';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import { ObjectId } from 'mongodb';



// Define types for the result details
type MigrationResultDetail = 
  | { referralId: ObjectId; status: 'skipped'; reason: string; clientId?: ObjectId }
  | { referralId: ObjectId; status: 'created'; clientId: ObjectId }
  | { referralId: ObjectId; status: 'error'; error: string };

export async function POST(req: Request) {
  // Ensure only case managers can run this migration
  const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized. Case manager access required.' }, { status: 401 });
  }
  
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    const now = new Date().toISOString();
    
    // Only get referrals for this case manager
    const referrals = await db.collection('referrals')
      .find({ caseManagerId: user.id })
      .toArray();
    
    const results = {
      total: referrals.length,
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0,
      details: [] as MigrationResultDetail[]
    };
    
    // Process each referral
    for (const referral of referrals) {
      try {
        results.processed++;
        
        // Skip if no client info
        if (!referral.clientInfo) {
          results.skipped++;
          results.details.push({ 
            referralId: referral._id, 
            status: 'skipped', 
            reason: 'No client info' 
          });
          continue;
        }
        
        const clientInfo = referral.clientInfo;
        
        // Check if client already exists
        let existingClient;
        
        // If we have a client ID, try to find by ID
        if (clientInfo._id) {
          try {
            existingClient = await db.collection('clients').findOne({ 
              _id: new ObjectId(clientInfo._id) 
            });
          } catch (err) {
            // Invalid ID format, will create new client
          }
        }
        
        // If no client ID or not found by ID, try to find by name and other identifiers
        if (!existingClient) {
          existingClient = await db.collection('clients').findOne({
            firstName: clientInfo.firstName,
            lastName: clientInfo.lastName,
            ...(clientInfo.email ? { email: clientInfo.email } : {}),
            ...(clientInfo.phone ? { phone: clientInfo.phone } : {}),
            ...(clientInfo.dateOfBirth ? { dateOfBirth: clientInfo.dateOfBirth } : {})
          });
        }
        
        // If client already exists, skip
        if (existingClient) {
          results.skipped++;
          results.details.push({ 
            referralId: referral._id, 
            status: 'skipped', 
            reason: 'Client exists', 
            clientId: existingClient._id 
          });
          continue;
        }
        
        // Create new client
        const clientData = {
          ...clientInfo,
          createdAt: now,
          updatedAt: now,
          caseManagerId: user.id, // Always set to current case manager
          status: 'UNPLACED_NEW',
          source: 'migration_from_referral'
        };
        
        // Remove the _id if it exists to let MongoDB generate a new one
        if (clientData._id) delete clientData._id;
        
        const insertResult = await db.collection('clients').insertOne(clientData);
        
        // Update the referral with the client ID
        await db.collection('referrals').updateOne(
          { _id: referral._id },
          { $set: { 'clientInfo._id': insertResult.insertedId.toString() } }
        );
        
        results.created++;
        results.details.push({ 
          referralId: referral._id, 
          status: 'created', 
          clientId: insertResult.insertedId 
        });
      } catch (error: any) {
        console.error(`Error processing referral ${referral._id}:`, error);
        results.errors++;
        results.details.push({ 
          referralId: referral._id, 
          status: 'error', 
          error: error.message || 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      results
    });
    
  } catch (error: any) {
    console.error('Error in client migration:', error);
    return NextResponse.json({ error: 'Failed to migrate client data' }, { status: 500 });
  }
} 