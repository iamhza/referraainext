import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// Update a specific referral
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('PATCH request received for referral ID:', params.id);
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
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.user_metadata?.role;
    const userId = session.user.id;
    console.log('User role:', userRole, 'User ID:', userId);

    // 2. Get the update data from request body
    const update = await request.json();
    console.log('Update data:', update);

    // 3. Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("referradb");

    // 4. Get the existing referral to check permissions
    const existingReferral = await db.collection("referrals").findOne({
      _id: new ObjectId(params.id)
    });

    if (!existingReferral) {
      console.log('Referral not found in database');
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    console.log('Found existing referral:', existingReferral._id);

    // 5. Check permissions based on role
    const canUpdate = 
      userRole === 'admin' || 
      (userRole === 'case_manager' && existingReferral.caseManagerId === userId) ||
      (userRole === 'provider' && existingReferral.providerId === userId);

    if (!canUpdate) {
      console.log('Permission denied for user:', userId);
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // 6. Update the referral
    console.log('Attempting to update referral with data:', { ...update, updatedAt: new Date().toISOString() });
    
    const result = await db.collection("referrals").findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      { $set: { ...update, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );

    console.log('findOneAndUpdate result:', result);

    if (!result) {
      console.log('Failed to update referral in database - result is null');
      return NextResponse.json({ error: 'Referral not found or failed to update' }, { status: 404 });
    }

    console.log('Successfully updated referral');
    return NextResponse.json({ success: true, referral: result });
  } catch (error) {
    console.error('Error updating referral:', error);
    return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 });
  }
}

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