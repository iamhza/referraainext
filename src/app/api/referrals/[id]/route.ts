import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// Delete a specific referral
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // 2. Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("referradb");

    // 3. Verify ownership of the referral
    const referral = await db.collection("referrals").findOne({
      _id: new ObjectId(params.id),
      caseManagerId: session.user.id
    });

    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found or unauthorized' },
        { status: 404 }
      );
    }

    // 4. Delete the referral
    await db.collection("referrals").deleteOne({
      _id: new ObjectId(params.id),
      caseManagerId: session.user.id
    });

    // 5. Return success response
    return NextResponse.json({
      success: true,
      message: 'Referral deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting referral:', error);
    return NextResponse.json(
      { error: 'Error deleting referral' },
      { status: 500 }
    );
  }
}

// Fetch a specific referral
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const userId = session.user.id;
    const userRole = session.user.user_metadata?.role;
    // 2. Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("referradb");
    // 3. Find the referral (no role filter)
    const referral = await db.collection("referrals").findOne({
      _id: new ObjectId(params.id)
    });
    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      );
    }
    // 4. Check access
    if (
      userRole === 'admin' ||
      (userRole === 'case_manager' && referral.caseManagerId === userId) ||
      (userRole === 'provider' && referral.assignedProvider === userId)
    ) {
      return NextResponse.json({ success: true, referral });
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Error fetching referral:', error);
    return NextResponse.json(
      { error: 'Error fetching referral' },
      { status: 500 }
    );
  }
} 