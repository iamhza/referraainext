import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('1. API: GET /api/referrals started');
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log('2. API: Auth session check:', !!session);
    
    if (!session) {
      console.log('3. API: No session found - Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get MongoDB referrals
    const client = await clientPromise;
    const db = client.db("referradb");
    console.log('4. API: Connected to MongoDB, querying referrals');
    console.log('   Case Manager ID:', session.user.id);
    
    const referrals = await db
      .collection("referrals")
      .find({ caseManagerId: session.user.id })
      .sort({ createdAt: -1 }) // Sort by most recent first
      .toArray();

    console.log('5. API: Found referrals count:', referrals.length);
    console.log('   Sample referral (if any):', referrals[0] || 'No referrals found');

    return NextResponse.json({ 
      success: true, 
      referrals: referrals 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. Verify authentication
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get form data
    const referralData = await request.json();
    
    // 3. Store in MongoDB
    const client = await clientPromise;
    const db = client.db("referradb");
    const result = await db.collection("referrals").insertOne({
      ...referralData,
      caseManagerId: session.user.id,
      status: 'under_review',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      referralId: result.insertedId
    });
  } catch (error) {
    console.error('Error in referrals route:', error);
    return NextResponse.json(
      { error: 'Error creating referral' },
      { status: 500 }
    );
  }
} 