import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Supabase referrals
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('case_manager_id', session.user.id);

    // Get MongoDB PHI data
    const client = await clientPromise;
    const db = client.db("referradb");
    const phiRecords = await db
      .collection("phi")
      .find({ userId: session.user.id })
      .toArray();

    // Combine Supabase referrals with MongoDB PHI data
    const combinedData = referrals?.map(referral => {
      const phiData = phiRecords.find(
        phi => phi._id.toString() === referral.mongo_id
      );
      return { ...referral, ...phiData };
    });

    return NextResponse.json({ success: true, referrals: combinedData });
  } catch (error) {
    console.error('Error in referrals route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 