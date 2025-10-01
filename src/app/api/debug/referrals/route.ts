import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
export async function GET() {
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

    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Get all referrals to see their structure
    const referrals = await db.collection('referrals').find({}).limit(5).toArray();
    
    console.log('DEBUG: Total referrals found:', referrals.length);
    
    const debugInfo = referrals.map(referral => ({
      _id: referral._id,
      clientId: referral.clientId,
      clientInfo: referral.clientInfo,
      hasComments: referral.comments ? referral.comments.length : 0,
      commentsPreview: referral.comments ? referral.comments.slice(0, 2) : [],
      caseManagerId: referral.caseManagerId,
      serviceType: referral.serviceDetails?.type
    }));
    
    console.log('DEBUG: Referral structures:', JSON.stringify(debugInfo, null, 2));
    
    return NextResponse.json({
      success: true,
      totalReferrals: referrals.length,
      debugInfo,
      currentUserId: user.id,
      userRole: user.role
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
} 