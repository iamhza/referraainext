import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  // Authorization check
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  
  const { data: { session } } = await supabase.auth.getAuthenticatedUser();
  if (!user || user.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }
  
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get all referrals with clients
    const referrals = await db.collection('referrals').find({}).toArray();
    console.log(`Found ${referrals.length} total referrals to process`);
    
    // Get all clients to match against
    const clients = await db.collection('clients').find({}).toArray();
    console.log(`Found ${clients.length} clients to match with`);
    
    let updateCount = 0;
    let errors = 0;
    
    // Process each referral
    for (const referral of referrals) {
      try {
        // Skip if already has correct client ID structure
        if (referral.clientInfo && referral.clientInfo._id) {
          continue;
        }
        
        // First try to find matching client
        let matchedClientId = null;
        
        // Try to match by clientId field
        if (referral.clientId && typeof referral.clientId === 'string') {
          matchedClientId = referral.clientId;
        } 
        // Try to match by client info
        else if (referral.clientInfo) {
          const { firstName, lastName, email, phone } = referral.clientInfo;
          
          // Find matching client
          const matchingClient = clients.find(client => {
            if (email && client.email === email) return true;
            if (phone && client.phone === phone) return true;
            if (firstName && lastName && 
                client.firstName === firstName && 
                client.lastName === lastName) return true;
            return false;
          });
          
          if (matchingClient) {
            matchedClientId = matchingClient._id.toString();
          }
        }
        
        // If we found a match, update the referral
        if (matchedClientId) {
          // Update the referral
          const updateResult = await db.collection('referrals').updateOne(
            { _id: referral._id },
            { 
              $set: {
                'clientInfo._id': matchedClientId,
                'clientId': matchedClientId
              }
            }
          );
          
          if (updateResult.modifiedCount > 0) {
            updateCount++;
          }
        }
      } catch (err) {
        console.error(`Error processing referral ${referral._id}:`, err);
        errors++;
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: referrals.length,
      updated: updateCount,
      errors,
      message: `Successfully processed ${referrals.length} referrals, updated ${updateCount}, with ${errors} errors.`
    });
    
  } catch (error) {
    console.error('Error in migrate-referrals:', error);
    return NextResponse.json({ 
      error: 'Failed to migrate referrals',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 